# TODO — Respuestas Rápidas Lizto Software

Tareas de mejora ordenadas por prioridad. Cada ítem está redactado para
pasárselo directamente a Claude Code con el contexto necesario.

---

## 🔴 Alta prioridad

### TODO-01 — Persistir nombre del agente con localStorage

**Objetivo:** que el agente no tenga que escribir su nombre cada vez que
recarga la página.

**Comportamiento esperado:**

- Al escribir en el campo `#agentInput`, guardar el valor en
  `localStorage` con la clave `"lizto_agent_name"`.
- Al cargar la página, leer `localStorage.getItem("lizto_agent_name")` y
  si existe, pre-llenar `#agentInput` con ese valor y llamar a
  `updateMessages()` automáticamente para que los textareas ya aparezcan
  con el nombre correcto.
- Lo mismo para `#clientInput` con la clave `"lizto_client_name"`.

**Archivos a modificar:** `index.js`

---

### TODO-02 — Confirmación visual en botón copiar

**Objetivo:** dar feedback claro al agente de que el texto fue copiado.

**Comportamiento esperado:**

- Al hacer clic en cualquier botón copiar (`.copy-btn`), cambiar su
  ícono/texto a un ✅ o mostrar el texto "¡Copiado!" por 1.5 segundos.
- Después de 1.5s, volver al estado original (ícono de portapapeles).
- Mientras está en estado "copiado", deshabilitar el botón para evitar
  doble clic.
- Aplicar a TODOS los botones copiar del sitio (Respuestas, Plantillas
  y Paso a paso).

**Archivos a modificar:** `index.js`, posiblemente `styles.css`

---

### TODO-03 — Buscador global (las 3 tabs)

**Objetivo:** un solo input de búsqueda que filtre contenido en las tres
tabs simultáneamente.

**Comportamiento esperado:**

- Agregar un input de búsqueda global visible siempre (no dentro de una
  tab específica), con placeholder "Buscar en respuestas, plantillas,
  artículos...".
- Al escribir, filtrar en tiempo real:
  - Tab **Respuestas**: ocultar tarjetas cuyo título o texto no contenga
    el término (búsqueda case-insensitive).
  - Tab **Plantillas**: igual.
  - Tab **Paso a paso**: ya tiene buscador propio, integrarlo o
    reemplazarlo con este buscador global.
- Si hay resultados en múltiples tabs, mostrar un indicador en cada tab
  con la cantidad de coincidencias (ej: badge "3" sobre la pestaña).
- Si el buscador está vacío, mostrar todo normalmente.
- Mantener el buscador existente de Paso a paso o eliminarlo si el
  global lo reemplaza completamente.

**Archivos a modificar:** `index.html`, `index.js`, `styles.css`

---

### TODO-04 — Atajos de teclado

**Objetivo:** mejorar la velocidad de uso para agentes de teclado.

**Atajos a implementar:**

- `/` o `Ctrl+F` → enfocar el buscador global (TODO-03 debe estar hecho
  primero). Prevenir el comportamiento por defecto del navegador para `/`.
- `Escape` → limpiar el buscador si tiene texto, o cerrarlo si está
  enfocado.
- Mostrar un tooltip o hint visual pequeño junto al buscador indicando
  el atajo disponible (ej: texto muted "/ para buscar").

**Archivos a modificar:** `index.js`

---

### TODO-05 — Formatear vista previa de Paso a paso (sin afectar texto copiado)

**Objetivo:** mejorar la legibilidad visual de los artículos de paso a paso
en el panel de detalle. El texto copiado al portapapeles debe seguir siendo
texto plano idéntico al de Google Sheets.

**Transformaciones visuales SOLO para la vista previa (no para el texto copiado):**

- Líneas que empiecen con número + punto o paréntesis (`1.`, `2.`, `1)`)
  → renderizar como `<ol><li>` en la preview.
- Líneas que empiecen con `⚠️ Importante:` → envolverlas en un
  `<div class="callout-importante">` con borde izquierdo y fondo sutil.
