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

Paso a paso y Diagnóstico no cambian: `doGet` y `leerHoja` siguen igual.

## 3. Verificar en la app

Recarga la app: el aviso amarillo debe desaparecer. Un cambio en el Sheet se ve
en la siguiente recarga de la página.

## Respaldo

`defaults.js` es una foto de los textos. Si cambias muchos textos en el Sheet,
conviene actualizarlo de vez en cuando (se usa solo si el Sheet no responde).
