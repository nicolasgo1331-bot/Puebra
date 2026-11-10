// Los 3 prompts del carrusel de producto de Fragance MP, armados por código a partir de los datos del perfume.
// Así el texto del método (referencia = verdad absoluta, PROHIBIDO, etc.) no cambia nunca entre piezas.

const SCENES = [
  { re: /acu[aá]tic|fresc|menta|marin|c[ií]tric|bergamota|pomelo|lim[oó]n|lavanda/i, s: {
    surface: "losa de pizarra oscura y húmeda con pequeñas pozas de agua cristalina",
    bg: "lago de montaña aguamarina entre neblina suave y bosque de cipreses desenfocado",
    palette: "aguamarina, verde menta, champagne y destellos rosados y naranjas",
    light: "luz fría de mañana con luz de borde y brillos de agua", extra: "gotas de agua" } },
  { re: /vainilla|caramelo|dulce|gourmand|canela|d[aá]til|praline|pralin|tonka|chocolate|caf[eé]/i, s: {
    surface: "mármol negro pulido con vetas doradas y reflejos suaves",
    bg: "interior de lujo cálido desenfocado, terciopelo borravino y luces doradas con bokeh",
    palette: "borravino, ámbar, dorado y crema", light: "luz cálida de vela con luz de borde dorada", extra: "destellos dorados" } },
  { re: /oud|[aá]mbar|tabaco|incienso|especiad|pimienta|az[aá]far[aá]n|cuero|oriental/i, s: {
    surface: "madera oscura de nogal con detalles dorados",
    bg: "atardecer en el desierto con dunas desenfocadas y cielo ámbar",
    palette: "ámbar, cobre, dorado y negro", light: "luz dorada de atardecer con luz de borde cálida", extra: "destellos de arena dorada" } },
  { re: /jazm[ií]n|rosa|flor|peon[ií]a|iris|violeta|azahar/i, s: {
    surface: "mármol blanco con vetas grises suaves",
    bg: "jardín al amanecer desenfocado con neblina rosada",
    palette: "rosa empolvado, marfil, champagne y verde salvia", light: "luz suave de amanecer con luz de borde delicada", extra: "pétalos y gotas de rocío" } },
];
const DEFAULT_SCENE = {
  surface: "losa de piedra oscura con textura natural",
  bg: "bosque de cedros al atardecer con neblina suave, desenfocado",
  palette: "verde bosque, marrón cálido y dorado", light: "luz cálida lateral con luz de borde", extra: "destellos de luz" };

export const noteList = (p) => String(p.notes || "").split(/,|\sy\s/).map((s) => s.trim()).filter(Boolean);
export const sceneFor = (p) => (SCENES.find((x) => x.re.test(`${p.notes} ${p.family}`)) || { s: DEFAULT_SCENE }).s;

const upper = (s) => s.toUpperCase();
const pct = (d = "") => (/larga|alta|intensa|mucha/i.test(d) ? 85 : /corta|baja|ligera|suave/i.test(d) ? 35 : 60);
const occIcons = (o = "") => (/noche|fiesta|salida/i.test(o) ? "luna, copas, estrella" : "sol, copas, coctel");

