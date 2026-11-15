#!/usr/bin/env python3
"""Génère site/assets/glossaire.js : les termes de site/outils/glossaire/termes.txt et les
entrées .gloss/.gl des modules, chacun avec les chapitres où il est expliqué.
À lancer depuis la racine du dépôt :  python3 site/outils/generate-glossaire.py"""
import glob, html, json, os, re, sys, unicodedata

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MOD_DOM = {
    'reseau-bases': 'Réseau', 'subnetting': 'Réseau', 'depannage-reseau': 'Réseau', 'ccna-reseau': 'Réseau',
    'cisco-securite': 'Réseau', 'voip': 'Téléphonie',
    'windows-server': 'Windows & Active Directory', 'powershell': 'Windows & Active Directory',
    'storage-clustering': 'Windows & Active Directory', 'rds': 'Windows & Active Directory', 'iis': 'Windows & Active Directory',
    'exchange-securite': 'Windows & Active Directory', 'sql-server': 'Windows & Active Directory',
    'sharepoint': 'Windows & Active Directory', 'dpm': 'Windows & Active Directory',
    'hyperv': 'Linux & virtualisation', 'linux-debian': 'Linux & virtualisation', 'proxmox': 'Linux & virtualisation',
    'docker': 'Linux & virtualisation', 'homelab': 'Linux & virtualisation', 'securite': 'Sécurité',
    'monitoring-zabbix': 'Supervision, cloud & méthode', 'zabbix-windows': 'Supervision, cloud & méthode',
    'azure': 'Supervision, cloud & méthode', 'scrum': 'Supervision, cloud & méthode', 'redmine': 'Supervision, cloud & méthode',
    'entretien-recrutement': 'Supervision, cloud & méthode',
}

def plain(h):
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()

def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    return re.sub(r'[^a-z0-9]+', '', ''.join(c for c in t if unicodedata.category(c) != 'Mn'))

def slug(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def compile_pats(pats):
    out = []
    for p in pats:
        flags = 0 if not re.search(r'[a-zà-ÿ]', re.sub(r'\\[a-zA-Z]', '', p)) else re.I
        out.append(re.compile(r'(?<![\w-])(?:%s)(?![\w-])' % p, flags))
    return out

# ── Chapitres de tous les modules
short = {}
cat = open(os.path.join(SITE, 'assets', 'catalogue.js'), encoding='utf-8').read()
for m in re.finditer(r'\n"([\w-]+)": \{\s*title: "([^"]+)", short: "([^"]+)"', cat):
    short[m.group(1)] = m.group(3)
chapitres = []
for f in sorted(glob.glob(os.path.join(SITE, 'modules', '*.html'))):
    key = os.path.basename(f)[:-5]
    if key.startswith('_'):
        continue
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'<section class="chapter[^"]*" id="([^"]+)">(.*?)</section>', s, re.S):
        body = m.group(2)
        t = re.search(r'class="chapter__title">(.*?)</h2>', body, re.S)
        emph = ' '.join(plain(x) for x in re.findall(r'<(?:strong|b|h3|dt)\b[^>]*>(.*?)</(?:strong|b|h3|dt)>', body, re.S))
        chapitres.append({'mod': key, 'id': m.group(1), 'title': plain(t.group(1)) if t else m.group(1),
                          'text': plain(body), 'emph': emph})

# ── Termes de la source
termes, dom = [], None
for line in open(os.path.join(SITE, 'outils', 'glossaire', 'termes.txt'), encoding='utf-8'):
    line = line.rstrip('\n')
    if not line.strip() or line.startswith('# '):
        continue
    if line.startswith('## '):
        dom = line[3:].strip(); continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) < 3:
        sys.exit('Ligne mal formée : ' + line)
    t, x, d = parts[0], parts[1], parts[2]
    pats = [p.strip() for p in (parts[3] if len(parts) > 3 else '').split(';') if p.strip()] or [re.escape(t)]
    termes.append({'t': t, 'x': x, 'd': d, 'dom': dom, 'pats': pats, 'src': None})

# ── Entrées .gl des modules, si le terme n'est pas déjà là
connus = {norm(e['t']) for e in termes} | {norm(e['x']) for e in termes if e['x']}
ajouts = 0
for f in sorted(glob.glob(os.path.join(SITE, 'modules', '*.html'))):
    key = os.path.basename(f)[:-5]
    if key.startswith('_'):
        continue
    s = open(f, encoding='utf-8').read()
    secs = [(m.start(), m.group(1)) for m in re.finditer(r'<section class="chapter[^"]*" id="([^"]+)"', s)]
    for gm in re.finditer(r'<div class="gl"><b>(.*?)</b>\s*<span>(.*?)</span>', s, re.S):
        b, d = gm.group(1), gm.group(2)
        chap = [i for p, i in secs if p < gm.start()]
        t = plain(b)
        alts = [a.strip() for a in re.split(r'\s*/\s*', t) if a.strip()]
        if norm(t) in connus or any(norm(a) in connus for a in alts):
            continue
        connus.add(norm(t))
        termes.append({'t': t, 'x': '', 'd': plain(d), 'dom': MOD_DOM.get(key, 'Divers'),
                       'pats': [re.escape(a) + ('s?' if a[-1:].isalpha() else '') for a in alts], 'src': key,
                       'chap': chap[-1] if chap else None})
        ajouts += 1

# ── Liens : chapitres où le terme est expliqué ou employé
for e in termes:
    rx = compile_pats(e['pats'])
    scored = []
    for c in chapitres:
        n = sum(len(r.findall(c['text'])) for r in rx)
        if not n:
            continue
        sc = min(n, 6)
        if any(r.search(c['title']) for r in rx): sc += 10
        if any(r.search(c['emph']) for r in rx): sc += 4
        if e['src'] == c['mod']: sc += 3
        scored.append((sc, c))
    scored.sort(key=lambda x: -x[0])
    keep = [c for sc, c in scored if sc >= 3][:6] or [c for sc, c in scored[:1]]
    if not keep and e.get('chap'):
        keep = [c for c in chapitres if c['mod'] == e['src'] and c['id'] == e['chap']]
    e['l'] = [[c['mod'], c['id'], c['title'], short.get(c['mod'], c['mod'])] for c in keep]

ordre = ['Réseau', 'Téléphonie', 'Windows & Active Directory', 'Linux & virtualisation', 'Sécurité',
         'Supervision, cloud & méthode', 'Divers']
termes.sort(key=lambda e: norm(e['t']))
vus = {}
out = []
for e in termes:
    i = slug(e['t']) or 'terme'
    vus[i] = vus.get(i, 0) + 1
    if vus[i] > 1: i += '-' + str(vus[i])
    out.append({'id': i, 't': e['t'], 'x': e['x'], 'd': e['d'], 'dom': e['dom'], 'l': e['l']})
data = {'domaines': [d for d in ordre if any(e['dom'] == d for e in out)], 'termes': out}
dst = os.path.join(SITE, 'assets', 'glossaire.js')
with open(dst, 'w', encoding='utf-8') as fh:
    fh.write('// Généré par site/outils/generate-glossaire.py à partir de outils/glossaire/termes.txt\n'
             '// et des glossaires des modules — ne pas éditer à la main.\n')
    fh.write('window.GLOSSAIRE = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
sans = [e['t'] for e in out if not e['l']]
print('%d termes (%d venus des modules), %d sans chapitre%s -> %s' % (
    len(out), ajouts, len(sans), (' : ' + ', '.join(sans)) if sans else '', os.path.relpath(dst)))
