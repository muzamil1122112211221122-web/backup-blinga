---
name: Appearance preference wiring
description: Durable convention for user-selected message-bar glow colors and global app fonts.
---

Appearance preferences are client-side settings: keep option metadata and application helpers in one shared module, persist the selected value in localStorage, and dispatch a browser event so desktop and mobile chat components update immediately.

**Why:** The chat has separate desktop and mobile implementations; duplicating option lists or applying only inside the settings modal causes inconsistent appearance and loses the setting on reload.

**How to apply:** Add future appearance options to the shared config first, then consume that config from settings, startup initialization, and both chat implementations.