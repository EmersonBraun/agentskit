# @agentskit/cli

Chat with any LLM, scaffold projects, and run agents — all from your terminal.

## Why

- **Zero setup for prototyping** — go from idea to running conversation in under a minute; no boilerplate, no config files to write
- **Scaffold production-ready projects** — generate a React chat app or terminal agent with the right structure so you skip the boring setup
- **Script and automate** — pipe inputs, use env vars for keys, and compose with other Unix tools for lightweight agent scripting

## Install

```bash
npm install -g @agentskit/cli
```

## Quick example

```bash
# Chat with Claude instantly
ANTHROPIC_API_KEY=... agentskit chat --provider anthropic --model claude-sonnet-4-6

# Chat with a local model (no API key needed)
agentskit chat --provider ollama --model llama3.1

# Scaffold a new React chat app
agentskit init --template react --dir my-app

# Scaffold a terminal agent
agentskit init --template ink --dir my-cli
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
