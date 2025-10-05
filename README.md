# 🚀 Hello Alex - Autonomous Development Framework

**Ship faster. Build better. Let AI agents handle the grind.**

Hello Alex is an **open-source autonomous development framework** that orchestrates AI agents (PM, Dev, QA) to turn product specifications into production-ready applications—with tests, validation, and clean code.

## ✨ What is Hello Alex?

Think "OpenAPI for autonomous development." You define your product in human-readable YAML specs (`alex.*.yaml`), and Hello Alex coordinates multi-agent workflows to:

1. **Plan** → PM agent breaks down specs into tasks
2. **Build** → Dev agent writes code with >80% test coverage
3. **Validate** → QA agent runs E2E tests and operator validations
4. **Deploy** → Clean, ejectable code ready for production

**No vendor lock-in. No magic. Just a standard, automatable workflow.**

---

## 🎯 Core Principles

1. **Spec-first**: `alex.*.yaml` files are your source of truth
2. **Quality gates**: >80% test coverage, E2E validation mandatory
3. **Safe execution**: Docker sandboxes, no credential leaks ever
4. **Progressive adoption**: Start with `alex plan`, grow to full orchestration
5. **Clean exit**: Export to Next.js/TypeScript at any time

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  alex.*.yaml Specs (Your Product Definition)    │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────▼────────────┐
        │  @hello-alex/runtime  │
        │   (LangGraph Flows)   │
        └──────────┬────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐   ┌────▼─────┐   ┌───▼────┐
│   PM   │   │   Dev    │   │   QA   │
│ Agent  │──▶│  Agent   │──▶│ Agent  │
└────────┘   └──────────┘   └────────┘
    │             │              │
    │        ┌────▼─────┐        │
    │        │ Executor │        │
    │        │ (Docker) │        │
    │        └──────────┘        │
    │                            │
    └────────────┬───────────────┘
                 │
            Clean Code
        (Next.js + TypeScript)
```

---

## 🚀 Quick Start

### Install

```bash
npx @hello-alex/cli init
```

This scaffolds:
- `alex.product.yaml` - Your product definition
- `alex.agents.yaml` - Agent configuration
- `alex.tests.yaml` - Test scenarios
- `.env.example` - Secrets template
- CI config with security gates

### Define Your Product

```yaml
# alex.product.yaml
schemaVersion: "1.0.0"
kind: Product

metadata:
  name: my-app
  version: "0.1.0"

spec:
  auth:
    providers: [email-password, google-oauth]

  entities:
    - name: User
      fields:
        - name: email
          type: string
          required: true

  flows:
    - name: user-signup
      steps:
        - action: validate-email
        - action: create-user
        - action: send-welcome-email
```

### Run Orchestration

```bash
# Plan: Generate issues and tasks from spec
alex plan

# Build: Orchestrate PM→Dev→QA workflow
alex dev

# Test: Run E2E validation
alex test

# Deploy: Ship it!
alex deploy
```

---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@hello-alex/cli` | Command-line interface | 🚧 v0.1 |
| `@hello-alex/runtime` | LangGraph orchestration engine | 🚧 v0.1 |
| `@hello-alex/spec` | JSON Schema for `alex.*.yaml` specs | 🚧 v0.1 |
| `@hello-alex/adapters-firebase` | Firebase auth + CRUD adapter | 🚧 v0.1 |
| `@hello-alex/adapters-supabase` | Supabase auth + CRUD adapter | 🚧 v0.1 |

---

## 🎓 Documentation

- **[Architecture Decision Records (ADRs)](./docs/adr/)** - Why we made key design choices
  - [ADR-001: Language & Runtime (TypeScript-first)](./docs/adr/ADR-001-language-runtime.md)
  - [ADR-002: Spec Files & Schema Evolution (YAML + JSON Schema)](./docs/adr/ADR-002-spec-schema.md)
  - [ADR-003: Executor Interface (Docker sandbox)](./docs/adr/ADR-003-executor-interface.md)
  - [ADR-004: Release Channels (Canary/Beta/Stable)](./docs/adr/ADR-004-release-channels.md)
  - [ADR-005: Security Posture (Zero plaintext secrets)](./docs/adr/ADR-005-security-posture.md)

