# CLAUDE.md — Respuestas Rápidas Lizto Software

## Contexto del proyecto

> **Antes de implementar algo, leer `PLAN.md`**: contiene las decisiones ya
> tomadas, el contrato con el Apps Script y las fases pendientes en orden.

Herramienta interna de soporte para agentes del CRM de Lizto Software
(SaaS multi-tenant para salones de belleza). Permite copiar respuestas
rápidas, plantillas, guías paso a paso y casos de diagnóstico para
agilizar la atención al cliente.

Desplegado en GitHub Pages: https://david190520.github.io/respuestas-rapidas-lizto/
Sin backend propio. Solo HTML + CSS + JS vanilla.

## Stack

- HTML / CSS / JavaScript vanilla (sin frameworks, sin build tools)
- Google Apps Script como API REST (solo lectura) sobre Google Sheets
- GitHub Pages como hosting (archivos estáticos servidos sobre HTTPS)
- PWA: `manifest.json` + service worker (`sw.js`): network-first para el app
  shell (HTML/JS/CSS), cache-first para el resto de assets

## Arquitectura

- `index.html` — estructura y markup de la barra superior, las 5 tabs, el modal y los inputs
- `defaults.js` — textos de **respaldo** de Respuestas y Plantillas (se usan solo
  si Google Sheets no responde)
- `apps-script/` — copia de referencia de `Codigo.gs` y archivos de migración
- `index.js` — toda la lógica: eventos, clases `HelpCenter` y
  `DiagnosticoCenter`, modal, buscador global, atajos de teclado
- `style.css` — estilos globales (ojo: es `style.css`, singular, no `styles.css`)
- `manifest.json` / `sw.js` / `icon.svg` — PWA
- El logo de la barra superior es un SVG inline en `index.html` (no hay
  imágenes de marca como archivos estáticos).

## Tabs actuales (5)

1. **Respuestas** — saludos, pagos, escalamiento, despedida, enlace de reunión.
   Tarjetas generadas desde la pestaña `Respuestas` del Sheet (respaldo:
   `RESPUESTAS_DEFAULT`); las 3 `special-card` siguen en el HTML.
2. **Plantillas** — textos largos de preguntas frecuentes (facturación
   electrónica, nómina, API WhatsApp, solicitudes por correo). Tarjetas
   generadas desde la pestaña `Plantillas` (respaldo: `PLANTILLAS_DEFAULT`).
3. **Paso a paso** — artículos cargados desde Apps Script. Clase `HelpCenter`,
   layout sidebar + panel de detalle.
4. **Diagnóstico** — casos cargados desde Apps Script con `?hoja=diagnostico`.
   Clase `DiagnosticoCenter`, navegación de 2 niveles en el sidebar
   (categorías → casos) + panel de contenido.
5. **Atajos** — enlaces a herramientas externas, generados desde el array
   `atajos` en `index.js`.

## Fuentes de datos

- **Respuestas y Plantillas**: `GET` a `APPS_SCRIPT_URL?hoja=respuestas` y
  `?hoja=plantillas` → array plano de `{id, categoria, titulo, texto, orden,
  activo}` (cada tab es una pestaña distinta del Sheet). Ver "Respuestas y
  Plantillas desde Sheets" más abajo.
- **Paso a paso**: `GET` a `APPS_SCRIPT_URL` → array de `{titulo, contenido}`.
- **Diagnóstico**: `GET` a `APPS_SCRIPT_URL?hoja=diagnostico` → array plano de
  `{categoria, subtitulo, contenido}`. El agrupamiento por categoría se hace
  en el frontend, no en el Apps Script.

El código del Apps Script está copiado en `apps-script/Codigo.gs` (referencia;
el desplegado vive en Google). Ambos endpoints son el mismo despliegue; el parámetro `hoja`
decide qué pestaña del Sheet se lee. Si la lectura falla, el Apps Script
devuelve un objeto `{status:"error"}` en vez de un array — por eso el código
valida `Array.isArray(data)` antes de usarlo.

## Convenciones establecidas

### Respuestas y Plantillas desde Sheets

- **Respaldo siempre disponible:** al cargar, la app pinta primero
  `RESPUESTAS_DEFAULT` / `PLANTILLAS_DEFAULT` (`defaults.js`) y luego pide el
  Sheet. Si el fetch falla (2 intentos) se muestra un aviso discreto y se queda
  el respaldo; si la pestaña está vacía o no tiene filas válidas, se queda el
  respaldo sin aviso. Si el Sheet responde con filas, **reemplazan** a las del
  respaldo (no se mezclan) y solo se vuelve a dibujar si algo cambió.
- `normalizarFilas()` descarta filas sin `titulo`/`texto` o con `activo` en
  `NO`/`FALSE`/`0`, sanea el `id` (`[A-Za-z0-9_-]`, único; vacío → `fila-N`),
  ordena por `orden` (vacío al final, empates por orden de la hoja) y convierte
  `\n` escrito a mano en salto de línea.
- El `id` es la identidad de la tarjeta: las **fijadas** se guardan por `id`
  (`lizto_pinned_cards`). Los `id` por defecto son los históricos
  (`daysMessage`, `calificacion`, ...); no renombrarlos sin avisar.
