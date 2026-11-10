// Oficina ilustrada: cada agente es una persona en su escritorio. Se construye una sola vez y luego
// solo se actualizan clases y textos, para que las animaciones no se reinicien con cada evento.
const PEOPLE = {
  strategist: { name: "Estratega", role: "Planifica la semana", skin: "#e8b894", hair: "#2b1b17", style: "bun", shirt: "#5a1f2b", prop: "calendar" },
  researcher: { name: "Investigador", role: "Busca datos en la web", skin: "#b9835c", hair: "#7a5230", style: "short", glasses: 1, shirt: "#3f6b5a", prop: "magnifier" },
  creator: { name: "Creador", role: "Escribe copy y slides", skin: "#c98d65", hair: "#1c1412", style: "short", beard: 1, glasses: 1, shirt: "#d9c8a9", prop: "notebook" },
  designer: { name: "Diseñador", role: "Arma el brief visual", skin: "#f1c9a5", hair: "#6b3a1f", style: "curly", beret: 1, shirt: "#2f3d52", prop: "palette" },
  community: { name: "Community", role: "Responde mensajes", skin: "#8d5a3a", hair: "#0f0b0a", style: "short", headset: 1, shirt: "#c9a24b", prop: "phone" },
  analyst: { name: "Analista", role: "Lee las métricas", skin: "#e0b08a", hair: "#3a2a20", style: "pony", glasses: 1, shirt: "#6b6f76", prop: "chart" },
};
const HAIR = {
  short: (c) => `<path d="M80.5 61C79 38 121 38 119.5 61C113 51 87 51 80.5 61Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="100" cy="39" r="8" fill="${c}"/><path d="M80 62C78 38 122 38 120 62C112 50 88 50 80 62Z" fill="${c}"/>`,
  pony: (c) => `<path d="M80 62C78 38 122 38 120 62C112 50 88 50 80 62Z" fill="${c}"/>`,
  curly: (c) => `<g fill="${c}">${[[82, 52], [90, 44], [100, 41], [110, 44], [118, 52], [80, 62], [120, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</g>`,
};
const PROPS = {
  magnifier: `<rect x="14" y="140" width="30" height="12" rx="2" fill="#3f6b5a"/><rect x="14" y="140" width="4" height="12" fill="#2b4d40"/><circle cx="40" cy="132" r="8" fill="rgba(180,220,255,.25)" stroke="#d4af5a" stroke-width="2.5"/><path d="M46 138l8 10" stroke="#d4af5a" stroke-width="3" stroke-linecap="round"/>`,
  calendar: `<rect x="16" y="126" width="30" height="26" rx="3" fill="#efe5d6"/><rect x="16" y="126" width="30" height="7" rx="3" fill="#d4af5a"/><g stroke="#b8a998" stroke-width="1.5"><path d="M21 140h20M21 145h14"/></g>`,
  notebook: `<g transform="rotate(-6 30 146)"><rect x="14" y="139" width="36" height="13" rx="2" fill="#5a1f2b"/><rect x="14" y="139" width="4" height="13" fill="#3d1119"/></g><path d="M52 136l-10 14" stroke="#d4af5a" stroke-width="2.5" stroke-linecap="round"/>`,
  palette: `<ellipse cx="31" cy="146" rx="17" ry="7" fill="#d9b98a"/><circle cx="24" cy="145" r="2.6" fill="#c0392b"/><circle cx="31" cy="143.5" r="2.6" fill="#d4af5a"/><circle cx="38" cy="145" r="2.6" fill="#2f6f9f"/>`,
  phone: `<rect x="22" y="128" width="16" height="24" rx="3" fill="#111" stroke="#d4af5a"/><rect x="25" y="132" width="10" height="3" rx="1.5" fill="#6fbf8b"/><rect x="25" y="137" width="7" height="3" rx="1.5" fill="#a09286"/><circle class="notif" cx="38" cy="128" r="3.4" fill="#e0645e"/>`,
  chart: `<rect x="16" y="126" width="32" height="26" rx="3" fill="#efe5d6"/><rect x="21" y="141" width="5" height="8" fill="#5a1f2b"/><rect x="29" y="135" width="5" height="14" fill="#d4af5a"/><rect x="37" y="131" width="5" height="18" fill="#8f7230"/>`,
};

