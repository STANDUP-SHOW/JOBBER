const prisma = require('../config/prisma');

// First-ever check for a section creates its view row at "now" instead of
// counting the full historical backlog as "new" — badges are about what
// arrives from here on, not a flood of pre-existing rows on first deploy.
async function getLastViewed(ownerType, ownerId, section) {
  const existing = await prisma.adminSectionView.findUnique({
    where: { ownerType_ownerId_section: { ownerType, ownerId, section } },
  });
  if (existing) return existing.lastViewedAt;
  const created = await prisma.adminSectionView.create({
    data: { ownerType, ownerId, section, lastViewedAt: new Date() },
  });
  return created.lastViewedAt;
}

// `sectionQueries` is { sectionKey: (since) => Promise<count> } — each
// section counts rows created OR updated since that section was last
// viewed, so both brand-new rows and rows that just transitioned into a
// status (e.g. a mission becoming COMPLETED) light up the badge.
async function getCounts(ownerType, ownerId, sectionQueries) {
  const entries = await Promise.all(
    Object.entries(sectionQueries).map(async ([section, queryFn]) => {
      const since = await getLastViewed(ownerType, ownerId, section);
      const count = await queryFn(since);
      return [section, count];
    })
  );
  return Object.fromEntries(entries);
}

async function markSeen(ownerType, ownerId, section) {
  return prisma.adminSectionView.upsert({
    where: { ownerType_ownerId_section: { ownerType, ownerId, section } },
    create: { ownerType, ownerId, section, lastViewedAt: new Date() },
    update: { lastViewedAt: new Date() },
  });
}

module.exports = { getCounts, markSeen };
