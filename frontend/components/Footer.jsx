import Link from 'next/link';

const LEGAL_LINKS = [
  ['Conditions générales', '/conditions-generales'],
  ['Mentions légales', '/mentions-legales'],
  ['Jobber en toute confiance', '/confiance'],
  ['Politique de confidentialité', '/confidentialite'],
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white pb-24">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          {LEGAL_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-moss hover:underline">
              {label}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">© {new Date().getFullYear()} Jobber</p>
      </div>
    </footer>
  );
}
