import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { orderPosts, pickFeatured, isPinnedDate, formatPostDate, checkDates } from "../lib/blog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const posts = [
  { slug: "b", date: "2026-01-02" },
  { slug: "a", date: "2026-01-01" },
  { slug: "c", date: "2026-01-03" },
];

test("orderPosts follows the explicit order, newest first", () => {
  const { sorted, unlisted } = orderPosts(posts, ["c", "a", "b"]);
  assert.deepEqual(sorted.map((p) => p.slug), ["c", "a", "b"]);
  assert.deepEqual(unlisted, []);
});

test("orderPosts appends unlisted posts by date desc and reports them", () => {
  const { sorted, unlisted } = orderPosts(posts, ["a"]);
  assert.deepEqual(sorted.map((p) => p.slug), ["a", "c", "b"]);
  assert.deepEqual(unlisted, ["b", "c"]);
});

test("orderPosts with no order falls back to date desc", () => {
  const { sorted } = orderPosts(posts, []);
  assert.deepEqual(sorted.map((p) => p.slug), ["c", "b", "a"]);
});

test("pickFeatured returns the pinned post", () => {
  const { post, pinned } = pickFeatured(posts, "a");
  assert.equal(post.slug, "a");
  assert.equal(pinned, true);
});

test("pickFeatured falls back to newest when the slug is missing", () => {
  const { post, pinned } = pickFeatured(
    [...posts].sort((x, y) => y.date.localeCompare(x.date)),
    "nope"
  );
  assert.equal(post.slug, "c");
  assert.equal(pinned, false);
});

test("isPinnedDate accepts only well-formed YYYY-MM-DD", () => {
  assert.equal(isPinnedDate("2026-10-09"), true);
  assert.equal(isPinnedDate("2026-10-9"), false);
  assert.equal(isPinnedDate("Oct 9, 2026"), false);
  assert.equal(isPinnedDate(""), false);
  assert.equal(isPinnedDate(undefined), false);
});

test("formatPostDate renders the pinned day", () => {
  assert.equal(formatPostDate("2026-09-03"), "Sep 3, 2026");
  assert.equal(formatPostDate("2026-10-09"), "Oct 9, 2026");
  assert.equal(formatPostDate("2026-01-01"), "Jan 1, 2026");
});

test("formatPostDate refuses anything unpinned", () => {
  assert.throws(() => formatPostDate("Sep 3, 2026"), /not a pinned date/);
  assert.throws(() => formatPostDate(undefined), /not a pinned date/);
});

// The bug this guards: a date formatted in local time renders a different day
// depending on the host's timezone, so the same commit produced different HTML
// on a UTC runner and on a UTC+5:30 laptop. Runs in child processes because the
// timezone has to differ per process, and CI only ever runs UTC.
test("formatPostDate renders the same day in every timezone", () => {
  const evaluate = (tz) =>
    execFileSync(
      process.execPath,
      [
        "-e",
        `import(${JSON.stringify(new URL("../lib/blog.mjs", import.meta.url).href)})
           .then((m) => process.stdout.write(
             [m.formatPostDate("2026-09-03"), m.formatPostDate("2026-01-01")].join("|")
           ));`,
      ],
      { encoding: "utf8", env: { ...process.env, TZ: tz } }
    ).trim();

  const utc = evaluate("UTC");
  assert.equal(utc, "Sep 3, 2026|Jan 1, 2026");
  // UTC+14 and UTC-11 straddle the date line: either would shift a local-time format
  assert.equal(evaluate("Pacific/Kiritimati"), utc);
  assert.equal(evaluate("Pacific/Midway"), utc);
});

test("checkDates passes a complete, well-formed table", () => {
  const { errors, warnings } = checkDates(["a", "b"], { a: "2026-01-01", b: "2026-01-02" }, ["a", "b"]);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test("checkDates errors on a post with no pinned date", () => {
  const { errors } = checkDates(["a", "b"], { a: "2026-01-01" }, ["a", "b"]);
  assert.deepEqual(errors, [{ slug: "b", kind: "missing" }]);
});

test("checkDates errors on a malformed date", () => {
  const { errors } = checkDates(["a"], { a: "Jan 1, 2026" }, ["a"]);
  assert.deepEqual(errors, [{ slug: "a", kind: "malformed", value: "Jan 1, 2026" }]);
});

test("checkDates warns about stale entries and unordered posts", () => {
  const { errors, warnings } = checkDates(["a"], { a: "2026-01-01", ghost: "2026-01-02" }, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(
    warnings.map((w) => `${w.kind}:${w.slug}`).sort(),
    ["stale:ghost", "unordered:a"]
  );
});

/* ------------------------------------------------------------------ */
/* Guards against the real repo data                                   */
/* ------------------------------------------------------------------ */

const readRepo = () => {
  const profile = JSON.parse(readFileSync(join(ROOT, "data/profile.json"), "utf8"));
  const slugs = readdirSync(join(ROOT, "deep-dives"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
  return { blog: profile.blog, slugs };
};

// The root cause of the failing validate runs: a post date derived from git
// rather than pinned, so a commit editing the post rebuilt differently on CI.
// This fails the moment a new post is added without a pinned date, which is the
// step the author can actually fix.
test("every deep-dive has a pinned date in data/profile.json", () => {
  const { blog, slugs } = readRepo();
  const { errors } = checkDates(slugs, blog.dates, blog.order);
  assert.deepEqual(errors, [], `unpinned posts — add to profile.json blog.dates:\n${JSON.stringify(errors, null, 2)}`);
});

test("every deep-dive is listed in blog.order", () => {
  const { blog, slugs } = readRepo();
  const { warnings } = checkDates(slugs, blog.dates, blog.order);
  const unordered = warnings.filter((w) => w.kind === "unordered").map((w) => w.slug);
  assert.deepEqual(unordered, []);
});

test("blog.dates carries no stale entries", () => {
  const { blog, slugs } = readRepo();
  const { warnings } = checkDates(slugs, blog.dates, blog.order);
  const stale = warnings.filter((w) => w.kind === "stale").map((w) => w.slug);
  assert.deepEqual(stale, []);
});
