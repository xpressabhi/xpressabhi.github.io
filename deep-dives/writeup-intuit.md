# ServiceNow Project Portfolio: Technical Writeup for Intuit Application

**Author:** Abhishek Maurya  
**Date:** August 2026  
**Target Role:** Staff/Principal Engineer — AI Platform, Developer Productivity, or Platform Engineering

---

## Executive Summary

Over my tenure at ServiceNow, I have architected and delivered **six major platform capabilities** spanning **AI-assisted development, low-code/no-code tooling, and internal developer productivity infrastructure**. These projects collectively impact **thousands of enterprise developers** building on the ServiceNow platform and demonstrate deep expertise in:

- **LLM-powered developer tooling** (Build Agent, App Summary Agent, ALA Release Documentation Agent)
- **Platform architecture & multi-team systems** (Agentic Developer Platform — 20+ skills, 20+ agents, 20+ teams)
- **Low-code/no-code product design** (Table Builder, Workspace Builder)
- **Measurable productivity outcomes** (90% reduction in task resolution, days→hours automation)

---

## Project 1: ServiceNow Build Agent — Autonomous AI Developer Companion

**Role:** Technical Lead / Platform Architect  
**Scope:** Core AI Platform — Now Assist for Creator suite  
**Impact:** Flagship GenAI feature enabling natural-language app development

### Problem
Enterprise developers spent weeks scaffolding applications — creating tables, business rules, ACLs, flows, and UI layouts manually. High barrier to entry for citizen developers; significant technical debt from duplicated schemas.

### Solution
Designed and delivered the **Build Agent** — an autonomous, multi-model AI agent that generates production-ready applications from natural language prompts.

### Technical Architecture
```
┌────────────────────────────────────────────────────────┐
│   Developer Interface (Studio, VS Code, Cursor, etc.)  │
└───────────────────────────┬────────────────────────────┘
                            │  Natural Language Prompt
                            ▼
┌────────────────────────────────────────────────────────┐
│        Orchestration Layer & Reasoning Engine          │
└───────────────────────────┬────────────────────────────┘
                            │  Context Request
                            ▼
┌────────────────────────────────────────────────────────┐
│  Instance Context & Discovery Layer (Metadata Search)   │
└───────────────────────────┬────────────────────────────┘
                            │  Live Instance Data
                            ▼
┌────────────────────────────────────────────────────────┐
│       LLM Gateway (Now LLM, Anthropic Claude, etc.)    │
└───────────────────────────┬────────────────────────────┘
                            │  Fluent Code / API Payloads
                            ▼
┌────────────────────────────────────────────────────────┐
│ Execution & Compilation Layer (Fluent API & Record API)│
└───────────────────────────┬────────────────────────────┘
                            │  Generated Artifacts
                            ▼
┌────────────────────────────────────────────────────────┐
│    Self-Healing Test Loop (Automated Test Framework)   │
└───────────────────────────┬────────────────────────────┘
                            │  Validated App
                            ▼
┌────────────────────────────────────────────────────────┐
│  Human-in-the-Loop Governance (Guardrails & Review)   │
└────────────────────────────────────────────────────────┘
```

### Key Innovations
| Capability | Technical Approach |
|------------|-------------------|
| **Conversational App Creation** | Multi-model LLM gateway (Now LLM + Anthropic Claude on AWS Bedrock) translates intent → Fluent API payloads |
| **Metadata-Aware Generation** | Pre-flight Metadata Search scans live instance (sys_dictionary, sys_db_object, ACLs) to reuse existing schemas, preventing duplication |
| **Autonomous Self-Healing** | ATF integration: runtime errors → stack trace capture → root-cause diagnosis → code rewrite → re-validation loop |
| **IDE-Agnostic** | Works in ServiceNow Studio, VS Code, Cursor, Windsurf, Claude Code, GitHub Copilot via ServiceNow SDK |
| **Governance-First** | Human-in-the-loop approval gate: all changes staged, visual diff presented, explicit approve required |

