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
  // Ensure at least 3 so we can always normalize into the middle copy
  const [repeats, setRepeats] = useState<number>(3);
  const leadingClones = useMemo(() => items.slice(-clonesCount), [items, clonesCount]);
  const trailingClones = useMemo(() => items.slice(0, clonesCount), [items, clonesCount]);
  const repeatedItems = useMemo(() => {
    if (items.length === 0) return [] as typeof items;
    return Array.from({ length: Math.max(2, repeats) }, () => items).flat();
  }, [items, repeats]);
  const fullList = useMemo(() => [...leadingClones, ...repeatedItems, ...trailingClones], [leadingClones, repeatedItems, trailingClones]);

  const indexRef = useRef<number>(clonesCount); // start on first real slide
  const slideWidthRef = useRef<number>(0);
  const gapPx = 16; // matches gap-4
  const programmaticScrollRef = useRef<boolean>(false);
  // startOffset: left of the FIRST real item in the list (after leading clones)
  // blockWidth: width of ONE full real-items cycle
  // loopWidth: full repeated width (kept for reference, but we will normalize using blockWidth)
  const metricsRef = useRef<{ startOffset: number; blockWidth: number; loopWidth: number }>({ startOffset: 0, blockWidth: 1, loopWidth: 0 });
  // --- MOBILE/A11Y CONTROLS ---
  const allowAutoplayWhenReduced =
    (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_ALLOW_AUTOPLAY_WHEN_REDUCED === 'true' || process.env.NEXT_PUBLIC_ALLOW_AUTOPLAY_WHEN_REDUCED === '1')) || false;
  const isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator as any)?.maxTouchPoints > 0);
  // avoid killing iOS momentum by deferring normalization until idle
  const userInteractingRef = useRef<boolean>(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_DELAY_MS = 140;

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
      const visibleCount = Math.max(1, Math.ceil(container.clientWidth / unitWidth));
      // Ensure at least 1 clone and at most items.length
      const neededClones = Math.min(items.length, Math.max(1, visibleCount + 1));
      if (neededClones !== clonesCount) {
        setClonesCount(neededClones);
      }
      // Determine repeats so that the repeated real region is wider than viewport by at least one block width
      const realWidth = Math.max(1, items.length * unitWidth - gapPx); // subtract trailing gap for actual block width
      // On touch devices, give extra runway so we can delay normalization until idle.
      const minRepeats = isTouchDevice ? 5 : 3;
      const neededRepeats = Math.max(minRepeats, Math.ceil((container.clientWidth * 4) / realWidth));
      if (neededRepeats !== repeats) {
        setRepeats(neededRepeats);
      }
      // Compute precise offsets using DOM to avoid rounding errors
      const slides = Array.from(track.querySelectorAll('[data-slide]')) as HTMLElement[];
      const repStartIndex = neededClones;
      // Find the next repeat block boundary by scanning forward until the pattern restarts
      // Fallback to neededClones + items.length if offsets are regular
      let repNextIndex = neededClones + items.length;
      for (let i = neededClones + 1; i < slides.length; i++) {
        if (slides[i].dataset.slideid === slides[repStartIndex]?.dataset.slideid) {
          repNextIndex = i;
          break;
        }
      }
      const domStart = slides[repStartIndex]?.offsetLeft ?? neededClones * unitWidth;
      const domNext = slides[repNextIndex]?.offsetLeft ?? domStart + items.length * unitWidth;
      const blockWidth = Math.max(1, domNext - domStart);
      const loopWidthLocal = Math.max(blockWidth * Math.max(2, neededRepeats), blockWidth * 2);
      metricsRef.current = { startOffset: domStart, blockWidth, loopWidth: loopWidthLocal };

      const endOffset = domStart + loopWidthLocal;
      // Normalize initial position into [startOffset, startOffset + loopWidth)
      const norm = container.scrollLeft - domStart;
      const wrapped = ((norm % loopWidthLocal) + loopWidthLocal) % loopWidthLocal;
      const target = domStart + wrapped;
      if (Math.abs(container.scrollLeft - target) > 0.1) {
        programmaticScrollRef.current = true;
        container.scrollLeft = target;
        programmaticScrollRef.current = false;
      }
    };
    // Defer measure to after layout for accurate offsetLeft
    requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [items.length, clonesCount, repeats]);

  // Autoplay using scrollLeft with invisible resets; allow manual scroll to pause
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    // Respect reduced motion unless explicitly overridden
    const disableAuto = isReducedMotion && !allowAutoplayWhenReduced;
    if (!container || !track || disableAuto || items.length === 0 || slideWidthRef.current <= 0) return;

    let rafId: number | null = null;
    let lastTime = performance.now();
    const pxPerSec = 30; // base autoplay speed
    let isPausedByUser = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastProgrammaticScrollAt = 0; // preserved but no longer used to gate pause on scroll
    // Smooth resume state
    let speedMultiplier = 1; // 0..1 scales pxPerSec
    let rampStartAt: number | null = null;
    const rampDurationMs = 500; // duration of ease-in after resume

    const unitWidth = Math.max(1, slideWidthRef.current);

    // Normalize into the MIDDLE copy based on ONE cycle width (blockWidth), not the full loop.
    const ensureLoop = () => {
      const { startOffset, blockWidth } = metricsRef.current;
      if (blockWidth <= 0) return;
      const epsilon = 0.5; // protects against sub-pixel jitter
      // If the user is interacting/flinging, do NOT normalize now—wait until idle.
      if (userInteractingRef.current) return;
      const norm = container.scrollLeft - startOffset;
      const wrapped = ((norm % blockWidth) + blockWidth) % blockWidth;
      const target = startOffset + blockWidth + wrapped;
      if (Math.abs(container.scrollLeft - target) > epsilon) {
        programmaticScrollRef.current = true;
        container.scrollLeft = target;
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

    // --- Touch & scroll handling (preserve iOS momentum) ---
    const markUserActive = () => {
      userInteractingRef.current = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    const scheduleIdleNormalize = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        userInteractingRef.current = false;
        ensureLoop(); // one normalize on idle to re-center
      }, IDLE_DELAY_MS);
    };
    const onScroll = () => {
      if (programmaticScrollRef.current) return; // ignore our own jump
      markUserActive();
      scheduleIdleNormalize();
    };
    const onWheel = () => { pauseForUser(); markUserActive(); scheduleIdleNormalize(); };
    const onTouchStart = () => { pauseForUser(); markUserActive(); };
    const onTouchMove = () => { markUserActive(); };
    const onTouchEnd = () => { markUserActive(); scheduleIdleNormalize(); };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', onScroll as any);
      container.removeEventListener('wheel', onWheel as any);
      container.removeEventListener('touchstart', onTouchStart as any);
      container.removeEventListener('touchmove', onTouchMove as any);
      container.removeEventListener('touchend', onTouchEnd as any);
      if (resumeTimer) clearTimeout(resumeTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isReducedMotion, items.length, clonesCount, repeats]);

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
              <li key={`${tool.id}-${idx}`} data-slide data-slideid={tool.id} className="w-[300px] sm:w-[340px] lg:w-[380px] flex-shrink-0">
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


