#!/usr/bin/env node
/**
 * Build + sync script for xpressabhi.github.io.
 *
 * Reads data/profile.json (single source of truth) and generates:
 *   - index.html                  portfolio (from templates/portfolio.html)
 *   - cv/index.html               CV view (from templates/cv.html)
 *   - cv/abhishek-maurya-cv.pdf   print-ready PDF (Playwright, optional)
 *   - ../xpressabhi/README.md     GitHub profile README
 *   - ../career-ops/cv.md         career-ops pipeline CV
 *
 * Usage:
 *   node scripts/build.mjs            # everything except PDF
 *   node scripts/build.mjs --pdf      # also render the PDF
 *   node scripts/build.mjs --verify   # render portfolio + CV to /tmp and assert no leftovers
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = JSON.parse(readFileSync(join(ROOT, "data/profile.json"), "utf8"));
const P = (...p) => join(ROOT, ...p);
const OUT = (...p) => join(ROOT, "output", ...p);

/* ------------------------------------------------------------------ */
/* Template engine: {{path}}, {{join path "sep"}}, {{#each}}/{{#if}}   */
/* ------------------------------------------------------------------ */

function resolvePath(scopes, path) {
  if (path === "this") {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i] && "__value" in scopes[i]) return scopes[i].__value;
    }
    return undefined;
  }
  if (path.startsWith("@")) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const s = scopes[i];
      if (s && s.__meta && path in s.__meta) return s.__meta[path];
      if (s && path in s) return s[path];
    }
    return undefined;
  }
  const parts = path.split(".");
  for (let i = scopes.length - 1; i >= 0; i--) {
    let v = scopes[i];
    let ok = true;
    for (const part of parts) {
      if (v == null || !(part in Object(v))) { ok = false; break; }
      v = v[part];
    }
    if (ok) return v;
  }
  return undefined;
}

