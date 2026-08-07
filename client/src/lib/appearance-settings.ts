export const DEFAULT_GLOW_ACCENT = "blue";
export const DEFAULT_APP_FONT = "google-sans-flex";
export const DEFAULT_LOGO_STYLE = "current";
export const DEFAULT_AUTO_ROTATE_LOGO = false;
const GLOW_DEFAULT_MIGRATION_KEY = "glowAccentColorDefaultMigrated";

export const LOGO_STYLE_OPTIONS = [
  { value: "current", label: "Current Fius Logo" },
  { value: "rings", label: "Animated Rings" },
] as const;

export type LogoStyle = (typeof LOGO_STYLE_OPTIONS)[number]["value"];
const LOGO_STYLE_KEY = "fiusLogoStyle";
const AUTO_ROTATE_LOGO_KEY = "fiusAutoRotateLogo";
const LOGO_STYLE_MAP_KEY = "fiusLogoStylesByConversation";
const LOGO_LAST_AUTO_STYLE_KEY = "fiusLastAutoLogoStyle";

function readLogoStyleMap(): Record<string, LogoStyle> {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOGO_STYLE_MAP_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function getStoredLogoStyle(): LogoStyle {
  const stored = localStorage.getItem(LOGO_STYLE_KEY);
  return LOGO_STYLE_OPTIONS.some(option => option.value === stored)
    ? stored as LogoStyle
    : DEFAULT_LOGO_STYLE;
}

export function getStoredAutoRotateLogo(): boolean {
  return localStorage.getItem(AUTO_ROTATE_LOGO_KEY) === "true";
}

export function persistLogoStyle(value: LogoStyle) {
  localStorage.setItem(LOGO_STYLE_KEY, value);
}

export function persistAutoRotateLogo(enabled: boolean) {
  localStorage.setItem(AUTO_ROTATE_LOGO_KEY, enabled ? "true" : "false");
}

export function getLogoStyleForConversation(conversationId?: string): LogoStyle {
  if (getStoredAutoRotateLogo() && conversationId) {
    const mapped = readLogoStyleMap()[conversationId];
    if (mapped && LOGO_STYLE_OPTIONS.some(option => option.value === mapped)) return mapped;
  }
  return getStoredLogoStyle();
}

/** Reserve the next style for a newly started chat. */
export function getNextAutoLogoStyle(): LogoStyle {
  const current = (localStorage.getItem(LOGO_LAST_AUTO_STYLE_KEY) as LogoStyle) || getStoredLogoStyle();
  const next: LogoStyle = current === "current" ? "rings" : "current";
  localStorage.setItem(LOGO_LAST_AUTO_STYLE_KEY, next);
  return next;
}

export function assignLogoStyleToConversation(conversationId: string, style?: LogoStyle): LogoStyle {
  const chosen = style || (getStoredAutoRotateLogo() ? getNextAutoLogoStyle() : getStoredLogoStyle());
  const map = readLogoStyleMap();
  map[conversationId] = chosen;
  localStorage.setItem(LOGO_STYLE_MAP_KEY, JSON.stringify(map));
  return chosen;
}

export const GLOW_ACCENT_OPTIONS = [
  { value: "disabled", label: "Off", swatch: null },
  { value: "yellow", label: "Light Yellow", swatch: "#FFF8B4" },
  { value: "blue", label: "Light Blue", swatch: "#B4DAFF" },
  { value: "red", label: "Light Red", swatch: "#FFB9B9" },
  { value: "green", label: "Light Green", swatch: "#B4FFC8" },
  { value: "orange", label: "Light Orange", swatch: "#FFDCAA" },
  { value: "purple", label: "Light Purple", swatch: "#DCB4FF" },
  { value: "midnight", label: "Midnight", swatch: "#3A3530" },
] as const;

export const APP_FONT_OPTIONS = [
  { value: "google-sans-flex", label: "Google Sans Flex", googleFont: "Google+Sans+Flex", css: "'Google Sans Flex', sans-serif" },
  { value: "figtree", label: "Figtree", googleFont: "Figtree:wght@300;400;500;600;700", css: "'Figtree', sans-serif" },
  { value: "geist", label: "Geist", googleFont: "Geist:wght@300;400;500;600;700", css: "'Geist', sans-serif" },
  { value: "instrument-sans", label: "Instrument Sans", googleFont: "Instrument+Sans:wght@400;500;600;700", css: "'Instrument Sans', sans-serif" },
  { value: "jetbrains-mono", label: "JetBrains Mono", googleFont: "JetBrains+Mono:wght@400;500;700", css: "'JetBrains Mono', monospace" },
  { value: "ibm-plex-sans", label: "IBM Plex Sans", googleFont: "IBM+Plex+Sans:wght@300;400;500;600;700", css: "'IBM Plex Sans', sans-serif" },
  { value: "source-serif", label: "Source Serif", googleFont: "Source+Serif+4:ital,wght@0,400;0,600;0,700", css: "'Source Serif 4', serif" },
  { value: "system", label: "System (SF Pro)", googleFont: null, css: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" },
  { value: "times-new-roman", label: "Times New Roman", googleFont: null, css: "'Times New Roman', Times, serif" },
] as const;

export function getStoredGlowAccent() {
  const stored = localStorage.getItem("glowAccentColor");
  if (!stored) return DEFAULT_GLOW_ACCENT;

  // Yellow was the previous implicit default. Migrate that legacy value once
  // so existing users receive the new blue default, while future explicit
  // yellow selections remain untouched.
  if (stored === "yellow" && localStorage.getItem(GLOW_DEFAULT_MIGRATION_KEY) !== "true") {
    localStorage.setItem("glowAccentColor", DEFAULT_GLOW_ACCENT);
    localStorage.setItem(GLOW_DEFAULT_MIGRATION_KEY, "true");
    return DEFAULT_GLOW_ACCENT;
  }

  return stored;
}

export function persistGlowAccent(value: string) {
  localStorage.setItem("glowAccentColor", value);
  localStorage.setItem(GLOW_DEFAULT_MIGRATION_KEY, "true");
}

type GlowTheme = "dark" | "light";

const GLOW_COLORS: Record<string, Record<GlowTheme, string>> = {
  // Dark mode uses deeper, more restrained hues so the glow sits into the
  // dark surface instead of reading as a bright pastel light. Light mode
  // values are intentionally unchanged.
  yellow: { dark: "112,88,12", light: "220,180,0" },
  blue: { dark: "24,76,132", light: "40,125,220" },
  red: { dark: "128,32,38", light: "220,55,55" },
  green: { dark: "24,112,58", light: "40,170,85" },
  orange: { dark: "132,66,12", light: "230,120,20" },
  purple: { dark: "88,38,132", light: "145,70,220" },
  midnight: { dark: "95,82,70", light: "138,118,100" },
};

export function applyAppFont(fontValue = localStorage.getItem("appFont") || DEFAULT_APP_FONT) {
  const font = APP_FONT_OPTIONS.find(option => option.value === fontValue) || APP_FONT_OPTIONS[0];

  if (font.googleFont) {
    const id = `gfont-${font.value}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`;
      document.head.appendChild(link);
    }
  }

  document.documentElement.style.setProperty("--fius-app-font", font.css);
  document.body.style.fontFamily = font.css;
}

// ─── UI Accent Color ──────────────────────────────────────────────────────────
export const UI_ACCENT_OPTIONS = [
  { value: '#3b82f6', label: 'Blue',   swatch: '#3b82f6' },
  { value: '#ef4444', label: 'Red',    swatch: '#ef4444' },
  { value: '#22c55e', label: 'Green',  swatch: '#22c55e' },
  { value: '#f59e0b', label: 'Amber',  swatch: '#f59e0b' },
  { value: '#8b5cf6', label: 'Purple', swatch: '#8b5cf6' },
  { value: '#ec4899', label: 'Pink',   swatch: '#ec4899' },
  { value: '#06b6d4', label: 'Cyan',   swatch: '#06b6d4' },
  { value: '#f97316', label: 'Orange', swatch: '#f97316' },
] as const;

export function getStoredUiAccentEnabled(): boolean {
  return localStorage.getItem('uiAccentEnabled') === 'true';
}

export function getStoredUiAccentColor(): string {
  return localStorage.getItem('uiAccentColor') || '#3b82f6';
}

/** Returns the active hex accent color, or null if off / multicolor. */
export function getActiveUiAccent(): string | null {
  if (!getStoredUiAccentEnabled()) return null;
  const color = getStoredUiAccentColor();
  if (color === 'multicolor') return null;
  return color;
}

/** Apply/remove accent CSS variable and body class. */
export function applyUiAccent() {
  const active = getActiveUiAccent();
  if (active) {
    document.documentElement.style.setProperty('--fius-ui-accent', active);
    document.body.classList.add('fius-accent-on');
  } else {
    document.documentElement.style.removeProperty('--fius-ui-accent');
    document.body.classList.remove('fius-accent-on');
  }
}

// ─── UI Click Sound ────────────────────────────────────────────────────────────
let uiClickAudioContext: AudioContext | null = null;
let uiClickAudio: HTMLAudioElement | null = null;
const UI_CLICK_AUDIO_FALLBACK =
  'data:audio/wav;base64,UklGRvQCAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdACAACAgYSIi42Lhn50amJfYWl3h5mos7WwoYx0W0Y5N0BTb4+txNHSx7KWdllBMi83SmSCn7jJ0Mu8pYpsUj80Mz1QaYWgt8bMyLqmjHFYRTk2PUxhe5SrvcfIwLCbgmpURDs6QlFlfZSpucPEvrGeiHFcS0E9QUxccYecrbrBwLmrmYVwXU5EQENNW22Blaa0vL66sKKQfWpaTkZESFFeb4GTo6+3urixpZaFdGRWTUhITVZjcoOToay0t7awppmKemteVE1LTFJbaHaEk5+qsbSzrqabj4FzZlxUT05QVl9qd4SQnKWssLCuqJ+ViXxxZl1WUlFTWF9pdH+KlZ6mq62tqqSdk4l+dGpiW1ZUVVhdY2x1f4mTm6KnqaqppZ+YkId+dWxlX1tYV1lcYWdvd4CIkJeeoqWnp6WhnJaPh4B4cGpkYF1bW1xfY2hudXyDipGXm5+io6SioJ2Yk42HgHpzbmllYV9eXl9hZGhtcnh9g4mOk5ebnp+goJ+em5iUj4uGgHt2cm5qZ2RjYmFiY2Vna25ydnt/hIiMkJOWmZucnZ2dnJqYlZOPjIiFgX15dnJvbWpoZ2ZlZWVmZ2hqbG9ydHd7foGEh4qNj5GTlZeYmZmZmZmYl5aUkpCOjIqHhYKAfnt5d3RzcW9ubGtqamlpaWlpamprbG1vcHFzdXZ4enx9f4GDhIaIiYuMjY6PkJGSk5OUlJWVlZWVlJSUk5OSkpGQj4+OjYyLiomIh4aFhIOCgYB/fn19fHt6eXl4d3Z2dXV0dHNzcnJycXFxcHBwcHBvb29vb29vb29vb29vb29vb29vb29vcHBwcHBwcHBwcHBwcHFxcXFxcXFxcXFxcXN0d3l8gIOGiIuNjo+Pj42MioeFgn98eXd1c3JycnN0dnh7fYCDhoiKjI2Ojo2MioiGhIF+e3l3dXRzc3N0dXd5fH6Bg4aIiouMjYyMi4k=';

// A native audio element is more reliable than a newly-created AudioContext
// inside Replit's preview iframe, where Web Audio can remain suspended.
const UI_CLICK_AUDIO_DATA_URL =
  'data:audio/wav;base64,UklGRjsEAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YRcEAACAgIGChIaIiYmIhoOAe3ZxbWppaWpudHuCipOaoaWnpqKck4h+cWZbU01LTFFZZXKBkJ+tuMDDwryypZWEdGNVSUE9PUJKVmV1hJWksLrAwsC5sKOVhXZmWE1FQUBDSlRhcH+OnKmzu76+u7SpnY+AcmRXTkdDQ0ZNV2Nxf4yaprC3u7y5s6qfk4V4al5UTEdFR0tTXWl2go+cp6+1ubm2sKiekoV5bWFXUEtISUxSW2VxfYmVn6mwtLa2sqykmo+DeG1iWVJNS0tOVFtkb3qFkJqkq7CztLKup5+Vi4B2a2JaVE9OTlFWXWVveYONl6CnrLCxsK2oopqQhn1zamFaVVJQUVNYXmZveIGKlJyjqayurq2ppJ2VjIN6cWliW1dUU1NWWl9mbnd/h5CYn6Spq6yrqaWgmZKKgXpxamNeWVZVVldbYGVsdHyDi5KZn6SnqaqppqOemJGKgnt0bWZhXVpYWFlbX2Npb3Z9hIuSmJ2hpaanp6WinpmTjYaAeXJsZ2JeXFpaW11gZGlvdXuBh42TmJ2go6SlpKKgnJiSjYeBe3Vwa2ZiX11dXV5fYmZqb3V6gIWLkJWZnZ+hoqKioJ2alpGMh4J9eHNuamZjYV9fX2BiZGhscHV6f4OIjZGVmZyen6Cgn56cmZWSjYmEgHt3cm5raGVjYmFhYmNelaGtvc3d7gIOHjI+TlpmbnJ2enZ2bmZeUkI2JhYF9eXVybmtpZ2VkY2NkZWdpa25xdXh8gIOHio6Rk5aYmZubm5uamZeVk5CNioaDgH16dnNwbmtpaGdmZmZmZ2lqbG9xdHd6fYCDhomMj5GTlZeYmZmZmZiXlpSSkI6LiYaDgH57eHZzcW9ta2ppaWhoaGlqa2xucHJ0d3l8foCDhYiKjI6QkpOUlZaXl5eWlpWUkpGPjYuJh4WDgH99enh2dHJxb25tbGtra2pra2xsbW9wcnN1d3l7fX+AgoSGiImLjY6QkZKTk5SUlJSUlJOTkpGQjo2MioiHhYOCgH99fHp4d3V0c3JxcG9ubm1tbW1tbW1tbW5ub3BxcnN0dXZ4eXt8fn+AgYKEhYeIiYqLjI2Oj5CQkZGRkpKSkpGRkZCQj46NjYyLiomHhoWEg4KAgH9+fXx6eXh3dnZ1dHNzcnFxcXBwcHBwcHBwcHBxcXJyc3N0dXV2d3h4eXp7fH1+f4CAgIGCg4SFhoaHiImJioqLi4yMjY2Ojo6Ojo+Pj4+Pj4+Pj4+Ojo6Ojo2NjYyMi4uLioiGhIKAf3x6eHZ1dHNycnJzdHV2eHp8foCBg4aHiYuMjY2NjY2Mi4qIhoSCgH99e3l3dnV0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3JxcG9ubm1tbW1tbW1tbW5ub3BxcnN0dXZ4eXt8fn+AgYKEhYeIiYqLjI2Oj5CQkZGRkpKSkpGRkZCQj46NjYyLiomHhoWEg4KAgH9+fXx6eXh3dnZ1dHNzcnFxcXBwcHBwcHBwcHBxcXJyc3N0dXV2d3h4eXp7fH1+f4CAgIGCg4SFhoaHiImJioqLi4yMjY2Ojo6Ojo+Pj4+Ojo6Ojo2NjYyMi4uLioiGhIKAf3x6eHZzcW9ta2ppaWhoaGlqa2xucHJ0d3l7fX+AgYKEhYeIiYqLjI2Oj5CQkZGRkpKSkpGRkZCQj46NjYyLiomHhoWEg4KAgH99e3l3dnV0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3NzdHR1d3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2dXR0c3h6fH6AgYOFh4iKi4yMjIyMi4qJiIaEgoB/fXt6eHd2XR5='; 

/** Play a soft, tactile UI click for pill-bar tab switches. */
export function playTabClick() {
  if (localStorage.getItem('uiSoundsEnabled') === 'false') return;

  // Play from the click gesture itself first. This is reliable in embedded
  // previews, where Web Audio may still be locked until a later gesture.
  try {
    if (!uiClickAudio) {
      uiClickAudio = new Audio(UI_CLICK_AUDIO_FALLBACK);
      uiClickAudio.volume = 0.85;
      uiClickAudio.preload = 'auto';
    }
    uiClickAudio.currentTime = 0;
    const playback = uiClickAudio.play();
    if (playback) {
      void playback.catch(() => playWebAudioClick());
    }
    return;
  } catch (_) {
    playWebAudioClick();
  }
}

function playWebAudioClick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    // Keep one context alive so rapid tab changes do not create a stack of
    // competing audio contexts (which can make short sounds feel clipped).
    const ctx = uiClickAudioContext ?? (uiClickAudioContext = new AudioCtx());

    const scheduleClick = () => {
      const t = ctx.currentTime;

      // Keep the pitch in the audible UI-tap range while adding a small
      // downward movement so it feels tactile instead of like a static beep.
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(255, t + 0.085);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.005); // audible 5ms attack
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095); // rounded 95ms decay

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    };

    // Browsers commonly create AudioContext in a suspended state. Scheduling
    // before resume() resolves silently drops the sound, especially on the
    // first tab click, so always schedule after the context is running.
    if (ctx.state === 'suspended') {
      void ctx.resume().then(scheduleClick).catch(() => {});
    } else {
      scheduleClick();
    }
  } catch (_) { /* ignore in environments without AudioContext */ }
}

export function getGlowGradient(
  accentValue: string,
  theme: GlowTheme,
  compact = false,
) {
  const color = GLOW_COLORS[accentValue]?.[theme];
  if (!color) return "transparent";

  const ellipse = compact ? "110% 55%" : "70% 60%";
  const baseOpacity = theme === "dark" ? 0.28 : 0.14;
  const middleOpacity = theme === "dark" ? 0.14 : 0.06;
  const edgeOpacity = theme === "dark" ? 0.03 : 0.01;

  return `radial-gradient(ellipse ${ellipse} at 50% 62%, rgba(${color},${baseOpacity}) 0%, rgba(${color},${middleOpacity}) 20%, rgba(${color},${edgeOpacity}) 42%, transparent 58%)`;
}