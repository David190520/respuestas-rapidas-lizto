# TODO — Respuestas Rápidas Lizto Software

Tareas de mejora ordenadas por prioridad. Cada ítem está redactado para
pasárselo directamente a Claude Code con el contexto necesario.

> Al terminar una tarea: moverla a **✅ Completadas** (al final de este archivo)
> y agregar la entrada correspondiente en `CHANGELOG.md`. Ver "Proceso de
> documentación permanente" en `CLAUDE.md`.

---

## 🔨 En curso

*(Nada en curso.)* El TODO-13 (tab de Diagnóstico) ya está mergeado en `main` y
verificado contra el Apps Script desplegado.

---

## 🧭 Plan por fases

El detalle de cada fase (alcance, archivos, aceptación y riesgos) está en
`PLAN.md`. Pendientes, en el orden propuesto:

- **TODO-27 — Diagnóstico con checklist y escalamiento** (Fase 5)
- **TODO-28 — Sugerencias según el uso** (Fase 6; requiere aprobar `lizto_usage`)
- **TODO-29 — Atajos desde Sheets y modo Flujo** (Fases 4 y 7, opcionales)

---

*(Sin tareas sueltas: el trabajo pendiente está en "Plan por fases".)*

---

## ✅ Completadas

Detalle e historial completo en `CHANGELOG.md`.

- **TODO-16 — Persistir tema y densidad** *(descartado 2026-10-09)*
  Se resolvió distinto: el tema sigue al sistema operativo (TODO-24) y la
  densidad no se persiste, por decisión de David.
- **TODO-26 — Respuestas y Plantillas desde Sheets** *(2026-10-09)*
  Pestañas `Respuestas` y `Plantillas`, respaldo en `defaults.js`, tokens
  `holaCliente`/`encabezadoCliente`, chips de categoría y caché offline.
  Absorbe TODO-10, TODO-12 y TODO-18. **Pendiente de David:** cargar los CSV y
  desplegar el Apps Script (ver `apps-script/migracion/LEEME.md`).
- **TODO-10 — Chips de filtro por categoría** *(2026-10-09)* Hecho dentro del TODO-26.
- **TODO-12 — Eliminar los IDs duplicados `copiarBtn`** *(2026-10-09)* Hecho dentro del TODO-26.
- **TODO-18 — Cachear la última respuesta del Apps Script** *(2026-10-09)*
  Cacheado en `sw.js`. Queda sin hacer solo el aviso "datos sin conexión" para
  Paso a paso y Diagnóstico (Respuestas/Plantillas ya muestran su aviso).
- **TODO-25 — Saludo según la hora** *(2026-10-08)*
  Tokens `saludoHora`/`SaludoHora`, hora de Colombia, refresco al cruzar de
  periodo.
- **TODO-24 — Escapar HTML de Sheets y tema según el SO** *(2026-10-08)*
  `escapeHtml()` en Paso a paso y Diagnóstico; el tema sigue al sistema
  operativo hasta que el agente usa el toggle.
- **TODO-17 — Fallback offline para navegación en el service worker**
  Ya implementado en `networkFirst()` de `sw.js` (si falla la red en una
  navegación, responde con `./index.html` cacheado).
- **TODO-30 — Nuevos atajos** *(2026-10-08)*
  Asignaciones semanales, Buscar documento DIAN y Hoja de Excel - Soporte.
- **TODO-31 — Fix de tarjetas especiales** *(2026-10-08)*
  Link y botón copiar siempre debajo del textarea, a cualquier zoom.
- **TODO-23 — Fijar tarjetas (pin) y fechas sin fines de semana** *(2026-10-07)*
  Botón pin por tarjeta con persistencia en `lizto_pinned_cards`; selector de
  fechas de reunión sin sábados ni domingos. Solicitud directa.
- **TODO-22 — Rediseño visual alineado con lizto.co** *(2026-10-07)*
  Nueva paleta y tipografía, modo oscuro derivado del teal, barra superior,
  tarjetas y transiciones nuevas, y modal centrado en lugar del drawer.
  Solicitud directa.
