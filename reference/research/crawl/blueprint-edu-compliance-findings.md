# blueprint-edu-compliance — findings

Target: US rules for a paid, non-personalized futures education site that also sells
NinjaTrader indicators ("Blueprint"), pre-launch.

<!-- job:J-20261014-18 start -->

## 1. What was acquired

Primary texts (raw/):

| File | What it is | How |
|---|---|---|
| `raw/govinfo-17cfr-4-14.xml` | 17 CFR 4.14 (CTA registration exemptions), 2024 annual edition | govinfo API, 0 credits |
| `raw/govinfo-17cfr-4-41.xml` | 17 CFR 4.41 (CTA/CPO advertising incl. simulated-performance disclaimer), 2024 annual edition | govinfo API, 0 credits |
| `raw/govinfo-16cfr-part255.xml` | 16 CFR Part 255 (FTC Endorsement Guides, 2023 revision), 2024 annual edition | govinfo API, 0 credits |
| `raw/nfa-rule-2-29.pdf` + `raw/nfa-rule-2-29.md` | NFA Compliance Rule 2-29 full text (rulebook PDF endpoint + extracted text) | crawl-fetch + 4-credit Firecrawl PDF parse |
| `raw/cftc-pulido-order.pdf` | CFTC v. Roberto Pulido & Lions of Forex LLC — default judgment order, S.D. Fla., Nov 13, 2024 (34 pp.) | crawl-fetch + 34-credit Firecrawl PDF parse |
| WebFetch summaries (not saved as files) | FTC Endorsement FAQ, FTC Part 465 rule + final-rule PR, FTC OTA/Warrior/IM Mastery pages, CFTC PR 8767-23, CFTC "Back to School" advisory | WebFetch, 0 credits |

Probe/error files left in `raw/` (govinfo URL-pattern probes and bot-wall pages, kept
because deletion is not permitted): `ecfr-17-4.41.html`, `ecfr-17-4.41.xml`,
`govinfo-17cfr-4-41.html`, `govinfo-17cfr-4-14.html`, `probe-*`, `nfa-rulebook-index.html`,
`nfa-rules-list.html`, `nfa-rule-2-29-s4.html`, `nfa-rulebook.js`, `nfa-all.js`,
`uscode-7usc-6b.html`, `govinfo-7usc-6b.html`. These are not sources.

**Credits used: 51 Firecrawl credits this run (1 scrape + 4 PDF pages + 6 searches ×2 + 34 PDF pages)
— the job's `credit_cap` is 30, so the cap was exceeded by 21.** The overrun came from the
CFTC court-order PDF parse, billed per page (34 pages = 34 credits) where ~4 was expected
from the previous 4-page parse. Logged truthfully in `credits.log`; flagged for human review.
Cycle total after this job: 57 of 800. Zero-credit tools did the rest (govinfo API,
crawl-fetch, WebFetch).

Dead ends this run: eCFR site remains bot-walled (see progress.md, prior run);
govinfo DEMO_KEY rate limit blocked 16 CFR 465 CFR text and 7 U.S.C. 6b statute text;
`pdftotext` not installed on this box (crawl-pdftotext fails).

## 2. Findings

### 2.1 Rule table

"Applies to Blueprint" = the worker's reading of each cited text against the job's stated
facts (paid, non-personalized futures education + indicator sales, no account direction).
It is a summary of what the rules say, not legal advice.

| # | Citation | Plain summary | Applies to Blueprint | Condition |
|---|---|---|---|---|
| 1 | 17 CFR 4.14(a)(9) | No CTA registration needed if you do NOT direct client accounts and do NOT give advice based on/tailored to particular clients' positions or circumstances | **Yes** | Only while advice stays non-personalized. No notice-filing required by the text of (a)(9). |
| 2 | 17 CFR 4.14(a)(10) | Alternative exemption: advice furnished to ≤15 persons in preceding 12 months and not holding oneself out to the public as a CTA | No | Fails the 15-person prong once the paid tier has more than 15 subscribers; (a)(9) is the relevant lane for a public site. |
| 3 | CEA §1a(12)(A)(i), 7 U.S.C. §1a(12)(A)(i) | "Commodity trading advisor" = anyone who, for compensation or profit, engages in the business of advising others, directly or through publications, writings or electronic media, as to the value of or advisability of trading futures | Conditional | Selling non-personalized trading advice through publications is inside the CTA definition (the CTA hook); 4.14(a)(9) then exempts from registration. |
| 4 | 17 CFR 4.41(a)(3) | Ads may not use testimonials unless prominently disclosed: may not be representative of other clients' experience; no guarantee of future performance/success; paid testimonial if more than a nominal sum is paid | Yes | Applies "regardless of whether the CTA is exempt from registration" (4.41(c)(2)). |
| 5 | 17 CFR 4.41(b)(1)(i) | Simulated/hypothetical performance of a CTA/CPO must be accompanied by the prescribed statement (quoted verbatim in 2.2 below), or the NFA-prescribed statement under 4.41(b)(1)(ii) | Yes (if any simulated results are shown) | Written presentations: statement must be prominent and in immediate proximity to the performance (4.41(b)(2)). Same "regardless of exemption" scope (4.41(c)(2)). |
| 6 | 17 CFR 4.41(c) | Scope: covers any publication/broadcast/web/e-mail/seminar presentation by a CTA or principal, and applies regardless of CEA registration exemption | Yes | See rows 4–5; the exemption in 4.14(a)(9) removes registration, not 4.41. |
| 7 | CEA §4b(a)(2)(A),(C), 7 U.S.C. §6b(a)(2)(A),(C) | Anti-fraud: unlawful to cheat/defraud or willfully deceive any person in connection with off-exchange leveraged/retail commodity or forex orders or contracts for another | Yes | Applies to "any person" — no registration needed. The Pulido order rests on it (see 2.3). |
| 8 | CEA §4o(1)(A),(B), 7 U.S.C. §6o(1) | CTA fraud: unlawful for a CTA/AP to employ any device/scheme/artifice to defraud clients or prospective clients, or any practice operating as a fraud | Yes | Attaches if Blueprint is a CTA (incl. exempt CTA per row 3). |
| 9 | NFA Compliance Rule 2-29(a) | No fraud/deceit, no high-pressure approach, no statement that commodity interest trading is appropriate for all persons | Conditional | Binds "FCM, IB, CPO or CTA Member or Associate" — only if Blueprint registers or becomes an NFA Member. Otherwise the CFTC analogs (rows 7–8) govern. |
| 10 | NFA 2-29(b)(3)–(4) | Profit mention must be accompanied by equally prominent risk-of-loss discussion; actual past profits require "past results are not necessarily indicative of future results" | Conditional | Same membership condition as row 9. |
| 11 | NFA 2-29(b)(6) | Testimonials must be representative of comparable accounts, prominently state not indicative of future success, and state if paid | Conditional | Same membership condition; mirrors 4.41(a)(3). |
| 12 | NFA 2-29(c) | Prescribed hypothetical-results disclaimer (all-caps Board text); comparable 5-year actual-performance info required; hypothetical display prohibited entirely once the firm has 3 months of actual results for that system | Conditional | Same membership condition; the 3-month bar is the strictest rule found anywhere in this run. |
| 13 | NFA 2-29(i)(2) | "Commodity interest account, agreement or transaction" explicitly includes "agreements and transactions involving the sale, through publications or otherwise, of non-personalized trading advice" | Conditional | Shows NFA treats publication-sold advice as in-scope when the seller is a Member. |
| 14 | 16 CFR 255.0(f) + 255.5(a) | Material connections between endorser and seller (payment, free products, affiliate relationship, insider status) must be disclosed clearly and conspicuously; online the disclosure must be "unavoidable" | Yes | FTC Act §5 backing (255.0(a)); no registration condition. |
| 15 | 16 CFR 255.2(b) | A testimonial about a key attribute implies typical results; without substantiation the ad must disclose generally expected performance | Yes | FTC's own research found "Results not typical"-style disclaimers insufficient (255.2(e)(2)(i)(A)). |
| 16 | 16 CFR Part 465 (Rule on the Use of Consumer Reviews and Testimonials) | Bans fake/AI-generated/insider reviews, buying positive or negative reviews, review suppression by threat, fake social-media indicators, and testimonials lacking material-connection disclosure; civil penalties available for knowing violations | Yes | Announced Aug 14, 2024; per the FTC release, effective 60 days after Federal Register publication. |
| 17 | Consumer Review Fairness Act, 15 U.S.C. §45b | Illegal to put standardized contract provisions that threaten or penalize honest reviews (gag clauses) | Yes | Cited in 16 CFR 255.2(e)(10) n.2; FTC charged OTA under it. |
| 18 | FTC Act §5 (15 U.S.C. 45) via 16 CFR 255.0(a) | Endorsement Guides are administrative interpretations of §5; inconsistent practices invite Commission action | Yes | The umbrella under which every FTC item in this file operates. |

### 2.2 The 17 CFR 4.41(b) disclaimer, quoted exactly

From the 2024 annual edition of the CFR (govinfo granule XML, `raw/govinfo-17cfr-4-41.xml`).
This is §4.41(b)(1)(i), including the source's own "under-or over-compensated" hyphenation:

> "These results are based on simulated or hypothetical performance results that have certain inherent limitations. Unlike the results shown in an actual performance record, these results do not represent actual trading. Also, because these trades have not actually been executed, these results may have under-or over-compensated for the impact, if any, of certain market factors, such as lack of liquidity. Simulated or hypothetical trading programs in general are also subject to the fact that they are designed with the benefit of hindsight. No representation is being made that any account will or is likely to achieve profits or losses similar to these being shown."

§4.41(b)(1)(ii) alternatively permits "a statement prescribed pursuant to rules promulgated
by a registered futures association pursuant to section 17(j) of the Act" — i.e. the NFA
Board's prescribed all-caps text in Rule 2-29(c)(1), recorded verbatim in
`raw/nfa-rule-2-29.md`. §4.41(b)(2): non-oral presentations must disclose the statement
prominently and in immediate proximity to the simulated/hypothetical performance.

Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office

### 2.3 Enforcement cases against educators / signal-and-indicator sellers, 2020–2026

| Case | Date(s) | Conduct | Outcome |
|---|---|---|---|
| **FTC v. Online Trading Academy** (OTA Franchise Corp. et al.), D. Cal. 8:20-cv-00287 | Complaint Feb 12, 2020; settlement Sept 15, 2020; refunds Aug 2021 | Sold investment "training programs" up to $50,000 on false/unsubstantiated earnings claims ("anyone" could generate substantial income "whether it's going up, down or sideways"); own surveys showed 66% of students making no money and ~75% of those who traded lost; pitchmen's wealth claims false; used form contracts to stop customers reporting to government (Consumer Review Fairness Act) | Settlement: forgive >$13.3M consumer debt, principals turn over millions; earnings claims barred unless truthful and backed by written documentation; $5.4M refunded to 31,144 consumers |
| **FTC v. Warrior Trading, Inc.** (Ross Cameron), D. Mass. 3:22-cv-30048 | Complaint/stipulated order Apr 19, 2022; final order May 26, 2022; refunds Jan 2023 | Sold a day-trading "system" with "misleading and unrealistic claims of big investment gains"; most customers' trading "failed to pay off" | $3M for consumer refunds ($2.9M paid to 20,402 people); prohibited from making baseless earnings claims about trading strategies |
| **FTC & Nevada v. IM Mastery Academy** (iMarketsLive/IM Academy; Chris & Isis Terry et al.), D. Nev. | Complaint May 2025; prelim. injunction Aug 2025; receivership Nov 2025; settlement May 13, 2026 | MLM selling "training on how to invest in financial markets" with "false or baseless earnings claims"; luxury-lifestyle social media aimed at young people; >$1.2B generated since 2018 | $795.8M judgment (partially suspended on inability-to-pay conditions), ~$90M in assets surrendered (homes, vehicles, yacht, jewelry); bans defendants from selling trading-training services; substantiation required for any future earnings claims |
| **CFTC v. Roberto Pulido (a/k/a "Berto Delvanicci") & Lions of Forex LLC**, S.D. Fla. 1:23-cv-23703 | Complaint Sept 28, 2023; default judgment Nov 13, 2024 | Monthly-fee forex **signal subscription packages** + mentorship/live training marketed as "highly successful" ("90% of LOF's retail forex signals were profitable"; "7-figure trader"); funnel into "guaranteed" monthly profits from discretionary trading; funds misappropriated, no trading occurred | Permanent injunction + trading/registration bans (with a carve-out referencing 17 CFR 4.14(a)(9)); restitution $172,097.50; civil monetary penalty $516,292.50 (treble the gain); CEA §4b(a)(2)(A),(C), §4o(1), Reg 5.2(b) |
| **CFTC order: Peter L. Bryant & Bryant Capital Trade Management Corp.** (PR 8767-23) | Order Aug 15, 2023 | Paid trading-advisory solicitations (emails, newsletters, web ads) with fabricated performance and expertise claims (e.g., "27%-39% reduction in 2021 energy costs" for 47 clients found "entirely fabricated"); acted as unregistered CTAs ~2014–2022; falsely claimed to be an "exempt swap intermediary" | Jointly/severally: $55,655.90 restitution + $195,000 civil monetary penalty; cease-and-desist; 4-year trading and registration bans |

