import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Tone Checker | Analyze Email Tone & Improve Clarity',
  description:
    'Free email tone checker to analyze tone and professionalism. Get actionable suggestions to improve clarity, politeness, and style before sending.',
  keywords: [
    'email tone checker',
    'analyze email tone',
    'email tone analyzer',
    'professional email',
    'improve email tone',
    'email writing assistant',
    'tone analysis',
  ],
  openGraph: {
    title: 'Email Tone Checker | Analyze Email Tone & Improve Clarity',
    description:
      'Check your email tone for free. Instantly see tone, a one-line summary, and concrete tips to improve professionalism.',
    type: 'website',
  },
  alternates: { canonical: '/tools/email-tone-checker' },
};

export default function ToolsEmailToneLayout({ children }: { children: React.ReactNode }) {
  return children;
}


