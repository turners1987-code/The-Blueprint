# finance-education-reference — findings

Reference target for teaching retirement accounts, tax strategy and personal-finance rules of thumb. Built for the Blueprint $7 tier.

<!-- job:J-20261031-02 start -->

Run 1 — 2026-10-31.

## 1. What was acquired

- 21 documents in `raw/`:
  - IRS (crawl-fetch, HTTP 200, 0 credits): Publications 590-A, 590-B, 560, 969, 550; Topic 429; current-month newsroom snapshot.
  - Cornell LII (crawl-fetch, HTTP 200, 0 credits): 26 U.S.C. § 1256.
  - Bogleheads wiki (Firecrawl, Cloudflare blocks plain fetches): Three-fund portfolio, Lazy portfolios, Backdoor Roth, Mega-backdoor Roth, Tax loss harvesting — full article markdown written to `raw/`.
  - tsp.gov (Firecrawl; domain returns 403 to plain fetches): Investing strategies, TSP investment options, Traditional and Roth TSP contributions.
  - Vanguard (crawl-fetch, HTTP 200, 0 credits): education hub, emergency fund, Roth vs traditional IRA, how to invest, investment types.
  - NAIC (crawl-fetch, HTTP 200, 0 credits): homepage, consumer hub, "How does insurance work".
  - CFPB (crawl-fetch, HTTP 200, 0 credits): consumer-tools hub, auto loans, mortgages.
- Firecrawl spend this run: **10 credits** (8 successful scrapes + 2 HTTP-404 scrapes), the job `credit_cap` exactly. Ledger lines `J-20261031-02` in `~/crawl/credits.log` sum to 10.
- Credit check: the credit-usage API is not reachable from this box (no curl in the worker session), so the documented ledger fallback was used: cycle (since 2026-10-19) ledger use before this job was roughly 350-380 of the 800-cycle cap.
- Limits were reused from `~/crawl/finance-2027-tax-limits/` per the job Notes, not re-crawled. One 0-credit newsroom check (2026-10-31) confirmed the 2027 IRS pension/inflation limits had still not been released (latest release IR-2026-129, Oct. 29, 2026), so the reused table remains current.
- 0-credit fetches are not logged to the ledger; report them as 0 credits.

## 2. Findings

### Bottom line

A complete teaching reference needs three layers, and they were all acquired: (1) the **account mechanics** — what each account type is, its contribution limits and its tax treatment (IRS pubs, TSP, Bogleheads wiki); (2) the **strategies** that stack those accounts (backdoor Roth, mega-backdoor Roth, Roth conversions, tax-loss harvesting, 1256 60/40, trader status); and (3) the **allocation and rules of thumb** that decide what to hold where (three-fund/lazy portfolios, emergency fund, age-in-bonds). For 2026 the dollar figures are settled and official; for 2027 everything except HSA/HDHP amounts and Social Security figures is still pending IRS release as of 2026-10-31. The single most load-bearing idea for teaching: account choice sets the tax treatment (traditional = deduct now, tax later; Roth = tax now, never again; HSA = deduct now AND never tax again if used for medical care), while asset allocation sets the risk — Vanguard frames investing as goals, diversification, and controlling costs, not picking winners.

### Roth IRA

- Contributions are made after tax; qualified withdrawals, including all earnings, are tax-free. A qualified distribution requires **both**: (1) "It is made after the 5-year period beginning with the first tax year for which a contribution was made to a Roth IRA set up for your benefit," and (2) the distribution is "Made on or after the date you reach age 59½," made on disability, made to a beneficiary/estate after death, or a first-home purchase (Pub. 590-B).
- No age limit: "You can contribute to a Roth IRA at any age." (Vanguard)
- Contribution is capped by earned income: it "Cannot exceed the amount of income you earned that year," cannot exceed the IRS limit, and "Could be reduced or even eliminated based on your modified adjusted gross income (MAGI)" (Vanguard).
- 2026 phase-outs (from Pub. 590-A's What's New): the Roth contribution limit phases out for MFJ/qualifying surviving spouse at modified AGI of **$242,000–$252,000**; for single/head of household at **$153,000–$168,000**; for MFS (lived with spouse) at **$0–$10,000**.
- A nonworking spouse can still contribute: "A spouse with low or no income may still be able to contribute to an IRA if that person is filing a joint tax return with a working spouse. The total amount contributed by both spouses cannot exceed their joint income, or the IRS limits." (Vanguard)
- Minors with earned income can own an IRA (custodial), and "Income limits are based on the minor's income, not the parent's." (Vanguard)
- Roth balances have **no required minimum distributions** during the owner's lifetime — stated for Roth TSP below and the same principle holds for Roth IRAs per Pub. 590-B.

Source: https://www.irs.gov/publications/p590b — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/publications/p590a — read 2026-10-31 — no page date — IRS
Source: https://investor.vanguard.com/investor-resources-education/iras/roth-vs-traditional-ira — read 2026-10-31 — no page date — Vanguard

### Traditional IRA

