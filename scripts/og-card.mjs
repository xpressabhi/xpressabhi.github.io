#!/usr/bin/env node
/**
 * Renders the social preview card (1200x630) used by the og:/twitter: tags
 * on every page. Regenerate after changing basics.headline in profile.json:
 *
 *   npm run og:card
 *
 * Needs a Chromium (Playwright or system Chrome). The committed PNG is what
 * the site serves; CI never runs this.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const P = (...p) => join(ROOT, ...p);
const profile = JSON.parse(readFileSync(P("data/profile.json"), "utf8"));
const { name, headline, location, yearsExperience, website } = {
  ...profile.basics,
  website: "xpressabhi.github.io",
};

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; padding: 72px 80px; display: flex; flex-direction: column;
    justify-content: space-between; background: #0e1114; color: #e8edf2;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .tag { font: 600 20px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .18em;
         text-transform: uppercase; color: #5f91e8; }
  h1 { font-size: 68px; font-weight: 700; letter-spacing: -.02em; line-height: 1.06; margin: 28px 0 20px; }
  p { font-size: 30px; line-height: 1.35; color: #9aa7b4; max-width: 940px; }
  .foot { display: flex; justify-content: space-between; align-items: center;
          font: 500 24px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: #75828f;
          border-top: 1px solid #1f262e; padding-top: 28px; }
  .dot { color: #3fb950; }
</style></head><body>
  <div>
    <div class="tag">Staff / Principal IC · ${yearsExperience} yrs</div>
    <h1>${name}</h1>
    <p>${headline}</p>
  </div>
  <div class="foot">
    <span><span class="dot">●</span> ${location} · open to hybrid / remote</span>
    <span>${website}</span>
  </div>
</body></html>`;

const candidates = [
  "file:///Users/amaurya/Documents/GitHub/selftest-lite/node_modules/playwright/index.mjs",
  "playwright",
];
let playwright = null;
for (const c of candidates) {
  try { playwright = await import(c); break; } catch {}
}
if (!playwright) {
  console.error("✗ Playwright not found — install it or run from a repo that has it");
  process.exit(1);
}

const browser = await playwright.chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "load" });
mkdirSync(P("assets"), { recursive: true });
await page.screenshot({ path: P("assets/og-card.png") });
await browser.close();
console.log("✓ assets/og-card.png (1200x630 @2x)");
