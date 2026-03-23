English | [中文](./README.md)

# OpenClaw Lark/Feishu Plugin — Stream Card Fork

Fork of the official [openclaw-larksuite](https://github.com/larksuite/openclaw-larksuite) plugin with **streaming block output** and **tool call indicators**.

## What's Changed

The official plugin delivers LLM block results all at once after completion. This fork enables:

- **Real-time block streaming** — each block's content is progressively appended to the streaming card as it's generated
- **Tool call indicators** — when the agent calls a tool, the card shows the current tool at the top in real-time, with a collapsible summary panel on completion

## Installation

Requires [OpenClaw](https://openclaw.ai) (>= 2026.2.26) and Node.js (>= v22).

```bash
openclaw plugins install @colinlu50/openclaw-lark-stream
```

Then restart the gateway:

```bash
openclaw gateway restart
```

> If you had the official plugin installed, uninstall it first:
> ```bash
> openclaw plugins uninstall openclaw-lark --force
> ```

### From source (for development)

```bash
cd ~/.openclaw/extensions
git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark-stream
cd openclaw-lark-stream && npm install && npm run build
openclaw gateway restart
```

## Configuration

The card footer shows elapsed time and completion status by default. To disable:

```bash
openclaw config set channels.feishu.footer.elapsed false  # hide elapsed time
openclaw config set channels.feishu.footer.status false   # hide completion status
```

- **elapsed** — displays total response time (e.g. `Elapsed 3.2s`) in the card footer
- **status** — displays completion state (`Completed` / `Error` / `Stopped`) in the card footer

## License

MIT — same as the upstream project.
