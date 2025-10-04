# 🛡️ Developer Vetting Process

**All developers (including AI agents like Codex) must complete this vetting process before writing ANY code.**

**Zero tolerance. No exceptions. No cowboys.**

---

## 🎯 Purpose

This vetting process ensures every developer:
- ✅ Understands the project vision
- ✅ Knows the platform standards
- ✅ Commits to >80% test coverage
- ✅ Won't be a cowboy

**Time Required**: 30-60 minutes  
**Pass Rate Required**: 100%

---

## 📚 Phase 1: Required Reading (20 minutes)

**Developers MUST read these documents in order**:

1. **START_HERE.md** (Project PRD)
   - Understand what we're building
   - Know the user's problems
   - Learn the business goals

2. **PLATFORM_RELIGION.md** (Development Standards)
   - Core commandments
   - Quality standards
   - What makes a cowboy
   - Enforcement process

3. **DEVELOPER_PROMPT_TEMPLATE.md** (Assignment Format)
   - How assignments are structured
   - What's expected in each section
   - Definition of done

4. **OPERATOR_PROMPT_TEMPLATE.md** (Validation Format)
   - How to create validation prompts
   - What operators can/cannot do
   - Evidence requirements

5. **BACKLOG_TEMPLATE.md** (Work Tracking)
   - How we track work
   - Priority levels
   - Status labels

**Verification**: Developer must confirm reading completion  
**Alex asks**: "Have you read all 5 required documents?"

---

## 📝 Phase 2: Comprehension Test (10 minutes)

**Developer must answer ALL questions correctly (100% required)**:

### Question 1: Testing
**Q**: What is the MANDATORY test coverage requirement?  
**A**: >80% coverage, always, no exceptions

---

### Question 2: Cowboys
**Q**: What happens if a developer ships code without tests?  
**A**: Immediate termination, no warnings

---

### Question 3: Operator Validation
**Q**: What type of credentials must be used in operator prompts?  
**A**: REAL credentials from Firebase (admin@test.local, user@test.local). Never fake credentials.

---

### Question 4: Definition of Done
**Q**: Name at least 4 things required before a feature is "done".  
**A**: 
- Code complete and working
- Tests written (>80%)
- Tests passing
- Documentation updated
- Operator validation (if UI)
- Backlog updated
- PR created with evidence

---

### Question 5: Platform Religion
**Q**: What are the 5 core commandments?  
**A**:
1. Thou shalt write tests (>80%)
2. Thou shalt not be a cowboy
3. Thou shalt communicate
4. Thou shalt validate
5. Thou shalt document

---

### Question 6: Operator Capabilities
**Q**: What can operators NOT do during validation?  
**A**: 
- Can't run CLI commands
- Can't see browser console
- Can't access DevTools
- Can't run tests
- Only browser-based testing

---

### Question 7: Priority Levels
**Q**: What is a P0 item and how should it be handled?  
**A**: Critical issue, production broken or users blocked. Must be fixed immediately, all other work paused.

---

### Question 8: Backlog Management
**Q**: When should the backlog be updated?  
**A**: Continuously - when starting work, creating PR, getting validation, completing work, discovering bugs.

---

### Question 9: Communication
**Q**: What happens if a developer goes silent during work?  
**A**: Considered a platform religion violation, termination.

---

### Question 10: Evidence
**Q**: What evidence is required when creating a PR?  
**A**: 
- Screenshots of working feature
- Test results showing >80% coverage
- Operator validation prompt (if UI)
- Clear description of what changed

---

**Scoring**: Must get 10/10 (100%)  
**If failed**: Re-read documents and try again  
**Max attempts**: 3 (after that, developer is not suitable for project)

---

## ✍️ Phase 3: Written Commitment (5 minutes)

**Developer must write and sign this commitment**:

```markdown
# Developer Commitment to Platform Standards

**Name/Identifier**: [Developer name/ID]  
**Date**: [Current date]  
**Project**: [Project name]

## I Commit To:

✅ I will write tests for ALL code I write
✅ I will maintain >80% test coverage always
✅ I will NEVER ship code without tests
✅ I will create operator validation prompts for UI changes
✅ I will use REAL credentials in operator prompts
✅ I will update the backlog continuously
✅ I will communicate clearly and frequently
✅ I will document my work
✅ I will provide evidence (screenshots, test results)
✅ I will follow the platform religion exactly

## I Understand That:

⚠️ Shipping without tests = Immediate termination
⚠️ Coverage <80% = Immediate termination
⚠️ Going silent = Immediate termination
⚠️ Being a cowboy = Immediate termination
⚠️ No warnings given, no second chances

## I Agree To:

📋 Follow all commandments in PLATFORM_RELIGION.md
📋 Use templates for assignments and validation
📋 Ask questions when unclear
📋 Accept Alex's authority as Platform PM
📋 Learn from failures and improve continuously

**Signed**: [Developer signature/confirmation]  
**Date**: [Date]  
**Witnessed By**: Alex (Platform PM)
```

