// ============= PLANTILLAS DE TICKET DE ESCALAMIENTO (Zoho Desk) =============
//
// Zoho Desk > Agregar ticket > "Elegir plantilla de ticket". Todas comparten el
// mismo esqueleto de encabezados; lo que cambia es el bloque "Datos de entrada" y
// si llevan "Ruta de acceso" / "Verificación realizada por agente".
//
// Estructura reconstruida a partir de tickets reales (feb–oct 2026). Los textos de
// los encabezados se copian TAL CUAL de Zoho (incluidas sus erratas, p. ej.
// "Emrpesa") para que lo que se pega coincida con la plantilla. Si cambias una
// plantilla en Zoho, actualiza este archivo.
//
// Este archivo es lógica pura (sin DOM): la interfaz vive en index.js
// (EscalamientoCenter). Ver CLAUDE.md, "Escalamiento de tickets".

const TICKET_TEXTOS = {
  agente: 'Agente',
  cliente: 'Cliente que reporta',
  explicacionCliente: 'Explicación Cliente (Copia y pega de lo que el cliente escribio)',
  ruta: 'Ruta de acceso (URL del navegador de la funcion que presenta el problema, ejemplo: https://app.lizto.co/transactions)',
  explicacionError: 'Explicación (Breve Descripcion de error)',
  explicacionSolicitud: 'Explicación (Breve Descripcion de la solicitud)',
  datos: 'Datos de entrada (Listado de datos para replicar el error, fechas, consecutivos, staff, etc. (*) Datos Obligatorios)',
  datosAviso: 'SI ES CASO LO REQUIERE AGREGAR MAS DATOS DE ENTRADA',
  verificacion: 'Verificación realizada por agente',
  analisis: 'Analisis Equipo Desarrollo (Seccion de uso exclusivo para el equipo de desarrollo para casos de solicitudes de nuevos desarrollos)',
  usoExclusivo: '--- Uso exclusivo del equipo de desarrollo, NO compartir con el cliente ---'
};

// Una línea en blanco entre secciones para que se lea bien al pegar.
const TICKET_SEPARAR_SECCIONES = true;

// ----- Campos de "Datos de entrada" reutilizables (mismo id = mismo dato en todas las plantillas) -----
const TK_TENANT = { id: 'tenant', etiqueta: 'Tenant', obligatorio: true, ayuda: 'Slug del negocio, p. ej. salon_ejemplo' };
const TK_SEDE = { id: 'sede', etiqueta: 'Sede', obligatorio: true, ayuda: 'Sede afectada' };
const TK_CONSECUTIVO = { id: 'consecutivo', etiqueta: 'Consecutivo', ayuda: 'Nº de factura o documento' };
const TK_FECHA = { id: 'fecha', etiqueta: 'Fecha' };
const TK_CAJA = { id: 'caja', etiqueta: 'Caja' };
const TK_TERCERO = { id: 'tercero', etiqueta: 'Cliente / Proveedor / Especialista / Etc' };
const TK_PANTALLAZO_FACTURA = { id: 'pantallazoFactura', etiqueta: 'Pantallazo de la factura', obligatorio: true, ayuda: 'Indica que lo adjuntas al ticket' };
const TK_ERROR = { id: 'errorMostrado', etiqueta: 'Error que se presenta', obligatorio: true, ayuda: 'Mensaje o código exacto' };
const TK_PANTALLAZO_ERROR = { id: 'pantallazoError', etiqueta: 'Pantallazo del error', obligatorio: true, ayuda: 'Indica que lo adjuntas al ticket' };

