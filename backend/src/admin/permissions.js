// Atomic admin permissions (object.action) and the role templates that
// bundle them — the Jobber Admin Factory desktop app hides whatever the
// signed-in admin's template lacks, but every /api/admin/v1 route checks
// again server-side.

const PERMISSIONS = {
  'dashboard.read': 'Consulter le cockpit',
  'search.read': 'Recherche globale',
  'users.read': 'Consulter les utilisateurs',
  'users.update': 'Modifier un utilisateur',
  'users.suspend': 'Suspendre ou réactiver un compte',
  'verifications.read': 'Consulter les vérifications',
  'verifications.decide': 'Valider ou refuser un document',
  'missions.read': 'Consulter missions, devis et commandes',
  'missions.cancel': 'Annuler une mission sans commande',
  'companies.read': 'Consulter entreprises et corporate',
  'payments.read': 'Consulter transactions et versements',
  'support.read': 'Consulter le SAV, litiges et avis',
  'support.update': 'Traiter un message SAV',
  'conversations.read_private': 'Lire une conversation privée (motif obligatoire)',
  'notes.write': 'Écrire une note interne',
  'exports.run': 'Exporter en CSV',
  'audit.read': 'Consulter le journal d\'audit',
  'admins.read': 'Consulter les administrateurs',
  'admins.manage': 'Gérer les rôles administrateurs',
};

const ALL = Object.keys(PERMISSIONS);

const ROLE_TEMPLATES = {
  owner: { label: 'Propriétaire', permissions: ALL },
  operations: {
    label: 'Opérations',
    permissions: ['dashboard.read', 'search.read', 'users.read', 'users.update', 'users.suspend', 'verifications.read',
      'verifications.decide', 'missions.read', 'missions.cancel', 'companies.read', 'support.read', 'notes.write', 'exports.run'],
  },
  sav: {
    label: 'SAV',
    permissions: ['dashboard.read', 'search.read', 'users.read', 'missions.read', 'support.read', 'support.update',
      'conversations.read_private', 'notes.write'],
  },
  finance: {
    label: 'Finance',
    permissions: ['dashboard.read', 'search.read', 'users.read', 'missions.read', 'companies.read', 'payments.read',
      'notes.write', 'exports.run', 'audit.read'],
  },
  lecture: {
    label: 'Lecture seule',
    permissions: ['dashboard.read', 'search.read', 'users.read', 'verifications.read', 'missions.read', 'companies.read',
      'payments.read', 'support.read'],
  },
};

module.exports = { PERMISSIONS, ROLE_TEMPLATES };
