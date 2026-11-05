/* Page carnet : les chapitres « à revoir » et toutes les notes, regroupés par module,
   avec export Markdown. Données : localStorage cai.notes (voir notes.js) ; titres des
   chapitres : assets/search-index.js. */
(function () {
    'use strict';
    var host = document.querySelector('.carnet__list');
    if (!host) return;
    var KEY = 'cai.notes';
    var onlyRevoir = false;

    function read() { try { var r = window.localStorage.getItem(KEY); return r ? JSON.parse(r) || {} : {}; } catch (e) { return {}; } }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    var titres = {}, modules = {};
    (window.SEARCH_INDEX || []).forEach(function (e) {
        titres[e.file + '#' + e.anchor] = e.title;
        modules[e.file] = e.module.replace(/ — Module$/, '');
    });
    var ordre = Object.keys(modules);

    function items() {
        var d = read();
        return Object.keys(d).map(function (k) {
            var p = k.split('#');
            return { k: k, file: p[0], id: p[1], t: d[k].t || '', r: !!d[k].r, u: d[k].u || 0 };
        }).filter(function (x) { return titres[x.k]; })
          .sort(function (a, b) {
              var ia = ordre.indexOf(a.file), ib = ordre.indexOf(b.file);
              return ia - ib;
          });
    }

    function render() {
        var all = items();
        var shown = all.filter(function (x) { return !onlyRevoir || x.r; });
        var nr = all.filter(function (x) { return x.r; }).length;
        var nn = all.filter(function (x) { return x.t.trim(); }).length;
        document.querySelector('.carnet__stats').textContent =
            nr + ' chapitre' + (nr > 1 ? 's' : '') + ' à revoir · ' + nn + ' note' + (nn > 1 ? 's' : '');
        if (!shown.length) {
            host.innerHTML = '<p class="glo__empty">' + (all.length
                ? 'Aucun chapitre n’est marqué « à revoir ».'
                : 'Rien pour l’instant. Dans un module, chaque chapitre propose « Marquer à revoir » et « Ajouter une note » : ils apparaîtront ici.') + '</p>';
            return;
        }
        var html = '', cur = '';
        shown.forEach(function (x) {
            if (x.file !== cur) { cur = x.file; html += '<h2 class="carnet__mod"><a href="modules/' + x.file + '">' + esc(modules[x.file]) + '</a></h2>'; }
            html += '<article class="carnet__item">' +
                '<h3><a href="modules/' + x.file + '#' + x.id + '">' + esc(titres[x.k]) + '</a>' +
                (x.r ? ' <span class="carnet__tag">à revoir</span>' : '') + '</h3>' +
                (x.t.trim() ? '<p class="carnet__note">' + esc(x.t).replace(/\n/g, '<br>') + '</p>' : '') +
                '</article>';
        });
        host.innerHTML = html;
    }

    document.querySelector('.carnet__filter').addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-f]');
        if (!b) return;
        onlyRevoir = b.getAttribute('data-f') === 'revoir';
        Array.prototype.forEach.call(this.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        render();
    });

    document.querySelector('.carnet__export').addEventListener('click', function () {
        var all = items();
        if (!all.length) { window.alert('Le carnet est vide.'); return; }
        var md = '# Mon carnet — Centre d’apprentissage IT\n\n_Exporté le ' + new Date().toLocaleDateString('fr-FR') + '_\n', cur = '';
        all.forEach(function (x) {
            if (x.file !== cur) { cur = x.file; md += '\n## ' + modules[x.file] + '\n'; }
            md += '\n### ' + titres[x.k] + (x.r ? ' — à revoir' : '') + '\n';
            if (x.t.trim()) md += '\n' + x.t.trim() + '\n';
        });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
        a.download = 'carnet-centre-it-' + new Date().toISOString().slice(0, 10) + '.md';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });

    document.addEventListener('visibilitychange', render);
    render();
})();
