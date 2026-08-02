// Mirrors backend/src/utils/badges.js BADGE_CATALOG — kept in sync manually
// since this is just icon/label lookup for display, not the source of truth.
export const BADGE_CATALOG = {
  PRO: { icon: '🪪', label: 'Professionnel (PRO)', category: 'status' },

  TENURE_1M: { icon: '🕐', label: '1 mois sur Jobber', category: 'tenure' },
  TENURE_3M: { icon: '🕒', label: '3 mois sur Jobber', category: 'tenure' },
  TENURE_1Y: { icon: '📅', label: '1 an sur Jobber', category: 'tenure' },
  TENURE_2Y: { icon: '📅', label: '2 ans sur Jobber', category: 'tenure' },
  TENURE_3Y: { icon: '📅', label: '3 ans sur Jobber', category: 'tenure' },
  TENURE_4Y: { icon: '📅', label: '4 ans sur Jobber', category: 'tenure' },
  TENURE_5Y: { icon: '🏆', label: '5 ans et + sur Jobber', category: 'tenure' },

  MISSIONS_1_5: { icon: '✅', label: '1 à 5 missions réussies', category: 'missions' },
  MISSIONS_5_10: { icon: '✅', label: '5 à 10 missions réussies', category: 'missions' },
  MISSIONS_10_20: { icon: '✅', label: '10 à 20 missions réussies', category: 'missions' },
  MISSIONS_20_50: { icon: '✅', label: '20 à 50 missions réussies', category: 'missions' },
  MISSIONS_50_100: { icon: '✅', label: '50 à 100 missions réussies', category: 'missions' },
  MISSIONS_100: { icon: '🥇', label: '100 missions et +', category: 'missions' },
  MISSIONS_1000: { icon: '💎', label: '1000 missions et +', category: 'missions' },

  REVIEWS_100: { icon: '⭐', label: "100 % d'avis positifs", category: 'reviews' },
  REVIEWS_90: { icon: '🌟', label: "90 % d'avis positifs et +", category: 'reviews' },

  EXPERT_10: { icon: '🎯', label: 'Expert — 10 missions même catégorie', category: 'expertise' },
  EXPERT_25: { icon: '🎯', label: 'Expert — 25 missions même catégorie', category: 'expertise' },
  EXPERT_50: { icon: '🎯', label: 'Expert — 50 missions même catégorie', category: 'expertise' },
  EXPERT_100: { icon: '🎖️', label: 'Expert — 100 missions et + même catégorie', category: 'expertise' },
  EXPERT_1000: { icon: '👑', label: 'Expert — 1000 missions et + même catégorie', category: 'expertise' },
};

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
