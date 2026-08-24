#!/usr/bin/env node
/**
 * profile pipeline: market → learning-targets feedback loop.
 *
 * Reads job descriptions dropped in data/market/*.md (by you or the
 * remote-job-finder skill), extracts each JD's required skills with an LLM,
 * diffs them against data/profile.json, and writes a ranked gap report to
 * output/learning-targets.md.
 *
 * Usage: npm run market:sync
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat } from "./lib/llm.mjs";
import { parseJsonLoose } from "./lib/evidence.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MARKET = join(ROOT, "data", "market");
const profile = JSON.parse(readFileSync(join(ROOT, "data/profile.json"), "utf8"));

const jds = existsSync(MARKET)
  ? readdirSync(MARKET)
      .filter((f) => /\.(md|txt)$/i.test(f) && !/^readme/i.test(f))
      .map((f) => ({ file: f, text: readFileSync(join(MARKET, f), "utf8") }))
  : [];
if (!jds.length) {
  console.error(`No job descriptions found. Drop .md/.txt JD files into data/market/ first.`);
  process.exit(1);
}

const SYSTEM = `You extract hard requirements from job descriptions for a staff-level AI/platform engineer.
Return ONLY JSON: {"skills": ["skill", ...]} — concrete, deduplicated, lowercase
technologies/tools/practices the JD requires or strongly prefers (e.g. "rag evaluation", "kubernetes", "go").
Do not include soft skills or generic phrases like "strong communicator".`;

const known = new Set(Object.values(profile.skills || {}).flat().map((s) => s.toLowerCase()));

const perJd = [];
const demand = new Map();

for (const jd of jds) {
  let skills;
  try {
    const reply = await chat(SYSTEM, jd.text.slice(0, 12000));
    skills = parseJsonLoose(reply).skills || [];
  } catch (e) {
    console.error(`✗ ${jd.file}: ${e.message}`);
    continue;
  }
  perJd.push({ file: jd.file, skills });
  for (const s of skills) demand.set(s, (demand.get(s) || 0) + 1);
}

const gaps = [...demand.entries()]
  .filter(([s]) => !known.has(s) && ![...known].some((k) => k.includes(s) || s.includes(k)))
  .sort((a, b) => b[1] - a[1]);

const lines = [
  `# Learning targets — market gap report`,
  ``,
  `_Generated ${new Date().toISOString().slice(0, 10)} from ${jds.length} JD(s) in data/market/ vs data/profile.json._`,
  ``,
  `## Top gaps (required by JDs, missing from profile)`,
  ``,
  ...gaps.map(([s, n]) => `- **${s}** — required by ${n}/${jds.length} JDs`),
  ``,
  `## Coverage per JD`,
  ``,
  ...perJd.map(({ file, skills }) => {
    const hit = skills.filter((s) => known.has(s)).length;
    return `- **${file}**: ${hit}/${skills.length} required skills already evidenced (${skills.filter((s) => !known.has(s)).slice(0, 6).join(", ") || "no gaps"})`;
  }),
  ``,
  `_Pick 3–5 targets max. When you learn one, the profile-sync loop picks it up automatically._`,
];

mkdirSync(join(ROOT, "output"), { recursive: true });
writeFileSync(join(ROOT, "output", "learning-targets.md"), lines.join("\n"));
console.log(lines.join("\n"));
console.log("\n✓ output/learning-targets.md");
