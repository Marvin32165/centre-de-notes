# Refonte — reseau-bases, lot 1/2 (chapitres 01 à 06, niveau A)

**Changé.** `reseau`, `modeles`, `ethernet`, `ipv4`, `arp`, `transport` (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé `.walk`, « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Au chapitre 06, la capture de la poignée de main (`.terminal`) sort du bloc 4. Ni bloc 10 ni catalogue.

**Sources citées** (HTTP 200) : RFC 791, 768, 826, 894, 1122, 1812, 1918, 3927, 9293 ; registre de ports IANA.

**Calculs** vérifiés par script.

**Reconstitué.** Aucun terminal `data-reconstitue`. Les `.verify` des chapitres 01 et 02 sont des constats sur papier (`data-constat`), les autres reprennent le module.

**Questions ajoutées** (6, `quiz-data.js`) : temps de transfert (01), inondation (03), lecture de la table MAC (03), ARP vidé (05), ordre de la poignée de main (06), port RDP (06). L'intro du test ne chiffre plus le fonds (« parmi le fonds du module »).

**Glossaire** : OUI, LAN, WAN, table MAC, domaines de collision et de broadcast, cache ARP, TTL, port éphémère, SYN.

**Limites.** `192.168.1.x` conservé (ch. 02, 04, 05). Le lint signale encore les chapitres 07-12 et le bloc 10 (lot 2).
