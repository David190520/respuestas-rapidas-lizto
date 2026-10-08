// ============= ESTADO GLOBAL — debe declararse antes de cualquier llamada =============

let modalCurrentIndex = -1;
let modalVisibleCards = [];
let modalCurrentTabId = null;
const modalCardMap = new Map();

// Tarjetas de Respuestas y Plantillas: filas normalizadas por tab y categoría
// activa (chips). Se declaran aquí arriba porque se usan desde el arranque.
const tarjetasData = { respuestas: [], plantillas: [] };
const categoriaActiva = { respuestas: '', plantillas: '' };

// Sugerencias según el uso (ver "SUGERENCIAS SEGÚN EL USO")
const USO_KEY = 'lizto_usage';
const USO_VIDA_MEDIA_MS = 14 * 24 * 60 * 60 * 1000;  // el peso de cada copia se reduce a la mitad cada 14 días
const USO_VENTANA_ENCADENADO_MS = 10 * 60 * 1000;    // "B después de A": B se copia <= 10 min tras A
const USO_PESO_MINIMO = 0.1;                         // por debajo se olvida (~46 días sin repetirse)
const USO_MAX_TARJETAS = 60;
const USO_MAX_TRANSICIONES = 200;
const USO_MIN_COPIAS = 3;                            // copias totales antes de empezar a sugerir
const USO_MIN_TRANSICION = 1.5;                      // ~2 veces vistas para sugerir "después de A"
const SUGERIDAS_MAX = 4;

let saludoCard = null;
let saludoVariante = '';
const SALUDO_VARIANTES = [
  { label: 'Sin variante',           value: '' },
  { label: '¿Cómo puedo ayudarte?',  value: 'Cuéntame por favor, ¿Cómo puedo ayudarte?' },
  { label: 'Consulta',        value: '¡Claro que sí! ¿Cómo prefieres recibir el paso a paso? Podemos enviarte un enlace con la guía, escribirte las instrucciones por aquí o compartirte una nota de voz. Quedamos atentos a tu elección.' },
  { label: 'Dame un momento',        value: 'Dame un momento por favor.' },
  { label: 'Con mucho gusto',        value: 'Con mucho gusto.' },
];

function buildSaludoText(base) {
  if (!saludoVariante || !base) return base;
  return base + ' ' + saludoVariante;
}

const EXTERNAL_LINK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

const atajos = [
  { nombre: "Divisor de archivos", url: "https://tecnologysmith.github.io/Dividir_archivo/" },
  { nombre: "Asignaciones semanales", url: "https://desk.zoho.com/agent/liztosoftware/soporte-lizto/knowledge-base/page?articlestatus=published#Solutions/dv/578738000018678001/es" },
  { nombre: "Buscar documento DIAN", url: "https://catalogo-vpfe.dian.gov.co/User/SearchDocument" },
  { nombre: "Hoja de Excel - Soporte", url: "https://docs.google.com/spreadsheets/d/1VTVHy6EUYLB9_v_zdfg3zM4y-m4OY7REYw-IT5hANGk/edit?pli=1&gid=0#gid=0" },
];

// ============= DATOS DE AGENTES Y HORARIOS =============

// Datos de agentes y horarios
const agentesData = {
  yeison: {
    nombre: "Yeison",
    horas: ["09:00", "11:00", "15:00", "17:00"],
    enlaces: {
      "09:00": "https://us06web.zoom.us/j/86553506923",
      "11:00": "https://us06web.zoom.us/j/84015173788",
      "15:00": "https://us06web.zoom.us/j/86502199583",
      "17:00": "https://us06web.zoom.us/j/89901352812"
    }
  },
  paola: {
    nombre: "Paola",
    horas: ["09:00", "12:00", "16:00"],
    enlaces: {
      "09:00": "https://us06web.zoom.us/j/84560427915",
      "12:00": "https://us06web.zoom.us/j/87186962523",
      "16:00": "https://us06web.zoom.us/j/81938853734"
    }
  },
  backup: {
    nombre: "Backup",
    horas: ["09:00", "11:00", "16:00"],
    enlaces: {
      "09:00": "https://us06web.zoom.us/j/84078053887",
      "11:00": "https://us06web.zoom.us/j/89414325009",
      "16:00": "https://us06web.zoom.us/j/83524214820"
    }
  }
};

// Hora actual en Colombia, sin depender de la zona horaria del PC del agente.
function horaColombia(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric", hour12: false, timeZone: "America/Bogota"
  }).formatToParts(fecha);
  const hora = Number(partes.find(p => p.type === "hour")?.value);
  return Number.isFinite(hora) ? hora % 24 : fecha.getHours();
}

// "buenas noches" (00:00–04:59), "buen día" (05:00–11:59), "buenas tardes"
// (12:00–18:59) y "buenas noches" (19:00–23:59)
function saludoHora(fecha = new Date()) {
  const hora = horaColombia(fecha);
  if (hora < 5) return "buenas noches";
  if (hora < 12) return "buen día";
  if (hora < 19) return "buenas tardes";
  return "buenas noches";
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Tokens de texto plano que se reemplazan al mostrar/copiar un mensaje, en UNA
// sola pasada (un nombre de cliente que contenga un token no se re-procesa):
//   nombreAgente      -> nombre del agente ("un agente" si está vacío)
//   holaCliente       -> "Hola Juan," | "Hola,"
//   encabezadoCliente -> "Hola Juan 👋" + salto de línea | nada (se come el salto
//                        de línea que lo sigue para no dejar una línea vacía)
//   saludoHora        -> "buen día" | "buenas tardes" | "buenas noches"
//   SaludoHora        -> igual, con mayúscula inicial
const TOKENS_REGEX = /encabezadoCliente[ \t]*\r?\n?|holaCliente|SaludoHora|saludoHora|nombreAgente/g;

function resolverTokens(texto) {
  const cliente = document.getElementById("userInput").value.trim();
  const agente = document.getElementById("agentInput").value.trim() || "un agente";
  const saludo = saludoHora();

  return String(texto).replace(TOKENS_REGEX, (token) => {
    if (token.startsWith("encabezadoCliente")) return cliente ? `Hola ${cliente} 👋\n` : "";
    switch (token) {
      case "holaCliente": return cliente ? `Hola ${cliente},` : "Hola,";
      case "SaludoHora":  return capitalizar(saludo);
      case "saludoHora":  return saludo;
      default:            return agente;   // nombreAgente
    }
  });
}

// Mensajes de las tarjetas especiales (pago, paso a paso): anteponen el
// encabezado del cliente cuando existe.
function addUserText(message) {
  return resolverTokens("encabezadoCliente\n" + message);
}

// ============= RESPUESTAS Y PLANTILLAS: Google Sheets + respaldo =============
// Cada tab lee su pestaña del Sheet (?hoja=respuestas | ?hoja=plantillas) con las
// columnas: id | categoria | titulo | texto | orden | activo.
// Si el Sheet no responde o la pestaña está vacía se usan los textos de
// respaldo de defaults.js, así que los agentes nunca se quedan sin respuestas.

const TABS_TARJETAS = {
  respuestas: { hoja: "respuestas", contenedor: "cards-respuestas", chips: "chips-respuestas",
                defecto: () => (typeof RESPUESTAS_DEFAULT !== "undefined" ? RESPUESTAS_DEFAULT : []) },
  plantillas: { hoja: "plantillas", contenedor: "cards-plantillas", chips: "chips-plantillas",
                defecto: () => (typeof PLANTILLAS_DEFAULT !== "undefined" ? PLANTILLAS_DEFAULT : []) }
};

const VALORES_INACTIVO = ["no", "false", "0", "n", "inactivo", "oculto"];

/**
 * Convierte las filas crudas (Sheet o defaults) en tarjetas válidas: descarta
 * filas sin título/texto o inactivas, sanea el id, ordena por `orden` y
 * respeta el orden de la hoja en los empates.
 */
function normalizarFilas(rows) {
  const usados = new Set();
  const salida = [];

  (Array.isArray(rows) ? rows : []).forEach((row, i) => {
    if (!row || typeof row !== "object") return;

    const titulo = String(row.titulo ?? "").trim();
    // "\n" escrito a mano en la celda también cuenta como salto de línea
    const texto = String(row.texto ?? "").replace(/\r\n/g, "\n").replace(/\\n/g, "\n").trim();
    if (!titulo || !texto) return;

    const activo = String(row.activo ?? "").trim().toLowerCase();
    if (VALORES_INACTIVO.includes(activo)) return;

    let id = String(row.id ?? "").trim().replace(/[^A-Za-z0-9_-]/g, "_") || `fila-${i + 2}`;
    while (usados.has(id)) id += "_";
    usados.add(id);

    const orden = parseFloat(String(row.orden ?? "").replace(",", "."));
    salida.push({
      id,
      categoria: String(row.categoria ?? "").trim(),
      titulo,
      texto,
      orden: Number.isFinite(orden) ? orden : Infinity,
      pos: i
    });
  });

  return salida.sort((a, b) => (a.orden === b.orden ? 0 : a.orden < b.orden ? -1 : 1) || a.pos - b.pos);
}

/** fetch con reintentos: Apps Script devuelve 404/errores transitorios de vez en cuando. */
async function fetchConReintento(url, intentos = 2) {
  let ultimoError = new Error("Error fetching data");
  for (let i = 0; i < intentos; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      ultimoError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      ultimoError = error;
    }
    if (i < intentos - 1) await new Promise(r => setTimeout(r, 1200));
  }
  throw ultimoError;
}

