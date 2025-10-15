import ToolCard from './ToolCard';
import Link from 'next/link';
import { featuredTools } from '@/data/tools';
import { useEffect, useMemo, useRef, useState } from 'react';

type FeaturedToolsProps = {
  selectedCategory: string | null;
};

export default function FeaturedTools({ selectedCategory }: FeaturedToolsProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NEXT_PUBLIC_DEV_MODE === '1';
  // Filter tools based on selected category
  const filteredTools = useMemo(() => {
    const byCategory = selectedCategory
      ? featuredTools.filter((tool) => tool.category === selectedCategory)
      : featuredTools;
    if (isDevMode) return byCategory;
    // In non-dev mode, hide unfinished/unstarted
    return byCategory.filter((tool) => tool.status !== 'unstarted' && tool.status !== 'unfinished');
  }, [selectedCategory, isDevMode]);

  // Duplicate list to enable seamless looping
  // INFINITE CAROUSEL USING TRANSLATE + CLONES (based on referenced guide)
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const trackRef = useRef<HTMLUListElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const items = filteredTools;
  const [clonesCount, setClonesCount] = useState<number>(1);
  const leadingClones = useMemo(() => items.slice(-clonesCount), [items, clonesCount]);
  const trailingClones = useMemo(() => items.slice(0, clonesCount), [items, clonesCount]);
  const fullList = useMemo(() => [...leadingClones, ...items, ...trailingClones], [leadingClones, items, trailingClones]);

  const indexRef = useRef<number>(clonesCount); // start on first real slide
  const slideWidthRef = useRef<number>(0);
  const gapPx = 16; // matches gap-4
  const programmaticScrollRef = useRef<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(media.matches);
    const onChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  // Measure slide width on resize and set initial scrollLeft to first real item
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const container = containerRef.current;
      if (!track || !container) return;
      const firstSlide = track.querySelector('[data-slide]') as HTMLElement | null;
      if (!firstSlide) return;
      slideWidthRef.current = firstSlide.offsetWidth + gapPx;
      // Compute clones based on viewport to cover visible items + one extra buffer
      const unitWidth = Math.max(1, slideWidthRef.current);
      const neededClones = Math.min(
        items.length,
        Math.max(1, Math.ceil(container.clientWidth / unitWidth) + 1)
      );
      if (neededClones !== clonesCount) {
        setClonesCount(neededClones);
      }
      const startOffset = neededClones * unitWidth;
      const endOffset = startOffset + (items.length * unitWidth);
      if (container.scrollLeft < startOffset || container.scrollLeft > endOffset - 1) {
        programmaticScrollRef.current = true;
        container.scrollLeft = startOffset;
        programmaticScrollRef.current = false;
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [fullList.length, clonesCount, items.length]);

  // Autoplay using scrollLeft with invisible resets; allow manual scroll to pause
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track || isReducedMotion || items.length === 0 || slideWidthRef.current <= 0) return;

    let rafId: number | null = null;
    let lastTime = performance.now();
    const pxPerSec = 60; // base autoplay speed
    let isPausedByUser = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastProgrammaticScrollAt = 0; // preserved but no longer used to gate pause on scroll
    // Smooth resume state
    let speedMultiplier = 1; // 0..1 scales pxPerSec
    let rampStartAt: number | null = null;
    const rampDurationMs = 500; // duration of ease-in after resume

    const unitWidth = Math.max(1, slideWidthRef.current);
    const totalRealWidth = items.length * unitWidth;
    const startOffset = clonesCount * unitWidth;
    const endOffset = startOffset + totalRealWidth;

    const ensureLoop = () => {
      // Wrap when entering clone zones to keep visuals smooth
      const viewport = container.clientWidth;
      const maxVisibleStart = endOffset - viewport; // last position where only real items are visible
      if (container.scrollLeft > maxVisibleStart) {
        programmaticScrollRef.current = true;
        container.scrollLeft -= totalRealWidth;
        programmaticScrollRef.current = false;
        return;
      }
      if (container.scrollLeft < startOffset) {
        programmaticScrollRef.current = true;
        container.scrollLeft += totalRealWidth;
        programmaticScrollRef.current = false;
      }
    };

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const dt = Math.min(100, now - lastTime) / 1000;
      lastTime = now;
      if (!isPausedByUser) {
        lastProgrammaticScrollAt = now;
        programmaticScrollRef.current = true;
        // If resuming, ramp up speed smoothly
        if (rampStartAt !== null) {
          const progress = Math.max(0, Math.min(1, (now - rampStartAt) / rampDurationMs));
          speedMultiplier = progress >= 1 ? 1 : easeOutCubic(progress);
          if (progress >= 1) rampStartAt = null;
        }
        const effectiveSpeed = pxPerSec * speedMultiplier;
        container.scrollLeft += effectiveSpeed * dt; // move right -> content moves left
        ensureLoop();
        programmaticScrollRef.current = false;
      }
      rafId = requestAnimationFrame(step);
    };

    const pauseForUser = () => {
      isPausedByUser = true;
      if (resumeTimer) clearTimeout(resumeTimer);
      // Reset speed to 0 during pause; ramp back up on resume
      speedMultiplier = 0;
      rampStartAt = null;
      resumeTimer = setTimeout(() => {
        isPausedByUser = false;
        rampStartAt = performance.now();
      }, 100);
    };

    const onScroll = () => {
      ensureLoop();
    };
    const onWheel = () => pauseForUser();
    const onPointerDown = () => pauseForUser();
    const onPointerUp = () => pauseForUser();
    const onTouchStart = () => pauseForUser();
    const onTouchMove = () => pauseForUser();
    const onTouchEnd = () => pauseForUser();

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', onScroll as any);
      container.removeEventListener('wheel', onWheel as any);
      container.removeEventListener('pointerdown', onPointerDown as any);
      container.removeEventListener('pointerup', onPointerUp as any);
      container.removeEventListener('touchstart', onTouchStart as any);
      container.removeEventListener('touchmove', onTouchMove as any);
      container.removeEventListener('touchend', onTouchEnd as any);
      if (resumeTimer) clearTimeout(resumeTimer);
    };
  }, [isReducedMotion, items.length, clonesCount]);

  return (
    <section id="tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            {selectedCategory ? `${selectedCategory} Tools` : 'Featured Tools'}
          </h2>
          <p className="text-foreground/70">
            {selectedCategory
              ? `Explore our ${selectedCategory.toLowerCase()} tools`
              : 'Our most popular free AI tools right now.'}
          </p>
        </div>
        <Link href="/tools" className="hidden sm:inline-flex rounded-full border px-4 h-10 items-center hover:bg-muted text-sm">View all tools</Link>
      </div>

      {items.length > 0 ? (
        <div className="mt-6 relative">
          {/* Fade masks on edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 carousel-fade-left" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 carousel-fade-right" aria-hidden />

          {/* Track container (scrollable, scrollbar hidden) */}
          <div ref={containerRef} className="overflow-x-auto overflow-y-hidden no-scrollbar">
            <ul ref={trackRef} className="flex gap-4 select-none">
              {fullList.map((tool, idx) => (
                <li key={`${tool.id}-${idx}`} data-slide className="w-[300px] sm:w-[340px] lg:w-[380px] flex-shrink-0">
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-8 text-center rounded-2xl border bg-card">
          <p className="text-foreground/70">No tools found in this category yet. Check back soon!</p>
        </div>
      )}

      <div className="mt-6 sm:hidden">
        <Link href="/tools" className="inline-flex w-full justify-center rounded-full border px-4 h-10 items-center hover:bg-muted text-sm">View all tools</Link>
      </div>
    </section>
  );
}


