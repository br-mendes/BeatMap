"use client";
import { useEffect, useState } from 'react';

export default function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('beatmap_theme') : null;
    const initial = (saved === 'light' || saved === 'dark') ? saved : ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
    setTheme(initial as 'light'|'dark');
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', next);
    if (typeof window !== 'undefined') localStorage.setItem('beatmap_theme', next);
  };

  return (
    <button 
      type="button"
      className="btn-icon btn-square theme-toggle" 
      onClick={toggle} 
      aria-label="Toggle theme" 
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="text-xl" role="img" aria-hidden="true">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </button>
  );
}