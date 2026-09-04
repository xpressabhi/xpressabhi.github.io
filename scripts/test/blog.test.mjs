import { test } from "node:test";
import assert from "node:assert/strict";
import { orderPosts, pickFeatured } from "../lib/blog.mjs";

const posts = [
  { slug: "b", mtime: 200 },
  { slug: "a", mtime: 100 },
  { slug: "c", mtime: 300 },
];

test("orderPosts follows the explicit order, newest first", () => {
  const { sorted, unlisted } = orderPosts(posts, ["c", "a", "b"]);
  assert.deepEqual(sorted.map((p) => p.slug), ["c", "a", "b"]);
  assert.deepEqual(unlisted, []);
});

test("orderPosts appends unlisted posts by mtime desc and reports them", () => {
  const { sorted, unlisted } = orderPosts(posts, ["a"]);
  assert.deepEqual(sorted.map((p) => p.slug), ["a", "c", "b"]);
  assert.deepEqual(unlisted, ["b", "c"]);
});

test("orderPosts with no order falls back to mtime desc", () => {
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
    [...posts].sort((x, y) => y.mtime - x.mtime),
    "nope"
  );
  assert.equal(post.slug, "c");
  assert.equal(pinned, false);
});
