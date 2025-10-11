import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  CodeBracketIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export type ToolStatus = 'unstarted' | 'unfinished' | 'ready';

export type Tool = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: 'Image' | 'Video' | 'Text' | 'Music' | 'Code' | 'Utility';
  icon?: React.ReactNode;
  status?: ToolStatus; // unstarted -> red, unfinished -> yellow, ready -> no badge
};

function renderStatusBadge(status?: ToolStatus) {
  if (!status || status === 'ready') return null;

  const isUnstarted = status === 'unstarted';
  const label = isUnstarted ? 'Unstarted' : 'In progress';
  const cls = isUnstarted
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}
      aria-label={`Status: ${label}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isUnstarted ? 'bg-red-600 dark:bg-red-400' : 'bg-yellow-500 dark:bg-yellow-300'}`} />
      {label}
    </span>
  );
}

export default function ToolCard({ tool }: { tool: Tool }) {
  function getCategoryIcon(category: Tool['category']) {
    const common = 'h-4 w-4';
    switch (category) {
      case 'Image':
        return <PhotoIcon className={common} aria-hidden="true" />;
      case 'Video':
        return <VideoCameraIcon className={common} aria-hidden="true" />;
      case 'Text':
        return <DocumentTextIcon className={common} aria-hidden="true" />;
      case 'Music':
        return <MusicalNoteIcon className={common} aria-hidden="true" />;
      case 'Code':
        return <CodeBracketIcon className={common} aria-hidden="true" />;
      case 'Utility':
      default:
        return <WrenchScrewdriverIcon className={common} aria-hidden="true" />;
    }
  }

  return (
    <div className="group rounded-2xl border bg-card p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center" aria-hidden>
            {tool.icon ?? getCategoryIcon(tool.category)}
          </div>
          <div>
            <h3 className="font-semibold">{tool.name}</h3>
            <p className="text-sm text-foreground/70 line-clamp-2">{tool.description}</p>
          </div>
        </div>
        {renderStatusBadge(tool.status)}
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


