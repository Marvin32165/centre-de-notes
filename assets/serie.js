/* Série du jour : un petit compteur d'efforts partagé par le Dojo, les simulateurs et la révision.
   « Crédit » = une réponse donnée, juste ou non : on récompense de s'être testé, pas d'avoir eu bon.
   État : localStorage « cai.serie » = { jours: { "2026-10-27": 12, … } }.
   La série = le nombre de jours consécutifs (aujourd'hui compris, ou arrêtée hier) avec au moins
   un crédit. Sans stockage, tout reste muet. */
(function () {
    'use strict';
    var KEY = 'cai.serie';
    var OBJECTIF = 10;

    function read() { try { var r = window.localStorage.getItem(KEY); return r ? JSON.parse(r) || { jours: {} } : { jours: {} }; } catch (e) { return { jours: {} }; } }
    function write(v) { try { window.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignoré */ } }
    function cle(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

    function credit(n) {
        var s = read();
        var k = cle(new Date());
        s.jours = s.jours || {};
        s.jours[k] = (s.jours[k] || 0) + (n || 1);
        /* on ne garde que 400 jours */
        var ks = Object.keys(s.jours).sort();
        while (ks.length > 400) delete s.jours[ks.shift()];
        write(s);
        try { document.dispatchEvent(new CustomEvent('cai:serie')); } catch (e) { /* ignoré */ }
    }
    function aujourdhui() { return (read().jours || {})[cle(new Date())] || 0; }
    function serie() {
        var j = read().jours || {}, d = new Date(), n = 0;
        if (!j[cle(d)]) d.setDate(d.getDate() - 1);
        while (j[cle(d)]) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }
    function total() { var j = read().jours || {}; return Object.keys(j).reduce(function (a, k) { return a + j[k]; }, 0); }

    window.CAI_SERIE = { credit: credit, aujourdhui: aujourdhui, serie: serie, total: total, objectif: OBJECTIF };
})();
