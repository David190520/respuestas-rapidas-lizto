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

## [Sin publicar] — 2026-10-08 (Fase 5: Diagnóstico con checklist y escalamiento)

### Agregado

- **Checklist en Diagnóstico.** Los ítems de lista de cada caso se muestran como
  casillas, con barra de progreso ("3 de 5 revisados"), botón "Reiniciar" y
  mensaje al completarlos. Estado solo en memoria: se conserva al reabrir el mismo
  caso y se reinicia al abrir otro. Los casos sin listas se ven igual que antes.
- **"No encontré la causa → preparar escalamiento".** Panel con un mensaje de
  texto plano **editable** para desarrollo: categoría, caso, campos vacíos
  (negocio, NIT, sede/usuario afectado, qué ocurre), pasos revisados y no
  revisados, y quién reporta. Botón "Copiar mensaje". El botón de escalamiento se
  resalta cuando todos los pasos están marcados.

### Cambiado

- `formatearContenidoPasoAPaso()` se apoya ahora en `parsearBloquesContenido()` y
  `extraerItemsLista()`, y acepta `{ checklist: true }`. Su salida para Paso a
  paso es idéntica a la anterior.
- El botón **Copiar** del artículo de Diagnóstico sigue copiando el string crudo
  del Sheet (verificado).

---

## [Sin publicar] — 2026-10-08 (títulos recortados en Paso a paso y Diagnóstico)

### Corregido

- **Los títulos de las listas de Paso a paso y Diagnóstico se recortaban** cuando la
  lista no cabía en pantalla (p. ej. con zoom del navegador de 100 % o más).
  Causa: el rediseño volvió `.help-items-list` una columna flex y los
  `.help-item` conservaban `flex-shrink: 1`; como tienen `overflow: hidden`, en
  lugar de hacer scroll se encogían y cortaban el texto. Ahora `.help-item` usa
  `flex-shrink: 0` y la lista `min-height: 0`, de modo que la lista hace scroll.
  Verificado con 19 artículos y 10 categorías simuladas: 0 ítems recortados y
  lista con scroll.

---

## [Sin publicar] — 2026-10-09 (404 intermitentes de Apps Script)

### Corregido

- **404 intermitentes y latencias de 20–40 s del Apps Script.** Diagnóstico: en
  mediciones secuenciales con pausas, 3 de 12 peticiones devolvieron 404 con la
  página de Drive "No se pudo abrir el archivo en este momento" (el script no
  logra abrir el Spreadsheet en esa ejecución, antes de que corra su `try/catch`).
  No depende del navegador, de la cuenta ni de la app. Cambios:
  - `apps-script/Codigo.gs`: caché de 15 min por pestaña (`CacheService`), copia
    de respaldo de 6 h usada si la hoja no abre, `onEdit()` que invalida la caché
    en ediciones manuales, `limpiarCache()`, `calentarCache()` (para un activador
    cada 10 min) y `?refrescar=1`. El contrato de datos no cambia.
    Verificado con una simulación de `SpreadsheetApp`/`CacheService` (15 casos).
  - `sw.js`: si Google responde 404/5xx o un `{status:"error"}` y hay una copia
    buena guardada, se sirve esa copia (antes solo se usaba si la red fallaba del
    todo). Verificado en 7 escenarios.
- Requiere que David pegue el `Codigo.gs` nuevo y despliegue una **nueva versión**
  (ver `apps-script/migracion/LEEME.md`, sección 2b).

---

## [Sin publicar] — 2026-10-09 (Respuestas y Plantillas desde Sheets)

### Agregado

- **Respuestas y Plantillas se leen de Google Sheets (Fase 3).** Cada tab usa su
  pestaña (`?hoja=respuestas` / `?hoja=plantillas`) con las columnas
  `id | categoria | titulo | texto | orden | activo`. Las tarjetas se generan con
  `construirTarjeta()` en vez de estar fijas en el HTML.
