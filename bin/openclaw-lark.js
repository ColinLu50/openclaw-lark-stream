#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SELF_PACKAGE = "@colinlu50/openclaw-lark-stream";
// Version-gated npm specs:
// - OpenClaw >= 2026.3.22 → latest build (new SDK)
// - OpenClaw <  2026.3.22 → pinned old build (legacy SDK)
const PACKAGE_NEW = "@colinlu50/openclaw-lark-stream";           // >= 2026.3.22
const PACKAGE_OLD = "@colinlu50/openclaw-lark-stream@260323.3.0"; // < 2026.3.22
const OPENCLAW_BREAKPOINT = { year: 2026, month: 3, day: 22 };

const STATE_DIR = process.env.OPENCLAW_STATE_DIR || join(process.env.HOME || process.env.USERPROFILE || "", ".openclaw");
const EXTENSIONS_DIR = join(STATE_DIR, "extensions");
const CONFIG_FILE = join(STATE_DIR, "openclaw.json");
const OFFICIAL_DIR = join(EXTENSIONS_DIR, "openclaw-lark");
const SELF_DIR = join(EXTENSIONS_DIR, "openclaw-lark-stream");

const args = process.argv.slice(2);
const subcommand = args[0];

// ── install / update ──
if (subcommand === "install" || subcommand === "update") {
  await runInstall();
  process.exit(0);
}

// ── All other commands: show help ──
console.log(`Usage: npx ${SELF_PACKAGE} install`);
console.log(`       npx ${SELF_PACKAGE} update`);
process.exit(0);

// ---------------------------------------------------------------------------
// Install flow
// ---------------------------------------------------------------------------

