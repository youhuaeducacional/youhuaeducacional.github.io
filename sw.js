// Service worker do app Youhua: permite instalar o site e usar as aulas sem internet.
// Ao mudar este arquivo, troque a versão abaixo para os celulares baixarem a novidade.
const VERSAO = 'youhua-v2';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './medal-bronze.png', './medal-prata.png', './medal-ouro.png', './medal-diamante.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname === 'script.google.com' || url.hostname.endsWith('googleusercontent.com')) return; // ranking: sempre online

  // Página do site: tenta a internet primeiro (para pegar atualizações) e usa a cópia salva se estiver offline
  if (req.mode === 'navigate' || url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put(req, copia));
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }

  // Desenhos e fontes: usa a cópia salva; se não tiver, baixa e guarda
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      const copia = resp.clone();
      caches.open(VERSAO).then(c => c.put(req, copia));
      return resp;
    })));
  }
});
