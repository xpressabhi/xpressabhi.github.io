# AGENTS.md

Guidance for AI agents working in this repository.

## What this repo is

The single hub for Abhishek's public presence: portfolio (GitHub Pages), CV
view with PDF download, GitHub profile README sync, and career-ops/career-os CV
sync. Everything is generated from one file.

## Rules

- **`data/profile.json` is the ONLY hand-edited file.** Never hand-edit
  generated outputs (`index.html`, `cv/index.html`, `cv/abhishek-maurya-cv.pdf`,
  `../xpressabhi/README.md`, `../career-ops/cv.md`,
  `../career-os/data/files/abhishek_maurya_2026.md`) — the build overwrites them.
- Regenerate with `npm run build` (add `--pdf` for the PDF; needs Playwright).
- Facts must come from `data/profile.json` or the user's explicit statements.
  Never invent metrics or authorship claims.
- To keep everything in sync from session learnings, use the `profile-sync`
  skill (`~/.agents/skills/profile-sync/`).
- Deploy by pushing `master`; `.nojekyll` disables Jekyll processing.
- `output/` is throwaway verification output (gitignored).
