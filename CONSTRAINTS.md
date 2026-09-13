# CONSTRAINTS.md

Last reviewed: 2026-09-13

## Users & traffic
- Audience: recruiters, hiring managers, and engineers worldwide, arriving from a CV or shared link.
- Traffic: low, spiky when shared; global, so page weight matters more than server capacity.

## What this system is
- Static site on GitHub Pages; no server, database, or runtime process.
- Source of truth: `data/profile.json`. Posts live in `deep-dives/*.md`. Layout lives in `templates/*.html`.
- Everything else (`index.html`, `blog/**`, `resume/**`, `../xpressabhi/README.md`, career CVs) is generated — never hand-edit.

## Runtime & dependencies
- Build-time only: Node 24 and npm scripts; no runtime dependencies.
- PDF generation needs Playwright locally (`npm run build:pdf`).
- Keep dependencies at zero unless a feature truly needs one.

## Budgets & targets
- Cost: free hosting tier; no paid services.
- Pages stay light: static HTML/CSS, no trackers, no heavy client-side JavaScript.
- URLs claimed in `data/profile.json` must resolve (`npm run check`).

## Unknowns — ask, don't assume
- Before editing a source file, confirm whether it is hand-edited or generated.
- Before adding a dependency, confirm it is worth the maintenance cost.

## Verification
- Every change: `npm run build` (no warnings), `npm test`, `npm run check`.
- CI re-runs build and tests on every push, and fails if generated files drift.
- Review this file whenever hosting or build tooling changes.
