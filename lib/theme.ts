import { Theme } from '../types';

export const THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Escuro (Padrão)',
    colors: {
      bg: '#0A0A0A',
      card: '#181818',
      primary: '#8b5cf6',   // Violet
      secondary: '#ec4899', // Pink
      accent: '#1DB954',    // Spotify Green
      text: '#ffffff',
      muted: '#9ca3af',     // Gray-400
      border: '#ffffff'     // White (used with opacity)
    }
  },
  {
    id: 'light',
    name: 'Claro',
    colors: {
      bg: '#f3f4f6',        // Gray-100
      card: '#ffffff',
      primary: '#6366f1',   // Indigo
      secondary: '#ec4899', // Pink
      accent: '#10b981',    // Emerald
      text: '#111827',      // Gray-900
      muted: '#6b7280',     // Gray-500
      border: '#000000'
    }
  },
  {
    id: 'neon',
    name: 'Cyberpunk',
    colors: {
      bg: '#050510',        // Deep Blue/Black
      card: '#0f0f1a',
      primary: '#00ff00',   // Neon Green
      secondary: '#ff00ff', // Neon Magenta
      accent: '#00ffff',    // Cyan
      text: '#e0e0e0',
      muted: '#6b7280',
      border: '#00ff00'
    }
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    colors: {
      bg: '#ffffff',
      card: '#f9fafb',      // Gray-50
      primary: '#000000',
      secondary: '#4b5563', // Gray-600
      accent: '#000000',
      text: '#000000',
      muted: '#6b7280',
      border: '#000000'
    }
  },
  {
    id: 'contrast',
    name: 'Alto Contraste',
    colors: {
      bg: '#000000',
      card: '#000000',
      primary: '#ffff00',   // Yellow
      secondary: '#00ffff', // Cyan
      accent: '#ff0000',    // Red
      text: '#ffffff',
      muted: '#d1d5db',
      border: '#ffffff'
    }
  }
];

// Helper to convert hex to RGB triplet (e.g. "255 255 255") for Tailwind opacity support
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r} ${g} ${b}`;
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  const setVar = (name: string, hex: string) => {
    root.style.setProperty(`--color-${name}`, hexToRgb(hex));
  };

  setVar('bg', theme.colors.bg);
  setVar('card', theme.colors.card);
  setVar('primary', theme.colors.primary);
  setVar('secondary', theme.colors.secondary);
  setVar('accent', theme.colors.accent);
  setVar('text', theme.colors.text);
  setVar('muted', theme.colors.muted);
  setVar('border', theme.colors.border);
  
  // Set meta theme-color for PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.colors.bg);
  }
};

export const getSavedTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('beatmap_theme');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading theme", e);
  }
  return THEMES[0];
};

export const saveTheme = (theme: Theme) => {
  localStorage.setItem('beatmap_theme', JSON.stringify(theme));
  applyTheme(theme);
};

export const exportTheme = (theme: Theme): string => {
  try {
    return btoa(JSON.stringify(theme));
  } catch (e) {
    return '';
  }
};

export const importTheme = (code: string): Theme | null => {
  try {
    const theme = JSON.parse(atob(code));
    if (theme && theme.colors && theme.name) {
      return { ...theme, isCustom: true, id: `custom-${Date.now()}` };
    }
  } catch (e) {
    console.error("Invalid theme code");
  }
  return null;
};