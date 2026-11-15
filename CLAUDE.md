# Centre d'apprentissage IT — site publié

Site statique (HTML, CSS et JavaScript natifs, sans dépendance) servi par GitHub Pages. Il réunit des
modules de cours IT en parcours, avec labs, exercices, scénarios de panne, tests, examens et révision
espacée. Réponds en français.

## Ce dépôt est une sortie générée

- **La source est dans le dépôt privé `cours`, dossier `site/`.** Ce dépôt-ci en est la copie publiée,
  fabriquée par `node site/outils/publie.js <dossier> [--dry]` (lance d'abord `construit.js --verif`,
  refuse de publier si un lien est cassé ou si un motif sensible apparaît, ne fait aucun `git`).
- **N'édite pas ici le contenu du site** : la prochaine publication écrase tout, sauf `.git` et ce
  `CLAUDE.md`. Un correctif urgent fait ici doit être reporté dans la source, puis republié.
- **Fichiers générés, jamais édités à la main** : `assets/catalogue.js`, `assets/search-index.js`,
  `assets/glossaire.js`, `assets/commandes.js`, `assets/quiz/*.js` (issus de `assets/quiz-data.js`),
  `sw.js`. Les `?v=<empreinte>` dans les pages sont recalculés par `construit.js` : un asset modifié à la
  main garde son ancienne version en cache (le service worker sert `?v=` en cache d'abord).
- Le dépôt contient seulement : les pages à la racine, `assets/`, `modules/`, `sw.js`,
  `manifest.webmanifest`, `.nojekyll`, ce fichier.

## Ce dépôt est public

Rien de privé ici : ni mot de passe, ni identifiant, ni adresse IP réelle, ni nom de personne ou de
machine réels, ni chemin du dépôt privé. Le lab de référence **Orion** (`orion.local`, `172.16.50.0/24`)
est fictif et peut figurer dans les pages.

## Ce que contient le site

- Les modules, parcours et paliers sont décrits dans `assets/catalogue.js`. Ne recopie jamais un compte
  de modules, de chapitres ou de questions : il dérive du catalogue et des fonds de questions.
- Un module = un fichier `modules/<clé>.html` : chapitres, un test de fin (non compté dans les chapitres),
  prérequis et liens vers les modules voisins.
- Composants de contenu existants : `.terminal`, `.verify` (commande, sortie attendue, quoi faire en cas
  d'écart), `.cmdex` (commande à taper), `.scenario` (panne en QCM à étapes), `.exo` et
  `<details class="reveal">` (une correction se met toujours dans un `reveal`), `.walk` (pas à pas),
  `.takeaway`, `.brief`, `.lab` (étapes à cocher, enregistrées dans le navigateur).
- La progression vit uniquement dans le navigateur de l'apprenant, sous les clés `cai.*`
  (`cai.progress`, `cai.scores`, `cai.labs`, `cai.srs`, `cai.notes`…). **Ne jamais réinitialiser ces clés.**
- **Missions de palier** : `.lab[data-lab="mission-pN"]` dont le nombre de `<li>` est égal à
  `mission.etapes` du palier dans le catalogue ; cocher toutes les étapes est une condition du palier.

## Écrire du contenu pour le site

Direction de la refonte en cours : passer d'un carnet de TP à un **manuel** (« je montre, on fait
ensemble, tu fais seul »). Une leçon présente d'abord la matière (pourquoi, modèle, vocabulaire), puis un
exemple travaillé, une pratique guidée avec « Vérifier », un « À toi » puis une variante sans indice,
une panne dont la cause n'est pas donnée, enfin un « À retenir ». Les modules finissent par une mission
qui exige un livrable (ticket, runbook, plan, post-mortem). Le détail des blocs par niveau d'effort est
dans le dépôt source, `site/rapports/PLAN-REFONTE-2026-11.md`.

Règles de fond :
- **Rien d'inventé.** Pas de commande « plausible », pas de sortie fabriquée : une sortie attendue vient
  d'une exécution réelle. Une commande reconstituée est signalée comme telle. Toute affirmation technique
  nouvelle cite sa source officielle en encadré ; la doc sert à vérifier ou corriger, pas à combler un
  trou en silence.
- Un terme nouveau est défini à sa première apparition (infobulle du glossaire).
- Une adresse ou un nom de machine d'un module Windows vient du plan Orion (`labo.html`).
- Après toute modification de la source : `node site/outils/construit.js`, puis `--verif`, puis
  `node site/outils/verif-portail/verifie.js` (contrôle dans un vrai navigateur), le tout dans `cours`.

## Publier

Depuis `cours` : `node site/outils/publie.js <clone de ce dépôt> --dry` pour contrôler, puis sans
`--dry`, puis `git add -A`, `git commit`, `git push` ici. Ne publie jamais sans accord explicite.
Branche de travail et règles de commit : celles de la session.
