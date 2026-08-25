// Subir la versión cada vez que cambie STATIC_ASSETS o un archivo estático,
// de lo contrario los usuarios siguen recibiendo la copia cacheada anterior.
const CACHE_NAME = "respuestas-rapidas-v5";

// Debe coincidir exactamente con los archivos estáticos del repo.
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./index.js",
  "./style.css",
  "./manifest.json",
  "./icon.svg",
  "./logo-removebg-preview.png"
];

// El "app shell" (HTML/JS/CSS) va network-first: es lo que cambia en cada
// despliegue y no puede quedar congelado en caché. El resto (iconos, logo,
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Peticiones a Google Apps Script: network-first, sin caché (son dinámicas)
  if (url.hostname.includes("script.google.com")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    isAppShell(event.request, url) ? networkFirst(event, url) : cacheFirst(event, url)
  );
});
