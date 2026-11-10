import { AsyncLocalStorage } from "node:async_hooks";

// Proveedor de IA de texto: "anthropic" (Claude) o "gemini" (tiene capa gratuita, ver README).
// Cada agente usa su propio modelo (config.models / config.geminiModels), así las tareas simples usan el más barato.
export const als = new AsyncLocalStorage();
let CFG = { models: { default: "claude-haiku-5-5" } }, USAGE = null, changed = () => {};
export function configure({ cfg, usage, onChange }) { CFG = cfg; USAGE = usage; changed = onChange || (() => {}); }

export const provider = () => (CFG.provider === "gemini" ? "gemini" : "anthropic");
export const hasKey = () => Boolean(provider() === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY);
const pickModel = () => { const m = provider() === "gemini" ? CFG.geminiModels : CFG.models; return m?.[als.getStore()?.agent] || m?.default; };

// Topes de gasto: si se alcanzan, el agente se frena con un mensaje claro en vez de seguir gastando.
function guard() {
  const L = CFG.limits || {};
  if (USAGE && L.maxCallsPerDay && USAGE.calls >= L.maxCallsPerDay) throw new Error(`Tope diario de llamadas a la IA alcanzado (${L.maxCallsPerDay}). Se reinicia mañana, o subilo en config.json (limits).`);
  if (USAGE && L.maxTokensPerDay && USAGE.tokens >= L.maxTokensPerDay) throw new Error(`Tope diario de tokens alcanzado (${L.maxTokensPerDay}). Se reinicia mañana, o subilo en config.json (limits).`);
}
function record(input = 0, output = 0) {
  if (!USAGE) return;
  USAGE.calls++; USAGE.tokens += input + output; USAGE.monthTokens += input + output; USAGE.monthCalls++; changed();
}

export async function ask({ system, prompt, maxTokens = 2000, web = false }) {
  if (!hasKey()) return null;
  guard();
  const model = pickModel();
  if (provider() === "gemini") {
    const body = { systemInstruction: { parts: [{ text: system || "" }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens } };
    if (web) body.tools = [{ google_search: {} }];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const d = await res.json();
    record(d.usageMetadata?.promptTokenCount, d.usageMetadata?.candidatesTokenCount);
    return (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  }
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }],
      ...(web ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] } : {}) }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  record(data.usage?.input_tokens, data.usage?.output_tokens);
  return data.content.map((b) => b.text || "").join("");
}

export function parseJson(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const s = m[1];
  const start = s.search(/[\[{]/);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  return JSON.parse(s.slice(start, end + 1));
}
