import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  REPOS,
  BANNED,
  hasThemeLink,
  insertThemeLink,
  htmlFiles,
  findBanned,
  checkRepo,
  propagateRepo,
} from "../lib/sync-theme.mjs";

/** Build a fake sibling-repo tree and return its base dir. */
function fixture(repo, files = {}) {
  const base = mkdtempSync(join(tmpdir(), "theme-sync-"));
  const dir = join(base, repo.name, repo.root);
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body, "utf8");
  return base;
}

test("manifest covers exactly the six live Pages sites", () => {
  assert.deepEqual(REPOS.map((r) => r.name), [
    "tutor", "intent", "jev-browser", "job-search-skills", "ordo", "job-radar",
  ]);
  assert.deepEqual(REPOS.filter((r) => r.kind === "generated").map((r) => r.name), ["job-radar"]);
  assert.equal(REPOS.filter((r) => r.kind === "link").length, 5);
});

test("hasThemeLink detects presence and absence", () => {
  assert.equal(hasThemeLink('<head><link rel="stylesheet" href="theme.css"></head>'), true);
  assert.equal(hasThemeLink("<head><style>a{}</style></head>"), false);
});

test("insertThemeLink is idempotent and lands before </head>", () => {
  const html = "<html>\n<head>\n<meta charset=\"utf-8\">\n</head>\n<body></body>\n</html>";
  const once = insertThemeLink(html);
  assert.equal(once, insertThemeLink(once), "second insert must be a no-op");
  assert.match(once, /<link rel="stylesheet" href="theme\.css">\s*<\/head>/i);
  assert.equal(once.indexOf("theme.css") < once.indexOf("</head>"), true);
});

test("insertThemeLink leaves a fragment with no </head> untouched", () => {
  assert.equal(insertThemeLink("<p>fragment</p>"), "<p>fragment</p>");
});

test("findBanned flags each dark-mode pattern", () => {
  assert.ok(findBanned("@media (prefers-color-scheme: dark){:root{--bg:#000}}").includes("dark media query"));
  assert.ok(findBanned('<html data-theme="dark">').includes("data-theme attribute"));
  assert.ok(findBanned("localStorage.getItem('jev-docs-theme')").includes("theme localStorage key"));
  assert.ok(findBanned('<button class="theme-btn">').includes("theme toggle control"));
});

test("findBanned passes clean and light-only source", () => {
  assert.deepEqual(findBanned("<style>:root{--paper:#f3f4ec;color-scheme:light}</style>"), []);
  assert.deepEqual(findBanned('<meta name="theme-color" content="#f3f4ec" media="(prefers-color-scheme: light)">'), []);
  assert.ok(BANNED.length >= 4);
});

test("htmlFiles lists only .html files, non-recursively, sorted", () => {
  const base = fixture({ name: "tutor", root: "docs" }, {
    "index.html": "a", "demo.html": "b", "notes.md": "c",
  });
  const files = htmlFiles(join(base, "tutor", "docs"));
  assert.deepEqual(files.map((f) => f.split("/").pop()), ["demo.html", "index.html"]);
  assert.deepEqual(htmlFiles(join(base, "nope")), []);
});

test("checkRepo reports missing link, dark pattern and missing theme copy", () => {
  const repo = { name: "intent", kind: "link", root: "docs" };
  const base = fixture(repo, {
    "index.html": "<html><head><style>@media (prefers-color-scheme: dark){:root{--bg:#000}}</style></head><body>x</body></html>",
  });
  const { problems } = checkRepo(repo, { canonical: "TOKENS", base });
  assert.ok(problems.some((p) => p.includes("dark media query")), JSON.stringify(problems));
  assert.ok(problems.some((p) => p.includes("missing theme.css <link>")), JSON.stringify(problems));
  assert.ok(problems.some((p) => p.includes("theme.css: missing")), JSON.stringify(problems));
});

test("checkRepo reports a theme.css that differs from canonical", () => {
  const repo = { name: "ordo", kind: "link", root: "docs" };
  const base = fixture(repo, {
    "index.html": '<html>\n<head>\n<link rel="stylesheet" href="theme.css">\n</head>\n<body></body>\n</html>',
    "theme.css": "STALE",
  });
  const { problems } = checkRepo(repo, { canonical: "CURRENT", base });
  assert.deepEqual(problems, ["ordo/docs/theme.css: differs from canonical"]);
});

test("checkRepo is clean once theme is propagated and dark mode removed", () => {
  const repo = { name: "tutor", kind: "link", root: "docs" };
  const base = fixture(repo, {
    "index.html": "<html>\n<head>\n</head>\n<body><p>hi</p></body>\n</html>",
    "demo.html": "<html>\n<head>\n</head>\n<body><p>demo</p></body>\n</html>",
  });
  const written = propagateRepo(repo, { canonical: "TOKENS", base });
  assert.equal(written.length, 3, "theme.css plus both html files");
  assert.deepEqual(checkRepo(repo, { canonical: "TOKENS", base }).problems, []);
});

test("propagateRepo writes theme.css and links every html file, idempotently", () => {
  const repo = { name: "ordo", kind: "link", root: "docs" };
  const base = fixture(repo, { "index.html": "<html>\n<head>\n</head>\n<body></body>\n</html>" });
  propagateRepo(repo, { canonical: "TOKENS", base });
  const html = readFileSync(join(base, "ordo", "docs", "index.html"), "utf8");
  assert.equal(readFileSync(join(base, "ordo", "docs", "theme.css"), "utf8"), "TOKENS");
  assert.match(html, /<link rel="stylesheet" href="theme\.css">/);
  // second pass: the link is already there and the copy is current, so nothing is written
  assert.deepEqual(propagateRepo(repo, { canonical: "TOKENS", base }), [], "second pass writes nothing");
  assert.equal(readFileSync(join(base, "ordo", "docs", "index.html"), "utf8"), html);
  assert.deepEqual(checkRepo(repo, { canonical: "TOKENS", base }).problems, []);
});

test("propagateRepo skips generated repos entirely", () => {
  const repo = { name: "job-radar", kind: "generated", root: "templates" };
  const base = fixture(repo, { "style.css": ":root{--accent:#0b5fff}" });
  assert.deepEqual(propagateRepo(repo, { canonical: "TOKENS", base }), []);
  assert.equal(existsSync(join(base, "job-radar", "templates", "theme.css")), false);
  // but it is still checked for banned patterns
  const { problems } = checkRepo(repo, { canonical: "TOKENS", base });
  assert.deepEqual(problems, []);
});

test("checkRepo flags a generated repo whose stylesheet still has dark mode", () => {
  const repo = { name: "job-radar", kind: "generated", root: "templates" };
  const base = fixture(repo, { "style.css": ":root{--bg:#fff}@media (prefers-color-scheme: dark){:root{--bg:#000}}" });
  const { problems } = checkRepo(repo, { base });
  assert.deepEqual(problems, ["job-radar/templates/style.css: dark media query"]);
});

test("checkRepo reports an empty or missing Pages root", () => {
  const repo = { name: "intent", kind: "link", root: "docs" };
  const base = mkdtempSync(join(tmpdir(), "theme-empty-"));
  const { problems } = checkRepo(repo, { canonical: "TOKENS", base });
  assert.ok(problems.some((p) => p.includes("no source files found")), JSON.stringify(problems));
});
