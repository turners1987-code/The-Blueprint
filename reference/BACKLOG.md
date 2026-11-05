# Build backlog

In order. Items marked (local) need files on the G: drive and run locally, not in the cloud.

0. [x] Record the Nov 5 decisions in reference/BLUEPRINT_DOC.md and reference/DECISIONS.md (approved by Shane Nov 5; tier A, internal docs; pricing is NOT part of this item, see item 2): (a) 2A paid-content protection: private repo plus a Cloudflare Pages Function gate checking KV entitlements, GitHub Pro needed for that; (b) build system: hourly cloud scheduled task on Sonnet 5.5 builds one BACKLOG item per run, tiers A/B/C ship straight to main after npm test passes, tier D parks under Needs Shane and pushes an ACTION NEEDED alert; (c) branch protection shelved until the repo goes private; (d) research order: Claude researches first (web search, fetch, Chrome), only blocked, very large or recurring needs go to the Crawl chat as line-item requests, never "add job"; (e) up to 2 build threads at a time, dialed back on Shane's word; (f) December tracks planned: whole-life finance, options and stocks (both behind the Florida compliance answer J-20261103-04), and Plan Board (templated block chain Context, Level, Behavior, Trigger, Invalidation, Target, Risk, Conviction; v1 stacked list, Drawflow canvas later); (g) primary buyer: NinjaTrader 8 traders with the Order Flow+ license on Apex or Lucid evaluation and funded accounts, with no promises of passing or payouts.

1. [x] Publish BP Trade Review v1.0.1
2. [x] Record Oct 31 pricing, with founding rate $19/$190 for the first 100 subscribers
3. New pricing.html
4. Tier-aware gate
5. Account page and /api/reset-activations
6. [x] BP Key Levels guide page and card
7. Cloudflare Pages Function gate for paid pages, then repo private
8. Privacy policy payments section
9. Learning-layer pilot on Module 06
10. [x] Plan Board v1
11. Setting Up NT8 page
12. Rule Card
13. Reading List
14. Sources page
15. Journal fields
16. [x] Journal CSV export

## Answers, approved by Shane Nov 5, 2026

Every item below is now buildable. Build only from these answers and files already in the repo. Anything still missing goes back under a new "## Needs Shane" section.

### Item 2 - Pricing to record (BLUEPRINT_DOC section 10 and DECISIONS)
- Journal $12/month. All Access $29/month or $290/year. BP Key Levels alone $14/month.
- Founding rate: $19/month or $190/year for the first 100 All Access subscribers, locked while the membership stays active. Subscriber 101 onward pays $29/$290.
- Replaces the old $47 list / $7 opening rate everywhere it appears in reference docs.
- Shane changes the Lemon Squeezy products himself. Do not touch Lemon Squeezy.

### Item 3 - pricing.html
- Build from the item 2 numbers only: Free, Journal, All Access (monthly and annual, founding rate shown as the current price with the 100-subscriber cap stated), Key Levels alone.
- No struck-through price. Checkout links stay as placeholders until go-live.

### Item 4 - Tier-aware gate
- Four tiers: Free (the free path), Journal (opens the journal and plan-board.html), All Access (opens everything, including the BP Key Levels download and guide), Key Levels key (opens only the BP Key Levels download).
- Build the product-to-tier map with placeholder product ids (e.g. LS_PRODUCT_JOURNAL) in one config spot. Shane supplies the real ids after he creates the products on Nov 9; do not block on them.

### Item 5 - Account page and /api/reset-activations
- Approved. Identify the customer by license key. Rate-limit to one reset per key per 24 hours.
- The function reads a Cloudflare secret named LS_API_KEY. Shane adds the secret; never write a key into the repo.

### Item 7 - Paid-content gate
- Approved. The KV namespace is already bound in wrangler.toml as ENTITLEMENTS (id 031c6dd0072643ce87ada70fded353f8); use that binding, add no new namespace.
- Entitlements are written by the existing Lemon Squeezy webhook flow.
- Build and test the function. Do NOT change repo visibility; Shane makes the repo private after the gate is tested and GitHub Pro is bought.

### Item 8 - Privacy policy payments section
- Draft only, into reference/drafts/privacy-payments.md, from Lemon Squeezy's public documentation (Lemon Squeezy as merchant of record, what is shared, what The Blueprint does not store). Cite sources in the draft.
- Do NOT edit privacy.html. Mark the item done when the draft is committed; Shane approves the wording before it ships.

### Item 9 - Learning-layer pilot on Module 06
- Segments: split Module 06 into 3 to 6 segments with a lesson sidebar and per-segment resume.
- Lesson player: HTML/SVG slides in the Blueprint design system, timestamps that drive the slides, captions and a clickable transcript. Write the narration script and slide timings now; the audio file is a placeholder until the voice is picked (Kokoro-82M for the pilot, Google Neural2 if it falls short).
- Practice: a 3 to 4 question check per segment, passed at 3 of 4, plus a module quiz, built on the existing quiz code and js/progress.js.
- Progress: three states per segment (not started, attempted, passed) in js/progress.js.
- Chart: a level-marking drill on Lightweight Charts v5.2.1 (Apache-2.0, keep the NOTICE) using synthetic bars only, never real exported bars.
- Notes: per-segment notes, exportable as .md.
- Lesson prose may use a --max-reading: 680px token; do not change the rest of the design system.

### Item 11 - Setting Up NT8 page
- Source: reference/content-maps/NT8-Setup.md (added Nov 5). Build the page from it plus D29 and D50.
- Where the map lists a gap (the nt8-onboarding crawl, the live-account loss limit step), write the page around it with no invented steps and list the gap in the build report.

### Item 12 - Rule Card
- As recommended: a one-page printable card at tools/rule-card.html with the pre-trade yes/no checks, the grade-to-size table from Module 14 and the broker-level 2R kill switch (D29). Every line copied from existing module text.

### Item 13 - Reading List
- reading-list.html built only from books, papers and sources already named in the modules, BLUEPRINT_DOC and DECISIONS (D2 commodity basics included). Group under headings by topic, one line each on why. No new titles; no quoted text from the books.

### Item 14 - Sources page
- As recommended: public sources.html listing each source named in the modules, with the n and period beside every statistic from TradingStats_Source_of_Truth.txt. No source needs to stay unnamed. Include the library licenses (Lightweight Charts NOTICE and others in use).

### Item 15 - Journal fields
- As recommended: schema v6 adds readiness_score (0, 1 or 2 per D42), test_number (integer), session_block (text slug) and sheet_finished_time (ISO time), all nullable and present as keys; v1 to v5 records read as null. Carry the new fields into the CSV export.
