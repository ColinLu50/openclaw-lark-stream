[English](#english) | [中文](#中文)

---

<a id="english"></a>

# OpenClaw Lark/Feishu Plugin — Stream Card Fork

Fork of the official [openclaw-larksuite](https://github.com/larksuite/openclaw-larksuite) plugin with **streaming block output** and **tool call indicators**.

## What's Changed

The official plugin delivers LLM block results all at once after completion. This fork enables:

- **Real-time block streaming** — each block's content is progressively appended to the streaming card as it's generated
- **Tool call indicators** — when the agent calls a tool, the card shows tool call status in real-time

### Modified Files

- `src/card/reply-dispatcher.ts` — enable block streaming in streaming card mode; wire `onToolStart` callback
- `src/card/streaming-card-controller.ts` — append each delivered block to the card in real-time; add `onToolStart()` to display tool call status
- `src/card/builder.ts` — collapsible panel for tool call summary in completed cards

## Installation

Requires [OpenClaw](https://openclaw.ai) (>= 2026.2.26) and Node.js (>= v22).

### Option A: Fresh install (recommended for first-time setup)

Install the official plugin first to go through the guided setup, then replace with this fork:

1. Install the official plugin:
   ```bash
   npx -y @larksuite/openclaw-lark install
   ```

2. Replace with the stream fork:
   ```bash
   cd ~/.openclaw/extensions
   rm -rf openclaw-lark
   git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark
   cd openclaw-lark && npm install
   ```

3. Restart OpenClaw. Done.

### Option B: Replace existing plugin

If you already have the official plugin installed:

```bash
cd ~/.openclaw/extensions
rm -rf openclaw-lark
git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark
cd openclaw-lark && npm install
```

Restart OpenClaw. Done.

## Configuration

Enable optional card footer metadata:

```bash
openclaw config set channels.feishu.footer.elapsed true  # show elapsed time
openclaw config set channels.feishu.footer.status true   # show completion status
```

- **elapsed** — displays total response time (e.g. `Elapsed 3.2s`) in the card footer
- **status** — displays completion state (`Completed` / `Error` / `Stopped`) in the card footer

Both default to `false` (hidden).

## License

MIT — same as the upstream project.

---

<a id="中文"></a>

# OpenClaw 飞书插件 — 流式卡片 Fork

基于官方 [openclaw-larksuite](https://github.com/larksuite/openclaw-larksuite) 插件的 Fork，支持**流式分块输出**和**工具调用状态展示**。

## 改动说明

官方插件在 LLM 生成完一个 block 后才一次性推送结果。本 Fork 实现了：

- **实时流式追加** — 每个 block 的内容在生成过程中逐步追加到流式卡片，让用户获得即时的视觉反馈
- **工具调用状态** — 当 agent 调用工具时，卡片实时显示工具调用状态

### 改动文件

- `src/card/reply-dispatcher.ts` — 在流式卡片模式下启用 block 流式输出；接入 `onToolStart` 回调
- `src/card/streaming-card-controller.ts` — 将每个已交付的 block 实时追加到卡片；添加 `onToolStart()` 显示工具调用状态
- `src/card/builder.ts` — 完成卡片中工具调用摘要的折叠面板

## 安装

需要 [OpenClaw](https://openclaw.ai)（>= 2026.2.26）和 Node.js（>= v22）。

### 方式 A：全新安装（首次使用推荐）

先安装官方插件完成引导配置，再替换为本 Fork：

1. 安装官方插件：
   ```bash
   npx -y @larksuite/openclaw-lark install
   ```

2. 替换为流式 Fork：
   ```bash
   cd ~/.openclaw/extensions
   rm -rf openclaw-lark
   git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark
   cd openclaw-lark && npm install
   ```

3. 重启 OpenClaw，完成。

### 方式 B：替换已有插件

如果已安装过官方插件：

```bash
cd ~/.openclaw/extensions
rm -rf openclaw-lark
git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark
cd openclaw-lark && npm install
```

重启 OpenClaw，完成。

## 配置

开启可选的卡片底栏元信息：

```bash
openclaw config set channels.feishu.footer.elapsed true  # 开启耗时
openclaw config set channels.feishu.footer.status true   # 开启状态展示
```

- **elapsed** — 在卡片底栏显示总响应耗时（如 `耗时 3.2s`）
- **status** — 在卡片底栏显示完成状态（`已完成` / `出错` / `已停止`）

两者默认为 `false`（不显示）。

## 许可证

MIT — 与上游项目相同。