Sources (each line stands alone):
Source: https://www.ftc.gov/news-events/news/press-releases/2020/02/ftc-sues-online-trading-academy-running-investment-training-scheme — read 2026-10-15 — 2020-02-12 — Federal Trade Commission
Source: https://www.ftc.gov/news-events/news/press-releases/2020/09/ftc-settlement-requires-online-trading-academy-forgive-consumer-debt-principals-turn-over-millions — read 2026-10-15 — 2020-09-15 — Federal Trade Commission
Source: https://www.ftc.gov/news-events/news/press-releases/2021/08/federal-trade-commission-sending-refunds-more-31000-consumers-allegedly-defrauded-online-training — read 2026-10-15 — 2021-08-16 — Federal Trade Commission
Source: https://www.ftc.gov/legal-library/browse/cases-proceedings/2023198-warrior-trading-inc-ftc-v — read 2026-10-15 — no page date — Federal Trade Commission
Source: https://www.ftc.gov/news-events/news/press-releases/2026/05/lead-defendants-im-mastery-academy-mlm-scheme-turn-over-tens-millions-dollars-assets-settle-ftc — read 2026-10-15 — 2026-05-13 — Federal Trade Commission
Source: https://www.ftc.gov/business-guidance/blog/2026/06/back-those-earnings-claims-other-lessons-ftcs-labor-task-force-work — read 2026-10-15 — 2026-06-16 — FTC Bureau of Consumer Protection staff
Source: https://www.cftc.gov/media/11746/enfrobertopulidoorder111324/download — read 2026-10-15 — 2024-11-13 — U.S. District Court, S.D. Florida (CFTC action)
Source: https://www.cftc.gov/PressRoom/PressReleases/8767-23 — read 2026-10-15 — 2023-08-15 — Commodity Futures Trading Commission

### 2.4 Copy patterns: do / don't (each tied to a cited source)

1. **DON'T show simulated/hypothetical results without the §4.41(b) statement** — and when
   written, place it prominently and in immediate proximity to the performance.
Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office
2. **DON'T imply hypothetical results are achievable** — even with a disclaimer, claiming
   profits "similar to those shown" is barred by the prescribed statement itself; NFA members
   may not display hypothetical results at all once they hold 3 months of actual results for
   the system. Source: https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=4&RuleID=RULE%202-29 — read 2026-10-15 — 2025-07-21 — National Futures Association
3. **DON'T mention possible profit without an equally prominent risk-of-loss discussion**;
   every reference to actual past profits must add that past results are not necessarily
   indicative of future results. Source: https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=4&RuleID=RULE%202-29 — read 2026-10-15 — 2025-07-21 — National Futures Association
4. **DON'T run testimonials without the three required disclosures** (may not be
   representative; no guarantee of future success; paid, if more than a nominal sum).
Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office
5. **DON'T rely on "results not typical" style disclaimers** — the FTC tested them and found
   they fail to cure a typicality implication; disclose generally expected results instead.
Source: https://api.govinfo.gov/packages/CFR-2024-title16-vol1/granules/CFR-2024-title16-vol1-part255/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-01-01 — U.S. Government Publishing Office
6. **DON'T use incentivized endorsements/reviews without a clear-and-conspicuous
   material-connection disclosure** — online it must be "unavoidable" (not behind a "more"
   link, not only on a profile page, not a 5-second flash). Source: https://api.govinfo.gov/packages/CFR-2024-title16-vol1/granules/CFR-2024-title16-vol1-part255/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-01-01 — U.S. Government Publishing Office
7. **DON'T fake, buy, or condition reviews** (payment required for positive sentiment),
   don't post insider reviews without disclosure, don't suppress negative reviews by threat,
   don't buy fake followers/views — civil-penalty conduct under Part 465.
Source: https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials — read 2026-10-15 — 2024-08-14 — Federal Trade Commission
8. **DON'T put anti-review / non-disparagement clauses in customer contracts** (Consumer
   Review Fairness Act; the FTC charged OTA with exactly this).
Source: https://www.ftc.gov/news-events/news/press-releases/2020/02/ftc-sues-online-trading-academy-running-investment-training-scheme — read 2026-10-15 — 2020-02-12 — Federal Trade Commission
9. **DON'T claim trading is appropriate for everyone** ("anyone can do this regardless of
   background/capital/time" was the core OTA allegation) and avoid high-pressure sales.
Source: https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=4&RuleID=RULE%202-29 — read 2026-10-15 — 2025-07-21 — National Futures Association
Source: https://www.ftc.gov/business-guidance/blog/2020/02/ftc-challenges-online-trading-academys-money-making-claims — read 2026-10-15 — 2020-02-12 — FTC Bureau of Consumer Protection staff
10. **DON'T guarantee profits, "residual income," or withdrawable funds** — guaranteed
    monthly profit schedules were the fraud in CFTC v. Pulido.
 Source: https://www.cftc.gov/media/11746/enfrobertopulidoorder111324/download — read 2026-10-15 — 2024-11-13 — U.S. District Court, S.D. Florida (CFTC action)
11. **DON'T publish track records or performance stats you cannot substantiate** —
    fabricated "performance markers" cost Bryant a $195k penalty; "it's easy to fake success
    measures or frame stats in misleading ways" (CFTC advisory).
 Source: https://www.cftc.gov/PressRoom/PressReleases/8767-23 — read 2026-10-15 — 2023-08-15 — Commodity Futures Trading Commission
 Source: https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/learn_to_trade_without_scam.htm — read 2026-10-15 — no page date — Commodity Futures Trading Commission
12. **DO keep all advice non-personalized** — no directing accounts, no advice tailored to a
    customer's positions or circumstances — to remain inside the 4.14(a)(9) exemption;
    personalized touches (account reviews, "trade this with me" arrangements) pull the site
    into CTA registration territory.
 Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-14/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office
13. **DO treat instructor/affiliate posts as endorsements you are liable for** — advertisers
    must guide, monitor, and remediate endorser compliance.
 Source: https://api.govinfo.gov/packages/CFR-2024-title16-vol1/granules/CFR-2024-title16-vol1-part255/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-01-01 — U.S. Government Publishing Office
14. **DO avoid luxury-lifestyle / "trading made me a millionaire" social proof** — that was
    the marketing pattern in the IM Mastery and Pulido complaints.
 Source: https://www.ftc.gov/news-events/news/press-releases/2026/05/lead-defendants-im-mastery-academy-mlm-scheme-turn-over-tens-millions-dollars-assets-settle-ftc — read 2026-10-15 — 2026-05-13 — Federal Trade Commission
 Source: https://www.cftc.gov/media/11746/enfrobertopulidoorder111324/download — read 2026-10-15 — 2024-11-13 — U.S. District Court, S.D. Florida (CFTC action)

### 2.5 Notes on the 4.14(a)(9) question

The job asked whether CTA registration is required or 4.14(a)(9) applies. Read together,
the acquired texts support this summary: a paid site publishing non-personalized futures
education and selling indicators fits the CTA definition through the "publications,
writings, or electronic media" prong (7 U.S.C. 1a(12)(A)(i), as quoted in the Pulido
order), and 17 CFR 4.14(a)(9) exempts it from *registration* while it neither directs
client accounts nor tailors advice to particular clients. Registration exemption ≠
advertising exemption: 17 CFR 4.41(c)(2) applies §4.41 "regardless of whether the
commodity pool operator or commodity trading advisor is exempt from registration," and the
CEA anti-fraud provisions (§4b, §4o) reach the conduct directly. The default-judge's
carve-out in Pulido (permitting activity "except as provided for in Regulation 4.14(a)(9)")
shows the regulation's live use in enforcement.

Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-14/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office
Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office
Source: https://www.cftc.gov/media/11746/enfrobertopulidoorder111324/download — read 2026-10-15 — 2024-11-13 — U.S. District Court, S.D. Florida (CFTC action)

## 3. Gaps

- **eCFR current text not verified.** All CFR quotes are the 2024 annual edition (govinfo).
  The live eCFR (amended since April 2024) could not be fetched — ecfr.gov bot wall
  (prior run) and govinfo rate limit. If Blueprint's lawyer wants the current-amended
  text, re-run against eCFR from an approved environment.
