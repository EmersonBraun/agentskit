# ADR 0005 — Skill Contract

- **Status**: Accepted
- **Date**: 2026-04-14
- **Supersedes**: —
- **Related issues**: #214
- **Related ADRs**: [0001 — Adapter](./0001-adapter-contract.md), [0002 — Tool](./0002-tool-contract.md), [0003 — Memory](./0003-memory-contract.md), [0004 — Retriever](./0004-retriever-contract.md)

## Context

A **Skill** is a packaged behavior — a system prompt, optional examples, optional tools and delegates, light configuration — that turns a generic LLM call into a domain-specialized agent (researcher, critic, coder, summarizer, planner, etc.).

Skills are not tools. A tool is a function the model **calls**; a skill is a persona the model **becomes**. Confusing them is a recurring failure mode in agent libraries (LangChain's "agents" half-conflate them; Mastra and others avoid this).

Today the contract lives in `packages/core/src/types/skill.ts`. Implementations live in `packages/skills/src/*` (researcher, critic, summarizer, coder, planner). Fase 3 will add a **skill marketplace** (#181) with versioning and ratings, and Fase 2 will introduce **multi-agent topologies** (#157) where skills delegate to other skills. Before either lands, the contract must be precise.

A skill is also the right unit for the **MCP-aligned skill manifest spec** (#182): if our skill format mirrors what other ecosystems expect, interop is trivial.

## Decision

A single declarative type. No methods to implement. No lifecycle beyond an optional activation hook.

### Core type

```ts
export interface SkillDefinition {
  name: string
  description: string
  systemPrompt: string
  examples?: Array<{ input: string; output: string }>
  tools?: string[]
  delegates?: string[]
  temperature?: number
  metadata?: Record<string, unknown>
  onActivate?: () => MaybePromise<{ tools?: ToolDefinition[] }>
}
```

### Invariants

**S1. Name is identity.** `name` MUST be unique within a registry and MUST match `^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$` (same shape as Tool name from ADR 0002 T1). Skills and tools share a registry namespace by convention but the runtime MUST be able to disambiguate by type.

**S2. Description is human-facing.** `description` is the one-line summary shown to other agents (when delegating) and to humans (in marketplaces, pickers). It MUST be present and non-empty. It SHOULD complete the sentence "This skill is good at ___."

**S3. systemPrompt is the contract with the model.** `systemPrompt` is what gets prepended to every conversation when this skill is active. It MUST be present and non-empty. It is the durable artifact — examples and tools support it, but the prompt is the soul.

**S4. Examples are few-shot, not test cases.** When present, `examples` are demonstrations the runtime MAY include in the context. They are NOT a test suite. Format-wise, each is a single `{ input, output }` pair representing one turn. Multi-turn examples are not supported in v1 (see Open Questions).

**S5. Tools is a reference list, not definitions.** `tools` is an array of tool **names** (matching ADR 0002 T1). The runtime resolves names against a registry at activation. Skills do NOT define tools inline (with one exception: `onActivate`, see S9). This separation is what enables tool reuse across skills and the marketplace.

**S6. Delegates is a reference list of skill names.** Same shape as `tools` but resolves to other `SkillDefinition`s. A skill that lists `delegates: ['researcher', 'critic']` declares it can hand off to those skills. The runtime is responsible for delegation mechanics; the skill only declares the relationship.

**S7. Cycles in delegation are runtime concerns.** A skill MAY list a delegate that transitively delegates back to itself. The contract does not forbid this; cycle detection and termination are the runtime's responsibility (ADR 0006, forthcoming).

**S8. Temperature is advisory.** When present, the runtime SHOULD pass `temperature` to the adapter. The runtime MAY override (e.g., for deterministic replay). Adapters that don't support temperature MUST silently ignore it. Out-of-range values (<0 or >2) are a contract violation.

**S9. onActivate is for dynamic tools only.** The optional `onActivate` hook returns dynamically-constructed tools (e.g., a tool that closes over user-specific credentials at runtime). It MUST be idempotent and MAY be called multiple times per activation. It MUST NOT be used for general initialization, side effects, or state mutation — those belong elsewhere.

**S10. No execute, no return value.** A skill is not invokable directly. It is **activated** by the runtime, which then proceeds with normal model calls plus the skill's prompt/tools/temperature. There is no `skill.run()` and no return type. This is what distinguishes skill from tool.

**S11. Pure declaration, no I/O at definition time.** Constructing a `SkillDefinition` (the object literal) MUST NOT perform I/O or mutate global state. Same rationale as Tool T10. Enables static discovery, marketplace indexing, bundling.

**S12. Metadata is opaque and JSON-serializable.** Same as everywhere else: `Record<string, unknown>`, JSON-safe, consumers must not depend on shape. Common keys (`version`, `author`, `tags`) MAY be standardized in a future skill manifest spec (#182).

### Versioning and stability

- **Tier**: `stable`
- **Version**: v1, semver'd independently of packages
- Breaking changes follow ADR 0001's policy

## Rationale

- **Pure declaration (S10, S11)** is what makes skills shareable. A skill is a string + some metadata. It can be serialized, versioned, traded in a marketplace, edited in a UI, generated by another agent. If a skill had executable code, none of that works.
- **Tools by reference (S5)** is the same insight as React props vs children: passing IDs lets the consumer compose; passing instances couples them. A skill that says `tools: ['web_search']` works with whatever `web_search` implementation the runtime has registered — local fetch, Firecrawl, Cloudflare Browser, doesn't matter.
- **Delegates (S6) as references** scales to multi-agent topologies (#157) without a new primitive. Supervisor pattern is "skill X delegates to A, B, C." Swarm pattern is "every skill delegates to every other." The contract doesn't change.
- **No skill.run() (S10)** is the most important invariant. A skill is not a function; it is a configuration the runtime applies. Confusing them is what produces the LangChain "agent" mess where you can't tell whether to call `.invoke`, `.run`, `.stream`, `.execute`, etc.
- **onActivate (S9) is the escape hatch** — and intentionally narrow. The only legitimate use is dynamic tools (per-user OAuth, per-tenant credentials). General initialization belongs to the runtime or to whatever provides the registry.
- **MCP alignment** is implicit: this contract is close enough to MCP's prompt + tools spec that a bridge (#167) is mechanical.

## Consequences

### Positive
- Skill marketplace (#181) is straightforward: skills are JSON-serializable (modulo `onActivate`), versionable, ratable, citable.
- Multi-agent topologies (#157) compose cleanly: supervisor/swarm/hierarchical/blackboard are runtime concerns over `delegates` graphs.
- Dogfooding works: AgentsKit's own docs assistant, code reviewer, release agent are all `SkillDefinition`s.
- A skill manifest spec (#182) adds at most a few standardized `metadata` keys; the contract itself doesn't need to change.
- Skills generated by other agents (`agentskit ai`, #144) emit pure JSON-ish output — no codegen ceremony.

### Negative
- **No multi-turn examples.** Some skills (debate, socratic tutoring) want demonstrations spanning multiple turns. Today: encode them in `systemPrompt` prose. Future: a v2 ADR may extend `examples` to allow message arrays.
- **`onActivate` is a wart.** The contract is otherwise pure data; the activation hook is the only function. We accept it because per-user/per-tenant tool construction is a real need and the alternative (forcing all dynamic tools at the registry layer) is worse.
- **Tools by reference creates a registry dependency.** A skill alone doesn't know if its tools exist. The runtime activates it and may fail with "tool not found." This is correct — the alternative is bundling tool implementations into the skill, which kills sharing.
- **No skill versioning in the contract itself.** `metadata.version` is a convention, not enforced. Until a manifest spec (#182) lands, a skill author chooses their own scheme.

## Alternatives considered

1. **Skills as classes with methods**. Rejected: kills serialization, kills the marketplace, recapitulates the LangChain "agent" confusion.
2. **Inline tool definitions** (`tools: ToolDefinition[]`). Rejected: prevents reuse, bloats serialized skills, makes registries pointless.
3. **`run` / `invoke` method on SkillDefinition**. Rejected: see S10. Skills are configurations, not invocations.
4. **Required examples**. Rejected: many skills (e.g., a strict reformatter) work fine with prompt alone. Forcing fake examples produces noise.
5. **Per-skill adapter override** (a skill specifies which model to use). Considered for v2: useful for "use the cheap model for triage, expensive for synthesis." Postponed — adapter selection is a runtime/router concern (#145) and putting it on every skill is premature standardization.
6. **`Skill<TOutput>` typed by output**. Rejected: skills emit text streams; typed outputs belong on tools, not skills.

## Open questions (future work)

- **Multi-turn examples**: a v2 may extend `examples` to `Array<{ messages: Message[] }>` for skills that need conversation demonstrations.
- **Skill versioning and dependencies**: when the marketplace ships, we'll need a way to say "this skill requires `web_search@^2`". A manifest spec (#182) will define this.
- **Skill composition primitives**: today, "use skill X for triage, then Y for response" is a runtime pattern. A composer interface (`compose([X, Y])`) may emerge as a standard helper, not a contract change.
- **Per-skill memory scope**: does a skill have its own memory or share the conversation's? Currently the runtime decides. May warrant a `memoryStrategy: 'shared' | 'isolated' | 'derived'` field.
- **Audit / safety annotations**: a future field for declaring known limitations, required content policies, allowed-domain lists for tools. Likely metadata-only until enough cases accumulate.
- **Skill testing**: how do we evaluate that a skill is doing what it claims? Belongs in `@agentskit/eval`, not the skill contract.

## References

- Current implementation: `packages/core/src/types/skill.ts`
- Skill implementations: `packages/skills/src/*` (researcher, critic, summarizer, coder, planner)
- Related contracts: ADR 0001 (Adapter), ADR 0002 (Tool — referenced by name in S5), ADR 0006 (Runtime, forthcoming — owns activation and delegation mechanics)
- Manifesto principles 5 (agent-first, not chat-first), 8 (small, deep, testable modules), 9 (predictable beats clever)
- External: [MCP prompts spec](https://modelcontextprotocol.io/specification/server/prompts) (close cousin of this contract)
