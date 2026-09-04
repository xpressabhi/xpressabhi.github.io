/**
 * Blog ordering helpers shared by build.mjs and tests.
 *
 * The canonical post order lives in data/profile.json (`blog.order`,
 * newest first) with `blog.featured` pinned for the homepage. Anything
 * not listed is appended by file date with a warning, never silently.
 */

/** Sort posts newest-first by explicit order; unlisted fall back to mtime desc. */
export function orderPosts(posts, order) {
  const rank = new Map((order || []).map((slug, i) => [slug, i]));
  const unlisted = posts.filter((p) => !rank.has(p.slug)).map((p) => p.slug).sort();
  return {
    sorted: [...posts].sort((a, b) => {
      const ra = rank.has(a.slug) ? rank.get(a.slug) : Infinity;
      const rb = rank.has(b.slug) ? rank.get(b.slug) : Infinity;
      if (ra !== rb) return ra - rb;
      return b.mtime - a.mtime;
    }),
    unlisted,
  };
}

/** Pick the homepage-featured post: pinned slug wins, else newest. */
export function pickFeatured(sortedPosts, featuredSlug) {
  const pinned = (sortedPosts || []).find((p) => p.slug === featuredSlug);
  if (pinned) return { post: pinned, pinned: true };
  return { post: (sortedPosts || [])[0] || null, pinned: false };
}