- La tarjeta con `id` **`daysMessage`** es la del Saludo y la única con chips de
  variante (`SALUDO_VARIANTES`).
- Los títulos, textos y categorías del Sheet se muestran siempre con
  `textContent`/`value`, nunca con `innerHTML`.
- Las tarjetas se generan con `construirTarjeta()`; el `textarea.card-data`
  (oculto) sigue siendo la fuente de verdad para búsqueda, vista previa, modal y
  copiado.
- **Chips de categoría:** se generan de las categorías de los datos (en orden de
  aparición) más "Herramientas" (las special cards, `data-categoria`). Solo se
  muestran si hay 2 o más. El chip activo y el buscador global se **combinan**
  (AND) y los badges cuentan el resultado combinado. El chip no se persiste.
- Si cambia el contrato del Sheet (columnas) hay que tocar `normalizarFilas()`,
  `defaults.js`, `apps-script/Codigo.gs` y `apps-script/migracion/`.

### Variables dinámicas en los textos

- Tokens disponibles: `nombreAgente`, `holaCliente`, `encabezadoCliente`,
  `saludoHora`, `SaludoHora` (todos se resuelven en `resolverTokens()`, en una
  sola pasada).
- El token literal **`nombreAgente`** dentro de un string se reemplaza por el
  nombre del agente vía `addUserText()` (reemplaza todas las apariciones).
  No se usa sintaxis de llaves (`{{...}}`); es un reemplazo de texto plano.
- Los tokens **`saludoHora`** y **`SaludoHora`** se reemplazan por el saludo
  según la hora de Colombia (`America/Bogota`, no la del PC del agente):
  `buenas noches` (00:00–04:59), `buen día` (05:00–11:59), `buenas tardes`
  (12:00–18:59) y `buenas noches` (19:00–23:59). `SaludoHora` va en mayúscula
  inicial (inicio de frase). En textos armados a mano se usa `saludoHora()` /
  `capitalizar()`. Se recalcula al cruzar de periodo y al volver a la pestaña.
- El nombre del cliente se inserta con dos tokens: **`holaCliente`** →
  `Hola <cliente>,` o `Hola,`, y **`encabezadoCliente`** → `Hola <cliente> 👋` +
  salto de línea (si no hay cliente se omite junto con el salto que lo sigue;
  debe ir solo en su línea, antes del texto). `addUserText()` lo aplica a las
  special cards.
- Cualquier texto nuevo que necesite datos del agente o del cliente debe usar
  tokens y pasar por `resolverTokens()` (o `addUserText()` en special cards).

### Fallback de nombres

- Agente vacío → literal **`"un agente"`** (`agentInput.value.trim() || "un agente"`).
- Cliente vacío → el saludo cae a **`"Hola,"`** sin nombre; nunca se
  renderiza un saludo con el nombre vacío.
- Enlace de pago vacío → fallback a `https://lizto.com/pago`.
- Los textos **siempre** se renderizan; no se ocultan por tener campos vacíos.

### Persistencia (localStorage)

Solo tres claves, y son las únicas permitidas hoy:

- `lizto_agent_name`
- `lizto_client_name`
- `lizto_pinned_cards` — JSON con los ids de textarea de las tarjetas fijadas
  (aprobada por el responsable del proyecto al pedir la función de fijar).

Se escriben en cada `input` y se restauran al cargar, antes del primer
`updateMessages()`. **El tema no se persiste**: la app arranca según el tema del
sistema operativo (ver "Sistema de temas").

### Sistema de temas (light/dark) y marca

- La identidad visual sigue la landing https://www.lizto.co: teal `#12b5ac`,
  tinta `#0e1a1c`, tinte `#def5f3`, rosa `#cc3366` solo como énfasis puntual,
  fuente **Plus Jakarta Sans** (Google Fonts) y radios de 10–24 px.
- Design tokens como custom properties en `:root` (oscuro) y sobreescritos en
  `.light-mode` (claro). La clase vive en `<html>`: un script inline en `<head>`
  la aplica antes del primer render para evitar el parpadeo.
- **El tema sigue al sistema operativo** (`prefers-color-scheme`), también
  cuando este cambia, **hasta que el agente usa el toggle**; desde entonces la
  elección manual manda durante la sesión. No se persiste (sin `localStorage`). El modo oscuro deriva de la
  misma paleta teal, no de un morado.
- El toggle `#toggleBrillo` (`applyTheme()`) alterna la clase `light-mode` en
  `<html>`, intercambia los SVG inline `SUN_SVG` / `MOON_SVG` y actualiza el
  `<meta name="theme-color">`.
- **Nunca hardcodear colores** en CSS nuevo: usar los tokens
  (`--bg-main`, `--bg-surface`, `--text-primary`, `--accent`, `--accent-ink`,
  `--accent-solid` + `--on-accent`, `--border-base`, etc.), o el modo claro se
  rompe. `--accent-ink` es el acento para **texto**; `--accent-solid` con
  `--on-accent` es el de **botones rellenos** (cumplen contraste en ambos temas).