- Anyone with earned income can contribute: "Anyone with earned income can contribute to a traditional IRA. Income can affect deductibility." (Vanguard). Contributions for a given year can be made until the April filing deadline of the following year (Pub. 590-A).
- The contribution limit is "generally the smaller of" taxable compensation or the annual dollar limit (Pub. 590-A). For 2026 that dollar limit is $7,500, plus $1,100 catch-up if 50+ (see limits table).
- Deductibility phases out if you are covered by a workplace plan. For 2026 the deduction phases out at modified AGI of **$81,000–$91,000** (single/HoH) and **$129,000–$149,000** (MFJ/qualifying surviving spouse); for a non-covered spouse of a covered spouse, **$242,000–$252,000**; MFS is capped below **$10,000** (Pub. 590-A, What's New for 2026).
- Distributions are taxed as ordinary income; the 10% additional tax on early distributions stops after age 59½ ("After you reach age 59½, you can receive distributions without having to pay the 10% additional tax") and RMDs begin at 73: "Generally, you must begin receiving distributions by April 1 of the year following the year in which you reach age 73." (Pub. 590-B)
- After 70½, IRA owners can make qualified charitable distributions (QCDs) directly from the IRA to charity, excluded from income (Pub. 590-B).

Source: https://www.irs.gov/publications/p590a — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/publications/p590b — read 2026-10-31 — no page date — IRS
Source: https://investor.vanguard.com/investor-resources-education/iras/roth-vs-traditional-ira — read 2026-10-31 — no page date — Vanguard

### Roth conversions and ladders

- A conversion moves traditional (pre-tax) money into a Roth balance; the converted amount is taxed as ordinary income in the year of conversion. For TSP this became available inside the plan: as of January 2026 participants can convert traditional (pre-tax) balances to Roth (after-tax) balances, and "This is called a 'Roth in-plan conversion.'" The tax "must be paid ... using personal funds from another source ... You cannot use part of the amount you're converting to pay taxes." (TSP)
- Each conversion starts its own 5-year clock: "A separate 5-year period applies to each conversion and rollover." Taking a converted amount out within that window can trigger the 10% additional tax on the taxable portion — the "recapture amount" (Pub. 590-B).
- Because a separate 5-year period applies to each conversion, the practice of converting a slice every year in early retirement (the "Roth conversion ladder") is a direct application of this rule: each year's conversion becomes penalty-free withdrawal-eligible principal after its own 5-year period, in first-in-first-out order ("Withdrawals must happen in the order described above, with conversions ordered first-in, first-out. And each conversion has its own 5-year clock" — Bogleheads, Mega-backdoor Roth).
- Low-income years are the natural conversion window: the Bogleheads tax-loss-harvesting page notes that realizing gains offset by loss carryforwards can leave "little or no taxable income," making it a time "you might consider" a post-retirement Roth conversion "to take advantage of the standard/itemized deduction and low tax brackets."
- Conversion is available regardless of income — that is precisely what makes the backdoor Roth work (see next sections).

Source: https://www.tsp.gov/making-contributions/traditional-and-roth-contributions/ — read 2026-10-31 — no page date — TSP
Source: https://www.irs.gov/publications/p590b — read 2026-10-31 — no page date — IRS
Source: https://www.bogleheads.org/wiki/Mega-backdoor_Roth — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.bogleheads.org/wiki/Tax_loss_harvesting — read 2026-10-31 — no page date — Bogleheads wiki

### SEP IRA

- A SEP (Simplified Employee Pension) is an employer-funded traditional IRA. "Contributions you make for 2025 to a common-law employee's SEP IRA can't exceed the lesser of 25% of the employee's compensation or $70,000." The same page states the caps rise for 2026: "These limits increase to $360,000 and $72,000, respectively, in 2026" (the $360,000 is the per-employee compensation cap counted, not a contribution limit). (Pub. 560)
- Employer SEP contributions do not reduce the employee's own IRA limit: "Employer contributions to a SEP IRA won't affect the amount an individual can contribute to a Roth or traditional IRA." (Pub. 560)
- Contributions are flexible year to year ("You don't have to make contributions every year") and can be made up to the employer's filing deadline including extensions: "To deduct contributions for a year, you must make the contributions by the due date (including extensions) of your tax return for the year." (Pub. 560)
- For the self-employed owner, the deduction is circular and must be computed indirectly: "When figuring the deduction for contributions made to your own SEP IRA, compensation is your" net earnings from self-employment, reduced by both the deductible part of self-employment tax and the SEP contribution itself — Pub. 560's Rate/Deduction Worksheets for Self-Employed implement this (this is why the effective self-employed ceiling is below the flat 25%). (Pub. 560)
- Participants "age 73 or over must take required minimum distributions (RMDs)" — a SEP IRA is a traditional IRA for distribution purposes, which is also why SEP balances count in the backdoor-Roth pro-rata rule (see Backdoor section). (Pub. 560; Bogleheads, Backdoor Roth)

Source: https://www.irs.gov/publications/p560 — read 2026-10-31 — no page date — IRS
Source: https://www.bogleheads.org/wiki/Backdoor_Roth_IRA — read 2026-10-31 — no page date — Bogleheads wiki

### Solo 401(k) / 401(k)

- A one-participant ("solo") 401(k) covers a business owner with no employees (or only a spouse); it allows both an employee elective deferral and an employer profit-sharing contribution. Pub. 560's qualified-plan table gives the structure: "Elective deferral up to $23,500; $31,000 if age 50 or over (but not attaining age 60, 61, 62, or 63)" for 2025, with total additions of the "Smaller of $70,000 or 100% of participant's compensation," and notes for 2026 the corresponding figures are $24,500 elective deferral and $72,000 total additions (limits table below). (Pub. 560)
- The Bogleheads Mega-backdoor Roth page states the 2026 solo-401(k) mechanics directly: "Up to the Section 402(g) elective deferral limit ($24,500 in 2026) from wages paid through payroll, and can be traditional or Roth as the plan allows; Up to 25% of wages paid through payroll as employer contributions, and these can only be traditional; Up to the Section 415(c) limit ($72,000 in 2026) for total of all employee and employer contributions."
- Maximum funding needs real wages: "a self-employed investor can contribute the maximum to their Solo 401(k) with wages of at least $190,000 (=\[$72,000 - $24,500\] / 25%) if making an elective deferral, or $288,000 (=$72,000 / 25%) if not." (Bogleheads, Mega-backdoor Roth)
- Employer 401(k) plans in general: elective deferrals may be traditional or Roth (designated Roth); the TSP page confirms the same combined-limit principle for its own plan: the elective deferral limit and catch-up limit "apply to the combined total of your traditional TSP contributions and your Roth TSP contributions." (TSP)
- SECURE 2.0 catch-up wrinkle: catch-up contributions for those who earned more than the wage threshold ($150,000 for 2026, see limits table) must be Roth. The TSP contribution-limits page (reused, fetched 2026-10-16) states the mandate applies from Jan. 1, 2026 "if you earned more than the IRS income threshold ($150,000 in 2025 adjusted annually for inflation)."

Source: https://www.irs.gov/publications/p560 — read 2026-10-31 — no page date — IRS
Source: https://www.bogleheads.org/wiki/Mega-backdoor_Roth — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.tsp.gov/making-contributions/traditional-and-roth-contributions/ — read 2026-10-31 — no page date — TSP
Source: https://www.tsp.gov/contribution-limits/ — read 2026-10-31 — no page date — TSP

### TSP

- The Thrift Savings Plan is the federal 401(k) equivalent. Investment menu: "You can choose your own mix of investments from individual TSP investment funds (G, F, C, S, and I Funds). These funds include a short-term U.S. Treasury security and index funds made of stocks and bonds." Beyond the five individual funds: "Each of the eleven L Funds is a diversified mix of the five individual TSP funds," and a "mutual fund window" exists for eligible participants who pay its fees. (TSP)
- L Funds are target-date funds that manage risk automatically: "They rebalance every day to maintain the appropriate investment allocation, and they reallocate over time to give you less risk the closer you get to needing your money." (TSP)
- Traditional vs Roth inside TSP: traditional contributions go in pre-tax; Roth contributions are taxed going in, and "both contributions and earnings in your Roth TSP balance can be withdrawn tax-free" if you meet the IRS requirements for qualified withdrawals. Qualified earnings require BOTH: "5 years have passed since January 1 of the calendar year when you made your first Roth TSP contribution" and "You are at least age 59½, permanently disabled, or deceased." Also: "your Roth balance isn't subject to IRS required minimum distributions (RMDs)." (TSP)
- Employer money is always traditional: "All agency/service contributions will go into your traditional balance regardless of how you designate your own contributions." (TSP)
- Roth in-plan conversions became available January 2026 (see Roth conversions section). (TSP)
- A Bogleheads cross-check: TSP participants can build a three-fund portfolio from "C fund, I fund, F Fund, or alternately, the G Fund," with a note that "the I fund excludes China and Hong Kong, so it is not quite equivalent to a total international index." (Bogleheads)
- 2026 limits: $24,500 elective deferral, $8,000 catch-up 50+, $11,250 ages 60-63, $72,000 annual additions (limits table below).

Source: https://www.tsp.gov/investment-options/ — read 2026-10-31 — no page date — TSP
Source: https://www.tsp.gov/investing-strategies/ — read 2026-10-31 — no page date — TSP
Source: https://www.tsp.gov/making-contributions/traditional-and-roth-contributions/ — read 2026-10-31 — no page date — TSP
Source: https://www.bogleheads.org/wiki/Three-fund_portfolio — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.tsp.gov/contribution-limits/ — read 2026-10-31 — no page date — TSP

### HSA as a retirement account

- An HSA requires HDHP coverage; the contribution limit depends on coverage type and age: "For 2025, if you have self-only HDHP coverage, you can contribute up to $4,300. If you have family HDHP coverage, you can contribute up to $8,550," and the same page's tip adds: "For 2026, if you have self-only HDHP coverage, you can contribute up to $4,400. If you have family HDHP coverage, you can contribute up to $8,750." (Pub. 969)
- Catch-up: "If you are an eligible individual who is age 55 or older at the end of your tax year, your contribution limit is increased by $1,000." Each spouse must hold their own HSA for both to get the catch-up. (Pub. 969)
- Contributions stop with Medicare: "Beginning with the first month you are enrolled in Medicare, your contribution limit is zero," including retroactive enrollment. (Pub. 969)
- Why it functions as a retirement account: contributions are deductible, growth is untaxed, and medical withdrawals are untaxed. Non-medical withdrawals are taxed as income plus a 20% penalty — "There is an additional 20% tax on the part of your distributions not used for qualified medical expenses" — but "There is no additional tax on distributions made after the date you are disabled, reach age 65, or die." So after 65 a non-medical HSA withdrawal is taxed like a traditional IRA distribution, with no penalty. (Pub. 969)
- One-time funding move: an IRA-to-HSA transfer ("qualified HSA funding distribution") is allowed, generally "only one ... during your lifetime," up to the HSA contribution limit plus catch-up. (Pub. 969)
- 2027 limits are already published (see table): $4,500 self-only / $9,000 family — the only retirement-adjacent 2027 numbers the IRS has released so far.

Source: https://www.irs.gov/publications/p969 — read 2026-10-31 — no page date — IRS

### Backdoor and mega backdoor Roth

- Backdoor Roth, the definition: if you cannot contribute to a Roth IRA "because your income exceeds the income eligibility limit, you can still choose to contribute indirectly through a two step process known informally as the **backdoor Roth**." Step 1: make a nondeductible (taxed, not deducted) contribution to a traditional IRA. Step 2: convert the traditional IRA to a Roth IRA. "Because there are no income limits for either of these steps, you can use this backdoor Roth technique to effectively contribute to a Roth IRA regardless of how high your income is." (Bogleheads, Backdoor Roth)
- It is a process, not an account: "There is no such IRA called a 'backdoor Roth IRA', because the backdoor Roth is a _process_ or _technique_, not an _account.'" (Bogleheads, Backdoor Roth)
- The pro-rata trap is the key teaching point: "If you have pre-tax money in _any_ traditional IRA, the taxable portion of any conversion you make is prorated over all your traditional IRAs; you cannot convert just the nondeductible amount." For the pro-rata calculation the page's "traditional IRA" definition "refers to each of your non-Roth IRAs" and sweeps in traditional IRAs, rollover (conduit) IRAs, SEP-IRAs and SIMPLE IRAs held at any custodian. Fixes: convert everything, roll pre-tax money into a 401(k)/403(b)/457(b), or use an Individual 401(k) that accepts rollovers. You have until December 31 of the conversion year to empty the IRA. (Bogleheads, Backdoor Roth)
- 2026 amounts: "the maximum IRA contribution in 2026 is $7,500 per person (or $8,600 if over age 50)." Form 8606 reports nondeductible contributions and conversions each year. (Bogleheads, Backdoor Roth)
- Mega backdoor Roth, the definition: fund a Roth account "far above normal contribution limits" by (1) contributing to an after-tax 401(k) account and (2) rolling the funds over to a Roth IRA or a Roth sub-account within the plan. The ceiling is "up to $72,000 in 2026, per IRC 415(c)" — but "more typically" $47,500 minus any employer match. (Bogleheads, Mega-backdoor Roth)
- Plan requirements: the plan must offer after-tax contributions AND allow conversion of them either as an in-plan conversion or as an in-service distribution, without a triggering event. "None of the free Solo 401k plans from the major brokerages (E*Trade, Fidelity, Vanguard, etc.) allow after-tax contributions." (Bogleheads, Mega-backdoor Roth)
- The two techniques are independent and stackable; the page's table sets them side by side — backdoor Roth: non-deductible IRA → Roth IRA, "$7,500"; mega-backdoor Roth: after-tax 401(k) → Roth IRA or Roth 401(k), "Up to $72,000." (Bogleheads, Mega-backdoor Roth)
- Earnings between the two steps are pre-tax and taxable at conversion, so the steps should run in quick sequence; some plans offer automatic in-plan conversions. (Bogleheads, Mega-backdoor Roth)
- SEP/SIMPLE/rollover IRA balances sitting anywhere count in the backdoor pro-rata math — the reason the SEP section above matters here. (Bogleheads, Backdoor Roth)

Source: https://www.bogleheads.org/wiki/Backdoor_Roth_IRA — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.bogleheads.org/wiki/Mega-backdoor_Roth — read 2026-10-31 — no page date — Bogleheads wiki

### Tax-loss harvesting and wash sales

- What it is: "**Tax loss harvesting** is a way to improve the after-tax return of your taxable investments." Mechanically, you sell the fund and buy it back 31 days later, holding cash or a similar-but-not-substantially-identical fund in the meantime. (Bogleheads, Tax loss harvesting)
- The three benefits, as the page enumerates them: losses offset realized gains; then "you can use any remaining tax losses to deduct $3,000 from your ordinary income each year"; and remaining losses "roll over ... into later years." The $3,000/year ordinary-income offset and unlimited carryforward are the IRS mechanics. (Bogleheads, Tax loss harvesting)
- The wash-sale rule, from the IRS: "A wash sale occurs when you sell or trade stock or securities at a loss and within 30 days before or after the sale you" buy substantially identical securities, acquire them in a fully taxable trade, acquire a contract or option to buy them, **or acquire them in an IRA or Roth IRA** — and "If you sell stock and your spouse or a corporation you control buys substantially identical stock, you also have a wash sale." The loss is disallowed. (Pub. 550)
- Practical wash-sale guards: turn off automatic dividend reinvestment — "If you automatically reinvest dividends and capital gains, you may accidentally trigger a" wash sale — and use specific identification of shares rather than average cost. (Bogleheads, Tax loss harvesting)
- Qualified-dividend interaction: shares held under 61 days lose qualified-dividend treatment. (Bogleheads, Tax loss harvesting)
- Six-month rule for funds: on mutual-fund shares held 6 months or less, tax-exempt interest reduces the loss dollar-for-dollar, and capital-gain distributions make part of the loss long-term. (Bogleheads, Tax loss harvesting; Pub. 550)
- It defers rather than eliminates tax: "Using tax loss harvesting to offset capital gains does not eliminate the capital gains taxes you would have paid. Instead, it defers those taxes into the future," because repurchase lowers basis — worth it because the deduction lands at ordinary rates today and the deferred gain is paid at capital-gains rates later, or escapes entirely at death via stepped-up basis. (Bogleheads, Tax loss harvesting)
- When NOT to harvest: "if tax loss harvesting offsets capital gains that would have been taxed at 0% but your future capital gains rate is not 0% then it has created a loss." "Bottom line: know your tax rates before you tax loss harvest." (Bogleheads, Tax loss harvesting)
- Losses die with the taxpayer: "Capital losses cannot be carried over after a taxpayer's death." (Bogleheads, Tax loss harvesting)

Source: https://www.bogleheads.org/wiki/Tax_loss_harvesting — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.irs.gov/publications/p550 — read 2026-10-31 — no page date — IRS

### Section 1256 60/40

- The statute: "each section 1256 contract held by the taxpayer at the close of the taxable year shall be treated as sold for its fair market value on the last business day of such taxable year," and any gain or loss on a section 1256 contract is treated as "short-term capital gain or loss, to the extent of 40 percent of such gain or loss" and "long-term capital gain or loss, to the extent of 60 percent of such gain or loss." (26 U.S.C. § 1256(a))
- Pub. 550's plain-English version: "If you hold a section 1256 contract at the end of the tax year, you must generally treat it as sold at its fair market value on the last business day of the tax year," and gains/losses on year-end-open or terminated contracts "are treated as 60% long-term and 40% short-term, regardless of how long the contracts were held." Reported on Form 6781. (Pub. 550)
- What qualifies as a section 1256 contract: "Regulated futures contract, Foreign currency contract, Nonequity option, Dealer equity option, or Dealer securities futures contract." Swaps (interest rate, currency, basis, equity, equity index, commodity) and interest-rate caps/floors are excluded. (Pub. 550; 26 U.S.C. § 1256(b))
- Teaching point for traders: index futures and broad-based index options get the 60/40 split and year-end mark automatically — no election needed — which is a tax profile most stock traders cannot get without trader status (next section).

Source: https://www.law.cornell.edu/uscode/text/26/1256 — read 2026-10-31 — no page date — Office of the Law Revision Counsel via Cornell LII
Source: https://www.irs.gov/publications/p550 — read 2026-10-31 — no page date — IRS

### Trader tax status and 475(f)

- Trader status is a facts-and-circumstances trade-or-business test. The three conditions: "You must seek to profit from daily market movements in the prices of securities and not from dividends, interest, or capital appreciation; Your activity must be substantial; and You must carry on the activity with continuity and regularity." Considered facts include "Typical holding periods," "The frequency and dollar amount of your trades," the extent to which you pursue it "to produce income for a livelihood," and "The amount of time you devote to the activity." (IRS Topic 429)
- Self-labels do not matter: "It doesn't matter whether you call yourself a trader or a day trader, you're an investor for Federal income tax purposes" unless the activity qualifies. A person can be a trader in some securities and an investor in others; investment positions "must be identified as such in the trader's records on the day the trader acquires them." (IRS Topic 429)
- Without the election, a trader still reports on Schedule D/Form 8949 as capital gains, and "both the limitations on capital losses and the wash sales rules continue to apply." (IRS Topic 429)
- Mark-to-market: "Traders can choose to use the mark-to-market method of accounting, investors can't." With "a timely and valid mark-to-market election" under section 475(f), gains and losses "are generally treated as ordinary gains and losses" reported on Part II of Form 4797, and "The limitations on capital losses, the wash sale rules, and certain other rules do not apply to traders using the mark-to-market method of accounting (see section 475(d)(1))." Open positions are "marked-to-market by treating them as if they were sold for fair market value on the last business day of the year." (IRS Topic 429; Pub. 550)
- Election deadline: "you must make the mark-to-market election by the due date (not including extensions) of the tax return for the year prior to the year for which you intend the election to become effective" — e.g., for 2026, a statement filed with (or extension request for) the 2025 return; the statement must identify the 475(f) election, the first effective year, and the trade or business. New taxpayers get "2 months and 15 days after the first day of the year." The election is effectively permanent: "it will apply to 2025 and all later tax years, unless you get permission from the IRS to revoke it." (Pub. 550; IRS Topic 429)
- Trader expenses go on Schedule C, and "Gains and losses from selling securities from being a trader aren't subject to self-employment tax." (IRS Topic 429)
- Teaching contrast: investor (default) = capital treatment, $3,000 loss cap, wash sales; trader with 475(f) = ordinary treatment, no loss cap, no wash sales, but a hard election deadline and year-end mark on everything in the trading business.

Source: https://www.irs.gov/taxtopics/tc429 — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/publications/p550 — read 2026-10-31 — no page date — IRS

### Lazy investing vs active

- The core definition: "A **three-fund portfolio** is a portfolio which uses only basic asset classes — usually a domestic stock 'total market' index fund, an international stock 'total market' index fund and a bond 'total market' index fund." (Bogleheads, Three-fund portfolio)
- Named Vanguard implementation: "Vanguard Total Stock Market Index Fund (VTSAX), Vanguard Total International Stock Index Fund (VTIAX), Vanguard Total Bond Market Fund (VBTLX)" (or ETFs VTI/VXUS/BND). TSP participants can do the same with the C, I and F funds — or the G Fund in place of F. (Bogleheads, Three-fund portfolio)
- Lazy portfolios in one line: "**Lazy portfolios** are widely used by investors who want a simple, low-cost, and diversified investment plan" — built from just a few index funds, easy to set up and maintain, with broad market exposure. The page adds that "Most investors can keep these portfolios on track with only occasional" rebalancing, "often taking less than an hour per year." The three-fund page's lazy-portfolio section gives the bond rule: "They are 'lazy' in that you can maintain the same asset allocation for an extended period, as they generally contain 30-40% bonds, suitable for most pre-retirement investors." (Bogleheads, Lazy portfolios; Three-fund portfolio)
- The wiki's ladder from one fund up: one-fund (LifeStrategy/all-in-one), two-fund (60% total world / 40% total bond, Rick Ferri), three-fund, Core Four (adds a REIT slice: "With the remaining funds, allocate 50% to US stock, 40% to international and 10%" to REIT), then named multi-fund portfolios (Coffeehouse, Coward's, Ideal Index, Swensen, Permanent Portfolio). (Bogleheads, Lazy portfolios)
- The "active" side of the debate, in the sources' own framing: three-fund critics would argue that the evidence for superiority of slice-and-dice portfolios, small-value tilting and REIT inclusion "is too strong to ignore"; defenders answer "a three-fund portfolio is good enough and that there is no real proof that more complicated portfolios are any better." Non-Boglehead commentary quoted on the page: "That three-pronged approach is going to beat the vast majority of the individual stock and bond portfolios that most people have at brokerage firms... there is a certain elegance in the simplicity of it." (Bogleheads, Three-fund portfolio)
- Vanguard's own education frames investing as goals, diversification and cost control rather than selection skill: its three keys are goals/plan ("an investment goal is just a dream until you have a plan to reach it"), diversification ("make sure to take advantage of diversification to lower your risk"), and costs ("All investments have costs, but you control them by choosing what to buy. It's a much bigger decision than you might think"). (Vanguard)
- TSP teaches the same posture: your investment performance is determined "in large part" by your asset allocation, "not by guessing which market sector is going to be in favor at a particular time," and "Most investment experts agree that such success is highly unlikely over long periods" for market timing. (TSP)

