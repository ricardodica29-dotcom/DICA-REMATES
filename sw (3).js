// DICA REMATES · guarda la app en el celular para que abra rápido con datos móviles
const CACHE = 'dica-remates-v14';
const BASE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
// Archivos que no cambian: Firebase, letras y escudos (se sirven desde el celular)
const FIJOS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'a.espncdn.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // La app: primero busca la versión nueva; si no hay señal, abre la guardada
  if (req.mode === 'navigate' || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Firebase, letras y escudos: del celular si ya están, si no se descargan una vez
  if (FIJOS.includes(url.hostname) && !url.pathname.includes('/apis/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    })));
    return;
  }

  // Íconos y manifest propios
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
  // Todo lo demás (Firestore, datos de ESPN) pasa directo
});
