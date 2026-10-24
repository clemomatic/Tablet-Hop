# Tablet-Hop — Architecture native salon (ADR-001)

**Statut : décision de reconstruction, non livrée en production.**

## Pourquoi repartir du socle

La branche `feature/couch-mode` a ajouté des panneaux, du CSS, des
miniatures et des raccourcis autour de l'interface historique VirtualTabletop.
Elle n'a pas remplacé le modèle de navigation, les interactions avec la table,
l'organisation des mains ni l'expérience de configuration. Cette approche a
échoué au test d'usage en situation réelle : la TV affichait toujours les
éléments de mains, et l'interface téléphone était peu pratique.

**Ne plus étendre cette surcouche comme si elle était le produit final.**
Elle reste disponible à titre d'expérience, sans être intégrée à ce travail.

## Principe de la version suivante

Un moteur commun, **trois interfaces distinctes**. Aucun de ces écrans ne
contient le DOM de l'interface historique que l'on cache par CSS.

1. **TV** : rendu *public* du plateau et de ses animations ; jamais de main
   personnelle, d'éditeur, de barre d'outils VTT ni de commandes complexes.
2. **Téléphone** : interface centrée sur l'identité du joueur, sa place, sa
   main et les actions possibles. Pas de plateau VTT miniature en arrière-plan.
3. **Préparation** : sélection des jeux, paramétrage, édition ; cette surface
   peut continuer à utiliser l'éditeur historique tant qu'un remplaçant
   fiable n'existe pas.

Le moteur d'origine garde le format des sauvegardes, la synchronisation
WebSocket des salles, les jeux de la bibliothèque et les routines existantes.
Un **adaptateur d'état indépendant de la présentation** fournit à chaque
écran les données qui lui sont utiles. Une **couche d'actions** traduit les
interactions de l'interface en opérations du moteur *sans court-circuiter les
routines du jeu*. Ce dernier point est une dépendance technique majeure :
VirtualTabletop exécute de nombreuses routines côté client, pas côté serveur.

## Risque de compatibilité

La bibliothèque VTT possède des widgets et routines arbitraires. Nous ne
pouvons pas dire qu'un nouvel écran les comprend tous tant que nous ne savons
pas restituer leurs propriétés, comportements, états et actions. Une interface
visuellement distincte n'est pas à elle seule une preuve de compatibilité.

Découper explicitement la compatibilité :
- **Socle partagé** : état, versions, sessions, delta, métadonnées de jeu.
- **Rendu public** : objets de plateau, positions, cartes publiques,
  images, dés, jetons. Ne pas essayer de dessiner une carte arbitraire comme
  s'il s'agissait d'une carte standard.
- **Rendu privé** : vraies cartes du joueur, faces et masquages particuliers.
- **Interactions** : commandes natives, routines, sélections, réponses à
  INPUT, exceptions propres à certains jeux.
- **Édition et import** : transition distincte, sans perdre les fichiers VTT.

Le serveur historique diffuse l'état à tous les clients. Masquer une main
dans une interface n'est donc **pas** une barrière de confidentialité réseau.

## Première tranche validable, sans annoncer une refonte complète

Sur un vrai jeu issu de la bibliothèque :
1. Créer ou rejoindre une salle en ligne.
2. Associer deux smartphones à deux joueurs différents et à deux places.
3. Afficher sur chacun une main *distincte* et directement lisible.
4. Exécuter une action native du jeu (ex. piocher), avec son effet réel.
5. Jouer une carte depuis un téléphone et la voir arriver sur la TV.
6. Ne jamais montrer les cartes privées sur la TV.
7. Vérifier les reconnexions et le fonctionnement simultané de deux appareils.
8. Rester utilisable en portrait à une main.

Les tests doivent vérifier un vrai navigateur mobile/desktop, pas uniquement
l'analyse syntaxique, des mocks ou un serveur qui démarre.

## Stratégie de migration et déploiement

- Repartir de `main` sur `feature/native-salon`, sans hériter du code
  `feature/couch-mode`.
- Ne pas changer le service Render actuel, qui reste connecté à
  `feature/couch-mode`, avant validation du parcours complet.
- Construire et tester d'abord des écrans dédiés sur cette branche ; basculer
  Render volontairement lorsque leur comportement est réellement vérifié.
- Conserver un accès explicite au mode classique pour préparer les jeux et
  détecter une incompatibilité au lieu de la masquer.

## Anti-objectifs

- Ajouter une nouvelle barre en bas d'une page VTT inchangée.
- Recopier dans une carte mobile un élément HTML VTT et appeler cela
  une interface native.
- Cacher les mains par une liste de sélecteurs CSS puis déclarer que la
  séparation TV/téléphone fonctionne.
- Présenter comme « testé » un simple build, une validation de syntaxe ou
  un scénario simulé.
