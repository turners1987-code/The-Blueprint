# Build backlog

In order. Items marked (local) need files on the G: drive and run locally, not in the cloud.

0. [x] Record the Nov 5 decisions in reference/BLUEPRINT_DOC.md and reference/DECISIONS.md (approved by Shane Nov 5; tier A, internal docs; pricing is NOT part of this item, see item 2): (a) 2A paid-content protection: private repo plus a Cloudflare Pages Function gate checking KV entitlements, GitHub Pro needed for that; (b) build system: hourly cloud scheduled task on Sonnet 5.5 builds one BACKLOG item per run, tiers A/B/C ship straight to main after npm test passes, tier D parks under Needs Shane and pushes an ACTION NEEDED alert; (c) branch protection shelved until the repo goes private; (d) research order: Claude researches first (web search, fetch, Chrome), only blocked, very large or recurring needs go to the Crawl chat as line-item requests, never "add job"; (e) up to 2 build threads at a time, dialed back on Shane's word; (f) December tracks planned: whole-life finance, options and stocks (both behind the Florida compliance answer J-20261103-04), and Plan Board (templated block chain Context, Level, Behavior, Trigger, Invalidation, Target, Risk, Conviction; v1 stacked list, Drawflow canvas later); (g) primary buyer: NinjaTrader 8 traders with the Order Flow+ license on Apex or Lucid evaluation and funded accounts, with no promises of passing or payouts.

