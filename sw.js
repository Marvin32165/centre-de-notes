/* Mode hors ligne. Les pages et les ressources du site sont gardées dans le navigateur à la
   première visite : on peut ensuite réviser sans réseau.
   - ressources avec ?v=<empreinte> : le contenu ne change jamais sous cette adresse -> cache d'abord ;
   - pages : réseau d'abord (toujours la dernière version), cache si le réseau manque ;
   - polices Google : gardées au premier chargement.
   VERSION et FICHIERS sont réécrits par site/outils/construit.js — ne pas éditer à la main. */
const VERSION = 'adff8f8f4c';
const FICHIERS = [
  "assets/app.js?v=fabe4251",
  "assets/atelier.js?v=c35298a6",
  "assets/carnet.js?v=69bcfe1d",
  "assets/cartes.js?v=e3c23ad2",
  "assets/catalogue.js?v=44004775",
  "assets/commandes-ui.js?v=12f19476",
  "assets/commandes.js?v=7087bc5f",
  "assets/dojo.js?v=b46a816e",
  "assets/favicon.svg",
  "assets/glossaire-ui.js?v=178c909e",
  "assets/glossaire.js?v=0b418351",
  "assets/notes.js?v=172c0c32",
  "assets/plan.js?v=5a5966ea",
  "assets/pratique.js?v=6ed4d335",
  "assets/quiz-data.js?v=adc48d78",
  "assets/quiz.js?v=87192477",
  "assets/quiz/azure.js?v=42079444",
  "assets/quiz/ccna-reseau.js?v=de311779",
  "assets/quiz/cisco-securite.js?v=b16892fb",
  "assets/quiz/depannage-reseau.js?v=a452307b",
  "assets/quiz/docker.js?v=4750fdd2",
  "assets/quiz/dpm.js?v=4a76a83c",
  "assets/quiz/entretien-recrutement.js?v=89df4143",
  "assets/quiz/exchange-securite.js?v=699b6390",
  "assets/quiz/homelab.js?v=59ae86fa",
  "assets/quiz/hyperv.js?v=e54518cf",
  "assets/quiz/iis.js?v=4e325514",
  "assets/quiz/itil.js?v=0ef43a99",
  "assets/quiz/linux-debian.js?v=b1dc4a7c",
  "assets/quiz/monitoring-zabbix.js?v=ffe3b1fe",
  "assets/quiz/powershell.js?v=22c13ac0",
  "assets/quiz/proxmox.js?v=962260d9",
  "assets/quiz/rds.js?v=ff83ba72",
  "assets/quiz/redmine.js?v=c036e9ab",
  "assets/quiz/reseau-bases.js?v=e47c151b",
  "assets/quiz/scrum.js?v=6b4d3250",
  "assets/quiz/securite.js?v=76137511",
  "assets/quiz/sharepoint.js?v=71b346df",
  "assets/quiz/sql-server.js?v=58fa7d06",
  "assets/quiz/storage-clustering.js?v=c6ebdd85",
  "assets/quiz/subnetting.js?v=813bc728",
  "assets/quiz/voip.js?v=7a05186a",
  "assets/quiz/windows-server.js?v=f7ac0523",
  "assets/quiz/zabbix-windows.js?v=50232a45",
  "assets/revision.js?v=843cfd26",
  "assets/search-index.js?v=307e019d",
  "assets/search.js?v=80a32003",
  "assets/serie.js?v=3e1cada5",
  "assets/simulateurs.js?v=b2610493",
  "assets/theme.css?v=d45d9954",
  "atelier.html",
  "carnet.html",
  "commandes.html",
  "dojo.html",
  "examens.html",
  "glossaire.html",
  "index.html",
  "labo.html",
  "manifest.webmanifest",
  "modules/azure.html",
  "modules/ccna-reseau.html",
  "modules/cisco-securite.html",
  "modules/depannage-reseau.html",
  "modules/docker.html",
  "modules/dpm.html",
  "modules/entretien-recrutement.html",
  "modules/exchange-securite.html",
  "modules/homelab.html",
  "modules/hyperv.html",
  "modules/iis.html",
  "modules/itil.html",
  "modules/linux-debian.html",
  "modules/monitoring-zabbix.html",
  "modules/powershell.html",
  "modules/proxmox.html",
  "modules/rds.html",
  "modules/redmine.html",
  "modules/reseau-bases.html",
  "modules/scrum.html",
  "modules/securite.html",
  "modules/sharepoint.html",
  "modules/sql-server.html",
  "modules/storage-clustering.html",
  "modules/subnetting.html",
  "modules/voip.html",
  "modules/windows-server.html",
  "modules/zabbix-windows.html",
  "plan.html",
  "revision.html",
  "simulateurs.html"
];
const CACHE = 'cai-' + VERSION;
const POLICES = 'cai-polices';

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => Promise.all(FICHIERS.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(ks => Promise.all(ks.filter(k => k.startsWith('cai-') && k !== CACHE && k !== POLICES).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
        e.respondWith(caches.open(POLICES).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))));
        return;
    }
    if (url.origin !== location.origin) return;
    if (url.searchParams.has('v')) {
        e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; })));
        return;
    }
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; })
        .catch(() => caches.match(req, { ignoreSearch: true })));
});
