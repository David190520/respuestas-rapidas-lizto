# PLAN — Respuestas Rápidas Lizto Software

Plan de implementación de las mejoras acordadas. Está escrito para que se pueda
**retomar sin el historial de ninguna conversación**: contiene el contexto, las
decisiones ya tomadas, las reglas y el detalle de cada fase.

> **Cómo retomar:** leer en este orden `CLAUDE.md` (reglas y convenciones) →
> este archivo → `TODO.md` (estado) → `CHANGELOG.md` (qué cambió y cuándo).
> Implementar **una fase a la vez**, con su propia rama y PR hacia `develop`.

Última actualización: 2026-10-09 (Fases 1, 2 y 3 terminadas en código).

> **Notas de implementación de la Fase 3:** el Sheet tiene **dos pestañas
> separadas** (`Respuestas` y `Plantillas`), así que no existe la columna `tab`
> prevista en el diseño. Columnas: `id | categoria | titulo | texto | orden |
> activo`. Los tokens `holaCliente` y `encabezadoCliente` reemplazan a los
> prefijos que antes se armaban en código. Las special cards (pago, paso a paso,
> reunión) siguen en el HTML y forman la categoría "Herramientas".

> **Notas de implementación de las Fases 1 y 2:** el saludo usa
> `00:00–04:59 → buenas noches`, `05:00–11:59 → buen día`,
> `12:00–18:59 → buenas tardes`, `19:00–23:59 → buenas noches` (en la planeación
> inicial la madrugada caía en "buen día"). El Apps Script de Google responde un
> 404 transitorio de vez en cuando; se observó una sola vez y la siguiente
> recarga cargó bien. Lo cubre la caché offline de la Fase 3 (TODO-18).

---

## 1. Contexto

- **Producto:** herramienta interna del área de soporte de Lizto Software
  (SaaS CRM/ERP all-in-one para negocios de belleza, Girardot, Cundinamarca).
  Los agentes copian respuestas rápidas, plantillas, pasos a paso y casos de
  diagnóstico para atender a los clientes desde el CRM.
- **Equipo:** todos los agentes están en la misma oficina. Los cambios de texto
  los pide el equipo de palabra y los hace el responsable del proyecto (David).
- **Stack:** HTML/CSS/JS vanilla, sin build, GitHub Pages, PWA, Google Apps
  Script como API de solo lectura sobre Google Sheets. Ver `CLAUDE.md`.

## 2. Flujo de trabajo (obligatorio)

1. Rama nueva desde `develop` (`feat/...`, `fix/...`, `docs/...`).
2. Commit(s) con mensaje descriptivo en español, y PR **hacia `develop`**.
3. Cada PR actualiza `CHANGELOG.md`, `TODO.md` y, si cambia una convención,
   `CLAUDE.md` (regla permanente del proyecto).
4. Merge del PR a `develop`. **Nunca** se mergea a `main` sin que David valide
   en local desde `develop` y lo confirme.
5. Si se agrega/renombra un archivo estático: actualizar `STATIC_ASSETS` y subir
   `CACHE_NAME` en `sw.js`.
6. Probar en navegador antes de abrir el PR: desktop claro/oscuro, móvil
   (375 px), modal, y que Paso a paso y Diagnóstico sigan cargando datos.

## 3. Decisiones ya tomadas (no re-discutir)

