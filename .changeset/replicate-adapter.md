---
'@agentskit/adapters': minor
---

feat(adapters): add `replicate` adapter — Replicate predictions API with SSE token streaming. Two-step (POST predictions, GET stream URL). Capabilities: streaming only (tools off — Replicate's surface doesn't expose a uniform tool-calling shape across models). Override `toInput` for model-specific input schemas.
