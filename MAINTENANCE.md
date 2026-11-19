# Plumage — notice de maintenance (pour l'agent qui traite la boîte à idées)

Le site publié (GitHub Pages) est la racine de ce dépôt : `index.html`, `sw.js`, icônes, `fonts/`, `vendor/`, `admin/`.
Les **sources** sont dans `src/` ; `index.html` est **généré** : ne jamais le modifier à la main.

## Construire
```
node build.cjs              # construit dans dist/ (pour tester)
OUT=. node build.cjs        # construit à la racine du dépôt (pour publier)
```
`build.cjs` concatène `src/*.js` (ordre fixé dans le fichier) et les CSS dans `index.html`, et génère `sw.js` et les icônes.
Dépendance : `sharp` (`npm i sharp` si absent). Playwright est préinstallé dans l'environnement.

## Tester (obligatoire avant toute publication)
```
node build.cjs && node test/run.cjs        # doit finir par « ERRORS none »
node test/<module>.cjs                     # tests ciblés : live, idees, grand, boutique, defi, partage…
```
Les tests simulent iNaturalist et le serveur (`test/mock.cjs`, site servi sur https://plumage.test/).

## Publier
```
OUT=. node build.cjs
git add -A index.html sw.js src build.cjs test && git commit -m "…" && git push origin HEAD:main
```
Puis vérifier en ligne : `curl -s "https://49j54nww5p-cmyk.github.io/Loki/?x=$RANDOM" | grep -c '<un morceau du nouveau code>'` (GitHub Pages met 1 à 2 minutes).
Ajouter une ligne en tête de `NEWS` dans `src/ui.js` (numéro de version + 1, format existant) pour toute correction visible.

## Données (Firebase Realtime Database)
Base : `https://project-2af97840-c7b8-4ccd-949-default-rtdb.europe-west1.firebasedatabase.app` (REST : `/<chemin>.json?auth=<idToken>`).
Clé web publique : `AIzaSyDRy69FxnWvnAnctKm6cb5_Pp7iTteKJ7Q`.
Règles de référence : `admin/RULES.json` (elles se publient dans la console Firebase, pas depuis ce dépôt).

Boîte à idées : `ideas/{id}` = `{ k: "idee"|"bug"|"oiseau"|"autre", txt, c (contact facultatif), v (version), t (date ms), u (uid de l'auteur) }`.
Le robot ajoute : `st` (statut affiché à l'auteur dans l'appli : « lu », « corrigé », « à l'étude », « pas retenu »), `r` (une phrase de réponse), `at` (date du traitement).

## Règles de tri des idées
- **Corriger seul** : un bug clair, logique, localisé (texte faux, nom d'oiseau erroné, bouton qui ne fait rien, plantage reproductible), corrigeable en quelques lignes sans changer le fonctionnement de l'appli. Toujours : reproduire si possible, corriger dans `src/`, tester, publier, puis `st: "corrigé"`.
- **Demander d'abord** (statut `à l'étude`) : toute nouvelle fonction, tout changement d'interface, de règles de jeu, d'XP, de données, de règles Firebase, ou tout ce qui touche plus de 2-3 fichiers ou dont l'effet est incertain.
- **Ne jamais** : supprimer des données de joueurs, toucher aux règles Firebase, publier sans que `test/run.cjs` passe.
