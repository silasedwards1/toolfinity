import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-2 text-sm text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Toolfinity Home">
            <Image src="/toolfinity_logo.png" alt="Toolfinity logo" width={20} height={20} className="h-5 w-5" />
            <span className="font-medium glossy-silver-text">Toolfinity</span>
          </Link>
          <p className="text-foreground">© {new Date().getFullYear()} Toolfinity. All rights reserved.</p>
          <p>
            <Link className="hover:underline" href="#terms">Terms</Link>
            <span className="mx-2">•</span>
            <Link className="hover:underline" href="#privacy">Privacy</Link>
            <span className="mx-2">•</span>
            <Link className="hover:underline" href="#contact">Contact</Link>
          </p>
        </div>
        <div className="flex md:justify-end gap-3">
          <Link aria-label="Twitter" className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted" href="#twitter">X</Link>
          <Link aria-label="GitHub" className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted" href="#github">GH</Link>
          <Link aria-label="Discord" className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted" href="#discord">DC</Link>
        </div>
      </div>
    </footer>
  );
}