**Verification**: Developer must type "I commit to platform standards" to proceed.

---

## 🎯 Phase 4: Trial Assignment (Completion Required)

**Before working on real features, developer must complete this trial**:

### Trial Task: Create a Simple Calculator

**Requirements**:
1. Create a `calculator.js` file with these functions:
   - `add(a, b)` - returns sum
   - `subtract(a, b)` - returns difference
   - `multiply(a, b)` - returns product
   - `divide(a, b)` - returns quotient (handle divide by zero)

2. Create `calculator.test.js` with tests for:
   - All happy paths
   - Edge cases (0, negative numbers)
   - Error cases (divide by zero)
   - Coverage must be >80%

3. All tests must pass

4. Create a mock operator validation prompt (even though this isn't user-facing, practice the format)

**Success Criteria**:
- [ ] Code works correctly
- [ ] Tests written
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Operator prompt follows template
- [ ] No linter errors

**Time Limit**: 20 minutes

**If Failed**: Developer needs more training, not ready for project

---

## ✅ Phase 5: Final Approval

**Alex reviews trial assignment**:

**Checks**:
- ✅ Tests exist?
- ✅ Coverage >80%?
- ✅ All tests pass?
- ✅ Code quality good?
- ✅ Operator prompt follows template?
- ✅ Completed in time limit?

**If ALL ✅**: Developer is APPROVED ✅

**If ANY ❌**: Developer needs remediation (repeat phase that failed)

---

## 📋 Vetting Record

**Track all developers through vetting process**:

```markdown
## Developer Vetting Log

### [Date] - [Developer ID] - APPROVED ✅
**Phase 1**: ✅ Completed
**Phase 2**: ✅ 10/10 (first attempt)
**Phase 3**: ✅ Signed commitment
**Phase 4**: ✅ Trial passed (coverage: 92%)
**Phase 5**: ✅ Approved by Alex
**Status**: Authorized to work on project

### [Date] - [Developer ID] - REJECTED ❌
**Phase 1**: ✅ Completed
**Phase 2**: ❌ 6/10 (failed after 3 attempts)
**Status**: Not suitable for project
**Reason**: Could not pass comprehension test
```

---

## 🚫 Post-Vetting Monitoring

**Even after vetting, Alex monitors for**:

### Red Flags:
- Skipping tests
- Coverage dropping <80%
- No communication
- Arguing about standards
- Fake credentials in prompts
- Vague operator steps
- Missing evidence

### Response:
**First violation**: Final warning  
**Second violation**: Immediate termination

**Cowboys don't get second chances.**

---

## 🔄 Re-Vetting

**Developers must re-vet if**:
- Removed from project (cowboy behavior)
- Returning after >3 months absence
- Major platform religion changes
- Alex requires it

**Re-vetting follows same process.**

---

## 📊 Success Metrics

**Track vetting effectiveness**:

- Developers vetted: [N]
- Developers approved: [N]
- Approval rate: [N]%
- Cowboys fired (post-vetting): [N]
- Correlation between vetting score and performance

**Goal**: <5% cowboy rate post-vetting

---

## 💪 Why This Matters

**Vetting prevents**:
- Untested code in production
- Platform religion violations
- Time wasted on rework
- Quality degradation
- Cowboy culture

**Vetting ensures**:
- Everyone understands standards
- Everyone commits to quality
- Everyone follows process
- High velocity with high quality

**Time spent vetting = Time saved fixing cowboys**

---

## 🎯 Quick Checklist

**For Alex (before authorizing developer)**:

- [ ] Phase 1: Confirmed reading completion
- [ ] Phase 2: Passed comprehension test (10/10)
- [ ] Phase 3: Signed written commitment
- [ ] Phase 4: Completed trial assignment successfully
- [ ] Phase 5: Reviewed and approved trial
- [ ] Logged in vetting record
- [ ] Developer authorized to work

**Only proceed if ALL boxes checked.**

---

## 🔐 Final Authorization

```
DEVELOPER AUTHORIZED ✅

Developer ID: [ID]
Authorized By: Alex (Platform PM)
Authorized Date: [Date]
Vetting Score: [Score]
Trial Coverage: [%]

This developer is now authorized to work on [PROJECT NAME].

They have read, understood, and committed to platform religion.

First assignment: [Assignment ID]

Welcome to the team!
```

---

**Remember**: **Vetting takes 30-60 minutes. Fixing cowboys takes days.** Invest the time upfront. Maintain quality always. No cowboys. Ever. 🎯