/** GET a una pestaña del Apps Script. Devuelve el array de filas o null si falló. */
async function fetchHoja(alias) {
  try {
    const response = await fetchConReintento(`${APPS_SCRIPT_URL}?hoja=${alias}`);
    const data = await response.json();
    // {status:"error"} u otro objeto: la hoja no existe o el script no está actualizado
    return Array.isArray(data) ? data : null;
  } catch (error) {
    return null;
  }
}

async function cargarTarjetasDesdeSheets() {
  await Promise.all(Object.entries(TABS_TARJETAS).map(async ([tab, cfg]) => {
    const filas = await fetchHoja(cfg.hoja);

    if (filas === null) {
      mostrarAvisoSync(tab, "No se pudo leer Google Sheets: se muestran los textos de respaldo.");
      return;
    }
    mostrarAvisoSync(tab, "");

    const nuevas = normalizarFilas(filas);
    if (!nuevas.length) return;   // pestaña vacía o sin filas válidas: se conserva el respaldo
    if (JSON.stringify(nuevas) === JSON.stringify(tarjetasData[tab])) return;

    tarjetasData[tab] = nuevas;
    document.documentElement.dataset[`fuente${capitalizar(tab)}`] = "sheets";
    renderTarjetas(tab);
  }));
}

function mostrarAvisoSync(tab, mensaje) {
  const id = `sync-notice-${tab}`;
  let aviso = document.getElementById(id);
  if (!mensaje) { if (aviso) aviso.hidden = true; return; }
  if (!aviso) {
    aviso = document.createElement("p");
    aviso.id = id;
    aviso.className = "sync-notice";
    aviso.setAttribute("role", "status");
    document.getElementById(TABS_TARJETAS[tab].chips).insertAdjacentElement("beforebegin", aviso);
  }
  aviso.textContent = mensaje;
  aviso.hidden = false;
}

function construirTarjeta(item, index) {
  const card = document.createElement("div");
  card.className = "text-box response-card";
  card.dataset.id = item.id;
  card.dataset.categoria = item.categoria;
  card.dataset.order = index;           // orden original (base de las no fijadas)
  card.style.setProperty("--i", index); // retraso de la animación de entrada
  card._item = item;

  const header = document.createElement("div");
  header.className = "card-header";

  const h3 = document.createElement("h3");
  h3.textContent = item.titulo;
  header.appendChild(h3);

  const pinBtn = document.createElement("button");
  pinBtn.type = "button";
  pinBtn.className = "card-pin-btn";
  pinBtn.title = "Fijar al inicio";
  pinBtn.setAttribute("aria-label", "Fijar al inicio");
  pinBtn.setAttribute("aria-pressed", "false");
  pinBtn.innerHTML = PIN_SVG;
  pinBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePin(card); });
  header.appendChild(pinBtn);

  const viewBtn = document.createElement("button");
  viewBtn.type = "button";
  viewBtn.className = "card-view-btn";
  viewBtn.title = "Ver mensaje completo";
  viewBtn.setAttribute("aria-label", "Ver mensaje completo");
  viewBtn.innerHTML = EYE_SVG;
  viewBtn.addEventListener("click", (e) => { e.stopPropagation(); openResponseModal(card); });
  header.appendChild(viewBtn);

  const preview = document.createElement("p");
  preview.className = "card-preview";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "card-copy-btn";
  copyBtn.innerHTML = `${CLIPBOARD_ICON_SVG} Copiar`;
  copyBtn.addEventListener("click", (e) => { e.stopPropagation(); copyCardText(card, copyBtn); });

  // Fuente de verdad del texto (oculta): búsqueda, vista previa, modal y copiado
  const textarea = document.createElement("textarea");
  textarea.className = "text-field card-data";
  textarea.id = `card-${item.id}`;
  textarea.readOnly = true;
  textarea.tabIndex = -1;
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.display = "none";
  modalCardMap.set(card, textarea);

  card.append(header, preview, copyBtn, textarea);

  // Clic en la tarjeta (fuera de botones) → copiar
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    copyCardText(card);
  });
  card.addEventListener("keydown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copyCardText(card); }
  });

  return card;
}

/** (Re)dibuja las tarjetas de un tab a partir de tarjetasData[tab]. */
function renderTarjetas(tab) {
  const cfg = TABS_TARJETAS[tab];
  const contenedor = document.getElementById(cfg.contenedor);
  if (!contenedor) return;

  if (modalCurrentTabId === tab) closeResponseModal();

  contenedor.querySelectorAll(":scope > .response-card").forEach(card => {
    modalCardMap.delete(card);
    card.remove();
  });

  // Las tarjetas van antes de cualquier otro hijo (special cards, aviso "sin resultados")
  const ancla = Array.from(contenedor.children).find(el => !el.classList.contains("response-card")) || null;
  tarjetasData[tab].forEach((item, index) => contenedor.insertBefore(construirTarjeta(item, index), ancla));

  if (tab === "respuestas") {
    saludoCard = Array.from(contenedor.querySelectorAll(":scope > .response-card"))
      .find(card => card.dataset.id === "daysMessage") || null;
  }

  reorderCards(contenedor);
  renderChips(tab);
  refrescarTextos();
  renderCardPreviews();
  reaplicarFiltros();
  if (tab === "respuestas") refrescarSugeridas();
}

/** Escribe en cada tarjeta su texto con los tokens ya resueltos. */
function refrescarTextos() {
  modalCardMap.forEach((textarea, card) => {
    if (card._item) textarea.value = resolverTokens(card._item.texto);
  });
}

function reaplicarFiltros() {
  const gs = document.getElementById("globalSearch");
  const hayFiltro = (gs && gs.value) || categoriaActiva.respuestas || categoriaActiva.plantillas;
  if (hayFiltro) globalSearchFilter(gs ? gs.value : "");
}

// ----- Chips de categoría -----

function renderChips(tab) {
  const contenedor = document.getElementById(TABS_TARJETAS[tab].chips);
  if (!contenedor) return;

  // Categorías en el orden de los datos (no del DOM: las tarjetas fijadas se
  // mueven), y al final las de las special cards ("Herramientas")
  const categorias = [];
  const agregar = cat => { if (cat && !categorias.includes(cat)) categorias.push(cat); };
  tarjetasData[tab].forEach(item => agregar(item.categoria));
  document.querySelectorAll(`#${tab} .special-card[data-categoria]`).forEach(el => agregar(el.dataset.categoria));

  if (categorias.length < 2) {
    contenedor.hidden = true;
    contenedor.replaceChildren();
    categoriaActiva[tab] = "";
    return;
  }
  if (!categorias.includes(categoriaActiva[tab])) categoriaActiva[tab] = "";

  contenedor.hidden = false;
  contenedor.replaceChildren(...["", ...categorias].map(cat => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "category-chip";
    chip.textContent = cat || "Todas";
    chip.dataset.categoria = "";   // evita que los chips cuenten como categorías
    chip.dataset.valor = cat;
    chip.setAttribute("aria-pressed", String(categoriaActiva[tab] === cat));
    chip.addEventListener("click", () => {
      categoriaActiva[tab] = cat;
      contenedor.querySelectorAll(".category-chip").forEach(c =>
        c.setAttribute("aria-pressed", String(c.dataset.valor === cat)));
      globalSearchFilter(document.getElementById("globalSearch")?.value || "");
    });
    return chip;
  }));
}

function updateMessages() {
  refrescarTextos();
  updatePasoaPasoMessage();
  // Actualizar también el mensaje de pago al cambiar el nombre del agente
  updateLinkPagoMessage();
  renderCardPreviews();

  // Re-aplicar búsqueda global si está activa (los textareas cambiaron)
  const _gs = document.getElementById("globalSearch");
  if (_gs && _gs.value) globalSearchFilter(_gs.value);
}

// Función para actualizar el mensaje de paso a paso con el enlace
function updatePasoaPasoMessage() {
  const enlace = document.getElementById("enlacePasoaPaso").value.trim();
  const mensaje = enlace
    ? `En este paso a paso 💡 te mostramos cómo puedes hacerlo:\n${enlace}\nSi tienes alguna duda me comentas por favor 😊`
    : "En este paso a paso 💡 te mostramos cómo puedes hacerlo, si tienes alguna duda me comentas por favor";
  document.getElementById("pasoaPaso").value = mensaje;
}

// Función para actualizar el mensaje de pago con el enlace
function updateLinkPagoMessage() {
  const enlacePago = document.getElementById("enlacePago").value.trim() || "https://lizto.com/pago";
  const mensaje = `Puedes realizar el pago a través de este enlace seguro: ${enlacePago} \nSi tienes alguna pregunta o necesitas ayuda con el proceso, no dudes en contactarnos. ¡Estamos aquí para ayudarte! 😊`;
  document.getElementById("linkPago").value = addUserText(mensaje);
}

// Inicializar selector de fechas (próximos 30 días, sin sábados ni domingos:
// no se dan capacitaciones esos días) - Solo una vez
function initializeFechaSelect() {
  const select = document.getElementById("fechaReunionSelect");
  // Limpiar opciones previas si existen
  if (select.children.length > 1) return;

  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dia = date.getDay();
    if (dia === 0 || dia === 6) continue;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormato = date.toLocaleDateString('es-CO', options);
    // Fecha local (toISOString usa UTC y después de las 7 p.m. en Colombia
    // devolvería el día siguiente)
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const fechaValue = `${date.getFullYear()}-${mm}-${dd}`;
    const option = document.createElement('option');
    option.value = fechaValue;
    option.textContent = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);
    select.appendChild(option);
  }
}

