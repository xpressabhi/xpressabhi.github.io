#!/usr/bin/env node
/**
 * profile pipeline: AI analysis of scan findings.
 *
 * Merges both evidence sources (session signals + repo commits), gathers a
 * deep evidence bundle per candidate (README, file tree, commit subjects,
 * languages), and asks an LLM to judge each candidate against the current
 * profile: portfolio project? CV skill? blog post? noise? already covered?
 *
 * Output is an ANALYSIS (output/scan-analysis.{md,json}) with draft changes —
 * nothing is applied to data/profile.json without human approval.
 *
 * Usage:
 *   npm run analyze                              # runs both scanners fresh
 *   npm run analyze -- --repos r.json --signals s.json   # reuse saved reports
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { chat } from "./lib/llm.mjs";
import { parseJsonLoose } from "./lib/evidence.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const argv = process.argv;
const flag = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : null;
};

/* ---------- gather scan reports (fresh or from files) ------------------- */

function runScanner(cmd, args, cwd) {
  try {
    return JSON.parse(execFileSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: 300000 }));
  } catch (e) {
    console.error(`⚠ scanner failed (${String(e.message).slice(0, 100)}) — continuing without it`);
    return null;
  }
}

const reposReport = flag("--repos")
  ? JSON.parse(readFileSync(flag("--repos"), "utf8"))
  : runScanner("node", ["scripts/scan-repos.mjs"], ROOT);

const signalsReport = flag("--signals")
  ? JSON.parse(readFileSync(flag("--signals"), "utf8"))
  : runScanner("node", [join(homedir(), ".agents", "skills", "profile-sync", "scripts", "scan-sessions.mjs")], ROOT);

const repoProposals = reposReport?.proposals || [];
const signals = signalsReport?.learning_signals || [];
const candidateSkills = signalsReport?.candidate_skills || [];

if (!repoProposals.length && !signals.length && !candidateSkills.length) {
  console.log("Nothing to analyze: no repo proposals, learning signals, or candidate skills.");
  process.exit(0);
}

/* ---------- evidence bundles -------------------------------------------- */

const GIT = (dir, args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();

function repoBundle(p) {
  const dir = join(homedir(), "Documents", "GitHub", p.name);
  const bundle = { ...p, readme_excerpt: null, top_level: null, languages: null };
  if (!existsSync(dir)) return bundle;
  try {
    bundle.top_level = GIT(dir, ["ls-tree", "--name-only", "HEAD"]).split("\n").slice(0, 25);
    const files = GIT(dir, ["ls-files"]).split("\n");
    const exts = {};
    for (const f of files) {
      const ext = f.split(".").pop();
      if (ext && ext.length <= 5 && f.includes(".")) exts[ext] = (exts[ext] || 0) + 1;
    }
    bundle.languages = Object.entries(exts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, n]) => `${e}(${n})`).join(", ");
    const readme = bundle.top_level.find((f) => /^readme(\.md|\.txt|)$/i.test(f));
    if (readme) bundle.readme_excerpt = readFileSync(join(dir, readme), "utf8").slice(0, 1200);
  } catch { /* partial bundle is fine */ }
  return bundle;
}

const profile = JSON.parse(readFileSync(join(ROOT, "data/profile.json"), "utf8"));
const profileContext = {
  current_projects: (profile.projects || []).map((p) => p.name),
  current_deep_dives: (profile.deepDives || []).map((d) => d.title),
  skill_groups: Object.fromEntries(Object.entries(profile.skills || {}).map(([g, items]) => [g, items])),
};

const candidates = [
  ...repoProposals.map((p) => ({ source: "repo", ...repoBundle(p) })),
  ...signals.map((s) => ({ source: "session", excerpt: s.excerpt, session: s.session })),
  ...candidateSkills.map((c) => ({ source: "session_terms", term: c.term, mentions: c.mentions })),
];

/* ---------- LLM analysis ------------------------------------------------- */

const SYSTEM = `You are the strict curator of a staff software engineer's public profile (portfolio, CV, blog).
Decide what deserves to be added. Evidence rules:
- Mentions are not evidence. Authorship must be supported by the bundle (commits, README, file tree).
- Prefer depth over breadth: one substantial project beats five half-mentions.
- Do not propose duplicates of what the profile already covers.
- Blog posts need a genuine insight, saga, or measured result — not just "I built X".
- Skills need demonstrated use, and must be career-relevant for Staff-level AI/platform roles.
Verdicts: "portfolio_project" (add to projects), "cv_skill" (add to a skills group),
"blog_post" (write a deep-dive), "noise" (drop), "already_covered" (profile has it).
confidence 0-1. evidence_strength: strong (multiple independent signals) | medium | weak.
proposed_change.patch_hint must be a concrete one-line suggestion naming the exact section and entry text.
Respond with ONLY JSON: {"verdicts":[{"candidate":string,"source":string,"verdict":string,"confidence":number,"evidence_strength":string,"reasoning":string,"proposed_change":{"section":string,"patch_hint":string}|null}]}`;

console.error(`Analyzing ${candidates.length} candidate(s)…`);
const reply = await chat(SYSTEM, JSON.stringify({ profile: profileContext, candidates }, null, 2));
let parsed;
try {
  parsed = parseJsonLoose(reply);
} catch {
  console.error("✗ Could not parse model reply. Raw:\n" + reply.slice(0, 2000));
  process.exit(1);
}

/* ---------- report -------------------------------------------------------- */

const verdicts = parsed.verdicts || [];
const order = { portfolio_project: 0, blog_post: 1, cv_skill: 2, already_covered: 3, noise: 4 };
verdicts.sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9) || b.confidence - a.confidence);

const md = [
  `# Scan analysis — ${new Date().toISOString().slice(0, 10)}`,
  ``,
  `_Inputs: ${repoProposals.length} repo proposal(s), ${signals.length} learning signal(s), ${candidateSkills.length} candidate term(s). Nothing below is applied — review, then edit data/profile.json by hand._`,
  ``,
  ...verdicts.map((v) => {
    const badge = { portfolio_project: "🏗", blog_post: "✍️", cv_skill: "🧰", already_covered: "♻️", noise: "🗑️" }[v.verdict] || "·";
    return [
      `## ${badge} ${v.verdict} (${v.confidence}) — ${v.candidate}`,
      ``,
      `- **Evidence:** ${v.evidence_strength} · **Source:** ${v.source}`,
      `- **Why:** ${v.reasoning}`,
      v.proposed_change ? `- **Draft change** → \`${v.proposed_change.section}\`: ${v.proposed_change.patch_hint}` : "",
      ``,
    ].filter(Boolean).join("\n");
  }),
];

mkdirSync(join(ROOT, "output"), { recursive: true });
writeFileSync(join(ROOT, "output", "scan-analysis.json"), JSON.stringify({ generated_at: new Date().toISOString(), verdicts }, null, 2));
writeFileSync(join(ROOT, "output", "scan-analysis.md"), md.join("\n"));

for (const v of verdicts) {
  console.log(`[${v.verdict}/${v.confidence}] ${String(v.candidate).slice(0, 70)}`);
}
console.log(`\n✓ output/scan-analysis.md + .json — review, then apply approved items to data/profile.json by hand.`);
