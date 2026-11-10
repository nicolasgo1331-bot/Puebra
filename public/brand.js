// Taller de marca: pone el logo sobre las imágenes con transparencia. Todo ocurre en tu navegador (canvas);
// las imágenes y el logo no se suben a ningún lado.
const B = { logo: null, logoOpaque: false, imgs: [] };
try { const d = localStorage.logo; if (d) loadLogo(d); } catch {}

function loadLogo(src) {
  const im = new Image();
  im.onload = () => {
    // Si el logo no tiene transparencia (fondo negro), se mezcla en modo "screen": el negro desaparece.
    const c = document.createElement("canvas"); c.width = c.height = 32;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0, 32, 32);
    const d = x.getImageData(0, 0, 32, 32).data; let a = 255;
    for (let i = 3; i < d.length; i += 4) a = Math.min(a, d[i]);
    B.logoOpaque = a > 250; B.logo = im; brandDraw();
  };
  im.src = src;
}
function brandLogoFile(f) {
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { localStorage.logo = r.result; } catch {} loadLogo(r.result); };
  r.readAsDataURL(f);
}
function brandImgFiles(files) {
  B.imgs = []; let n = 0; const list = [...files];
  list.forEach((f, i) => { const im = new Image(); im.onload = () => { B.imgs[i] = { im, name: f.name.replace(/\.[^.]+$/, "") }; if (++n === list.length) brandDraw(); }; im.src = URL.createObjectURL(f); });
}
const bv = (id) => document.getElementById(id).value;

function drawLogo(ctx, W, H) {
  const size = W * (+bv("b-size") / 100), op = +bv("b-op") / 100, m = W * 0.035, pos = bv("b-pos");
  let lw, lh;
  if (B.logo) { lw = size; lh = size * B.logo.height / B.logo.width; } else { lw = size; lh = size * 0.62; }
  let x = (W - lw) / 2, y = pos.includes("top") ? m : pos.includes("bottom") ? H - lh - m : (H - lh) / 2;
  if (pos.includes("left")) x = m; if (pos.includes("right")) x = W - lw - m;
  ctx.save(); ctx.globalAlpha = op;
  if (B.logo) { if (B.logoOpaque) ctx.globalCompositeOperation = "screen"; ctx.drawImage(B.logo, x, y, lw, lh); }
  else { // logo provisorio hasta que subas el tuyo
    ctx.fillStyle = "#d4af5a"; ctx.strokeStyle = "#d4af5a"; ctx.lineWidth = lw * 0.012; ctx.textAlign = "center";
    ctx.beginPath(); ctx.arc(x + lw / 2, y + lh * 0.3, lh * 0.27, 0, 7); ctx.stroke();
    ctx.font = `700 ${lh * 0.2}px Georgia,serif`; ctx.fillText("MP", x + lw / 2, y + lh * 0.37);
    ctx.font = `${lh * 0.14}px Georgia,serif`; ctx.fillText("F R A G A N C E", x + lw / 2, y + lh * 0.92);
  }
  ctx.restore();
}
function brandDraw() {
  const box = document.getElementById("b-out"); if (!box) return;
  box.innerHTML = "";
  B.imgs.forEach((o, i) => {
    if (!o) return;
    const c = document.createElement("canvas"); c.width = o.im.naturalWidth; c.height = o.im.naturalHeight;
    const ctx = c.getContext("2d"); ctx.drawImage(o.im, 0, 0); drawLogo(ctx, c.width, c.height);
    const w = document.createElement("div"); w.className = "card"; w.style.width = "230px";
    c.style.cssText = "width:100%;border-radius:8px;display:block";
    const b = document.createElement("button"); b.className = "sm"; b.style.marginTop = "8px"; b.textContent = "Descargar";
    b.onclick = () => brandSave(c, `fragance-mp-${String(i + 1).padStart(2, "0")}`);
    w.append(c, b); box.append(w);
  });
}
function brandSave(c, name) { const a = document.createElement("a"); a.href = c.toDataURL("image/jpeg", 0.95); a.download = name + ".jpg"; a.click(); }
function brandSaveAll() { [...document.querySelectorAll("#b-out canvas")].forEach((c, i) => setTimeout(() => brandSave(c, `fragance-mp-${String(i + 1).padStart(2, "0")}`), i * 400)); }
function brandInit() { brandDraw(); }
