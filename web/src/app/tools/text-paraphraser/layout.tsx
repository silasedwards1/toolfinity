import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Paraphraser (Free, On‑Device) | Rewrite Text with Tone Control',
  description:
    'Paraphrase text for free in your browser. Rewrite with neutral, formal, or casual tone. Privacy-friendly with on-device fallback.',
  keywords: [
    'text paraphraser',
    'paraphrase online',
    'rewrite text',
    'reword sentences',
    'on-device paraphraser',
    'paraphrase with tone',
    'free paraphrasing tool',
  ],
  openGraph: {
    title: 'Text Paraphraser (Free, On‑Device) | Rewrite Text with Tone Control',
    description:
      'Rewrite text instantly with adjustable tone. Free, privacy-friendly paraphrasing with local model fallback.',
    type: 'website',
  },
  alternates: { canonical: '/tools/text-paraphraser' },
};

export default function ToolsParaphraserLayout({ children }: { children: React.ReactNode }) {
  return children;
}


