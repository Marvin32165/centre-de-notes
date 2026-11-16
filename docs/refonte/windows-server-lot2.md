# Refonte — windows-server, lot 2 (annuaire, dns, dhcp)

**Changé.** Les trois chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande (tableaux de groupes, de zones et d'éléments DHCP déplacés dans le bloc 4), exemple travaillé `.walk`, « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc (déplacé après la question éclair / le scénario). Textes, terminaux, `verify`, `cmdex`, scénario DHCP et question éclair DNS conservés.

**Sources citées** (HTTP 200, Microsoft Learn) : Active Directory security groups, Delegating administration of account OUs and resource OUs, DNS Server overview, Add-DnsServerForwarder, DHCP Server overview, Add-DhcpServerInDC.

**Reconstitué** (`data-reconstitue` + libellé, 2) : CNAME `partage` (dns), réservation IMP-02 avec MAC et adresse d'exemple (dhcp). Pas de `.verify` sans sortie.

**Glossaire** : AGDLP, Délégation de contrôle, Zone inverse, PTR, Redirecteur DNS, Autorisation DHCP, Réservation DHCP, Option DHCP. Le TTL DNS est défini dans le texte (le terme « TTL » du glossaire désigne le TTL IP).

**Questions** : aucune ajoutée, les 15 existantes (chapitres 05 à 07) couvrent tous les objectifs.

**Limites.** Adresses conformes à `labo.html` (.10, .11, .20, .25, .1) ; aucune `192.168.1.x`. `1.1.1.1` (redirecteur) préexistant. Lint : zéro erreur sur les 3 chapitres. `construit.js` et `--verif` passent. Playwright : zéro erreur console, un `scenario__opt` et un `reveal` cliqués.
