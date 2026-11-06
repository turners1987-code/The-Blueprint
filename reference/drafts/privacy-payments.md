# Draft: Privacy policy, Payments section

Status: DRAFT for Shane's approval. Not live. privacy.html is not edited by this item. This is not legal advice; Shane approves the wording (and any compliance review, e.g. J-20261103-04) before it ships.

Drafted Nov 6, 2026 from the sources listed at the bottom.

---

## Payments

**Lemon Squeezy is the seller of record.** When you buy a paid plan, you buy from Lemon Squeezy, which acts as the merchant of record. Lemon Squeezy takes your payment, collects sales tax, and handles refunds, chargebacks and card-security compliance for the sale. Your payment details go to Lemon Squeezy, under Lemon Squeezy's own privacy policy (https://www.lemonsqueezy.com/privacy).

**What The Blueprint's systems receive.** After a purchase or a subscription change, Lemon Squeezy sends The Blueprint a signed notification. The Blueprint's code reads only these fields from it and keeps them in a Cloudflare KV store, one record per customer, to decide which pages and downloads your plan unlocks:

- Customer ID and the email address on the purchase
- Subscription ID, subscription status (for example active, past due, expired), product and variant IDs
- Renewal date, end date and whether the subscription is cancelled
- License key ID, the last few characters of the license key, and the license key status
- Whether the event came from test mode, the name of the last event, and the time the record was last updated

A short-lived marker (7 days) of each notification ID is also kept so the same notification is not processed twice.

**What The Blueprint does not store.** The code that receives these notifications does not read or store card numbers, billing addresses or any other payment details. Those stay with Lemon Squeezy.

**Activation resets.** If you ask to reset the activations on a license key from the account page, The Blueprint checks the key with Lemon Squeezy, then removes that key's activations. To allow one reset per key per 24 hours, it stores a marker under a one-way hash (SHA-256) of the key, not the key itself, for 24 hours.

**Email login codes.** Your email is used to send login codes, sent through Resend; codes expire after 10 minutes. *(Draft wording for Shane to approve.)*

**Your choices.** To ask about, correct or delete the entitlement record The Blueprint holds about you, contact us at [CONTACT EMAIL: Shane to supply]. For the data Lemon Squeezy holds as a controller or processor, including access, correction, deletion and complaint rights, use the contact route in Lemon Squeezy's privacy policy.

---

## Open items for Shane (not answered by the sources; do not fill by guess)

1. Contact address for privacy requests (placeholder above).
2. Lemon Squeezy's pages do not say what buyer data it passes to a seller beyond what the webhook code reads; the list above is limited to what the code actually stores. Confirm no other Lemon Squeezy dashboard export is kept elsewhere.
3. Lemon Squeezy's pages do not say who processes cards or whether sellers can ever see card numbers. The draft says only that payment details go to Lemon Squeezy and that The Blueprint's code does not read or store them.
4. Retention: customer records in KV have no expiry in the code (only the 7-day notification markers and 24-hour reset markers expire). Decide a retention statement.
5. Legal and compliance wording review before publishing.

## Sources

- Lemon Squeezy, Merchant of record: https://docs.lemonsqueezy.com/help/payments/merchant-of-record (no page date; read Nov 6, 2026 via reference/research/lemonsqueezy-privacy.md)
- Lemon Squeezy, Privacy policy: https://www.lemonsqueezy.com/privacy (effective and last updated June 1, 2021; same research file)
- functions/api/ls-webhook.ts (fields written to KV: customer_id, user_email, status, subscription_id, product_id, variant_id, renews_at, ends_at, cancelled, test_mode, last_event, updated_at, license_key_id, key_short, license_status; dedupe marker `evt:<id>`, 7-day TTL)
- functions/_lib/reset.ts (rate-limit marker `reset:<sha256(key)>`, 24-hour TTL)
