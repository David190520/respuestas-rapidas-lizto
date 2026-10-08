// Subir la versión cada vez que cambie STATIC_ASSETS o un archivo estático,
// de lo contrario los usuarios siguen recibiendo la copia cacheada anterior.
const CACHE_NAME = "respuestas-rapidas-v8";

// Caché aparte para las respuestas de Google Sheets: sobrevive a los cambios de
// CACHE_NAME (activate no la borra) y guarda la ÚLTIMA respuesta buena de cada
// pestaña para usarla sin conexión.
const DATA_CACHE = "respuestas-rapidas-datos";

// Debe coincidir exactamente con los archivos estáticos del repo.
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./index.js",
  "./style.css",
  "./manifest.json",
  "./icon.svg",
  "./defaults.js"
];

// El "app shell" (HTML/JS/CSS) va network-first: es lo que cambia en cada
// despliegue y no puede quedar congelado en caché. El resto (iconos,
// manifest) sigue cache-first porque casi nunca cambia.
const APP_SHELL_REGEX = /\.(?:html|js|css)$/i;

function isAppShell(request, url) {
  return (
    request.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    APP_SHELL_REGEX.test(url.pathname)
  );
}

// Pide siempre al servidor revalidando (evita que la caché HTTP del navegador
// devuelva la versión anterior dentro del max-age de GitHub Pages).
function revalidatedRequest(url) {
  return new Request(url.href, { cache: "no-cache" });
}

async function networkFirst(event, url) {
  try {
    const response = await fetch(revalidatedRequest(url));
    if (response && response.ok) {
      const clone = response.clone();
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
      );
    }
    return response;
  } catch (err) {
    // Sin red: caer a la última copia cacheada (modo offline de la PWA).
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (event.request.mode === "navigate") {
      const fallback = await caches.match("./index.html");
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(event, url) {
  const cached = await caches.match(event.request);
  if (cached) return cached;

  const response = await fetch(event.request);
  // Solo cachear respuestas exitosas del mismo origen
  if (response.ok && url.origin === self.location.origin) {
    const clone = response.clone();
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
    );
  }
  return response;
}

async function datosAppsScript(event) {
  const copiaGuardada = () => caches.match(event.request, { cacheName: DATA_CACHE });

  try {
    const response = await fetch(event.request);

    if (response && response.ok) {
      // Apps Script responde 200 incluso con {status:"error"}: solo se guarda
      // (y se da por buena) una respuesta que sea un array de filas.
      const data = await response.clone().json().catch(() => null);
      if (Array.isArray(data)) {
        const paraGuardar = response.clone();
        event.waitUntil(
          caches.open(DATA_CACHE).then((cache) => cache.put(event.request, paraGuardar))
        );
        return response;
      }
    }

    // 404/5xx transitorios de Google o un error en JSON: si hay una copia buena
    // se usa esa; si no, se deja pasar la respuesta para que la app muestre el error.
    return (await copiaGuardada()) || response;
  } catch (err) {
    // Sin red: última copia buena y, si nunca hubo una, [] (la app usa su respaldo)
    const cached = await copiaGuardada();
    if (cached) return cached;
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== DATA_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Peticiones a Google Apps Script: network-first con la última respuesta buena
  // de cada pestaña como respaldo (ver datosAppsScript).
  if (url.hostname.includes("script.google.com")) {
    event.respondWith(datosAppsScript(event));
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    isAppShell(event.request, url) ? networkFirst(event, url) : cacheFirst(event, url)
  );
});
