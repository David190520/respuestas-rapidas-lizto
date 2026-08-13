# CHANGELOG — Respuestas Rápidas Lizto Software

Historial de cambios del proyecto. Las entradas más recientes van arriba.

**Toda implementación debe registrarse aquí** con fecha y descripción breve
antes de darse por terminada (ver `CLAUDE.md`).

Formato: `## [versión o estado] — AAAA-MM-DD`, con secciones
**Agregado** / **Cambiado** / **Corregido** / **Eliminado**.

> Las entradas anteriores al 2026-08-13 fueron reconstruidas retroactivamente
> a partir del historial de git y del código actual. Las fechas provienen de
> los commits; el detalle es la mejor estimación posible y puede omitir
> cambios menores.

---

## [Sin publicar] — rama `david-implement-checklist-tab`

Cambios implementados y sin commitear al 2026-08-13.

### Agregado

- **Tab "Diagnóstico"** — quinto tab, con la clase `DiagnosticoCenter`.
  Reutiliza el layout de Paso a paso pero con navegación de dos niveles en el
  sidebar: categorías → casos de la categoría → contenido. Los datos vienen del
  mismo Apps Script con el parámetro `?hoja=diagnostico`, como array plano de
  `{categoria, subtitulo, contenido}`; el agrupamiento por categoría se hace en
  el frontend. Incluye breadcrumb "Volver a categorías" y búsqueda que, desde
  el buscador global, atraviesa todas las categorías a la vez.
- **Drawer de mensajes** (`#response-drawer`) — panel lateral compartido por
  Respuestas y Plantillas, que se abre con el botón ojo de cada tarjeta.
  Muestra el mensaje completo con navegación anterior/siguiente sobre las
  tarjetas visibles del tab, contador `n / total` y botón de copiado propio.
  Se cierra con `Esc`, con la ✕ o clickeando el overlay.
- **Tarjetas compactas con vista previa** — `initResponseCards()` transforma
  cada `.text-box` en una `.response-card`: oculta el textarea (que queda como
  `.card-data`, fuente de verdad del texto), agrega una preview de 2 líneas,
  el botón ojo y un botón "Copiar" al pie. La tarjeta completa es clickeable
  para copiar, y navegable por teclado (`Tab` + `Enter`/`Espacio`).
- **Modo compacto** — botones de densidad normal/compacta en el tab Respuestas,
  que alternan la clase `compact-mode` sobre la grilla de tarjetas.
- **Variantes de saludo** — chips en el drawer de la tarjeta "Saludo"
  ("¿Cómo puedo ayudarte?", "Dame un momento", "Con mucho gusto") que
  concatenan una frase al final del texto base.
- Tarjeta nueva **"Módulos y capacitaciones"** con los horarios de las sesiones
  grupales y sus enlaces de Zoom.
- Tarjeta nueva **"Plantilla solicitud ID Set Pruebas"** en Plantillas.

### Cambiado

- El buscador global ahora también filtra Diagnóstico y actualiza su badge.
- Al cambiar el nombre del agente o del cliente se re-renderizan las previews
  de las tarjetas y el contenido del drawer si está abierto.
- Cambiar de tab cierra el drawer abierto.
- `sw.js`: `CACHE_NAME` a `respuestas-rapidas-v2`.

---

## [2026-08-13] — Documentación y limpieza

### Agregado

- `README.md` — descripción del proyecto, stack, cómo correrlo localmente,
  estructura de archivos e integración con Google Sheets vía Apps Script.
- `CHANGELOG.md` — este archivo.
- `CLAUDE.md`: sección "Proceso de documentación permanente", que obliga a
  registrar todo cambio aquí y en `TODO.md`.
- `manifest.json`: campos `id`, `scope`, `dir` y `categories`.

### Cambiado

- `CLAUDE.md` reescrito para reflejar el estado real: 5 tabs en vez de 3,
  ruta correcta de `style.css` (estaba documentado como `styles.css`),
  convenciones de fallback de nombres, variables dinámicas, temas, modo
  compacto, drawer y restricciones del entorno.
- `TODO.md` reestructurado: las 8 tareas ya implementadas se movieron a
  "✅ Completadas" y se agregaron las pendientes reales.
- `sw.js`: `CACHE_NAME` a `respuestas-rapidas-v3`.

### Corregido

- `sw.js`: `STATIC_ASSETS` no incluía `logo-removebg-preview.png` (la marca de
  agua de fondo usada por `style.css` en ambos temas), por lo que no cargaba
  sin conexión. Se agregó junto con la raíz `./`.

---

## [2026-07-02] — Tab de Atajos

### Agregado

