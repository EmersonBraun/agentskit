---
"@agentskit/core": patch
"@agentskit/adapters": patch
"@agentskit/runtime": patch
"@agentskit/ink": patch
"@agentskit/react": patch
"@agentskit/cli": patch
"@agentskit/memory": patch
"@agentskit/rag": patch
"@agentskit/sandbox": patch
---

Code-quality pass: fix runtime crash risks and reduce duplication across packages.

- `@agentskit/core`: extract `updateToolCall` helper in chat controller, remove duplicate map patterns and non-null asserts in `approve`/`deny`.
- `@agentskit/adapters`: cache the system-message lookup in the Gemini and Vertex adapters so requests without a system message no longer crash. Replace `abortController!` non-null asserts with locally-scoped guarded refs in `createStreamSource` / `simulateStream`. Extract a shared `throwIfNotOk` helper used across the OpenAI / OpenAI-compatible / Ollama / Gemini embedders.
- `@agentskit/runtime`: filter+narrow tool calls instead of using triple `!` assertions.
- `@agentskit/ink`: new `InkThemeProvider`, `useInkTheme`, `defaultInkTheme`, and `InkTheme` exports. `Message`, `InputBar`, `ToolCallView`, and `StatusHeader` now read colors from the theme context. Defaults preserved — no behavior change for existing consumers.
- `@agentskit/react`: drop redundant inline `overflow` style on `ChatContainer` (already covered by the default CSS).
- `@agentskit/memory`: drop redundant double `ArrayBufferView` cast in `createEncryptedMemory`.
- `@agentskit/rag`: replace nested ternary in the Notion loader with a heading-prefix lookup map.
- `@agentskit/sandbox`: extract `WARMUP_TIMEOUT_MS` constant.
- `@agentskit/cli`: drop redundant `as` casts on already-typed `select` / `checkbox` prompt results.
