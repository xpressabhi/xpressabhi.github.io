# UI research — personal sites for a Head of AI Engineering

**Date:** 2026-11-02. **Method:** fetched the live HTML and served CSS for every site below; type sizes are read from CSS, not estimated from screenshots (rem → px at a 16px root). Gallery claims link to the gallery page. Where I say a site is "not well-designed", that is a judgement from primary observation, not a metric.

**Selection note:** the "well-designed personal site" canon and the "senior AI leader" canon barely overlap. Awwwards/SiteInspire reward art direction; AI leaders reward proof. The useful move is composition from the first group, content from the second.

## The blunt read

- **Most famous AI sites are not design references.** Karpathy, Simon Willison, Hamel, Eugene Yan, Shreya Shankar, Chip and Jason Liu run default-ish themes (sans/Georgia/Lora, Bootstrap/Quarto/MkDocs/Jekyll). They win on information architecture, dates, and proof — not typography.
- **The genuinely well-designed ones are design engineers and design-adjacent AI people:** swyx, Amelia Wattenberger, Rauno Freiberg, Paco Coursey, Brian Lovin, Shu Ding, Maggie Appleton.
- **All 12 sites in the main table are built around a light paper/white canvas** (white, #fcfcfc, #f5f0e7, #f6f5f1). Several auto-switch or offer a dark toggle, but none uses a dark, neon-accented hero as its signature. Dark mode is not a shortcut to seriousness.
- **The strongest AI-person site right now is swyx.io.** Its own author wrote in 2023 that his previous site was "trying too hard" and that he wanted the "minimalist and high value aesthetic of nat.org"; the current literary design reads as that correction: <https://swyx.io/rewrite-2023>, <https://nat.org/>.
- **Biggest gap:** nobody publishes an org chart or team topology. That is an opening for a Head of AI, not a reason to copy another hero.

## 12 sites worth inspecting

| Site | Who | The one composition idea that works | Verdict |
|---|---|---|---|
| <https://swyx.io/> | Shawn Wang — AI Engineer, Latent Space, Cognition | **Public-notebook masthead:** 40–60.8px headline + a two-cities illustration; bio has short/medium/long states | Best current AI-person site; genuinely designed |
| <https://simonwillison.net/> | Simon Willison — independent AI engineer | **Blog as front page:** title, tag-count dashboard (2,045 generative-AI posts), search, then dated entries | Best IA in AI; zero visual design |
| <https://hamel.dev/> | Hamel Husain — AI evals, ex-Airbnb/GitHub | **Teaching funnel:** cohort banner → 21/79 portrait+bio → dated post table | Plain Quarto; copy the funnel, not the skin |
| <https://eugeneyan.com/> | Eugene Yan — Anthropic | **One sentence + a short action list + a dated "Latest" list**; the About page is a year/role/metric timeline | Plain Bootstrap; excellent content hierarchy |
| <https://shreya-shankar.com/> | Shreya Shankar — AI researcher, incoming CMU faculty | **Profile card + mentee ledger:** 240px sidebar, current/past mentees each with a destination | Academic template; the people list is best-in-class |
| <https://karpathy.ai/> | Andrej Karpathy — AI leader | **Seven-row career timeline:** date, logo, team scope, one paragraph | Popular because Karpathy, not because it is well-designed. Steal the timeline |
| <https://wattenberger.com/> | Amelia Wattenberger — Principal Research Engineer, GitHub (AI/ML interfaces) | **The name is the hero:** a 12vw SVG mask filled with an oklch gradient, a rotated 2vw "Hi, I'm" set at a 12vw left margin | Genuinely distinctive; best oversized-name treatment I found |
| <https://rauno.me/> | Rauno Freiberg — interaction designer, Vercel | **Portfolio as a deck of 1200×720 sheets:** 85px statement, horizontal scroll, minimap | Genuinely best-in-class; Awwwards HM Sep 2025 |
| <https://paco.me/> | Paco Coursey — Linear | **Three-column baseline grid:** 16px name, 640px content, work list in the margins | Quiet, superb; the anti-hero hero |
| <https://brianlovin.com/> | Brian Lovin — Notion (AI products) | **60px avatar + 24px statement at the same weight as the name**, 672px column, 128px air | Conventional but impeccable |
| <https://shud.in/> | Shu Ding — Vercel (AI SDK, v0) | **16px name, 672px column, one 1px vertical rule**; no hero at all | Extreme restraint that works |
| <https://maggieappleton.com/> | Maggie Appleton — GitHub Next, AI/design | **58–82px serif thesis over a garden taxonomy** (Essays/Notes/Patterns/Library) | Best editorial personal site; not a leader portfolio, great type |

**Also examined, one lesson each:**

- <https://huyenchip.com/> — Chip Huyen's **authority-by-artifacts page**: books, NVIDIA/Snorkel/Netflix, a company founded and sold; a circular portrait floated at 33%, 16px Lora. Dated Jekyll, but the "name the artifacts" move works.
- <https://tompiagg.io/> — CTO/co-founder; the **metric-first work rows** are the best part (`~$550K peak ARR`, `100B CCTV frames`, `350M images in two weeks`). Hero is template-grade; see "avoid".
- <https://jxnl.co/user_manual/> — Jason Liu's **User Manual** ("What I Value / How to Communicate / My Leadership Approach") is the cleanest "how I lead" page I found. He openly calls himself a new manager — steal the structure, not the claim.
- <https://nat.org/> — 650px, 16px, bullet lists. Not designed; cited by swyx as the minimal ideal. Proof that restraint can beat polish.
- <https://patrickcollison.com/> — a bare index of pages. Anti-design; works only because the content is Patrick Collison.
- <https://craigmod.com/> — 115px display type and a membership business; the best example of editorial scale, but wrong genre for a Head of AI.

## Hero forensics (exact values from served CSS)

| Site | H1 / hero type | Photo? | Air and layout | What to copy |
|---|---|---|---|---|
| swyx.io | `clamp(2.5rem, 4vw, 3.8rem)/1.05`, 700, `-0.05em` → 40–60.8px | No — illustration, 1100×402 | 1160px shell; hero grid `1fr / minmax(19rem,.9fr)`; 2.2rem top / 2.8rem bottom | Two-column masthead; one image; a depth control for the bio |
| simonwillison.net | `2em` Georgia → 32px | No | 940px column; 25px top padding | Tag counts + search + dates |
| hamel.dev | 32px (Bootstrap `2rem`) | Yes — 21% column | ~800px content; 21/79 split; cohort banner above the fold | Portrait beside a 20-year credibility paragraph |
| eugeneyan.com | 32px Merriweather; header name 24px lowercase | No | Bootstrap container; 16px body | "Hi, I'm X" + a short action list |
| shreya-shankar.com | 24px serif name | Yes — 220px, in sidebar | `240px 1fr`, `gap: 4rem` | Sidebar identity + main proof |
| karpathy.ai | 34px, normal weight | Yes — 240px circle | 970px container; 20px top margin; dense | Timeline, not hero |
| wattenberger.com | **12vw SVG name** (≈173px at 1440), `font-black`, `-0.02em`; "Hi, I'm" at 2vw, rotated −10° | No | `pt-[13vh]`; 30em measure; 12–15vw left margin; body `clamp(1rem,2vw,1.25rem)` | Name as a graphic element, not a text block |
| rauno.me | **85px** inside a fixed 1200×720 frame | No | Frame padding 64px, gap 64px; scaled to viewport | Treat the first screen as a composed sheet |
| paco.me | **16px / 500** | No | 640px content + 192px side columns, 24px gaps | A small name is a confidence move |
| brianlovin.com | 24px name; statement also 24px | Yes — 60px avatar | 672px column; `py-32` = 128px top/bottom | Name and positioning at the same size |
| shud.in | **16px / 600** | No | 672px column; 24px top; 1px rule | One rule can carry the whole layout |
| maggieappleton.com | **57.6–81.8px** fluid serif (`--f-5` 57.6→81.8) | No | 1200px title measure; body 20–22px | A thesis, not a job title |

The spread is the point: 16px and 85px both work. Giant type is not a concept; hierarchy is.

Four of the 12 use a photo (Hamel 21% column, Shreya 220px, Karpathy 240px, Brian 60px); eight use none. Nobody uses a full-bleed portrait. Air splits into two camps: generous (Brian 128px, Rauno a full frame, Paco 192px side margins, Amelia 13vh) and utilitarian (Karpathy 20px, Hamel's course banner). Both work; mixing them does not.

## "I led teams" without internal screenshots

What the good ones actually do — all public, all checkable:

1. **Scope in a timeline, not a brag.** Karpathy's 2017–2022 row says he "led the computer vision team of Tesla Autopilot" and that the team "handled all in-house data labeling, neural network training and deployment on Tesla's custom inference chip." Dates are 14px `#bbb`, descriptions 17px, seven rows from 2005 to now: <https://karpathy.ai/>. Copy the pattern: role + team size + surfaces owned + one external outcome.
2. **A people ledger.** Shreya Shankar lists current and past mentees with destinations: "Quentin Romero Lauro (undergrad → CEO @ Inspector, YC 2025)", "Reya Vir (undergrad → PhD @ Columbia; NSF GRFP)". No photos, no internal work: <https://shreya-shankar.com/>. This is the single best leadership proof on any site I inspected.
3. **Teaching at scale as a metric wall.** Hamel: "5,000+ students from 500+ companies (including OpenAI, Anthropic, and Google)", plus 20+ years and Airbnb/GitHub: <https://hamel.dev/>. The numbers are specific and concrete.
4. **Metrics inside a career timeline.** Eugene Yan's About page: "led machine learning at Alibaba/Lazada" with "conversion +5–20%", "CTR +10%", "cost -90%", and "led the team" at a healthtech Series A: <https://eugeneyan.com/about/>. Each metric is attached to a year and a role, not floating in a hero.
5. **A leadership letter.** Jason Liu's User Manual states values, communication rules, and a leadership approach in plain text. It humanises without leaking anything confidential: <https://jxnl.co/user_manual/>. A Head of AI version: "how my org makes decisions", "what I expect in the first 90 days", "how I run evals".
6. **Metric-first work rows.** Tom Piaggio: `~$550K peak ARR` / `100B CCTV frames in 2019` / `350M images in two weeks`, each followed by role + dates + a two-sentence story: <https://tompiagg.io/>. This replaces the impossible "screenshot of internal dashboard".

**Org charts:** none of the 12 published one. The nearest thing to team topology is Shreya's mentee list. If you build one, show shape and headcount (lead → eval pod → platform pod → applied pod), not names or internal reporting lines.

## Four patterns to build

### 1. The quiet proof masthead

Use instead of a full-bleed hero image.

```
[12px mono, uppercase, .08em]  HEAD OF AI ENGINEERING · SAN FRANCISCO
[48px display, 1.05, -.03em]     One sentence, ≤14 words. What you run, not "passionate".
[20px/1.55, max 34rem]           Two lines: scale + the systems you own.
[13px mono]                      Writing · Systems · People · Email
[diagram, 4:3, 1px rules]        Optional; one diagram, no headshot.
```

- **Grid:** 1160px max; `grid-template-columns: 1fr 0.9fr`; page top padding 96–128px (swyx runs tighter at 2.4rem); hero block 2.2rem top / 2.8rem bottom (swyx's actual values).
- **Type:** display `clamp(2.5rem, 4vw, 3.8rem)` at 700, `-0.05em`; lede 20px; meta 13px mono. Do not exceed 60.8px.
- **Colour roles:** paper `#F5F0E7`, surface `#FBF8F2`, ink `#292A24`, muted `#6C675D`, link/accent `#974337`, rule `#DDD2C1` — swyx's live palette. One accent only; no gradient.
- **Detail worth stealing:** a short/medium/long bio toggle, so a recruiter and a peer can read the same page at different depths (<https://swyx.io/about>).
- **Why it works:** it reads as a person with a point of view, not a template with a photo.

### 2. The scope ledger

The replacement for "selected projects" when the work is internal.

```
2023–now   Head of AI, [Company]                     [public link ↗]
           14 engineers · 3 pods · eval, platform, applied
           One externally checkable outcome. One sentence on what broke.

2021–23    Director of ML, [Company]                 [public link ↗]
           8 engineers · retrieval + ranking
           Latency −38%; cost per 1k requests −61%.
```

- **Grid:** 88px date / `1fr` role+scope / 220px proof; 7 rows max; 32px vertical padding; 1px `#DDD2C1` top border per row.
- **Type:** date 12px mono uppercase muted; role 22px/1.25 display; scope 17px/1.55; proof 12px mono.
- **Rules:** no logos larger than 20px, no screenshots, no confidential client names. If a number is not public, write the shape of the outcome ("cut eval cycle from days to hours") and say it is internal.
- **Evidence:** Karpathy's seven-row timeline (<https://karpathy.ai/>); Eugene's year/role/metric rows (<https://eugeneyan.com/about/>).

### 3. Metric-first case rows

Three rows, not a bento grid. This is the most useful thing on Tom Piaggio's site.

```
~$550K                  100B                    350M
PEAK ARR                CCTV FRAMES IN 2019     IMAGES IN TWO WEEKS
Co-founder & CTO        Co-founder & CTO        Senior SWE (L5)
2024–present            2019–2022               2022–2023
Two sentences: what it was, what broke, what shipped.   [Read ↗]
```

- **Grid:** 12 columns, 4 per case; 1px top rule; no card fill, no shadow, radius ≤4px.
- **Type:** metric 56–72px, `font-variant-numeric: tabular-nums`, `-0.04em`; label 12px mono uppercase in accent; role 14px muted; body 16px; link 13px.
- **Colour:** metric in ink, label in the single accent, everything else muted. If every number is accent-coloured, none is.
- **Rule:** one metric per case, and only if you can defend the denominator. "100B frames" is good; "10x faster" with no baseline is not.
- **Evidence:** <https://tompiagg.io/>.

### 4. The people wall

For a Head of AI, this is stronger than another project card.

```
Name                      →  Outcome / destination
14 people                 2 columns, 16px name, 14px muted outcome
```

- **Layout:** 2 columns at ≥768px, 1 column mobile; 13–20 entries; no photos; name is a link, outcome is plain text.
- **Type:** name 16px/500; outcome 14px/1.5 muted; section label 12px mono uppercase.
- **Content:** "led → promoted", "mentored → PhD", "hired → founded", "grew from 4 to 14". Use real names only with consent; otherwise anonymise ("ML engineer → staff at a frontier lab").
- **Optional topology:** a 5-node diagram (you → eval, platform, applied, safety) with headcounts, not names. No org-chart clip art.
- **Evidence:** Shreya's current/past mentees with destinations (<https://shreya-shankar.com/>); swyx's investing/advising portfolio, 61 companies and individuals (<https://swyx.io/portfolio>).

## What to avoid in 2026

- **The dark 8vw "Hey, I'm X" hero.** Tom Piaggio's is well-built — `clamp(3rem, 8vw, 7rem)`, `#0a0a0a`, `#f50538`, 80vh, newsletter pill — but that exact shape is now the default AI-founder template: <https://tompiagg.io/>. It says "AI startup" before it says "you". Same for purple-blue gradients, glass cards, and a sparkle icon.
- **Award-bait motion on a leadership site.** Cube transitions, a playable Tetris, custom cursors, scroll-jacking: impressive on Awwwards (<https://www.awwwards.com/sites/stas-bondar-25>, <https://www.awwwards.com/sites/abhishek-jha-folio-25>), wrong genre signal for a Head of AI. It reads "creative developer", not "runs a function".
- **Skill percentage bars and animated counters.** "Python 95%" is unfalsifiable; a counter that counts up to "50+ projects" is theatre. Dates, team sizes, and public links are better.
- **The generic case study.** "Problem → Solution → Impact" with no date, no number, no link, and a stock dashboard mock. If the work is internal, use pattern 2 or 3 instead of inventing a screenshot.
- **Bento grids of glass cards.** Four rounded panels with icons and 12px grey text is the most cloned portfolio layout of 2024–26; it hides the writing.
- **Six CTAs and a 300-word hero.** Swyx's own verdict on his pre-2026 site: it was "trying too hard to offer all my stuff to the reader" and overwhelmed them (<https://swyx.io/rewrite-2023>). Pick one primary action.
- **"AI-powered" as a personality.** The site does not need an LLM; the work does. A chat widget on a portfolio is usually a liability.
- **Portrait with a gradient ring, "available for freelance" pill, Calendly in the hero.** These read as availability, not seniority. Put contact in the footer and one line in the masthead.
- **Dark mode as a shortcut.** The 12 sites above are designed on a light paper/white canvas; some switch to dark, but that is not their signature. A warm paper page with one oxide accent is more distinctive in AI than another black page with neon.

## Evidence notes

- Gallery anchors: Awwwards Honorable Mention for Rauno Freiberg's Portfolio 2025 (Sep 01 2025), palette recorded as `#FFFFFF` / `#FFFF02`: <https://www.awwwards.com/sites/portfolio-2025>. SiteInspire's personal category shows the current art-directed canon: <https://www.siteinspire.com/websites/category/personal>.
- Type and colour values are from the served CSS on 2026-11-02; `clamp()` values are quoted verbatim, with px equivalents at a 16px root. Layout values (max-widths, gaps, padding) are likewise from CSS, not visual estimation.
- The "light canvas" claim covers the 12 sites in the main table, based on their served `body`/root backgrounds (#fff, #fcfcfc, #f5f0e7, #f6f5f1, #fdfdfd). Several switch with `prefers-color-scheme` or a toggle; the designed signature remains light.
- No site or metric in this document is invented. Where I call something "template-grade" or "dated", it is a design judgement, not a measured fact.
