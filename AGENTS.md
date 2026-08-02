# AGENTS.md

Guidance for AI agents working in this repository.

## What this repo is

A static GitHub Pages portfolio — the entire site lives in **`index.html`** (single self-contained file).

- Bootstrap 5, Font Awesome 5, and Source Sans Pro load from CDNs.
- Custom CSS and the image lazy-loading script are inlined in `index.html`.
- Content is deployed by pushing to `master`; `.nojekyll` disables Jekyll processing.

## Conventions

- Do not add build tooling, package managers, or separate asset folders unless asked — keep the single-file setup.
- Style: Bootstrap 5 utility classes, Font Awesome 5 icons.
- Personal info (email, phone, URLs) comes from the CV at `~/Documents/GitHub/bragging-rights/abhishek_maurya_2026.pdf` — keep consistent.
- No build/test/lint steps exist; verify by opening `index.html` in a browser (or serving the repo root).
