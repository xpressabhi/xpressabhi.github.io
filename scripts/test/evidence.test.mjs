import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseGitLog,
  proposeFromRepo,
  collectProfileUrls,
  detectPii,
  parseJsonLoose,
  evidenceCoverage,
} from "../lib/evidence.mjs";

test("parseGitLog handles pipe-formatted git output", () => {
  const log = "abc123|2026-08-20 10:00:00 +0530|Abhishek|akm.nitt@gmail.com|feat: evals\n\ndef456|2026-08-05 09:00:00 +0530|Abhishek|akm.nitt@gmail.com|second pass|with pipe";
  const commits = parseGitLog(log);
  assert.equal(commits.length, 2);
  assert.equal(commits[0].hash, "abc123");
  assert.equal(commits[0].subject, "feat: evals");
  assert.equal(commits[1].subject, "second pass|with pipe");
  assert.equal(parseGitLog("").length, 0);
});

test("proposeFromRepo: new repo is always proposed", () => {
  const p = proposeFromRepo(
    { name: "fresh", commits: [{ subject: "init", email: "a@b.c" }], first_commit: "2026-08-23 10:00:00 +0530" },
    { since: "2026-08-01T00:00:00Z", user_email: "a@b.c" }
  );
  assert.equal(p.is_new, true);
  assert.match(p.suggested_action, /New repo/);
});

test("proposeFromRepo: old repo under threshold is skipped", () => {
  const p = proposeFromRepo(
    { name: "old", commits: [{ subject: "tweak", email: "a@b.c" }], first_commit: "2024-01-01 10:00:00 +0530" },
    { since: "2026-08-01T00:00:00Z", minCommits: 3, user_email: "a@b.c" }
  );
  assert.equal(p, null);
});

test("proposeFromRepo: old repo with enough user commits is proposed", () => {
  const commits = Array.from({ length: 5 }, (_, i) => ({ subject: `c${i}`, email: "a@b.c" }));
  const p = proposeFromRepo(
    { name: "active", commits, first_commit: "2024-01-01 10:00:00 +0530" },
    { since: "2026-08-01T00:00:00Z", minCommits: 3, user_email: "a@b.c" }
  );
  assert.equal(p.user_commits, 5);
  assert.match(p.suggested_action, /Active work/);
});

test("collectProfileUrls gathers basics and live project links, skips empties", () => {
  const urls = collectProfileUrls({
    basics: { github: "https://github.com/x", linkedin: "https://linkedin.com/in/x", patent: { url: "https://patents.example/1" } },
    projects: [{ name: "A", url: "https://a.dev" }, { name: "B", url: "" }],
  });
  assert.equal(urls.length, 4);
  assert.ok(urls.some((u) => u.where === "projects:A"));
  assert.ok(!urls.some((u) => u.where.startsWith("projects:B")));
});

test("detectPii flags emails/phones outside the allowlist only", () => {
  const findings = detectPii({
    basics: { email: "me@x.com", phone: "+911234567890", location: "Hyderabad" },
    projects: [{ name: "Leak", url: "", description: "contact leaky@x.com or +91 98765 43210" }],
    nested: { deep: "reach me at deep@x.com" },
  });
  const paths = findings.map((f) => f.path);
  assert.ok(paths.includes("projects.Leak.description"));
  assert.ok(paths.includes("nested.deep"));
  assert.ok(!paths.includes("basics.email"));
  assert.ok(!paths.includes("basics.phone"));
});

test("parseJsonLoose handles bare, fenced, and prose-wrapped JSON", () => {
  assert.deepEqual(parseJsonLoose('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonLoose('Sure! Here you go:\n[1,2,3]\nHope that helps'), [1, 2, 3]);
  assert.throws(() => parseJsonLoose("no json at all"), SyntaxError);
});

test("evidenceCoverage reports missing claims per section", () => {
  const profile = {
    projects: [{ name: "Sourced" }, { name: "Unsourced" }],
    skills: { G: ["Known", "Unknown"] },
    flagship: [{ title: "F" }],
    deepDives: [{ file: "d.md" }],
  };
  const evidence = { claims: { "projects:Sourced": [{}], "skills:Known": [{}], "deepDive:d.md": [{}] } };
  const { covered, missing } = evidenceCoverage(profile, evidence);
  assert.equal(covered.length, 3);
  assert.deepEqual(missing, ["projects:Unsourced", "skills:Unknown", "flagship:F"]);
});
