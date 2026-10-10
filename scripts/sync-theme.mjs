#!/usr/bin/env node
/**
 * Theme sync + drift check CLI for the sibling GitHub Pages sites.
 *
 * All logic lives in scripts/lib/sync-theme.mjs (unit-tested there); this file
 * is the thin CLI wrapper that points it at the real sibling repos.
 *
 * Usage:
 *   node scripts/sync-theme.mjs                    # dry run: print the plan
 *   node scripts/sync-theme.mjs --write             # copy theme.css + add <link>
 *   node scripts/sync-theme.mjs --check            # drift report, non-zero on drift
 *   node scripts/sync-theme.mjs --only <repo>      # restrict to one repo
 *   node scripts/sync-theme.mjs --push             # --write, then commit + push each repo
 *
 * Sibling repos live in ~/Documents/GitHub (override with GITHUB_ROOT).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { REPOS, checkRepo, propagateRepo, linkTargets } from "./lib/sync-theme.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.GITHUB_ROOT || dirname(ROOT);
const THEME = join(ROOT, "theme", "theme.css");

const argv = process.argv.slice(2);
const onlyIdx = argv.indexOf("--only");
const only = onlyIdx !== -1 ? argv[onlyIdx + 1] : undefined;
const mode = argv.includes("--check")
  ? "check"
  : argv.includes("--push")
    ? "push"
    : argv.includes("--write")
      ? "write"
      : "plan";
const repos = only ? REPOS.filter((r) => r.name === only) : REPOS;
if (!repos.length) {
  console.error(`✗ no repo matching "${only}" — known: ${REPOS.map((r) => r.name).join(", ")}`);
  process.exit(1);
}

const canonical = readFileSync(THEME, "utf8");
const opts = { canonical, base: BASE };

if (mode === "check") {
  let drift = 0;
  for (const r of repos) {
    const { problems } = checkRepo(r, opts);
    if (problems.length) {
      drift += problems.length;
      console.log(`✗ ${r.name}`);
      for (const p of problems) console.log(`    ${p}`);
    } else console.log(`✓ ${r.name}`);
  }
  console.log(drift ? `\n${drift} issue(s) across ${repos.length} repo(s)` : `\n✓ all ${repos.length} repo(s) in sync`);
  process.exit(drift ? 1 : 0);
}

if (mode === "plan") {
  for (const r of repos) {
    console.log(`${r.name}:`);
    if (r.kind === "generated") console.log(`    ${r.root}/*.css — token check only (stylesheet is inlined into built output)`);
    else {
      for (const f of linkTargets(r, BASE)) console.log(`    ${r.name}/${r.root}/${f.split("/").pop()}`);
      console.log(`    ${r.name}/${r.root}/theme.css ← canonical`);
    }
  }
  console.log("\ndry run — pass --write to apply, --check to verify, --push to commit and push");
  process.exit(0);
}

let failed = false;
for (const r of repos) {
  const written = propagateRepo(r, opts);
  const { problems } = checkRepo(r, opts);
  if (problems.length) {
    failed = true;
    console.log(`✗ ${r.name}`);
    for (const p of problems) console.log(`    ${p}`);
  } else {
    console.log(`✓ ${r.name}${written.length ? ` — ${written.length} file(s) updated: ${written.join(", ")}` : ""}`);
  }
}
if (failed) process.exit(1);

if (mode === "push") {
  for (const r of repos) {
    const dir = join(BASE, r.name);
    try {
      execFileSync("git", ["add", "-A"], { cwd: dir, stdio: "ignore" });
      const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: dir, encoding: "utf8" }).trim();
      let note = "";
      if (staged) {
        execFileSync("git", ["commit", "-m", "docs: adopt shared light-only theme from portfolio hub"], { cwd: dir, stdio: "ignore" });
        note = "committed";
      }
      // Always push: a repo may already be committed locally but unpushed.
      execFileSync("git", ["push"], { cwd: dir, stdio: "ignore" });
      console.log(`✓ ${r.name}: pushed${note ? ` (${note})` : " (already committed)"}`);
    } catch (e) {
      failed = true;
      console.log(`✗ ${r.name}: ${String(e.message).split("\n")[0]}`);
    }
  }
}
process.exit(failed ? 1 : 0);
