/**
 * Minimal OpenAI-compatible chat client for the free OpenCode Zen endpoint
 * (no API key needed). Override with ZEN_BASE_URL / ZEN_MODEL / ZEN_API_KEY.
 */

const BASE = process.env.ZEN_BASE_URL || "https://opencode.ai/zen/v1";
// Comma-separated fallback chain; first model that answers wins.
const MODELS = (process.env.ZEN_MODEL || "deepseek-v4-flash-free,nemotron-3.5-lightning-free,laguna-s-2.1-free,mimo-v2.5-free")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const KEY = process.env.ZEN_API_KEY || "public";

export async function chat(system, user, { temperature = 0.2, timeoutMs = 60000 } = {}) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
