# Build backlog

In order. Items marked (local) need files on the G: drive and run locally, not in the cloud.

0. [x] Record the Nov 5 decisions in reference/BLUEPRINT_DOC.md and reference/DECISIONS.md (approved by Shane Nov 5; tier A, internal docs; pricing is NOT part of this item, see item 2): (a) 2A paid-content protection: private repo plus a Cloudflare Pages Function gate checking KV entitlements, GitHub Pro needed for that; (b) build system: hourly cloud scheduled task on Sonnet 5.5 builds one BACKLOG item per run, tiers A/B/C ship straight to main after npm test passes, tier D parks under Needs Shane and pushes an ACTION NEEDED alert; (c) branch protection shelved until the repo goes private; (d) research order: Claude researches first (web search, fetch, Chrome), only blocked, very large or recurring needs go to the Crawl chat as line-item requests, never "add job"; (e) up to 2 build threads at a time, dialed back on Shane's word; (f) December tracks planned: whole-life finance, options and stocks (both behind the Florida compliance answer J-20261103-04), and Plan Board (templated block chain Context, Level, Behavior, Trigger, Invalidation, Target, Risk, Conviction; v1 stacked list, Drawflow canvas later); (g) primary buyer: NinjaTrader 8 traders with the Order Flow+ license on Apex or Lucid evaluation and funded accounts, with no promises of passing or payouts.

1. [x] Publish BP Trade Review v1.0.1
2. Record Oct 31 pricing, with founding rate $19/$190 for the first 100 subscribers
3. New pricing.html
4. Tier-aware gate
5. Account page and /api/reset-activations
6. [x] BP Key Levels guide page and card
7. Cloudflare Pages Function gate for paid pages, then repo private
8. Privacy policy payments section
9. Learning-layer pilot on Module 06
10. [x] Plan Board v1
11. Setting Up NT8 page
12. Rule Card (parked, see Needs Shane)
13. Reading List
14. Sources page
15. Journal fields
16. [x] Journal CSV export

## Needs Shane

### Item 2 — Record Oct 31 pricing, with founding rate $19/$190 for the first 100 subscribers (Tier D: prices, Lemon Squeezy)
- Question: Confirm the full pricing as it is to be recorded (list price, founding rate $19/month and $190/year, the 100-subscriber cap, and what happens at subscriber 101), and whether the Lemon Squeezy variants are to be changed by you or left as they are. BLUEPRINT_DOC still says $47 list / $7 opening rate.
- Recommended: record $19/month and $190/year as the founding rate, capped at the first 100 subscribers and locked while the membership stays active, in BLUEPRINT_DOC section 10 and DECISIONS; you change the Lemon Squeezy variants yourself.

### Item 3 — New pricing.html (Tier D: pricing page numbers)
- Blocked by item 2. Question: after item 2 is answered, may the pricing page carry the founding-rate numbers, and what are the list prices after the first 100?
- Recommended: yes, build it from the item 2 numbers only, with the checkout link left as the placeholder until go-live.

### Item 4 — Tier-aware gate (missing input)
- Question: which tiers exist beyond free and paid, which pages and tools each tier opens, and which Lemon Squeezy product or variant ids map to each? None of this is in BLUEPRINT_DOC or the repo (js/gate.js knows only free/paid).
- Recommended: two tiers, Full Access (all modules, journal, tools) and a per-tool key for each paid NT8 indicator, as the Key Levels guide already implies ("All Access or BP Key Levels key"); send the variant ids.

### Item 5 — Account page and /api/reset-activations (Tier D: Lemon Squeezy API, secrets, functions/)
- Question: may a new Pages Function call the Lemon Squeezy API to reset activations, which needs a Lemon Squeezy API key as a Cloudflare secret, and how should a customer be identified (license key, or email plus key)?
- Recommended: yes; identify by license key; you add the API key as a Cloudflare secret named LS_API_KEY; rate-limit to one reset per key per 24 hours.

### Item 7 — Cloudflare Pages Function gate for paid pages, then repo private (Tier D: Cloudflare, functions/, KV, repo visibility)
- Question: may a new Pages Function and a KV binding (bptrade-entitlements) be added, wrangler.toml changed, and the repo made private (needs GitHub Pro)? Which KV namespace id should be bound, and who writes the entitlements?
- Recommended: yes to all; send the KV namespace id; entitlements are written by the existing Lemon Squeezy webhook flow; make the repo private only after the gate is live and tested.

### Item 8 — Privacy policy payments section (Tier D: legal wording)
- Question: approve the payments section text (Lemon Squeezy as merchant of record, what is shared, what is not stored by The Blueprint)?
- Recommended: I draft it from the Lemon Squeezy documentation and you or counsel approve it before it ships.

### Item 9 — Learning-layer pilot on Module 06 (missing input)
- Question: "Learning layer" is not defined in BLUEPRINT_DOC, DECISIONS or the repo. What does it contain (questions, recall prompts, spaced review) and how is it shown on the module?
- Recommended: end-of-module recall prompts (3 to 5 per section) stored locally, with progress in js/progress.js; send a one-paragraph spec to confirm.

### Item 11 — Setting Up NT8 page (missing input)
- Question: the source for this page is the NT8-Setup content map (`G:\My Drive\Blueprint Review\content-maps\`), which is not in the repo, and BLUEPRINT_DOC notes the nt8-onboarding crawl is still pending. May you copy the NT8-Setup map into `reference/` (or paste the nt8-onboarding crawl result) so the page can be built from it?
- Recommended: copy the NT8-Setup content map into `reference/content-maps/NT8-Setup.md` and send the nt8-onboarding crawl result; the page then covers RTH and full-session templates ending 16:00 ET (D50) and the broker-level 2R kill switch (D29).

### Item 12 — Rule Card (missing input)
- Question: "Rule Card" is not defined in BLUEPRINT_DOC, DECISIONS, MODULE_STANDARD or anywhere in the repo. What is it (a printable one-page card, a downloadable PDF, an in-page tool), and which rules does it carry (the trade-plan checks, the 2R kill switch D29, the grade-before-size table)?
- Recommended: a one-page printable card at tools/rule-card.html with the pre-trade yes/no checks, the grade-to-size table from Module 14 and the broker-level 2R kill switch, every line copied from existing module text; send confirmation or a spec.

### Item 13 — Reading List (missing input)
- Question: DECISIONS D2 says commodity basics go to a reading-list page, but no list of titles, sources or links exists in the repo. Which items go on it, and under which headings?
- Recommended: send the list (title, author or publisher, link, one line on why) and I build reading-list.html from it only.

### Item 14 — Sources page (missing input)
- Question: "Sources" is not defined in BLUEPRINT_DOC, DECISIONS or the repo. Is it a public page listing where the site's statistics and concepts come from, and which sources may be named publicly?
- Recommended: a public sources.html listing each source named in the modules, with the n and period beside every statistic from TradingStats_Source_of_Truth.txt; confirm and name any source that must stay unnamed.

### Item 15 — Journal fields (missing input)
- Question: BLUEPRINT_DOC says the journal has no fields for test number, session block, readiness score or sheet finish time (D42). Should all four be added as schema v6 fields, and what are their types and allowed values?
- Recommended: add readiness_score (0, 1, 2 per D42), test_number (integer), session_block (text slug) and sheet_finished_time (ISO time), all nullable, required as keys, with v1-v5 records read as null.
