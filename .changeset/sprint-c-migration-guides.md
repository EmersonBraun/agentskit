---
---

chore(docs): three new migration guides — LangGraph, LlamaIndex, OpenAI Assistants.

Closes N/P2 of the enterprise-readiness audit (#562). Each guide
follows the existing structure: when to migrate, when to stay,
quick-reference mapping table, side-by-side code samples for the
common patterns, and honest "where the other still wins" callouts.

- `from-langgraph.mdx` — graph nodes/edges → runtime loop +
  topologies + `compileFlow` for declarative DAGs.
- `from-llamaindex.mdx` — `VectorStoreIndex` + `ReActAgent` →
  `createRAG` + `createRuntime`. Vector backend mapping table.
- `from-openai-assistants.mdx` — assistants/threads/runs →
  runtime + `ChatMemory`, including the deprecation-window
  mitigation argument.

Migrating index page + meta.json updated to list the new entries.