Source: https://www.bogleheads.org/wiki/Three-fund_portfolio — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.bogleheads.org/wiki/Lazy_portfolios — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://investor.vanguard.com/investor-resources-education/how-to-invest — read 2026-10-31 — no page date — Vanguard
Source: https://www.tsp.gov/investing-strategies/ — read 2026-10-31 — no page date — TSP

### Insurance as an investment (balanced)

- The regulatory framing: "Insurance is a way to manage your financial risks" (NAIC). Premium is the price of risk transfer — you pay so the insurer, not you, carries the loss. The NAIC consumer hub routes to how insurance works, filing complaints and state insurance departments, not to investing.
- The balanced teaching point supported by these sources: insurance products are priced as risk management plus fees, so treating them primarily as investments inverts their purpose. The Bogleheads wiki's portfolio pages cover investable assets without listing insurance products among them, and the annuity-specific consumer material (NAIC's Annuity Buyer's Guide working group; investor.gov's insurance/annuity alerts) could not be retrieved this run (see Gaps) — so this section is deliberately limited to the risk-transfer framing rather than product-level claims.
- Investor.gov's insurance-products pages (named in the job's Starting sources) return HTTP 403 to both crawl-fetch and WebFetch from this box, and Firecrawl budget was exhausted; FINRA is a dead source by terms (DEAD-SOURCES.md); NAIC's buyer's guides are committee/PDF artifacts rather than fetchable consumer HTML pages. What stands: the NAIC consumer pages above.

Source: https://content.naic.org/consumer/how-does-insurance-work — read 2026-10-31 — no page date — NAIC
Source: https://content.naic.org/consumer — read 2026-10-31 — no page date — NAIC

### Rules of thumb

- Emergency fund: "three to six months' worth of living expenses in your emergency fund to prepare for potential income shocks." (Vanguard)
- Stock/bond glide: "One traditional rough rule-of-thumb is 'age in bonds,' or percentage of stocks = 100 - age. This is a conservative rule." (Bogleheads, Three-fund portfolio)
- Bond share for lazy portfolios: "they generally contain 30-40% bonds, suitable for most pre-retirement investors." (Bogleheads, Three-fund portfolio, in its Lazy portfolios section)
- International share of stocks: Vanguard's Target Retirement funds allocate 40% of stock to international, and Vanguard research "advise[s] holding 20-40% international allocations"; a market-cap "total world" weighting is the alternative. (Bogleheads, Three-fund portfolio)
- Asset location: "the international fund should go into a taxable account, the bond fund should go into a tax-advantaged account, and the domestic equity fund should fill in the remaining space." (Bogleheads, Three-fund portfolio)
- Approximation accuracy: Rick Ferri "stresses that the exact allocation percentages are not important; to the nearest 5% is fine." (Bogleheads, Lazy portfolios)
- Time vs timing: "Time in the market beats timing the market," with TSP's worked example that a saver starting at 25 ends with $640,829 vs $303,219 starting at 35 (both contributing $3,000/year at 7%), and dollar-cost averaging means "you're buying more units of a fund when the price of the fund is low and fewer units when the price is high." (TSP)
- Housing and car rules of thumb: the CFPB auto-loans and mortgages pages were fetched and contain process guidance (how to shop, what documents, what terms mean) but no numeric affordability rules of thumb — recorded in Gaps rather than invented here.

Source: https://investor.vanguard.com/investor-resources-education/emergency-fund — read 2026-10-31 — no page date — Vanguard
Source: https://www.bogleheads.org/wiki/Three-fund_portfolio — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.bogleheads.org/wiki/Lazy_portfolios — read 2026-10-31 — no page date — Bogleheads wiki
Source: https://www.tsp.gov/investing-strategies/ — read 2026-10-31 — no page date — TSP

### Limits table

2027 column: "pending" means no IRS release as of 2026-10-31 (newsroom checked this run; latest release IR-2026-129, Oct. 29, 2026). Reused from finance-2027-tax-limits unless noted otherwise below the table.

