# Fragance MP · Equipo de agentes para Instagram

Panel local donde ves trabajar a 5 agentes: **Estratega, Creador, Diseñador, Community Manager y Analista**.
Sin API de Instagram: los agentes dejan **borradores** y vos publicás y copiás las respuestas (aprobación humana siempre).

## Uso
```bash
npm start                      # http://localhost:3000
ANTHROPIC_API_KEY=sk-... npm start   # modo real (sin key = modo demo con textos de ejemplo)
```

## Configuración (`config.json`)
- `catalogUrl`: link de la web con precios (los agentes leen el catálogo desde ahí). **Pendiente de completar.**
- `faq`: completá envíos, pagos y cambios. El Community Manager NO inventa: si el dato dice COMPLETAR, escala el mensaje a vos.

## Flujo diario
1. **Crear publicación de hoy** → Estratega (plan) → Creador (copy + slides) → Diseñador (brief para Canva) → queda en *borrador*.
2. Revisás, editás el texto, **Aprobás**, la subís a Instagram y la marcás *publicada*.
3. Cargás alcance/guardados/compartidos/DMs → **Analizar métricas** → el Estratega usa eso en el próximo plan.
4. Pestaña **Mensajes**: pegás el DM, recibís respuesta lista; los reclamos y mayoristas quedan *escalados*.
