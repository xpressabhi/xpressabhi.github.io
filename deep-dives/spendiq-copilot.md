# SpendIQ Copilot: Guardrails, Evals, and Honesty for an Agent Over Enterprise Data

Most agent demos are theater: a model, a vector database, and a happy path. I wanted to build the opposite: an agent that touches **financial data** (vendors, contracts, purchase orders, invoices) and has to earn trust before it answers. SpendIQ Copilot was my submission for a 2-hour AI & Data Engineer take-home, and it became a good vehicle for the decisions that actually matter when an LLM sits between a user's question and a company's data.

Source: [github.com/xpressabhi/SpendIQ_Candidate](https://github.com/xpressabhi/SpendIQ_Candidate)

---

## What the agent does

Nimbus Retail Co. (fictional, ~$220M revenue) asks questions like *"What did we spend with Stratos Cloud over the last 12 months?"*, *"What's the notice period to exit Aperture SaaS?"*, and the interesting ones: *"Are there POs being split to dodge approval thresholds?"* — questions that need both structured tables **and** contract documents.

The architecture is deliberately boring:

```
CSVs + contracts (MD/PDF) ──► ingest ──► SQLite
                              ├── 5 normalized tables
                              ├── 7 anomaly-detection SQL views
                              └── FTS5 index (~80 doc chunks)
                                        │
                              LangGraph ReAct agent (5 tools)
                                        │
                              FastAPI /api/chat ──► chat UI with citations
```

Five tools: validated SQL, BM25 document retrieval, a safe arithmetic evaluator, date utilities, and fuzzy entity resolution. No embeddings, no vector DB, no microservices. Every deviation from boring had to justify itself.

---

## Decision 1: guardrails on agent-generated SQL — defense in depth

The riskiest thing in this system is the LLM writing SQL against financial tables. One layer is never enough, so the SQL tool stacks four:

1. **Prompt-level**: the schema summary is injected into the tool description so the model writes correct column names instead of guessing.
2. **Syntax-level validation**: exactly one statement, `SELECT`/`WITH` only, and a banned-keyword regex covering `PRAGMA`, `ATTACH`, and friends.
3. **Connection-level**: the agent runs against `file:...?mode=ro` — a read-only SQLite URI. Even if validation misses something, there is physically no write path.
4. **Test-level**: pytest asserts writes are rejected through the actual connection path, not just in theory.

The lesson generalizes: **constrain what the model *can do*, not just what you *ask it to do*.** A prompt saying "only read" is a hope; `mode=ro` is a fact.

## Decision 2: an AST-whitelisted calculator instead of `eval`

Agents are bad at arithmetic ("47 × 1,610 ÷ 12" will eventually come out wrong), so the standard move is a calculator tool. The naive implementation is `eval()`, which means the model can execute arbitrary Python.

Instead, the calculator parses expressions into a Python AST and walks it against a whitelist: numbers, the four operators, parentheses. Anything else — function calls, names, attributes — is rejected before execution, with a recursion depth cap for good measure. The test suite feeds it `__import__('os').system('ls')` and expects a refusal.

This is ~50 lines of code that removes an entire attack class. When someone later asks "what happens if a prompt injection tells the agent to run something?", the answer for this tool is: nothing can happen.

## Decision 3: BM25 over embeddings — fit the retrieval to the corpus

The obvious 2026 move is chunk → embed → vector DB. I went keyword-first and wrote down why: the whole document corpus is ~80 chunks (15 contracts + policies). At that size,

- BM25 over SQLite FTS5 is **deterministic** — same question, same chunks, every time;
- it's fully **offline** — no embedding API cost, latency, or rate limit in the loop;
- failure modes are legible: if a term doesn't match, you can see why.

FTS5 still bit me twice: hyphens inside query terms parse as column-filter syntax (`notice-period` is *not* a search for "notice-period"), and `snippet()` needs the right column index. Both gotchas are now documented in the design notes — the kind of thing only a build log catches.

An embeddings path remains the documented upgrade for when the corpus grows past what BM25 handles well. Choosing the simpler thing first — with a written exit ramp — beat reaching for infrastructure the data didn't need.

## Decision 4: determinism by construction

"What did we spend last quarter?" is unanswerable without knowing what "last quarter" means relative to the dataset. So a single reference date is baked into three places at once: the SQL views' date windows, the date-utilities tool, and the agent's system prompt. Relative-date questions resolve identically across runs, sessions, and demos — including edge cases like month-end arithmetic across February (leap-year-aware, tested).

Demo environments die when the model improvises. Anchoring time removed the biggest source of run-to-run surprise.

## Decision 5: an eval harness that survives LLM variance

A golden set where pass/fail depends on how chatty the model feels that day isn't an eval. The harness separates **what must be true** from **how it's phrased**:

| Check type | Example |
|---|---|
| `contains_all` / `contains_none` | answer must include "$494K", must not invent a vendor name |
| `count_near(N)` | accepts "47", "forty-seven", rejects "190" |
| `tool_used` | the split-PO question *must* hit the anomaly view |
| `source_cited` | contract answers must cite the actual contract ID |
| `llm_judge` | rubric-based grading for free-form quality, with fenced/waffled JSON parsing handled |

Then, because single runs flip on phrasing luck, every case runs **N times with majority voting**. The committed report: 14 cases across four difficulty tiers, all passing over 3 runs. And because graders have bugs too, the grader logic itself is unit-tested — including false-positive checks (an answer containing "190" must not satisfy `count_near(47)`).

This was also the piece built after the clock stopped. The 2-hour version answered questions; the eval harness made claims about them.

---

## Honesty as a feature

The system prompt forbids invented numbers, requires citations for document claims, and instructs the agent to ask a clarifying question when a vendor name is ambiguous rather than guess. The design notes carry a limitations section — no auth, in-memory checkpointer, FX rates not normalized — because a reviewer scoring "honesty higher than over-claiming" should find the warts listed, not hidden.

That turned out to be my favorite property of the whole build: an agent over enterprise data earns trust the same way engineers do — by being precise about what it knows, showing its work (tool calls and sources render as chips in the UI), and stating its limits up front.

**Stack:** Python 3.12 · uv · FastAPI · LangGraph (ReAct) · SQLite + FTS5 · pypdf · pytest
