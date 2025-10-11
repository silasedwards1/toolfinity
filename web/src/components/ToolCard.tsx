import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export type Tool = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: 'Image' | 'Video' | 'Text' | 'Music' | 'Code' | 'Utility';
  icon?: React.ReactNode;
};

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="group rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center" aria-hidden>
          {tool.icon ?? <span className="text-xs">{tool.category}</span>}
        </div>
        <div>
          <h3 className="font-semibold">{tool.name}</h3>
          <p className="text-sm text-foreground/70 line-clamp-2">{tool.description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">{tool.category}</span>
        <Link href={tool.href} className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
          Try now <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}


