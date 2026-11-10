// Llamada a la API de Claude con fetch nativo. Sin ANTHROPIC_API_KEY devuelve null
// y cada agente usa su respuesta de demostración (modo simulado).
export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function ask({ system, prompt, model, maxTokens = 2000 }) {
  if (!hasKey()) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.content.map((b) => b.text || "").join("");
}

export function parseJson(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const s = m[1];
  const start = s.search(/[\[{]/);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  return JSON.parse(s.slice(start, end + 1));
}
