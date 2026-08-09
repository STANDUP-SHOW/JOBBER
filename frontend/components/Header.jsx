import Link from 'next/link';
import Logo from './Logo';
import Wordmark from './Wordmark';

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-[38.4px] w-[38.4px]" />
          <Wordmark className="h-[28.8px]" />
        </Link>
      </div>
    </header>
  );
}
