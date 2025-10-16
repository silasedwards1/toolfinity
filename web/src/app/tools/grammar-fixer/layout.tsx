import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grammar Fixer | Correct Grammar with Highlights & Tips',
  description:
    'Paste any text to fix grammar, spelling, and punctuation. See highlighted issues with explanations and get tailored tips.',
  keywords: [
    'grammar checker',
    'grammar fixer',
    'spelling checker',
    'punctuation',
    'writing assistant',
    'proofreading',
  ],
  openGraph: {
    title: 'Grammar Fixer | Correct Grammar with Highlights & Tips',
    description:
      'Fix grammar and spelling instantly. View issues highlighted with explanations and copy the corrected text.',
    type: 'website',
  },
  alternates: { canonical: '/tools/grammar-fixer' },
};

export default function ToolsGrammarFixerLayout({ children }: { children: React.ReactNode }) {
  return children;
}


