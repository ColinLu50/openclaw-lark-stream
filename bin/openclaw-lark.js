#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const SELF_PACKAGE = "@colinlu50/openclaw-lark-stream";
const PLUGIN_DIR = join(
  process.env.OPENCLAW_STATE_DIR || join(process.env.HOME || process.env.USERPROFILE || "", ".openclaw"),
  "extensions",
  "openclaw-lark-stream",
);

const args = process.argv.slice(2);
const subcommand = args[0];

// ── install / update ──
// 1) Let @larksuite/openclaw-lark-tools run the full interactive setup
//    (version check, bot config, gateway restart, etc.)
// 2) Then swap the installed official code with our fork
if (subcommand === "install" || subcommand === "update") {
  // Step 1: Run tools for interactive setup (installs official + configures bot)
  // Don't exit on error — config is already saved, we still need to swap the code.
  const toolsArgs = args.slice();
  try {
    runTools(toolsArgs);
  } catch {
    // Tools may fail on gateway restart etc. — that's OK, config is preserved.
  }

  // Step 2: Replace official plugin code with ours
  try {
    if (existsSync(PLUGIN_DIR)) {
      console.log(`\nSwapping official plugin with ${SELF_PACKAGE}...`);
      rmSync(PLUGIN_DIR, { recursive: true, force: true });
    }
    execFileSync("openclaw", ["plugins", "install", SELF_PACKAGE], {
      stdio: "inherit",
    });
    console.log(`\n✅ ${SELF_PACKAGE} installed successfully.`);
    console.log("Run: openclaw gateway restart");
  } catch (error) {
    console.error(`\n❌ Failed to install ${SELF_PACKAGE}. The bot config is preserved.`);
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
