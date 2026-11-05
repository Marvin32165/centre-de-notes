/* Le Dojo : s'entraîner à se rappeler, pas à relire.
   Quatre exercices, tous tirés du contenu existant (rien n'est écrit à part) :
     - termes      : une définition, retrouver le terme (QCM)
     - definitions : un terme, retrouver sa définition (QCM)
     - commandes   : une explication, taper la commande (saisie libre)
     - melange     : un peu de tout
   Une séance = 10 questions. Les items ratés reviennent plus souvent (boîtes 0 à 3), et la fin de
   séance liste ce qui a manqué avec le lien vers le chapitre.
   Sources : assets/glossaire.js (GLOSSAIRE) et assets/commandes.js (COMMANDES, généré).
   État : localStorage « cai.dojo » = { b: { id: boîte }, skip: [id], best: n }. */
(function () {
    'use strict';
    var G = window.GLOSSAIRE, C = window.COMMANDES;
    var host = document.getElementById('dojo');
    if (!host || !G || !C) return;

    var KEY = 'cai.dojo', LEN = 10;
    function read() { try { var r = localStorage.getItem(KEY); return r ? JSON.parse(r) || {} : {}; } catch (e) { return {}; } }
    function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignoré */ } }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    var store = read();
    store.b = store.b || {};
    store.skip = store.skip || [];

    /* ── Les banques d'items ── */
    var termes = G.termes.filter(function (t) { return t.d && t.d.length > 24; });
    var cmds = [], seen = {};
    C.forEach(function (e) {
        if (!e.d || e.d.length < 10 || e.k.indexOf('\n') > -1 || e.k.length > 80 || seen[e.k]) return;
        seen[e.k] = 1;
        e.id = 'c:' + e.m + ':' + e.k;
        cmds.push(e);
    });
    termes.forEach(function (t) { t.id = 't:' + t.id; });

    /* ── Tirage : les items faibles (boîte 0) sortent le plus ── */
    function pick(list, n) {
        var out = [], pool = list.filter(function (x) { return store.skip.indexOf(x.id) === -1; });
        while (out.length < n && pool.length) {
            var tot = 0;
            pool.forEach(function (x) { tot += 4 - (store.b[x.id] || 0); });
            var r = Math.random() * tot, k = 0;
            for (; k < pool.length - 1; k++) { r -= 4 - (store.b[pool[k].id] || 0); if (r <= 0) break; }
            out.push(pool.splice(k, 1)[0]);
        }
        return out;
    }

    /* ── Fabrication des questions ── */
    function qTerme(t) {      // définition -> terme
        var d = t.d.replace(new RegExp('\\b' + rx(t.t) + '\\b', 'ig'), '…');
        var same = termes.filter(function (o) { return o !== t && o.dom === t.dom && norm(o.t) !== norm(t.t); });
        var wrong = shuffle(same).slice(0, 3);
        if (wrong.length < 3) wrong = wrong.concat(shuffle(termes.filter(function (o) { return o !== t && wrong.indexOf(o) === -1; })).slice(0, 3 - wrong.length));
        var opts = shuffle([t].concat(wrong)).map(function (o) { return { text: o.t + (o.x ? ' — ' + o.x : ''), ok: o === t }; });
        return { kind: 'qcm', id: t.id, tag: 'Quel terme ?', prompt: d, opts: opts, back: t, link: t.l && t.l[0] };
    }
    function qDefinition(t) { // terme -> définition
        var same = termes.filter(function (o) { return o !== t && o.dom === t.dom; });
        var wrong = shuffle(same).slice(0, 3);
        if (wrong.length < 3) wrong = wrong.concat(shuffle(termes.filter(function (o) { return o !== t && wrong.indexOf(o) === -1; })).slice(0, 3 - wrong.length));
        var opts = shuffle([t].concat(wrong)).map(function (o) { return { text: o.d, ok: o === t }; });
        return { kind: 'qcm', id: t.id, tag: 'Quelle définition ?', prompt: '<strong>' + esc(t.t) + '</strong>' + (t.x ? ' <span class="dojo__x">' + esc(t.x) + '</span>' : ''), raw: true, opts: opts, back: t, link: t.l && t.l[0] };
    }
    function qCommande(c) {
        return { kind: 'type', id: c.id, tag: 'Tape la commande', prompt: esc(c.d.charAt(0).toUpperCase() + c.d.slice(1)),
                 ctx: esc(c.ct) + ' · ' + esc(c.s), raw: true, answer: c.k, back: c, link: [c.m, c.c, c.ct, c.mt] };
    }
    function build(mode) {
        var qs = [];
        if (mode === 'termes') qs = pick(termes, LEN).map(qTerme);
        else if (mode === 'definitions') qs = pick(termes, LEN).map(qDefinition);
        else if (mode === 'commandes') qs = pick(cmds, LEN).map(qCommande);
        else {
            qs = pick(termes, 4).map(qTerme).concat(pick(termes, 3).map(qDefinition), pick(cmds, 3).map(qCommande));
            qs = shuffle(qs);
        }
        return qs;
    }

    /* ── Saisie : on compare sans casse ni espaces en trop ── */
    function simplifie(s) { return String(s).toLowerCase().replace(/[`;]+$/g, '').replace(/\s+/g, ' ').replace(/["']/g, '').trim(); }
    function verdict(saisie, bon) {
        var a = simplifie(saisie), b = simplifie(bon);
        if (!a) return 'vide';
        if (a === b) return 'juste';
        var ta = a.split(' '), tb = b.split(' ');
        if (ta[0] === tb[0] && ta.length > 1 && tb.length > 1 && ta.slice(1).sort().join(' ') === tb.slice(1).sort().join(' ')) return 'juste';
        if (ta[0] === tb[0] || (ta[0] + ' ' + ta[1]) === (tb[0] + ' ' + tb[1])) return 'presque';
        return 'faux';
    }

    /* ── Interface ── */
    var modes = [['melange', 'Mélange'], ['termes', 'Définition → terme'], ['definitions', 'Terme → définition'], ['commandes', 'Taper la commande']];
    var mode = 'melange', qs = [], i = 0, good = 0, misses = [], answered = false;

    function badge() {
        var S = window.CAI_SERIE;
        var el = host.querySelector('.dojo__serie');
        if (!S || !el) return;
        var n = S.aujourdhui(), s = S.serie();
        el.innerHTML = '<span><b>' + s + '</b> jour' + (s > 1 ? 's' : '') + ' de suite</span>' +
            '<span><b>' + Math.min(n, S.objectif) + ' / ' + S.objectif + '</b> aujourd’hui</span>' +
            '<span class="dojo__meter" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(n / S.objectif * 100)) + '%"></i></span>';
    }
    function frame() {
        host.innerHTML =
            '<div class="dojo__top"><div class="glo__doms dojo__modes" role="group" aria-label="Exercice">' +
            modes.map(function (m) { return '<button type="button" class="srs__chip" data-mode="' + m[0] + '" aria-pressed="' + (m[0] === mode ? 'true' : 'false') + '">' + m[1] + '</button>'; }).join('') +
            '</div><div class="dojo__serie" aria-live="polite"></div></div><div class="dojo__stage"></div>';
        badge();
    }
    var stage = function () { return host.querySelector('.dojo__stage'); };

    function start() {
        qs = build(mode); i = 0; good = 0; misses = [];
        if (!qs.length) { stage().innerHTML = '<div class="dojo__card"><p>Plus rien à tirer pour cet exercice : tu as écarté toutes les cartes.</p></div>'; return; }
        show();
    }
    function show() {
        answered = false;
        var q = qs[i];
        if (!q) { return end(); }
        var h = '<div class="dojo__card"><p class="dojo__count">Question ' + (i + 1) + ' / ' + qs.length + ' · <span>' + q.tag + '</span></p>' +
            '<p class="dojo__prompt">' + (q.raw ? q.prompt : esc(q.prompt)) + '</p>';
        if (q.ctx) h += '<p class="dojo__ctx">' + q.ctx + '</p>';
        if (q.kind === 'qcm') {
            h += '<ul class="dojo__opts">' + q.opts.map(function (o, k) {
                return '<li><button type="button" class="dojo__opt" data-k="' + k + '"><span class="opt__key">' + 'ABCD'.charAt(k) + '</span><span>' + esc(o.text) + '</span></button></li>';
            }).join('') + '</ul>';
        } else {
            h += '<form class="dojo__form"><input class="dojo__input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ta réponse" placeholder="Tape la commande…">' +
                '<button class="btn btn--primary" type="submit">Vérifier</button> <button class="btn btn--ghost dojo__idk" type="button">Je ne sais pas</button></form>';
        }
        h += '<div class="dojo__fb" aria-live="polite"></div></div>';
        stage().innerHTML = h;
        var inp = stage().querySelector('.dojo__input');
        if (inp) inp.focus();
    }
    function record(q, ok) {
        store.b[q.id] = ok ? Math.min(3, (store.b[q.id] || 0) + 1) : 0;
        write(store);
        if (window.CAI_SERIE) window.CAI_SERIE.credit(1);
        badge();
        if (ok) good++; else misses.push(q);
    }
    function feedback(q, ok, extra) {
        answered = true;
        var link = q.link ? '<a href="modules/' + q.link[0] + '.html#' + q.link[1] + '">Relire : ' + esc(q.link[3].replace(/ — .*$/, '')) + ' — ' + esc(q.link[2]) + '</a>' : '';
        var body = q.kind === 'qcm'
            ? '<p>' + esc(q.back.d) + '</p>'
            : '<pre class="dojo__code"><code>' + esc(q.answer) + '</code></pre>' + (q.back.d ? '' : '');
        var fb = stage().querySelector('.dojo__fb');
        fb.className = 'dojo__fb ' + (ok ? 'is-ok' : 'is-ko');
        fb.innerHTML = '<p class="dojo__verdict">' + (ok ? 'Juste.' : (extra || 'Pas tout à fait.')) + '</p>' + body +
            '<p class="dojo__links">' + link + (q.kind === 'type' ? ' <button type="button" class="dojo__skip">Cette carte n’a pas de sens seule</button>' : '') + '</p>' +
            '<button type="button" class="btn btn--primary dojo__next">' + (i + 1 >= qs.length ? 'Voir le bilan' : 'Suivante') + '</button>';
        var nb = fb.querySelector('.dojo__next'); nb.focus();
    }
    function end() {
        var pct = Math.round(good / qs.length * 100);
        var h = '<div class="dojo__card dojo__end"><p class="dojo__count">Séance terminée</p>' +
            '<p class="dojo__score"><b>' + good + ' / ' + qs.length + '</b> <span>' + (pct >= 80 ? 'Solide.' : pct >= 50 ? 'En progrès — les ratés reviendront plus souvent.' : 'Normal : c’est en se trompant qu’on retient. Relis et recommence.') + '</span></p>';
        if (misses.length) {
            h += '<p class="dojo__count">À retravailler</p><ul class="dojo__miss">' + misses.map(function (q) {
                var ans = q.kind === 'qcm' ? '<strong>' + esc(q.back.t) + '</strong> — ' + esc(q.back.d) : '<code>' + esc(q.answer) + '</code>';
                var lk = q.link ? ' <a href="modules/' + q.link[0] + '.html#' + q.link[1] + '">relire</a>' : '';
                return '<li>' + ans + lk + '</li>';
            }).join('') + '</ul>';
        }
        h += '<div class="dojo__actions"><button type="button" class="btn btn--primary dojo__again">Nouvelle séance</button></div></div>';
        stage().innerHTML = h;
        if (good > (store.best || 0)) { store.best = good; write(store); }
    }

    host.addEventListener('click', function (ev) {
        var t = ev.target;
        var m = t.closest('[data-mode]');
        if (m) { mode = m.getAttribute('data-mode'); frame(); start(); return; }
        var q = qs[i];
        var opt = t.closest('.dojo__opt');
        if (opt && q && !answered) {
            var k = +opt.getAttribute('data-k'), ok = q.opts[k].ok;
            var btns = stage().querySelectorAll('.dojo__opt');
            btns.forEach(function (b, n) { b.disabled = true; if (q.opts[n].ok) b.classList.add('is-right'); else if (n === k) b.classList.add('is-wrong'); });
            record(q, ok); feedback(q, ok);
            return;
        }
        if (t.closest('.dojo__idk') && q && !answered) { record(q, false); stage().querySelector('.dojo__input').disabled = true; feedback(q, false, 'Voici la réponse :'); return; }
        if (t.closest('.dojo__skip') && q) {
            store.skip.push(q.id); write(store); t.closest('.dojo__skip').textContent = 'Écartée — elle ne reviendra plus'; t.closest('.dojo__skip').disabled = true; return;
        }
        if (t.closest('.dojo__next')) { i++; show(); return; }
        if (t.closest('.dojo__again')) { start(); }
    });
    host.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var q = qs[i];
        if (!q || answered || q.kind !== 'type') return;
        var inp = stage().querySelector('.dojo__input');
        var v = verdict(inp.value, q.answer);
        if (v === 'vide') return;
        inp.disabled = true;
        record(q, v === 'juste');
        feedback(q, v === 'juste', v === 'presque' ? 'Presque : le début est bon.' : 'Pas tout à fait.');
    });
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && answered && !ev.target.closest('button, a')) {
            var n = stage().querySelector('.dojo__next');
            if (n) { ev.preventDefault(); n.click(); }
        }
        var qc = qs[i];
        if (qc && qc.kind === 'qcm' && !answered && /^[1-4a-dA-D]$/.test(ev.key) && !/input|textarea|select/i.test(ev.target.tagName)) {
            var idx = /\d/.test(ev.key) ? +ev.key - 1 : ev.key.toLowerCase().charCodeAt(0) - 97;
            var b = stage().querySelectorAll('.dojo__opt')[idx];
            if (b) b.click();
        }
    });
    document.addEventListener('cai:serie', badge);

    var f = document.querySelector('[data-dojo-facts]');
    if (f) f.innerHTML = '<span class="fact"><b>Termes</b> ' + termes.length + '</span><span class="fact"><b>Commandes</b> ' + cmds.length + '</span><span class="fact"><b>Séance</b> ' + LEN + ' questions</span><span class="fact"><b>Clavier</b> A–D ou 1–4 · Entrée</span>';
    frame();
    start();
})();
