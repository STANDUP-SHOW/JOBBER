'use client';

import { useEffect, useState } from 'react';

function splitRemaining(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function MissionCountdown({ desiredDate }) {
  const [remaining, setRemaining] = useState(() => splitRemaining(new Date(desiredDate) - new Date()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(splitRemaining(new Date(desiredDate) - new Date())), 1000);
    return () => clearInterval(id);
  }, [desiredDate]);

  if (!remaining) return <span className="text-sm font-medium text-brand">Mission en cours</span>;

  return (
    <span className="text-sm text-slate-500">
      Votre agent arrive dans{' '}
      <span className="font-mono font-semibold text-ink">
        {remaining.days}j {String(remaining.hours).padStart(2, '0')}h {String(remaining.minutes).padStart(2, '0')}m {String(remaining.seconds).padStart(2, '0')}s
      </span>
    </span>
  );
}
