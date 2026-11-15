// Vérifie le site (site/) dans un vrai navigateur, piloté par puppeteer-core :
// Edge sur le poste Windows, Chromium sous Linux — rien n'est téléchargé.
//
// Usage :
//   node verifie.js                 -> vérifie
//   node verifie.js --shots         -> vérifie + captures dans ./shots/
//   node verifie.js --site "D:\...\cours\site"
//   CHROME=/chemin/du/navigateur node verifie.js
//
// Le script sert lui-même le DÉPÔT (le dossier parent de site/) sur un port
// libre, pour que les liens vers les supports des cours se résolvent comme en
// vrai. Rien à lancer à côté.
//
// Ce qu'il contrôle, sur l'index ET sur tous les modules :
//   - le catalogue (assets/catalogue.js) : chaque module existe, chaque support
//     et chaque outil pointe vers un fichier réel du dépôt
//   - aucun débordement horizontal à 320 / 380 / 480 / 768 / 1280 px
//   - aucune erreur JS, aucune ressource manquante (404)
//   - cohérence sommaire / chapitres / nombre de chapitres du catalogue
//   - la recherche du portail renvoie bien des résultats
//
// A déjà détecté 2 bugs réels : `.quiz__q` en display:flex sans wrap (chaque
// <code> d'une question devenait un élément flex, ce qui élargissait la page
// sous 480 px), et le favicon absent (404 sur chaque page).

const path = require('path');
const fs = require('fs');
const http = require('http');

function chargePuppeteer() {
  try {
    return require('puppeteer-core');
  } catch (e) {
    const voisin = path.resolve(
      __dirname, '..', '..', '..', 'linux-debian', 'outils',
      'verif-commandes-html', 'node_modules', 'puppeteer-core');
    if (fs.existsSync(voisin)) return require(voisin);
    console.error('puppeteer-core introuvable : lancer `npm install` dans '
      + __dirname + ' (ou dans linux-debian/outils/verif-commandes-html).');
    process.exit(2);
  }
}
const puppeteer = chargePuppeteer();

function trouveNavigateur() {
  const cand = [
    process.env.CHROME,
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  ];
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (fs.existsSync(pw)) {
    for (const d of fs.readdirSync(pw).filter(n => n.startsWith('chromium-')).sort().reverse()) {
      cand.push(path.join(pw, d, 'chrome-linux', 'chrome'));
    }
  }
  return cand.filter(Boolean).find(p => fs.existsSync(p));
}
const NAVIGATEUR = trouveNavigateur();

const argSite = process.argv.indexOf('--site');
const SITE = argSite > -1
  ? process.argv[argSite + 1]
  : path.resolve(__dirname, '..', '..');
const REPO = path.resolve(SITE, '..');
const PREFIX = '/' + path.basename(SITE);

const WANT_SHOTS = process.argv.includes('--shots');
const SHOTS = path.join(__dirname, 'shots');
const WIDTHS = [320, 380, 480, 768, 1280];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json',
};

let ko = 0;
const fail = m => { ko++; console.log('  KO  ' + m); };
const ok = m => console.log('  ok  ' + m);

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const f0 = path.join(REPO, rel);
      const f = fs.existsSync(f0) && fs.statSync(f0).isDirectory() ? path.join(f0, 'index.html') : f0;
      if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404); return res.end('not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, base: 'http://127.0.0.1:' + srv.address().port + PREFIX }));
  });
}

