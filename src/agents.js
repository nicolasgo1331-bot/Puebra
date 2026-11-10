import { ask, parseJson } from "./llm.js";
import { catalogText } from "./catalog.js";

export const AGENTS = {
  strategist: { name: "Estratega", role: "Planifica la semana de contenido" },
  creator: { name: "Creador", role: "Escribe copy, guion y slides" },
  designer: { name: "Diseñador", role: "Define el brief visual de cada pieza" },
  community: { name: "Community Manager", role: "Redacta respuestas a mensajes" },
  analyst: { name: "Analista", role: "Lee métricas y ajusta la estrategia" },
};

export const STEPS = {
  strategist: ["Leyendo el catálogo y el historial", "Revisando qué funcionó antes", "Repartiendo contenido 70/20/10", "Armando el calendario de la semana"],
  creator: ["Eligiendo el ángulo de la pieza", "Escribiendo el gancho de la primera slide", "Redactando el desarrollo", "Puliendo el copy y los hashtags", "Pensando las historias del día"],
  designer: ["Definiendo paleta y tipografías", "Pensando la composición de cada slide", "Escribiendo prompts para Canva"],
  community: ["Leyendo el mensaje", "Buscando datos en catálogo y FAQ", "Redactando la respuesta", "Chequeando si hay que escalarlo"],
  analyst: ["Juntando las métricas", "Comparando formatos y pilares", "Armando recomendaciones"],
};

const voice = (c) => `Marca: ${c.brand.name} (${c.brand.instagram}). Vende: ${c.brand.sells}
País: ${c.brand.country}. Idioma: ${c.brand.language}. Tono: ${c.brand.tone}
Reglas: no inventes precios, stock ni promociones; no hagas afirmaciones médicas; no prometas "dura 24 horas" sin matices; no compares con marcas de forma denigrante; no uses la palabra "clon".`;

async function json(cfg, system, prompt, mock) {
  const out = await ask({ model: cfg.model, system: system + "\nRespondé SOLO con JSON válido.", prompt, maxTokens: 3000 });
  return out ? parseJson(out) : mock();
}

export async function strategist(cfg, catalog, history) {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  return json(cfg, `Sos el estratega de contenido de Instagram. ${voice(cfg)}`,
    `Catálogo:\n${catalogText(catalog)}\n\nHistorial reciente: ${JSON.stringify(history.slice(-8))}\n
Armá el plan de 7 días (una publicación de feed por día más ${cfg.storiesPerDay} historias). Regla 70/20/10: 70% valor educativo, 20% prueba social, 10% venta directa. Variá formatos (carrusel, reel, imagen, historias).
JSON: [{"day","format":"carrusel|reel|imagen","pillar":"educativo|social|venta","topic","goal"}]`,
    () => days.map((day, i) => ({
      day, format: ["carrusel", "reel", "carrusel", "imagen", "carrusel", "reel", "imagen"][i],
      pillar: i === 3 ? "social" : i === 5 ? "venta" : "educativo",
      topic: ["Cómo leer la pirámide olfativa", "3 formas de aplicar perfume para que dure más", "Notas gourmand: qué son y a quién le van",
        "Reseña de cliente: primera impresión", "Perfumes árabes vs diseñador: qué cambia", "Unboxing de un pedido", "Cómo elegir fragancia según la ocasión"][i],
      goal: ["guardados", "compartidos", "guardados", "confianza", "comentarios", "consultas por DM", "seguidores nuevos"][i],
    })));
}

export async function creator(cfg, catalog, item) {
  return json(cfg, `Sos el creador de contenido de Instagram. ${voice(cfg)}`,
    `Catálogo (usalo solo si el tema lo pide):\n${catalogText(catalog)}\n\nPieza a crear: ${JSON.stringify(item)}\n
Escribí contenido de VALOR real (que enseñe algo concreto), con gancho fuerte en la primera slide y CTA suave al final (guardar/compartir/escribir por DM).
JSON: {"title","caption","hashtags":[],"slides":[{"headline","body"}],"stories":[{"idea","sticker"}]}
Para formato "imagen" una sola slide; para "reel" slides = escenas con texto en pantalla (máx 6).`,
    () => ({
      title: item.topic,
      caption: `✨ ${item.topic}\n\nGuardalo para cuando elijas tu próxima fragancia 🤍\n\nContanos en comentarios: ¿cuál es tu nota favorita?\n\n[Borrador de demostración: cargá ANTHROPIC_API_KEY para texto real]`,
      hashtags: ["#perfumesarabes", "#fragancias", "#perfumeargentina", "#fragancemp", "#olfato"],
      slides: [
        { headline: item.topic, body: "Deslizá →" },
        { headline: "Salida", body: "Lo primero que sentís: notas ligeras que duran minutos." },
        { headline: "Corazón", body: "El carácter del perfume, aparece a los 10-15 minutos." },
        { headline: "Fondo", body: "Lo que queda en la piel durante horas." },
        { headline: "¿Cuál es tu favorito?", body: "Guardalo y escribinos por DM 🤍" },
      ],
      stories: [{ idea: "Encuesta: ¿dulce o amaderado?", sticker: "encuesta" }, { idea: "Caja de preguntas sobre perfumes", sticker: "preguntas" }].slice(0, cfg.storiesPerDay),
    }));
}

