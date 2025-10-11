import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Model Matchmaker | Find the Best Model for Your Task',
  description:
    'Describe your task and get the best AI model recommendation with reasons. Consider modality, coding/math ability, context length, speed, and cost.',
  keywords: [
    'AI model matchmaker',
    'choose AI model',
    'best LLM for task',
    'model recommendation',
    'AI model selector',
    'LLM comparison',
  ],
  openGraph: {
    title: 'AI Model Matchmaker | Find the Best Model for Your Task',
    description:
      'Get a tailored AI model recommendation with clear reasoning based on your needs.',
    type: 'website',
  },
  alternates: { canonical: '/tools/model-matchmaker' },
};

export default function ToolsModelMatchLayout({ children }: { children: React.ReactNode }) {
  return children;
}


