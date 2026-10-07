/**
 * API de solo lectura para "Respuestas Rápidas Lizto".
 * Un único doGet resuelve qué pestaña leer según el parámetro ?hoja=
 *
 *   /exec                    -> Paso a paso  (default, compatible con el frontend actual)
 *   /exec?hoja=paso          -> Paso a paso   [titulo, contenido]
 *   /exec?hoja=diagnostico   -> Diagnostico   [categoria, subtitulo, contenido]
 *   /exec?hoja=respuestas    -> Respuestas    [id, categoria, titulo, texto, orden, activo]
 *   /exec?hoja=plantillas    -> Plantillas    [id, categoria, titulo, texto, orden, activo]
 *   (cualquiera + &refrescar=1 salta la caché de 15 min)
 */

// Alias público -> nombre EXACTO de la pestaña en el Sheet (respeta mayúsculas y acentos)
const HOJAS = {
  paso: 'Paso a paso',
  diagnostico: 'Diagnostico',
  respuestas: 'Respuestas',
  plantillas: 'Plantillas'
};

const HOJA_POR_DEFECTO = 'paso';

// --- Caché (evita abrir la hoja en cada petición) ---------------------------
// Abrir el Spreadsheet es lo lento y lo que a veces falla ("No se pudo abrir el
// archivo en este momento", un 404 que ocurre ANTES de que corra el try/catch).
// Con la caché casi ninguna petición toca la hoja.
//   - copia fresca: dura CACHE_FRESCA_SEG; un cambio en el Sheet se ve como mucho
//     en ese tiempo (y al instante si se edita a mano: ver onEdit).
//   - copia de respaldo: dura 6 h (el máximo); se usa si abrir la hoja falla.
const CACHE_FRESCA_SEG = 900;
const CACHE_RESPALDO_SEG = 21600;

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

    // ?refrescar=1 salta la caché (útil para probar un cambio recién hecho)
    const refrescar = String(params.refrescar || '') === '1';
    return responderTexto(obtenerJsonHoja(alias, nombreHoja, refrescar));

  } catch (error) {
    return responderJson({
      status: 'error',
      message: 'Fallo en la lectura de la hoja: ' + error.toString()
    });
  }
}

/** Devuelve el JSON (texto) de una pestaña: caché fresca -> hoja -> copia de respaldo. */
function obtenerJsonHoja(alias, nombreHoja, refrescar) {
  const cache = CacheService.getScriptCache();
  const claveFresca = 'fresca:' + alias;
  const claveRespaldo = 'respaldo:' + alias;

  if (!refrescar) {
    const fresca = cache.get(claveFresca);
    if (fresca) return fresca;
  }

  let json;
  try {
    json = JSON.stringify(leerHoja(nombreHoja));
  } catch (error) {
    // Si la hoja no se pudo abrir pero hay una copia anterior, se sirve esa
    const respaldo = cache.get(claveRespaldo);
    if (respaldo) return respaldo;
    throw error;
  }

  try {
    cache.put(claveFresca, json, CACHE_FRESCA_SEG);
    cache.put(claveRespaldo, json, CACHE_RESPALDO_SEG);
  } catch (error) {
    // CacheService admite hasta 100 KB por clave: si una hoja crece más, simplemente no se cachea
  }
  return json;
}

/** Edición manual en el Sheet: invalida las copias frescas para ver el cambio al instante. */
function onEdit() {
  limpiarCache();
}

/**
 * OPCIONAL: ejecútala con un activador por tiempo (cada 10 minutos) para que la
 * caché esté siempre caliente y los agentes nunca esperen a que se abra la hoja.
 */
function calentarCache() {
  Object.keys(HOJAS).forEach(function (alias) {
    try { obtenerJsonHoja(alias, HOJAS[alias], true); } catch (error) { /* se reintenta en el próximo ciclo */ }
  });
}

/** También se puede ejecutar a mano desde el editor después de importar datos. */
function limpiarCache() {
  const claves = Object.keys(HOJAS).map(function (alias) { return 'fresca:' + alias; });
  CacheService.getScriptCache().removeAll(claves);
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
  return responderTexto(JSON.stringify(payload));
}

function responderTexto(json) {
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
