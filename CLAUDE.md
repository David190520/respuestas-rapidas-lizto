# CLAUDE.md — Respuestas Rápidas Lizto Software

## Contexto del proyecto

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

- `index.html` — estructura y markup de las 5 tabs, el drawer y los inputs
- `index.js` — toda la lógica: textos, eventos, clases `HelpCenter` y
  `DiagnosticoCenter`, drawer, buscador global, atajos de teclado
- `style.css` — estilos globales (ojo: es `style.css`, singular, no `styles.css`)
- `manifest.json` / `sw.js` / `icon.svg` — PWA
- `logo-removebg-preview.png` — marca de agua de fondo del `body`, referenciada
  solo desde `style.css`

## Tabs actuales (5)

1. **Respuestas** — saludos, pagos, escalamiento, despedida, enlace de reunión.
   Textos hardcodeados en `updateMessages()`.
2. **Plantillas** — textos largos de preguntas frecuentes (facturación
   electrónica, nómina, API WhatsApp, solicitudes por correo). También
   hardcodeados en `updateMessages()`.
3. **Paso a paso** — artículos cargados desde Apps Script. Clase `HelpCenter`,
   layout sidebar + panel de detalle.
4. **Diagnóstico** — casos cargados desde Apps Script con `?hoja=diagnostico`.
   Clase `DiagnosticoCenter`, navegación de 2 niveles en el sidebar
   (categorías → casos) + panel de contenido.
5. **Atajos** — enlaces a herramientas externas, generados desde el array
   `atajos` en `index.js`.

## Fuentes de datos

- **Respuestas y Plantillas**: strings hardcodeados en `index.js`, asignados
  por ID de textarea dentro de `updateMessages()`.
- **Paso a paso**: `GET` a `APPS_SCRIPT_URL` → array de `{titulo, contenido}`.
- **Diagnóstico**: `GET` a `APPS_SCRIPT_URL?hoja=diagnostico` → array plano de
  `{categoria, subtitulo, contenido}`. El agrupamiento por categoría se hace
  en el frontend, no en el Apps Script.

Ambos endpoints son el mismo despliegue de Apps Script; el parámetro `hoja`
decide qué pestaña del Sheet se lee. Si la lectura falla, el Apps Script
devuelve un objeto `{status:"error"}` en vez de un array — por eso el código
valida `Array.isArray(data)` antes de usarlo.

## Convenciones establecidas

### Variables dinámicas en los textos

- El token literal **`nombreAgente`** dentro de un string se reemplaza por el
  nombre del agente vía `addUserText()` → `message.replace("nombreAgente", agentInput)`.
  No se usa sintaxis de llaves (`{{...}}`); es un reemplazo de texto plano.
- El nombre del cliente **no es un token**: `addUserText()` antepone
  `Hola <cliente> 👋\n` al mensaje, y `updateMessages()` arma el prefijo `hola`
  (`Hola <cliente>,` o `Hola,`) para los mensajes que lo componen a mano.
- Cualquier texto nuevo que necesite el nombre del agente debe pasar por
  `addUserText()` o leer `agentInput` directamente.

### Fallback de nombres

- Agente vacío → literal **`"un agente"`** (`agentInput.value.trim() || "un agente"`).
- Cliente vacío → el saludo cae a **`"Hola,"`** sin nombre; nunca se
  renderiza un saludo con el nombre vacío.
- Enlace de pago vacío → fallback a `https://lizto.com/pago`.
- Los textos **siempre** se renderizan; no se ocultan por tener campos vacíos.

### Persistencia (localStorage)

Solo dos claves, y son las únicas permitidas hoy:

- `lizto_agent_name`
- `lizto_client_name`

Se escriben en cada `input` y se restauran al cargar, antes del primer
`updateMessages()`. **El tema no se persiste**: la app siempre arranca en
modo oscuro.

### Sistema de temas (light/dark)

- Design tokens como custom properties en `:root` (oscuro, por defecto) y
  sobreescritos en `body.light-mode` (claro).
- El toggle `#toggleBrillo` alterna la clase `light-mode` en el `<body>` e
  intercambia los SVG inline `SUN_SVG` / `MOON_SVG`.
- **Nunca hardcodear colores** en CSS nuevo: usar los tokens
  (`--bg-main`, `--text-primary`, `--accent`, `--border-base`, etc.), o el
  modo claro se rompe.
- Los tokens `--bg-color`, `--principal-color`, `--secondary-color` y
  `--dark-color` existen solo por retrocompatibilidad; no usarlos en código nuevo.

### Modo compacto (densidad)

- Tab Respuestas: botones `#densityNormal` / `#densityCompact` alternan la
  clase `compact-mode` sobre `#respuestas .text-fields`.
- Es solo visual y **no se persiste**; vuelve a `normal` al recargar.

### Tarjetas y drawer

- `initResponseCards(ids)` convierte cada `.text-box` en `.response-card`:
  oculta el textarea (que pasa a ser `.card-data`, la fuente de verdad del
  texto), agrega preview de 2 líneas, botón ojo y botón copiar.
- El drawer (`#response-drawer`) es **compartido** por Respuestas y Plantillas,
  con navegación anterior/siguiente sobre las tarjetas visibles del tab actual.
- La tarjeta de Saludo tiene chips de variante (`SALUDO_VARIANTES`) que
  concatenan una frase extra al final del texto base.
- Las tarjetas con controles propios (enlace de pago, paso a paso, reunión)
  son `.special-card` y **no** pasan por `initResponseCards`.

### Buscador y atajos

- `#globalSearch` filtra las 5 tabs a la vez y pinta un badge con el conteo
  por tab. Los buscadores locales de Paso a paso y Diagnóstico siguen
  existiendo y se sincronizan con el global.
- Atajos: `/` y `Ctrl+F` enfocan el buscador; `Esc` cierra el drawer o limpia
  el buscador.

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
- **NO ampliar el uso de localStorage** más allá de `lizto_agent_name` y
  `lizto_client_name` sin acordarlo antes.
- **NO romper la integración con Google Apps Script** existente (la URL del
  despliegue y la forma de los objetos que devuelve).
- **El texto copiado al portapapeles SIEMPRE debe ser texto plano.** El
  formateo de `formatearContenidoPasoAPaso()` es exclusivo de la vista previa;
  al copiar se usa siempre el string crudo del objeto de datos.
- Los mensajes de Paso a paso y Diagnóstico se envían directamente a clientes
  en el CRM, por eso deben copiarse sin formato.
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
