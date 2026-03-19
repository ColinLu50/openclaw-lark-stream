# OpenClaw Lark/Feishu Plugin — Stream Card Fork

Fork of the official [openclaw-larksuite](https://github.com/larksuite/openclaw-larksuite) plugin with **streaming block output** and **tool call indicators**.

## What's Changed

The official plugin delivers LLM block results all at once after completion. This fork enables:

- **Real-time block streaming** — each block's content is progressively appended to the streaming card as it's generated
- **Tool call indicators** — when the agent calls a tool, the card shows `🔧 Calling tool: tool_name...` in real-time

### Modified Files

- `src/card/reply-dispatcher.ts` — enable block streaming in streaming card mode; wire `onToolStart` callback
- `src/card/streaming-card-controller.ts` — append each delivered block to the card in real-time; add `onToolStart()` to display tool call status

## Installation

Requires [OpenClaw](https://openclaw.ai) (>= 2026.2.26) and Node.js (>= v22).

```bash
cd ~/.openclaw/extensions
rm -rf openclaw-lark
git clone git@github.com:ColinLu50/openclaw-lark-stream.git openclaw-lark
```

Restart OpenClaw. Done.

## License

MIT — same as the upstream project.