- **Tab "Atajos"** — cuarto tab, con tarjetas generadas desde el array `atajos`
  de `index.js`. Cada una enlaza a una herramienta externa (por ahora, el
  divisor de archivos) y abre en pestaña nueva.

### Cambiado

- Reordenamiento visual de las tarjetas y ajustes de espaciado para mejorar la
  lectura en grilla.

---

## [2026-06-27] — Rediseño visual, modo claro y campos variables

### Agregado

- **Sistema de temas light/dark** basado en design tokens: custom properties
  definidas en `:root` (oscuro) y sobreescritas en `body.light-mode` (claro),
  cubriendo fondos, texto, bordes y color de acento.
- **Toggle sol/luna** (`#toggleBrillo`) con SVG inline, `title="Cambiar tema"`
  y `aria-label` que se actualiza según el estado.
- **Campos variables**: entrada de enlace en las tarjetas de pago y paso a
  paso, y selectores de fecha / agente / hora para armar el mensaje de reunión
  con el enlace de Zoom correspondiente.
- Animaciones y estados hover en tarjetas, botones y tabs, con
  `@keyframes tab-fade-in`, `pulse` y `fadeInUp`, y respeto por
  `prefers-reduced-motion: reduce`.

### Cambiado

- Responsive reescrito con breakpoints en 1200, 1024, 768 y 480 px.
- En móvil (< 768 px), Paso a paso pasa de dos columnas a lista → detalle con
  botón "← Volver".

---

## [2026-06-26] — Buscador global, PWA y atajos de teclado

### Agregado

- **Buscador global** (`#globalSearch`) que filtra todas las tabs a la vez, con
  badges de conteo de coincidencias sobre cada pestaña y mensaje de "sin
  resultados" por tab. Los buscadores locales de cada tab se conservaron y se
  mantienen sincronizados con el global.
- **Atajos de teclado**: `/` y `Ctrl+F` enfocan el buscador, `Esc` limpia la
  búsqueda o la desenfoca. Hint visual "/ para buscar" junto al campo.
- **PWA instalable**: `manifest.json`, `icon.svg`, service worker `sw.js` con
  estrategia cache-first para estáticos y network-first para el Apps Script, y
  registro del service worker desde `index.js`.
- **Persistencia de nombres** en `localStorage` (`lizto_agent_name`,
  `lizto_client_name`), restaurados al cargar la página antes del primer
  render de los mensajes.
- **Confirmación visual al copiar**: el botón muestra "¡Copiado! ✅" durante
  1.5 s y queda deshabilitado para evitar el doble clic.
- **Formateo de la vista previa de Paso a paso**
  (`formatearContenidoPasoAPaso()`): listas numeradas a `<ol>`, viñetas a
  `<ul>`, líneas con `⚠️` a un callout destacado y URLs convertidas en enlaces.
  El texto copiado sigue siendo el original en texto plano.

---

## [2026-05-06] — Módulo de ayuda (Paso a paso)

### Agregado

- **Tab "Paso a paso"** — tercer tab, con la clase `HelpCenter`: sidebar con
  buscador y lista de artículos, y panel de detalle con botón de copiado.
- Integración con **Google Apps Script** sobre Google Sheets: `doGet` devuelve
  un JSON de `{titulo, contenido}` que la app consume en solo lectura.
- Plantilla de **fallo del sistema**.

---

## [2026-04-01] — Reuniones grupales

### Agregado

- Enlaces de reuniones grupales en los mensajes de agendamiento.

### Corregido

- Layout roto en el rango de 768 px a 1200 px.

---

## [2026-03-31] — Responsive y validación de campos

### Agregado

- Validación que oculta los textarea mientras el campo de agente esté vacío.
  *(Comportamiento posteriormente reemplazado por el fallback `"un agente"`.)*

### Corregido

- Vista móvil, que no era responsive.

---

## [2026-03-25] — Tab de Plantillas

### Agregado

- **Tab "Plantillas"** — segundo tab, con textos largos para las preguntas
  frecuentes de los clientes (facturación electrónica, nómina electrónica,
  API de WhatsApp, WhatsApp LITE y solicitudes por correo).

---

## [2026-03-06] — Versión inicial

### Agregado

- Estructura base en HTML, CSS y JS vanilla, con tema oscuro.
- Tab **Respuestas** con los mensajes de soporte hardcodeados: saludo,
  confirmación de pago, solicitud de comprobante, caso escalado, demoras DIAN,
  pregunta final y despedida.
- Campos "Nombre del cliente" y "Nombre del agente" que se inyectan en los
  textos en tiempo real, con reemplazo del token `nombreAgente` vía
  `addUserText()`.
- Botón de copiado al portapapeles en cada tarjeta.