function personSVG(p, id) {
  return `<svg viewBox="0 0 200 192" class="person" aria-hidden="true">
  <ellipse cx="100" cy="188" rx="86" ry="5" fill="#000" opacity=".35"/>
  <rect x="64" y="82" width="72" height="74" rx="18" fill="#1a1413"/>
  <g class="body">
   <path d="M70 156V114Q70 92 100 92Q130 92 130 114V156Z" fill="${p.shirt}"/>
   <path d="M70 156V114Q70 92 100 92" fill="url(#sh)" opacity=".5"/><path d="M130 156V114Q130 92 100 92" fill="#000" opacity=".16"/>
   <path d="M90 92L100 106L110 92Z" fill="${p.skin}"/>
   <rect x="94" y="80" width="12" height="14" fill="${p.skin}"/>
   <g class="arm l"><path d="M77 102Q68 126 86 142" stroke="${p.shirt}" stroke-width="11" stroke-linecap="round" fill="none"/><circle cx="87" cy="143" r="5.5" fill="${p.skin}"/></g>
   <g class="arm r"><path d="M123 102Q132 126 114 142" stroke="${p.shirt}" stroke-width="11" stroke-linecap="round" fill="none"/><circle cx="113" cy="143" r="5.5" fill="${p.skin}"/></g>
   <g class="head">
    ${p.style === "pony" ? `<path class="tail" d="M116 52C136 54 138 78 124 90C130 74 124 62 114 58Z" fill="${p.hair}"/>` : ""}
    <circle cx="100" cy="64" r="19" fill="${p.skin}"/>
    ${HAIR[p.style](p.hair)}
    ${p.beard ? `<path d="M82 64C82 90 118 90 118 64C113 78 87 78 82 64Z" fill="${p.hair}"/>` : ""}
    ${p.beret ? `<ellipse cx="102" cy="46" rx="21" ry="7" fill="#d4af5a"/><circle cx="104" cy="39" r="2.5" fill="#d4af5a"/>` : ""}
    <circle cx="87" cy="72" r="3.4" fill="#e8847a" opacity=".32"/><circle cx="113" cy="72" r="3.4" fill="#e8847a" opacity=".32"/>
    <ellipse class="glow" cx="100" cy="71" rx="17" ry="11" fill="#ffd98a" opacity="0"/>
    <g class="eyes"><ellipse class="eye" cx="93" cy="64" rx="2.2" ry="2.6" fill="#1a1210"/><ellipse class="eye" cx="107" cy="64" rx="2.2" ry="2.6" fill="#1a1210" style="animation-delay:.08s"/></g>
    ${p.glasses ? `<g fill="none" stroke="#d4af5a" stroke-width="1.6"><circle cx="93" cy="64" r="6.5"/><circle cx="107" cy="64" r="6.5"/><path d="M99.5 64h1"/></g>` : ""}
    <path class="m neutral" d="M95 74Q100 77 105 74" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path class="m smile" d="M93 73Q100 82 107 73Z" fill="#7a3b2e"/>
    <path class="m frown" d="M95 77Q100 72 105 77" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${p.headset ? `<path d="M81 62C80 40 120 40 119 62" stroke="#222" stroke-width="3" fill="none"/><rect x="77" y="58" width="7" height="12" rx="3" fill="#222"/><path d="M80 70Q84 80 94 78" stroke="#222" stroke-width="2" fill="none"/><circle cx="95" cy="78" r="2.2" fill="#d4af5a"/>` : ""}
   </g>
  </g>
  <rect x="58" y="120" width="84" height="32" rx="4" fill="#26262b" stroke="#3b3b42"/>
  <rect class="lid" x="58" y="120" width="84" height="32" rx="4" fill="none" stroke="#d4af5a" stroke-width="1.6" opacity="0"/>
  <circle cx="100" cy="136" r="8" fill="none" stroke="#d4af5a" stroke-width="1"/><text x="100" y="139" text-anchor="middle" font-size="8" font-family="Georgia,serif" fill="#d4af5a">MP</text>
  <rect x="50" y="151" width="100" height="4" rx="2" fill="#1b1b1f"/>
  <rect x="4" y="154" width="192" height="12" rx="4" fill="#6a4631"/><rect x="12" y="166" width="176" height="22" fill="#3a2619"/><rect x="12" y="166" width="176" height="3" fill="#2a1a10"/>
  <g class="prop">${PROPS[p.prop]}</g>
  <g><rect x="152" y="138" width="13" height="15" rx="2" fill="#efe5d6"/><path d="M165 142q6 0 6 5t-6 5" stroke="#efe5d6" stroke-width="2" fill="none"/>
   <g class="steam" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".55"><path d="M155 134q-3-4 0-8"/><path d="M161 134q-3-4 0-8" style="animation-delay:.7s"/></g></g>
  </svg>`;
}

