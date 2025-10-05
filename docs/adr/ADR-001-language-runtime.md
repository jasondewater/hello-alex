# ADR-001: Language & Runtime Strategy

**Status**: Accepted  
**Date**: October 5, 2025  
**Deciders**: Jason DeWater, Alex (Platform PM)  
**Context**: Hello Alex v0.1

---

## Context

Hello Alex needs a primary implementation language and runtime for the CLI, orchestration runtime, and tooling ecosystem. The choice impacts developer adoption, ecosystem leverage, maintainability, and long-term extensibility.

We need to balance:
- **Adoption**: Maximize developer familiarity and onboarding speed
- **Ecosystem**: Leverage existing libraries and tools
- **Type Safety**: Catch errors early, enable better DX
- **Performance**: Adequate for CLI and orchestration workloads
- **Extensibility**: Support multiple agent backends and languages later

---

## Decision

**Primary Language**: **TypeScript**  
**Runtime**: **Node.js 20 LTS**  
**Multi-language Strategy**: TypeScript-first; Python support via adapters in v0.2+

### Rationale:

#### Why TypeScript?

1. **Ecosystem Leverage**
   - Rich npm ecosystem for CLI tools (commander, inquirer, chalk)
   - LangGraph.js for multi-agent orchestration
   - Playwright for E2E testing (native TypeScript support)
   - Firebase/Supabase SDKs well-maintained in JS/TS

2. **Developer Adoption**
   - Most web developers know JavaScript/TypeScript
   - Lower barrier to contribution vs niche languages
   - VS Code (target for future extension) is built on TS/Electron

3. **Type Safety**
   - Compile-time checking for complex agent flows
   - Better IDE support (autocomplete, refactoring)
   - Generate types directly from JSON Schema specs

4. **Async/Concurrency**
   - Native async/await for I/O-bound agent orchestration
   - Event-driven model fits CLI and long-running flows

5. **Cross-platform**
   - Node runs everywhere (Linux, macOS, Windows, containers)
   - npm distribution is universal

#### Why Node 20 LTS?

- Stable, long-term support through April 2026
- Native ESM support (modern module system)
- Fetch API built-in (no axios dependency)
- Performance improvements over Node 18
- Docker images widely available

#### Why NOT Python as primary?

- Python is excellent for AI/ML tooling BUT:
  - npm distribution is simpler for CLI tools (`npx` vs `pipx`)
  - TypeScript provides better type safety for complex flows
  - LangGraph has both TS and Python; we choose TS for consistency
  - Python agent adapters can still be built later

---

## Strategy for Multi-language Support

### Phase 1 (v0.1 - v0.2): TypeScript Core

- All core packages in TypeScript
- `@hello-alex/cli`, `@hello-alex/runtime`, `@hello-alex/spec` are TS
- Agents can be implemented in any language via executor interface

### Phase 2 (v0.3+): Language Adapters

- Python SDK: `hello-alex` pip package
  - Reads `alex.*.yaml` specs
  - Implements executor interface in Python
  - Calls TypeScript runtime via JSON-RPC or subprocess

- Ruby, Go, etc. follow same pattern

### Executor Interface Abstraction

The key insight: **language-agnostic execution layer**

```typescript
interface Executor {
  execute(command: string, context: Context): Promise<ExecutionResult>;
  supportsLanguage(lang: string): boolean;
}
```

Agents can be implemented in:
- **TypeScript**: Native, fastest
- **Python**: Via Python executor adapter
- **Shell scripts**: Via shell executor
- **Docker containers**: Via Docker executor (default for safety)

---

## Consequences

### Positive

✅ **Fast ecosystem adoption**: Developers can start using Hello Alex immediately  
✅ **Rich tooling**: Leverage npm, TypeScript, Playwright, LangGraph.js  
✅ **Type-safe specs**: Generate TS types from JSON Schema  
✅ **Universal distribution**: `npx @hello-alex/cli init` works everywhere  
✅ **Future-proof**: Executor interface enables polyglot agents later

### Negative

⚠️ **Not Python-native**: AI/ML community prefers Python (mitigated by adapters)  
⚠️ **Node.js required**: Users must have Node 20+ installed (acceptable for CLI tools)  
⚠️ **TS learning curve**: Contributors must know TypeScript (but most do)

### Neutral

- Python agents can still be built; they run via Python executor
- Other languages follow same adapter pattern
- Core framework remains TypeScript; agents are polyglot

---

## Alternatives Considered

### Alternative 1: Python-first

**Pros**: AI/ML community native, rich data science libs  
**Cons**: CLI distribution harder (pip vs npx), type safety weaker, slower startup  
**Verdict**: Rejected. TypeScript better for CLI/orchestration; Python for agent adapters.

### Alternative 2: Go

**Pros**: Fast binaries, excellent concurrency, static typing  
**Cons**: Smaller ecosystem for AI tooling, fewer developers know Go, LangGraph not available  
**Verdict**: Rejected. Too niche; would slow adoption.

### Alternative 3: Rust

**Pros**: Blazing fast, memory-safe, excellent tooling  
**Cons**: Steep learning curve, smaller ecosystem, LangGraph unavailable  
**Verdict**: Rejected. Over-engineered for v0.1 needs; reconsider for v2.0 runtime.

---

## Implementation Notes

### Immediate Actions (v0.1)

- [x] Use Node 20 LTS (defined in `.nvmrc`)
- [x] TypeScript 5.3+ with strict mode
- [x] ESM modules throughout (no CommonJS)
- [ ] pnpm workspaces for monorepo
- [ ] Shared `tsconfig.json` base config

### Future Actions (v0.2+)

- [ ] Python SDK package: `pip install hello-alex`
- [ ] Python executor adapter in `packages/adapters/python/`
- [ ] Document polyglot agent development guide
- [ ] OpenHands integration (Python-based)

---

## References

- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Node.js 20 LTS Release Schedule](https://nodejs.org/en/about/releases/)
- [TypeScript 5.3 Release Notes](https://devblogs.microsoft.com/typescript/)

---

**Decision**: ACCEPTED  
**Signed**: Alex (Platform PM), Jason DeWater  
**Date**: October 5, 2025