// Actualizar mensaje de reunión
function updateReunionMessage() {
  const fechaSelect = document.getElementById("fechaReunionSelect").value;
  const agenteSelect = document.getElementById("agenteReunion").value;
  const horaSelect = document.getElementById("horaReunionSelect").value;
  
  if (!fechaSelect || !agenteSelect || !horaSelect) {
    document.getElementById("linkReunionMessage").value = "Selecciona fecha, agente y hora para completar el mensaje";
    return;
  }
  
  // Parsear la fecha correctamente para evitar cambios de zona horaria
  const [year, month, day] = fechaSelect.split('-');
  const fecha = new Date(year, month - 1, day);
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const fechaFormato = fecha.toLocaleDateString('es-CO', options);
  const fechaCapitalizada = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);
  
  const [h, m] = horaSelect.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  const hora12 = `${hour}:${m} ${ampm}`;
  
  const agente = agentesData[agenteSelect];
  const enlace = agente.enlaces[horaSelect];
  
  const mensajeCompleto = `Te confirmo que ya hemos agendado tu reunión\nEl día de la sesión te estaremos esperando en sala durante un máximo de 15 minutos ⏳\nPor favor recuerda ingresar puntualmente para que podamos aprovechar al máximo el espacio juntos 🙌\nTe comparto el link de acceso:\nFecha y hora Colombia: ${fechaCapitalizada} a las ${hora12}\n${enlace}`;
  
  document.getElementById("linkReunionMessage").value = mensajeCompleto;
}

// ============= LISTENERS Y INICIALIZACIÓN =============

// Inicializar fechas
initializeFechaSelect();

// El saludo depende de la hora: si el agente deja la pestaña abierta durante
// varias horas, se recalcula al cruzar de periodo y al volver a la pestaña.
let ultimoSaludo = saludoHora();
function refrescarSaludoSiCambio() {
  const actual = saludoHora();
  if (actual === ultimoSaludo) return;
  ultimoSaludo = actual;
  updateMessages();
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refrescarSaludoSiCambio();
});
setInterval(refrescarSaludoSiCambio, 60 * 1000);

// Restaurar nombres desde localStorage
const savedAgent = localStorage.getItem("lizto_agent_name");
const savedClient = localStorage.getItem("lizto_client_name");
if (savedAgent) document.getElementById("agentInput").value = savedAgent;
if (savedClient) document.getElementById("userInput").value = savedClient;

// Llamar updateMessages para inicializar todos los mensajes
updateMessages();

// Listeners para los campos de entrada de nombre
document.getElementById("userInput").addEventListener("input", function() {
  localStorage.setItem("lizto_client_name", this.value);
  updateMessages();
});
document.getElementById("agentInput").addEventListener("input", function() {
  localStorage.setItem("lizto_agent_name", this.value);
  updateMessages();
});

// Listener para el enlace de pago
document.getElementById("enlacePago").addEventListener("input", updateLinkPagoMessage);

// Listener para el enlace de paso a paso
document.getElementById("enlacePasoaPaso").addEventListener("input", updatePasoaPasoMessage);

// Listeners para la reunión
document.getElementById("agenteReunion").addEventListener("change", function() {
  const horaSelect = document.getElementById("horaReunionSelect");
  horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
  
  if (this.value) {
    const agente = agentesData[this.value];
    agente.horas.forEach(hora => {
      const [h, m] = hora.split(':');
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      if (hour === 0) hour = 12;
      const option = document.createElement('option');
      option.value = hora;
      option.textContent = `${hour}:${m} ${ampm}`;
      horaSelect.appendChild(option);
    });
  }
  updateReunionMessage();
});

document.getElementById("fechaReunionSelect").addEventListener("change", updateReunionMessage);
document.getElementById("horaReunionSelect").addEventListener("change", updateReunionMessage);

// Tema: arranca según el sistema operativo y lo sigue mientras el agente no use
// el toggle. La elección manual manda durante la sesión y NO se persiste.
const toggleButton = document.getElementById("toggleBrillo");
const iconoBrillo = document.getElementById("iconoBrillo");
const temaSO = window.matchMedia("(prefers-color-scheme: light)");
let brilloActivo = temaSO.matches;
let temaManual = false;

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function applyTheme(claro) {
  brilloActivo = claro;
  // La clase vive en <html> (la pone también un script en <head> para evitar el
  // parpadeo); los tokens están en `.light-mode`.
  document.documentElement.classList.toggle("light-mode", claro);
  toggleButton.classList.toggle("off", !claro);
  iconoBrillo.innerHTML = claro ? MOON_SVG : SUN_SVG;
  toggleButton.setAttribute("aria-label", claro ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", claro ? "#eff5f5" : "#0e1a1c");
}

applyTheme(brilloActivo);

toggleButton.addEventListener("click", () => {
  temaManual = true;
  applyTheme(!brilloActivo);
});

temaSO.addEventListener("change", (e) => {
  if (!temaManual) applyTheme(e.matches);
});

// Manejo de pestañas
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    closeResponseModal();
    // Remover active de todos los botones y contenidos
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    // Agregar active al botón clickeado y su contenido
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// Permitir copiar el contenido de cada textarea con su botón 'Copiar'
const CLIPBOARD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

function triggerCopyFeedback(btn) {
  btn.innerHTML = '¡Copiado! ✅';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = CLIPBOARD_ICON_SVG;
    btn.disabled = false;
  }, 1500);
}

document.querySelectorAll('button.copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (btn.disabled) return;
    const textarea = btn.closest('.text-box').querySelector('textarea');
    if (!textarea) return;
    const text = textarea.value;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => triggerCopyFeedback(btn))
        .catch(() => { textarea.select(); document.execCommand('copy'); triggerCopyFeedback(btn); });
    } else {
      textarea.select();
      document.execCommand('copy');
      triggerCopyFeedback(btn);
    }
  });
});

// ============= DENSIDAD DE VISTA =============

let densityMode = 'normal';

function applyDensity(mode) {
  densityMode = mode;
  const textFields = document.querySelector('#respuestas .text-fields');
  if (textFields) textFields.classList.toggle('compact-mode', mode === 'compact');

  const btnNormal = document.getElementById('densityNormal');
  const btnCompact = document.getElementById('densityCompact');
  if (btnNormal) {
    btnNormal.classList.toggle('density-btn--active', mode === 'normal');
    btnNormal.setAttribute('aria-pressed', String(mode === 'normal'));
  }
  if (btnCompact) {
    btnCompact.classList.toggle('density-btn--active', mode === 'compact');
    btnCompact.setAttribute('aria-pressed', String(mode === 'compact'));
  }
}

// ============= BUSCADOR GLOBAL =============

let helpCenterInstance;
let diagnosticoInstance;

function updateTabBadge(badgeId, count, isSearching) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;
  if (!isSearching) {
    badge.style.display = "none";
    badge.textContent = "";
    return;
  }
  badge.textContent = count;
  badge.style.display = "inline-block";
  badge.className = count === 0 ? "tab-badge no-results" : "tab-badge";
}

function showNoResults(tabId, show) {
  const textFields = document.querySelector(`#${tabId} .text-fields`) ||
                     document.querySelector(`#${tabId} .atajos-grid`);
  if (!textFields) return;
  let el = document.getElementById(`no-results-${tabId}`);
  if (!el) {
    el = document.createElement("p");
    el.id = `no-results-${tabId}`;
    el.className = "search-no-results";
    el.textContent = "No hay resultados para esta búsqueda.";
    textFields.appendChild(el);
  }
  el.style.display = show ? "block" : "none";
}

function renderAtajos() {
  const grid = document.getElementById('atajos')?.querySelector('.atajos-grid');
  if (!grid) return;
  grid.innerHTML = '';
  atajos.forEach(({ nombre, url }) => {
    const card = document.createElement('div');
    card.className = 'atajo-card';
    card.dataset.nombre = nombre.toLowerCase();
    card.innerHTML = `
      <h3>${nombre}</h3>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="atajo-open-btn">
        ${EXTERNAL_LINK_SVG}
        Abrir
      </a>
    `;
    grid.appendChild(card);
  });
}

