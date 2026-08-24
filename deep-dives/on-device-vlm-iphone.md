# Putting a Vision-Language Model on a Phone: What 270 Benchmark Runs Taught Me About On-Device AI

**Ordo** started as a take-home assignment: take a vision-language model (VLM), measure how far quantization can push it, and get it running on a phone. I picked **Qwen2-VL-2B-Instruct** on **llama.cpp** and built a full measurement rig around it — a custom C++ benchmark harness with per-stage timers, a private eval set of 18 real-world photos taken on my own iPhone, and a SwiftUI test app deployed to an iPhone 15 (A16 Bionic). After ~270 runs across the quantization ladder, plus a debugging saga that took thirty iterations to crack, the results overturned most of my assumptions about where on-device AI time actually goes.

Live site: [xpressabhi.github.io/ordo](https://xpressabhi.github.io/ordo/) · Source: [github.com/xpressabhi/ordo](https://github.com/xpressabhi/ordo)

---

## The setup

- **Model:** Qwen2-VL-2B-Instruct as GGUF, llama.cpp b10549, Metal backend — same code path and weight format on an M2 Pro MacBook and the iPhone.
- **Eval set:** 18 photos I shot myself — product labels, book spines, appliance displays, handwriting, posters. Tagged at capture into 6 easy / 6 medium / 6 hard. Own photos matter: they can't be in the model's training data.
- **Metric:** Answer Recall — the fraction of ground-truth answer tokens present in the prediction. The model answers in full sentences ("The price is $5.50") while ground truth is the bare fact ("$5.50"); for a voice-assistant use case, containment is what matters. Exact Match stayed at 0% by design — models don't speak telegraphese.
- **The ladder:** text weights from f16 → Q8_0 → Q4_K_M → Q2_K → IQ2_XXS (imatrix-calibrated), crossed with vision encoder (`mmproj`) f16/Q8/Q4 — 15 combinations × 18 photos.

The harness times each stage separately: vision encode, prefill, decode, TTFT, plus peak RSS. That per-stage split is what produced every interesting finding below.

---

## Finding 1: the vision encoder IS the latency problem

For the best config, here is where a single photo-question round-trip actually goes:

| Stage | Time | Share of TTFT |
|---|---|---|
| Vision encode | ~26s | ~87% |
| Prefill (~104 prompt tokens) | ~3.4s | ~11% |
| Decode (per token) | ~0.27s | — |

A 600-token prompt costs about **0.6 seconds** of prefill. One photo costs **26 seconds** of encode. Everyone in the LLM world optimizes decode tok/s; for VLMs on device, the image is the wall. Every product decision that matters — resolution, tiling, encoder architecture — lives in that 26 seconds.

## Finding 2: quantization bites the decoder, not the encoder

I cross-quantized the vision encoder (f16 / Q8 / Q4) against a fixed Q4 text model. The result: **accuracy changed by zero points** (81% across all three), encode time moved only ~5%.

This asymmetry has a clean explanation:

- The **decoder is bandwidth-bound**: autoregressive generation streams every weight from memory once per token, so smaller weights pay off directly (f16 → Q4 doubled decode speed, ~42 → 78 tok/s).
- The **encoder is compute-bound**: it runs many small ops over fixed image activations; its weights (~20% of the model) barely factor into its cost.

Consequence: **halving bytes does not halve latency**. f16 → Q4 halves the download and doubles decode speed, but TTFT barely moves because encode dominates and doesn't care about text-model quant.

The ladder itself had a cliff: **IQ2_XXS is unusable for real-world text** (glare logos, handwriting, small print all fail), and Q2_K holds easy/medium items but collapses to ~40% on hard ones. The sweet spot was **Q4_K_M text + Q8 mmproj: 1.6GB, 81% AR, 2.3GB peak RSS** — which even beat f16 (78%) on this set. That's small-set noise, not "Q4 > f16", but it's a reminder that the ladder isn't monotonic at this scale.

---

## The bug that ate thirty iterations

Then I moved to the phone, and everything broke silently.

On the iPhone's A16 GPU, Qwen2-VL's vision tower emitted **near-constant embeddings** (values clamped to ≈ {-1.79, 1.0}) regardless of image content. The model loaded fine, encoded fine, generated fluently — and hallucinated with total confidence ("The Netherlands" for a puzzle-label photo). No crash, no warning. Just confident nonsense.

What this survived: three framework builds (two hand-merged xcframeworks, one official), three mmproj quants, flash-attention on/off, KV-cache and batch size changes, CPU/GPU decode splits. I verified pixel input was correct going in. Same binary, same weights: flawless on the M2.

The breakthrough came from a hypothesis rather than another rebuild: **try smaller images**. At 768px instead of full-resolution captures (3213×5712), the exact same tower read perfectly — healthy embedding spread, 46% AR on the same eval set. The collapse is **tile-grid-size dependent**: full-res photos tile into dozens of 28px patches, and something in Qwen2-VL's dynamic-resolution (2D-RoPE) Metal kernels breaks on large tile grids specifically on A16-class silicon. At capture resolution, broken; at eval resolution, fine.

Two lessons worth the price of admission:

1. Hardware bugs can be both **architecture-specific and input-shape-specific**. SmolVLM ran flawlessly on the same phone on the first attempt — one model's tower collapses, another's doesn't. "The A16 can't run Qwen2-VL" was wrong in its generality; "the A16 can't run it at full-res tile counts" was right.
2. **Silent confidence is the worst failure mode.** An exception would have saved me days. A model that answers smoothly from garbage embeddings gives you nothing to grep for — which is why my harness now sanity-checks embedding statistics, not just outputs.

---

## What actually ships on the phone

With the constraint understood, two viable configs emerged on the iPhone:

| Model @768px | AR | Encode med | TTFT med | Peak RSS |
|---|---|---|---|---|
| SmolVLM-256M Q8 | 39% | 753ms | **805ms** | ~370MB |
| Qwen2-VL-2B Q4_K_M | **46%** | 4124ms | 5784ms | 1130MB |

SmolVLM-256M ran the full 18-photo eval on-device in ~110 seconds, sub-second first token, real embeddings, in a 335MB app. The resolution sweep showed encode cost plateaus above 768px (500 → 752 → 764ms for 512/768/1024) while accuracy keeps climbing — each 2× downscale cuts tiles roughly 4×, so resolution is the accuracy-per-millisecond knob.

Just as instructive was what didn't help: stepping up SmolVLM-256M → 500M cost +160ms TTFT and +80MB RAM for **zero** accuracy gain on this task. Below the capability threshold your task needs, bigger is just slower.

---

## The single biggest product lever: pre-compute at capture

One architectural change transformed the latency budget: **encode the photo when the camera snaps it, not when the question arrives**, then cache the embeddings. Multi-turn measurement confirmed cache hits on every follow-up: turn 1 TTFT ~940ms, turn 2 on the same photo — encode = 0ms, TTFT **~200ms**.

Against a conversational budget (ASR ~300ms + TTS ~500ms inside a 2-second loop), follow-up questions become effectively free. For any camera-at-ear-level product, pre-compute is the difference between "demo" and "usable".

---

## Squeezing the rest

After the encoder, three levers, all measured:

- **Quantize the tower anyway** (Q8 → Q4 mmproj): only −10% encode. Compute-bound, again.
- **Prefill batch size** 2048 → 4096: −16% prefill. Image-token prefill is batch-bound, not weight-bound.
- **Short answers** (prompted brevity + n_predict 24): −65% decode, −68% total wall time. The largest practical lever was asking for fewer tokens, not a faster model.

One methodology trap surfaced here: token-containment Answer Recall punished terse-but-correct answers ("120 g" vs "The net quantity is 120 grams") — a metric artifact I verified on the Mac before believing. Metrics measure phrasing as much as truth; know which one you're paying for.

## Fine-tuning beats climbing the precision ladder

The assignment's final question: does fine-tuning recover what quantization costs? On this task, yes — decisively. A LoRA (rank 8, alpha 16, 300 iters, MLX, language-only adapters — unfreezing the vision tower OOM'd a 16GB Mac) took base fp16 from 38% → **65%** AR (+27 points).

