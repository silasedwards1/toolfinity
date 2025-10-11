export default function Benefits() {
  const items = [
    { title: 'Free access', desc: 'Use core tools without payment.' },
    { title: 'No registration required', desc: 'Most tools work instantly.' },
    { title: 'Privacy-focused', desc: 'Your content stays yours.' },
    { title: 'Mobile-friendly', desc: 'Responsive UI for any device.' },
    { title: 'Constantly improving', desc: 'New tools and features weekly.' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl md:text-3xl font-semibold text-center">Why Toolfinity</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <div key={b.title} className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold">{b.title}</h3>
            <p className="text-sm text-foreground/70">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


