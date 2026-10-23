# Plumage

Quiz d'oiseaux personnalisé, en direct d'iNaturalist : photos, chants, noms latins, familles, raretés et oiseaux du monde entier.

**Jouer : https://49j54nww5p-cmyk.github.io/Loki/**

Sur iPhone : ouvre le lien dans Safari, bouton Partager, puis « Sur l'écran d'accueil ». Plumage s'ouvre alors comme une vraie appli.

## Contenu

- **Série du jour** (12 questions mélangées, environ 4 min), **mini-série** (1 min) et **révisions espacées**
- **Modes** : Photo, Chants (avec sonogramme), Latin ↔ français, Familles, Duels de sosies, Géo, Racines latines, Sur mesure
- **Sur mesure** : zone (n'importe quel lieu iNaturalist, autour de moi, le monde), groupes de familles, espèces communes / de saison / raretés / exotiques / tes propres observations, type de question (photo, photo de terrain, chant, « quel chant ? », nom français, nom latin), réponse attendue (espèce, genre, famille, ordre), QCM de 2 à 6 choix, vignettes, saisie libre, flashcards, leurres de facile à expert, chrono
- **Progression** : XP, niveaux, jours d'affilée avec jokers, badges, carnet d'espèces, statistiques, confusions fréquentes
- **Géo** façon GeoGuessr : 5 oiseaux observés dans un rayon de 10 km, n'importe où dans le monde ; tu poses ton pin, points par paliers selon la distance. Fonds Relief (montagnes et fonds marins), Satellite, Topo, Océans, Nuit ; petites îles mises en évidence, carte plein écran
- **Photos** : cadrage sans coupe, grande taille d'office, visionneuse HD au toucher (zoom à deux doigts, double-tap, glisser entre les photos)
- **Maîtrise réelle** : une espèce n'est « maîtrisée » qu'après avoir été reconnue sur 3 photos différentes (dont 1 de terrain), sur 3 jours ; photos jamais vues en priorité ; mémoire à long terme mesurée à 1 semaine et 1 mois
- **Sosies** : critères qui tranchent pour les 36 duels classiques, affichés après une confusion, en Duel et dans les fiches
- **Préparer une sortie** : espèces attendues dans un lieu (ou un point choisi sur la carte) et une période, quiz dessus avant de partir, liste à cocher sur place qui alimente le carnet (« Observées »)
- **Chants** : spectrogramme sur chaque enregistrement quand c'est possible (Wikimedia Commons, xeno-canto), ralenti ×0,5, écoute en boucle, tri chant / cri / alarme
- **Sauvegarde** : envoi en un geste vers Fichiers, iCloud ou un mail, avec rappel régulier
- **Fiches espèces** : galerie, présence par mois, carte des observations, chants, description Wikipédia, espèces qui ressemblent, ton astuce perso

## Données

- iNaturalist (API publique) : photos, sons, listes d'espèces, espèces souvent confondues, présence par mois, cartes. Chaque média garde sa licence et son auteur.
- Wikipédia (résumés), xeno-canto (optionnel, avec ta clé).
- Fonds de carte sans clé : NASA GIBS (Blue Marble), Esri (satellite, topo, océans, noms des lieux), © contributeurs OpenStreetMap. Si un fond ne répond pas, l'appli bascule seule sur un autre.
- Sons : iNaturalist, Wikimedia Commons et xeno-canto (avec ta clé).
- La progression reste dans le navigateur de l'appareil (sauvegarde / restauration dans Réglages). Pas de compte, pas de traceur : détails dans Réglages › Confidentialité et sources.
- Polices (SIL OFL) et Leaflet (BSD-2) sont hébergés avec l'appli : aucun appel à Google Fonts ni à un CDN.

## Développement

Sources dans `src/`. Pour régénérer `index.html` et les icônes : `OUT=. node build.cjs` (nécessite `sharp`).
