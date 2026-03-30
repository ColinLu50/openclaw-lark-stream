English | [中文](./README.md)

# OpenClaw Lark/Feishu Plugin — Stream Card Edition

Based on the official [openclaw-lark](https://github.com/larksuite/openclaw-lark) plugin, with **real-time streaming output** and **agent execution visibility**.
<img src="./assets/demo.gif" width="480" />
<sub>▲ Real streaming in group chats with full execution trace</sub>

<img src="./assets/demo_footer.png" width="480" />
<sub>▲ Card footer: status, elapsed time, token usage, context usage — each toggleable independently</sub>

## ✨ What's Changed

The official plugin delivers LLM block results all at once after completion. This version enables:

- **Real-time streaming output** — each block's content is progressively appended to the Lark card as it's generated
- **Group chat streaming** — streaming output works in group chats as well
- **Agent execution visibility** — full transparency into the agent's reasoning and execution flow
  - **Reasoning display** — think content from reasoning models (DeepSeek-R1, Claude 3.7, etc.) streams live
  - **Tool call indicators** — when the agent calls a tool, the card shows the current tool name in real-time
  - **Process panel** — on completion, all reasoning blocks and tool calls are collapsed into a single expandable panel in chronological order
  - **Token usage** — the card footer shows input/output token counts and context window usage percentage by default

## 📢 News

- **2026.3.30**
  - ⚠️ **OpenClaw 3.28 is not currently supported** due to compatibility issues. Please downgrade to **3.24**. (Support expected before Apr 4)
- **2026.3.27**
  - Compatible with OpenClaw >= 2026.3.22
  - Added AskUserQuestion interactive tool
  - Reasoning blocks and tool calls merged into a single expandable panel in chronological order
  - Footer now shows token usage and context window percentage by default
  - Fixed card table limit error 230099
- **2026.3.23** — First release with real-time streaming output and tool call indicators (for OpenClaw < 2026.3.22, use the `0322` branch)

## 📦 Installation

Requires [OpenClaw](https://openclaw.ai) and Node.js (>= v22).

> [!WARNING]
> **OpenClaw 3.28 is not currently supported** due to compatibility issues (support expected before Apr 4). If you've already upgraded to 3.28, please downgrade to **3.24** before installing:
> ```bash
> npm install -g openclaw@2026.3.24
> ```

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
openclaw config set channels.feishu.replyMode.direct static
openclaw config set channels.feishu.replyMode.group static
openclaw config set channels.feishu.replyMode.default static
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
| `footer.verbose` | ❌ off | Verbose mode: use full text labels instead of compact format |
| `footer.status` | ✅ on | Completion state |
| `footer.elapsed` | ✅ on | Total response time |
| `footer.tokens` | ✅ on | Input / output token counts |
| `footer.context` | ✅ on | Context window usage |
| `footer.cache` | ❌ off | Cache hit rate (must enable separately) |
| `footer.model` | ❌ off | Model name (must enable separately) |

`verbose` only controls **display format** — each item's on/off is independent:

| Item | Compact (default) | Verbose |
|------|------------------|---------|
| status | `✅` / `❌` / `⏹` | `Completed` / `Error` / `Stopped` |
| elapsed | `8.3s` | `Elapsed 8.3s` |
| context | `1% ctx` | `Context 19k/200k (10%)` |
| cache | `94% cache` | `Cache 18k/1k (94%)` |
| tokens | `↑ 19k ↓ 145` | `In 19k Out 145` |
| model | same | same |

Default footer:

```
✅ · 8.3s · ↑ 19k ↓ 145 · 1% ctx
```

Enable verbose mode + cache + model:

```bash
openclaw config set channels.feishu.footer.verbose true
openclaw config set channels.feishu.footer.cache true
openclaw config set channels.feishu.footer.model true
openclaw gateway restart
```

Result:

```
Completed · Elapsed 8.3s · In 19k Out 145 · Cache 18k/1k (94%) · Context 19k/200k (10%) · claude-3-7-sonnet
```

Example — hide token counts, show model name:

```bash
openclaw config set channels.feishu.footer.tokens false
openclaw config set channels.feishu.footer.model true
openclaw gateway restart
```

## 📄 License

MIT
