[English](./README.en.md) | 中文

# OpenClaw 飞书插件 — 流式卡片 Fork

![demo](./demo.gif)

基于官方 [openclaw-larksuite](https://github.com/larksuite/openclaw-larksuite) 插件的 Fork，支持**流式分块输出**和**工具调用状态展示**。

## 改动说明

官方插件在 LLM 生成完一个 block 后才一次性推送结果。本 Fork 实现了：

- **实时流式输出** — 每个 block 的内容在生成过程中逐步追加到流式卡片
- **工具调用状态** — agent 调用工具时，卡片顶部实时显示当前工具，完成后自动折叠为摘要面板

## 安装

需要 [OpenClaw](https://openclaw.ai)（>= 2026.2.26）和 Node.js（>= v22）。

```bash
openclaw plugins install @colinlu50/openclaw-lark-stream
```

安装完成后重启网关：

```bash
openclaw gateway restart
```

> 如果之前安装过官方插件，先卸载：
> ```bash
> openclaw plugins uninstall openclaw-lark --force
> ```

### 从源码安装（开发用）

```bash
cd ~/.openclaw/extensions
git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark-stream
cd openclaw-lark-stream && npm install && npm run build
openclaw gateway restart
```

## 配置

卡片底栏默认显示耗时和完成状态，如需关闭：

```bash
openclaw config set channels.feishu.footer.elapsed false  # 隐藏耗时
openclaw config set channels.feishu.footer.status false   # 隐藏完成状态
```

- **elapsed** — 卡片底栏显示总响应耗时（如 `耗时 3.2s`）
- **status** — 卡片底栏显示完成状态（`已完成` / `出错` / `已停止`）

## 许可证

MIT — 与上游项目相同。
