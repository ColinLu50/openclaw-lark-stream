#!/usr/bin/env node

// Release script: build, patch package.json for npm, publish, then restore.
//
// Usage:
//   node scripts/release.mjs            # publish to npm
//   node scripts/release.mjs --dry-run  # dry-run only

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const pkgPath = resolve(root, "package.json");

const dryRun = process.argv.includes("--dry-run");

// ── 1. Build ────────────────────────────────────────────────────────────────
console.log("[release] Running build …");
execSync("node scripts/build.mjs", { cwd: root, stdio: "inherit" });

// ── 2. Patch package.json ───────────────────────────────────────────────────
const originalPkg = readFileSync(pkgPath, "utf-8");
const pkg = JSON.parse(originalPkg);

// Point entry to the bundled output
pkg.openclaw.extensions = ["./dist/index.js"];
pkg.main = "dist/index.js";
pkg.exports = {
  ".": {
    import: "./dist/index.js",
    default: "./dist/index.js",
  },
};

// Published files: only the bundle, skills, bin, and metadata
pkg.files = [
  "dist/",
  "bin/",
  "skills/",
  "openclaw.plugin.json",
  "LICENSE",
  "README.md",
  "README.zh.md",
];

// No runtime dependencies needed — everything is bundled
pkg.dependencies = {};
delete pkg.devDependencies;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("[release] package.json patched for publish.");

// ── 3. Publish ──────────────────────────────────────────────────────────────
try {
  const flags = dryRun ? "--dry-run --access public" : "--access public";
  console.log(`[release] npm publish ${flags} …`);
  execSync(`npm publish ${flags}`, { cwd: root, stdio: "inherit" });
  console.log("[release] Published successfully!");
} finally {
  // ── 4. Restore original package.json ────────────────────────────────────
  writeFileSync(pkgPath, originalPkg);
  console.log("[release] package.json restored.");
}