- **TODO-15 — Unificar el favicon con el ícono de la PWA** *(2026-10-07)*
  `<link rel="icon">` apunta a `icon.svg`.
- **TODO-14 — Renombrar `logo-removebg-preview.png`** *(2026-10-07)*
  Obsoleto: se eliminó el archivo junto con la marca de agua (el logo es ahora
  un SVG inline en la barra superior).

- **TODO-01 — Persistir nombre del agente con localStorage** *(2026-06-26)*
  Claves `lizto_agent_name` y `lizto_client_name`, restauradas antes del primer
  `updateMessages()`.
- **TODO-02 — Confirmación visual en botón copiar** *(2026-06-26)*
  "¡Copiado! ✅" por 1.5 s con el botón deshabilitado, en tarjetas, drawer,
  Paso a paso y Diagnóstico.
- **TODO-03 — Buscador global** *(2026-06-26)*
  `#globalSearch` filtra las 5 tabs con badges de conteo por tab. Los
  buscadores locales de Paso a paso y Diagnóstico se conservaron y se
  sincronizan con el global (no se eliminaron).
- **TODO-04 — Atajos de teclado** *(2026-06-26)*
  `/` y `Ctrl+F` enfocan el buscador, `Esc` cierra el drawer o limpia la
  búsqueda, con hint "/ para buscar".
- **TODO-05 — Formatear vista previa de Paso a paso** *(2026-06-26)*
  `formatearContenidoPasoAPaso()` genera `<ol>`, `<ul>`, callouts `⚠️` y
  enlaces. El copiado sigue usando el string crudo del objeto de datos
  (no se usó `dataset.textoPlano`; el resultado es equivalente).
- **TODO-06 — Ícono sol/luna** *(2026-06-27)*
  `#toggleBrillo` con `SUN_SVG`/`MOON_SVG` inline, `title` y `aria-label`.
- **TODO-07 — Responsive completo** *(2026-06-27)*
  Breakpoints en 1200 / 1024 / 768 / 480 px y botón "← Volver" en móvil para
  Paso a paso y Diagnóstico.
- **TODO-09 — PWA instalable** *(2026-06-26)*
  `manifest.json`, `icon.svg`, `sw.js` cache-first y registro del service
  worker.
- **TODO-19 — Contenedor propio para las 3 special cards** *(2026-08-13)*
  `.special-cards-container` al final del tab Respuestas: 2 columnas en
  desktop/tablet ("Puede realizar el pago" + "Paso a paso" lado a lado,
  "Enlace para reunión" a ancho completo debajo) y 1 columna en mobile.
  `order: 10` lo mantiene al final aunque las tarjetas normales se rendericen
  dinámicamente. No pedido en un TODO previo; entró como solicitud directa.
- **TODO-20 — Tarjeta "Saludo-Consulta"** *(2026-08-25)*
  Nueva `.response-card` en Respuestas (`#saludoConsulta`), justo después de
  "Saludo". Pregunta al cliente si prefiere el paso a paso por enlace, por chat
  o por nota de voz. No pedido en un TODO previo; entró como solicitud directa.
- **TODO-21 — Arreglar la caché que obligaba a hard reload** *(2026-08-25)*
  El app shell (`index.html`, `index.js`, `style.css` y las navegaciones) pasó
  de cache-first a network-first en `sw.js`, con `cache: "no-cache"` para
  saltarse el `max-age` de GitHub Pages y la caché como respaldo offline.
  El registro del SW usa `updateViaCache: "none"`. Los agentes ya ven el último
  merge en el primer reload normal. No pedido en un TODO previo; entró como
  solicitud directa.

> **TODO-08 no existe.** La numeración original saltaba de TODO-07 a TODO-09;
> no hay una tarea perdida.

---

## Notas para Claude Code

- Implementar un TODO a la vez y verificar que no rompe funcionalidades existentes.
- Antes de cada implementación, leer `CLAUDE.md` para entender el contexto completo.
- El texto copiado al portapapeles es sagrado: SIEMPRE debe ser texto plano.
- Al terminar: entrada en `CHANGELOG.md` + mover la tarea a ✅ Completadas.
- Hacer commit después de cada TODO completado con mensaje descriptivo.
