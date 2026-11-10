import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Generación de imágenes con la API de Gemini (admite imágenes de referencia, como tu método).
// Claude no genera imágenes, por eso se usa otro proveedor. Modelo configurable en config.json (imageModel).
export const hasImageKey = () => Boolean(process.env.GEMINI_API_KEY);

export async function generateImage({ prompt, refs = [], model }) {
  const parts = [{ text: prompt }, ...refs.map((r) => ({ inline_data: { mime_type: r.mime, data: r.data } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
  });
  if (!res.ok) throw new Error(`Imágenes ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
  const d = part && (part.inlineData || part.inline_data);
  if (!d) throw new Error("El modelo no devolvió una imagen (puede haberla bloqueado). Probá de nuevo.");
  const mime = d.mimeType || d.mime_type || "image/png";
  return { mime, data: d.data, ext: mime.includes("jpeg") ? "jpg" : "png" };
}

// Foto de referencia del producto: la subida desde el panel o, si no, la URL `image` del catálogo.
export async function loadRef(p, state, root) {
  const file = state.refs?.[p.name];
  if (file && existsSync(path.join(root, "data/refs", file))) {
    const ext = file.split(".").pop();
    return { mime: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg", data: readFileSync(path.join(root, "data/refs", file)).toString("base64") };
  }
  if (p.image) {
    const r = await fetch(p.image);
    if (r.ok) return { mime: r.headers.get("content-type")?.split(";")[0] || "image/jpeg", data: Buffer.from(await r.arrayBuffer()).toString("base64") };
  }
  return null;
}
