# Conventions — `@agentskit/eval-braintrust`

Provider-specific scoring pipeline. Pairs with `@agentskit/eval` (which owns the dataset/runner contracts) and writes results to Braintrust.

## Stability tier: `beta`

Scorer signatures and family layout are stable. Field additions to `ScorerInput` / `ScoredCase` may land in minor bumps.

## Scope

- 4 quality scorers (`task_success`, `factual_grounding`, `citation_correctness`, `tool_arg_validity`).
- 4 robustness scorers (`schema_survival`, `hitl_gate_correctness`, `fallback_resilience`, `no_crash_survival`).
- `runBraintrustEval` thin runner that scores cases and (optionally) logs to Braintrust.
- CI helpers for regression detection on per-scorer score deltas.

## Design principles

- **Scorers are pure.** No network calls inside a scorer. Every input the scorer needs comes through `ScorerInput`.
- **Scores are numbers in `[0, 1]`.** Booleans coerce.
- **Metadata is the contract.** Robustness scorers read fields the agent wrapper is expected to populate (`parseError`, `hitlTriggered`, `fallbackFired`, `crashed`). Document any new field in the scorer file.
- **Braintrust is optional.** Local runs without a key still produce scored output.

## Adding a scorer

1. Place it in `src/scorers/<family>.ts`.
2. Export from `src/scorers/index.ts` and add to the appropriate `ScorerFamily`.
3. Cover with a unit test in `tests/scorers.test.ts` — at least one passing case, one failing case.

## Testing

- All unit tests run without network access.
- The runner test covers both the SDK-present and SDK-absent paths via the `bt` injection point.

## Common pitfalls

| Pitfall | What to do instead |
|---|---|
| Calling a model from inside a scorer | Push that to a wrapper agent; scorers stay pure |
| Returning `null` for "no signal" | Return `{ score: 0, rationale: 'no signal' }` |
| Throwing inside a scorer | Don't — `scoreCase` catches and emits `scorer_error`, but be explicit |
| Hard-coding Braintrust env vars | Read via `options` first, fall back to env |
