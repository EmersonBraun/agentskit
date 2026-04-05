# @agentskit/cli

Command-line interface for [AgentsKit](https://github.com/EmersonBraun/agentskit).

## Install

```bash
npm install -g @agentskit/cli
```

## Commands

```bash
# Interactive chat
agentskit chat --provider openai --model gpt-4o

# Chat with local model
agentskit chat --provider ollama --model llama3.1

# Demo mode (no API key needed)
agentskit chat --provider demo

# Scaffold a new project
agentskit init --template react --dir my-app
agentskit init --template ink --dir my-cli
```

## Flags

| Flag | Description |
|------|-------------|
| `--provider` | LLM provider: openai, anthropic, gemini, ollama, deepseek, grok, kimi, demo |
| `--model` | Model name |
| `--api-key` | API key (or use env vars: OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) |
| `--base-url` | Custom API base URL |
| `--memory` | Enable file-based memory persistence |

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