export async function designer(cfg, post) {
  return json(cfg, `Sos el director de arte de ${cfg.brand.name}. Estética de lujo: fondos oscuros (negro/borravino), dorado, tipografía serif elegante, mucho aire.`,
    `Pieza: ${JSON.stringify({ title: post.title, format: post.format, slides: post.slides })}\n
JSON: {"palette":[],"fonts":"","slides":[{"visual":"descripción de imagen/fondo/composición","canvaPrompt":"prompt corto para Canva/IA de imagen"}],"notes":""}`,
    () => ({
      palette: ["#0E0B0A", "#C9A24B", "#F3E9DC", "#5A1F2B"], fonts: "Serif (Playfair/Cormorant) + sans fina (Montserrat)",
      slides: post.slides.map((s, i) => ({ visual: i === 0 ? "Frasco protagonista sobre fondo oscuro con luz cálida lateral" : "Fondo liso borravino, texto centrado en dorado", canvaPrompt: `Slide ${i + 1} de carrusel de perfume de lujo, fondo oscuro, detalles dorados, texto: ${s.headline}` })),
      notes: "Mantener márgenes de 10% y máximo 25 palabras por slide.",
    }));
}

export async function community(cfg, catalog, message) {
  return json(cfg, `Sos el community manager de ${cfg.brand.name}. ${voice(cfg)}
Información oficial (única fuente válida para envíos, pagos y políticas): ${JSON.stringify(cfg.faq)}
Si el dato dice COMPLETAR o no está en el catálogo/FAQ, NO lo inventes: escalá.
Escalá siempre: quejas, reclamos, devoluciones, pedidos mayoristas, enojo, temas legales o cualquier dato faltante.`,
    `Catálogo:\n${catalogText(catalog)}\n\nMensaje del cliente: """${message}"""\n
Respuesta breve (2-4 líneas, cálida, con 1 emoji como máximo), cerrando con una pregunta que avance la venta.
JSON: {"reply","intent":"precio|disponibilidad|envio|recomendacion|queja|mayorista|otro","escalate":true|false,"reason"}`,
    () => {
      const t = message.toLowerCase();
      const hard = /(reclamo|queja|devol|estafa|mayorista|no lleg|roto)/.test(t);
      return hard
        ? { reply: "Lamento mucho lo que pasó 🤍 Ya le paso tu caso a una persona del equipo para que te escriba a la brevedad.", intent: "queja", escalate: true, reason: "Posible reclamo o tema sensible [demo]" }
        : { reply: "¡Hola! Gracias por escribirnos ✨ Contame qué aromas te gustan (dulces, amaderados, frescos) y te recomiendo opciones de nuestro catálogo. [respuesta demo]", intent: "recomendacion", escalate: false, reason: "" };
    });
}

export async function analyst(cfg, posts) {
  const done = posts.filter((p) => p.metrics);
  return json(cfg, `Sos el analista de Instagram de ${cfg.brand.name}.`,
    `Publicaciones con métricas: ${JSON.stringify(done.map((p) => ({ title: p.title, format: p.format, pillar: p.pillar, ...p.metrics })))}\n
JSON: {"summary","best":"qué funcionó mejor y por qué","worst":"","recommendations":["3 acciones concretas para la semana próxima"]}`,
    () => ({
      summary: done.length ? `${done.length} publicaciones medidas.` : "Todavía no hay métricas cargadas. Cargá alcance, guardados y compartidos de cada publicación.",
      best: "Sin datos suficientes [demo]", worst: "", recommendations: ["Cargar métricas de las últimas publicaciones", "Mantener 70% de contenido educativo", "Probar un carrusel de 'dulce vs amaderado'"],
    }));
}