- **Respaldo:** `defaults.js` (`RESPUESTAS_DEFAULT`, `PLANTILLAS_DEFAULT`) se pinta
  al instante y solo lo reemplazan filas válidas del Sheet. Si el fetch falla
  (con un reintento por los 404 transitorios de Google) aparece un aviso
  discreto; una pestaña vacía conserva el respaldo.
- **Tokens nuevos** `holaCliente` y `encabezadoCliente`, resueltos junto con
  `nombreAgente`/`saludoHora` por `resolverTokens()` en una sola pasada. Se
  verificó que los textos con tokens generan **exactamente** el mismo mensaje que
  el código anterior (240 comparaciones: 20 textos × 4 combinaciones de
  cliente/agente × 3 horas).
- **Chips de filtro por categoría (TODO-10)** en Respuestas y Plantillas,
  generados de los datos (+ "Herramientas" para las special cards). Se combinan
  con el buscador global y los badges cuentan el resultado combinado.
- **Caché offline de datos (TODO-18):** `sw.js` guarda la última respuesta buena
  de cada pestaña del Sheet en `respuestas-rapidas-datos` y la usa sin conexión.
  Solo guarda arrays (Apps Script responde 200 con `{status:"error"}`).
- `apps-script/migracion/`: `Respuestas.csv`, `Plantillas.csv` y `LEEME.md` con
  los pasos para cargar los textos actuales y actualizar el Apps Script.
- Reglas del Sheet: `activo` = `NO`/`FALSE` oculta; `orden` numérico; `id` vacío o
  repetido se corrige solo; `\n` escrito a mano cuenta como salto de línea.

### Cambiado

- `apps-script/Codigo.gs`: se agregan `respuestas` y `plantillas` al mapa `HOJAS`
  (`doGet` y `leerHoja` no cambian; Paso a paso y Diagnóstico no se tocan).
- Los títulos y textos del Sheet se insertan con `textContent`/`value`, nunca con
  `innerHTML`.
- `sw.js`: `CACHE_NAME` a `respuestas-rapidas-v7` (nuevo `defaults.js`);
  `activate` conserva la caché de datos.
- Paso a paso y Diagnóstico reintentan una vez si Apps Script falla
  (`fetchConReintento()`); su contrato con el script no cambia.

### Corregido

- **TODO-12:** se eliminan los `id="copiarBtn"` duplicados (los 3 de las special
  cards pasan a `class="copy-btn"`; el resto desaparece al generar las tarjetas).

---

## [Sin publicar] — 2026-10-08 (seguridad, tema del SO y saludo por hora)

### Agregado

- **Saludo según la hora (Fase 2).** Nuevos tokens `saludoHora` / `SaludoHora`
  y la función `saludoHora()`: "buen día", "buenas tardes" o "buenas noches"
  según la hora de Colombia (no la del PC del agente). Aplicado a Saludo, Fallo
  del sistema, Módulos y capacitaciones, Solicitar comprobante y la plantilla ID
  Set de Pruebas. Se recalcula al cruzar de periodo y al volver a la pestaña,
  para que un turno largo no quede con el saludo de la mañana.
- **El tema sigue al sistema operativo (Fase 1b).** La app arranca en claro u
  oscuro según `prefers-color-scheme` y acompaña el cambio del sistema hasta que
  el agente usa el toggle. No se persiste. Un script en `<head>` evita el
  parpadeo oscuro → claro, y se declara `color-scheme` para los controles
  nativos (selects, scrollbars).

### Cambiado

- La clase `light-mode` pasa de `<body>` a `<html>` y los tokens a `.light-mode`.
- `addUserText()` reemplaza **todas** las apariciones de `nombreAgente`.

### Corregido

- **Seguridad (Fase 1a):** el contenido de Paso a paso y Diagnóstico (Google
  Sheets) se insertaba con `innerHTML` sin escapar, por lo que una fila con HTML
  malicioso habría ejecutado código en la sesión de los agentes. Ahora
  `escapeHtml()` escapa todo y `linkify()` solo genera enlaces `http(s)`, sin
  incluir la puntuación final en la URL. El copiado sigue usando el string crudo.

