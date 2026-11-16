# Refonte — windows-server, lot 3 (fichiers, dfs, gpo, securite)

**Changé.** Les quatre chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande (tableaux déplacés dans le bloc 4), exemple travaillé `.walk`, « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Textes, terminaux, `verify`, `cmdex` et questions éclair conservés. Le chapitre `securite` reçoit un `.verify data-constat` (pas de sortie inventée) ; le piège (`takeaway--warn`) est conservé.

**Sources** (Microsoft Learn, HTTP 200) : icacls, New-SmbShare, Access tokens, DFS overview, Choose a namespace type, New-DfsnRoot, Group Policy Hierarchy, New-GPLink, gpupdate, Password Policy, New-ADFineGrainedPasswordPolicy, Windows LAPS, Events 4625 et 4740, Appendix L (4728).

**Reconstitué** (`data-reconstitue` + libellé, 3) : dossier Accounting (ACC-GRP), droit RX sur Public, dossier DFS Development.

**Glossaire** : Jeton d'accès, Héritage NTFS, Droit effectif, Espace de noms DFS, Lien de GPO, Enforced, Block Inheritance, FGPP, LAPS.

**Questions** : 6 ajoutées (jeton, type de namespace, New-DfsnFolder, comptes séparés, LAPS) ; chaque objectif du lot a ≥ 1 question. L'intro du test dit « soixante » questions : le fonds en compte 71 (non touché).

**Objectifs des lots 1-2 sans question dédiée** : roles/second-dc/annuaire/dns : `netdom query fsmo` (listing des rôles), « pourquoi au moins deux DC », rangement en OU (`New-ADOrganizationalUnit`), CNAME. Objectif « décrire forêt, domaine, DC, OU, site » : une seule question (frontière), partielle.

**Limites.** Adresses conformes à `labo.html` (SRV-FILE01 = .20) ; aucune `192.168.1.x`. Lint : zéro erreur sur les 4 chapitres (restent bloc 10 du module, depanner-ad, tp-final). `construit.js` et `--verif` passent. Playwright : zéro erreur, un `scenario__opt` et un `reveal` cliqués.
