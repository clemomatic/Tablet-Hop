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
