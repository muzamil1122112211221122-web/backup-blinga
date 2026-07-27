---
name: Chat composer stacking
description: Prevent transcript text from showing through function bars and message composers after a response exists.
---

When chat messages render in an absolute scrolling layer, the bottom composer and function bar must create an opaque surface once messages exist. On PC, keep the cover close to the composer and place the separate function bar above it.

**Why:** Transparent gaps in a fixed or bottom-pinned composer allow the transcript behind it to remain visible, making response text appear to run through the function buttons and message bar.

**How to apply:** Use a state-gated cover for both desktop and mobile composer paths; preserve the transparent/centered empty state, keep the PC cover close to the input, give the PC function bar an explicit higher z-index, and portal viewport-fixed scroll controls to `document.body` when ancestor clipping interferes.