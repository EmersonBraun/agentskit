---
'@agentskit/rag': minor
---

feat(rag): four new loaders and two new rerankers:

- `loadS3` (#462) — S3 (and S3-compatible: R2, MinIO) bucket walk with prefix + filter + maxFiles. `@aws-sdk/client-s3` resolved lazily; commands can be passed in to skip the dynamic-import path.
- `loadGcs` (#464) — Google Cloud Storage bucket walk via Storage REST + OAuth2 access token (string or `() => Promise<string>`).
- `loadDropbox` (#463) — recursive folder walk via `files/list_folder` + `files/download`.
- `loadOneDrive` (#465) — Microsoft Graph drive children walk + `@microsoft.graph.downloadUrl`.
- `voyageReranker` (#466) — Voyage AI cross-encoder reranker. Default `rerank-2`.
- `jinaReranker` (#466) — Jina AI cross-encoder reranker. Default `jina-reranker-v2-base-multilingual`.

All four loaders return `InputDocument[]` ready to pipe into `RAG.ingest`. Both rerankers are drop-in `RerankFn` for `createRerankedRetriever`.
