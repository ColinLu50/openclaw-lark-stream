#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SELF_PACKAGE = "@colinlu50/openclaw-lark-stream";
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
  // 1. Version check
  checkOpenClawVersion();

  // 2. Clean stale state
  cleanPluginState();

  // 3. Install our plugin
  console.log(`\nInstalling ${SELF_PACKAGE}...`);
  try {
    execSync(`openclaw plugins install ${SELF_PACKAGE}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`\n❌ Failed to install ${SELF_PACKAGE}.`);
    console.error(error.message || error);
    console.error(`\nYou can retry with: openclaw plugins install ${SELF_PACKAGE}`);
    process.exit(error.status ?? 1);
  }
  console.log(`\n✅ Plugin installed successfully.`);

  // 4. Bot configuration (interactive)
  await configureBotIfNeeded();

  // 5. Restart gateway
  console.log("\nRestarting gateway...");
  try {
    execSync("openclaw gateway restart", { stdio: "inherit" });
  } catch {
    console.log("Gateway restart failed. You can manually run: openclaw gateway restart");
  }

  console.log("\n🎉 All done!");
}

// ---------------------------------------------------------------------------
// Version check
// ---------------------------------------------------------------------------

function checkOpenClawVersion() {
  try {
    const ver = execSync("openclaw -v", { encoding: "utf8" }).trim();
    console.log(`OpenClaw version: ${ver}`);
  } catch {
    console.error("❌ OpenClaw not found. Install it first: npm install -g openclaw");
    process.exit(1);
  }
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
      console.log("Keeping existing config.");
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
    defaultAccount: "main",
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
