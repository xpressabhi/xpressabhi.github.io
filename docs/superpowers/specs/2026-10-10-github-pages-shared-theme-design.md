# Design: one shared theme across all six GitHub Pages sites

Date: 2026-10-10
Status: Approved (verbal, three decisions locked)
Scope: Give every live GitHub Pages repo site a single visual system, derived
from `tutor/docs/index.html`, with light mode only — and a sync script in the
portfolio hub that keeps them aligned.

## Context

Six repos publish standalone GitHub Pages sites, and every one looks different:

| Site | Pages root | Theme now | Dark mode |
|---|---|---|---|
| tutor | `docs/` | cream paper, serif, rust `#a13a1f` | none |
| ordo | `docs/` | dark navy, blue `#4da3ff` | dark-only |
| intent | `docs/` | white, green `#0d7a5c` | light + dark |
| jev-browser | `docs/` | cream-green, green `#1d6b47` | light + dark + toggle |
| job-search-skills | `docs/` | off-white, green `#0b7f5c` | light + dark |
| job-radar | `templates/` → `site/` | off-white, blue `#0b5fff` | light + dark |

The user likes tutor's design and wants the family consistent. This is the
*visual* counterpart to `2026-10-09-github-pages-linking-design.md`, which fixed
the *navigation* drift; that spec's closing risk — "a future seventh site
requires re-pasting into existing sites" — is exactly the drift being removed
here.

Three decisions, confirmed before this spec:

1. **Light mode only.** Dark support is removed everywhere, not added anywhere.
   jev-browser loses its working light/dark toggle; ordo is re-skinned from dark
   to light.
2. **Shared design system, per-site content.** Sites adopt the tokens, type
   scale, nav and section rhythm. Each keeps its own content structure and hero —
   ordo keeps its KPI grid and diagrams, job-radar keeps its filterable job list.
3. **Canonical theme in the hub + sync script.** One `theme.css` in this repo,
   copied into each sibling as a same-origin `<link>`, with a drift check. No
   cross-origin stylesheet, no monorepo.

## Goal

1. `theme/theme.css` in the portfolio hub is the single source of truth for
   colour, type and page skeleton.
2. All six sites link that theme and share one look.
3. No site ships a dark theme or a theme toggle.
4. `scripts/sync-theme.mjs --check` reports any site that has drifted, so the
   consistency survives future edits.
5. Each site stays self-contained: no cross-origin request, no runtime
   dependency on the hub being up.

## Non-goals

- No dark mode anywhere. Removing it from four sites is in scope; adding it to
  tutor is not.
- No cross-origin `<link>` to a stylesheet hosted on the hub — rejected because
  it couples every site to the hub's uptime and contradicts job-radar's
  zero-dependency design.
- No content rewrites. Each site's copy, structure and interactive components
  stay as they are.
- No monorepo consolidation; every project keeps its own repo, history and
  release cadence.
- No new Pages sites, no portfolio content changes.

## Component 1 — Canonical theme (this repo)

New `theme/theme.css`, ~180 lines, three layers.

**Layer 1 — tokens.** Copied verbatim from tutor so the reference site defines
the system:

```css
:root{
  --paper:#f3f4ec; --panel:#fafaf3;
  --ink:#20241d; --ink-2:#565c4e; --ink-3:#666c5e;
  --rule:#d4d7c8; --rule-strong:#bfc3af;
  --accent:#a13a1f; --accent-bright:#e08a6e;
  --ok:#45663a; --warn:#8a6410; --bad:#9c2b1f;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --wrap:1060px;
  color-scheme:light;
}
```

`--ok/--warn/--bad` are the retuned semantic roles (see the rule below). Sites
that need softer fills derive their own `-soft` variants as `rgba()` of these, so
one value per role stays authoritative.

**Layer 2 — type.** The most visible unifying move. `h1,h2,h3` are serif,
weight 400, `text-wrap:balance`; body is sans; mono is reserved for metadata,
labels, commands and code — the "mono means machine data" rule. No all-caps
tracked-out eyebrows.

**Layer 3 — page skeleton.** `.wrap`, `.skip`, `.nav/.nav-in/.wordmark/.nav-links`,
the section rhythm (`border-top:1px solid var(--rule)`;
`padding-block:clamp(3rem,7vh,4.5rem)`), `.section-lede`, and the footer
(`.footer/.footer-in/.footer-links/.projects-bar`). Plus `:focus-visible`,
`prefers-reduced-motion`, `.sr-only`.

### The one rule that needs care

**Brand accent → rust. Semantic colours keep their role but move to values that
read on cream paper.** Not everything becomes rust: job-radar's salary badges
stay green, ordo's pass/fail stays green/red, intent's warnings stay amber. Only
their values change, because they were tuned for white or dark-navy backgrounds:

| role | before (ordo / job-radar / intent) | after |
|---|---|---|
| ok | `#7ee2a8` / `#0f7a3d` / — | `#45663a` |
| warn | `#ffc866` / `#8a5a00` / `#9a6a10` | `#8a6410` |
| bad | `#ff7b7b` / — / `#a63a32` | `#9c2b1f` |

Structural colours inside a site's own components (ordo's `.zone` borders,
job-radar's badges) follow the same rule: keep the role, retune the value.

## Component 2 — Per-site adoption (five repos with static `docs/`)

