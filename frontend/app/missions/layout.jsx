'use client';

import { usePathname } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';

// The mission detail page (/missions/[id]) is its own immersive,
// guest-facing experience and deliberately stays outside this shell —
// everything else under /missions (the listing, "publier un besoin")
// shares the same nav as the rest of the app.
export default function MissionsLayout({ children }) {
  const pathname = usePathname();
  const isListOrNew = pathname === '/missions' || pathname === '/missions/new';
  if (!isListOrNew) return children;
  return <DashboardShell>{children}</DashboardShell>;
}
