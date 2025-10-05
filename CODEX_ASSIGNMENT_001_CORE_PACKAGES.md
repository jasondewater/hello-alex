# 👨‍💻 Codex Assignment 001 - Core Package Scaffolding

**Assignment ID**: CODEX-001  
**Created**: October 5, 2025  
**Priority**: P0  
**Estimated Effort**: Large (3-4 days)  
**Sprint**: v0.1 "Standard Seed"

---

## 🎯 Mission

Build the core Hello Alex packages (@hello-alex/spec, @hello-alex/cli, @hello-alex/runtime) with functioning commands and minimal LangGraph orchestration to enable the "Standard Seed" v0.1 workflow.

---

## 📖 Context

**Why are we building this?**

Hello Alex needs its foundational packages operational so users can:
1. Initialize projects with `npx @hello-alex/cli init`
2. Validate specs with JSON Schema
3. Generate plans from specs
4. Run orchestrated PM→Dev→QA workflows (stub implementation)
5. Execute Playwright tests from test specs

**How does it fit in the bigger picture?**

These packages ARE Hello Alex v0.1. They enable:
- Spec-driven development (the core value prop)
- Safe, reproducible agent execution
- Validation and quality gates
- Progressive adoption ladder (level 0-2)

**What happens if we don't build this?**

Hello Alex remains documentation-only. No one can use it. Sprint fails.

---

## ✅ Requirements

### Functional Requirements

#### 1. @hello-alex/spec Package

**Purpose**: Define and validate `alex.*.yaml` spec files

**Must Have**:
- [ ] JSON Schema for `alex.product.yaml` (entities, flows, auth, backend)
- [ ] JSON Schema for `alex.agents.yaml` (PM, Dev, QA configuration)
- [ ] JSON Schema for `alex.tests.yaml` (E2E, unit, coverage rules)
- [ ] JSON Schema for `alex.policies.yaml` (code standards, security)
- [ ] Validator function using Ajv: `validateSpec(spec, kind)`
- [ ] TypeScript type generation from schemas using `json-schema-to-typescript`
- [ ] Export all schemas and types as public API
- [ ] Example spec files in `examples/` subdirectory

**Schema Details**:

`alex.product.yaml` must support:
- `metadata` (name, version, description, labels)
- `spec.auth.providers` (email-password, google-oauth, etc.)
- `spec.entities` (name, fields with types)
- `spec.flows` (name, trigger, steps)
- `spec.backend` (adapter: firebase|supabase, config)

`alex.agents.yaml` must support:
- `spec.pm` (model, temperature, systemPrompt)
- `spec.dev` (model, executor, testCoverage)
- `spec.qa` (model, browsers, headless)

`alex.tests.yaml` must support:
- `spec.e2e` (array of test scenarios with steps)
- `spec.unit.coverage` (minimum percentage, exclude paths)

**Validation**:
- Return detailed errors with JSON path to invalid field
- Support schema versioning (check `schemaVersion` field)

---

#### 2. @hello-alex/cli Package

**Purpose**: Command-line interface for Hello Alex workflows

**Commands to Implement**:

##### `alex init`
```bash
alex init [project-name]
```

**Behavior**:
- Interactive prompts (using `inquirer`):
  - Project name
  - Backend adapter (Firebase | Supabase)
  - Auth providers (multi-select)
  - Initial entities (comma-separated)
- Generate files:
  - `alex.product.yaml` (populated from prompts)
  - `alex.agents.yaml` (defaults)
  - `alex.tests.yaml` (skeleton)
  - `.env.example` (backend-specific keys)
  - `.gitignore` (includes `.env`, `node_modules`, `dist`)
  - `package.json` (with Hello Alex dependencies)
  - `README.md` (project-specific quick start)
- Validate generated specs
- Output: "✅ Initialized Hello Alex project: {name}"

##### `alex plan`
```bash
alex plan [--output json|github]
```

**Behavior**:
- Read `alex.product.yaml`
- For each entity + flow, generate tasks:
  - "Implement {Entity} CRUD operations"
  - "Create {Entity} TypeScript types"
  - "Write unit tests for {Entity}"
  - "Implement {Flow} workflow"
  - "Write E2E test for {Flow}"
- Output:
  - Default: Pretty-printed task list to console
  - `--output json`: JSON array of tasks
  - `--output github`: (stub for v0.1) Log "GitHub integration coming in v0.2"

##### `alex dev`
```bash
alex dev [--agent pm|dev|qa] [--step N]
```

