import http from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hasKey } from "./llm.js";
import { loadCatalog } from "./catalog.js";
import * as A from "./agents.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(path.join(root, "config.json")));
const statePath = path.join(root, "data/state.json");
mkdirSync(path.join(root, "data"), { recursive: true });

const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath))
  : { agents: {}, plan: [], posts: [], dms: [], log: [], catalog: { items: [], source: "", updatedAt: null }, analysis: null };
for (const id of Object.keys(A.AGENTS)) state.agents[id] ||= { status: "idle", task: "", lastRun: null };

const clients = new Set();
const save = () => writeFileSync(statePath, JSON.stringify(state, null, 1));
const publicState = () => ({ ...state, brand: cfg.brand, mode: hasKey() ? "real" : "demo" });
const push = () => { save(); const d = `data: ${JSON.stringify(publicState())}\n\n`; clients.forEach((c) => c.write(d)); };
const log = (agent, msg, level = "info") => { state.log.push({ t: new Date().toISOString(), agent, msg, level }); state.log = state.log.slice(-200); push(); };

// Ejecuta un agente mostrando su estado en vivo en el panel.
async function work(id, task, fn) {
  const ag = state.agents[id];
  ag.status = "working"; ag.task = task; log(id, `Empieza: ${task}`);
  try {
    const out = await fn();
    ag.status = "idle"; ag.task = ""; ag.lastRun = new Date().toISOString(); log(id, `Terminó: ${task}`);
    return out;
  } catch (e) {
    ag.status = "error"; ag.task = e.message; log(id, `Error: ${e.message}`, "error");
    throw e;
  }
}

const ensureCatalog = async () => {
  if (state.catalog.items.length) return state.catalog.items;
  state.catalog = { ...(await loadCatalog(cfg)), updatedAt: new Date().toISOString() };
  log("system", `Catálogo cargado (${state.catalog.items.length} productos) desde ${state.catalog.source}`);
  return state.catalog.items;
};

const actions = {
  async refreshCatalog() {
    state.catalog = { ...(await loadCatalog(cfg)), updatedAt: new Date().toISOString() };
    log("system", `Catálogo actualizado (${state.catalog.items.length}) desde ${state.catalog.source}`);
  },
  async plan() {
    const cat = await ensureCatalog();
    state.plan = await work("strategist", "Plan semanal", () => A.strategist(cfg, cat, state.posts.map((p) => ({ title: p.title, pillar: p.pillar, metrics: p.metrics }))));
    push();
  },
  async makePost(idx) {
    const cat = await ensureCatalog();
    if (!state.plan.length) await actions.plan();
    const item = state.plan[idx ?? 0];
    const c = await work("creator", `Crear: ${item.topic}`, () => A.creator(cfg, cat, item));
    const post = { id: randomUUID().slice(0, 8), status: "designing", format: item.format, pillar: item.pillar, day: item.day, createdAt: new Date().toISOString(), ...c };
    state.posts.unshift(post); push();
    post.design = await work("designer", `Brief visual: ${post.title}`, () => A.designer(cfg, post));
    post.status = "draft"; log("system", `Borrador listo para aprobar: "${post.title}"`); push();
  },
  async daily() {
    const used = new Set(state.posts.map((p) => p.title));
    if (!state.plan.length) await actions.plan();
    let idx = state.plan.findIndex((i) => !used.has(i.topic));
    if (idx < 0) { await actions.plan(); idx = 0; }
    await actions.makePost(idx);
  },
  async reply(message) {
    const cat = await ensureCatalog();
    const dm = { id: randomUUID().slice(0, 8), at: new Date().toISOString(), message, status: "pending" };
    state.dms.unshift(dm); push();
    const r = await work("community", "Responder mensaje", () => A.community(cfg, cat, message));
    Object.assign(dm, r, { status: r.escalate ? "escalated" : "draft" });
    log("community", r.escalate ? `⚠ Escalado a vos: ${r.reason}` : "Respuesta lista para copiar y enviar", r.escalate ? "warn" : "info");
  },
  async analyze() {
    state.analysis = await work("analyst", "Análisis semanal", () => A.analyst(cfg, state.posts)); push();
  },
};

const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b ? JSON.parse(b) : {})); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      res.write(`data: ${JSON.stringify(publicState())}\n\n`); clients.add(res);
      return req.on("close", () => clients.delete(res));
    }
    if (url.pathname === "/api/state") return json(res, 200, publicState());
    if (req.method === "POST" && url.pathname.startsWith("/api/")) {
      const parts = url.pathname.split("/").slice(2); const b = await body(req);
      if (parts[0] === "run") {
        const fn = { plan: () => actions.plan(), daily: () => actions.daily(), post: () => actions.makePost(b.index), analyze: () => actions.analyze(), catalog: () => actions.refreshCatalog() }[parts[1]];
        if (!fn) return json(res, 404, { error: "acción desconocida" });
        fn().catch((e) => log("system", e.message, "error")); // corre en segundo plano; el panel ve el progreso por SSE
        return json(res, 202, { ok: true });
      }
      if (parts[0] === "dm") { if (!b.message?.trim()) return json(res, 400, { error: "vacío" }); actions.reply(b.message).catch((e) => log("system", e.message, "error")); return json(res, 202, { ok: true }); }
      if (parts[0] === "posts") {
        const p = state.posts.find((x) => x.id === parts[1]); if (!p) return json(res, 404, {});
        if (parts[2] === "status") { p.status = b.status; log("system", `"${p.title}" → ${b.status}`); }
        if (parts[2] === "metrics") { p.metrics = b; log("system", `Métricas cargadas: "${p.title}"`); }
        if (parts[2] === "caption") p.caption = b.caption;
        push(); return json(res, 200, p);
      }
      if (parts[0] === "dms") {
        const d = state.dms.find((x) => x.id === parts[1]); if (!d) return json(res, 404, {});
        d.status = b.status; push(); return json(res, 200, d);
      }
    }
    // estático
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const full = path.join(root, "public", path.normalize(file).replace(/^(\.\.[/\\])+/, ""));
    if (!full.startsWith(path.join(root, "public")) || !existsSync(full)) return json(res, 404, { error: "no encontrado" });
    res.writeHead(200, { "content-type": full.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain" });
    res.end(readFileSync(full));
  } catch (e) { json(res, 500, { error: e.message }); }
}).listen(process.env.PORT || 3000, () => console.log(`Panel: http://localhost:${process.env.PORT || 3000}  (modo ${hasKey() ? "REAL" : "DEMO"})`));
