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
  const agentInput = document.getElementById("agentInput").value.trim();

  if (!agentInput) {
    return "";
  }

  const baseMessage = message.replace("nombreAgente", agentInput);

  if (!userInput) {
    return baseMessage;
  }

  return `Hola ${userInput} 👋\n${baseMessage}`;
}

function updateMessages() {
  const agentInput = document.getElementById("agentInput").value.trim();

  if (!agentInput) {
    [
      "daysMessage",
      "falloSistema",
      "modulosCapacitaciones",
      "validarPagoMessage",
      "pagoGraciasMessage",
      "solicitarLinkMessage",
      "pasoaPaso",
      "demorasDIAN",
      "casoEscalado",
      "algoMas",
      "despedidaMessage",
      "facturacionElectronica",
      "nominaElectronica",
      "apiWhatsapp",
      "solicitudCorreo",
      "solicitudRecuperarEspecialista",
      "solicitudCambioRazonSocial"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    return;
  }

  document.getElementById("daysMessage").value = 
    "Hola, muy buen día. Hablas con " + agentInput + ", del equipo soporte Lizto ☑︎. Cuéntame por favor, ¿Cómo puedo ayudarte?";
  document.getElementById("falloSistema").value =
    "Hola, muy buen día. Hablas con " + agentInput + ", del equipo soporte Lizto ☑︎. ¿Tienes disponibilidad en este momento para que nos conectemos y revisarlo contigo? Así podemos ayudarte de forma más rápida. En caso de que no sea posible, puedes compartirnos por favor imágenes o un video del inconveniente para poder validarlo en detalle. Quedamos atentos.";
  document.getElementById("modulosCapacitaciones").value = 
    addUserText("Buen día, ¿Cómo estás? Hablas con nombreAgente del equipo de soporte de Lizto ☑. Cuéntanos por favor qué módulo o proceso deseas revisar y te apoyamos por este medio paso a paso para resolver tus dudas.\n\nTambién contamos con espacios grupales donde explicamos módulos específicos y resolvemos preguntas en vivo:\n\nCapacitaciones por módulos:\nMartes – 9:00 a.m.\n\nEspacios de resolución de dudas generales:\nMartes – 5:00 p.m.\nJueves – 9:00 a.m. y 5:00 p.m.\n\nLink 9 am: https://us06web.zoom.us/j/83345602567\nLink 5 pm: https://us06web.zoom.us/j/83272928783?pwd=5oyn4FfSuZ7F5gPDakoUUqVqhTmKbT.1\n\nSi después de ayudarte con tu caso por este medio sientes que es necesario un acompañamiento más personalizado, con gusto podemos agendar una reunión.");
  document.getElementById("validarPagoMessage").value = 
    addUserText("¡Mil gracias por el pago! Puedes seguir haciendo uso del sistema con normalidad 😁");
  document.getElementById("pagoGraciasMessage").value = 
    addUserText("Me puedes indicar por favor el número de NIT del negocio para validar con el área contable 😊");
  document.getElementById("solicitarLinkMessage").value = 
    addUserText("Buen día ¿Cómo estás? hablas con nombreAgente del equipo de soporte de Lizto ☑︎. Lo sentimos, el sistema suspendió el servicio por falta de pago. Por favor, envíanos el comprobante de pago y el NIT para reactivarlo");
  document.getElementById("pasoaPaso").value =
    "En este paso a paso 💡 te mostramos cómo puedes hacerlo, si tienes alguna duda me comentas por favor";
  document.getElementById("demorasDIAN").value =
    addUserText(" ¿Cómo estás? hablas con nombreAgente del equipo de soporte de Lizto ☑︎. Actualmente la DIAN se encuentra presentando demoras en la generación de las facturas electrónicas, no te preocupes, puedes verificar más tarde si las facturas ya se encuentran generadas 😀");
  document.getElementById("casoEscalado").value =
    "Te confirmo que ya hemos escalado tu caso a nuestro equipo especializado para que puedan ayudarnos lo más pronto posible. En cuanto tengamos una respuesta concreta, nos comunicaremos contigo para informarte sobre ello. Agradecemos tu paciencia y comprensión mientras trabajamos en la solución de tu caso 😊";
    document.getElementById("algoMas").value =
    "Con muchísimo gusto, ¿hay algo más en lo que te podamos colaborar? 😁";
  document.getElementById("despedidaMessage").value =
    "Ha sido un placer ayudarte. Si necesitas más ayuda no dudes en contactarnos. ¡Te deseo un excelente día! 😉";
  document.getElementById("facturacionElectronica").value =
    "Para integrar la facturación electrónica en la cuenta es necesario que nos envíes un correo con la solicitud, en este deben adjuntar 3 archivos: \n1. RUT actualizado para verificar la información en la cuenta. \n2. Set de pruebas. Este lo recibes cuando te habilitas para facturar electrónicamente desde la DIAN \n\nCómo habilitarse\nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/habilitaci%C3%B3n-de-facturaci%C3%B3n-electr%C3%B3nica-5-7-2024 \n\nConfigurar modos de operación con SOLUCIONES ALEGRA SAS \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-1-5-22-4-2025 \n\nSet de pruebas \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-3-53 \n\n 3. Archivo de la resolución para facturación electrónica que también solicitan desde el portal de la DIAN \n\nSolicitar resolución \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-5-5 \n\nAsociar prefijos con SOLUCIONES ALEGRA SAS o Alegra \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-paso-4-5 \n\nSi tienes alguna duda con el proceso, te compartimos un paso a paso de cómo realizar el proceso: \nhttps://liztosoftware.zohodesk.com/portal/es/kb/articles/proceso-de-habilitaci%C3%B3n-facturaci%C3%B3n-electr%C3%B3nica-clase-grupal-24-02-2026"
  document.getElementById("nominaElectronica").value =
    "La nómina electrónica es uno de los documentos digitales que puedes gestionar a través de Lizto. Este proceso está regulado por la DIAN y permite emitir o respaldar electrónicamente los pagos de salario a tus empleados. Para utilizar la nómina electrónica en Lizto, es necesario contratar un plan de facturación electrónica que incluya el módulo de Nómina Electrónica, actualmente este tiene un valor de $30,900 COP mensuales."
  document.getElementById("apiWhatsapp").value =
    "Si deseas integrar el API de WhatsApp con Lizto, es importante que tengas en cuenta que este proceso se realiza directamente con Meta (Facebook), y requiere cumplir ciertos requisitos para garantizar la autenticidad y seguridad del negocio.\nAquí te comparto los puntos más importantes:\n\n1. Fanpage activa: Debes contar con una página de Facebook para tu negocio, que tenga actividad e interacciones reales (por ejemplo: publicaciones, comentarios, likes, reseñas).\n\n 2. Dominio web propio: Se recomienda tener un sitio web con un dominio que represente el nombre de tu negocio (por ejemplo: www.tusalon.com), ya que esto facilita la verificación del negocio ante Meta.\n\n 3. Documentos legales: Meta pedirá validar los datos legales del negocio, por lo que debes contar con documentos como el RUT, Cámara de Comercio o equivalente, donde el nombre coincida con el registrado en tu cuenta empresarial de Facebook.\n\n 4. Número exclusivo para el API: El número de WhatsApp que vas a usar en la integración no debe estar vinculado a ninguna cuenta de WhatsApp (ni personal ni Business). Este número se asociará únicamente al canal de mensajería empresarial y no podrá usarse de forma tradicional una vez quede vinculado.\n\n 5. Capacidad de recibir llamadas o SMS: El número debe poder recibir llamadas o mensajes de texto para completar la verificación con código.\n\nSi cumples con estos puntos, podemos ayudarte a iniciar el proceso junto con nuestro equipo de soporte. Una vez aprobado, podrás enviar notificaciones a tus clientes por WhatsApp de forma automática desde Lizto."
  document.getElementById("solicitudCorreo").value =
    "Por medio del correo (ayuda@soportelizto.co) debes enviarnos la solicitud correspondiente y adicional adjuntar los siguientes datos:\n\nNombre comercial del negocio: \nNIT: \nNombre del contacto: \nNombre de la sede (En caso de que cuentes con más de una sede, es importante que nos indiques a cuál de ellas corresponde la solicitud)\n\nEn el asunto del correo por favor indica: Solicitud [motivo de la solicitud]\n\nEjemplo: Solicitud cambio de razón social"
  document.getElementById("solicitudRecuperarEspecialista").value =
    "Por medio del correo (ayuda@soportelizto.co) debes enviarnos la solicitud correspondiente y adicional adjuntar los siguientes datos: \n\nNombre comercial del negocio: \nNIT: \nNombre del contacto: \nNombre del especialista eliminado: \nCorreo electrónico del especialista: \nNombre de la sede (En caso de que cuentes con más de una sede, es importante que nos indiques a cuál de ellas corresponde la solicitud)\n\nEn el asunto del correo por favor indica: Solicitud recuperar especialista [nombre del negocio]"
  document.getElementById("solicitudCambioRazonSocial").value =
    "Por medio del correo (ayuda@soportelizto.co) debes enviarnos la solicitud correspondiente y adicional adjuntar los siguientes datos: \n\nNIT: \nRazón social actual: \nNueva razón social (nombre, identificación y demás datos necesarios): \nNombre de la sede (En caso de que cuentes con más de una sede, es importante que nos indiques a cuál de ellas corresponde la solicitud) \nArchivo adjunto de la nueva razón social \n\nEn el asunto del correo por favor indica: Solicitud cambio de razón social [nombre del negocio]"
  // Actualizar también el mensaje de pago al cambiar el nombre del agente
  updateLinkPagoMessage();
}

// Función para actualizar el mensaje de pago con el enlace
function updateLinkPagoMessage() {
  const agentInput = document.getElementById("agentInput").value.trim();
  if (!agentInput) {
    const linkPagoEl = document.getElementById("linkPago");
    if (linkPagoEl) linkPagoEl.value = "";
    return;
  }

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

// Llamar updateMessages para inicializar todos los mensajes
updateMessages();

// Listeners para los campos de entrada de nombre
document.getElementById("userInput").addEventListener("input", updateMessages);
document.getElementById("agentInput").addEventListener("input", updateMessages);

// Listener para el enlace de pago
document.getElementById("enlacePago").addEventListener("input", updateLinkPagoMessage);

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
const textoBrillo = toggleButton.querySelector(".toggle-text");
let brilloActivo = false;

// Aplicar estado inicial (brillo desactivado)
document.querySelectorAll(".input, textarea").forEach((element) => {
  element.classList.add("no-brillo");
});
toggleButton.classList.add("off");
iconoBrillo.textContent = "🌙";
textoBrillo.textContent = "Activar Brillo";

toggleButton.addEventListener("click", () => {
  brilloActivo = !brilloActivo;

  document.querySelectorAll(".input, textarea").forEach((element) => {
    if (brilloActivo) {
      element.classList.remove("no-brillo");
      toggleButton.classList.remove("off");
      iconoBrillo.textContent = "🌞";
      textoBrillo.textContent = "Desactivar Brillo";
    } else {
      element.classList.add("no-brillo");
      toggleButton.classList.add("off");
      iconoBrillo.textContent = "🌙";
      textoBrillo.textContent = "Activar Brillo";
    }
  });
});

// Manejo de pestañas
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
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
document.querySelectorAll('button#copiarBtn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const textarea = btn.closest('.text-box').querySelector('textarea');
    if (textarea) {
      textarea.select();
      document.execCommand('copy');
    }
  });
});