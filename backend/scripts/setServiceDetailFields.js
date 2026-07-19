// One-off: defines the extra structured fields collected at mission-
// publishing time for each service (e.g. hedge height for "Taille de haie",
// surface for "Tonte de pelouse", old/new home surface + floor + elevator
// for "Aide au déménagement"). Safe to re-run — always overwrites
// detailFields for every mapped service slug. Services not listed here keep
// detailFields null (title/description are enough for them).
// Run once via `node scripts/setServiceDetailFields.js`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const num = (key, label, unit) => ({ key, label, type: 'number', unit });
const text = (key, label, placeholder) => ({ key, label, type: 'text', placeholder });
const bool = (key, label) => ({ key, label, type: 'boolean' });
const select = (key, label, options) => ({ key, label, type: 'select', options });

const SURFACE_M2 = (label = 'Surface') => num('surfaceM2', label, 'm²');

const SERVICE_FIELDS = {
  // --- Aide à la personne ---
  'aide-personne-preparation-de-repas': [num('mealsCount', 'Nombre de repas'), text('diet', 'Régime alimentaire particulier (optionnel)')],

  // --- Bricolage ---
  'bricolage-montage-de-meubles': [num('furnitureCount', "Nombre de meubles à monter")],
  'bricolage-pose-d-etageres': [num('shelfCount', "Nombre d'étagères"), select('wallType', 'Type de mur', ['Béton', 'Placo', 'Brique', 'Bois', 'Autre'])],
  'bricolage-peinture-interieure': [SURFACE_M2(), num('roomsCount', 'Nombre de pièces')],
  'bricolage-pose-de-papier-peint': [SURFACE_M2()],
  'bricolage-fixation-murale-tv-miroir-': [num('weightKg', 'Poids approximatif', 'kg'), select('wallType', 'Type de mur', ['Béton', 'Placo', 'Brique', 'Bois', 'Autre'])],
  'bricolage-pose-de-rideaux-et-stores': [num('windowsCount', 'Nombre de fenêtres')],
  'bricolage-montage-de-meubles-de-jardin': [num('furnitureCount', 'Nombre de meubles')],

  // --- Convoi ---
  'convoi-convoyage-de-vehicule': [num('distanceKm', 'Distance approximative', 'km'), text('vehicleType', 'Type de véhicule')],
  'convoi-accompagnement-longue-distance': [num('distanceKm', 'Distance approximative', 'km')],
  'convoi-livraison-de-vehicule': [num('distanceKm', 'Distance approximative', 'km')],
  'convoi-transport-de-marchandises': [num('weightKg', 'Poids approximatif', 'kg')],

  // --- Cours particuliers ---
  'cours-particuliers-soutien-scolaire': [select('schoolLevel', 'Niveau scolaire', ['Primaire', 'Collège', 'Lycée', 'Supérieur']), text('subject', 'Matière')],
  'cours-particuliers-cours-d-informatique': [select('level', 'Niveau', ['Débutant', 'Intermédiaire', 'Avancé'])],
  'cours-particuliers-cours-de-langues': [text('language', 'Langue'), select('level', 'Niveau', ['Débutant', 'Intermédiaire', 'Avancé'])],
  'cours-particuliers-cours-de-musique': [text('instrument', 'Instrument'), select('level', 'Niveau', ['Débutant', 'Intermédiaire', 'Avancé'])],
  'cours-particuliers-cours-de-mathematiques': [select('schoolLevel', 'Niveau scolaire', ['Primaire', 'Collège', 'Lycée', 'Supérieur'])],
  'cours-particuliers-preparation-aux-examens': [text('exam', 'Examen visé')],
  'cours-particuliers-coaching-sportif': [text('goal', 'Objectif'), select('level', 'Niveau', ['Débutant', 'Intermédiaire', 'Avancé'])],

  // --- Déménagement ---
  'demenagement-aide-au-demenagement': [
    num('oldHomeSurfaceM2', 'Surface ancien logement', 'm²'),
    num('newHomeSurfaceM2', 'Surface nouveau logement', 'm²'),
    num('oldHomeFloor', 'Étage ancien logement'),
    bool('oldHomeElevator', 'Ascenseur (ancien logement)'),
    num('newHomeFloor', 'Étage nouveau logement'),
    bool('newHomeElevator', 'Ascenseur (nouveau logement)'),
  ],
  'demenagement-deplacer-un-meuble': [text('furnitureType', 'Type de meuble'), num('weightKg', 'Poids approximatif', 'kg')],
  'demenagement-emballage-de-cartons': [num('boxesCount', 'Nombre de cartons estimé')],
  'demenagement-deballage-et-rangement': [num('boxesCount', 'Nombre de cartons estimé')],
  'demenagement-montage-et-demontage-de-meubles': [num('furnitureCount', 'Nombre de meubles')],
  'demenagement-location-et-transport-de-camion': [num('volumeM3', 'Volume nécessaire', 'm³')],
  'demenagement-debarras-d-encombrants': [text('itemsList', 'Liste des encombrants')],

  // --- Électricité ---
  'electricite-installation-electrique': [num('pointsCount', 'Nombre de points électriques')],
  'electricite-mise-aux-normes': [SURFACE_M2('Surface du logement')],
  'electricite-tableau-electrique': [text('panelAge', 'Âge du tableau électrique')],
  'electricite-eclairage': [num('pointsCount', 'Nombre de points lumineux')],
  'electricite-domotique': [text('equipmentType', "Type d'équipement souhaité")],
  'electricite-chauffage-electrique': [num('radiatorsCount', 'Nombre de radiateurs')],
  'electricite-prises-et-interrupteurs': [num('pointsCount', "Nombre de prises/interrupteurs")],

  // --- Garde d'animaux ---
  'garde-animaux-promenade-de-chien': [num('animalsCount', 'Nombre de chiens')],
  'garde-animaux-pet-sitting': [text('animalType', "Type d'animal"), num('animalsCount', "Nombre d'animaux")],
  'garde-animaux-garde-a-domicile': [text('animalType', "Type d'animal")],
  'garde-animaux-toilettage-leger': [text('animalType', "Type d'animal"), text('breed', 'Race')],
  'garde-animaux-visite-et-soins-quotidiens': [text('careType', 'Type de soins')],
  'garde-animaux-transport-veterinaire': [text('animalType', "Type d'animal")],

  // --- Garde d'enfants ---
  'garde-enfants-baby-sitting': [num('childrenCount', "Nombre d'enfants"), text('ages', 'Âges')],
  'garde-enfants-sortie-d-ecole': [num('childrenCount', "Nombre d'enfants")],
  'garde-enfants-aide-aux-devoirs': [select('schoolLevel', 'Niveau scolaire', ['Primaire', 'Collège', 'Lycée'])],
  'garde-enfants-garde-le-soir-et-le-week-end': [num('childrenCount', "Nombre d'enfants"), text('ages', 'Âges')],
  'garde-enfants-garde-pendant-les-vacances': [num('childrenCount', "Nombre d'enfants"), text('ages', 'Âges')],
  'garde-enfants-activites-et-jeux-educatifs': [text('ages', 'Âges')],
  'garde-enfants-trajet-domicile-activites': [num('childrenCount', "Nombre d'enfants")],

  // --- Informatique ---
  'informatique-nettoyage-d-ordinateur': [select('deviceType', "Type d'appareil", ['PC fixe', 'Ordinateur portable', 'Mac'])],
  'informatique-installation-de-logiciels': [text('softwareList', 'Logiciels à installer')],
  'informatique-sauvegarde-de-donnees': [select('dataVolume', 'Volume de données', ['Peu (< 50 Go)', 'Beaucoup (> 50 Go)'])],
  'informatique-configuration-smartphone-et-tablette': [text('deviceType', "Type d'appareil")],
  'informatique-initiation-informatique': [select('level', 'Niveau', ['Débutant', 'Intermédiaire'])],

  // --- Jardinage --- (l'exemple donné explicitement)
  'jardinage-tonte-de-pelouse': [SURFACE_M2()],
  'jardinage-taille-de-haie': [
    num('hedgeCurrentHeightM', 'Hauteur actuelle de la haie', 'm'),
    num('hedgeTargetHeightM', 'Hauteur de coupe souhaitée', 'm'),
    num('hedgeLengthM', 'Longueur de la haie', 'm'),
  ],
  'jardinage-entretien-de-jardin': [SURFACE_M2()],
  'jardinage-desherbage': [SURFACE_M2()],
  'jardinage-plantation': [num('plantsCount', 'Nombre de plants'), text('plantingType', 'Type de plantation')],
  'jardinage-ramassage-de-feuilles': [SURFACE_M2()],
  'jardinage-elagage': [num('treeHeightM', "Hauteur de l'arbre", 'm'), num('treesCount', "Nombre d'arbres")],
  'jardinage-arrosage-pendant-l-absence': [num('absenceDays', "Durée d'absence", 'jours')],
  'jardinage-creation-de-potager': [SURFACE_M2()],

  // --- Mécanique ---
  'mecanique-voiture': [text('vehicleModel', 'Marque / modèle'), num('mileageKm', 'Kilométrage', 'km')],
  'mecanique-scooter': [text('vehicleModel', 'Marque / modèle')],
  'mecanique-moto': [text('vehicleModel', 'Marque / modèle')],
  'mecanique-camion': [text('vehicleModel', 'Marque / modèle')],
  'mecanique-autre-vehicule': [text('vehicleType', 'Type de véhicule')],

  // --- Ménage ---
  'menage-menage-a-domicile': [SURFACE_M2()],
  'menage-repassage': [num('itemsCount', 'Nombre de pièces de linge estimé')],
  'menage-nettoyage-de-vitres': [num('windowsCount', 'Nombre de fenêtres')],
  'menage-aide-au-rangement': [SURFACE_M2()],
  'menage-menage-de-printemps': [SURFACE_M2()],
  'menage-nettoyage-apres-travaux': [SURFACE_M2()],
  'menage-nettoyage-de-tapis-et-moquettes': [SURFACE_M2()],
  'menage-nettoyage-de-fin-de-bail': [SURFACE_M2()],

  // --- Peinture ---
  'peinture-peinture-interieure': [SURFACE_M2(), num('coatsCount', 'Nombre de couches souhaité')],
  'peinture-peinture-exterieure': [SURFACE_M2()],
  'peinture-ravalement-de-facade': [SURFACE_M2()],
  'peinture-enduit-et-lissage-des-murs': [SURFACE_M2()],
  'peinture-pose-de-papier-peint': [SURFACE_M2()],
  'peinture-peinture-decorative': [SURFACE_M2()],
  'peinture-vernis-et-lasure': [SURFACE_M2()],

  // --- Piscine ---
  'piscine-entretien': [num('volumeM3', 'Volume de la piscine', 'm³')],
  'piscine-remise-en-etat': [num('volumeM3', 'Volume de la piscine', 'm³')],
  'piscine-peinture': [num('surfaceM2', 'Surface à peindre', 'm²')],

  // --- Plomberie ---
  'plomberie-installation-sanitaire': [text('installationType', "Type d'installation")],
  'plomberie-chauffe-eau-et-ballon': [num('capacityL', 'Capacité du ballon', 'L')],
  'plomberie-robinetterie': [num('tapsCount', 'Nombre de robinets')],

  // --- Transport ---
  'transport-transport-de-personnes': [num('passengersCount', 'Nombre de passagers')],
  'transport-transport-de-colis': [text('sizeWeight', 'Poids / volume approximatif')],
  'transport-livraison-express': [text('sizeWeight', 'Poids / volume approximatif')],
  'transport-trajet-aeroport-ou-gare': [num('passengersCount', 'Nombre de passagers'), num('luggageCount', 'Nombre de bagages')],
  'transport-covoiturage-regulier': [num('passengersCount', 'Nombre de passagers')],
  'transport-transport-de-courses': [num('bagsCount', 'Nombre de sacs estimé')],
};

async function main() {
  let updated = 0;
  let missing = 0;
  for (const [slug, detailFields] of Object.entries(SERVICE_FIELDS)) {
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service) { console.log(`Service introuvable : ${slug}`); missing++; continue; }
    await prisma.service.update({ where: { id: service.id }, data: { detailFields } });
    updated++;
  }
  console.log(`\n${updated} service(s) mis à jour, ${missing} slug(s) introuvable(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
