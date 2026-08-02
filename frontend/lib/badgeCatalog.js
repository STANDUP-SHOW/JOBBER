// Mirrors backend/src/utils/badges.js BADGE_CATALOG — kept in sync manually
// since this is just icon/label lookup for display, not the source of truth.
const CATEGORY_COLOR = {
  status: { bg: 'bg-indigo-600', text: 'text-yellow-300' },
  tenure: { bg: 'bg-blue-600', text: 'text-yellow-300' },
  missions: { bg: 'bg-green-600', text: 'text-white' },
  reviews: { bg: 'bg-amber-500', text: 'text-ink' },
  expertise: { bg: 'bg-rose-600', text: 'text-yellow-200' },
};

export const BADGE_CATALOG = {
  PRO: { icon: '🪪', name: 'Professionnel', label: 'Professionnel (PRO)', category: 'status' },

  TENURE_1M: { icon: '🌱', name: 'Petit Nouveau', label: '1 mois sur Jobber', category: 'tenure' },
  TENURE_3M: { icon: '🌿', name: 'Habitué', label: '3 mois sur Jobber', category: 'tenure' },
  TENURE_1Y: { icon: '🌳', name: 'Fidèle', label: '1 an sur Jobber', category: 'tenure' },
  TENURE_2Y: { icon: '🎖️', name: 'Ancien', label: '2 ans sur Jobber', category: 'tenure' },
  TENURE_3Y: { icon: '🏅', name: 'Vétéran', label: '3 ans sur Jobber', category: 'tenure' },
  TENURE_4Y: { icon: '🛡️', name: 'Pilier', label: '4 ans sur Jobber', category: 'tenure' },
  TENURE_5Y: { icon: '🏆', name: 'Légende', label: '5 ans et + sur Jobber', category: 'tenure' },

  MISSIONS_1_5: { icon: '🔰', name: 'Premiers pas', label: '1 à 5 missions réussies', category: 'missions' },
  MISSIONS_5_10: { icon: '✅', name: 'En route', label: '5 à 10 missions réussies', category: 'missions' },
  MISSIONS_10_20: { icon: '📈', name: 'Actif', label: '10 à 20 missions réussies', category: 'missions' },
  MISSIONS_20_50: { icon: '🚀', name: 'Performant', label: '20 à 50 missions réussies', category: 'missions' },
  MISSIONS_50_100: { icon: '🔥', name: 'Prolifique', label: '50 à 100 missions réussies', category: 'missions' },
  MISSIONS_100: { icon: '🥇', name: 'Centurion', label: '100 missions et +', category: 'missions' },
  MISSIONS_1000: { icon: '💎', name: 'Légende vivante', label: '1000 missions et +', category: 'missions' },

  REVIEWS_100: { icon: '⭐', name: 'Sans faute', label: "100 % d'avis positifs", category: 'reviews' },
  REVIEWS_90: { icon: '🌟', name: 'Très apprécié', label: "90 % d'avis positifs et +", category: 'reviews' },

  EXPERT_10: { icon: '🎯', name: 'Spécialiste', label: 'Spécialiste — 10 missions même catégorie', category: 'expertise' },
  EXPERT_25: { icon: '🧭', name: 'Connaisseur', label: 'Connaisseur — 25 missions même catégorie', category: 'expertise' },
  EXPERT_50: { icon: '🎓', name: 'Expert', label: 'Expert — 50 missions même catégorie', category: 'expertise' },
  EXPERT_100: { icon: '🎖️', name: 'Maître', label: 'Maître — 100 missions et + même catégorie', category: 'expertise' },
  EXPERT_1000: { icon: '👑', name: 'Grand Maître', label: 'Grand Maître — 1000 missions et + même catégorie', category: 'expertise' },
};

for (const badge of Object.values(BADGE_CATALOG)) {
  badge.color = CATEGORY_COLOR[badge.category];
}

// Every badge is selectable as a mission requirement — only PRO is
// actually enforced server-side (see backend/src/utils/badges.js), the
// rest are informational and shown on the mission tile.
export const REQUIRABLE_BADGES = Object.keys(BADGE_CATALOG);

export const BADGE_CATEGORY_LABELS = {
  status: 'Statut',
  tenure: 'Ancienneté',
  missions: 'Missions réussies',
  reviews: 'Avis',
  expertise: 'Expertise',
};
