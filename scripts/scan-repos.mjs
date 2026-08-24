#!/usr/bin/env node
/**
 * profile pipeline: git evidence scanner.
 *
 * Scans ~/Documents/GitHub for repos with commits since the last scan and
 * proposes profile updates (new projects, skills, blog material) from actual
 * commit history — evidence the session scanner can't see.
 *
 * Usage:
 *   node scripts/scan-repos.mjs            # report (JSON on stdout)
 *   node scripts/scan-repos.mjs --mark     # report + advance watermark
 *   node scripts/scan-repos.mjs --days 30  # override window
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGitLog, proposeFromRepo } from "./lib/evidence.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = join(HERE, "cache", "scan-repos-state.json");
const GITHUB_DIR = join(dirname(HERE), "..", "..", "GitHub");
// Pipeline-only repos: their commits are generated output, not evidence.
const SKIP = new Set(["xpressabhi", "career-ops", "career-os"]);
const USER_EMAIL = "akm.nitt@gmail.com";

function git(dir, args) {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
}

function loadState() {
  try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return {}; }
}

const state = loadState();
const daysFlag = process.argv.indexOf("--days");
const days = daysFlag !== -1 && process.argv[daysFlag + 1] ? Number(process.argv[daysFlag + 1]) : 14;
const sinceIso = state.lastScan || new Date(Date.now() - days * 86400000).toISOString();

const repos = [];
const proposals = [];

if (existsSync(GITHUB_DIR)) {
  for (const name of readdirSync(GITHUB_DIR).sort()) {
    const dir = join(GITHUB_DIR, name);
    if (SKIP.has(name) || !existsSync(join(dir, ".git"))) continue;
    let repo = { name, remote: null, first_commit: null, last_commit: null, commits: [] };
    try {
      repo.remote = git(dir, ["config", "--get", "remote.origin.url"]) || null;
      repo.commits = parseGitLog(git(dir, ["log", `--since=${sinceIso}`, "--pretty=format:%H|%ad|%an|%ae|%s", "--date=iso"]));
      repo.first_commit = git(dir, ["log", "--reverse", "--pretty=format:%ad", "--date=iso", "--"]).split("\n")[0] || null;
      repo.last_commit = git(dir, ["log", "-1", "--pretty=format:%ad", "--date=iso"]) || null;
    } catch (e) {
      repo.error = String(e.message).slice(0, 120);
    }
    repos.push(repo);
    const proposal = proposeFromRepo(repo, { since: sinceIso, user_email: USER_EMAIL });
    if (proposal) proposals.push(proposal);
  }
}

const report = {
  scanned_at: new Date().toISOString(),
  since: sinceIso,
  window_days: days,
  repos_scanned: repos.length,
  repos_with_commits: repos.filter((r) => r.commits.length).length,
  proposals,
  repos,
  mark: process.argv.includes("--mark"),
};

console.log(JSON.stringify(report, null, 2));

if (report.mark) {
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify({ lastScan: report.scanned_at }, null, 2));
}
