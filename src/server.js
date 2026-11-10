import http from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hasKey, configure, als, provider } from "./llm.js";
import { loadEnv, saveEnv } from "./env.js";
import { loadCatalog } from "./catalog.js";
import { hasImageKey, generateImage, loadRef } from "./images.js";
import * as A from "./agents.js";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
const cfg = JSON.parse(readFileSync(path.join(root, "config.json")));
const statePath = path.join(root, "data/state.json");
for (const d of ["", "images", "refs"]) mkdirSync(path.join(root, "data", d), { recursive: true });

const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath))
  : { agents: {}, plan: [], posts: [], dms: [], log: [], catalog: { items: [], source: "", updatedAt: null }, analysis: null, refs: {} };
state.refs ||= {};
state.settings ||= { autopilot: cfg.schedule?.enabled ?? false, time: cfg.schedule?.time || "08:30" };
state.sched ||= { lastDaily: null, lastWeekly: null, lastTry: 0, tries: 0, triedDate: null };
state.usage ||= { date: "", calls: 0, tokens: 0, month: "", monthCalls: 0, monthTokens: 0 };
for (const id of Object.keys(A.AGENTS)) state.agents[id] ||= { status: "idle", task: "", lastRun: null };

const TZ = cfg.schedule?.timezone || "America/Argentina/Mendoza";
function nowIn() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, month: `${p.year}-${p.month}`, hm: `${p.hour}:${p.minute}`, dow: p.weekday };
}
function rollUsage() {
  const n = nowIn(), u = state.usage;
  if (u.date !== n.date) { u.date = n.date; u.calls = 0; u.tokens = 0; }
  if (u.month !== n.month) { u.month = n.month; u.monthCalls = 0; u.monthTokens = 0; }
}
rollUsage();
configure({ cfg, usage: state.usage, onChange: () => { try { writeFileSync(statePath, JSON.stringify(state, null, 1)); } catch {} } });
setInterval(rollUsage, 60000);
const clients = new Set();
const save = () => writeFileSync(statePath, JSON.stringify(state, null, 1));
function nextRun() {
  if (!state.settings.autopilot) return "Apagado";
  if (!hasKey()) return "En pausa: falta la API key";
  const n = nowIn();
  if (state.sched.lastDaily === n.date) return `Mañana ${state.settings.time}`;
  return n.hm < state.settings.time ? `Hoy ${state.settings.time}` : "Ahora mismo";
}
const publicState = () => ({ ...state, brand: cfg.brand, mode: hasKey() ? "real" : "demo", provider: provider(), imagesEnabled: hasImageKey(), limits: cfg.limits || {}, nextRun: nextRun() });
const push = () => { save(); const d = `data: ${JSON.stringify(publicState())}\n\n`; clients.forEach((c) => c.write(d)); };
const log = (agent, msg, level = "info") => { state.log.push({ t: new Date().toISOString(), agent, msg, level }); state.log = state.log.slice(-200); push(); };

// Ejecuta un agente mostrando en el panel su estado, su paso actual y su progreso.
// En modo demo la respuesta es instantánea, así que se espera lo justo para que se vea el trabajo.
async function work(id, task, fn, opt = {}) {
  const ag = state.agents[id], steps = opt.steps || A.STEPS[id], STEP_MS = opt.stepMs || 1400;
  let i = 0;
  Object.assign(ag, { status: "working", task, step: steps[0], progress: 6 });
  log(id, `▶ ${task}`); log(id, `· ${steps[0]}`);
  const tick = setInterval(() => {
    i = Math.min(i + 1, steps.length - 1);
    ag.step = steps[i]; ag.progress = Math.min(92, 6 + ((i + 1) / steps.length) * 86);
    log(id, `· ${steps[i]}`);
  }, STEP_MS);
  try {
    const [out] = await Promise.all([als.run({ agent: id }, fn), hasKey() || opt.noWait ? null : sleep(steps.length * STEP_MS)]);
    Object.assign(ag, { status: "done", task, step: "Listo", progress: 100, lastRun: new Date().toISOString() });
    log(id, `✓ ${task}`);
    setTimeout(() => { if (ag.status === "done") { ag.status = "idle"; ag.task = ""; ag.step = ""; push(); } }, 2500);
    return out;
  } catch (e) {
    Object.assign(ag, { status: "error", task: e.message, step: "", progress: 0 });
    log(id, `✗ ${e.message}`, "error");
    throw e;
  } finally { clearInterval(tick); }
}

