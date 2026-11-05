/* Simulateurs : voir les protocoles se dérouler, et DEVINER avant de regarder.
   Chaque scénario est un déroulé pas à pas (diagramme de séquence qui se construit). Aux moments
   clés, une question est posée AVANT la révélation : se tromper avant de voir fait mieux retenir que
   lire passivement. Le simulateur de switch est interactif : on envoie des trames, on prédit ce que
   fait le switch, on regarde la table MAC se remplir, avec ou sans VLAN.
   Chaque réponse compte pour la série du jour (serie.js). Rien n'est envoyé nulle part. */
(function () {
    'use strict';
    var host = document.getElementById('sim');
    if (!host) return;

    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function credit() { if (window.CAI_SERIE) window.CAI_SERIE.credit(1); }

    /* ══════════════ Les scénarios ══════════════
       actors : colonnes du diagramme ; steps : { f, t, msg, champs, note, etat, q }
       f / t : index des acteurs (émetteur, destinataire) ; q : { ask, opts, ok, why } posée avant. */
    var SCEN = {
        arp: {
            titre: 'ARP — retrouver l’adresse MAC',
            lien: ['reseau-bases', 'Réseau : les bases'],
            intro: 'Un poste connaît l’adresse IP de sa cible, mais une trame Ethernet a besoin d’une adresse MAC. ARP fait le lien.',
            variantes: [
                { nom: 'Cible sur le même réseau', actors: ['PC-A<br><small>192.168.1.10 · MAC AA</small>', 'PC-B<br><small>192.168.1.20 · MAC BB</small>'],
                  steps: [
                    { q: { ask: 'PC-A veut envoyer un ping à 192.168.1.20 (même réseau /24). Il a l’IP, son cache ARP est vide. Que fait-il d’abord ?', opts: ['Il envoie le ping en broadcast', 'Il demande par ARP la MAC de 192.168.1.20', 'Il interroge le DNS', 'Il demande au serveur DHCP'], ok: 1, why: 'ARP sert exactement à traduire une IP du même réseau en MAC. Le DNS traduit des noms en IP, pas des IP en MAC.' },
                      f: 0, t: 1, msg: 'ARP Request (broadcast)', champs: [['MAC source', 'AA'], ['MAC destination', 'FF:FF:FF:FF:FF:FF'], ['Question', 'Qui a 192.168.1.20 ? Répondre à 192.168.1.10']], note: 'La demande est diffusée : tout le domaine de broadcast la reçoit, mais seul le poste qui porte cette IP répond.' },
                    { f: 1, t: 0, msg: 'ARP Reply (unicast)', champs: [['MAC source', 'BB'], ['MAC destination', 'AA'], ['Réponse', '192.168.1.20 est à la MAC BB']], note: 'La réponse est directe : B connaît déjà la MAC de A grâce à la demande.' },
                    { f: 0, t: 1, msg: 'ICMP Echo Request (le ping)', champs: [['MAC destination', 'BB'], ['IP destination', '192.168.1.20']], note: 'A garde la correspondance IP → MAC dans son cache ARP (un temps limité) : le prochain paquet part sans nouvelle demande.', etat: ['cache ARP : 192.168.1.20 → BB', ''] }
                  ] },
                { nom: 'Cible hors du réseau (Internet)', actors: ['PC-A<br><small>192.168.1.10 · MAC AA</small>', 'Passerelle<br><small>192.168.1.1 · MAC GW</small>'],
                  steps: [
                    { q: { ask: 'PC-A veut joindre 8.8.8.8, hors de son réseau. De quelle adresse MAC a-t-il besoin pour construire sa trame ?', opts: ['Celle de 8.8.8.8', 'Celle de sa passerelle par défaut', 'Celle de son serveur DNS', 'Celle du switch'], ok: 1, why: 'Une adresse MAC ne sort jamais du réseau local. Pour une destination distante, la trame est adressée à la passerelle, qui fait suivre.' },
                      f: 0, t: 1, msg: 'ARP Request (broadcast)', champs: [['MAC destination', 'FF:FF:FF:FF:FF:FF'], ['Question', 'Qui a 192.168.1.1 ? (la passerelle, pas 8.8.8.8)']], note: 'A applique son masque : 8.8.8.8 n’est pas dans 192.168.1.0/24, donc il cherche la MAC de la passerelle.' },
                    { f: 1, t: 0, msg: 'ARP Reply (unicast)', champs: [['Réponse', '192.168.1.1 est à la MAC GW']], note: '' },
                    { f: 0, t: 1, msg: 'Paquet vers Internet', champs: [['IP destination', '8.8.8.8'], ['MAC destination', 'GW']], note: 'L’IP de destination ne change pas de bout en bout ; la MAC de destination change à chaque saut. C’est ce qui fait la différence entre adressage logique (IP) et physique (MAC).', etat: ['cache ARP : 192.168.1.1 → GW', ''] }
                  ] }
            ]
        },
        dhcp: {
            titre: 'DHCP — obtenir une adresse (DORA)',
            lien: ['reseau-bases', 'Réseau : les bases'],
            intro: 'Un poste qui démarre n’a ni adresse ni idée de qui est le serveur. Quatre messages règlent ça : Discover, Offer, Request, Ack.',
            variantes: [{ nom: 'Obtention d’un bail', actors: ['Client<br><small>pas encore d’IP</small>', 'Serveur DHCP<br><small>192.168.1.1</small>'],
                steps: [
                    { q: { ask: 'Le client démarre sans adresse IP. Pourquoi son premier message (Discover) est-il envoyé en broadcast ?', opts: ['Il ne connaît pas encore l’adresse du serveur DHCP', 'Pour économiser de la bande passante', 'Parce que DHCP utilise TCP', 'Parce que le switch l’impose'], ok: 0, why: 'Le client ne sait ni qui est le serveur ni quelle adresse utiliser : il crie « y a-t-il un serveur DHCP ? » à tout le réseau.' },
                      f: 0, t: 1, msg: '1 · DHCPDISCOVER', champs: [['IP source', '0.0.0.0 (port UDP 68)'], ['IP destination', '255.255.255.255 (port UDP 67)'], ['MAC destination', 'FF:FF:FF:FF:FF:FF']], note: 'Broadcast : « Y a-t-il un serveur DHCP ? ».', etat: ['recherche un serveur', 'écoute'] },
                    { f: 1, t: 0, msg: '2 · DHCPOFFER', champs: [['Adresse proposée', '192.168.1.50'], ['Masque', '255.255.255.0'], ['Passerelle', '192.168.1.1'], ['DNS', '192.168.1.1'], ['Durée du bail', 'par ex. 8 h']], note: 'Le serveur propose une adresse et les paramètres du réseau, et la met de côté un instant. Plusieurs serveurs peuvent répondre.', etat: ['reçoit l’offre', 'adresse réservée'] },
                    { q: { ask: 'Le client accepte l’offre. Pourquoi sa Request est-elle encore diffusée en broadcast ?', opts: ['Pour que les autres serveurs sachent que leur offre n’est pas retenue', 'Parce qu’il n’a toujours pas de MAC', 'Parce que l’IP est inconnue du switch', 'Il n’y a aucune raison particulière'], ok: 0, why: 'Si deux serveurs ont répondu, la Request nomme le serveur choisi ; les autres libèrent l’adresse qu’ils avaient réservée.' },
                      f: 0, t: 1, msg: '3 · DHCPREQUEST', champs: [['Demande', '192.168.1.50'], ['Serveur choisi', '192.168.1.1'], ['Destination', 'broadcast']], note: 'Demande officielle de l’adresse retenue.' },
                    { f: 1, t: 0, msg: '4 · DHCPACK', champs: [['Confirmation', '192.168.1.50 pour 8 h']], note: 'Le bail est enregistré côté serveur ; le client configure son interface.', etat: ['IP configurée : 192.168.1.50', 'bail enregistré'] },
                    { f: 0, t: 1, msg: 'Plus tard : renouvellement', champs: [['À 50 % du bail', 'demande de renouvellement au serveur (unicast)'], ['À 87,5 %', 'sans réponse, nouvelle tentative en broadcast']], note: 'Si aucun serveur ne répond du tout au démarrage, le poste s’attribue une adresse en 169.254.x.x (APIPA) : c’est le signe que le DHCP est injoignable.' }
                ] }]
        },
        tcp: {
            titre: 'TCP — ouvrir et fermer une connexion',
            lien: ['reseau-bases', 'Réseau : les bases'],
            intro: 'TCP numérote chaque octet et s’assure de la remise. Avant d’échanger, les deux côtés s’accordent par une poignée de main en trois temps.',
            variantes: [
                { nom: 'Connexion réussie', actors: ['Client<br><small>port éphémère</small>', 'Serveur<br><small>port 443</small>'],
                  steps: [
                    { f: 0, t: 1, msg: 'SYN', champs: [['Drapeaux', 'SYN'], ['Numéro de séquence', 'x (initial, choisi par le client)']], note: 'Le client demande l’ouverture et annonce son numéro de départ.', etat: ['SYN_SENT', 'LISTEN'] },
                    { q: { ask: 'Le serveur accepte. Que contient sa réponse ?', opts: ['Seulement un ACK', 'SYN et ACK ensemble, avec ack = x+1', 'Un FIN', 'Les données demandées'], ok: 1, why: 'Il accuse réception du SYN (ack = x+1) ET annonce son propre numéro de départ (SYN) : c’est le SYN-ACK.' },
                      f: 1, t: 0, msg: 'SYN-ACK', champs: [['Drapeaux', 'SYN + ACK'], ['Séquence', 'y (initial du serveur)'], ['Acquittement', 'x + 1']], note: '', etat: ['SYN_SENT', 'SYN_RECEIVED'] },
                    { f: 0, t: 1, msg: 'ACK', champs: [['Drapeaux', 'ACK'], ['Acquittement', 'y + 1']], note: 'Trois segments : la connexion est établie des deux côtés, on peut échanger des données.', etat: ['ESTABLISHED', 'ESTABLISHED'] },
                    { f: 0, t: 1, msg: 'Données (par ex. une requête HTTPS)', champs: [['Drapeaux', 'PSH + ACK']], note: 'Chaque segment de données est acquitté ; un segment perdu est renvoyé après un délai.' },
                    { f: 0, t: 1, msg: 'FIN', champs: [['Drapeaux', 'FIN + ACK']], note: 'Fermeture : chaque sens se ferme séparément, d’où quatre segments.', etat: ['FIN_WAIT_1', 'ESTABLISHED'] },
                    { f: 1, t: 0, msg: 'ACK', champs: [['Drapeaux', 'ACK']], note: '', etat: ['FIN_WAIT_2', 'CLOSE_WAIT'] },
                    { f: 1, t: 0, msg: 'FIN', champs: [['Drapeaux', 'FIN + ACK']], note: 'Le serveur ferme à son tour quand son application a fini.', etat: ['FIN_WAIT_2', 'LAST_ACK'] },
                    { f: 0, t: 1, msg: 'ACK', champs: [['Drapeaux', 'ACK']], note: 'Le client reste un moment en TIME_WAIT (quelques dizaines de secondes à quelques minutes selon le système) pour absorber d’éventuels segments retardataires.', etat: ['TIME_WAIT', 'CLOSED'] }
                  ] },
                { nom: 'Port fermé ou filtré', actors: ['Client', 'Serveur'],
                  steps: [
                    { f: 0, t: 1, msg: 'SYN vers un port où personne n’écoute', champs: [['Drapeaux', 'SYN']], note: '', etat: ['SYN_SENT', 'aucun service en écoute'] },
                    { q: { ask: 'Le serveur est joignable mais aucun service n’écoute sur ce port. Que répond son système ?', opts: ['Rien du tout', 'RST (réinitialisation) : « connexion refusée »', 'Un SYN-ACK quand même', 'Un message ICMP de bienvenue'], ok: 1, why: 'Hôte joignable + port fermé = RST immédiat, le client voit « connection refused ». Rien du tout, c’est le comportement d’un pare-feu qui jette les paquets.' },
                      f: 1, t: 0, msg: 'RST + ACK', champs: [['Drapeaux', 'RST + ACK']], note: 'Réponse immédiate : « refusé ». Un outil comme Test-NetConnection ou telnet échoue tout de suite.', etat: ['CLOSED', 'aucun service en écoute'] },
                    { q: { ask: 'Un test de connexion se termine par « timed out » (aucune réponse). Quelle est la cause la plus probable ?', opts: ['Un pare-feu élimine silencieusement les paquets (DROP)', 'Le service est arrêté sur un hôte joignable', 'Le port est ouvert', 'Le mot de passe est faux'], ok: 0, why: 'Service arrêté → RST immédiat (« refused »). Délai sans aucune réponse → un équipement filtre en silence, ou l’hôte est injoignable. Distinguer les deux accélère le dépannage.' },
                      f: 0, t: 1, msg: 'Si un pare-feu filtre : aucune réponse', champs: [['Constat', 'le SYN est renvoyé plusieurs fois, puis l’outil abandonne']], note: 'À retenir pour le dépannage : refusé = hôte vivant, service absent ; expiré = filtrage ou hôte injoignable.' }
                  ] }
            ]
        },
        dns: {
            titre: 'DNS — résoudre un nom',
            lien: ['reseau-bases', 'Réseau : les bases'],
            intro: 'Le poste demande à un résolveur, qui interroge la hiérarchie du DNS : racine, domaine de premier niveau, puis serveur qui fait autorité.',
            variantes: [{ nom: 'Résolution récursive de www.exemple.fr', actors: ['Poste', 'Résolveur<br><small>DNS du réseau</small>', 'Racine<br><small>.</small>', 'TLD<br><small>.fr</small>', 'Autoritaire<br><small>exemple.fr</small>'],
                steps: [
                    { f: 0, t: 1, msg: 'Quelle est l’adresse de www.exemple.fr ?', champs: [['Type', 'A (IPv4)'], ['Récursion', 'demandée']], note: 'Le poste ne fait aucune recherche lui-même : il délègue au résolveur configuré (par DHCP, souvent).' },
                    { q: { ask: 'Le résolveur n’a rien en cache. Par qui commence-t-il sa recherche ?', opts: ['Un serveur racine', 'Directement le serveur autoritaire', 'Le serveur du TLD .fr', 'Le poste, qui sait peut-être'], ok: 0, why: 'Il connaît la liste des serveurs racine (root hints). La racine ne connaît pas www.exemple.fr, mais sait qui gère « .fr ».' },
                      f: 1, t: 2, msg: 'www.exemple.fr ?', champs: [], note: '' },
                    { f: 2, t: 1, msg: 'Je ne sais pas, voici les serveurs de .fr', champs: [['Réponse', 'délégation (enregistrements NS) vers .fr']], note: 'Un renvoi, pas une réponse finale.' },
                    { f: 1, t: 3, msg: 'www.exemple.fr ?', champs: [], note: '' },
                    { f: 3, t: 1, msg: 'Voici les serveurs de exemple.fr', champs: [['Réponse', 'délégation vers les serveurs autoritaires']], note: '' },
                    { f: 1, t: 4, msg: 'www.exemple.fr ?', champs: [], note: '' },
                    { f: 4, t: 1, msg: 'www.exemple.fr = 203.0.113.10', champs: [['Réponse', 'A 203.0.113.10'], ['TTL', '3600 s (exemple)']], note: 'Réponse « faisant autorité » : c’est la source officielle de la zone.' },
                    { f: 1, t: 0, msg: 'www.exemple.fr = 203.0.113.10', champs: [['Mise en cache', 'le résolveur garde la réponse pendant le TTL']], note: 'Une seconde demande, pendant le TTL, ne refait pas tout ce parcours : elle est servie depuis le cache. Après avoir modifié un enregistrement, il faut donc parfois attendre l’expiration du TTL (ou vider le cache avec ipconfig /flushdns côté poste).' }
                ] }]
        }
    };

    var ordre = ['switch', 'arp', 'dhcp', 'tcp', 'dns'];
    var titres = { switch: 'Switch : table MAC & VLAN' };
    ordre.forEach(function (k) { if (SCEN[k]) titres[k] = SCEN[k].titre.split(' — ')[0] + ' — ' + SCEN[k].titre.split(' — ')[1]; });
    var cur = 'switch';

    /* ══════════════ Déroulé pas à pas ══════════════ */
    function runScenario(key, vi) {
        var S = SCEN[key], V = S.variantes[vi || 0], n = V.actors.length, pos = 0, asked = false, ok = 0, tot = 0;
        var out = host.querySelector('.sim__body');
        out.innerHTML = '<p class="sim__intro">' + esc(S.intro) + '</p>' +
            (S.variantes.length > 1 ? '<div class="glo__doms sim__vars" role="group" aria-label="Variante">' + S.variantes.map(function (v, k) {
                return '<button type="button" class="srs__chip" data-var="' + k + '" aria-pressed="' + (k === (vi || 0) ? 'true' : 'false') + '">' + esc(v.nom) + '</button>'; }).join('') + '</div>' : '') +
            '<div class="seq" style="--n:' + n + '"><div class="seq__actors">' + V.actors.map(function (a) { return '<div class="seq__actor">' + a + '</div>'; }).join('') + '</div>' +
            '<div class="seq__etat" hidden></div><div class="seq__msgs"></div></div>' +
            '<div class="sim__ask" hidden></div><div class="sim__ctl"><button type="button" class="btn btn--primary sim__next"></button> <button type="button" class="btn btn--ghost sim__reset">Recommencer</button><span class="sim__score" aria-live="polite"></span></div>';
        var msgs = out.querySelector('.seq__msgs'), ask = out.querySelector('.sim__ask'), nextB = out.querySelector('.sim__next'), etat = out.querySelector('.seq__etat'), score = out.querySelector('.sim__score');

        function label() { nextB.textContent = pos >= V.steps.length ? 'Terminé' : (pos === 0 ? 'Commencer' : 'Étape suivante'); nextB.disabled = pos >= V.steps.length; }
        function reveal(st) {
            var a = Math.min(st.f, st.t) + 1, b = Math.max(st.f, st.t) + 2, dir = st.f < st.t ? 'ltr' : 'rtl';
            var row = document.createElement('div');
            row.className = 'seq__row';
            row.innerHTML = '<div class="seq__msg seq__msg--' + dir + '" style="grid-column:' + a + ' / ' + b + '"><span class="seq__label">' + esc(st.msg) + '</span></div>' +
                ((st.champs && st.champs.length) || st.note ? '<div class="seq__detail">' + (st.champs && st.champs.length ? '<dl>' + st.champs.map(function (c) { return '<div><dt>' + esc(c[0]) + '</dt><dd>' + esc(c[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
                (st.note ? '<p>' + esc(st.note) + '</p>' : '') + '</div>' : '');
            msgs.appendChild(row);
            row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            if (st.etat) {
                etat.hidden = false;
                etat.innerHTML = st.etat.map(function (e, k) { return e ? '<div class="seq__st" style="grid-column:' + (k + 1) + '"><b>' + esc(e) + '</b></div>' : ''; }).join('');
            }
        }
        function step() {
            var st = V.steps[pos];
            if (!st) return;
            if (st.q && !asked) {
                asked = true;
                ask.hidden = false;
                ask.innerHTML = '<p class="sim__q"><b>Devine avant de regarder.</b> ' + esc(st.q.ask) + '</p><ul class="dojo__opts">' +
                    st.q.opts.map(function (o, k) { return '<li><button type="button" class="dojo__opt" data-k="' + k + '"><span class="opt__key">' + 'ABCD'.charAt(k) + '</span><span>' + esc(o) + '</span></button></li>'; }).join('') + '</ul><div class="dojo__fb" aria-live="polite"></div>';
                nextB.disabled = true;
                return;
            }
            asked = false;
            ask.hidden = true;
            reveal(st);
            pos++;
            label();
        }
        ask.addEventListener('click', function (ev) {
            var b = ev.target.closest('.dojo__opt');
            if (!b || ask.querySelector('.dojo__opt:disabled')) return;
            var st = V.steps[pos], k = +b.getAttribute('data-k'), good = k === st.q.ok;
            ask.querySelectorAll('.dojo__opt').forEach(function (x, i) { x.disabled = true; if (i === st.q.ok) x.classList.add('is-right'); else if (i === k) x.classList.add('is-wrong'); });
            var fb = ask.querySelector('.dojo__fb');
            fb.className = 'dojo__fb ' + (good ? 'is-ok' : 'is-ko');
            fb.innerHTML = '<p class="dojo__verdict">' + (good ? 'Juste.' : 'Pas tout à fait.') + '</p><p>' + esc(st.q.why) + '</p>';
            tot++; if (good) ok++;
            score.textContent = 'Prédictions : ' + ok + ' / ' + tot;
            credit();
            nextB.disabled = false; nextB.textContent = 'Voir ce qui se passe';
            nextB.focus();
        });
        nextB.addEventListener('click', step);
        out.querySelector('.sim__reset').addEventListener('click', function () { runScenario(key, vi); });
        out.querySelectorAll('[data-var]').forEach(function (b) { b.addEventListener('click', function () { runScenario(key, +b.getAttribute('data-var')); }); });
        label();
    }

    /* ══════════════ Le switch ══════════════ */
    function runSwitch() {
        var PCS = [{ n: 'PC-A', mac: 'AA', port: 1 }, { n: 'PC-B', mac: 'BB', port: 2 }, { n: 'PC-C', mac: 'CC', port: 3 }, { n: 'PC-D', mac: 'DD', port: 4 }];
        var vlan = { 1: 10, 2: 10, 3: 10, 4: 10 };
        var table = {};       // "vlan:mac" -> port
        var ok = 0, tot = 0, sent = 0, last = null;
        var out = host.querySelector('.sim__body');

        function draw() {
            var rows = Object.keys(table).sort().map(function (k) {
                var p = k.split(':');
                return '<tr' + (last && last.learned === k ? ' class="is-new"' : '') + '><td>VLAN ' + p[0] + '</td><td>' + p[1] + '</td><td>Port ' + table[k] + '</td></tr>';
            }).join('') || '<tr><td colspan="3" class="sim__empty">Table vide : le switch n’a encore rien appris.</td></tr>';
            var ports = PCS.map(function (pc) {
                var cls = 'sw__port';
                if (last) { if (last.in === pc.port) cls += ' is-in'; else if (last.out.indexOf(pc.port) > -1) cls += ' is-out'; else cls += ' is-off'; }
                return '<div class="' + cls + '"><span class="sw__pc">' + pc.n + '<small>MAC ' + pc.mac + '</small></span><span class="sw__line"></span><span class="sw__num">Port ' + pc.port + '<small>VLAN ' + vlan[pc.port] + '</small></span></div>';
            }).join('');
            out.querySelector('.sw__ports').innerHTML = ports;
            out.querySelector('.sw__table tbody').innerHTML = rows;
        }
        out.innerHTML =
            '<p class="sim__intro">Un switch apprend en regardant : à chaque trame reçue, il note « cette adresse MAC source est derrière ce port ». Pour décider où envoyer, il consulte cette table. Envoie des trames, <b>devine</b> ce qu’il fait, puis regarde.</p>' +
            '<div class="sw"><div class="sw__ports"></div>' +
            '<div class="sw__side"><table class="sw__table"><caption>Table d’adresses MAC du switch</caption><thead><tr><th>VLAN</th><th>MAC</th><th>Port</th></tr></thead><tbody></tbody></table>' +
            '<div class="sw__vlan"><span>VLAN :</span> <button type="button" class="srs__chip" data-vlan="1" aria-pressed="true">Tous dans le VLAN 10</button> <button type="button" class="srs__chip" data-vlan="2" aria-pressed="false">C et D dans le VLAN 20</button></div></div></div>' +
            '<form class="sw__form"><div class="sw__pair"><label>De <select name="src">' + PCS.map(function (p) { return '<option value="' + p.port + '">' + p.n + '</option>'; }).join('') + '</select></label>' +
            '<label>Vers <select name="dst">' + PCS.map(function (p, i) { return '<option value="' + p.port + '"' + (i === 1 ? ' selected' : '') + '>' + p.n + '</option>'; }).join('') + '<option value="bc">Broadcast (tous)</option></select></label></div>' +
            '<fieldset class="sw__guess"><legend>Que va faire le switch ?</legend>' +
            '<label><input type="radio" name="g" value="flood"> Inonder : copie sur tous les ports (sauf l’entrée)</label>' +
            '<label><input type="radio" name="g" value="unicast"> Transmettre au seul port du destinataire</label>' +
            '<label><input type="radio" name="g" value="drop"> Jeter la trame</label></fieldset>' +
            '<div><button type="submit" class="btn btn--primary">Envoyer la trame</button> <button type="button" class="btn btn--ghost sw__aging">Vider la table (expiration)</button> <span class="sim__score" aria-live="polite"></span></div></form>' +
            '<div class="sim__ask sw__result" hidden></div>' +
            '<p class="sim__hint">Pour commencer : A → B (B est inconnu), puis B → A (A est connu maintenant), puis essaie le broadcast, puis sépare les VLAN.</p>';
        draw();

        var form = out.querySelector('.sw__form'), res = out.querySelector('.sw__result'), sc = out.querySelector('.sim__score');
        out.querySelectorAll('[data-vlan]').forEach(function (b) {
            b.addEventListener('click', function () {
                var two = b.getAttribute('data-vlan') === '2';
                vlan = two ? { 1: 10, 2: 10, 3: 20, 4: 20 } : { 1: 10, 2: 10, 3: 10, 4: 10 };
                table = {}; last = null; res.hidden = true;
                out.querySelectorAll('[data-vlan]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
                draw();
            });
        });
        out.querySelector('.sw__aging').addEventListener('click', function () { table = {}; last = null; res.hidden = true; draw(); });

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var src = +form.src.value, dstV = form.dst.value, bc = dstV === 'bc', dst = bc ? 0 : +dstV;
            var guess = (form.g.value || '');
            if (!bc && dst === src) { res.hidden = false; res.innerHTML = '<p>Choisis une destination différente de l’émetteur.</p>'; return; }
            var v = vlan[src], srcMac = PCS[src - 1].mac, dstMac = bc ? 'FF:FF:FF:FF:FF:FF' : PCS[dst - 1].mac;
            var learned = v + ':' + srcMac, why = [];
            var isNew = !(learned in table) || table[learned] !== src;
            table[learned] = src;
            why.push(isNew ? 'Le switch <b>apprend</b> : la MAC ' + srcMac + ' est derrière le port ' + src + ' (VLAN ' + v + ').' : 'La MAC source ' + srcMac + ' était déjà connue sur ce port : l’entrée est rafraîchie.');
            var out2 = [], action;
            var sameVlan = [1, 2, 3, 4].filter(function (p) { return p !== src && vlan[p] === v; });
            if (bc) { action = 'flood'; out2 = sameVlan; why.push('Destination broadcast : le switch copie la trame sur <b>tous les ports du même VLAN</b> (' + (sameVlan.length ? sameVlan.map(function (p) { return p; }).join(', ') : 'aucun') + ').'); }
            else if ((v + ':' + dstMac) in table) { action = 'unicast'; out2 = [table[v + ':' + dstMac]]; why.push('La destination ' + dstMac + ' est dans la table (port ' + out2[0] + ') : la trame part <b>uniquement</b> vers ce port. C’est ce qui sépare un switch d’un hub.'); }
            else { action = 'flood'; out2 = sameVlan; why.push('La destination ' + dstMac + ' est <b>inconnue</b> du switch dans ce VLAN : il fait de l’« unknown unicast flooding », comme pour un broadcast, sur les ports du VLAN ' + v + ' (' + (sameVlan.length ? sameVlan.join(', ') : 'aucun') + ').'); }
            var delivered = bc ? sameVlan : (out2.indexOf(dst) > -1 ? [dst] : []);
            if (!bc && delivered.length === 0) why.push('<b>Personne ne répond</b> : ' + PCS[dst - 1].n + ' est dans un autre VLAN. Un switch ne passe jamais d’un VLAN à l’autre : il faut un routeur (ou un switch de niveau 3).');
            else if (action === 'flood' && !bc) why.push('Seul ' + PCS[dst - 1].n + ' reconnaît sa MAC et répond ; sa réponse apprendra sa position au switch.');
            last = { in: src, out: out2, learned: learned };
            sent++;
            var verdict = '';
            if (guess) {
                tot++;
                var good = guess === action;
                if (good) ok++;
                verdict = '<p class="dojo__verdict ' + (good ? 'is-ok' : 'is-ko') + '">' + (good ? 'Bien vu.' : 'Raté — ' + (action === 'flood' ? 'il inonde' : 'il envoie à un seul port') + '.') + '</p>';
                sc.textContent = 'Prédictions : ' + ok + ' / ' + tot;
                credit();
            } else verdict = '<p class="sim__hint">Astuce : choisis une prédiction avant d’envoyer, c’est elle qui fait retenir.</p>';
            form.querySelectorAll('input[name="g"]').forEach(function (r) { r.checked = false; });
            res.hidden = false;
            res.innerHTML = verdict + '<ol class="sim__why"><li>' + why.join('</li><li>') + '</li></ol>';
            draw();
        });
    }

    /* ══════════════ Cadre ══════════════ */
    function open(key) {
        cur = key;
        host.querySelectorAll('[data-sim]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-sim') === key ? 'true' : 'false'); });
        if (key === 'switch') { runSwitch(); return; }
        runScenario(key, 0);
        var S = SCEN[key];
        var rel = document.createElement('p');
        rel.className = 'sim__rel';
        rel.innerHTML = 'À approfondir : <a href="modules/' + S.lien[0] + '.html">' + esc(S.lien[1]) + '</a>';
        host.querySelector('.sim__body').appendChild(rel);
    }
    host.innerHTML = '<div class="glo__doms sim__tabs" role="group" aria-label="Simulateur">' + ordre.map(function (k) {
        return '<button type="button" class="srs__chip" data-sim="' + k + '" aria-pressed="false">' + esc(titres[k]) + '</button>'; }).join('') + '</div><div class="sim__body"></div>';
    host.querySelector('.sim__tabs').addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-sim]');
        if (b) { history.replaceState(null, '', '#' + b.getAttribute('data-sim')); open(b.getAttribute('data-sim')); }
    });
    var h = location.hash.replace('#', '');
    open(ordre.indexOf(h) > -1 ? h : 'switch');
})();
