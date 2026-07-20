const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Ménage', slug: 'menage', icon: '🧹', services: [
    'Ménage à domicile', 'Ménage de printemps', 'Repassage', 'Nettoyage de vitres', 'Aide au rangement',
    'Nettoyage après travaux', 'Nettoyage de four', 'Nettoyage de tapis et moquettes', 'Nettoyage de fin de bail',
  ], equipment: [
    'Aspirateur', 'Aspirateur vapeur', 'Nettoyeur haute pression', "Chariot de ménage", 'Chiffons microfibres',
    'Balai et serpillière', 'Escabeau', 'Produits d\'entretien écologiques', 'Gants de ménage', 'Raclette à vitres',
    'Fer et table à repasser', 'Housses de protection meubles', 'Sacs poubelle et gros sacs de rangement',
  ] },
  { name: 'Bricolage', slug: 'bricolage', icon: '🔧', services: [
    'Petites réparations', 'Montage de meubles', "Pose d'étagères", 'Peinture intérieure', 'Pose de papier peint',
    'Plomberie légère', 'Électricité légère', 'Fixation murale (TV, miroir…)', 'Pose de rideaux et stores', 'Montage de meubles de jardin',
  ], equipment: [
    'Perceuse-visseuse', 'Boîte à outils complète', 'Niveau à bulle', 'Mètre ruban', 'Scie sauteuse',
    'Détecteur de câbles et canalisations', 'Ponceuse électrique', 'Marteau et maillet', 'Jeu de tournevis',
    'Clé à molette et jeu de clés', 'Escabeau / échelle', 'Pistolet à silicone', 'Cutter et couteau universel',
    'Chevilles et fixations diverses', 'Rouleaux et pinceaux de peinture', 'Bâches de protection',
  ] },
  { name: 'Déménagement', slug: 'demenagement', icon: '📦', services: [
    'Aide au déménagement', 'Déplacer un meuble', 'Emballage de cartons', 'Déballage et rangement',
    'Montage et démontage de meubles', 'Location et transport de camion', "Débarras d'encombrants",
  ], equipment: [
    'Diable / chariot de transport', 'Sangles de manutention', 'Couvertures de déménagement',
    'Cartons de déménagement', 'Adhésif et scotch large', 'Film étirable', 'Monte-meuble ou sangles d\'épaule',
    'Gants de manutention', 'Chariot escamotable', 'Utilitaire ou camion', 'Diable monte-escalier',
  ] },
  { name: 'Jardinage', slug: 'jardinage', icon: '🌱', services: [
    'Tonte de pelouse', 'Taille de haie', 'Entretien de jardin', 'Désherbage', 'Plantation',
    'Ramassage de feuilles', 'Élagage', "Arrosage pendant l'absence", 'Création de potager',
  ], equipment: [
    'Tondeuse à gazon', 'Taille-haie', 'Débroussailleuse', 'Souffleur / aspirateur de feuilles',
    'Sécateur et cisailles', 'Tronçonneuse', 'Râteau et balai de jardin', 'Bêche et pelle',
    'Brouette', 'Gants de jardinage', 'Tuyau d\'arrosage et arrosoir', 'Sacs à déchets verts',
  ] },
  { name: "Garde d'enfants", slug: 'garde-enfants', icon: '🧒', services: [
    'Baby-sitting', "Sortie d'école", 'Aide aux devoirs', 'Garde le soir et le week-end',
    'Garde pendant les vacances', 'Activités et jeux éducatifs', 'Trajet domicile-activités',
  ], equipment: [
    'Trousse de premiers secours', 'Siège auto (si transport)', 'Matériel de jeux et d\'éveil',
    'Livres et supports pédagogiques', 'Trousse à langer', 'Poussette (si besoin)',
  ] },
  { name: 'Cours particuliers', slug: 'cours-particuliers', icon: '📚', services: [
    'Soutien scolaire', "Cours d'informatique", 'Cours de langues', 'Cours de musique',
    'Cours de mathématiques', 'Préparation aux examens', 'Coaching sportif',
  ], equipment: [
    'Ordinateur portable', 'Supports de cours et manuels', 'Tableau blanc portatif',
    'Matériel de calcul (calculatrice, géométrie)', 'Instrument de musique (selon la discipline)',
    'Tapis et matériel de coaching sportif',
  ] },
  { name: 'Aide à la personne', slug: 'aide-personne', icon: '🤝', services: [
    'Accompagnement courses', 'Accompagnement rendez-vous médicaux', 'Préparation de repas', 'Aide à la toilette',
    'Aide administrative', 'Compagnie et conversation', 'Aide au lever et au coucher', 'Accompagnement sorties',
  ], equipment: [
    'Gants jetables', 'Trousse de premiers secours', 'Matériel d\'aide au transfert (si formé)',
    'Sac de courses réutilisable', 'Chaise/déambulateur de transport (si besoin)',
  ] },
  { name: "Garde d'animaux", slug: 'garde-animaux', icon: '🐾', services: [
    'Promenade de chien', 'Pet-sitting', 'Garde à domicile', 'Toilettage léger',
    'Visite et soins quotidiens', 'Transport vétérinaire',
  ], equipment: [
    'Laisse et harnais', 'Sacs à déjections', 'Gamelles de transport', 'Cage ou box de transport',
    'Brosse et matériel de toilettage', 'Trousse de premiers secours animaliers',
  ] },
  { name: 'Informatique', slug: 'informatique', icon: '💻', services: [
    "Installation d'imprimante", "Nettoyage d'ordinateur", 'Installation de box', 'Dépannage informatique',
    'Installation de logiciels', 'Sauvegarde de données', 'Configuration smartphone et tablette', 'Initiation informatique',
  ], equipment: [
    'Ordinateur portable', 'Jeu de tournevis de précision', 'Bombe d\'air sec', 'Clé USB / disque dur externe',
    'Câbles (Ethernet, HDMI, USB…)', 'Multiprise et parasurtenseur', 'Kit de nettoyage écran',
  ] },
  { name: 'Transport', slug: 'transport', icon: '🚗', services: [
    'Transport de personnes', 'Transport de colis', 'Livraison express', 'Trajet aéroport ou gare',
    'Covoiturage régulier', 'Transport de courses',
  ], equipment: [
    'Véhicule assuré et en règle', 'GPS / application de navigation', 'Diable pliable', 'Sangles d\'arrimage',
    'Housses de protection sièges', 'Trousse de premiers secours véhicule',
  ] },
  { name: 'Convoi', slug: 'convoi', icon: '🚚', services: [
    'Convoyage de véhicule', 'Accompagnement longue distance', 'Livraison de véhicule', 'Transport de marchandises',
  ], equipment: [
    'Permis de conduire adapté au véhicule', 'Sangles et cales d\'arrimage', 'Gilet et triangle de sécurité',
    'GPS / application de navigation', 'Bâche de protection', 'Diable pour marchandises',
  ] },
  { name: 'Mécanique', slug: 'mecanique', icon: '🔩', services: [
    'Voiture', 'Scooter', 'Moto', 'Camion', 'Autre véhicule',
  ], equipment: [
    'Cric hydraulique', 'Chandelles de sécurité', 'Jeu de clés à cliquet et douilles', 'Multimètre',
    'Valise de diagnostic OBD', 'Compresseur d\'air', 'Bac de vidange', 'Chiffons et absorbant',
    'Gants mécanicien', 'Lampe torche / frontale', 'Chargeur de batterie / booster',
  ] },
  { name: 'Électricité', slug: 'electricite', icon: '⚡', services: [
    'Installation électrique', 'Mise aux normes', 'Dépannage électrique', 'Tableau électrique',
    'Éclairage', 'Domotique', 'Chauffage électrique', 'Prises et interrupteurs',
  ], equipment: [
    'Multimètre', 'Pince ampèremétrique', 'Testeur de tension (VAT)', 'Tournevis isolés',
    'Pince à dénuder', 'Perceuse-visseuse', 'Détecteur de câbles et métaux', 'Gants isolants',
    'Casque et lunettes de protection', 'Dominos et connectiques',
  ] },
  { name: 'Plomberie', slug: 'plomberie', icon: '🚰', services: [
    'Dépannage plomberie', 'Installation sanitaire', 'Débouchage de canalisation', 'Chauffe-eau et ballon',
    'Robinetterie', 'Recherche de fuite', 'Salle de bain', 'Cuisine (plomberie)',
  ], equipment: [
    'Clé à molette', 'Pince multiprise', 'Furet / dégorgeoir', 'Ventouse', 'Chalumeau',
    'Téflon et joints', 'Kit de raccords PVC/cuivre', 'Détecteur de fuite', 'Seau et bassine', 'Gants étanches',
  ] },
  { name: 'Peinture', slug: 'peinture', icon: '🎨', services: [
    'Peinture intérieure', 'Peinture extérieure', 'Ravalement de façade', 'Enduit et lissage des murs',
    'Pose de papier peint', 'Peinture décorative', 'Vernis et lasure',
  ], equipment: [
    'Rouleaux et pinceaux', 'Bâches de protection', 'Ruban de masquage', 'Escabeau / échelle',
    'Échafaudage léger', 'Pistolet à peinture', 'Ponceuse', 'Enduit et spatules',
    'Combinaison de protection', 'Bac et grille à peinture',
  ] },
  { name: 'Piscine', slug: 'piscine', icon: '🏊', services: [
    'Entretien', 'Remise en état', 'Peinture',
  ], equipment: [
    'Épuisette', 'Robot de piscine / aspirateur', 'Kit d\'analyse d\'eau (pH et chlore)', 'Brosse de bassin',
    'Perche télescopique', 'Floculant et produits de traitement', 'Pompe de vidange', 'Peinture piscine (résine/époxy)',
    'Rouleaux et pinceaux', 'Ponceuse / décapeur', 'Gants et lunettes de protection',
  ] },
  { name: 'Manutention', slug: 'manutention', icon: '🏗️', services: [
    'Emballage', 'Rangement', 'Chargement-déchargement',
  ], equipment: [
    'Diable / chariot de transport', 'Sangles de manutention', 'Gants de manutention',
    'Cartons et caisses', 'Film étirable', 'Chariot escamotable',
  ] },
  { name: 'Bien être', slug: 'bien-etre', icon: '💆', services: [
    'Massage', 'Coach sportif',
  ], equipment: [
    'Table de massage', 'Huiles et crèmes de massage', 'Tapis de sol', 'Matériel de fitness léger',
  ] },
  { name: 'Beauté', slug: 'beaute', icon: '💅', services: [
    'Épilation du sillon inter-fessier', 'Manucure', 'Pose de vernis semi-permanent mains',
    'Épilation Maillot intégral', 'Épilation des sourcils', 'Épilation aisselles',
    'Épilation des jambes entières', 'Vernis des pieds semi-permanent', 'Épilation 1/2 jambes',
    'Beauté des pieds complète', 'Épilation homme',
  ], equipment: [
    'Kit d\'épilation à la cire', 'Bandes d\'épilation', 'Vernis et base semi-permanente', 'Lampe UV/LED',
    'Instruments de manucure/pédicure stérilisés', 'Gants jetables', 'Crème apaisante post-épilation',
  ] },
  { name: 'Coiffure', slug: 'coiffure', icon: '💇', services: [
    'Coupe femme cheveux courts', 'Coupe homme', 'Brushing cheveux courts', 'Couleur racines',
    'Mèches cheveux', 'Balayage cheveux', 'Coiffure de soirée', 'Coiffure mariée', 'Lissage brésilien',
    'Coupe enfant', 'Couleur homme', 'Taille de barbe', 'Coiffure enfant', 'Brushing élaboré',
    'Couleur complète', 'Soin profond', 'Ombré hair', 'Brushing cheveux longs', 'Coiffure mariée & essai',
    'Coupe cheveux longs', 'Patine cheveux', 'Permanente', 'Shampoing femme', 'Shampoing homme',
  ], equipment: [
    'Ciseaux de coiffure professionnels', 'Tondeuse', 'Sèche-cheveux', 'Brosses et peignes',
    'Kit de coloration', 'Papillotes pour mèches/balayage', 'Fer à lisser', 'Cape de coiffure',
    'Pinces et épingles à cheveux',
  ] },
];

async function main() {
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });

    for (const serviceName of cat.services) {
      const slug = `${cat.slug}-${serviceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
      await prisma.service.upsert({
        where: { slug },
        update: {},
        create: { name: serviceName, slug, categoryId: category.id },
      });
    }

    for (const equipmentName of cat.equipment || []) {
      await prisma.equipment.upsert({
        where: { categoryId_name: { categoryId: category.id, name: equipmentName } },
        update: {},
        create: { name: equipmentName, categoryId: category.id },
      });
    }
  }

  const adminEmail = 'admin@jobber.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('ChangeMe123!', 10),
        firstName: 'Admin',
        lastName: 'Jobber',
        role: 'ADMIN',
      },
    });
  }

  console.log('Seed terminé: catégories, services et compte admin créés.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
