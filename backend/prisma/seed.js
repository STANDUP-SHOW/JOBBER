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