- Líneas que empiecen con `- ` o `• ` → renderizar como `<ul><li>`.
- URLs en el texto → convertirlas en `<a href="..." target="_blank">` clicables.

**Implementación sugerida:**

- Crear una función `formatearContenidoPasoAPaso(textoPlano)` que devuelva
  HTML enriquecido para la vista previa.
- El botón copiar de Paso a paso debe seguir copiando `elemento.dataset.textoPlano`
  (guardar el texto original en un data attribute), NO el innerHTML.

**Archivos a modificar:** `index.js`, `styles.css`

---

## 🟡 Prioridad media

### TODO-06 — Reemplazar botón "Activar Brillo" por ícono sol/luna

**Objetivo:** toggle de dark/light mode estándar e intuitivo.

**Comportamiento esperado:**

- Eliminar el botón de texto "Activar Brillo" de su posición actual.
- Agregar un botón con ícono SVG de sol (☀️ en SVG inline, no emoji) en
  modo oscuro, y luna (🌙 en SVG inline) en modo claro.
- Ubicarlo en la esquina superior derecha del header, de forma fija.
- El ícono debe cambiar suavemente con una pequeña transición al hacer clic.
- Mantener la funcionalidad exacta del toggle actual, solo cambiar la UI.
- Agregar `title="Cambiar tema"` y `aria-label` apropiado para accesibilidad.

**Archivos a modificar:** `index.html`, `index.js`, `styles.css`

---

### TODO-07 — Hacer la página completamente responsive (móvil y tablet)

**Objetivo:** que la herramienta funcione bien en pantallas desde 375px
(móvil) hasta 1440px+ (escritorio).

**Problemas actuales conocidos:**

- Las tarjetas de Respuestas y Plantillas no se adaptan bien en pantallas
  pequeñas.
- Los campos de nombre del agente/cliente pueden quedar fuera de pantalla
  o muy ajustados.
- El layout de dos columnas del tab Paso a paso (sidebar + detalle) colapsa
  mal en móvil.
- El header y tabs pueden desbordarse horizontalmente.

**Comportamiento esperado en móvil (< 768px):**

- Tarjetas en columna única (1 por fila).
- En Paso a paso: la lista de artículos ocupa el 100% del ancho, al hacer
  clic en uno se muestra el detalle (ocultar lista, mostrar detalle con botón
  "← Volver").
- Inputs de nombre en layout vertical (uno debajo del otro).
- Tabs con texto más corto o solo íconos si no caben.
- Touch targets mínimo 44x44px para todos los botones.

**Archivos a modificar:** `styles.css`, posiblemente `index.html` e `index.js`
para la lógica del Paso a paso en móvil.

---

## 🟢 Prioridad baja

### TODO-09 — PWA: instalar como app de escritorio

**Objetivo:** que los agentes puedan instalar la herramienta como app nativa
desde Chrome, sin barra de navegador.

**Archivos a crear:**

- `manifest.json` con nombre "Respuestas Rápidas Lizto", colores de la
  marca, iconos en 192x192 y 512x512 (generar SVG como base y convertir).
- `sw.js` — service worker básico que cachee `index.html`, `index.js`,
  `styles.css` para funcionamiento offline parcial. El fetch a Apps Script
  puede fallar offline, manejarlo gracefully mostrando los datos cacheados
  del último fetch exitoso.

**Archivos a modificar:**

- `index.html` → agregar `<link rel="manifest">` y el meta `theme-color`.
- `index.js` → registrar el service worker.

**Nota:** GitHub Pages sirve sobre HTTPS, por lo que el service worker
funcionará sin configuración adicional.

---

## ✅ Completadas

_(mover ítems aquí cuando se implementen)_

---

## Notas para Claude Code

- Implementar un TODO a la vez y verificar que no rompe funcionalidades existentes.
- Antes de cada implementación, leer `CLAUDE.md` para entender el contexto completo.
- El texto copiado al portapapeles es sagrado: SIEMPRE debe ser texto plano.
- Hacer commit después de cada TODO completado con mensaje descriptivo.