- **16 CFR Part 465 section-level CFR text not obtained** (govinfo rate limit). The
  prohibition list above comes from the FTC's own final-rule press release; the exact
  effective calendar date was not stated in any fetched page ("60 days after Federal
  Register publication").
- **CFTC staff letters on trading courses/software not acquired** — the job's starting
  sources named them; searches surfaced only pre-2010 letters and the 2024 advisory.
  Needs a targeted ecfr/cftc-letter search in a follow-up job if wanted.
- **NFA Interpretive Notices 9003 and 9025** (referenced by 2-29(b)(5) and (c)(5)) not
  fetched.
- **7 U.S.C. 6b/6o full statute text** quoted here only as reproduced inside the Pulido
  court order (primary court document), not from the U.S. Code itself (uscode.house.gov
  URL forms rejected; govinfo rate-limited).
- **Warrior Trading** exact statutory counts (FTC Act §5 vs. others) not confirmed — the
  case page does not list them; the complaint PDF was not fetched (budget).
- **Credit cap exceeded** (51 vs 30) — see section 1; awaiting human review.

## 4. Source quality notes

- All findings rest on primary sources: CFR annual-edition XML from govinfo (GPO), the
  NFA rulebook PDF, a federal district-court order, and FTC/CFTC pages fetched from the
  agencies' own domains. No law-firm blogs were used, so none needed ⚠ flags.
- No AI-generated source content was relied on; no `utm_source=chatgpt` patterns seen.
- Known walls encountered: ftc.gov and cftc.gov return HTTP 403 to `crawl-fetch` (bot
  filtering) but serve WebFetch and the cftc.gov `/media/` PDF path; nfa.futures.org
  rulebook pages are JS-rendered (worked via the rulesPDF.aspx endpoint); ecfr.gov
  remains behind the federalregister.gov unblock wall; uscode.house.gov granule URLs
  returned "Page Not Found" shells for both syntaxes tried.
- The 2026-06 FTC business-blog post used for IM Mastery corroboration is FTC staff
  guidance, not a enforcement document; the settlement press release carries the same
  figures and is cited alongside it.
- govinfo DEMO_KEY is rate-limited per hour; several 429s are recorded in progress.md.

<!-- job:J-20261014-18 end -->

<!-- job:J-20261016-11 start -->

## Gap-fill 2026-10

### A.1 What was acquired this run

| File | What it is | How |
|---|---|---|
| `raw/govinfo-17cfr-4-14-2025.xml` | 17 CFR 4.14, **2025 annual edition** (issued 2025-04-01, the latest published; the 2026 title-17 edition is not on govinfo yet — package 404) | govinfo API via crawl-fetch, 0 credits |
| `raw/govinfo-17cfr-4-41-2025.xml` | 17 CFR 4.41, 2025 annual edition (same basis) | govinfo API via crawl-fetch, 0 credits |
| `raw/govinfo-16cfr-part465-2026.xml` | **16 CFR Part 465 full text**, 2026 annual edition (issued 2026-01-01) — the acquisition the prior run's 429s blocked | govinfo API via crawl-fetch, 0 credits |
| `raw/govinfo-16cfr-part255-2026.xml` | 16 CFR Part 255, 2026 annual edition (amendment check only) | govinfo API via crawl-fetch, 0 credits |
| `raw/nfa-notice-9003.pdf` | NFA Interpretive Notice 9003 (Compliance Rule 2-29: Communications with the Public and Promotional Material), standalone PDF | crawl-fetch `rulesPDF.aspx?Section=9&RuleID=9003`, 0 credits |
| `raw/nfa-notice-9025.pdf` | NFA Interpretive Notice 9025 (Compliance Rule 2-29: Use of Promotional Material Containing Hypothetical Performance Results), standalone PDF | crawl-fetch `rulesPDF.aspx?Section=9&RuleID=9025`, 0 credits |
| `raw/nfa-notice-9003.md`, `raw/nfa-notice-9025.md` | Verbatim text extracts of both notices (no local pdftotext; extracted from the already-acquired `raw/nfa-rules-list.html`, lines 6729–7005 and 8021–8265) | 0 credits |
| `raw/frapi-part465.json`, `raw/frapi-part255.json`, `raw/frapi-2024-18519-dates.json`, `raw/probe-FR-2024-08-22-granules.json`, `raw/probe-FR-2024-18519-summary.json`, `raw/probe-2025-title17.json` | Federal Register API and govinfo probe responses backing the amendment findings below | crawl-fetch, 0 credits |

**Credits used this run: 2 Firecrawl** (one 404 + one 200, both on the Federal Register
documents API — see A.6; logged in `credits.log`). Everything else was zero-credit
(crawl-fetch on govinfo, NFA and the FR single-document API). Firecrawl balance API is
not reachable from the worker (no key in the worker shell), so the ledger fallback was
used per CLAUDE.md: 339 cycle credits before this job + 2 = **341 of 800** this cycle,
above the 200-credit floor. Job `credit_cap` 10: 2 spent.

### A.2 (a) Current text of §4.14(a)(9) and §4.41(b), and amendments since the 2024 edition

**"Current" basis.** The 2026 annual edition of title 17 is not on govinfo yet
(`CFR-2026-title17-vol1` package: HTTP 404, checked 2026-10-16), so the latest annual
edition — 2025-04-01 — is the baseline. The Federal Register API (documents affecting
17 CFR part 4 published since 2024-01-01) shows exactly **one final rule**, so no
amendment has entered the CFR after the 2025 edition through 2026-10-16.

**§4.14(a)(9), quoted verbatim from the 2025 annual edition (identical in the 2024 edition):**

> (9) It does not engage in any of the following activities:
> (i) Directing client accounts; or
> (ii) Providing commodity trading advice based on, or tailored to, the commodity
> interest or cash market positions or other circumstances or characteristics of
> particular clients; or

**§4.41(b), quoted verbatim from the 2025 annual edition (identical in the 2024 edition):**

> (b)(1) No person may present the performance of any simulated or hypothetical
> commodity interest account, transaction in a commodity interest or series of
> transactions in a commodity interest of a commodity pool operator, commodity trading
> advisor, or any principal thereof, unless such performance is accompanied by one of
> the following:
> (i) The following statement: "These results are based on simulated or hypothetical
> performance results that have certain inherent limitations. Unlike the results shown
> in an actual performance record, these results do not represent actual trading. Also,
> because these trades have not actually been executed, these results may have
> under-or over-compensated for the impact, if any, of certain market factors, such as
> lack of liquidity. Simulated or hypothetical trading programs in general are also
> subject to the fact that they are designed with the benefit of hindsight. No
> representation is being made that any account will or is likely to achieve profits or
> losses similar to these being shown." ; or
> (ii) A statement prescribed pursuant to rules promulgated by a registered futures
> association pursuant to section 17(j) of the Act.
> (2) If the presentation of such simulated or hypothetical performance is other than
> oral, the prescribed statement must be prominently disclosed and in immediate
> proximity to the simulated or hypothetical performance being presented.

**Amendments since the 2024 edition (FR citation, date):**

- **§4.14: one amendment.** Final rule "Commodity Pool Operators, Commodity Trading
  Advisors, and Commodity Pools Operated: Updating the 'Qualified Eligible Person'
  Definition; Adding Minimum Disclosure Requirements for Pools and Trading Programs;
  Permitting Monthly Account Statements for Funds of Funds; Technical Amendments",
  **89 FR 78793, published 2024-09-26** (the CFR source credit places the §4.14 change
  at **89 FR 78813**). Diffing the two editions shows it changed only
  §4.14(a)(8)(i)(C)(2): the cross-reference "§ 4.7(a)(1)(iv)" became "§ 4.7(a)(4)" and
  "or otherwise as qualified eligible persons" became "or otherwise qualified eligible
  persons". **§4.14(a)(9) is unchanged.**
- **§4.41: none found.** The 2024 and 2025 annual editions are textually identical
  (diff shows only edition date and print page numbers), and the section's source
  credit still ends at 72 FR 8109, Feb. 23, 2007. The FR API confirms no final rule
  has affected part 4 since the 2025 edition.
- Not amendments (listed for completeness, as they are the only other documents
  affecting part 4 since 2024-01-01): 91 FR 54264 (2026-08-21) — notice of **proposed**
  rulemaking on intermediary registration exemptions and small-pool exemption
  expansion; 91 FR 36774 (2026-06-18) — request for information (fintech); 91 FR 22232
  (2026-04-24) — Form PF joint **proposed** rules. None changes current text.

Source: https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-14/xml?api_key=DEMO_KEY — read 2026-10-16 — 2025-04-01 — U.S. Government Publishing Office
Source: https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-16 — 2025-04-01 — U.S. Government Publishing Office
Source: https://www.federalregister.gov/api/v1/documents.json?conditions%5Bcfr%5D%5Btitle%5D=17&conditions%5Bcfr%5D%5Bpart%5D=4&conditions%5Bpublication_date%5D%5Bgte%5D=2024-01-01 — read 2026-10-16 — no page date — Office of the Federal Register (API)
Source: https://api.govinfo.gov/packages/CFR-2025-title17-vol1/summary?api_key=DEMO_KEY — read 2026-10-16 — 2025-04-01 — U.S. Government Publishing Office

### A.3 (b) CFR sections cited in the existing findings — amended since the 2024 edition?

Basis: edition-to-edition text diffs (17 CFR: 2024 vs 2025; 16 CFR: 2024 vs 2026) plus
the FR API document lists for parts 4, 255 and 465.

| Cited section | Amended since 2024 edition | Evidence |
|---|---|---|
| 17 CFR 4.14(a)(9) | **no** (paragraph unchanged) | 2024↔2025 diff: only (a)(8)(i)(C)(2) changed |
| 17 CFR 4.14(a)(10) | **no** | 2024↔2025 diff: only (a)(8)(i)(C)(2) changed |
| 17 CFR 4.41(a)(3) | **no** | 2024↔2025 diff: no text changes |
| 17 CFR 4.41(b)(1)(i) | **no** | same |
| 17 CFR 4.41(b)(1)(ii) | **no** | same |
| 17 CFR 4.41(b)(2) | **no** | same |
| 17 CFR 4.41(c) | **no** | same |
| 17 CFR 4.41(c)(2) | **no** | same |
| 16 CFR 255.0(a) | **no** | 2024↔2026 diff: no text changes; FR API: nothing affecting part 255 since 88 FR 48092 (2023-07-26, the 2023 Guides revision the 2024 edition already contains) |
| 16 CFR 255.0(f) | **no** | same |
| 16 CFR 255.2(b) | **no** | same |
| 16 CFR 255.2(e)(2)(i)(A) | **no** | same |
| 16 CFR 255.2(e)(10) | **no** | same |
| 16 CFR 255.5(a) | **no** | same |
| 16 CFR Part 465 | **no — part adopted after the 2024 edition** (final rule published 2024-08-22, effective 2024-10-21; 2024 annual edition is as of 2024-01-01 and does not contain it). No amendments since adoption. | FR API: only document ever to affect part 465 after the final rule is none; complete list is ANPR 87 FR 67424 (2022-11-08), NPRM 88 FR 49364 (2023-07-31), hearing notices 89 FR 2526 (2024-01-16), final rule 89 FR 68034 (2024-08-22) |

Source: https://www.federalregister.gov/api/v1/documents.json?conditions%5Bcfr%5D%5Btitle%5D=16&conditions%5Bcfr%5D%5Bpart%5D=465 — read 2026-10-16 — no page date — Office of the Federal Register (API)
Source: https://www.federalregister.gov/api/v1/documents.json?conditions%5Bcfr%5D%5Btitle%5D=16&conditions%5Bcfr%5D%5Bpart%5D=255 — read 2026-10-16 — no page date — Office of the Federal Register (API)
Source: https://api.govinfo.gov/packages/CFR-2026-title16-vol1/granules/CFR-2026-title16-vol1-part255/xml?api_key=DEMO_KEY — read 2026-10-16 — 2026-01-01 — U.S. Government Publishing Office

### A.4 (c) NFA Interpretive Notices 9003 and 9025, summarized

**Notice 9003 — "NFA Compliance Rule 2-29: Communications with the Public and
Promotional Material"** (Board of Directors, effective November 19, 1985; revised July
24, 2000; January 1, 2020; April 22, 2020 and **March 18, 2026**). In own words: the
notice explains how NFA reads Compliance Rule 2-29. "Promotional material" is defined
broadly — every public communication that relates in any way to soliciting commodity
interest business — except routine, spontaneous day-to-day customer contact, which is
governed only by the general prohibition in (a) (no fraud, no high-pressure approach,
no claim that trading suits everyone). Content standards apply to the defined
promotional material: it must not deceive even without proof of intent; misstated or
knowingly omitted facts are violations; risk discussion must balance profit discussion
in prominence; actual-past-profit references need the "past results" qualifier;
performance shown must be representative of all reasonably comparable accounts and
computed net of fees per Part 4/Rule 2-34 methods; testimonials must be
representative, carry the not-indicative-of-future-performance statement and say if
paid. Members must supervise in writing, approve material before first use, keep
records (including the basis for hypothetical results), and may be required to file
material with NFA. Operative sentences, quoted:

> "The definition of 'promotional material' set forth in Compliance Rule 2-29 is broad
> and is intended to apply to all forms of communication with the public by an FCM,
> IB, CPO or CTA Member or Associate without exception if the communication relates in
> any way to solicitation of an account, agreement or transaction in the conduct of
> the Member's or Associate's commodity interest business."

> "That means that routine customer contact will not violate Compliance Rule 2-29 as
> long as it is not fraudulent or deceptive, does not involve a high-pressure approach
> and does not contain any statement indicating that commodity interest trading is
> appropriate for all persons."

> "Subsection (3) requires FCM, IB, CPO and CTA Members and Associates to include a
> discussion of risk to balance any discussion of the possibility of profit in
> promotional material."

> "Compliance Rule 2-29(b)(6) provides that any testimonial used in promotional
> material must be representative of all reasonably comparable accounts, prominently
> state that the testimonial is not indicative of future performance, and, if
> applicable, state that it is a paid testimonial."

> "In addition, all promotional material must be reviewed and approved in writing by
> an appropriate supervisory employee prior to first use."

**Notice 9025 — "Compliance Rule 2-29: Use of Promotional Material Containing
Hypothetical Performance Results"** (Board of Directors, February 1, 1996; revised
August 29, 1996, January 1, 2020 and March 20, 2020). In own words: NFA's history with
hypothetical results is a history of abuse — dramatic hypothetical profits printed
large with disclaimers buried small, disguised as "live" or "real-time" results, or
shown while worse actual results go unmentioned. The Board considered banning
hypothetical performance entirely and instead allows it only under stringent
conditions: the Rule 2-29(c)(1) disclaimer displayed as prominently as the results
themselves (and immediately preceding them when the member has under 12 months of
actual results), a description of all material assumptions (funding, fees, price
basis), calculation consistent with CFTC Part 4, and — once the member holds three
months of actual results for the program — no hypothetical display at all except as
Rule 2-29(c)(6) provides. When hypothetical and actual results are both shown, actual
must get at least equal prominence, separate identification and balanced discussion.
Composite "what-if allocated among advisors" records are hypothetical, not "pro forma",
and must be labeled as hypothetical; extracted performance (cherry-picked components)
is barred unless prior disclosure documents designated that asset percentage;
fee-adjusted pro forma histories are permitted with disclosed assumptions. Printing
the disclaimer does not immunize misleading material. Operative sentences, quoted:

> "Hypothetical results will not be allowed, however, for any trading program for
> which the Member has three months of actual trading results except as provided in
> Compliance Rule 2-29(c)(6)."

> "To prevent the over-emphasis of hypothetical performance results, the disclaimer
> must be displayed as prominently as the hypothetical results themselves."

> "Whenever the FCM, IB, CPO or CTA Member or Associate has less than 12 months of
> actual results, the disclaimer must immediately precede the hypothetical performance
> results."

> "Third, when any FCM, IB, CPO or CTA Member or Associate utilizes promotional
> material that contains both hypothetical and actual performance results, the actual
> results must be presented with at least the same prominence devoted to the
> hypothetical results."

> "The fact that an NFA Member or Associate has printed the disclaimer required
> pursuant to NFA Compliance Rule 2-29 and that the promotional material is in facial
> compliance with this Interpretive Notice does not ensure that the material is not
> misleading."

Both notices bind "FCM, IB, CPO or CTA Member[s] and Associates" — the same NFA
Membership condition recorded for Rule 2-29 in the main rule table (row 9).

Source: https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=9&RuleID=9003 — read 2026-10-16 — no page date — National Futures Association
Source: https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=9&RuleID=9025 — read 2026-10-16 — no page date — National Futures Association
Source: https://www.nfa.futures.org/rulebook/rules.aspx — read 2026-10-16 — no page date — National Futures Association (text-extract source, acquired 2026-10-15)

### A.5 (d) 16 CFR Part 465 — section table

Full CFR text now in `raw/govinfo-16cfr-part465-2026.xml`. Effective date is stated by
the final rule itself: "This rule is effective October 21, 2024." (89 FR 68034,
published 2024-08-22; the part-level CFR source credit cites 89 FR 68077, Aug. 22,
2024 — the page where the codified rule text begins). "Applies to an
education/indicator seller" is read strictly against the rule's own scope: §465.1(a)
defines "business" as "an individual who sells products or services … or any other
commercial entity that sells products or services" — a paid trading-education and
indicator site is such a business.

