# [turbo-fieldfare](https://github.com/drumih/turbo-fieldfare)

# Running Local LLMs on Apple Silicon: Ollama, MLX, and Memory-Efficient Inference

Running serious models locally on a MacBook M1 used to mean one thing: the entire model must fit in RAM. My setup changed when I started combining **MLX-optimized models served through Ollama** with a memory-efficient loader like **turbo-fieldfare** that only loads the parts of the model it is actively using. The result: a 26B-parameter model — Gemma 4 26B — running under 2GB of RAM on an M1, where the conventional approach needs 13–16GB or more just for weights.

---

## 🚀 Why Run Models Locally at All?

* **Privacy:** Prompts and code never leave the machine — no data shipped to a third-party API.
* **Offline & air-gapped work:** Full agentic workflows that keep working with no network.
* **Zero marginal cost:** Unlimited experimentation, no per-token billing, no rate limits.
* **Hands-on LLM depth:** Running inference yourself builds real intuition for context windows, quantization, and memory behavior that API-only developers miss.

---

## 🏗️ The Stack: Ollama + MLX-Category Models

On macOS the sweet spot is **MLX** — Apple's MLX framework produces model builds specifically optimized for Apple silicon (M1/M2/M3+), taking advantage of the unified memory and GPU. My daily drivers are **Qwen 3.5**, **Gemma 4**, and **DeepSeek-R1** — all run as MLX-category models through **Ollama**, which handles model downloads, the local inference server, and an OpenAI-compatible API out of the box.

```text
┌───────────────────────────────────────────────┐
│            Your Tools / Agent Stack           │
│   (CLI, editors, scripts, agent frameworks)   │
└───────────────────────┬───────────────────────┘
                        │  OpenAI-compatible API
┌───────────────────────▼───────────────────────┐
│                  Ollama Server                │
│   model management · quantization · serving   │
└───────────────────────┬───────────────────────┘
                        │  MLX-category weights
┌───────────────────────▼───────────────────────┐
│            Apple silicon (M1+) unified RAM     │
│   Qwen 3.5 · Gemma 4 · DeepSeek-R1            │
└───────────────────────────────────────────────┘
```

### Quick Setup (Ollama)

1. Install Ollama: `brew install ollama` (or the macOS installer from [ollama.com](https://ollama.com)).
2. Pull the MLX-category builds of your models of choice:
   `ollama pull <model>` — e.g. Qwen 3.5, Gemma 4, or DeepSeek-R1 variants.
3. Run and chat: `ollama run <model>`.
4. Use the local API from any agent or script — it speaks the OpenAI-compatible protocol at `localhost:11434`, so switching between local and hosted models is a base-URL change.

---

## 🧠 The Memory Wall: Full-Load Inference

Here is where conventional local runners hit a wall. **Ollama loads the entire model into RAM** before inference starts — weights, KV cache, and context all resident in memory. The math is unforgiving:

* A 26B-parameter model needs roughly **13–16GB of RAM for weights alone** at 4-bit quantization.
* Add the KV cache and overhead, and a 26B model demands a 32GB machine to be comfortable.
* On an 8GB or 16GB MacBook M1, that rules out everything above ~8B comfortably — and even those fight with the OS for memory.

The classic answer is "buy more RAM." There is a better one: **stop loading what you are not using.**

---

## ⚡ turbo-fieldfare: Load Only What You Use

[turbo-fieldfare](https://github.com/drumih/turbo-fieldfare) is a Rust-based local LLM runner that takes a fundamentally different approach: instead of mapping the whole model into RAM up front, it **loads only the portions of the model needed for the current inference step**, keeping the rest on disk and streaming it through on demand.

* **Gemma 4 26B under 2GB RAM on an M1** — a model that full-load runners can barely fit on a 32GB machine, running on a laptop with a fraction of the memory.
* **Same model, far smaller footprint** — swap the runner, not the model.
* **Trade-off is speed, not quality** — because the weights themselves are identical, the output quality is unchanged; you exchange peak throughput for memory headroom.

```text
Ollama (full-load):      ── 13–16 GB RAM for 26B ──  everything resident
turbo-fieldfare:         ── < 2 GB RAM for 26B ──   layers streamed on demand
```

### Setup & Usage

1. Clone the repo and follow its README for the install steps: `git clone https://github.com/drumih/turbo-fieldfare`.
2. Point it at the same model files you already use with Ollama.
3. Run inference — the loader handles mapping the weights and streaming only the active layers through memory.
4. Wire it into your agent stack the same way: it exposes a local endpoint your scripts and agents can call.

---

## 🎯 When to Reach for Which

| Scenario | Runner |
| :--- | :--- |
| Small/medium models (≤8B), fastest possible local chat, plugin ecosystem | **Ollama** (full-load) |
| Big models (26B+) on a memory-constrained MacBook | **turbo-fieldfare** (partial-load) |
| Building/distributing tooling that needs a full-load reference runner | **Ollama** |
| Long-running background inference alongside a busy desktop | **turbo-fieldfare** |

---

## 💡 Lessons

* **Memory efficiency is a loader problem, not just a model problem.** Quantization shrinks weights; partial loading shrinks the runtime footprint. Combining MLX-optimized weights with on-demand layer loading is what makes 26B-class models practical on M1 laptops.
* **Local inference is a first-class agent ingredient.** With an OpenAI-compatible local endpoint, the same agentic patterns (tool orchestration, self-healing loops) work fully offline.
* **Model quality is preserved.** Streaming weights from disk changes the memory curve, not the weights — the same model, the same outputs, a fraction of the RAM.
