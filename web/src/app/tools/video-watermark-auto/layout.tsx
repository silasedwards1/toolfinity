import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Automatic Video Watermark Remover | Detect & Remove Watermarks',
  description:
    'Upload a video and automatically detect and remove watermarks. Simple, fast processing with downloadable result.',
  keywords: [
    'video watermark remover',
    'automatic watermark removal',
    'remove video watermark',
    'delogo video',
    'watermark detection',
  ],
  openGraph: {
    title: 'Automatic Video Watermark Remover | Detect & Remove Watermarks',
    description: 'Detect and remove video watermarks automatically, then download the cleaned clip.',
    type: 'website',
  },
  alternates: { canonical: '/tools/video-watermark-auto' },
};

export default function ToolsVideoAutoLayout({ children }: { children: React.ReactNode }) {
  return children;
}


