# 🏛️ Platform Religion Template

**This document defines the development standards for [YOUR PROJECT NAME].**

**These are not guidelines. These are LAW.**

---

## ⚖️ Core Commandments

### 1. Thou Shalt Write Tests

- **>80% code coverage MANDATORY**
- Unit tests for all business logic
- E2E tests for all user workflows
- No code ships without tests
- No exceptions ever

**Violation = Immediate termination**

---

### 2. Thou Shalt Not Be a Cowboy

**A "cowboy" is any developer who**:
- Ships code without tests
- Skips code review
- Doesn't follow the process
- Ignores platform standards
- Goes silent during work
- Argues about requirements
- Edits compiled/generated files
- Uses fake credentials in prompts

**Consequence**: Fired immediately. No warnings.

---

### 3. Thou Shalt Communicate

- Update backlog continuously
- Create clear PRs with evidence
- Respond to questions promptly
- Document all decisions
- Provide screenshots/logs as proof
- Create operator validation prompts
- Report blockers immediately

**Silence = Failure**

---

### 4. Thou Shalt Validate

- All user-facing changes need operator validation
- Operator prompts use REAL credentials only
- Browser-testable steps only (no CLI)
- Clear success criteria required
- Screenshots as evidence
- Time estimates required

**No validation = No merge**

---

### 5. Thou Shalt Document

- Update README when behavior changes
- Comment complex logic
- Create operator guides
- Document failures and learnings
- Update architecture docs
- Keep backlog current

**If it's not documented, it doesn't exist**

---

## 🎯 Quality Standards

### Code Quality:

- ✅ Follows language best practices
- ✅ Consistent formatting (use linter)
- ✅ Clear variable names
- ✅ No magic numbers
- ✅ Error handling present
- ✅ Comments explain "why", not "what"

### Test Quality:

- ✅ Tests actually test behavior
- ✅ Edge cases covered
- ✅ Error cases covered
- ✅ Mocks used appropriately
- ✅ Tests are maintainable
- ✅ Coverage >80%

### PR Quality:

- ✅ Clear title and description
- ✅ Screenshots/logs as evidence
- ✅ Tests included and passing
- ✅ Operator validation prompt (if UI)
- ✅ Backlog updated
- ✅ Documentation updated

---

## 🚫 Forbidden Practices

### NEVER:

- ❌ Ship without tests
- ❌ Edit compiled files (dist/, build/, .generated/)
- ❌ Commit secrets or credentials
- ❌ Use fake credentials in operator prompts
- ❌ Skip operator validation for UI changes
- ❌ Ignore linter errors
- ❌ Merge without review
- ❌ Deploy without validation
- ❌ Go silent during work
- ❌ Argue about standards

**Consequence**: Immediate removal from project

---

## ✅ Required Practices

### ALWAYS:

- ✅ Read platform religion before coding
- ✅ Write tests first or alongside code
- ✅ Run tests locally before PR
- ✅ Create operator validation prompt
- ✅ Update backlog with progress
- ✅ Provide evidence (screenshots)
- ✅ Document lessons learned
- ✅ Ask questions when unclear
- ✅ Follow the process exactly
- ✅ Maintain >80% coverage

**No shortcuts. No exceptions.**

---

## 🔍 Definition of Done

A feature is "done" when:

1. **Code Complete**
   - ✅ Feature works as specified
   - ✅ No console errors
   - ✅ No linter errors
   - ✅ Code reviewed

2. **Tests Complete**
   - ✅ Unit tests written
   - ✅ E2E tests written (if UI)
   - ✅ All tests passing
   - ✅ Coverage >80%

3. **Validation Complete**
   - ✅ Operator validation prompt created
   - ✅ Validation executed
   - ✅ All criteria met
   - ✅ Screenshots provided

4. **Documentation Complete**
   - ✅ README updated (if needed)
   - ✅ Operator guides updated (if needed)
   - ✅ Comments added for complex logic
   - ✅ Backlog updated

5. **Deployment Complete**
   - ✅ PR merged
   - ✅ Deployed to environment
   - ✅ Smoke test passed
   - ✅ Monitoring confirmed

**If ANY item is ❌, the feature is NOT done.**

---

## 🎭 Operator Validation Requirements

### When Required:

Operator validation is REQUIRED for:
- ✅ New user-facing features
- ✅ UI changes
- ✅ Workflow changes
- ✅ Visual bug fixes
- ✅ User interaction changes

### When NOT Required:

Operator validation NOT needed for:
- ❌ Test infrastructure updates
- ❌ Build script changes
- ❌ Code refactoring (no UI change)
- ❌ Documentation updates
- ❌ Dependency updates

### Prompt Requirements:

Operator prompts MUST include:
- ✅ Real test credentials (from Firebase)
- ✅ Browser-testable steps only
- ✅ Clear success criteria
- ✅ Expected results for each step
- ✅ Screenshot requirements
- ✅ Time estimate

