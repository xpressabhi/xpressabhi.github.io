# Make it work. Then keep it working.

**Author:** Abhishek Maurya · Hyderabad, India
**Reading time:** ~8 min

---

## The gap

Every AI coding demo works. The failures start after: the agent paginates a forty-row table with cursors, sizes a database pool for twenty users at a hundred connections, swallows an error to keep the tests green, and ships a migration that locks a table nobody mentioned was hot.

None of those are model failures. They're missing-world failures. The agent never met your users, your data, or your 3 a.m. traffic — and nobody told it what happens after the merge button.

I spent the last few months collecting how this shows up. Same root cause every time — and one fix that covers most of it.

## Where it actually breaks

**1. Decisions with no technical answer.** REST, gRPC, or WebSockets? Offset or cursor pagination? Kafka or the transactional outbox? Read Committed or Serializable? Each has a right answer for *your* product and no right answer in general. Agents answer anyway. A controlled study this year found that adding a project context file didn't improve task success — the failures were judgment, not missing repository knowledge. [1]

**2. Data and schema.** Agents treat production like a dev database: a reset command, a `DELETE` without `WHERE`, a migration that queues a lock behind one long-running query. Teams have watched an agent drop 22 tables in ten minutes; GitHub itself lost 55 minutes to a routine schema migration on a hot table. Parallel agents make it worse — three schema changes that each pass alone can be incompatible together. [2][3][4][5][6]

**3. Runtime behavior.** New Relic's 2026 study of technology leaders found 78% report production-incident spikes tied to AI code, with roughly 1.7× more critical runtime issues — models "understand the source, but are blind to the trace." Retries, timeouts, graceful shutdown, and swallowed exceptions are where that blindness bites. [7]

**4. Scale and cost.** A pool of 100 for twenty users doesn't fail today; it fails at 3 a.m. next quarter. CloudBees' 2026 survey found 81% of enterprises hit production failures from AI-written code, and 70% now say maintaining tests is harder than writing code — while infrastructure and CI costs climb with the volume. [8]

**5. Security and compliance.** AI co-authored commits leak secrets at twice the human rate. Researchers at Black Hat 2026 showed that a single GitHub issue could reach CI secrets inside the vendors' own agent tooling — and that instruction files like AGENTS.md can carry attacker content between agent runs. Then OpenAI's "warning shot": roughly 1,200 agents built their own message board and broke into third-party systems. [9][10][11]

**6. Codebase coherence.** Duplicated code is up 81% since 2023; error-masking constructs up 47%; cross-file reuse down 35% — so new code inherits none of your shared timeouts, retries, or metrics. A fresh paper names the pattern: locally valid, globally incoherent patches that pass tests and static analysis, then break in production. [12][13]

**7. Dependencies and drift.** New versions are opportunities, not chores — React 19.3 shipped stable View Transitions that your next screen could use. [21] But drift bites back: a study of 203 real dependency upgrades found agents solved just over half when a "minor" version hid code-level changes. [14][15]

**8. Verification and trust.** Two-thirds of developers name "almost right, but not quite" as their top AI frustration. In Anthropic's own testing, humans clicking permission prompts caught 13.6% of dangerous commands; the classifier caught 89%. Teams can't read everything, and pretending otherwise fails silently. [16][17][18]

## Why it keeps happening

Rules don't fix judgment. A prompt file is advice; the agent weighs it against everything else and, under pressure, reasons past it. Rules also rot — "graveyard of stale rules" is how one OpenAI build described its master instruction file after a long run. [20] And agents don't ask enough: more than half of successful 4–8 hour tasks in OpenAI's research org still needed a human intervention. [19]

## The one fix: CONSTRAINTS.md

Every pain point above is a missing fact about the real world — or a missing mechanism to keep that fact true. One short file handles the first half; five habits handle the second.

The file answers one question: **before writing code, what should I understand about this problem?** AGENTS.md says *how to work*; CONSTRAINTS.md says *what to understand before you start*.

| Pain | What the file states | How it's proven |
|---|---|---|
| Decisions with no answer | defaults + "ask, don't assume" list | plan approval |
| Data and schema | row counts, hot tables, safe-migration rules | dry runs, lints, human gate |
| Runtime behavior | retry, timeout, drain expectations | shutdown test, telemetry |
| Scale, latency, cost | traffic, latency targets, budgets | load test, metrics |
| Security and compliance | secrets policy, never-touch rules | scanners, read-only access |
| Coherence | architecture map, "reuse the wrappers" | lints, review |
| Dependencies | version policy, upgrade cadence | scheduled PRs, CI |
| Trust | what gets human review | risk tiers |
| Human capacity | team size, on-call, deadlines | operable by one person |

The file sets the stage; a workflow runs on it. Before writing anything, the agent investigates:

1. "Here's what we need — what's ambiguous?"
2. "What are we assuming?"
3. "What could fail in production?"
4. "Give me three options, and the tradeoffs I'm underestimating."
5. "Attack the option I prefer."

Only then: **"Now implement it."** That sequence turns plan approval into a checklist — and it's how OpenAI's internal Codex workflow runs: plan first, wait for review, then build. [23]

