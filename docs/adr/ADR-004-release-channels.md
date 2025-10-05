# ADR-004: Release Channels & SemVer Policy

**Status**: Accepted  
**Date**: October 5, 2025  
**Deciders**: Jason DeWater, Alex (Platform PM)  
**Context**: Hello Alex v0.1

---

## Context

Hello Alex needs a **release strategy** that balances:

1. **Fast iteration**: Ship improvements daily
2. **Stability**: Users need predictable, non-breaking versions
3. **Testing**: Catch bugs before stable release
4. **Transparency**: Clear versioning and changelogs
5. **Automation**: CI/CD handles releases with minimal human intervention

**User Personas**:

- **Early Adopters**: Want latest features, accept some instability
- **Production Users**: Need stability, only upgrade on stable releases
- **Contributors**: Need clarity on when/how to cut releases

---

## Decision

**Release Channels**: Canary, Beta, Stable  
**Versioning**: Semantic Versioning 2.0.0  
**Changelog**: Auto-generated from conventional commits  
**Distribution**: npm with dist-tags for each channel

---

## Release Channels

### Canary (Bleeding Edge)

**Purpose**: Daily builds from `main` branch for testing latest changes

**Frequency**: **Daily** (automated)  
**Version Format**: `0.1.0-canary.20251005` (date-based)  
**npm dist-tag**: `canary`  
**Stability**: ⚠️ Unstable—may contain bugs  
**Audience**: Core contributors, early testers  

**Installation**:
```bash
npm install @hello-alex/cli@canary
```

**Trigger**: Merge to `main` → GitHub Actions builds and publishes

**Quality Gate**: CI must pass (lint, unit tests, basic E2E)

---

### Beta (Preview)

**Purpose**: Weekly releases for broader testing before stable

**Frequency**: **Weekly** (every Monday, automated)  
**Version Format**: `0.1.0-beta.1`, `0.1.0-beta.2`, ...  
**npm dist-tag**: `beta`  
**Stability**: ⚠️ Mostly stable—suitable for dev/staging  
**Audience**: Early adopters, pilot projects  

**Installation**:
```bash
npm install @hello-alex/cli@beta
```

**Trigger**: Manual workflow dispatch or scheduled (Monday 00:00 UTC)

**Quality Gate**:
- All CI tests pass
- Manual smoke test of example app
- No P0 bugs open

---

### Stable (Production)

**Purpose**: Bi-weekly production-ready releases

**Frequency**: **Bi-weekly** (every other Monday, manual approval)  
**Version Format**: `0.1.0`, `0.2.0`, `1.0.0` (SemVer)  
**npm dist-tag**: `latest` (default)  
**Stability**: ✅ Production-ready  
**Audience**: All users  

**Installation**:
```bash
npm install @hello-alex/cli
# or
npx @hello-alex/cli init
```

**Trigger**: Manual git tag push → GitHub Actions builds and publishes

**Quality Gate**:
- Beta channel tested for 1 week
- All E2E tests pass
- No P0 or P1 bugs open
- Changelog reviewed
- PM approval required

---

## Semantic Versioning Rules

