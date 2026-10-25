/* Lemon Squeezy webhook endpoint (Cloudflare Pages Function).
   Verifies the X-Signature HMAC-SHA256 of the raw body, dedupes by
   webhook id, and keeps one entitlement record per customer in KV
   ("cust:<customer_id>"). Dedupe markers live under "evt:<id>". */

import { sha256Hex, timingSafeEqual, toHex } from '../_lib/util';

interface Env {
  LS_WEBHOOK_SECRET?: string;
  ENTITLEMENTS: KVNamespace;
}

const encoder = new TextEncoder();
const DEDUPE_TTL_S = 7 * 24 * 60 * 60;
const SUBSCRIPTION_EVENTS = ['subscription_created', 'subscription_updated', 'subscription_expired'];

async function signatureValid(body: string, header: string | null, secret: string | undefined): Promise<boolean> {
  if (!header || !secret) return false;
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const expected = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
  return timingSafeEqual(encoder.encode(expected), encoder.encode(header.trim().toLowerCase()));
}

type Customer = Record<string, unknown>;

async function readCustomer(kv: KVNamespace, customerId: string): Promise<Customer | null> {
  return kv.get<Customer>(`cust:${customerId}`, 'json');
}

async function writeCustomer(kv: KVNamespace, customerId: string, record: Customer): Promise<void> {
  await kv.put(`cust:${customerId}`, JSON.stringify(record));
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const body = await request.text();
  if (!(await signatureValid(body, request.headers.get('X-Signature'), env.LS_WEBHOOK_SECRET))) {
    return new Response(null, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('bad json', { status: 400 });
  }
  const eventName: string | undefined = payload?.meta?.event_name;
  const testMode = payload?.meta?.test_mode;
  const id = payload?.data?.id;
  const attrs = payload?.data?.attributes ?? {};
  console.log(`ls-webhook event=${eventName} id=${id}`);

  const kv = env.ENTITLEMENTS;
  const evtKey = `evt:${payload?.meta?.webhook_id ?? (await sha256Hex(body))}`;

  try {
    if (await kv.get(evtKey)) return new Response('dup', { status: 200 });
    await kv.put(evtKey, '1', { expirationTtl: DEDUPE_TTL_S });
  } catch (e) {
    console.log(`ls-webhook kv error (dedupe): ${e}`);
    return new Response(null, { status: 500 });
  }

  try {
    const customerId = attrs.customer_id;
    if (customerId === undefined || customerId === null || customerId === '') {
      console.log(`ls-webhook ignored: no customer_id (event=${eventName} id=${id})`);
      return new Response('ignored', { status: 200 });
    }
    const cid = String(customerId);
    const now = new Date().toISOString();

    if (SUBSCRIPTION_EVENTS.includes(eventName ?? '')) {
      const stored = (await readCustomer(kv, cid)) ?? {};
      await writeCustomer(kv, cid, {
        ...stored,
        customer_id: customerId,
        user_email: attrs.user_email,
        status: attrs.status,
        subscription_id: id,
        product_id: attrs.product_id,
        variant_id: attrs.variant_id,
        renews_at: attrs.renews_at,
        ends_at: attrs.ends_at,
        cancelled: attrs.cancelled,
        test_mode: testMode,
        last_event: eventName,
        updated_at: now,
      });
    } else if (eventName === 'subscription_payment_success') {
      // The payload is a subscription invoice: its id is not the subscription's.
      const stored = (await readCustomer(kv, cid)) ?? {};
      const recovered = stored.status === 'past_due' || stored.status === 'unpaid';
      await writeCustomer(kv, cid, {
        ...stored,
        customer_id: customerId,
        subscription_id: attrs.subscription_id ?? stored.subscription_id,
        ...(recovered ? { status: 'active' } : {}),
        last_event: eventName,
        updated_at: now,
      });
    } else if (eventName === 'license_key_created') {
      const stored = (await readCustomer(kv, cid)) ?? {};
      await writeCustomer(kv, cid, {
        ...stored,
        customer_id: customerId,
        license_key_id: id,
        key_short: attrs.key_short,
        license_status: attrs.status,
        updated_at: now,
      });
    } else {
      console.log(`ls-webhook log only: event=${eventName}`);
    }
  } catch (e) {
    console.log(`ls-webhook kv error (${eventName}): ${e}`);
    // Release the dedupe marker so Lemon Squeezy's retry is processed, not skipped as "dup".
    try { await kv.delete(evtKey); } catch { /* best effort */ }
    return new Response(null, { status: 500 });
  }
  return new Response('ok', { status: 200 });
};

export const onRequest = async (): Promise<Response> =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
