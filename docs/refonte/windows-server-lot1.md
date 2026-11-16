# Refonte — windows-server, lot 1 (roles, preparer, adds, second-dc)

**Changé.** Les quatre chapitres (ids inchangés) suivent le gabarit : objectifs et prérequis (`.brief`), pourquoi, modèle sans commande, exemple travaillé `.walk`, « Vérifier », « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Textes, terminaux, `verify` et « Question éclair » conservés. Les terminaux d'installation (adds, second-dc) passent après le modèle ; la question éclair des chapitres 2 et 4 remonte avant le « À retenir ».

**Sources citées** (HTTP 200, Microsoft Learn) : Server Core, Install-WindowsFeature, Set-DnsClientServerAddress, Add-Computer, AD DS overview, Install-ADDSForest, FSMO roles, Install-ADDSDomainController.

**Reconstitué** (`data-reconstitue`, 2) : preparer (IP de SRV-FILE01), adds (`_kerberos._tcp`). Une correction de panne (roles) porte le libellé « reconstitué, non testé ». `.verify` sans sortie réelle (`data-constat`) : roles. Pannes preparer, adds, second-dc reprennent les `verify__fail` du module.

**Glossaire** : Server Core, Desktop Experience, DSRM, niveau fonctionnel, IFM, FSMO, émulateur PDC, catalogue global.

**Questions ajoutées** (5, `quiz-data.js`) : `-Remove`, prêt à joindre le domaine, forêt, `Install-ADDSForest`, maître de schéma. Le test annonce encore « soixante » questions : à mettre à jour en fin de module.

**Limites.** Adresses Orion conformes à `labo.html` ; aucune `192.168.1.x`. Lint : zéro erreur sur les 4 chapitres (restent les chapitres hors lot, le bloc 10 et 8.8.8.8 déjà présent). `construit.js` et `--verif` passent. Playwright : zéro erreur console, un `scenario__opt` et un `reveal` cliqués.
