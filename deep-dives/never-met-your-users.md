# Your AI writes code like it's never met your users

**Author:** Abhishek Maurya · Hyderabad, India
**Reading time:** ~7 min

---

## The wrong call

A payments app: React 19.2, a Node API, Postgres. The agent adds "Recent invoices" and picks cursor pagination for the 40-row settings table, a pool of 100 connections for twenty users, and a query that scans 40 million rows. It also builds on React 19.2 — a week after 19.3 shipped stable View Transitions that would make the invoice drawer feel instant.

None of these are dumb mistakes. They're correct answers to questions nobody asked. The agent never met your users, your data, or your 3 a.m. traffic. It met your prompt.

The real question isn't "more constraints or fewer?" It's how the agent learns what's true about your system — now, and again next month.

## Context files aren't the fix

AGENTS.md and CLAUDE.md say how to work — commands, formatting, what not to touch. They don't say what world you're building for. A controlled July 2026 study found that adding a context file didn't improve success for Claude Code or Codex; the failures were implementation judgment, not missing repository knowledge. [1]

Facts beat advice. "Never use offset pagination" is advice; "settings has 40 rows, invoices has 40 million" is a fact. And facts age: OpenAI's million-line project found long runs accumulate a "graveyard of stale rules." [2] Keep stable rules separate from current state, and update the state as work reveals it.

## What the evidence says

- Frontier models are good where the environment can score them — they solve most realistic coding and migration tasks they're tested on. [3]
- But scores can be gamed: one agent searched the web for answers during an evaluation where search was off. [4] Ask for transcripts, not just scores.
- OpenAI's research org runs 3.1 agent-workdays per human workday — but over half of successful 4–8 hour tasks needed a human intervention, and planning stayed mostly human. [5]
- Claude Code's default safety mode caught 89% of dangerous commands in a 1,053-person study; humans caught 13.6% — and got worse as sessions lengthened. [6]

Pattern: agents are excellent where the environment verifies, shaky where only your team knows.

## Which failures are fixable

**The environment can answer — give it instruments.** Stop writing rules; write checks.
- Query-per-row bugs (N+1): count queries in a test and assert a maximum. [7]
- Indexing: index for the queries that actually run; validate by measuring. [8]
- Connection pools: measure under load — too many connections make databases slower. [9]
- Partial uploads: abandoned multipart uploads cost money until cleaned up; test the abort path. [10]
- Graceful shutdown: Kubernetes waits ~30 seconds; finish in-flight work inside that window. [11]
- Performance: with a target ("slow tail under 200ms") the agent loops until it hits it. Without one, it guesses.

**Only your product knows — make it ask.** Protocol (REST, gRPC, WebSockets) [12], offset vs cursor pagination [13], Kafka vs outbox [14], isolation levels [15], under- or over-engineering — these have *your* answer, not a technical one. OpenAI's workflow has Codex write a plan and wait for approval before starting. [16] Asking isn't friction; it's leverage.

**Neither can answer yet — keep a human gate.** OpenAI's "warning shot": ~1,200 isolated agents built their own message board, shared credentials, and broke into third-party systems. Safeguards cut that behavior by 100×, but agents find paths nobody intended. [17] Agents can now hunt real vulnerabilities at scale [18] — but "can find bugs" isn't "can be trusted with irreversible actions."

## Keeping up: the world changes under you

React 19.3 shipped September 9 with stable View Transitions and Fragment Refs. [19] If next sprint's invoice drawer needs transitions, the right move is using 19.3 *in that feature* — if the upgrade is safe. Same for the Postgres driver, the Node runtime, the base image, the auth library. All readable: `package.json`, the lockfile, the changelog, advisories.

The hard part is hidden breakage: a 2026 study of 203 real dependency upgrades found agents solved only about half when a "minor" bump hid code changes. [20] Curated migration notes lifted success to 82–89%; dumping raw changelogs *lowered* it by 7–23 points. [21] More context was worse.

Machinery exists: Renovate opens update PRs with confidence signals [22]; Dependabot alerts can be assigned to coding agents that draft fixes and repair tests. [23] Patch and minor updates ride on green tests; majors get a short human plan.

## Who reviews when nobody reads the diff

Teams can't track AI's output anymore; the dominant answer is agents review, humans review the review. [24] Anthropic and OpenAI use risk-based gates: low-risk AI-only, high-risk human. One five-person team dropped line-by-line review for risk tiers and guardrails: merged PRs +94%, no-review merges in a median hour instead of 26. [24] Meanwhile a large study found static-analysis warnings up 18% and complexity up 39% after agent adoption. [25]