**Behavior** (stub for v0.1):
- Load `alex.agents.yaml`
- Initialize LangGraph flow (PM → Dev → QA)
- For each agent:
  - Load system prompt
  - Log: "🤖 {Agent} starting..."
  - Log: "🤖 {Agent} analyzing spec..."
  - Sleep 2s (simulate work)
  - Log: "✅ {Agent} completed"
- Write artifacts to `.alex/runs/{runId}/`:
  - `pm-plan.json`
  - `dev-code.ts` (stub)
  - `qa-report.md`
- Output: "✅ Development flow completed. See .alex/runs/{runId}/"

**Note**: Full agent implementation comes in v0.2. v0.1 = logging flow only.

##### `alex test`
```bash
alex test [--spec alex.tests.yaml]
```

**Behavior**:
- Read `alex.tests.yaml`
- For each `spec.e2e` test:
  - Generate Playwright test file in `.alex/generated-tests/`
  - Run Playwright against test
  - Capture screenshots on failure
- Check unit test coverage (if `spec.unit.coverage` defined):
  - Run `npm test -- --coverage`
  - Validate coverage >= minimum threshold
  - Fail if below threshold
- Output JUnit XML report: `.alex/test-results/junit.xml`
- Exit code 0 if all pass, 1 if any fail

---

#### 3. @hello-alex/runtime Package

**Purpose**: LangGraph orchestration engine for multi-agent workflows

**Must Have**:
- [ ] LangGraph flow definition: `PM → Dev → QA`
- [ ] State management (in-memory for v0.1; persistent later)
- [ ] Human-in-the-loop checkpoints (pause before Dev, before QA)
- [ ] Executor interface (TypeScript)
- [ ] DockerExecutor implementation (basic shell + node)
- [ ] Logging and tracing stubs (console logs with structured format)

**LangGraph Flow**:

```typescript
// Simplified pseudocode
const workflow = new StateGraph({
  channels: {
    spec: ...,
    plan: ...,
    code: ...,
    testResults: ...,
  }
});

workflow.addNode("pm", pmAgent);
workflow.addNode("dev", devAgent);
workflow.addNode("qa", qaAgent);

workflow.addEdge(START, "pm");
workflow.addEdge("pm", "dev");
workflow.addEdge("dev", "qa");
workflow.addEdge("qa", END);

workflow.addCheckpoint("beforeDev");  // Human approval
workflow.addCheckpoint("beforeQA");   // Human approval

export const graph = workflow.compile();
```

**Agent Implementations** (stub for v0.1):

Each agent:
- Receives state (spec, previous outputs)
- Logs structured JSON: `{"agent": "pm", "step": "analyzing", "timestamp": ...}`
- Returns mock output
- Updates state

**Executor Interface**:

```typescript
export interface Executor {
  readonly id: string;
  initialize(): Promise<void>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  cleanup(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}

export interface ExecutionRequest {
  command: string;
  workingDir: string;
  env: Record<string, string>;
  timeout?: number;
  runtime?: string;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  metadata: Record<string, unknown>;
}
```

**DockerExecutor** (basic):
- Use `dockerode` npm package
- Pull `node:20-slim` image on initialize
- Create container, run command, capture output
- Cleanup container after execution
- Mount working directory as `/workspace`

---

### Technical Requirements

1. **TypeScript**: All packages in TypeScript with `strict: true`
2. **ESM modules**: Use `"type": "module"` in package.json
3. **Dependencies**:
   - CLI: `commander`, `inquirer`, `chalk`, `ora`
   - Runtime: `@langchain/langgraph`, `dockerode`
   - Spec: `ajv`, `js-yaml`, `json-schema-to-typescript`
4. **Error Handling**: All errors extend base `AlexError` class with codes
5. **Logging**: Use structured logging (JSON Lines format)

---

## 🧪 Testing Requirements (MANDATORY)

### Unit Tests Required

**@hello-alex/spec**:
- [ ] `spec/validator.test.ts` - Test schema validation (valid/invalid specs)
- [ ] `spec/schemas.test.ts` - Ensure all schemas are valid JSON Schema
- [ ] Coverage target: >85%

**@hello-alex/cli**:
- [ ] `cli/commands/init.test.ts` - Test file generation
- [ ] `cli/commands/plan.test.ts` - Test task generation from spec
- [ ] `cli/commands/test.test.ts` - Test Playwright integration
- [ ] Coverage target: >80%

**@hello-alex/runtime**:
- [ ] `runtime/graph.test.ts` - Test LangGraph flow state transitions
- [ ] `runtime/executor.test.ts` - Test executor interface (mock Docker)
- [ ] Coverage target: >80%

### Integration Tests Required