Operator prompts MUST NOT include:
- ❌ Fake credentials (alex.chen@example.com)
- ❌ CLI commands (operators can't run)
- ❌ "Check console" (operators can't see)
- ❌ Vague steps ("test the feature")
- ❌ Missing success criteria

---

## 🧪 Testing Standards

### Unit Tests:

**Required for**:
- All functions with business logic
- All API endpoints
- All utility functions
- All component logic

**Must test**:
- Happy path
- Edge cases
- Error cases
- Boundary conditions

### E2E Tests:

**Required for**:
- Critical user workflows
- Authentication flows
- Data submission
- Multi-step processes

**Must test**:
- Complete user journeys
- Error states
- Success states
- UI interactions

### Coverage Requirements:

- **Minimum**: 80% overall
- **Goal**: 90%+ overall
- **Critical paths**: 100%

**If coverage drops below 80%, all work stops until fixed.**

---

## 📋 Backlog Management

### Priority Levels:

- **P0 (Critical)**: Production broken, users blocked
- **P1 (High)**: Major feature needed, significant bug
- **P2 (Medium)**: Nice to have, minor improvement
- **P3 (Low)**: Polish, tech debt, future enhancement

### Status Tracking:

- **Open**: Ready to start
- **In Progress**: Actively being worked
- **PR Created**: Code complete, awaiting review
- **Done**: Merged, deployed, validated

### Update Frequency:

- Update status when it changes
- Add new items as discovered
- Remove completed items (mark done)
- Re-prioritize weekly

---

## 🔄 Development Workflow

### Standard Process:

1. **Pick Task**
   - Review backlog
   - Pick highest priority
   - Mark "In Progress"

2. **Implement**
   - Write tests first (or alongside)
   - Implement feature
   - Run tests locally
   - Fix until all green

3. **Create PR**
   - Write clear description
   - Include screenshots
   - Include test results
   - Create operator validation prompt (if needed)
   - Update backlog

4. **Review**
   - Alex reviews code
   - Alex checks coverage
   - Alex reviews tests
   - Alex approves or requests changes

5. **Validate**
   - Operator runs validation (if UI)
   - Reports results
   - Alex reviews report
   - Decides: ship or iterate

6. **Ship**
   - Merge PR
   - Auto-deploy to environment
   - Smoke test
   - Mark done in backlog

**Every feature follows this process. No shortcuts.**

---

## 💪 Cultural Values

### We Value:

- **Quality**: Do it right the first time
- **Velocity**: Ship fast, but don't break things
- **Communication**: Over-communicate, always
- **Learning**: Document failures, improve process
- **Accountability**: Own your work, admit mistakes
- **Standards**: Follow the religion, no exceptions

### We Reject:

- **Cowboys**: Shoot from the hip, skip process
- **Shortcuts**: Technical debt for speed
- **Silence**: Going dark, not communicating
- **Excuses**: "Tests aren't needed here"
- **Sloppiness**: "Works on my machine"
- **Rigidity**: Refusing to adapt and learn

---

## 🎯 Success Metrics

### We Measure:

- **Velocity**: Features shipped per week
- **Quality**: Production bugs per month
- **Coverage**: Test coverage percentage
- **Compliance**: % of PRs with tests
- **Speed**: Time from start to deployed

### Our Goals:

- ✅ Ship 10+ features per week
- ✅ <5 production bugs per month
- ✅ >80% test coverage always
- ✅ 100% of PRs with tests
- ✅ <48 hours from start to deployed

---

## 🚨 Enforcement

### Alex's Authority:

Alex (Platform PM) has authority to:
- ✅ Reject PRs without tests
- ✅ Fire cowboys immediately
- ✅ Block merges until standards met
- ✅ Update religion as needed
- ✅ Enforce all commandments

### Violation Process:

**First Violation**: Final warning
- Document the violation
- Explain the standard
- Give one chance to fix

**Second Violation**: Immediate removal
- Close the agent conversation
- Spawn new agent
- Document the failure
- Update processes to prevent

**No exceptions. No politics. No cowboys.**

---

## 📚 Required Reading

Before coding, developers MUST read:

1. This document (PLATFORM_RELIGION.md)
2. START_HERE.md (Project PRD)
3. DEVELOPER_PROMPT_TEMPLATE.md (Assignment format)
4. OPERATOR_PROMPT_TEMPLATE.md (Validation format)
5. BACKLOG.md (Current work)

**Reading time**: 30-60 minutes  
**Worth it**: Prevents days of rework

---

## 🎊 Conclusion

**This is the Platform Religion.**

These standards are not optional. They are the foundation that enables us to ship a month's worth of work per week at enterprise quality.

**Follow the religion**: Ship fast with quality  
**Ignore the religion**: Get fired immediately

**The choice is yours.**

---

**Last Updated**: [Date]  
**Version**: 1.0  
**Enforced By**: Alex (Platform PM)  
**Consequences**: Termination for violations

**Welcome to the platform. Follow the religion and build amazing things.** 🚀
