// Jobber badges — some are selectable as mission requirements (see
// Mission.requiredBadges in missions.routes.js), all are auto-computed for
// display on a jobber's public profile and on mission tiles (never
// manually assigned). Only PRO is actually enforced when required — every
// other badge is informational and never blocks a candidature.
const BADGE_CATALOG = {
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

  REVIEWS_100: { icon: '⭐', label: '100 % d\'avis positifs', category: 'reviews' },
  REVIEWS_90: { icon: '🌟', label: '90 % d\'avis positifs et +', category: 'reviews' },

  EXPERT_10: { icon: '🎯', label: 'Expert — 10 missions même catégorie', category: 'expertise' },
  EXPERT_25: { icon: '🎯', label: 'Expert — 25 missions même catégorie', category: 'expertise' },
  EXPERT_50: { icon: '🎯', label: 'Expert — 50 missions même catégorie', category: 'expertise' },
  EXPERT_100: { icon: '🎖️', label: 'Expert — 100 missions et + même catégorie', category: 'expertise' },
  EXPERT_1000: { icon: '👑', label: 'Expert — 1000 missions et + même catégorie', category: 'expertise' },
};

// Every badge is selectable as a mission "requirement" — but only PRO is
// actually enforced when a jobber applies (see POST /offers). The rest are
// wishes, not gates: shown on the mission tile so a jobber can judge fit,
// never blocking a candidature.
const REQUIRABLE_BADGES = Object.keys(BADGE_CATALOG);

function tenureBadge(createdAt) {
  const months = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months >= 60) return 'TENURE_5Y';
  if (months >= 48) return 'TENURE_4Y';
  if (months >= 36) return 'TENURE_3Y';
  if (months >= 24) return 'TENURE_2Y';
  if (months >= 12) return 'TENURE_1Y';
  if (months >= 3) return 'TENURE_3M';
  if (months >= 1) return 'TENURE_1M';
  return null;
}

function missionsBadge(count) {
  if (count >= 1000) return 'MISSIONS_1000';
  if (count >= 100) return 'MISSIONS_100';
  if (count >= 50) return 'MISSIONS_50_100';
  if (count >= 20) return 'MISSIONS_20_50';
  if (count >= 10) return 'MISSIONS_10_20';
  if (count >= 5) return 'MISSIONS_5_10';
  if (count >= 1) return 'MISSIONS_1_5';
  return null;
}

function reviewsBadge(ratingAverage, ratingCount) {
  if (!ratingCount) return null;
  const positiveRate = ratingAverage / 5; // ratingAverage is out of 5
  if (positiveRate >= 1) return 'REVIEWS_100';
  if (positiveRate >= 0.9) return 'REVIEWS_90';
  return null;
}

function expertiseBadge(sameCategoryCount) {
  if (sameCategoryCount >= 1000) return 'EXPERT_1000';
  if (sameCategoryCount >= 100) return 'EXPERT_100';
  if (sameCategoryCount >= 50) return 'EXPERT_50';
  if (sameCategoryCount >= 25) return 'EXPERT_25';
  if (sameCategoryCount >= 10) return 'EXPERT_10';
  return null;
}

// `bestCategoryCount` = the highest completed-mission count among any one
// category for this provider (see users.routes.js for the query) — only
// the single best category earns an expertise badge, not every category
// they've ever worked in.
function computeBadges({ isProfessional, createdAt, completedMissions, ratingAverage, ratingCount, bestCategoryCount }) {
  return [
    isProfessional ? 'PRO' : null,
    tenureBadge(createdAt),
    missionsBadge(completedMissions ?? 0),
    reviewsBadge(ratingAverage, ratingCount),
    expertiseBadge(bestCategoryCount ?? 0),
  ].filter(Boolean);
}

module.exports = { BADGE_CATALOG, REQUIRABLE_BADGES, computeBadges };
