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
// Same as select(), but appends an "Autre" option and flags the field so the
// UI reveals a free-text "Précisez" input when the user picks it.
const selectOther = (key, label, options) => ({ key, label, type: 'select', options: [...options, 'Autre'], other: true });
// Checkbox group — several options can be picked at once (e.g. booking a
// manicure and an eyebrow wax in the same beauty appointment).
const multiselect = (key, label, options) => ({ key, label, type: 'multiselect', options });
// Same as multiselect(), but options are split into titled sub-blocks so a
// long list (e.g. 64 beauty treatments) reads as sections instead of one
// undifferentiated wall of checkboxes.
const multiselectGroups = (key, label, groups) => ({ key, label, type: 'multiselect', groups });

const SURFACE_M2 = (label = 'Surface') => num('surfaceM2', label, 'm²');
const WALL_TYPES = ['Béton', 'Placo', 'Brique', 'Bois', 'Autre'];
const MASONRY_WALL_TYPES = ['Parpaing', 'Brique', 'Pierre', 'Béton banché', 'Autre'];
const wasteDisposal = (label) => bool('wasteDisposal', label);

// "Décrivez la mission" room-by-room instead of a flat m² figure — booleans
// for rooms that are typically singular, counts for rooms that repeat.
const roomFields = () => [
  bool('roomKitchen', 'Cuisine'),
  num('roomBathroomCount', 'Nombre de salles de bain'),
  bool('roomLivingRoom', 'Salon'),
  num('roomBedroomCount', 'Nombre de chambres'),
  bool('roomCellar', 'Cellier'),
  num('roomToiletCount', 'Nombre de toilettes'),
];
const APPLIANCES = ['Four', 'Réfrigérateur', 'Micro-ondes', 'Lave-vaisselle', 'Plaques de cuisson', 'Hotte', 'Sèche-linge', 'Lave-linge'];

const poolDimensions = () => [
  num('poolLengthM', 'Longueur du bassin', 'm'),
  num('poolWidthM', 'Largeur du bassin', 'm'),
  num('poolDepthM', 'Profondeur du bassin', 'm'),
];

const PHONE_BRANDS_ANDROID = ['Samsung', 'Xiaomi', 'Google', 'OnePlus', 'Huawei', 'Oppo', 'Sony', 'Motorola', 'Autre'];
const IPHONE_MODELS = [
  'iPhone 7', 'iPhone 8', 'iPhone X', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16', 'Autre',
];

const CAR_BRANDS = [
  'Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Cupra', 'Dacia', 'DS', 'Fiat', 'Ford', 'Honda',
  'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mini',
  'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Škoda', 'Smart',
  'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Autre',
];
const MOTO_BRANDS = [
  'Aprilia', 'BMW', 'Ducati', 'Harley-Davidson', 'Honda', 'Husqvarna', 'Kawasaki', 'KTM',
  'Kymco', 'MBK', 'Peugeot', 'Piaggio', 'Suzuki', 'SYM', 'Triumph', 'Vespa', 'Yamaha', 'Autre',
];
const TRUCK_BRANDS = ['DAF', 'Fiat', 'Ford', 'Iveco', 'MAN', 'Mercedes-Benz', 'Renault', 'Scania', 'Volvo', 'Autre'];

const vehicleFields = (brands) => [
  select('brand', 'Marque', brands),
  text('model', 'Modèle'),
  num('year', 'Année'),
  num('mileageKm', 'Kilométrage', 'km'),
];