### Outcomes
- **Time-to-market:** Multi-week sprints → minutes for boilerplate generation
- **Code quality:** Eliminates schema duplication via live metadata indexing
- **Adoption:** Unified tooling across pro-code and low-code personas

---

## Project 2: ALA Release Lifecycle Documentation AI Agent & App Summary Agent

**Role:** Lead Architect  
**Scope:** Application Lifecycle Analytics (ALA) — Now Assist for Creator  
**Impact:** Automates release documentation for enterprise Change Advisory Boards (CAB)

### Problem
Release documentation consumed hours of manual effort per deployment: compiling diffs, writing human-readable release notes, packaging audit trails for compliance.

### Solution
Two complementary AI agents under the ALA framework:

| Agent | Focus | Output |
|-------|-------|--------|
| **App Summary Agent** | Full application architecture reverse-engineering | Architectural description, technical manifest (Markdown), Mermaid.js architecture diagrams |
| **ALA Release Documentation Agent** | Delta analysis between instance state & update set/branch | Delta change identification, human-readable release notes, CAB-ready deployment manifests |

### Technical Pipeline
1. **Change Tracking** — Live baseline index of application states
2. **Metadata Context** — References ServiceNow Supported Metadata Library for structural understanding
3. **Delta Computation** — Diffs update sets / repository branches against live instance
4. **Pipeline Ingestion** — Feeds Markdown summaries directly into AEMC (App Engine Management Center) governance gates

### Outcomes
- **Documentation time:** Hours → single click
- **Compliance:** Standardized manifests meet CAB requirements automatically
- **Accuracy:** Eliminates human error in release note generation

---

## Project 3: ServiceNow Table Builder — Unified Low-Code Data & Form Designer

**Role:** Product Engineer / Platform Lead  
**Scope:** App Engine — Core Platform UI  
**Impact:** Primary data modeling interface for all ServiceNow developers

### Problem
Legacy workflow required context-switching across 3+ disconnected tools: System Dictionary (fields), Form Designer (layouts), Client Scripts/UI Policies (display logic).

### Solution
**Table Builder** — Single unified canvas consolidating schema design, form layout, and display logic.

### Three Workspaces
| Workspace | Capability |
|-----------|------------|
| **Data Tab** | Spreadsheet view (grid editing) + Schema view (graph visualization of FK relationships, parent-child extensions) |
| **Forms Tab** | Drag-and-drop form builder with dot-walked fields from referenced tables |
| **Display Logic** | Embedded UI policies, client alerts, field requirements — no context switching |

### Premium (App Engine v2) Features
- **Integrated Micro-Flows** — Flow Designer triggers attached directly to table events
- **PDF Structural Extractor** — Ingests physical/digital forms → auto-maps to database schema
- **Ecosystem Binding** — Native integration with Workspace Builder & Flow Templates

### Outcomes
- **Developer velocity:** Single tool vs. 3+ legacy tools
- **Consistency:** Schema + form + logic co-located = fewer drift errors
- **Adoption:** Default entry point for all new App Engine applications

---

## Project 4: ServiceNow Workspace Builder — No-Code Digital Workspace Designer

**Role:** Platform Engineer  
**Scope:** App Engine — Experience Layer  
**Impact:** Citizen developer / business analyst primary UI customization tool

### Problem
Business analysts needed to customize agent workspaces (homepages, lists, record layouts) but lacked coding skills; UI Builder was too complex.

### Solution
**Workspace Builder** — No-code visual designer for three workspace zones:

| Zone | Customization |
|------|---------------|
| **Dynamic Homepages** | Drag-drop widgets: filters, visualizations, images, text blocks |
| **Role-Based Lists** | Filtered data grids per organizational role (fulfillers see only relevant records) |
| **Record Layouts** | Visibility control: form, Activity Stream, related lists, Playbooks, Response Templates, Agent Assist sidebar |

