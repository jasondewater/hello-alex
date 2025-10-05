# 📋 Hello Alex Platform Backlog

**Project**: Hello Alex - Autonomous Development Framework  
**Last Updated**: October 5, 2025  
**Sprint**: v0.1 "Standard Seed" (7-10 days)  
**Total Items**: 15  
**In Progress**: 0  
**Completed**: 0

---

## 🎯 v0.1 Definition of Done

- ✅ `npx @hello-alex/cli init` creates working repo with valid `alex.*.yaml`
- ✅ `alex plan` produces labeled issues
- ✅ `alex dev` executes PM→Dev→QA loop with logs
- ✅ `alex test` runs Playwright scenarios from `alex.tests.yaml` and gates PRs
- ✅ Starter repo marked Template; "Use this template" + `alex up` → deployed Hello World
- ✅ Firebase OR Supabase working with one flow + tests green

---

## Priority 0 (P0 - Ship These)

### [P0] [Open] Monorepo Structure + pnpm Workspace
**ID**: BACKLOG-001  
**Status**: Open  
**Description**: Setup monorepo with pnpm workspace, packages structure, TypeScript configs, and dev branch workflow.  
**Acceptance Criteria**:
- [ ] `packages/alex-cli/` scaffolding
- [ ] `packages/alex-runtime/` scaffolding  
- [ ] `packages/alex-spec/` scaffolding
- [ ] `packages/adapters/firebase/` scaffolding
- [ ] `packages/adapters/supabase/` scaffolding
- [ ] `studio/` directory created
- [ ] `examples/appointments/` directory created
- [ ] `scripts/` directory created
- [ ] `spec/` directory created with repo's own alex files
- [ ] Root `pnpm-workspace.yaml` configured
- [ ] Root `package.json` with workspaces
- [ ] Root `tsconfig.json` base config
- [ ] `.nvmrc` with Node 20 LTS
- [ ] Dev branch created and pushed

---

### [P0] [Open] ADR-001: Language & Runtime Strategy
**ID**: BACKLOG-002  
**Status**: Open  
**Description**: Document decision for TypeScript-first, Node 20 LTS, Python later via adapters.  
**Acceptance Criteria**:
- [ ] File: `docs/adr/ADR-001-language-runtime.md`
- [ ] Context, decision, consequences documented
- [ ] Rationale for TS-first explained
- [ ] Python adapter strategy outlined

---

### [P0] [Open] ADR-002: Spec Files & Schema Evolution
**ID**: BACKLOG-003  
**Status**: Open  
**Description**: Document `alex.*.yaml` as the standard spec format, schema versioning strategy.  
**Acceptance Criteria**:
- [ ] File: `docs/adr/ADR-002-spec-schema.md`
- [ ] YAML format rationale
- [ ] Schema evolution strategy (additive changes, semver)
- [ ] Spec file types defined (product, agents, tests, policies)

---

### [P0] [Open] ADR-003: Executor Interface & Docker Sandbox
**ID**: BACKLOG-004  
**Status**: Open  
**Description**: Document pluggable executor interface with default Docker containerized shell sandbox.  
**Acceptance Criteria**:
- [ ] File: `docs/adr/ADR-003-executor-interface.md`
- [ ] Interface contract defined
- [ ] Docker sandbox security model
- [ ] Future adapters planned (local shell, OpenHands)

---

### [P0] [Open] ADR-004: Release Channels & SemVer
**ID**: BACKLOG-005  
**Status**: Open  
**Description**: Document release channels (canary, beta, stable) and SemVer policy.  
**Acceptance Criteria**:
- [ ] File: `docs/adr/ADR-004-release-channels.md`
- [ ] Canary (daily), beta (weekly), stable (bi-weekly) defined
- [ ] SemVer rules documented
- [ ] Changelog generation strategy

---

### [P0] [Open] ADR-005: Security Posture
**ID**: BACKLOG-006  
**Status**: Open  
**Description**: Document security requirements: .env, OIDC, no plaintext creds, gitleaks, Sentry, OpenTelemetry.  
**Acceptance Criteria**:
- [ ] File: `docs/adr/ADR-005-security-posture.md`
- [ ] Secrets management (.env + OIDC)
- [ ] Scanning tools (gitleaks in CI)
- [ ] Observability stubs (OpenTelemetry, Sentry)
- [ ] No creds in prompts/docs policy

