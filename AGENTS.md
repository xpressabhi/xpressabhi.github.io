# AGENTS.md

Guidance for AI agents working in this repository.

## What this repo is

The single hub for Abhishek's public presence: portfolio (GitHub Pages), blog,
CV view with PDF download, GitHub profile README sync, and career-ops/career-os
CV sync. Everything is generated from one file plus markdown post sources.

## Rules

- **Hand-edited sources:** `data/profile.json` (content), `deep-dives/*.md`
  (blog posts), and `templates/*.html` (layout/branding). Never hand-edit
  generated outputs (`index.html`, `blog/**`, `resume/index.html`,
  `resume/abhishek-maurya-cv.pdf`, `../xpressabhi/README.md`, `../career-ops/cv.md`,
  `../career-os/data/files/abhishek_maurya_2026.md`) — the build overwrites them.
- Blog posts live in `deep-dives/<slug>.md`; the build renders them to static
  `blog/<slug>.html` pages and lists them on `blog/index.html`. Any new `.md`
  file in `deep-dives/` is picked up automatically.
- Regenerate with `npm run build` (add `--pdf` for the PDF; needs Playwright).
- Facts must come from `data/profile.json` or the user's explicit statements.
  Never invent metrics or authorship claims.
- To keep everything in sync from session learnings, use the `profile-sync`
  skill (`~/.agents/skills/profile-sync/`).
- Deploy by pushing `master`; `.nojekyll` disables Jekyll processing.
- `output/` is throwaway verification output (gitignored).

## CV workflow (same steps every time)

1. **Content change** (jobs, skills, projects, metrics) → edit `data/profile.json` only.
2. **Layout change** (spacing, columns, page breaks) → edit `templates/cv.html` only.
3. Rebuild: `npm run build:pdf` — regenerates CV page, PDF, profile README, and career CVs.
4. Visual QA: `npm run cv:preview`, then view every `output/cv-preview/page-*.png`.
   Check: contact line has no orphaned words, skill columns end level, no bad
   page breaks (role heading stranded from its bullets), no mid-word wraps.
5. Commit & push this repo — plus `../xpressabhi` whenever its README changed.

## Evidence pipeline (how claims earn their place)

- **Provenance**: every claim in `profile.json` should have an entry in
  `data/evidence.json` (`projects:<name>`, `skills:<item>`, `flagship:<title>`,
  `deepDive:<file>` → source, ref, date, note). The build warns about
  uncovered claims; `--strict-evidence` makes it fail.
- **Two evidence sources**: session chat (`profile-sync` skill's
  `scan-sessions.mjs`) and git history (`npm run repos:scan`, which walks
  `~/Documents/GitHub` for commits since the last watermark; `--mark` advances
  it). Review proposals, then hand-edit `profile.json` — nothing auto-writes.
- **LLM classification**: pipe a session report through
  `npm run signals:classify` to grade signals project/skill/learning/noise.
  Output is a proposal file (`output/signal-proposals.json`), never applied.
- **Market loop**: drop JDs into `data/market/`, run `npm run market:sync`,
  get ranked learning targets in `output/learning-targets.md`.
- **Checks**: `npm run check` = PII lint (emails/phones outside the
  intentional-public allowlist) + link check over every URL claimed in
  `profile.json`. `npm test` = unit tests for the template engine and evidence
  helpers. CI (`.github/workflows/validate.yml`) runs build + `git diff
  --exit-code` + tests on every push.
- **Commit convention**: profile-content changes use `sync: <what> (session
  <id> or repo)` so provenance stays traceable in git history.