const PLANTILLAS_TICKET = [
  {
    id: 'genericos',
    corto: 'Genéricos',
    nombre: 'Escalamiento de casos Genericos',
    tipo: 'error', ruta: true, verificacion: true,
    bloque: 'Datos de entrada genericos',
    campos: [TK_TENANT, TK_SEDE, TK_CONSECUTIVO, TK_FECHA, TK_CAJA, TK_TERCERO],
    palabras: []
  },
  {
    id: 'facturacion',
    corto: 'Facturación',
    nombre: 'Escalamiento de Caos Facturacion',   // así se llama en Zoho (con la errata)
    tipo: 'error', ruta: true, verificacion: true,
    bloque: 'Facturación',
    campos: [TK_TENANT, TK_SEDE, { ...TK_CONSECUTIVO, obligatorio: true }, TK_CAJA, TK_PANTALLAZO_FACTURA],
    palabras: ['factur', 'documento soporte', 'dian', 'resolucion', 'set de pruebas', 'nomina']
  },
  {
    id: 'reservas',
    corto: 'Reservas',
    nombre: 'Escalamiento de Casos Reservas',
    tipo: 'error', ruta: true, verificacion: true,
    rutaPorDefecto: 'https://app.lizto.co/calendar',
    bloque: 'Reservas',
    campos: [
      TK_TENANT, TK_SEDE,
      { id: 'clienteReserva', etiqueta: 'Cliente (Nombre, celular, identificación)', obligatorio: true },
      { ...TK_FECHA, obligatorio: true },
      { id: 'hora', etiqueta: 'Hora', obligatorio: true },
      { id: 'pantallazoReserva', etiqueta: 'Pantallazo de la reserva', obligatorio: true, ayuda: 'Indica que lo adjuntas al ticket' },
      { id: 'servicio', etiqueta: 'Servicio' },
      { id: 'staff', etiqueta: 'Staff (Nombre, celular, identificación)' }
    ],
    palabras: ['agenda', 'reserva', 'cita ', 'citas']
  },
  {
    id: 'reportes',
    corto: 'Reportes',
    nombre: 'Escalamiento de Casos Reportes',
    tipo: 'error', ruta: true, verificacion: true,
    bloque: 'Reportes',
    campos: [
      TK_TENANT, TK_SEDE,
      { id: 'rangoFechas', etiqueta: 'Rango de Fechas', obligatorio: true, ayuda: 'Desde – hasta' },
      { id: 'filtros', etiqueta: 'Otros Filtros aplicados', obligatorio: true, ayuda: 'O escribe "ninguno"' },
      TK_PANTALLAZO_FACTURA,   // así aparece en la plantilla de Reportes de Zoho
      { id: 'formato', etiqueta: 'Formato', obligatorio: true, ayuda: 'Pantalla, Excel, PDF…' },
      { id: 'columna', etiqueta: 'Nombre de columna' }
    ],
    palabras: ['informe', 'reporte']
  },
  {
    id: 'habilitacion',
    corto: 'Habilitación Electrónica',
    nombre: 'Escalamiento de casos Habilitacion Electrónica',
    tipo: 'error', ruta: true, verificacion: true,
    bloque: 'Habilitación Electrónica',
    campos: [
      TK_TENANT, TK_SEDE,
      { id: 'modulo', etiqueta: 'Modulo', obligatorio: true, ayuda: 'Facturas, Doc Soporte, Nómina…' },
      TK_ERROR, TK_PANTALLAZO_ERROR
    ],
    palabras: ['habilitaci']
  },
  {
    // PROVISIONAL: ningún ticket de feb–oct 2026 usó esta plantilla, así que sus
    // campos son una propuesta. Confirmar los encabezados con la plantilla de Zoho.
    id: 'importaciones',
    corto: 'Importaciones',
    nombre: 'Escalamiento de Casos Importaciones',
    provisional: true,
    tipo: 'error', ruta: true, verificacion: true,
    bloque: 'Importaciones',
    campos: [
      TK_TENANT, TK_SEDE,
      { id: 'moduloImportacion', etiqueta: 'Modulo a importar', obligatorio: true, ayuda: 'Clientes, productos, servicios…' },
      { id: 'archivoImportacion', etiqueta: 'Archivo de importación', obligatorio: true, ayuda: 'Indica que lo adjuntas al ticket' },
      TK_ERROR, TK_PANTALLAZO_ERROR
    ],
    palabras: ['importa', 'carga masiva']
  },
  {
    id: 'solicitud',
    corto: 'Solicitudes de clientes',
    nombre: 'Escalamiento de Solicitudes de Clientes',
    tipo: 'solicitud', ruta: false, verificacion: false,
    bloque: 'Datos de entrada genericos',
    campos: [TK_TENANT, TK_SEDE, TK_TERCERO],
    palabras: ['solicitud']
  },
  {
    id: 'cuenta',
    corto: 'Cuenta nueva manual',
    nombre: 'Escalamiento de creacion nueva cuenta manual',
    tipo: 'error', ruta: true, verificacion: true,
    bloque: 'Datos de entrada genericos',
    // La plantilla trae el bloque genérico y, debajo, el de creación de cuentas.
    // En una cuenta nueva el tenant aún no existe: se muestran con (*) pero no se exigen.
    campos: [
      { ...TK_TENANT, exigir: false }, { ...TK_SEDE, exigir: false },
      TK_CONSECUTIVO, TK_FECHA, TK_CAJA, TK_TERCERO
    ],
    extra: {
      titulo: 'Creacion de cuentas manuales (Sin link de registro)',
      campos: [
        { id: 'cuentaEmpresa', etiqueta: 'Nombre Empresa (Este se usa para el slug del tenant)', formato: 'encabezado', exigir: true, ayuda: 'Nombre del negocio' },
        { id: 'cuentaPlan', etiqueta: 'Plan (Marca con x)', formato: 'plan', exigir: true,
          opciones: ['Emprendedor', 'Profesional', 'Profesional Pro', 'Premium', 'Max', 'Retail'] },
        { id: 'pais', etiqueta: 'Pais', formato: 'etiqueta', ayuda: 'Colombia, México…' },
        { id: 'propietario', etiqueta: 'Propietario Empresa', formato: 'encabezado' },
        { id: 'identificacionEmpresa', etiqueta: 'Identificación Emrpesa', formato: 'encabezado', ayuda: 'NIT / identificación' },
        { id: 'nombreComercial', etiqueta: 'Nombre Comercial', formato: 'encabezado' },
        { id: 'correoEmpresa', etiqueta: 'Correo Empresa', formato: 'encabezado' },
        { id: 'celularEmpresa', etiqueta: 'Celular Empresa', formato: 'encabezado' },
        { id: 'usuarioNombre', etiqueta: 'Nombre Usuario Lizto', formato: 'encabezado' },
        { id: 'usuarioCorreo', etiqueta: 'Correo Usuario Lizto', formato: 'encabezado', exigir: true },
        { id: 'usuarioCelular', etiqueta: 'Celular Usuario Lizto', formato: 'encabezado' }
      ]
    },
    palabras: ['cuenta nueva', 'nueva cuenta', 'crear cuenta', 'creacion de cuenta']
  }
];

