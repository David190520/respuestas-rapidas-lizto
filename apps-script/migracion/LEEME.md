# Migrar Respuestas y Plantillas a Google Sheets

Pasos para activar la lectura de las pestañas **Respuestas** y **Plantillas**.
Mientras no se haga, la app funciona igual con los textos de respaldo
(`defaults.js`) y muestra un aviso discreto de que no pudo leer Google Sheets.

## 1. Cargar los textos actuales en el Sheet

En el documento "Paso a paso y diagnóstico, para respuestas rápidas":

1. Abre la pestaña **Respuestas** → `Archivo` → `Importar` → `Subir` →
   `Respuestas.csv` (en esta carpeta).
2. Elige **Reemplazar hoja actual**, separador **Coma** y desmarca
   "Convertir texto en números, fechas y fórmulas".
3. Repite en la pestaña **Plantillas** con `Plantillas.csv`.

Columnas (la fila 1 son los encabezados; se leen sin importar mayúsculas ni tildes):

| Columna | Qué es |
|---|---|
| `id` | Identificador único y estable (sin espacios). Las tarjetas **fijadas** de cada agente se recuerdan por `id`: si lo cambias, esa tarjeta deja de estar fijada. Si lo dejas vacío se usa el número de fila. |
| `categoria` | Agrupa las tarjetas en los chips de filtro. Si solo hay una categoría, los chips no se muestran. |
| `titulo` | Título de la tarjeta (obligatorio). |
| `texto` | El mensaje (obligatorio). Salto de línea con `Alt + Enter`. Admite los tokens de abajo. |
| `orden` | Número. Menor = más arriba. Vacío = al final, en el orden de la hoja. |
| `activo` | `SI` para mostrarla; `NO` (o `FALSE`) para ocultarla sin borrarla. |

### Tokens (se reemplazan al mostrar y copiar)

| Token | Resultado |
|---|---|
| `nombreAgente` | Nombre del agente (o "un agente") |
| `holaCliente` | `Hola Juan,` (o `Hola,` si no hay cliente) |
| `encabezadoCliente` | `Hola Juan 👋` + salto de línea (desaparece si no hay cliente). Escríbelo **solo en su propia línea**, antes del texto. |
| `saludoHora` | `buen día`, `buenas tardes` o `buenas noches` (hora de Colombia) |
| `SaludoHora` | Igual, con mayúscula inicial (inicio de frase) |

Ejemplo: `encabezadoCliente` ↵ `SaludoHora, ¿cómo estás? Hablas con nombreAgente.`

## 2. Actualizar el Apps Script

1. Abre el proyecto "Script respuestas rápidas" (`Extensiones` → `Apps Script`).
2. Reemplaza el contenido de `Código.gs` por `apps-script/Codigo.gs`
   (el único cambio es agregar `respuestas` y `plantillas` al mapa `HOJAS`).
3. `Implementar` → **`Administrar implementaciones`** → ✏️ (editar el despliegue
   existente) → Versión: **Nueva versión** → `Implementar`.
   - **No** uses "Nueva implementación": generaría una URL distinta y habría que
     cambiar `APPS_SCRIPT_URL` en `index.js`.
4. Comprueba en el navegador (reemplaza por tu URL):
   `…/exec?hoja=respuestas` debe mostrar un JSON con `[{"id":"daysMessage",…}]`.

Paso a paso y Diagnóstico no cambian su contrato: `leerHoja` sigue igual y las
respuestas tienen exactamente la misma forma.

## 2b. Arreglar los 404 intermitentes (caché en el Apps Script)

**Síntoma:** a veces Paso a paso, Diagnóstico (o Respuestas/Plantillas) fallan con
un 404 y a veces tardan 20–40 s. El cuerpo del error es la página de Drive
"No se pudo abrir el archivo en este momento".

**Causa:** en esa ejecución Google no logra abrir el Spreadsheet. Pasa *antes* de
que corra el `try/catch` del script, así que no hay forma de capturarlo ahí. La
solución es **no abrir la hoja en cada petición**:

El `Codigo.gs` de este repo ya incluye:

- Caché de 15 min por pestaña (`CacheService`): casi ninguna petición abre la hoja
  (de ~3 s y fallos ocasionales a una respuesta casi inmediata).
- Copia de respaldo de 6 h: si en algún momento no se puede abrir la hoja, se
  sirve la última copia buena en lugar de un error.
- `onEdit()`: al **editar a mano** el Sheet se invalida la caché y el cambio se ve
  de inmediato. Si cambias datos por **importación** o por script, ejecuta
  `limpiarCache` una vez desde el editor (o agrega `&refrescar=1` a la URL).
- `?refrescar=1` salta la caché (para probar).

**Opcional pero recomendado — calentar la caché:**
en el editor de Apps Script → ⏰ **Activadores** → *Añadir activador* →
función `calentarCache`, evento *Basado en tiempo*, *Temporizador de minutos*,
**cada 10 minutos**. Así la caché siempre está lista y los agentes nunca esperan
a que se abra la hoja.

Después de pegar el código hay que **Implementar → Administrar implementaciones →
✏️ → Nueva versión** (misma URL). La primera vez Google puede pedir autorizar.

## 2c. Atajos desde el Sheet

La pestaña **Atajos** alimenta el tab Atajos. Columnas: `nombre | url | orden | activo`.

- `url` debe empezar por `https://` (las demás se descartan por seguridad).
- `orden` numérico (menor = primero; vacío = al final) y `activo` en `NO`/`FALSE`
  para ocultar sin borrar.
- Si la pestaña falta, está vacía o Google no responde, se muestran los atajos de
  respaldo de `defaults.js` (`ATAJOS_DEFAULT`).
- Para activarlo hay que volver a pegar `apps-script/Codigo.gs` (agrega
  `atajos: 'Atajos'` a `HOJAS`) y **Implementar → Administrar implementaciones →
  ✏️ → Nueva versión**.

## 3. Verificar en la app

Recarga la app: el aviso amarillo debe desaparecer. Un cambio en el Sheet se ve
en la siguiente recarga de la página.

## Respaldo

`defaults.js` es una foto de los textos. Si cambias muchos textos en el Sheet,
conviene actualizarlo de vez en cuando (se usa solo si el Sheet no responde).
