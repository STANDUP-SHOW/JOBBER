// Adds 50 showcase missions for the national presentation — additive only,
// never touches existing missions/users/offers/etc (unlike
// seedDiverseMissions.js, which wipes everything first). Each mission is
// posted by its own distinct client (mixed individuals/companies, men and
// women, varied sectors) and flagged isDemoNational: true, so the public
// listing endpoints (see missions.routes.js + demoRelocationService.js)
// relocate it near whoever is actually browsing — the same 50 missions
// show up in real, existing localities within 50km of Grenoble for a
// viewer there, or within 50km of Marseille for a viewer there, etc.
// Re-runnable: user accounts are upserted by email, and running it twice
// just creates a second wave of 50 missions rather than erroring.
// Run once via `node scripts/seedNationalDemoMissions.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { geocodeAddress } = require('../src/services/geocodingService');

const prisma = new PrismaClient();

function daysFromNow(n, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Seed-time base addresses only — every one of these missions gets
// relocated near the actual viewer at read time (isDemoNational), so this
// is just a plausible, scattered fallback for anyone browsing without a
// resolvable location (e.g. logged out, no demoLat/demoLng override).
const FALLBACK_CITIES = [
  'Lyon', 'Marseille', 'Grenoble', 'Lille', 'Nantes', 'Toulouse', 'Strasbourg',
  'Rennes', 'Bordeaux', 'Nice', 'Reims', 'Dijon', 'Angers', 'Le Mans', 'Tours',
];

// 25 categories x 2 missions — every existing category gets covered.
// options: u=isUrgent, f=datesFlexible, rec=[count,unit], multi=extra days
// (missionEndDate), get=isGetMission price, badges=requiredBadges,
// diff=difficulty, people=numberOfPeople, access={instr,parking,type},
// veh=requiredVehicleTypes, equip=# of category equipment to attach.
const M = [
  { cat: 'menage', title: 'Grand ménage avant réception', desc: "Nettoyage complet d'une maison de 120m² avant une réception familiale, sols, vitres, sanitaires.", h: 5, u: true, equip: 2 },
  { cat: 'menage', title: 'Ménage récurrent hebdomadaire bureaux', desc: "Entretien hebdomadaire de locaux professionnels de 200m², sols et sanitaires.", h: 3, f: true, rec: [1, 'SEMAINE'] },

  { cat: 'bricolage', title: 'Montage de 3 armoires et une bibliothèque', desc: "Montage de meubles livrés à plat pour un appartement neuf.", h: 5, equip: 2, badges: ['PRO'] },
  { cat: 'bricolage', title: 'Réparations diverses avant vente du bien', desc: "Petites réparations (portes, poignées, joints) avant passage d'un agent immobilier.", h: 3, u: true },

  { cat: 'demenagement', title: 'Déménagement T4 avec ascenseur', desc: "Déménagement complet d'un T4, ascenseur disponible aux deux adresses.", h: 6, veh: ['CAMION_15M3'], equip: 2, people: 3 },
  { cat: 'demenagement', title: 'Déménagement bureaux entreprise', desc: "Déménagement de 15 postes de travail et mobilier de bureau vers de nouveaux locaux.", h: 8, veh: ['GRAND_CAMION_20M3'], multi: true, badges: ['PRO'] },

  { cat: 'jardinage', title: "Entretien complet d'un parc de propriété", desc: "Tonte, taille de haies et désherbage sur un grand terrain de 2000m².", h: 6, equip: 3, people: 2 },
  { cat: 'jardinage', title: 'Entretien mensuel espaces verts résidence', desc: "Entretien récurrent des espaces verts communs d'une résidence.", h: 4, f: true, rec: [1, 'MOIS'] },

  { cat: 'garde-enfants', title: 'Garde périscolaire tous les soirs', desc: "Récupération à l'école et garde de 2 enfants (6 et 9 ans) jusqu'au retour des parents.", h: 3, f: true, rec: [5, 'SEMAINE'] },
  { cat: 'garde-enfants', title: 'Baby-sitting soirée entreprise', desc: "Garde de 3 enfants pendant une soirée organisée par l'entreprise des parents.", h: 5, u: true, badges: ['PREMIERS_SECOURS'] },

  { cat: 'cours-particuliers', title: 'Soutien scolaire physique-chimie terminale', desc: "Cours hebdomadaire de physique-chimie, préparation au bac, élève de terminale.", h: 2, f: true, rec: [1, 'SEMAINE'] },
  { cat: 'cours-particuliers', title: "Cours d'anglais professionnel en entreprise", desc: "Cours d'anglais pour une équipe de 4 salariés, deux fois par semaine.", h: 1.5, rec: [2, 'SEMAINE'], badges: ['PRO'] },

  { cat: 'aide-personne', title: 'Accompagnement quotidien personne âgée', desc: "Aide au lever, aux repas et aux déplacements chaque jour pendant une convalescence.", h: 3, u: true, rec: [1, 'JOUR'], badges: ['PREMIERS_SECOURS'] },
  { cat: 'aide-personne', title: 'Accompagnement rendez-vous médicaux', desc: "Accompagnement ponctuel à des rendez-vous médicaux, avec véhicule si possible.", h: 2, f: true },

  { cat: 'garde-animaux', title: 'Garde de deux chiens pendant 10 jours', desc: "Garde à domicile de deux chiens pendant un déplacement professionnel long.", h: 1, multi: true, f: true },
  { cat: 'garde-animaux', title: 'Promenades quotidiennes chien senior', desc: "Deux promenades par jour pour un chien âgé, rythme calme.", h: 1, rec: [2, 'JOUR'] },

  { cat: 'informatique', title: "Mise en place d'un réseau pour petite entreprise", desc: "Installation et configuration du réseau et des postes pour une équipe de 8 personnes.", h: 6, badges: ['PRO'], diff: 'DIFFICILE' },
  { cat: 'informatique', title: 'Dépannage urgent serveur local', desc: "Serveur local en panne bloquant toute l'activité, intervention urgente nécessaire.", h: 2, u: true, badges: ['PRO'] },

  { cat: 'transport', title: 'Navette aéroport pour équipe commerciale', desc: "Transport de 4 personnes et bagages depuis l'aéroport vers le siège de l'entreprise.", h: 2, u: true, veh: ['MINIBUS'], badges: ['PRO'] },
  { cat: 'transport', title: 'Transport de mobilier entre deux entrepôts', desc: "Transport de palettes et mobilier entre deux entrepôts de la même société.", h: 3, veh: ['CAMION_BENNE'] },

  { cat: 'convoi', title: 'Convoyage flotte de 3 véhicules', desc: "Convoyage de 3 véhicules de société entre deux concessions régionales.", h: 4, veh: ['VOITURE_TOURISME'], people: 3, badges: ['PRO'] },
  { cat: 'convoi', title: 'Convoyage utilitaire vers garage', desc: "Convoyage d'un utilitaire en panne mineure jusqu'au garage partenaire.", h: 2, u: true, veh: ['PETIT_UTILITAIRE_4M3'] },

  { cat: 'mecanique', title: "Entretien annuel d'une flotte de 5 véhicules", desc: "Révision et contrôle général d'une petite flotte de véhicules d'entreprise.", h: 6, rec: [1, 'AN'], badges: ['PRO'] },
  { cat: 'mecanique', title: 'Dépannage voiture ne démarre plus', desc: "Voiture en panne sur parking, diagnostic et dépannage sur place si possible.", h: 1.5, u: true },

  { cat: 'electricite', title: "Installation électrique d'un local commercial", desc: "Mise en place complète de l'installation électrique d'un local commercial neuf.", h: 8, multi: true, badges: ['PRO'], diff: 'DIFFICILE' },
  { cat: 'electricite', title: 'Panne électrique urgente atelier', desc: "Panne électrique bloquant la production dans un atelier, intervention urgente.", h: 2, u: true },

  { cat: 'plomberie', title: "Rénovation plomberie d'une salle de bain", desc: "Remplacement complet de la plomberie d'une salle de bain avant rénovation.", h: 6, badges: ['PRO'] },
  { cat: 'plomberie', title: 'Fuite urgente sous-sol entreprise', desc: "Fuite importante dans le sous-sol des locaux, intervention urgente demandée.", h: 2, u: true },

  { cat: 'peinture', title: "Peinture complète des bureaux d'une entreprise", desc: "Rafraîchissement complet des peintures de 6 bureaux et couloirs.", h: 8, multi: true, equip: 2 },
  { cat: 'peinture', title: "Peinture d'une chambre d'enfant", desc: "Peinture d'une chambre de 12m² avec motifs simples au plafond.", h: 4, f: true },

  { cat: 'piscine', title: "Remise en service piscine d'un hôtel", desc: "Remise en service complète de la piscine d'un petit hôtel avant la saison.", h: 4, badges: ['PRO'] },
  { cat: 'piscine', title: 'Entretien piscine résidentielle hebdomadaire', desc: "Entretien régulier d'une piscine privée, analyse d'eau et nettoyage.", h: 1, rec: [1, 'SEMAINE'] },

  { cat: 'conciergerie', title: "Gestion des arrivées d'un appartement locatif", desc: "Accueil des voyageurs et remise des clés pour un appartement en location courte durée.", h: 1, rec: [2, 'SEMAINE'], f: true },
  { cat: 'conciergerie', title: "Réception de colis pour une entreprise", desc: "Réception et tri quotidien des colis pour le compte d'une entreprise sans accueil physique.", h: 2, rec: [1, 'JOUR'] },

  { cat: 'manutention', title: 'Déchargement de camion et rangement entrepôt', desc: "Déchargement d'un camion de marchandises et rangement en entrepôt.", h: 4, people: 3, veh: ['PETIT_UTILITAIRE_4M3'], badges: ['PRO'] },
  { cat: 'manutention', title: 'Manutention lourde pour événement', desc: "Installation et manutention de structures lourdes avant un événement d'entreprise.", h: 5, u: true, people: 4 },

  { cat: 'bien-etre', title: "Séance de massage à domicile pour l'équipe", desc: "Organisation de séances de massage bien-être pour une équipe de 10 salariés.", h: 4, badges: ['PRO'] },
  { cat: 'bien-etre', title: 'Cours de relaxation hebdomadaire', desc: "Cours de relaxation et respiration à domicile, une fois par semaine.", h: 1, rec: [1, 'SEMAINE'], f: true },

  { cat: 'beaute', title: "Prestations beauté pour un événement d'entreprise", desc: "Maquillage et soins pour une équipe avant un événement corporate important.", h: 4, u: true, people: 6 },
  { cat: 'beaute', title: 'Soin du visage à domicile', desc: "Soin du visage complet à domicile en fin de journée.", h: 1.5, f: true },

  { cat: 'coiffure', title: "Coiffure pour un shooting professionnel", desc: "Prestation coiffure pour une équipe de 5 personnes avant un shooting photo d'entreprise.", h: 3, u: true, people: 5 },
  { cat: 'coiffure', title: 'Coupe et coiffage à domicile', desc: "Coupe et coiffage à domicile pour une personne à mobilité réduite.", h: 1, f: true },

  { cat: 'batiment', title: "Petits travaux de rénovation d'un local commercial", desc: "Rénovation légère d'un local commercial avant ouverture : cloisons, finitions.", h: 8, multi: true, badges: ['PRO'], diff: 'DIFFICILE' },
  { cat: 'batiment', title: "Réparation d'une toiture après intempéries", desc: "Réparation urgente d'une toiture endommagée après un épisode de vent fort.", h: 4, u: true, diff: 'DIFFICILE' },

  { cat: 'smartphone', title: 'Configuration flotte de smartphones entreprise', desc: "Configuration et déploiement de 12 smartphones professionnels pour une équipe commerciale.", h: 3, badges: ['PRO'] },
  { cat: 'smartphone', title: 'Réparation écran cassé urgente', desc: "Écran de smartphone cassé, besoin d'une réparation rapide avant un déplacement.", h: 1, u: true },

  { cat: 'web', title: "Refonte du site vitrine d'une entreprise", desc: "Refonte complète d'un site vitrine pour une petite entreprise du secteur artisanal.", h: 8, multi: true, badges: ['PRO'], diff: 'DIFFICILE' },
  { cat: 'web', title: 'Maintenance mensuelle site internet', desc: "Maintenance et mises à jour régulières d'un site internet existant.", h: 2, rec: [1, 'MOIS'] },

  { cat: 'cuisine', title: 'Traiteur pour événement entreprise 50 personnes', desc: "Préparation et service d'un buffet pour un événement d'entreprise de 50 personnes.", h: 6, u: true, people: 50, badges: ['PRO'] },
  { cat: 'cuisine', title: 'Cours de cuisine à domicile en famille', desc: "Cours de cuisine convivial à domicile pour toute la famille, recettes de saison.", h: 2, f: true },
];

// 50 distinct requester identities — individuals (men and women) and
// companies across varied sectors, so no two missions share a poster.
const INDIVIDUALS = [
  ['Camille', 'Mercier', 'f'], ['Julien', 'Perrot', 'm'], ['Sophie', 'Girard', 'f'], ['Nicolas', 'Fontaine', 'm'],
  ['Léa', 'Bertrand', 'f'], ['Thomas', 'Roussel', 'm'], ['Manon', 'Dubois', 'f'], ['Antoine', 'Lemoine', 'm'],
  ['Chloé', 'Rousseau', 'f'], ['Maxime', 'Girard', 'm'], ['Emma', 'Bonnet', 'f'], ['Hugo', 'Faure', 'm'],
  ['Sarah', 'Blanchard', 'f'], ['Alexandre', 'Guerin', 'm'], ['Laura', 'Muller', 'f'], ['Paul', 'Leroy', 'm'],
  ['Inès', 'Robin', 'f'], ['Romain', 'Clement', 'm'], ['Julie', 'Morin', 'f'], ['Vincent', 'Nicolas', 'm'],
  ['Marion', 'Henry', 'f'], ['Florian', 'Roy', 'm'], ['Aurélie', 'Barbier', 'f'], ['Damien', 'Colin', 'm'],
  ['Pauline', 'Fournier', 'f'], ['Clément', 'Gaillard', 'm'], ['Charlotte', 'Adam', 'f'], ['Baptiste', 'Arnaud', 'm'],
  ['Océane', 'Marchand', 'f'], ['Kevin', 'Simon', 'm'],
];
const COMPANIES = [
  ['Atelier Nord Bâtiment', 'ENTREPRISE'], ['Cabinet Vermeil Conseil', 'ENTREPRISE'], ['Groupe Delta Logistique', 'ENTREPRISE'],
  ['Studio Lumière Créative', 'ENTREPRISE'], ['Clinique du Parc', 'ENTREPRISE'], ['Résidence Les Tilleuls', 'ENTREPRISE'],
  ['Techni-Soft Solutions', 'ENTREPRISE'], ['Hôtel Bellevue', 'ENTREPRISE'], ['Boulangerie La Mie Dorée', 'ENTREPRISE'],
  ['Cabinet Notarial Fabre', 'ENTREPRISE'], ['Auto École Trajectoire', 'ENTREPRISE'], ['Institut Sérénité', 'ENTREPRISE'],
  ['Garage Moderne Automobiles', 'ENTREPRISE'], ['Épicerie Fine du Marché', 'ENTREPRISE'], ['Cabinet Architecture Volume', 'ENTREPRISE'],
  ['Crèche Les Petits Pas', 'ENTREPRISE'], ['Salle de Sport Energia', 'ENTREPRISE'], ['Concept Store Maison & Co', 'ENTREPRISE'],
  ['Agence Immobilière Horizon', 'ENTREPRISE'], ['Traiteur Événements Saveurs', 'ENTREPRISE'],
];

function buildClients() {
  const clients = [];
  for (const [firstName, lastName, gender] of INDIVIDUALS) {
    clients.push({ firstName, lastName, gender, accountKind: 'INDIVIDUAL' });
  }
  for (const [companyName] of COMPANIES) {
    const [firstName, lastName] = companyName.split(' ');
    clients.push({ firstName: firstName || 'Contact', lastName: lastName || companyName, accountKind: 'COMPANY', companyName });
  }
  return clients; // 30 + 20 = 50
}

async function ensureClient(entry, index) {
  const slug = entry.accountKind === 'COMPANY'
    ? entry.companyName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
    : `${entry.firstName}.${entry.lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const email = `demo-national-${index}-${slug}@jobber.city`;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(`DemoNational${index}!`, 10),
      firstName: entry.firstName,
      lastName: entry.lastName,
      accountKind: entry.accountKind,
      companyType: entry.accountKind === 'COMPANY' ? 'ENTREPRISE' : undefined,
      companyName: entry.companyName,
      role: 'MANAGER',
    },
  });
}

async function main() {
  const categories = await prisma.category.findMany({ include: { equipment: true } });
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const clients = buildClients();

  let created = 0;
  for (let i = 0; i < M.length; i++) {
    const m = M[i];
    const category = bySlug[m.cat];
    if (!category) { console.log(`Catégorie inconnue, ignorée : ${m.cat}`); continue; }

    const client = await ensureClient(clients[i], i);
    const address = `${FALLBACK_CITIES[i % FALLBACK_CITIES.length]}, France`;
    const geocoded = await geocodeAddress(address);
    const isTransport = ['demenagement', 'convoi', 'transport'].includes(m.cat);
    const dropoffAddress = isTransport ? `${FALLBACK_CITIES[(i + 3) % FALLBACK_CITIES.length]}, France` : undefined;
    const dropoffGeocoded = dropoffAddress ? await geocodeAddress(dropoffAddress) : null;

    const equipmentIds = m.equip ? (category.equipment || []).slice(0, m.equip).map((e) => e.id) : [];
    const isCompany = client.accountKind === 'COMPANY';

    await prisma.mission.create({
      data: {
        type: 'TASK',
        clientId: client.id,
        categoryId: category.id,
        title: m.title,
        description: m.desc,
        address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        dropoffAddress,
        dropoffLat: dropoffGeocoded?.lat,
        dropoffLng: dropoffGeocoded?.lng,
        desiredDate: daysFromNow(1 + (i % 20), 8 + (i % 10), 0),
        missionEndDate: m.multi ? daysFromNow(4 + (i % 20), 18, 0) : undefined,
        estimatedHours: m.h,
        isUrgent: !!m.u,
        datesFlexible: !!m.f,
        isRecurring: !!m.rec,
        recurrenceCount: m.rec ? m.rec[0] : undefined,
        recurrenceUnit: m.rec ? m.rec[1] : undefined,
        requiredVehicleTypes: m.veh || [],
        requiredBadges: m.badges || [],
        difficulty: m.diff,
        numberOfPeople: m.people,
        // Company-only publishing options — only set when the poster is a
        // COMPANY account, matching how POST /api/missions strips them for
        // individuals.
        equipmentProvidedByCompany: isCompany ? true : undefined,
        ppeProvidedByCompany: isCompany && m.badges?.includes('PRO') ? true : undefined,
        requiredEquipment: equipmentIds.length ? { create: equipmentIds.map((equipmentId) => ({ equipmentId })) } : undefined,
        isDemoNational: true,
        visibility: 'PUBLIC',
        status: 'OPEN',
      },
    });
    created++;
    console.log(`${created}/${M.length} : ${m.title} [${category.name}] — posté par ${client.accountKind === 'COMPANY' ? client.companyName : `${client.firstName} ${client.lastName}`}`);
  }

  console.log(`\nTerminé : ${created} missions nationales de démo créées (isDemoNational: true), sans toucher aux données existantes.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
