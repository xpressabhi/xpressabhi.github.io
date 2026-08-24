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
