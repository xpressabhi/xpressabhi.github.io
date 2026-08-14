How We Turned Claude Code Into a Self-Improving AI Engineering Platform for Our Entire Organization
A deep dive into building a shared AI toolkit with 20+ skills, 20+ specialist agents, and safety guardrails - and what happened when we scaled it across 20+ teams in 4 weeks.

---

# The Starting Point
Four weeks ago, I started using Claude Code - Anthropic's AI coding assistant that runs directly in the terminal. Out of the box, it's remarkably capable: it reads your codebase, writes code, runs tests, commits changes. For individual tasks, it felt like a significant productivity boost.
But within the first few days, the cracks showed.
Every new Claude Code session started from zero. It didn't know our team's coding conventions. It didn't understand our product architecture. It had no awareness of which repositories mapped to which products, which test suites covered which features, or how our internal systems were structured. Every session, we found ourselves re-explaining the same context.
Multiply that across a team of engineers, and the inefficiency compounds. Engineer A discovers that Claude needs to be told about a specific API pattern. Engineer B discovers the same thing the next day. Engineer C the day after. The knowledge never persists. The learning never transfers.
We asked ourselves: What if we could give Claude Code permanent team context - so every engineer, every session, starts with expert-level knowledge?
What started as a simple configuration file turned into something much bigger: a fully programmable AI engineering platform with skills, agents, hooks, and a self-improving knowledge loop. Here's the full story.

---

## The Architecture: Everything as Code
The core design principle was simple: treat AI configuration the same way we treat application code. Version it. Review it in PRs. Share it across teams. Make it composable.
Here's what the system looks like:
```text
shared-ai-config/
├── skills/          → 11 skills (markdown + YAML frontmatter)
├── agents/          → 21 specialist agents (YAML definitions)
├── hooks/           → 7 guardrails (JSON, pre/post tool execution)
├── rules/           → Shared coding standards and conventions
├── teams/           → Team-specific context definitions
└── install.sh       → One-command installer
```
Skills are the user-facing capabilities. Each skill is a markdown file with YAML frontmatter that defines when it activates (trigger phrases) and what it does (prompt instructions). They activate automatically from natural language - no slash commands required, though those work too.
Agents are focused research specialists. Each agent is a YAML file with a name, description, and detailed instructions. They don't run on their own - skills orchestrate them, spawning multiple agents in parallel to tackle different aspects of a problem.
Hooks are guardrails that run before or after Claude executes any tool. They enforce safety rules silently and automatically - no human discipline required.
Rules are shared knowledge files that Claude loads every session. Team conventions, coding patterns, API usage guidelines.
Teams are context definitions. Each team directory contains a structured config (repos, products, test suites) and an enriched context file that gives Claude deep knowledge about that team's domain.
The entire system installs with one command. A Node.js installer symlinks everything into Claude Code's ~/.claude/ configuration directory, runs a team context wizard, auto-detects local repositories, and sets up all dependencies. Fifteen minutes from git clone to fully operational.

---

## The Skills: 11 Capabilities That Auto-Trigger
Every skill follows the same pattern: detect intent from natural language, gather context, orchestrate agents if needed, and deliver structured output. Here's each one in detail.
### 1. Deep Record Investigation
The problem it solves: When a bug ticket comes in, an engineer typically spends 1–3 hours gathering context - searching the codebase, checking knowledge base articles, looking for similar past issues, reading log files, tracing the problem to related tickets. It's tedious, repetitive, and error-prone.
How it works: Say "investigate this bug" or paste a ticket reference. The skill detects the ticket type from the identifier format, determines which agents to spawn based on the ticket type, and launches up to 10 parallel research agents:
Code Searcher - greps all team repositories for code related to the issue
Knowledge Base Searcher - searches internal KB articles for similar problems
Similar Resolved Records - finds past issues that were resolved with accepted solutions
Cross-Reference Extractor - extracts references to related tickets from text fields
Related Records Explorer - navigates parent/sibling relationships for richer context
Origin Tracer - traces the bug back to its originating customer case
Attachment Processor - downloads and analyzes log files, screenshots, and XML exports
Documentation Searcher - fetches relevant product documentation

