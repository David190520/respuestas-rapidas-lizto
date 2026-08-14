// ============= ESTADO GLOBAL — debe declararse antes de cualquier llamada =============

let drawerCurrentIndex = -1;
let drawerVisibleCards = [];
let drawerCurrentTabId = null;
const drawerCardMap = new Map();

let saludoCard = null;
let saludoVariante = '';
const SALUDO_VARIANTES = [
  { label: 'Sin variante',           value: '' },
  { label: '¿Cómo puedo ayudarte?',  value: 'Cuéntame por favor, ¿Cómo puedo ayudarte?' },
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

function addUserText(message) {
  const userInput = document.getElementById("userInput").value.trim();
  const agentInput = document.getElementById("agentInput").value.trim() || "un agente";

  const baseMessage = message.replace("nombreAgente", agentInput);

  if (!userInput) {
    return baseMessage;
  }

  return `Hola ${userInput} 👋\n${baseMessage}`;
}

function updateMessages() {
  const agentInput = document.getElementById("agentInput").value.trim() || "un agente";
  const userInput = document.getElementById("userInput").value.trim();
  const hola = userInput ? `Hola ${userInput},` : 'Hola,';

  document.getElementById("daysMessage").value =
    `${hola} muy buen día, ¿cómo estás? Hablas con ${agentInput}, del equipo soporte Lizto ☑︎.`;
  document.getElementById("falloSistema").value =
    `${hola} muy buen día, ¿cómo estás? Hablas con ${agentInput}, del equipo soporte Lizto ☑︎. ¿Tienes disponibilidad en este momento para que nos conectemos y revisarlo contigo? Así podemos ayudarte de forma más rápida. En caso de que no sea posible, puedes compartirnos por favor imágenes o un video del inconveniente para poder validarlo en detalle. Quedamos atentos.`;
  document.getElementById("modulosCapacitaciones").value = 
    addUserText("Buen día, ¿Cómo estás? Hablas con nombreAgente del equipo de soporte de Lizto ☑. Cuéntanos por favor qué módulo o proceso deseas revisar y te apoyamos por este medio paso a paso para resolver tus dudas.\n\nTambién contamos con espacios grupales donde explicamos módulos específicos y resolvemos preguntas en vivo:\n\nCapacitaciones por módulos:\nMartes – 9:00 a.m.\n\nEspacios de resolución de dudas generales:\nMartes – 5:00 p.m.\nJueves – 9:00 a.m. y 5:00 p.m.\n\nLink 9 am: https://us06web.zoom.us/j/83345602567\nLink 5 pm: https://us06web.zoom.us/j/83272928783?pwd=5oyn4FfSuZ7F5gPDakoUUqVqhTmKbT.1\n\nSi después de ayudarte con tu caso por este medio sientes que es necesario un acompañamiento más personalizado, con gusto podemos agendar una reunión.");
  document.getElementById("validarPagoMessage").value = 
    addUserText("¡Mil gracias por el pago! Puedes seguir haciendo uso del sistema con normalidad 😁");
  document.getElementById("pagoGraciasMessage").value = 
    addUserText("Me puedes indicar por favor el número de NIT del negocio para validar con el área contable 😊");
  document.getElementById("solicitarLinkMessage").value = 
    addUserText("Buen día, ¿cómo estás? hablas con nombreAgente del equipo de soporte de Lizto ☑︎. Lo sentimos, el sistema suspendió el servicio por falta de pago. Por favor, envíanos el comprobante de pago y el NIT para reactivarlo");
  updatePasoaPasoMessage();
  document.getElementById("demorasDIAN").value =
    addUserText("¿Cómo estás? hablas con nombreAgente del equipo de soporte de Lizto ☑︎. Actualmente la DIAN se encuentra presentando demoras en la generación de las facturas electrónicas, no te preocupes, puedes verificar más tarde si las facturas ya se encuentran generadas 😀");
  document.getElementById("casoEscalado").value =
    "Te confirmo que ya hemos escalado tu caso a nuestro equipo especializado para que puedan ayudarnos lo más pronto posible. En cuanto tengamos una respuesta concreta, nos comunicaremos contigo para informarte sobre ello. Agradecemos tu paciencia y comprensión mientras trabajamos en la solución de tu caso 😊";
    document.getElementById("algoMas").value =
    "Con mucho gusto, ¿la solución brindada fue de ayuda para ti? 😁";
  document.getElementById("despedidaMessage").value =
    "Ha sido un placer ayudarte. Si necesitas más ayuda no dudes en contactarnos. ¡Te deseo un excelente día! 😉";
  document.getElementById("cierreSinRespuesta").value =
    "¡Hola! 🖐️ No queremos ser molestos, solo queríamos confirmar si pudiste resolver tu duda o si aún necesitas ayuda con la plataforma. Si estás ocupado(a), no te preocupes, cuando tengas un espacio nos escribes y reanudamos la atención.";
  document.getElementById("facturacionElectronica").value =
    "Para integrar la facturación electrónica en la cuenta es necesario que nos envíes un correo con la solicitud, en este deben adjuntar 3 archivos: \n1. RUT actualizado para verificar la información en la cuenta. \n2. Set de pruebas. Este lo recibes cuando te habilitas para facturar electrónicamente desde la DIAN \n\nCómo habilitarse\nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/habilitaci%C3%B3n-de-facturaci%C3%B3n-electr%C3%B3nica-5-7-2024 \n\nConfigurar modos de operación con SOLUCIONES ALEGRA SAS \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-1-5-22-4-2025 \n\nSet de pruebas \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-3-53 \n\n 3. Archivo de la resolución para facturación electrónica que también solicitan desde el portal de la DIAN \n\nSolicitar resolución \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-5-5 \n\nAsociar prefijos con SOLUCIONES ALEGRA SAS o Alegra \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-4-5 \n\nSi tienes alguna duda con el proceso, te compartimos un paso a paso de cómo realizar el proceso: \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-clase-grupal-24-02-2026"
  document.getElementById("nominaElectronica").value =
    "La nómina electrónica es uno de los documentos digitales que puedes gestionar a través de Lizto. Este proceso está regulado por la DIAN y permite emitir o respaldar electrónicamente los pagos de salario a tus empleados. Para utilizar la nómina electrónica en Lizto, es necesario contratar un plan de facturación electrónica que incluya el módulo de Nómina Electrónica, actualmente este tiene un valor de $30,900 COP mensuales."
  document.getElementById("apiWhatsapp").value =
    "Si deseas integrar el API de WhatsApp con Lizto, es importante que tengas en cuenta que este proceso se realiza directamente con Meta (Facebook), y requiere cumplir ciertos requisitos para garantizar la autenticidad y seguridad del negocio.\nAquí te comparto los puntos más importantes:\n\n1. Fanpage activa: Debes contar con una página de Facebook para tu negocio, que tenga actividad e interacciones reales (por ejemplo: publicaciones, comentarios, likes, reseñas).\n\n 2. Dominio web propio: Se recomienda tener un sitio web con un dominio que represente el nombre de tu negocio (por ejemplo: www.tusalon.com), ya que esto facilita la verificación del negocio ante Meta.\n\n 3. Documentos legales: Meta pedirá validar los datos legales del negocio, por lo que debes contar con documentos como el RUT, Cámara de Comercio o equivalente, donde el nombre coincida con el registrado en tu cuenta empresarial de Facebook.\n\n 4. Número exclusivo para el API: El número de WhatsApp que vas a usar en la integración no debe estar vinculado a ninguna cuenta de WhatsApp (ni personal ni Business). Este número se asociará únicamente al canal de mensajería empresarial y no podrá usarse de forma tradicional una vez quede vinculado.\n\n 5. Capacidad de recibir llamadas o SMS: El número debe poder recibir llamadas o mensajes de texto para completar la verificación con código.\n\nSi cumples con estos puntos, podemos ayudarte a iniciar el proceso junto con nuestro equipo de soporte. Una vez aprobado, podrás enviar notificaciones a tus clientes por WhatsApp de forma automática desde Lizto."
  document.getElementById("whatsappLITE").value =
    "Este comportamiento es normal. Debido a una actualización de WhatsApp, es necesario volver a escanear el código QR aproximadamente cada 14 días para mantener la conexión activa.\nPor favor, ingresa al módulo de WhatsApp LITE en Lizto y escanea nuevamente el código QR. Una vez realizado, la conexión quedará restablecida.\nQuedamos atentos si necesitas ayuda durante el proceso. 😊"
  document.getElementById("solicitudCorreo").value =
    "Por medio del correo (ayuda@soportelizto.co) debes enviarnos la solicitud correspondiente y adicional adjuntar los siguientes datos:\n\nNombre comercial del negocio: \nNIT: \nNombre del contacto: \nNombre de la sede (En caso de que cuentes con más de una sede, es importante que nos indiques a cuál de ellas corresponde la solicitud)\n\nEn el asunto del correo por favor indica: Solicitud [motivo de la solicitud]\n\nEjemplo: Solicitud modificación de datos."
  document.getElementById("solicitudRecuperarEspecialista").value =
    "Por medio del correo (ayuda@soportelizto.co) debes enviarnos la solicitud correspondiente y adicional adjuntar los siguientes datos: \n\nNombre comercial del negocio: \nNIT: \nNombre del contacto: \nNombre del especialista eliminado: \nCorreo electrónico del especialista: \nNombre de la sede (En caso de que cuentes con más de una sede, es importante que nos indiques a cuál de ellas corresponde la solicitud)\n\nEn el asunto del correo por favor indica: Solicitud recuperar especialista [nombre del negocio]"
  document.getElementById("solicitudCambioRazonSocial").value =
    "Por medio del correo (ayuda@soportelizto.co) debes enviarnos la solicitud correspondiente y adicional adjuntar los siguientes datos: \n\nNIT: \nRazón social actual: \nNueva razón social (nombre, identificación y demás datos necesarios): \nNombre de la sede (En caso de que cuentes con más de una sede, es importante que nos indiques a cuál de ellas corresponde la solicitud) \nArchivo adjunto de la nueva razón social \n\nEn el asunto del correo por favor indica: Solicitud cambio de razón social [nombre del negocio]"
  document.getElementById("solicitudIdSetPruebas").value =
  "Buen día.\n\nCordial saludo.\n\nMe comunico con ustedes ya que actualmente utilizamos **Soluciones Alegra SAS** como proveedor tecnológico para la facturación electrónica y requerimos conocer el **código del Set de Pruebas** asociado a nuestra empresa, debido a que este ya fue aceptado por la DIAN y no es posible visualizarlo nuevamente desde el portal.\n\nA continuación, compartimos los datos de la empresa para facilitar la validación:\n\n* **Razón social:**\n* **NIT:**\n* **Nombre del establecimiento (si aplica):**\n* **Correo electrónico registrado:**\n* **Nombre de la persona de contacto:**\n* **Teléfono de contacto:**\n\nAgradecemos su colaboración compartiéndonos el código del Set de Pruebas o la información necesaria para continuar con el proceso.\n\nQuedamos atentos a su respuesta.\n\nMuchas gracias."
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

// Inicializar selector de fechas (próximos 30 días) - Solo una vez
function initializeFechaSelect() {
  const select = document.getElementById("fechaReunionSelect");
  // Limpiar opciones previas si existen
  if (select.children.length > 1) return;
  
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormato = date.toLocaleDateString('es-CO', options);
    const fechaValue = date.toISOString().split('T')[0];
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

// Toggle de brillo
const toggleButton = document.getElementById("toggleBrillo");
const iconoBrillo = document.getElementById("iconoBrillo");
let brilloActivo = false;

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

// Estado inicial: modo oscuro
toggleButton.classList.add("off");
iconoBrillo.innerHTML = SUN_SVG;
toggleButton.setAttribute("aria-label", "Cambiar a modo claro");

toggleButton.addEventListener("click", () => {
  brilloActivo = !brilloActivo;
  document.body.classList.toggle("light-mode", brilloActivo);

  if (brilloActivo) {
    toggleButton.classList.remove("off");
    iconoBrillo.innerHTML = MOON_SVG;
    toggleButton.setAttribute("aria-label", "Cambiar a modo oscuro");
  } else {
    toggleButton.classList.add("off");
    iconoBrillo.innerHTML = SUN_SVG;
    toggleButton.setAttribute("aria-label", "Cambiar a modo claro");
  }
});

// Manejo de pestañas
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    closeResponseDrawer();
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

document.querySelectorAll('button#copiarBtn').forEach(function(btn) {
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

  // Respuestas
  const respCards = document.querySelectorAll("#respuestas .text-box");
  let respCount = 0;
  respCards.forEach(card => {
    const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
    const text  = (card.querySelector("textarea")?.value || "").toLowerCase();
    const match = !isSearching || title.includes(q) || text.includes(q);
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
  showNoResults("respuestas", isSearching && respCount === 0);

  // Plantillas
  const plantCards = document.querySelectorAll("#plantillas .text-box");
  let plantCount = 0;
  plantCards.forEach(card => {
    const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
    const text  = (card.querySelector("textarea")?.value || "").toLowerCase();
    const match = !isSearching || title.includes(q) || text.includes(q);
    card.style.display = match ? "" : "none";
    if (match) plantCount++;
  });
  showNoResults("plantillas", isSearching && plantCount === 0);

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
  updateTabBadge("badge-respuestas", respCount,   isSearching);
  updateTabBadge("badge-plantillas", plantCount,  isSearching);
  updateTabBadge("badge-pasoPaso",   pasoCount,   isSearching);
  updateTabBadge("badge-diagnostico", diagCount,  isSearching);
  updateTabBadge("badge-atajos",     atajosCount, isSearching);
  updateDrawerAfterSearch();
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

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

function formatearContenidoPasoAPaso(textoPlano) {
  const lines = textoPlano.split('\n');
  const blocks = [];
  let i = 0;

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
    if (/^\d+[.)]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Lista con viñetas: - o •
    if (/^[-•]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Párrafo normal
    const paraLines = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || /^⚠️/.test(t) || /^\d+[.)]\s/.test(t) || /^[-•]\s/.test(t)) break;
      paraLines.push(t);
      i++;
    }
    if (paraLines.length) blocks.push({ type: 'p', lines: paraLines });
  }

  return blocks.map(block => {
    switch (block.type) {
      case 'callout':
        return `<div class="callout-importante">${linkify(block.text)}</div>`;
      case 'ol':
        return `<ol>${block.items.map(it => `<li>${linkify(it)}</li>`).join('')}</ol>`;
      case 'ul':
        return `<ul>${block.items.map(it => `<li>${linkify(it)}</li>`).join('')}</ul>`;
      case 'p':
        return `<p>${linkify(block.lines.join('<br>'))}</p>`;
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
      const response = await fetch(this.apiUrl);
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
    this.elements.itemsList.innerHTML = `<div class="help-empty-list">${message}</div>`;
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
      sidebar: document.querySelector("#diagnostico .help-sidebar")
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
  }

  async loadData() {
    try {
      const response = await fetch(this.apiUrl);
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
    this.elements.articleContent.innerHTML = formatearContenidoPasoAPaso(this.selectedItem.contenido);

    this.resetCopyButton();
    const panel = document.querySelector("#diagnostico .help-content");
    if (panel) panel.scrollTop = 0;
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
    this.elements.itemsList.innerHTML = `<div class="help-empty-list">${message}</div>`;
  }
}

// ============= RESPONSE DRAWER (Respuestas y Plantillas) =============

function getDrawerCards(tabId) {
  return Array.from(document.querySelectorAll(`#${tabId} .response-card`))
    .filter(c => c.style.display !== 'none');
}

function copyCardText(card, feedbackBtn) {
  const textarea = drawerCardMap.get(card);
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

function setDrawerContent(content) {
  const el = document.getElementById('drawer-content');
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
    const textarea = drawerCardMap.get(card) || card.querySelector('.card-data');
    const preview = card.querySelector('.card-preview');
    if (!textarea || !preview) return;
    const value = (saludoCard && card === saludoCard) ? buildSaludoText(textarea.value) : textarea.value;
    const lines = value.split('\n').filter(l => l.trim());
    preview.textContent = lines.slice(0, 2).join(' ');
  });

  // Actualizar contenido del drawer si está abierto (cambio de nombre de agente)
  if (drawerCurrentIndex >= 0 && drawerVisibleCards[drawerCurrentIndex]) {
    const card = drawerVisibleCards[drawerCurrentIndex];
    const textarea = drawerCardMap.get(card);
    if (textarea) {
      const isSaludo = saludoCard && card === saludoCard;
      setDrawerContent(isSaludo ? buildSaludoText(textarea.value) : textarea.value);
    }
  }
}

function initResponseCards(cardIds) {
  cardIds.forEach(id => {
    const textarea = document.getElementById(id);
    if (!textarea) return;
    const card = textarea.closest('.text-box');
    if (!card || card.classList.contains('response-card')) return;

    card.classList.add('response-card');
    textarea.classList.add('card-data');
    textarea.style.display = 'none';
    drawerCardMap.set(card, textarea);

    // Ocultar botón copiar original
    const oldCopyBtn = card.querySelector('button[id="copiarBtn"]');
    if (oldCopyBtn) oldCopyBtn.style.display = 'none';

    // Envolver h3 + botón ojo en .card-header
    const h3 = card.querySelector('h3');
    if (h3 && !card.querySelector('.card-header')) {
      const header = document.createElement('div');
      header.className = 'card-header';
      h3.parentNode.insertBefore(header, h3);
      header.appendChild(h3);

      const viewBtn = document.createElement('button');
      viewBtn.className = 'card-view-btn';
      viewBtn.title = 'Ver mensaje completo';
      viewBtn.setAttribute('aria-label', 'Ver mensaje completo');
      viewBtn.innerHTML = EYE_SVG;
      header.appendChild(viewBtn);

      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openResponseDrawer(card);
      });
    }

    // Agregar preview después del header
    if (!card.querySelector('.card-preview')) {
      const preview = document.createElement('p');
      preview.className = 'card-preview';
      const anchor = card.querySelector('.card-header') || card.querySelector('h3');
      anchor.insertAdjacentElement('afterend', preview);
    }

    // Agregar botón Copiar al fondo
    if (!card.querySelector('.card-copy-btn')) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'card-copy-btn';
      copyBtn.innerHTML = `${CLIPBOARD_ICON_SVG} Copiar`;
      card.appendChild(copyBtn);
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyCardText(card, copyBtn);
      });
    }

    // Clic en la tarjeta (fuera de botones) → copiar
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      copyCardText(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyCardText(card); }
    });
  });

  renderCardPreviews();
}

