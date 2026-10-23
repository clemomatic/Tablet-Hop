# Tablet-Hop / Couch Mode

Prototype de salon ajouté au moteur VirtualTabletop sans changer le format des parties.

## Démarrage

Depuis la racine du dépôt : installer Node.js, puis lancer npm install et npm start.
Le serveur local est normalement disponible sur le port 8272.

Pour une salle nommée ma-partie, ouvrir :

- Mode classique : http://localhost:8272/ma-partie
- Mode TV : http://localhost:8272/ma-partie?couch=tv
- Mode téléphone : http://localhost:8272/ma-partie?couch=phone

Sur les téléphones, remplacer localhost par l'adresse IP locale de l'ordinateur qui héberge le serveur, et utiliser le même Wi-Fi.

## Fonctions de cette première version

- TV : plateau sans barre d'outils, mains associées aux places et éléments propres à un siège masqués visuellement.
- Téléphone : barre de navigation Ma main / Plateau, cadrage de la main via le zoom natif, détection automatique de la place.
- Conservation des composants du moteur, des gestes natifs, du serveur, des routines et du format de jeu.
- Les modes sont optionnels : pas de changement du mode classique sans paramètre couch.

## Points à tester avant d'appeler cette version jouable

1. Créer une salle et charger un jeu VirtualTabletop avec des widgets Seat et un hand.
2. Ouvrir le mode TV dans un navigateur séparé, sous un nom distinct des vrais joueurs.
3. Ouvrir deux téléphones, choisir une place par téléphone depuis le plateau.
4. Appuyer sur Ma main : vérifier l'identité des cartes et la possibilité de les manipuler.
5. Piocher, jouer, changer de vue, vérifier les mises à jour sur la TV.
6. Tester un second jeu, la rotation du téléphone et la reconnexion.

## Limites intentionnelles

- Le masquage TV est visuel, pas une mesure de sécurité.
- Les jeux sans Seat.hand restent utilisables en mode Plateau, sans cadrage automatique de la main.
- Les actions rapides, les commandes propres au jeu, la connexion par QR code et la refonte du studio ne sont pas encore codées.
- La gestion des cas particuliers de mains partagées doit être vérifiée jeu par jeu.
- L'intégration n'a pas encore été validée en navigateur réel.

## Fichiers ajoutés

- client/js/couch/couch-mode.js
- client/css/couch/couch-mode.css
- server/minify.mjs : enregistrement des nouveaux fichiers dans le bundle.

## Licence

Fork de VirtualTabletop (GPL-3.0). Conserver les mentions d'attribution et respecter les conditions de redistribution du code modifié.

## Nouveautés : commandes smartphone (prototype)

- **Ma main** : cadre le conteneur lié au siège du joueur avec le zoom natif du moteur.
- **Plateau** : revient à la vue globale et à la manipulation native des objets.
- **Actions** : affiche les cartes déplaçables de la main, permet d'en sélectionner une et de la **poser au centre du plateau** ou dans un holder public compatible. Ces raccourcis ne valident pas les règles propres à chaque jeu.
- **Profil** (icône ♙) : change le nom du joueur à travers le protocole VirtualTabletop existant.
- **Partager** (icône ↗) : propose la feuille de partage du téléphone ou copie le lien Couch Mode.
- **TV** : affiche l'identifiant de salle et le nombre de connexions distinctes.

Pour charger ou organiser une partie, ouvrir la même salle **sans** le paramètre `couch`, depuis un ordinateur ou un appareil approprié. Le mode Couch ne remplace pas l'éditeur.

Ces actions n'ont pas encore été validées sur tous les jeux de la bibliothèque. Sur certains jeux scriptés, un déplacement direct peut différer d'une action prévue dans le scénario ; la vue Plateau et le mode Classique restent accessibles.

## Contrôles automatiques

- Tests unitaires : `tests/client/couch-actions.test.js` (appartenance d'une carte, destinations, déplacement sur plateau et dans un holder).
- Tests de présentation : `tests/testcafe/couch-mode.js` (écrans, commandes, profil et mode classique).
- CI dédiée : `.github/workflows/tablet-hop-couch.yml`, sur la branche `feature/couch-mode`.
- Il reste à confirmer les résultats de ces tests dans l'environnement GitHub Actions et à faire une vraie partie sur plusieurs appareils.

## Déploiement

Un Blueprint Render pour la démonstration gratuite est fourni dans `render.yaml`. Voir aussi `docs/render.md`.