### Differentiation from UI Builder
| Attribute | Workspace Builder | UI Builder |
|-----------|------------------|------------|
| **Persona** | Citizen developers, analysts | Pro-code developers, UX architects |
| **Depth** | Predefined template zones | Full component/event/data binding control |
| **Speed** | Rapid scaffolding, guided framework | Granular, from-scratch freedom |
| **Interop** | One-click "Open in UI Builder" for advanced edits | N/A |

### Outcomes
- **Democratization:** Non-technical roles customize workspaces independently
- **Governance:** Constrained framework prevents breaking changes
- **Time-to-value:** Minutes vs. days for workspace iterations

---

## Project 5: Agentic Developer Platform (ADP) — Internal AI Engineering Infrastructure

**Role:** Founder / Platform Architect (Solo → 7-team rollout)  
**Scope:** Enterprise-wide developer productivity platform  
**Timeline:** **4 weeks** from concept to production  
**Scale:** **20+ Skills, 20+ Autonomous Agents, 20+ Teams, 7 Pilot Squads**

### Problem
Teams adopting Claude Code / MCP tooling faced: fragmented configs, no team context injection, manual setup drift, zero visibility into adoption/metrics.

### Solution
**ADP** — Multi-team, zero-friction bootstrap platform for AI-assisted engineering.

### Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│                      DEVELOPER WORKSTATION / MACBOOK                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                           Executes: sh install_platform.sh
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│           1. INITIALIZATION & PREREQUISITE VERIFICATION GATE           │
├────────────────────────────────────────────────────────────────────────┤
│  • Node.js & Tool Checks   • Claude Code Status   • Local User Configs │
│  • Git Connection Status   • Playwright Browser   • Extension Audits   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  2. MULTI-TENANT TEAM SELECTOR & ENGINE                │
├────────────────────────────────────────────────────────────────────────┤
│  • Create Net-New Team Profile    OR    • Select Existing Team Profile │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            3. CONTEXT ENRICHMENT & METADATA HARVESTING LAYER           │
├────────────────────────────────────────────────────────────────────────┤
│                        Team Setup Skill Execution                      │
│        ┌──────────────────────────┴──────────────────────────┐         │
│        ▼                                                     ▼         │
│  MCP Server Calls (APIs)                             User Guided Input │
│  [Fetches: Repo Paths, Feature Branches, SNOW Assignment Groups, Logs] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               4. PERSISTENT STORAGE & SYMLINKING ENGINE                │
├────────────────────────────────────────────────────────────────────────┤
│  • Writes /teams/<team_name>/config.json (Structured Metadata)         │
│  • Writes /teams/<team_name>/context.md  (Human-Readable Context)       │
│  • Symlinks Team Markdown Profile Directly Into: .claude/rules/        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         ┌────────────┴────────────┐
                         ▼                         ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│   5. AUTOMATIC RUNTIME       │       │     6. BACKGROUND OPERATIONS │