function truthy(v) {
  if (v == null || v === false || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function tokenize(tpl) {
  const tokens = [];
  const re = /\{\{([\s\S]*?)\}\}/g;
  let m, last = 0;
  while ((m = re.exec(tpl))) {
    if (m.index > last) tokens.push({ t: "text", v: tpl.slice(last, m.index) });
    const body = m[1].trim();
    if (body.startsWith("#each ")) tokens.push({ t: "each", path: body.slice(6).trim() });
    else if (body === "/each") tokens.push({ t: "closeEach" });
    else if (body.startsWith("#if ")) tokens.push({ t: "if", path: body.slice(4).trim() });
    else if (body === "/if") tokens.push({ t: "closeIf" });
    else if (body === "else") tokens.push({ t: "else" });
    else if (body.startsWith("join ")) {
      const mm = body.match(/^join\s+([\w.@]+)\s+"([^"]*)"$/);
      tokens.push({ t: "join", path: mm ? mm[1] : "", sep: mm ? mm[2] : " " });
    } else tokens.push({ t: "value", path: body });
    last = m.index + m[0].length;
  }
  if (last < tpl.length) tokens.push({ t: "text", v: tpl.slice(last) });
  return tokens;
}

function parseBlocks(tokens, stop) {
  const nodes = [];
  while (tokens.length) {
    const tok = tokens.shift();
    if (tok.t === stop) return nodes;
    if (tok.t === "each") {
      const children = parseBlocks(tokens, "closeEach");
      nodes.push({ t: "each", path: tok.path, children });
    } else if (tok.t === "if") {
      const children = parseBlocks(tokens, "closeIf");
      const elseIdx = children.findIndex((c) => c.t === "else");
      const then = elseIdx === -1 ? children : children.slice(0, elseIdx);
      const els = elseIdx === -1 ? [] : children.slice(elseIdx + 1);
      nodes.push({ t: "if", path: tok.path, then, els });
    } else if (tok.t === "else") {
      nodes.push({ t: "else" });
    } else nodes.push(tok);
  }
  return nodes;
}

function render(tpl, scopes) {
  const nodes = parseBlocks(tokenize(tpl));
  return renderNodes(nodes, scopes);
}

function renderNodes(nodes, scopes) {
  let out = "";
  for (const n of nodes) {
    if (n.t === "text") out += n.v;
    else if (n.t === "value") out += valueOr(resolvePath(scopes, n.path));
    else if (n.t === "join") {
      const v = resolvePath(scopes, n.path);
      out += Array.isArray(v) ? v.join(n.sep) : valueOr(v);
    } else if (n.t === "each") {
      const list = resolvePath(scopes, n.path);
      if (list == null) continue;
      const entries = Array.isArray(list)
        ? list.map((v, i) => ({ v, k: undefined, i }))
        : Object.entries(list).map(([k, v], i) => ({ v, k, i }));
      for (const { v, k, i } of entries) {
        const meta = { "@index": i, "@odd": i % 2 === 1, "@first": i === 0, "@last": i === entries.length - 1 };
        if (k !== undefined) meta["@key"] = k;
        const itemScope = typeof v === "object" && v !== null ? { ...v } : {};
        itemScope.__value = v;
        itemScope.__meta = meta;
        out += renderNodes(n.children, [...scopes, itemScope]);
      }
    } else if (n.t === "if") {
      out += renderNodes(truthy(resolvePath(scopes, n.path)) ? n.then : n.els, scopes);
    }
  }
  return out;
}

function valueOr(v) { return v == null ? "" : String(v); }

/* ------------------------------------------------------------------ */
/* Outputs                                                             */
/* ------------------------------------------------------------------ */

function buildPortfolio() {
  const tpl = readFileSync(P("templates/portfolio.html"), "utf8");
  return render(tpl, [REPO]);
}

function buildCvPage() {
  const tpl = readFileSync(P("templates/cv.html"), "utf8");
  return render(tpl, [REPO]);
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

Staff Software Engineer at **ServiceNow**, focused on **AI Agents, MCP & Harness Engineering**. Ex-Rippling | Ex-Reputation | Ex-Oracle. NIT Trichy (MCA), ${b.yearsExperience} years of software development from ${b.location}.

- 🤖 Building AI-assisted developer tooling — contributed to the **Build Agent in ServiceNow Studio**, powering agentic workflows for AI-assisted application creation, flow generation, and tool orchestration.
- 🔌 Designed and integrated **MCP-driven agentic workflows** into the engineering lifecycle, adopted by **20+ teams** across the organization.
- ⚡ Reduced case task resolution, research and debugging effort by **~95%** while improving accuracy.
- 🏗️ Built an **Agentic Developer Platform (ADP)** in 4 weeks — 20+ skills, 20+ agents, 20+ teams — bootstrapping Claude Code, MCP servers, and custom agents with zero manual config.
- 🏆 Patent holder (${b.patent.number}) for importing tested objects into benefit programs at Oracle.
- 🌱 Continuously learning — currently exploring AI-first development practices.

<br>

## Portfolio & CV

- 🌐 Portfolio: https://xpressabhi.github.io
- 📄 CV (with PDF download): https://xpressabhi.github.io/cv/

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

async function renderPdf(cvHtml) {
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
  mkdirSync(P("cv"), { recursive: true });
  await page.pdf({ path: P("cv/abhishek-maurya-cv.pdf"), preferCSSPageSize: true });
  await browser.close();
  console.log("✓ cv/abhishek-maurya-cv.pdf");
  return true;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const wantPdf = process.argv.includes("--pdf");
const verifyOnly = process.argv.includes("--verify");
const jobs = [
  ["index.html", buildPortfolio()],
  ["cv/index.html", buildCvPage()],
];

if (verifyOnly) {
  mkdirSync(OUT(), { recursive: true });
  for (const [rel, html] of jobs) {
    mkdirSync(dirname(OUT(rel)), { recursive: true });
    writeFileSync(OUT(rel), html);
  }
  const leftover = (readFileSync(OUT("index.html"), "utf8").match(/\{\{[#/]?[\w.@\s"|]+?\}\}/g) || [])
    .concat(readFileSync(OUT("cv/index.html"), "utf8").match(/\{\{[#/]?[\w.@\s"|]+?\}\}/g) || []);
  const pdf = await renderPdf(buildCvPage());
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

if (!existsSync(P("cv/abhishek-maurya-cv.pdf"))) {
  console.warn("⚠ cv/abhishek-maurya-cv.pdf not found — the CV page embeds this file and will show a blank viewer. Run `npm run build:pdf`.");
}

writeFileSync("/Users/amaurya/Documents/GitHub/xpressabhi/README.md", buildProfileReadme());
console.log("✓ ../xpressabhi/README.md");

writeFileSync("/Users/amaurya/Documents/GitHub/career-ops/cv.md", buildCareerOpsCv());
console.log("✓ ../career-ops/cv.md");

writeFileSync("/Users/amaurya/Documents/GitHub/career-os/data/files/abhishek_maurya_2026.md", buildCareerOsResume());
console.log("✓ ../career-os/data/files/abhishek_maurya_2026.md");

if (wantPdf) await renderPdf(buildCvPage());
