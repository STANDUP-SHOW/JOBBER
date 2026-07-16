// One-off demo-data seeder: 20 fully-filled-out jobber profiles (mix of
// Professionnel/Expert/Passionné, spanning every category) and 20 missions
// (mix of Urgent / Dates flexibles, spanning every category), so the badges
// and profile completeness can be reviewed end to end. Safe to re-run —
// upserts jobbers by email, always appends fresh missions.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { geocodeAddress } = require('../src/services/geocodingService');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'DemoJobber123!';
const MISSION_CLIENT_EMAIL = 'admin@jobber.local';

function generateValidSiret() {
  let base = '';
  for (let i = 0; i < 13; i++) base += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = Number(base[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

function daysFromNow(n, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const JOBBERS = [
  { email: 'sophie.martin.demo@example.com', firstName: 'Sophie', lastName: 'Martin', address: '12 Allée des Cerisiers, Béziers',
    categories: [
      { slug: 'menage', level: 'EXPERT', hourlyRate: 18, bio: "Je m'occupe de votre intérieur comme du mien : minutieuse, rapide, et toujours à l'heure. Plus de 5 ans à faire briller appartements et maisons sur le Biterrois." },
      { slug: 'aide-personne', level: 'PASSIONNE', hourlyRate: 15, bio: "À l'écoute et patiente, j'aime accompagner les personnes âgées dans leur quotidien — courses, présence, petits gestes du quotidien." },
    ] },
  { email: 'karim.bensaid.demo@example.com', firstName: 'Karim', lastName: 'Bensaid', address: '5 Rue de la République, Agde',
    categories: [
      { slug: 'bricolage', level: 'PROFESSIONNEL', hourlyRate: 28, bio: "Artisan indépendant depuis 8 ans, je réalise tous types de travaux de bricolage : montage, fixation, petites réparations. Devis clair, travail soigné." },
      { slug: 'electricite', level: 'EXPERT', hourlyRate: 25, bio: "Formé à l'électricité générale, je dépanne et installe en respectant les normes en vigueur. Interventions rapides sur Agde et alentours." },
    ] },
  { email: 'julie.fabre.demo@example.com', firstName: 'Julie', lastName: 'Fabre', address: "8 Impasse des Vignes, Pézenas",
    categories: [
      { slug: 'jardinage', level: 'PASSIONNE', hourlyRate: 16, bio: "Passionnée de jardinage depuis toujours, je prends soin de vos espaces verts avec plaisir : tonte, taille, entretien régulier." },
    ] },
  { email: 'thomas.roche.demo@example.com', firstName: 'Thomas', lastName: 'Roche', address: '3 Avenue de la Mer, Valras-Plage',
    categories: [
      { slug: 'demenagement', level: 'EXPERT', hourlyRate: 22, bio: "Costaud et organisé, j'ai participé à des dizaines de déménagements. Je porte, j'emballe, je monte les meubles — sans rien casser." },
      { slug: 'transport', level: 'PASSIONNE', hourlyRate: 16, bio: "Véhicule utilitaire disponible pour vos trajets et petits transports sur le secteur de Valras et Béziers." },
    ] },
  { email: 'amandine.petit.demo@example.com', firstName: 'Amandine', lastName: 'Petit', address: '20 Rue Saint-Jacques, Sérignan',
    categories: [
      { slug: 'garde-enfants', level: 'PROFESSIONNEL', hourlyRate: 16, bio: "Auxiliaire de puériculture de formation, je garde vos enfants avec sérieux et bienveillance depuis 6 ans. Activités adaptées à chaque âge." },
    ] },
  { email: 'nicolas.dubois.demo@example.com', firstName: 'Nicolas', lastName: 'Dubois', address: '15 Chemin des Oliviers, Servian',
    categories: [
      { slug: 'mecanique', level: 'PROFESSIONNEL', hourlyRate: 35, bio: "Mécanicien auto de métier, atelier mobile équipé pour intervenir chez vous : vidange, diagnostic, petites réparations sur voiture et moto." },
    ] },
  { email: 'claire.fontaine.demo@example.com', firstName: 'Claire', lastName: 'Fontaine', address: '7 Rue du Faubourg, Bédarieux',
    categories: [
      { slug: 'cours-particuliers', level: 'EXPERT', hourlyRate: 20, bio: "Professeure de mathématiques depuis 4 ans, je prépare vos enfants aux examens avec des méthodes qui donnent confiance en soi." },
    ] },
  { email: 'yasmine.cherif.demo@example.com', firstName: 'Yasmine', lastName: 'Cherif', address: "2 Rue de la Paix, Villeneuve-lès-Béziers",
    categories: [
      { slug: 'aide-personne', level: 'PROFESSIONNEL', hourlyRate: 19, bio: "Aide à domicile diplômée, j'accompagne les personnes en perte d'autonomie avec professionnalisme et douceur au quotidien." },
    ] },
  { email: 'pierre.lambert.demo@example.com', firstName: 'Pierre', lastName: 'Lambert', address: '11 Avenue de la Plage, Portiragnes',
    categories: [
      { slug: 'plomberie', level: 'PROFESSIONNEL', hourlyRate: 30, bio: "Plombier indépendant depuis 10 ans, j'interviens rapidement pour vos fuites, débouchages et installations sanitaires." },
    ] },
  { email: 'emilie.girard.demo@example.com', firstName: 'Émilie', lastName: 'Girard', address: '6 Rue des Écoles, Vias',
    categories: [
      { slug: 'peinture', level: 'EXPERT', hourlyRate: 22, bio: "Peintre en bâtiment de formation, je réalise vos travaux de peinture intérieure et extérieure avec finitions soignées." },
    ] },
  { email: 'hugo.faure.demo@example.com', firstName: 'Hugo', lastName: 'Faure', address: '4 Rue Boieldieu, Béziers',
    categories: [
      { slug: 'informatique', level: 'PASSIONNE', hourlyRate: 17, bio: "Étudiant en informatique, je dépanne ordinateurs et box, installe vos logiciels et vous initie aux outils numériques." },
    ] },
  { email: 'camille.roussel.demo@example.com', firstName: 'Camille', lastName: 'Roussel', address: '9 Rue Paul Riquet, Béziers',
    categories: [
      { slug: 'garde-animaux', level: 'PASSIONNE', hourlyRate: 14, bio: "Amoureuse des animaux, je promène et garde vos compagnons à quatre pattes comme si c'étaient les miens." },
    ] },
  { email: 'antoine.blanchard.demo@example.com', firstName: 'Antoine', lastName: 'Blanchard', address: '18 Avenue Georges Clemenceau, Agde',
    categories: [
      { slug: 'convoi', level: 'EXPERT', hourlyRate: 24, bio: "Permis tous véhicules, je convoie vos voitures et utilitaires sur toute la région avec soin et ponctualité." },
    ] },
  { email: 'lea.mercier.demo@example.com', firstName: 'Léa', lastName: 'Mercier', address: '13 Rue du Château, Pézenas',
    categories: [
      { slug: 'piscine', level: 'EXPERT', hourlyRate: 23, bio: "Spécialisée dans l'entretien et la remise en état de piscines, j'interviens toute l'année pour garder votre bassin impeccable." },
    ] },
  { email: 'mathieu.girard.demo@example.com', firstName: 'Mathieu', lastName: 'Girard', address: '1 Rue Nationale, Sérignan',
    categories: [
      { slug: 'electricite', level: 'PROFESSIONNEL', hourlyRate: 32, bio: "Électricien certifié, je réalise installations et mises aux normes en toute sécurité, dépannage rapide 7j/7." },
    ] },
  { email: 'chloe.bertrand.demo@example.com', firstName: 'Chloé', lastName: 'Bertrand', address: '10 Rue de la Fontaine, Servian',
    categories: [
      { slug: 'menage', level: 'PASSIONNE', hourlyRate: 15, bio: "Sérieuse et discrète, je propose mes services de ménage régulier ou ponctuel avec grand soin du détail." },
      { slug: 'garde-enfants', level: 'PASSIONNE', hourlyRate: 14, bio: "Maman de deux enfants, j'adore m'occuper des petits : jeux, activités, sorties d'école en toute sécurité." },
    ] },
  { email: 'julien.marchand.demo@example.com', firstName: 'Julien', lastName: 'Marchand', address: '16 Rue Victor Hugo, Bédarieux',
    categories: [
      { slug: 'bricolage', level: 'PASSIONNE', hourlyRate: 16, bio: "Bricoleur du dimanche devenu expérimenté, je vous aide pour vos petits travaux : montage, fixations, réparations diverses." },
    ] },
  { email: 'sarah.leroy.demo@example.com', firstName: 'Sarah', lastName: 'Leroy', address: '3 Rue des Jardins, Villeneuve-lès-Béziers',
    categories: [
      { slug: 'cours-particuliers', level: 'PASSIONNE', hourlyRate: 16, bio: "Bilingue anglais-espagnol, je donne des cours de langues adaptés à tous les niveaux, dans la bonne humeur." },
    ] },
  { email: 'romain.perrin.demo@example.com', firstName: 'Romain', lastName: 'Perrin', address: '5 Avenue du Port, Valras-Plage',
    categories: [
      { slug: 'mecanique', level: 'EXPERT', hourlyRate: 26, bio: "Passionné de mécanique depuis toujours, j'entretiens et dépanne camions et scooters avec rigueur et rapidité." },
    ] },
  { email: 'manon.colin.demo@example.com', firstName: 'Manon', lastName: 'Colin', address: '22 Rue de la Liberté, Vias',
    categories: [
      { slug: 'peinture', level: 'PASSIONNE', hourlyRate: 17, bio: "Créative et minutieuse, je réalise vos travaux de peinture décorative avec attention aux finitions." },
      { slug: 'piscine', level: 'PASSIONNE', hourlyRate: 16, bio: "J'entretiens votre piscine tout au long de la saison : analyse de l'eau, nettoyage, petits réglages." },
    ] },
];

const MISSIONS = [
  { categorySlug: 'menage', title: 'Grand ménage avant rentrée', description: "Ménage complet d'un appartement T3 avant la rentrée : sols, vitres, sanitaires, cuisine.", address: '14 Rue de la Citadelle, Béziers', desiredDate: daysFromNow(2, 9, 0), estimatedHours: 4, isUrgent: true, datesFlexible: false },
  { categorySlug: 'menage', title: 'Ménage hebdomadaire appartement', description: "Recherche ménage régulier chaque semaine pour un T2, environ 2h par passage.", address: '9 Rue de la Fontaine, Agde', desiredDate: daysFromNow(5, 10, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true },
  { categorySlug: 'bricolage', title: 'Montage cuisine IKEA complète', description: "Montage de meubles de cuisine IKEA livrés à plat, environ 8 éléments.", address: '3 Rue des Muriers, Pézenas', desiredDate: daysFromNow(3, 8, 30), estimatedHours: 5, isUrgent: true, datesFlexible: false },
  { categorySlug: 'bricolage', title: 'Fixation étagères et miroir', description: "Fixation de 3 étagères murales et d'un grand miroir dans le salon.", address: '17 Avenue de la Gare, Sérignan', desiredDate: daysFromNow(7, 14, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true },
  { categorySlug: 'demenagement', title: 'Déménagement studio vers T2', description: "Aide au déménagement d'un studio meublé, 2ème étage sans ascenseur.", address: '6 Rue Boieldieu, Béziers', desiredDate: daysFromNow(4, 9, 0), estimatedHours: 4, isUrgent: true, datesFlexible: true },
  { categorySlug: 'jardinage', title: 'Taille de haies et tonte', description: "Taille de haies de thuyas et tonte d'un jardin de 300m².", address: '11 Chemin des Vignes, Servian', desiredDate: daysFromNow(6, 8, 0), estimatedHours: 3, isUrgent: false, datesFlexible: true },
  { categorySlug: 'jardinage', title: 'Entretien jardin mensuel', description: "Recherche entretien régulier de jardin : désherbage, tonte, taille légère.", address: '4 Rue des Oliviers, Bédarieux', desiredDate: daysFromNow(9, 9, 0), estimatedHours: 3, isUrgent: false, datesFlexible: false },
  { categorySlug: 'garde-enfants', title: 'Garde 2 enfants mercredi après-midi', description: "Garde de 2 enfants (5 et 8 ans) le mercredi après-midi, activités et goûter.", address: '8 Rue Paul Riquet, Béziers', desiredDate: daysFromNow(1, 13, 30), estimatedHours: 4, isUrgent: true, datesFlexible: false },
  { categorySlug: 'cours-particuliers', title: 'Soutien scolaire maths 3ème', description: "Cours de soutien en mathématiques pour un élève de 3ème, préparation au brevet.", address: '2 Rue Nationale, Valras-Plage', desiredDate: daysFromNow(8, 17, 0), estimatedHours: 1.5, isUrgent: false, datesFlexible: true },
  { categorySlug: 'aide-personne', title: 'Accompagnement courses hebdomadaire', description: "Accompagnement d'une personne âgée pour les courses chaque semaine.", address: "5 Rue de la République, Villeneuve-lès-Béziers", desiredDate: daysFromNow(5, 10, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true },
  { categorySlug: 'aide-personne', title: 'Aide au lever urgent', description: "Besoin urgent d'une aide au lever et à la toilette suite à une indisponibilité imprévue.", address: '19 Avenue de la Plage, Portiragnes', desiredDate: daysFromNow(0, 8, 0), estimatedHours: 1, isUrgent: true, datesFlexible: false },
  { categorySlug: 'garde-animaux', title: 'Promenade chien matin et soir', description: "Promenade quotidienne d'un labrador, matin et soir, pendant 2 semaines.", address: '7 Rue des Écoles, Vias', desiredDate: daysFromNow(3, 7, 30), estimatedHours: 1, isUrgent: false, datesFlexible: true },
  { categorySlug: 'informatique', title: 'Dépannage ordinateur ne démarre plus', description: "Ordinateur portable qui ne démarre plus, besoin d'un diagnostic rapide.", address: '10 Rue Victor Hugo, Béziers', desiredDate: daysFromNow(1, 15, 0), estimatedHours: 1.5, isUrgent: true, datesFlexible: false },
  { categorySlug: 'transport', title: 'Trajet gare Béziers aller-retour', description: "Trajet aller-retour gare de Béziers pour arrivée de train, avec bagages.", address: 'Gare de Béziers, Béziers', desiredDate: daysFromNow(2, 18, 0), estimatedHours: 1, isUrgent: true, datesFlexible: false },
  { categorySlug: 'convoi', title: 'Convoyage véhicule Béziers-Montpellier', description: "Convoyage d'un véhicule particulier de Béziers à Montpellier.", address: '20 Avenue Georges Clemenceau, Agde', desiredDate: daysFromNow(10, 9, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true },
  { categorySlug: 'mecanique', title: 'Vidange et contrôle voiture', description: "Vidange complète et contrôle général avant un long trajet.", address: '15 Rue du Château, Pézenas', desiredDate: daysFromNow(6, 9, 0), estimatedHours: 1.5, isUrgent: false, datesFlexible: true },
  { categorySlug: 'electricite', title: 'Panne électrique totale appartement', description: "Coupure générale de courant dans tout l'appartement, disjoncteur qui saute en continu.", address: '12 Rue de la Fontaine, Sérignan', desiredDate: daysFromNow(0, 19, 0), estimatedHours: 2, isUrgent: true, datesFlexible: false },
  { categorySlug: 'plomberie', title: 'Fuite sous évier urgente', description: "Fuite d'eau importante sous l'évier de la cuisine, intervention urgente nécessaire.", address: '3 Rue Nationale, Servian', desiredDate: daysFromNow(0, 11, 0), estimatedHours: 1.5, isUrgent: true, datesFlexible: false },
  { categorySlug: 'peinture', title: 'Peinture chambre 15m²', description: "Peinture complète d'une chambre de 15m², murs et plafond, couleur claire.", address: '9 Rue des Jardins, Bédarieux', desiredDate: daysFromNow(9, 9, 0), estimatedHours: 6, isUrgent: false, datesFlexible: true },
  { categorySlug: 'piscine', title: 'Remise en état piscine avant été', description: "Remise en état complète d'une piscine hors sol après l'hiver : nettoyage, traitement, vérification.", address: '21 Rue de la Liberté, Vias', desiredDate: daysFromNow(4, 9, 0), estimatedHours: 3, isUrgent: true, datesFlexible: true },
];

async function main() {
  const categories = await prisma.category.findMany({ include: { services: true, equipment: true } });
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  let jobberCount = 0;
  for (const j of JOBBERS) {
    const geocoded = await geocodeAddress(j.address);
    const needsSiret = j.categories.some((c) => c.level === 'PROFESSIONNEL');

    const existing = await prisma.user.findUnique({ where: { email: j.email }, include: { providerProfile: true } });
    let user;
    if (existing) {
      user = existing;
      await prisma.user.update({ where: { id: user.id }, data: { address: j.address, lat: geocoded?.lat, lng: geocoded?.lng } });
    } else {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: j.email,
          passwordHash,
          firstName: j.firstName,
          lastName: j.lastName,
          address: j.address,
          lat: geocoded?.lat,
          lng: geocoded?.lng,
          providerProfile: { create: {} },
        },
        include: { providerProfile: true },
      });
    }

    const siret = needsSiret ? generateValidSiret() : undefined;

    await prisma.providerProfile.update({
      where: { userId: user.id },
      data: {
        siret,
        categories: {
          deleteMany: {},
          create: j.categories.map((c) => ({ categoryId: bySlug[c.slug].id, level: c.level, hourlyRate: c.hourlyRate, bio: c.bio })),
        },
        services: {
          deleteMany: {},
          create: j.categories.flatMap((c) => (bySlug[c.slug].services || []).slice(0, 2).map((s) => ({ serviceId: s.id }))),
        },
        equipment: {
          deleteMany: {},
          create: j.categories.flatMap((c) => (bySlug[c.slug].equipment || []).slice(0, 3).map((e) => ({ equipmentId: e.id }))),
        },
      },
    });

    jobberCount++;
    console.log(`Jobber ${jobberCount}/20 : ${j.firstName} ${j.lastName} (${j.categories.map((c) => `${c.slug}:${c.level}`).join(', ')})`);
  }

  const client = await prisma.user.findUnique({ where: { email: MISSION_CLIENT_EMAIL } });
  if (!client) throw new Error(`Compte client ${MISSION_CLIENT_EMAIL} introuvable`);

  let missionCount = 0;
  for (const m of MISSIONS) {
    const category = bySlug[m.categorySlug];
    if (!category) { console.log(`Catégorie inconnue : ${m.categorySlug}`); continue; }
    const geocoded = await geocodeAddress(m.address);
    await prisma.mission.create({
      data: {
        clientId: client.id,
        categoryId: category.id,
        title: m.title,
        description: m.description,
        address: m.address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        desiredDate: m.desiredDate,
        estimatedHours: m.estimatedHours,
        isUrgent: m.isUrgent,
        datesFlexible: m.datesFlexible,
      },
    });
    missionCount++;
    console.log(`Mission ${missionCount}/20 : ${m.title} [${category.name}]${m.isUrgent ? ' URGENT' : ''}${m.datesFlexible ? ' FLEXIBLE' : ''}`);
  }

  console.log(`\nSeed demo terminé : ${jobberCount} jobbers, ${missionCount} missions. Mot de passe des comptes démo : ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
