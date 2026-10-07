/**
 * API de solo lectura para "Respuestas Rápidas Lizto".
 * Un único doGet resuelve qué pestaña leer según el parámetro ?hoja=
 *
 *   /exec                    -> Paso a paso  (default, compatible con el frontend actual)
 *   /exec?hoja=paso          -> Paso a paso   [titulo, contenido]
 *   /exec?hoja=diagnostico   -> Diagnostico   [categoria, subtitulo, contenido]
 *   /exec?hoja=respuestas    -> Respuestas    [id, categoria, titulo, texto, orden, activo]
 *   /exec?hoja=plantillas    -> Plantillas    [id, categoria, titulo, texto, orden, activo]
 */

// Alias público -> nombre EXACTO de la pestaña en el Sheet (respeta mayúsculas y acentos)
const HOJAS = {
  paso: 'Paso a paso',
  diagnostico: 'Diagnostico',
  respuestas: 'Respuestas',
  plantillas: 'Plantillas'
};

const HOJA_POR_DEFECTO = 'paso';

function doGet(e) {
  try {
    // e llega undefined al ejecutar desde el editor: por eso el guard
    const params = (e && e.parameter) || {};
    const alias = String(params.hoja || HOJA_POR_DEFECTO).toLowerCase().trim();

    const nombreHoja = HOJAS[alias];
    if (!nombreHoja) {
      throw new Error('Parámetro "hoja" no válido: "' + alias +
                      '". Valores permitidos: ' + Object.keys(HOJAS).join(', '));
    }

    return responderJson(leerHoja(nombreHoja));

  } catch (error) {
    return responderJson({
      status: 'error',
      message: 'Fallo en la lectura de la hoja: ' + error.toString()
    });
  }
}

/**
 * Lee una pestaña completa y la devuelve como array de objetos,
 * usando la primera fila como nombres de propiedad.
 * Es genérica: no sabe nada de titulo/categoria/subtitulo.
 */
function leerHoja(nombreHoja) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
  if (!hoja) throw new Error('No existe la pestaña "' + nombreHoja + '" en el documento');

  const data = hoja.getDataRange().getValues();
  if (data.length < 2) return []; // solo encabezados o vacía

  const headers = data[0].map(normalizarClave);

  return data.slice(1)
    .map(function (row) {
      const obj = {};
      headers.forEach(function (header, index) {
        if (!header) return; // ignora columnas sin encabezado
        const valor = row[index];
        obj[header] = (valor === null || valor === undefined) ? '' : String(valor).trim();
      });
      return obj;
    })
    // Descarta filas totalmente vacías (habituales cuando la pestaña usa "Tabla" de Sheets)
    .filter(function (obj) {
      return Object.keys(obj).some(function (key) { return obj[key] !== ''; });
    });
}

/** "Categoría " -> "categoria" (minúsculas, sin acentos ni espacios) */
function normalizarClave(header) {
  return String(header)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function responderJson(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
