# The Blueprint — Module Standard

Version 1.0 · 2026-10-28
How every lesson page is built. Derived from a study of how SMB Capital teaches (26 lessons,
Oct 2025 – Oct 2026) and the structure of Bellafiore's One Good Trade and The PlayBook, adapted
to a solo author, a text site, and the content rules in BLUEPRINT_DOC section 7. This is a
presentation standard. It borrows the shape of their teaching and none of their material.

Claude Code writes every module page against this file and `METHODOLOGY_v2.md` /
`TAXONOMY.md`. Where this file and the content rules disagree, the content rules win.

---

## 1. One page, one reader, one thing

Every module is written to one imagined trader about one thing they do. Name the thing in the
first sentence. If a page is about two things, it is two pages.

The reader is never assigned a level. They locate themselves: pages use stages of a journey
("in your first month of journaling", "once you have thirty graded trades") and self-diagnosis
("which of these three is your skip?"), never "beginner" or "advanced" (check rule 6).

## 2. The spine

Every lesson page follows this order. Sections are h2s; the section index is built from them.

1. **Reframe.** The lead paragraph under the h1 is a one-sentence reframe or counter-intuitive
   claim about the thing, not a definition. The definition comes in the body.
2. **Stakes.** The first section names the pain the reader recognises, in one or two
   paragraphs, in second person. No credibility line: this site has no desk and claims no
   record. Rigor is the substitute for authority.
3. **The body, numbered or named.** Three to seven items. Each item in the same shape:
   name the thing → show it (a level, a chart, a worked case) → state the rule → say what
   getting it wrong reveals about the trader. Mechanical items first, the psychological one
   last. No held-back payoff: a page can be scrolled, so the hook that works in a 20-minute
   video reads as cheap here.
4. **Key concept.** One `.key-concept` box, one or two sentences, the thing the page exists to
   say. Placed where the body has earned it, not at the top.
5. **The worked case.** Where the module teaches a setup, trigger or construction rule: one
   worked MNQ case in an `.example-box` labelled "Illustration · not a trade record",
   with the level, the read, the trigger, the stop and the invalidation named, and where price
   went after the exit stated plainly ("after the exit is not your money"). Three cases with
   different contexts and identical mechanics beat one. Outcomes in R or points, never
   dollars. Any case that shows a result carries the CFTC 4.41 hypothetical statement next to
   it (content rule). Modules that teach structure rather than a trade (02, 14, 15) use the
   worked case to show the structure, and stop before an outcome.
6. **Self-diagnosis.** One short section that turns the body into a mirror: which of these is
   yours. Where a checklist exists, make it scorable with a threshold ("two of three missing
   means no trade"), not a list of considerations.
7. **Apply this now.** One `.apply-now` box with one assignment for the next session, sized
   tiny: write three lines, say one sentence before each entry, mark one trade. Never
   "study more" or "read the next module."
8. **Where it goes next.** One closing section tying the page to the journal field, grading
   check or routine it feeds, with the module number that covers it.

## 3. Progression

- Teach the hierarchy once and reuse the same words everywhere: **idea → setup (location +
  read) → trigger → construction (level → stop → risk → size → entry)**. Never relabel a tier
  in a later module. The first mention in each module uses the full phrase; after that the
  short name.
- Inside a page: concept → mechanism → worked case → filters and exceptions → the psychology
  that makes it hard → the assignment.
- Across the course: structure (02, 03) → the reads (04, 05, 06) → the trigger (07) →
  construction and rules (08, 09) → process (10–13) → evidence (14–16). A page may point
  forward by module number; it never teaches forward.
- Define before using. Every term gets its definition in a `.definition-box` the first time
  it is load-bearing, and the glossary carries the same wording.

## 4. Devices

- **Grade before size.** A+/A/B/C is the rubric in TAXONOMY 5.1 and appears everywhere grading
  does. Sizing by grade is one table, decided once in Module 08, and never varies between
  pages.
- **Mistake → what it reveals → mechanical fix.** Every mistake named on a page gets all three.
  The fix is a mechanism (a platform setting, a written line, a count), not a mindset.
- **Review rituals are content.** The post-session mark-up, the plan yes/no, the weekly
  cohort review are taught as things to do, with the exact fields, not described as good
  habits.
- **Statistics come after the rule.** State the rule in the Blueprint's own terms, then the
  TradingStats or register figure as the why, with its sample size, cited by name. A number
  never opens a section and is never a signal (content rules; check rule 9).
- **Losing is normalised and specific.** Losses are written as expected members of a
  distribution ("if the read is right six times in ten, the four are not mistakes"). The
  failure on this site is a rule broken, never a trade lost. Author's own losses appear in R
  and points, never dollars, and only where they illustrate the rule.
- **Archetypes, not testimonials.** A short named pattern of trader ("the one who has a
  trigger and no level") is allowed. No named students, no before/after earnings, no
  testimonials of any kind (compliance: 4.41(a)(3), 16 CFR 255).

## 5. Voice

Plain, declarative, second person, present tense. Short sentences; a one-line beat is allowed
where it carries weight. Repetition of the rule is deliberate. The author's own record appears
as "in my own record" and states what it showed, never a count that the register does not
hold.

Never on a page: an income figure, a P&L screenshot, "this always works", "anyone can", a
secret, a prediction, excitement. Uncertainty is written as a distribution or a stated
unknown, including about this method: nothing here is validated, and the page that teaches a
thing says which badge it carries.

## 6. What this site does not borrow

- Borrowed authority (a desk, star traders, named students, firm P&L). The site has none and
  claims none.
- Dollar-denominated war stories.
- Audience-participation hooks ("comment which level you are").
- Video devices (tape replay, live pointing). Replaced by annotated static charts and
  bar-by-bar tables when charts ship; until then, the worked case in prose.
- Equity vocabulary. Keep the structure; the instruments are MNQ, the levels are the
  TAXONOMY section 4 slugs, the sessions are RTH/ETH.

## 7. Page checklist (Claude Code runs this before `npm test`)

- [ ] Lead is a reframe, not a definition
- [ ] One reader, one thing, named in the first sentence
- [ ] h2 sections only; the spine order above
- [ ] Exactly one `.key-concept`
- [ ] Every mistake has reveals + mechanical fix
- [ ] Worked case labelled "Illustration · not a trade record"; R/points only; 4.41 text if a
      result is shown
- [ ] One `.apply-now` with one tiny assignment
- [ ] Every statistic is after its rule, named to its source, with n
- [ ] Badge/status of the thing taught is stated (where the thing has one)
- [ ] No level labels, no dollar income, no testimonials, no predictions
