# Tablet-Hop sur Render

## Option recommandée : Blueprint

1. Dans Render, choisir **New > Blueprint**, connecter **clemomatic/Tablet-Hop** et sélectionner la branche **feature/couch-mode**.
2. Laisser Render lire le fichier **render.yaml** de cette branche.
3. Lancer la création du service. Le premier build installe les dépendances et prépare le client.
4. Ouvrir l'URL HTTPS fournie par Render. Choisir une salle (exemple : `/soiree`).

Liens de la même salle :
- TV : `https://VOTRE-SERVICE.onrender.com/soiree?couch=tv`
- Téléphone : `https://VOTRE-SERVICE.onrender.com/soiree?couch=phone`
- Classique : `https://VOTRE-SERVICE.onrender.com/soiree`

**Important :** Render doit déployer la branche **feature/couch-mode**, pas la branche `main` (qui reste identique au fork d'origine).

## Alternative : créer directement un Web Service

Branch `feature/couch-mode`, runtime Node, région Frankfurt, build `npm ci && node server/prebuild.mjs`, start `npm start`. Le projet lit directement la variable PORT de Render. Le fichier `render.yaml` configure également `VTT_SAVE_DIR` et `EXTERNALURL`; si le service est créé manuellement, renseigner ces variables dans l'interface Render.

## Sauvegardes

Le plan Free met le service en veille, redéploie parfois et **efface les données enregistrées sur son disque local**. Les modifications des jeux, parties et illustrations importées ne sont donc pas garanties. Exporter régulièrement les jeux importants en fichier .vtt.

Pour conserver les données, passer à une instance payante et ajouter un disque persistant monté à `/opt/render/project/src/save` (la valeur de `VTT_SAVE_DIR`). Un disque persistant n'est pas disponible sur le plan Free.

## Connexion

Chaque téléphone doit être associé à un joueur distinct. La TV doit ouvrir la salle sous un nom d'invité indépendant sans occuper de siège. Si les navigateurs partagent le même profil, vérifier l'identité choisie dans VirtualTabletop.

## Dépannage

- Si le mode TV ou téléphone n'apparaît pas, vérifier la branche déployée et le paramètre `?couch=tv` ou `?couch=phone`.
- Si une partie se recharge après une période d'inactivité, c'est normal sur Render Free.
- Si le tableau de bord indique une erreur de build, consulter les logs Render avant de modifier la configuration.