The honest caveat: this is in-distribution — training rows are paraphrases of eval-style items, so it proves a ceiling, not generalization. But the engineering conclusion stands: **fine-tune the Q4 build rather than stepping up precision**. You keep the memory win and buy back more accuracy than the ladder ever sold you.

(MLX gotchas for the curious: mlx-vlm 0.6.15's CLI dropped `--export`; images are *silently ignored* unless the prompt goes through `apply_chat_template(..., num_images=1)`; and `model.eval()` breaks generation.)

---

## Sustained use: thermals, not battery

Twenty sequential queries: throughput held (TTFT fell off by 13ms end-to-end). A five-minute continuous soak told the real story: the A16 hits "serious" thermal state within ~45 seconds and stays there — **TTFT degrades ~16%, encode ~18%**, while decode stays flat. Memory never moved (354–362MB).

Battery, meanwhile, measured 0.0% drain over six minutes of continuous inference. Thermals are the sustained-use constraint; battery isn't. The product answer is pacing — encode the camera feed at 2–3fps, not continuously — not bigger batteries or better quants.

---

## What I'd tell anyone shipping on-device AI

1. **Profile per stage before optimizing anything.** The intuition "decode speed matters most" was off by 10×.
2. **Attack the encoder, not the decoder.** Quantize the decoder freely — it's where quant pays. Leave encoder precision alone; it buys nothing.
3. **Resolution is the master knob.** It drives tiles, which drive encode compute, which drives TTFT and thermals.
4. **Pre-compute at capture.** Cached embeddings turn a 6s interaction into a 200ms one.
5. **Assert on intermediate signals.** Embedding statistics would have caught in minutes what took thirty debug iterations to isolate.
6. **Small models win until proven otherwise.** The 500M upgrade bought nothing; measure the step before paying for it.
7. **Fine-tune down, not up.** LoRA on a Q4 build beats f16 envy.

Full data, failure analysis, and reproduction scripts live at [github.com/xpressabhi/ordo](https://github.com/xpressabhi/ordo), with the visual guide at [xpressabhi.github.io/ordo](https://xpressabhi.github.io/ordo/).