function openResponseDrawer(card) {
  const tabContent = card.closest('.tab-content');
  if (!tabContent) return;
  drawerCurrentTabId = tabContent.id;
  drawerVisibleCards = getDrawerCards(drawerCurrentTabId);
  drawerCurrentIndex = drawerVisibleCards.indexOf(card);

  document.querySelectorAll('.response-card.active').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  populateDrawer();

  const drawer = document.getElementById('response-drawer');
  drawer.classList.add('open');
  document.getElementById('drawer-overlay').classList.add('visible');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeResponseDrawer() {
  const drawer = document.getElementById('response-drawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) overlay.classList.remove('visible');
  document.querySelectorAll('.response-card.active').forEach(c => c.classList.remove('active'));
  drawerCurrentIndex = -1;
  drawerCurrentTabId = null;
  drawerVisibleCards = [];
}

function populateDrawer() {
  if (drawerCurrentIndex < 0 || !drawerVisibleCards.length) return;
  const card = drawerVisibleCards[drawerCurrentIndex];
  const isSaludo = saludoCard && card === saludoCard;
  const title = card.querySelector('h3')?.textContent.trim() || '';
  const textarea = drawerCardMap.get(card);
  const base = textarea?.value || '';
  const content = isSaludo ? buildSaludoText(base) : base;

  document.getElementById('drawer-title').textContent = title;
  setDrawerContent(content);
  updateDrawerNavState();

  const variantsEl = document.getElementById('drawer-variants');
  if (variantsEl) variantsEl.style.display = isSaludo ? 'flex' : 'none';

  const copyBtn = document.getElementById('drawer-copy-btn');
  if (copyBtn) {
    copyBtn.innerHTML = `${CLIPBOARD_ICON_SVG} Copiar texto`;
    copyBtn.disabled = false;
  }

  document.querySelectorAll('.response-card.active').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function navigateDrawer(dir) {
  const newIdx = drawerCurrentIndex + dir;
  if (newIdx < 0 || newIdx >= drawerVisibleCards.length) return;
  drawerCurrentIndex = newIdx;
  populateDrawer();
}

function updateDrawerNavState() {
  const total = drawerVisibleCards.length;
  const counter = document.getElementById('drawer-counter');
  const prev = document.getElementById('drawer-prev');
  const next = document.getElementById('drawer-next');
  if (counter) counter.textContent = total > 0 ? `${drawerCurrentIndex + 1} / ${total}` : '';
  if (prev) prev.disabled = drawerCurrentIndex <= 0;
  if (next) next.disabled = drawerCurrentIndex >= total - 1;
}

function updateDrawerAfterSearch() {
  if (!drawerCurrentTabId) return;
  const newVisible = getDrawerCards(drawerCurrentTabId);
  drawerVisibleCards = newVisible;
  if (newVisible.length === 0) {
    closeResponseDrawer();
  } else if (drawerCurrentIndex >= newVisible.length) {
    drawerCurrentIndex = newVisible.length - 1;
    populateDrawer();
  } else {
    updateDrawerNavState();
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
    if (e.key === "/" && !inField) {
      e.preventDefault();
      globalSearch.focus();
      globalSearch.select();
      return;
    }

    // Escape → cerrar drawer, o limpiar buscador si está enfocado
    if (e.key === "Escape") {
      if (drawerCurrentIndex >= 0) { closeResponseDrawer(); return; }
      if (document.activeElement === globalSearch) {
        if (globalSearch.value) { globalSearch.value = ""; globalSearchFilter(""); }
        else { globalSearch.blur(); }
      }
    }
  });

  // Inicializar tarjetas compactas
  const RESPUESTAS_CARD_IDS = [
    'daysMessage', 'falloSistema', 'modulosCapacitaciones',
    'validarPagoMessage', 'pagoGraciasMessage', 'solicitarLinkMessage',
    'demorasDIAN', 'casoEscalado', 'algoMas', 'despedidaMessage', 'cierreSinRespuesta'
  ];
  const PLANTILLAS_CARD_IDS = [
    'facturacionElectronica', 'nominaElectronica', 'apiWhatsapp', 'whatsappLITE',
    'solicitudCorreo', 'solicitudRecuperarEspecialista', 'solicitudCambioRazonSocial', 'solicitudIdSetPruebas'
  ];
  initResponseCards(RESPUESTAS_CARD_IDS);
  initResponseCards(PLANTILLAS_CARD_IDS);
  renderAtajos();

  // Inicializar saludo card + chips de variantes
  saludoCard = document.getElementById('daysMessage')?.closest('.text-box') || null;
  const variantsEl = document.getElementById('drawer-variants');
  if (variantsEl && saludoCard) {
    SALUDO_VARIANTES.forEach(({ label, value }) => {
      const chip = document.createElement('button');
      chip.className = 'saludo-chip' + (value === saludoVariante ? ' saludo-chip--active' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => {
        saludoVariante = value;
        variantsEl.querySelectorAll('.saludo-chip').forEach(c => {
          c.classList.toggle('saludo-chip--active', c.textContent === label);
        });
        const ta = drawerCardMap.get(saludoCard);
        setDrawerContent(buildSaludoText(ta?.value || ''));
        renderCardPreviews();
      });
      variantsEl.appendChild(chip);
    });
  }

  // Listeners del toggle de densidad
  document.getElementById('densityNormal')?.addEventListener('click', () => applyDensity('normal'));
  document.getElementById('densityCompact')?.addEventListener('click', () => applyDensity('compact'));

  // Listeners del drawer
  document.getElementById('drawer-close').addEventListener('click', closeResponseDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeResponseDrawer);
  document.getElementById('drawer-prev').addEventListener('click', () => navigateDrawer(-1));
  document.getElementById('drawer-next').addEventListener('click', () => navigateDrawer(1));
  document.getElementById('drawer-copy-btn').addEventListener('click', function() {
    if (drawerCurrentIndex < 0 || !drawerVisibleCards.length) return;
    const card = drawerVisibleCards[drawerCurrentIndex];
    const textarea = drawerCardMap.get(card);
    if (!textarea || !textarea.value) return;
    const isSaludo = saludoCard && card === saludoCard;
    const text = isSaludo ? buildSaludoText(textarea.value) : textarea.value;
    const btn = this;
    const copied = () => {
      btn.innerHTML = '¡Copiado! ✅';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = `${CLIPBOARD_ICON_SVG} Copiar texto`;
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

  // Registrar service worker para PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});