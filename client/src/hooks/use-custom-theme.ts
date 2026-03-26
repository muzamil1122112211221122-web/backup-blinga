import { useState, useEffect, useCallback } from 'react';

export interface CustomTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

const STORAGE_KEY = 'forus_custom_themes';
const ACTIVE_KEY = 'forus_active_custom_theme';
const STYLE_ID = 'forus-custom-theme-style';

export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyThemeColors(theme: CustomTheme | null) {
  const root = document.documentElement;
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (theme) {
    const p = theme.primaryColor;
    const s = theme.secondaryColor;

    // Override CSS variables (affects shadcn components)
    root.style.setProperty('--primary', hexToHsl(p));
    root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 100%)');
    root.style.setProperty('--secondary', hexToHsl(s));
    root.style.setProperty('--secondary-foreground', 'hsl(0, 0%, 100%)');
    root.style.setProperty('--ring', hexToHsl(p));
    root.style.setProperty('--accent', hexToHsl(s));
    root.style.setProperty('--accent-foreground', 'hsl(0, 0%, 100%)');

    // Inject style tag for hardcoded elements
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* ===== Send Button ===== */
      [data-testid="button-send-message"] {
        background-color: ${p} !important;
        color: white !important;
      }
      [data-testid="button-send-message"]:hover:not(:disabled) {
        filter: brightness(1.15) !important;
        background-color: ${p} !important;
      }

      /* ===== Theme toggle button active color ===== */
      [data-testid="button-theme-toggle"] {
        border-color: ${hexWithAlpha(p, 0.5)} !important;
      }

      /* ===== Active top-bar tabs ===== */
      .bg-secondary {
        background-color: ${s} !important;
        color: white !important;
      }

      /* ===== Focus rings ===== */
      *:focus-visible {
        outline-color: ${p} !important;
        ring-color: ${p} !important;
      }
      .ring-offset-background {
        --tw-ring-color: ${p} !important;
      }

      /* ===== User chat message bubbles ===== */
      .bg-primary {
        background-color: ${p} !important;
      }
      .text-primary-foreground {
        color: white !important;
      }

      /* ===== Scrollbar accent ===== */
      ::-webkit-scrollbar-thumb {
        background: ${hexWithAlpha(p, 0.35)} !important;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${hexWithAlpha(p, 0.55)} !important;
      }

      /* ===== Active sidebar menu item ===== */
      .macos-dialog-content button.bg-zinc-800,
      button.bg-zinc-800[class*="text-white"] {
        background-color: ${p} !important;
      }

      /* ===== Borders & rings on inputs ===== */
      input:focus, textarea:focus {
        border-color: ${hexWithAlpha(p, 0.6)} !important;
        box-shadow: 0 0 0 1px ${hexWithAlpha(p, 0.3)} !important;
      }

      /* ===== Switch (toggle) when checked ===== */
      button[role="switch"][data-state="checked"] {
        background-color: ${p} !important;
      }

      /* ===== Save/primary action buttons (settings) ===== */
      .macos-dialog-content button.bg-black,
      .macos-dialog-content button.dark\\:bg-white {
        background-color: ${p} !important;
        color: white !important;
      }

      /* ===== Active personality category pills ===== */
      .bg-primary.text-primary-foreground {
        background-color: ${p} !important;
        color: white !important;
      }

      /* ===== Gradient bar accent ===== */
      .from-violet-500, .from-purple-500, .from-blue-500, .from-indigo-500 {
        --tw-gradient-from: ${p} !important;
      }
    `;

    root.setAttribute('data-custom-theme', 'true');
  } else {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-foreground');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--secondary-foreground');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-foreground');
    root.removeAttribute('data-custom-theme');
    if (styleEl) styleEl.remove();
  }
}

export function useCustomTheme() {
  const [themes, setThemes] = useState<CustomTheme[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [activeThemeId, setActiveThemeId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  );

  useEffect(() => {
    const active = themes.find(t => t.id === activeThemeId) || null;
    applyThemeColors(active);
  }, [activeThemeId, themes]);

  const saveTheme = useCallback((theme: CustomTheme) => {
    setThemes(prev => {
      const updated = [...prev, theme];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTheme = useCallback((id: string) => {
    setThemes(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setActiveThemeId(prev => {
      if (prev === id) {
        localStorage.removeItem(ACTIVE_KEY);
        return null;
      }
      return prev;
    });
  }, []);

  const applyTheme = useCallback((id: string | null) => {
    setActiveThemeId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const activeTheme = themes.find(t => t.id === activeThemeId) || null;

  return { themes, activeThemeId, activeTheme, saveTheme, deleteTheme, applyTheme };
}
