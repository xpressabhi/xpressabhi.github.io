#!/usr/bin/env node
/**
 * Visual QA for the CV: render resume/abhishek-maurya-cv.pdf pages to PNGs
 * in output/cv-preview/ so layout can be inspected before committing.
 *
 * Usage: npm run cv:preview   (run `npm run build:pdf` first)
 * Requires: poppler's pdftoppm (`brew install poppler`)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PDF = join(ROOT, "resume", "abhishek-maurya-cv.pdf");
const OUT = join(ROOT, "output", "cv-preview");

if (!existsSync(PDF)) {
  console.error("✗ resume/abhishek-maurya-cv.pdf not found — run `npm run build:pdf` first.");
  process.exit(1);
}
try {
  execFileSync("pdftoppm", ["-v"], { stdio: "ignore" });
} catch {
  console.error("✗ pdftoppm not found. Install poppler: `brew install poppler`");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execFileSync("pdftoppm", ["-png", "-r", "110", PDF, join(OUT, "page")], { stdio: "ignore" });

const pages = readdirSync(OUT).filter((f) => f.endsWith(".png")).sort();
for (const p of pages) console.log("✓ output/cv-preview/" + p);
console.log("Inspect every page image before committing: contact line, column balance, page breaks, orphans.");
