---
name: Accent color & UI sounds
description: How accent color and tab-click sounds are wired throughout the app.
---

## Accent Color
- Stored in localStorage: `uiAccentEnabled` (boolean string) and `uiAccentColor` (hex or 'multicolor').
- `applyUiAccent()` in appearance-settings.ts sets CSS var `--fius-ui-accent` on documentElement and adds/removes `fius-accent-on` class on body.
- CSS rule in index.css: `.fius-accent-on [data-state=checked]` overrides switch color; `.fius-accent-on .user-msg-bubble` overrides user bubble bg.
- User message bubbles get class `user-msg-bubble` in both chat-interface.tsx and mobile-chat-interface.tsx.
- Logo, welcome h2, "Fly With Us!" p get inline `style={uiAccentColor ? { color: uiAccentColor } : {}}`; Logo gets `ringColor={uiAccentColor || undefined}`.
- Settings UI added in customize-modal.tsx Looks section: toggle + Multicolor option + 8 color swatches.
- Change is immediate (no Save needed) — dispatches `uiAccentChanged` event.

**Why:** CSS variable approach avoids prop-drilling through every Switch/bubble; class on body lets us scope all overrides without changing component internals.

## UI Sounds
- `playTabClick()` in appearance-settings.ts uses Web Audio API (no external file) — sine wave chirp ~80ms.
- Respects `localStorage.getItem('uiSoundsEnabled') === 'false'` (default: enabled).
- Hooked to: main tab bar (changeTab), Nomad Multi/Ultimatum buttons, Fius Minds category pills, Games leaderboard filter, Settings sidebar tabs, Theme SlidingPillSelector, Message bar style SlidingPillSelector.
- SlidingPillSelector got a `withSound` boolean prop — plays when selection changes.
- Toggle added to Settings > Looks.
