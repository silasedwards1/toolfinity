'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Toolfinity Home">
          <Image
            src="/toolfinity_logo.png"
            alt="Toolfinity logo"
            width={28}
            height={28}
            priority
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold glossy-silver-text">Toolfinity</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link className="hover:underline underline-offset-4" href="/">Home</Link>
          <Link className="hover:underline underline-offset-4" href="/tools">Tools</Link>
          <Link className="hover:underline underline-offset-4" href="#about">About</Link>
          <Link className="hover:underline underline-offset-4" href="#faq">FAQ</Link>
          <Link className="hover:underline underline-offset-4" href="#blog">Blog</Link>
          <Link className="hover:underline underline-offset-4" href="#contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="#signup" className="hidden sm:inline-flex h-9 items-center rounded-full border px-4 text-sm hover:bg-muted">Sign Up</Link>
          <Link href="#login" className="hidden sm:inline-flex h-9 items-center rounded-full border px-4 text-sm hover:bg-muted">Log In</Link>
        </div>
      </div>
    </header>
  );
}


