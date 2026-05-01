---
'@agentskit/tools': minor
---

feat(tools): add `sqliteQueryTool` — read-only SQL against a local SQLite file. `better-sqlite3` is an optional peer dependency. Returns up to 100 rows with a `truncated` flag; rejects writes (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.).
