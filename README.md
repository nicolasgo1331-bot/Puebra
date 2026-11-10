# Fragance MP · Equipo de agentes para Instagram

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
