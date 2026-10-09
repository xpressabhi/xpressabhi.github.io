import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isPagesSite, renderProjectsBar } from "../projects-bar.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const profile = JSON.parse(readFileSync(join(ROOT, "../data/profile.json"), "utf8"));

test("isPagesSite accepts repo sites only", () => {
  assert.equal(isPagesSite("https://xpressabhi.github.io/ordo/"), true);
  assert.equal(isPagesSite("https://xpressabhi.github.io/sims/agentic-rag.html"), false); // portfolio subpage
  assert.equal(isPagesSite("https://github.com/xpressabhi/revision"), false);
  assert.equal(isPagesSite("https://xpressabhi.github.io/"), false); // the hub itself
  assert.equal(isPagesSite(""), false);
});

test("strip lists every live Pages site in profile order, then the portfolio hub", () => {
  const strip = renderProjectsBar(profile.projects);
  const expected = profile.projects.filter((p) => p.url && isPagesSite(p.url)).map((p) => p.name);
  assert.ok(expected.length >= 6);
  const order = strip.split(" · ").slice(1).map((s) => s.replace(/<[^>]+>/g, "").trim());
  assert.deepEqual(order, [...expected.map((n) => n), "portfolio →"]);
  assert.ok(strip.includes(`<a href="https://xpressabhi.github.io/#projects"`));
});

test("--current renders that site as plain text with aria-current", () => {
  const strip = renderProjectsBar(profile.projects, { current: "ordo" });
  assert.ok(strip.includes('<span aria-current="page">ordo</span>'));
  assert.ok(!strip.includes('<a href="https://xpressabhi.github.io/ordo/"'));
});