All agents run simultaneously. Each has strict output caps (60–120 lines) to prevent runaway analysis. When they complete, the skill merges their findings into a structured report: root cause analysis, similar past resolutions, affected code paths, and draft response notes.
The impact: 2–3 hours of manual research → 3–5 minutes of automated parallel investigation. And because it searches systematically, it often finds connections that a human would miss - like a similar bug resolved six months ago by a different team.
### 2. Knowledge Explorer
The problem it solves: Engineers constantly need to understand how things work - a specific API, a subsystem they've never touched, a feature they're extending. The information exists somewhere: in the codebase, in documentation, in knowledge base articles. But finding it means searching across multiple systems with different interfaces.
How it works: Ask any question - "how does commit validation work?" or "find docs about the export API." The skill searches three dimensions in parallel:
Code search - grep across all team repositories with context-aware patterns
Knowledge base search - internal articles with relevance scoring
Documentation search - product docs with scoped queries

It supports flags for scoped searches: --code for code only, --docs for documentation only, --learn for deep-dive onboarding mode that builds a comprehensive understanding of a subsystem.
The key differentiator: it reads the team context file to know which repositories the team owns, which products map to which code paths, and which keywords identify which components. A generic search would drown in noise. This one searches with purpose.
### 3. Test Suite Health Analysis
The problem it solves: Test suites degrade silently. Flaky tests get ignored. Regressions hide in noise. Nobody has time to analyze trends across dozens of test profiles.
How it works: The skill queries test execution data, analyzes pass/fail trends, detects flapping tests (tests that alternate between pass and fail), and surfaces regression alerts. It supports a --blame mode that cross-references test failures with recent code changes and classifies each failure:
Code Regression - a recent change broke this test
Infrastructure - environment issue, not a code problem
Flapper - inherently unstable test that needs fixing
Test Bug - the test itself is wrong
Known Issue - already tracked in the bug tracker

### 4. Holistic Test Gap Analysis
The problem it solves: Most teams know they have testing gaps but can't quantify them or prioritize which gaps matter most.
How it works: Spawns three parallel agents:
Test Inventory Agent - catalogs every existing test (unit, integration, UI, manual, automated)
Defect Hotspot Agent - identifies high-risk areas from bug history and support volume
Codebase Gap Analyzer - finds untested source files and partially covered modules

The skill correlates these three datasets: areas with high defect rates AND low test coverage get flagged as critical gaps. The output is a risk-prioritized implementation plan saved as a local report file.
### 5. Test Automation Generator
The problem it solves: Writing automated tests from manual test cases is time-consuming and repetitive. The test logic already exists in the manual case - it just needs to be translated into code.
How it works: Give it a test case identifier. The skill reads the manual test case definition, walks through the steps on a live instance to understand the actual UI/API behavior, generates test code from templates, runs the test, and enters an iterative fix loop - if the test fails, it analyzes the error, adjusts the code, and retries. Supports three test types:
Playwright UI tests - browser automation with page object patterns
JavaScript unit tests - NowUnit + GRiT framework
Java integration tests - JUnit + Mockito

The iterative fix loop is the secret weapon. Instead of generating a test and hoping it works, the skill keeps refining until it passes - or reports exactly why it can't.
### 6. Structured Code Review
The problem it solves: Code reviews are inconsistent. Different reviewers focus on different things. Important patterns get missed. Context from related tickets isn't considered.
How it works: Supports three modes:
Local changes - review uncommitted work before pushing
PR review - fetch a pull request by number, analyze the diff
Cross-repo PR - review PRs in other repositories

The skill deploys a specialist code review agent that evaluates: security patterns (injection, auth, access control), code quality (complexity, duplication, error handling), and team conventions (naming, API usage, test coverage). If ticket references are provided, it correlates the changes with the ticket's requirements and flags gaps.
### 7. Self-Improving Knowledge Loop
The problem it solves: Engineers discover things about the codebase, make corrections to Claude's behavior, find better patterns - but these discoveries evaporate when the session ends.
How it works: The skill gathers signals from past sessions - corrections, error patterns, successful strategies - classifies them by which skill/agent/rule they affect, and writes the insights directly into the target files. It's not a separate knowledge base; the learnings are inlined into the tools that use them.
This is the mechanism that makes the system self-improving. Every correction by any engineer eventually benefits everyone.
### 8. Team Context Discovery
The problem it solves: Setting up AI tooling for a new team usually means hours of manual configuration - listing repositories, defining products, mapping test suites.
How it works: Automated discovery pipeline:
Prompt for team assignment group
Query systems for products owned by that group
Multi-select relevant products
Spawn enrichment agents that scan repos, discover code paths, map test directories, build keyword indexes
Write a rich context file that Claude loads every session

