import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const VIBRANT_COLOR_PAIRS: [string, string][] = [
  ['#ef4444', '#dc2626'],
  ['#f59e0b', '#d97706'],
  ['#f97316', '#ea580c'],
  ['#3b82f6', '#2563eb'],
  ['#10b981', '#059669'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#06b6d4', '#0891b2'],
  ['#84cc16', '#65a30d'],
  ['#f43f5e', '#e11d48'],
];

// Deterministic vibrant color derived from a name/username — shared so every
// avatar (sidebar, mobile settings, etc.) renders the exact same DP for a user.
export function getVibrantColor(name: string, secondary = false): string {
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorPair = VIBRANT_COLOR_PAIRS[Math.abs(hash) % VIBRANT_COLOR_PAIRS.length];
  return secondary ? colorPair[1] : colorPair[0];
}