```markdown
CONSTRAINTS.md
Purpose: before writing code, what should I understand about this problem?
Last reviewed: 2026-09-13

## Users & traffic
- 12k monthly users; peak ~40 req/s at 09:00 IST.
- Writes are payments — never lose one.

## Data & schema
- invoices: 40M rows, +1M/month (hottest table). settings: 40 rows.
- Payments must be strongly consistent; dashboards may lag by minutes.
- Never run destructive commands or resets against production.
- Migrations: dry run, lock timeout, expand-and-contract on hot tables.

## Runtime
- 3 × 2vCPU containers; Postgres 16 (4 vCPU). Pool size by load test.
- In-flight requests must drain within 30s on shutdown.
- Runs on existing k8s + managed Postgres; no new services without approval.

## Dependencies & upgrades
- react 19.2.x → 19.3 available (View Transitions, Fragment Refs).
- Patch/minor after green tests; majors need a short plan + review.
- Curated migration notes, not raw changelogs.

## Targets & cost
- p95 < 200ms on the busiest endpoints; error rate < 0.1%.
- Infra budget: no paid services or a broker without asking.

## Team & timeline
- 4 engineers, one on-call rotation; anything shipped must be operable at 3 a.m. by one person.
- Launch date is fixed; no risky migrations inside freeze windows.

## Security & compliance
- No production credentials in agent or CI environments.
- Secrets never in code, configs, or logs; scan every PR.

## Decisions — ask, don't assume
- Protocol, pagination, queue choice, isolation levels.
- Unknowns: regional expansion, retention policy.

## Verification
- Every change: query count, latency target, shutdown test.
- Review this file monthly, or when traffic doubles.
```

Five habits keep it alive: **tell** it the facts once, **look** with read-only access to logs and metrics, **ask** when a fact is missing, **prove** it with checks, and **keep** the file current as versions and traffic change. Tools like Renovate and Dependabot can run the upgrade loop for you; curated migration notes beat raw changelogs. [15][22]

Some things stay human: security decisions, irreversible actions, and taste. No file fixes those.

Make it work first. Then make it keep working.

## Sources

1. [Context-file study](https://arxiv.org/abs/2607.27250) — Jul 2026
2. [Prisma: agent-safe database guardrails](https://www.prisma.io/blog/stop-your-ai-agent-dropping-your-database) — Jul 2026
3. [Preventing agents from dropping production databases](https://www.bytebase.com/blog/how-to-prevent-ai-agent-from-dropping-your-production-database/) — Sep 2026
4. [AI agent wiped production database: guardrails](https://outpostqa.com/resource-hub/qa-automation-cicd/ai-agent-wiped-production-database/) — Jul 2026
5. [AI migrations that lock production tables](https://reptile.haus/journal/ai-generated-database-migrations-locking-production-2026/) — Aug 2026
6. [Parallel AI agents merging schemas](https://dataplatformadvisory.com/blog/2026/08/15/parallel-ai-agents-schema-migration-review-gap/) — Aug 2026
7. [New Relic: State of AI Coding 2026](https://newrelic.com/blog/ai/state-of-ai-coding-2026) — Jun 2026
8. [CloudBees: State of Code Abundance 2026](https://www.cloudbees.com/newsroom/enterprise-technology-leaders-report-production-failures-from-ai-generated-code) — May 2026
9. [GitGuardian: State of Secrets Sprawl 2026](https://nhimg.org/the-state-of-secrets-sprawl-2026) — Mar 2026
10. [CSA: CI/CD secrets exposed via AI coding agents](https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/08/CSA%5Fresearch%5Fnote%5Fai%5Fcoding%5Fagent%5Fcicd%5Fsecrets%5F20260808-csa-styled.pdf) — Aug 2026
11. [Hugging Face incident](https://openai.com/index/hugging-face-incident-and-the-road-ahead/) + [METR investigation](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/) — Aug 2026
12. [AI-generated code incidents: the 2026 data](https://www.pagerly.io/blog/ai-generated-code-incidents-2026-data-2026-08-30) — Aug 2026
13. [The Patchwork Problem in LLM-generated code](https://www.alphaxiv.org/abs/2607.08981) — Jul 2026
14. [Dependency upgrades study](https://arxiv.org/abs/2608.30300) — Aug 2026
15. [Dependency repair study](https://arxiv.org/abs/2607.17957) — Jul 2026
16. [Stack Overflow developer survey: AI](https://survey.stackoverflow.co/2025/ai) — 2025
17. [Claude Code auto mode](https://claude.com/blog/auto-mode-default-in-claude-code) — Aug 2026
18. [What is happening with code reviews](https://newsletter.pragmaticengineer.com/p/what-is-happening-with-code-reviews) — Sep 2026
19. [Research acceleration inside OpenAI](https://openai.com/index/research-acceleration-view-inside-openai/) — Sep 2026
20. [OpenAI million-line project](https://www.mindstudio.ai/blog/openai-million-line-codebase-agents) — Aug 2026
21. [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) — Sep 2026
22. [Renovate](https://github.com/renovatebot/renovate) + [Dependabot with coding agents](https://github.blog/changelog/2026-04-07-dependabot-alerts-are-now-assignable-to-ai-agents-for-remediation/) — Apr 2026
23. [OpenAI Codex workflow](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex) — Aug 2026