---

## [Sin publicar] — 2026-10-08 (atajos y plan)

### Agregado

- **Atajos:** "Asignaciones semanales" (Zoho Desk), "Buscar documento DIAN" y
  "Hoja de Excel - Soporte" en el tab Atajos.
- `PLAN.md`: plan de implementación por fases con decisiones tomadas, contrato
  con el Apps Script y criterios de aceptación.
- `apps-script/Codigo.gs`: copia de referencia del Apps Script desplegado.

---

## [Sin publicar] — 2026-10-08 (fix tarjetas especiales)

### Corregido

- **"Puede realizar el pago" y "Paso a paso":** el campo Link y el botón de
  copiar quedaban al lado del textarea cuando la tarjeta era lo bastante ancha
  (zoom del navegador por debajo de ~175 %). Ahora `.special-card-body` es
  siempre una columna: textarea arriba, Link y botón copiar debajo, a cualquier
  ancho o zoom.

---

## [Sin publicar] — 2026-10-07 (tarjetas fijadas)

### Agregado

- **Fijar tarjetas.** Cada tarjeta de Respuestas y Plantillas tiene un botón pin;
  las fijadas suben al inicio de su tab, con borde y fondo destacados, y se
  recuerdan entre sesiones en `localStorage` (`lizto_pinned_cards`). El resto
  mantiene su orden original y el modal navega en el orden visible.

### Corregido

- **Enlace para reunión:** el selector de fechas ya no muestra sábados ni
  domingos (no se dan capacitaciones esos días).
- El valor de cada fecha se calculaba con `toISOString()` (UTC); después de las
  7 p.m. en Colombia podía quedar un día adelantado. Ahora usa la fecha local.

---

## [Sin publicar] — 2026-10-07

### Cambiado

- **Rediseño visual alineado con lizto.co.** Nueva paleta (teal `#12b5ac`, tinta
  `#0e1a1c`, tinte `#def5f3`, rosa `#cc3366` como énfasis) y fuente Plus Jakarta
  Sans en lugar de Poppins/Montserrat/Inter. El modo oscuro deja de ser morado:
  deriva de la misma paleta teal. Todo el CSS se reescribió sobre tokens
  (`--accent-ink`, `--accent-solid`, `--on-accent`, `--bubble-bg`, sombras,
  radios, `--ease`/`--dur`) y se eliminó casi toda la capa de overrides de
  `body.light-mode`.
- **Barra superior fija** con logo (SVG inline), campos Cliente/Agente y toggle
  de tema, en lugar del título centrado. Buscador en píldora y tabs tipo
  segmented control.
- **Tarjetas** más redondeadas, con sombra y elevación al hover, preview de 3
  líneas y animación de entrada escalonada. Grilla fluida `auto-fill`, sin
  `!important` en móvil.
- **El drawer lateral pasó a ser un modal centrado** (hoja inferior en móvil),
  con fondo difuminado, animación de escala, burbuja de mensaje, navegación
  ←/→ con teclado, foco atrapado, bloqueo de scroll y retorno del foco. IDs y
  funciones renombrados `drawer*` → `modal*`.
- Paso a paso y Diagnóstico: sidebar con items en píldora, etiqueta de
  categoría tipo chip, contraste de enlaces y callouts por tokens.
- `manifest.json`: `theme_color` y `background_color` de la nueva paleta.
  `icon.svg` rehecho con el isotipo de Lizto.
- `sw.js`: `CACHE_NAME` a `respuestas-rapidas-v6`.

### Corregido

- Favicon: ahora usa `icon.svg` en lugar de un `.ico` base64 heredado (TODO-15).

### Eliminado

- `logo-removebg-preview.png` y la marca de agua de fondo (el logo vive ahora en
  la barra superior). Esto vuelve obsoleto el TODO-14.

---

## [Sin publicar] — 2026-08-25

### Agregado

