// Régénère tout ce qui est généré dans site/ — une seule commande, aucune dépendance :
//
//   node site/outils/construit.js          -> construit
//   node site/outils/construit.js --verif  -> ne touche à rien, échoue si quelque chose est périmé
//
// Ce que le script fait :
//   1. assets/quiz/<module>.js   un fichier par fonds de questions, tiré de quiz-data.js
//                                (une page de module ne charge que le sien, pas 1,2 Mo)
//   2. assets/commandes.js       l'index des commandes, tiré des blocs .terminal des modules
//   3. assets/search-index.js    (generate-search-index.py) et assets/glossaire.js
//                                (generate-glossaire.py), si python3 est disponible
//   4. ?v=<empreinte>            sur chaque <script src> / <link href> vers assets/ : l'empreinte est
//                                celle du CONTENU du fichier, le navigateur ne recharge que ce qui a changé
//   5. sw.js                     la liste des fichiers à garder pour le mode hors ligne, versionnée
//
// quiz-data.js reste la source des questions : on continue de l'éditer, jamais assets/quiz/.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const SITE = path.resolve(__dirname, '..');
const VERIF = process.argv.includes('--verif');
const probleme = [];

const lit = p => fs.readFileSync(p, 'utf8');
function ecrit(rel, contenu) {
    const p = path.join(SITE, rel);
    const avant = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (avant === contenu) return false;
    if (VERIF) { probleme.push(rel + ' est périmé'); return true; }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, contenu);
    console.log('  écrit ' + rel);
    return true;
}
const htmlDuSite = () => ['index.html', 'examens.html', 'labo.html', 'revision.html', 'glossaire.html', 'atelier.html', 'carnet.html', 'commandes.html', 'dojo.html', 'simulateurs.html', 'plan.html']
    .filter(f => fs.existsSync(path.join(SITE, f)))
    .concat(fs.readdirSync(path.join(SITE, 'modules')).filter(f => f.endsWith('.html')).map(f => 'modules/' + f));

/* ── 1. Fonds de questions, un fichier par module ── */
{
    const ctx = { window: {} };
    vm.runInNewContext(lit(path.join(SITE, 'assets', 'quiz-data.js')), ctx);
    const banque = ctx.window.QUIZ_BANK;
    const garde = (k, v) => { if (typeof v === 'function') throw new Error('quiz-data.js : une fonction dans le fonds « ' + k + ' »'); return v; };
    const cles = Object.keys(banque);
    for (const cle of cles) {
        const json = JSON.stringify(banque[cle], (k, v) => garde(cle, v));
        ecrit('assets/quiz/' + cle + '.js',
            '/* Généré par site/outils/construit.js à partir de quiz-data.js — ne pas éditer. */\n' +
            '(window.QUIZ_BANK = window.QUIZ_BANK || {})[' + JSON.stringify(cle) + '] = ' + json + ';\n');
    }
    // un fichier qui ne correspond plus à aucun fonds est périmé
    const dossier = path.join(SITE, 'assets', 'quiz');
    if (fs.existsSync(dossier)) {
        for (const f of fs.readdirSync(dossier)) {
            if (!cles.includes(f.replace(/\.js$/, ''))) {
                if (VERIF) probleme.push('assets/quiz/' + f + ' n\'a plus de fonds');
                else { fs.rmSync(path.join(dossier, f)); console.log('  supprimé assets/quiz/' + f); }
            }
        }
    }
    // chaque module charge SON fonds (et non plus quiz-data.js)
    for (const f of fs.readdirSync(path.join(SITE, 'modules')).filter(f => f.endsWith('.html') && !f.startsWith('_'))) {
        const src = lit(path.join(SITE, 'modules', f));
        const m = src.match(/data-test="([^"]+)"/);
        if (!m) continue;
        if (!cles.includes(m[1])) probleme.push('modules/' + f + ' : pas de fonds « ' + m[1] + ' » dans quiz-data.js');
        if (cles.includes(m[1]) && !src.includes('assets/quiz/' + m[1] + '.js')) probleme.push('modules/' + f + ' ne charge pas assets/quiz/' + m[1] + '.js');
        if (/assets\/quiz-data\.js/.test(src.replace(/<!--[\s\S]*?-->/g, ''))) probleme.push('modules/' + f + ' charge encore quiz-data.js : utiliser assets/quiz/' + m[1] + '.js');
    }
}

