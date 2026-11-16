# Refonte — linux-debian, lot 4 (chap17 à chap20)

**Changé.** Quatre chapitres (ids inchangés) au gabarit : objectifs et prérequis, pourquoi, modèle sans commande, exemple `.walk`, « Vérifier » (`data-constat`), « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Les questions éclair (chap17, chap19) sont conservées en complément. Au chap20, le pas à pas du démarrage sert d'exemple travaillé ; partitions, GRUB et modes réseau forment le modèle.

**Points §7.** Aucun dans ce lot.

**Sources** (HTTP 200) : signal(7), systemd.service(5), systemctl(1), ps(1), df(1), du(1), lsblk(8), tar(1), systemd-journald(8), journalctl(1), rsyslogd(8), wtmp(5), hier(7), boot(7), update-grub(8), Debian Wiki Swap.

**Reconstitué** (2) : chap18 (tar adapté), chap19 (`journalctl -b -p err`). Chap18 : `unzip` dans un reveal, signalé. Aucun `192.168.1.x` dans ce lot.

**Glossaire** : 11 termes. **Quiz** : 5 questions ajoutées (intro « soixante » à mettre à jour).

Lint : zéro erreur chap17-20 ; `construit.js --verif` passe ; Playwright sans erreur.