function plantillaTicketPorId(id) {
  return PLANTILLAS_TICKET.find(p => p.id === id) || PLANTILLAS_TICKET[0];
}

function normalizarBusquedaTicket(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Plantilla que mejor se relaciona por nombre con la categoría y el título de un
 * caso de Diagnóstico. Si nada coincide, "Genéricos". El orden de `prioridad`
 * resuelve empates (lo más específico primero).
 */
function sugerirPlantillaTicket(categoria, subtitulo) {
  const texto = normalizarBusquedaTicket(`${categoria} ${subtitulo}`) + ' ';
  const prioridad = ['habilitacion', 'importaciones', 'cuenta', 'reportes', 'reservas', 'facturacion', 'solicitud'];
  for (const id of prioridad) {
    const plantilla = plantillaTicketPorId(id);
    if (plantilla.id === id && plantilla.palabras.some(palabra => texto.includes(palabra))) return id;
  }
  return 'genericos';
}

/** Campos (de datos y del bloque extra) de una plantilla, en el orden en que se imprimen. */
function camposTicket(plantilla) {
  return [...plantilla.campos, ...(plantilla.extra ? plantilla.extra.campos : [])];
}

function valorLineas(valor) {
  const texto = String(valor ?? '').replace(/\r\n/g, '\n').trim();
  return texto ? texto.split('\n').map(t => ({ texto: t, tipo: 'valor' })) : [{ texto: '', tipo: 'valor' }];
}

function lineasCampoTicket(campo, valores) {
  const valor = String(valores.datos?.[campo.id] ?? '').replace(/\s*\n\s*/g, ' ').trim();

  if (campo.formato === 'encabezado') {
    return [{ texto: campo.etiqueta, tipo: 'subencabezado' }, ...valorLineas(valor)];
  }
  if (campo.formato === 'plan') {
    return [
      { texto: campo.etiqueta, tipo: 'subencabezado' },
      ...campo.opciones.map(opcion => ({ texto: `- [${valor === opcion ? 'x' : ''}] ${opcion}`, tipo: 'dato' }))
    ];
  }
  if (campo.formato === 'etiqueta') {   // "Pais: valor" (sin guion, como en la plantilla de cuentas)
    return [{ texto: `${campo.etiqueta}:${valor ? ' ' + valor : ''}`, tipo: 'dato' }];
  }
  const marca = campo.obligatorio ? '(*)' : '';
  return [{ texto: `- ${marca}${campo.etiqueta}:${valor ? ' ' + valor : ''}`, tipo: 'dato' }];
}

/**
 * Arma el ticket completo, con TODOS los encabezados de la plantilla y en su orden.
 * `valores`: { agente, cliente, explicacionCliente, ruta, explicacion, verificacion,
 *              datos: { [idCampo]: texto } }
 * Devuelve líneas { texto, tipo } (tipo: encabezado | subencabezado | valor | dato | fijo | sep)
 * para poder pintar la vista previa; `ticketATexto()` las une en el texto plano a copiar.
 */
function construirTicket(plantilla, valores = {}) {
  const lineas = [];
  const seccion = (encabezado, cuerpo) => {
    if (lineas.length && TICKET_SEPARAR_SECCIONES) lineas.push({ texto: '', tipo: 'sep' });
    lineas.push({ texto: encabezado, tipo: 'encabezado' });
    lineas.push(...cuerpo);
  };

  seccion(TICKET_TEXTOS.agente, valorLineas(valores.agente));
  seccion(TICKET_TEXTOS.cliente, valorLineas(valores.cliente));
  seccion(TICKET_TEXTOS.explicacionCliente, valorLineas(valores.explicacionCliente));
  if (plantilla.ruta) seccion(TICKET_TEXTOS.ruta, valorLineas(valores.ruta));
  seccion(
    plantilla.tipo === 'solicitud' ? TICKET_TEXTOS.explicacionSolicitud : TICKET_TEXTOS.explicacionError,
    valorLineas(valores.explicacion)
  );

  const cuerpoDatos = [
    { texto: TICKET_TEXTOS.datosAviso, tipo: 'fijo' },
    { texto: plantilla.bloque, tipo: 'subencabezado' },
    ...plantilla.campos.flatMap(campo => lineasCampoTicket(campo, valores))
  ];
  if (plantilla.extra) {
    cuerpoDatos.push({ texto: plantilla.extra.titulo, tipo: 'subencabezado' });
    cuerpoDatos.push(...plantilla.extra.campos.flatMap(campo => lineasCampoTicket(campo, valores)));
  }
  seccion(TICKET_TEXTOS.datos, cuerpoDatos);

  if (plantilla.verificacion) seccion(TICKET_TEXTOS.verificacion, valorLineas(valores.verificacion));

  // Sección de uso exclusivo de desarrollo: se deja vacía, tal como en la plantilla
  seccion(TICKET_TEXTOS.analisis, [
    { texto: TICKET_TEXTOS.usoExclusivo, tipo: 'fijo' },
    { texto: '', tipo: 'valor' },
    { texto: TICKET_TEXTOS.usoExclusivo, tipo: 'fijo' }
  ]);

  return lineas;
}

function ticketATexto(lineas) {
  return lineas.map(linea => linea.texto).join('\n');
}

/** Etiquetas de los datos obligatorios que siguen vacíos. */
function faltantesTicket(plantilla, valores = {}) {
  return camposTicket(plantilla)
    .filter(campo => (campo.exigir ?? campo.obligatorio))
    .filter(campo => !String(valores.datos?.[campo.id] ?? '').trim())
    .map(campo => campo.etiqueta.replace(/\s*\(.*\)\s*$/, ''));
}