const ensureCatalog = async () => {
  if (state.catalog.items.length) return state.catalog.items;
  state.catalog = { ...(await loadCatalog(cfg)), updatedAt: new Date().toISOString() };
  log("system", `Catálogo cargado (${state.catalog.items.length} productos) desde ${state.catalog.source}`);
  return state.catalog.items;
};

const LABEL = { brand: "marca", family: "familia olfativa", notes: "notas", gender: "género", duration: "duración", occasion: "ocasión" };
const REQUIRED = ["notes", "gender", "duration", "occasion"];
// Si faltan datos del perfume, el Investigador los busca en la web y se marcan como "investigados" para que los verifiques.
async function ensureProductData(p) {
  const missing = [...(p.brand ? [] : ["brand"]), ...(p.family ? [] : ["family"]), ...REQUIRED.filter((k) => !p[k])];
  if (!missing.length) return;
  const today = nowIn().date; if (p.tried === today) return; // un solo intento por día: no gastar de más si falla
  if (!hasKey()) { log("researcher", `Faltan datos de ${p.name} (${missing.map((k) => LABEL[k] || k).join(", ")}): sin ANTHROPIC_API_KEY no puedo investigarlos`, "warn"); return; }
  p.tried = today;
  try {
    const r = await work("researcher", `Investigar ${p.brand} ${p.name}`, () => A.researcher(cfg, p, missing));
    for (const k of missing) {
      const v = Array.isArray(r[k]) ? r[k].join(", ") : r[k];
      if (v) { p[k] = v; (p.researched ||= []).push(k); }
    }
    if (r.sources?.length) p.sources = r.sources;
    if (p.custom && r.name && !state.catalog.items.some((x) => x !== p && x.name === r.name)) p.name = r.name;
    push();
  } catch (e) { log("researcher", `No pude investigar ${p.name}: ${e.message}`, "warn"); }
}

async function makeImages(post) {
  const p = state.catalog.items.find((x) => x.name === post.perfume);
  if (!hasImageKey()) throw new Error("Falta GEMINI_API_KEY para generar imágenes");
  if (!post.design?.images) throw new Error("Esta pieza no tiene prompts de imagen");
  const ref = await loadRef(p || {}, state, root);
  if (!ref) throw new Error("Falta la foto de referencia del producto: subila en la tarjeta de la publicación o cargá la URL `image` en el catálogo");
  post.images = [];
  const ag = state.agents.designer;
  await work("designer", "Generar las 3 imágenes", async () => {
    let prev = null;
    for (let i = 0; i < 3; i++) {
      ag.step = ["Imagen 1: frasco y caja en la escena", "Imagen 2: solo el frasco", "Imagen 3: infográfico de notas"][i];
      ag.progress = 10 + i * 30; push();
      const refs = i === 0 ? [ref] : i === 1 ? [prev, ref] : [prev];
      const img = await generateImage({ prompt: post.design.images[i].prompt, refs, model: cfg.imageModel });
      const file = `${post.id}-${i + 1}.${img.ext}`;
      writeFileSync(path.join(root, "data/images", file), Buffer.from(img.data, "base64"));
      post.images.push(`/files/images/${file}`); prev = { mime: img.mime, data: img.data };
      log("designer", `Imagen ${i + 1}/3 lista`); push();
    }
  }, { steps: ["Preparando la referencia"], stepMs: 3600000, noWait: true });
}