function globalSearchFilter(query) {
  const q = query.toLowerCase().trim();
  const isSearching = q.length > 0;

  // Un chip de categoría activo y el texto de búsqueda se COMBINAN (AND)
  const filtraResp = isSearching || !!categoriaActiva.respuestas;
  const filtraPlant = isSearching || !!categoriaActiva.plantillas;
  const categoriaOk = (tab, card) =>
    !categoriaActiva[tab] || card.dataset.categoria === categoriaActiva[tab];

  // Respuestas
  const respCards = document.querySelectorAll("#respuestas .text-box");
  let respCount = 0;
  respCards.forEach(card => {
    const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
    const text  = (card.querySelector("textarea")?.value || "").toLowerCase();
    const match = categoriaOk("respuestas", card) && (!isSearching || title.includes(q) || text.includes(q));
    card.style.display = match ? "" : "none";
    if (match) respCount++;
  });
  // El contenedor de special cards se oculta si ninguna de sus tarjetas quedó
  // visible, para que no deje un hueco (gap) vacío en la grilla.
  const specialContainer = document.querySelector("#respuestas .special-cards-container");
  if (specialContainer) {
    const algunaVisible = Array.from(specialContainer.querySelectorAll(".text-box"))
      .some(card => card.style.display !== "none");
    specialContainer.style.display = algunaVisible ? "" : "none";
  }
  showNoResults("respuestas", filtraResp && respCount === 0);

  // Plantillas
  const plantCards = document.querySelectorAll("#plantillas .text-box");
  let plantCount = 0;
  plantCards.forEach(card => {
    const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
    const text  = (card.querySelector("textarea")?.value || "").toLowerCase();
    const match = categoriaOk("plantillas", card) && (!isSearching || title.includes(q) || text.includes(q));
    card.style.display = match ? "" : "none";
    if (match) plantCount++;
  });
  showNoResults("plantillas", filtraPlant && plantCount === 0);

  // Paso a paso (delega al HelpCenter)
  let pasoCount = 0;
  if (helpCenterInstance) pasoCount = helpCenterInstance.applySearch(q);

  // Diagnóstico (delega al DiagnosticoCenter: busca casos en todas las categorías)
  let diagCount = 0;
  if (diagnosticoInstance) diagCount = diagnosticoInstance.applySearch(q);

  // Atajos
  const atajosCards = document.querySelectorAll("#atajos .atajo-card");
  let atajosCount = 0;
  atajosCards.forEach(card => {
    const match = !isSearching || (card.dataset.nombre || '').includes(q);
    card.style.display = match ? "" : "none";
    if (match) atajosCount++;
  });
  showNoResults("atajos", isSearching && atajosCount === 0);

  // Badges
  updateTabBadge("badge-respuestas", respCount,   filtraResp);
  updateTabBadge("badge-plantillas", plantCount,  filtraPlant);
  updateTabBadge("badge-pasoPaso",   pasoCount,   isSearching);
  updateTabBadge("badge-diagnostico", diagCount,  isSearching);
  updateTabBadge("badge-atajos",     atajosCount, isSearching);
  updateModalAfterSearch();
  refrescarSugeridas();   // se oculta mientras se busca o hay un chip de categoría activo
}

// ============= HELP CENTER MODULE - PASO A PASO =============

// Endpoint único del Apps Script. Sin parámetros devuelve "Paso a paso";
// con ?hoja=diagnostico devuelve la hoja de Diagnóstico.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyin6iegICuU2DrvjEKMs-2TgtA5hgoUXyI1B5-YY97CqBrGITXENqpnYTezlSIaMY/exec";

/**
 * Copia texto plano al portapapeles, con fallback para navegadores sin Clipboard API.
 * Compartido por Paso a paso y Diagnóstico.
 */
function copiarTextoPlano(texto) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(texto).catch(() => copiarConFallback(texto));
  }
  return copiarConFallback(texto);
}

function copiarConFallback(texto) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

// El contenido de Paso a paso y Diagnóstico viene de Google Sheets y se muestra
// con innerHTML: SIEMPRE se escapa antes de construir el HTML. El copiado no
// pasa por aquí (usa el string crudo).
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Recibe texto plano, devuelve HTML seguro con las URLs http(s) como enlaces.
function linkify(text) {
  const source = String(text);
  let html = "";
  let last = 0;
  for (const match of source.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    // La puntuación final (".", ",", ")" ...) no forma parte del enlace
    const url = match[0].replace(/[.,;:!?)\]]+$/, "");
    if (!url) continue;
    html += escapeHtml(source.slice(last, match.index));
    html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    last = match.index + url.length;
  }
  return html + escapeHtml(source.slice(last));
}

// Un ítem de lista empieza por "-", "•" o "1." / "1)". Se acepta con espacio
// ("- Paso", "1. Paso") y también pegado a una letra ("-Paso", "1.Paso"), que es
// como se suele escribir en las celdas de Sheets. No cuenta "-----", "->" ni "3.5".
const RE_ITEM_UL = /^[-•](?:\s+|(?=[\p{L}¿¡("'\[]))/u;
const RE_ITEM_OL = /^\d+[.)](?:\s+|(?=[\p{L}¿¡("'\[]))/u;

/** Divide un texto plano en bloques: callout (⚠️), ol, ul y p. */
function parsearBloquesContenido(textoPlano) {
  const lines = String(textoPlano).split('\n');
  const blocks = [];
  let i = 0;

  // Lee una lista que empieza en `i`. Las líneas en blanco entre ítems NO la
  // cortan ("-A\n\n-B" es una sola lista de 2 ítems).
  const leerLista = (regex, limpiar) => {
    const items = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (regex.test(t)) {
        items.push(t.replace(limpiar, ''));
        i++;
      } else if (!t) {
        let j = i;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && regex.test(lines[j].trim())) i = j;
        else break;
      } else {
        break;
      }
    }
    return items;
  };

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) { i++; continue; }

    // ⚠️ Importante: callout
    if (/^⚠️/.test(trimmed)) {
      blocks.push({ type: 'callout', text: trimmed });
      i++;
      continue;
    }

    // Lista numerada: 1. o 1)
    if (RE_ITEM_OL.test(trimmed)) {
      blocks.push({ type: 'ol', items: leerLista(RE_ITEM_OL, /^\d+[.)]\s*/) });
      continue;
    }

    // Lista con viñetas: - o •
    if (RE_ITEM_UL.test(trimmed)) {
      blocks.push({ type: 'ul', items: leerLista(RE_ITEM_UL, /^[-•]\s*/) });
      continue;
    }

    // Párrafo normal
    const paraLines = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || /^⚠️/.test(t) || RE_ITEM_OL.test(t) || RE_ITEM_UL.test(t)) break;
      paraLines.push(t);
      i++;
    }
    if (paraLines.length) blocks.push({ type: 'p', lines: paraLines });
  }

  return blocks;
}

/** Ítems de lista (ol/ul) de un texto, en orden y como texto plano. */
function extraerItemsLista(textoPlano) {
  return parsearBloquesContenido(textoPlano)
    .filter(block => block.type === 'ol' || block.type === 'ul')
    .flatMap(block => block.items);
}

/**
 * Vista previa con formato (HTML escapado). Con { checklist: true } cada ítem de
 * lista lleva una casilla (data-idx = posición entre todos los ítems del texto).
 * Solo afecta a la vista previa: el copiado usa SIEMPRE el string crudo.
 */
function formatearContenidoPasoAPaso(textoPlano, { checklist = false } = {}) {
  let indice = 0;

  return parsearBloquesContenido(textoPlano).map(block => {
    switch (block.type) {
      case 'callout':
        return `<div class="callout-importante">${linkify(block.text)}</div>`;
      case 'ol':
      case 'ul': {
        if (checklist) {
          const items = block.items.map(it => {
            const idx = indice++;
            return `<li class="check-item"><label><input type="checkbox" class="check-input" data-idx="${idx}">` +
                   `<span class="check-text">${linkify(it)}</span></label></li>`;
          }).join('');
          return `<ul class="checklist">${items}</ul>`;
        }
        const tag = block.type;
        return `<${tag}>${block.items.map(it => `<li>${linkify(it)}</li>`).join('')}</${tag}>`;
      }
      case 'p':
        return `<p>${block.lines.map(linkify).join('<br>')}</p>`;
      default:
        return '';
    }
  }).join('');
}
// Módulo completamente independiente y escalable para la sección "Paso a Paso"

class HelpCenter {
  constructor() {
    this.data = [];
    this.filteredData = [];
    this.selectedItem = null;
    this.apiUrl = APPS_SCRIPT_URL;

    this.cacheDOMElements();
    this.initEventListeners();
    this.loadData();
  }

  /**
   * Cachea todos los elementos del DOM para evitar búsquedas repetidas
   */
  cacheDOMElements() {
    this.elements = {
      searchInput: document.getElementById("help-search-input"),
      itemsList: document.getElementById("help-items-list"),
      contentEmpty: document.getElementById("help-content-empty"),
      contentDisplay: document.getElementById("help-content-display"),
      articleTitle: document.getElementById("help-article-title"),
      articleContent: document.getElementById("help-article-content"),
      copyBtn: document.getElementById("help-copy-btn"),
      copyFeedback: document.getElementById("copy-feedback"),
      backBtn: document.getElementById("help-back-btn"),
      sidebar: document.querySelector(".help-sidebar")
    };
  }

  /**
   * Inicializa todos los event listeners
   */
  initEventListeners() {
    this.elements.searchInput.addEventListener("input", (e) => this.handleSearch(e));
    this.elements.copyBtn.addEventListener("click", () => this.copyContent());
    this.elements.backBtn.addEventListener("click", () => this.goBack());
  }

  /**
   * Carga los datos desde la API
   */
  async loadData() {
    try {
      const response = await fetchConReintento(this.apiUrl);
      if (!response.ok) throw new Error("Error fetching data");
      
      const data = await response.json();
      // El Apps Script devuelve un objeto {status:"error"} si falla la lectura
      if (!Array.isArray(data)) throw new Error(data?.message || "Respuesta inesperada de la API");

      this.data = data;
      const pendingQuery = (document.getElementById("globalSearch")?.value || "").toLowerCase().trim();
      this.applySearch(pendingQuery);
    } catch (error) {
      console.error("Error loading help center data:", error);
      this.showError("No se pudieron cargar los artículos");
    }
  }

