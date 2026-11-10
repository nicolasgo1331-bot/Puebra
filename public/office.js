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

function buildOffice(root) {
  root.innerHTML = `
  <div class="decor">
   <svg viewBox="0 0 200 90" width="200"><rect x="1" y="1" width="198" height="88" rx="6" fill="url(#sky)" stroke="#3a2c28" stroke-width="3"/>
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1f3f"/><stop offset=".6" stop-color="#b5603f"/><stop offset="1" stop-color="#e8a45a"/></linearGradient></defs>
    <path d="M0 90V62L28 40L48 58L78 28L110 60L138 36L170 62L200 48V90Z" fill="#1d1218"/><path d="M78 28L68 42L78 38L86 44Z" fill="#e9dfe9" opacity=".7"/><path d="M100 1v88M1 45h198" stroke="#3a2c28" stroke-width="3"/></svg>
   <div class="sign"><b>FRAGANCE</b><i>MP</i><small>Perfumes árabes · nicho · diseñador</small></div>
   <svg viewBox="0 0 200 90" width="200"><rect x="4" y="60" width="192" height="8" rx="2" fill="#5a3d2b"/><rect x="4" y="22" width="192" height="6" rx="2" fill="#5a3d2b"/>
    ${[[18, "#8f3a4a"], [44, "#d4af5a"], [70, "#2f3d52"], [128, "#5a1f2b"], [158, "#c9a24b"]].map(([x, c]) => `<g><rect x="${x}" y="${x % 2 ? 36 : 38}" width="16" height="24" rx="3" fill="${c}"/><rect x="${x + 5}" y="${x % 2 ? 30 : 32}" width="6" height="7" fill="#e6d7b8"/></g>`).join("")}
    ${[[30, "#d4af5a"], [88, "#8f3a4a"], [140, "#2f3d52"]].map(([x, c]) => `<g><rect x="${x}" y="0" width="14" height="22" rx="3" fill="${c}"/><rect x="${x + 4}" y="-5" width="6" height="6" fill="#e6d7b8"/></g>`).join("")}</svg>
  </div>
  <div class="stations">${OFFICE_ORDER.map((id) => {
    const p = PEOPLE[id];
    return `<div class="stn idle" data-id="${id}"><div class="bubble"><b class="bt"></b><span class="bs"></span></div>${personSVG(p, id)}
    <div class="plate"><strong>${p.name}</strong><small>${p.role}</small></div><div class="pb"><i></i></div></div>`;
  }).join("")}</div>`;
  officeReady = true;
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
