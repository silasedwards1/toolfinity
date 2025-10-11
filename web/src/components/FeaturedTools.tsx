import ToolCard from './ToolCard';
import Link from 'next/link';
import { featuredTools } from '@/data/tools';

export default function FeaturedTools() {
  return (
    <section id="tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">Featured Tools</h2>
          <p className="text-foreground/70">Our most popular free AI tools right now.</p>
        </div>
        <Link href="#all-tools" className="hidden sm:inline-flex rounded-full border px-4 h-10 items-center hover:bg-muted text-sm">View all tools</Link>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      <div className="mt-6 sm:hidden">
        <Link href="#all-tools" className="inline-flex w-full justify-center rounded-full border px-4 h-10 items-center hover:bg-muted text-sm">View all tools</Link>
      </div>
    </section>
  );
}