  /**
   * Maneja el evento de búsqueda en tiempo real
   */
  handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(item =>
        item.titulo.toLowerCase().includes(query) ||
        item.contenido.toLowerCase().includes(query)
      );
    }
    
    this.renderItemsList();

    // Auto-seleccionar el primer item solo en escritorio
    if (this.filteredData.length > 0 && !this.selectedItem && window.innerWidth >= 768) {
      this.selectItem(this.filteredData[0]);
    }
  }

  /**
   * Renderiza la lista de items en el sidebar
   */
  renderItemsList() {
    const container = this.elements.itemsList;
    container.innerHTML = "";

    if (this.filteredData.length === 0) {
      container.innerHTML = '<div class="help-empty-list">No se encontraron artículos</div>';
      return;
    }

    this.filteredData.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "help-item";
      
      if (this.selectedItem && this.selectedItem.titulo === item.titulo) {
        itemElement.classList.add("active");
      }
      
      itemElement.textContent = item.titulo;
      itemElement.addEventListener("click", () => this.selectItem(item));
      
      container.appendChild(itemElement);
    });
  }

  /**
   * Selecciona un item y muestra su contenido
   */
  selectItem(item) {
    this.selectedItem = item;
    this.renderItemsList();
    this.displayContent();

    if (window.innerWidth < 768) {
      this.elements.sidebar.style.display = "none";
      this.elements.backBtn.style.display = "flex";
    } else {
      const activeItem = this.elements.itemsList.querySelector(".help-item.active");
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  goBack() {
    this.elements.sidebar.style.display = "";
    this.elements.backBtn.style.display = "none";
    this.elements.contentDisplay.style.display = "none";
    this.elements.contentEmpty.style.display = "flex";
    this.selectedItem = null;
    this.renderItemsList();
  }

  /**
   * Muestra el contenido del item seleccionado
   */
  displayContent() {
    if (!this.selectedItem) return;

    // Animar transición
    this.elements.contentEmpty.style.display = "none";
    this.elements.contentDisplay.style.display = "block";

    // Actualizar contenido
    this.elements.articleTitle.textContent = this.selectedItem.titulo;
    this.elements.articleContent.innerHTML = formatearContenidoPasoAPaso(this.selectedItem.contenido);
    
    // Reset button feedback
    this.resetCopyButton();
    
    // Scroll al top del contenido
    document.querySelector(".help-content").scrollTop = 0;
  }

  /**
   * Copia el contenido actual al portapapeles
   */
  copyContent() {
    if (!this.selectedItem) return;

    const textToCopy = `${this.selectedItem.titulo}\n\n${this.selectedItem.contenido}`;

    copiarTextoPlano(textToCopy)
      .then(() => this.showCopyFeedback())
      .catch(err => console.error("Error copying to clipboard:", err));
  }

  /**
   * Muestra feedback visual cuando se copia
   */
  showCopyFeedback() {
    this.elements.copyBtn.classList.add("copied");
    this.elements.copyBtn.disabled = true;
    this.elements.copyFeedback.textContent = "¡Copiado! ✅";

    setTimeout(() => {
      this.resetCopyButton();
    }, 1500);
  }

  /**
   * Reinicia el estado del botón copiar
   */
  resetCopyButton() {
    this.elements.copyBtn.classList.remove("copied");
    this.elements.copyBtn.disabled = false;
    this.elements.copyFeedback.textContent = "Copiar";
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message) {
    this.elements.itemsList.innerHTML = `<div class="help-empty-list">${escapeHtml(message)}</div>`;
  }

  applySearch(query) {
    this.filteredData = !query
      ? [...this.data]
      : this.data.filter(item =>
          item.titulo.toLowerCase().includes(query) ||
          item.contenido.toLowerCase().includes(query)
        );
    this.elements.searchInput.value = query;
    this.renderItemsList();
    return this.filteredData.length;
  }
}

// ============= DIAGNÓSTICO MODULE =============
// Reutiliza el layout y los estilos de "Paso a paso", pero con 2 niveles de
// navegación en el sidebar: categorías → casos de la categoría → contenido.

class DiagnosticoCenter {
  constructor() {
    this.rows = [];                          // array plano del Apps Script
    this.grupos = {};                        // { categoria: [fila, fila, ...] }
    this.categorias = [];
    this.diagnosticoCurrentCategory = null;  // null = nivel 1 (categorías)
    this.selectedItem = null;                // fila mostrada en el panel derecho
    this.query = "";
    this.searchScope = "level";              // "level" = nivel actual | "global" = resultados planos
    this.apiUrl = `${APPS_SCRIPT_URL}?hoja=diagnostico`;

    // Checklist del caso abierto: solo en memoria, se reinicia al cambiar de caso
    this.checkItems = [];                    // texto plano de cada ítem de lista
    this.checks = new Set();                 // índices marcados como revisados
    this.checklistItem = null;               // caso al que pertenece el estado

    this.cacheDOMElements();
    this.initEventListeners();
    this.loadData();
  }

  cacheDOMElements() {
    this.elements = {
      searchInput: document.getElementById("diag-search-input"),
      breadcrumb: document.getElementById("diag-breadcrumb"),
      itemsList: document.getElementById("diag-items-list"),
      contentEmpty: document.getElementById("diag-content-empty"),
      emptyText: document.getElementById("diag-empty-text"),
      contentDisplay: document.getElementById("diag-content-display"),
      articleCategory: document.getElementById("diag-article-category"),
      articleTitle: document.getElementById("diag-article-title"),
      articleContent: document.getElementById("diag-article-content"),
      copyBtn: document.getElementById("diag-copy-btn"),
      copyFeedback: document.getElementById("diag-copy-feedback"),
      backBtn: document.getElementById("diag-back-btn"),
      sidebar: document.querySelector("#diagnostico .help-sidebar"),
      progress: document.getElementById("diag-checklist-progress"),
      progressFill: document.getElementById("diag-progress-fill"),
      progressText: document.getElementById("diag-progress-text"),
      progressReset: document.getElementById("diag-progress-reset"),
      escalarBtn: document.getElementById("diag-escalar-btn"),
      escalarPanel: document.getElementById("diag-escalar-panel"),
      escalarText: document.getElementById("diag-escalar-text"),
      escalarCopy: document.getElementById("diag-escalar-copy"),
      escalarClose: document.getElementById("diag-escalar-close")
    };
  }

  initEventListeners() {
    this.elements.searchInput.addEventListener("input", (e) => {
      // El buscador local solo filtra el nivel visible
      this.query = e.target.value;
      this.searchScope = "level";
      this.render();
    });
    this.elements.breadcrumb.addEventListener("click", () => this.goToCategorias());
    this.elements.copyBtn.addEventListener("click", () => this.copyContent());
    this.elements.backBtn.addEventListener("click", () => this.goBack());

    // Checklist (delegación: las casillas se redibujan con cada caso)
    this.elements.articleContent.addEventListener("change", (e) => {
      const input = e.target.closest(".check-input");
      if (input) this.toggleCheck(Number(input.dataset.idx), input.checked);
    });
    this.elements.progressReset.addEventListener("click", () => this.resetChecks());

    // Escalamiento
    this.elements.escalarBtn.addEventListener("click", () => this.abrirEscalamiento());
    this.elements.escalarClose.addEventListener("click", () => this.cerrarEscalamiento());
    this.elements.escalarCopy.addEventListener("click", () => this.copiarEscalamiento());
  }

  async loadData() {
    try {
      const response = await fetchConReintento(this.apiUrl);
      if (!response.ok) throw new Error("Error fetching data");

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error(data?.message || "Respuesta inesperada de la API");

      this.rows = data
        .map(row => ({
          categoria: String(row.categoria || "").trim(),
          subtitulo: String(row.subtitulo || "").trim(),
          contenido: String(row.contenido || "").trim()
        }))
        .filter(row => row.categoria && row.subtitulo);

      if (this.rows.length === 0) {
        console.warn("Diagnóstico: la API no devolvió filas con categoria/subtitulo. " +
                     "Verifica que el Apps Script esté desplegado con el parámetro ?hoja=diagnostico.");
        this.showError("Aún no hay casos de diagnóstico disponibles");
        return;
      }

      // Agrupamiento en el frontend a partir del array plano
      this.grupos = this.rows.reduce((acc, row) => {
        (acc[row.categoria] = acc[row.categoria] || []).push(row);
        return acc;
      }, {});
      this.categorias = Object.keys(this.grupos);

      const pendingQuery = (document.getElementById("globalSearch")?.value || "").trim();
      if (pendingQuery) this.applySearch(pendingQuery.toLowerCase());
      else this.render();
    } catch (error) {
      console.error("Error loading diagnostico data:", error);
      this.showError("No se pudieron cargar los casos de diagnóstico");
    }
  }

  /**
   * Entrada del buscador global: busca casos en todas las categorías a la vez.
   * Devuelve cuántos coinciden (para el badge del tab).
   */
  applySearch(query) {
    this.query = query || "";
    this.searchScope = this.query ? "global" : "level";
    this.elements.searchInput.value = this.query;
    this.render();
    return this.query ? this.getMatches(this.query.toLowerCase().trim()).length : 0;
  }

  getMatches(q) {
    return this.rows.filter(row =>
      row.categoria.toLowerCase().includes(q) ||
      row.subtitulo.toLowerCase().includes(q) ||
      row.contenido.toLowerCase().includes(q)
    );
  }

  /**
   * Dibuja el sidebar según el nivel actual (o los resultados del buscador global)
   */
  render() {
    if (!this.categorias.length) return;
    const q = this.query.toLowerCase().trim();

    if (this.searchScope === "global" && q) {
      this.elements.breadcrumb.style.display = "none";
      this.renderItems(this.getMatches(q), "resultado");
      return;
    }

    if (this.diagnosticoCurrentCategory) {
      this.elements.breadcrumb.style.display = "flex";
      const items = this.grupos[this.diagnosticoCurrentCategory] || [];
      const filtrados = !q
        ? items
        : items.filter(item =>
            item.subtitulo.toLowerCase().includes(q) ||
            item.contenido.toLowerCase().includes(q)
          );
      this.renderItems(filtrados, "caso");
    } else {
      this.elements.breadcrumb.style.display = "none";
      const cats = !q
        ? this.categorias
        : this.categorias.filter(cat => cat.toLowerCase().includes(q));
      this.renderCategorias(cats);
    }
  }

  renderCategorias(categorias) {
    const container = this.elements.itemsList;
    container.innerHTML = "";

    if (categorias.length === 0) {
      container.innerHTML = '<div class="help-empty-list">No se encontraron categorías</div>';
      return;
    }

    categorias.forEach(categoria => {
      const total = (this.grupos[categoria] || []).length;
      const el = this.buildItem(categoria, `${total} ${total === 1 ? "caso" : "casos"}`);
      el.addEventListener("click", () => this.selectCategoria(categoria));
      container.appendChild(el);
    });
  }

  /**
   * Lista de casos: dentro de una categoría ("caso") o del buscador global ("resultado",
   * que muestra a qué categoría pertenece cada uno)
   */
  renderItems(items, modo) {
    const container = this.elements.itemsList;
    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = '<div class="help-empty-list">No se encontraron casos</div>';
      return;
    }

    items.forEach(item => {
      const el = this.buildItem(item.subtitulo, modo === "resultado" ? item.categoria : null);
      if (this.selectedItem === item) el.classList.add("active");
      el.addEventListener("click", () => {
        if (modo === "resultado") {
          // Un resultado global lleva directo al nivel 2/3 de su categoría
          this.diagnosticoCurrentCategory = item.categoria;
          this.searchScope = "level";
          this.query = "";
          this.elements.searchInput.value = "";
        }
        this.selectItem(item);
      });
      container.appendChild(el);
    });
  }

  buildItem(titulo, meta) {
    const el = document.createElement("div");

    // Sin meta se comporta igual que un item de "Paso a paso"
    if (!meta) {
      el.className = "help-item";
      el.textContent = titulo;
      return el;
    }

    el.className = "help-item help-item--stacked";

    const tituloEl = document.createElement("span");
    tituloEl.className = "help-item-title";
    tituloEl.textContent = titulo;
    el.appendChild(tituloEl);

    const metaEl = document.createElement("span");
    metaEl.className = "help-item-meta";
    metaEl.textContent = meta;
    el.appendChild(metaEl);

    return el;
  }

  /** Nivel 1 → nivel 2 */
  selectCategoria(categoria) {
    this.diagnosticoCurrentCategory = categoria;
    this.selectedItem = null;
    this.query = "";
    this.searchScope = "level";
    this.elements.searchInput.value = "";
    this.showEmptyState("Selecciona un caso para ver el paso a paso");
    this.render();
  }

  /** Nivel 2 → nivel 1 */
  goToCategorias() {
    this.diagnosticoCurrentCategory = null;
    this.selectedItem = null;
    this.query = "";
    this.searchScope = "level";
    this.elements.searchInput.value = "";
    this.showEmptyState("Selecciona una categoría para ver los casos disponibles");
    this.render();
  }

  /** Nivel 3 */
  selectItem(item) {
    this.selectedItem = item;
    this.render();
    this.displayContent();

    if (window.innerWidth < 768) {
      this.elements.sidebar.style.display = "none";
      this.elements.backBtn.style.display = "flex";
    } else {
      const activeItem = this.elements.itemsList.querySelector(".help-item.active");
      if (activeItem) activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  displayContent() {
    if (!this.selectedItem) return;

    this.elements.contentEmpty.style.display = "none";
    this.elements.contentDisplay.style.display = "block";

    this.elements.articleCategory.textContent = this.selectedItem.categoria;
    this.elements.articleTitle.textContent = this.selectedItem.subtitulo;
    this.elements.articleContent.innerHTML =
      formatearContenidoPasoAPaso(this.selectedItem.contenido, { checklist: true });

    // Volver a abrir el mismo caso conserva lo marcado; otro caso empieza limpio
    if (this.checklistItem !== this.selectedItem) {
      this.checklistItem = this.selectedItem;
      this.checkItems = extraerItemsLista(this.selectedItem.contenido);
      this.checks = new Set();
      this.cerrarEscalamiento();
    }
    this.pintarChecks();

    this.resetCopyButton();
    const panel = document.querySelector("#diagnostico .help-content");
    if (panel) panel.scrollTop = 0;
  }

  // ----- Checklist -----

  toggleCheck(idx, marcado) {
    if (marcado) this.checks.add(idx); else this.checks.delete(idx);
    this.pintarChecks();
  }

  resetChecks() {
    this.checks = new Set();
    this.pintarChecks();
  }

  /** Sincroniza casillas, barra de progreso y énfasis del botón de escalamiento. */
  pintarChecks() {
    const total = this.checkItems.length;
    const hechos = this.checks.size;

    this.elements.articleContent.querySelectorAll(".check-input").forEach(input => {
      const marcado = this.checks.has(Number(input.dataset.idx));
      input.checked = marcado;
      input.closest(".check-item")?.classList.toggle("done", marcado);
    });

    this.elements.progress.hidden = total === 0;
    if (total > 0) {
      this.elements.progressFill.style.width = `${Math.round((hechos / total) * 100)}%`;
      this.elements.progressText.textContent = hechos === total
        ? `¡Todo revisado! (${total} de ${total}). Si no apareció la causa, prepara el escalamiento.`
        : `${hechos} de ${total} revisados`;
      this.elements.progressReset.hidden = hechos === 0;
    }
    this.elements.escalarBtn.classList.toggle("destacado", total > 0 && hechos === total);
  }

  // ----- Escalamiento a desarrollo -----

  /** Mensaje de texto plano con lo revisado y campos vacíos para completar. */
  construirMensajeEscalamiento() {
    const caso = this.selectedItem;
    const agente = document.getElementById("agentInput")?.value.trim() || "";
    const revisados = this.checkItems.filter((_, i) => this.checks.has(i));
    const pendientes = this.checkItems.filter((_, i) => !this.checks.has(i));
    const lista = (items) => items.map(it => `- ${it}`).join("\n");

    const partes = [
      "Escalamiento a desarrollo",
      "",
      `Categoría: ${caso.categoria}`,
      `Caso: ${caso.subtitulo}`,
      "",
      "Negocio:",
      "NIT:",
      "Sede / usuario afectado:",
      "Qué ocurre (detalle y cómo reproducirlo):",
      ""
    ];

    if (this.checkItems.length === 0) {
      partes.push(`Se revisó el caso documentado "${caso.subtitulo}" sin encontrar la causa.`);
    } else {
      partes.push("Revisado sin encontrar la causa:");
      partes.push(revisados.length ? lista(revisados) : "- (ningún paso marcado)");
      if (pendientes.length) {
        partes.push("", "No revisado:", lista(pendientes));
      }
    }

    partes.push("", `Reportado por: ${agente}`);
    return partes.join("\n");
  }

  abrirEscalamiento() {
    if (!this.selectedItem) return;
    this.elements.escalarText.value = this.construirMensajeEscalamiento();
    this.elements.escalarPanel.hidden = false;
    this.elements.escalarText.focus({ preventScroll: true });
    this.elements.escalarPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  cerrarEscalamiento() {
    this.elements.escalarPanel.hidden = true;
  }

  copiarEscalamiento() {
    const btn = this.elements.escalarCopy;
    const texto = this.elements.escalarText.value;   // texto plano, tal como lo editó el agente
    if (!texto || btn.disabled) return;

    copiarTextoPlano(texto)
      .then(() => {
        const original = btn.textContent;
        btn.textContent = "¡Copiado! ✅";
        btn.disabled = true;
        setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1500);
      })
      .catch(err => console.error("Error copying to clipboard:", err));
  }

  showEmptyState(texto) {
    this.elements.contentDisplay.style.display = "none";
    this.elements.contentEmpty.style.display = "flex";
    this.elements.emptyText.textContent = texto;
  }

  /** Botón "← Volver" de mobile: del contenido a la lista */
  goBack() {
    this.elements.sidebar.style.display = "";
    this.elements.backBtn.style.display = "none";
    this.selectedItem = null;
    this.showEmptyState(
      this.diagnosticoCurrentCategory
        ? "Selecciona un caso para ver el paso a paso"
        : "Selecciona una categoría para ver los casos disponibles"
    );
    this.render();
  }

  copyContent() {
    if (!this.selectedItem) return;

    // Siempre texto plano: el formato solo existe en la vista previa
    const textToCopy = `${this.selectedItem.subtitulo}\n\n${this.selectedItem.contenido}`;

    copiarTextoPlano(textToCopy)
      .then(() => this.showCopyFeedback())
      .catch(err => console.error("Error copying to clipboard:", err));
  }

  showCopyFeedback() {
    this.elements.copyBtn.classList.add("copied");
    this.elements.copyBtn.disabled = true;
    this.elements.copyFeedback.textContent = "¡Copiado! ✅";
    setTimeout(() => this.resetCopyButton(), 1500);
  }

  resetCopyButton() {
    this.elements.copyBtn.classList.remove("copied");
    this.elements.copyBtn.disabled = false;
    this.elements.copyFeedback.textContent = "Copiar";
  }

  showError(message) {
    this.elements.itemsList.innerHTML = `<div class="help-empty-list">${escapeHtml(message)}</div>`;
  }
}

// ============= RESPONSE MODAL (Respuestas y Plantillas) =============

function getModalCards(tabId) {
  return Array.from(document.querySelectorAll(`#${tabId} .response-card`))
    .filter(c => c.style.display !== 'none');
}

function copyCardText(card, feedbackBtn) {
  const textarea = modalCardMap.get(card);
  const base = textarea?.value || '';
  const text = (saludoCard && card === saludoCard) ? buildSaludoText(base) : base;

  const btn = feedbackBtn || card.querySelector('.card-copy-btn');
  const showFeedback = () => {
    if (!btn || btn.disabled) return;
    const original = btn.innerHTML;
    btn.innerHTML = '¡Copiado! ✅';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 1500);
  };

  if (!text) return;

  // Uso para las sugerencias. Si se copió desde una sugerencia, la fila se
  // redibuja cuando termina el "¡Copiado!" para no destruir el botón con feedback.
  registrarUso(card.dataset.id);
  if (btn && btn.classList.contains('sugerida-chip')) setTimeout(refrescarSugeridas, 1600);
  else refrescarSugeridas();

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(showFeedback).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      showFeedback();
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    showFeedback();
  }
}

