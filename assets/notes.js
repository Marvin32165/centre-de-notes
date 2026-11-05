/* Notes personnelles et chapitres « à revoir ».

   Chaque chapitre d'un module reçoit un bloc « Mes notes » (texte libre) et une case
   « À revoir ». Tout est enregistré dans ce navigateur, sous la clé cai.notes :
       { "docker.html#volumes": { t: "texte", r: 1, u: 1730000000000 } }
   (t : note, r : 1 si à revoir, u : dernière modification). La page carnet.html les
   regroupe ; l'export / import de progression du portail les emporte (toutes les clés cai.*).
   Si le stockage est indisponible, le bloc ne s'affiche pas : rien ne casse. */
(function () {
    'use strict';
    var KEY = 'cai.notes';
    var page = location.pathname.split('/').pop() || 'index.html';

    function read() { try { var r = window.localStorage.getItem(KEY); return r ? JSON.parse(r) || {} : {}; } catch (e) { return null; } }
    function write(v) { try { window.localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } }

    var data = read();
    if (data === null) return;
    var chapters = Array.prototype.slice.call(document.querySelectorAll('main .chapter[id]'))
        .filter(function (c) { return !c.classList.contains('chapter--quiz'); });
    if (!chapters.length) return;

    function entry(id) { return data[page + '#' + id] || { t: '', r: 0, u: 0 }; }
    function save(id, e) {
        var k = page + '#' + id;
        data = read() || {};
        if (!e.t.trim() && !e.r) delete data[k];
        else data[k] = { t: e.t, r: e.r ? 1 : 0, u: Date.now() };
        write(data);
        try { document.dispatchEvent(new CustomEvent('cai:notes')); } catch (x) { /* ignoré */ }
    }

    chapters.forEach(function (chap) {
        var id = chap.id;
        var e = entry(id);

        var box = document.createElement('div');
        box.className = 'notes';

        var flag = document.createElement('label');
        flag.className = 'chaprevoir';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        var ft = document.createElement('span');
        flag.appendChild(cb); flag.appendChild(ft);

        var det = document.createElement('details');
        det.className = 'notes__box';
        var sum = document.createElement('summary');
        var ta = document.createElement('textarea');
        ta.className = 'notes__area';
        ta.rows = 4;
        ta.setAttribute('aria-label', 'Mes notes sur ce chapitre');
        ta.placeholder = 'Un piège, une commande oubliée, une question pour le formateur… (enregistré dans ce navigateur)';
        det.appendChild(sum); det.appendChild(ta);

        function paint() {
            cb.checked = !!e.r;
            flag.classList.toggle('is-revoir', !!e.r);
            ft.textContent = e.r ? 'À revoir' : 'Marquer à revoir';
            sum.textContent = e.t.trim() ? 'Mes notes (' + e.t.trim().length + ' car.)' : 'Ajouter une note';
            det.classList.toggle('has-note', !!e.t.trim());
        }
        ta.value = e.t;
        if (e.t.trim()) det.open = true;
        paint();

        cb.addEventListener('change', function () { e.r = cb.checked ? 1 : 0; save(id, e); paint(); });
        var timer;
        ta.addEventListener('input', function () {
            e.t = ta.value;
            clearTimeout(timer);
            timer = setTimeout(function () { save(id, e); paint(); }, 400);
        });
        ta.addEventListener('blur', function () { clearTimeout(timer); save(id, e); paint(); });

        box.appendChild(flag);
        box.appendChild(det);
        chap.appendChild(box);
    });
})();
