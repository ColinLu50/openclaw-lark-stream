English | [中文](./README.md)

# OpenClaw Lark/Feishu Plugin — Stream Card Edition

![demo](./demo.gif)

Based on the official [openclaw-lark](https://github.com/larksuite/openclaw-lark) plugin, with **real-time streaming output**, **reasoning display**, and **tool call indicators**.

## ✨ What's Changed

The official plugin delivers LLM block results all at once after completion. This version enables:

- **Real-time streaming output** — each block's content is progressively appended to the streaming card as it's generated
- **Group chat streaming** — streaming output works in group chats as well
- **Reasoning display** — think content from reasoning models (DeepSeek-R1, Claude 3.7, etc.) streams live
- **Tool call indicators** — when the agent calls a tool, the card shows the current tool name in real-time
- **Process panel** — on completion, all reasoning blocks and tool calls are folded into a single expandable "Process" panel in chronological order
- **Token usage** — the card footer shows input/output token counts and context window usage percentage by default

## 📢 News

- **2026.3.27 v2** — Collapsed panels merged into a single "Process" panel; footer now shows token usage and context % by default
- **2026.3.27 v1** — Compatible with OpenClaw >= 2026.3.22; added AskUserQuestion interactive tool; panels appear in chronological order; fixed card table limit error 230099
- **2026.3.23** — First release with real-time streaming output and tool call indicators (for OpenClaw < 2026.3.22, use the `0322` branch)

## 📦 Installation

Requires [OpenClaw](https://openclaw.ai) and Node.js (>= v22).

The install script automatically detects your OpenClaw version and installs the right plugin:
- OpenClaw **>= 2026.3.22** → installs the latest version (reasoning streaming, AskUserQuestion, etc.)
- OpenClaw **< 2026.3.22** → installs the legacy-compatible version

> [!NOTE]
> **Alibaba Cloud OpenClaw plans are not supported** (permission restrictions). Please use a self-hosted server.

```bash
npx -y @colinlu50/openclaw-lark-stream install
```

To update an existing installation:

```bash
npx -y @colinlu50/openclaw-lark-stream update
```

### From source (for development)

```bash
cd ~/.openclaw/extensions
git clone https://github.com/ColinLu50/openclaw-lark-stream.git openclaw-lark-stream
cd openclaw-lark-stream && npm install && npm run build
openclaw gateway restart
```

## ⚙️ Configuration

### Streaming Output

Streaming is enabled by default after installation. To disable:

```bash
openclaw config set channels.feishu.streaming false
openclaw config set channels.feishu.replyMode.direct card
openclaw config set channels.feishu.replyMode.group card
openclaw config set channels.feishu.replyMode.default card
openclaw gateway restart
```

To re-enable:

```bash
openclaw config set channels.feishu.streaming true
openclaw config set channels.feishu.replyMode.direct streaming
openclaw config set channels.feishu.replyMode.group streaming
openclaw config set channels.feishu.replyMode.default streaming
openclaw gateway restart
```

### Card Footer

Each footer item can be toggled independently via `channels.feishu.footer.*`. Restart after changes:

```bash
openclaw gateway restart
```

| Option | Default | Description |
|--------|---------|-------------|
| `footer.status` | ✅ on | Completion state (`Completed` / `Error` / `Stopped`) |
| `footer.elapsed` | ✅ on | Total response time (e.g. `Elapsed 3.2s`) |
| `footer.tokens` | ✅ on | Input / output token counts (e.g. `↑ 19k ↓ 145`) |
| `footer.context` | ✅ on | Context window usage percentage (e.g. `1% ctx`) |
| `footer.cache` | ❌ off | Cache hit details (e.g. `Cache 18k/1k (94%)`) |
| `footer.model` | ❌ off | Model name (e.g. `claude-3-7-sonnet`) |

Default footer looks like:

```
Completed · Elapsed 8.3s · ↑ 19k ↓ 145 · 1% ctx
```

With all options enabled:

```
Completed · Elapsed 8.3s · ↑ 19k ↓ 145 · Cache 18k/1k (94%) · 10% ctx · claude-3-7-sonnet
```

Example — hide token counts, show model name:

```bash
openclaw config set channels.feishu.footer.tokens false
openclaw config set channels.feishu.footer.model true
openclaw gateway restart
```

## 📄 License

MIT
