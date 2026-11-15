# Refonte pilote — module hyperv (niveau A)

**Changé.** Les 8 chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé (`.walk`), « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir ». Bloc 10 : `.lab[data-lab="livrable-hyperv"]` avant le test. Texte, terminaux, `verify` et scénarios existants conservés. Catalogue : `duree` 2 h → 5 h, `chapters` 8. Durée du hero mise à jour à la main. Intro du test sans compte figé.

**Sources citées** (Microsoft Learn, relues) : installation Hyper-V, génération 1/2, features-terminology (mémoire dynamique, VHDX, différenciation, session étendue), réseau Hyper-V (3 commutateurs), checkpoints, Sysprep/Generalize (SID, limite 1001, applis Store, journaux Panther), netsh advfirewall et port RDP (URL non rouvertes, déduites des chemins déjà listés).

**Reconstitué.** Aucune commande ni sortie reconstituée (0 `data-reconstitue`). Les `.verify` des chapitres 02 à 05, 07 et 08 sont des constats d'interface, sans `verify__out`. Les corrections des « À toi » adaptent des commandes du module (noms, tailles changés) : signalé dans les reveals.

**Questions ajoutées** (5, dans `quiz-data.js`) : Windows 11 en génération 1 (ch. 02), session étendue (03), disque d'un labo durable (06), journaux Sysprep/Panther (05), suppression des `.avhdx` (08). Les autres objectifs sont couverts par des questions existantes.

**Limites du gabarit / lint.**
- Le lint ne vérifie que la présence des attributs `data-bloc` : un bloc 6 sans sortie passe. Proposer d'exiger `verify__out` ou une mention explicite « constat ».
- Le gabarit ne dit pas où placer le « À retenir » existant quand il est au milieu du chapitre : préciser « en dernier ».
- Plan Orion : les chapitres 04 et 06 gardent `192.168.1.x` (existant) ; à aligner sur `labo.html`.

**Effort.** Un module, 8 chapitres, un `Edit` par bloc d'insertion ; lint 0 erreur, build et `--verif` OK, Playwright sans erreur console.
