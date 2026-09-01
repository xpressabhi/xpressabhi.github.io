#!/usr/bin/env node
/**
 * Build + sync script for xpressabhi.github.io.
 *
 * Reads data/profile.json (single source of truth) and generates:
 *   - index.html                  portfolio (from templates/portfolio.html)
 *   - resume/index.html               CV view (from templates/cv.html)
 *   - resume/abhishek-maurya-cv.pdf   print-ready PDF (Playwright, optional)
 *   - ../xpressabhi/README.md     GitHub profile README
 *   - ../career-ops/cv.md         career-ops pipeline CV
 *
 * Usage:
 *   node scripts/build.mjs            # everything except PDF
 *   node scripts/build.mjs --pdf      # also render the PDF
 *   node scripts/build.mjs --verify   # render portfolio + CV to /tmp and assert no leftovers
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { render, stripMd, mdToHtml } from "./lib/engine.mjs";
import { evidenceCoverage } from "./lib/evidence.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
function getVariantName() {
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--variant=")) return a.split("=")[1].trim();
    if (a === "--variant" && args[i + 1] && !args[i + 1].startsWith("--")) return args[i + 1].trim();
  }
  return null;
}
const VARIANT = getVariantName();
const REPO = JSON.parse(readFileSync(join(ROOT, "data/profile.json"), "utf8"));
const VARIANT_REPO = (() => {
  if (!VARIANT) return null;
  const cand = join(ROOT, `data/variants/${VARIANT}.json`);
  try { return JSON.parse(readFileSync(cand, "utf8")); } catch (e) {
    console.error(`✗ variant "${VARIANT}" not found at ${cand}: ${e.message}`);
    process.exit(1);
  }
})();
const EVIDENCE = (() => {
  try { return JSON.parse(readFileSync(join(ROOT, "data/evidence.json"), "utf8")); } catch { return { claims: {} }; }
})();
const P = (...p) => join(ROOT, ...p);
const OUT = (...p) => join(ROOT, "output", ...p);
const SITE_URL = "https://xpressabhi.github.io";

function checkEvidence() {
  const { covered, missing } = evidenceCoverage(REPO, EVIDENCE);
  if (missing.length) {
    const msg = `⚠ ${missing.length} claim(s) without provenance in data/evidence.json:\n  ${missing.join("\n  ")}`;
    if (process.argv.includes("--strict-evidence")) {
      console.error("✗ " + msg);
      process.exit(1);
    }
    console.warn(msg);
  }
  console.log(`✓ evidence: ${covered.length} claim(s) sourced`);
}

/* ------------------------------------------------------------------ */
/* Outputs                                                             */
/* ------------------------------------------------------------------ */

function buildPortfolio(latest) {
  const tpl = readFileSync(P("templates/portfolio.html"), "utf8");
  const repo = JSON.parse(JSON.stringify(REPO));
  repo.flagship = repo.flagship.map((f) => (f.dive ? { ...f, dive: f.dive.replace(/\.md$/i, ".html") } : f));
  repo.deepDives = repo.deepDives.map((d) => ({ ...d, file: d.file.replace(/\.md$/i, ".html") }));
  repo.latest = latest || null;
  return render(tpl, [repo]);
}

function buildCvPage(repo = REPO) {
  const tpl = readFileSync(P("templates/cv.html"), "utf8");
  const cv = { ...repo };
  const discontinued = repo.projects.filter((p) => p.status === "discontinued");
  const live = repo.projects.filter((p) => p.status !== "discontinued");
  cv.projects = live.concat(
    discontinued.length
      ? [{ name: discontinued.map((p) => p.name).join(" · "), status: "discontinued", description: "earlier projects, kept for reference", url: "" }]
      : []
  );
  return render(tpl, [cv]);
}

/* ------------------------------------------------------------------ */
/* Blog: deep-dives/*.md → blog/*.html (static posts + index)          */
/* ------------------------------------------------------------------ */

function lastCommitSec(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", `deep-dives/${file}`], {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out ? Number(out) : null;
  } catch {
    return null;
  }
}

