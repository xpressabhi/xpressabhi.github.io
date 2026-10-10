/**
 * Pure logic for the sibling-Pages theme sync. No I/O or CLI here — callers
 * pass a `base` directory so the whole thing is unit-testable against a temp
 * fixture instead of the real sibling repos.
 *
 * The canonical theme lives in the portfolio hub and is copied into each
 * sibling repo as a same-origin stylesheet; `checkRepo` then verifies the
 * invariants (link present, copy matches, no dark theme back).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The six live Pages sites, each carrying its own copy of theme.css linked
 * same-origin. job-radar's copy lives in `templates/` because its `site/`
 * output is generated (and gitignored) — its renderer publishes theme.css
 * alongside the built pages.
 */
export const REPOS = [
  { name: "tutor", kind: "link", root: "docs" },
  { name: "intent", kind: "link", root: "docs" },
  { name: "jev-browser", kind: "link", root: "docs" },
  { name: "job-search-skills", kind: "link", root: "docs" },
  { name: "ordo", kind: "link", root: "docs" },
  { name: "job-radar", kind: "link", root: "templates" },
];

/** Patterns that must not appear in any site's source. */
export const BANNED = [
  { id: "dark media query", re: /prefers-color-scheme:\s*dark/i },
  { id: "data-theme attribute", re: /data-theme\s*=/i },
  { id: "theme localStorage key", re: /localStorage[^\n;]{0,80}theme/i },
  { id: "theme toggle control", re: /(?:data-theme-btn|theme-btn|theme-toggle|theme-switch)/i },
  // `--x: var(--x)` is a CSS custom-property cycle: the property resolves to
  // nothing, so every rule using it silently falls back. A bridge line is only
  // written when the local name differs from the theme's.
  { id: "self-referential custom property", re: /--([\w-]+)\s*:\s*var\(\s*--\1\s*\)/ },
];

export function hasThemeLink(html) {
  return /<link[^>]+href=["']?[^"'>]*theme\.css/i.test(html);
}

/** Insert <link rel="stylesheet" href="theme.css"> before </head>. Idempotent. */
export function insertThemeLink(html) {
  if (hasThemeLink(html)) return html;
  const m = html.match(/\n([ \t]*)<\/head>/i);
  if (!m) return html;
  const link = `${m[1]}<link rel="stylesheet" href="theme.css">`;
  return html.replace(m[0], `\n${link}${m[0]}`);
}

/** Every .html file directly inside a directory (non-recursive), sorted. */
export function htmlFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => join(dir, f))
    .sort();
}

/** Source files a repo is checked against for banned patterns. */
export function checkedFiles(repo, base) {
  const dir = repoDir(repo, base);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html") || f.endsWith(".css"))
    .map((f) => join(dir, f))
    .sort();
}

/** Files that must carry the <link>: every html file in the Pages root. */
export function linkTargets(repo, base) {
  return htmlFiles(repoDir(repo, base));
}

export function repoDir(repo, base) {
  return join(base, repo.name, repo.root);
}

/** Banned patterns found in a source string, as ids. */
export function findBanned(source) {
  return BANNED.filter((b) => b.re.test(source)).map((b) => b.id);
}

/**
 * Full drift report for one repo. `problems` is empty when the repo is clean.
 * @param {object} repo manifest entry
 * @param {{canonical?:string, base?:string}} [opts]
 */
export function checkRepo(repo, opts = {}) {
  const { canonical = "", base = "" } = opts;
  const problems = [];
  const files = checkedFiles(repo, base);
  if (!files.length) problems.push(`${repo.root}: no source files found`);

  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const found = findBanned(src);
    if (found.length) problems.push(`${rel(f, base)}: ${found.join(", ")}`);
    if (f.endsWith(".html") && !hasThemeLink(src)) problems.push(`${rel(f, base)}: missing theme.css <link>`);
  }

  if (repo.kind === "link") {
    const local = join(repoDir(repo, base), "theme.css");
    if (!existsSync(local)) problems.push(`${repo.name}/${repo.root}/theme.css: missing`);
    else if (canonical && readFileSync(local, "utf8") !== canonical) {
      problems.push(`${repo.name}/${repo.root}/theme.css: differs from canonical`);
    }
  }
  return { repo: repo.name, problems };
}

/**
 * Copy canonical theme + add the <link> to every html file in the repo.
 * Returns the repo-relative paths written. Idempotent.
 */
export function propagateRepo(repo, opts = {}) {
  const { canonical = "", base = "" } = opts;
  const written = [];
  const dir = repoDir(repo, base);
  if (canonical) {
    const dest = join(dir, "theme.css");
    if (!existsSync(dest) || readFileSync(dest, "utf8") !== canonical) {
      writeFileSync(dest, canonical, "utf8");
      written.push(rel(dest, base));
    }
  }
  for (const f of linkTargets(repo, base)) {
    const before = readFileSync(f, "utf8");
    const after = insertThemeLink(before);
    if (after !== before) {
      writeFileSync(f, after, "utf8");
      written.push(rel(f, base));
    }
  }
  return written;
}

function rel(p, base) {
  return base && p.startsWith(base) ? p.slice(base.length + 1) : p;
}
