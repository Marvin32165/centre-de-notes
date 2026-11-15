# Bilan du pilote (15/11/2026)

## Tokens mesurés (usage renvoyé par l'outil Agent, sous-agents Sonnet)
| Étape | Tokens | Durée |
|---|---|---|
| Lint `verif-lecon.js` | 93 k | 1 min 12 |
| Conversion `hyperv` (A, 51 ko, 8 chapitres) | 217 k | 9 min 24 |
| Orchestrateur (contexte au 1er relevé) | 66 k | — |

`get_session` ne renvoie pas de champ `usage` cumulé (seulement `context_usage` du contexte courant) ; les
chiffres ci-dessus viennent des notifications de fin de sous-agent. Quota : `seven_day: allowed_warning` dès le départ.

## Extrapolation (hypothèses à recalibrer au premier module de chaque niveau)
Taux mesuré en A : ~4,2 k tokens par ko de module. B et C : **hypothèses** (1,2 k/ko et 0,5 k/ko), non mesurées.
| Lot | Taille | Estimation |
|---|---|---|
| A restants : subnetting 53, depannage-reseau 81, reseau-bases 133, linux-debian 193, windows-server 116, powershell 70 ko | 646 ko | ≈ 2,7 M |
| B (14 modules) | 1 028 ko | ≈ 1,2 M (hypothèse) |
| C (7 modules) | 477 ko | ≈ 0,25 M (hypothèse) |
| Total refonte des 28 modules | | ≈ 4,2 M, hors phase 5 (3 modules neufs) et phase 6 |

Palier 1 seul (subnetting, depannage-reseau, reseau-bases, linux-debian) : ≈ 2,2 M.
Règle de repli : si le signal de quota se dégrade ou si `isUsingOverage` passe à vrai, arrêt propre ; `powershell`
puis `windows-server` passent de A à B.

## Jugement de l'advisor (go conditionnel) et suite donnée
- Sources du pilote : 8 URL ajoutées testées en `curl -L` → toutes répondent 200.
- Texte conservé : 675 lignes ajoutées, 9 supprimées → insertion, pas réécriture.
- Relecture du chapitre `commutateurs` : le modèle précède les commandes, la panne ne donne pas sa cause.
- Corrections demandées : lint durci (bloc 6, bloc 9 en dernier, contenu minimal, avertissement `192.168.1.`),
  `data-reconstitue` sur les commandes adaptées. **Séquentiel**, un module à la fois (`construit.js` régénère
  tout l'arbre : deux conversions parallèles faussent `--verif`). Chemins de commit explicites, jamais `git add -A`.
- Ordre : subnetting, depannage-reseau, reseau-bases, linux-debian (lots de 8 chapitres max), puis B, puis C.