function buildBlog() {
  const postTpl = readFileSync(P("templates/blog-post.html"), "utf8");
  const indexTpl = readFileSync(P("templates/blog-index.html"), "utf8");
  const curated = new Set([
    ...REPO.flagship.filter((f) => f.dive).map((f) => f.dive),
    ...REPO.deepDives.map((d) => d.file),
  ]);
  const files = [...curated, ...readdirSync(P("deep-dives")).filter((f) => f.endsWith(".md") && !curated.has(f)).sort()];
  const featured = new Set(REPO.flagship.filter((f) => f.dive).map((f) => f.dive));

  const posts = [];
  for (const file of files) {
    const md = readFileSync(P("deep-dives", file), "utf8");
    const lines = md.replace(/\r\n?/g, "\n").split("\n");

    const h1s = lines
      .map((l, idx) => ({ idx, m: l.match(/^#\s+(.*)$/) }))
      .filter((x) => x.m);
    const firstIdx = lines.findIndex((l) => l.trim() !== "");
    const first = firstIdx === -1 ? "" : lines[firstIdx];
    const firstIsHeading = /^#{1,6}\s+/.test(first);
    let titleLine = null;
    let title = "";
    if (!firstIsHeading) {
      titleLine = { idx: firstIdx };
      title = stripMd(first);
    } else if (h1s.length >= 2) {
      titleLine = h1s[1];
      title = stripMd(titleLine.m[1]);
    } else if (h1s.length === 1) {
      titleLine = h1s[0];
      title = stripMd(titleLine.m[1]);
    } else {
      const m = first.match(/^#{2,6}\s+(.*)$/);
      titleLine = { idx: firstIdx };
      title = stripMd(m ? m[1] : first);
    }

    let body = md;
    if (titleLine) body = lines.filter((_, idx) => idx !== titleLine.idx).join("\n");
    body = body
      .split("\n")
      .map((l) => (/^#\s+/.test(l) ? l.replace(/^#/, "##") : l))
      .join("\n");

    const excerptLines = body.split("\n");
    let excerpt = "";
    for (const l of excerptLines) {
      const t = l.trim();
      if (t === "" || /^(#{1,6}\s|```|[-*_]{3,}\s*$|\|)/.test(t) || /^!\[/.test(t)) continue;
      const plain = stripMd(t);
      if (!plain) continue;
      if (plain.length >= 60 && !/^(author|date|target role|reading time):/i.test(plain)) { excerpt = plain; break; }
      if (!excerpt) excerpt = plain;
    }
    if (excerpt.length > 200) excerpt = excerpt.slice(0, 197) + "…";

    const words = Math.max(1, body.split(/\s+/).length);
    const read = Math.max(1, Math.round(words / 200)) + " min read";
    const commitTs = lastCommitSec(file);
    const mtime = (commitTs ?? Math.floor(statSync(P("deep-dives", file)).mtimeMs / 1000)) * 1000;
    const updated = new Date(mtime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const slug = file.replace(/\.md$/i, "");

    const url = `${SITE_URL}/blog/${slug}.html`;
    const enc = encodeURIComponent;
    const scope = {
      name: REPO.basics.name, slug, title, excerpt, updated, read,
      featured: featured.has(file), content: mdToHtml(body),
      url,
      shareX: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      shareLinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    };
    const image = (scope.content.match(/<img class="post-image" src="([^"]+)"/) || [])[1] || "";
    scope.image = image ? (/^https?:\/\//i.test(image) ? image : SITE_URL + (image.startsWith("/") ? "" : "/") + image) : "";
    const ext = (image.match(/\.([a-z0-9]+)(?:$|[?#])/i) || [])[1];
    scope.imageType = ext ? `image/${ext === "jpg" ? "jpeg" : ext}` : "";
    posts.push({
      slug, title, excerpt, updated, read,
      featured: featured.has(file),
      image,
      mtime,
      html: render(postTpl, [scope]),
    });
  }

  posts.sort((a, b) => b.mtime - a.mtime);
  const index = render(indexTpl, [{ name: REPO.basics.name, email: REPO.basics.email, posts }]);
  return { posts, index };
}

function buildProfileReadme() {
  const b = REPO.basics;
  const skillGroups = Object.entries(REPO.skills)
    .map(([g, items]) => `- **${g}** — ${items.join(", ")}`)
    .join("\n");
  const expTable = REPO.experience
    .map((e) => `| **${e.company}** | ${e.role} | ${e.start} – ${e.end} |`)
    .join("\n");
  const projects = REPO.projects
    .filter((p) => p.status === "live")
    .map((p) => `- [${p.name}](${p.url}) — ${p.description}`)
    .join("\n");
  return `# ${b.name} 👋

Staff Software Engineer at **ServiceNow** — founded the **MCP-driven Agentic Developer Platform** used by **20+ teams** (Claude Code · MCP servers · agents · skills). AI Agents, MCP & agentic platform engineering. Ex-Rippling | Ex-Reputation | Ex-Oracle. NIT Trichy (MCA), ${b.yearsExperience} years of software development from ${b.location}.

- 🔌 Founded the **Agentic Developer Platform (ADP)** — multi-team bootstrap and governance for Claude Code, MCP servers, agents & skills: built in **4 weeks**, 20+ skills, 20+ agents, 20+ teams.
- 🤖 Led the architecture of the **Build Agent in ServiceNow Studio** — metadata-aware, multi-model (Claude Opus 4.6 + Now LLM + Bedrock), self-healing agentic workflows across 35+ metadata types & 11 domains.
- ⚡ **−95%** research & debugging effort, **−90%** case resolution time, **−90%** external defects on MCP-driven workflows.
- 🏆 Patent holder (${b.patent.number}) for importing tested objects into benefits programs at Oracle.
- 🌱 Exploring AI-first development practices — mentoring engineers in agentic development.

<br>

## 🔎 What I'm looking for

Staff/Principal roles building **AI agents, MCP tooling, or agentic platforms** — AI startups, dev tools, or mission-driven orgs. Remote (IST, US/EU overlap) or Hyderabad/Bengaluru. DMs open: agent platform work, MCP deep dives.

<br>

## Portfolio & CV

- 🌐 Portfolio: https://xpressabhi.github.io
- 📄 CV (with PDF download): https://xpressabhi.github.io/resume/

## Connect with me

[<img align="left" alt="linked-in" src="https://img.shields.io/badge/linkedin-%230077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white" />](https://www.linkedin.com/in/akm85/)
[<img align="left" alt="github" src="https://img.shields.io/badge/github-%23121011.svg?&style=for-the-badge&logo=github&logoColor=white" />](https://github.com/xpressabhi)
[<img align="left" alt="gmail" src="https://img.shields.io/badge/gmail-D14836?&style=for-the-badge&logo=gmail&logoColor=white" />](mailto:akm.nitt@gmail.com)
<br>
<br>

## Core Skills

${skillGroups}

## Experience Highlights

| Company | Role | Period |
| :--- | :--- | :--- |
${expTable}

## Notable Impact

${REPO.flagship.map((f) => `- **${f.title}** — ${f.summary}`).join("\n")}

## Personal Projects

${projects}

## Stats

<img align="left" alt="streak" src="http://github-readme-streak-stats.herokuapp.com?user=xpressabhi&theme=dark" />
`;
}

function buildCareerOpsCv() {
  const b = REPO.basics;
  const exp = REPO.experience
    .map((e) => {
      const bullets = e.highlights.map((h) => `- ${h}`).join("\n");
      const period = e.end === "Present" ? e.end : e.end.replace(/^\w+/, (w) => month(w));
      return `### ${e.company} — ${e.role}\n${e.location} · ${e.start.replace(/^\w+/, (w) => month(w))}–${period}\n\n${bullets}`;
    })
    .join("\n\n");
  const edu = REPO.education.map((e) => `- **${e.school}** — ${e.degree}, ${e.period}`).join("\n");
  const skills = Object.entries(REPO.skills).map(([g, items]) => `- **${g}:** ${items.join(", ")}`).join("\n");
  return `# ${b.name}

${b.headline}

${b.location} · ${b.phone} · ${b.email}

## Summary

${REPO.summary}

## Experience

${exp}

## Education

${edu}

## Skills

${skills}

## Patent

**${b.patent.title}** — ${b.patent.number}. Assigned to ${b.patent.assignedTo}; status: ${b.patent.status.toLowerCase()}.
`;
}

function buildCareerOsResume() {
  const b = REPO.basics;
  const exp = REPO.experience
    .map((e) => {
      const bullets = e.highlights.map((h) => `- ${h}`).join("\n");
      return `### ${e.company}, ${e.location} — ${e.role}\n**${e.start.toUpperCase()} – ${e.end.toUpperCase()}**\n\n*Technologies:* ${e.stack.join(", ")}\n\n${bullets}`;
    })
    .join("\n\n");
  const edu = REPO.education
    .map((e) => `**${e.school}, INDIA**\n${e.period.toUpperCase()}\n${e.degree}`)
    .join("\n\n");
  const skills = Object.entries(REPO.skills)
    .map(([g, items]) => `| ${g} | ${items.join(", ")} |`)
    .join("\n");
  const projects = REPO.projects.filter((p) => p.status === "live").map((p) => `- ${p.name}`).join("\n");
  return `\`\`\`markdown
# ${b.name}

**${b.yearsExperience} Years of Enterprise Software Development, Staff Software Engineer – AI Agent Platforms, MCP & Agentic Systems**

${b.location}

${b.phone} | ${b.email} | [Github](${b.github}) | [LinkedIn](${b.linkedin})

## Summary

${REPO.summary}

## Work Experience

${exp}

## Education

${edu}

## Skills

| Category | Skills |
|---|---|
${skills}

## Patent

**${b.patent.title}**

- URL: ${b.patent.url}
- Status: ${b.patent.status}
- Assigned: ${b.patent.assignedTo}

## Personal Projects

Projects hosted on Vercel, use Gemini API:

${projects}
\`\`\`
`;
}

const MONTHS = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June", Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December" };
function month(w) { return MONTHS[w] || w; }

/* ------------------------------------------------------------------ */
/* PDF via Playwright                                                  */
/* ------------------------------------------------------------------ */

async function renderPdf(cvHtml, outPath = P("resume/abhishek-maurya-cv.pdf")) {
  let playwright;
  const candidates = [
    join(ROOT, "node_modules/playwright"),
    "/Users/amaurya/Documents/GitHub/career-ops/node_modules/playwright",
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "package.json"))) {
      try {
        playwright = await import(`file://${join(dir, "index.mjs")}`);
        break;
      } catch {
        playwright = await import(`file://${join(dir, "index.js")}`).catch(() => null);
        if (playwright) break;
      }
    }
  }
  if (!playwright) {
    console.warn("⚠  Playwright not found. Skipping PDF. Install it (`npm i playwright`) or run `npm run build:pdf` after setup.");
    return false;
  }
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(cvHtml, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  mkdirSync(dirname(outPath), { recursive: true });
  await page.pdf({ path: outPath, preferCSSPageSize: true });
  await browser.close();
  console.log(`✓ ${outPath.replace(ROOT + "/", "")}`);
  return true;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const wantPdf = process.argv.includes("--pdf");
const verifyOnly = process.argv.includes("--verify");
checkEvidence();
if (VARIANT && VARIANT_REPO) {
  // Variant evidence check (non-strict, just warning)
  const { missing: variantMissing } = evidenceCoverage(VARIANT_REPO, EVIDENCE);
  if (variantMissing.length) console.warn(`⚠ variant "${VARIANT}": ${variantMissing.length} claim(s) without provenance (ok for tailored CV)`);
}
const blog = buildBlog();
const jobs = [
  ["index.html", buildPortfolio(blog.posts[0])],
  ["resume/index.html", buildCvPage()],
  ["blog/index.html", blog.index],
  ...blog.posts.map((p) => [`blog/${p.slug}.html`, p.html]),
];

// Variant CV (isolated, never overwrites main)
let variantHtml = null;
let variantRel = null;
let variantPdfPath = null;
if (VARIANT && VARIANT_REPO) {
  variantHtml = buildCvPage(VARIANT_REPO);
  variantRel = `resume/${VARIANT}/index.html`;
  variantPdfPath = P(`resume/${VARIANT}/abhishek-maurya-cv.pdf`);
}

if (verifyOnly) {
  mkdirSync(OUT(), { recursive: true });
  for (const [rel, html] of jobs) {
    mkdirSync(dirname(OUT(rel)), { recursive: true });
    writeFileSync(OUT(rel), html);
  }
  if (variantHtml) {
    mkdirSync(dirname(OUT(variantRel)), { recursive: true });
    writeFileSync(OUT(variantRel), variantHtml);
  }
  const allHtml = variantHtml ? [...jobs.map(([, h]) => h), variantHtml] : jobs.map(([, h]) => h);
  const leftover = allHtml
    .map((html) => html.match(/\{\{[#/]?[\w.@\s"|]+?\}\}/g) || [])
    .flat();
  const pdf = await renderPdf(buildCvPage());
  if (variantHtml) {
    const vpdf = await renderPdf(variantHtml, OUT(variantRel.replace("index.html", "abhishek-maurya-cv.pdf")));
    console.log("variant PDF rendered:", vpdf);
  }
  console.log("unresolved tokens:", [...new Set(leftover)]);
  console.log("PDF rendered:", pdf);
  process.exit(0);
}

for (const [rel, html] of jobs) {
  const dest = P(rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log(`✓ ${rel}`);
}

if (variantHtml) {
  const dest = P(variantRel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, variantHtml);
  console.log(`✓ ${variantRel} (variant: ${VARIANT})`);
}

if (!existsSync(P("resume/abhishek-maurya-cv.pdf"))) {
  console.warn("⚠ resume/abhishek-maurya-cv.pdf not found — the CV page embeds this file and will show a blank viewer. Run `npm run build:pdf`.");
}

const siblingJobs = [
  ["../xpressabhi/README.md", buildProfileReadme()],
  ["../career-ops/cv.md", buildCareerOpsCv()],
  ["../career-os/data/files/abhishek_maurya_2026.md", buildCareerOsResume()],
];
for (const [rel, content] of siblingJobs) {
  const dest = P(rel);
  if (!existsSync(dirname(dest))) {
    console.warn(`⚠ skipped ${rel} — sibling repo not checked out here`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
  console.log(`✓ ${rel}`);
}

if (wantPdf) {
  await renderPdf(buildCvPage());
  if (variantHtml) await renderPdf(variantHtml, variantPdfPath);
}
