# ADR-002: Spec Files & Schema Evolution

**Status**: Accepted  
**Date**: October 5, 2025  
**Deciders**: Jason DeWater, Alex (Platform PM)  
**Context**: Hello Alex v0.1

---

## Context

Hello Alex needs a **standard specification format** that serves as the source of truth for defining products, agents, tests, and policies. This spec must be:

- **Human-readable**: Developers write and review it daily
- **Machine-parseable**: Tools read, validate, and execute from it
- **Version-controllable**: Lives in git alongside code
- **Evolvable**: Schema can grow without breaking existing specs
- **Portable**: Not locked to a single tool or vendor

The spec format is the **contract** between humans and the Hello Alex platform—the "OpenAPI for autonomous development."

---

## Decision

**Spec Format**: **YAML** (`.yaml` extension)  
**Naming Convention**: `alex.{type}.yaml` (e.g., `alex.product.yaml`)  
**Schema Language**: **JSON Schema** (Draft 2020-12)  
**Schema Versioning**: **Semantic Versioning** with `schemaVersion` field in each spec

### Spec File Types

| File | Purpose | Schema Package |
|------|---------|----------------|
| `alex.product.yaml` | Product definition: entities, flows, UI, auth | `@hello-alex/spec/schemas/product.schema.json` |
| `alex.agents.yaml` | Agent configuration: PM, Dev, QA behaviors | `@hello-alex/spec/schemas/agents.schema.json` |
| `alex.tests.yaml` | Test scenarios: E2E, integration, operator validation | `@hello-alex/spec/schemas/tests.schema.json` |
| `alex.policies.yaml` | Governance: code standards, security, compliance | `@hello-alex/spec/schemas/policies.schema.json` |

---

## Rationale

### Why YAML?

#### Pros
✅ **Human-readable**: Cleaner than JSON, less verbose than XML  
✅ **Comments**: Developers can annotate specs (`# TODO: add role`)  
✅ **Multi-line strings**: Prompt templates fit naturally  
✅ **Anchors & aliases**: Reuse common config blocks (`<<: *defaults`)  
✅ **Widely supported**: Every language has a YAML parser  
✅ **Git-friendly**: Diffs are readable; merge conflicts manageable

#### Cons (and mitigations)
⚠️ **Indentation-sensitive**: Mitigated by schema validation + IDE tooling  
⚠️ **Type ambiguity**: Mitigated by JSON Schema + TypeScript types

**Verdict**: YAML is the best balance for developer experience + machine parsing.

### Why JSON Schema?

✅ **Industry standard**: OpenAPI, AsyncAPI, Kubernetes CRDs all use it  
✅ **Tooling ecosystem**: Validators, generators, IDE support mature  
✅ **TypeScript generation**: Automatically create types from schemas  
✅ **Version-controllable**: Schema files live in repo, versioned like code  
✅ **Documentation**: Generate docs from schema annotations  

### Why NOT alternatives?

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **JSON** | Verbose, no comments, harder for humans to write |
| **TOML** | Limited nesting, less tooling support |
| **Protobuf** | Binary format, not human-readable |
| **Custom DSL** | Reinventing the wheel; kills adoption |
| **TypeScript** | Requires compilation; not portable |

---

## Schema Evolution Strategy

### Versioning Rules

Each spec file includes a `schemaVersion` field:

```yaml
schemaVersion: "1.0.0"  # SemVer
kind: Product            # Spec type
metadata:
  name: my-app
  version: "0.1.0"
# ...
```

**SemVer Rules**:

| Change Type | Version Bump | Backward Compatible? |
|-------------|--------------|---------------------|
| Add optional field | Minor (1.0.0 → 1.1.0) | ✅ Yes |
| Add new enum value | Minor | ✅ Yes |
| Change field description | Patch (1.0.0 → 1.0.1) | ✅ Yes |
| Deprecate field (still parsed) | Minor | ✅ Yes |
| Remove field | Major (1.0.0 → 2.0.0) | ❌ No |
| Change field type | Major | ❌ No |
| Make optional → required | Major | ❌ No |

### Migration Strategy

**For Breaking Changes (Major Bump)**:

1. **Deprecation Period** (1 release cycle)
   - Schema 1.5.0 warns: `"field X is deprecated; use Y instead"`
   - Tools emit warnings, still parse old format

2. **Migration Tool**
   ```bash
   alex migrate --from 1.x --to 2.0
   ```
   - Automatically rewrites `alex.*.yaml` files
   - Creates git commit with changes
   - Generates migration report

3. **Dual Support Window** (1 release cycle)
   - Schema 2.0.0 still parses 1.x files (with warnings)
   - After 1 cycle, 1.x support removed in 2.1.0

**For Non-breaking Changes (Minor/Patch)**:

- Old specs continue working forever
- New fields ignored by old tools
- Forward compatibility guaranteed