├──────────────────────────────┤       ├──────────────────────────────┤
│  • Claude Code Starts        │       │  • MacBook Cron Auto-Updates │
│  • Automatic Rules Injection │       │  • Git-Based Issue Telemetry │
└──────────────────────────────┘       └──────────────────────────────┘
```

### Core Components

| Component | Innovation |
|-----------|------------|
| **Zero-Friction Bootstrap (`install.sh`)** | Validates Node, Claude Code, MCP, Git, Playwright, extensions; auto-symlinks skills/agents/rules |
| **Multi-Tenant Team Context** | Team Setup Skill harvests context via MCP (repo paths, branches, assignment groups) + user input → dual-file storage (`config.json` + `context.md`) → auto-symlinked to `.claude/rules/` for automatic LLM context injection |
| **Playwright Automation Layer** | Bypasses missing APIs: UI test generation, headless browser debugging, dashboard scraping, console error extraction |
| **Lightweight GitHub Telemetry** | Privacy-first schema (user, folder, skills[], team, timestamp) → posted as GitHub Issues for adoption analytics; MacBook cron jobs auto-pull config patches |

### Measurable Outcomes
| Metric | Result |
|--------|--------|
| **Build Time** | 4 weeks (design → test → ship) |
| **Platform Scale** | 20+ Skills, 20+ Agents, 20+ Team Ecosystems |
| **Enterprise Rollout** | 7 pilot engineering squads onboarded with management partnership |
| **Productivity Gains** | 90% reduction in case task resolution time (Claude Code + MCP + skills repo) |
| **Automation Speed** | Days → hours (even for legacy codebases) |
| **Test Coverage** | Legacy codebase: 20% → 90% |
| **Defect Reduction** | External defects: 90% reduction, now single-digit across org |

---

### Cross-Cutting Platform Metrics & Impact

| Dimension | Before | After | Driver |
|-----------|--------|-------|--------|
| **Case Task Resolution** | Baseline | **90% faster** | ADP skills repo + Claude Code + MCP |
| **Automation Development** | Days | **Hours** | Build Agent + ADP custom tooling |
| **Legacy Code Coverage** | 20% | **90%** | Playwright automation + ADP test generation |
| **External Defects** | High volume | **Single-digit** | Self-healing ATF loop + metadata-aware generation |

---

## Technical Themes Demonstrated

| Theme | Evidence Across Projects |
|-------|-------------------------|
| **LLM-Native Architecture** | Build Agent (multi-model gateway, tool-calling), ADP (Claude Code + MCP), ALA Agents (Now LLM + Claude) |
| **Platform Governance** | Human-in-the-loop approval gates (Build Agent), admin-role restrictions (ALA), constrained frameworks (Workspace Builder) |
| **Metadata-Driven Development** | Build Agent Metadata Search, Table Builder Schema View, ADP context harvesting |
| **Self-Healing / Closed-Loop Systems** | Build Agent ATF loop, ADP Playwright debugging, ALA delta tracking |
| **Multi-Tenant / Enterprise Scale** | ADP (20+ teams), Build Agent (org-wide), ALA (CAB compliance) |
| **Developer Experience Obsession** | Zero-friction install, IDE-agnostic, no-code → pro-code continuum, automatic context injection |

---

## Relevance to Intuit

| Intuit Priority | My Direct Experience |
|-----------------|---------------------|
| **AI-Powered Developer Platforms** | Built Build Agent (flagship GenAI dev tool), ADP (internal AI platform at scale) |
| **Platform Engineering / Internal Tools** | ADP: 4-week build, 7-team rollout, telemetry, self-service onboarding |
| **Low-Code/No-Code Democratization** | Table Builder, Workspace Builder — designed for citizen developers |
| **Compliance & Governance at Scale** | ALA Release Agent (CAB manifests), Build Agent (approval gates), ADP (admin controls) |
| **Measurable Productivity Outcomes** | 90% task reduction, days→hours automation, 20%→90% coverage, single-digit defects |
| **Multi-Model LLM Integration** | Now LLM + Anthropic Claude (Bedrock) routing, tool-calling architectures, MCP |

---

## Appendix: Project Artifacts Reference

| Project | Source Document |
|---------|-----------------|
| ALA App Summary Agent | `servicenow/ala-App-Summary-Agent.md` |
| Build Agent | `servicenow/build-agent.md` |
| Table Builder | `servicenow/table-builder.md` |
| Workspace Builder | `servicenow/workspace-builder.md` |
| Agentic Developer Platform | `servicenow/sn-claude-skills.md` |
| Aggregate Metrics | `servicenow/generic.md` |

---

*This writeup is prepared for Intuit application purposes. All projects were delivered during tenure at ServiceNow. Metrics reflect measured outcomes from production deployments and pilot programs.*