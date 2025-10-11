import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Watermark Remover | Manually Select & Remove Overlays',
  description:
    'Draw a box over a watermark and process the video to remove it. Precise control for stubborn overlays.',
  keywords: [
    'video watermark remover',
    'manual watermark removal',
    'remove watermark from video',
    'delogo tool',
    'erase logo video',
  ],
  openGraph: {
    title: 'Video Watermark Remover | Manually Select & Remove Overlays',
    description: 'Select the watermark region and remove it from your video with precision.',
    type: 'website',
  },
  alternates: { canonical: '/tools/video-watermark-remover' },
};

export default function ToolsVideoManualLayout({ children }: { children: React.ReactNode }) {
  return children;
}


