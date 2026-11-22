#!/usr/bin/env node
/**
 * profile pipeline: claim checks.
 *
 * 1. PII lint — flags emails/phones outside the intentional-public allowlist.
 * 2. Link check — verifies every URL claimed in profile.json responds OK.
 *    (linkedin.com bot-blocks clients; a 429 is a rate limit, not a dead page.
 *    Both are reported, not fatal.)
 *
 * Usage: npm run check
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectProfileUrls, detectPii } from "./lib/evidence.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const profile = JSON.parse(readFileSync(join(ROOT, "data/profile.json"), "utf8"));

/* 1. PII ---------------------------------------------------------------- */
const pii = detectPii(profile);
if (pii.length) {
  console.log("PII findings (review — should these be public?):");
  for (const f of pii) console.log(`  ⚠ ${f.kind} in ${f.path}: ${f.value}`);
} else {
  console.log("✓ PII: nothing outside the intentional-public allowlist");
}

/* 2. Links --------------------------------------------------------------- */
const BOT_BLOCKED = (u) => /linkedin\.com/i.test(u);
const urls = collectProfileUrls(profile);
let failures = 0;

for (const { where, url } of urls) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "follow" });
    const ok = res.status >= 200 && res.status < 400;
    // A 429 is "too many requests", not a dead page — the site is rate-limiting the
    // checker, so failing the build would report a broken link that is not broken.
    const soft = !ok && (BOT_BLOCKED(url) || res.status === 429);
    if (ok) console.log(`  ✓ ${res.status} ${where} → ${url}`);
    else if (soft) console.log(`  ⚠ ${res.status} (bot-blocked or rate-limited) ${where} → ${url}`);
    else { console.log(`  ✗ ${res.status} ${where} → ${url}`); failures++; }
  } catch (e) {
    console.log(`  ✗ ${e.name === "TimeoutError" ? "timeout" : e.cause?.code || e.message} ${where} → ${url}`);
    failures++;
  }
}

console.log(failures ? `\n✗ ${failures} broken link(s)` : `\n✓ all ${urls.length} claimed links resolve`);
process.exit(failures ? 1 : 0);