---

## Spec Structure (Standard Fields)

Every `alex.*.yaml` file follows this base structure:

```yaml
schemaVersion: "1.0.0"      # Required: SemVer schema version
kind: Product               # Required: Spec type (Product|Agents|Tests|Policies)

metadata:                   # Required: Identification
  name: my-app              # Required: Unique name
  version: "0.1.0"          # Required: App version
  description: "..."        # Optional
  labels:                   # Optional: Arbitrary key-value tags
    team: platform
    stage: alpha

spec:                       # Required: Type-specific specification
  # ... (varies by kind)
```

This structure mirrors Kubernetes CRDs for familiarity.

---

## Example: `alex.product.yaml`

```yaml
schemaVersion: "1.0.0"
kind: Product

metadata:
  name: appointments-app
  version: "0.1.0"
  description: "Appointment booking system"

spec:
  auth:
    providers:
      - type: email-password
      - type: google-oauth

  entities:
    - name: User
      fields:
        - name: email
          type: string
          required: true
        - name: role
          type: enum
          values: [customer, provider, admin]

    - name: Appointment
      fields:
        - name: userId
          type: ref
          ref: User
        - name: startTime
          type: datetime
        - name: status
          type: enum
          values: [pending, confirmed, cancelled]

  flows:
    - name: book-appointment
      trigger: user-action
      steps:
        - action: validate-availability
        - action: create-appointment
        - action: send-confirmation-email

  backend:
    adapter: firebase  # or supabase
    region: us-central1
```

---

## Example: `alex.tests.yaml`

```yaml
schemaVersion: "1.0.0"
kind: Tests

metadata:
  name: appointments-e2e
  version: "0.1.0"

spec:
  e2e:
    - name: book-appointment-happy-path
      tags: [critical, booking]
      steps:
        - action: login
          credentials: ${TEST_USER_EMAIL}
        - action: navigate
          url: /book
        - action: select-date
          date: tomorrow
        - action: click
          selector: button[type="submit"]
        - action: assert
          condition: text-contains
          text: "Booking confirmed"

  unit:
    coverage:
      minimum: 80  # Percentage (enforced)
      exclude:
        - "**/*.test.ts"
        - "**/mocks/**"
```

---

## Consequences

### Positive

✅ **Standard contract**: All tools operate on same spec format  
✅ **Human-friendly**: Developers can read/write YAML easily  
✅ **Machine-parseable**: Strict validation via JSON Schema  
✅ **Versionable**: Git tracks changes; CI validates schemas  
✅ **Evolvable**: SemVer + migration tools enable growth  
✅ **Portable**: Not locked to Hello Alex; exportable  
✅ **Type-safe**: Generate TypeScript types from schemas  

### Negative

⚠️ **YAML indentation**: Errors can be cryptic (mitigated by IDE plugins)  
⚠️ **Schema maintenance**: Must keep schemas + docs in sync (automated checks)  
⚠️ **Migration overhead**: Breaking changes require migration tools (one-time cost)

### Neutral

- Users familiar with OpenAPI or Kubernetes will find this natural
- Users new to YAML may need onboarding (provide templates + examples)

---

## Implementation Notes

### Immediate Actions (v0.1)

- [x] Create `packages/alex-spec/` package
- [ ] Define JSON Schema for each spec type
- [ ] Implement YAML validator (using Ajv + js-yaml)
- [ ] Generate TypeScript types from schemas (using json-schema-to-typescript)
- [ ] Create example specs in `examples/appointments/`
- [ ] Add schema validation to CI

### Future Actions (v0.2+)

- [ ] `alex migrate` command for schema upgrades
- [ ] VS Code extension with schema-aware autocomplete
- [ ] Online schema playground (like Swagger Editor)
- [ ] Generate docs site from schemas

---

## Alternatives Considered

### Alternative 1: JSON-only

**Pros**: Strict typing, no indentation issues  
**Cons**: No comments, verbose, poor human readability  
**Verdict**: Rejected. YAML's human-friendliness is critical for daily use.

### Alternative 2: Custom DSL (HCL, CUE, etc.)

**Pros**: Domain-specific optimizations  
**Cons**: Smaller ecosystem, learning curve, less tooling  
**Verdict**: Rejected. YAML + JSON Schema is "good enough" and widely adopted.

### Alternative 3: TypeScript Config

**Pros**: Type-safe at author time  
**Cons**: Requires compilation, not portable, can't use from Python/Ruby  
**Verdict**: Rejected. YAML is language-neutral.

---

## References

- [JSON Schema Specification](https://json-schema.org/draft/2020-12/json-schema-core.html)
- [Kubernetes CRD Design](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Semantic Versioning](https://semver.org/)

---

**Decision**: ACCEPTED  
**Signed**: Alex (Platform PM), Jason DeWater  
**Date**: October 5, 2025
