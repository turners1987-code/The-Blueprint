# The Blueprint — Lesson Standard (video layer)

Version 1.0 · 2026-11-06. Approved by Shane on the Module 06 pilot ("template approved").
How the narrated, slide-driven lesson layer is built for every module. The page itself
still follows MODULE_STANDARD.md; this file covers what sits on top of it: the segments,
the script, the slides, the audio and the checks. Where this file and the content rules in
BLUEPRINT_DOC section 7 disagree, the content rules win.

Module 06 (`data/lessons/06-what-counts-as-a-level.json`) is the reference build. When in
doubt, do what it does.

---

## 1. Why it exists

People do not read. A module's page is the reference; its videos are how most students will
take it in. Every section of the page gets a video (one segment per h2, or per pair of short
h2s), so the videos cover most of the content, not all of it. A student who only watches
should still come away with the test, the rule and the worked case.

## 2. Segments

- 3 to 6 segments per module, each 60 to 160 seconds of narration. Each segment owns one or
  two page h2s (`sections`), in page order. Nothing on the page is left unowned.
- Segment titles are short and plain ("Zones and the far edge", "The two lists"). The first
  segment's title names the scenario and the thing ("The scenario and the test").
- Every segment carries a 3 or 4 question check (pass at 3 of 4). The module ends with a quiz
  of 4 or more. Answers are spread across positions. One question per segment tests the
  "getting it wrong" line.
- The last segment of a module is the assignment, summary and "where it goes next", in that
  order.

## 3. The script (cues)

Reader-is-the-trader voice, second person, present tense, the content rules as always
(no levels, no results or dollars, no validation words, every stat with its n and its source).

**Chapters.** Each segment is chaptered. A cue that opens a chapter carries `"chapter"`:
a short label for the chip strip ("The test", "The example", "The rule", "Getting it wrong").
Chapter openers are spoken as a short signpost sentence, except the first chapter of a
segment, which starts straight into the content. Signposts that work: "Now, the test.",
"The example.", "The rule:", "Getting it wrong is…", "Where it goes next.". Do not open with
"The scenario." (a bare label followed by a pause reads as a glitch).

**Order inside a segment** follows the page's body shape: name the thing → show it → the
rule → what getting it wrong reveals. The rule is one sentence a student could write down.