(async () => {
  if (!fs.existsSync(SITE)) {
    console.error('Site introuvable : ' + SITE + '\n(passer --site "chemin\\vers\\cours\\site")');
    process.exit(2);
  }
  const { srv, base } = await serve();
  const modules = fs.readdirSync(path.join(SITE, 'modules'))
    .filter(f => f.endsWith('.html') && !f.startsWith('_'))
    .map(f => 'modules/' + f);
  const pages = ['index.html', ...['examens.html', 'labo.html', 'revision.html', 'glossaire.html', 'atelier.html', 'carnet.html', 'commandes.html', 'dojo.html', 'simulateurs.html', 'plan.html', 'feuille-de-route.html'].filter(f => fs.existsSync(path.join(SITE, f))), ...modules];
  console.log(`Portail : ${SITE}\n${pages.length} pages (${modules.length} modules)`);

  if (!NAVIGATEUR) { console.error('Aucun navigateur trouvé : définir CHROME=/chemin/du/navigateur'); process.exit(2); }
  const b = await puppeteer.launch({ executablePath: NAVIGATEUR, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();

  console.log('\n== debordement horizontal ==');
  for (const url of pages) {
    const bad = [];
    for (const w of WIDTHS) {
      await p.setViewport({ width: w, height: 900 });
      await p.goto(base + '/' + url, { waitUntil: 'networkidle0' });
      const r = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      if (r.sw > r.cw + 1) bad.push(`${w}px->${r.sw}`);
    }
    bad.length ? fail(`${url} deborde a ${bad.join(', ')}`) : ok(url);
  }

  console.log('\n== erreurs JS et ressources ==');
  for (const url of pages) {
    const errs = [];
    const onErr = e => errs.push('pageerror: ' + e.message);
    // Les polices Google ne se chargent pas hors ligne : une ressource externe qui échoue n'est pas un défaut du site.
    const onMsg = m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); };
    const onFail = r => { if (r.url().startsWith(base)) errs.push('échec ' + r.url().replace(base, '')); };
    const onResp = r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url().replace(base, '')}`); };
    p.on('pageerror', onErr); p.on('console', onMsg); p.on('response', onResp); p.on('requestfailed', onFail);
    await p.setViewport({ width: 1280, height: 900 });
    await p.goto(base + '/' + url, { waitUntil: 'networkidle0' });
    p.off('pageerror', onErr); p.off('console', onMsg); p.off('response', onResp); p.off('requestfailed', onFail);
    errs.length ? fail(url + ' : ' + errs.join(' | ')) : ok(url);
  }

  console.log('\n== sommaire / chapitres / cartes du portail ==');
  await p.goto(base + '/index.html', { waitUntil: 'networkidle0' });
  // Le nombre de chapitres de référence est celui du catalogue (plus de grille de cartes au portail).
  const cartes = await p.evaluate(() => Object.entries((window.CATALOGUE || {}).modules || {})
    .filter(([, m]) => !m.soon).map(([id, m]) => ({ file: id + '.html', chapters: Number(m.chapters) })));
  const fichiers = modules.map(m => m.replace('modules/', ''));
  for (const f of fichiers) {
    if (!cartes.some(c => c.file === f)) fail(f + ' : absent du catalogue');
  }
  for (const c of cartes) {
    await p.goto(base + '/modules/' + c.file, { waitUntil: 'networkidle0' });
    const r = await p.evaluate(() => {
      const ch = [...document.querySelectorAll('section.chapter:not(.chapter--quiz)')];
      const toc = [...document.querySelectorAll('.toc__link')].map(a => a.getAttribute('href').slice(1));
      return {
        n: ch.length,
        horsToc: ch.map(s => s.id).filter(i => !toc.includes(i)),
        casses: toc.filter(t => !document.getElementById(t)),
        cases: document.querySelectorAll('.chapter .chapdone input[type=checkbox]').length,
        quiz: document.querySelectorAll('.test[data-test] .test__form').length,
        brief: document.querySelectorAll('.brief').length,
      };
    });
    const pb = [];
    if (r.n !== c.chapters) pb.push(`catalogue chapters=${c.chapters} mais ${r.n} chapitres`);
    if (r.horsToc.length) pb.push('hors sommaire: ' + r.horsToc.join(','));
    if (r.casses.length) pb.push('ancres cassees: ' + r.casses.join(','));
    if (r.cases !== r.n) pb.push(`${r.cases} cases pour ${r.n} chapitres`);
    if (!r.quiz) pb.push('pas d auto-evaluation');
    if (!r.brief) pb.push('pas de bloc d objectifs');
    // Les annonces du test (intro du fonds, « Test N questions » du héro) suivent les vrais comptes :
    // un test pose min(draw, taille du fonds) questions, tirées au sort.
    const annonce = await p.evaluate(id => {
      const N = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19, vingt: 20, 'vingt-cinq': 25 };
      const b = (window.QUIZ_BANK || {})[id]; if (!b) return null;
      const intro = (b.intro || '').toLowerCase();
      const num = w => (w ? (N[w] || (/^\d+$/.test(w) ? +w : null)) : null);
      const mc = intro.match(/([a-z-]+|\d+) chapitres?\b/), mq = intro.match(/([a-z-]+|\d+) questions?\b/);
      const hero = (document.querySelector('.hero__facts') || {}).textContent || '';
      const h = hero.match(/Test\s*(\d+) questions/);
      return { ch: num(mc && mc[1]), q: num(mq && mq[1]), heroQ: h ? +h[1] : null, n: Math.min(b.draw || 20, b.questions.length) };
    }, c.file.replace('.html', ''));
    if (annonce) {
      if (annonce.ch !== null && annonce.ch !== r.n) pb.push(`intro du test : ${annonce.ch} chapitres pour ${r.n}`);
      if (annonce.q !== null && annonce.q !== annonce.n) pb.push(`intro du test : ${annonce.q} questions pour ${annonce.n}`);
      if (annonce.heroQ !== null && annonce.heroQ !== annonce.n) pb.push(`héro : ${annonce.heroQ} questions pour ${annonce.n}`);
    }
    pb.length ? fail(c.file + ' : ' + pb.join(' | ')) : ok(c.file + ` (${r.n} chapitres)`);
  }

  console.log('\n== catalogue, liens entre modules, supports ==');
  await p.goto(base + '/index.html', { waitUntil: 'networkidle0' });
  const cat = await p.evaluate(() => JSON.parse(JSON.stringify(window.CATALOGUE || null)));
  if (!cat) fail('window.CATALOGUE absent du portail');
  else {
    const ids = Object.keys(cat.modules);
    const dansParcours = new Set(cat.parcours.flatMap(x => x.modules.concat(x.soon || [])));
    for (const id of ids) {
      const m = cat.modules[id];
      if (!dansParcours.has(id)) fail(id + ' : dans aucun parcours');
      if (!m.soon && !fs.existsSync(path.join(SITE, 'modules', id + '.html'))) fail(id + ' : modules/' + id + '.html manquant');
      for (const ref of [].concat(m.prereq || [], m.utile || [], m.related || [])) {
        if (!cat.modules[ref]) fail(id + ' : référence inconnue « ' + ref + ' »');
      }
      if (!m.soon) {
        const carte = cartes.find(c => c.file === id + '.html');
        if (!carte) fail(id + ' : pas de carte au portail');
        else if (carte.chapters !== m.chapters) fail(id + ' : chapitres ' + m.chapters + ' (catalogue) ≠ ' + carte.chapters + ' (carte)');
      }
      for (const s of m.supports || []) {
        if (cat.public) { fail(id + ' : version publique avec des supports privés'); break; }
        if (!fs.existsSync(path.join(REPO, s.path))) fail(id + ' : support introuvable « ' + s.path + ' »');
      }
    }
    for (const o of cat.outils || []) {
      if (!fs.existsSync(path.join(REPO, o.path))) fail('outil introuvable « ' + o.path + ' »');
    }
    if (cat.public && cat.outils) fail('version publique avec la liste des outils privés');
    ko === 0 && ok(ids.length + ' modules' + (cat.public ? ' (version publique)' : ', ' + cat.outils.length + ' outils') + ' : tout se résout');
  }

  console.log('\n== carte interactive du portail ==');
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(base + '/index.html', { waitUntil: 'networkidle0' });
  const nNodes = await p.$$eval('.map__node', n => n.length);
  nNodes ? ok(nNodes + ' cases dans la carte') : fail('carte des modules vide');
  const before = await p.evaluate(() => {
    const b = document.querySelector('.map__node[data-id="docker"]');
    if (!b) return null;
    b.click();
    return {
      avant: [...document.querySelectorAll('.map__node.is-before')].map(n => n.dataset.id),
      apres: [...document.querySelectorAll('.map__node.is-after')].map(n => n.dataset.id),
      titre: (document.querySelector('.map__title') || {}).textContent,
    };
  });
  if (!before) fail('carte : case docker introuvable');
  else if (!before.avant.includes('linux-debian')) fail('carte : docker devrait dépendre de linux-debian, vu : ' + before.avant.join(','));
  else ok('carte : Docker ← ' + before.avant.join(', ') + ' · → ' + before.apres.join(', '));
  const outils = await p.$$eval('[data-outils] a.res', a => a.length);
  const cat0 = await p.evaluate(() => !!(window.CATALOGUE && window.CATALOGUE.public));
  if (cat0) {
    const fuite = await p.evaluate(() => ({
      section: !!document.getElementById('outils'),
      nav: [...document.querySelectorAll('.sitenav a')].some(a => /outils/i.test(a.getAttribute('href') + a.textContent)),
      marqueurs: document.documentElement.innerHTML.includes('local-->'),
      sup: !!document.querySelector('.sup'),
    }));
    Object.values(fuite).some(Boolean) ? fail('version publique : reste de contenu local ' + JSON.stringify(fuite)) : ok('version publique : ni outils, ni supports, ni marqueurs');
  } else {
    outils ? ok(outils + ' outils listés') : fail('boîte à outils vide');
  }

  console.log('\n== navigation entre modules ==');
  for (const c of cartes) {
    await p.goto(base + '/modules/' + c.file, { waitUntil: 'networkidle0' });
    const r = await p.evaluate(() => ({
      nav: !!document.querySelector('.sitenav'),
      next: !!document.querySelector('.next .pnav'),
      path: !!document.querySelector('.toc__path'),
      sup: document.querySelectorAll('.sup__list a').length,
      eyebrow: (document.querySelector('.hero .eyebrow') || {}).textContent || '',
    }));
    const pb = [];
    if (!r.nav) pb.push('pas de barre de navigation');
    if (!r.next) pb.push('pas de bloc « Continuer »');
    if (!r.path) pb.push('pas de parcours dans le sommaire');
    if (!/Parcours \d\d · .+ · \d+ \/ \d+/.test(r.eyebrow)) pb.push('fil d\'Ariane inattendu : ' + r.eyebrow.trim());
    pb.length ? fail(c.file + ' : ' + pb.join(' | ')) : ok(c.file + ' · ' + r.eyebrow.replace(/^.*?Parcours/, 'Parcours').trim() + ' · ' + r.sup + ' supports');
  }

  console.log('\n== recherche du portail ==');
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(base + '/index.html', { waitUntil: 'networkidle0' });
  const input = await p.$('input[type="search"], .search input, input[placeholder]');
  if (!input) fail('champ de recherche introuvable');
  else {
    for (const q of ['Always On', 'tempdb', 'VLAN', 'sysprep', 'ZFS']) {
      await p.evaluate(el => { el.value = ''; }, input);
      await input.click();
      await input.type(q);
      await new Promise(r => setTimeout(r, 450));
      const txt = await p.evaluate(() => {
        const box = document.querySelector('.search__results, .results, [class*="result"]');
        return box ? box.textContent.replace(/\s+/g, ' ').trim() : '';
      });
      (!txt || /aucun r.sultat/i.test(txt))
        ? fail(`recherche « ${q} » : ${txt.slice(0, 60) || '(vide)'}`)
        : ok(`recherche « ${q} » -> ${txt.slice(0, 50)}`);
    }
  }

  if (fs.existsSync(path.join(SITE, 'glossaire.html'))) {
    console.log('\n== glossaire ==');
    // Chaque lien du glossaire doit viser un module et un chapitre qui existent.
    const ctx = { window: {} };
    require('vm').runInNewContext(fs.readFileSync(path.join(SITE, 'assets', 'glossaire.js'), 'utf8'), ctx);
    const G = ctx.window.GLOSSAIRE;
    const ids = {};
    let casses = 0;
    for (const e of G.termes) for (const [mod, anc] of e.l) {
      if (!ids[mod]) {
        const f = path.join(SITE, 'modules', mod + '.html');
        ids[mod] = fs.existsSync(f) ? new Set([...fs.readFileSync(f, 'utf8').matchAll(/ id="([^"]+)"/g)].map(m => m[1])) : new Set();
      }
      if (!ids[mod].has(anc)) { casses++; if (casses < 6) fail(`glossaire : ${e.t} -> ${mod}#${anc} introuvable`); }
    }
    if (!casses) ok(`${G.termes.length} termes, tous les liens visent un chapitre existant`);
    await p.goto(base + '/glossaire.html', { waitUntil: 'networkidle0' });
    const n = await p.$$eval('.glo__item', a => a.length);
    n === G.termes.length ? ok(`page : ${n} termes affichés`) : fail(`page : ${n} termes affichés sur ${G.termes.length}`);
    await p.type('.glo__search', 'kerberos');
    const first = await p.$eval('.glo__item .glo__term', h => h.textContent);
    /^Kerberos/.test(first) ? ok('filtre « kerberos » -> ' + first) : fail('filtre « kerberos » -> ' + first);
  }

  if (fs.existsSync(path.join(SITE, 'atelier.html'))) {
    console.log('\n== atelier ==');
    await p.goto(base + '/atelier.html', { waitUntil: 'networkidle0' });
    const val = async (tool, i, v) => {
      await p.$eval(`#${tool} .tool__input:nth-of-type(1)`, () => 0).catch(() => 0);
      await p.evaluate((tool, i, v) => {
        const inp = document.querySelectorAll('#' + tool + ' .tool__input')[i];
        inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true }));
      }, tool, i, v);
      return p.$eval('#' + tool, b => b.innerText.replace(/\s+/g, ' '));
    };
    const cas = [
      ['chmod', 0, '640', t => /rw-r-----/.test(t) && /u=rw,g=r,o=/.test(t), 'chmod 640 -> rw-r-----'],
      ['chmod', 1, 'rwxr-sr-x', t => /chmod 2755/.test(t), 'rwxr-sr-x -> 2755'],
      ['umask', 0, '027', t => /640/.test(t) && /750/.test(t), 'umask 027 -> 640 / 750'],
      ['cron', 0, '30 2 * * 1-5 /bin/sauve.sh', t => /02:30/.test(t) && /lundi au vendredi/.test(t), 'cron 30 2 * * 1-5'],
      ['cron', 0, '61 * * * *', t => /hors limites/.test(t), 'cron invalide signalé'],
      ['ipcalc', 0, '10.2.10.70/26', t => /10\.2\.10\.64/.test(t) && /10\.2\.10\.127/.test(t) && /\b62\b/.test(t), '10.2.10.70/26 -> .64 à .127, 62 hôtes'],
      ['ipcalc', 0, '192.168.1.10 255.255.255.0', t => /192\.168\.1\.255/.test(t), 'adresse + masque décimal'],
      ['convert', 0, '255', t => true, 'conversion 255'],
      ['ports', 0, 'kerberos', t => /88/.test(t) && !/3389/.test(t), 'filtre des ports'],
      ['regex', 0, 'Failed', t => /1 ligne sur 4/i.test(t), 'regex : 1 ligne sur 4'],
    ];
    for (const [tool, i, v, test, nom] of cas) {
      const t = await val(tool, i, v);
      test(t) ? ok(nom) : fail(nom + ' : ' + t.slice(0, 160));
    }
    const bin = await p.$$eval('#convert .tool__input', a => a[1].value);
    bin === '11111111' ? ok('255 -> 11111111') : fail('255 -> ' + bin);
    await p.keyboard.down('Control'); await p.keyboard.press('k'); await p.keyboard.up('Control');
    await p.keyboard.type('kerberos');
    await new Promise(r => setTimeout(r, 600));
    const grp = await p.$$eval('.palette__group', g => g.map(x => x.textContent));
    grp.includes('Glossaire') ? ok('palette Ctrl+K : groupe Glossaire') : fail('palette Ctrl+K sans glossaire : ' + grp.join(','));
  }

  if (fs.existsSync(path.join(SITE, 'feuille-de-route.html'))) {
    console.log('\n== de débutant à pro ==');
    const pp = await b.newPage();       // stockage vierge pour ce contrôle
    await pp.setViewport({ width: 1280, height: 900 });
    await pp.goto(base + '/index.html', { waitUntil: 'networkidle0' });
    await pp.evaluate(() => { try { Object.keys(localStorage).filter(k => k.indexOf('cai.') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {} });
    await pp.goto(base + '/index.html', { waitUntil: 'networkidle0' });
    const portail = await pp.evaluate(() => ({
      stairs: document.querySelectorAll('[data-stairs] .stair').length,
      welcome: !!document.querySelector('.dash.dash--welcome .dash__starts a'),
      paliers: ((window.CATALOGUE || {}).paliers || []).length,
    }));
    portail.stairs === portail.paliers && portail.paliers === 4 ? ok('portail : 4 paliers dans l escalier') : fail(`portail : ${portail.stairs} marches pour ${portail.paliers} paliers`);
    portail.welcome ? ok('portail : tableau de bord « Tu débutes ? » pour un nouveau visiteur') : fail('portail : pas de tableau de bord d accueil');
    // Chaque module est dans un seul palier, et aucun prérequis n'est dans un palier plus loin.
    const pal = await pp.evaluate(() => {
      const C = window.CATALOGUE, where = {}, pb = [];
      C.paliers.forEach((p, i) => p.modules.forEach(m => { if (m in where) pb.push(m + ' en double'); where[m] = i; }));
      Object.keys(C.modules).forEach(m => { if (!(m in where)) pb.push(m + ' sans palier'); (C.modules[m].prereq || []).forEach(r => { if (where[r] > where[m]) pb.push(m + ' avant son prérequis ' + r); }); });
      return pb;
    });
    pal.length ? fail('paliers : ' + pal.join(', ')) : ok('paliers : 27 modules, un palier chacun, prérequis en amont');
    await pp.goto(base + '/feuille-de-route.html', { waitUntil: 'networkidle0' });
    const fr = await pp.evaluate(() => {
      const C = window.CATALOGUE;
      return C.paliers.map(p => ({
        id: p.id,
        mods: document.querySelectorAll('[data-palier-mods="' + p.id + '"] .pmod').length,
        attendu: p.modules.length,
        etapes: document.querySelectorAll('.lab[data-lab="mission-' + p.id + '"] .lab__steps > li').length,
        etapesCat: (p.mission || {}).etapes,
        cases: document.querySelectorAll('.lab[data-lab="mission-' + p.id + '"] input[type=checkbox]').length,
      }));
    });
    for (const x of fr) {
      const pb = [];
      if (x.mods !== x.attendu) pb.push(`${x.mods} modules affichés pour ${x.attendu}`);
      if (x.etapes !== x.etapesCat) pb.push(`mission : ${x.etapes} étapes, catalogue ${x.etapesCat}`);
      if (x.cases !== x.etapes) pb.push(`${x.cases} cases pour ${x.etapes} étapes`);
      pb.length ? fail('palier ' + x.id + ' : ' + pb.join(' | ')) : ok(`palier ${x.id} : ${x.mods} modules, mission de ${x.etapes} étapes`);
    }
    // Le test de positionnement de bout en bout, en répondant toujours la première proposition affichée.
    await pp.click('.diag__start');
    let n = 0;
    while (await pp.$('.diag__q') && n < 30) { await pp.click('.diag__opt'); n++; }
    const res = await pp.evaluate(() => ({
      reco: !!document.querySelector('.diag__reco'),
      bars: document.querySelectorAll('.diag__bar').length,
      saved: (() => { try { return JSON.parse(localStorage.getItem('cai.diag')); } catch (e) { return null; } })(),
      dash: !!document.querySelector('.dash:not(.dash--welcome) .dash__top'),
    }));
    n === 12 && res.reco && res.bars === 4 && res.saved && res.saved.reco ? ok(`positionnement : ${n} questions, départ conseillé ${res.saved.reco}`) : fail(`positionnement : ${n} questions, reco=${res.reco}, barres=${res.bars}`);
    res.dash ? ok('tableau de bord mis à jour après le test') : fail('tableau de bord non mis à jour après le test');
    // Fiche du module et infobulles du glossaire.
    await pp.goto(base + '/modules/reseau-bases.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2800));
    const mc = await pp.evaluate(() => ({
      card: !!document.querySelector('.hero .modcard .modcard__go'),
      tips: document.querySelectorAll('.chapter .gt').length,
      horsChapitre: document.querySelectorAll('.gt:not(.chapter .gt)').length,
      dansCode: document.querySelectorAll('code .gt, pre .gt, a .gt, h2 .gt, .terminal .gt').length,
    }));
    mc.card ? ok('module : fiche « Commencer / Reprendre » dans le héro') : fail('module : pas de fiche dans le héro');
    mc.tips > 0 && !mc.horsChapitre && !mc.dansCode ? ok(`module : ${mc.tips} infobulles du glossaire, jamais dans du code ni un titre`) : fail(`infobulles : ${mc.tips}, hors chapitre ${mc.horsChapitre}, dans code/titre ${mc.dansCode}`);
    for (const w of [320, 1280]) {
      await pp.setViewport({ width: w, height: 800 });
      await new Promise(r => setTimeout(r, 400));   // le resize ferme l'infobulle : le laisser passer avant le clic
      await pp.evaluate(() => { const g = document.querySelector('.chapter .gt'); if (g) { g.scrollIntoView({ block: 'center' }); g.click(); } });
      await new Promise(r => setTimeout(r, 200));
      const r = await pp.evaluate(() => {
        const pop = document.querySelector('.gt-pop');
        const box = pop && !pop.hidden ? pop.getBoundingClientRect() : null;
        return { vis: !!box, left: box ? box.left : 0, right: box ? box.right : 0, cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth };
      });
      r.vis && r.left >= 0 && r.right <= r.cw && r.sw <= r.cw + 1 ? ok(`infobulle à ${w}px : visible, dans la page`) : fail(`infobulle à ${w}px : ${JSON.stringify(r)}`);
    }
    await pp.close();
  }

  if (WANT_SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const [nom, url, w, anchor] of [
      ['portail', 'index.html', 1280, null],
      ['carte', 'index.html', 1280, 'carte'],
      ['outils', 'index.html', 1280, 'outils'],
      ['module-docker-fin', 'modules/docker.html', 1280, 'test'],
      ['quiz-linux-380', 'modules/linux-debian.html', 380, 'test'],
      ['quiz-linux-1280', 'modules/linux-debian.html', 1280, 'test'],
      ['quiz-sql', 'modules/sql-server.html', 1280, 'test'],
    ]) {
      await p.setViewport({ width: w, height: 1000 });
      await p.goto(base + '/' + url, { waitUntil: 'networkidle0' });
      if (anchor) {
        await p.evaluate(a => document.getElementById(a).scrollIntoView(), anchor);
        await new Promise(r => setTimeout(r, 350));
      }
      await p.screenshot({ path: path.join(SHOTS, nom + '.png') });
    }
    console.log('\ncaptures -> ' + SHOTS);
  }

  await b.close();
  srv.close();
  console.log(ko ? `\n${ko} PROBLEME(S)` : '\nTout est au vert');
  process.exit(ko ? 1 : 0);
})();
