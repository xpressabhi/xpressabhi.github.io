# tutor: one question at a time, difficulty tuned to the learner

tutor is an adaptive tutor skill for AI coding agents. It asks one question, reads the answer, and lets that answer decide what comes next — up, down, or sideways into a gap that just appeared. Say "I don't know" and that is a useful signal, not a failure; miss a concept and it teaches the idea underneath and re-asks before moving on. Every question, answer, verdict, and explanation is written to disk, so the next session — with a clean context and no memory of this one — resumes exactly where the learner left off.

Source: [github.com/xpressabhi/tutor](https://github.com/xpressabhi/tutor) · Live site: [xpressabhi.github.io/tutor](https://xpressabhi.github.io/tutor/) · Install: `npx skills add xpressabhi/tutor` · Stack: plain markdown, zero runtime dependencies, MIT.

---

## The problem it solves

Most "teach me X" prompts produce a wall of text: a curriculum, or a document that either bores someone who already knows the basics or loses someone who doesn't. The learner's actual level never enters into it.

tutor closes that loop. A short opening assessment finds the ceiling, not the average; after that, the next question is chosen from the answer to the last one. The tutor problem is a live question-and-answer loop with no friction between asking and adapting — a different primary artifact (a conversation, not a lesson document) with different failure modes, which is why tutor is a standalone skill rather than an extension of a lesson generator.

---

## Decision 1: the ledger is the state

Plain markdown, one directory per topic — readable with `cat`, editable by hand, diffable in git:

```
~/tutor/
  LEARNER.md          # cross-topic profile — shared by every topic
  ai-engineer/
    TOPIC.md          # mission, outline, learner profile
    LEDGER.md         # per-concept rung and verdict — read before every question
    sources/          # only if you have material to ground in
    sessions/
      2026-10-07.md   # append-only: question, answer, verdict, teaching
    artifacts/
      attention-r4.html
```

`LEDGER.md` is the file the tutor acts on — one row per concept, read before every question, rows edited in place and never duplicated so a `git diff` across sessions stays readable:

| concept | rung | last verdict | attempts | shaky | next probe | notes |
|---|---|---|---|---|---|---|
| embeddings | 2 | correct | 1 | no | | |
| attention | 3 | partial | 2 | yes | forgets the 1/sqrt(d_k) scaling | |
| fine-tuning | 4 | — | 0 | — | queued after attention | |

`rung` is 1–5, calibrated against the learner, not the subject. What counts as rung 3 differs per domain and per person — for one Python learner it is "apply it in a case you haven't seen", for another arriving from C it is "explain why this idiom exists when the obvious version also works".

The turn cycle, and the reason one question per message is non-negotiable:

```
pick next concept   ← read LEDGER.md, not memory
pick rung           ← learner's level on that concept, ±1 from last verdict
ask ONE question
receive answer
verdict: correct / partial / wrong / "don't know"
   ↓
update LEDGER row, append to today's session log
   ↓
correct  → rung up, or move to next concept
partial  → hold rung, re-ask with a different framing
wrong    → hold rung, teach, re-ask immediately
```

The loop depends on the reply arriving before the next question is chosen.

---

## Decision 2: verdicts read the how, not just the what

The verdict is not correctness — it is whether the understanding is real. This is the rule that keeps guessing from earning ground:

- **Conclusion right, reasoning wrong → `partial`.** A correct answer for the wrong reason is a guess, and filtering guesses is what the rung is for.
- **Hedging or rambling → `partial`.** "I think it's B, or maybe C, because…" is the shape of someone guessing.
- **Right answer, unexplained → `partial`.** Ask "why?" on the spot rather than crediting it.
- **Right answer, clean reasoning → `correct`.** The only thing that earns a rung up.

Two consequences fall out of this. **"Don't know" is a first-class answer** — the most honest signal available. Treating it as failure is what makes learners fake confidence; it logs as a miss and triggers a teaching turn, and it does not lower the rung permanently. And **regression is live**: a concept solid at rung 3 that returns with rung-2 reasoning has not deepened, it has thinned — the rung comes down even though the answer was technically correct. A single per-concept verdict would never catch this.

---

## Decision 3: the ratchet guard and bounded teaching

Two guards keep the ladder honest.

**The ratchet guard:** rung rises only after a correct answer **and** a clean re-probe of that rung later. Otherwise every lucky guess walks the learner up a ladder they haven't climbed, and they end up lost three concepts past where they actually are. Overshooting easy by one costs a session; overshooting hard costs the thread.

**Bounded teaching:** explain the idea underneath the missed question, not the answer to it, then re-ask immediately in a fresh framing — never the identical question. Roughly three attempts at a rung before dropping it instead of hammering; after that, lower the rung and mark the concept shaky. Shaky concepts get revisited. That is what the log earns.

---

## Decision 4: cold start probes the ledger — it doesn't trust it

Every session starts with a clean context, so the resume protocol runs before the first question: read `TOPIC.md` (subject, goal, learner profile), read `LEDGER.md` (concepts, rungs, verdict history, shaky flags), read the tail of the most recent session log (what was **in flight**, the concept mid-way through, any question never asked).

Then **probe rather than trust**. The first question of every session is the last-covered concept at its recorded rung, in a framing the log shows is new. A ledger entry from three weeks ago is a claim, not evidence. If the probe misses, the recorded rung was optimistic and drops — with no comment on the gap, because nobody wants a session that opens by being told what they used to know. Long gaps decay the rung: open one below what's recorded and let correct answers walk it back up.

The same distrust shapes session close: the turns themselves are a poor record of what was unfinished — a question that was *never asked* leaves no trace at all, and it is the one the next session most needs. So every sitting ends with what got covered and at what rung, what was in flight, and the openers for next time. The ledger's `Next probe` column carries the same debt for the ratchet guard.

---

## Decision 5: artifacts at the learner's rung — and only when earned

A concept that genuinely needs to be *seen* — control flow, a comparison table, a state machine, a worked example — gets one self-contained HTML file in `artifacts/`, opened for the learner. Three hard rules:

- **At the learner's rung.** A diagram for a rung-2 learner labels the parts and traces one path; the same diagram at rung 4 adds what breaks at the boundaries. Never the maximal version. Filenames carry the rung (`attention-r4.html`) so a later session can regenerate the concept at a different one.
- **Bounded.** One idea, a screen or two — if it needs scrolling to see the point, it is two artifacts.
- **Earned.** Most concepts are better as a question and a paragraph; artifacts are for shapes prose cannot carry.

Two grounding mechanisms keep it honest beyond the model's own memory. **Code execution** (a sandboxed helper: timeout, temp file per run, no install, no network) verifies the learner's snippets against real output, produces "what does this print" answers by actually running them, and scaffolds fresh questions whose expected answer was observed — never guessed. **Source grounding** turns the learner's own material (docs, a codebase, a book) into per-concept notes carrying where each fact came from, so a question can name its source and an ungrounded question can be labelled as such. Two claims with the same confidence level stop looking identical, which is the whole point.

---

## What I kept out

- **No spaced-repetition scheduler.** Shaky concepts get revisited opportunistically. A proper SRS needs per-concept decay intervals and a due queue — worth it once sessions are weeks apart, not on day one.
- **No Obsidian dependency.** Obsidian opens any folder as a vault, so `~/tutor/<topic>/` is browsable that way already; the skill doesn't impose a structure on a third-party app.
- **No vault generator.** Source notes are written in one pass for the concepts the material actually covers; structured generation as its own pipeline is a separate skill.
- **No learning-style taxonomy.** Visual/auditory/kinesthetic matching has no evidence behind it and is the standard move a "personalized tutor" makes. Tailoring here is observed, not assigned: pace, response to being wrong, explain-back vs show-back, tolerance for struggle, entry point — recorded in `TOPIC.md` with its evidence. Stated preferences are followed ("just give me the answer" is recorded and honoured). The method adapts; the bar does not.
- **No curriculum, no lesson generator, no percentage-of-correct scoring.** Concepts accumulate as encountered; a batch score cannot see whether an answer was reasoned or guessed, so the ratchet guard and regression detection would both be unavailable.

Optional capabilities degrade rather than fail: no shell means the learner runs the code and reads the output back; no way to open a file means the idea comes through in prose; no writable filesystem means the session works but cannot resume — and the skill says so instead of pretending. Plain prose over plain files, with only `name` and `description` in the frontmatter, so it loads in OpenCode, Claude Code, Cursor, or anything else that reads `SKILL.md`.

---

## Stack & links

**Stack:** plain markdown · `SKILL.md` + `FORMATS.md` + `DESIGN.md` · `scripts/run.sh` sandboxed snippet runner (timeout, temp cleanup, no network) · zero runtime dependencies · MIT.

Browse the code at [github.com/xpressabhi/tutor](https://github.com/xpressabhi/tutor), walk the design rationale in [DESIGN.md](https://github.com/xpressabhi/tutor/blob/main/DESIGN.md), or install with `npx skills add xpressabhi/tutor` and try `tutor quiz me on SQL joins`. The live overview lives at [xpressabhi.github.io/tutor](https://xpressabhi.github.io/tutor/).
