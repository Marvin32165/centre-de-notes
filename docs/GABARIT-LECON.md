# GABARIT DE LEÇON — référence pour les rédacteurs

Complète `PLAN-REFONTE.md` §2 : ici, le **balisage HTML existant** à utiliser, un mini-exemple par bloc et les
critères que `outils/verif-lecon.js` contrôle. On n'invente aucun composant : tout ce qui suit existe déjà
dans `assets/` (voir `modules/hyperv.html`, `scrum.html`, `docker.html`).

Une leçon = **une** `<section class="chapter" id="…">` (`chapter__num`, `chapter__title`, `chapter__intro`).
Durée visée : 20 à 40 min. Un seul concept principal. **La théorie précède la commande.**
On travaille par `Edit` chapitre par chapitre ; on ne ré-émet jamais un module entier.

## Stabilité (interdits)
La progression (`cai.progress`) est indexée sur l'`id` des `<section class="chapter">`, les labs (`cai.labs`) sur
`data-lab`. **Interdit** : renommer un `id`, scinder ou fusionner des chapitres, renommer un `data-lab`. Une leçon
s'enrichit **à l'intérieur** de sa section. Les nouveaux contenus (bloc 10) n'utilisent pas le motif `mission-pN`,
réservé au contrat catalogue. Ne jamais toucher aux clés `cai.*`.

## Repères dans le HTML
Le lint lit des attributs `data-bloc="N"` posés sur les composants (pas sur des titres, car `generate-search-index.py`
indexe les `<h3>` : **les `<h3>` portent un titre propre au contenu**, jamais « Pourquoi ça existe » en série).

| N | Bloc | Balisage |
|---|---|---|
| 1 | Ce que tu sauras faire | `<div class="brief" data-bloc="1">` (`brief__label`, `brief__list`) |
| 2 | Avant de commencer | `<p class="brief__foot">` **dans** le même `.brief` (prérequis en liens, durée, matériel) |
| 3 | Pourquoi ça existe | `<div class="lecon__bloc" data-bloc="3">` : 1 à 2 paragraphes, un cas du métier |
| 4 | Le modèle | `<div class="lecon__bloc" data-bloc="4">` : texte, `table-wrap`, schéma ; **aucun** `.terminal` ni `.cmdex` |
| 5 | Exemple travaillé | `<div class="walk" data-bloc="5">` (ou `.steps`) : raisonnement commenté |
| 6 | On le fait ensemble | `.steps` / `.terminal` + `<div class="verify" data-bloc="6">` |
| 7 | À toi | `<div class="exo" data-bloc="7">` ou `.cmdex` ; variante `<div class="exo exo--sans-indice" data-bloc="7">` |
| 8 | Quand ça casse | `<div class="panne" data-bloc="8">` (forme principale ci-dessous) |
| 9 | À retenir | `<div class="takeaway" data-bloc="9">` |
| 10 | Preuve (par module) | `.lab` d'id libre (`data-lab="livrable-<clé>"`) ou section `id="livrable"` |

`lecon__bloc`, `panne`, `exo--sans-indice` sont de simples classes d'accroche : sans CSS dédié, un `div` et un
`details` s'affichent déjà correctement. Un style éventuel s'ajoute dans `assets/theme.css`, puis `construit.js`.

## Règles anti-invention (priorité sur le lint)
- Le bloc 6 vaut aussi **sans terminal** : un `.verify` peut décrire un constat d'interface (« la console affiche… »)
  **sans** `verify__out`. Ne jamais fabriquer une sortie pour passer le lint.
- Une commande ou une sortie reconstituée porte `data-reconstitue` **et** le libellé visible « reconstitué, non testé » ;
  le lint les compte et les liste dans son rapport.
- Une leçon purement conceptuelle déclare `data-lecon="notion"` sur sa section : exemptée des blocs 6 et 8
  (« chaque leçon pratique »). À utiliser avec parcimonie ; le rapport du module la compte.
- Les pannes du bloc 8 puisent d'abord dans les `verify__fail` et `takeaway--warn` **déjà présents** (seules défaillances
  déjà sourcées) ; toute panne nouvelle vient d'une doc officielle citée ou est marquée reconstituée.

## Mini-exemples

