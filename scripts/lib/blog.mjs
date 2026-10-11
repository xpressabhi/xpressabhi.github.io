/**
 * Blog metadata helpers shared by build.mjs and tests.
 *
 * The canonical post metadata lives in data/profile.json (`blog.order`,
 * newest first, `blog.featured` pinned for the homepage, and `blog.dates`
 * pinning each post's date). Anything not listed is appended by date with
 * a warning, never silently.
 *
 * Post dates are *pinned data*, never derived. A date read from git (`git log
 * -1 -- deep-dives/<slug>.md`) or from file mtime is unstable in a way that
 * cannot be fixed by rebuilding: a commit that edits a post changes the very
 * timestamp the build would read, so output regenerated inside that commit can
 * never match what CI computes for it. File mtime is worse still — a fresh
 * checkout stamps every file with the checkout time.
 */

const PINNED_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a well-formed pinned date (YYYY-MM-DD). */
export function isPinnedDate(value) {
  return typeof value === "string" && PINNED_DATE.test(value);
}

/**
 * Format a pinned YYYY-MM-DD for display.
 *
 * Formatted in UTC on purpose: the previous local-time formatting meant the
 * same commit could render "Oct 9" on a UTC-5 runner and "Oct 10" on a UTC+5:30
 * laptop, so the date shifted with the host's timezone.
 */
export function formatPostDate(iso) {
  if (!isPinnedDate(iso)) throw new Error(`not a pinned date: ${iso}`);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

/**
 * Reconcile deep-dives/*.md against the pinned date table.
 *
 * `errors` block the build (a missing or malformed date makes output
 * nondeterministic); `warnings` are reported but tolerated (a stale entry for
 * a deleted post, or a post missing from `blog.order`).
 */
export function checkDates(slugs, dates, order = []) {
  const table = dates || {};
  const errors = [];
  const warnings = [];

  for (const slug of slugs) {
    const value = table[slug];
    if (value === undefined) errors.push({ slug, kind: "missing" });
    else if (!isPinnedDate(value)) errors.push({ slug, kind: "malformed", value });
  }
  for (const slug of Object.keys(table)) {
    if (!slugs.includes(slug)) warnings.push({ slug, kind: "stale", value: table[slug] });
  }
  for (const slug of slugs) {
    if (!order.includes(slug)) warnings.push({ slug, kind: "unordered" });
  }
  return { errors, warnings };
}

/** Sort posts newest-first by explicit order; unlisted fall back to date desc. */
export function orderPosts(posts, order) {
  const rank = new Map((order || []).map((slug, i) => [slug, i]));
  const unlisted = posts.filter((p) => !rank.has(p.slug)).map((p) => p.slug).sort();
  return {
    sorted: [...posts].sort((a, b) => {
      const ra = rank.has(a.slug) ? rank.get(a.slug) : Infinity;
      const rb = rank.has(b.slug) ? rank.get(b.slug) : Infinity;
      if (ra !== rb) return ra - rb;
      return (b.date || "").localeCompare(a.date || ""); // ISO dates sort lexicographically
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
