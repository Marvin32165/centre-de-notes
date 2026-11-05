/* Mon plan d'étude : où j'en suis, ce qui reste, et un calendrier jusqu'à la date choisie.
   Tout est calculé dans le navigateur à partir de ce que le site sait déjà :
     - le catalogue (parcours dans l'ordre, durée et nombre de chapitres de chaque module) ;
     - la progression (cai.progress), les scores des tests (cai.scores) et les chapitres à revoir (cai.notes) ;
     - les titres des chapitres (assets/search-index.js).
   Le calendrier répartit les chapitres restants jour par jour dans l'ordre des parcours, avec le
   test de fin de module après les chapitres, et 15 minutes de révision espacée chaque jour.
   Réglages : localStorage « cai.plan » = { fin: "AAAA-MM-JJ", h: heures par jour, we: 0|1 }. */
(function () {
    'use strict';
    var CAT = window.CATALOGUE, IDX = window.SEARCH_INDEX || [];
    var host = document.getElementById('plan');
    if (!host || !CAT) return;

    function rd(k, f) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) || f : f; } catch (e) { return f; } }
    function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignoré */ } }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function heures(s) { var m = String(s || '').match(/(\d+)\s*h(?:\s*(\d+))?/); return m ? (+m[1]) + (m[2] ? +m[2] / 60 : 0) : 1; }
    function fmtH(h) { var m = Math.round(h * 60), hh = Math.floor(m / 60), mm = m % 60; return hh ? hh + ' h' + (mm ? ' ' + (mm < 10 ? '0' : '') + mm : '') : mm + ' min'; }
    var JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    var TEST_H = 0.3, REV_H = 0.25;

    /* ── Données de départ ── */
    var progress = rd('cai.progress', {}), scores = rd('cai.scores', {}), notes = rd('cai.notes', {});
    var cfg = rd('cai.plan', { fin: '', h: 2, we: 1 });
    var chap = {};
    IDX.forEach(function (e) { (chap[e.file] = chap[e.file] || []).push({ id: e.anchor, t: e.title }); });

    var mods = [];
    CAT.parcours.forEach(function (p) {
        (p.modules || []).forEach(function (id) {
            var m = CAT.modules[id];
            if (!m || m.soon) return;
            var file = id + '.html', list = chap[file] || [], done = progress[file] || [];
            var rest = list.filter(function (c) { return done.indexOf(c.id) === -1; });
            var rec = scores['test:' + id];
            var revoir = Object.keys(notes).filter(function (k) { return k.indexOf(file + '#') === 0 && notes[k] && notes[k].r; }).length;
            var total = list.length || m.chapters || 1;
            mods.push({
                id: id, p: p, m: m, file: file, total: total, done: Math.min(done.length, total), rest: rest,
                h: heures(m.duree), perCh: heures(m.duree) / total,
                test: rec ? rec.best : null, passed: !!(rec && rec.passed), revoir: revoir
            });
        });
    });

    function restH(x) { return x.rest.length * x.perCh + (x.passed ? 0 : TEST_H); }
    function statut(x) {
        if (x.done >= x.total && x.passed) return ['acquis', 'Acquis'];
        if (x.done === 0 && x.test == null) return ['todo', 'À faire'];
        if (x.done >= x.total) return ['test', 'Test à réussir'];
        return ['cours', 'En cours'];
    }

    /* ── Calendrier ── */
    function calendrier(fin) {
        var jours = [], d = new Date(); d.setHours(12, 0, 0, 0);
        var last = new Date(fin + 'T12:00:00');
        while (d <= last && jours.length < 120) {
            var wd = d.getDay();
            if (cfg.we || (wd !== 0 && wd !== 6)) jours.push({ d: new Date(d), plan: [], h: 0 });
            d.setDate(d.getDate() + 1);
        }
        var budget = Math.max(0.5, cfg.h) - REV_H;
        var units = [];
        mods.forEach(function (x) {
            x.rest.forEach(function (c) { units.push({ x: x, c: c, h: x.perCh }); });
            if (!x.passed) units.push({ x: x, test: true, h: TEST_H });
        });
        var j = 0, restant = [];
        units.forEach(function (u) {
            while (j < jours.length && jours[j].h + u.h > budget && jours[j].h > 0) j++;
            if (j >= jours.length) { restant.push(u); return; }
            jours[j].plan.push(u); jours[j].h += u.h;
        });
        return { jours: jours, restant: restant };
    }

    /* ── Rendu ── */
    function render() {
        var S = window.CAI_SERIE;
        var totalH = mods.reduce(function (a, x) { return a + restH(x); }, 0);
        var acquis = mods.filter(function (x) { return statut(x)[0] === 'acquis'; }).length;
        var chDone = mods.reduce(function (a, x) { return a + x.done; }, 0), chTot = mods.reduce(function (a, x) { return a + x.total; }, 0);

        var h = '<section class="plan__sec"><p class="section-tag">Où j’en suis</p><div class="plan__kpis">' +
            kpi(Math.round(chDone / Math.max(1, chTot) * 100) + ' %', 'des chapitres acquis (' + chDone + ' / ' + chTot + ')') +
            kpi(acquis + ' / ' + mods.length, 'modules acquis (chapitres + test réussi)') +
            kpi(fmtH(totalH), 'de travail restant, d’après les durées des modules') +
            kpi(S ? S.serie() + ' j' : '—', 'de série ; ' + (S ? S.total() : 0) + ' réponses au total') +
            '</div></section>';

        h += '<section class="plan__sec"><p class="section-tag">Mon échéance</p>' +
            '<form class="plan__form"><label>Date de fin <input type="date" name="fin" value="' + esc(cfg.fin) + '" min="' + iso(new Date()) + '"></label>' +
            '<label>Heures par jour <input type="number" name="h" min="0.5" max="12" step="0.5" value="' + cfg.h + '"></label>' +
            '<label class="plan__we"><input type="checkbox" name="we"' + (cfg.we ? ' checked' : '') + '> Week-ends compris</label></form>';
        var cal = null;
        if (!cfg.fin) h += '<p class="plan__hint">Choisis la date à laquelle tu veux avoir tout vu : le calendrier se construit tout seul.</p>';
        else {
            cal = calendrier(cfg.fin);
            var nb = cal.jours.length, besoin = nb ? totalH / nb + REV_H : 0;
            var cls, msg;
            if (!nb) { cls = 'ko'; msg = 'Cette date est passée ou sans jour travaillé.'; }
            else if (cal.restant.length) { cls = 'ko'; msg = 'Hors d’atteinte à ' + fmtH(cfg.h) + ' par jour : il faudrait ' + fmtH(besoin) + ' par jour, ou une date plus lointaine. Il resterait ' + cal.restant.length + ' étape' + (cal.restant.length > 1 ? 's' : '') + ' non planifiée' + (cal.restant.length > 1 ? 's' : '') + '.'; }
            else if (besoin > cfg.h * 0.85) { cls = 'warn'; msg = 'Serré mais faisable : ' + fmtH(besoin) + ' par jour en moyenne sur ' + nb + ' jours, révision comprise.'; }
            else { cls = 'ok'; msg = 'Tenable : ' + fmtH(besoin) + ' par jour en moyenne sur ' + nb + ' jours, révision comprise. Tu gardes de la marge pour approfondir.'; }
            h += '<p class="plan__verdict is-' + cls + '">' + esc(msg) + '</p>';
            if (cls === 'ko') h += '<p class="plan__hint">Ce que tu as déjà vu en cours n’est pas compté tant qu’il n’est pas coché : dans le tableau plus bas, « tout cocher » sur un module que tu maîtrises, ou passe son test — le plan se recalcule aussitôt.</p>';
        }
        h += '</section>';

        if (cal && cal.jours.length) {
            h += '<section class="plan__sec"><p class="section-tag">Calendrier</p><ol class="plan__days">';
            var shown = 0;
            cal.jours.forEach(function (j) {
                if (shown >= 21) return;
                var groups = [];
                j.plan.forEach(function (u) {
                    var g = groups[groups.length - 1];
                    if (!g || g.x !== u.x) { g = { x: u.x, cs: [], test: false }; groups.push(g); }
                    if (u.test) g.test = true; else g.cs.push(u.c);
                });
                h += '<li class="plan__day' + (shown === 0 ? ' is-today' : '') + '"><div class="plan__date"><b>' + JOURS[j.d.getDay()] + '</b> ' + j.d.getDate() + '/' + (j.d.getMonth() + 1) + (shown === 0 ? '<span>aujourd’hui</span>' : '') + '</div><div class="plan__what">';
                if (!groups.length) h += '<p class="plan__free">Libre : révision et reprise des chapitres « à revoir ».</p>';
                groups.forEach(function (g) {
                    h += '<p><a href="modules/' + g.x.file + '"><b>' + esc(g.x.m.short || g.x.m.title) + '</b></a> — ' +
                        (g.cs.length ? g.cs.map(function (c) { return '<a href="modules/' + g.x.file + '#' + c.id + '">' + esc(c.t) + '</a>'; }).join(' · ') : '') +
                        (g.test ? (g.cs.length ? ' · ' : '') + '<a href="modules/' + g.x.file + '#test">test de fin de module</a>' : '') + '</p>';
                });
                h += '<p class="plan__rev"><a href="revision.html">+ révision du jour</a> · ' + fmtH(j.h + REV_H) + '</p></div></li>';
                shown++;
            });
            h += '</ol>' + (cal.jours.length > 21 ? '<p class="plan__hint">Les 21 prochains jours sont affichés ; le reste se recalcule au fil de ta progression.</p>' : '') + '</section>';
        }

        h += '<section class="plan__sec"><p class="section-tag">Maîtrise par module</p>' +
            '<p class="plan__hint">Un module est « acquis » quand tous ses chapitres sont cochés <b>et</b> que le test est réussi. Le reste dit quoi faire ensuite.</p>' +
            '<div class="table-wrap"><table class="plan__map"><thead><tr><th>Module</th><th>Lecture</th><th>Test</th><th>À revoir</th><th>Statut</th><th>Reste</th></tr></thead><tbody>' +
            mods.map(function (x) {
                var st = statut(x), pc = Math.round(x.done / x.total * 100);
                return '<tr class="is-' + st[0] + '"><td><a href="modules/' + x.file + '">' + esc(x.m.short || x.m.title) + '</a></td>' +
                    '<td><span class="plan__bar" aria-hidden="true"><i style="width:' + pc + '%"></i></span> ' + x.done + ' / ' + x.total + '</td>' +
                    '<td>' + (x.test == null ? '—' : x.test + ' %' + (x.passed ? '' : ' ✗')) + '</td>' +
                    '<td>' + (x.revoir ? '<a href="carnet.html">' + x.revoir + '</a>' : '—') + '</td>' +
                    '<td>' + st[1] + '</td><td>' + (st[0] === 'acquis' ? '—' : fmtH(restH(x))) + '</td></tr>';
            }).join('') + '</tbody></table></div></section>';
        host.innerHTML = h;

        host.querySelectorAll('[data-all]').forEach(function (b) {
            b.addEventListener('click', function () {
                var id = b.getAttribute('data-all'), x = mods.filter(function (m) { return m.id === id; })[0];
                if (!window.confirm('Marquer les ' + x.total + ' chapitres de « ' + (x.m.short || x.m.title) + ' » comme acquis ? Tu peux les décocher un à un dans le module.')) return;
                progress[x.file] = (chap[x.file] || []).map(function (c) { return c.id; });
                wr('cai.progress', progress);
                location.reload();
            });
        });
        var f = host.querySelector('.plan__form');
        if (f) f.addEventListener('change', function () {
            cfg = { fin: f.fin.value, h: Math.max(0.5, Math.min(12, +f.h.value || 2)), we: f.we.checked ? 1 : 0 };
            wr('cai.plan', cfg);
            render();
            var again = host.querySelector('.plan__form input[name="' + (document.activeElement && document.activeElement.name || 'fin') + '"]');
            if (again) again.focus();
        });
    }
    function kpi(v, t) { return '<div class="plan__kpi"><b>' + esc(v) + '</b><span>' + esc(t) + '</span></div>'; }
    render();
})();