| Tema | Decisión |
|---|---|
| Identidad visual | Alineada con https://www.lizto.co (teal `#12b5ac`, Plus Jakarta Sans). **Hecho.** |
| Drawer | Reemplazado por modal centrado. **Hecho.** |
| Pin de tarjetas | Hecho. Clave `lizto_pinned_cards`. |
| Fines de semana | El selector de reunión no los muestra. Festivos: **no**, salvo que David pase la lista. |
| Tema | Debe **seguir el tema del sistema operativo**. No se persiste la elección manual. |
| Densidad | No se persiste. |
| Paso a paso / Diagnóstico | Su contrato con el Apps Script **no se puede romper** (ver §4). |
| Sheets para Respuestas/Plantillas | Sí, siempre que no afecte a Paso a paso ni Diagnóstico. |
| Saludo según la hora | Sí. Funciona con o sin Sheets (se resuelve en el navegador). |
| Motivo de escalamiento personalizable | Opcional; no debe añadir pasos obligatorios al copiar. |
| Diagnóstico con checklist | Sí. |
| Atajos | Se agregan los enlaces que David entrega (hecho el 2026-10-08). |
| Reporte de "texto desactualizado" | Más adelante (hoy el equipo avisa de palabra). |
| Artículos de Zoho Desk dentro de la app | **Descartado** (requiere API y backend). |
| Disponibilidad de reuniones desde Zoho Calendar | **Descartado** (agentes tienen bloques ocupados por pausas activas). |
| Sugerencias por uso | Sí, local por navegador (ver Fase 6). |

## 4. Contrato con el Apps Script (intocable)

El archivo del script (`Código.gs`, desplegado como web app) hace lo siguiente:

- `GET /exec` o `?hoja=paso` → pestaña `Paso a paso` → `[{titulo, contenido}]`
- `GET /exec?hoja=diagnostico` → pestaña `Diagnostico` → `[{categoria, subtitulo, contenido}]`
- `leerHoja(nombre)` es **genérica**: usa la fila 1 como nombres de propiedad
  (minúsculas, sin acentos) y descarta filas vacías. Ante un error devuelve
  `{status:"error", message}` y el frontend valida `Array.isArray(data)`.
- El mapa `HOJAS` (alias → nombre exacto de la pestaña) es el único punto que
  hay que ampliar para exponer pestañas nuevas.

**Regla:** agregar pestañas nuevas = agregar una línea en `HOJAS`. No se toca
`doGet`, `leerHoja` ni las pestañas existentes. Si se vuelve a desplegar, Google
genera una **URL nueva** → actualizar `APPS_SCRIPT_URL` en `index.js`
(o, mejor, desplegar como "Nueva versión" del mismo despliegue para conservarla).

---

## 5. Fases

Cada fase indica objetivo, tareas, archivos, criterio de aceptación y riesgos.
El orden va de menor a mayor esfuerzo; Fases 1–3 son independientes entre sí.

### Fase 1 — Seguridad y tema del sistema (pequeña)

**Objetivo:** cerrar el riesgo de inyección HTML desde Sheets y que la app
respete el tema del sistema operativo.

**1a. Escapar HTML (seguridad).** Hoy `formatearContenidoPasoAPaso()` y
`linkify()` insertan el texto de Sheets sin escapar. Quien edite el Sheet podría
inyectar HTML/JS que corra en la sesión de todos los agentes.

- Escapar `& < > " '` **antes** de construir el HTML (primero escapar, luego
  `linkify`, que solo debe crear `<a>` para URLs `http(s)`).
- Escapar también los mensajes de `showError`.
- **Sin cambios en el copiado:** se sigue copiando el string crudo.
- Aceptación: una fila de prueba con `<img src=x onerror=alert(1)>` se ve como
  texto y no ejecuta nada; los enlaces siguen clicables; el copiado es idéntico.

**1b. Tema según el sistema operativo.**

- Al cargar: `matchMedia('(prefers-color-scheme: light)')` decide claro/oscuro.
- Escuchar el cambio del SO mientras el agente **no haya usado el toggle**.
  Al usar el toggle, la elección manual manda durante la sesión.
