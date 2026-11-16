# Refonte — linux-debian, lot 5 et bilan du module (25 chapitres)

**Lot 5.** `disques-fstab`, `raid`, `lvm`, `sauvegardes`, `chap21` (ids inchangés) au gabarit : objectifs et prérequis, pourquoi, modèle sans commande, exemple `.walk`, « Vérifier » (`data-constat` pour `sauvegardes` et `chap21`), « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Questions éclair, lab `linux-restauration` et outil cron conservés. `chap21` ne compte que 22 lignes : les ~260 lignes évoquées sont l'annexe `#memo`, non modifiée.

**Bloc 10.** `section#livrable` avec `.lab[data-lab="livrable-linux-debian"]` (8 étapes : runbook d'installation et de durcissement, plan de sauvegarde testé), avant le test. Aucune commande `ufw` ni `unattended-upgrades` : non enseignées.

**Catalogue et durées.** `duree` 6 h → 15 h 10 (somme des 25 durées annoncées, 13 h 40, plus le livrable 1 h 30 ; estimée, non mesurée) ; `chapters` reste 25. Hero et `index.html` mis à jour. Intro du test sans compte figé.

**Questions.** Lot 5 : 11 ajoutées. Module entier : 45 (12 + 8 + 9 + 5 + 11), au moins une par objectif ; audit mots-clés de chap1-20 sans trou détecté.

**Sources** (HTTP 200) : fstab(5), fdisk(8), mke2fs(8), findmnt(8), mount(8), mdadm(8), kernel.org md, Debian Wiki SoftwareRAID et LVM, lvm(8), lvextend(8), tar(1), rsync(1), crontab(5), Debian Reference ch. 10, bash(1).

**Reconstitués** : 18 au total (module) ; lot 5 : disques-fstab 1, raid 1 (`mdadm --create`), lvm 1, sauvegardes 2.

**192.168.1.x** conservé : chap14 (10), chap15 (3). Glossaire : 11 termes.

Lint : 0 erreur sur 25 chapitres. `construit.js --verif` passe. Playwright : zéro erreur console.