**@hello-alex/cli**:
- [ ] `test/integration/init-to-test.test.ts`:
  - Run `alex init test-project`
  - Validate generated files
  - Run `alex plan` on generated spec
  - Run `alex dev` (stub flow)
  - Verify artifacts created

### E2E Tests Required

- [ ] `test/e2e/full-workflow.test.ts`:
  - Init project
  - Modify alex.product.yaml to add entity
  - Run plan → dev → test
  - Verify test report generated

**All tests MUST pass before PR creation.**

---

## 📁 Files to Create

### Package: @hello-alex/spec

```
packages/alex-spec/
  src/
    schemas/
      product.schema.json       # Alex product spec schema
      agents.schema.json        # Agent config schema
      tests.schema.json         # Test spec schema
      policies.schema.json      # Policy schema
    validator.ts                # Ajv validator wrapper
    types.ts                    # Generated TS types
    index.ts                    # Public exports
  examples/
    alex.product.example.yaml
    alex.agents.example.yaml
    alex.tests.example.yaml
  test/
    validator.test.ts
    schemas.test.ts
  package.json
  tsconfig.json
  README.md
```

### Package: @hello-alex/cli

```
packages/alex-cli/
  src/
    commands/
      init.ts                   # Init command
      plan.ts                   # Plan command
      dev.ts                    # Dev command
      test.ts                   # Test command
    utils/
      logger.ts                 # Structured logging
      errors.ts                 # Error classes
      templates.ts              # Spec templates
    index.ts                    # CLI entry point
  templates/
    alex.product.yaml.hbs       # Handlebars template
    alex.agents.yaml.hbs
    alex.tests.yaml.hbs
    .env.example.hbs
    .gitignore.hbs
  test/
    commands/
      init.test.ts
      plan.test.ts
      test.test.ts
  test/integration/
    init-to-test.test.ts
  package.json
  tsconfig.json
  README.md
```

### Package: @hello-alex/runtime

```
packages/alex-runtime/
  src/
    graph/
      workflow.ts               # LangGraph flow definition
      agents/
        pm.ts                   # PM agent (stub)
        dev.ts                  # Dev agent (stub)
        qa.ts                   # QA agent (stub)
    executor/
      interface.ts              # Executor interface
      docker.ts                 # DockerExecutor
      local.ts                  # LocalShellExecutor (stub)
    state/
      manager.ts                # State persistence
    index.ts
  docker/
    Dockerfile                  # Runtime container image
  test/
    graph.test.ts
    executor.test.ts
    docker-executor.test.ts
  package.json
  tsconfig.json
  README.md
```

---

## 🎨 Implementation Guidance

### Approach

**Phase 1: Spec Package (Day 1)**
1. Define JSON Schemas (start simple, iterate)
2. Implement validator with Ajv
3. Generate TypeScript types
4. Write unit tests

**Phase 2: CLI Package (Day 2-3)**
1. Setup Commander.js CLI framework
2. Implement `alex init` with interactive prompts
3. Implement `alex plan` (read spec → generate tasks)
4. Implement `alex test` (Playwright integration)
5. Implement `alex dev` (call runtime, log flow)
6. Write tests

**Phase 3: Runtime Package (Day 3-4)**
1. Setup LangGraph workflow
2. Implement stub agents (logging only)
3. Implement Executor interface
4. Implement DockerExecutor (basic)
5. Wire up CLI → Runtime integration
6. Write tests

**Phase 4: Integration (Day 4)**
1. Test full workflow: init → plan → dev → test
2. Fix integration issues
3. Update documentation

### Key Considerations

