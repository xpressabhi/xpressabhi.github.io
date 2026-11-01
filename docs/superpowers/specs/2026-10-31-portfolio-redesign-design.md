# Portfolio redesign — dark "living portrait" landing

**Date:** 2026-10-31 (superseded 2026-11-01)
**Status:** superseded — the dark living-portrait build was replaced after review

> **Superseded.** The dark, gradient-led version read as generic. It was rebuilt in the
> `quiet-instrument` direction dealt by the design-taste skill (seed 1618184809): off-white
> ground, bottle-green ink, one yellow field, Albert Sans, no gradients, no index numbering,
> no micro-caps, no marquee. The living-portrait engine is no longer on the page; its frame
> brief is kept at `docs/portrait-frame-brief.md` if it is ever revived. The sections below
> describe the superseded build and are retained as history.
**Scope:** `templates/portfolio.html` (rewritten), `assets/marquee/`, `assets/portrait/`,
`scripts/build.mjs` (one slice), `docs/portrait-frame-brief.md`

## Goal

Replace the light editorial homepage with a dark, large-type, motion-led landing page whose
signature is a living portrait that reacts to the cursor. Same content model, new skin.

## Non-goals

- `work/`, `blog/`, `resume/` keep the light editorial theme. Restyling them is a separate job.
- No changes to `data/profile.json` facts, CV, PDF, profile README, or career-ops output.
- No invented metrics. Every number on the page already exists in `profile.json`.

## Decisions

**Permanent dark, not a themed page.** Background `#0C0C0C`, type `#D7E2EA`, Kanit.
`scripts/lib/sync-theme.mjs` bans `prefers-color-scheme: dark` inside `templates/portfolio.html`,
so the page is unconditionally dark rather than switching. No theme toggle, no `data-theme`.

**No bundler.** The spec's React/TS/Tailwind/Framer Motion stack does not exist in this repo and
would require committed build output that breaks the CI `git diff --exit-code` gate. Effects are
reproduced in ~3 KB of inline JS: IntersectionObserver for fade-ins, one rAF-throttled scroll
listener for the marquee, the character reveal and the sticky card scale. The portrait engine is
already dependency-free vanilla JS.

**Local assets only.** The reference design's 21 GIFs measure 8–14 MB each (~230 MB). The marquee
uses 8 locally encoded WebP stills at 840×540, ~25 KB each, 204 KB total, repeated to 24 tiles.
No hotlinked GIFs, no third-party decorative PNGs.

**Portrait with a real fallback.** 59 generated frames live in `assets/portrait/`. Until
`rest.webp` exists, `placeholder.svg` shows and the engine never starts. When frames land the
engine hides the placeholder itself; no template change.

## Section mapping

| Section | Content | Source |
|---|---|---|
| Hero | `ABHISHEK`, headline, contact pill, living portrait | `basics` |
| Marquee | two counter-scrolling rows, scroll-linked | `assets/marquee/*.webp` |
| About | char-reveal paragraph, facts row, contact pill | `summary`, `basics` |
| What I do | numbered 01–06 capability list, white slab | `capabilityCards` |
| Work | three sticky-stacking cards with metric blocks and deep dives | `flagship` |
| Builds | four compact cards | `projects` where `homePick` |
| Writing | one featured post | `blog` |
| Experience | minimal timeline | `experience` |
| Contact | large type, email, CV, social links | `basics` |

## Guards to keep green

- `npm run build` must be deterministic — no timestamps, no randomness in output.
- `npm test` (62 tests), including `sync-theme`'s banned-pattern scan.
- `npm run check` — PII lint and link check. All new assets are local paths.
- CI runs build then `git diff --exit-code`; the generated `index.html` must match what is committed.

## Risks

| Risk | Mitigation |
|---|---|
| Hero overlaps the name with the portrait | Portrait at 56 % vertical, sized `clamp(520px, 58vh, 34vw)`; verified by screenshot |
| Sticky card scale jitters | scale derived from `getBoundingClientRect` per frame, clamped 0→1 |
| Frames never arrive | placeholder is a designed plate, engine is dormant, page still ships |
| Dark home next to light `work/` | accepted seam; nav keeps a clear CV link |
| Font swap shifts layout | `display=swap` plus `font-size-adjust`-safe sizes in `clamp()` |

## Verification

1. `npm run build` twice → identical `index.html` (byte-compare).
2. `npm test` → 62 pass.
3. `npm run check` → no new failures (one pre-existing 429 on `selftest.in`).
4. Screenshot at 390, 768, 1440 wide; check hero, marquee, white slab seam, sticky cards.
5. Lighthouse-style payload check: initial transfer under 1.5 MB with frames absent.