Follow [SemVer 2.0.0](https://semver.org/):

**Format**: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`

### Version Bump Rules

| Change Type | Example | Version Bump |
|-------------|---------|--------------|
| **Breaking change** | Remove `alex plan` command | `1.0.0` → `2.0.0` (MAJOR) |
| **Breaking change** | Change `alex.product.yaml` schema (incompatible) | `1.0.0` → `2.0.0` (MAJOR) |
| **New feature** | Add `alex deploy` command | `1.0.0` → `1.1.0` (MINOR) |
| **New feature** | Add optional field to spec | `1.0.0` → `1.1.0` (MINOR) |
| **Bug fix** | Fix crash in `alex init` | `1.0.0` → `1.0.1` (PATCH) |
| **Bug fix** | Fix typo in error message | `1.0.0` → `1.0.1` (PATCH) |

### Breaking Changes Policy

**Definition**: A change is "breaking" if it requires users to modify their code/specs.

**Examples of Breaking Changes**:
- ❌ Remove CLI command
- ❌ Rename CLI flag
- ❌ Change spec schema (remove required field)
- ❌ Change API contract
- ❌ Remove public TypeScript export

**Examples of Non-breaking Changes**:
- ✅ Add new CLI command
- ✅ Add optional CLI flag
- ✅ Add optional spec field
- ✅ Add new TypeScript export
- ✅ Internal refactoring
- ✅ Performance improvements

**Deprecation Policy**:

Before breaking change in version N+1:
1. Version N adds deprecation warnings
2. Documentation updated with migration guide
3. Both old + new ways work in version N
4. Version N+1 removes deprecated feature

Example:
```
v1.0.0: alex config --file X       (current)
v1.1.0: alex config --file X       (deprecated, emits warning)
        alex config --spec X       (new way)
v2.0.0: alex config --spec X       (only new way)
```

---

## Version Numbering Strategy

### Phase 1: v0.x.x (Rapid Iteration)

**Range**: `0.1.0` → `0.9.x`  
**Duration**: First 3-6 months  
**Policy**: Minor versions MAY contain breaking changes  
**Reason**: Quickly iterate on core APIs before stabilizing  

**Communication**:
- Changelogs clearly mark breaking changes with ⚠️
- Migration guides provided for each minor bump
- Users warned: "v0.x is unstable; expect breaking changes"

### Phase 2: v1.0.0 (Stable API)

**Trigger**: Core APIs stabilized, production users onboarded  
**Promise**: No breaking changes until v2.0.0  
**Duration**: 6-12 months  

**Criteria for v1.0.0**:
- [ ] Core CLI commands stable (`init`, `plan`, `dev`, `test`)
- [ ] Spec schema stable (alex.*.yaml)
- [ ] 10+ production users
- [ ] Documentation complete
- [ ] Security audit passed

### Phase 3: v2.0.0+ (Long-term Support)

**Cadence**: Major bumps every 12-18 months  
**Policy**: Deprecation period = 1 major version  

---

## Changelog Generation

**Tool**: [Conventional Commits](https://www.conventionalcommits.org/) + [standard-version](https://github.com/conventional-changelog/standard-version)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature (MINOR bump)
- `fix`: Bug fix (PATCH bump)
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring (no behavior change)
- `perf`: Performance improvement
- `test`: Add/update tests
- `chore`: Build/tooling changes

**Breaking Changes**:
Add `BREAKING CHANGE:` in footer OR `!` after type:

```
feat(cli)!: remove deprecated `--file` flag

BREAKING CHANGE: Use `--spec` instead of `--file`.
Migration: Replace all instances of `--file` with `--spec`.
```

### Changelog Example

```markdown
# Changelog

## [0.2.0] - 2025-10-15

### Features
- **cli**: Add `alex deploy` command for one-click deployment (#42)
- **spec**: Support Supabase backend adapter (#38)

### Bug Fixes
- **runtime**: Fix Docker executor timeout handling (#45)
- **cli**: Correct path resolution on Windows (#40)

### Documentation
- Add guide for migrating from v0.1 to v0.2 (#43)

### BREAKING CHANGES
- **spec**: Rename `alex.config.yaml` to `alex.product.yaml` (#41)
  - Migration: Rename your config file and update `schemaVersion` to "0.2.0"
```

---

## Release Automation

### GitHub Actions Workflows

#### 1. Canary Release (Daily)

```yaml
name: Release Canary

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 8 * * *'  # 8 AM UTC daily

jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: |
          VERSION="0.1.0-canary.$(date +%Y%m%d)"
          npm version $VERSION --no-git-tag-version
      - run: npm publish --tag canary
```

#### 2. Beta Release (Weekly)

```yaml
name: Release Beta

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 0 * * 1'  # Monday 00:00 UTC

jobs:
  beta:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test
      - run: npm version preminor --preid=beta
      - run: npm publish --tag beta
      - run: git push --follow-tags
```

#### 3. Stable Release (Manual)

```yaml
name: Release Stable

on:
  push:
    tags:
      - 'v*.*.*'  # e.g., v0.1.0

jobs:
  stable:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test
      - run: npm publish --tag latest
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

---

## npm Distribution Tags

| Channel | npm Tag | Version Example | Install Command |
|---------|---------|-----------------|-----------------|
| Canary | `canary` | `0.1.0-canary.20251005` | `npm i @hello-alex/cli@canary` |
| Beta | `beta` | `0.1.0-beta.2` | `npm i @hello-alex/cli@beta` |
| Stable | `latest` | `0.1.0` | `npm i @hello-alex/cli` (default) |

---

## Consequences

### Positive

✅ **Fast feedback**: Canary releases catch bugs early  
✅ **Predictability**: Users know when to expect stable releases  
✅ **Automation**: CI handles 90% of release work  
✅ **Transparency**: Changelogs auto-generated from commits  
✅ **Choice**: Users pick stability vs features  

### Negative

⚠️ **Maintenance overhead**: Must keep 3 channels in sync  
⚠️ **Commit discipline**: Requires conventional commits (can be enforced)  
⚠️ **Version sprawl**: Many versions in npm registry (acceptable)  

### Neutral

- Users familiar with Node.js ecosystem will recognize this pattern
- Mirrors Chromium (stable/beta/canary) and Next.js (stable/canary)

---

## Implementation Notes

### Immediate Actions (v0.1)

- [x] Document versioning policy in ADR-004
- [ ] Setup GitHub Actions for canary/beta/stable releases
- [ ] Configure npm dist-tags
- [ ] Add conventional commits enforcement (commitlint)
- [ ] Generate initial CHANGELOG.md

### Future Actions (v0.2+)

- [ ] Add pre-release smoke tests (deploy example app)
- [ ] Setup Slack/Discord notifications for releases
- [ ] Add GitHub Releases with binaries (for CLI)
- [ ] Implement automated rollback on failed releases

---

## Alternatives Considered

### Alternative 1: Single Stable Channel

**Pros**: Simpler maintenance  
**Cons**: Slower feedback loop, fewer early testers  
**Verdict**: Rejected. Need canary for rapid iteration.

### Alternative 2: Git-based Versioning (no npm)

**Pros**: No npm dependency  
**Cons**: Harder to install (`git clone` vs `npm install`), no version locking  
**Verdict**: Rejected. npm is standard for Node.js tools.

### Alternative 3: Continuous Deployment (no versions)

**Pros**: Simplest—always use latest  
**Cons**: No stability guarantees, can't pin versions  
**Verdict**: Rejected. Users need stable versions for production.

---

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [npm dist-tags](https://docs.npmjs.com/cli/v9/commands/npm-dist-tag)
- [Chromium Release Channels](https://www.chromium.org/getting-involved/dev-channel)

---

**Decision**: ACCEPTED  
**Signed**: Alex (Platform PM), Jason DeWater  
**Date**: October 5, 2025
