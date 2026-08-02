'use client';

import { useEffect, useState } from 'react';

// Live "démarre dans…" countdown for a SCHEDULED booking — mirrors
// frontend/app/dashboard/page.jsx's CountdownToStart.
export default function CountdownToStart({ date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const diffMs = new Date(date).getTime() - now;
  if (diffMs <= 0) return <span className="text-xs font-medium text-accent-dark">Peut démarrer</span>;
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} j`);
  if (days > 0 || hours > 0) parts.push(`${hours} h`);
  parts.push(`${minutes} min`);
  return <span className="text-xs font-medium text-slate-500">Démarre dans {parts.join(' ')}</span>;
}
