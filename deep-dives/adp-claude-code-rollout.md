# We rolled Claude Code out to 20+ enterprise teams in 4 weeks and cut debugging effort 95%

**Author:** Abhishek Maurya — Staff SWE, ServiceNow · Hyderabad, India
**Reading time:** ~6 min

---

## The problem: everyone was quietly building their own agent stack

By 2025, every team in our org had someone experimenting with Claude Code. Prompts lived in private dotfiles, MCP servers were duplicated across repos, and nobody measured anything. Adoption stalled because onboarding took days and results were inconsistent. The models weren't the bottleneck — the missing layer was everything around them: bootstrap, context, governance, and telemetry.

## What ADP is (and isn't)

The Agentic Developer Platform (ADP) is a multi-team bootstrap and governance layer for Claude Code, MCP servers, agents, and skills. It's not a model wrapper — it's infrastructure:

1. **An install gate.** One script verifies prerequisites (Node, Claude Code, git, browser tooling, local configs) and fails loudly with actionable messages. Teams stopped opening "it doesn't work" tickets.
2. **Metadata harvesting.** On first run, the platform calls MCP servers and internal APIs to fetch what actually matters for a team's work: repo paths, feature branches, assignment groups, environments. It writes a team profile (`config.json` + human-readable `context.md`) that every agent inherits. Context quality is the single biggest lever on output quality.
3. **A shared registry of skills, agents, and MCP servers.** 20+ skills, 20+ agents — versioned, reviewed, and inherited with zero manual config. New squads get a working setup in a single session.
4. **Governance + telemetry.** Rules for what agents may touch, in which environments, with what approvals. Metrics on adoption, cost, and outcomes — because "vibes" don't survive contact with procurement.

## The hard parts

- **Loop guards.** We let agents self-heal on validation failure (retry with schema + error context injected), but with hard retry caps and cost budgets. Runaway autonomy is worse than a clean handoff to a human.
- **Legacy codebases.** The surprising win: agents that could safely write and run tests lifted legacy test coverage from 20% to 90%. Automation that took days now takes hours.
- **Culture.** The biggest resistance wasn't technical. We ran onboarding sessions that got a team from zero to working agents in one sitting — the demo, not the docs, did the selling.

## The numbers

- **−95%** research and debugging effort on MCP-driven workflows
- **−90%** case task resolution time
- **−90%** external defects
- **20% → 90%** legacy test coverage on pilot squads
- **4 weeks** from concept to production; 7 pilot squads → 20+ teams

## What I'd do differently

1. **Build the eval harness first.** We measured accuracy retroactively from user reports. A regression suite of representative tasks, scored weekly, would have caught regressions before users did.
2. **Telemetry from day one.** We retrofitted it. Cost and outcome data would have made the governance conversations ten-minute meetings instead of week-long debates.
3. **Ship the starter kit publicly.** Most of the platform's value is the boring scaffolding. If I'd open-sourced a sanitized version earlier, we'd have learned from other orgs instead of in isolation.

---

I'm a Staff engineer focused on AI agents, MCP tooling, and agentic platforms. If your team is scaling Claude Code past the pilot phase, I'd love to compare notes — my email is in the profile. If you're hiring for this kind of work, even better.
