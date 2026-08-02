import Link from 'next/link';

// Consistent "back to my account" button shown top-left on every page
// reachable from /account — blue background, yellow text/icon.
export default function AccountBackButton({ href = '/account', label = 'Retour à mon compte' }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-yellow-300 hover:bg-blue-700"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
        <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 1.5c-3.037 0-6.5 1.53-6.5 3.5v1a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5v-1c0-1.97-3.463-3.5-6.5-3.5Z" />
      </svg>
      {label}
    </Link>
  );
}
