[English](./README.en.md) | 中文

# OpenClaw 飞书插件 — 流式卡片版

![demo](./demo.gif)
![footer](./demo_footer.png)
<sub>▲ 卡片底栏：完成状态、响应耗时、token 用量、context 使用率，均可独立开关</sub>

基于官方 [openclaw-lark](https://github.com/larksuite/openclaw-lark) 插件，支持**实时流式输出**和 **Agent 执行过程可视化**。

## ✨ 改动说明

官方插件在 LLM 生成完一个 block 后才一次性推送结果。本版本实现了：

- **实时流式输出** — 每个 block 的内容在生成过程中逐步追加到飞书卡片
- **群聊流式输出** — 群聊中也可使用流式输出
- **Agent 执行过程可视化** — 完整还原 agent 的推理与执行流程
  - **推理过程展示** — 推理模型（DeepSeek-R1、Claude 3.7 等）的 think 内容实时流出
  - **工具调用状态** — agent 调用工具时，卡片顶部实时显示当前工具名称
  - **思考过程面板** — 完成后，所有推理块和工具调用按发生顺序折叠进一个可展开面板
  - **Token 用量展示** — 卡片底部默认显示 input/output token 数和 context 使用百分比

## 📢 News

- **2026.3.27**
  - 适配 OpenClaw >= 2026.3.22
  - 新增 AskUserQuestion 交互式提问工具
  - 推理块与工具调用按发生顺序合并为单个可展开面板
  - 底栏默认显示 token 用量和 context 使用百分比
  - 修复卡片表格超限错误 230099
- **2026.3.23** — 发布第一版，支持实时流式输出和工具调用状态展示（适配 OpenClaw < 2026.3.22，请切换到 `0322` 分支）

## 📦 安装

需要 [OpenClaw](https://openclaw.ai) 和 Node.js（>= v22）。

安装脚本会自动检测 OpenClaw 版本并安装对应的插件版本：
- OpenClaw **>= 2026.3.22** → 自动安装最新版（支持推理流式、AskUserQuestion 等）
- OpenClaw **< 2026.3.22** → 自动安装兼容旧版的插件

> [!NOTE]
> **不支持阿里云 OpenClaw 套餐**（权限限制），请使用自建服务器安装。

```bash
npx -y @colinlu50/openclaw-lark-stream install
```

已安装后更新：

```bash
npx -y @colinlu50/openclaw-lark-stream update
```

### 从源码安装（开发用）

```bash
cd ~/.openclaw/extensions
git clone https://github.com/ColinLu50/openclaw-lark-stream.git openclaw-lark-stream
cd openclaw-lark-stream && npm install && npm run build
openclaw gateway restart
```

## ⚙️ 配置

### 流式输出

安装后默认开启流式输出。如需关闭：

```bash
openclaw config set channels.feishu.streaming false
openclaw config set channels.feishu.replyMode.direct card
openclaw config set channels.feishu.replyMode.group card
openclaw config set channels.feishu.replyMode.default card
openclaw gateway restart
```

重新开启：

```bash
openclaw config set channels.feishu.streaming true
openclaw config set channels.feishu.replyMode.direct streaming
openclaw config set channels.feishu.replyMode.group streaming
openclaw config set channels.feishu.replyMode.default streaming
openclaw gateway restart
```

### 卡片底栏

底栏各项均可通过 `channels.feishu.footer.*` 独立开关，修改后重启生效：

```bash
openclaw gateway restart
```

| 配置项 | 默认 | 说明 |
|--------|------|------|
| `footer.verbose` | ❌ 关 | 详细模式：各项改用文字标签展示 |
| `footer.status` | ✅ 开 | 完成状态 |
| `footer.elapsed` | ✅ 开 | 总响应耗时 |
| `footer.tokens` | ✅ 开 | input / output token 数 |
| `footer.context` | ✅ 开 | context window 使用率 |
| `footer.cache` | ❌ 关 | 缓存命中（需单独开启） |
| `footer.model` | ❌ 关 | 模型名称（需单独开启） |

`verbose` 只控制**展示格式**，各项的开关相互独立：

| 项目 | 简要（默认） | 详细（verbose） |
|------|------------|----------------|
| status | `✅` / `❌` / `⏹` | `已完成` / `出错` / `已停止` |
| elapsed | `8.3s` | `耗时 8.3s` |
| context | `1% ctx` | `上下文 19k/200k (10%)` |
| cache | `94% cache` | `缓存 18k/1k (94%)` |
| tokens | `↑ 19k ↓ 145` | `输入 19k 输出 145` |
| model | 相同 | 相同 |

默认效果：

```
✅ · 8.3s · ↑ 19k ↓ 145 · 1% ctx
```

开启详细模式 + cache + model：

```bash
openclaw config set channels.feishu.footer.verbose true
openclaw config set channels.feishu.footer.cache true
openclaw config set channels.feishu.footer.model true
openclaw gateway restart
```

效果：

```
已完成 · 耗时 8.3s · 输入 19k 输出 145 · 缓存 18k/1k (94%) · 上下文 19k/200k (10%) · claude-3-7-sonnet
```

示例 — 关闭 token 展示，开启模型名称：

```bash
openclaw config set channels.feishu.footer.tokens false
openclaw config set channels.feishu.footer.model true
openclaw gateway restart
```

## 📄 许可证

MIT
