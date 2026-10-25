/* Plumage — service worker : l'appli s'ouvre sans réseau ; les photos du pack terrain restent visibles hors ligne */
const V = "plumage-cba677ec84", PACK = "plumage-pack", SHELL = ["./","index.html","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png","fonts/figtree.woff","fonts/instrument-serif-italic.woff","fonts/instrument-serif.woff","fonts/unbounded.woff","vendor/leaflet/images/layers-2x.png","vendor/leaflet/images/layers.png","vendor/leaflet/images/marker-icon-2x.png","vendor/leaflet/images/marker-icon.png","vendor/leaflet/images/marker-shadow.png","vendor/leaflet/leaflet.css","vendor/leaflet/leaflet.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("plumage-") && k !== V && k !== PACK).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = (p, ms) => new Promise((ok, ko) => { const t = setTimeout(() => ko(new Error("lent")), ms); p.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); ko(e); }); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    /* la page : le réseau d'abord (mises à jour), le cache si pas de réseau ou réseau trop lent */
    if (r.mode === "navigate" || u.pathname.endsWith("/index.html")) {
      const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put("index.html", cp)); } return res; });
      e.respondWith(timeout(net, 4000).catch(() => caches.match("index.html", { ignoreSearch: true }).then(m => m || net)));
      return;
    }
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r)));
    return;
  }
  /* photos iNaturalist : réseau, sinon le pack (taille moyenne à la place de la grande) */
  if (/(^|\.)inaturalist-open-data\.s3\.amazonaws\.com$|(^|\.)static\.inaturalist\.org$/.test(u.hostname) && u.pathname.startsWith("/photos/")) {
    const alt = r.url.replace(/\/(large|original)\.(jpe?g|png|gif)/i, "/medium.$2");
    e.respondWith(fetch(r).catch(() => caches.open(PACK).then(c => c.match(r.url, { ignoreSearch: true }).then(m => m || c.match(alt, { ignoreSearch: true }))).then(m => m || Response.error())));
  }
});