---

### [P0] [Open] @hello-alex/spec Package
**ID**: BACKLOG-007  
**Status**: Open  
**Description**: Create spec package with JSON Schema for `alex.*.yaml` files + CLI validator.  
**Acceptance Criteria**:
- [ ] Package structure created
- [ ] JSON Schema for `alex.product.yaml`
- [ ] JSON Schema for `alex.agents.yaml`
- [ ] JSON Schema for `alex.tests.yaml`
- [ ] JSON Schema for `alex.policies.yaml`
- [ ] CLI validator function
- [ ] Unit tests >80% coverage
- [ ] Export TypeScript types from schemas
- [ ] README with usage examples

---

### [P0] [Open] @hello-alex/cli Package - Core Commands
**ID**: BACKLOG-008  
**Status**: Open  
**Description**: Create CLI package with `init`, `plan`, `dev`, `test` commands using TypeScript + Node 20.  
**Acceptance Criteria**:
- [ ] Package structure with commander.js or similar
- [ ] `alex init` - scaffolds spec + .env.example + CI
- [ ] `alex plan` - reads spec → emits issues/project cards
- [ ] `alex dev` - stub LangGraph flow with PM→Dev→QA logging
- [ ] `alex test` - Playwright runner for alex.tests.yaml
- [ ] Unit tests >80% coverage
- [ ] Integration tests for each command
- [ ] README with command documentation
- [ ] Published to npm as `@hello-alex/cli`

---

### [P0] [Open] @hello-alex/runtime Package - LangGraph Orchestration
**ID**: BACKLOG-009  
**Status**: Open  
**Description**: Create runtime package with minimal LangGraph PM→Dev→QA flows + Executor interface + Docker executor.  
**Acceptance Criteria**:
- [ ] Package structure
- [ ] LangGraph flow: PM agent (plan generation)
- [ ] LangGraph flow: Dev agent (code generation)
- [ ] LangGraph flow: QA agent (test execution)
- [ ] State persistence per run
- [ ] Human-in-the-loop checkpoints
- [ ] Executor interface TypeScript definition
- [ ] Docker executor implementation (shell + node + browser)
- [ ] Unit tests >80% coverage
- [ ] Flow integration tests
- [ ] README with flow diagrams

---

### [P0] [Open] Firebase Adapter
**ID**: BACKLOG-010  
**Status**: Open  
**Description**: Create Firebase adapter with auth + basic CRUD bindings for codegen consumption.  
**Acceptance Criteria**:
- [ ] Package: `packages/adapters/firebase/`
- [ ] Auth adapter (email/password, OAuth)
- [ ] Firestore CRUD operations
- [ ] Type-safe bindings
- [ ] Connection validation
- [ ] Unit tests >80% coverage
- [ ] Integration tests with Firebase emulator
- [ ] README with setup guide

---

### [P0] [Open] Supabase Adapter
**ID**: BACKLOG-011  
**Status**: Open  
**Description**: Create Supabase adapter with auth + basic CRUD bindings for codegen consumption.  
**Acceptance Criteria**:
- [ ] Package: `packages/adapters/supabase/`
- [ ] Auth adapter (email/password, OAuth)
- [ ] PostgreSQL CRUD operations via PostgREST
- [ ] Type-safe bindings
- [ ] Connection validation
- [ ] Unit tests >80% coverage
- [ ] Integration tests with Supabase local
- [ ] README with setup guide

---

### [P0] [Open] Examples: Appointments Reference App
**ID**: BACKLOG-012  
**Status**: Open  
**Description**: Build skinny appointments app (auth + 3 entities + 1 flow) from spec to dogfood the platform.  
**Acceptance Criteria**:
- [ ] `examples/appointments/alex.product.yaml` defined
- [ ] `examples/appointments/alex.agents.yaml` defined
- [ ] `examples/appointments/alex.tests.yaml` defined
- [ ] Auth flow implemented
- [ ] 3 entities: User, Appointment, Provider
- [ ] 1 complete flow: Book appointment
- [ ] Playwright E2E tests passing
- [ ] CI running tests
- [ ] Deployed to Firebase OR Supabase
- [ ] README with setup instructions

