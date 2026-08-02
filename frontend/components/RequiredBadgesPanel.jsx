import { BADGE_CATALOG } from '../lib/badgeCatalog';

// Full badge description (icon + name + label) — shown on the mission
// detail page only. Tiles/maps show just the bare icon (see MissionBadges);
// this is where the full picture lives, blue background / yellow text
// matching the site's convention for this kind of "extra info" panel.
export default function RequiredBadgesPanel({ requiredBadges }) {
  const keys = (requiredBadges || []).filter((k) => BADGE_CATALOG[k]);
  if (keys.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg bg-blue-600 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-yellow-300">Badges souhaités chez le jobber</div>
      <div className="mt-2 space-y-2">
        {keys.map((key) => {
          const badge = BADGE_CATALOG[key];
          return (
            <div key={key} className="flex items-start gap-2">
              <span className="text-lg leading-none">{badge.icon}</span>
              <div>
                <div className="text-sm font-bold text-yellow-300">{badge.name}</div>
                <div className="text-xs text-yellow-100">{badge.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