function setModalContent(content) {
  const el = document.getElementById('modal-content');
  if (!el) return;
  if (content) {
    el.textContent = content;
    el.removeAttribute('data-empty');
  } else {
    el.textContent = '';
    el.setAttribute('data-empty', 'true');
  }
}

function renderCardPreviews() {
  document.querySelectorAll('.response-card').forEach(card => {
    const textarea = modalCardMap.get(card) || card.querySelector('.card-data');
    const preview = card.querySelector('.card-preview');
    if (!textarea || !preview) return;
    const value = (saludoCard && card === saludoCard) ? buildSaludoText(textarea.value) : textarea.value;
    const lines = value.split('\n').filter(l => l.trim());
    preview.textContent = lines.slice(0, 2).join(' ');
  });

  // Actualizar contenido del modal si está abierto (cambio de nombre de agente)
  if (modalCurrentIndex >= 0 && modalVisibleCards[modalCurrentIndex]) {
    const card = modalVisibleCards[modalCurrentIndex];
    const textarea = modalCardMap.get(card);
    if (textarea) {
      const isSaludo = saludoCard && card === saludoCard;
      setModalContent(isSaludo ? buildSaludoText(textarea.value) : textarea.value);
    }
  }
}

// ============= SUGERENCIAS SEGÚN EL USO =============
// Registra, en este navegador, qué tarjetas se copian y cuál se copia después de
// cuál, y muestra en Respuestas una fila "Sugeridas". No hay backend: los datos
// son de cada agente en cada navegador. Persistencia: `lizto_usage` (ver CLAUDE.md).
//
// Formato: { v:1, total, cards:{ id:[peso,t] }, trans:{ "a>b":[peso,t] }, last:[id,t]|null }
// `peso` decae a la mitad cada USO_VIDA_MEDIA_MS (se actualiza al volver a usarse).