- **Tarjeta "Saludo-Consulta"** en el tab Respuestas (`#saludoConsulta`),
  inmediatamente después de "Saludo". Ofrece al cliente las tres formas de
  recibir el paso a paso: enlace, explicación por chat o nota de voz.
  Compone el saludo con el prefijo `hola` y el nombre del agente igual que
  "Saludo" y "Fallo del sistema", así que respeta los fallbacks
  `"un agente"` / `"Hola,"`. Registrada en `RESPUESTAS_CARD_IDS`.

### Corregido

- **La app ya no se queda pegada en la versión anterior tras un despliegue.**
  El service worker servía `index.html`, `index.js` y `style.css` con
  estrategia cache-first, así que un agente que entraba con la app ya cacheada
  seguía viendo la versión vieja y necesitaba un hard reload (`Ctrl+Shift+R`)
  para ver el último merge. Cambios en `sw.js`:
  - El app shell (navegaciones, `.html`, `.js`, `.css`) pasa a **network-first**
    con la caché como respaldo offline. El resto de assets (`icon.svg`,
    `logo-removebg-preview.png`, `manifest.json`) sigue cache-first porque
    prácticamente no cambia.
  - Las peticiones del app shell se hacen con `cache: "no-cache"` para que la
    caché HTTP del navegador no devuelva la copia anterior dentro del
    `max-age=600` que envía GitHub Pages.
  - El handler de `fetch` ignora los métodos distintos de `GET` y las
    peticiones cross-origin.
  - `CACHE_NAME` a `respuestas-rapidas-v5`.
- `index.js`: el service worker se registra con `updateViaCache: "none"` y se
  fuerza un `registration.update()`, para que el propio `sw.js` nunca se sirva
  desde la caché HTTP y los despliegues se detecten de inmediato.

  Validado en Chrome headless simulando un despliegue sobre una app ya
  cacheada: con el `sw.js` anterior, dos reloads normales seguían mostrando la
  versión vieja y solo el hard reload traía la nueva; con el corregido, el
  primer reload normal ya trae la versión nueva —incluso sin subir
  `CACHE_NAME`— y el modo offline sigue funcionando.

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

- **Layout de las 3 special cards** (2026-08-13) — dejan de ocupar cada una una
  fila completa del grid principal y pasan a un contenedor propio
  `.special-cards-container`, ubicado al final del listado de Respuestas:
  - Desktop/tablet: grilla interna de 2 columnas, con "Puede realizar el pago" y
    "Paso a paso" lado a lado y "Enlace para reunión" debajo a ancho completo
    (`grid-column: 1 / -1`). El `gap` replica el de `.text-fields` en cada
    breakpoint (50 / 30 / 15 px).
  - Mobile (≤768 px): las 3 tarjetas apiladas en una sola columna, con métricas
    idénticas a las previas (sin cambios visuales respecto de producción).
  - `.special-card-body` usa `flex-wrap` con `flex-basis` para que, en la
    columna más angosta, los controles bajen debajo del textarea en vez de
    comprimirse: el input de link pasa de 349 px a 423 px de ancho en desktop.
    El `flex-basis` se anula en mobile, donde el eje principal es vertical y
    habría fijado la *altura* de textarea y controles.
  - El contenedor lleva `order: 10`, de modo que sigue quedando al final aunque
    las tarjetas normales pasen a renderizarse dinámicamente (migración a
    Sheets) o en modo compacto, donde conserva el diseño de 1 columna.
  - El buscador global oculta el contenedor cuando ninguna de sus 3 tarjetas
    coincide, para que no deje un hueco vacío en la grilla.
  - Sin cambios en la lógica de copiado ni en los inputs de link/selects.
- El buscador global ahora también filtra Diagnóstico y actualiza su badge.
- Al cambiar el nombre del agente o del cliente se re-renderizan las previews
  de las tarjetas y el contenido del drawer si está abierto.
- Cambiar de tab cierra el drawer abierto.
- `sw.js`: `CACHE_NAME` a `respuestas-rapidas-v4`.

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