const OFFICE_ORDER = ["strategist", "researcher", "creator", "designer", "community", "analyst"];
let officeReady = false, prevStatus = {}, lastFinished = null;

const skyFor = (h) => (h >= 7 && h < 17 ? ["#5f9fd0", "#a8d3ee", "#f0e6c9", 0] : h >= 17 && h < 20 ? ["#3b1f3f", "#b5603f", "#e8a45a", 0] : ["#060d1c", "#10203d", "#23365e", 1]);
function ambient() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60, [t, m, b, st] = skyFor(d.getHours());
  const s = document.getElementById("skyg"); if (s) { const c = s.children; c[0].setAttribute("stop-color", t); c[1].setAttribute("stop-color", m); c[2].setAttribute("stop-color", b); }
  const stars = document.getElementById("stars"); if (stars) stars.style.opacity = st;
  const hh = document.getElementById("clk-h"), mm = document.getElementById("clk-m");
  if (hh) { hh.setAttribute("transform", `rotate(${(h % 12) * 30} 30 30)`); mm.setAttribute("transform", `rotate(${d.getMinutes() * 6} 30 30)`); }
}
function buildOffice(root) {
  const lamp = (id) => `<svg class="lamp" viewBox="0 0 160 190"><defs><linearGradient id="cone-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></linearGradient></defs><path class="cone" d="M52 30h56l44 160H8z" fill="url(#cone-${id})"/><path d="M80 0v14" stroke="#4a3a30" stroke-width="2"/><path class="shade" d="M58 14h44l14 16H44z"/></svg>`;
  const plant = (cls) => `<svg class="plant ${cls}" width="74" height="120" viewBox="0 0 74 120"><g fill="#2f6b4a"><path class="lf" d="M37 86C20 70 14 44 22 22C34 40 40 64 37 86Z"/><path class="lf" d="M37 86C54 72 62 50 54 28C42 44 34 66 37 86Z" fill="#3a8259"/><path class="lf" d="M37 86C30 62 34 38 40 14C48 40 46 64 37 86Z" fill="#276043"/></g><path d="M18 86h38l-5 30H23z" fill="#8a4d34"/><rect x="16" y="82" width="42" height="7" rx="3" fill="#a05b3e"/></svg>`;
  const bottle = (x, c, y = 36) => `<g><rect x="${x}" y="${y}" width="16" height="24" rx="3" fill="${c}"/><rect x="${x + 5}" y="${y - 6}" width="6" height="7" fill="#e6d7b8"/><rect x="${x + 2}" y="${y + 4}" width="3" height="14" rx="1.5" fill="#fff" opacity=".18"/></g>`;
  root.innerHTML = `
  <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>
  <div class="wainscot"></div>
  <div class="dust">${Array.from({ length: 16 }, () => `<span style="left:${Math.random() * 100}%;animation-duration:${9 + Math.random() * 9}s;animation-delay:${-Math.random() * 14}s"></span>`).join("")}</div>
  <div class="decor">
   <div class="art"><svg viewBox="0 0 200 96" width="210">
    <rect x="1" y="1" width="198" height="94" rx="7" fill="url(#skyg)" stroke="#3a2c28" stroke-width="4"/>
    <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0"/><stop offset=".55"/><stop offset="1"/></linearGradient>
    <g id="stars" style="transition:opacity 1s">${[[20, 14], [48, 30], [80, 10], [120, 24], [150, 12], [178, 34], [100, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#fff"/>`).join("")}</g>
    <g style="animation:drift 14s ease-in-out infinite alternate" fill="#fff" opacity=".55"><ellipse cx="60" cy="30" rx="20" ry="6"/><ellipse cx="76" cy="26" rx="14" ry="6"/><ellipse cx="150" cy="40" rx="18" ry="5"/></g>
    <path d="M0 96V66L30 42L52 60L82 30L114 62L142 38L174 64L200 50V96Z" fill="#1d1218" opacity=".92"/><path d="M82 30L72 44L82 40L90 46Z" fill="#e9dfe9" opacity=".75"/>
    <path d="M100 1v94M1 48h198" stroke="#3a2c28" stroke-width="4"/></svg></div>
   <div class="sign"><b>FRAGANCE</b><i>MP</i><small>Perfumes árabes · nicho · diseñador</small></div>
   <div class="shelf">
    <svg class="clock" viewBox="0 0 60 60" width="62"><circle cx="30" cy="30" r="27" fill="#14100e" stroke="#c9a24b" stroke-width="2.5"/>${Array.from({ length: 12 }, (_, i) => `<line x1="30" y1="6" x2="30" y2="${i % 3 ? 9 : 11}" stroke="#c9a24b" stroke-width="${i % 3 ? 1 : 2}" transform="rotate(${i * 30} 30 30)"/>`).join("")}<line id="clk-h" x1="30" y1="30" x2="30" y2="17" stroke="#f3e9dc" stroke-width="2.6" stroke-linecap="round"/><line id="clk-m" x1="30" y1="30" x2="30" y2="11" stroke="#f3e9dc" stroke-width="1.8" stroke-linecap="round"/><circle cx="30" cy="30" r="2.4" fill="#c9a24b"/></svg>
    <svg viewBox="0 0 200 90" width="200"><rect x="4" y="60" width="192" height="7" rx="2" fill="#5a3d2b"/><rect x="4" y="24" width="192" height="6" rx="2" fill="#5a3d2b"/>
     ${bottle(16, "#8f3a4a", 36)}${bottle(44, "#d4af5a", 38)}${bottle(72, "#2f3d52", 36)}${bottle(130, "#5a1f2b", 38)}${bottle(160, "#c9a24b", 36)}${bottle(30, "#d4af5a", 2)}${bottle(88, "#8f3a4a", 2)}${bottle(142, "#2f3d52", 2)}</svg>
   </div>
  </div>
  <div class="rug"></div>${plant("l")}${plant("r")}
  <div class="stations">${OFFICE_ORDER.map((id) => {
    const p = PEOPLE[id];
    return `<div class="stn idle" data-id="${id}">${lamp(id)}<div class="bubble"><b class="bt"></b><span class="bs"></span></div>${personSVG(p, id)}
    <div class="plate"><strong><span class="led"></span>${p.name}</strong><small>${p.role}</small></div><div class="pb"><i></i></div></div>`;
  }).join("")}</div>`;
  officeReady = true; ambient(); setInterval(ambient, 30000);
}

function handoff(root, fromId, toId) {
  const a = root.querySelector(`[data-id=${fromId}] .person`), b = root.querySelector(`[data-id=${toId}] .person`);
  if (!a || !b) return;
  const r = root.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  const x1 = ra.left - r.left + ra.width / 2, x2 = rb.left - r.left + rb.width / 2, y = ra.top - r.top + 70;
  const el = document.createElement("div");
  el.className = "paper"; el.textContent = "📄";
  root.appendChild(el);
  el.animate([{ transform: `translate(${x1}px,${y}px) scale(.8)`, opacity: 0 }, { transform: `translate(${(x1 + x2) / 2}px,${y - 50}px) scale(1.2)`, opacity: 1, offset: .5 }, { transform: `translate(${x2}px,${y}px) scale(.8)`, opacity: 0 }], { duration: 1100, easing: "ease-in-out" }).onfinish = () => el.remove();
}

function updateOffice(root, agents, tm) {
  if (!officeReady) buildOffice(root);
  for (const id of OFFICE_ORDER) {
    const a = agents[id], el = root.querySelector(`[data-id=${id}]`);
    const was = prevStatus[id], now = a.status;
    if (was === "working" && now !== "working") lastFinished = { id, t: Date.now() };
    if (now === "working" && was !== "working" && lastFinished && lastFinished.id !== id && Date.now() - lastFinished.t < 6000) handoff(root, lastFinished.id, id);
    prevStatus[id] = now;
    el.className = "stn " + now;
    const bt = el.querySelector(".bt"), bs = el.querySelector(".bs");
    if (now === "working") { bt.textContent = a.task; bs.innerHTML = `${esc(a.step)} <span class="dots"><span></span><span></span><span></span></span>`; }
    else if (now === "done") { bt.textContent = "¡Listo!"; bs.textContent = a.task || ""; }
    else if (now === "error") { bt.textContent = "Hubo un problema"; bs.textContent = a.task; }
    else { bt.textContent = "En espera"; bs.textContent = a.lastRun ? "último trabajo " + tm(a.lastRun) : "listo para trabajar"; }
    el.querySelector(".pb i").style.width = (now === "working" || now === "done" ? a.progress : 0) + "%";
  }
}