function cargarUso() {
  const vacio = { v: 1, total: 0, cards: {}, trans: {}, last: null };
  try {
    const raw = JSON.parse(localStorage.getItem(USO_KEY) || 'null');
    if (!raw || raw.v !== 1 || typeof raw.cards !== 'object' || typeof raw.trans !== 'object') return vacio;
    return { v: 1, total: Number(raw.total) || 0, cards: raw.cards, trans: raw.trans,
             last: Array.isArray(raw.last) ? raw.last : null };
  } catch {
    return vacio;
  }
}

function guardarUso(uso) {
  try { localStorage.setItem(USO_KEY, JSON.stringify(uso)); } catch {}
}

/** Peso de una entrada [peso, t] llevado a `ahora` (decaimiento exponencial). */
function pesoUso(entrada, ahora) {
  if (!Array.isArray(entrada)) return 0;
  const edad = Math.max(0, ahora - (Number(entrada[1]) || 0));
  return (Number(entrada[0]) || 0) * Math.pow(0.5, edad / USO_VIDA_MEDIA_MS);
}

/** Suma 1 a la entrada (tras decaerla) y la deja fechada en `ahora`. */
function sumarUso(mapa, clave, ahora) {
  mapa[clave] = [Math.round((pesoUso(mapa[clave], ahora) + 1) * 1000) / 1000, ahora];
}

/** Olvida lo muy viejo y limita el tamaño conservando lo de más peso. */
function podarUso(uso, ahora) {
  const podar = (mapa, maximo) => {
    const pesos = Object.keys(mapa).map(k => [k, pesoUso(mapa[k], ahora)]).filter(([, p]) => p >= USO_PESO_MINIMO);
    pesos.sort((a, b) => b[1] - a[1]);
    const nuevo = {};
    pesos.slice(0, maximo).forEach(([k]) => { nuevo[k] = mapa[k]; });
    return nuevo;
  };
  uso.cards = podar(uso.cards, USO_MAX_TARJETAS);
  uso.trans = podar(uso.trans, USO_MAX_TRANSICIONES);
}

/** Llamar cada vez que se copia una tarjeta (id = data-id de la tarjeta). */
function registrarUso(id, ahora = Date.now()) {
  if (!id) return;
  const uso = cargarUso();

  sumarUso(uso.cards, id, ahora);
  uso.total += 1;

  const [idAnterior, tAnterior] = uso.last || [];
  if (idAnterior && idAnterior !== id && ahora - tAnterior <= USO_VENTANA_ENCADENADO_MS) {
    sumarUso(uso.trans, `${idAnterior}>${id}`, ahora);
  }
  uso.last = [id, ahora];

  podarUso(uso, ahora);
  guardarUso(uso);
}

/**
 * Hasta SUGERIDAS_MAX ids: primero los que suelen copiarse después de la última
 * tarjeta copiada (si fue hace <= 10 min), luego los más usados. Excluye la que
 * se acaba de copiar y las fijadas (ya están arriba). `validos` = ids visibles.
 */
function calcularSugeridas(validos, ahora = Date.now()) {
  const uso = cargarUso();
  if (uso.total < USO_MIN_COPIAS) return [];

  const fijadas = new Set(loadPinned());
  const [ultimo, tUltimo] = uso.last || [];
  const reciente = ultimo && ahora - tUltimo <= USO_VENTANA_ENCADENADO_MS;
  const sirve = id => validos.includes(id) && !fijadas.has(id) && id !== ultimo;

  const elegidas = [];
  if (reciente) {
    Object.keys(uso.trans)
      .filter(k => k.startsWith(`${ultimo}>`))
      .map(k => [k.slice(ultimo.length + 1), pesoUso(uso.trans[k], ahora)])
      .filter(([id, peso]) => peso >= USO_MIN_TRANSICION && sirve(id))
      .sort((a, b) => b[1] - a[1])
      .forEach(([id]) => elegidas.push({ id, motivo: 'despues', desde: ultimo }));
  }

  Object.keys(uso.cards)
    .map(id => [id, pesoUso(uso.cards[id], ahora)])
    .filter(([id]) => sirve(id) && !elegidas.some(e => e.id === id))
    .sort((a, b) => b[1] - a[1])
    .forEach(([id]) => elegidas.push({ id, motivo: 'frecuente' }));

  return elegidas.slice(0, SUGERIDAS_MAX);
}

function refrescarSugeridas() {
  const fila = document.getElementById('sugeridas-respuestas');
  if (!fila) return;
  const lista = fila.querySelector('.sugeridas-lista');

  const gs = document.getElementById('globalSearch');
  const filtrando = (gs && gs.value.trim()) || categoriaActiva.respuestas;
  const cards = Array.from(document.querySelectorAll('#respuestas .text-fields > .response-card'));
  const porId = new Map(cards.map(card => [card.dataset.id, card]));

  const sugeridas = filtrando ? [] : calcularSugeridas(Array.from(porId.keys()));
  if (!sugeridas.length) {
    fila.hidden = true;
    lista.replaceChildren();
    return;
  }

  lista.replaceChildren(...sugeridas.map(({ id, motivo, desde }) => {
    const card = porId.get(id);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'sugerida-chip';
    chip.textContent = card.querySelector('h3')?.textContent || id;
    chip.title = motivo === 'despues'
      ? `Suele copiarse después de «${porId.get(desde)?.querySelector('h3')?.textContent || 'la anterior'}»`
      : 'De las que más usas';
    chip.addEventListener('click', () => copyCardText(card, chip));
    return chip;
  }));
  fila.hidden = false;
}

function borrarHistorialUso() {
  if (!window.confirm('¿Borrar el historial de uso que alimenta las sugerencias? Se empieza de cero.')) return;
  try { localStorage.removeItem(USO_KEY); } catch {}
  refrescarSugeridas();
}

// ============= TARJETAS FIJADAS (pin) =============
// Los agentes fijan las tarjetas que más usan y estas suben al inicio de su tab.
// Persistencia: `lizto_pinned_cards` (ids de textarea). Ver CLAUDE.md.

const PINNED_KEY = 'lizto_pinned_cards';
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"></path></svg>`;

