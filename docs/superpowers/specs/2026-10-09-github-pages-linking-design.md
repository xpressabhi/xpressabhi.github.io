# Design: GitHub Pages sites in the portfolio, linked hub-and-spoke

Date: 2026-10-09
Status: Approved (verbal)
Scope: Add three live GitHub Pages sites to the portfolio and wire bi-directional
navigation between the portfolio and all six live Pages sites.

## Context

Several side projects are published as GitHub Pages repo sites. Three of them
went live without being listed on the portfolio:

| Site | URL | In portfolio? |
|---|---|---|
| intent | https://xpressabhi.github.io/intent/ | no |
| job-radar | https://xpressabhi.github.io/job-radar/ | no |
| tutor | https://xpressabhi.github.io/tutor/ | no |
| ordo | https://xpressabhi.github.io/ordo/ | yes |
| jev-browser | https://xpressabhi.github.io/jev-browser/ | yes |
| job-search-skills | https://xpressabhi.github.io/job-search-skills/ | yes |

`bestunit` (Vercel app), `revision` (Tauri desktop app), and `sims/` (page inside
the portfolio itself) are not standalone Pages sites and are out of scope.

`ordo/docs/index.html` already carries a footer link back to the portfolio
("Portfolio" link, commit 8462bac) — that is the precedent to generalize.

## Goal

1. The portfolio lists all six live Pages sites as project cards.
2. Every Pages site links back to the portfolio (`/#projects` anchor).
3. Every Pages site links to its five siblings (hub-and-spoke, direct 1-hop
   navigation), with the portfolio as the canonical hub.

## Non-goals

- No new blog posts / deep-dives.
- No CV entries for the three new projects (`showOnCv: false`, matching
  jev-browser and job-search-skills).
- No template or styling changes to the portfolio (existing card template and
  `#projects` nav anchor already suffice).
- No runtime cross-origin dependencies (shared JS/iframe bars rejected).

## Component 1 — Portfolio data (this repo)

`data/profile.json`, `projects` array: append three entries after the last live
entry (`job-search-skills`), before the `discontinued` group. All
`status: "live"`, `showOnCv: false`, no `image`.

- name `intent`, url `https://xpressabhi.github.io/intent/`,
  description: "Repo-owned protocol and verifier for agent-driven changes:
  declared scope, protected tests, digest-bound approvals, green baseline."
- name `job-radar`, url `https://xpressabhi.github.io/job-radar/`,
  description: "Daily ATS crawl of senior+ frontend and AI engineering roles in
  India, published as a static site with JSON/RSS feeds; zero runtime
  dependencies, forkable configuration."
- name `tutor`, url `https://xpressabhi.github.io/tutor/`,
  description: "Adaptive tutor skill for AI coding agents: one question per
  turn, difficulty tuned to the learner, state on disk that survives a clean
  context."

Descriptions paraphrase each repo's own README / site copy only; no invented
metrics.

## Component 2 — Evidence (CI gate)

`npm run check` / the build warn about claims without provenance. Add matching
`data/evidence.json` entries: `projects:intent`, `projects:job-radar`,
`projects:tutor` — source = repo README (path + commit at time of writing), ref =
live URL, note describing the Pages site. This keeps the build warning-free and
CI green.

## Component 3 — Canonical cross-link strip (this repo)

New `scripts/projects-bar.mjs`:

- Reads `data/profile.json`, keeps `projects` entries whose URL host is
  `xpressabhi.github.io` **in profile order** (single source of truth for both
  membership and order — no second list to drift).
- Renders a one-line footer strip, e.g. (profile order: ordo · jev-browser ·
  job-search-skills · intent · job-radar · tutor):
  `More by Abhishek Maurya · ordo · jev-browser · job-search-skills · intent · job-radar · tutor · portfolio →`
  where `portfolio →` deep-links `https://xpressabhi.github.io/#projects`.
- CLI: `node scripts/projects-bar.mjs [--current <slug>]` writes
  `output/projects-bar.html` (gitignored throwaway dir).
  `--current` marks the on-site link as `<span aria-current="page">` plain text
  instead of a link, so each site's footer doesn't link to itself.
- Styling: links carry `style="color:var(--accent, inherit)"` — follows ordo's
  existing inline-footer pattern, safe on sites that define or lack `--accent`.

## Component 4 — Per-site footers (six sibling repos)

Paste the strip from Component 3 inside each site's existing footer element,
styled to inherit site footer conventions (each site has a distinct footer:
`intent/docs/index.html` `.site-foot`, `tutor/docs/index.html` `.footer`,
`ordo/docs/index.html` bare `<footer>` — its existing "Portfolio" link folds
into the strip, `jev-browser/docs/index.html` `.site-foot`,
`job-search-skills/docs/index.html` `.wrap`, and for job-radar the footer
template inside `scripts/render.mjs` — its `site/` output is generated, so edit
the generator, run the render step, and commit the regenerated output).

Each repo gets its own commit, message style matching that repo's history
(ordo: `Docs: ...`); job-search-skills and intent have untracked/unrelated
working-tree noise — stage only the footer file.

Deployment: those repos' Pages serve from branch on push (verified: ordo's
footer link is already live); job-radar republishes via its committed site
output/workflow.

## Verification (evidence before claims)

Portfolio:
- `npm run build` regenerates `index.html`; review `git diff` of generated
  output; cards show the three new projects with Visit links.
- `npm run check` — link check covers the three new URLs (must pass).
- `npm test` — unit tests.
- If the build also rewrites `../xpressabhi/README.md`, commit and push that
  repo too (AGENTS.md rule).
- Commit this repo (content change convention: `sync: ...`), push `master`
  (Pages deploy), CI = build + `git diff --exit-code` + tests.

Sites:
- `curl https://xpressabhi.github.io/<repo>/` on all six; strip present, every
  link in the strip returns 200, `--current` link rendered as plain text.

## Risks

- job-radar's nightly crawl regenerates `site/` — the render-template edit
  survives; generated output committed to keep the strip live immediately.
- Pages deploy latency per site after push — verify with curl before claiming
  done.
- Future seventh site requires re-pasting the strip into existing sites; the
  portfolio hub page stays current regardless (accepted trade-off of static
  strips over a shared JS bar).