- Los tokens `--bg-color`, `--principal-color`, `--secondary-color` y
  `--dark-color` existen solo por retrocompatibilidad; no usarlos en código nuevo.
- Animaciones: solo `transform`/`opacity`, con `var(--ease)` y `var(--dur)`;
  el bloque `prefers-reduced-motion` las desactiva.

### Modo compacto (densidad)

- Tab Respuestas: botones `#densityNormal` / `#densityCompact` alternan la
  clase `compact-mode` sobre `#respuestas .text-fields`.
- Es solo visual y **no se persiste**; vuelve a `normal` al recargar.

### Tarjetas y modal

- `initResponseCards(ids)` convierte cada `.text-box` en `.response-card`:
  oculta el textarea (que pasa a ser `.card-data`, la fuente de verdad del
  texto), agrega preview, botón ojo y botón copiar. Les asigna `--i` (índice)
  para la animación de entrada escalonada.
- El modal (`#response-modal`) es **compartido** por Respuestas y Plantillas,
  centrado en desktop y como hoja inferior en móvil. Navega con ←/→ (o los
  botones) entre las tarjetas visibles del tab actual, atrapa el foco con
  `Tab`, bloquea el scroll del body (`body.modal-open`) y devuelve el foco a la
  tarjeta al cerrar.
- Cada tarjeta tiene un botón pin (`.card-pin-btn`): las fijadas suben al
  inicio de su tab (`reorderCards()` mueve los nodos del DOM, así el modal
  navega en el orden visible). El resto conserva su orden original, guardado
  en `data-order` al inicializar. Los ids se guardan en `lizto_pinned_cards`.
- La tarjeta de Saludo tiene chips de variante (`SALUDO_VARIANTES`) que
  concatenan una frase extra al final del texto base.
- Las tarjetas con controles propios (enlace de pago, paso a paso, reunión)
  son `.special-card` y **no** pasan por `initResponseCards`.

### Buscador y atajos

- `#globalSearch` filtra las 5 tabs a la vez y pinta un badge con el conteo
  por tab. Los buscadores locales de Paso a paso y Diagnóstico siguen
  existiendo y se sincronizan con el global.
- Atajos: `/` y `Ctrl+F` enfocan el buscador; `Esc` cierra el modal o limpia
  el buscador; con el modal abierto, `←`/`→` cambian de mensaje.

### Nombres y estilo

- IDs de elementos en camelCase (`falloSistema`, `agentInput`, `enlacePago`).
- Clases CSS en kebab-case (`text-box`, `card-copy-btn`, `help-sidebar`).
- Comentarios y textos de UI en español.

## Restricciones importantes

- **NO usar frameworks** (React, Vue, jQuery, etc.).
- **NO agregar build tools**: sin npm, sin bundler, sin transpilación. Los
  archivos que están en el repo son exactamente los que sirve GitHub Pages.
- **NO agregar dependencias externas** más allá de las fuentes de Google ya
  enlazadas; nada de CDNs de librerías.
- **NO ampliar el uso de localStorage** más allá de `lizto_agent_name`,
  `lizto_client_name` y `lizto_pinned_cards` sin acordarlo antes.
- **NO romper la integración con Google Apps Script** existente (la URL del
  despliegue y la forma de los objetos que devuelve).
- **El texto copiado al portapapeles SIEMPRE debe ser texto plano.** El
  formateo de `formatearContenidoPasoAPaso()` es exclusivo de la vista previa;
  al copiar se usa siempre el string crudo del objeto de datos.
- **El contenido que viene de Google Sheets se escapa siempre** antes de
  mostrarlo con `innerHTML` (`escapeHtml()`; `linkify()` recibe texto plano y
  devuelve HTML seguro). Nunca insertar texto de Sheets sin escapar.
- Los mensajes de Paso a paso y Diagnóstico se envían directamente a clientes
  en el CRM, por eso deben copiarse sin formato.
- **La caché de datos de Google Sheets** (`respuestas-rapidas-datos` en `sw.js`)
  solo guarda respuestas que son un array: Apps Script responde 200 incluso con
  `{status:"error"}` y eso no debe pisar la última copia buena. `activate` no
  borra esa caché.
- Si se agrega o renombra un archivo estático, **actualizar `STATIC_ASSETS` en
  `sw.js` y subir `CACHE_NAME`** para que el precache offline quede completo.
- **NO volver el app shell a cache-first.** `index.html`, `index.js`, `style.css`
  y las navegaciones se sirven network-first justamente para que un despliegue
  se vea en el primer reload normal, sin hard reload. La caché es solo el
  respaldo offline.

## Cómo probar localmente

Usar **Live Server** en VS Code (recomendado). Abrir `index.html` con `file://`
también funciona para la UI, pero el service worker no se registra y el fetch
al Apps Script puede fallar por CORS.

## Proceso de documentación permanente

Cada vez que se implemente un cambio, feature o fix en este proyecto, se debe
agregar una entrada correspondiente en `CHANGELOG.md` con fecha y descripción
breve, y actualizar `TODO.md` moviendo la tarea correspondiente a la sección de
completadas. Esto es obligatorio antes de considerar cualquier tarea como
terminada.