- **Start simple**: Don't over-engineer. v0.1 = happy path only.
- **Stub smartly**: Full agent implementation comes in v0.2. Focus on workflow.
- **Error handling**: Fail fast with clear messages.
- **Logging**: JSON Lines format for machine parsing.
- **Testing**: Mock Docker API in tests (don't require Docker to run unit tests).

### Avoid

- ❌ **Don't implement full AI agents yet** - that's v0.2
- ❌ **Don't build Studio UI** - that's v0.3
- ❌ **Don't add every possible backend adapter** - Firebase + Supabase only
- ❌ **Don't implement GitHub Project integration** - stub it for now

---

## 🚀 Success Criteria

### Definition of Done

- [ ] `npx @hello-alex/cli init` creates valid project
- [ ] Generated specs pass validation
- [ ] `alex plan` outputs task list
- [ ] `alex dev` runs PM→Dev→QA flow (stub with logs)
- [ ] `alex test` runs Playwright tests from spec
- [ ] All unit tests pass (>80% coverage)
- [ ] Integration test passes (init → plan → dev → test)
- [ ] Documentation: README for each package
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Prettier formatting applied

### Acceptance Test

Run this sequence successfully:

```bash
# Initialize project
npx @hello-alex/cli init my-test-app
cd my-test-app

# Validate generated specs
alex plan

# Run development workflow
alex dev

# Check artifacts
ls .alex/runs/*/

# Run tests (even if none exist yet)
alex test

# Success!
```

---

## 📊 Testing Validation

### Before Creating PR

1. Run all tests: `pnpm test`
2. Check coverage: `pnpm test -- --coverage`
3. Verify no TypeScript errors: `pnpm typecheck`
4. Verify no lint errors: `pnpm lint`
5. Run integration test manually
6. Build all packages: `pnpm build`
7. Test CLI locally: `node packages/alex-cli/dist/index.js init test-project`

### CI Must Pass

- All unit tests
- All integration tests
- Lint checks
- Type checks
- Code coverage >80% per package

---

## 🤝 Communication Expectations

### During Implementation

**Required Updates** (post in this chat):

**Daily Standup** (or when switching major tasks):
```
📍 Progress Update - CODEX-001

✅ Completed:
- @hello-alex/spec schemas defined
- Validator implemented

🚧 In Progress:
- @hello-alex/cli init command

🔜 Next:
- CLI plan command
- Runtime scaffolding

⏱️ Estimate: On track for 3-day completion
```

**Blockers** (immediately when discovered):
```
🚧 BLOCKER - CODEX-001

Issue: Docker API behaving unexpectedly on macOS
Impact: Delays executor implementation by 4 hours
Need: Guidance on whether to use dockerode vs shell commands

Options:
1. Continue with dockerode + debug (risky)
2. Switch to shell `docker` commands (simpler)
3. Skip Docker, implement local executor only for v0.1

Recommendation: Option 2 (shell commands)
```

**Questions** (as soon as they arise):
- Don't assume—ask if requirements unclear
- Propose solution with your question
- Continue on unblocked work while waiting

---

## 🚫 Cowboy Prevention

**Remember**:
- ✅ Tests BEFORE code (TDD encouraged)
- ✅ >80% coverage MANDATORY
- ✅ Commit frequently (small, atomic commits)
- ✅ Document complex logic
- ❌ No skipping tests "to save time"
- ❌ No committing code that doesn't build
- ❌ No editing compiled output

**If you're tempted to skip tests**:
1. Stop
2. Re-read Platform Religion
3. Write the damn tests
4. Thank yourself later

---

## 🎯 Delivery

### When Complete

**Create PR with**:
1. **Title**: `feat: implement core packages (spec, cli, runtime) for v0.1`
2. **Description**:
   ```markdown
   ## Summary
   Implements @hello-alex/spec, @hello-alex/cli, and @hello-alex/runtime packages.
   
   ## Changes
   - ✅ JSON Schemas for alex.*.yaml specs
   - ✅ CLI commands: init, plan, dev, test
   - ✅ LangGraph workflow (stub agents)
   - ✅ DockerExecutor interface + implementation
   - ✅ Unit tests (>80% coverage)
   - ✅ Integration tests
   
   ## Testing
   - All tests passing
   - Manual test: `alex init → plan → dev → test` workflow
   - Coverage: spec 87%, cli 82%, runtime 81%
   
   ## Breaking Changes
   None (new packages)
   
   ## Closes
   BACKLOG-007, BACKLOG-008, BACKLOG-009
   ```

3. **Screenshots/Logs**:
   - Terminal output of `alex init`
   - Test coverage report
   - Artifacts from `.alex/runs/`

4. **Checklist** (in PR description):
   ```markdown
   - [x] Tests passing
   - [x] Coverage >80%
   - [x] Documentation updated
   - [x] No TypeScript errors
   - [x] No lint errors
   - [x] Integration test passing
   ```

---

## 📚 References

- [ADR-001: Language & Runtime](../../docs/adr/ADR-001-language-runtime.md)
- [ADR-002: Spec Files & Schema](../../docs/adr/ADR-002-spec-schema.md)
- [ADR-003: Executor Interface](../../docs/adr/ADR-003-executor-interface.md)
- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [JSON Schema Reference](https://json-schema.org/)
- [Commander.js Guide](https://github.com/tj/commander.js)
- [Playwright Documentation](https://playwright.dev/)

---

## ⚡ Let's Ship It

**Timeline**: 3-4 days  
**Start Date**: October 5, 2025  
**Target Completion**: October 8-9, 2025

**You've got this, Codex. Build something great.** 🚀

---

**Assignment Created by**: Alex (Platform PM)  
**Assignment for**: Codex (Developer Agent)  
**Status**: Ready to Start  
**Last Updated**: October 5, 2025