function loadPinned() {
  try {
    const raw = JSON.parse(localStorage.getItem(PINNED_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function savePinned(ids) {
  try { localStorage.setItem(PINNED_KEY, JSON.stringify(ids)); } catch {}
}

// Ordena las tarjetas de un contenedor: fijadas primero (en el orden en que se
// fijaron) y el resto en su orden original (--i). Mueve los nodos del DOM para
// que el modal navegue en el mismo orden que se ve.
function reorderCards(container) {
  if (!container) return;
  const pinned = loadPinned();
  const cards = Array.from(container.querySelectorAll(':scope > .response-card'));
  if (!cards.length) return;

  const rank = card => {
    const id = cardTextareaId(card);
    const p = pinned.indexOf(id);
    return p === -1 ? 1000 + Number(card.dataset.order || 0) : p;
  };
  cards.sort((a, b) => rank(a) - rank(b));

  const anchor = Array.from(container.children).find(el => !el.classList.contains('response-card')) || null;
  cards.forEach(card => {
    card.classList.toggle('pinned', pinned.includes(cardTextareaId(card)));
    const btn = card.querySelector('.card-pin-btn');
    if (btn) {
      const isPinned = card.classList.contains('pinned');
      btn.setAttribute('aria-pressed', String(isPinned));
      btn.title = isPinned ? 'Quitar de fijadas' : 'Fijar al inicio';
      btn.setAttribute('aria-label', btn.title);
    }
    container.insertBefore(card, anchor);
  });
}

function cardTextareaId(card) {
  return card.dataset.id || '';
}

function togglePin(card) {
  const id = cardTextareaId(card);
  if (!id) return;
  const pinned = loadPinned();
  const i = pinned.indexOf(id);
  if (i === -1) pinned.push(id); else pinned.splice(i, 1);
  savePinned(pinned);
  reorderCards(card.parentElement);
  // El orden visible cambió: refrescar la lista de navegación del modal
  updateModalAfterSearch();
  refrescarSugeridas();   // una tarjeta recién fijada deja de sugerirse
}

let modalLastFocus = null;

function openResponseModal(card) {
  const tabContent = card.closest('.tab-content');
  if (!tabContent) return;
  modalCurrentTabId = tabContent.id;
  modalVisibleCards = getModalCards(modalCurrentTabId);
  modalCurrentIndex = modalVisibleCards.indexOf(card);
  modalLastFocus = document.activeElement;

  document.querySelectorAll('.response-card.active').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  populateModal();

  const modal = document.getElementById('response-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.getElementById('modal-copy-btn')?.focus({ preventScroll: true });
}

function closeResponseModal() {
  const modal = document.getElementById('response-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.querySelectorAll('.response-card.active').forEach(c => c.classList.remove('active'));
  modalCurrentIndex = -1;
  modalCurrentTabId = null;
  modalVisibleCards = [];
  if (modalLastFocus && document.contains(modalLastFocus)) {
    modalLastFocus.focus({ preventScroll: true });
  }
  modalLastFocus = null;
}

function populateModal() {
  if (modalCurrentIndex < 0 || !modalVisibleCards.length) return;
  const card = modalVisibleCards[modalCurrentIndex];
  const isSaludo = saludoCard && card === saludoCard;
  const title = card.querySelector('h3')?.textContent.trim() || '';
  const textarea = modalCardMap.get(card);
  const base = textarea?.value || '';
  const content = isSaludo ? buildSaludoText(base) : base;

  document.getElementById('modal-title').textContent = title;
  setModalContent(content);
  updateModalNavState();

  const variantsEl = document.getElementById('modal-variants');
  if (variantsEl) variantsEl.style.display = isSaludo ? 'flex' : 'none';

  const copyBtn = document.getElementById('modal-copy-btn');
  if (copyBtn) {
    copyBtn.innerHTML = `${CLIPBOARD_ICON_SVG} Copiar mensaje`;
    copyBtn.disabled = false;
  }

  document.querySelectorAll('.response-card.active').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function navigateModal(dir) {
  const newIdx = modalCurrentIndex + dir;
  if (newIdx < 0 || newIdx >= modalVisibleCards.length) return;
  modalCurrentIndex = newIdx;
  populateModal();
}

function updateModalNavState() {
  const total = modalVisibleCards.length;
  const counter = document.getElementById('modal-counter');
  const prev = document.getElementById('modal-prev');
  const next = document.getElementById('modal-next');
  if (counter) counter.textContent = total > 0 ? `${modalCurrentIndex + 1} / ${total}` : '';
  if (prev) prev.disabled = modalCurrentIndex <= 0;
  if (next) next.disabled = modalCurrentIndex >= total - 1;
}

function updateModalAfterSearch() {
  if (!modalCurrentTabId) return;
  const newVisible = getModalCards(modalCurrentTabId);
  modalVisibleCards = newVisible;
  if (newVisible.length === 0) {
    closeResponseModal();
  } else if (modalCurrentIndex >= newVisible.length) {
    modalCurrentIndex = newVisible.length - 1;
    populateModal();
  } else {
    updateModalNavState();
  }
}

// Inicializar Help Center cuando el contenido esté listo
document.addEventListener("DOMContentLoaded", () => {
  helpCenterInstance = new HelpCenter();
  diagnosticoInstance = new DiagnosticoCenter();

  const globalSearch = document.getElementById("globalSearch");

  globalSearch.addEventListener("input", function() {
    globalSearchFilter(this.value);
  });

  // Atajos de teclado
  document.addEventListener("keydown", function(e) {
    const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);

    // Ctrl+F → enfocar buscador
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      globalSearch.focus();
      globalSearch.select();
      return;
    }

    // "/" → enfocar buscador (solo si no hay otro campo activo)
    if (e.key === "/" && !inField && modalCurrentIndex < 0) {
      e.preventDefault();
      globalSearch.focus();
      globalSearch.select();
      return;
    }

    // Modal abierto: ← → navegan entre mensajes y Tab no se escapa del diálogo
    if (modalCurrentIndex >= 0) {
      if (e.key === "ArrowLeft" && !inField) { e.preventDefault(); navigateModal(-1); return; }
      if (e.key === "ArrowRight" && !inField) { e.preventDefault(); navigateModal(1); return; }
      if (e.key === "Tab") {
        const focusables = Array.from(document.querySelectorAll(
          "#response-modal button:not(:disabled)"
        )).filter(el => el.offsetParent !== null);
        if (focusables.length) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    // Escape → cerrar modal, o limpiar buscador si está enfocado
    if (e.key === "Escape") {
      if (modalCurrentIndex >= 0) { closeResponseModal(); return; }
      if (document.activeElement === globalSearch) {
        if (globalSearch.value) { globalSearch.value = ""; globalSearchFilter(""); }
        else { globalSearch.blur(); }
      }
    }
  });

  // Tarjetas: primero el respaldo (pinta al instante) y luego Google Sheets
  Object.entries(TABS_TARJETAS).forEach(([tab, cfg]) => {
    tarjetasData[tab] = normalizarFilas(cfg.defecto());
    renderTarjetas(tab);
  });
  renderAtajos();
  cargarTarjetasDesdeSheets();

  // Inicializar saludo card + chips de variantes
  const variantsEl = document.getElementById('modal-variants');
  if (variantsEl) {
    SALUDO_VARIANTES.forEach(({ label, value }) => {
      const chip = document.createElement('button');
      chip.className = 'saludo-chip' + (value === saludoVariante ? ' saludo-chip--active' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => {
        saludoVariante = value;
        variantsEl.querySelectorAll('.saludo-chip').forEach(c => {
          c.classList.toggle('saludo-chip--active', c.textContent === label);
        });
        const ta = modalCardMap.get(saludoCard);
        setModalContent(buildSaludoText(ta?.value || ''));
        renderCardPreviews();
      });
      variantsEl.appendChild(chip);
    });
  }

  // Sugerencias: borrar historial de uso
  document.getElementById('sugeridas-borrar')?.addEventListener('click', borrarHistorialUso);

  // Listeners del toggle de densidad
  document.getElementById('densityNormal')?.addEventListener('click', () => applyDensity('normal'));
  document.getElementById('densityCompact')?.addEventListener('click', () => applyDensity('compact'));

  // Listeners del modal
  document.getElementById('modal-close').addEventListener('click', closeResponseModal);
  document.getElementById('modal-overlay').addEventListener('click', closeResponseModal);
  document.getElementById('modal-prev').addEventListener('click', () => navigateModal(-1));
  document.getElementById('modal-next').addEventListener('click', () => navigateModal(1));
  document.getElementById('modal-copy-btn').addEventListener('click', function() {
    if (modalCurrentIndex < 0 || !modalVisibleCards.length) return;
    const card = modalVisibleCards[modalCurrentIndex];
    const textarea = modalCardMap.get(card);
    if (!textarea || !textarea.value) return;
    const isSaludo = saludoCard && card === saludoCard;
    const text = isSaludo ? buildSaludoText(textarea.value) : textarea.value;
    registrarUso(card.dataset.id);
    refrescarSugeridas();
    const btn = this;
    const copied = () => {
      btn.innerHTML = '¡Copiado! ✅';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = `${CLIPBOARD_ICON_SVG} Copiar mensaje`;
        btn.disabled = false;
      }, 1500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(copied).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); copied(); } catch {}
        document.body.removeChild(ta);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand('copy'); copied(); } catch {}
      document.body.removeChild(ta);
    }
  });

  // Registrar service worker para PWA.
  // updateViaCache: "none" evita que el propio sw.js se sirva desde la caché
  // HTTP del navegador, así los despliegues nuevos se detectan de inmediato.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((reg) => reg.update())
      .catch(() => {});
  }
});