'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl border border-zinc-200/50" aria-label="Toggle theme placeholder">
        <Sun className="h-4.5 w-4.5 opacity-50" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" />;
      case 'dark':
        return <Moon className="h-4.5 w-4.5 text-blue-400" />;
      default:
        return <Monitor className="h-4.5 w-4.5 text-emerald-650 dark:text-emerald-400" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      default:
        return 'System Theme';
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="w-10 h-10 rounded-xl relative hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-250/50 dark:border-zinc-800 transition-all cursor-pointer"
      title={`Active: ${getThemeLabel()}. Click to change.`}
      aria-label={`Current theme is ${getThemeLabel()}. Click to cycle through light, dark, and system modes.`}
    >
      <span className="sr-only">Toggle theme</span>
      {getThemeIcon()}
    </Button>
  );
}
