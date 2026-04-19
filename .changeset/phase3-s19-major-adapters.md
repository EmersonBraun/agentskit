---
'@agentskit/adapters': minor
---

Phase 3 sprint S19 — issues #165, #166.

- Hosted providers (all OpenAI-compatible): `mistral`, `cohere`,
  `together`, `groq`, `fireworks`, `openrouter`, `huggingface`.
- Local runtimes: `lmstudio`, `vllm`, `llamacpp` (Ollama was
  already shipping).

Every new factory is a thin wrapper around
`createOpenAICompatibleAdapter(baseUrl)`, preserving the shared
OpenAI adapter's streaming / tool-call / retry behavior. `baseUrl`
is caller-overridable for self-hosted and regional endpoints.