**1 · Objectifs** (2 à 4, verbe d'action, mesurable)
```html
<div class="brief" data-bloc="1">
  <p class="brief__label">Ce que tu sauras faire</p>
  <ul class="brief__list">
    <li>Créer une VM génération 2 et justifier le choix de la génération.</li>
    <li>Vérifier la VM avec <code>Get-VM</code>.</li>
  </ul>
  <p class="brief__foot"><strong>Avant de commencer :</strong> chapitre <a href="#activer">Activer Hyper-V</a> · 30 min · un poste avec Hyper-V actif.</p>
</div>
```
**2 · Avant de commencer** — la ligne `brief__foot` ci-dessus, dans le même `.brief`.
**3 · Pourquoi** — le problème, un cas du métier : « Une VM mal réglée au départ se refait ; on la règle avant l'installation. »
**4 · Modèle** — vocabulaire défini à la 1re apparition (infobulle générée depuis `outils/glossaire/termes.txt`,
ajouter le terme là s'il manque), règle, tableau. Théorie nouvelle ⇒ encadré source :
```html
<p class="note">Source : <a href="https://learn.microsoft.com/…" rel="noopener">Microsoft Learn — titre de la page</a></p>
```
**5 · Exemple travaillé** — un cas résolu de bout en bout : `.walk` avec `walk__where`, `walk__head`, `walk__change`.
**6 · Ensemble** — `.terminal` + `.verify` (`verify__label`, `verify__sub` « Sortie attendue », `verify__out`, `verify__fail`).
**7 · À toi**
```html
<div class="exo">
  <p class="exo__label">À toi — créer un commutateur privé</p>
  <p>Énoncé seul, sans la commande.</p>
  <details class="reveal"><summary>Voir la solution</summary><div class="reveal__body"><p>…</p></div></details>
</div>
<div class="exo exo--sans-indice">
  <p class="exo__label">Variante sans indice</p><p>Même compétence, contexte différent.</p>
  <details class="reveal"><summary>Voir la solution</summary><div class="reveal__body"><p>…</p></div></details>
</div>
```
**8 · Quand ça casse** — forme principale : **symptôme seul**, la démarche, la cause et le correctif dans un `reveal`
(un QCM affiche la cause dans ses options : il reste facultatif, en complément).
```html
<div class="panne" data-bloc="8">
  <p class="exo__label">Quand ça casse — la VM ne démarre pas sur l'ISO</p>
  <p>Symptôme observable uniquement : ce que l'écran affiche, depuis quand, ce qui a changé. Pas la cause.</p>
  <details class="reveal"><summary>Voir la démarche et la cause</summary>
    <div class="reveal__body"><p><strong>Démarche :</strong> … <strong>Cause :</strong> … <strong>Correctif :</strong> …</p></div></details>
</div>
```
Le lint ne contrôle ici que la structure (symptôme + `reveal`), pas la qualité de la panne.

**9 · À retenir**
```html
<div class="takeaway" data-bloc="9"><p class="takeaway__label">À retenir</p><ul><li>…</li></ul></div>
```

## Critères (ce que le lint vérifie, par niveau)

| Contrôle | A | B | C |
|---|---|---|---|
| Blocs 1, 2, 9 par leçon | oui | oui | oui |
| Blocs 3, 4 par leçon | oui | si absents | 1 fois par module |
| Bloc 5 | chaque leçon | leçons clés (≥ 1 par module) | non |
| Bloc 6 (`.verify` ou `.cmdex`) | oui | conservé | conservé |
| Bloc 7 (`.exo`/`.cmdex` + variante sans indice) | chaque leçon | 1 leçon sur 2 | ≥ 1 par module |
| Bloc 8 (`.panne[data-bloc="8"]`, `.scenario` non « quick » accepté en complément) | chaque leçon pratique | ≥ 1 par module | ≥ 1 par module (ITIL, Azure : obligatoire) |
| Bloc 10 (mission/livrable) | module | module | module |
| Aucun `.terminal` dans le bloc 4 | oui | — | — |
| Correction toujours dans `<details class="reveal">` | oui | oui | oui |
| Exemption `data-lecon="notion"` (blocs 6, 8) comptée et listée | oui | oui | oui |
| Aucun secret (mot de passe, IP réelle, `ssh-rsa AAAA…`, jeton) | oui | oui | oui |
| Nombre de `<li>` d'un `.lab[data-lab="mission-pN"]` = `mission.etapes` du catalogue | oui | oui | oui |

Définition de « terminé » : voir `PLAN-REFONTE.md` §9 (lint + `construit.js --verif` + navigateur ; catalogue à jour ;
au moins 1 question de test par objectif du bloc 1, écrite dans `assets/quiz-data.js`, jamais dans `assets/quiz/*.js`).

## Garde-fous rappel
Commandes et sorties **jamais inventées** (module existant ou exécution réelle ; sinon marquées « reconstitué, non testé ») ·
théorie nouvelle = source officielle citée · rien de privé (lab fictif Orion seulement) · clés `cai.*` jamais réinitialisées ·
fichiers générés jamais édités à la main.
