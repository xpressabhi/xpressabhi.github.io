#!/usr/bin/env node
/**
 * profile pipeline: LLM classification of session-scan signals.
 *
 * Takes the JSON report from the profile-sync skill's scan-sessions.mjs
 * (file argument or stdin) and asks an LLM to classify each learning signal
 * and candidate skill: project / skill / learning / noise, with a quote and
 * a suggested profile action. Output is a PROPOSAL file — nothing is applied
 * without human review.
 *
 * Usage:
 *   node scripts/classify-signals.mjs report.json
 *   scan-sessions.mjs | node scripts/classify-signals.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chat } from "./lib/llm.mjs";
import { parseJsonLoose } from "./lib/evidence.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const arg = process.argv[2];
const input = JSON.parse(arg ? readFileSync(arg, "utf8") : readFileSync(0, "utf8"));

const signals = input.learning_signals || [];
const candidates = input.candidate_skills || [];
if (!signals.length && !candidates.length) {
  console.log("Nothing to classify: no learning signals or candidate skills in the report.");
  process.exit(0);
}

const SYSTEM = `You audit evidence that a software engineer learned or built something, taken from their AI-coding-assistant session logs.
Classify each item. Rules:
- "project": the user built or substantially modified something concrete (an app, agent, pipeline, repo).
- "skill": a technology/tool/practice the user demonstrably used or worked through (not merely mentioned).
- "learning": a genuine insight or deepening (debugging saga, benchmark, design decision) that could become a blog post.
- "noise": small talk, questions about existing work, planning chatter, or anything without evidence of doing.
Be strict: mentions are not evidence. confidence is 0-1. quote must be copied verbatim from the input excerpt.
Respond with ONLY JSON: {"items":[{"input":string,"kind":string,"confidence":number,"quote":string,"suggested_action":string}]}`;

const payload = {
  learning_signals: signals.map((s) => s.excerpt),
  candidate_skills: candidates.map((c) => `${c.term} (mentioned ${c.mentions}x)`),
};

const reply = await chat(SYSTEM, JSON.stringify(payload, null, 2));
let parsed;
try {
  parsed = parseJsonLoose(reply);
} catch {
  console.error("✗ Could not parse model reply as JSON. Raw reply:\n" + reply.slice(0, 2000));
  process.exit(1);
}

const proposals = {
  generated_at: new Date().toISOString(),
  source: arg || "stdin",
  reviewed: false,
  items: (parsed.items || []).filter((i) => i.kind !== "noise" || i.confidence < 0.9),
  noise_dropped: (parsed.items || []).filter((i) => i.kind === "noise" && i.confidence >= 0.9).length,
};

const out = join(ROOT, "output", "signal-proposals.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(proposals, null, 2));

for (const i of proposals.items) {
  console.log(`[${i.kind}/${i.confidence}] ${i.input.slice(0, 80)}`);
  console.log(`   → ${i.suggested_action}`);
}
console.log(`\n${proposals.items.length} proposal(s) written to output/signal-proposals.json (${proposals.noise_dropped} noise dropped).`);
console.log("Review them, then apply by hand to data/profile.json — this script never writes your profile.");
