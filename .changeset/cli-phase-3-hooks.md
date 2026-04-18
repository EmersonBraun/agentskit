---
"@agentskit/cli": minor
---

Hook dispatcher (Phase 3 of ARCHITECTURE.md). `HookDispatcher` runs plugin hooks and shell-based `config.hooks` entries on lifecycle events. Dispatched events wired so far: `SessionStart`, `SessionEnd`, `UserPromptSubmit`. Handlers can `continue`, `block` (with reason), or `modify` the payload. Shell hooks read the JSON payload on stdin and can print a JSON `HookResult` on stdout. `PreLLM`, `PostLLM`, `PreToolUse`, `PostToolUse`, `Stop`, `Error` are registrable but not yet fired — those arrive once core exposes the controller lifecycle.
