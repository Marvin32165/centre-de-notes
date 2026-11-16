# Refonte — module depannage-reseau (niveau A)

**Changé.** Les 8 chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle (sans terminal), exemple travaillé (`.walk`, existant balisé ou nouveau), « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc (les « Question éclair » le précèdent). Bloc 10 : `.lab[data-lab="livrable-depannage-reseau"]` (6 étapes : ticket d'incident + 3 messages à l'utilisateur), section `#livrable` avant le test. Catalogue, hero et `index.html` : durée 3 h → 5 h (somme des durées annoncées + livrable), `chapters` 8. Glossaire : ARP, APIPA, RST, CRC, err-disabled, BPDU Guard, Bottom-up.

**Pannes (bloc 8)**, de symptôme vers cause : NAT de l'hôte Orion (01), conflit d'adresse IP (02), route par défaut absente (03), interface `administratively down` (04), DHCP Discover sans Offer (05), horloge et Kerberos (06), MTU par VPN (07), ticket « redémarré, ça marche » (08).

**Sources citées** (HTTP 200, affirmations retrouvées dans les pages) : RFC 9293 (§ 3.5.2, RST), RFC 6298, RFC 3927, RFC 1191, Microsoft Learn Get-NetConnectionProfile, manuels ip-route et ss, Cisco (Status / line protocol).

**Reconstitué.** Aucun `data-reconstitue`. Les `.verify` sans sortie réelle sont des constats (`data-constat`) ; seules les sorties déjà dans le module (`ip route get`, `show ip interface brief`) sont reprises.

**Question ajoutée** (1, `quiz-data.js`) : message à l'utilisateur pendant l'incident (ch. 08). Intro du test sans compte figé. Les autres objectifs sont couverts par des questions existantes.

**Limites.**
- `192.168.1.x` conservés, non transposés : ch. 02 (`.1`), 03 (`.1`, `.50`), 05 (`.10`, `.25`). Avertissements lint `1.1.1.1` et `8.8.8.8` : déjà présents.
- Les causes des pannes 01 (NAT) et 05 (DHCP) sont annoncées « à confirmer » : non testées sur un lab réel.
- Durée de 5 h estimée, non mesurée.
