"use client";

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Twitter, Github } from 'lucide-react';

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false} {...props}>
      <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0A8.258 8.258 0 0 0 5.716 1.92a.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032a.052.052 0 0 0 .02.037 13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.05.05 0 0 0 .02-.037c.334-3.451-.559-6.449-2.366-9.107a.034.034 0 0 0-.02-.019ZM5.468 10.872c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.064 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
    </svg>
  );
}

export default function Footer() {
  const [openTooltip, setOpenTooltip] = React.useState<null | 'github' | 'discord'>(null);

  function showSoonTooltip(kind: 'github' | 'discord') {
    setOpenTooltip(kind);
    window.clearTimeout((showSoonTooltip as any)._t);
    (showSoonTooltip as any)._t = window.setTimeout(() => setOpenTooltip(null), 1500);
  }

  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-2 text-sm text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Toolfinity Home">
            <Image src="/toolfinity_logo.png" alt="Toolfinity logo" width={20} height={20} className="h-5 w-5" />
            <span className="font-medium glossy-silver-text">Toolfinity</span>
          </Link>
          <p className="text-foreground">© {new Date().getFullYear()} Toolfinity. All rights reserved.</p>
          <p>
            <Link className="hover:underline" href="#terms">Terms</Link>
            <span className="mx-2">•</span>
            <Link className="hover:underline" href="#privacy">Privacy</Link>
            <span className="mx-2">•</span>
            <Link className="hover:underline" href="#contact">Contact</Link>
          </p>
        </div>
        <div className="flex md:justify-end gap-3">
          <Link
            aria-label="X (Twitter)"
            className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted"
            href="https://x.com/silasedwards16"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="h-5 w-5" aria-hidden />
          </Link>

          <Tooltip.Provider delayDuration={0}>
            <Tooltip.Root open={openTooltip === 'github'}>
              <Tooltip.Trigger asChild>
                <Link
                  aria-label="GitHub"
                  href="#github"
                  className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted"
                  onClick={(e) => { e.preventDefault(); showSoonTooltip('github'); }}
                >
                  <Github className="h-5 w-5" aria-hidden />
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content sideOffset={8} className="rounded-md bg-foreground text-background px-2 py-1 text-xs shadow">
                  We don’t have that yet
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root open={openTooltip === 'discord'}>
              <Tooltip.Trigger asChild>
                <Link
                  aria-label="Discord"
                  href="#discord"
                  className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-muted"
                  onClick={(e) => { e.preventDefault(); showSoonTooltip('discord'); }}
                >
                  <DiscordIcon className="h-5 w-5" />
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content sideOffset={8} className="rounded-md bg-foreground text-background px-2 py-1 text-xs shadow">
                  We don’t have that yet
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </div>
    </footer>
  );
}


