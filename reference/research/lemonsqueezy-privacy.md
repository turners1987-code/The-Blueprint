# Lemon Squeezy: merchant of record and privacy (for the privacy policy payments section)

Read Nov 6, 2026 by Claude (web fetch). Paraphrased; no quotes. Use for item 8 only, and draft wording for Shane's approval; this is not legal advice.

## Merchant of record
Source: https://docs.lemonsqueezy.com/help/payments/merchant-of-record (no page date)
- A merchant of record is the legal seller to the buyer: the buyer's purchase is from that entity, which takes on the obligations tied to the sale.
- Lemon Squeezy acts as the merchant of record for its sellers.
- It handles: taking payment for each purchase, collecting sales tax, refunds and chargebacks, and PCI card-security compliance.
- The page does not mention invoices.

## Lemon Squeezy privacy policy
Source: https://www.lemonsqueezy.com/privacy (states effective and last updated June 1, 2021)
- Describes Lemon Squeezy as data controller and/or processor for personal information given to it.
- Data it collects in general: name and email when provided; log data (IP address, browser type, pages, visit times); device data (device type, operating system, device identifiers). For California residents it lists customer records including billing and shipping address and card data.
- Shares personal information with affiliates, service providers, payment system operators, business partners and authorities. The policy does not address sharing buyer data with sellers, and does not say who processes cards or whether sellers ever see full card numbers (a Stripe badge appears in the site footer, unexplained).
- Buyer rights listed: access, correction, marketing opt-out, non-discrimination, complaints (including to a data protection authority); under GDPR, restriction, objection, portability and deletion (deleted account data removed within 30 days); under California law, requests to know and delete, and Shine the Light requests. Does not respond to Do Not Track.
- Contact: through the Contact Us section of that policy.

## Gaps (do not fill with guesses)
- What buyer data Lemon Squeezy passes to the seller (The Blueprint) is not stated on these pages. The Blueprint's own side is known from the repo: the webhook and KV store hold license key entitlements; check functions/api/ls-webhook.ts for the exact fields stored and describe only those.
- Who processes the card and whether the seller can see card numbers is not stated; say only that Lemon Squeezy, as merchant of record, handles payment and The Blueprint does not receive or store card numbers if the webhook code confirms it never receives them.
