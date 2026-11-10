# Fragance MP · Equipo de agentes para Instagram

> **Inicio rápido:** instalá Node.js (nodejs.org, botón LTS) y hacé doble clic en `Iniciar.bat` (Mac: `Iniciar.command`). Ver `LEEME-PRIMERO.txt`.

Panel local donde ves trabajar a 5 agentes: **Estratega, Creador, Diseñador, Community Manager y Analista**.
Sin API de Instagram: los agentes dejan **borradores** y vos publicás y copiás las respuestas (aprobación humana siempre).

## Uso
```bash
npm start                      # http://localhost:3000
ANTHROPIC_API_KEY=sk-... npm start   # modo real (sin key = modo demo con textos de ejemplo)
```

## Configuración (`config.json`)
- `catalogUrl`: ya apunta a https://fragancemp.netlify.app (requiere ANTHROPIC_API_KEY para leer la web; si falla, usa un catálogo de ejemplo y lo avisa).
- `faq`: completá envíos, pagos y cambios. El Community Manager NO inventa: si el dato dice COMPLETAR, escala el mensaje a vos.

## Flujo diario
1. **Crear publicación de hoy** → Estratega (plan) → Creador (copy + slides) → Diseñador (brief para Canva) → queda en *borrador*.
2. Revisás, editás el texto, **Aprobás**, la subís a Instagram y la marcás *publicada*.
3. Cargás alcance/guardados/compartidos/DMs → **Analizar métricas** → el Estratega usa eso en el próximo plan.
4. Pestaña **Mensajes**: pegás el DM, recibís respuesta lista; los reclamos y mayoristas quedan *escalados*.

## Carrusel de 3 imágenes
Botón **Carrusel 3 imágenes** (elegís el perfume): slide 1 gancho, slide 2 perfil olfativo, slide 3 cierre con CTA.
El Diseñador deja un **prompt de imagen** por slide (copiable). Para que respete tu estilo, completá `imageStyle` en `config.json`
con tus prompts de modelos/fotos de ejemplo.

## Método de imágenes de Fragance MP (3 prompts)
Para cada perfume el Diseñador arma, por código, los 3 prompts del método: (1) frasco + caja en la escena, (2) solo el frasco, (3) infográfico de notas y perfil.
La escena se elige según la familia olfativa. Datos del perfume: `notes`, `gender`, `duration`, `occasion` (si falta alguno, el panel avisa y no lo inventa).
Pestaña **Logo e imágenes**: sube tu logo y tus imágenes y se pone el logo con transparencia (todo en tu navegador).

## Investigador y generación de imágenes
- **Investigador:** si a un perfume le faltan notas, género, duración u ocasión, un agente los busca en la web (herramienta de búsqueda de la API de Claude) antes de crear el carrusel.
  Lo investigado se marca en la publicación con las fuentes: **verificalo antes de publicar** (la duración es subjetiva).
- **Imágenes con IA:** el Diseñador genera las 3 imágenes encadenadas (1 → 2 → 3) con la API de Gemini, usando la foto de referencia del producto
  (la que subís en la tarjeta de la publicación, o la URL `image` del catálogo).
  Requiere `GEMINI_API_KEY`. El modelo se cambia en `config.json` (`imageModel`).
  `GEMINI_API_KEY=... ANTHROPIC_API_KEY=... npm start`
- **Logo:** `public/logo.png` se usa por defecto; "Descargar con logo" lo aplica con la transparencia que elegiste en la pestaña Logo e imágenes.

## Perfumes que no están en el catálogo
Escribí cualquier perfume en el campo del carrusel: si no está en el catálogo (o la web no se pudo leer), se agrega y el Investigador busca marca, notas, género, duración y ocasión en la web. Requiere `ANTHROPIC_API_KEY`.
El logo se aplica abajo al centro por defecto (se puede cambiar en la pestaña Logo e imágenes).

## Que trabaje solo (gratis o lo más barato posible)

**Piloto automático:** en el panel, activalo y elegí la hora. Todos los días crea la publicación del día (borrador). Si la compu estaba apagada, lo hace apenas la prendés.
Los domingos analiza las métricas si cargaste alguna. Vos solo aprobás y subís a Instagram.
Aviso al celular (gratis, opcional): instalá la app **ntfy**, elegí un nombre largo e impredecible y ponelo en `config.json` → `notify.ntfyTopic`. Solo se envía el título de la pieza.

**Costo de la IA, controlado:**
- Cada agente usa su modelo en `config.json` → `models`: Haiku (el más barato) para todo y Sonnet solo para escribir el copy.
- El carrusel de 3 imágenes gasta ~2 llamadas: investigar (solo si faltan datos) y escribir. Los prompts de imagen los arma el código.
- Lo investigado se guarda; un perfume se investiga como máximo 1 vez por día.
- **Topes** (`limits`): 40 llamadas y 250.000 tokens por día. Al llegar, los agentes se frenan con un aviso. El panel muestra el gasto del día.
- **Gratis:** con `"provider": "gemini"` y `GEMINI_API_KEY` el texto usa Gemini (tiene capa gratuita con límites; revisá sus condiciones de uso de datos y no pegues datos personales de clientes ahí).
- **Imágenes:** lo más barato es generarlas con tu herramienta de siempre usando los prompts del panel. La generación automática (`GEMINI_API_KEY`) se paga por imagen.

**Dónde correrlo sin pagar hosting:** en tu compu (o una vieja) con `npm start`. Para 24/7 gratis: una PC/notebook vieja, un celular Android con Termux, o una VM "Always Free" de Oracle Cloud (pide tarjeta solo para verificar).
