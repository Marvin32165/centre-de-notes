# Port Python du script PowerShell generate-search-index.ps1 (meme dossier),
# pour une machine sans pwsh. Logique identique, sortie identique.
#   python3 site/outils/generate-search-index.py            (depuis la racine du depot cours)
#   python3 generate-search-index.py /autre/chemin/du/site
import re, html, os, sys, glob

SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mod_dir = os.path.join(SITE, 'modules')
out = os.path.join(SITE, 'assets', 'search-index.js')

def plain(t):
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style)\b.*?</\1>', ' ', t, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = html.unescape(t)
    return re.sub(r'\s+', ' ', t).strip()

def js(v):
    return v.replace('\\', '\\\\').replace('"', '\\"')

entries = []
for f in sorted(glob.glob(os.path.join(mod_dir, '*.html'))):
    name = os.path.basename(f)
    if name == '_template.html':
        continue
    src = open(f, encoding='utf-8').read()
    m = re.search(r'<title>(.*?)</title>', src, re.S)
    module = plain(m.group(1)) if m else name
    for sec in re.finditer(r'<section class="chapter([^"]*)" id="([^"]+)">(.*?)</section>', src, re.S):
        mods, anchor, body = sec.group(1), sec.group(2), sec.group(3)
        if 'chapter--quiz' in mods:
            continue
        h2 = re.search(r'<h2 class="chapter__title">(.*?)</h2>', body, re.S)
        title = plain(h2.group(1)) if h2 else anchor
        snippet = plain(body)[:500]
        # Mots-cles : sous-titres, en-tetes de tableau et termes en gras (2 a 60 caracteres, sans doublon)
        kws, seen = [], set()
        for k in re.finditer(r'<(h3|h4|strong|th)\b[^>]*>(.*?)</\1>', body, re.S):
            t = plain(k.group(2))
            if 2 <= len(t) <= 60 and t.lower() not in seen:
                seen.add(t.lower())
                kws.append(t)
        kw = ' · '.join(kws)[:400]
        entries.append('  {file:"%s",module:"%s",anchor:"%s",title:"%s",snippet:"%s",kw:"%s"},'
                       % (js(name), js(module), js(anchor), js(title), js(snippet), js(kw)))

lines = ['// Genere automatiquement - index de recherche full-text du portail',
         'window.SEARCH_INDEX = ['] + entries + ['];']
open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(len(entries), 'chapitres indexes ->', out)
