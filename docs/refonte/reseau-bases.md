# Refonte — reseau-bases (niveau A, lots 1 et 2)

**Changé.** Les 12 chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé `.walk`, « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Textes, terminaux, `verify` et « Question éclair » conservés. Lot 2 : `dns`, `dhcp`, `routage`, `ipv6`, `vlan-wifi`, `voyage`. Au chapitre 09, le NAT remonte avant le « Vérifier ». Le chapitre 12 garde son pas à pas (bloc 5) et le lab Wireshark ; il n'est **pas** `notion`, car il comporte de la pratique.

**Bloc 10.** `section#livrable` avec `.lab[data-lab="livrable-reseau-bases"]` (6 étapes : capture, ARP/DNS, TCP/TLS, schéma annoté, fiche d'une page, relecture) avant le test.

**Catalogue et durées.** `duree` 5 h → 7 h 15 (somme des durées annoncées des 12 chapitres, 6 h 15, plus le livrable 1 h ; estimée, non mesurée) ; `chapters` reste 12. Hero et `index.html` mis à jour.

**Sources citées** (HTTP 200) : RFC 1034, 2131, 1812, 3022, 1918, 8200, 4291, 5952 ; IEEE 802.1Q ; Wi-Fi Alliance (sécurité).

**Reconstitué.** Aucun `data-reconstitue`. `.verify` sans sortie réelle (`data-constat`) : chapitres 01, 02 (lot 1), 11 (écran Wi-Fi) et 12 (constat Wireshark). Valeurs d'exemple (VLAN 10/20, `192.168.10.0/24`) non testées, hors commande.

**Questions ajoutées au lot 2** (7, `quiz-data.js`) : ordre de résolution DNS, connexion entrante et NAT, NDP, VLAN sans routeur, ordre des étapes d'une requête, changements après la box, symptôme vers étape. Au total, au moins une question par objectif des 12 chapitres.

**Glossaire** : résolveur DNS, CNAME, MX, étendue DHCP, PAT, adresse lien local, port access, SSID, SNI.

**Limites.** `192.168.1.x` conservé (chapitres 02, 04, 05, 07, 08, 09, 12). Le lint garde 60 avertissements (IP de documentation `203.0.113.x` etc.). Playwright : zéro erreur console, un `scenario__opt` et un `reveal` cliqués.
