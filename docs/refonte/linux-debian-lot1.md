# Refonte — linux-debian, lot 1 (chap1 à chap6)

**Changé.** Les six chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé `.walk`, « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Textes, terminaux et avertissements conservés. Au chapitre 2, « Pourquoi ça marche » est déplacé dans le modèle ; au chapitre 3, l'arbre `/` reste entre le pourquoi et le modèle (un `.terminal` ne va pas dans le bloc 4).

**Sources citées** (HTTP 200) : Debian releases, Debian Wiki (LTS, sudo, FHS), sudoers(5), groups(1), hier(7), glob(7), less(1), grep(1), inode(7), symlink(7), link(2).

**Reconstitué** (`data-reconstitue`, 6) : chap2 (1), chap3 (1), chap4 (1), chap5 (2), chap6 (1). `.verify` sans sortie réelle (`data-constat`) : les six chapitres. Pannes : chap1 et chap5 reprennent le module (lsb-release, vim) ; les autres sont nouvelles, expliquées par les avertissements existants ou une source.

**Théorie nouvelle** : une session garde ses groupes (groups(1)) ; le shell développe les jokers (glob(7)).

**Glossaire** : distribution, noyau, LTS, chemin absolu/relatif, point de montage, joker, lien physique/symbolique.

**Questions ajoutées** (12, `quiz-data.js`) : au moins une par objectif. Le texte d'intro du test dit encore « soixante » questions : à mettre à jour en fin de module.

**Limites.** Aucune `192.168.1.x` dans ce lot. Lint : zéro erreur ni avertissement sur chap1-6. Playwright : zéro erreur console, un `scenario__opt` et un `reveal` cliqués. `construit.js` et `--verif` passent.
