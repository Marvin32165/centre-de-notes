#!/usr/bin/env node
/* Lint de structure d'une leçon/module, par niveau (docs/GABARIT-LECON.md, tableau « Critères »).
   Usage : node outils/verif-lecon.js <clé-module> [--niveau A|B|C]
           node outils/verif-lecon.js <fichier.html> --niveau A      (fixture ou fichier hors modules/)
   Sans dépendance. Non branché sur construit.js. Code de sortie 1 s'il y a des erreurs. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RACINE = path.resolve(__dirname, '..');
const NIVEAUX = {
  A: ['reseau-bases', 'depannage-reseau', 'linux-debian', 'windows-server', 'powershell', 'subnetting', 'hyperv'],
  B: ['ccna-reseau', 'cisco-securite', 'docker', 'monitoring-zabbix', 'zabbix-windows', 'redmine', 'sql-server', 'iis',
      'storage-clustering', 'rds', 'dpm', 'proxmox', 'securite', 'homelab'],
  C: ['exchange-securite', 'sharepoint', 'voip', 'scrum', 'itil', 'azure', 'entretien-recrutement'],
};

// ---------- utilitaires HTML (regex, sans parseur) ----------
const classes = (tag) => ((/\bclass\s*=\s*"([^"]*)"/.exec(tag) || [])[1] || '').split(/\s+/).filter(Boolean);
const attr = (tag, nom) => { const m = new RegExp('\\b' + nom + '\\s*=\\s*"([^"]*)"').exec(tag); return m ? m[1] : null; };
const aAttr = (tag, nom) => new RegExp('\\b' + nom + '(\\s|=|>|$)').test(tag);

// Ouvertures de balises <tag ...> avec leur position, filtrées par prédicat sur la balise.
function ouvertures(html, nom, pred) {
  const re = new RegExp('<' + nom + '\\b[^>]*>', 'gi');
  const out = []; let m;
  while ((m = re.exec(html))) if (!pred || pred(m[0])) out.push({ tag: m[0], i: m.index });
  return out;
}
// Élément complet (équilibré) commençant à l'index i pour la balise nom.
function element(html, i, nom) {
  const re = new RegExp('<(/?)' + nom + '\\b[^>]*>', 'gi');
  re.lastIndex = i; let prof = 0, m;
  while ((m = re.exec(html))) {
    prof += m[1] ? -1 : 1;
    if (prof === 0) return html.slice(i, m.index + m[0].length);
  }
  return html.slice(i);
}
const sansReveal = (h) => h.replace(/<details\b[^>]*\breveal\b[^>]*>[\s\S]*?<\/details>/gi, '');
const texte = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ligneDe = (html, i) => html.slice(0, i).split('\n').length;

// ---------- analyse d'un module ----------
function decoupe(html) {
  const sections = ouvertures(html, 'section');
  const chapitres = [];
  sections.forEach((s, k) => {
    const cl = classes(s.tag);
    if (!cl.includes('chapter') || cl.includes('chapter--quiz') || cl.includes('test')) return;
    const fin = k + 1 < sections.length ? sections[k + 1].i : html.length;
    chapitres.push({ id: attr(s.tag, 'id') || '(sans id)', tag: s.tag, debut: s.i, corps: html.slice(s.i, fin) });
  });
  return chapitres;
}

function blocs(corps) {
  const r = {};
  for (const o of ouvertures(corps, '(?:div|p|section|ul|ol|details)', (t) => aAttr(t, 'data-bloc'))) {
    const n = attr(o.tag, 'data-bloc');
    const nom = /^<(\w+)/.exec(o.tag)[1];
    (r[n] = r[n] || []).push({ tag: o.tag, i: o.i, nom, html: element(corps, o.i, nom) });
  }
  return r;
}

function analyseChapitre(ch) {
  const b = blocs(ch.corps);
  const a = { id: ch.id, notion: /data-lecon\s*=\s*"notion"/.test(ch.tag), has: {}, probs: [] };
  for (let n = 1; n <= 9; n++) a.has[n] = !!b[n];
  const b1 = (b[1] || [])[0];
  a.has[1] = !!b1 && /\bbrief\b/.test(b1.tag);
  a.has[2] = !!b1 && /brief__foot/.test(b1.html);
  a.sansIndice = (b[7] || []).some((x) => /exo--sans-indice/.test(x.tag)) || /exo--sans-indice/.test(ch.corps);
  const b4 = (b[4] || [])[0];
  a.terminalDansBloc4 = !!b4 && /class\s*=\s*"[^"]*\b(terminal|cmdex)\b/.test(b4.html);
  a.dedans = b;
  a.reconstitues = ouvertures(ch.corps, '[a-z0-9]+', (t) => aAttr(t, 'data-reconstitue')).length;
  // corrections hors reveal
  for (const o of ouvertures(ch.corps, 'div', (t) => classes(t).some((c) => c === 'exo' || c === 'cmdex'))) {
    const el = element(ch.corps, o.i, 'div');
    const type = classes(o.tag).includes('cmdex') ? 'cmdex' : 'exo';
    const ligne = el.split('\n')[0].slice(0, 0);
    if (!/<details\b[^>]*\breveal\b/i.test(el)) a.probs.push({ niveau: 'err', msg: `${type} sans <details class="reveal"> (solution absente ou visible)` });
    else if (/<(strong|b|em)>\s*(solution|corrig[ée]|correction)\b/i.test(sansReveal(el))) a.probs.push({ niveau: 'err', msg: `${type} : solution apparente hors reveal` });
  }
  return a;
}

// ---------- secrets ----------
const IP_OK = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|0\.|255\.)/;
function secrets(html) {
  const err = [], warn = [];
  html.split('\n').forEach((l, k) => {
    const t = texte(l);
    if (/ssh-rsa\s+AAAA/.test(l)) err.push(`ligne ${k + 1} : clé publique SSH ("ssh-rsa AAAA…")`);
    const mp = /password\s*[:=]\s*(\S+)/i.exec(t);
    if (mp && !/^(<|\*|x{3}|\$|\{|\[|\.{2}|…|exemple|changeme|motdepasse|mot_de_passe|password|p@ssw0rd|passw0rd|secret)/i.test(mp[1]))
      warn.push(`ligne ${k + 1} : mot de passe possible (« ${mp[0].slice(0, 40)} »)`);
    const re = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g; let m;
    while ((m = re.exec(t))) {
      if ([m[1], m[2], m[3], m[4]].some((x) => +x > 255)) continue;
      if (IP_OK.test(m[0])) continue;
      warn.push(`ligne ${k + 1} : IPv4 publique possible ${m[0]}`);
    }
  });
  return { err, warn };
}

// ---------- catalogue ----------
function catalogue() {
  const f = path.join(RACINE, 'assets', 'catalogue.js');
  if (!fs.existsSync(f)) return null;
  const sandbox = { window: {} }; vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox);
  return sandbox.window.CATALOGUE;
}
function infoModule(cat, cle) {
  if (!cat) return {};
  const mods = cat.modules;
  const m = Array.isArray(mods) ? mods.find((x) => x.id === cle || x.key === cle || x.slug === cle) : (mods || {})[cle];
  const paliers = {};
  (cat.paliers || []).forEach((p) => { paliers[p.id.replace(/^p/, '')] = p.mission && p.mission.etapes; });
  return { mod: m, paliers };
}

// ---------- règles ----------
function verifie(html, cle, niveau) {
  const erreurs = [], avert = [], exemptions = [], reconstitues = [];
  const E = (id, msg) => erreurs.push(`chap#${id} : ${msg}`);
  const chapitres = decoupe(html);
  const analyses = chapitres.map(analyseChapitre);
  const cat = catalogue(); const info = infoModule(cat, cle);

  if (info.mod && typeof info.mod.chapters === 'number' && info.mod.chapters !== chapitres.length)
    erreurs.push(`module : ${chapitres.length} chapitres trouvés, le catalogue en annonce ${info.mod.chapters}`);

  const vus = new Set();
  for (const a of analyses) { if (vus.has(a.id)) E(a.id, 'id de chapitre dupliqué'); vus.add(a.id); }

  const tot = (n) => analyses.filter((a) => a.has[n]).length;
  const n = analyses.length;
  for (const a of analyses) {
    for (const p of a.probs) E(a.id, p.msg);
    if (!a.has[1]) E(a.id, 'bloc 1 manquant');
    if (!a.has[2]) E(a.id, 'bloc 2 manquant');
    if (!a.has[9]) E(a.id, 'bloc 9 manquant');
    if (niveau === 'A' || niveau === 'B') {
      if (!a.has[3]) E(a.id, 'bloc 3 manquant');
      if (!a.has[4]) E(a.id, 'bloc 4 manquant');
    }
    if (niveau === 'A') {
      if (!a.has[5]) E(a.id, 'bloc 5 manquant');
      if (!a.has[7]) E(a.id, 'bloc 7 manquant');
      else if (!a.sansIndice) E(a.id, 'bloc 7 : variante sans indice (exo--sans-indice) manquante');
    }
    if (niveau === 'A' || niveau === 'B') {
      if (a.notion) exemptions.push(a.id);
      else {
        if (!a.has[6]) E(a.id, 'bloc 6 manquant');
        if (niveau === 'A' && !a.has[8]) E(a.id, 'bloc 8 manquant');
      }
    } else if (a.notion) exemptions.push(a.id);
    if (niveau === 'A' && a.terminalDansBloc4) E(a.id, 'bloc 4 contient un .terminal/.cmdex (interdit)');
    if (a.reconstitues) reconstitues.push(`${a.id} (${a.reconstitues})`);
  }
  // exigences au niveau module
  const mod = (cond, msg) => { if (!cond) erreurs.push(`module : ${msg}`); };
  if (niveau === 'B') {
    mod(tot(5) >= 1, 'bloc 5 : au moins 1 leçon clé requise');
    const need = Math.max(1, Math.floor(n / 2));
    const b7 = analyses.filter((a) => a.has[7] && a.sansIndice).length;
    mod(b7 >= need, `bloc 7 : ${b7} leçon(s) avec exo + variante sans indice, ${need} attendue(s) (1 sur 2)`);
    mod(tot(8) >= 1, 'bloc 8 : au moins 1 panne requise');
  }
  if (niveau === 'C') {
    mod(tot(3) >= 1, 'bloc 3 : au moins 1 fois par module');
    mod(tot(4) >= 1, 'bloc 4 : au moins 1 fois par module');
    mod(tot(6) >= 1, 'bloc 6 : au moins un .verify/.cmdex conservé');
    mod(analyses.some((a) => a.has[7]), 'bloc 7 : au moins 1 exercice requis');
    mod(tot(8) >= 1 || /class="[^"]*\bscenario\b/.test(html), `bloc 8 : au moins 1 panne requise${/^(itil|azure)$/.test(cle) ? ' (obligatoire pour ' + cle + ')' : ''}`);
  }
  // bloc 10
  const b10 = /data-bloc\s*=\s*"10"/.test(html) || /data-lab\s*=\s*"livrable-/.test(html) || /<section\b[^>]*\bid\s*=\s*"livrable"/.test(html);
  mod(b10, 'bloc 10 manquant (mission/livrable : data-lab="livrable-<clé>" ou section id="livrable")');
  // missions de palier
  for (const o of ouvertures(html, 'div', (t) => /data-lab\s*=\s*"mission-p\d+"/.test(t))) {
    const num = /mission-p(\d+)/.exec(o.tag)[1];
    const attendu = info.paliers && info.paliers[num];
    const li = (element(html, o.i, 'div').match(/<li\b/gi) || []).length;
    if (attendu === undefined) avert.push(`mission-p${num} : palier absent du catalogue`);
    else if (li !== attendu) erreurs.push(`mission-p${num} : ${li} <li> pour mission.etapes = ${attendu}`);
  }
  const s = secrets(html);
  s.err.forEach((m) => erreurs.push(`secret : ${m}`));
  s.warn.forEach((m) => avert.push(`secret douteux : ${m}`));
  return { n, erreurs, avert, exemptions, reconstitues };
}

// ---------- CLI ----------
function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--niveau');
  let niveauArg = null;
  if (i >= 0) { niveauArg = (args[i + 1] || '').toUpperCase(); args.splice(i, 2); }
  const cle = args[0];
  if (!cle) { console.error('Usage : node outils/verif-lecon.js <clé-module> [--niveau A|B|C]'); process.exit(2); }
  const estFichier = /\.html$/i.test(cle);
  let niveau = niveauArg, fichier;
  if (estFichier) {
    fichier = path.resolve(cle);
    if (!niveau) { console.error('Erreur : --niveau requis avec un fichier .html'); process.exit(2); }
  } else {
    const trouve = Object.keys(NIVEAUX).find((k) => NIVEAUX[k].includes(cle));
    if (!trouve) { console.error(`Erreur : module inconnu « ${cle} » (hors table module→niveau)`); process.exit(2); }
    niveau = niveau || trouve;
    fichier = path.join(RACINE, 'modules', cle + '.html');
  }
  if (!['A', 'B', 'C'].includes(niveau)) { console.error('Erreur : niveau doit être A, B ou C'); process.exit(2); }
  if (!fs.existsSync(fichier)) { console.error(`Erreur : fichier introuvable ${fichier}`); process.exit(2); }

  const r = verifie(fs.readFileSync(fichier, 'utf8'), estFichier ? path.basename(cle, '.html') : cle, niveau);
  console.log(`verif-lecon : ${cle} (niveau ${niveau})`);
  r.erreurs.forEach((e) => console.log('ERREUR  ' + e));
  r.avert.forEach((w) => console.log('AVERT   ' + w));
  console.log('---');
  console.log(`Chapitres : ${r.n} · erreurs : ${r.erreurs.length} · avertissements : ${r.avert.length}`);
  console.log(`Exemptions notion (blocs 6, 8) : ${r.exemptions.length}${r.exemptions.length ? ' → ' + r.exemptions.join(', ') : ''}`);
  console.log(`Reconstitués (data-reconstitue) : ${r.reconstitues.length}${r.reconstitues.length ? ' → ' + r.reconstitues.join(', ') : ''}`);
  process.exit(r.erreurs.length ? 1 : 0);
}
if (require.main === module) main();
module.exports = { verifie };
