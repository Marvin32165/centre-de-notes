# Refonte — module subnetting (niveau A)

**Changé.** Les 10 chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé (`.walk` ou `ul.steps` existant balisé), « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc (les « Question éclair » existantes le précèdent). Bloc 10 : `.lab[data-lab="livrable-subnetting"]` (6 étapes, dossier d'adressage) avant le test. Catalogue : `duree` 2 h 30 → 6 h (somme des durées annoncées + livrable), `chapters` 10. Durée du hero et intro du test (sans compte figé) mises à jour. Glossaire : octet, masque générique, SLAAC, chevauchement.

**Calculs.** Tous recalculés avec `python3 ipaddress` (réseaux, broadcasts, plages, wildcards, plans VLSM sans chevauchement, plan fautif qui chevauche).

**Sources citées** (HTTP 200, affirmations retrouvées dans le texte) : RFC 950, 4632, 1878, 3021, 1918, 4291, 6177 ; Cisco « Configuring IP Access Lists » (masque générique, `host`, `any`).

**Reconstitué.** 1 terminal `data-reconstitue` : l'ACL fautive du chapitre 08 (ligne du module avec `0.0.0.255` à la place de `0.0.7.255`). Les `.verify` des chapitres 01 à 09 sont des constats sur papier (`data-constat`), sans sortie fabriquée ; seule la sortie `ipcalc` du chapitre 10 est réelle (module existant).

**Questions ajoutées** (4, `quiz-data.js`) : segmentation d'un /24 (ch. 01), octet de masque `11110000` (02), wildcard d'un /28 (08), /64 dans un /60 (09). Les autres objectifs sont couverts par des questions existantes.

**Limites.**
- Warnings du lint : `172.15.0.5` et `172.32.0.1` (ch. 01), volontaires, pour montrer les bornes de `172.16.0.0/12`.
- Les corrections des exercices 3 et 5 du chapitre 07 (existantes) sont verbeuses ; l'exercice 5 reste ambigu sur l'ordre alternatif, non retouché.
- Orion : seul le `/24` et `SRV-FILE01` sont cités ; le découpage en /26 est signalé comme exercice, pas comme plan réel.
- Durée de 6 h estimée, non mesurée.
