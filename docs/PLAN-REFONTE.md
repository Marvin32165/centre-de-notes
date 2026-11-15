# PLAN DE REFONTE — du « cours pratiqué » au « manuel qui forme »

Rédigé le 15/11/2026. À lancer avec **un agent orchestrateur** qui délègue (§5).
Contexte mesuré dans ce dépôt : 28 modules, 292 chapitres, 1 647 questions de modules, 4 paliers.
Les constats ci-dessous viennent de cinq audits en lecture seule (un par parcours + transversal), faits
sur ce site. **Ne pas refaire les audits.**

## 1. Le problème, en une phrase

Le site est exact et soigné, mais il est écrit **comme un carnet de TP** : on y suit ce qui a été
fait, commande par commande. Il ne **présente pas la matière** (pourquoi, modèle mental, vocabulaire,
cas d'usage), ne fait pas **passer du guidé au non guidé**, et ne demande **jamais de produire**
(ticket, runbook, plan, post-mortem). Résultat : on comprend et on reconnaît, on ne devient pas autonome.

Preuves (audits) : aucune panne à diagnostiquer sur Orion hors CCNA / Cisco-sécurité ; zéro livrable ;
changement, retour arrière et communication absents ; les 4 missions de palier n'ont aucun contenu
(`catalogue.js` seul) ; ITIL sans pratique ; Azure limité à AZ-900 ; pas de Git/IaC/journalisation.

## 2. Le modèle cible : un chapitre = une leçon de manuel

Inspiration : manuels (objectifs → cours → exercices → corrigés), Microsoft Learn / Cisco NetAcad
(parcours en unités courtes), et le cadre Diátaxis (ne pas mélanger *apprendre*, *faire*,
*consulter*, *comprendre*). Principe : **« je montre, on fait ensemble, tu fais seul »**.

### Gabarit de leçon (10 blocs, tous obligatoires sauf mention)

| # | Bloc | Rôle | Existe déjà ? |
|---|---|---|---|
| 1 | **Ce que tu sauras faire** — 2 à 4 objectifs mesurables, verbes d'action | cadrer | `brief` existe **au niveau du module** (« Ce que tu sauras faire à la fin ») ; à descendre au niveau leçon |
| 2 | **Avant de commencer** — prérequis (liens), durée, matériel | orienter | partiel |
| 3 | **Pourquoi ça existe** — le problème que la notion résout, un cas du métier | motiver | non |
| 4 | **Le modèle** — théorie courte : schéma, vocabulaire, règle. Pas de commande ici | comprendre | partiel |
| 5 | **Exemple travaillé** — un cas résolu entièrement, raisonnement commenté | modéliser | `walk` (20) |
| 6 | **On le fait ensemble** — pratique guidée + « Vérifier » (sortie attendue) | s'exercer | oui (fort) |
| 7 | **À toi** — même tâche, énoncé seul, correction masquée ; puis variante **sans indice** | autonomie | `exo` (rare) |
| 8 | **Quand ça casse** — 1 panne à diagnostiquer, symptôme seul (pas la cause) | diagnostic | QCM seulement |
| 9 | **À retenir** + fiche de référence (commandes, ports, pièges) | consulter | `takeaway` |
| 10 | **Preuve** *(par module, pas par leçon)* — un livrable relu (ticket, runbook, schéma…) | professionnaliser | non |

### Quels blocs, pour quel niveau (le lint s'adapte au niveau)

| Bloc | Niveau A | Niveau B | Niveau C |
|---|---|---|---|
| 1 Objectifs · 2 Prérequis · 9 À retenir | chaque leçon | chaque leçon | chaque leçon |
| 3 Pourquoi · 4 Modèle | chaque leçon | si absent seulement | module (1 fois) |
| 5 Exemple travaillé | chaque leçon | leçons clés | non |
| 6 On le fait ensemble | chaque leçon | existant conservé | existant conservé |
| 7 À toi (+ variante sans indice) | chaque leçon | 1 sur 2 | 1 par module |
| 8 Quand ça casse | chaque leçon pratique | 1 par module | 1 par module (ITIL, Azure : obligatoire) |
| 10 Preuve / mission | module | module | module |

Règles de fond : une leçon = 20 à 40 min ; un seul concept nouveau principal ; la théorie **précède**
la commande ; chaque terme nouveau est défini à sa première apparition (infobulle glossaire) ;
chaque module finit par **une mission** (§4) et un **dossier de livrables**.

### Structure d'un module (au lieu de « 8 chapitres puis un test »)
`Carte du module` (objectifs, prérequis, métier visé, livrables) → leçons (gabarit ci-dessus) →
`Panne sans indice` (1 par module) → `Fiche de référence` (extraite des « À retenir », générée) →
test de fin → `Mission / livrable`.

## 3. Trois niveaux de traitement (pour tenir le budget)

Tout réécrire coûterait trop. On applique l'effort où il rapporte le plus.

| Niveau | Quoi | Modules | Coût |
|---|---|---|---|
| **A — Réécriture** en leçons au gabarit | théorie + exemple travaillé + À toi + panne, texte existant réutilisé | `reseau-bases`, `depannage-reseau`, `linux-debian` (25 ch. : le plus gros chantier), `windows-server`, `powershell`, `subnetting`, `hyperv` | élevé |
| **B — Restructuration** | on garde le texte ; on ajoute blocs 1-3, 7, 8 et la fiche | `ccna-reseau`, `cisco-securite`, `docker`, `monitoring-zabbix`, `zabbix-windows`, `redmine`, `sql-server`, `iis`, `storage-clustering`, `rds`, `dpm`, `proxmox`, `securite`, `homelab` | moyen |
| **C — Habillage** | blocs 1, 2, 9 + 1 « À toi » ; ITIL et Azure reçoivent en plus une vraie pratique | `exchange-securite`, `sharepoint`, `voip`, `scrum`, `itil`, `azure`, `entretien-recrutement` | faible |

Les 7 modules A = le palier 1 et le cœur du palier 2 : c'est ce qui fait un N1 → N2. À faire d'abord.

## 4. Les missions : l'épine dorsale (déjà annoncées dans le catalogue, vides)

Mission 1 existe (`labo.html#missions`, branche `claude/pensive-hypatia-25d46v`). **À corriger avant
d'écrire les autres** : étape 5 impossible seul (voir §4.1), étape 3 sans nombre d'hôtes, étape 4 sans
adresse Debian nommée dans le plan Orion.

| Palier | Mission (étapes) | Doit contenir |
|---|---|---|
| 1 | Le labo de la petite entreprise (6) | fiche d'adressage, plan VLSM, ticket, 3 messages à l'utilisateur |
| 2 | Le domaine Orion, du premier contrôleur au ticket (7) | runbook, incident Zabbix → Redmine, panne DHCP/DNS sans indice |
| 3 | La panne qui ne doit rien coûter (7) | restauration chronométrée (RTO mesuré), RFC avec retour arrière, post-mortem |
| 4 | Ton portfolio d'ingénieur (5) | dépôt Git, IaC, schéma d'architecture, ADR, rapport de sécurité |

Contrat technique (déjà vérifié par `verif-portail/verifie.js`) : un `.lab[data-lab="mission-pN"]`
dont le nombre de `<li>` égale `etapes` du catalogue.

### 4.1 Pannes sans indice, en solo
Une panne qu'on a choisie soi-même ne s'entraîne pas. Deux options : (a) un camarade ; (b) un **script
de panne aléatoire** qui applique une faute sans l'afficher, plus un script `Reparer-Lab` de retour à
l'état sain. Ces scripts sont **reconstitués, jamais testés ici** : les marquer ainsi (règle « rien
d'inventé ») et les faire valider sur le vrai lab par l'auteur avant publication.

## 5. Délégation et économie de tokens (le cœur de l'exécution)

Contrainte : budget de tokens limité (environ la moitié du quota hebdomadaire restait le 15/11).
Repères mesurés : chacun des cinq audits en lecture a consommé 104 k à 151 k tokens ; les modules
vont de 26 ko (`itil`) à 190 ko (`linux-debian`), donc un module A lourd coûte bien plus qu'un audit. **Règle d'or : un script avant un
agent, un petit modèle avant un grand, un module à la fois.**

### 5.1 Qui fait quoi

| Rôle | Modèle | Il fait | Il ne fait jamais |
|---|---|---|---|
| **Orchestrateur** | Fable | décisions de conception, arbitrage, relecture du pilote, découpage en lots | écrire du contenu en masse, lire un module entier |
| **Rédacteurs** | Sonnet (défaut) ; Opus seulement pour les modules A les plus denses (`linux-debian`, `reseau-bases`) | une leçon ou un module B/C par lot, depuis un brief d'une page | explorer le dépôt, refaire les audits |
| **Mécaniques** | Haiku **ou script** | inventaire, comptage, liens, lint de structure, renommages, régénération des fonds de questions | juger la pédagogie |
| **Vérif. des faits** | agent `verif-faits` (WebSearch) | uniquement sur les affirmations **nouvelles** ou douteuses | relire un module entier par défaut |

### 5.2 Mesures qui économisent le plus
1. **Le HTML reste la seule source** (tous les outils existants le lisent). Les rédacteurs **remplacent
   ou insèrent chapitre par chapitre** avec `Edit`, et ne ré-émettent jamais un module entier. Un
   convertisseur Markdown → composants (`lecon.js`) n'est construit **que si le pilote montre un gain
   mesuré** ; il n'émet alors que des fragments, insérés une fois, jamais une seconde source.
2. **Lint gratuit** `verif-lecon.js`, **par niveau** (tableau du §2) : blocs requis, ≥1 « À toi », ≥1
   panne, aucun secret, aucune correction hors `<details>`. Les rédacteurs corrigent sur sortie du
   lint, pas sur relecture d'un LLM.
3. **Lire par extraits** : `grep`/`sed` sur les ancres de chapitre ; jamais un module de 100 ko d'un bloc.
   Les modules lourds : `linux-debian` 190 ko, `sql-server` 165 ko, `reseau-bases` 130 ko.
4. **Rapports courts, dans des fichiers.** Chaque worker écrit ≤ 300 mots dans
   `docs/refonte/<lot>.md` ; l'orchestrateur ne lit que ça.
5. **Pas de re-audit.** Les constats de ce document suffisent.
6. **Parallélisme ≤ 3 workers**, jamais deux sur le même fichier.
7. **Advisor : 0 à 1 appel** (relecture du pilote). Chaque appel renvoie toute la conversation ; avec un
   orchestrateur Fable, il est redondant.
8. **Un build à la fin d'un lot**, pas à chaque fichier : `node outils/construit.js` puis `--verif`.

### 5.3 Porte « pilote » (obligatoire)
Convertir **un seul module** (`hyperv`, 50 ko, le plus petit module A) de bout en bout. Mesurer les
tokens réellement consommés (`get_session` → `usage`). **Extrapoler au reste et demander l'accord de
l'auteur avant de continuer.** Si l'extrapolation dépasse le budget, abaisser des modules de A vers B.

## 6. Phases

| Phase | Contenu | Livrable | Qui |
|---|---|---|---|
| **0 · Outillage** (aucun contenu) | `verif-lecon.js` (lint par niveau), gabarit de leçon, confirmation des points du §7 | outils + gabarit validés | Sonnet + Fable relit |
| **1 · Pilote** | `hyperv` converti + mission 1 corrigée | module de référence ; **mesure de tokens ; décision go/no-go** | Sonnet, Fable arbitre |
| **2 · Palier 1** | `reseau-bases`, `subnetting`, `depannage-reseau`, `linux-debian` au niveau A ; mission 1 finale | un N1 complet | Sonnet (Opus pour `linux-debian`) |
| **3 · Palier 2** | `windows-server`, `powershell` (A) ; Zabbix, Redmine, Docker, CCNA (B) ; **mission 2** ; ITIL pratiqué | un N2 complet | Sonnet |
| **4 · Palier 3** | modules B restants ; **mission 3** ; panne sans indice par module | un administrateur | Sonnet |
| **5 · Manques métier** | 3 modules neufs, **sources officielles citées** : *Mise à jour & conformité (WSUS/Windows Update, Intune/Entra)*, *Git & Ansible*, *Journaux & réponse à incident* ; **mission 4** | trous du métier comblés | Sonnet + `verif-faits` |
| **6 · Finition** | niveau C ; révision par saisie de commande ; fiches de référence générées ; chiffres du site | site cohérent | Haiku/scripts |

**Calendrier** : tout le site est dans le périmètre (§10). La formation finit le **19/11**, mais le site
se refond au-delà ; chaque phase est autonome, vérifiée, fusionnée dans `main` et publiable.

## 7. Points relevés par les audits (**tous à confirmer** avant correction)

**Erreurs ou risques techniques possibles**
- `linux-debian` ch.15 : l'audit dit que `rsa` est présenté avant `ed25519` et que `sshd` n'est pas
  durci (`PasswordAuthentication`, `PermitRootLogin` : 0 occurrence, pare-feu absent) ; ch.14 : DNS à
  la main dans `/etc/resolv.conf` susceptible d'être écrasé. `ssh-keygen -t …` n'a pas été retrouvé
  tel quel : relire le chapitre.
- `monitoring-zabbix` ch.07, question éclair « hôte sans template, la pastille passe au vert » :
  probablement fausse en Zabbix 7.x.
- `azure` : 730 h puis 43 200 min pour le SLA (écart d'environ 0,3 min).
- Chiffres : `index.html` et `examens.html` annoncent 27 modules et 289 questions ; il y en a 28 modules
  (`modules/`, catalogue), 292 chapitres et 1 647 questions de modules. Recompter par script après chaque phase.

**Choix de conception (pas des erreurs)**
- `sharepoint` : SharePoint Designer 2013 est enseigné tout en étant signalé hors support.
- `rds` ch.06 : certificat auto-signé alors que `ORION-CA` existe (module Exchange).
- Adressage : un lab unique. Ajouter au plan Orion une machine Debian nommée (adresse choisie dans la
  plage « adresses fixes .10 à .99 » de `labo.html`) et y transposer les exemples `192.168.1.x`.

## 8. Garde-fous
- **Rien d'inventé.** Les **commandes et « sorties attendues »** viennent du module existant ou d'une
  exécution réelle, jamais d'une supposition. La **théorie nouvelle** est permise (c'est l'objet de la
  refonte) à condition de **citer la source officielle** en encadré.
- **Aucun secret** : ce dépôt est public. Ni mot de passe, ni IP réelle, ni nom réel de personne ou de machine.
- **Fichiers générés, jamais édités à la main** : `assets/search-index.js`, `assets/glossaire.js`,
  `assets/commandes.js`, `assets/quiz/*.js` (depuis `assets/quiz-data.js`), `sw.js`. Toujours
  `node outils/construit.js`.
- **Un lot = vérifié puis fusionné dans `main`** ; jamais de lot à moitié fini sur `main`.

## 9. Définition de « terminé » pour une leçon
Les blocs requis **pour son niveau** (tableau du §2) sont là ; `verif-lecon.js` passe ; `construit.js
--verif` passe ; le site s'ouvre sans erreur dans un navigateur ; au moins un « À toi » et une panne
sans cause affichée ; chaque affirmation nouvelle a sa source ; le module a mis à jour son entrée de
catalogue (durée, chapitres) et ses questions de test couvrent **les objectifs du bloc 1** (au moins 1
question de décision par objectif).

## 10. Décisions de l'auteur (15/11/2026)
1. **Périmètre : tout le site**, les 28 modules et les 292 chapitres, phases 0 à 6. La porte « pilote »
   (§5.3) reste le point d'arrêt budgétaire.
2. **Panne sans indice en solo** : scripts de panne aléatoire par défaut (§4.1), signalés « reconstitués,
   non testés » jusqu'à validation sur le vrai lab.
3. **Tout sur `main`** de ce dépôt, lot par lot.
4. **Théorie nouvelle : autorisée**, avec source officielle citée (§8).
5. **Ce dépôt est la seule source et la seule cible de publication.** Les autres dépôts de l'auteur
   servent à autre chose : ne pas y toucher.

---

## ANNEXE — prompt de lancement pour l'agent orchestrateur

> Tu es l'orchestrateur de la refonte du Centre d'apprentissage IT, dans ce dépôt. Lis `CLAUDE.md` et
> `docs/PLAN-REFONTE.md`. Ne refais aucun audit. Budget serré : un script avant un agent, un petit modèle
> avant un grand, un module à la fois.
> 1. **Phase 0** : délègue à un agent Sonnet `outils/verif-lecon.js` (lint par niveau) et le gabarit de
>    leçon, d'après §2 et §5.2. Pas de convertisseur avant la mesure du pilote. Relis le diff.
> 2. **Phase 1** : convertis `hyperv` au gabarit avec un agent Sonnet ; mesure les tokens consommés.
> 3. **Arrête-toi** et rends compte : tokens réels, extrapolation par phase, écarts de qualité. N'engage
>    pas la phase 2 sans accord.
> Délègue chaque lot avec un brief d'une page (module, niveau A/B/C, gabarit, règles du §8). Les workers
> écrivent ≤ 300 mots de rapport dans `docs/refonte/`. Parallélisme ≤ 3. Advisor : au plus une fois.
> Un lot vérifié se fusionne dans `main`.
