import { SUBSCRIPTION_COLORS } from '../lib/subscriptionColors';

export default function SubscriptionBadge({ plan, size = 'md' }) {
  const color = SUBSCRIPTION_COLORS[plan];
  if (!color) return null;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-block rounded-full font-bold uppercase tracking-wide ${sizeClass}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {color.label}
    </span>
  );
}
