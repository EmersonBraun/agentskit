---
"@agentskit/core": minor
"@agentskit/react": minor
"@agentskit/ink": minor
"@agentskit/adapters": minor
"@agentskit/cli": minor
"@agentskit/runtime": minor
---

Initial public release of the AgentsKit ecosystem.

- `@agentskit/core`: Portable runtime with ChatController, shared primitives (generateId, buildMessage, executeToolCall, consumeStream, createEventEmitter), event emission, memory, and retrieval. Contracts: SkillDefinition, VectorMemory, AgentEvent, Observer, EvalSuite.
- `@agentskit/react`: React hooks (useChat, useStream, useReactive) and headless UI components with theme support.
- `@agentskit/ink`: Terminal UI components using Ink with keyboard navigation.
- `@agentskit/adapters`: LLM provider adapters — Anthropic, OpenAI, Gemini, Ollama, DeepSeek, Grok, Kimi, LangChain, Vercel AI, and generic. Unified SSE parsing and abort handling.
- `@agentskit/cli`: CLI with `chat` and `init` commands. Registry-based provider resolution.
- `@agentskit/runtime`: Standalone agent runtime with ReAct loop, tool lifecycle management, skill activation, AbortSignal support, and structured RunResult.
