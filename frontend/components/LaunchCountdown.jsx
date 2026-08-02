'use client';

import { useEffect, useState } from 'react';

const LAUNCH_DATE = new Date('2026-09-15T00:00:00');

function timeLeft() {
  const diffMs = LAUNCH_DATE.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Block({ value, label }) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-yellow-300">
      <span className="font-display text-lg font-bold leading-none">{String(value).padStart(2, '0')}</span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </div>
  );
}

// Live countdown to the official launch date (15/09/2026) — shown on the
// homepage bêta banner alongside the launch-offer callout.
export default function LaunchCountdown() {
  // Starts null (not timeLeft()) so the server-rendered markup has nothing
  // time-dependent to mismatch against — the real value fills in right
  // after mount instead of racing the SSR clock.
  const [left, setLeft] = useState(null);

  useEffect(() => {
    setLeft(timeLeft());
    const id = setInterval(() => setLeft(timeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!left) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Block value={left.days} label="Jours" />
      <Block value={left.hours} label="Heures" />
      <Block value={left.minutes} label="Min" />
      <Block value={left.seconds} label="Sec" />
    </div>
  );
}