/* ── 2. Index des commandes ── */
{
    const plain = t => t.replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    const SQL = /^(SELECT|INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|BACKUP|RESTORE|DBCC|USE|EXEC|EXECUTE|GRANT|DENY|REVOKE|WITH|DECLARE|BEGIN|GO|TRUNCATE)\b/;
    const CISCO = /^(show|interface|ip|ipv6|access-list|spanning-tree|switchport|vlan|router|hostname|enable|configure|line|crypto|ntp|logging|service|username|description|exit|end|copy|write|banner|no|shutdown|duplex|speed|channel-group|encapsulation|network|passive-interface|default-information|redundancy|standby|ping|traceroute|debug|reload|erase|name|exec-timeout|transport|login|password|snmp-server|aaa|dot1x|mac|storm-control|errdisable|port-security|permit|deny|remark)\b/;
    const VERBES = /^(Get|Set|New|Remove|Add|Install|Uninstall|Enable|Disable|Start|Stop|Restart|Test|Invoke|Import|Export|Resolve|Select|Where|ForEach|Write|Read|Out|Format|Copy|Move|Rename|Clear|Update|Register|Unregister|Grant|Revoke|Mount|Dismount|Initialize|Repair|Reset|Resume|Suspend|Wait|Join|Find|Show|Sync|Publish|Backup|Restore|Convert|Connect|Disconnect|Compare|Measure|Sort|Group|Unblock|Push|Pop|Expand|Optimize|Save|Send|Debug|Enter|Exit|Receive|Request|Approve|Deny|Block|Lock|Unlock|Protect|Unprotect|Use|Edit|Open|Close|Complete|Confirm|Disconnect|Checkpoint|Move|Merge|Split|Trace|Ping)-[A-Z][A-Za-z]+/;
    const WINCMD = /^(ipconfig|tracert|netsh|nslookup|arp|route|net|nbtstat|netstat|hostname|getmac|ping|gpupdate|gpresult|klist|sc|tasklist|taskkill|whoami|systeminfo|dism|sfc|chkdsk|diskpart|robocopy|xcopy|icacls|takeown|cmdkey|dsquery|nltest|w32tm|wmic)\b/i;
    function famille(titre, cmd) {
        const t = titre.toLowerCase();
        if (SQL.test(cmd) && !/powershell|bash/.test(t)) return 'T-SQL';
        if (VERBES.test(cmd) || /^\$[A-Za-z_]/.test(cmd)) return 'PowerShell';
        if (/powershell|management shell/.test(t)) return 'PowerShell';
        if (/cisco|ios/.test(t)) return 'Cisco IOS';
        if (/invite|\bcmd\b/.test(t)) return 'Windows (cmd)';
        if (/t-sql|sql/.test(t)) return 'T-SQL';
        if (/windows/.test(t) && WINCMD.test(cmd)) return 'Windows (cmd)';
        if (/cisco/.test(t) && CISCO.test(cmd)) return 'Cisco IOS';
        return 'Linux (bash)';
    }
    const sorties = [];
    const modules = fs.readdirSync(path.join(SITE, 'modules')).filter(f => f.endsWith('.html') && !f.startsWith('_')).sort();
    const vu = new Set();
    for (const f of modules) {
        const cle = f.replace(/\.html$/, '');
        const src = lit(path.join(SITE, 'modules', f));
        const titre = (src.match(/<title>(.*?)<\/title>/s) || [, cle])[1].replace(/ — Module$/, '').replace(/&amp;/g, '&');
        for (const sec of src.matchAll(/<section class="chapter(?: [^"]*)?" id="([^"]+)">(.*?)<\/section>/gs)) {
            if (/chapter--quiz/.test(sec[0].slice(0, 60))) continue;
            const ch = (sec[2].match(/<h2 class="chapter__title">(.*?)<\/h2>/s) || [, sec[1]])[1];
            for (const t of sec[2].matchAll(/<div class="terminal">\s*<div class="terminal__bar">(.*?)<\/div>\s*<pre class="terminal__code">(.*?)<\/pre>/gs)) {
                const shell = plain((t[1].match(/terminal__title">(.*?)<\/span>/s) || [, ''])[1]).replace(/\s+—.*$/, '').trim();
                // fichiers de configuration, arbres, logs, sorties : pas des commandes à retrouver
                const titreBrut = plain((t[1].match(/terminal__title">(.*?)<\/span>/s) || [, ''])[1]);
                if (/\.(yml|yaml|env|conf|log)\b|^\/etc|^~|crontab de|interfaces|sources\.list|arbre|arborescence|chemin d|extrait|dockerfile|compose|sortie|résultat|exemple de/i.test(titreBrut)) continue;
                let suite = null, dernier = null;
                for (const brut of t[2].split('\n')) {
                    const ligne = plain(brut).replace(/\s+$/, '');
                    if (!ligne.trim()) { suite = null; continue; }
                    // commentaire seul, sortie d'exemple, ligne de continuation d'un bloc précédent
                    if (/^\s*(#|\/\/|--)/.test(ligne)) continue;
                    if (/[├└│─→▸►]/.test(ligne)) continue;
                    // suite d'une commande sur plusieurs lignes, ou ligne qui n'en est pas une
                    const premier = ligne.trim().split(/\s+/)[0];
                    if (suite && /[\\`,|(]$/.test(suite.trimEnd().replace(/\s+#.*$/, ''))) { suite = ligne; if (dernier) dernier.k += '\n' + ligne.replace(/\s+[#!]\s.*$/, '').trimEnd(); continue; }
                    if (/^\s{2,}\S/.test(ligne) && suite) { suite = ligne; if (dernier) dernier.k += '\n' + ligne.replace(/\s+[#!]\s.*$/, '').trimEnd(); continue; }
                    if (/[,:]$/.test(premier) || /\s\+\s{1,3}\S+\s{1,3}\+\s/.test(ligne)) continue;
                    if (/^(FROM|WITH|WHERE|SET|ON|TO|INTO|VALUES|AND|OR|GROUP|ORDER|JOIN|AS|STATS|NORECOVERY|RECOVERY|MOVE|REPLACE|FORMAT|INIT|STOPAT|FILE|DISK|THEN|ELSE|END|BEGIN|GO)\b/.test(premier) && !/^(BEGIN|GO)$/.test(premier)) continue;
                    let commente = brut.match(/^(.*?)<span class="c">\s*(?:#|--|\/\/|!)\s*(.*?)<\/span>\s*$/);
                    if (!commente) { const bang = brut.match(/^(.*?\S)\s+!\s+(.*)$/); if (bang && !/<span/.test(bang[2])) commente = bang; }
                    const cmd = plain(commente ? commente[1] : brut).replace(/\s+$/, '').replace(/^\s*(PS [^>]*>|[A-Za-z0-9_.-]+[#>$]|\$|#)\s+/, '');
                    const aide = commente ? plain(commente[2]).trim() : '';
                    if (!cmd.trim()) continue;
                    const prem = cmd.trim().split(/\s+/)[0];
                    // les lignes qui commencent par un chiffre, une accolade ou un tiret sont des sorties ou des suites
                    if (/^[\d{}\[\]|\\\-\/@%=:;,)]/.test(prem) || /^\s{4,}/.test(cmd) && suite) { suite = null; continue; }
                    if (cmd.length > 160) continue;
                    const cle2 = cle + '|' + cmd.trim();
                    if (vu.has(cle2)) continue;
                    vu.add(cle2);
                    dernier = { m: cle, mt: titre, c: sec[1], ct: plain(ch).replace(/\s+/g, ' ').trim(), s: famille(shell, cmd.trim()), k: cmd.trim(), d: aide };
                    sorties.push(dernier);
                    suite = cmd;
                }
            }
        }
    }
    ecrit('assets/commandes.js',
        '/* Généré par site/outils/construit.js à partir des blocs .terminal des modules — ne pas éditer.\n' +
        '   m module · mt titre du module · c chapitre · ct titre du chapitre · s shell · k commande · d aide */\n' +
        'window.COMMANDES = ' + JSON.stringify(sorties) + ';\n');
    console.log('  ' + sorties.length + ' commandes indexées');
}

/* ── 3. Index de recherche et glossaire (python3) ── */
for (const [script, sortie] of [['generate-search-index.py', 'assets/search-index.js'], ['generate-glossaire.py', 'assets/glossaire.js']]) {
    const cible = path.join(SITE, sortie);
    const avant = fs.existsSync(cible) ? fs.readFileSync(cible) : null;
    const r = spawnSync('python3', [path.join(__dirname, script)], { cwd: path.resolve(SITE, '..'), encoding: 'utf8' });
    if (r.error || r.status !== 0) { console.log('  (python3 indisponible ou en échec pour ' + script + ' — étape sautée)'); continue; }
    const apres = fs.readFileSync(cible);
    if (avant && !avant.equals(apres)) {
        if (VERIF) { probleme.push(sortie + ' est périmé'); fs.writeFileSync(cible, avant); }
        else console.log('  régénéré ' + sortie);
    }
}

/* ── 4. Empreintes de version ── */
{
    const empreinte = rel => crypto.createHash('sha1').update(fs.readFileSync(path.join(SITE, rel))).digest('hex').slice(0, 8);
    const RE = /((?:src|href)=")((?:\.\.\/)?)(assets\/[^"?#]+\.(?:js|css))(?:\?v=[^"]*)?(")/g;
    for (const f of htmlDuSite()) {
        const src = lit(path.join(SITE, f));
        const neuf = src.replace(RE, (tout, a, up, rel, z) => fs.existsSync(path.join(SITE, rel)) ? a + up + rel + '?v=' + empreinte(rel) + z : tout);
        ecrit(f, neuf);
    }
    global.__emp = empreinte;
}

/* ── 5. Service worker : liste des pages et version ── */
{
    const fichiers = htmlDuSite().concat(['manifest.webmanifest', 'assets/favicon.svg']);
    for (const a of fs.readdirSync(path.join(SITE, 'assets'))) {
        const p = path.join('assets', a);
        if (fs.statSync(path.join(SITE, p)).isDirectory()) {
            if (a === 'quiz') for (const q of fs.readdirSync(path.join(SITE, p))) fichiers.push(p + '/' + q);
        } else if (!/\.(png)$/.test(a)) fichiers.push(p);
    }
    const emp = global.__emp;
    const versionne = f => /^assets\/.*\.(js|css)$/.test(f) ? f + '?v=' + emp(f) : f;
    const h = crypto.createHash('sha1');
    for (const f of fichiers.sort()) if (fs.existsSync(path.join(SITE, f))) h.update(f).update(fs.readFileSync(path.join(SITE, f)));
    const tpl = path.join(SITE, 'sw.js');
    if (fs.existsSync(tpl)) {
        const src = lit(tpl);
        const neuf = src
            .replace(/const VERSION = '[^']*';/, "const VERSION = '" + h.digest('hex').slice(0, 10) + "';")
            .replace(/const FICHIERS = \[[\s\S]*?\];/, 'const FICHIERS = ' + JSON.stringify(fichiers.filter((f, i, a) => a.indexOf(f) === i).map(versionne), null, 2) + ';');
        ecrit('sw.js', neuf);
    }
}

if (probleme.length) {
    console.error('Construction à refaire :\n  - ' + probleme.join('\n  - ') + '\n→ node site/outils/construit.js');
    process.exit(1);
}
console.log(VERIF ? 'Rien de périmé.' : 'Construction terminée.');
