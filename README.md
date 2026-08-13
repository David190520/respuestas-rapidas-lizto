# Respuestas Rápidas — Lizto Software

Herramienta interna de soporte para los agentes del CRM de **Lizto Software**
(SaaS multi-tenant para salones de belleza).

🔗 **En producción:** https://david190520.github.io/respuestas-rapidas-lizto/

## Qué es y qué problema soluciona

Los agentes de soporte responden decenas de conversaciones al día repitiendo
los mismos mensajes: saludos, confirmaciones de pago, requisitos de facturación
electrónica, pasos para configurar un módulo. Escribirlos a mano es lento,
y copiarlos de un documento suelto lleva a mensajes inconsistentes, con el
nombre del agente anterior o sin personalizar.

Esta app centraliza todos esos textos en un solo lugar, los personaliza
automáticamente con el nombre del agente y del cliente, y los deja listos para
copiar de un clic y pegar en el CRM.

**Para quién es:** el equipo de soporte de Lizto Software. Es una herramienta
interna; no maneja datos de clientes ni requiere autenticación.

## Funcionalidades

- **5 tabs de contenido:**
  - **Respuestas** — mensajes cortos del día a día (saludo, pagos,
    escalamiento, despedida, agendamiento de reuniones con enlace de Zoom).
  - **Plantillas** — textos largos de preguntas frecuentes (facturación
    electrónica, nómina, API de WhatsApp, solicitudes por correo).
  - **Paso a paso** — artículos de ayuda cargados desde Google Sheets.
  - **Diagnóstico** — casos de soporte organizados por categoría, también
    desde Google Sheets.
  - **Atajos** — enlaces a herramientas externas de uso frecuente.
- **Personalización automática:** los campos "Nombre del agente" y "Nombre del
  cliente" se inyectan en los textos en tiempo real y se recuerdan entre
  sesiones.
- **Buscador global** que filtra las 5 tabs a la vez, con un badge de
  coincidencias por pestaña.
- **Atajos de teclado:** `/` o `Ctrl+F` para buscar, `Esc` para limpiar o
  cerrar el panel.
- **Copiado siempre en texto plano**, listo para pegar en el CRM.
- **Modo claro / oscuro** y **vista compacta** para ver más tarjetas a la vez.
- **Instalable como app (PWA)** con funcionamiento offline parcial.

## Stack

- **HTML, CSS y JavaScript vanilla.** Sin frameworks, sin librerías, sin build
  tools: los archivos del repo son exactamente los que se sirven.
- **Google Apps Script** como API REST de solo lectura sobre **Google Sheets**.
- **GitHub Pages** como hosting.
- **PWA**: `manifest.json` + service worker propio.

## Cómo correrlo localmente

**Recomendado — Live Server (VS Code):**

1. Instalar la extensión *Live Server*.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
3. Se abre en `http://127.0.0.1:5500` con recarga automática.

También se puede abrir `index.html` directamente con doble clic, pero sobre
`file://` el service worker no se registra y el fetch a Apps Script puede
fallar por CORS. Para todo lo que toque Paso a paso o Diagnóstico, usar Live
Server.

Cualquier servidor estático sirve igual de bien:

```bash
python -m http.server 8000    # luego abrir http://localhost:8000
```

No hay `npm install`, ni compilación, ni variables de entorno.

## Estructura de archivos

```
respuestasrapidas/
├── index.html                    # Markup: tabs, tarjetas, drawer, inputs
├── index.js                      # Toda la lógica de la app
├── style.css                     # Estilos + design tokens (light/dark)
├── manifest.json                 # Metadatos de la PWA
├── sw.js                         # Service worker (caché offline)
├── icon.svg                      # Ícono de la PWA
├── logo-removebg-preview.png     # Marca de agua de fondo (usada en style.css)
├── CLAUDE.md                     # Contexto y convenciones para Claude Code
├── TODO.md                       # Tareas pendientes y completadas
└── CHANGELOG.md                  # Historial de cambios
```

Todo `index.js` vive en un solo archivo, organizado por secciones comentadas:

| Sección | Contenido |
|---|---|
| Estado global | Variables del drawer, variantes de saludo, lista de atajos |
| Datos de agentes | Horarios y enlaces de Zoom por agente |
| Mensajes | `addUserText()`, `updateMessages()` y sus helpers |
| Listeners | Inicialización, inputs, tabs, toggle de tema, copiado |
| Buscador global | `globalSearchFilter()` y badges por tab |
| `HelpCenter` | Tab Paso a paso |
| `DiagnosticoCenter` | Tab Diagnóstico |
| Response drawer | Panel lateral de Respuestas y Plantillas |

## Conexión con Google Sheets

Las tabs **Paso a paso** y **Diagnóstico** no tienen su contenido en el código:
lo leen de un Google Sheet a través de un Google Apps Script publicado como
aplicación web.

```
Google Sheets  ──►  Apps Script (doGet)  ──►  JSON  ──►  fetch() en index.js
```

**Cómo funciona:**

1. El Apps Script está desplegado como *Web app* con acceso "Cualquier
   persona", lo que le permite responder peticiones `GET` sin autenticación.
2. `doGet(e)` lee una hoja del Sheet y devuelve sus filas como JSON.
3. El parámetro `hoja` decide qué pestaña del Sheet se lee:

   | Tab | Petición | Forma de la respuesta |
   |---|---|---|
   | Paso a paso | `.../exec` | `[{ titulo, contenido }, ...]` |
   | Diagnóstico | `.../exec?hoja=diagnostico` | `[{ categoria, subtitulo, contenido }, ...]` |

4. El frontend agrupa los casos de Diagnóstico por `categoria`; el Apps Script
   devuelve un array plano.
5. Si la lectura falla, el Apps Script devuelve un objeto `{status:"error"}` en
   vez de un array. Por eso el código valida `Array.isArray(data)` antes de
   renderizar y muestra un mensaje de error en el sidebar.

La URL del despliegue está en la constante `APPS_SCRIPT_URL` de `index.js`.

**Para agregar contenido no hace falta tocar el código:** basta con agregar una
fila en el Google Sheet correspondiente. Los cambios aparecen en el próximo
refresco de la página.

> ⚠️ Si se vuelve a desplegar el Apps Script, Google genera una **URL nueva**.
> Hay que actualizar `APPS_SCRIPT_URL` en `index.js` o las dos tabs quedan
> vacías.

## Convenciones y contribución

Antes de trabajar en el proyecto, leer `CLAUDE.md`: documenta las convenciones
de código, el sistema de temas, el manejo de variables dinámicas y las
restricciones (sin frameworks, sin build tools, copiado siempre en texto plano).

Todo cambio debe registrarse en `CHANGELOG.md` y reflejarse en `TODO.md`.

## Despliegue

Se publica solo con hacer merge a `main`: GitHub Pages sirve los archivos
estáticos directamente desde la rama.

Al cambiar cualquier archivo estático hay que **subir `CACHE_NAME` en `sw.js`**,
o los usuarios con la PWA instalada seguirán viendo la versión cacheada.