- **No** se persiste (sin `localStorage`). Actualizar `CLAUDE.md` ("la app
  arranca según el tema del SO") y el `<meta name="theme-color">`.
- Evitar el parpadeo: aplicar la clase `light-mode` lo antes posible (script
  inline corto en `<head>` o al inicio de `index.js`).

Archivos: `index.js`, `index.html`, `CLAUDE.md`.

### Fase 2 — Saludo según la hora (pequeña)

**Objetivo:** que "buen día / buenas tardes / buenas noches" sea correcto sin
que el agente lo edite.

- Función `saludoHora()` en `index.js`: antes de 12:00 → "buen día"; 12:00–18:59
  → "buenas tardes"; desde 19:00 → "buenas noches". Usar la hora de Colombia
  (`Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`) para no depender de la
  zona horaria del PC del agente.
- Textos afectados (hoy dicen "buen día"/"muy buen día" fijos): Saludo, Fallo
  del sistema, Módulos y capacitaciones, Solicitar comprobante, Plantilla ID Set
  de Pruebas y cualquiera que se agregue.
- Convención nueva (documentar en `CLAUDE.md`): el token **`saludoHora`** en un
  string se reemplaza vía `addUserText()`, igual que `nombreAgente`. Esto
  permite usarlo luego desde Sheets sin cambiar el código.
- Recalcular al volver a abrir la pestaña/ventana (`visibilitychange`) y cada
  vez que se llama `updateMessages()`, para que un turno largo no quede con el
  saludo de la mañana.
- Aceptación: probar simulando horas 08:00, 14:00 y 20:00; mayúsculas correctas
  ("Buenas tardes" al inicio de frase, "buenas tardes" a mitad).

Archivos: `index.js`, `CLAUDE.md`.

### Fase 3 — Respuestas y Plantillas desde Google Sheets (grande)

**Objetivo:** que soporte pueda crear/editar/ordenar respuestas y plantillas
editando el Sheet, sin PR ni despliegue. Absorbe **TODO-10** (chips de categoría)
y **TODO-12** (IDs `copiarBtn` duplicados).

**3a. Apps Script (lo hace David en el editor de Apps Script):**

1. Crear la pestaña `Respuestas` con encabezados:
   `id | tab | categoria | titulo | texto | orden | activo`
   - `tab`: `respuestas` o `plantillas`.
   - `activo`: `SI`/`NO` (para ocultar sin borrar).
   - `texto`: usa los tokens `nombreAgente` y `saludoHora`; `\n` = salto de línea
     (en Sheets, Alt+Enter).
2. En `Código.gs`, agregar **una sola línea** al mapa:
   `respuestas: 'Respuestas'` dentro de `HOJAS`. Nada más cambia.
3. Desplegar como **nueva versión del mismo despliegue** (conserva la URL).
4. Cargar en el Sheet los textos actuales (la Fase 3 entrega un script/CSV de
   migración generado desde `index.js` para no copiar a mano).

**3b. Frontend:**

- `RESPUESTAS_DEFAULT` en `index.js` = los textos actuales como **respaldo**.
  Si el fetch falla o devuelve `{status:"error"}`/vacío, la app funciona igual
  con el respaldo (los agentes nunca se quedan sin respuestas).
- Generar las tarjetas desde un array de objetos
  `{id, tab, categoria, titulo, texto}` (hoy están fijas en `index.html`), con un
  único `<template>` para la tarjeta. Esto elimina el SVG repetido y los
  `id="copiarBtn"` duplicados (usar `class="copy-btn"`).
- Las 3 `special-card` (pago, paso a paso, reunión) **siguen en el HTML**: tienen
  controles propios. El Saludo conserva sus chips de variante.
- Chips de filtro por categoría generados dinámicamente + combinación con el
  buscador global (criterios de **TODO-10**), con badges que reflejen el
  resultado combinado.
- Mostrar una tarjeta aunque falten campos (fallbacks de `CLAUDE.md`).
- Mientras cargan los datos, pintar el respaldo (sin pantalla vacía) y
  reemplazar al llegar la respuesta, sin salto brusco.
- El pin (`lizto_pinned_cards`) usa el `id` de la fila; si un id desaparece del
  Sheet, ignorarlo sin error.
- Caché offline de la última respuesta buena: hacerlo en `sw.js` (**TODO-18**),
  **no** en `localStorage`.

**Aceptación:** con el Sheet y con el Sheet caído la app muestra las mismas
tarjetas; Paso a paso y Diagnóstico siguen cargando; copiar produce texto plano;
búsqueda, modal, pin y modo compacto funcionan igual.

**Riesgos:** (1) ediciones en el Sheet con formato raro → siempre `String().trim()`
y escapar al mostrar; (2) latencia del Apps Script (~1–2 s) → por eso el
respaldo inmediato; (3) cambiar la URL del despliegue.

Archivos: `index.js`, `index.html`, `style.css`, `sw.js`, `CLAUDE.md`,
`README.md`, `Código.gs` (documentarlo en el README).

### Fase 4 — Atajos desde Sheets (pequeña, opcional)

Hoy los atajos son un array en `index.js` (ya incluye: Divisor de archivos,
Asignaciones semanales, Buscar documento DIAN, Hoja de Excel - Soporte).
Si el equipo los cambia seguido: pestaña `Atajos` (`nombre | url | orden |
activo`) + `atajos: 'Atajos'` en `HOJAS`, con el array actual como respaldo.
Validar que `url` empiece por `https://`.

### Fase 5 — Diagnóstico con checklist y escalamiento (media)

**Contexto del flujo del equipo:** antes de escalar a desarrollo, el agente
debe investigar a fondo. Cuando se encuentra la causa se documenta en el Sheet
(`categoria → subtitulo → contenido`) para que otro agente la reutilice. Si
tras revisar todo no hay causa, se escala.

**Sin cambiar el Sheet ni el Apps Script:** reutilizar el formato de lista que
ya detecta `formatearContenidoPasoAPaso()` (líneas `-`, `•` o `1.`).

- Cada ítem de lista del caso se muestra como **casilla marcable** (estado solo
  en memoria; se reinicia al cambiar de caso; no se persiste).
- Barra de progreso "3 de 5 revisados".
- Botón **"No encontré la causa → preparar escalamiento"**: genera un mensaje de
  texto plano para el canal de desarrollo con: categoría, caso, pasos revisados
  (los marcados) y campos vacíos a completar (negocio, NIT, descripción). Se
  copia como cualquier otro mensaje (texto plano).
- El botón **Copiar** del artículo sigue copiando el contenido original sin
  formato (regla de `CLAUDE.md`).
- Aceptación: casos sin listas se ven como hoy; el contenido copiado es idéntico
  al string original.

Archivos: `index.js` (`DiagnosticoCenter`), `style.css`, `CLAUDE.md`.

### Fase 6 — Sugerencias según el uso (media)

**Pregunta de David:** ¿se puede recomendar tarjetas según el uso y el orden?
**Respuesta:** sí, y no es complicado si se hace **local por navegador**.

- Registrar, por tarjeta, cuántas veces se copia y, por par (A → B), cuántas veces
  se copió B dentro de los ~10 minutos siguientes a copiar A.
- En la parte superior de Respuestas mostrar una fila **"Sugeridas"** (máx. 3–4):
  las más probables después de la última tarjeta copiada; si no hay datos, las
  más usadas. Las tarjetas **fijadas** tienen prioridad y no se duplican.
- Reglas: ignorar la tarjeta que se acaba de copiar; olvidar datos viejos
  (decaimiento o ventana de 30 días) para que la sugerencia siga el flujo actual.
- Persistencia: **nueva clave `lizto_usage`** (JSON pequeño, unos pocos KB).
  Requiere aprobación de David (regla de `localStorage` en `CLAUDE.md`); al
  aprobarse, agregarla a la lista permitida.
- **Límite conocido:** al no haber backend, las estadísticas son por navegador y
  por agente; no hay "estadísticas de todo el equipo". Para eso haría falta que
  el Apps Script **escriba** (`doPost`) en una pestaña `Uso`, cosa que hoy no
  hace (es de solo lectura) y se evaluaría aparte. Con esas métricas el equipo
  también podría saber qué plantillas casi nunca se usan.
- Aceptación: tras simular una secuencia saludo → diagnóstico → despedida varias
  veces, la sugerencia posterior al saludo propone el diagnóstico; copiar sigue
  igual de rápido (cero pasos extra).

Archivos: `index.js`, `style.css`, `CLAUDE.md`.

### Fase 7 — Modo "Flujo" (opcional, depende de Fase 6)

Secuencia guiada de atención (saludo → diagnóstico/paso a paso → cierre →
calificación): al copiar un paso se resalta el siguiente con una tecla o botón
"Siguiente". Solo si, después de la Fase 6, los agentes lo sienten útil.

---

## 6. Backlog (sin fecha)

- **Rendimiento del Apps Script (parcialmente resuelto):** `Codigo.gs` ahora cachea y
  sirve respaldo, y `sw.js` sirve la última copia buena ante 404 (ver CHANGELOG
  2026-10-09). Queda lo de abajo. Observación original del 2026-10-09: tras muchas recargas de prueba,
  el script respondió en 7–25 s y con 404 intermitentes (aun en peticiones
  secuenciales). Cada carga de la app hace 4 peticiones (Paso a paso,
  Diagnóstico, Respuestas, Plantillas). Mejoras posibles: servir Paso a paso y
  Diagnóstico con *stale-while-revalidate* desde la caché del service worker
  (se ven al instante y se actualizan en segundo plano), y/o un único endpoint
  que devuelva las 4 hojas en una sola petición. Respuestas y Plantillas ya no
  sufren porque pintan el respaldo al instante.

- Reporte de "texto desactualizado" desde cada tarjeta (formulario/correo con el
  id de la tarjeta). Se pospone: hoy el equipo avisa de palabra.
- Festivos de Colombia en el selector de reunión (requiere lista oficial).
- `agentesData` (horarios y enlaces de Zoom) a una pestaña del Sheet para no
  editar código al agregar un agente. Revisar también el campo de enlaces de
  reunión grupal que está dentro de un texto.
- Manifest: ícono `maskable` dedicado (hoy reutiliza `icon.svg`).
- Revisión de accesibilidad con lector de pantalla (hoy hay pocos `aria-*`).
- Limpiar ramas antiguas ya mergeadas (`david-add-feats`, `features`,
  `david-update-cards`, `david-implement-checklist-tab`,
  `feat/saludo-consulta-y-fix-cache-sw`, la rama larga de `update--card...`).
- Tests/linters: no hay; evaluar un chequeo mínimo (`node --check`) en CI sin
  introducir build tools.

## 7. Estado de las fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Rediseño lizto.co + modal, pin, fechas sin fines de semana, fix tarjetas especiales, atajos | ✅ En `develop` |
| 1 | Escapar HTML + tema del SO | ✅ En `develop` (2026-10-08) |
| 2 | Saludo según la hora | ✅ En `develop` (2026-10-08) |
| 3 | Respuestas/Plantillas desde Sheets (+ TODO-10, TODO-12, TODO-18) | ✅ Código en `develop`; falta que David cargue los CSV y despliegue el Apps Script |
| 4 | Atajos desde Sheets | ⬜ Opcional |
| 5 | Diagnóstico con checklist y escalamiento | ✅ En `develop` (2026-10-08) |
| 6 | Sugerencias según el uso | ⬜ Pendiente (requiere aprobar `lizto_usage`) |
| 7 | Modo Flujo | ⬜ Opcional |

> Al terminar una fase: marcarla aquí, mover su TODO a ✅ en `TODO.md` y
> registrar el cambio en `CHANGELOG.md`.