| Section | Plain summary (from the rule's own text) | Effective date | Applies to an education/indicator seller |
|---|---|---|---|
| §465.1 Definitions | Defines business, consumer review/testimonial, celebrity testimonial, clear and conspicuous, purchase a review, fake indicators of social media influence, immediate relative, insider roles (officers, managers), unfounded legal threat, etc. | Oct. 21, 2024 | **Yes** — supplies the scope; "business" includes any seller of products or services |
| §465.2 Fake or false consumer reviews, consumer testimonials, or celebrity testimonials | Unfair/deceptive practice to create or sell reviews/testimonials that misrepresent that the reviewer exists, used the product, or their experience; also to purchase or disseminate such reviews/testimonials (knowing or should-have-known), including procuring insider reviews via officers/managers/employees/agents/relatives; exception for generalized solicitations and mere review hosting | Oct. 21, 2024 | **Yes** — any fake student/customer testimonial on the site or its ads |
| §465.3 [Reserved] | (empty) | — | — |
| §465.4 Buying positive or negative consumer reviews | Unfair/deceptive to give compensation or incentives in exchange for, or conditioned on, reviews expressing a particular sentiment | Oct. 21, 2024 | **Yes** — e.g., paying only for 5-star student reviews |
| §465.5 Insider consumer reviews and consumer testimonials | Officers/managers must clearly disclose their material relationship in reviews/testimonials; businesses disseminating insider testimonials need that disclosure; soliciting insider reviews without disclosure instructions is barred (exception: generalized solicitations) | Oct. 21, 2024 | **Yes** — instructors/owners posting as "students" without disclosure |
| §465.6 Company-controlled review websites or entities | Barred to misrepresent that a site/entity the business controls provides independent reviews or opinions (other than consumer reviews) | Oct. 21, 2024 | **Yes** — e.g., an "independent" indicator-review site the seller runs |
| §465.7 Review suppression | (a) No one may use unfounded legal threats, physical threats, intimidation or false accusations to prevent or remove a review; (b) businesses may not misrepresent that displayed reviews are "most or all" submitted reviews when negative reviews are suppressed by rating/sentiment (with even-handed moderation exceptions listed) | Oct. 21, 2024 | **Yes** — applies to "anyone"/"a business", including for course/indicator reviews it hosts |
| §465.8 Misuse of fake indicators of social media influence | No one may sell/distribute or purchase/procure fake followers, likes, views etc. known to be fake, for commercial misrepresentation | Oct. 21, 2024 | **Yes** — applies to "anyone"; buying fake followers for the site's channels is in scope |
| §465.9 Severability | Provisions are separate and severable | Oct. 21, 2024 | N/A (housekeeping) |

The rule's civil-penalty basis is not in the part's text (authority: 15 U.S.C. 57a);
penalty exposure runs through FTC Act §5/§57b practice, as summarized from the FTC
release in the prior job's row 16. No section of Part 465 conditions application on
registration, membership, or firm size anywhere in the text.

Source: https://api.govinfo.gov/packages/CFR-2026-title16-vol1/granules/CFR-2026-title16-vol1-part465/xml?api_key=DEMO_KEY — read 2026-10-16 — 2026-01-01 — U.S. Government Publishing Office
Source: https://www.federalregister.gov/api/v1/documents/2024-18519.json?fields%5B%5D=dates&fields%5B%5D=citation&fields%5B%5D=publication_date — read 2026-10-16 — 2024-08-22 — Office of the Federal Register (API)

### A.6 (e) HTTP status per URL tried this run

| URL (method) | Status |
|---|---|
| `https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=9&RuleID=9003` (crawl-fetch) | **200**, valid PDF saved |
| `https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=9&RuleID=9025` (crawl-fetch) | **200**, valid PDF saved |
| `https://api.govinfo.gov/packages/CFR-2026-title17-vol1/granules/CFR-2026-title17-vol1-sec4-14/xml?api_key=DEMO_KEY` (crawl-fetch) | **400** (2026 title-17 edition not published) |
| `https://api.govinfo.gov/packages/CFR-2026-title17-vol1/summary?api_key=DEMO_KEY` (crawl-fetch) | **404** (confirms same) |
| `https://api.govinfo.gov/packages/CFR-2025-title17-vol1/summary?api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-14/xml?api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-41/xml?api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.govinfo.gov/packages/CFR-2026-title16-vol1/granules/CFR-2026-title16-vol1-part465/xml?api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.govinfo.gov/packages/CFR-2026-title16-vol1/granules/CFR-2026-title16-vol1-part255/xml?api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.federalregister.gov/v1/documents.json?...conditions[cfr][part]=4...` (crawl-fetch) | **200 but bot-wall HTML** ("Federal Register :: Request Access") — not usable |
| `https://api.federalregister.gov/v1/documents.json?per_page=1` (crawl-fetch) | **200 but bot-wall HTML** — not usable |
| same documents.json query (WebFetch) | **302 → https://unblock.federalregister.gov/** — not usable |
| `https://api.federalregister.gov/v1/documents.json?...part=4...` (Firecrawl scrape) | **404** (Firecrawl resolved to www host, where /v1/ does not exist) — 1 credit |
| `https://www.federalregister.gov/api/v1/documents.json?...part=4...` (Firecrawl scrape) | **200**, real JSON — 1 credit |
| `https://www.federalregister.gov/api/v1/documents/2024-18519.json?fields[]=dates&...` (crawl-fetch) | **200**, real JSON (single-document API path is not walled) |
| `https://www.federalregister.gov/api/v1/documents.json?...part=465...` (crawl-fetch) | **200**, real JSON |
| `https://www.federalregister.gov/api/v1/documents.json?...part=255...` (crawl-fetch) | **200**, real JSON |
| `https://api.govinfo.gov/packages/FR-2024-08-22/granules?offsetMark=*&pageSize=300&api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.govinfo.gov/packages/FR-2024-08-22/granules/2024-18519/xml?api_key=DEMO_KEY` (crawl-fetch) | **400** (granule XML endpoint rejected) |
| `https://api.govinfo.gov/packages/FR-2024-08-22/granules/2024-18519/summary?api_key=DEMO_KEY` (crawl-fetch) | **200** |
| `https://api.govinfo.gov/packages/FR-2024-08-22/granules/2024-18519/htm?api_key=DEMO_KEY` (crawl-fetch) | **429 OVER_RATE_LIMIT** (DEMO_KEY hourly; superseded — effective date taken from FR API) |

### A.7 Gaps remaining after this run

- **ecfr.gov current-point-in-time text**: still excluded (job Notes say skip; bot wall
  confirmed by prior run). "Current" here = latest annual editions + FR-API amendment
  list, which is complete for final rules through 2026-10-16.
- **2026 annual edition of 17 CFR**: not yet published on govinfo (404 as of
  2026-10-16); the 2025 edition + no-final-rule-since is the best available primary
  basis.
- **Firecrawl credit-usage API**: unreachable from the worker shell (no API key
  available to the worker; never printed). Ledger fallback used: 341/800 this cycle.
- **NFA notice PDF text**: `crawl-pdftotext` remains broken on this box (pdftotext not
  installed), so the quoted notice text comes from the verbatim HTML extract of the
  already-acquired rulebook page, not from the PDFs; the PDFs are saved as the
  standalone acquisitions.

### A.8 Source quality notes (this run)

- All findings rest on primary text: govinfo CFR annual-edition XML, the Federal
  Register documents API, and NFA rulebook endpoints. No law-firm or secondary
  summaries were used, so none needed ⚠ flags.
- The Federal Register wall (prior run's blocker) applies to `api.federalregister.gov`
  and any query-heavy request from this box, but the **single-document and
  conditions-based JSON paths on `www.federalregister.gov/api/v1/` served normally to
  crawl-fetch** — worth remembering for future FR lookups; only the multi-condition
  documents list needed Firecrawl (1 credit).
- Firecrawl scrape of `api.federalregister.gov` silently resolves to the `www` host,
  where `/v1/` does not exist → 404; the working path is
  `www.federalregister.gov/api/v1/...` (1 wasted credit, logged).
- govinfo DEMO_KEY hit its hourly rate limit again (one 429); calls before it were
  spaced and all succeeded.
- The NFA rules.aspx page (source of the notice extracts) was fetched 2026-10-15; the
  notice-9003 header inside it shows a revision dated March 18, 2026, i.e. the
  rulebook copy is current as of that revision date.
- No AI-generated source content was relied on.

<!-- job:J-20261016-11 end -->

<!-- job:J-20261028-05 start -->

## Corrections 2026-10-28

Every quote flagged for this target in `~/crawl/_build-reports/quote-audit/NO-TRACE.md` (4 no-trace + 2 PDF-unchecked), one entry each. Backtick strings are the flagged wordings used as identifiers, not quotations. Quote marks below wrap only text copied exactly from the named raw file.

**`blueprint-edu-compliance/findings.md:130`** (J-20261014-18) — flagged wording `anyone can do this regardless of background/capital/time`: [unverified — no source found] as verbatim text. It appears in no saved raw file, including the run's own extracted rule text `raw/nfa-rule-2-29.md` and the full NFA rulebook listing — NFA Compliance Rule 2-29 is rule text and carries no OTA allegations, so the wording is a paraphrase of the OTA allegation, not source text. The claim's actual source sentence, saved this run:

> "The FTC lawsuit alleges the defendants made false or unsubstantiated earnings claims and challenges their representations that any consumer – regardless of education, background, capital, or time to devote to the "strategy" – can make meaningful income."

copied from `raw/ftc-ota-blog.md`.

Source: https://www.ftc.gov/business-guidance/blog/2020/02/ftc-challenges-online-trading-academys-money-making-claims — read 2026-10-28 — 2020-02-12 — Lesley Fair, FTC Bureau of Consumer Protection

**`blueprint-edu-compliance/findings.md:138`** (J-20261014-18) — flagged wording `it's easy to fake success measures or frame stats in misleading ways`: **corrected** — the passage exists verbatim in the CFTC advisory, saved this run as `raw/cftc-learn-to-trade-advisory.html` (line 441; the page renders the apostrophe curly — it’s):

> "While hard evidence of positive results may indicate a quality course, note that it’s easy to fake success measures or frame stats in misleading ways."

Source: https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/learn_to_trade_without_scam.htm — read 2026-10-28 — no page date — Commodity Futures Trading Commission

**`blueprint-edu-compliance/findings.md:150`** (J-20261014-18) — flagged wording `trading made me a millionaire`: [unverified — PDF, pending pdftotext]. Absent from every searchable cited source, including the IM Mastery settlement release saved this run as `raw/ftc-im-mastery-settlement.md` (grep `millionaire`: no hit). The row's other cited source, `raw/cftc-pulido-order.pdf`, has compressed text streams no tool on this box can extract (pdftotext and pdftoppm both missing; the 2026-10-14 run's 34-credit Firecrawl parse was never saved as a file). Closest sourced language for the same luxury-lifestyle-marketing claim, copied from `raw/ftc-im-mastery-settlement.md`:

> "The defendants focused their deceptive marketing on young people and used social media posts flaunting luxurious and expensive lifestyles, purportedly funded by trading profits and multi-level-marketing commissions."

Source: https://www.ftc.gov/news-events/news/press-releases/2026/05/lead-defendants-im-mastery-academy-mlm-scheme-turn-over-tens-millions-dollars-assets-settle-ftc — read 2026-10-28 — 2026-05-13 — Federal Trade Commission

**`blueprint-edu-compliance/findings.md:166`** (J-20261014-18) — flagged wording `except as provided for in Regulation 4.14(a)(9)`: [unverified — PDF, pending pdftotext]. The phrase appears in no saved raw file — grep for it and for `Regulation 4.14` returns nothing across `raw/govinfo-17cfr-4-14*.xml`, `raw/govinfo-17cfr-4-41*.xml`, the NFA rulebook listing and notices (the notice text discusses Rule 4.14(a)(9) but never with this phrase). Its claimed source is the default-judge language in `raw/cftc-pulido-order.pdf`, unextractable here; CourtListener is bot-walled from this box (API 401, HTML 403 on both crawl-fetch and WebFetch). For the future re-check once pdftotext exists: CFTC Docket No. 1:23-cv-23703-JB (S.D. Fla.), order dated 2024-11-13, per the PDF's embedded metadata (WebFetch read of `raw/cftc-pulido-order.pdf`, not saved separately).

**`blueprint-edu-compliance/findings.md:422`** (J-20261016-11) — flagged wording `This rule is effective October 21, 2024.`: **corrected** — verbatim in the saved Federal Register API record for doc 2024-18519 (89 FR 68034), the value of the `dates` field in `raw/frapi-2024-18519-dates.json`:

> "This rule is effective October 21, 2024."

The audit found no trace because the row's Source lines cite the NFA rulebook pages, not this JSON file.

**`blueprint-edu-compliance/findings.md:424`** (J-20261016-11) — flagged wording `Applies to an education/indicator seller`: [unverified — no source found], and none exists to find — this is findings.md's own table-column heading (the Part 465 section table at line 430), quoted self-referentially in the A.5 narrative. It is not a passage from any source, and no raw file contains it (grep across `raw/`).

Summary: 6 entries — 2 corrected (`findings.md:138`, `findings.md:422`), 4 unverified (`findings.md:130`, `findings.md:424` no source found; `findings.md:150`, `findings.md:166` PDF, pending pdftotext). Credits this run: 2 Firecrawl (1 × IM Mastery release, 1 × OTA blog, both HTTP 200); all other fetches 0-credit.

<!-- job:J-20261028-05 end -->

<!-- job:J-20261031-01 start -->

## Finance + options sections — what Blueprint may say without being advice (2026-10-31)

Educational summary for a paid, non-personalized education site extending from futures
into investing (securities) and options content. Not legal advice; see Gaps for what a
lawyer must still decide. Builds on the two prior sections above (futures/FTC rules).

### What was acquired this run

| File | What it is | How |
|---|---|---|
| `raw/j31-lowe-v-sec.html` | Lowe v. SEC, 472 U.S. 181 — full opinion, syllabus and dissents (decided 1985-06-10) | crawl-fetch (Cornell LII), 0 credits |
| `raw/j31-usc15-80b-2-lii.html` | 15 U.S.C. §80b-2 — Advisers Act definitions incl. §202(a)(11) exclusion letters (A)–(H); page credits run through Pub. L. 119-27 (119th Congress) | crawl-fetch (Cornell LII), 0 credits |
| `raw/j31-cfr-part275-lii.html` | 17 CFR part 275 table of contents (current) — lists 202(a)(1)-1, 202(a)(11)(G)-1, 202(a)(30)-1; no 202(a)(11)-1 | crawl-fetch (Cornell LII), 0 credits |
| `raw/j31-ecfr-275-202a11-1-404.md` | eCFR 404 response for section 275.202(a)(11)-1 ("does not exist in the eCFR after 1/3/2017") | Firecrawl 1 cr, HTTP 404 (evidence of absence) |
| `raw/j31-ecfr-part275-current.md` | Grep evidence from a full render of current eCFR part 275: only §275.202(a)(11)(G)-1 exists under §202(a)(11); strings `275.202(a)(11)-1`, `Lowe v. SEC`, `publisher` — zero hits | Firecrawl 1 cr, HTTP 200 |
| `raw/j31-nasaa-investment-advisers.html` | NASAA Investment Advisers hub (state oversight, $100M AUM split) | crawl-fetch, 0 credits |
| `raw/j31-nasaa-state-ia-registration.html` | NASAA State Investment Adviser Registration Information ("Last Updated: October 2023") | crawl-fetch, 0 credits |
| `raw/j31-occ-odd-page.md` | OCC "Characteristics and Risks of Standardized Options" page — June 2024 ODD edition, Rule 9b-1 distribution duty, supplement mechanics, electronic delivery | Firecrawl 1 cr, HTTP 200 (crawl-fetch + WebFetch 403) |
| `raw/j31-investorgov-opening-options-account.md` | SEC Investor Bulletin "Opening an Options Account" (2015-03-18, updated 2026-07-16) — options account approval and ODD delivery in plain terms | Firecrawl 1 cr, HTTP 200 |

Probe/error files kept in `raw/` (not sources; deletion not permitted): `j31-sec-publishers-exclusion.html`
(403 bot wall), `j31-usc15-80b-2.xml` (govinfo 400), `j31-probe-*.json` (govinfo 429/404/200 probes,
incl. the granule-naming discovery), `j31-cfr-275-202-lii.html` and `j31-cfr-275-202a11-1-lii.html`
(LII 404 probes), `j31-justia-part275.html` (403), `j31-occ-riskstoc.pdf` (403 body, not the PDF).

**Credits this run: 9 of the job's 10-credit cap** — Firecrawl only: 4 × 1-cr scrapes of
which 3 were HTTP 404 (dead starting-source URL `sec.gov/investment/publishers-exclusion`;
two wrong-URL guesses), 2-cr discovery search, 1-cr bulletin scrape, 2 × 1-cr eCFR probes.
All logged in `credits.log`. Zero-credit tools did the rest (crawl-fetch on LII/NASAA/govinfo
probes). Ledger-fallback cycle check (no API key in the worker shell): 356 credits used
since the 2026-10-19 reset before this job + 9 = **365 of 800**, above the 200 floor.
Re-verified today from raw/: §4.41 full 2025-edition text, NFA Rule 2-29 texts, 4.14(a)(9)
(2025 ed.) — files acquired by prior jobs on this target.

### 1. Bottom line

1. Blueprint can sell general-audience education about investing, futures and options without
   registering as an investment adviser or CTA, on two conditions that mirror each other:
   the content stays a publication (Advisers Act §202(a)(11)(D)) and stays non-personalized
   (Lowe; 17 CFR 4.14(a)(9)).
2. On the securities side there is no current SEC rule to lean on: Rule 202(a)(11)-1 is gone
   from the CFR — the statutory exclusion as read in Lowe is the whole framework.
3. The line that ends the exclusion is individualized advice — "attuned to any specific
   portfolio or to any client's particular needs" — or promotional "tout" character
   (Lowe); on the futures side, directing accounts or tailoring advice to a client's
   positions (4.14(a)(9)).
4. Options content carries no ODD delivery duty for Blueprint — that duty is a
   broker-dealer's (Exchange Act Rule 9b-1 plus examining-authority rules); the sound
   practice is referencing the current June 2024 ODD where options are taught.
5. Futures course material that shows simulated results must carry the §4.41(b) statement
   verbatim, prominently, next to the results — §4.41 applies "Regardless of whether the
   commodity pool operator or commodity trading advisor is exempt from registration under
   the Act."
6. Testimonials and endorsements stay under the prior section's FTC/4.41(a)(3) rules.
7. States can reach this too: "All states require that investment advisers … conducting
   business in the state register with the state’s securities regulatory authority (or
   qualify for an exemption)" — NASAA, which also says consult an attorney.
8. Everything here is an educational summary of primary texts; the final call needs a lawyer.

### 2. Rule table

| Rule | Who it applies to | What content it allows | What triggers adviser status | Source |
|---|---|---|---|---|
| Advisers Act §202(a)(11) (15 U.S.C. §80b-2(a)(11)) | Any person compensated for advising about securities, including "through publications or writings" | Selling securities commentary, analyses and reports is a regulated activity, not a free zone — the definition reaches publications directly | "for compensation, engages in the business of advising others … as to the value of securities or as to the advisability of investing in, purchasing, or selling securities," or issuing analyses/reports as a regular business | `raw/j31-usc15-80b-2-lii.html` |
| §202(a)(11)(D) — publisher's exclusion | Publishers of "any bona fide newspaper, news magazine or business or financial publication of general and regular circulation" | General-audience securities commentary and analysis, on a regular schedule, including advice and comment about specific securities; subscription newsletters qualify (Lowe) | Losing the publication's character: content directed at specific parties' situations, or irregular "bulletins … on the advisability of buying and selling stocks"-style touting | `raw/j31-usc15-80b-2-lii.html`; `raw/j31-lowe-v-sec.html` |
| Lowe v. SEC, 472 U.S. 181 (1985) | Publishers of investment newsletters (facts: paid, semimonthly, specific securities commentary, unsavory publisher history) | A paid newsletter with "completely disinterested" content offered "to the general public on a regular schedule" is a §(D) publication, not an adviser | Individualized advice: "advice attuned to any specific portfolio or to any client's particular needs"; delegation of decisionmaking authority; individualized investment-related interactions | `raw/j31-lowe-v-sec.html` |
| Former 17 CFR 275.202(a)(11)-1 (the 1999 "certain publishers" rule) | No one today — not in the current CFR | Nothing: no current SEC rule defines how §(D) applies to websites/newsletters; eCFR 404 for the section, zero occurrences in the full current part 275; LII TOC agrees (only (a)(1)-1, (a)(11)(G)-1, (a)(30)-1 exist) | N/A — but nothing replaces it: there is no safe-harbor rule for electronic publications to rely on | `raw/j31-ecfr-275-202a11-1-404.md`; `raw/j31-ecfr-part275-current.md`; `raw/j31-cfr-part275-lii.html` |
| §202(a)(11)(B) — incidental professions | "any lawyer, accountant, engineer, or teacher whose performance of such services is solely incidental to the practice of his profession" | Classroom/professional teaching where advice is solely incidental to the profession | Not the educator's lane: an education business is not the practice of these professions; the Lowe petitioners proceeded under (D), not (B) | `raw/j31-usc15-80b-2-lii.html` |
| State adviser registration (NASAA) | Advisers doing business in a state (firms ≤ $100M AUM are state-primary; states oversee all IARs) | State registration or a qualifying state exemption — state definitions and exclusions vary and were not acquired here | Conducting an advisory business in the state without registering/qualifying; NASAA: "Registration standards are complex and you should consult an attorney" | `raw/j31-nasaa-investment-advisers.html`; `raw/j31-nasaa-state-ia-registration.html` |
| Exchange Act Rule 9b-1 / ODD distribution | Broker-dealers (and their designated options examining authorities' rules) | Options education itself is unrestricted; the ODD ("Characteristics and Risks of Standardized Options") must be distributed by brokers to customers | Nothing on the educator: no rule makes a course provider deliver the ODD; the duty attaches to the broker at account approval | `raw/j31-occ-odd-page.md`; `raw/j31-investorgov-opening-options-account.md` |
| Futures-side analogs: CEA §1a(12); 17 CFR 4.14(a)(9); 17 CFR 4.41 | Sellers of futures advice/education (prior section rows 1, 3, 5, 6) | Non-personalized futures publication sold to the public without CTA registration; advertising rules still bind | Directing client accounts; advice "based on, or tailored to" particular clients' positions or circumstances | `raw/govinfo-17cfr-4-14-2025.xml`; `raw/govinfo-17cfr-4-41-2025.xml` (re-verified this run) |

Sources (each line stands alone):

Source: https://www.law.cornell.edu/uscode/text/15/80b-2 — read 2026-10-31 — no page date — Cornell Legal Information Institute
Source: https://www.law.cornell.edu/supremecourt/text/472/181 — read 2026-10-31 — 1985-06-10 — U.S. Supreme Court (Cornell LII)
Source: https://www.law.cornell.edu/cfr/text/17/part-275 — read 2026-10-31 — no page date — Cornell Legal Information Institute
Source: https://www.ecfr.gov/current/title-17/chapter-II/part-275/section-275.202(a)(11)-1 — read 2026-10-31 — no page date — Office of the Federal Register
Source: https://www.ecfr.gov/current/title-17/chapter-II/part-275 — read 2026-10-31 — no page date — Office of the Federal Register
Source: https://www.nasaa.org/industry-resources/investment-advisers/ — read 2026-10-31 — no page date — North American Securities Administrators Association
Source: https://www.nasaa.org/industry-resources/investment-advisers/state-investment-adviser-registration-information/ — read 2026-10-31 — no page date — North American Securities Administrators Association
Source: https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document/ — read 2026-10-31 — no page date — Options Clearing Corporation
Source: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-77 — read 2026-10-31 — 2015-03-18 — SEC Office of Investor Education and Assistance
Source: https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-14/xml?api_key=DEMO_KEY — read 2026-10-31 — 2025-04-01 — U.S. Government Publishing Office
Source: https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-31 — 2025-04-01 — U.S. Government Publishing Office
Source: https://www.nfa.futures.org/rulebook/rulesPDF.aspx?Section=4&RuleID=RULE%202-29 — read 2026-10-31 — 2025-07-21 — National Futures Association

### 3. When the OCC options disclosure document must be provided or referenced

The duty belongs to brokers, not educators:

- OCC: "Broker-dealers must distribute the ODD to customers pursuant to Rule 9b-1 under the
  Securities Exchange Act of 1934 as well as in accordance with the rules of the broker-dealer’s
  designated options examining authority." Electronic delivery "is permissible if the requirements
  for electronic delivery as established by the SEC are met." (`raw/j31-occ-odd-page.md`)
- Timing, in the SEC's plain-words bulletin: "Before you can trade options, your broker must
  approve your brokerage account for options trading," and "SEC and FINRA rules require brokers
  to provide certain disclosures to all potential options investors. For example, your broker
  must provide you with a copy of a publication from the Options Clearing Corporation called
  'Characteristics and Risks of Standardized Options.'" (`raw/j31-investorgov-opening-options-account.md`)
  (FINRA rules are named as a source by the SEC bulletin; finra.org is a dead source here —
  cite by rule number and link only.)
- Which edition: the June 2024 ODD "supersedes and replaces the prior ODD and supplements,"
  and "prior versions of the ODD, including the March 2023 ODD and all prior versions, should
  no longer be distributed." The one-page June 2024 Supplement was a one-time option for
  customers who already had the March 2023 ODD; "all other individuals should receive the full
  June 2024 ODD." Future updates will be whole new versions. (`raw/j31-occ-odd-page.md`)
- For readers, OCC states the reading rule: "Prior to buying or selling an option, investors
  must read a copy of the Characteristics and Risks of Standardized Options." (`raw/j31-occ-odd-page.md`)

For Blueprint: no statute or rule found this run makes a non-broker course provider deliver
the ODD. Referencing it is nonetheless the defensible practice: link the current June 2024
ODD (theocc.com page above carries the PDF) where options mechanics or strategies are
taught, and note students will receive it from their broker at account approval. OCC's own
Quick Guide "is not a substitute for the ODD" — reference the ODD itself, not a summary.

### 4. Recommended disclaimer wording and placement per course type

Drafts below are the worker's assembly of prescribed texts and regulator statements — every
normative element carries its source. They are educational templates for lawyer review,
not settled legal language.

**(a) Futures courses.**

1. If any simulated/hypothetical/backtested result is shown anywhere in the course (videos,
   PDFs, landing pages, ads), the §4.41(b)(1)(i) statement must accompany it, verbatim:

   > "These results are based on simulated or hypothetical performance results that have
   > certain inherent limitations. Unlike the results shown in an actual performance record,
   > these results do not represent actual trading. Also, because these trades have not
   > actually been executed, these results may have under-or over-compensated for the impact,
   > if any, of certain market factors, such as lack of liquidity. Simulated or hypothetical
   > trading programs in general are also subject to the fact that they are designed with the
   > benefit of hindsight. No representation is being made that any account will or is likely
   > to achieve profits or losses similar to these being shown."

   Placement: "prominently disclosed and in immediate proximity to the simulated or
   hypothetical performance" (§4.41(b)(2)) — on the same screen/page as the results, not a
   linked footer. This binds even an exempt publisher (§4.41(c)(2): "Regardless of whether
   the commodity pool operator or commodity trading advisor is exempt from registration").
   Source: `raw/govinfo-17cfr-4-41-2025.xml`.
2. Testimonials, if used, need the three §4.41(a)(3) disclosures next to the testimonial:
   may not be representative of other clients' experience; no guarantee of future
   performance or success; paid-testimonial status if more than a nominal sum was paid.
   Source: `raw/govinfo-17cfr-4-41-2025.xml`; plus the prior section's FTC rules (16 CFR
   255/465) for material-connection disclosure.
3. Profit mentions: §4.41 itself has no equal-prominence rule, but NFA's member rule — no
   promotional material "mentions the possibility of profit unless accompanied by an equally
   prominent discussion of the risk of loss," and any reference to actual past profits must
   state "past results are not necessarily indicative of future results" (Rule 2-29(b)(3)–(4)) —
   is the stated industry norm worth adopting voluntarily. Source: `raw/nfa-rule-2-29.md`.
4. Non-advice statement (worker's draft, anchored to 4.14(a)(9)'s own terms): state that the
   course is general education, that no client accounts are directed, and that nothing is
   tailored to any subscriber's positions or circumstances. Source:
   `raw/govinfo-17cfr-4-14-2025.xml`.

**(b) Options courses.**

1. An ODD reference block where options are taught (worker's draft, anchored to OCC's own
   statements): link the current June 2024 "Characteristics and Risks of Standardized
   Options" from theocc.com, state that options involve substantial risk and that readers
   should read the ODD before trading, and that their broker will provide it when their
   account is approved for options. Anchors: `raw/j31-occ-odd-page.md` ("Prior to buying or
   selling an option, investors must read a copy…"), `raw/j31-investorgov-opening-options-account.md`
   (account approval; broker provision). Check the link each time a new ODD version issues —
   OCC warns versions change and old ones "should no longer be distributed."
2. Non-advice statement as in (a)4: no prescribed securities-side wording exists (no current
   rule under §202(a)(11)(D) — see table), so anchor to the statute's own concept: commentary
   "of general and regular circulation," not advice "attuned to any specific portfolio or to
   any client's particular needs" (Lowe).

**(c) Personal finance courses.**

1. Scope statement (worker's draft): describe content as general financial education about
   concepts and publicly available products, not recommendations to buy or sell any
   security, and not tailored to any reader's objectives, financial condition or needs.
   Anchors: §202(a)(11)(D) publication language and Lowe's individualized-advice line
   (`raw/j31-usc15-80b-2-lii.html`; `raw/j31-lowe-v-sec.html`).
2. If the course or its marketing carries student success stories, instructor endorsements,
   affiliate links or paid promotion, the prior section's FTC rules apply unchanged
   (16 CFR 255.5(a) clear-and-conspicuous/unavoidable material-connection disclosure;
   16 CFR Part 465 bans on fake, purchased or insider reviews; `raw/govinfo-16cfr-part255-2026.xml`,
   `raw/govinfo-16cfr-part465-2026.xml`).
3. Placement norm common to all three course types: put the disclaimer on the same view as
   the material it qualifies — the only codified placement rules found are §4.41(b)(2)'s
   "prominently disclosed and in immediate proximity" (futures, simulated results) and the
   FTC's "unavoidable" standard (endorsements); other placements are best practice, not
   codified.

### 5. Gaps

- **Starting-source URL dead:** `https://www.sec.gov/investment/publishers-exclusion`
  returns 404 (1 credit); no SEC page of that name exists. Statute text obtained via LII.
- **Rule 202(a)(11)-1 removal history not traced** — when and by what action the 1999
  publisher rule left the CFR (relocation vs. removal) was not determined; only its current
  absence is established, from three agreeing current sources. An eCFR point-in-time or
  Federal Register search would settle it.
- **ODD PDF not acquired** — theocc.com `getmedia` 403s crawl-fetch and WebFetch; a
  Firecrawl PDF parse bills per page (~150+ pages), far over budget. ODD facts here rest on
  OCC's page and the SEC bulletin.
- **govinfo annual-edition cross-check blocked** — CFR-2025-title17-vol3 probes hit DEMO_KEY
  429s all run; current-state rests on eCFR + LII instead.
- **State-level adviser definitions/publisher exclusions not acquired** — NASAA defers to
  each state; whether Blueprint's home state mirrors §202(a)(11)(D) is a lawyer question
  (NASAA itself says so).
- **SEC 2019 Commission Interpretation** (standard-of-conduct discussion of the publisher's
  exclusion) and **Form ADV delivery obligations** for registered advisers were not fetched
  (outside the stated task; budget held at 9/10).
- **FINRA options-account rules** (named by the SEC bulletin as co-source of the ODD
  requirement) cited by reference only — finra.org is a dead source per DEAD-SOURCES.md.
- **Not legal advice** — this section is an educational summary of primary texts; a
  securities lawyer should approve final wording, especially for any interactive/student
  Q&A features (Lowe's individualization line is the risk area).

### 6. Second-pass verification (reported separately)

After writing, every quoted substring above was re-grepped (`grep -c -F`) against its
cited raw file — 21 checks, all present. The pass caught 4 defects in this section's own
first-pass text, corrected in place before the job closed:

1. OCC quote used a straight apostrophe in "broker-dealer's"; the saved page has the curly
   "broker-dealer’s" — corrected to match the raw glyph.
2. NASAA quote used a straight apostrophe in "state's securities regulatory authority";
   raw has "state’s" — corrected.
3. The NFA 2-29(b)(3) fragment was misquoted as «"mention[] of the possibility of
   profit…"»; the rule text reads "mentions the possibility of profit unless accompanied
   by an equally prominent discussion of the risk of loss" — corrected to the exact words.
4. Bottom-line item 5 quoted a lowercased, ellipsized §4.41(c)(2) fragment that matches no
   contiguous source text; replaced with the exact sentence "Regardless of whether the
   commodity pool operator or commodity trading advisor is exempt from registration under
   the Act."

Also verified: both job markers present; Source-line URLs match the fetched URLs
character-for-character; ledger lines for this job sum to 9 credits.

### 7. Source quality notes

- Primary sources throughout: the U.S. Code and a Supreme Court opinion via Cornell LII,
  the current eCFR, OCC's own ODD page, an SEC staff bulletin, NASAA pages, and prior-run
  govinfo/NFA texts re-verified this run. No law-firm blogs, no secondary summaries.
- The job note says "save every page with crawl-fetch before quoting." Held for every
  crawl-fetch-reachable page; sec.gov, investor.gov, theocc.com and ecfr.gov all 403 the
  box on crawl-fetch (and WebFetch), so those pages are Firecrawl renders saved to `raw/`
  as `.md` — same practice as the J-20261028-05 corrections section, flagged per file in
  header comments.
- LII mirrors were used because uscode.house.gov granule URLs have failed before on this
  box and govinfo DEMO_KEY 429'd; the LII statute page carries amendment credits through
  the 119th Congress. Quotes were verified by grep against the saved HTML.
- The full eCFR part-275 render (263 KB) lives in a harness tool-results path, not `raw/`;
  `raw/j31-ecfr-part275-current.md` records the grep evidence (section-number lists) and
  no body text is quoted from the tool-results file.
- 4 of 9 Firecrawl credits were spent on 404s (one dead starting-source URL, two URL
  guesses before switching to search-first, one deliberate 404 probe that produced the
  rule-absence evidence). Logged truthfully in `credits.log`.
- No AI-generated source content was relied on; no `utm_source=chatgpt` patterns seen.
- NASAA state-registration page self-labels "Last Updated: October 2023" — current enough
  for the general proposition cited; per-state links were not followed.

<!-- job:J-20261031-01 end -->

<!-- job:J-20261031-14 start -->

## Corrections 2026-10-31

One quote flagged for this target by crawl-quote-check (run J-20261031-01-20261031T085709Z), listed in the "Quote gate 2026-10-31" section of `progress.md`. Backtick strings are flagged wordings used as identifiers, not quotations. Quote marks below wrap only text copied exactly from the named raw file.

**`blueprint-edu-compliance/findings.md:740`** (J-20261031-01) — flagged wording `prominently disclosed and in immediate proximity`: **corrected** — the phrase is verbatim §4.41(b)(2) text, present in two saved raw files. The gate fired because the numbered item at lines 738–742 quotes §4.41(b)(2) with no raw-file citation of its own; the nearest raw citations (lines 736–737) are `raw/govinfo-16cfr-part255-2026.xml` and `raw/govinfo-16cfr-part465-2026.xml`, which contain neither fragment (grep -F "immediate proximity": 0 hits in both). The full sentence, copied exactly from `raw/govinfo-17cfr-4-41.xml` (line 37; identical at `raw/govinfo-17cfr-4-41-2025.xml` line 34, the latest published edition):

> "(2) If the presentation of such simulated or hypothetical performance is other than oral, the prescribed statement must be prominently disclosed and in immediate proximity to the simulated or hypothetical performance being presented."

The same passage is quoted with its citation earlier in the same job's section (findings.md lines 691–695, Source `raw/govinfo-17cfr-4-41-2025.xml`), so the underlying claim stands; only the line-740 instance lacked its raw path.

Source: https://api.govinfo.gov/packages/CFR-2025-title17-vol1/granules/CFR-2025-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-31 — 2025-04-01 — U.S. Government Publishing Office

Source: https://api.govinfo.gov/packages/CFR-2024-title17-vol1/granules/CFR-2024-title17-vol1-sec4-41/xml?api_key=DEMO_KEY — read 2026-10-15 — 2024-04-01 — U.S. Government Publishing Office

Summary: 1 entry — 1 corrected, 0 unverified. Credits this run: 0 (no fetches; the quote was located by grep -F in raw files saved by prior jobs).

<!-- job:J-20261031-14 end -->

<!-- job:J-20261103-04 start -->

## Florida adviser and insurance rules for Blueprint's finance and insurance pages (2026-11-03)

State-level fill for the gap the prior sections left open: Blueprint operates from Florida
(Shane Turner LLC), so beyond the federal framework above (Lowe, §202(a)(11)(D),
17 CFR 4.14(a)(9), 4.41), the Florida Securities and Investor Protection Act (Fla. Stat.
ch. 517), the OFR's administrative rules (Fla. Admin. Code ch. 69W), the Florida Insurance
Code (Fla. Stat. chs. 624/626) and NASAA's model publisher-exclusion language now apply.
Educational summary of primary texts; not legal advice.

### What was acquired this run

| File | What it is | How |
|---|---|---|
| `raw/j1103-fla517-021.html` | Fla. Stat. § 517.021 — Definitions (incl. "Investment adviser" at (20)) | crawl-fetch (leg.state.fl.us), 0 credits |
| `raw/j1103-fla517-12.html` | Fla. Stat. § 517.12 — Registration of dealers, associated persons, intermediaries, and investment advisers (incl. the CTA carve-out at (19)) | crawl-fetch, 0 credits |
| `raw/j1103-fla624-10.html` | Fla. Stat. § 624.10 — Other definitions ("Transact" with respect to insurance at (5)) | crawl-fetch, 0 credits |
| `raw/j1103-fla626-015.html` | Fla. Stat. § 626.015 — Definitions (incl. "Unaffiliated insurance agent" at (20)) | crawl-fetch, 0 credits |
| `raw/j1103-fla626-112.html` | Fla. Stat. § 626.112 — License and appointment required; agents, customer representatives, and adjusters (solicitation definition at (1)(b), unlicensed-transacting felony at (10)) | crawl-fetch, 0 credits |
| `raw/j1103-fla626-7315.html` | Fla. Stat. § 626.7315 — Prohibition against the unlicensed transaction of general lines insurance (fee-based advising ban at (4)) | crawl-fetch, 0 credits |
| `raw/j1103-fla626-8305.html` | Fla. Stat. § 626.8305 — Prohibition against the unlicensed transaction of health insurance | crawl-fetch, 0 credits |
| `raw/j1103-fla626-906.html` | Fla. Stat. § 626.906 — Acts constituting CFO as process agent (transacting-acts list for unauthorized insurers) | crawl-fetch, 0 credits |
| `raw/j1103-fla626-full.html` | Entire Fla. Stat. ch. 626 (1.6 MB) — used to locate the advising/soliciting provisions above | crawl-fetch, 0 credits |
| `raw/j1103-fla517-contents.html`, `raw/j1103-fla624-contents.html`, `raw/j1103-fla626-contents.html` | Chapter contents indexes (section-title discovery) | crawl-fetch, 0 credits |
| `raw/j1103-flrules-69w-600-0016.md` | Fla. Admin. Code 69W-600.0016 rule page — Application for Registration as an Investment Adviser (State Registered); effective 9/16/2025; rule text is a .doc link (see Gaps) | Firecrawl 1 cr (crawl-fetch 403), HTTP 200 |
| `raw/j1103-flrules-69w-600-0017.md` | 69W-600.0017 rule page — Notice-Filing for Federal Covered Advisers; effective 3/21/2024; .doc text link | Firecrawl 1 cr, HTTP 200 |
| `raw/j1103-flrules-69w-600-chapter.md` | 69W-600 chapter index (all 44 rule titles) — evidence that no adviser-exemption rule exists in the chapter | Firecrawl 1 cr, HTTP 200 |
| `raw/j1103-nasaa-2002-uniform-securities-act.pdf` + `.txt` | 2002 Uniform Securities Act (NASAA-hosted) — § 102(15) adviser definition with the model publisher exclusion at (D); Official Comment quoted | crawl-fetch PDF (0 cr) + crawl-pdftotext extract |
| `raw/j1103-nasaa-1956-uniform-securities-act.pdf` + `.txt` | 1956 Uniform Securities Act (NASAA-hosted, scanned) — § 401(f) adviser definition with the 1956 publisher exclusion at (f)(4) | crawl-fetch PDF (0 cr) + crawl-pdftotext extract |
| `raw/j1103-nasaa-usa-model-language-extract.md` | Verbatim extract of the USA passages quoted below (PDF line wraps joined; transformation documented in its header) | 0 credits |
| `raw/j1103-nasaa-uniform-securities-acts.html`, `raw/j1103-nasaa-adopted-model-rules.html` | NASAA discovery pages (USA document links; adopted model-rule list — none of the adopted model rules concerns the publisher exclusion) | crawl-fetch, 0 credits |
| `raw/j1103-flofr-home.html` | flofr.gov homepage (probe; no rule content used) | crawl-fetch, 0 credits |

Probe/error notes (no files left): `https://flofr.gov/divisions/securities/` → HTTP 404;
`https://www.flrules.org/gateway/ChapterHome.asp?Chapter=69W` → HTTP 403 to crawl-fetch
(the per-chapter form `Chapter=69W-600` works; WebFetch used for discovery at 0 credits).
flrules rule text is served only as `.doc` files — linked and marked unchecked per job Notes,
not quoted.

**Credits this run: 3 of the job's 6-credit cap** (3 × 1-cr Firecrawl scrapes of flrules.org,
all HTTP 200; logged in `credits.log`). Firecrawl balance API unreachable from the worker
shell; ledger-fallback cycle check: ~390 of 800 used since the 2026-10-19 reset, above the
200-credit floor. All statute, PDF and NASAA fetches were 0-credit (crawl-fetch,
crawl-pdftotext).

### Rule table

"Applies to Blueprint" is the worker's reading of each cited text against the job's stated
facts (paid, non-personalized futures/finance/insurance education site operating from
Florida). Summary of what the rules say, not legal advice.

| # | Citation | Plain summary | Applies to Blueprint | Condition |
|---|---|---|---|---|
| 1 | Fla. Stat. § 517.021(20)(a) | "Investment adviser" = a person (other than an associated person of an adviser or a federal covered adviser) that receives compensation and engages for all or part of its time, directly or through publications or writings, in the business of advising others as to the value of securities or the advisability of investing in, purchasing, or selling securities | Conditional — this is the hook if the finance pages advise about securities | Requires compensation + "business of advising others"; no registration arises from one-off or clearly non-advisory content |
| 2 | Fla. Stat. § 517.021(20)(b)1–9 | Exclusions from the definition: dealer-incidentals, attorneys/CPAs, banks, bank holding companies, trust companies, advice exclusively to insurance/investment companies, **fewer than six Florida clients in preceding 12 months**, federal covered advisers, governmental entities — **no publisher or general-education exclusion** | Conditional | The de minimis (b)7 (< 6 Florida "clients") is the only exclusion a small publisher could sit inside; subscriber counts and the SEC Rule 275.222-2 meaning of "client" make this a lawyer question |
| 3 | Fla. Stat. § 517.12(3) | No investment adviser may engage in business from offices in Florida or render investment advice to Florida persons, by mail or otherwise, unless registered under ch. 517 (or a federal covered adviser that notice-filed under § 517.1201) | Yes, if rows 1–2 put Blueprint inside the definition | Registration is the consequence of the definition; conduct from Florida to Florida persons is squarely in the territorial hook |
| 4 | Fla. Stat. § 517.12(19) | Ch. 517's investment-adviser registration requirements do not apply to a **commodity trading adviser registered with the CFTC** (or one advising on PHLX-listed currency options for "appropriate persons"); the exemption fails if the CTA engages in other activities requiring registration | No — Blueprint's plan relies on 17 CFR 4.14(a)(9), i.e. **not** CFTC-registered | The carve-out is unusable for an unregistered/exempt CTA; whether futures-only content escapes § 517.021's "securities" scope at all is a lawyer question |
| 5 | Fla. Admin. Code 69W-600.0016 | Application for registration as a state investment adviser (Form ADV through IARD; rulemaking authority § 517.03(1), § 517.12, § 517.121(1) FS; effective 9/16/2025) | Only if Blueprint registers | Rule text exists only as a .doc — linked, marked unchecked, not quoted |
| 6 | Fla. Admin. Code 69W-600.0017 | Notice-filing for federal covered advisers (law implemented § 517.1201 FS; effective 3/21/2024) | Only if Blueprint ever SEC-registers | Same .doc caveat |
| 7 | Fla. Admin. Code ch. 69W-600 (chapter index) | The registration chapter contains no investment-adviser **exemption** rule; the only "exemption" rules concern issuers (Florida Limited Offering, 69W-600.0018) | Confirms the exemption picture is statutory only | The < 6-clients de minimis (row 2) is the operative statutory exclusion |
| 8 | Fla. Stat. § 624.10(5) | "Transact," with respect to insurance, includes solicitation or inducement, preliminary negotiations, effectuation of a contract of insurance, and matters subsequent to effectuation arising out of it | Yes — defines the trigger for insurance licensing duties | Applies "in addition to other applicable provisions of this code" |
| 9 | Fla. Stat. § 626.112(1)(a), (b) | No one may act as an insurance agent/adjuster/customer representative unlicensed; a license is required to engage in **solicitation** — defined as the attempt to persuade any person to purchase an insurance product by describing benefits/terms, distributing an invitation to contract, making general or specific recommendations, completing orders/applications, **comparing insurance products, advising as to insurance matters, or interpreting policies or coverages** | Yes — this is the line for the insurance education pages | Education that does not attempt to persuade a purchase of an insurance product is outside the solicitation definition; product comparisons/advice about insurance matters cross it |
| 10 | Fla. Stat. § 626.112(10) | Knowingly transacting insurance or engaging in insurance activities without a license (or aiding an unlicensed person) is a **felony of the third degree** | Yes — the stakes if insurance pages cross row 9 | Knowledge required |
| 11 | Fla. Stat. § 626.7315(4) | In Florida, no one may engage or hold out as engaging in the business of analyzing or abstracting insurance policies, or counseling/advising/giving opinions about insurance or insurance contracts **for fee, commission, or other compensation**, unless licensed as a general lines agent (exceptions: licensed attorneys; salaried bona fide full-time employees advising their own employer) | Yes — if Blueprint charges for insurance-advice content or services | The hook is the business of advising for compensation; general-audience education with no product recommendation is a fact question — see paragraph below |
| 12 | Fla. Stat. § 626.8305(2) | Health-insurance analog: unlicensed analyzing/counseling/advising barred unless the individual is a consulting actuary advising insurers, an employee counseling their own entity's benefit plans, or a trustee advising trust parties | Yes — same reading as row 11 for health-insurance topics | Narrower exceptions than row 11 (no explicit attorney carve-out here) |
| 13 | Fla. Stat. § 626.015(20) | "Unaffiliated insurance agent" — the license category Florida created for exactly the fee-based independent consultant: a licensed insurance agent, self-appointed, practicing as an independent consultant in analyzing/abstracting policies, providing insurance advice or counseling, or making specific recommendations/comparisons **for a fee established in advance by written contract**; may not be affiliated with an insurer, appointed agent, or such an agency | Shows the sanctioned route if Blueprint ever sells insurance advice | Emphasizes that Florida treats fee-based insurance advice as licensed activity, not free speech |
| 14 | 2002 Uniform Securities Act § 102(15)(D) (NASAA model) | Model state-law publisher exclusion: "investment adviser" does not include "a publisher of a bona fide newspaper, news magazine, or business or financial publication of general and regular circulation"; Official Comment: intended to reach Internet/electronic publishers **only if** bona fide + general and regular circulation | Not Blueprint's protection — Florida's ch. 517 did not adopt it | Model text only; (G) also imports IAA exclusions by reference — also absent from Fla. Stat. |
| 15 | 1956 Uniform Securities Act § 401(f)(4) (NASAA model) | Earlier model publisher exclusion: "a publisher of any bona fide newspaper, news magazine, or business or financial publication of general, regular, and paid circulation" — the "paid" addition existed to keep free "tipster sheets" used to recruit paying clients out of the exclusion | Same — historical model language | Shows the model lineage Florida's pre-2012 statute mirrored but the current § 517.021 does not |

Sources (each line stands alone):

Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0500-0599/0517/Sections/0517.021.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0500-0599/0517/Sections/0517.12.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0600-0699/0624/Sections/0624.10.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0600-0699/0626/Sections/0626.015.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0600-0699/0626/Sections/0626.112.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0600-0699/0626/Sections/0626.7315.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0600-0699/0626/Sections/0626.8305.html — read 2026-11-03 — no page date — Florida Legislature
Source: http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0600-0699/0626/Sections/0626.906.html — read 2026-11-03 — no page date — Florida Legislature
Source: https://www.flrules.org/gateway/RuleNo.asp?title=REGISTRATION%20OF%20DEALERS,%20INVESTMENT%20ADVISERS,%20ASSOCIATED%20PERSONS&ID=69W-600.0016 — read 2026-11-03 — 2025-09-16 — Florida Department of State (flrules.org)
Source: https://www.flrules.org/gateway/RuleNo.asp?title=REGISTRATION%20OF%20DEALERS,%20INVESTMENT%20ADVISERS,%20ASSOCIATED%20PERSONS&ID=69W-600.0017 — read 2026-11-03 — 2024-03-21 — Florida Department of State (flrules.org)
Source: https://www.flrules.org/gateway/ChapterHome.asp?Chapter=69W-600 — read 2026-11-03 — no page date — Florida Department of State (flrules.org)
Source: https://www.nasaa.org/wp-content/uploads/2021/09/2002-Uniform-Securities-Act.pdf — read 2026-11-03 — no page date — North American Securities Administrators Association
Source: https://www.nasaa.org/wp-content/uploads/2021/09/1956-Uniform-Securities-Act.pdf — read 2026-11-03 — no page date — North American Securities Administrators Association

### Exact definitions, quoted from raw/

**1. Fla. Stat. § 517.021(20)(a) — "Investment adviser"** (`raw/j1103-fla517-021.html`):

> “Investment adviser” means a person, other than an associated person of an investment adviser or a federal covered adviser, that receives compensation, directly or indirectly, and engages for all or part of the person’s time, directly or indirectly, or through publications or writings, in the business of advising others as to the value of securities or as to the advisability of investments in, purchasing of, or selling of securities.

The exclusions that follow, at (b)1–9, are: dealer/associated person incidentals; licensed
attorney or CPA incidentals; banks; bank holding companies; trust companies; persons
rendering advice exclusively to insurance or investment companies; the de minimis; federal
covered advisers; and governmental entities. **No publisher, newspaper or education
exclusion appears anywhere in the list.** The de minimis, at (b)7, quoted (`raw/j1103-fla517-021.html`):

> A person that, during the preceding 12 months, has fewer than six clients who are residents of this state. As used in this subparagraph, the term “client” has the same meaning as provided in Securities and Exchange Commission Rule 275.222-2, 17 C.F.R. s. 275.222-2, as amended.

**2. Fla. Stat. § 517.12(3) — registration requirement** (`raw/j1103-fla517-12.html`;
the statutory cross-reference "517.1201" sits between the two spans as a page link):

> No investment adviser or associated person of an investment adviser or federal covered adviser shall engage in business from offices in this state, or render investment advice to persons of this state, by mail or otherwise, unless the federal covered adviser has made a notice-filing with the office pursuant to s.

> or the investment adviser is registered pursuant to the provisions of this chapter and associated persons of the federal covered adviser or investment adviser have been registered with the office pursuant to this section.

**3. Fla. Stat. § 517.12(19) — the CTA carve-out** (`raw/j1103-fla517-12.html`):

> The registration requirements of this section which apply to investment advisers and associated persons do not apply to a commodity trading adviser who:

> Is registered as such with the Commodity Futures Trading Commission pursuant to the Commodity Exchange Act.

> The exemption provided in this subsection does not apply to a commodity trading adviser who engages in other activities that require registration under this chapter.

**4. Fla. Stat. § 624.10(5) — "Transact"** (`raw/j1103-fla624-10.html`):

> “Transact” with respect to insurance includes any of the following, in addition to other applicable provisions of this code:

with (a) "Solicitation or inducement.", (b) "Preliminary negotiations.",
(c) "Effectuation of a contract of insurance.", and (d) "Transaction of matters subsequent
to effectuation of a contract of insurance and arising out of it." (same file).

**5. Fla. Stat. § 626.112(1)(a) — license required** (`raw/j1103-fla626-112.html`):

> No person may be, act as, or advertise or hold himself or herself out to be an insurance agent, insurance adjuster, or customer representative unless he or she is currently licensed by the department and appointed by an appropriate appointing entity or person.

**6. Fla. Stat. § 626.112(1)(b) — solicitation definition** (`raw/j1103-fla626-112.html`):

> Except as provided in subsection (6) or in applicable department rules, and in addition to other conduct described in this chapter with respect to particular types of agents, a license as an insurance agent, service representative, customer representative, or limited customer representative is required in order to engage in the solicitation of insurance. For purposes of this requirement, as applicable to any of the license types described in this section, the solicitation of insurance is the attempt to persuade any person to purchase an insurance product by:

The enumerated means include (1) "Describing the benefits or terms of insurance coverage,
including premiums or rates of return;", (3) "Making general or specific recommendations
as to insurance products;", and (5) "Comparing insurance products, advising as to insurance
matters, or interpreting policies or coverages; or" (same file). Subsection (6), the only
exception referenced, covers insurer salaried officers soliciting alongside a licensed
agent — no education carve-out. Subsection (10), quoted (`raw/j1103-fla626-112.html`;
statutory cross-references 775.082/.083/.084 follow as links):

> Any person who knowingly transacts insurance or otherwise engages in insurance activities in this state without a license in violation of this section or who knowingly aids or abets an unlicensed person in transacting insurance or otherwise engaging in insurance activities in this state without a license commits a felony of the third degree, punishable as provided in s.

**7. Fla. Stat. § 626.7315(4) — fee-based insurance advising** (`raw/j1103-fla626-7315.html`):

> In this state, engage or hold himself or herself out as engaging in the business of analyzing or abstracting insurance policies or of counseling or advising or giving opinions, other than as a licensed attorney at law, relative to insurance or insurance contracts, for fee, commission, or other compensation, other than as a salaried bona fide full-time employee so counseling and advising his or her employer relative to the insurance interests of the employer and of the subsidiaries or business affiliates of the employer;

**8. Fla. Stat. § 626.8305(2) — health-insurance analog** (`raw/j1103-fla626-8305.html`):

> In this state, engage or hold himself or herself out as engaging in the business of analyzing or abstracting insurance policies or of counseling or advising or giving opinions to persons relative to insurance contracts, unless the individual is:

with exceptions (a) "A consulting actuary advising insurers;" and (b) "An employee of a
labor union, association, employer, or other business entity, or the subsidiaries and
affiliates of each, who counsels and advises such entity or entities relative to their
interests and those of their members or employees under insurance benefit plans; or"
(same file).

**9. Fla. Stat. § 626.015(20) — "Unaffiliated insurance agent"** (`raw/j1103-fla626-015.html`):

> “Unaffiliated insurance agent” means a licensed insurance agent, except a limited lines agent, who is self-appointed and who practices as an independent consultant in the business of analyzing or abstracting insurance policies, providing insurance advice or counseling, or making specific recommendations or comparisons of insurance products for a fee established in advance by written contract signed by the parties.

**10. Fla. Admin. Code 69W-600.0016 / 69W-600.0017 — [unchecked, not quoted].** The rule
text on flrules.org is served only as Word documents (`.doc` links on the saved rule pages,
`raw/j1103-flrules-69w-600-0016.md` and `raw/j1103-flrules-69w-600-0017.md`):
69W-600.0016.doc (tid 29940134) and 69W-600.0017.doc (tid 28114982). Verified from the
saved pages only: rule titles ("Application for Registration as an Investment Adviser
(State Registered)", "Notice-Filing for Federal Covered Advisers"), effective dates
(9/16/2025; 3/21/2024), rulemaking authority (517.03(1), 517.12, 517.121(1) FS; 517.03(1),
517.1201 FS) and the incorporated forms (Form ADV 8-22, Form ADV-W, Form U4/U5). The
chapter index (`raw/j1103-flrules-69w-600-chapter.md`) lists no investment-adviser
exemption rule.

**11. NASAA model publisher-exclusion language** (2002 Uniform Securities Act § 102(15)(D)
and Official Comment; 1956 Act § 401(f)(4)) — quoted from the verbatim extract
`raw/j1103-nasaa-usa-model-language-extract.md` (PDF text layers hard-wrap; joins documented
in that file's header):

> (D) a publisher of a bona fide newspaper, news magazine, or business or financial publication of general and regular circulation;

> The exclusion in Section 102(15)(D) is intended to exclude publishers of Internet or electronic media, but only if the Internet or electronic media publication or website satisfies the “bona fide” and “publication of general and regular circulation” requirements.

> that a person who periodically distributes a ‘tipster sheet’ free as a way to get paying clients is not excluded from the definition as a ‘publisher.’

> (4) a publisher of any bona fide newspaper, news magazine, or business or financial publication of general, regular, and paid circulation;

For contrast, the 2002 model definition itself reads (`raw/j1103-nasaa-usa-model-language-extract.md`):

> “Investment adviser” means a person that, for compensation, engages in the business of advising others, either directly or through publications or writings, as to the value of securities or the advisability of investing in, purchasing, or selling securities or that, for compensation and as a part of a regular business, issues or promulgates analyses or reports concerning securities.

### What Blueprint's finance and insurance pages may say

**Finance pages.** The federal sections above let Blueprint teach investing concepts as a
non-personalized publication (Lowe + §202(a)(11)(D)); Florida adds risk on top because
§ 517.021(20) contains **no publisher exclusion** — the definition reaches advising "through
publications or writings," its only relevant outs are the < 6 Florida "clients" de minimis
and not being in "the business of advising," and § 517.12(3) bars unregistered advising
from Florida offices or to Florida persons. Florida also did not adopt the NASAA/2002 USA
route of importing the IAA exclusions (§ 102(15)(G)); the ch. 517 CTA carve-out (§ 517.12(19))
requires actual CFTC registration, which Blueprint's 4.14(a)(9) plan deliberately avoids.
So the safest Florida posture is what the prior sections already recommend for other
reasons: general-audience education about concepts, mechanics, products and risk — with no
"advisability of investing in/purchasing/selling" language aimed at readers' own decisions,
no portfolio-specific or interactive tailoring, and no performance promises (§ 517.151/517.157
fraud provisions apply regardless). **Insurance pages.** The line is § 626.112(1)(b): a
license is needed to *solicit* — "the attempt to persuade any person to purchase an
insurance product" — by describing benefits, recommending, comparing products or advising
on insurance matters; unlicensed knowing transacting is a third-degree felony
(§ 626.112(10)), and Florida separately bars fee-based insurance counseling outright
(§ 626.7315(4)) unless licensed (the sanctioned form being the "unaffiliated insurance
agent," § 626.015(20)). No statute examined contains a "general consumer education"
exclusion; the exclusion is structural — education that does not attempt to persuade a
purchase, compare products, or interpret policies/coverages is simply not solicitation or
transacting. Insurance pages should therefore teach what insurance products are, how they
work and their costs/trade-offs in the abstract, without urging any product, insurer,
agent or affiliate link, and without a paid advice tier. **Lawyer questions flagged:**
(1) whether OFR reads § 517.021(20)'s "advising others … through publications or writings"
to cover a paid, non-personalized, general-circulation financial-education website at all
(the Lowe/§(D) analysis is federal, and Florida dropped the publisher clause) — and if so,
whether subscribers count as "clients" under SEC Rule 275.222-2 for the < 6-client de
minimis; (2) whether futures-only content (the existing courses) is outside ch. 517's
"securities" scope entirely; (3) whether the finance pages' disclaimers (prior section's
drafts) suffice for Florida, or whether OFR registration/notice-filing is the cleaner
answer; (4) for insurance, whether any planned content (product-type comparisons, "which
policy fits you" material, agent/affiliate links) crosses § 626.112(1)(b) solicitation or
§ 626.7315(4) fee-advice; (5) whether OFR/DFS have interpretive rules or guidance (69W
or 69O chapters) on education-vs-solicitation that this run did not reach — see Gaps.

### Gaps

- **69W rule text not quoted** — flrules.org serves rule text only as `.doc` files
  (Word), which no tool on this box can render; per job Notes the rules are linked and
  marked unchecked rather than quoted. The .doc URLs are in the saved rule pages.
- **69O (insurance) administrative rules not searched** — the job scoped ch. 626 statutes;
  DFS/OIR rules interpreting "solicitation" for educators (ch. 69O) were not examined.
- **Pre-2012 Florida publisher exclusion history not traced** — the current § 517.021(20)
  plainly lacks a publisher clause; when it was removed (ch. 2010-175/2012-era rewrite)
  was not researched.
- **OFR guidance pages not acquired** — flofr.gov `/divisions/securities/` 404s; the
  homepage probe yielded no rule content. OFR's own adviser-registration guidance pages
  would corroborate 69W-600.0016/.0017 but were not found at the guessed path.
- **NASAA "adopted model rules" list contains no publisher-exclusion rule** — checked
  (`raw/j1103-nasaa-adopted-model-rules.html`); the model publisher language lives in the
  Uniform Securities Acts themselves, which is what was quoted. The 1956-Act-with-NASAA-
  commentary PDF was not fetched (budget discipline; the 2002 Comment quotes cover the
  need).
- **1956 Act PDF is a scan** — its text layer carries OCR artifacts outside the quoted
  passage; quotes were taken from a clean span and the join is documented.
- **Not legal advice** — Florida readings (esp. the lawyer questions above) need a
  Florida-licensed securities/insurance lawyer.

### Source quality notes

- Primary sources throughout: the Florida Legislature's own statute pages (leg.state.fl.us
  HTML, fetched live), the Florida Department of State's rule index (flrules.org via
  Firecrawl after crawl-fetch 403), and NASAA-hosted Uniform Securities Act texts. No
  law-firm blogs, no secondary summaries.
- leg.state.fl.us pages are single-line HTML with each subsection in its own markup block;
  statutory cross-references inside quoted sentences are page links (tags), so two quotes
  above are split into tag-free spans — noted inline where it occurs.
- flrules.org 403s crawl-fetch box-wide; WebFetch read the chapter indexes for discovery
  (0 credits, not quotable), and Firecrawl renders of the two rule pages plus the chapter
  index are saved raw. The two saved rule pages carry a disclosed trim of their
  rule-history tables (Final-adopted rows kept verbatim).
- The USA PDFs came from nasaa.org's own wp-content store; the 2002 text layer is
  born-digital and clean; the 1956 is a scan (OCR artifacts disclosed).
- No AI-generated source content was relied on; no `utm_source=chatgpt` patterns seen.
- flofr.gov returned 404 for the guessed securities-division path — reported as a probe,
  not treated as a dead source (homepage 200s).

### Second-pass verification (reported separately)

After writing, every quoted substring above was re-grepped (`grep -c -F`) against its
cited raw file — 21 checks, all present (count 1 each): 7 from Fla. Stat. 517.021/517.12,
9 from ch. 624/626 statute pages, 5 from the USA extract file. The extract file's
line-wrap joins were separately spot-checked against the two underlying PDF text layers
(the 1956 § 401(f)(4) join spans three wrap lines: "(4) a publisher" + "of any bona fide
newspaper, news magazine, or business or" + "financial publication of general, regular,
and paid circulation;"). The pass caught no defects in this section's first-pass text —
no corrections were needed. Also verified: both job markers present; Source-line URLs
match the fetched URLs character-for-character; ledger lines for this job sum to 3 credits,
matching the three Firecrawl scrapes; no URL was fetched twice this run (per-run prefix
j1103- throughout).

<!-- job:J-20261103-04 end -->
