import Link from 'next/link';

export default function Community() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-3xl border bg-card p-8 md:p-12 grid gap-6 md:grid-cols-2 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">Join our community</h2>
          <p className="text-foreground/70">Get updates on new tools, beta access, and tips.</p>
          <div className="mt-6 flex gap-3">
            <Link href="#newsletter" className="inline-flex h-11 items-center rounded-full bg-primary text-white px-6 text-sm font-medium hover:opacity-90">Subscribe</Link>
            <Link href="#discord" className="inline-flex h-11 items-center rounded-full border px-6 text-sm font-medium hover:bg-muted">Join our Discord</Link>
          </div>
        </div>
        <div className="text-sm text-foreground/80">
          <blockquote className="rounded-xl border p-4">
            “Toolfinity helped me turn an idea into a prototype in one afternoon.” — A happy creator
          </blockquote>
        </div>
      </div>
    </section>
  );
}