1. [x] Publish BP Trade Review v1.0.1
2. [x] Record Oct 31 pricing, with founding rate $19/$190 for the first 100 subscribers
3. [x] New pricing.html
4. [x] Tier-aware gate
5. [x] Account page and /api/reset-activations
6. [x] BP Key Levels guide page and card
7. [x] Cloudflare Pages Function gate for paid pages, then repo private
8. [x] Privacy policy payments section (draft in reference/drafts/privacy-payments.md, awaiting Shane approval)
9a. [x] Learning-layer pilot, Module 06: shared lesson player (slides, timestamp-driven, captions, clickable transcript) and segment layout (sidebar, per-segment resume)
9b. [x] Learning-layer pilot, Module 06: split the module into 3 to 6 segments; write the narration script and slide timings per segment
9c. [x] Learning-layer pilot, Module 06: segment checks (3 to 4 questions, pass at 3 of 4), module quiz, three progress states in js/progress.js
9d. [x] Learning-layer pilot, Module 06: level-marking drill on Lightweight Charts v5.2.1 with synthetic bars (keep the NOTICE)
9e. [x] Learning-layer pilot, Module 06: per-segment notes with .md export; narration audio with Kokoro-82M if it installs in this environment, otherwise leave the placeholder and note it under Needs Shane as a local run
9f. [x] Module 06 slide visuals (Shane's pilot review, Nov 6): replace the text-only slide cards with designed visuals in the Blueprint design system: inline SVG diagrams (zone with near and far edge, stop placed behind structure, the pre-marked list as a visual list, in-session levels forming, mid-range as empty space), small chart snippets drawn from the synthetic-bar generator with the level marked, and simple reveal animations timed to the cues. Keep slide count and cue order unchanged so audio timings still line up. No stock photos, no real market data.
9g. [x] Session-relative wording, all modules and the Module 06 narration (Shane's pilot review, Nov 6): find calendar-relative phrases ("yesterday", "today", "this morning", "last Thursday", "this week") that describe price or structure, and rewrite them so they read correctly whenever a student opens the page: "the prior session", "the session before", "in this composite session". Keep worked examples clearly framed as composite sessions. Edit the narration cue text in data/lessons/06-what-counts-as-a-level.json the same way. Also in the narration cues only (not the page text): replace "pre-marked list" with "the list you mark before the session" and any other "pre-marked" with "marked before the session", because spoken "pre-marked" sounds like "pre-market" (the time period, Module 16). List every change in the build report.
10. [x] Plan Board v1
11. [x] Setting Up NT8 page
12. [x] Rule Card
13. [x] Reading List
14. [x] Sources page
15. [x] Journal fields
16. [x] Journal CSV export
17. [x] Unlock page help line (taken by recommendation Nov 6): under the code box on unlock.html add one line: the code is in your purchase email from Lemon Squeezy, or under My Orders at app.lemonsqueezy.com.

18. [x] Email login with a 6-digit code (approved by Shane Nov 6; tier D sign-off given; this task may edit functions/ but not wrangler.toml or any secret). Goal: a buyer types their email, gets a 6-digit code, enters it, and stays logged in on that device. The access code stays as a backup.
   a. Email index: in functions/api/ls-webhook.ts, on every event that writes a customer record, also write `email:<lowercased trimmed user_email>` -> customer_id. Add a one-off admin route POST /api/admin/backfill-emails (Authorization: Bearer ADMIN_TOKEN) that walks `cust:*` and writes the missing indexes.
   b. POST /api/login/start {email}: always answer 200 with the same body ("If that email has access, a code is on its way."), so no one can probe which emails are customers. Only when the email maps to an active entitlement: make a 6-digit code (crypto random), store its SHA-256 hash in KV `otp:<email>` with expirationTtl 600 and an attempts counter, and send it with the Resend API (POST https://api.resend.com/emails, Bearer env.RESEND_API_KEY, from "The Blueprint <login@bptrade.co>", subject "Your Blueprint login code: <code>", plain text plus simple HTML, no tracking pixels or links). Rate limit: 3 sends per email per 15 minutes and 10 per IP per 15 minutes (KV counters with TTL). If RESEND_API_KEY is missing, return 503 {error:"email_not_configured"}.
   c. POST /api/login/verify {email, code}: constant-time compare against the hash; 5 wrong tries deletes the code. On success, delete the code and issue the bp_session cookie for that customer's entitlement.
   d. Sessions: raise SESSION_TTL_S in functions/_lib/gate.ts to 90 days and make it sliding (the middleware re-issues the cookie when it is more than 1 day old). The middleware still checks the KV entitlement on every request, so a cancelled or expired subscription locks out even with a valid cookie. Key-based sessions get the same 90-day sliding life.
   e. GET /api/me returns {signedIn, tier, email (masked, e.g. s***@gmail.com)} from the cookie. js/gate.js: when there is no local license record, ask /api/me and treat a signed-in answer as access for that tier, so email logins are not locked out by the client gate. POST /api/logout clears the cookie.
   f. unlock.html and js/unlock.js: email login first (email box, "Send code", then a 6-digit box with autocomplete="one-time-code" and inputmode="numeric", "Resend code" after 30 s, and "Use a different email"). Under it a link "Have an access code instead?" that shows the existing code form. Keep the ?next= return. If start answers email_not_configured, show "Email login is being set up. Use your access code for now." and open the code form.
   g. Account page: show "Signed in as <masked email>" and a Log out button.
   h. reference/drafts/privacy-payments.md: add one line, as draft wording for Shane: your email is used to send login codes, sent through Resend; codes expire after 10 minutes.
   i. Tests in scripts/test-gate.mjs: same answer for known and unknown emails; wrong code 5 times kills it; expired code fails; the rate limit fires; verify issues a cookie; a cancelled entitlement with a valid cookie is redirected; 503 without the key. Smoke test: unlock page shows email login first, with no console errors.
   j. Bump CACHE_VERSION in sw.js. Ship this item even if the Resend key is not set yet (the 503 path covers that).

19. [x] Lesson slide kit (tier C; reference/LESSON_STANDARD.md section 4). Refactor scripts/build-lesson-slides.mjs into scripts/lesson-slides/: a kit of slide kinds driven by data in the lesson JSON (each slide gets a "kind" and a "data" object; "svg" is generated), so a module author writes data, not SVG. Kinds, each lifted from the Module 06 slide that already does it: scenario, cards (numbered parts, pass/fail), chart (bars from synth-bars with a level line or a zone band, labels that never overlap a side card), list (numbered rows revealed per cue, optional side panel), timeline (a boundary with labels), compare (two columns), score (circles plus verdict rows), assignment (one row of fields), summary (statement plus module link grid), steps (clock rows). Reveal delays keyed only to cue indexes. Generalise scripts/synth-bars.mjs so a chart's story is data too: start, regimes (approach, test with cap, fixed bar, reject, chop with center) and the pinned extreme. Rebuild Module 06 from kit data with no visible change (render all 16 slides at final reveal state before and after and compare). Add scripts/build-credits.mjs that rewrites the "Lesson music" lines on ai.html from every lesson JSON's music blocks, and call it from the render script's docstring. Tests: every kind renders; no text overlap check (bounding boxes of text vs rects on each slide); Module 06 slide count unchanged.

20. Lesson builds, one module per run, in this order: 00, 01, 02, 03, 16, 17, 18, 19, 20, then 04, 05, 07, 08, 09, 10, 11, 12, 13, 14, 15, 21, 22, 23, 24. Each module is two items: A (build) then B (review by a fresh run), exactly as reference/LESSON_STANDARD.md section 7 says. Item 19 must be done first. Tier C. The build run writes data/lessons/<NN>-<slug>.json, wires data-lesson on the page, builds slides, and reports as the standard asks. The review run fixes against the checklist in section 8 and renders every slide at final reveal state to look at it. Audio is not part of these runs: leave "audio": "../assets/audio/<NN>/<id>.mp3" on each segment and no audio files; the player shows the timer clock until Shane's local batch render. Log each module as "20-<NN>A" or "20-<NN>B" in BUILD_LOG.md.

   Progress: 20-00A done 2026-11-06 (Module 00: 5 segments, 13 slides). Next: 20-01A (Module 01 build), then 02, 03, 16 to 20.
   20-00A done 712a6d7
   20-00B done 44bc595
   20-01A done 96e2c7d (Module 01: 5 segments, 16 slides). Next: 20-01B (fresh-run review), then 02, 03, 16 to 20.
   20-01B done 263b172 (Module 01 is now 6 segments, 16 slides). Next: 20-02A (Module 02 build), then 03, 16 to 20.
   20-02A done e699423 (Module 02: 6 segments, 19 slides). Next: 20-02B (fresh-run review), then 03, 16 to 20.
   20-02B done 2c628f5 (Module 02 is still 6 segments, now 18 slides). Next: 20-03A (Module 03 build), then 16 to 20.
   20-03A done 4ecae3b (Module 03: 6 segments, 25 slides). Next: 20-03B (fresh-run review), then 16 to 20.
   20-03B done 675c717 (Module 03 is still 6 segments, 25 slides). Next: 20-16A (Module 16 build), then 17 to 20.
   20-16A done 42458fa (Module 16: 6 segments, 24 slides). Next: 20-16B (fresh-run review), then 17 to 20.
   20-16B done 2a14e85 (Module 16 is still 6 segments, 24 slides). Next: 20-17A (Module 17 build), then 18 to 20.
   20-17A done ed3a263 (Module 17: 6 segments, 24 slides). Next: 20-17B (fresh-run review), then 18 to 20.
   20-17B done b986b28 (Module 17 is still 6 segments, 24 slides). Next: 20-18A (Module 18 build), then 19 and 20.
   20-18A done 1096445 (Module 18: 6 segments, 27 slides; page is 12-journaling.html). Next: 20-18B (fresh-run review), then 19 and 20.
   20-18B done 4486153 (Module 18 is still 6 segments, 27 slides). Next: 20-19A (Module 19 build), then 20.
   20-19A done 7cb0cdf (Module 19: 5 segments, 16 slides; page is 13-toothbrush-therapy.html). Next: 20-19B (fresh-run review), then 20.
   20-19B done d93bbec (Module 19 is still 5 segments, 16 slides). Next: 20-20A (Module 20 build), then 04, 05, 07 to 15, 21 to 24.
   20-20A done (Module 20: 6 segments, 24 slides; page is 20-the-traders-mind.html). Next: 20-20B (fresh-run review), then 04, 05, 07 to 15, 21 to 24.
   20-20B done c1863f9 (Module 20 is still 6 segments, now 25 slides). Next: 20-04A (Module 04 build), then 05, 07 to 15, 21 to 24.
   20-04A done c0942c2 (Module 04: 6 segments, 30 slides). Next: 20-04B (fresh-run review), then 05, 07 to 15, 21 to 24.
   20-04B done ed00638 (Module 04 is still 6 segments, 30 slides). Next: 20-05A (Module 05 build), then 07 to 15, 21 to 24.
   20-05A done (Module 05: 6 segments, 21 slides; page is 05-the-auction.html). Next: 20-05B (fresh-run review), then 07 to 15, 21 to 24.
   20-05B done (Module 05 is still 6 segments, 25 slides). Next: 20-07A (Module 07 build), then 08 to 15, 21 to 24.
   20-07A done (Module 07: 6 segments, 24 slides). Next: 20-07B (fresh-run review), then 08 to 15, 21 to 24.
   20-07B done (Module 07 is still 6 segments, 24 slides; two spoken-jargon fixes: trigger defined at first use, near-edge alert defined). Next: 20-08A (Module 08 build), then 09 to 15, 21 to 24.
   20-08A done (Module 08: 6 segments, 26 slides). Next: 20-08B (fresh-run review), then 09 to 15, 21 to 24.
   20-08B done (Module 08 is still 6 segments, 26 slides; glosses at first spoken use for acceptance, Pause N Go, footprint, initial balance, stop floor and delta; the four grades split into one cue per grade with rows revealed per cue; segments re-timed to stay under 160 s). Next: 20-09A (Module 09 build), then 10 to 15, 21 to 24.
   20-09A done 3b2c216 (Module 09: 6 segments, 31 slides). Next: 20-09B (fresh-run review), then 10 to 15, 21 to 24.
   20-09B done 715b0cd (Module 09 is still 6 segments, 31 slides; jargon glossed at first spoken use, lists one item per cue, room-frame chart re-storied, re-timed under 160 s). Next: 20-10A (Module 10 build), then 11 to 15, 21 to 24.
   20-10A done 54fc90e (Module 10: 6 segments, 26 slides). Next: 20-10B (fresh-run review), then 11 to 15, 21 to 24.
   20-10B done (Module 10 is still 6 segments, 26 slides; chip labels unique per segment, jargon glossed, lists one cue per item, Case 1 and Case 2 charts re-storied with the pullback, answers re-spread). Next: 20-11A (Module 11 build), then 12 to 15, 21 to 24.
   20-11A done (Module 11: 6 segments, 24 slides). Next: 20-11B (fresh-run review), then 12 to 15, 21 to 24.
   20-11B done (Module 11 is still 6 segments, 24 slides; chip labels unique per segment, range extreme, near edge, resumption, pd-val, pd-high, test number and the 2 to 1 check glossed at first spoken use, the four grade checks split, Case 1 chart re-ranged so the two closes, reclaim and pause read, answers re-spread, getting-it-wrong questions in segments 5 and 6). Next: 20-12A (Module 12 build), then 13 to 15, 21 to 24.
   20-12A done d78fa8e (Module 12: 6 segments, 24 slides; page is 12-the-gap-setups.html). Next: 20-12B (fresh-run review), then 13 to 15, 21 to 24.
   20-12B done (Module 12 is still 6 segments, 24 slides; jargon glossed at first spoken use, the fourth open spoken and shown, all four charts re-storied with mixed colours and no clipping, answers re-spread, getting-it-wrong and one-line summary added to segment 6). Next: 20-13A (Module 13 build), then 14, 15, 21 to 24.
   20-13A done (Module 13: 6 segments, 29 slides; page is 13-triggers.html). Next: 20-13B (fresh-run review), then 14, 15, 21 to 24.
   20-13B done 9e6f49f (Module 13 is still 6 segments, 29 slides; chip labels unique per segment, jargon glossed at first spoken use, A-plus spoken, deltas one cue each, getting-it-wrong line added to segment 6, two charts re-storied for mixed colours, answers re-spread). Next: 20-14A (Module 14 build), then 15, 21 to 24.
   20-14A done 19d6653 (Module 14: 6 segments, 31 slides; page is 14-trade-construction.html; dollar figures from the page kept out of the lesson, base R given as 100 with 0.50 a tick). Next: 20-14B (fresh-run review), then 15, 21 to 24.
   20-14B done 2b7fecc (Module 14 is still 6 segments, 31 slides; chip labels unique per segment, trigger, sheet, near edge, ATR, conviction, execution mark, invalidation, pd-high and acceptance glossed at first spoken use, the not-a-target list one cue per item, the target chart and the two bracket charts re-storied for mixed colours, price labels in spoken form, segments re-timed under 160 s). Next: 20-15A (Module 15 build), then 21 to 24.
   20-15A done 2a2f1c7 (Module 15: 6 segments, 24 slides; page is 15-writing-the-plan.html; no statistics on the page so none in the lesson; both charts are composite plan branches showing no entries or outcomes). Next: 20-15B (fresh-run review), then 21 to 24.
   20-15B done (Module 15 is still 6 segments, 24 slides; chip labels unique per segment, trigger, order flow, VWAP, the opening range, a range extreme, a gap open, pd-low, the 2 to 1 check and the execution mark glossed at first spoken use, the eight score lines one cue each with rows revealed per cue, the nothing-case items revealed per cue, Branch 1 target card added, a getting-it-wrong chapter, a joke and an "In one line" summary in segment 6, answers spread across all four positions, re-timed under 160 s). Next: 21 (record the Nov 6 decisions), then 22 to 24.

21. Record the Nov 6 decisions (tier C, docs only). In reference/BLUEPRINT_DOC.md: (a) Access: email login with a 6-digit code is the primary login (functions/api/login/*, Resend from login@bptrade.co, 90-day sliding session, access code kept as the backup); (b) a "Lesson layer" section pointing at reference/LESSON_STANDARD.md, naming Module 06 as the approved template (Nov 6), the Kokoro bf_emma voice, the two-stem music slider, the soundtrack rule (POOL/ENDING in scripts/render-narration.py, music files never in the repo), the slide kit, synth-bars, and that audio renders are a local batch; (c) module status: all 25 published, lesson layer rolling out per BACKLOG item 20. In reference/DECISIONS.md add dated lines for: email login replaces code-per-device; one soundtrack per module plus an ending track; spoken times written as said; one joke per video that reads on paper; organic synthetic bars only. Keep every existing line. npm test green.

22. Track scaffolding (tier C; reference/TRACKS_PLAN.md sections 1 to 3). Build the Finance and Options track structure with no modules: data/finance.json and data/options.json (empty lists, same shape as modules.json plus "track"), finance.html and options.html index pages, nav entries that fit at 360 px, finance/ and options/ folders accepted by check.mjs, progress keys per track, js/track-notice.js (the scope block, wording from TRACKS_PLAN section 2) and js/odd-notice.js (the ODD block with the June 2024 OCC link), data/finance-limits.json seeded from the limits table in reference/research/crawl/finance-education-reference-findings.md with tax year and source per row, tiers map and middleware paths for the two tracks (functions/_middleware.ts path list only; this edit is named here and approved), sw.js shell, sitemap, llms.txt. Add a BLUEPRINT_DOC section "Tracks" pointing at TRACKS_PLAN.md. Tests: both index pages render with no console errors, notices render, check.mjs passes on a sample page in each folder. Do this after item 20 is fully checked off.

23. Finance track modules F01 to F12, one module per run, in TRACKS_PLAN section 4 order, each as A (page + lesson JSON + slides, built from reference/research/crawl/finance-education-reference-findings.md under TRACKS_PLAN section 2 rules and MODULE_STANDARD) and B (fresh review against LESSON_STANDARD section 8 plus the section 2 compliance rules: no advice language, scope block present, every figure with tax year and source, insurance pages abstract only). Published as each clears review (Shane, Nov 6: general education only, no personal advice, nothing to wait on). Record progress as "23-F01A done <SHA>" lines. Tier C. Audio is Shane's local batch.

24. Options track modules O01 to O10, one module per run, in TRACKS_PLAN section 5 order, A then B as in item 23, built from the Crawl folder options-education (findings.md and strategies.csv, Drive file ids in TRACKS_PLAN section 3, read with the Google Drive connector; paraphrase only, link to OIC pages, never redisplay) plus reference/content-maps/OPTIONS.md for O05 and O09. Every module carries the ODD block. Published as each clears review. Record progress as "24-O01A done <SHA>". Tier C.

## Answers, approved by Shane Nov 5, 2026

Every item below is now buildable. Shane's approval here is the tier D sign-off for these items: do not park them again for tier D reasons. Build only from these answers and files already in the repo. Anything still missing goes back under a new "## Needs Shane" section.

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
- Draft only, into reference/drafts/privacy-payments.md, from reference/research/lemonsqueezy-privacy.md (added Nov 6; the Lemon Squeezy sites do not resolve from the cloud, so use this file, not a fetch) and from what functions/api/ls-webhook.ts actually stores (Lemon Squeezy as merchant of record, what is shared, what The Blueprint does not store). Cite sources in the draft.
- Do NOT edit privacy.html. Mark the item done when the draft is committed; Shane approves the wording before it ships.

### Items 9a to 9e - Learning-layer pilot on Module 06 (one sub-item per run, in order)
- Segments: split Module 06 into 3 to 6 segments with a lesson sidebar and per-segment resume.
- Lesson player: HTML/SVG slides in the Blueprint design system, timestamps that drive the slides, captions and a clickable transcript. Write the narration script and slide timings now; the audio file is a placeholder until the voice is picked (Kokoro-82M for the pilot, Google Neural2 if it falls short).
- Practice: a 3 to 4 question check per segment, passed at 3 of 4, plus a module quiz, built on the existing quiz code and js/progress.js.
- Progress: three states per segment (not started, attempted, passed) in js/progress.js.
- Chart: a level-marking drill on Lightweight Charts v5.2.1 (Apache-2.0, keep the NOTICE) using synthetic bars only, never real exported bars.
- Notes: per-segment notes, exportable as .md.
- Lesson prose may use a --max-reading: 680px token; do not change the rest of the design system.

### Item 11 - Setting Up NT8 page
- Source: reference/content-maps/NT8-Setup.md (added Nov 5). Build the page from it plus D29 and D50.
- Live-account daily loss limit: use reference/research/daily-loss-lock.md (added Nov 5). The NT8 platform has no daily loss limit; the kill switch is set in the NinjaTrader Dashboard Risk Settings with "Prevent Changes When Trading is Locked" on. Teach the mechanics and link vendor pages; print no vendor dollar amounts.
- Where the map still lists a gap, write the page around it with no invented steps and list the gap in the build report.

### Item 12 - Rule Card
- As recommended: a one-page printable card at tools/rule-card.html with the pre-trade yes/no checks, the grade-to-size table from Module 14 and the broker-level 2R kill switch (D29). Every line copied from existing module text.

### Item 13 - Reading List
- reading-list.html built from reference/research/reading-list-books.csv (107 books, added Nov 5) plus any titles already named in the modules, BLUEPRINT_DOC and DECISIONS (D2 commodity basics included).
- Lead with the books named on 2 or more lists. Group under psychology, decision-making, trading process and investing; the investing group is a short pointer for the later finance track, not the focus.
- One line each on why, in our own words. No quoted text from the books or the source lists. Credit the seven source lists at the bottom (see reference/research/README.md).

### Item 14 - Sources page
- As recommended: public sources.html listing each source named in the modules, with the n and period beside every statistic from TradingStats_Source_of_Truth.txt. No source needs to stay unnamed. Include the library licenses (Lightweight Charts NOTICE and others in use).

### Item 15 - Journal fields
- As recommended: schema v6 adds readiness_score (0, 1 or 2 per D42), test_number (integer), session_block (text slug) and sheet_finished_time (ISO time), all nullable and present as keys; v1 to v5 records read as null. Carry the new fields into the CSV export.

## Needs Shane

- Audio batch renders (local, Shane): after each group of modules clears item 20B, Shane runs scripts/render-narration.py for the group in one Claude Code prompt (about 10 minutes per module), which also rebuilds slides, credits and CACHE_VERSION.