const SERVICE_FIELDS = {
  // --- Aide à la personne ---
  'aide-personne-preparation-de-repas': [num('mealsCount', 'Nombre de repas'), text('diet', 'Régime alimentaire particulier (optionnel)')],

  // --- Bricolage ---
  'bricolage-montage-de-meubles': [num('furnitureCount', "Nombre de meubles à monter")],
  'bricolage-pose-d-etageres': [num('shelfCount', "Nombre d'étagères"), select('wallType', 'Type de mur', WALL_TYPES)],
  'bricolage-peinture-interieure': [SURFACE_M2(), num('roomsCount', 'Nombre de pièces')],
  'bricolage-pose-de-papier-peint': [SURFACE_M2()],
  'bricolage-fixation-murale-tv-miroir-': [num('weightKg', 'Poids approximatif', 'kg'), select('wallType', 'Type de mur', WALL_TYPES)],
  'bricolage-pose-de-rideaux-et-stores': [num('windowsCount', 'Nombre de fenêtres'), select('wallType', 'Type de mur', WALL_TYPES)],
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
  'demenagement-debarras-d-encombrants': [
    text('itemsList', 'Liste des encombrants'),
    wasteDisposal('Le jobber devra-t-il évacuer les encombrants en déchèterie ?'),
  ],

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
  'jardinage-tonte-de-pelouse': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les déchets verts en déchèterie ?')],
  'jardinage-taille-de-haie': [
    num('hedgeCurrentHeightM', 'Hauteur actuelle de la haie', 'm'),
    num('hedgeTargetHeightM', 'Hauteur de coupe souhaitée', 'm'),
    num('hedgeLengthM', 'Longueur de la haie', 'm'),
    wasteDisposal('Le jobber devra-t-il évacuer les déchets verts en déchèterie ?'),
  ],
  'jardinage-entretien-de-jardin': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les déchets verts en déchèterie ?')],
  'jardinage-desherbage': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les déchets verts en déchèterie ?')],
  'jardinage-plantation': [num('plantsCount', 'Nombre de plants'), text('plantingType', 'Type de plantation')],
  'jardinage-ramassage-de-feuilles': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les déchets verts en déchèterie ?')],
  'jardinage-elagage': [
    num('treeHeightM', "Hauteur de l'arbre", 'm'), num('treesCount', "Nombre d'arbres"),
    wasteDisposal('Le jobber devra-t-il évacuer les déchets verts en déchèterie ?'),
  ],
  'jardinage-arrosage-pendant-l-absence': [num('absenceDays', "Durée d'absence", 'jours')],
  'jardinage-creation-de-potager': [SURFACE_M2()],

  // --- Mécanique ---
  'mecanique-voiture': vehicleFields(CAR_BRANDS),
  'mecanique-scooter': vehicleFields(MOTO_BRANDS),
  'mecanique-moto': vehicleFields(MOTO_BRANDS),
  'mecanique-camion': vehicleFields(TRUCK_BRANDS),
  'mecanique-autre-vehicule': [text('vehicleType', 'Type de véhicule'), text('brand', 'Marque'), text('model', 'Modèle'), num('year', 'Année'), num('mileageKm', 'Kilométrage', 'km')],

  // --- Ménage ---
  'menage-menage-a-domicile': [...roomFields(), multiselect('appliances', 'Électroménager à nettoyer', APPLIANCES)],
  'menage-repassage': [num('itemsCount', 'Nombre de pièces de linge estimé')],
  'menage-nettoyage-de-vitres': [...roomFields(), num('windowsCount', 'Nombre de fenêtres')],
  'menage-aide-au-rangement': [SURFACE_M2()],
  'menage-menage-de-printemps': [SURFACE_M2()],
  'menage-nettoyage-apres-travaux': [SURFACE_M2()],
  'menage-nettoyage-de-tapis-et-moquettes': [SURFACE_M2()],
  'menage-nettoyage-de-fin-de-bail': [SURFACE_M2()],

  // --- Peinture ---
  'peinture-peinture-interieure': [SURFACE_M2(), num('coatsCount', 'Nombre de couches souhaité'), ...roomFields()],
  'peinture-peinture-exterieure': [SURFACE_M2()],
  'peinture-ravalement-de-facade': [SURFACE_M2()],
  'peinture-enduit-et-lissage-des-murs': [SURFACE_M2()],
  'peinture-pose-de-papier-peint': [SURFACE_M2(), ...roomFields()],
  'peinture-peinture-decorative': [SURFACE_M2()],
  'peinture-vernis-et-lasure': [SURFACE_M2()],
  'peinture-peinture-de-portail-ou-portillon-metal': [
    select('condition', 'État actuel', ['Bon état — simple couche', 'Rouille légère — traitement nécessaire', 'Rouille importante — décapage complet']),
    num('surfaceM2', 'Surface approximative', 'm²'),
  ],

  // --- Piscine ---
  'piscine-entretien': [
    ...poolDimensions(),
    bool('tileGluing', 'Collage de carreaux nécessaire'),
    num('skimmersCount', 'Nombre de skimmers'),
    bool('robotOnSite', 'Présence d\'un robot sur place'),
    bool('cleaningEquipmentProvided', 'Matériel de balayage et épuisette fournis'),
    bool('productsProvided', 'Produits d\'entretien fournis'),
  ],
  'piscine-remise-en-etat': [...poolDimensions()],
  'piscine-peinture': [
    ...poolDimensions(),
    multiselect('extraOperations', 'Autres opérations à prévoir', ['Ponçage', 'Réparation résine', 'Réparation enduit', 'Démontage des buses et bondes']),
    select('paintType', 'Type de peinture souhaitée', ['Gel coat', 'Acrylique', 'Résine époxy', 'Autre']),
  ],

  // --- Plomberie ---
  'plomberie-installation-sanitaire': [text('installationType', "Type d'installation")],
  'plomberie-chauffe-eau-et-ballon': [num('capacityL', 'Capacité du ballon', 'L')],
  'plomberie-robinetterie': [num('tapsCount', 'Nombre de robinets')],

  // --- Beauté ---
  'beaute-prestations-beaute': [
    multiselectGroups('prestations', 'Prestations souhaitées', [
      { title: 'Épilation femme', options: [
        'Épilation sourcils', 'Épilation des lèvres', 'Épilation menton', 'Épilation aisselles',
        'Épilation 1/2 bras', 'Épilation bras complets', 'Épilation maillot simple', 'Maillot semi-intégral',
        'Maillot échancré', 'Maillot brésilien', 'Épilation maillot intégral', 'Épilation sillon i.f.',
        'Épilation 1/2 jambes', 'Épilation 3/4 jambes', 'Épilation jambes', 'Épilation des cuisses', 'Épilation fesses',
      ] },
      { title: 'Épilation homme', options: [
        'Épilation homme épaules', 'Épilation homme torse & ventre', 'Épilation homme dos',
        'Épilation homme aisselles', 'Épilation homme Maillot intégral', 'Épilation homme bras',
        'Épilation homme jambes', 'Épilation homme nez & oreilles',
      ] },
      { title: 'Onglerie mains/pieds', options: [
        'Manucure', 'Manucure & semi-permanent', 'Manucure + pose de vernis', 'Vernis classique',
        'Vernis semi-permanent', 'Dépose mains semi-permanent', 'Faux ongles gel & semi',
        'Faux ongles remplissage au gel', 'Dépose mains faux ongles', 'Beauté pieds express',
        'Beauté pieds complète', 'Beauté pieds & vernis classique', 'Beauté pieds & semi-permanent',
        'Vernis des pieds', 'Vernis des pieds semi-permanent', 'Dépose pieds semi-permanent',
      ] },
      { title: 'Cils & sourcils', options: [
        'Teinture sourcils', 'Teinture des cils', 'Extension cils', 'Extension cils cil à cil',
        'Extension cils effet naturel', 'Remplissage cil à cil', 'Volume russe cil à cil',
        'Remplissage cils volume russe',
      ] },
      { title: 'Maquillage', options: [
        'Maquillage simple', 'Maquillage', 'Maquillage de soirée', 'Maquillage mariée', 'Maquillage mariée & essai',
      ] },
      { title: 'Soins visage/corps', options: [
        'Soin hydratant', 'Soin anti-âge', 'Soin purifiant', 'Soin éclat', 'Soin coup d\'éclat',
        'Soin contour yeux', 'Gommage Corps', 'Soin Dos', 'Massage crânien', 'Réflexologie plantaire',
      ] },
    ]),
  ],

  // --- Maçonnerie ---
  'maconnerie-monter-un-mur': [
    SURFACE_M2(), select('wallType', 'Type de mur', MASONRY_WALL_TYPES),
    wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?'),
  ],
  'maconnerie-crepi-exterieur': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?')],
  'maconnerie-terrassement': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?')],
  'maconnerie-dalle-beton': [
    SURFACE_M2(), num('thicknessCm', 'Épaisseur', 'cm'),
    wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?'),
  ],
  'maconnerie-construction-extension-ou-garage': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?')],
  'maconnerie-pose-de-carrelage-exterieur': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?')],
  'maconnerie-pose-de-paves-et-dallage': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?')],
  'maconnerie-muret-et-cloture': [
    num('lengthM', 'Longueur', 'm'), num('heightM', 'Hauteur', 'm'),
    wasteDisposal('Le jobber devra-t-il évacuer les gravats en déchèterie ?'),
  ],
  'maconnerie-reparation-de-fissures': [num('crackCount', 'Nombre de fissures')],
  'maconnerie-demolition': [SURFACE_M2(), wasteDisposal('Le jobber devra-t-il évacuer les gravats et déchets de chantier en déchèterie ?')],

  // --- Manutention ---
  'manutention-emballage': [num('boxesCount', 'Nombre de cartons estimé')],
  'manutention-rangement': [SURFACE_M2()],
  'manutention-chargement-dechargement': [text('itemsList', 'Nature des objets à charger/décharger')],

  // --- Bien être ---
  'bien-etre-massage': [
    selectOther('massageType', 'Type de massage', [
      'Massage découverte', 'Massage relaxant', 'Massage deep tissue', 'Massage ayurvédique',
      'Massage lomi-lomi', 'Massage prénatal', 'Massage assis', 'Réflexologie plantaire',
      'Soin hydratant', 'Soin anti-âge', 'Massage du dos', 'Massage crânien', 'Massage suédois',
      'Massage californien', 'Massage palper rouler', 'Massage shiatsu', 'Massage thaï',
    ]),
  ],
  'bien-etre-coach-sportif': [
    selectOther('sessionType', 'Type de séance', [
      'Séance de sophrologie', 'Cours de pilates', 'Cours de stretching', 'Cours de HIIT',
      'Cours de cardio-training', 'Cours de fitness enfant', 'Cours de cuisses-abdos-fessiers',
      'Cours de yoga doux', 'Cours de yoga enfant', 'Cours de yoga dynamique',
    ]),
  ],

  // --- Smartphone ---
  'smartphone-remplacement-ecran-android': [
    select('brand', 'Marque', PHONE_BRANDS_ANDROID), text('model', 'Modèle'), num('year', 'Année'),
  ],
  'smartphone-remplacement-ecran-apple': [
    select('model', 'Modèle iPhone', IPHONE_MODELS), num('year', 'Année'),
  ],
  'smartphone-reinitialiser-et-tout-supprimer': [
    select('os', 'Système', ['Android', 'Apple / iOS']), text('model', 'Modèle'),
  ],
  'smartphone-debug': [
    select('os', 'Système', ['Android', 'Apple / iOS']), text('model', 'Modèle'), text('issue', 'Nature du problème'),
  ],

  // --- Web ---
  'web-intervention-sur-site-web': [
    select('cms', 'CMS / plateforme', ['WordPress', 'Shopify', 'Wix', 'Squarespace', 'Prestashop', 'Autre']),
    text('issue', "Nature de l'intervention"),
  ],
  'web-creation-graphique': [
    select('type', 'Type de création', ['Logo', 'Charte graphique', 'Bannières', 'Flyer / affiche', 'Autre']),
    text('style', 'Style souhaité (optionnel)'),
  ],
  'web-generer-du-contenu': [
    select('contentType', 'Type de contenu', ['Articles de blog', 'Fiches produits', 'Descriptions', 'Scripts vidéo', 'Autre']),
    num('quantity', 'Quantité (nombre de contenus)'),
  ],
  'web-reseaux-sociaux': [
    multiselect('platforms', 'Réseaux concernés', ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Twitter / X', 'Pinterest', 'YouTube']),
    text('goal', 'Objectif (visibilité, ventes, communauté…)'),
  ],
  'web-developper-un-site-web': [
    select('siteType', 'Type de site', ['Vitrine', 'E-commerce', 'Blog', 'Application web', 'Autre']),
    num('pagesCount', 'Nombre de pages estimé'),
  ],
  'web-developper-une-application': [
    select('platform', 'Plateforme', ['iOS', 'Android', 'iOS et Android', 'Web app']),
    text('appType', "Type d'application"),
  ],
  'web-referencement-naturel-seo': [
    text('targetKeywords', 'Mots-clés visés'),
    select('scope', 'Périmètre', ['Audit SEO', 'Optimisation on-page', 'Netlinking', 'Suivi mensuel']),
  ],
  'web-publicite-ads': [
    select('platform', 'Plateforme publicitaire', ['Google Ads', 'Meta Ads (Facebook/Instagram)', 'TikTok Ads', 'LinkedIn Ads', 'Autre']),
    num('budgetEur', 'Budget mensuel envisagé', '€'),
  ],
  'web-referencement-marketplace': [
    multiselect('marketplaces', 'Marketplaces visées', ['Amazon', 'Cdiscount', 'Etsy', 'ManoMano', 'Google Shopping', 'Autre']),
    num('productsCount', 'Nombre de produits à référencer'),
  ],
  'web-me-faire-connaitre': [
    text('goal', 'Objectif de visibilité'), text('audience', 'Cible / audience visée'),
  ],

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
