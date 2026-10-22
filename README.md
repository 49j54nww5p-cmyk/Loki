# Plumage

Quiz d'oiseaux personnalisé, en direct d'iNaturalist : photos, chants, noms latins, familles, raretés et oiseaux du monde entier.

**Jouer : https://49j54nww5p-cmyk.github.io/Loki/**

Sur iPhone : ouvre le lien dans Safari, bouton Partager, puis « Sur l'écran d'accueil ». Plumage s'ouvre alors comme une vraie appli.

## Contenu

- **Série du jour** (12 questions mélangées, environ 4 min), **mini-série** (1 min) et **révisions espacées**
- **Modes** : Photo, Chants (avec sonogramme), Latin ↔ français, Familles, Duels de sosies, Géo, Racines latines, Sur mesure
- **Sur mesure** : zone (n'importe quel lieu iNaturalist, autour de moi, le monde), groupes de familles, espèces communes / de saison / raretés / exotiques / tes propres observations, type de question (photo, photo de terrain, chant, « quel chant ? », nom français, nom latin), réponse attendue (espèce, genre, famille, ordre), QCM de 2 à 6 choix, vignettes, saisie libre, flashcards, leurres de facile à expert, chrono
- **Progression** : XP, niveaux, jours d'affilée avec jokers, badges, carnet d'espèces, statistiques, confusions fréquentes
- **Fiches espèces** : galerie, présence par mois, carte des observations, chants, description Wikipédia, espèces qui ressemblent, ton astuce perso

## Données

- iNaturalist (API publique) : photos, sons, listes d'espèces, espèces souvent confondues, présence par mois, cartes. Chaque média garde sa licence et son auteur.
- Wikipédia (résumés), xeno-canto (optionnel, avec ta clé), fonds de carte © OpenStreetMap / © CARTO.
- La progression reste dans le navigateur de l'appareil (export / import dans Réglages).

## Développement

Sources dans `src/`. Pour régénérer `index.html` et les icônes : `OUT=. node build.cjs` (nécessite `sharp`).
