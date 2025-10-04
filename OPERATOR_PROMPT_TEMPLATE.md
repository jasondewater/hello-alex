# 👁️ Operator Validation Prompt Template

**Use this template when creating validation prompts for the Operator (QA agent).**

---

# Operator Validation - [Feature Name]

**Feature**: [Feature Name]  
**PR**: #[N]  
**Created**: [Date]  
**Estimated Time**: [X] minutes

---

## 🎯 What We're Testing

[Brief description of what changed and why it needs validation]

**Example**: "We added a forgot password flow. Users can now reset their password via email."

---

## 🌐 Test Environment

**URL**: [Deployed environment URL]

**Example**: `https://your-app.web.app`

**Note**: Make sure this environment has the latest code deployed!

---

## 🔑 Test Credentials

**Use these REAL credentials** (from Firebase Authentication):

```
Email: admin@test.local
Password: TestAdmin2024!@#
```

**Additional accounts** (if needed):
```
Email: user@test.local
Password: TestUser2024!@#
```

**⚠️ CRITICAL**: These MUST be real accounts that exist in Firebase!  
**❌ NEVER use fake credentials** like `alex.chen@example.com`

---

## 📋 Testing Steps

**Follow these steps EXACTLY in your browser**:

### Step 1: [First Action]
1. Open browser to [URL]
2. [Specific action]
3. [Expected result]

**✅ Success**: [What you should see]  
**❌ Failure**: [What failure looks like]

---

### Step 2: [Second Action]
1. [Specific action]
2. [Specific action]
3. [Expected result]

**✅ Success**: [What you should see]  
**❌ Failure**: [What failure looks like]

---

### Step 3: [Third Action]
1. [Specific action]
2. [Specific action]
3. [Expected result]

**✅ Success**: [What you should see]  
**❌ Failure**: [What failure looks like]

---

**Continue for all test steps...**

---

## ✅ Success Criteria

**The feature passes validation when ALL of these are true**:

- [ ] [Specific criterion 1]
- [ ] [Specific criterion 2]
- [ ] [Specific criterion 3]
- [ ] [Specific criterion 4]
- [ ] No unexpected errors or broken behavior
- [ ] User experience is smooth and intuitive

**If ANY criterion is ❌, the feature FAILS validation.**

---

## 📸 Evidence Required

**Please capture these screenshots**:

1. **[Screenshot 1 Description]**
   - Show: [What should be visible]
   - Purpose: [Why we need this screenshot]

2. **[Screenshot 2 Description]**
   - Show: [What should be visible]
   - Purpose: [Why we need this screenshot]

3. **[Screenshot 3 Description]**
   - Show: [What should be visible]
   - Purpose: [Why we need this screenshot]

**Include screenshots in your validation report.**

---

## 🚫 What NOT to Check

**Don't worry about these** (not testable in browser):

- ❌ Browser console logs (you can't see them)
- ❌ Network requests (you can't inspect them)
- ❌ Code coverage (not visible)
- ❌ Backend logs (not accessible)

**Focus on visual behavior and user experience only.**

---

## ⚠️ Common Issues to Watch For

**Known potential problems**:

1. [Potential issue 1]
   - If you see [this], it means [problem]
   - Report this immediately

2. [Potential issue 2]
   - If [this happens], it means [problem]
   - Report this immediately

3. [Potential issue 3]
   - If [this occurs], it means [problem]
   - Report this immediately

---

## 📝 Validation Report Format

**After testing, provide a report in this format**:

```markdown
# Operator Validation Report - [Feature Name]

**Date**: [Date]
**Operator**: [Your identifier]
**Environment**: [URL tested]

## Test Results

### Overall Status: [✅ PASS / ❌ FAIL]

### Individual Criteria:
- [✅/❌] Criterion 1: [Result]
- [✅/❌] Criterion 2: [Result]
- [✅/❌] Criterion 3: [Result]
- [✅/❌] Criterion 4: [Result]

### What Worked Well:
- [Thing that worked]
- [Thing that worked]

### Issues Found:
- [Issue 1 with description]
- [Issue 2 with description]

### Screenshots:
[Attach or describe screenshots taken]

### User Experience Notes:
[How did it feel to use? Any confusion? Any delight?]

### Recommendation:
[✅ APPROVE FOR MERGE / ❌ SEND BACK FOR FIXES]

### Additional Notes:
[Any other observations]
```

---

## 🎯 Testing Tips

**For best results**:

1. **Test in a fresh browser session** (incognito/private mode)
2. **Clear cache** before testing
3. **Test on actual device** (not just DevTools mobile simulation)
4. **Take screenshots** as you go (don't wait until end)
5. **Note anything confusing** or unexpected
6. **Be thorough** - the goal is to catch issues before users do

---

## ⏱️ Estimated Time

**This validation should take approximately**: [X] minutes

**If it takes significantly longer**, note that in your report (might indicate UX issues).

---

## ❓ Questions During Testing?

**If something is unclear**:
- Note it in your report
- Take a screenshot of the confusion
- Describe what you expected vs. what you see
- We'll clarify and update the prompt for next time

---

## 🎯 Remember

**You are the last line of defense** before this ships to users.

- ✅ Test thoroughly
- ✅ Report honestly
- ✅ Take clear screenshots
- ✅ Note UX issues
- ✅ Be the user's advocate

**If it's not good enough for you, it's not good enough for users.**

**Thank you for ensuring quality!** 🚀

---

## 📋 Quick Checklist

Before submitting your report, verify:

- [ ] Tested all steps in the browser
- [ ] Used REAL credentials
- [ ] Checked all success criteria
- [ ] Took required screenshots
- [ ] Noted any issues found
- [ ] Wrote clear, specific report
- [ ] Gave overall recommendation (approve/reject)

---

**Created By**: [Alex/Codex]  
**For**: Operator (QA Agent)  
**Status**: Ready for validation  
**Priority**: [P0/P1/P2/P3]

---

## 🔄 After Validation

**Operator**: Post your report back to Alex or the team.

**Alex**: Review the report and decide:
- ✅ **APPROVED**: Merge PR and deploy
- ❌ **ISSUES**: Send back to Codex for fixes

**The cycle continues until we ship perfection!** 🎯