- **[Platform Religion](./PLATFORM_RELIGION_TEMPLATE.md)** - Quality standards (>80% coverage, no cowboys)
- **[Good Morning Alex](./GOOD_MORNING_ALEX.md)** - Daily workflow for Alex (Platform PM)
- **[Developer Vetting](./DEVELOPER_VETTING_TEMPLATE.md)** - How to onboard new devs
- **[Operator Validation](./OPERATOR_PROMPT_TEMPLATE.md)** - QA agent instructions

---

## 🛠️ Development

### Prerequisites

- Node.js 20 LTS
- pnpm 8+
- Docker (for executors)

### Setup

```bash
git clone https://github.com/jasondewater/hello-alex.git
cd hello-alex
pnpm install
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Local Development

```bash
# Develop CLI
pnpm dev:cli

# Develop runtime
pnpm dev:runtime

# Run example app
cd examples/appointments
alex dev
```

---

## 🔒 Security

**Zero plaintext secrets. Ever.**

- ✅ Secrets in `.env` (gitignored)
- ✅ gitleaks scans on every commit
- ✅ OIDC for CI/CD (no long-lived tokens)
- ✅ Docker sandboxes for code execution
- ✅ Dependency scanning (Dependabot + Snyk)

See [ADR-005: Security Posture](./docs/adr/ADR-005-security-posture.md) for details.

---

## 📊 Project Status

**Current Version**: v0.1.0-canary (active development)

**Sprint**: v0.1 "Standard Seed" (Oct 5-15, 2025)

**Progress**: See [BACKLOG.md](./BACKLOG.md)

**Release Channels**:
- `canary` - Daily builds from `main`
- `beta` - Weekly releases (Mondays)
- `stable` - Bi-weekly production releases

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon).

**Key areas needing help**:
- Executor adapters (OpenHands, remote shells)
- Backend adapters (Postgres, MongoDB, AWS)
- Studio UI (Next.js visual builder)
- Documentation and examples

---

## 📜 License

**MIT** - See [LICENSE](./LICENSE)

Open core. No vendor lock-in. Eject to clean code anytime.

---

## 🌟 Why Hello Alex?

**For Solo Developers**:
- Turn ideas into apps in days, not months
- AI handles boilerplate, you focus on business logic
- Sleep well with >80% test coverage built-in

**For Small Teams**:
- Standard workflow everyone understands
- Specs = single source of truth
- Onboard new devs in hours with templates

**For Vibe Coders**:
- Describe what you want, Alex orchestrates the build
- No more context-switching between PM/Dev/QA roles
- Ship quality code without the grind

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jasondewater/hello-alex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jasondewater/hello-alex/discussions)
- **Twitter**: [@jasondewater](https://twitter.com/jasondewater)

---

**Built with ❤️ by Jason DeWater and the Hello Alex community.**

**Let's ship faster. Together.** 🚀

---

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] GitHub account (free tier is fine)
- [ ] OpenAI ChatGPT account (for PRD generation)
- [ ] Credit card for Firebase (free tier covers a lot)
- [ ] A clear vision for what you want to build

**Optional but Recommended**:
- Domain name (GoDaddy ~$12/year)
- Cloudflare account (free tier)

---

## 🎯 Phase 1: Create Your PRD (30 minutes)

Your PRD (Product Requirements Document) is the foundation. Do this first!

### Step 1: Open ChatGPT-5 Pro

Go to https://chat.openai.com and use **GPT-5 Pro** (or GPT-4 if unavailable).

### Step 2: Use This Prompt Template

```
I'm building [YOUR APP DESCRIPTION]. Help me create a comprehensive 
Product Requirements Document (PRD) with the following:

MY APP:
- Name: [Your app name]
- Purpose: [What problem does it solve?]
- Users: [Who will use it?]
- Core Features: [3-5 main features]

WHAT I NEED IN THE PRD:

1. TECH STACK RECOMMENDATION
   - Frontend framework (React, Vue, etc.)
   - Backend/Database (Firebase, Supabase, etc.)
   - Hosting solution
   - Authentication system
   - Any specialized libraries needed

2. COMPLETE FILE/FOLDER STRUCTURE
   - Every directory that needs to be created
   - Purpose of each directory
   - Initial files needed

