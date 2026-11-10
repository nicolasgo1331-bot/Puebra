import { readFileSync } from "node:fs";
import { ask, parseJson } from "./llm.js";

export const sample = () => JSON.parse(readFileSync(new URL("../data/catalog.sample.json", import.meta.url)));

const htmlToText = (html) =>
  html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// Lee la web del catálogo y extrae los productos. Si no hay URL o falla, usa el ejemplo.
export async function loadCatalog(cfg) {
  if (!cfg.catalogUrl) return { items: sample(), source: "ejemplo (falta catalogUrl en config.json)" };
  const res = await fetch(cfg.catalogUrl, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`No pude leer ${cfg.catalogUrl}: ${res.status}`);
  const text = htmlToText(await res.text()).slice(0, 20000);
  const out = await ask({
    model: cfg.model, maxTokens: 4000,
    system: "Extraés productos de texto de una tienda online. Respondé SOLO con JSON.",
    prompt: `Texto de la tienda:\n${text}\n\nDevolvé un array JSON [{"name","brand","price","notes","family"}] con los perfumes que aparezcan. Usá solo datos presentes; si falta un dato, dejá "".`,
  });
  if (!out) return { items: sample(), source: "ejemplo (sin ANTHROPIC_API_KEY no puedo leer la web)" };
  return { items: parseJson(out), source: cfg.catalogUrl };
}

export const catalogText = (items) =>
  items.map((p) => `- ${p.brand} ${p.name} | precio: ${p.price || "consultar"} | notas: ${p.notes} | ${p.family}`).join("\n");
