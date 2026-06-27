# CLAUDE.md — Respuestas Rápidas Lizto Software

## Contexto del proyecto

Herramienta interna de soporte para agentes del CRM de Lizto Software
(SaaS multi-tenant para salones de belleza). Permite copiar respuestas
rápidas, plantillas y guías paso a paso para agilizar la atención al cliente.

Desplegado en GitHub Pages: https://david190520.github.io/respuestas-rapidas-lizto/
Sin backend propio. Solo HTML + CSS + JS vanilla.

## Stack

- HTML / CSS / JavaScript vanilla (sin frameworks)
- Google Apps Script como API REST (solo lectura, tab Paso a paso)
- GitHub Pages como hosting

## Arquitectura

- `index.html`: estructura y markup
- `index.js`: toda la lógica (mensajes, eventos, fetch a Apps Script)
- `styles.css`: estilos globales con soporte dark/light mode

## Fuentes de datos

- **Respuestas y Plantillas**: textos hardcodeados en `index.js` como
  strings asignados a elementos por ID (función `updateMessages()`)
- **Paso a paso**: cargado dinámicamente desde Google Apps Script
  conectado a Google Sheets (doGet retorna JSON con columnas título/contenido)

## Funcionalidades actuales

- Campo "Nombre del agente" → inyecta el nombre en los textos dinámicamente
- Campo "Nombre del cliente" → opcional, inyecta saludo personalizado
- 3 tabs: Respuestas / Plantillas / Paso a paso
- Botón copiar en cada tarjeta/textarea
- Buscador en tab Paso a paso (filtra por título)
- Toggle dark/light mode ("Activar Brillo")

## Mejoras pendientes (en orden de prioridad)

1. Persistir nombre del agente con localStorage
2. Confirmación visual en botón copiar (cambiar ícono a ✅ por 1.5s)
3. Buscador global que filtre las 3 tabs simultáneamente
4. Atajos de teclado: "/" o Ctrl+F para enfocar buscador, Esc para limpiar
5. Formatear contenido de Paso a paso: detectar líneas numeradas → <ol>,
   "Importante:" → bloque destacado visual (el texto COPIADO debe seguir
   siendo plano, solo la vista previa usa HTML)
6. Reemplazar botón "Activar Brillo" por ícono sol/luna estándar
7. Hacer la página completamente responsive (actualmente falla en móvil/tablet)
8. PWA: agregar manifest.json + service worker básico para instalar como app
9. Agregar propiedad `categoria` a objetos de Respuestas y Plantillas en JS,
   generar chips de filtro dinámicamente desde las categorías únicas

## Convenciones de código

- JS vanilla, sin jQuery ni frameworks
- IDs de elementos usan camelCase (ej: `falloSistema`, `agentInput`)
- Cada textarea de respuesta tiene un botón copiar con clase `.copy-btn`
- Los textos con nombre del agente usan la variable `agentInput`
- Los textos con nombre del cliente usan `addUserText()` helper

## Restricciones importantes

- NO usar frameworks (React, Vue, etc.)
- NO romper la integración con Google Apps Script existente
- El texto copiado al portapapeles SIEMPRE debe ser texto plano (no HTML)
- Mantener compatibilidad con GitHub Pages (archivos estáticos únicos)
- Los mensajes de Paso a paso se envían directamente a clientes
  en el CRM, por eso deben copiarse como texto sin formato

## Cómo probar localmente

Abrir index.html directamente en el navegador o usar Live Server en VS Code.
No requiere servidor local para funcionar (fetch a Apps Script funciona
desde file:// solo si CORS está configurado, preferible Live Server).
