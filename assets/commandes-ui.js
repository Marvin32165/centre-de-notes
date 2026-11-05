/* Page commandes : l'index de toutes les commandes des modules, avec filtre par texte,
   par shell et par module. Données : assets/commandes.js (généré par outils/construit.js). */
(function () {
    'use strict';
    var C = window.COMMANDES;
    var list = document.querySelector('.cmd__list');
    if (!C || !list) return;
    var input = document.querySelector('.glo__search');
    var shells = document.querySelector('.cmd__shells');
    var sel = document.querySelector('.cmd__module');
    var count = document.querySelector('.glo__count');
    var more = document.querySelector('.cmd__more');
    var shell = '', limit = 80;

    function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    C.forEach(function (e) { e.f = e.s; e.hay = norm(e.k + ' ' + e.d); });

    var fams = {};
    C.forEach(function (e) { fams[e.f] = (fams[e.f] || 0) + 1; });
    var noms = Object.keys(fams).sort(function (a, b) { return fams[b] - fams[a]; });
    shells.innerHTML = ['Tout'].concat(noms).map(function (n, i) {
        return '<button type="button" class="srs__chip" aria-pressed="' + (i ? 'false' : 'true') + '" data-s="' + (i ? esc(n) : '') + '">' + esc(n) + (i ? ' · ' + fams[n] : '') + '</button>';
    }).join('');
    var mods = {};
    C.forEach(function (e) { mods[e.m] = e.mt; });
    sel.innerHTML = '<option value="">Tous les modules</option>' + Object.keys(mods).map(function (k) {
        return '<option value="' + k + '">' + esc(mods[k]) + '</option>';
    }).join('');

    var facts = document.querySelector('[data-cmd-facts]');
    if (facts) facts.innerHTML = '<span class="fact"><b>Commandes</b> ' + C.length + '</span><span class="fact"><b>Modules</b> ' + Object.keys(mods).length + '</span>';

    function render() {
        var q = norm(input.value.trim()), words = q.split(/\s+/).filter(Boolean), m = sel.value;
        var shown = C.filter(function (e) {
            if (shell && e.f !== shell) return false;
            if (m && e.m !== m) return false;
            return words.every(function (w) { return e.hay.indexOf(w) > -1; });
        });
        if (q) shown.sort(function (a, b) {
            return (norm(a.k).indexOf(q) === 0 ? 0 : 1) - (norm(b.k).indexOf(q) === 0 ? 0 : 1);
        });
        count.textContent = shown.length + ' commande' + (shown.length > 1 ? 's' : '') + (q || shell || m ? ' sur ' + C.length : '');
        var part = shown.slice(0, limit);
        list.innerHTML = part.map(function (e, i) {
            return '<article class="cmd__item"><pre class="cmd__code" tabindex="0"><code>' + esc(e.k) + '</code></pre>' +
                '<button type="button" class="cmd__copy" data-i="' + i + '" aria-label="Copier la commande">copier</button>' +
                (e.d ? '<p class="cmd__desc">' + esc(e.d) + '</p>' : '') +
                '<p class="cmd__where"><span>' + esc(e.f) + '</span><a href="modules/' + e.m + '.html#' + e.c + '"><b>' + esc(e.mt.replace(/ — .*$/, '')) + '</b> ' + esc(e.ct) + '</a></p></article>';
        }).join('') || '<p class="glo__empty">Aucune commande ne correspond. Essaie un mot plus court, ou la recherche globale (<kbd>Ctrl</kbd> <kbd>K</kbd>).</p>';
        list._shown = part;
        more.hidden = shown.length <= limit;
        more.textContent = 'Afficher les ' + Math.min(80, shown.length - limit) + ' suivantes';
    }
    shells.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-s]');
        if (!b) return;
        shell = b.getAttribute('data-s'); limit = 80;
        Array.prototype.forEach.call(shells.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        render();
    });
    sel.addEventListener('change', function () { limit = 80; render(); });
    input.addEventListener('input', function () { limit = 80; render(); });
    more.addEventListener('click', function () { limit += 80; render(); });
    list.addEventListener('click', function (ev) {
        var b = ev.target.closest('.cmd__copy');
        if (!b || !navigator.clipboard) return;
        navigator.clipboard.writeText(list._shown[+b.getAttribute('data-i')].k).then(function () {
            b.textContent = 'copié';
            setTimeout(function () { b.textContent = 'copier'; }, 1400);
        });
    });
    render();
})();
