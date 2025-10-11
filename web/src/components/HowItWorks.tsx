export default function HowItWorks() {
  const steps = [
    { title: 'Pick your tool', desc: 'Choose from image, video, text, music, code, and more.' },
    { title: 'Enter your content', desc: 'Drop files or paste text. Adjust options as you like.' },
    { title: 'Enjoy results', desc: 'Download, share, or iterate. No account needed for most tools.' },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl md:text-3xl font-semibold text-center">How it works</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-2xl border bg-card p-6">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-semibold" aria-hidden>
              {i + 1}
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="text-sm text-foreground/70">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


