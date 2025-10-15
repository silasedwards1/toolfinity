'use client';

import ToolCard, { Tool } from '@/components/ToolCard';
import { featuredTools } from '@/data/tools';

export default function ToolsIndexPage() {
  const categories: Tool['category'][] = ['Image', 'Video', 'Text', 'Music', 'Code', 'Utility'];
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NEXT_PUBLIC_DEV_MODE === '1';
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">All Tools</h1>
        <p className="mt-2 text-foreground/70">Browse every Toolfinity tool in one place.</p>
      </header>

      <div className="space-y-10">
        {categories.map((category) => {
          const toolsInCategory = featuredTools
            .filter((t) => t.category === category)
            .filter((t) => isDevMode || (t.status !== 'unstarted' && t.status !== 'unfinished'));
          if (toolsInCategory.length === 0) return null;
          return (
            <section key={category} aria-labelledby={`cat-${category}`}>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id={`cat-${category}`} className="text-2xl font-semibold">
                  {category}
                </h2>
                <span className="text-sm text-foreground/60">{toolsInCategory.length} tool{toolsInCategory.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolsInCategory.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}