New team members run the same installer, pick their team from the list, and inherit everything - zero-prompt onboarding.
### 9. Story Implementor
The problem it solves: Taking a user story from requirements to deployed, validated code involves many manual steps - reading acceptance criteria, implementing changes, deploying, verifying each criterion.
How it works: Give it a story identifier. The skill fetches acceptance criteria, creates an implementation plan, makes all code changes, deploys to a live instance, validates each acceptance criterion on the running system, and reports completion with evidence. End-to-end, from ticket to verified deployment.
### 10. Browser Automation
The problem it solves: Many engineering tasks require interacting with web applications - filling forms, navigating UIs, taking screenshots for documentation, extracting data.
How it works: A full Playwright-based browser automation skill accessible via natural language. Navigate pages, click elements, fill forms, take screenshots, manage tabs, handle cookies and state, mock network requests. No test framework boilerplate needed - just describe what you want to do.
### 11. Release Confidence Builder
The problem it solves: Before a release, teams need confidence that test coverage is sufficient. But identifying what's missing and writing the tests is a manual slog.
How it works: Analyzes the codebase and bug tracker to find missing test scenarios, then writes tests iteratively - aiming toward 100% effective coverage. Explores existing test infrastructure, resources, and setup patterns in the codebase so generated tests fit naturally alongside existing ones.

---

## The Agents: 21 Focused Specialists
Agents are the workhorse of the system. Unlike skills (which are user-facing), agents are internal components that skills orchestrate behind the scenes. Each agent is a single-purpose research specialist.
Why agents instead of one big prompt?
Three reasons:
Parallelism. Ten focused agents running simultaneously deliver results faster than one agent trying to do everything sequentially.
Quality. A 60-line output from a focused agent is more reliable than extracting one aspect from a 600-line omnibus response. Each agent has a clear success criteria and output format.
Composability. Different skills reuse the same agents. The code searcher agent is used by investigation, knowledge exploration, and test strategy. Write it once, improve it everywhere.

The 21 agents break down into functional groups:
Investigation agents (10): Code searcher, internal KB searcher, external KB & docs searcher, documentation fetcher, similar resolved records finder, cross-reference extractor, related records explorer, origin tracer, attachment processor, and a general-purpose searcher.
Test agents (5): Similar test executions finder, test result classifier, test inventory cataloger, defect hotspot identifier, and codebase gap analyzer.
Review agent (1): Multi-dimensional code reviewer covering security, quality, and conventions.
Team discovery agents (5): Repository scanner, repository discoverer (via PR history), keyword generator, group discoverer, and product enricher.
Each agent YAML file contains detailed instructions, output format requirements, and strict caps. Here's the key pattern: agents receive their full context in the launch prompt. They don't need to ask follow-up questions or gather their own context - the orchestrating skill does that before spawning them.

---

## The Hooks: 7 Silent Guardrails
Hooks are the safety layer. They run automatically before or after Claude executes any tool - the engineer doesn't need to remember them, enable them, or think about them.
### Pre-Tool Hooks (4 - run before Claude acts)
Protected branch push warning - Detects git push to main/dev branches and warns. Allows the push but ensures the engineer is aware.
Force push blocker - Detects git push --force and blocks it entirely. This is a hard block, not a warning. Force pushing to shared branches risks losing other engineers' work.
Random file blocker - Prevents creating documentation files outside approved directories. Claude sometimes wants to create helper .md files in random locations - this keeps the repository clean.
Protected branch commit warning - Warns before committing directly to protected branches. Team convention is to use feature branches.

### Post-Tool Hooks (3 - run after Claude acts)
PR URL logger - After creating a pull request, extracts and logs the PR URL for easy access.
Secure API enforcer - Checks generated code for insecure API usage patterns. Flags when a generic API is used instead of its secure variant, or when deprecated logging methods appear in edits.
Query safety checker - Detects database queries missing pagination limits. Without limits, a query can return millions of records and crash the application.

Why hooks matter at scale: When one engineer uses AI tooling, mistakes are localized. When 50 engineers use AI tooling, the same mistake happens 50 times. Hooks enforce consistency at the organizational level - every session, every engineer, every command. No training required.

