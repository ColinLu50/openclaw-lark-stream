#!/usr/bin/env node

// Build script: bundle TypeScript sources into a single index.js using esbuild.
// All runtime dependencies are inlined so the published package needs no node_modules.
// Only `openclaw` is kept external (provided by the host runtime).

import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("[build] Bundling with esbuild …");

await build({
  entryPoints: [resolve(root, "index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: resolve(root, "dist/index.js"),
  external: ["openclaw", "openclaw/*"],
  // Generate sourcemap for debugging
  sourcemap: true,
  // Tree-shake unused exports
  treeShaking: true,
  // Keep names for better stack traces
  keepNames: true,
});

console.log("[build] Done → dist/index.js");