**Humour.** One dry, cool joke per segment, never more, and it must read as a joke on paper,
because the voice is flat. Two short sentences beat one dry one. The jab lands on the trade,
the line or the chart, never on a trader, a group or a vendor. Reference lines:
"The chart never got a vote." · "Hindsight is undefeated." · "That is not a level. That is
cardio." · "They are popular. Popular is not the test." · "Nothing is due there, which is the
most relaxing sentence in this course."
Sarcasm that depends on tone is rewritten until it does not: say the true thing right after
the ironic one ("…and now the trade is fine again. It is not. The zone moved. The structure
did not.").

**Jargon.** The first time a Blueprint term is spoken in a module, define it in the same
breath ("every slug, the short name you log a level under, like pd-high for the prior-day
high"). Alternate the long form and the short form through the module ("volume point of
control", then "VPOC") so the short form sinks in.

**Lists.** A list of N things is N short cues ("One: … Two: …"), each one revealing its row
on the slide as it is spoken. Never read a comma list of six items in one breath.

**Times and numbers, as spoken.** Write clock times the way they are said: "9:25 a.m.",
"4 p.m.", "9:38", "Sunday 6 p.m. to Friday 4 p.m.". Never "09:25" (read as "zero nine"),
never ":00" ("four zero zero"). Prices keep their decimals ("24,186.50"). The on-screen slide
labels use the same spoken form. Page text keeps the site's 24-hour style.

**Calendar words.** No "yesterday", "today", "tomorrow", "this morning", "this week" for price
or structure: "the prior session", "the session before", "your next session", "in this
composite session". Level names keep their own words ("yesterday's close" as a slug is fine).

**Pre-market vs pre-marked.** Spoken, they sound the same. Narration says "the list you mark
before the session" and "marked before the session"; on-screen text may say "pre-marked".

**Disclaimers.** Any chart snippet is introduced once as "a composite chart, invented prices"
and the slide credit says so. Any hypothetical outcome carries CFTC 4.41 language on the page;
the videos show no entries and no outcomes.

## 4. Slides

- 640 × 360 inline SVG in design-system tokens only (`var(--cyan)`, `var(--gold)`,
  `var(--green)`, `var(--red)`, `var(--bg-card)`, `var(--border-light)`, text tokens, the mono
  font for numbers). No stock images, no photos, no real market data.
- One slide per chapter, roughly; 2 to 3 slides per segment. Every reveal is keyed to the cue
  it belongs to (`t[k] - t[0]` from the cue index inside the slide's window), never to an
  absolute second, so a re-render re-times it for free. Lists reveal one row per spoken cue.
- Every slide has a title and a one-line subtitle. Text is at least 12 px; nothing overlaps
  (check the label next to a chart line against any card beside it).
- Slide kinds in the kit (scripts/lesson-slides/): scenario, numbered cards (parts of a test),
  chart with a level line or a zone band, numbered list with a side panel, timeline with a
  boundary, two-column compare (location vs target), score circles with verdict rows,
  one-row assignment, summary grid with module links, hero (centred statement with lines
  arriving per cue) and calm (title plus free blocks) for quiet segments. New kinds are added to the kit, not
  hand-drawn in one module.

**Charts.** Bars come from `scripts/synth-bars.mjs`: a seeded random walk per bar (sub-steps,
volatility clustering, mixed colours), shaped by regimes so the chart tells the story the
narration tells (the climb with pullbacks, the poke into the high, the turn) and still looks
like a chart someone could have traded. The exact extreme a drill checks is printed by one
bar and never exceeded. Never a run of one colour; never a straight line of bodies. The
chart on screen must move in the direction the narration says ("price runs up into a line"
is a rising chart).

## 5. Audio

- Kokoro-82M, voice `bf_emma`, speed 1.0, lang `b`. Rendered locally with
  `scripts/render-narration.py <lesson.json> C:\Blueprint\music-pool` (the pool folder is
  never in the repo).
- Two stems per segment from one synthesis: `<id>.mp3` (voice + music at −12 dB, 1.5 s fade
  in, 2 s fade out) and `<id>.voice.mp3`. The player blends them so the student's music
  slider moves only the music; default 50 (= −18 dB). No music-only file ever exists on the
  site (Pixabay Content License: music only inside a larger work).
- Soundtrack: POOL in the render script, one main track per module (module number mod the
  pool size), the same beat under every segment of a module, and ENDING under the last
  segment only. The script writes each segment's `music` block; ai.html credits every track
  used, one line each, from those blocks.
- The script writes cue starts, slide starts, `duration` and `audio_v` (a hash, so a new
  render gets a new URL) back into the JSON. Then run `node scripts/build-lesson-slides.mjs`
  so reveal delays match the new timings. Bump `CACHE_VERSION` in sw.js.
- Budget: under 16 MiB of audio per module at 64 kbps mono 24 kHz (64 kbps from Nov 7: 96 kbps put 15-minute modules at 18 to 23 MB; 64 kbps mono is podcast quality for speech under a low beat).

**Quiet segments.** A welcome or intro segment can carry `"no_music": true` (no beat, the
music slider is hidden) and `"speed": 0.93` (a slower, warmer read). Module 00 s0 is the
reference. Only for an intro; every teaching segment keeps the beat and speed 1.0.

## 6. Player behaviour (already built, do not re-build per module)

Replay at the end, back-to-start button, Next-segment button, chapter chips, music slider and
mute, per-segment resume, notes with .md export, transcript click-to-seek, iPhone silent
switch respected.

## 7. Build order for one module (two runner items)

**Item A, lesson build:** write `data/lessons/<NN>-<slug>.json` with segments, sections,
chaptered cues, slide data for the kit, checks and quiz; wire `data-lesson` on the page;
`node scripts/build-lesson-slides.mjs <NN>`; `npm test`. Placeholder cue starts are
estimated at 2.7 words per second; the render replaces them. Report: segment list with
chapter labels, the joke per segment, every chart's story, every stat with its n.

**Item B, review pass (a fresh run, not the one that wrote it):** read the script against the
page and against this file: direction of every chart, every joke on paper, times as spoken,
jargon defined on first use, lists split into cues, calendar words, banned words, overlap on
every slide at the final reveal state (render the slides with animations forced to their end
state and look at them). Fix, then `npm test`.

**Audio** is a local batch: Shane runs `render-narration.py` for several modules in one
prompt; the prompt rebuilds slides, credits and the cache version, then pushes.

## 8. Checklist before a module is called done

- [ ] every page h2 owned by a segment
- [ ] every segment: chapters, one joke that reads on paper, a rule sentence, a getting-it-wrong line
- [ ] no "09:", no ":00", no calendar words, no "pre-marked" in narration, no banned words
- [ ] every Blueprint term defined on first spoken use
- [ ] lists split one cue per item, rows revealed per cue
- [ ] every chart: organic bars, story matches narration, direction matches narration
- [ ] slides render with no overlap at the final reveal state
- [ ] checks 3–4 per segment, quiz 4+, answers spread
- [ ] audio rendered, stems match, `audio_v` present, credits on ai.html, CACHE_VERSION bumped
- [ ] npm test green
