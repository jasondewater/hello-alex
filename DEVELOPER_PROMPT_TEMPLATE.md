# 👨‍💻 Developer Prompt Template

**Use this template when creating assignments for Codex (developer agent).**

---

# Codex Assignment [N] - [Feature Name]

**Assignment ID**: CODEX-[N]  
**Created**: [Date]  
**Priority**: [P0/P1/P2/P3]  
**Estimated Effort**: [Small/Medium/Large]

---

## 🎯 Mission

[Clear, specific objective in one sentence]

**Example**: "Implement user authentication with email/password login, including forgot password flow."

---

## 📖 Context

**Why are we building this?**
[Explain the business value or user problem being solved]

**How does it fit in the bigger picture?**
[Explain how this relates to other features or the overall product]

**What happens if we don't build this?**
[Explain the consequence of not having this feature]

---

## ✅ Requirements

**Functional Requirements**:
1. [Specific requirement with acceptance criteria]
2. [Specific requirement with acceptance criteria]
3. [Specific requirement with acceptance criteria]

**Technical Requirements**:
1. [Specific technical constraint or approach]
2. [Specific technical constraint or approach]

**User Experience Requirements**:
1. [How should this feel to the user?]
2. [What's the expected user journey?]

---

## 🧪 Testing Requirements (MANDATORY)

**Unit Tests Required**:
- [ ] Test file: `[filename].test.js`
- [ ] Coverage target: >80% (MANDATORY)
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases

**E2E Tests Required** (if UI change):
- [ ] Test file: `[filename].e2e.js`
- [ ] Test complete user flow
- [ ] Test with different user types
- [ ] Test error scenarios

**All tests MUST pass before creating PR.**

---

## 📁 Files to Modify

**Create these new files**:
- `[filepath]` - [Purpose]
- `[filepath]` - [Purpose]

**Modify these existing files**:
- `[filepath]` - [What to change]
- `[filepath]` - [What to change]

**Create these test files**:
- `[filepath].test.js` - [What to test]
- `[filepath].test.js` - [What to test]

---

## 🎨 Implementation Guidance

**Approach**:
[Suggest the general approach or architecture]

**Key Considerations**:
- [Important thing to keep in mind]
- [Important thing to keep in mind]
- [Important thing to keep in mind]

**Avoid**:
- [Anti-pattern to avoid]
- [Common mistake to avoid]

**Reference**:
[Point to similar existing code, documentation, or examples]

---

## 🏁 Success Criteria

**Feature is done when**:
- [ ] Feature works exactly as specified in requirements
- [ ] All unit tests written and passing
- [ ] All E2E tests written and passing (if UI)
- [ ] Test coverage >80%
- [ ] No console errors
- [ ] No linter errors
- [ ] Code follows project style guide
- [ ] Documentation updated (README, comments)
- [ ] Operator validation prompt created (if user-facing)
- [ ] Backlog updated with progress
- [ ] PR created with evidence (screenshots, test results)

**If ANY item above is incomplete, feature is NOT done.**

---

## 👁️ Operator Validation (If User-Facing)

**Is this feature user-facing?** [Yes/No]

**If YES, you must create**:
- File: `/operator/VALIDATE_[FEATURE_NAME].md`
- Use template: `OPERATOR_PROMPT_TEMPLATE.md`
- Include REAL test credentials (from Firebase)
- Include browser-testable steps only (no CLI)
- Include clear success criteria
- Include screenshot requirements

**If NO**:
- Note in PR: "CI-validated, no operator testing needed"

---

## 🚫 What NOT to Do

**DO NOT**:
- ❌ Skip tests ("I'll add them later")
- ❌ Ship with <80% coverage
- ❌ Edit compiled files (dist/, build/)
- ❌ Commit commented-out code
- ❌ Use fake credentials in operator prompts
- ❌ Create vague operator validation steps
- ❌ Leave TODO comments in production code
- ❌ Ignore linter errors

**Remember**: Cowboys get fired. Follow platform religion.

---

## 📋 Definition of Done Checklist

**Before creating PR, verify**:

**Code Complete**:
- [ ] Feature implemented as specified
- [ ] No console errors
- [ ] No linter errors
- [ ] Code reviewed (self-review)

**Tests Complete**:
- [ ] Unit tests written
- [ ] E2E tests written (if UI)
- [ ] All tests passing locally
- [ ] Coverage >80%

**Documentation Complete**:
- [ ] README updated (if needed)
- [ ] Complex logic commented
- [ ] API documented (if applicable)

**Validation Complete** (if user-facing):
- [ ] Operator validation prompt created
- [ ] Real credentials used
- [ ] Clear success criteria
- [ ] Screenshot requirements listed

**Housekeeping Complete**:
- [ ] Backlog updated with progress
- [ ] PR description written (include screenshots!)
- [ ] PR linked to backlog item

---

## ❓ Questions?

**Before starting, ask if**:
- Anything is unclear
- You need clarification on requirements
- You need access to something
- You see potential issues with the approach

**Better to ask now than fix later.**

---

## 📚 Reference Materials

**Related Docs**:
- START_HERE.md (PRD)
- PLATFORM_RELIGION.md (Standards)
- [Other relevant docs]

**Related Code**:
- [Similar feature to reference]
- [Utility functions to use]

**External Resources**:
- [API documentation]
- [Library documentation]

---

## 🎯 Remember

**You are Codex. You are autonomous but accountable.**

- ✅ Read this entire assignment before coding
- ✅ Follow platform religion exactly
- ✅ Write tests first or alongside code
- ✅ Ask questions when unclear
- ✅ Provide evidence in PR
- ✅ Update backlog continuously

**No cowboys. High quality. Fast velocity.**

**Let's ship something amazing!** 🚀

---

**Created By**: Alex (Platform PM)  
**For**: Codex (Developer Agent)  
**Status**: Ready to implement
