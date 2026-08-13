# TODO — Respuestas Rápidas Lizto Software

Tareas de mejora ordenadas por prioridad. Cada ítem está redactado para
pasárselo directamente a Claude Code con el contexto necesario.

> Al terminar una tarea: moverla a **✅ Completadas** (al final de este archivo)
> y agregar la entrada correspondiente en `CHANGELOG.md`. Ver "Proceso de
> documentación permanente" en `CLAUDE.md`.

---

## 🔨 En curso

### TODO-13 — Terminar y commitear el tab de Diagnóstico

**Estado:** implementado en la rama `david-implement-checklist-tab`, sin commitear.

Cambios sin commitear en `index.html`, `index.js`, `style.css` y `sw.js`:
clase `DiagnosticoCenter`, drawer compartido, modo compacto y chips de
variantes del saludo.

**Pendiente:**

- Verificar que el Apps Script desplegado responde a `?hoja=diagnostico` con
  columnas `categoria`, `subtitulo`, `contenido` (si no, el tab muestra
  "Aún no hay casos de diagnóstico disponibles").
- Commitear y abrir PR.
- Renombrar la rama o el PR: se llama `checklist-tab` pero lo que entrega es
  el tab de **Diagnóstico**.

---

## 🔴 Alta prioridad

### TODO-10 — Chips de filtro por categoría en Respuestas y Plantillas

**Objetivo:** filtrar tarjetas por categoría sin tener que escribir en el buscador.

**Comportamiento esperado:**

- Agregar una propiedad `categoria` a cada respuesta/plantilla. Hoy los textos
  son strings sueltos asignados por ID dentro de `updateMessages()`; requiere
  primero pasarlos a un array de objetos
  (`{ id, titulo, categoria, texto }`) sin cambiar el markup existente.
- Generar los chips dinámicamente a partir de las categorías únicas (no
  hardcodear la lista de chips).
- Un chip activo filtra las tarjetas del tab; "Todas" limpia el filtro.
- El filtro por chip y el buscador global deben **combinarse**, no pisarse:
  si hay chip activo y texto de búsqueda, se aplican los dos.
- Los badges de conteo por tab deben reflejar el resultado combinado.

**Archivos a modificar:** `index.js`, `index.html`, `style.css`

---

### TODO-12 — Eliminar los IDs duplicados `copiarBtn`

**Objetivo:** corregir HTML inválido y quitar deuda técnica.

**Problema:** hay ~20 botones con `id="copiarBtn"` en `index.html`. Los IDs
deben ser únicos; el código funciona de casualidad porque usa
`querySelectorAll('button#copiarBtn')`.

**Comportamiento esperado:**

- Reemplazar `id="copiarBtn"` por `class="copy-btn"` en todos los botones.
- Actualizar el selector de `index.js` y las reglas `#copiarBtn` de
  `style.css` (`#copiarBtn`, `#copiarBtn:hover`, `#copiarBtn:disabled`).
- Verificar que `initResponseCards()` sigue ocultando el botón original
  (hoy lo busca con `card.querySelector('button[id="copiarBtn"]')`).
- No debe cambiar nada visualmente ni en el comportamiento de copiado.

**Archivos a modificar:** `index.html`, `index.js`, `style.css`

---

## 🟡 Prioridad media

### TODO-14 — Renombrar `logo-removebg-preview.png`

**Objetivo:** nombre descriptivo en vez del nombre que dejó la herramienta de
edición de imágenes.

**Comportamiento esperado:**

- `git mv logo-removebg-preview.png logo-watermark.png`.
- Actualizar las 2 referencias en `style.css` (regla `body` y `body.light-mode`).
- Actualizar `STATIC_ASSETS` en `sw.js` y subir `CACHE_NAME`.
- Actualizar la mención en `CLAUDE.md` y `README.md`.

**Archivos a modificar:** `style.css`, `sw.js`, `CLAUDE.md`, `README.md`

---

### TODO-15 — Unificar el favicon con el ícono de la PWA

**Objetivo:** que la pestaña del navegador y la app instalada muestren el mismo ícono.

**Problema:** `index.html` embebe un favicon `data:image/x-icon;base64` heredado
que no tiene relación con `icon.svg`, que es el que usa `manifest.json`.

**Comportamiento esperado:**

- Reemplazar el `<link rel="icon">` base64 por `<link rel="icon" type="image/svg+xml" href="icon.svg">`.
- Verificar que se ve bien en pestaña clara y oscura.

**Archivos a modificar:** `index.html`

---

### TODO-16 — Persistir tema y densidad (requiere aprobación)

**Objetivo:** que el agente no tenga que volver a activar modo claro o vista
compacta en cada recarga.

**Nota:** `CLAUDE.md` restringe el uso de `localStorage` a `lizto_agent_name` y
`lizto_client_name`. **Acordar antes de implementar.**

**Comportamiento esperado (si se aprueba):**

- Guardar el tema en `lizto_theme` (`"dark"` | `"light"`) y aplicarlo antes del
  primer render para evitar el parpadeo de modo oscuro → claro.
- Guardar la densidad en `lizto_density` (`"normal"` | `"compact"`) y aplicarla
  al iniciar.
- El estado inicial sin valor guardado sigue siendo oscuro + normal.

**Archivos a modificar:** `index.js`

---

## 🟢 Prioridad baja

### TODO-17 — Fallback offline para navegación en el service worker

**Objetivo:** que la PWA instalada no muestre la pantalla de error del navegador
al abrirse sin conexión.

**Comportamiento esperado:**

- En el handler de `fetch`, si `event.request.mode === "navigate"` y la red
  falla, responder con `caches.match("./index.html")`.
- No cambiar la estrategia cache-first del resto de assets ni el manejo
  network-first del Apps Script.

**Archivos a modificar:** `sw.js`

---

### TODO-18 — Cachear la última respuesta exitosa del Apps Script

**Objetivo:** que Paso a paso y Diagnóstico muestren los últimos artículos
conocidos cuando no hay conexión, en vez de un array vacío.

**Comportamiento esperado:**

- En `sw.js`, guardar en un caché aparte la última respuesta OK de cada
  endpoint (`exec` y `exec?hoja=diagnostico`).
- Si la red falla, devolver esa copia; solo devolver `[]` si nunca hubo una
  respuesta exitosa.
- Mostrar en la UI un aviso discreto de "datos sin conexión" cuando aplique.

**Archivos a modificar:** `sw.js`, `index.js`

---

## ✅ Completadas

Detalle e historial completo en `CHANGELOG.md`.

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

> **TODO-08 no existe.** La numeración original saltaba de TODO-07 a TODO-09;
> no hay una tarea perdida.

---

## Notas para Claude Code

- Implementar un TODO a la vez y verificar que no rompe funcionalidades existentes.
- Antes de cada implementación, leer `CLAUDE.md` para entender el contexto completo.
- El texto copiado al portapapeles es sagrado: SIEMPRE debe ser texto plano.
- Al terminar: entrada en `CHANGELOG.md` + mover la tarea a ✅ Completadas.
- Hacer commit después de cada TODO completado con mensaje descriptivo.
