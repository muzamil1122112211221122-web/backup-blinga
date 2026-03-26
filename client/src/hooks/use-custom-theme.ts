import { useState, useEffect, useCallback } from 'react';

export interface CustomTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

const STORAGE_KEY = 'forus_custom_themes';
const ACTIVE_KEY = 'forus_active_custom_theme';

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
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeColors(theme: CustomTheme | null) {
  const root = document.documentElement;
  if (theme) {
    const primaryHsl = hexToHsl(theme.primaryColor);
    const secondaryHsl = hexToHsl(theme.secondaryColor);
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--secondary', secondaryHsl);
    root.style.setProperty('--ring', primaryHsl);
  } else {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--ring');
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