---

## The Self-Improving Loop
This is the feature that generates compounding returns. Here's how it works:
Signal collection: As engineers work, they make corrections - "don't use that API, use this one," "our convention is X not Y," "this repo is structured differently than you assumed." These corrections are captured as signals.
Classification: The /enhance-skills command gathers all signals and classifies them: which skill does this insight apply to? Which agent? Which rule? Is it team-specific or universal?
Application: Insights are written directly into the target files. Not into a separate knowledge base that might get stale - into the actual skill, agent, or rule definition that will be read on the next invocation.
Distribution: Because everything is in a shared git repo, a git pull gives every engineer on every team the latest improvements. An insight discovered by one engineer on Monday is available to every engineer by Tuesday.
The compounding effect: After four weeks, we can see clear improvement in Claude's first-attempt accuracy. Conventions that required correction in week one are now followed automatically. Patterns that engineers had to explain repeatedly are now baked into the system. And every new team that adopts the system inherits all of these accumulated improvements from day one.

---

## Team Onboarding: From Zero to Productive in 15 Minutes
The onboarding flow is designed for zero friction:
Step 1: Install - Clone the repo, run ./install.sh. The installer checks prerequisites, runs a team wizard (pick an existing team or create a new one), auto-detects local repositories, creates symlinks, and sets up all dependencies. This is fully automated.
Step 2: Authenticate - Load the browser extension, log into the relevant systems in Chrome. Auth works via browser cookie capture - no manual credential configuration needed for basic functionality.
Step 3: Enrich - Run /team-setup once. The skill auto-discovers team context: scans repositories, queries for products and test suites, builds keyword maps, and writes a rich context file.
Step 4: Use - Start typing naturally. All 11 skills auto-trigger from context.
When a new engineer joins a team that's already set up, they skip Step 3 entirely - the team context already exists. They install, authenticate, and start working with full team awareness.
We've now onboarded 5+ teams through this process. The fastest onboarding was under 10 minutes, including the install. No team has needed more than 20 minutes.

---

## Results After 4 Weeks
Quantitative:
Investigation time: 2–3 hours → 3–5 minutes (parallel agents)
New engineer ramp-up: days of tribal knowledge transfer → immediate context from first session
Team adoption: 1 team → 5+ teams with zero custom code per team
Total components: 11 skills, 21 agents, 7 hooks - all shared and improving

Qualitative:
Engineers report feeling "unblocked faster" - the investigation and knowledge explorer skills eliminate the most tedious parts of debugging
Code review consistency improved - the same standards applied every time, not dependent on which reviewer is available
New team members contribute meaningful code changes on day one instead of spending the first week understanding the codebase
The self-improving loop creates a positive feedback cycle - the more the system is used, the better it gets

---

## Lessons Learned
1. Treat AI configuration as a first-class engineering artifact
Version it. Review it in PRs. Test it. Document it. The moment you treat prompts and agent definitions as disposable, you lose the compounding benefit.
2. Parallelism beats intelligence
Ten focused agents running simultaneously produce better results than one brilliant agent working sequentially. Decomposition is the key to reliability.
3. Safety must be automatic
You cannot rely on engineers remembering to check for insecure patterns or avoiding force pushes. Hooks that run silently on every action are the only reliable safety mechanism at scale.
4. Zero friction is non-negotiable
If onboarding takes more than 15 minutes, adoption stalls. One command, one wizard, done. No forking, no custom code, no per-engineer configuration.
5. Self-improvement is the multiplier
Individual productivity gains are linear. A self-improving system that captures every engineer's discoveries and distributes them to everyone creates exponential returns. After 4 weeks, the system knows things no individual engineer knew.

---

## What's Next
We're continuing to build new skills and agents based on team requests. The architecture is designed to be extensible - adding a new skill is creating a markdown file in a directory. Adding a new agent is creating a YAML file. The installer picks them up automatically.
The long-term vision: a shared AI engineering platform where every correction by any engineer on any team improves the system for everyone. Not just better prompts - a better system.

---

Claude Code is developed by Anthropic. The architectural patterns described in this article - skills, agents, hooks, and team context - are built on Claude Code's extensibility features. The specific implementation is our team's work.
#ClaudeCode #Anthropic #AIEngineering #DeveloperProductivity #SoftwareEngineering