async function runInstall() {
  // 1. Version check — determines which package version to install
  const npmSpec = resolveNpmSpec();

  // 2. Clean stale state
  cleanPluginState();

  // 3. Install the appropriate plugin version
  console.log(`\nInstalling ${npmSpec}...`);
  try {
    execSync(`openclaw plugins install ${npmSpec}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`\n❌ Failed to install ${npmSpec}.`);
    console.error(error.message || error);
    console.error(`\nYou can retry with: openclaw plugins install ${npmSpec}`);
    process.exit(error.status ?? 1);
  }
  console.log(`\n✅ Plugin installed successfully.`);

  // 4. Ensure plugins.allow includes our plugin ID
  ensurePluginAllowed("openclaw-lark-stream");

  // 5. Bot configuration (interactive)
  await configureBotIfNeeded();

  // 6. Restart gateway
  console.log("\nRestarting gateway...");
  try {
    execSync("openclaw gateway restart", { stdio: "inherit" });
  } catch {
    console.log("Gateway restart failed. You can manually run: openclaw gateway restart");
  }

  console.log("\n🎉 All done!");
}

// ---------------------------------------------------------------------------
// Version detection — returns the correct npm spec to install
// ---------------------------------------------------------------------------

/**
 * Detect the installed OpenClaw version and return the correct npm spec:
 * - >= 2026.3.22 → latest package (new SDK)
 * - <  2026.3.22 → pinned legacy package
 */
function resolveNpmSpec() {
  let verString;
  try {
    verString = execSync("openclaw -v", { encoding: "utf8" }).trim();
    console.log(`OpenClaw version: ${verString}`);
  } catch {
    console.error("❌ OpenClaw not found. Install it first: npm install -g openclaw");
    process.exit(1);
  }

  const ver = parseOpenClawVersion(verString);
  if (!ver) {
    console.warn(`⚠️  Could not parse OpenClaw version "${verString}", installing latest.`);
    return PACKAGE_NEW;
  }

  const isNew = isVersionAtLeast(ver, OPENCLAW_BREAKPOINT);
  if (isNew) {
    console.log(`✅ OpenClaw >= 2026.3.22 detected — installing latest plugin version.`);
    return PACKAGE_NEW;
  } else {
    console.log(`ℹ️  OpenClaw < 2026.3.22 detected — installing legacy plugin version.`);
    console.log(`   (To use the latest plugin, upgrade OpenClaw: npm install -g openclaw)`);
    return PACKAGE_OLD;
  }
}

/** Parse "YYYY.M.D" or "OpenClaw YYYY.M.D ..." into { year, month, day }. */
function parseOpenClawVersion(str) {
  const m = /(\d{4})\.(\d+)\.(\d+)/.exec(str);
  if (!m) return null;
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10), day: parseInt(m[3], 10) };
}

/** True if ver >= { year, month, day }. */
function isVersionAtLeast(ver, min) {
  if (ver.year !== min.year) return ver.year > min.year;
  if (ver.month !== min.month) return ver.month > min.month;
  return ver.day >= min.day;
}

// ---------------------------------------------------------------------------
// Bot configuration
// ---------------------------------------------------------------------------

async function configureBotIfNeeded() {
  const cfg = readConfig();
  const existing = cfg.channels?.feishu;

  if (existing?.appId) {
    console.log(`\nFound existing bot config (App ID: ${existing.appId}).`);
    const reuse = await ask("Use existing bot config? (Y/n): ");
    if (reuse.toLowerCase() !== "n") {
      // Keep bot credentials but ensure streaming is enabled
      ensureStreamingConfig(cfg);
      return;
    }
  }

  console.log("\n── Feishu Bot Setup ──");
  console.log("You need a Feishu bot app. Create one at: https://open.feishu.cn/app\n");

  const appId = await ask("App ID: ");
  const appSecret = await ask("App Secret: ");

  if (!appId || !appSecret) {
    console.log("Skipped. You can configure manually in ~/.openclaw/openclaw.json");
    return;
  }

  // Ask for domain
  const domainChoice = await ask("Domain - feishu or lark? (feishu): ");
  const domain = domainChoice === "lark" ? "lark" : "feishu";

  // Write config
  if (!cfg.channels) cfg.channels = {};
  cfg.channels.feishu = {
    ...(cfg.channels.feishu || {}),
    enabled: true,
    appId,
    appSecret,
    connectionMode: "websocket",
    domain,
    streaming: true,
    replyMode: {
      direct: "streaming",
      group: "streaming",
      default: "streaming",
    },
    accounts: {
      ...(cfg.channels?.feishu?.accounts || {}),
      main: { appId, appSecret },
    },
    dmPolicy: cfg.channels?.feishu?.dmPolicy || "pairing",
    groupPolicy: cfg.channels?.feishu?.groupPolicy || "open",
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  console.log(`\n✅ Bot configured (App ID: ${appId}).`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure streaming is enabled on an existing config.
 */
function ensureStreamingConfig(cfg) {
  if (!cfg.channels?.feishu) return;
  let changed = false;
  if (!cfg.channels.feishu.streaming) {
    cfg.channels.feishu.streaming = true;
    changed = true;
  }
  const rm = cfg.channels.feishu.replyMode || {};
  if (rm.direct !== "streaming" || rm.group !== "streaming" || rm.default !== "streaming") {
    cfg.channels.feishu.replyMode = { direct: "streaming", group: "streaming", default: "streaming" };
    changed = true;
  }
  if (changed) {
    writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + "\n", "utf8");
    console.log("Enabled streaming mode for all reply modes.");
  }
}

function ask(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function readConfig() {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Remove all plugin directories, staging leftovers, and stale config
 * references so that openclaw has a clean state for the next install.
 */
/**
 * Ensure the plugin ID is in plugins.allow so openclaw doesn't warn.
 */
function ensurePluginAllowed(pluginId) {
  const cfg = readConfig();
  if (!cfg.plugins) cfg.plugins = {};
  if (!Array.isArray(cfg.plugins.allow)) cfg.plugins.allow = [];
  if (!cfg.plugins.allow.includes(pluginId)) {
    cfg.plugins.allow.push(pluginId);
    writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + "\n", "utf8");
    console.log(`Added "${pluginId}" to plugins.allow.`);
  }
}

function cleanPluginState() {
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
    } catch { /* ignore */ }
  }
  cleanConfigReferences("openclaw-lark");
  cleanConfigReferences("openclaw-lark-stream");
}

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
      console.log(`Cleaned "${pluginId}" references from config.`);
    }
  } catch { /* ignore */ }
}