Each repo gets `docs/theme.css` (byte-identical copy) linked same-origin from
every HTML file in that root, and keeps its own inline `<style>` for content
components only — the theme must not absorb site-specific CSS.

| Site | One-time restyle |
|---|---|
| **tutor** | Extract its inline token/base block into `theme.css`; `<link>` it from `index.html` and `demo.html`; keep content components inline. Defines the system, so it moves first. |
| **intent** | Retarget 8 tokens, delete the `@media (prefers-color-scheme: dark)` block, serif headings, adopt the skeleton. Keeps its `--measure:62ch` prose shell. |
| **jev-browser** | As intent, **plus** delete the toggle button, the `localStorage` key `jev-docs-theme`, the `<html data-theme>` boot script and the `[data-theme=…]` blocks. Update any prose that mentions dark mode. |
| **job-search-skills** | As intent. Keeps its marketing structure. |
| **ordo** | Full dark→light re-skin: navy→paper, blue→rust, retint `.diagram`/`.zone`/`.kpi`/`.note`/semantic colours for cream, sans→serif headings. Highest-effort site and the only one that changes genre feel. |

These restyles are **hand work, once**, because the five stylesheets disagree on
structure, variable names and where dark mode lives. Mechanical rewriting of five
different files is not reliably possible; Component 4 instead *verifies* the
invariants afterwards so the work cannot silently regress.

## Component 3 — job-radar (generated site)

job-radar's Pages serve `site/`, regenerated nightly from `templates/` +
`data/` by `crawl.yml`. Hand-editing `site/index.html` is overwritten within 24
hours, so the theme is applied upstream:

- Edit `templates/style.css` in place: replace its `:root` block with the shared
  tokens, delete its `@media (prefers-color-scheme: dark)` block, retarget
  semantic colours, serif headings.
- That file is **inlined** into `site/index.html` via `{{STYLE}}` by
  `scripts/render.mjs`, so there is no `theme.css` link to add and no copy to
  keep in sync. This is the one documented exception to "every repo carries a
  copy".
- Run `npm run render` and commit the regenerated `site/` so the change is live
  immediately, ahead of the nightly crawl.
- job-radar keeps `.filters`, `.jobs`, `.badge`, `.month-group` and its
  progressive-enhancement script untouched apart from tokens and type.

## Component 4 — Sync + drift script (this repo)

New `scripts/sync-theme.mjs`, modelled on `scripts/projects-bar.mjs`:

- Reads a small manifest of the six repos (name, Pages root, kind: `link` or
  `generated`), all under `~/Documents/GitHub/`.
- **Propagate** (default): copies `theme/theme.css` into each `docs/` root,
  inserts `<link rel="stylesheet" href="theme.css">` into every `<head>` that
  lacks it. Idempotent.
- **Check** (`--check`): exits non-zero and lists any repo that is missing the
  link, whose `theme.css` differs from canonical, or whose HTML still contains a
  banned pattern — `prefers-color-scheme: dark`, `data-theme`,
  `localStorage` theme keys, or a theme-toggle control. This is the guard that
  makes Component 2's hand work stick.
- **Only** (`--only <repo>`): restrict to one repo, so adoption lands one commit
  at a time.
- **Push** (`--push`): commit with a fixed message per repo and push. Never
  implied; dry-run by default, so the plan prints before anything is written.
- job-radar is handled by its manifest entry: token check against
  `templates/style.css` plus a reminder to re-render, since its site output is
  generated.

Not touching: repo working trees with unrelated noise — stage only the theme
file and the HTML files the link was added to.

## Verification (evidence before claims)

Hub:
- `npm test` — unit tests for the sync script's manifest and check logic.
- `npm run check`, `npm run build`, `npm run verify` — unchanged and green.
- Commit this repo (`feat(theme): …`), push `master`.

Each site, before moving to the next:
- `node scripts/sync-theme.mjs --only <repo>` then `--check` passes.
- `curl -sI https://xpressabhi.github.io/<repo>/` returns 200; `curl` the page
  and confirm `theme.css` returns 200 and the dark-mode patterns are gone.
- Spot-check computed styles in a browser: `--paper` background, serif `h1`,
  rust links, contrast ≥ 4.5:1 on body, muted and mono-label text.
- Mobile-width check: nav collapses, no horizontal scroll.
- job-radar: re-render diff reviewed, `site/index.html` has no dark block.

Final sweep: `scripts/sync-theme.mjs --check` clean across all six, then
`--push` and re-curl all six live URLs.

## Risks

- **Six live sites change at once.** Mitigated by `--only` adoption, one repo
  per commit, verifying each before the next.
- **ordo loses its dark, technical-dashboard feel.** It is a repo guide rather
  than a product page; if the re-skin reads worse than the original, revert that
  one repo — the manifest makes it independent.
- **Contrast on cream.** Semantic colours and ordo's diagram retints are the
  risky values; each must be measured, not assumed. Anything under 4.5:1 gets
  darkened before commit.
- **job-radar's nightly crawl** regenerates `site/`. The template edit survives;
  the committed render is only for immediate visibility.
- **Seventh site later.** It links `theme.css` and runs `--check`; no re-pasting.
- **A future dark-mode request** would mean a second theme file, not five
  scattered media queries — the point of this refactor.
