# Centre d'apprentissage IT

Site statique (HTML, CSS et JavaScript natifs, sans dépendance) servi par GitHub Pages. Il réunit des
modules de cours IT en parcours, avec labs, exercices, scénarios de panne, tests, examens et révision
espacée. Réponds en français.

**Ce dépôt est la seule source du site et sa seule cible de publication.** Les autres dépôts de l'auteur
servent à autre chose : n'y touche pas. Ce dépôt est **public** : rien de privé ici (mot de passe,
identifiant, IP réelle, nom réel de personne ou de machine). Le lab de référence **Orion**
(`orion.local`, `172.16.50.0/24`) est fictif et peut figurer dans les pages.

## Mise en page

Pages à la racine (`index.html`, `labo.html`, `examens.html`…), `modules/<clé>.html` (un module par
fichier), `assets/` (scripts, styles, données), `sw.js`, `manifest.webmanifest`, `outils/`, `docs/`.
Plan de la refonte pédagogique en cours : `docs/PLAN-REFONTE.md` (à lire avant d'écrire du contenu).

## Construire (à lancer après toute modification)

```
node outils/construit.js           # régénère ce qui est généré, recalcule les empreintes ?v=
node outils/construit.js --verif   # échoue si quelque chose est périmé
```
Il régénère `assets/quiz/*.js`, `assets/commandes.js`, `assets/search-index.js`, `assets/glossaire.js` et
`sw.js`. **Ces fichiers ne s'éditent jamais à la main.** Les questions s'écrivent dans
`assets/quiz-data.js`, les termes du glossaire dans `outils/glossaire/termes.txt`. Le service worker sert
les `?v=` en cache d'abord : un asset modifié sans reconstruire garde son ancienne version.
Python 3 est requis. `outils/verif-portail/` (contrôle dans un navigateur) vient d'un autre
agencement de dépôt et n'est **pas utilisable tel quel** ici.

## Contenu

- Modules, parcours et paliers : `assets/catalogue.js` (édité à la main). Ne recopie jamais un compte
  de modules, de chapitres ou de questions : il dérive du catalogue et des fonds de questions.
- Un module = chapitres + un test de fin (non compté dans les chapitres) + prérequis + liens voisins.
- Composants : `.terminal`, `.verify` (commande, sortie attendue, que faire en cas d'écart), `.cmdex`
  (commande à taper), `.scenario` (panne en QCM à étapes), `.exo` et `<details class="reveal">` (une
  correction se met toujours dans un `reveal`), `.walk` (pas à pas), `.takeaway`, `.brief`, `.lab`
  (étapes à cocher, enregistrées dans le navigateur).
- La progression vit dans le navigateur de l'apprenant, sous les clés `cai.*` (`cai.progress`,
  `cai.scores`, `cai.labs`, `cai.srs`, `cai.notes`…). **Ne jamais réinitialiser ces clés.**
- **Missions de palier** : `.lab[data-lab="mission-pN"]` avec autant de `<li>` que `mission.etapes` du
  palier dans le catalogue ; cocher toutes les étapes est une condition du palier. Seule la mission 1
  existe (`labo.html#missions`).
- Les adresses et noms de machine d'un module Windows viennent du plan Orion (`labo.html`).

## Écrire du contenu

Direction : passer d'un carnet de TP à un **manuel** (« je montre, on fait ensemble, tu fais seul »).
Une leçon présente la matière (pourquoi, modèle, vocabulaire), puis un exemple travaillé, une pratique
guidée avec « Vérifier », un « À toi » puis une variante sans indice, une panne dont la cause n'est pas
donnée, un « À retenir ». Les modules finissent par une mission à livrable. Blocs par niveau d'effort et
phases : `docs/PLAN-REFONTE.md`.

- **Rien d'inventé.** Les commandes et sorties viennent du module existant ou d'une exécution réelle,
  jamais d'une supposition ; une commande reconstituée est signalée. La **théorie nouvelle est permise**
  (c'est l'objet de la refonte) si la **source officielle est citée en encadré**.
- Un terme nouveau est défini à sa première apparition (infobulle du glossaire).
- Un lot est terminé quand `construit.js --verif` passe et que le site s'ouvre sans erreur dans un
  navigateur. Un lot vérifié se fusionne dans `main` ; jamais de lot à moitié fini sur `main`.
- Budget de tokens limité : un script avant un agent, un petit modèle avant un grand, un module à la fois.