export function buildImagePrompts(p) {
  const sc = sceneFor(p), notes = noteList(p), full = `${p.brand} ${p.name}`;
  const missing = [];
  if (!notes.length) missing.push("notas olfativas");
  if (!p.gender) missing.push("género");
  if (!p.duration) missing.push("duración");
  if (!p.occasion) missing.push("ocasión");

  const scene = `ESCENA:
- Superficie: ${sc.surface}. Debe verse como una base real: textura, humedad o pulido natural, sombras de contacto y reflejos coherentes con el material.
- Fondo: ${sc.bg}. Natural, creíble y con profundidad (bokeh suave), pensado para que el perfume se sienta intenso.
- Notas olfativas (${notes.join(", ") || p.family}) integradas de forma artística y elegante alrededor y al fondo, con ligero desenfoque: ingredientes reales de esas notas con detalles frescos, ${sc.extra}. Nada tapa el frasco ni la caja.
- Paleta: ${sc.palette}.
- Luz: ${sc.light}. Iluminación de estudio cinematográfica, luz de borde que defina el contorno, reflejos creíbles.`;

  const p1 = `Fotografía comercial de producto de alta gama, formato cuadrado 1:1.

PRODUCTO (la imagen de referencia es la verdad absoluta):
El perfume ${full} y su caja a juego, exactamente como en la referencia: misma forma, proporciones, colores, materiales, tapa, tipografías, logos, patrones y textos impresos. No rediseñes, no simplifiques y no inventes ni cambies ninguna letra del empaque. Mantén la disposición de la referencia (frasco y caja uno junto al otro, la caja ligeramente detrás), ambos centrados como héroes de la imagen y a escala realista entre sí.

${scene}

CALIDAD: fotorrealista, texturas hiperrealistas, ultra detallado, 8K, nitidez en el producto y profundidad de campo fotográfica.

PROHIBIDO: texto o logos añadidos que no estén en el producto, marcas de agua, manos, botellas extra, estelas o aros de luz, deformar el frasco o la caja, ilustración o aspecto CGI plástico.`;

  const p2 = `Usa la imagen de la escena como base y rehaz exactamente la misma fotografía, pero SOLO con el frasco de perfume, centrado y sin su caja. Formato cuadrado 1:1.

- El frasco debe ser idéntico a la imagen de referencia del producto (forma, color, tapa, tipografías, logos y patrones). No cambies ninguna letra impresa.
- Mantén igual: la superficie, el fondo, los elementos de las notas, la paleta, la luz y el nivel de desenfoque. No cambies la escena.
- Reencuadra con el frasco al centro y ligeramente más grande (ocupando ~45% del alto), con sombras de contacto y reflejos correctos sobre la base.
- Calidad máxima, fotorrealista, 8K.

PROHIBIDO: caja, texto añadido, marcas de agua, estelas o aros de luz, deformar el frasco.`;

  const icons = notes.map((n, i) => `${i + 1}. ${upper(n)}`).join("\n");
  const rows = [
    p.gender && `- Ícono dorado minimalista + "GÉNERO" y debajo "${upper(p.gender)}"`,
    p.duration && `- Ícono dorado minimalista + "DURACIÓN" y debajo "${upper(p.duration)}", con una barra de progreso dorada llena al ${pct(p.duration)}%`,
    p.occasion && `- Ícono dorado minimalista + "OCASIÓN" y debajo "${upper(p.occasion)}", con pequeños íconos dorados: ${occIcons(p.occasion)}`,
  ].filter(Boolean).join("\n");
  const p3 = `Usa la imagen del frasco solo como base y crea una versión informativa, formato cuadrado 1:1, respetando exactamente el fondo, la superficie, la luz y la calidad de esa foto, y el frasco idéntico (forma, color, tipografías y logos, sin alterar letras).

Superpón con diseño publicitario premium, limpio y minimalista:

IZQUIERDA — columna vertical de ${notes.length} íconos circulares con borde dorado fino, apilados de forma limpia y a igual distancia. Cada ícono contiene una fotografía macro hiperrealista del ingrediente y debajo su nombre en mayúsculas doradas, en este orden exacto:
${icons}

DERECHA — panel de cristal translúcido flotante (glassmorphism sutil, bordes redondeados) con tipografía dorada moderna, muy legible. Contenido exacto, sin cambiar ni una letra:
- Título: "PERFIL DE LA FRAGANCIA"
${rows}

El frasco permanece centrado, sin tapar nada, y los paneles no lo cubren. Todo el texto en español perfecto, sin errores ni letras inventadas. Estilo publicitario premium, render 3D cinematográfico, 4K, máxima calidad.

PROHIBIDO: líneas de luz curvas, aros tipo burbuja, estelas luminosas alrededor del frasco, texto extra, marcas de agua, datos distintos a los indicados.`;

  return {
    missing,
    images: [
      { role: "1 · Frasco + caja en la escena", attach: `Adjuntá la foto de referencia del producto (${full}, frasco y caja).`, prompt: p1 },
      { role: "2 · Solo el frasco", attach: "Adjuntá la imagen 1 ya generada (escena) y la foto de referencia del producto.", prompt: p2 },
      { role: "3 · Infográfico de notas y perfil", attach: "Adjuntá la imagen 2 ya generada (frasco solo).", prompt: p3 },
    ],
  };
}
