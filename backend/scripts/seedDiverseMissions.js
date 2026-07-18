// One-off reset: wipes every mission (and everything hanging off missions —
// offers, bookings, payments, reviews, conversations/messages) and recreates
// a rich, deliberately diverse set covering every publishing option added
// this cycle: urgent/flexible, one-time vs. recurring (all 4 units), required
// equipment, required vehicle (all 10 types across the set), departure/
// arrival addresses for transport-type categories, plus 20 LESSON-type
// requests for the new "Apprendre" feature. Everything is posted by the
// admin@jobber.local client account, around Béziers.
// Run once via `node scripts/seedDiverseMissions.js`.
const { PrismaClient } = require('@prisma/client');
const { geocodeAddress } = require('../src/services/geocodingService');

const prisma = new PrismaClient();

const MISSION_CLIENT_EMAIL = 'admin@jobber.local';

function daysFromNow(n, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// 40 TASK missions — 3x for the 8 "heavy" categories (incl. the 3 transport
// categories, which each get a departure/arrival pair), 2x for the rest.
const TASKS = [
  // MÉNAGE (3)
  { categorySlug: 'menage', title: 'Ménage complet avant visite locataire', description: "Nettoyage complet d'un T3 avant état des lieux : sols, vitres, sanitaires, cuisine.", address: '14 Rue de la Citadelle, Béziers', desiredDate: daysFromNow(2, 9, 0), estimatedHours: 4, isUrgent: true, datesFlexible: false, equipmentCount: 2 },
  { categorySlug: 'menage', title: 'Ménage récurrent deux fois par semaine', description: "Recherche ménage régulier pour un T2 : sols, poussière, sanitaires.", address: '9 Rue de la Fontaine, Agde', desiredDate: daysFromNow(5, 10, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true, isRecurring: true, recurrenceCount: 2, recurrenceUnit: 'SEMAINE', equipmentCount: 1 },
  { categorySlug: 'menage', title: 'Grand ménage de printemps', description: "Nettoyage en profondeur d'une maison : vitres, placards, four, sols.", address: '13 Rue du Château, Pézenas', desiredDate: daysFromNow(11, 9, 0), estimatedHours: 5, isUrgent: false, datesFlexible: true, otherEquipmentNote: 'Nettoyeur vapeur si possible' },

  // BRICOLAGE (3)
  { categorySlug: 'bricolage', title: 'Pose de 5 étagères murales', description: "Pose de 5 étagères dans un salon et un bureau, perçage béton.", address: '17 Avenue de la Gare, Sérignan', desiredDate: daysFromNow(6, 14, 0), estimatedHours: 3, isUrgent: false, datesFlexible: true, equipmentCount: 3 },
  { categorySlug: 'bricolage', title: 'Montage cuisine IKEA complète', description: "Montage de meubles de cuisine livrés à plat, environ 8 éléments.", address: '3 Rue des Muriers, Pézenas', desiredDate: daysFromNow(3, 8, 30), estimatedHours: 6, isUrgent: true, datesFlexible: false, equipmentCount: 2 },
  { categorySlug: 'bricolage', title: 'Petites réparations diverses', description: "Réparation d'une porte de placard, fixation d'une poignée, mastic silicone salle de bain.", address: '4 Rue Boieldieu, Béziers', desiredDate: daysFromNow(8, 10, 0), estimatedHours: 2, isUrgent: false, datesFlexible: false, otherEquipmentNote: 'Mastic silicone blanc si vous en avez' },

  // JARDINAGE (3)
  { categorySlug: 'jardinage', title: 'Taille de haies et tonte', description: "Taille de haies de thuyas et tonte d'un jardin de 300 m².", address: '11 Chemin des Vignes, Servian', desiredDate: daysFromNow(6, 8, 0), estimatedHours: 3, isUrgent: false, datesFlexible: true, equipmentCount: 2, requiredVehicleTypes: ['PETIT_UTILITAIRE_4M3'] },
  { categorySlug: 'jardinage', title: 'Entretien jardin mensuel', description: "Entretien régulier de jardin : désherbage, tonte, taille légère, une fois par mois.", address: '4 Rue des Oliviers, Bédarieux', desiredDate: daysFromNow(9, 9, 0), estimatedHours: 3, isUrgent: false, datesFlexible: false, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'MOIS', equipmentCount: 2 },
  { categorySlug: 'jardinage', title: 'Taille annuelle des arbres fruitiers', description: "Taille de 6 arbres fruitiers avant la période de floraison, deux passages par an.", address: '22 Rue de la Liberté, Vias', desiredDate: daysFromNow(14, 9, 0), estimatedHours: 4, isUrgent: false, datesFlexible: true, isRecurring: true, recurrenceCount: 2, recurrenceUnit: 'AN' },

  // DÉMÉNAGEMENT (3) — transport-type, chacune avec départ/arrivée
  { categorySlug: 'demenagement', title: 'Déménagement studio vers T2', description: "Aide au déménagement d'un studio meublé, 2ème étage sans ascenseur.", address: '6 Rue Boieldieu, Béziers', dropoffAddress: '18 Avenue Georges Clemenceau, Agde', desiredDate: daysFromNow(4, 9, 0), estimatedHours: 4, isUrgent: true, datesFlexible: true, requiredVehicleTypes: ['FOURGONNETTE_9M3'], equipmentCount: 3 },
  { categorySlug: 'demenagement', title: 'Déménagement maison complète', description: "Déménagement d'une maison de 4 pièces, meubles lourds, électroménager.", address: '13 Rue du Château, Pézenas', dropoffAddress: '4 Rue Boieldieu, Béziers', desiredDate: daysFromNow(12, 8, 0), estimatedHours: 8, isUrgent: false, datesFlexible: true, requiredVehicleTypes: ['CAMION_15M3'], equipmentCount: 3, otherVehicleNote: 'Hayon élévateur apprécié' },
  { categorySlug: 'demenagement', title: 'Débarras et déménagement local commercial', description: "Vidage d'un local commercial avant travaux, mobilier et archives à transporter.", address: '1 Rue Nationale, Sérignan', dropoffAddress: '9 Rue Paul Riquet, Béziers', desiredDate: daysFromNow(7, 8, 0), estimatedHours: 6, isUrgent: false, datesFlexible: false, requiredVehicleTypes: ['GRAND_CAMION_20M3'] },

  // CONVOI (3) — transport-type
  { categorySlug: 'convoi', title: 'Convoyage véhicule Béziers-Montpellier', description: "Convoyage d'un véhicule particulier de Béziers à Montpellier.", address: '20 Avenue Georges Clemenceau, Agde', dropoffAddress: '3 Rue des Muriers, Pézenas', desiredDate: daysFromNow(10, 9, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true, requiredVehicleTypes: ['VOITURE_TOURISME'] },
  { categorySlug: 'convoi', title: 'Convoyage poids lourd concession', description: "Convoyage d'un camion depuis une concession jusqu'au dépôt client.", address: '15 Rue du Château, Pézenas', dropoffAddress: '11 Chemin des Vignes, Servian', desiredDate: daysFromNow(9, 10, 0), estimatedHours: 3, isUrgent: false, datesFlexible: false, requiredVehicleTypes: ['POIDS_LOURD'] },
  { categorySlug: 'convoi', title: 'Convoyage voiture en panne avec remorque', description: "Récupération d'une voiture en panne et convoyage avec remorque jusqu'au garage.", address: '19 Avenue de la Plage, Portiragnes', dropoffAddress: '15 Rue du Château, Pézenas', desiredDate: daysFromNow(1, 11, 0), estimatedHours: 2, isUrgent: true, datesFlexible: false, requiredVehicleTypes: ['GRANDE_REMORQUE'] },

  // TRANSPORT (3) — transport-type
  { categorySlug: 'transport', title: 'Trajet gare Béziers aller-retour', description: "Trajet aller-retour gare de Béziers pour arrivée de train, avec bagages.", address: 'Gare de Béziers, Béziers', dropoffAddress: '10 Rue Victor Hugo, Béziers', desiredDate: daysFromNow(2, 18, 0), estimatedHours: 1, isUrgent: true, datesFlexible: false, requiredVehicleTypes: ['MINIBUS'] },
  { categorySlug: 'transport', title: 'Transport gravats déchetterie', description: "Transport de gravats de travaux jusqu'à la déchetterie la plus proche.", address: '7 Rue des Écoles, Vias', dropoffAddress: '21 Rue de la Liberté, Vias', desiredDate: daysFromNow(3, 8, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true, requiredVehicleTypes: ['CAMION_BENNE'] },
  { categorySlug: 'transport', title: 'Transport mobilier entre deux adresses', description: "Transport d'un canapé et d'une armoire entre deux appartements.", address: '2 Rue Nationale, Valras-Plage', dropoffAddress: '5 Rue de la République, Villeneuve-lès-Béziers', desiredDate: daysFromNow(5, 14, 0), estimatedHours: 2, isUrgent: false, datesFlexible: false, requiredVehicleTypes: ['REMORQUE'] },

  // ÉLECTRICITÉ (3)
  { categorySlug: 'electricite', title: 'Panne électrique totale appartement', description: "Coupure générale de courant dans tout l'appartement, disjoncteur qui saute en continu.", address: '12 Rue de la Fontaine, Sérignan', desiredDate: daysFromNow(0, 19, 0), estimatedHours: 2, isUrgent: true, datesFlexible: false, equipmentCount: 2 },
  { categorySlug: 'electricite', title: 'Installation 3 prises et un luminaire', description: "Ajout de 3 prises électriques dans un bureau et pose d'un luminaire suspendu.", address: '16 Rue Victor Hugo, Bédarieux', desiredDate: daysFromNow(7, 9, 0), estimatedHours: 3, isUrgent: false, datesFlexible: true, equipmentCount: 2 },
  { categorySlug: 'electricite', title: 'Mise aux normes tableau électrique', description: "Mise aux normes d'un tableau électrique vétuste avant vente du bien.", address: '10 Rue de la Fontaine, Servian', desiredDate: daysFromNow(13, 9, 0), estimatedHours: 4, isUrgent: false, datesFlexible: false, otherEquipmentNote: 'Disjoncteur différentiel 30mA à prévoir' },

  // PLOMBERIE (3)
  { categorySlug: 'plomberie', title: 'Fuite sous évier urgente', description: "Fuite d'eau importante sous l'évier de la cuisine, intervention urgente nécessaire.", address: '3 Rue Nationale, Servian', desiredDate: daysFromNow(0, 11, 0), estimatedHours: 1.5, isUrgent: true, datesFlexible: false, equipmentCount: 2 },
  { categorySlug: 'plomberie', title: 'Remplacement robinetterie salle de bain', description: "Changement de la robinetterie du lavabo et de la douche.", address: '5 Rue de la République, Villeneuve-lès-Béziers', desiredDate: daysFromNow(6, 10, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true, equipmentCount: 1 },
  { categorySlug: 'plomberie', title: 'Débouchage canalisation extérieure', description: "Canalisation extérieure bouchée, eau qui refoule dans le jardin.", address: '20 Rue Saint-Jacques, Sérignan', desiredDate: daysFromNow(2, 9, 0), estimatedHours: 2, isUrgent: true, datesFlexible: false },

  // AIDE À LA PERSONNE (2)
  { categorySlug: 'aide-personne', title: 'Accompagnement courses hebdomadaire', description: "Accompagnement d'une personne âgée pour les courses chaque semaine.", address: "5 Rue de la République, Villeneuve-lès-Béziers", desiredDate: daysFromNow(5, 10, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'SEMAINE' },
  { categorySlug: 'aide-personne', title: 'Présence quotidienne matin', description: "Présence et aide au lever chaque matin pendant une convalescence.", address: '19 Avenue de la Plage, Portiragnes', desiredDate: daysFromNow(1, 8, 0), estimatedHours: 1, isUrgent: true, datesFlexible: false, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'JOUR' },

  // COURS PARTICULIERS (2)
  { categorySlug: 'cours-particuliers', title: 'Soutien scolaire maths 3ème', description: "Cours de soutien en mathématiques pour un élève de 3ème, préparation au brevet, chaque semaine.", address: '2 Rue Nationale, Valras-Plage', desiredDate: daysFromNow(8, 17, 0), estimatedHours: 1.5, isUrgent: false, datesFlexible: true, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'SEMAINE' },
  { categorySlug: 'cours-particuliers', title: 'Préparation orale anglais bac', description: "Préparation intensive à l'oral d'anglais du baccalauréat.", address: '3 Rue des Jardins, Villeneuve-lès-Béziers', desiredDate: daysFromNow(4, 16, 0), estimatedHours: 2, isUrgent: false, datesFlexible: false },

  // GARDE D'ANIMAUX (2)
  { categorySlug: 'garde-animaux', title: 'Promenade chien matin et soir', description: "Promenade quotidienne d'un labrador, matin et soir, pendant 2 semaines.", address: '7 Rue des Écoles, Vias', desiredDate: daysFromNow(3, 7, 30), estimatedHours: 1, isUrgent: false, datesFlexible: true, isRecurring: true, recurrenceCount: 2, recurrenceUnit: 'JOUR' },
  { categorySlug: 'garde-animaux', title: 'Garde de deux chats pendant les vacances', description: "Garde de deux chats à domicile pendant une semaine de vacances : nourriture, litière, câlins.", address: '9 Rue Paul Riquet, Béziers', desiredDate: daysFromNow(15, 9, 0), estimatedHours: 1, isUrgent: false, datesFlexible: true },

  // GARDE D'ENFANTS (2)
  { categorySlug: 'garde-enfants', title: 'Garde 2 enfants mercredi après-midi', description: "Garde de 2 enfants (5 et 8 ans) le mercredi après-midi, activités et goûter, toutes les semaines.", address: '8 Rue Paul Riquet, Béziers', desiredDate: daysFromNow(1, 13, 30), estimatedHours: 4, isUrgent: true, datesFlexible: false, isRecurring: true, recurrenceCount: 3, recurrenceUnit: 'SEMAINE' },
  { categorySlug: 'garde-enfants', title: 'Baby-sitting soirée', description: "Garde d'un enfant de 4 ans pour une soirée, coucher vers 20h30.", address: 'Avenue de la Plage, Sérignan', desiredDate: daysFromNow(6, 19, 0), estimatedHours: 4, isUrgent: false, datesFlexible: true },

  // INFORMATIQUE (2)
  { categorySlug: 'informatique', title: 'Dépannage ordinateur ne démarre plus', description: "Ordinateur portable qui ne démarre plus, besoin d'un diagnostic rapide.", address: '10 Rue Victor Hugo, Béziers', desiredDate: daysFromNow(1, 15, 0), estimatedHours: 1.5, isUrgent: true, datesFlexible: false },
  { categorySlug: 'informatique', title: 'Maintenance mensuelle parc informatique', description: "Maintenance et mises à jour mensuelles de 3 ordinateurs pour une petite entreprise.", address: '4 Rue Boieldieu, Béziers', desiredDate: daysFromNow(10, 9, 0), estimatedHours: 2, isUrgent: false, datesFlexible: true, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'MOIS' },

  // MÉCANIQUE (2)
  { categorySlug: 'mecanique', title: 'Vidange et contrôle voiture', description: "Vidange complète et contrôle général avant un long trajet.", address: '15 Rue du Château, Pézenas', desiredDate: daysFromNow(6, 9, 0), estimatedHours: 1.5, isUrgent: false, datesFlexible: true, equipmentCount: 1 },
  { categorySlug: 'mecanique', title: 'Révision annuelle scooter', description: "Révision complète annuelle d'un scooter 125cc avant le contrôle technique.", address: '1 Rue Nationale, Sérignan', desiredDate: daysFromNow(16, 9, 0), estimatedHours: 1.5, isUrgent: false, datesFlexible: false, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'AN' },

  // PEINTURE (2)
  { categorySlug: 'peinture', title: 'Peinture chambre 15m²', description: "Peinture complète d'une chambre de 15 m², murs et plafond, couleur claire.", address: '9 Rue des Jardins, Bédarieux', desiredDate: daysFromNow(9, 9, 0), estimatedHours: 6, isUrgent: false, datesFlexible: true, equipmentCount: 2 },
  { categorySlug: 'peinture', title: 'Ravalement façade petite maison', description: "Peinture extérieure d'une façade de maison de plain-pied, environ 40 m².", address: '11 Chemin des Vignes, Servian', desiredDate: daysFromNow(18, 9, 0), estimatedHours: 8, isUrgent: false, datesFlexible: true, requiredVehicleTypes: ['PETIT_UTILITAIRE_4M3'] },

  // PISCINE (2)
  { categorySlug: 'piscine', title: 'Remise en état piscine avant été', description: "Remise en état complète d'une piscine hors sol après l'hiver : nettoyage, traitement, vérification.", address: '21 Rue de la Liberté, Vias', desiredDate: daysFromNow(4, 9, 0), estimatedHours: 3, isUrgent: true, datesFlexible: true, equipmentCount: 2 },
  { categorySlug: 'piscine', title: 'Entretien piscine hebdomadaire', description: "Entretien hebdomadaire d'une piscine enterrée : analyse de l'eau, nettoyage, produits.", address: '13 Rue du Château, Pézenas', desiredDate: daysFromNow(3, 10, 0), estimatedHours: 1, isUrgent: false, datesFlexible: false, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'SEMAINE' },
];

// 20 LESSON requests — 10 categories x 2, spanning the examples given
// explicitly (jardinage, ménage, électricité, plomberie) plus other
// hands-on categories that make sense to learn in person.
const LESSONS = [
  { categorySlug: 'jardinage', title: 'Apprendre à tailler ses arbustes', description: "Débutant complet, je voudrais apprendre les bons gestes pour tailler mes arbustes sans les abîmer.", address: '4 Rue des Oliviers, Bédarieux', desiredDate: daysFromNow(5, 10, 0), estimatedHours: 2, datesFlexible: true },
  { categorySlug: 'jardinage', title: 'Cours de jardinage hebdomadaire', description: "Je veux apprendre à entretenir mon potager pas à pas, une séance chaque semaine.", address: '22 Rue de la Liberté, Vias', desiredDate: daysFromNow(7, 9, 0), estimatedHours: 1.5, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'SEMAINE' },

  { categorySlug: 'menage', title: 'Apprendre les techniques de ménage efficace', description: "Je voudrais apprendre à organiser mon ménage pour gagner du temps : méthode et astuces de pro.", address: '14 Rue de la Citadelle, Béziers', desiredDate: daysFromNow(4, 10, 0), estimatedHours: 2, datesFlexible: true },
  { categorySlug: 'menage', title: 'Cours détachage et entretien du linge', description: "Apprendre à traiter les taches tenaces et bien entretenir différents types de tissus.", address: '9 Rue de la Fontaine, Agde', desiredDate: daysFromNow(9, 14, 0), estimatedHours: 1.5, datesFlexible: false },

  { categorySlug: 'electricite', title: 'Apprendre les bases de l\'électricité domestique', description: "Je veux comprendre mon tableau électrique et savoir changer une prise en toute sécurité.", address: '12 Rue de la Fontaine, Sérignan', desiredDate: daysFromNow(6, 18, 0), estimatedHours: 2, datesFlexible: true },
  { categorySlug: 'electricite', title: 'Cours pose de luminaires et prises', description: "Débutant, je souhaite apprendre à poser un luminaire et remplacer une prise moi-même.", address: '16 Rue Victor Hugo, Bédarieux', desiredDate: daysFromNow(11, 9, 0), estimatedHours: 2, datesFlexible: false },

  { categorySlug: 'plomberie', title: 'Apprendre à réparer une fuite simple', description: "Je veux apprendre à diagnostiquer et réparer une petite fuite sans appeler un plombier à chaque fois.", address: '3 Rue Nationale, Servian', desiredDate: daysFromNow(8, 10, 0), estimatedHours: 2, datesFlexible: true },
  { categorySlug: 'plomberie', title: 'Cours entretien plomberie mensuel', description: "Je souhaite apprendre les gestes d'entretien de base de ma plomberie, une fois par mois.", address: '5 Rue de la République, Villeneuve-lès-Béziers', desiredDate: daysFromNow(10, 9, 0), estimatedHours: 1.5, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'MOIS' },

  { categorySlug: 'bricolage', title: 'Apprendre à utiliser une perceuse-visseuse', description: "Débutante totale, je veux apprendre à percer et visser correctement sans abîmer les murs.", address: '4 Rue Boieldieu, Béziers', desiredDate: daysFromNow(5, 14, 0), estimatedHours: 1.5, datesFlexible: true },
  { categorySlug: 'bricolage', title: 'Cours montage de meubles', description: "Je veux apprendre à monter des meubles en kit efficacement, sans stress.", address: '17 Avenue de la Gare, Sérignan', desiredDate: daysFromNow(7, 10, 0), estimatedHours: 2, datesFlexible: false },

  { categorySlug: 'peinture', title: 'Apprendre à peindre proprement', description: "Je veux apprendre les bonnes techniques pour peindre un mur sans traces ni coulures.", address: '9 Rue des Jardins, Bédarieux', desiredDate: daysFromNow(9, 10, 0), estimatedHours: 3, datesFlexible: true },
  { categorySlug: 'peinture', title: 'Cours pose de papier peint', description: "Débutant, je souhaite apprendre à poser du papier peint correctement, découpe et raccords compris.", address: '11 Chemin des Vignes, Servian', desiredDate: daysFromNow(13, 10, 0), estimatedHours: 3, datesFlexible: false },

  { categorySlug: 'mecanique', title: 'Apprendre à faire sa vidange soi-même', description: "Je veux apprendre à faire la vidange et vérifier les niveaux de ma voiture moi-même.", address: '15 Rue du Château, Pézenas', desiredDate: daysFromNow(6, 9, 0), estimatedHours: 2, datesFlexible: true },
  { categorySlug: 'mecanique', title: 'Cours entretien scooter de base', description: "Débutant, je souhaite apprendre l'entretien basique de mon scooter : chaîne, freins, niveaux.", address: '1 Rue Nationale, Sérignan', desiredDate: daysFromNow(12, 9, 0), estimatedHours: 1.5, datesFlexible: false },

  { categorySlug: 'informatique', title: 'Apprendre à sécuriser son ordinateur', description: "Je veux comprendre les bases de la sécurité informatique et apprendre à faire mes sauvegardes.", address: '10 Rue Victor Hugo, Béziers', desiredDate: daysFromNow(4, 15, 0), estimatedHours: 1.5, datesFlexible: true },
  { categorySlug: 'informatique', title: 'Cours prise en main tableur', description: "Débutante, je veux apprendre les bases d'un tableur pour gérer mon budget personnel.", address: '4 Rue Boieldieu, Béziers', desiredDate: daysFromNow(8, 14, 0), estimatedHours: 2, datesFlexible: false },

  { categorySlug: 'piscine', title: 'Apprendre à entretenir sa piscine soi-même', description: "Je veux apprendre à analyser l'eau et entretenir ma piscine sans faire venir quelqu'un chaque semaine.", address: '21 Rue de la Liberté, Vias', desiredDate: daysFromNow(5, 10, 0), estimatedHours: 2, datesFlexible: true },
  { categorySlug: 'piscine', title: 'Cours hivernage de piscine', description: "Je souhaite apprendre les étapes pour bien hiverner ma piscine avant l'automne, une fois par an.", address: '13 Rue du Château, Pézenas', desiredDate: daysFromNow(20, 9, 0), estimatedHours: 2, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'AN' },

  { categorySlug: 'cours-particuliers', title: 'Apprendre à donner des cours particuliers', description: "Je souhaite apprendre à structurer une séance de soutien scolaire efficace pour mes propres enfants.", address: '2 Rue Nationale, Valras-Plage', desiredDate: daysFromNow(6, 17, 0), estimatedHours: 1.5, datesFlexible: true },
  { categorySlug: 'cours-particuliers', title: 'Cours de méthodologie hebdomadaire', description: "Je veux apprendre des méthodes de travail et d'organisation, une séance chaque semaine.", address: '3 Rue des Jardins, Villeneuve-lès-Béziers', desiredDate: daysFromNow(8, 16, 0), estimatedHours: 1, isRecurring: true, recurrenceCount: 1, recurrenceUnit: 'SEMAINE' },
];

async function wipeMissions() {
  await prisma.$transaction([
    prisma.message.deleteMany({}),
    prisma.conversation.deleteMany({}),
    prisma.review.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.booking.deleteMany({}),
    prisma.offer.deleteMany({}),
    prisma.missionEquipment.deleteMany({}),
    prisma.mission.deleteMany({}),
  ]);
}

async function main() {
  console.log('Suppression de toutes les missions et données liées (offres, réservations, paiements, avis, conversations)…');
  await wipeMissions();
  console.log('Terminé.');

  const categories = await prisma.category.findMany({ include: { equipment: true } });
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const client = await prisma.user.findUnique({ where: { email: MISSION_CLIENT_EMAIL } });
  if (!client) throw new Error(`Compte client ${MISSION_CLIENT_EMAIL} introuvable`);

  async function createMission(entry, type, index, total) {
    const category = bySlug[entry.categorySlug];
    if (!category) { console.log(`Catégorie inconnue : ${entry.categorySlug}`); return; }

    const [geocoded, dropoffGeocoded] = await Promise.all([
      geocodeAddress(entry.address),
      entry.dropoffAddress ? geocodeAddress(entry.dropoffAddress) : Promise.resolve(null),
    ]);

    const equipmentIds = entry.equipmentCount
      ? (category.equipment || []).slice(0, entry.equipmentCount).map((e) => e.id)
      : [];

    await prisma.mission.create({
      data: {
        type,
        clientId: client.id,
        categoryId: category.id,
        title: entry.title,
        description: entry.description,
        address: entry.address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        dropoffAddress: entry.dropoffAddress,
        dropoffLat: dropoffGeocoded?.lat,
        dropoffLng: dropoffGeocoded?.lng,
        desiredDate: entry.desiredDate,
        estimatedHours: entry.estimatedHours,
        isUrgent: entry.isUrgent || false,
        datesFlexible: entry.datesFlexible || false,
        isRecurring: entry.isRecurring || false,
        recurrenceCount: entry.isRecurring ? entry.recurrenceCount : undefined,
        recurrenceUnit: entry.isRecurring ? entry.recurrenceUnit : undefined,
        requiredVehicleTypes: entry.requiredVehicleTypes || [],
        otherEquipmentNote: entry.otherEquipmentNote,
        otherVehicleNote: entry.otherVehicleNote,
        requiredEquipment: equipmentIds.length ? { create: equipmentIds.map((equipmentId) => ({ equipmentId })) } : undefined,
      },
    });
    console.log(`${type} ${index}/${total} : ${entry.title} [${category.name}]`);
  }

  let i = 0;
  for (const m of TASKS) { i++; await createMission(m, 'TASK', i, TASKS.length); }

  let j = 0;
  for (const l of LESSONS) { j++; await createMission(l, 'LESSON', j, LESSONS.length); }

  console.log(`\nTerminé : ${TASKS.length} missions + ${LESSONS.length} demandes de cours créées autour de Béziers.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
