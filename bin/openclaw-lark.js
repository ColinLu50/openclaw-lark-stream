#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SELF_PACKAGE = "@colinlu50/openclaw-lark-stream";
const STATE_DIR = process.env.OPENCLAW_STATE_DIR || join(process.env.HOME || process.env.USERPROFILE || "", ".openclaw");
const EXTENSIONS_DIR = join(STATE_DIR, "extensions");
const CONFIG_FILE = join(STATE_DIR, "openclaw.json");
// Tools installs official plugin as "openclaw-lark"; our manifest uses "openclaw-lark-stream"
const OFFICIAL_DIR = join(EXTENSIONS_DIR, "openclaw-lark");
const SELF_DIR = join(EXTENSIONS_DIR, "openclaw-lark-stream");

const args = process.argv.slice(2);
const subcommand = args[0];

// ── install / update ──
// 1) Clean existing plugin state so tools gets a fresh environment
// 2) Let @larksuite/openclaw-lark-tools run the interactive setup (bot config)
// 3) Clean again (tools installs official code), then install our fork
if (subcommand === "install" || subcommand === "update") {
  // Step 1: Clean existing state so tools doesn't choke on stale plugins
  cleanPluginState();

  // Step 2: Run tools for interactive setup (bot config, version check, etc.)
  const toolsArgs = args.slice();
  try {
    runTools(toolsArgs);
  } catch {
    // Tools may fail on gateway restart / interactive prompt — that's OK,
    // bot config is already saved to openclaw.json at this point.
  }

  // Step 3: Clean official plugin + any staging leftovers, install ours
  cleanPluginState();
  try {
    console.log(`\nInstalling ${SELF_PACKAGE}...`);
    execSync(`openclaw plugins install ${SELF_PACKAGE}`, {
      stdio: "inherit",
    });
    console.log(`\n✅ ${SELF_PACKAGE} installed successfully.`);
    console.log("Run: openclaw gateway restart");
  } catch (error) {
    console.error(`\n❌ Failed to install ${SELF_PACKAGE}.`);
    console.error(error.message || error);
    console.error("You can retry with: openclaw plugins install " + SELF_PACKAGE);
    process.exit(error.status ?? 1);
  }
  process.exit(0);
}

// ── All other commands: delegate to @larksuite/openclaw-lark-tools ──
try {
  runTools(args);
} catch (error) {
  process.exit(error.status ?? 1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove all plugin directories, staging leftovers, and stale config
 * references so that openclaw has a clean state for the next install.
 */
function cleanPluginState() {
  // Remove plugin directories
  for (const dir of [OFFICIAL_DIR, SELF_DIR]) {
    if (existsSync(dir)) {
      console.log(`Removing ${dir}...`);
      rmSync(dir, { recursive: true, force: true });
    }
  }
  // Remove leftover staging directories (.openclaw-install-stage-*)
  if (existsSync(EXTENSIONS_DIR)) {
    try {
      for (const entry of readdirSync(EXTENSIONS_DIR)) {
        if (entry.startsWith(".openclaw-install-stage-")) {
          const p = join(EXTENSIONS_DIR, entry);
          console.log(`Removing staging dir ${p}...`);
          rmSync(p, { recursive: true, force: true });
        }
      }
    } catch { /* ignore readdir errors */ }
  }
  // Clean config references for both plugin IDs
  cleanConfigReferences("openclaw-lark");
  cleanConfigReferences("openclaw-lark-stream");
}

/**
 * Remove stale plugin references from openclaw.json so that
 * `openclaw plugins install` doesn't fail config validation.
 */
function cleanConfigReferences(pluginId) {
  if (!existsSync(CONFIG_FILE)) return;
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    let changed = false;
    if (cfg.plugins?.entries?.[pluginId]) {
      delete cfg.plugins.entries[pluginId];
      changed = true;
    }
    if (cfg.plugins?.installs?.[pluginId]) {
      delete cfg.plugins.installs[pluginId];
      changed = true;
    }
    if (Array.isArray(cfg.plugins?.allow)) {
      const idx = cfg.plugins.allow.indexOf(pluginId);
      if (idx !== -1) {
        cfg.plugins.allow.splice(idx, 1);
        changed = true;
      }
    }
    if (changed) {
      writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + "\n", "utf8");
      console.log(`Cleaned "${pluginId}" references from ${CONFIG_FILE}`);
    }
  } catch {
    // Config parse failure — let openclaw handle it
  }
}

function runTools(fwdArgs) {
  let version = "latest";
  const vIdx = fwdArgs.indexOf("--tools-version");
  if (vIdx !== -1) {
    version = fwdArgs[vIdx + 1];
    fwdArgs.splice(vIdx, 2);
  }

  const allArgs = ["--yes", `@larksuite/openclaw-lark-tools@${version}`, ...fwdArgs];

  if (process.platform === "win32") {
    const npxCli = join(
      dirname(process.execPath),
      "node_modules",
      "npm",
      "bin",
      "npx-cli.js",
    );
    execFileSync(process.execPath, [npxCli, ...allArgs], {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_OPTIONS: [
          process.env.NODE_OPTIONS,
          "--disable-warning=DEP0190",
        ]
          .filter(Boolean)
          .join(" "),
      },
    });
  } else {
    execFileSync("npx", allArgs, { stdio: "inherit" });
  }
}
