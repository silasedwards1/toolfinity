import { Tool } from '@/components/ToolCard';

export const featuredTools: Tool[] = [
  {
    id: 'img-upscaler',
    name: 'Image Upscaler',
    description: 'Enhance and upscale images with AI while preserving details.',
    href: '/tools/image-upscaler',
    category: 'Image',
    status: 'unstarted',
  },
  {
    id: 'video-summarizer',
    name: 'Video Summarizer',
    description: 'Get concise summaries of any video with timestamps.',
    href: '/tools/video-summarizer',
    category: 'Video',
    status: 'unstarted',
  },
  {
    id: 'text-paraphraser',
    name: 'Text Paraphraser',
    description: 'Rewrite sentences and paragraphs in your style.',
    href: '/tools/text-paraphraser',
    category: 'Text',
    status: 'unfinished',
  },
  {
    id: 'code-explainer',
    name: 'Code Explainer',
    description: 'Paste code and get clear explanations and improvements.',
    href: '/tools/code-explainer',
    category: 'Code',
    status: 'unstarted',
  },
  {
    id: 'music-tag-cleaner',
    name: 'Music Tag Cleaner',
    description: 'Fix and normalize audio metadata in seconds.',
    href: '/tools/music-tag-cleaner',
    category: 'Music',
    status: 'unstarted',
  },
  {
    id: 'video-watermark-remover',
    name: 'Video Watermark Remover',
    description: 'Smartly remove corner/logo watermarks using FFmpeg delogo. Free.',
    href: '/tools/video-watermark-remover',
    category: 'Video',
    status: 'ready',
  },
  {
    id: 'video-watermark-auto',
    name: 'Auto Watermark Remover',
    description: 'Upload once. We detect persistent overlays and remove them across the video.',
    href: '/tools/video-watermark-auto',
    category: 'Video',
    status: 'unfinished',
  },
  {
    id: 'model-matchmaker',
    name: 'Model Matchmaker',
    description: 'Describe your task; we pick the best AI model and explain why.',
    href: '/tools/model-matchmaker',
    category: 'Utility',
    status: 'unfinished',
  },
];