3. DEPENDENCIES LIST
   - package.json contents
   - All npm packages needed
   - Version specifications

4. USER ROLES & PERMISSIONS
   - What types of users exist?
   - What can each type do?
   - How is access controlled?

5. DATA MODEL
   - What data needs to be stored?
   - Database schema/collections
   - Relationships between data

6. CORE FEATURES (Detailed)
   - Feature 1: [description, user flow, acceptance criteria]
   - Feature 2: [description, user flow, acceptance criteria]
   - Feature 3: [description, user flow, acceptance criteria]

7. INITIAL BOILERPLATE CODE
   - Basic app entry point
   - Authentication flow
   - Database connection
   - Routing setup

8. TESTING REQUIREMENTS
   - What needs unit tests?
   - What needs E2E tests?
   - Test coverage goals

9. DEVELOPMENT PHASES
   - Phase 1 (MVP): [features]
   - Phase 2 (Enhancement): [features]
   - Phase 3 (Polish): [features]

Make this detailed enough that an AI agent could build the entire 
application from this document alone.
```

### Step 3: Refine the Output

ChatGPT will ask clarifying questions. Answer them thoughtfully. Iterate until you have a comprehensive PRD that covers everything.

### Step 4: Save Your PRD

Copy the entire output and save it as `START_HERE.md` (you'll upload this to GitHub next).

---

## 🏗️ Phase 2: Setup GitHub Repository (15 minutes)

### Step 1: Create New Repository

1. Go to https://github.com/new
2. Repository name: `[your-app-name]`
3. Description: [Your app description]
4. ✅ Public or Private (your choice)
5. ✅ Initialize with README
6. Click "Create repository"

### Step 2: Upload Your PRD

1. Click "Add file" → "Upload files"
2. Upload your `START_HERE.md`
3. Commit: "Add PRD"

### Step 3: Upload This Starter Kit

1. Upload all files from this `hello-alex-starter-kit` folder
2. Commit: "Add Hello Alex framework"

**Your repo should now have**:
```
your-repo/
├── README.md (GitHub's default)
├── START_HERE.md (Your PRD)
├── GOOD_MORNING_ALEX.md (This kit)
├── PLATFORM_RELIGION_TEMPLATE.md (This kit)
├── DEVELOPER_VETTING_TEMPLATE.md (This kit)
├── BACKLOG_TEMPLATE.md (This kit)
├── DEVELOPER_PROMPT_TEMPLATE.md (This kit)
├── OPERATOR_PROMPT_TEMPLATE.md (This kit)
└── ALEX_ONBOARDING.md (This kit)
```

---

## 🤖 Phase 3: Meet Alex - Your Platform PM (1 hour)

### Step 1: Open GitHub Codespaces

1. On your GitHub repo page, click the green "Code" button
2. Click "Codespaces" tab
3. Click "Create codespace on main"
4. Wait for Codespaces to initialize (~2 minutes)

### Step 2: Open Copilot Chat

In Codespaces:
1. Press `Cmd+I` (Mac) or `Ctrl+I` (Windows)
2. Or click the chat icon in the sidebar

### Step 3: Select Claude 4.5 Sonnet

In the chat interface:
1. Click the model selector dropdown (top of chat)
2. Select **"Claude 4.5 Sonnet"**
3. This is your Alex (Platform PM)

### Step 4: Initialize Alex

Copy and paste this EXACT prompt into Copilot Chat:

```
Hello! I'm [YOUR NAME], and I'm building [YOUR APP NAME].

You are now "Alex" - my autonomous Platform PM. This is your first day.

YOUR ROLE:
- Manage this project end-to-end
- Create and enforce development standards ("the religion")
- Coordinate developer agents (Codex)
- Coordinate QA agents (Operator)
- Ensure >80% test coverage (NO COWBOYS!)
- Ship features with quality and velocity

FIRST MISSION:
1. Read START_HERE.md completely (our PRD)
2. Read ALEX_ONBOARDING.md (your onboarding guide)
3. Choose a name for yourself (be creative!)
4. Tell me about yourself and confirm you understand your role
5. Ask me any clarifying questions about the PRD

After we align on the vision, I'll ask you to start building the 
scaffolding and creating the platform religion.

Ready? Let's build something amazing together!
```

### Step 5: Get to Know Alex

Alex will:
- ✅ Introduce himself (and pick a name!)
- ✅ Confirm he understands the PRD
- ✅ Ask clarifying questions
- ✅ Get excited about the project

**Take your time here.** This conversation establishes the foundation. Answer his questions thoughtfully.

---

## 🏛️ Phase 4: Build the Religion (1 hour)

After Alex understands the project, use this prompt:

```
Perfect! Now let's build the foundation - "The Platform Religion."

TASK 1: PROJECT SCAFFOLDING
Based on START_HERE.md, please:
1. Create the complete folder structure
2. Initialize package.json with all dependencies
3. Create initial boilerplate files
4. Set up basic configuration files

TASK 2: PLATFORM RELIGION DOCUMENTS
Create these critical documents (use the templates provided):

1. GOOD_MORNING_ALEX.md (update from template)
   - Your daily startup process
   - How you check status
   - How you create assignments
   - How you coordinate agents

2. PLATFORM_RELIGION.md (create from scratch)
   - Core principles for THIS project
   - Development commandments
   - Quality standards (>80% test coverage)
   - What makes a "cowboy" (and why we fire them)

3. DEVELOPER_VETTING_PROCESS.md (update from template)
   - How we vet Codex agents before they code
   - 5 phase vetting process
   - Comprehension test
   - Commitment signing

4. BACKLOG.md (create from scratch)
   - How we track work
   - Priority levels (P0, P1, P2, P3)
   - Status tracking
   - Initial backlog items from PRD

5. DEVELOPER_PROMPT_TEMPLATE.md (update from template)
   - How you assign work to Codex
   - What must be included
   - Testing requirements
   - Success criteria

6. OPERATOR_PROMPT_TEMPLATE.md (update from template)
   - How Codex creates validation prompts
   - Browser-testable steps only
   - Real test credentials required
   - Success criteria format

TASK 3: INITIAL CONFIGURATION
Set up:
- .gitignore
- README.md (project-specific)
- Any environment config templates

Work through these systematically. Ask me questions as needed.
Let's build the religion right!
```

Alex will work through this, creating files and asking questions. **This is the most important phase.** The religion is what makes everything else work.

---

## 🔥 Phase 5: Setup Firebase (30 minutes)

While Alex is working on the religion, you can set up Firebase in parallel.

### Step 1: Create Firebase Project

1. Go to https://firebase.google.com/
2. Click "Get Started"
3. Click "Add Project"
4. Project name: `[your-app-name]`
5. ✅ Enable Google Analytics (recommended)
6. Click "Create Project"

### Step 2: Enable Required Services

In Firebase Console:

**Authentication**:
1. Click "Authentication" in sidebar
2. Click "Get Started"
3. Enable "Email/Password"

**Firestore Database**:
1. Click "Firestore Database"
2. Click "Create Database"
3. Start in **production mode**
4. Choose location (closest to your users)

**Hosting**:
1. Click "Hosting"
2. Click "Get Started"
3. Follow the setup wizard

**Cloud Functions** (optional for now):
1. Click "Functions"
2. Click "Get Started"
3. Select your pricing plan

### Step 3: Get Firebase Config

1. Click ⚙️ (gear icon) → "Project Settings"
2. Scroll to "Your apps"
3. Click "</>" (Web icon)
4. Register app: `[your-app-name]-web`
5. Copy the `firebaseConfig` object
6. Save as `firebaseConfig.json` in your repo

**Format**:
```json
{
  "apiKey": "YOUR_KEY_HERE",
  "authDomain": "your-app.firebaseapp.com",
  "projectId": "your-app",
  "storageBucket": "your-app.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}
```

### Step 4: Create Test Accounts

In Firebase Console → Authentication → Users:

1. Add user: `admin@test.local` / `TestAdmin2024!@#`
2. Add user: `user@test.local` / `TestUser2024!@#`

**Save these credentials!** You'll use them in operator validation prompts.

---

## 🎯 Phase 6: Deploy Hello World (30 minutes)

Now let's ship your first feature!

### Prompt for Alex:

```
Time to ship our first feature! Let's deploy a "Hello World" to Firebase.

CREATE:
A minimal but complete application that:
1. Shows a login screen
2. Authenticates with Firebase (using our config)
3. Shows "Hello [user's name]!" after login
4. Has a logout button
5. Includes unit tests (>80% coverage)
6. Includes deployment configuration

REQUIREMENTS:
- Use the tech stack from START_HERE.md
- Follow platform religion (tests required!)
- Create GitHub Actions workflow for deployment
- Include operator validation prompt

DELIVERABLES:
1. Working code
2. Tests (all passing)
3. Deployment config
4. Operator validation file
5. README with local dev instructions

Let's ship our first feature!
```

Alex will create everything. When done, follow his instructions to:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: `firebase deploy`

**First deployment complete!** 🎉

---

## 🗓️ Phase 7: Daily Development Workflow

Once the religion is built and Hello World is deployed, here's your daily routine:

### Every Morning (or whenever you work):

**1. Start New Codespaces Session**

Open Copilot Chat, select Claude 4.5 Sonnet, paste:

```
Good morning Alex!

SESSION START - Follow your GOOD_MORNING_ALEX.md process:
1. Read GOOD_MORNING_ALEX.md
2. Check BACKLOG.md for today's priorities
3. Review any operator validation reports from last session
4. Create dev sprint assignment for Codex
5. Let's ship some features!

Today I want to focus on: [your priority or "surprise me based on backlog"]
```

Alex will read his startup docs, review the backlog, and create an assignment for Codex.

**2. Spawn Codex (Your Developer)**

When Alex creates a dev assignment (like `CODEX_ASSIGNMENT_001.md`):

1. Open a **NEW** Copilot Chat window
2. Select **"GPT-4"** or **"OpenAI GPT-5"** (if available)
3. Paste:

```
I'm Codex, your autonomous developer.

MISSION: Read CODEX_ASSIGNMENT_001.md and implement it.

REQUIREMENTS:
1. Read the assignment completely
2. Read PLATFORM_RELIGION.md (understand standards)
3. Implement the feature
4. Write tests (>80% coverage MANDATORY)
5. Create PR with operator validation prompt
6. Update BACKLOG.md with progress

I will NOT be a cowboy. I will follow the religion.

Ready to begin!
```

Codex will work through the assignment, asking questions as needed.

**3. Operator Validation**

When Codex creates a PR and operator validation file:

1. Open https://chat.openai.com
2. Start new chat
3. Paste the entire operator validation prompt
4. Let the agent test your feature
5. Copy the validation report
6. Paste back to Alex

**4. Ship or Iterate**

Alex reviews the operator report and decides:
- ✅ **APPROVED** → Merge PR, deploy
- ❌ **ISSUES FOUND** → Codex fixes and resubmits

**Repeat 3-5 times per day** = 3-5 features shipped!

---

## 📊 Success Metrics

### Week 1:
- 3-5 features shipped with tests
- Getting comfortable with workflow
- Religion is established

### Week 2-3:
- 5-8 features per week
- System learning from mistakes
- Development accelerating

### Week 4+:
- 10-15 features per week
- Reinforcement learning kicking in
- "Month's work in 8 hours" achieved

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Skip the Religion
Building the religion docs takes time, but they're critical. This is what prevents chaos and maintains quality.

### ❌ DON'T: Tolerate Cowboys
If Codex (or any agent) skips tests, close that conversation and spawn a new one. Zero tolerance.

### ❌ DON'T: Use Fake Credentials
Always use REAL test accounts in operator prompts. `admin@test.local` is real (you created it in Firebase).

### ❌ DON'T: Work Alex Past His Limit
Claude has a context window. When Alex seems tired or confused, let him sign off with a goodnight report. Start fresh tomorrow.

### ❌ DON'T: Micromanage
Give Alex and Codex clear objectives, then trust them to execute. Review results, don't dictate implementation.

---

## 💰 Cost Breakdown

### Monthly Costs:
- **GitHub Codespaces**: ~$30-50 (Free tier covers some usage)
- **Firebase**: ~$0-25 (Free tier is generous)
- **OpenAI**: ~$20 (For operator agent)
- **Domain** (optional): ~$1/month
- **Total**: **~$50-100/month**

### Compare To:
- Full-time developer: $8,000+/month
- Cursor IDE subscription: $1,000+/month
- Your time saved: Priceless

---

## 🎓 Advanced Features (Month 2+)

Once comfortable with basics, add these:

### Multi-Environment Deployment
- Development environment (auto-deploy on merge)
- Staging environment (pre-production testing)
- Production environment (manual deploy only)

**Alex can help set this up when you're ready.**

### In-App Debug Panel
- Console logging inside your app
- Network request tracking
- Performance metrics
- No need for browser DevTools

**Example**: See how iFixAmerica implements this

### Stagewise Integration
- Click any element in your app to leave feedback
- Free alternative to Bugherd
- Reports go straight to Alex's backlog

**Open source and free!**

### Error Tracking Dashboard
- Admin panel showing all errors
- Auto-fix suggestions
- Trend analysis
- Proactive bug fixing

**Catches issues before users report them**

---

## 🆘 Getting Help

### Alex Not Understanding?
- Rephrase your request more clearly
- Point him to specific PRD sections
- Break complex requests into smaller steps

### Codex Skipping Tests?
- **FIRE THEM** (close conversation)
- Spawn new Codex
- Update religion docs with what went wrong
- System learns and improves

### Feature Not Working?
- Run the operator validation
- Check error logs
- Let Alex analyze the failure
- Try again (it'll be better next time)

### Stuck on Setup?
- Check GitHub Codespaces documentation
- Review Firebase setup guides
- Ask Alex for help (he's good at debugging setup issues)

---

## 🎯 Quick Reference

### Daily Commands:

**Start Session**:
```
Good morning Alex! [Follow GOOD_MORNING_ALEX.md process]
```

**Spawn Codex**:
```
I'm Codex. Read CODEX_ASSIGNMENT_[N].md and implement it.
```

**Run Operator**:
```
[Paste entire operator validation prompt into ChatGPT]
```

### Key Files:

- `START_HERE.md` - Your PRD
- `GOOD_MORNING_ALEX.md` - Alex's startup routine
- `PLATFORM_RELIGION.md` - Development standards
- `BACKLOG.md` - Work queue
- `CODEX_ASSIGNMENT_*.md` - Dev assignments
- `OPERATOR_VALIDATION_*.md` - QA test prompts

### Success Principles:

1. **Build Religion First** - Standards make it work
2. **Trust The Process** - It feels too easy, that's normal
3. **Be CEO Not Developer** - Vision and decisions, not coding
4. **No Cowboys Ever** - Fire agents that skip process
5. **Let It Learn** - Document failures, system improves

---

## 🎉 You're Ready!

You now have everything you need to:
- ✅ Create a comprehensive PRD
- ✅ Setup GitHub with Codespaces
- ✅ Initialize Alex (Platform PM)
- ✅ Build the platform religion
- ✅ Setup Firebase backend
- ✅ Deploy your first feature
- ✅ Ship features daily with quality

**The system will improve itself from here.** Every PR documents what worked and what failed. Alex learns. Codex gets better. The velocity increases week by week.

**Within a month, you'll be shipping a month's worth of work per week.** It sounds impossible, but the framework makes it real.

---

## 🚀 Next Steps

1. ✅ Create your PRD with ChatGPT-5 Pro
2. ✅ Setup GitHub repository
3. ✅ Meet Alex in Codespaces
4. ✅ Build the religion
5. ✅ Setup Firebase
6. ✅ Deploy Hello World
7. ✅ Start shipping features

**Go build something amazing!**

---

## 📚 Additional Resources

### In This Starter Kit:
- `ALEX_ONBOARDING.md` - Alex's complete onboarding guide
- `PLATFORM_RELIGION_TEMPLATE.md` - Religion document template
- `DEVELOPER_VETTING_TEMPLATE.md` - Vetting process template
- `BACKLOG_TEMPLATE.md` - Backlog format
- `DEVELOPER_PROMPT_TEMPLATE.md` - Assignment format
- `OPERATOR_PROMPT_TEMPLATE.md` - Validation prompt format

### External Resources:
- GitHub Codespaces: https://github.com/features/codespaces
- Firebase: https://firebase.google.com/
- OpenAI: https://chat.openai.com/

---

**Created**: October 2025  
**Framework**: Hello Alex Autonomous Development System  
**Version**: 1.0  
**License**: MIT (Use freely, build amazing things!)

**Welcome to the future of software development!** 🚀