Don't read everything; agree what matters — auth, money, schema and migrations, anything irreversible, the load-bearing 5%. Tired humans approving prompts were *worse* than a classifier. Attention is a budget.

## The simple solution

1. **Tell it the facts once.** One file: users, traffic, data size, runtime, regions, budgets, what "fast enough" means, what must never happen.
2. **Let it look, don't let it guess.** Read-only logs, metrics, query plans, a load test it can run.
3. **Make it ask.** Missing facts become questions, not silent choices.
4. **Make it prove it.** Query counts, latency target, pool metrics, a shutdown test. "Done" means demonstrated.
5. **Keep it current.** Review dates on facts, scheduled dependency checks, agents preparing upgrades from curated notes, humans gating risk.

The file, next to AGENTS.md. Call it CONSTRAINTS.md — not a standard yet, a proposal. AGENTS.md says *how to work*; this says *what world you're building for*. [26]

```markdown
CONSTRAINTS.md — last reviewed: 2026-09-13

## Users & traffic
- 12k monthly users; peak ~40 req/s at 09:00 IST.
- Writes are payments — never lose one.

## Data
- invoices: 40M rows, +1M/month. settings: 40 rows.
- Query stats: `npm run db:stats` · Plans: `EXPLAIN ANALYZE`

## Runtime
- 3 × 2vCPU containers; Postgres 16 (4 vCPU).
- Pool size by load test: `npm run load:check`

## Dependencies & upgrades
- react 19.2.x → 19.3 available (View Transitions, Fragment Refs).
- Patch/minor after green tests; majors need a short plan + review.
- Weekly: Renovate PRs; security fixes within 7 days.
- Evidence: curated migration notes, not raw changelogs.

## Targets
- Slow tail under 200ms; error rate < 0.1%.

## Unknowns — ask, don't assume
- Regional expansion, retention policy.

## Verification
- Every change: query count, latency, shutdown test.
- Review monthly, or when traffic doubles.
```

One file, five habits: tell, look, ask, prove, keep current. Your agent writes code like it's never met your users — so introduce them, and keep the introduction current.

## Sources

1. [Context-file study](https://arxiv.org/abs/2607.27250) — Jul 2026
2. [OpenAI million-line project](https://www.mindstudio.ai/blog/openai-million-line-codebase-agents) — Aug 2026
3. [GPT-6 Astra](https://openai.com/index/gpt-6-astra/) — Sep 2026
4. [Agent searched the web mid-evaluation](https://aiinsiders.net/article/an-openai-coding-agent-used-curl-to-cheat-on-a-terminal) — Aug 2026
5. [Research acceleration inside OpenAI](https://openai.com/index/research-acceleration-view-inside-openai/) — Sep 2026
6. [Claude Code auto mode](https://claude.com/blog/auto-mode-default-in-claude-code) — Aug 2026
7. [Prisma: query-per-row](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
8. [Index-tuning study](https://arxiv.org/abs/2603.09181) — Mar 2026
9. [HikariCP pool sizing](https://github.com/brettwooldridge/HikariCP)
10. [S3 multipart uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
11. [Kubernetes pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
12. [gRPC vs REST](https://learn.microsoft.com/en-us/aspnet/core/grpc/comparison)
13. [AIP-158 pagination](https://google.aip.dev/158)
14. [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
15. [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
16. [OpenAI Codex workflow](https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex) — Aug 2026
17. [Hugging Face incident](https://openai.com/index/hugging-face-incident-and-the-road-ahead/) + [METR investigation](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/) — Aug 2026
18. [Gemini 3.8 Flash Cyber](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/) — Sep 2026
19. [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) — Sep 2026
20. [Dependency upgrades study](https://arxiv.org/abs/2608.30300) — Aug 2026
21. [Dependency repair study](https://arxiv.org/abs/2607.17957) — Jul 2026
22. [Renovate](https://github.com/renovatebot/renovate)
23. [Dependabot + agents](https://github.blog/changelog/2026-04-07-dependabot-alerts-are-now-assignable-to-ai-agents-for-remediation/) — Apr 2026
24. [Code review shift](https://newsletter.pragmaticengineer.com/p/what-is-happening-with-code-reviews) — Sep 2026
25. [Longitudinal agent study](https://arxiv.org/abs/2601.13597) — Jan 2026
26. [intent.md](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent)