| Account / item | 2026 limit | 2027 limit (if published) | Source |
|---|---|---|---|
| IRA contribution (under 50) | $7,500 | pending | IR-2025-111 |
| IRA catch-up (50+) | $1,100 | pending | IR-2025-111 |
| IRA contribution (50+, total) | $8,600 | pending | IR-2025-111 |
| 401(k)/403(b)/457(b)/TSP elective deferral | $24,500 | pending | IR-2025-111; TSP |
| Catch-up 50+ (incl. TSP) | $8,000 | pending | IR-2025-111; TSP |
| Enhanced catch-up, ages 60-63 | $11,250 | pending | IR-2025-111; TSP |
| 415(c) annual additions (incl. solo 401(k), after-tax 401(k)) | $72,000 | pending | Notice 2025-67; Pub. 560 |
| SEP contribution ceiling | lesser of 25% of comp or $72,000 | pending | Pub. 560 |
| SEP countable compensation cap | $360,000 | pending | Pub. 560 |
| Roth catch-up wage threshold (§414(v)(7)) | $150,000 | pending | Notice 2025-67; TSP |
| HSA contribution, self-only | $4,400 | **$4,500** | Pub. 969; Rev. Proc. 2026-24 |
| HSA contribution, family | $8,750 | **$9,000** | Pub. 969; Rev. Proc. 2026-24 |
| HSA catch-up (55+) | $1,000 (no COLA) | $1,000 | Pub. 969 |
| HDHP min deductible, self / family | $1,700 / $3,400 | **$1,750 / $3,500** | Rev. Proc. 2025-19 / 2026-24 |
| HDHP max out-of-pocket, self / family | $8,500 / $17,000 | **$8,700 / $17,400** | Rev. Proc. 2025-19 / 2026-24 |
| Traditional IRA deduction phase-out, single (covered) | $81,000–$91,000 | pending | Pub. 590-A (2026 What's New); IR-2025-111 |
| Traditional IRA deduction phase-out, MFJ (covered) | $129,000–$149,000 | pending | Pub. 590-A (2026 What's New); IR-2025-111 |
| Traditional IRA deduction phase-out, MFJ (spouse uncovered) | $242,000–$252,000 | pending | Pub. 590-A (2026 What's New) |
| Roth IRA phase-out, MFJ | $242,000–$252,000 | pending | Pub. 590-A (2026 What's New); IR-2025-111 |
| Roth IRA phase-out, single/HoH | $153,000–$168,000 | pending | Pub. 590-A (2026 What's New); IR-2025-111 |
| Roth IRA phase-out / deduction phase-out, MFS | $0–$10,000 (not COLA-adjusted) | $0–$10,000 | Pub. 590-A; IR-2025-111 |
| Social Security wage base | $184,500 | **$192,300** | SSA |
| Wash-sale window | 30 days before/after | statutory, unchanged | Pub. 550 |
| TLH ordinary-income offset | $3,000/year + carryforward | statutory, unchanged | Bogleheads/Pub. 550 |
| Section 1256 split | 60% LT / 40% ST | statutory, unchanged | 26 U.S.C. § 1256 |

Provenance for table sources. Rows reused from the finance-2027-tax-limits target were verified there against local raw copies fetched 2026-10-16 (that target's findings.md carries the full quotations); rows marked Pub. 560/590-A/969 were re-verified live this run:

Source: https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500 — read 2026-10-31 — published 2025-11-13 — IRS
Source: https://www.irs.gov/pub/irs-drop/n-25-67.pdf — read 2026-10-31 — published 2025-11-13 — IRS
Source: https://www.irs.gov/publications/p560 — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/publications/p969 — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/publications/p590a — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/irb/2026-25_IRB — read 2026-10-31 — published 2026-06-15 — IRS
Source: https://www.irs.gov/irb/2025-21_IRB — read 2026-10-31 — published 2025-05-19 — IRS
Source: https://www.ssa.gov/OACT/COLA/cbb.html — read 2026-10-31 — no page date — SSA Office of the Chief Actuary
Source: https://www.tsp.gov/contribution-limits/ — read 2026-10-31 — no page date — TSP
Source: https://www.irs.gov/newsroom/news-releases-for-current-month — read 2026-10-31 — no page date — IRS
Source: https://www.irs.gov/publications/p550 — read 2026-10-31 — no page date — IRS
Source: https://www.law.cornell.edu/uscode/text/26/1256 — read 2026-10-31 — no page date — Office of the Law Revision Counsel via Cornell LII
Source: https://www.bogleheads.org/wiki/Tax_loss_harvesting — read 2026-10-31 — no page date — Bogleheads wiki

## 3. Gaps

- **2027 IRS limits pending**: every IRA/401(k)/TSP/SEP figure for 2027 (table rows above) awaits the pension COLA notice; the 2026-cycle notice (IR-2025-111/Notice 2025-67) came Nov. 13, 2025, so the 2027-cycle window is open now. Only HSA/HDHP (Rev. Proc. 2026-24, June 2026) and SSA amounts are published for 2027.
- **investor.gov insurance and annuity alerts not acquired**: the domain returns HTTP 403 to crawl-fetch and WebFetch from this box; Firecrawl budget was exhausted at the cap (10 credits) before this fetch. The insurance-as-investment section is therefore thinner than the job intended.
- **NAIC consumer guides**: the consumer hub links only committee pages (e.g., Annuity Buyer's Guide working group) and PDFs; no fetchable HTML buyer's-guide text was acquired.
- **Housing and car numeric rules of thumb**: CFPB's auto-loans and mortgages hub pages contain process guidance but no numeric affordability heuristics (e.g., no 28/36 or 20/4/10 statement). Rather than fill from memory (not permitted), these are left out; the emergency-fund, age-in-bonds, 30-40% bonds, 20-40% international and dollar-cost-averaging rules are the sourced ones.
- **"Roth conversion ladder" as a named technique**: no acquired source uses the phrase; the section assembles it from Pub. 590-B's per-conversion 5-year rule and the Bogleheads ordering-rules text, which is flagged here rather than presented as a quoted term.
- Pub. 590-B's conversion chapter in the fetched HTML focuses on reporting (Form 8606 worksheets) and the 5-year recapture; the step-by-step "how to convert" mechanics came from the Bogleheads and TSP pages.
- The IRS pubs fetched are the 2025 revisions carrying 2026 updates in their What's New sections (590-A's 2026 phase-outs confirmed live); Pub. 560's body figures are 2025 with the 2026 increases stated inline.
- fidelity.com and finra.org skipped as dead sources per job Notes and DEAD-SOURCES.md.

## 4. Source quality notes

- **All acquisitions are official, regulatory or community-reference sources**: IRS (6), Cornell LII (1), TSP (3), Bogleheads wiki (5), Vanguard (4), NAIC (3), CFPB (3), plus Wayback CDX URL-discovery artifacts (not indexed). No AI-generated content detected; no utm_source=chatgpt patterns; no paywalls encountered.
- **Bogleheads wiki is community-maintained**, not regulatory: excellent for mechanics and worked examples, but it cites IRS documents for every dollar figure, and those figures were cross-checked against the IRS pages fetched this run (2026 IRA $7,500/$8,600 and 415(c) $72,000 agree across Bogleheads, Pub. 560 and the reused IR-2025-111 table).
- **Vendor pages (Vanguard)** are education-branded but commercial; used only for rules of thumb and decision framing, with dollar limits always sourced to the IRS instead. The Vanguard Roth-vs-traditional page injects its dollar limits via JavaScript tokens, which do not render in a plain fetch — limits were taken from the IRS.
- **Two Firecrawl credits were paid for 404s** (Bogleheads `Mega_backdoor_Roth` underscore title; tsp.gov `/funds/`), both logged in the ledger; each 404's own navigation revealed the correct live URL, both of which were then fetched successfully.
- **MediaWiki renders trailing nav tables twice** (expanded and collapsed variants); in the saved Bogleheads raw files the duplicated nav boilerplate was written once. Article bodies are complete and verbatim, and every quote in this file comes from saved raw text.
- **tsp.gov 403s plain fetchers**; its three pages came via Firecrawl and their content (five funds, eleven L Funds, Roth-in-plan conversions from Jan 2026, no Roth RMDs) is internally consistent with the TSP page reused from finance-2027-tax-limits.
- Quotes from `raw/` files are verbatim, including typographic quotes where the source used them; anything paraphrased carries no quote marks.

<!-- job:J-20261031-02 end -->

<!-- job:J-20261031-15 start -->

## Corrections 2026-10-31

Two quotes flagged for this target by crawl-quote-check (run J-20261031-02-20261031T092828Z), listed in the "Quote gate 2026-10-31" section of `progress.md`. Backtick strings are the flagged wordings used as identifiers, not quotations. Quote marks below wrap only text copied exactly from the named raw file.

**`finance-education-reference/findings.md:86`** (J-20261031-02) — flagged wording `if you earned more than the IRS income threshold ($150,000 in 2025 adjusted annually for inflation).`: **corrected** — the flagged wording lower-cased the sentence's first word and inserted a period where the TSP sentence continues, and its row cited no raw file of this target (the tsp.gov contribution-limits page was never fetched under this target), which is why the gate fired. The TSP contribution-limits raw file, acquired 2026-10-16 under finance-2027-tax-limits, was copied this run into this target as `raw/tsp-contribution-limits.md` (local file copy, no fetch; byte-identical, 2,265 bytes). The sentence, copied exactly from `raw/tsp-contribution-limits.md` (lines 20–23; the file hard-wraps between the words adjusted and annually, the wrap is flattened here, all other characters exact, punctuation included):

> "If you earned more than the IRS income threshold ($150,000 in 2025 adjusted annually for inflation) and your total contributions exceed the elective deferral limit, those additional contributions — catch-up contributions — **must be Roth.**"

The line-18 heading above the sentence — "New catch-up law starting January 1, 2026" (`raw/tsp-contribution-limits.md`, line 18) — is where the Jan. 1, 2026 effective date in the line-86 sentence comes from. The underlying claim stands; only the quoted wording was wrong.

Source: https://www.tsp.gov/contribution-limits/ — read 2026-10-31 — no page date — TSP

**`finance-education-reference/findings.md:100`** (J-20261031-02) — flagged wording `C fund, I fund, F Fund, or alternately, the G Fund,`: **corrected** — the flagged wording flattened the Bogleheads table's bullet list into a comma-separated string with a comma added after the final fund name, and its row cites the tsp.gov investment-options URL, which was never fetched into this target and does not carry this text (the saved `raw/tsp-investment-options.md` lists the five funds G, F, C, S, and I and contains no such sentence). The text is from the Bogleheads three-fund page, already saved in this target as `raw/bh-three-fund.md`. The table cell, copied exactly from `raw/bh-three-fund.md` (line 97):

> "Participants of the Thrift Savings Plan can create a three-fund portfolio using the following three funds, for example:[\[note 9\]](https://www.bogleheads.org/wiki/Three-fund_portfolio#cite_note-10)<br>- C fund<br>- I fund<br>- F Fund, or alternately, the [G Fund](https://www.bogleheads.org/wiki/G_Fund "G Fund")"

The cell renders as a bullet list (C fund / I fund / F Fund, or alternately, the G Fund), so the line-100 wording was a paraphrase and should have carried no quote marks. The underlying claim stands; only the quote marks were wrong.

Source: https://www.bogleheads.org/wiki/Three-fund_portfolio — read 2026-10-31 — no page date — Bogleheads wiki

Summary: 2 entries — 2 corrected, 0 unverified. Credits this run: 0 (no fetches; one local file copy from finance-2027-tax-limits/raw/, no Firecrawl).

<!-- job:J-20261103-03 start -->

## Trader tax and prop-firm payouts (J-20261103-03, run 2026-11-03)

### 1. What was acquired

- 18 new content documents in `raw/` (plus 4 URL-discovery artifacts: two help-center sitemaps, two Wayback CDX/sitemap copies):
  - IRS (crawl-fetch, HTTP 200, 0 credits): Pub. 505 (2026), Pub. 587 (2025), Pub. 334 (2025), Form 1040 instructions (2025), Topic 554, About Form 6781, About Form 1099-NEC, S corporations, S corporation compensation and medical insurance issues, Pub. 535 page (discontinued-pub redirect map, kept for the record).
  - Cornell LII (crawl-fetch, HTTP 200, 0 credits): 26 U.S.C. § 199A, 26 U.S.C. § 1092, 26 C.F.R. § 1.199A-5.
  - Firms (crawl-fetch, HTTP 200, 0 credits): Topstep "Funded Trader Tax Questions"; Lucid payout-methods, registering-as-a-business, LucidPro payouts articles.
  - Firms (Firecrawl, 1 credit): Apex "1099 Forms and Tax Information" — the domain 403s crawl-fetch, WebFetch and wp-json; markdown saved to `raw/apex-1099-forms-and-tax-information.md`.
- Reused, not re-fetched: `raw/irs-p550.html`, `raw/irs-tc429.html`, `raw/usc26-1256.html` (run 1 of this target); Topstep W-9/W-8BEN wording from `prop-rules/raw/topstep-payout-policy-2026-10-26.html`; Form 6781's embedded 2025 instructions from `cme-specs/raw/j302-irs-f6781.txt` (cross-folder citations).
- HTTP 404s (not saved as content): `/instructions/i6781` (2025 instructions ship inside the form PDF), the guessed IRS SEHI-FAQ URL, `/publications/p535` (discontinued after 2022 — it is now a redirect page), and one mistyped Lucid article URL. Pub. 535's successor pages were checked; the self-employed health insurance deduction now lives in the Form 1040 instructions (Schedule 1, line 17), which were fetched.
- Firecrawl spend this run: **1 credit** (1 successful scrape, 0 failures), of the job `credit_cap` 6. Ledger line `J-20261103-03` in `~/crawl/credits.log`. Cycle (since 2026-10-19) use was roughly 360-400 of 800 before this run per the ledger fallback (no credit-usage API reachable from the worker).

### 2. Findings — topic table

One row per job topic. "Tax year" is the edition of the governing source. State/jurisdiction-dependent items are flagged in the Rule column.

| # | Topic | Rule in plain words | Figure / threshold | Tax year |
|---|---|---|---|---|
| 1 | Prop-firm payouts — Apex | US taxpayers who received PA payouts or referral fees get a Form 1099-NEC; the trader is an independent contractor responsible for reporting all income; non-US members (W-8 status) get no US 1099 and report under their own country's laws — **jurisdiction-dependent** | 1099-NEC issued late January by TaxBandits; any payout amount | 2026-04-16 page |
| 2 | Prop-firm payouts — Topstep | Funded traders are independent contractors, not employees; US citizens with $600+ in payouts get a 1099-NEC (2025 1099s sent Jan 31, 2026); under $600 or non-US: no form — **jurisdiction-dependent**; Topstep reports the GROSS payout before fees; processing fee is deducted by the trader on Schedule C | $600 payout floor for a 1099-NEC | 2025 tax year (article updated 2026-05-29) |
| 3 | Prop-firm payouts — Lucid | Lucid's help center publishes no tax article: the full sitemap (67 articles) and the payout/business-registration articles contain no 1099 or tax wording | none found | checked 2026-11-03 |
| 4 | Estimated tax + safe harbor | Pay estimated tax if you expect to owe $1,000+ after withholding/credits and withholding/credits are below the safe harbor: the smaller of 90% of current-year tax or 100% of prior-year tax (prior return must cover 12 months); if prior-year AGI was over $150,000 ($75,000 MFS), substitute 110% for 100%. Quarterly due dates Apr 15, Jun 15, Sep 15, Jan 15 | $1,000; 90%; 100% / 110%; $150,000 AGI ($75,000 MFS) | 2026 (Pub. 505) |
| 5 | SE tax on payouts vs trading gains | Prop-firm payouts are self-employment income: SE tax applies once net SE earnings reach $400, on 92.35% of net earnings; all net earnings carry Medicare tax; half of SE tax is deductible. Trading gains are the opposite: gains from selling securities as a trader are NOT subject to SE tax | $400 net-earnings threshold; 92.35% base; SS cap changes annually (2026 wage base $184,500 per run-1 table, SSA) | 2025 (Topic 554); Topic 429 current |
| 6 | Self-employed health insurance | Deduct medical, dental, vision and qualified long-term care premiums for self, spouse, dependents (and a child under 27 even if not a dependent); capped at net profit (plus other earned income) of the business under which the plan is established, minus the SE-tax half and pension-plan deductions (Schedule 1 lines 15-16); no deduction for any month you (or your spouse) were eligible for any subsidized employer plan — **spouse-employer-dependent** | child under 27; limit = net profit minus SE-tax half and plan deductions | 2025 (Form 1040 instructions) |
| 7 | Home office | Deduct a part of the home used exclusively and regularly as the principal place of business (or where clients are met); simplified method: allowable area × $5, capped at 300 square feet (= $1,500 max); deduction cannot exceed gross income from the qualified business use minus unrelated business deductions | $5/sq ft; 300 sq ft cap | 2025 (Pub. 587) |
| 8 | S-corp reasonable compensation | An S corporation must pay a shareholder-employee reasonable compensation for services before any non-wage distributions; officer distributions are wages to the extent they are reasonable compensation for services rendered; the IRS can reclassify non-wage distributions (not employment-taxed) into wages (employment-taxed) | "reasonable compensation will never exceed the amount received by the shareholder either directly or indirectly" | current IRS page |
| 9 | QBI §199A and trading as SSTB | QBI deduction = 20% of qualified business income; a specified service trade or business (SSTB) — which by statute includes performing services consisting of investing and investment management, trading, or dealing in securities, partnership interests, or commodities — is excluded above the income band, phased in over $75,000 ($150,000 joint) above the threshold amount; the regulation defines trading as a trade or business of trading in securities, commodities or partnership interests, determined by facts and circumstances including source and type of profit, regardless of trading for one's own account or others' | 20% of QBI; +$75,000 / +$150,000 phase-in band | statute + reg current |
| 10 | Wash sales and straddles for options | Wash-sale rules apply to losses on contracts and options to buy or sell STOCK OR SECURITIES — not to commodity futures or foreign currencies; options are also subject to the straddle loss-deferral rules: a loss on one straddle position is deductible only to the extent it exceeds unrecognized gain on offsetting positions; unused losses move to the next tax year | 30-day window (stock/security positions); deferral until offsetting positions disposed | 2025 (Pub. 550); §1092 current |
| 11 | Form 6781 treatment | Form 6781 reports (a) any gain or loss on section 1256 contracts under the mark-to-market rules and (b) gains and losses under section 1092 from straddle positions; options on futures qualify as section 1256 contracts via the nonequity-option category (run 1, Pub. 550 contract list) and so ride the 60/40 split of the run-1 §1256 row | 60% long-term / 40% short-term (run 1) | 2025 (About Form 6781; form dated 2025-11-12) |

### 3. Prop-firm wording, verbatim

Apex, from `raw/apex-1099-forms-and-tax-information.md`:

- "U.S. taxpayers who received PA payouts or referral fees from Apex during the prior tax year will receive a Form 1099-NEC."
- "You do not need a physical 1099 to file your taxes. As an independent contractor, you are responsible for reporting all income earned. The IRS receives a copy of the 1099 from the issuer."
- "Members who indicated they are not U.S. taxpayers (W-8 status) **do not receive a U.S. 1099**." (asterisks as in the saved markdown)

Topstep, from `raw/topstep-tax-questions.html`:

- "You're an independent contractor. Not an employee. Here's what that means for your taxes." (article description)
- "Topstep sent 2025 1099s on January 31, 2026, via email to US citizens who received over $600 in Payouts in 2025."
- "Not a US citizen, or under $600 in Payouts? No 1099 from Topstep."
- The article's forms table: "US citizen, $600+ in Payouts" → "1099-NEC"; "US citizen, under $600" → "No form from Topstep"; "Non-US citizen" → "No form from Topstep".
- Gross reporting and the fee fix, from the article's numbered steps: "Report the full $500 from your 1099-NEC as income." / "Deduct the $30 processing fee as a business expense on Schedule C." / "Net taxable income = $470."
- Payout-request paperwork, from the payout policy saved by the prop-rules job (`prop-rules/raw/topstep-payout-policy-2026-10-26.html`, "What tax forms are required?"): "W-9 for US persons, W-8BEN for non-US persons. Submitted as part of the Payout request process."

Lucid: no wording to quote — no tax article exists (see Gaps).

### 4. Key rules, verbatim (IRS)

- Estimated tax, Pub. 505: "You expect to owe at least $1,000 in tax for 2026 after subtracting your withholding and tax credits." and the safe harbor is the smaller of "90% of the tax to be shown on your 2026 tax return, or" "100% of the tax shown on your 2025 tax return. Your 2025 tax return must cover all 12 months." For higher incomes: "If your AGI for 2025 was more than $150,000 ($75,000 if your filing status for 2026 is Married filing a separate return), substitute 110% for 100% in (2b)".
- SE tax, Topic 554: "self-employment tax if you had net earnings from self-employment of $400 or more. Generally, the amount subject to self-employment tax is 92.35% of your net earnings from self-employment." Also "All of your net earnings are subject to the Medicare tax." and "you can deduct one-half of the self-employment tax".
- Trading gains, Topic 429: "Gains and losses from selling securities from being a trader aren't subject to self-employment tax."
- SEHI, Form 1040 instructions: "You may be able to deduct the amount you paid for health insurance (which includes medical, dental, and vision insurance and qualified long-term care insurance) for yourself, your spouse, and your dependents."; the cap is "your net profit* and any other earned income** from the business under which the insurance plan is established, minus any deductions on Schedule 1, lines 15 and 16."; the bar: "if you were also eligible to participate in any subsidized health plan maintained by your or your spouse’s employer for any month or part of a month in 2025, amounts paid for health insurance coverage for that month can’t be used to figure the deduction." (curly apostrophes as in source)
- Home office, Pub. 587: deductible space must be the "part of your home exclusively and regularly for business as either your principal place of business or as the place where you meet or deal with clients or customers in the normal course of your business"; simplified method line: "Multiply the allowable area by $5" and "Do not enter more than 300 square feet"; the cap: "Your deduction for business use of the home is limited to an amount equal to the gross income derived from the qualified business use of the home reduced by the business deductions that are unrelated to the use of your home."
- S-corp, IRS: "S corporations must pay reasonable compensation to a shareholder-employee in return for services that the employee provides to the corporation before non-wage distributions may be made to the shareholder-employee." and "The amount of reasonable compensation will never exceed the amount received by the shareholder either directly or indirectly."; Form 1120-S instructions as quoted on the page: "Distributions and other payments by an S corporation to a corporate officer must be treated as wages to the extent the amounts are reasonable compensation for services rendered to the corporation."; "The IRS has the authority to reclassify payments made to shareholders from non-wage distributions (which are not subject to employment taxes) to wages (which are subject to employment taxes)."
- QBI, statute (paraphrase, link-markup in raw HTML): § 199A(d)(2)(B) defines an SSTB to include a business which involves the performance of services that consist of investing and investment management, trading, or dealing in securities (as defined in section 475(c)(2)), partnership interests, or commodities (as defined in section 475(e)(2)); § 199A(d)(3)(A) keeps an SSTB fully in at taxable income below the threshold amount, phasing out over the next $75,000 ($150,000 joint). 26 C.F.R. § 1.199A-5(b)(2)(xii) defines trading as a trade or business of trading in securities, commodities, or partnership interests, tested on all relevant facts and circumstances including the source and type of profit, regardless of whether the person trades for their own account, others' accounts, or both.
- Straddles, Pub. 550: "Generally, you can deduct a loss on the disposition of one or more positions only to the extent the loss is more than any unrecognized gain you have on offsetting positions. Unused losses are treated as sustained in the next tax year."; scope: "The wash sale rules apply to losses from sales or trades of contracts and options to acquire or sell stock or securities. They do not apply to losses from sales or trades of commodity futures contracts and foreign currencies." and "Options are generally subject to the rules described in this section."
- Form 6781, About page: "Use Form 6781 to report:" … "Any gain or loss on section 1256 contracts under the mark-to-market rules." … "Gains and losses under section 1092 from straddle positions."

Source: https://www.irs.gov/publications/p505 — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/publications/p587 — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/instructions/i1040gi — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/taxtopics/tc554 — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/taxtopics/tc429 — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/publications/p550 — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/forms-pubs/about-form-6781 — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/forms-pubs/about-form-1099-nec — read 2026-11-03 — no page date — IRS
Source: https://www.irs.gov/businesses/small-businesses-self-employed/s-corporation-compensation-and-medical-insurance-issues — read 2026-11-03 — no page date — IRS
Source: https://www.law.cornell.edu/uscode/text/26/199A — read 2026-11-03 — no page date — Office of the Law Revision Counsel via Cornell LII
Source: https://www.law.cornell.edu/cfr/text/26/1.199A-5 — read 2026-11-03 — no page date — Office of the Federal Register via Cornell LII
Source: https://www.law.cornell.edu/uscode/text/26/1092 — read 2026-11-03 — no page date — Office of the Law Revision Counsel via Cornell LII
Source: https://help.topstep.com/en/articles/8284238-funded-trader-tax-questions — read 2026-11-03 — published 2026-05-29 — Topstep
Source: https://help.topstep.com/en/articles/8284233-topstep-payout-policy — read 2026-11-03 — no page date — Topstep
Source: https://apextraderfunding.com/help-center/helpful-items/1099-forms-and-tax-information/ — read 2026-11-03 — published 2026-04-16 — Apex Trader Funding
Source: https://support.lucidtrading.com/sitemap.xml — read 2026-11-03 — no page date — Lucid Trading

### 5. Gaps (this run)

- **Lucid publishes no tax article**: its help-center sitemap (67 articles, saved) and the payout-methods, registering-as-a-business and LucidPro payouts articles contain no 1099/tax wording. Lucid's 1099 practice is therefore unrecorded from its own site.
- **No firm article addresses the §1256 interplay**: neither Apex nor Topstep says whether payouts relate to §1256 treatment — both characterize payouts purely as 1099-NEC contractor income; the §1256 rows remain those of run 1 (IRS sources).
- **IRS $600 1099-NEC general filing threshold not on an HTML page**: the About Form 1099-NEC page carries only a one-line purpose statement; the $600 figure in this run comes from Topstep's own article. The general threshold lives in the 1099-NEC instructions PDF, not fetched (job note: HTML only).
- **State taxation of payouts is not covered by any acquired source** — all pages are federal; state-dependent treatment is flagged, not answered.
- **SE-tax rate breakdown (15.3% = 12.4% + 2.9%) does not appear in Topic 554's fetched text**; the row carries the page's own figures ($400, 92.35%, Medicare on all earnings) instead.
- Pub. 535 (business expenses) is discontinued after 2022 (fetched page is a redirect map) and the 2025 Pub. 334 edition no longer carries the SE health insurance deduction; the live home of the rule is the Form 1040 instructions (used).
- 2026 estimated-tax due dates are stated for calendar-year 2026 (Apr/Jun/Sep 15, 2026, Jan 15, 2027) from Pub. 505's payment table.

### 6. Source quality notes (this run)

- **Topstep's tax article is rule-bearing marketing-adjacent help content** (Intercom help center), updated 2026-05-29, with concrete figures (dates, $600 floor, gross-reporting example) — internally consistent with the W-9/W-8BEN payout-request wording held in prop-rules.
- **Apex's tax page was fetched through Firecrawl** (1 credit) because the domain 403s plain fetchers; the markdown saved is the full article body; its date (2026-04-16) is the page's own dateModified from fetch metadata. Apex outsources 1099 issuance to TaxBandits.
- **Lucid gap is evidence of absence from the sitemap**, not just from search: the complete article list is saved at `raw/lucid-help-sitemap.xml`.
- Wayback CDX and the Wayback sitemap copy were used for URL discovery only; every quoted sentence comes from a live-saved raw file.
- No AI-generated content detected in the firm articles; no utm_source=chatgpt patterns; no paywalls.
- The IRS pubs are the 2025/2026 editions carrying current-year figures; statutory/regulation text from Cornell LII is current but link-dense, so §199A/§1.199A-5 wording is paraphrased rather than quoted (quotes in this file are reserved for text saved without embedded markup).

<!-- job:J-20261103-03 end -->

<!-- job:J-20261103-05 start -->

## Insurance, affordability limits, account protection, fee drag (J-20261103-05, run 2026-11-03)

Closes the run-1 §3 gaps for the Blueprint personal-finance lessons. Four tables, one per job topic. Every figure below is quoted or cited from a saved `raw/` page fetched this run; PDFs are linked and marked unchecked, never quoted.

### 1. What was acquired

- 14 new content documents in `raw/`:
  - crawl-fetch, HTTP 200, 0 credits: NAIC "Life Insurance & Annuities" consumer page; myfloridacfo Insurance Library hub, Life Insurance overview, Annuities overview; CFPB ask-cfpb "What is a debt-to-income ratio?"; FDIC deposit-insurance landing and FAQ; Fannie Mae Selling Guide B3-6-02 (live short-path URL `/sel/b3-6-02/debt-income-ratios`, found via Wayback CDX after two long-form guesses 404'd); HUD Handbook 4000.1 information page; va.gov home-loans overview.
  - Firecrawl (investor.gov 403s crawl-fetch/WebFetch; Wayback holds no investor.gov sub-page captures at all — CDX empty and resolver 404 on six probed paths): Annuities hub, Variable Annuities page, and "How Fees and Expenses Affect Your Investment Portfolio" (July 23, 2025 edition) — markdown written to `raw/`.
  - Wayback replay, 0 credits: SIPC "What SIPC Protects" (snapshot 2026-10-17). The live sipc.org TLS-fails from this box (curl exit 60, unverifiable chain) on both crawl-fetch and WebFetch.
- Firecrawl spend this run: **7 credits** (2 searches for investor.gov URL discovery + 3 live scrapes), of the job `credit_cap` 10. Ledger lines `J-20261103-05` in `~/crawl/credits.log`. Cycle (since 2026-10-19) ledger use was ~520 of 800 before this run per the ledger fallback (no credit-usage API reachable from the worker; the ledger's own 2026-11-01 note line recorded ~433, plus all per-call lines after it, run-summary lines excluded as duplicates).
- Zero-credit fetches are not logged to the ledger; report them as 0 credits.
- Dead ends established this run, not retried: investor.gov via Wayback (nothing archived beyond the homepage); sec.gov copy of the fee bulletin (301s into investor.gov); benefits.va.gov/homeloans (redirect shell, no content).

### 2. Findings — topic tables

**Table 1 — Life insurance and annuities: what each product is, cost structure, surrender charges, regulator warnings.**

| Claim | Figure if stated | Source |
|---|---|---|
| Life insurance splits into two classes: "they generally fall into two classes of life insurance products: term and cash value" | — | NAIC |
| Term life: purchased for a period, pays on death during it; "intended to provide lower-cost coverage" (sentence hard-wraps in raw); terms "typically issued for periods of 10, 15, 20, or 30 years"; no cash value | 10/15/20/30-year terms | NAIC; FL |
| Whole life: "The cost of insurance is locked in at policy inception and premiums remain the same for the life of the insured"; "Cash values are very low or nonexistent in the early years and build up over time" | — | FL |
| Universal life: flexible premiums ("Premiums may be increased, decreased or skipped altogether"), but "The cost of insurance increases each year as the insured ages"; if underfunded, "additional premiums will be needed to keep the policy in force" | — | FL |
| Indexed universal life: "The interest paid by the company mirrors the changes in the selected indexes, within certain limits. There are no direct investments in the market." | — | FL |
| Variable universal life: cash values in separate investment accounts "not guaranteed by the insurer and are subject to market losses and gains just like mutual funds"; seller must hold a securities license and provide a prospectus | — | FL |
| Free look on life policies: policyowner "has at least 14 days to review it", full premium refund, "No surrender charges can be applied during this period" | 14 days | FL |
| Grace period (life): no less than 30 days after the premium due date | 30 days | FL |
| Non-forfeiture: after lapse/surrender the owner has 60 days to choose cash surrender / extended term / reduced paid-up | 60 days | FL |
| Annuity value mechanics: "The value in an annuity contract is the amount in premiums you have paid, minus any applicable charges, plus any interest your premiums have earned." | — | NAIC |
| Fixed annuity: "earns interest at a rate the insurer sets"; carries a "guaranteed minimum interest rate" that "can't change as long as you own the annuity" | — | NAIC |
| Fixed indexed annuity: interest keyed to an index; "The interest rate is guaranteed to never be less than zero, even if the market goes down." FL's version: "there is no downside market risk with an indexed annuity; however, gains in any given year may be zero." | 0% floor | investor.gov; FL |
| Registered index-linked annuity (RILA): unlike a fixed indexed annuity "you can lose money in a RILA"; gains and losses both limited by contract parameters | — | investor.gov |
| Variable annuity: "Yes. You can lose money in a variable annuity, including potential loss of your original investment."; "Variable annuities are recognized by the Securities and Exchange Commission as a securities product" (prospectus required at sale) | unlimited loss potential | investor.gov; FL |
| Annuity cost structure (variable): base contract fee "often referred to as a Mortality and Expense (M&E) Risk Charge. It is calculated as a percentage of your contract value, such as 1.25% per year."; administration "as a flat account maintenance fee (perhaps $25 or $50 per year) or as a percentage of your account value (typically in the range of 0.15% per year)"; plus underlying mutual-fund fees and optional-benefit rider fees | 1.25% / 0.15% / $25-50 per year | investor.gov |
| Annuity cost structure (fixed/indexed, implicit): "an insurer may credit you 3% interest while it earns 4% interest on your investment"; caps "limit the amount of positive gains your annuity can earn"; "These implicit costs can reduce your return in the same way that a direct or explicit fee would." | 3% vs 4% example | investor.gov |
| Worked fee example: "if your base contract fee is 1.25% and the current value of your annuity is $300,000, your annual fee would be $3,750" | $3,750/yr | investor.gov |
| Surrender charges: "Most annuity contracts charge a significant surrender penalty on any funds withdrawn in the first several years"; "most contracts allow for a surrender fee withdrawal of 10% per year" (free amount); the penalty is "a percentage of the amount withdrawn" and "declines each year until it reaches zero"; exchanging into a new annuity starts a new surrender period | 10%/yr free withdrawal | FL |
| Early-withdrawal tax: before age 59½ "you may have to pay a 10% tax penalty to the Internal Revenue Service on top of any taxes you owe" | 10% + age 59½ | investor.gov |
| Regulator warnings: "Annuities are only appropriate for investors with a long-term investment time horizon."; free look "usually 10 to 30 days"; inside an IRA/401(k) "you get no additional tax advantage from the variable annuity"; bonus-credit annuities (extra 1%-5% of purchase payments) "may impose higher fees and expenses"; some "guaranteed benefits" are contingent protections "you may be paying for a benefit that will not provide a financial return" | bonus 1%-5% | investor.gov |

Source: https://content.naic.org/consumer/life-insurance.htm — read 2026-11-03 — no page date — NAIC
Source: https://www.myfloridacfo.com/division/consumers/understanding-insurance/lifeinsuranceoverview — read 2026-11-03 — no page date — Florida Department of Financial Services
Source: https://www.myfloridacfo.com/division/consumers/understanding-insurance/annuityoverview — read 2026-11-03 — no page date — Florida Department of Financial Services
Source: https://www.investor.gov/introduction-investing/investing-basics/investment-products/annuities — read 2026-11-03 — no page date — SEC Investor.gov
Source: https://www.investor.gov/introduction-investing/investing-basics/investment-products/annuities/variable-annuities — read 2026-11-03 — no page date — SEC Investor.gov

**Table 2 — Housing and car affordability: DTI limits and official numeric rules.**

| Claim | Figure if stated | Source |
|---|---|---|
| DTI definition: "Your debt-to-income ratio (DTI) is all your monthly debt payments divided by your gross monthly income."; worked example: $1,500 mortgage + $100 auto + $400 other = $2,000 of debt against $6,000 gross income, "is 33% of" it | example 33% | CFPB |
| CFPB states no universal limit: "Different loan products and lenders will have different DTI limits." | none | CFPB |
| Fannie Mae, manually underwritten loans: "Fannie Mae’s maximum total DTI ratio is 36% of the borrower’s stable monthly income. The maximum can be exceeded up to 45% if the borrower meets the credit score and reserve requirements" (Eligibility Matrix) | 36%, up to 45% | Fannie Mae B3-6-02 |
| Fannie Mae, Desktop Underwriter (DU) loans: "For loan casefiles underwritten through DU, the maximum allowable DTI ratio is 50%." Re-underwriting rule: a recalculated ratio above 45% (manual) or 50% (DU) makes the loan ineligible for delivery | 50% | Fannie Mae B3-6-02 |
| FHA: the DTI standards live in Handbook 4000.1, published as PDF — linked, **unchecked** (job rule: HTML only). The HUD HTML page fetched states the handbook's role and links the PDF at hud.gov/hudclips/handbooks/housing | PDF, unchecked | HUD |
| VA: residual-income tables live in the VA Lender's Handbook (Pamphlet 26-7, PDF — linked, **unchecked**). The fetched va.gov HTML overview and the benefits.va.gov page (a redirect shell) contain no residual-income or DTI numbers | PDF, unchecked | VA |
| Cars: no official numeric affordability rule exists in any acquired source. CFPB's auto-loans pages (run 1, saved `raw/cfpb-auto-loans.html`) give process guidance only; no 20/4/10-style rule from any regulator page. Not invented here | none found | CFPB |

Source: https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/ — read 2026-11-03 — published 2023-08-28 — CFPB (page's own date is "last reviewed")
Source: https://selling-guide.fanniemae.com/sel/b3-6-02/debt-income-ratios — read 2026-11-03 — no page date — Fannie Mae
Source: https://www.hud.gov/hud-partners/single-family-handbook-4000-1 — read 2026-11-03 — no page date — HUD
Source: https://www.va.gov/housing-assistance/home-loans/ — read 2026-11-03 — no page date — U.S. Department of Veterans Affairs

**Table 3 — FDIC vs SIPC: what each covers and doesn't.**

| Claim | Figure if stated | Source |
|---|---|---|
| FDIC covers deposit products (checking, savings, MMDA, CDs) at failed banks; automatic, no purchase needed; "FDIC insurance is backed by the full faith and credit of the United States government" | — | FDIC |
| FDIC limit: "Deposits are insured up to at least $250,000 per depositor, per FDIC-insured bank, per ownership category" | $250,000 per depositor / bank / ownership category | FDIC |
| FDIC categories stack at one bank: a revocable trust (POD) account "with one owner naming three unique beneficiaries can be insured up to $750,000" | $750,000 example | FDIC |
| FDIC does NOT cover: "Investment products that are not deposits, such as mutual funds, annuities, life insurance policies and stocks and bonds, are not covered by FDIC deposit insurance." | — | FDIC |
| SIPC covers custody failure, not market loss: "SIPC protects against the loss of cash and securities – such as stocks and bonds – held by a customer at a financially-troubled SIPC-member brokerage firm. The limit of SIPC protection is $500,000, which includes a $250,000 limit for cash." | $500,000, incl. $250,000 cash | SIPC |
| SIPC does NOT protect: "SIPC does not protect against the decline in value of your securities."; worthless securities sold to you; "losses due to a broker's bad investment advice, or for recommending inappropriate investments" | — | SIPC |
| SIPC on the contrast with FDIC: "SIPC protection is not the same as protection for your cash at a Federal Deposit Insurance Corporation (FDIC) insured banking institution because SIPC does not protect the value of any security." | — | SIPC |
| SIPC also excludes: "SIPC does not protect commodity futures contracts (unless held in a special portfolio margining account), or foreign exchange trades", and digital/crypto assets that are not securities | — | SIPC |

Source: https://www.fdic.gov/resources/deposit-insurance/ — read 2026-11-03 — no page date — FDIC
Source: https://www.fdic.gov/resources/deposit-insurance/faq — read 2026-11-03 — no page date — FDIC
Source: http://web.archive.org/web/20261017094858/https://www.sipc.org/for-investors/what-sipc-protects — read 2026-11-03 — no page date — SIPC (Wayback snapshot 2026-10-17; live site TLS-unreachable from this box)

**Table 4 — Fee drag: how expense ratios and advisory fees compound.**

| Claim | Figure if stated | Source |
|---|---|---|
| Core regulator statement: "These fees may seem small, but over time they can have a major impact on your investment portfolio. This is because fees and expenses reduce the amount of money in your investment portfolio earning a return." | — | SEC |
| SEC worked chart, "a $100,000 investment that grows 4% annually over 20 years": annual fee 0.25% ends "approximately $208,000"; 0.50% ends "approximately $198,000"; 1.00% ends "approximately $179,000" | $208k / $198k / $179k | SEC |
| Expense ratios: fund operating expenses are "charged as a percentage of the fund’s assets" (the expense ratio), deducted from fund assets so they lower returns indirectly | — | SEC |
| Advisory fees: an adviser "may charge you an ongoing annual fee based on the value of your portfolio. As shown in the graph above, the amount of the fee can have a big impact on your return." | — | SEC |
| Ongoing vs one-time: "Over time, even small ongoing fees have a big impact on your investment portfolio."; surrender charges on early annuity exit pay the professional's commission | — | SEC |
| Layered-product warning (ties to Table 1): variable annuities stack M&E + admin + underlying-fund fees + rider fees (1.25% + ~0.15% + fund expenses on top), the mechanism by which fee drag compounds inside insurance wrappers | see Table 1 | SEC; investor.gov |

Source: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated — read 2026-11-03 — published 2025-07-23 — SEC Investor.gov
Source: https://www.investor.gov/introduction-investing/investing-basics/investment-products/annuities/variable-annuities — read 2026-11-03 — no page date — SEC Investor.gov

### 3. Gaps (this run)

- **FHA numeric DTI limits unchecked**: they live in HUD Handbook 4000.1, published only as PDF (hud.gov/hudclips/handbooks/housing). Per the job's HTML-only rule it is linked and marked unchecked; no FHA number appears in this run's output.
- **VA residual income unchecked**: the residual-income tables by region/family size live in the VA Lender's Handbook (Pamphlet 26-7, PDF). va.gov's HTML pages carry no underwriting numbers; the old benefits.va.gov/homeloans page is a redirect shell. Any specific residual-income dollar figure in output would be unsourced, so none is given.
- **Car affordability**: no official numeric rule found anywhere (CFPB auto-loans pages, run 1 and this run's DTI page). Commercial-blog heuristics (20/4/10, 10-15% of pay) are deliberately NOT recorded — the job forbids inventing or borrowing unsourced rules.
- **NAIC buyer's guides are PDFs**: the NAIC life page links "consumer-what-to-know-before-buying-annuity.pdf" and the publications hub's guides; none quoted (HTML-only rule).
- **investor.gov life-insurance intro pages not acquired**: Wayback holds no investor.gov sub-page captures (only the homepage), and the live site 403s plain fetchers, so acquisition was Firecrawl-only and capped at three pages chosen for maximum rule density (annuity hub, variable annuities, fee bulletin). SEC-specific variable-LIFE or life-insurance buyer guidance remains unacquired (Florida's page covers VUL definitions).
- **SIPC quoted from a Wayback snapshot (2026-10-17)**, not the live site, because sipc.org's certificate chain cannot be verified from this box; wording could have changed since.
- **The classic "28/36" rule** appears on no official page acquired; Fannie's 36%/45%/50% stack is the closest underwriting-grade source and is scoped to its own loan programs.

### 4. Source quality notes (this run)

- **All rule-bearing sources are regulators or a government-sponsored enterprise**: SEC investor.gov (3 pages, Firecrawl, maxAge 0 live), CFPB, FDIC (2), SIPC (Wayback), NAIC, Florida DFS (3), HUD, VA, Fannie Mae Selling Guide. No commercial blogs were used for any figure.
- **Fannie Mae's Selling Guide URL structure changed**: the long descriptive URLs still returned by search engines 404; the live path is the short `/sel/b3-6-02/debt-income-ratios` (found via Wayback CDX listing). The CDX listing also showed B3-6-02 capture variants with `utm_source=chatgpt.com` — evidence of AI-assistant citation traffic to that page, not a content-quality issue; the live page fetched directly is authoritative.
- **SIPC**: TLS chain unverifiable from this box (curl exit 60) on both fetchers; the Wayback replay copy is complete and every SIPC quote was verified against the saved replay file. The `id_` snapshot returned gzip bytes (kept unquoted as an artifact: `raw/sipc-what-protects.html`).
- **investor.gov 403s all plain fetch routes** and is effectively unarchived by Wayback; the three pages fetched via Firecrawl are the site's current live text (bulletin dated July 23, 2025). The fee bulletin carries the SEC staff-guidance disclaimer that it "has no legal force or effect".
- **Florida DFS pages** are state-regulator consumer education with full glossaries; one source typo ("your principle in the short term") is excluded from all quotes. Quotes from `raw/` files are verbatim, typographic apostrophes included; anything paraphrased carries no quote marks.
- **CFPB ask-cfpb date**: the page's only date is "last reviewed: AUG 28, 2023"; the Source line uses that date as the published date with a note in the table.
- No AI-generated source content detected; no paywalls; no login walls.

<!-- job:J-20261103-05 end -->

<!-- job:J-20261031-15 end -->

<!-- job:J-20261103-09 start -->
## J-20261103-09 — Federal benefits and retirement income (run 2026-11-03)

### 1. What was acquired

8 saved raw files from 8 pages, all read 2026-11-03. Firecrawl credits used: 8 of the 8 cap, matching the 7 J-20261103-09 lines in `credits.log`: OPM FERS computation (1), OPM FEGLI (1), SSA age reduction (1), SSA delayed credits (1), one scrape of a guessed IRS 457(b) URL (1, HTTP 404), one search for the real IRS URL (2), one scrape of a guessed tsp.gov URL (1, HTTP 404). Zero-credit fetches: Medicare costs page and three IRS pages via crawl-fetch (0 credits).

| Source | HTTP | Saved as |
|---|---|---|
| opm.gov FERS computation | 200 (Firecrawl) | `finance-education-reference/raw/j09-opm-fers-computation.md` (verbatim excerpt) |
| opm.gov FEGLI overview | 200 (Firecrawl) | `finance-education-reference/raw/j09-opm-fegli.md` |
| ssa.gov age reduction | 200 (Firecrawl) | `finance-education-reference/raw/j09-ssa-agereduction.md` |
| ssa.gov delayed credits | 200 (Firecrawl) | `finance-education-reference/raw/j09-ssa-delayret.md` |
| medicare.gov costs | 200 (crawl-fetch) | `finance-education-reference/raw/j09-medicare-costs.html` |
| irs.gov 457(b) overview | 200 (crawl-fetch) | `finance-education-reference/raw/j09-irs-457b.html` |
| irs.gov Topic 558 | 200 (crawl-fetch) | `finance-education-reference/raw/j09-irs-tc558.html` |
| irs.gov early-distribution exceptions | 200 (crawl-fetch) | `finance-education-reference/raw/j09-irs-early-exceptions.html` |

Failed: opm.gov (3 pages), ssa.gov (3 pages), via crawl-fetch HTTP 403; irs.gov guessed URLs HTTP 404 (5 tries); tsp.gov/withdrawals/ HTTP 404 (Firecrawl).

### 2. Findings

**Table 1 — FERS basic annuity, reductions, survivor option.**

| Formula or threshold | Effective year | Source |
|---|---|---|
| Basic annuity = 1% of high-3 average salary per year of service ("1 percent of your high-3 average salary for each year of service") if under 62 at separation, or 62+ with under 20 years | current page; 2027 pending (none published) | OPM |
| 1.1% of high-3 per year of service if 62 or older at separation with 20+ years | same | OPM |
| High-3 = highest average basic pay over any 3 consecutive years; excludes overtime and bonuses; service counted in whole months | same | OPM |
| Special provision (air traffic controllers, firefighters, law enforcement, Capitol/Supreme Court police, nuclear couriers): 1.7% x high-3 x first 20 years, plus 1% x years over 20 | same | OPM |
| MRA+10 retirement: reduced 5/12 of 1% per full month (5% a year) under age 62; no reduction with 30+ years of service, or 20+ years with annuity starting at 60 | same | OPM |
| Survivor option: electing 50% of the benefit reduces the annuity by 10%; 25% reduces it by 5% | same | OPM |
| COLA: payable if over 62 (and for special-provision, disability, or CSRS-component cases); other FERS retirees under 62 get none until 62 | same | OPM |

Source: https://www.opm.gov/retirement-center/fers-information/computation/ — read 2026-11-03 — no page date — no author

**Table 2 — TSP withdrawals and Roth TSP RMD status.** Not acquired. Contribution limits and traditional-vs-Roth are already held in earlier sections of this file; see Gaps.

**Table 3 — 457(b) for state and local employees.**

| Formula or threshold | Effective year | Source |
|---|---|---|
| Elective deferral limit: IRC 402(g) limit, $24,500 in 2026 ($23,500 in 2025) | 2026; 2027 pending | IRS |
| Age-50+ catch-up in governmental 457(b): up to $8,000, making the 2026 limit $32,500 | 2026; 2027 pending | IRS |
| Ages 60 through 63 "super" catch-up up to $11,250 in 2026 if the plan permits | 2026; 2027 pending | IRS |
| Age-50 catch-up must be Roth for prior-year wages over $145,000 (indexed); no Roth option means catch-up is $0 for them | 2026 | IRS |
| No 10% early-withdrawal tax: an eligible governmental section 457 plan is not a qualified plan and "any distribution from such plan isn't subject to the 10% additional tax on early distributions"; amounts rolled in from a qualified plan or IRA remain subject | current | IRS |

Source: https://www.irs.gov/retirement-plans/irc-457b-deferred-compensation-plans — read 2026-11-03 — no page date — no author
Source: https://www.irs.gov/taxtopics/tc558 — read 2026-11-03 — no page date — no author
Source: https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions — read 2026-11-03 — no page date — no author

(raw files: `finance-education-reference/raw/j09-irs-457b.html`, `finance-education-reference/raw/j09-irs-tc558.html`, `finance-education-reference/raw/j09-irs-early-exceptions.html`)

**Table 4 — HSA with FEHB high-deductible plans.** Not acquired; see Gaps.

**Table 5 — Social Security claiming-age effects.**

| Formula or threshold | Effective year | Source |
|---|---|---|
| Earliest start age 62; benefit reduced for each month before full retirement age | current (page certified 2024-09-30) | SSA |
| Full retirement age 67 for birth year 1960+; 66 for 1943-1954; 66+2m (1955) up to 66+10m (1959) | current | SSA |
| Claiming at 62 cuts a benefit by 30.00% if born 1960+ (25.00% if born 1943-1954); percentages approximate | current | SSA |
| Delayed credits: 8.0% per year (2/3 of 1% per month) for birth year 1943 or later; stop at age 70 | current (page certified 2024-10-11) | SSA |
| Some credits for retiring before 70 apply only the following January | current | SSA |

Source: https://www.ssa.gov/benefits/retirement/planner/agereduction.html — read 2026-11-03 — no page date — no author
Source: https://www.ssa.gov/benefits/retirement/planner/delayret.html — read 2026-11-03 — no page date — no author

(raw files: `finance-education-reference/raw/j09-ssa-agereduction.md`, `finance-education-reference/raw/j09-ssa-delayret.md`)

**Table 6 — Medicare IRMAA (Part B/Part D) and Roth conversions.**

| Formula or threshold | Effective year | Source |
|---|---|---|
| Premium tiers key off modified adjusted gross income reported on the tax return from 2 years earlier (2024 income sets 2026 premiums) | 2026; 2027 pending | medicare.gov |
| First threshold: MAGI above $109,000 individual / married filing separately, above $218,000 joint | 2026; 2027 pending | medicare.gov |
| Part B monthly: $202.90 at or under threshold; $284.10 (to $137k single / $274k joint); $405.80 (to $171k / $342k); $527.50 (to $205k / $410k); $649.20 (under $500k / $750k; MFS under $391k); $689.90 at $500k+ / $750k+ / MFS $391k+ | 2026; 2027 pending | medicare.gov |
| Part D IRMAA added to plan premium: $14.50, $37.50, $60.40, $83.30, $91.00 for the same tiers | 2026; 2027 pending | medicare.gov |
| Roth-conversion link: the page defines the test as MAGI on the return from 2 years ago; the page does not itself mention Roth conversions, so the conversion-triggers-IRMAA point is an inference from the 2-year lookback, not a sourced statement | — | medicare.gov |
| Relief: after a life-changing event that reduced household income, a person can ask Social Security to lower the additional amount | current | medicare.gov |

Source: https://www.medicare.gov/basics/costs/medicare-costs — read 2026-11-03 — no page date — no author

(raw file: `finance-education-reference/raw/j09-medicare-costs.html`; table values are HTML-escaped inside the file)

**Table 7 — FEGLI: what it is and how cost is set.**

| Formula or threshold | Effective year | Source |
|---|---|---|
| FEGLI "provides group term life insurance"; no cash value or paid-up value; Basic plus three Optional forms; Basic needs to be held to elect options | current | OPM |
| Basic: new employees usually covered automatically (waivable); cost shared, employee pays 2/3 and Government 1/3; age does not affect Basic cost | current | OPM |
| Optional insurance: employee pays full cost; cost depends on age; election is not automatic | current | OPM |
| Claims paid by OFEGLI, a private entity under contract; program started Aug 29, 1954; 4+ million covered | current | OPM |
| Per-$1,000 premium rates are on separate OPM pages (employee, annuitant) not acquired | — | OPM |

Source: https://www.opm.gov/healthcare-insurance/life-insurance/ — read 2026-11-03 — no page date — no author

(raw file: `finance-education-reference/raw/j09-opm-fegli.md`)

### 3. Gaps

- **TSP withdrawals/installments and Roth TSP RMD status**: not acquired. tsp.gov/withdrawals/ is HTTP 404 (live site structure unknown; the 404 page lists no withdrawals link); further guessing would burn the 4-page tsp.gov limit and credits. Needs a human-supplied URL or a Firecrawl search on the next run.
- **FERS minimum retirement age table and special retirement supplement**: the OPM eligibility/types pages 403 to crawl-fetch and were not scraped (credit cap reached). Only the MRA+10 reduction rule (from the computation page) is held.
- **FERS survivor options beyond the 50%/25% reductions**: OPM survivor-benefit page not acquired.
- **HSA with FEHB HDHPs**: not acquired. opm.gov HSA page 403s crawl-fetch; Pub 969 in raw/ is a 2025 edition covering generic HDHP rules only, with no FEHB-specific statement.
- **Social Security**: the two SSA planner pages are certified 2024; no 2026/2027 SSA-authored update checked. COLA/2027 figures pending.
- **IRMAA 2027 thresholds**: not published on the page read; marked pending. FEGLI premium rates: not acquired.
- **Pending/unchecked PDFs**: IRS Publication 4484 (linked from the 457(b) page, unchecked); OPM FEGLI Life Insurance Overview PDF (unchecked).

### 4. Source quality notes

- All sources are federal agency pages (OPM, SSA, CMS/medicare.gov, IRS). No AI-generated content detected; no paywalls; no login walls.
- Firecrawl results for OPM and SSA came back with `cacheState` hit (OPM computation cached 2026-11-03T14:43Z; SSA pages cached earlier the same day), so they are cached copies rather than live fetches; OPM FEGLI was a live miss.
- OPM raw files are verbatim excerpts re-typed from the Firecrawl markdown (navigation and CSRS/disability sections omitted), not byte-for-byte page captures.
- Two Firecrawl credits were spent on guessed URLs that 404'd (irs.gov, tsp.gov); lesson recorded in Gaps.

### 5. Verification pass (second pass)

See progress.md entry for this job.

<!-- job:J-20261103-09 end -->

<!-- job:J-20261105-02 start -->
## J-20261105-02 — Federal benefits gap-fill: TSP withdrawals, FERS MRA/supplement (run 2026-11-05)

### 1. What was acquired

- tsp.gov Withdrawals in retirement: `finance-education-reference/raw/j0502-tsp-withdrawals-in-retirement.md` (Firecrawl scrape, HTTP 200; verbatim sections, boilerplate omitted). URL found via a Firecrawl search, since tsp.gov home-page links held no withdrawals link.
- OPM FERS Eligibility: `finance-education-reference/raw/j0502-opm-fers-eligibility.md` (Firecrawl scrape, HTTP 200, cacheState hit cached 2026-11-03).
- OPM FERS Annuity Supplement Survey FAQ: `finance-education-reference/raw/j0502-opm-fers-supplement-survey.md` (Firecrawl scrape, HTTP 200).
- Reused, no new fetch: `finance-education-reference/raw/tsp-traditional-roth.md` (Roth RMD statement).
- Credits: 10 of 10 cap (tsp.gov home scrape 1, tsp search 2, tsp withdrawals scrape 1, OPM search 2, OPM eligibility scrape 1, OPM search 2, OPM survey scrape 1) = 10 ledger credits in `credits.log` for J-20261105-02. Firecrawl map was denied in this session. Cycle balance API not reachable; ledger sum is only approximate.
- Search-result text (tsp.gov, opm.gov handbook chapter 51, RI 90-8) is server-side, not saved; none of it is used below.

### 2. Findings

**TSP withdrawals after separation**

| Rule | Value | Effective year | Source |
|---|---|---|---|
| Options for a separated participant | partial distribution, total distribution, annuity purchase, installments (automatic withdrawals); any combination | current page, no year stated | tsp.gov Withdrawals in retirement |
| Minimum balance to keep an account after separation | vested balance of $200 or more | current page | same |
| Minimum partial distribution | $1,000; allowed while receiving installments | current page | same |
| Installment frequency | monthly, quarterly or annually | current page | same |
| Installment amount | fixed dollar amount (at least $25), or life expectancy (IRS tables, recalculated each January) | current page | same |
| First installment / later payments | first up to six months out; later payments on the 15th (prior business day if weekend/holiday) | current page | same |
| Annuity purchase minimum | $3,500, applied to traditional and Roth balances separately | current page | same |
| Current annuity interest rate | 5.450% | rate shown at read date 2026-11-05 | same |
| Request cut-off | requests entered before noon eastern are processed that night | current page | same |
| 10% penalty and life-expectancy installments | exception to the 10% penalty, but retroactive if stopped or extra money taken within five years of starting or before age 59½ | current page | same |
| Rollover of installments | traditional money only, only for fixed-dollar installments expected to last less than 10 years | current page | same |
| 2027 values | pending; page does not state a 2027 change | 2027 pending | — |

Source: https://www.tsp.gov/withdrawals-in-retirement/ — read 2026-11-05 — no page date — no author

Quote from the page: "Partial distributions must be at least $1,000." Cited file: `finance-education-reference/raw/j0502-tsp-withdrawals-in-retirement.md`.

**Roth TSP and required minimum distributions**

| Rule | Value | Effective year | Source |
|---|---|---|---|
| Roth TSP balance and RMDs | the page says the Roth balance is not subject to IRS RMDs | read 2026-10-31 | tsp.gov Traditional and Roth contributions |
| RMD age and rules for the traditional balance | not acquired (page links tsp.gov/taking-money-from-your-account/#required-minimum-distributions-rmds, unread) | — | gap |

Source: https://www.tsp.gov/traditional-and-roth-contributions/ — read 2026-10-31 — no page date — no author

Cited file: `finance-education-reference/raw/tsp-traditional-roth.md` (line 51).

Linked TSP booklets, PDF, unchecked: https://www.tsp.gov/publications/tspbk25.pdf (Distributions), https://www.tsp.gov/publications/tspbk26.pdf (Tax Rules about TSP Payments), https://www.tsp.gov/publications/tspbk02.pdf.

**FERS minimum retirement age (MRA)**

| If born | MRA | Effective year | Source |
|---|---|---|---|
| Before 1948 | 55 | current OPM page; 2027 not applicable (birth-year table) | OPM FERS Eligibility |
| 1948 | 55 and 2 months | same | same |
| 1949 | 55 and 4 months | same | same |
| 1950 | 55 and 6 months | same | same |
| 1951 | 55 and 8 months | same | same |
| 1952 | 55 and 10 months | same | same |
| 1953-1964 | 56 | same | same |
| 1965 | 56 and 2 months | same | same |
| 1966 | 56 and 4 months | same | same |
| 1967 | 56 and 6 months | same | same |
| 1968 | 56 and 8 months | same | same |
| 1969 | 56 and 10 months | same | same |
| 1970 and after | 57 | same | same |
| Immediate retirement | age 62/5 yrs; 60/20; MRA/30; MRA/10 | same | same |
| MRA with 10 to under 30 yrs | benefit reduced 5% a year for each year under 62, unless 20 years and benefit starts at 60 or later | same | same |

Source: https://www.opm.gov/retirement-center/fers-information/eligibility/ — read 2026-11-05 — no page date — no author

Cited file: `finance-education-reference/raw/j0502-opm-fers-eligibility.md`.

**FERS annuity supplement (special retirement supplement)**

| Rule | Value | Effective year | Source |
|---|---|---|---|
| Earnings test | supplement portion is subject to an annual earnings test | current OPM page | OPM supplement survey FAQ |
| Exempt amount | $23,400 | 2025; 2027 pending | same |
| Reduction above the exempt amount | $1 for every $2 over the limit; the annuity itself is not affected | current OPM page | same |
| Counts as earnings | pay, self-employment net earnings, deferred income (full list in the page, not copied) | current OPM page | same |
| TSP disbursements | do not count as earnings | current OPM page | same |
| Social Security disability | does not cancel the supplement | current OPM page | same |
| Eligibility and the supplement formula | not acquired from an HTML page (OPM CSRS/FERS Handbook chapter 51, https://www.opm.gov/retirement-center/publications-forms/csrsfers-handbook/c051.pdf, PDF, unchecked) | — | gap |

Source: https://www.opm.gov/support/retirement/faq/fers-annuity-supplement-survey/ — read 2026-11-05 — no page date — no author

Quote from the page: "TSP disbursements do not count as earnings." Cited file: `finance-education-reference/raw/j0502-opm-fers-supplement-survey.md`.

**HSA with FEHB high-deductible plans**

Not acquired this run (credit cap reached). See Gaps.

### 3. Gaps

- **HSA eligibility with FEHB HDHPs**: not acquired. The 10-credit cap was spent on the TSP page discovery and the OPM MRA/supplement pages. IRS Pub 969 in raw/ (2025 edition) holds no FEHB mention (grep for FEHB and "federal employees health" returned nothing). Needs a new run with an OPM HDHP/HSA URL.
- **FERS supplement eligibility and formula**: only the earnings-test FAQ is held; handbook chapter 51 is a linked PDF, unchecked.
- **TSP RMD age and traditional-balance RMD rules**: not acquired; the TSP taking-money page was not scraped.
- **2027 values**: TSP annuity rate is a live rate; the supplement exempt amount shown is for 2025; no 2027 figure published on the pages read (2027 pending).
- **Firecrawl map**: denied in this session, so the tsp.gov URL was found via search instead.

### 4. Source quality notes

- All sources are federal agency pages (TSP, OPM). No AI-generated content detected; no paywalls or login walls.
- The OPM eligibility scrape was a cache hit (cached 2026-11-03T14:43Z); the TSP pages and OPM FAQ were live misses.
- The TSP and OPM raw files are verbatim excerpts re-typed from the Firecrawl markdown (navigation, contact forms and chat widgets omitted; some sections omitted), not byte-for-byte page captures.

### 5. Verification pass (second pass)

See progress.md entry for this job.

<!-- job:J-20261105-02 end -->

<!-- job:J-20261105-16 start -->
## HSA with FEHB high-deductible plans (J-20261105-16, 2026-11-05)

### 1. What was acquired

- One page: https://www.opm.gov/healthcare-insurance/healthcare/health-savings-accounts/ — Firecrawl scrape, HTTP 200, 1 credit (credits.log matches). The page carries Introduction, HSA, HRA, LEX HCFSA, Comparison, Worksheet and FAQs inline, so the `/tabs/introduction/` and `/tabs/faqs/` URLs were not fetched (0 credits spent on them).
- Saved raw: `finance-education-reference/raw/j16-opm-hsa-excerpts.md`, verbatim passages only (the full scrape was a tool-result file outside ~/crawl that crawl-cp rejects).

### 2. Findings

| Rule | Value | Effective year | Source |
|---|---|---|---|
| HSA eligibility with an FEHB HDHP | Member enrolled in an HDHP, not enrolled in Medicare or another health plan, not claimed as a dependent on someone else's Federal tax return | none stated on page | OPM HSA page, `raw/j16-opm-hsa-excerpts.md` |
| Premium pass-through deposit | Plan deposits a portion of the premium into the HSA each month; the amount differs for Self Only vs Self Plus One / Self and Family; pass-through is not income and not deductible; the dollar amount varies by plan (see brochure) | none stated on page | OPM HSA page, `raw/j16-opm-hsa-excerpts.md` |
| HRA fallback | Members who select an HSA-qualified HDHP but are not eligible for an HSA get an HRA, funded with the same pass-through credits, mostly credited annually in January; no voluntary contributions; credits forfeited on switching plans or leaving federal employment other than to retire | none stated on page | OPM HSA page, `raw/j16-opm-hsa-excerpts.md` |
| Regular health care FSA alongside an HSA | Not allowed; a limited-expense HCFSA (dental and vision) is allowed | none stated on page | OPM HSA page, `raw/j16-opm-hsa-excerpts.md` |
| Medicare cut-off | Enrolled in Medicare (Part A or Part B) = not HSA-eligible; plan stops HSA contributions and opens an HRA; existing HSA stays usable for qualified expenses | none stated on page | OPM HSA page, `raw/j16-opm-hsa-excerpts.md` |

Quotes (each copied from `finance-education-reference/raw/j16-opm-hsa-excerpts.md`):
- Eligibility: "Health Savings Accounts (HSAs) are available to members who enroll in a high deductible health plan (HDHP), are not enrolled in Medicare or another health plan, and are not claimed as a dependent on someone else’s Federal tax return."
- Pass-through: "The health plan passes through a portion of the health plan premium as a deposit to the HSA each month."
- HRA: "If you select an HSA-qualified high deductible health plan (HDHP) and you are not eligible for an HSA, you will be given an HRA."
- FSA bar: "However, you are not allowed to have both an HSA and a Health Care FSA at the same time unless it is a Limited Healthcare FSA (LEX HCFSA)."
- Medicare: "If you are enrolled in Medicare, you are not eligible for an HSA. The Plan will provide an HRA instead."
- Medicare after 65: "Yes. You are eligible for an HSA after age 65 unless you are enrolled in Medicare Part A or Part B."

Source: https://www.opm.gov/healthcare-insurance/healthcare/health-savings-accounts/ — read 2026-11-05 — no page date — no author

Dollar figures on the same page conflict by year and are not tabulated as current rules: the FAQ prints a maximum contribution of "$3,600 for Self Only coverage and $7,200 for Self Plus One or Self and Family coverage", while the comparison chart text cites 2018 limits ($3,500/$7,000) and HDHP deductibles that differ from the FAQ's 2021 figures. Treat all dollar amounts on this page as stale; the page links a "2027 HSA Net Amounts & HDHP" spreadsheet that was not fetched.

Source: https://www.opm.gov/healthcare-insurance/healthcare/health-savings-accounts/ — read 2026-11-05 — no page date — no author

### 3. Gaps

- No effective year is stated for any rule in the table; the page has no date.
- Current-year IRS HSA limits and FEHB HDHP deductible/out-of-pocket figures: not acquired (page figures are stale; 2027 net-amounts spreadsheet not fetched, out of job scope).
- Plan-specific pass-through dollar amounts: not acquired (plan brochures / spreadsheet).
- Resolves the "HSA eligibility with FEHB HDHPs" gap listed under J-20261105-02 above.

### 4. Source quality notes

- Federal agency page (OPM); no AI-generated content detected; no paywall. Live Firecrawl miss (cacheState miss).
- The raw file is verbatim excerpts, not a full page capture.

### 5. Verification pass (second pass)

Re-checked each quote above against `raw/j16-opm-hsa-excerpts.md` by grep (see progress.md entry).

<!-- job:J-20261105-16 end -->
