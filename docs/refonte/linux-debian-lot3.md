# Refonte — linux-debian, lot 3 (chap11 à chap16)

**Changé.** Six chapitres (ids inchangés) au gabarit : objectifs et prérequis, pourquoi, modèle sans commande, exemple `.walk`, « Vérifier » (`data-constat`), « À toi » + variante sans indice, panne symptôme-seul avec `reveal`, « À retenir » en dernier bloc. Au chap14, la question éclair passe avant « À retenir ».

**Points §7 relus.**
- Ch.14 : le texte parlait déjà de `resolvconf`. Ajouté : `/etc/resolv.conf` est souvent généré (NetworkManager, dhclient, resolvconf) ; une ligne manuelle peut être écrasée. Source : Debian Wiki resolv.conf.
- Ch.15 : `rsa` était bien listé avant `ed25519` ; ordre inversé, `rsa` en alternative. Aucun durcissement dans le texte : ajouté seulement un paragraphe (défauts `PasswordAuthentication yes`, `PermitRootLogin prohibit-password`, sshd_config(5)), sans pare-feu.

**Sources** (HTTP 200) : find(1), bash(1), man(1), interfaces(5), ip(8), ssh-keygen(1), sshd_config(5), sources.list(5), apt(8), Wiki SourcesList et resolv.conf.

**Reconstitué** (6) : chap11 (2), chap12, chap13, chap15 (ssh-copy-id adapté). `192.168.1.x` conservé : chap14 et chap15.

**Glossaire** : 6 termes. **Quiz** : 9 questions ajoutées (intro « soixante » à mettre à jour).

Lint : zéro erreur chap11-16 ; `construit.js --verif` passe ; Playwright sans erreur.