---

### [P0] [Open] hello-alex-starter Template Repo
**ID**: BACKLOG-013  
**Status**: Open  
**Description**: Create pristine starter repo with spec skeletons, .env.example, CI, marked as GitHub Template.  
**Acceptance Criteria**:
- [ ] New repo: `hello-alex-starter`
- [ ] Spec skeletons (alex.product.yaml, alex.agents.yaml, alex.tests.yaml)
- [ ] `.env.example` with required keys
- [ ] GitHub Actions CI config
- [ ] `alex up` command implementation
- [ ] README with "Use this template" instructions
- [ ] Marked as GitHub Template repository
- [ ] Default branch protected

---

### [P0] [Open] CI/CD Pipeline - GitHub Actions
**ID**: BACKLOG-014  
**Status**: Open  
**Description**: Setup CI with lint, test, E2E (Playwright), gitleaks, release channels.  
**Acceptance Criteria**:
- [ ] `.github/workflows/ci.yml` - runs on PR
- [ ] Lint job (TypeScript, ESLint, Prettier)
- [ ] Unit test job (all packages)
- [ ] E2E test job (Playwright + examples/appointments)
- [ ] gitleaks scanning job
- [ ] `.github/workflows/release-canary.yml` - daily
- [ ] `.github/workflows/release-beta.yml` - weekly
- [ ] `.github/workflows/release-stable.yml` - on tag
- [ ] Branch protection rules documented
- [ ] Status checks required for merge

---

### [P0] [Open] Root Documentation
**ID**: BACKLOG-015  
**Status**: Open  
**Description**: Update root README, add CONTRIBUTING, add LICENSE, add docs/ structure.  
**Acceptance Criteria**:
- [ ] `README.md` updated with v0.1 vision and quick start
- [ ] `CONTRIBUTING.md` with development setup
- [ ] `LICENSE` file (MIT)
- [ ] `docs/` directory structure
- [ ] `docs/architecture.md` overview
- [ ] `docs/adr/` directory for ADRs
- [ ] `docs/guides/` directory for user guides

---

## Priority 1 (P1 - If Time Permits)

### [P1] [Open] GitHub Project Integration
**ID**: BACKLOG-016  
**Status**: Open  
**Description**: Integrate `alex plan` with GitHub Projects API to auto-create issues.  
**Acceptance Criteria**:
- [ ] GitHub API integration in `alex plan`
- [ ] Create issues with labels from spec
- [ ] Assign to org-level Project
- [ ] Update issue status based on spec changes

---

### [P1] [Open] Pre-commit Hooks
**ID**: BACKLOG-017  
**Status**: Open  
**Description**: Setup pre-commit hooks with Husky for lint, format, gitleaks.  
**Acceptance Criteria**:
- [ ] Husky installed
- [ ] Pre-commit hook runs lint
- [ ] Pre-commit hook runs format check
- [ ] Pre-commit hook runs gitleaks
- [ ] README documents hook setup

---

### [P1] [Open] CLI Telemetry (Opt-in)
**ID**: BACKLOG-018  
**Status**: Open  
**Description**: Add opt-in telemetry to CLI for usage analytics.  
**Acceptance Criteria**:
- [ ] OpenTelemetry stub implementation
- [ ] Opt-in prompt on first run
- [ ] Respect DO_NOT_TRACK env var
- [ ] Anonymous usage metrics only
- [ ] Privacy policy documented

---

## 📊 Sprint Metrics

**Target Velocity**:
- P0 items: 15 (must complete)
- P1 items: 3 (nice to have)
- Sprint duration: 7-10 days
- Daily standup: Review BACKLOG.md

**Quality Gates**:
- All P0 tests passing
- Coverage >80% per package
- E2E tests green in CI
- gitleaks passing
- All ADRs written

---

## 🚧 Current Blockers

None yet. Clean slate!

---

## ✅ Completed Items

(Items will move here as we ship)

---

**Last Updated**: October 5, 2025 09:00 UTC  
**Owner**: Alex (Platform PM)  
**Next Review**: Daily
