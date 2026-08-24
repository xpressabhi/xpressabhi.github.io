/**
 * Pure helpers for the evidence pipeline: git-log parsing, profile URL
 * collection, and PII detection. No I/O here — callers pass strings/objects,
 * which keeps everything unit-testable.
 */

/** Parse `git log --pretty=format:%H|%ad|%an|%ae|%s --date=iso` output. */
export function parseGitLog(out) {
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [hash, date, author, email, ...subject] = l.split("|");
      return { hash, date, author, email, subject: subject.join("|") };
    })
    .filter((c) => c.hash && c.date);
}

/** Classify a scanned repo into a profile proposal (or null if not notable). */
export function proposeFromRepo(repo, opts = {}) {
  const { minCommits = 3, user_email = null } = opts;
  const commits = repo.commits || [];
  const userCommits = user_email ? commits.filter((c) => c.email === user_email) : commits;
  const isNew = repo.first_commit ? new Date(repo.first_commit) >= new Date(opts.since || 0) : false;
  if (!isNew && userCommits.length < minCommits) return null;
  const subjects = (userCommits.length ? userCommits : commits).map((c) => c.subject);
  return {
    name: repo.name,
    remote: repo.remote || null,
    is_new: isNew,
    commits_in_window: commits.length,
    user_commits: userCommits.length,
    first_commit: repo.first_commit || null,
    last_commit: repo.last_commit || null,
    sample_subjects: subjects.slice(0, 8),
    suggested_action: isNew
      ? `New repo — consider adding to profile.json projects if it is public shareable work`
      : `Active work (${userCommits.length} commits) — check if it yields a skill, project, or blog post`,
  };
}

/** Collect every public URL claim from profile.json for link checking. */
export function collectProfileUrls(profile) {
  const urls = [];
  const b = profile.basics || {};
  for (const [key, u] of Object.entries({ github: b.github, linkedin: b.linkedin, patent: b.patent?.url })) {
    if (u) urls.push({ where: `basics.${key}`, url: u });
  }
  for (const p of profile.projects || []) {
    if (p.url) urls.push({ where: `projects:${p.name}`, url: p.url });
  }
  return urls;
}

/**
 * PII lint: detect emails/phones/addresses in profile.json paths that are NOT
 * on the intentional-public allowlist. Returns [{ path, kind, value }].
 */
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(?:\+?\d[\d\s-]{7,}\d)/;
const ALLOWED = new Set(["basics.email", "basics.phone", "basics.location", "basics.patent.url", "basics.patent.number"]);

export function detectPii(obj, prefix = "") {
  const found = [];
  for (const [key, value] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v && typeof v === "object") {
          const label = v.name || v.title || i;
          found.push(...detectPii(v, `${path}.${label}`));
        } else if (v != null && v !== "") {
          found.push(...detectPii({ value: v }, path));
        }
      });
      continue;
    }
    if (typeof value === "object") {
      found.push(...detectPii(value, path));
      continue;
    }
    if (ALLOWED.has(path)) continue;
    const str = String(value);
    if (EMAIL_RE.test(str)) found.push({ path, kind: "email", value: str.match(EMAIL_RE)[0] });
    else if (PHONE_RE.test(str)) found.push({ path, kind: "phone-like", value: str.match(PHONE_RE)[0] });
  }
  return found;
}

/**
 * Robust JSON extraction from an LLM reply: handles bare JSON, code fences,
 * and prose around the payload. Throws SyntaxError when nothing parses.
 */
export function parseJsonLoose(text) {
  const trimmed = String(text).trim();
  const attempts = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) attempts.push(fenced[1].trim());
  const firstBrace = trimmed.search(/[[{]/);
  if (firstBrace !== -1) {
    const lastCurly = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (lastCurly > firstBrace) attempts.push(trimmed.slice(firstBrace, lastCurly + 1));
  }
  for (const a of attempts) {
    try { return JSON.parse(a); } catch { /* next */ }
  }
  throw new SyntaxError("No JSON found in model reply");
}

/**
 * Check every public claim in profile.json has at least one provenance entry
 * in evidence.json. Claim keys look like "projects:<name>", "skills:<item>",
 * "flagship:<title>", "deepDive:<file>". Returns { covered, missing }.
 */
export function evidenceCoverage(profile, evidence) {
  const claims = evidence?.claims || {};
  const has = (key) => Array.isArray(claims[key]) && claims[key].length > 0;
  const covered = [];
  const missing = [];

  const check = (key) => (has(key) ? covered : missing).push(key);

  for (const p of profile.projects || []) check(`projects:${p.name}`);
  for (const group of Object.values(profile.skills || {})) {
    for (const item of group) check(`skills:${item}`);
  }
  for (const f of profile.flagship || []) check(`flagship:${f.title}`);
  for (const d of profile.deepDives || []) check(`deepDive:${d.file}`);

  return { covered, missing };
}
