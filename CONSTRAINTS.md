# CONSTRAINTS.md

**Purpose:** before writing code, what should I understand about this problem?

Last reviewed: 2026-09-13

## Users & traffic
- Audience: recruiters, hiring managers, and engineers worldwide, arriving from a CV or a shared link.
- Traffic: low and spiky when shared; global, so page weight and latency matter more than server capacity.

## Data & schema
- No database. The "data" is `data/profile.json` — the single source of truth; posts are `deep-dives/*.md`.
- Consistency: `profile.json` is authoritative; generated files always derive from it and never diverge.
- Everything else (`index.html`, `blog/**`, `resume/**`, `../xpressabhi/README.md`, career CVs) is generated. Never hand-edit generated files.
- Deleting content means editing the source and rebuilding — never force-removing generated output.

## Runtime
- Static site on GitHub Pages; no server process, no runtime dependencies.
- Build-time only: Node 24 and npm scripts. PDF generation needs Playwright (`npm run build:pdf`).
- Runs on existing hosting and local tooling; no new services or platforms without a clear reason.

## Targets & cost
- Pages stay light and fast on a 3G connection; no trackers, no heavy client-side JavaScript.
- Cost: free hosting tiers only; no paid services.

## Team & timeline
- Maintained by one person; anything added must stay operable without ongoing babysitting.
- Publishing is deliberate — update deliberately, and never ship generated-file drift in a rush.

## Dependencies & upgrades
- Keep runtime dependencies at zero unless a feature truly needs one.
- Upgrade the Node version deliberately; verify the build, tests, and PDF step after any tooling bump.
- Re-check tooling quarterly or when GitHub Pages changes.

## Security & compliance
- Never commit secrets, tokens, or personal data. `npm run check` enforces the PII allowlist.
- Everything here is public: anything generated ships to the internet. Assume publication on every write.
- Links claimed in `data/profile.json` must resolve.

## Decisions — ask, don't assume
- Before editing a file, confirm whether it is hand-edited or generated.
- Before adding a dependency, confirm it is worth the maintenance cost.
- Before adding a new page type or template, confirm it fits the build pipeline.

## Before building
- Investigate first: what's ambiguous, what are we assuming, what could fail in production?
- Propose options and tradeoffs; attack the preferred option; then implement.

## Verification
- Every change: `npm run build` (no warnings), `npm test`, `npm run check`.
- CI re-runs build and tests on every push, and fails if generated files drift.
- Review this file whenever hosting or build tooling changes.
