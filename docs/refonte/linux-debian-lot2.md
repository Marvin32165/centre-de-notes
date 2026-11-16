# Refonte — linux-debian, lot 2 (chap7 à chap10)

**Changé.** Quatre chapitres (ids inchangés) au gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé `.walk`, « Vérifier » (`data-constat`, aucune sortie inventée), « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Textes, terminaux, outils interactifs et questions éclair conservés ; au chap7 et chap8 la question éclair passe avant « À retenir ». Au chap8, l'ancien encadré « À retenir » (`echo $?`) devient un `tip`.

**Sources citées** (HTTP 200) : chmod(1), path_resolution(7), credentials(7), bash(1), sort/uniq/cut/wc/tee(1), regex(7), sed(1), mawk(1).

**Reconstitué** (`data-reconstitue`, 4) : chap7 (chgrp/chmod 2775), chap8 (2), chap9 (1).

**Pannes** : chap7 script sans `x`, chap8 ordre `2>&1`, chap9 `sudo echo >` (module), chap10 `+` sans `-E`.

**Glossaire** : canal (stdin/stdout/stderr), code de sortie, UID, groupe secondaire, SetGID.

**Questions ajoutées** (8, `quiz-data.js`) : au moins une par objectif. Intro du test (« soixante ») à mettre à jour en fin de module.

**Limites.** Aucune `192.168.1.x`. Lint : zéro erreur sur chap7-10. `construit.js` et `--verif` passent. Playwright : zéro erreur console, un `scenario__opt` et un `reveal` cliqués.
