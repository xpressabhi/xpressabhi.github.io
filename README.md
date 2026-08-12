# xpressabhi.github.io — Portfolio, CV & Sync Hub

Personal site of **Abhishek Kumar Maurya** — Staff Software Engineer (AI Agents, MCP, Platforms). Live at **https://xpressabhi.github.io**.

This repo is the **single hub** for every public fact about me. Everything is generated from **one file**:

```
data/profile.json        ← the ONLY place you edit personal facts
templates/portfolio.html ← portfolio layout
templates/cv.html        ← CV layout (print/PDF-ready)
scripts/build.mjs        ← generates everything below
deep-dives/              ← long-form technical writeups (markdown)
```

## What `npm run build` generates

| Output | Where | Purpose |
|---|---|---|
| Portfolio | `index.html` | Single-page portfolio (GitHub Pages root) |
| CV page | `cv/index.html` | CV view with Download PDF / Print |
| CV PDF | `cv/abhishek-maurya-cv.pdf` | Print-ready PDF (needs `--pdf`, uses Playwright) |
| GitHub profile README | `../xpressabhi/README.md` | The `xpressabhi` repo's only file |
| career-ops CV | `../career-ops/cv.md` | Job-search pipeline source CV |
| career-os resume | `../career-os/data/files/abhishek_maurya_2026.md` | Resume used by the remote-job-finder skill |

## Workflow

1. Edit `data/profile.json` (the only place facts live).
2. Run `npm run build` (add `--pdf` to also regenerate the PDF).
3. Commit + push **this repo** (`xpressabhi.github.io`) and the generated `xpressabhi/README.md` separately.
4. Tip: the `profile-sync` skill automates steps 1–3 from session learnings — just ask it to run.

## Retired repos

`cv` and `bragging-rights` are retired — see [ARCHIVE.md](ARCHIVE.md). Their unique content lives in `deep-dives/` and `data/profile.json`.

## Deploying

Push to `master` — GitHub Pages serves the repo root directly (`.nojekyll` present).

## License

MIT © Abhishek Kumar Maurya
