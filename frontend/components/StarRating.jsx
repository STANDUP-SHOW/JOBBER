'use client';

export default function StarRating({ value = 0, onChange, size = 18 }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === 'function';

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          style={{ fontSize: size, lineHeight: 1 }}
        >
          <span className={n <= Math.round(value) ? 'text-ochre' : 'text-slate-200'}>★</span>
        </button>
      ))}
    </div>
  );
}
