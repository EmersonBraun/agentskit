---
'@agentskit/adapters': minor
---

feat(adapters): add `bedrock` adapter for AWS Bedrock. Streams Anthropic models on Bedrock via `InvokeModelWithResponseStreamCommand` (`anthropic.*` model ids). `@aws-sdk/client-bedrock-runtime` is an **optional peer dependency** loaded lazily; AWS auth uses the SDK's default credential chain. Titan + other foundation models are a follow-up.