const actions = {
  async refreshCatalog() {
    const old = state.catalog.items, fresh = await loadCatalog(cfg);
    // conserva lo ya investigado y los perfumes agregados a mano
    for (const it of fresh.items) { const o = old.find((x) => x.name === it.name); if (o) for (const k of ["notes", "gender", "duration", "occasion", "family", "researched", "sources"]) if (!it[k] && o[k]) it[k] = o[k]; }
    for (const o of old) if (o.custom && !fresh.items.some((x) => x.name === o.name)) fresh.items.push(o);
    state.catalog = { ...fresh, updatedAt: new Date().toISOString() };
    log("system", `Catálogo actualizado (${state.catalog.items.length}) desde ${state.catalog.source}`);
  },
  async plan() {
    const cat = await ensureCatalog();
    state.plan = await work("strategist", "Plan semanal", () => A.strategist(cfg, cat, state.posts.map((p) => ({ title: p.title, pillar: p.pillar, metrics: p.metrics }))));
    push();
  },
  async carousel(perfume) {
    const cat = await ensureCatalog();
    const q = String(perfume || "").trim().toLowerCase();
    let p = cat.find((x) => x.name.toLowerCase() === q || `${x.brand} ${x.name}`.toLowerCase() === q);
    if (!p && q) {
      // No está en el catálogo (o la web no se pudo leer): se agrega y el Investigador completa todo.
      p = { name: String(perfume).trim(), brand: "", price: "", notes: "", family: "", custom: true };
      cat.push(p); log("system", `"${p.name}" no está en el catálogo: lo agrego y lo investigo en la web`);
    }
    p ||= cat[0];
    await ensureProductData(p);
    if (p.custom && !hasKey()) log("system", `Sin ANTHROPIC_API_KEY no puedo investigar "${p.name}": cargá la clave para que lo busque en la web`, "warn");
    await actions.makePost(null, { day: "Hoy", format: "carrusel3", pillar: "venta", perfume: p.name, topic: `${p.brand} ${p.name}: para quién es`.trim(), goal: "consultas por DM" });
  },
  async makePost(idx, override) {
    const cat = await ensureCatalog();
    if (!override && !state.plan.length) await actions.plan();
    const item = override || state.plan[idx ?? 0];
    const prod = item.perfume && cat.find((x) => x.name === item.perfume);
    if (prod && !override) await ensureProductData(prod);
    const c = await work("creator", `Crear: ${item.topic}`, () => A.creator(cfg, cat, item));
    const post = { id: randomUUID().slice(0, 8), status: "designing", format: item.format, pillar: item.pillar, day: item.day, perfume: item.perfume, researched: prod?.researched, sources: prod?.sources, createdAt: new Date().toISOString(), ...c };
    state.posts.unshift(post); push();
    post.design = await work("designer", `Brief visual: ${post.title}`, () => A.designer(cfg, post, cat));
    post.status = "draft"; log("system", `Borrador listo para aprobar: "${post.title}"`); push();
    if (post.format === "carrusel3" && hasImageKey()) await makeImages(post).catch((e) => log("designer", e.message, "warn"));
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

// Aviso opcional al celular con ntfy.sh (gratis): solo manda el título de la pieza. El nombre del "topic" funciona como clave.
async function notify(title, message) {
  const topic = cfg.notify?.ntfyTopic; if (!topic) return;
  await fetch("https://ntfy.sh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic, title, message }) }).catch(() => {});
}

// Piloto automático: cada minuto revisa la hora; si ya pasó la hora elegida y hoy no se hizo, crea la publicación del día.
// Si la compu estaba apagada, lo hace apenas se enciende. Reintenta hasta 3 veces por día, cada 30 minutos.
async function autopilot() {
  const st = state.settings, sc = state.sched;
  if (!st.autopilot || !hasKey() || Object.values(state.agents).some((a) => a.status === "working")) return;
  const n = nowIn(); if (n.hm < st.time) return;
  if (sc.triedDate !== n.date) { sc.triedDate = n.date; sc.tries = 0; }
  if (sc.lastDaily !== n.date && sc.tries < 3 && Date.now() - sc.lastTry > 30 * 60000) {
    sc.tries++; sc.lastTry = Date.now(); log("system", "🤖 Piloto automático: creando la publicación de hoy");
    try { await actions.daily(); sc.lastDaily = n.date; const p = state.posts[0]; await notify("Fragance MP: borrador listo", p?.title || "Hay una publicación para aprobar"); }
    catch (e) { log("system", `Piloto automático falló (intento ${sc.tries}/3): ${e.message}`, "error"); }
    push();
  }
  if (cfg.schedule?.weeklyAnalysis && n.dow === "Sun" && sc.lastWeekly !== n.date && state.posts.some((p) => p.metrics)) {
    sc.lastWeekly = n.date; await actions.analyze().catch((e) => log("system", e.message, "error"));
  }
}
setInterval(() => autopilot().catch((e) => log("system", e.message, "error")), 60000);

const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => { if (b.length < 20e6) b += c; }); req.on("end", () => r(b ? JSON.parse(b) : {})); });

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
        const fn = { plan: () => actions.plan(), daily: () => actions.daily(), post: () => actions.makePost(b.index), carousel: () => actions.carousel(b.perfume), images: () => makeImages(state.posts.find((x) => x.id === b.postId)), analyze: () => actions.analyze(), catalog: () => actions.refreshCatalog() }[parts[1]];
        if (!fn) return json(res, 404, { error: "acción desconocida" });
        fn().catch((e) => log("system", e.message, "error")); // corre en segundo plano; el panel ve el progreso por SSE
        return json(res, 202, { ok: true });
      }
      if (parts[0] === "key") {
        const k = String(b.key || "").trim();
        if (!/^[\w.\-]{20,300}$/.test(k)) return json(res, 400, { error: "La clave no parece válida (se copia entera, sin espacios)" });
        saveEnv(root, provider() === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY", k);
        log("system", "🔑 Clave guardada: el sistema pasó a modo real"); return json(res, 200, { ok: true });
      }
      if (parts[0] === "settings") {
        if (typeof b.autopilot === "boolean") state.settings.autopilot = b.autopilot;
        if (/^\d{2}:\d{2}$/.test(b.time || "")) state.settings.time = b.time;
        log("system", `Piloto automático ${state.settings.autopilot ? "activado" : "apagado"} (${state.settings.time})`); return json(res, 200, state.settings);
      }
      if (parts[0] === "ref") {
        const m = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(b.dataUrl || ""); if (!m || !b.perfume) return json(res, 400, { error: "imagen inválida" });
        const file = `${Buffer.from(b.perfume).toString("hex").slice(0, 40)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
        writeFileSync(path.join(root, "data/refs", file), Buffer.from(m[2], "base64")); state.refs[b.perfume] = file;
        log("system", `Foto de referencia cargada: ${b.perfume}`); return json(res, 200, { ok: true });
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
    if (url.pathname.startsWith("/files/images/")) {
      const f = path.join(root, "data/images", path.basename(url.pathname));
      if (!existsSync(f)) return json(res, 404, {});
      res.writeHead(200, { "content-type": f.endsWith(".jpg") ? "image/jpeg" : "image/png" }); return res.end(readFileSync(f));
    }
    // estático
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const full = path.join(root, "public", path.normalize(file).replace(/^(\.\.[/\\])+/, ""));
    if (!full.startsWith(path.join(root, "public")) || !existsSync(full)) return json(res, 404, { error: "no encontrado" });
    res.writeHead(200, { "content-type": full.endsWith(".html") ? "text/html; charset=utf-8" : full.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/plain" });
    res.end(readFileSync(full));
  } catch (e) { json(res, 500, { error: e.message }); }
}).listen(process.env.PORT || 3000, "127.0.0.1", () => console.log(`Panel: http://localhost:${process.env.PORT || 3000}  (modo ${hasKey() ? "REAL" : "DEMO"})`));
ensureCatalog().catch((e) => log("system", `Catálogo: ${e.message}`, "error"));
setTimeout(() => autopilot().catch(() => {}), 4000); // al iniciar: si hoy ya pasó la hora y no se hizo, lo hace
