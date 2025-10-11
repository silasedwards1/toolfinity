'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme ?? resolvedTheme) === 'dark';

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-black/10 dark:border-white/10 hover:bg-muted transition-colors"
          >
            {isDark ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={8} className="rounded-md bg-foreground text-background px-2 py-1 text-xs shadow">
            Toggle theme
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}


