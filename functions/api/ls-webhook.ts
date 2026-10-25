/* Lemon Squeezy webhook endpoint (Cloudflare Pages Function).
   Verifies the X-Signature HMAC-SHA256 of the raw body, then logs the event.
   Storing entitlements in KV is a later step. */

interface Env {
  LS_WEBHOOK_SECRET?: string;
}

const encoder = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Byte-wise compare that does not stop at the first difference.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function signatureValid(body: string, header: string | null, secret: string | undefined): Promise<boolean> {
  if (!header || !secret) return false;
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const expected = hex(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
  return timingSafeEqual(encoder.encode(expected), encoder.encode(header.trim().toLowerCase()));
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
  const eventName = payload?.meta?.event_name;
  const testMode = payload?.meta?.test_mode;
  const id = payload?.data?.id;
  const attributes = payload?.data?.attributes;
  void testMode; void attributes; // read for the KV step; not used yet
  console.log(`ls-webhook event=${eventName} id=${id}`);
  return new Response('ok', { status: 200 });
};

export const onRequest = async (): Promise<Response> =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
