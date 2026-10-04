// Shapes a jobber's account for anyone other than the jobber themselves
// (public profile, provider grid, applicants on a mission). The raw
// ProviderProfile row also carries payout/banking state (walletBalance,
// bankLast4, stripeAccountId…) and the SIRET, and the User row carries the
// postal address — none of that may leave the server on a public route.
const PUBLIC_PROFILE_FIELDS = [
  'id', 'userId', 'radiusKm', 'verificationStatus', 'ratingAverage', 'ratingCount',
  'completedMissions', 'offersLessons', 'categories', 'services', 'equipment', 'vehicles', 'createdAt',
];

function publicProviderProfile(profile) {
  if (!profile) return profile;
  const out = {};
  for (const key of PUBLIC_PROFILE_FIELDS) {
    if (key in profile) out[key] = profile[key];
  }
  return out;
}

// Strips the address and shortens the last name to its initial ("Martin D.")
// unless keepFullName is set (e.g. the client reviewing offers on their own
// mission, who needs the full name to hire).
function publicProvider(user, { keepFullName = false } = {}) {
  if (!user) return user;
  const { address, lat, lng, providerProfile, ...rest } = user;
  return {
    ...rest,
    lastName: keepFullName || !rest.lastName ? rest.lastName : rest.lastName[0],
    ...(providerProfile !== undefined && { providerProfile: publicProviderProfile(providerProfile) }),
  };
}

module.exports = { publicProvider, publicProviderProfile };
