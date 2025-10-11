'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-40 left-1/2 h-[480px] w-[1200px] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Discover the World’s Best <span className="gradient-text">Free AI Tools</span>
        </h1>
        <p className="mt-4 md:mt-6 text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
          Instant access. Zero payment. Creative power. Explore diverse AI utilities for creators, students, and professionals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="#tools" className="inline-flex h-11 items-center rounded-full bg-primary text-white px-6 text-sm font-medium hover:opacity-90">Explore Tools</Link>
          <Link href="#how" className="inline-flex h-11 items-center rounded-full border px-6 text-sm font-medium hover:bg-muted">How it works</Link>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Link href="#demo" className="inline-flex h-11 items-center rounded-full border px-6 text-sm font-medium hover:bg-muted">Watch demo</Link>
              </Tooltip.Trigger>
              <Tooltip.Content sideOffset={8} className="rounded-md bg-foreground text-background px-2 py-1 text-xs shadow">
                See a 60s tour of Toolfinity
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 opacity-90">
          {['Image', 'Video', 'Text', 'Music', 'Code'].map((label) => (
            <div key={label} className="rounded-xl border bg-card p-4 text-sm font-medium">
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


