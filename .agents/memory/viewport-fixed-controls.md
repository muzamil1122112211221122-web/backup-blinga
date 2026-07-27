---
name: Viewport-fixed controls
description: Fixed-position controls inside transformed or scrolling app shells may need a body portal to stay stationary.
---

When a control must remain stationary while a panel scrolls, render it through a dedicated viewport host attached directly to `document.documentElement` and keep its visibility tied to the active state. CSS `position: fixed` alone can still be constrained by transformed ancestors.

**Why:** Imagine Studio controls were declared fixed/sticky but moved with the gallery because their render context included scrolling or transformed ancestors. The screenshot path also used the desktop composer at widths below the mobile breakpoint, so both desktop and mobile implementations must be covered.

**How to apply:** Use the shared viewport portal for empty-state overlays such as composers and action pills, while preserving the existing viewport coordinates and sidebar offset. Force the host and its direct children to fixed positioning with CSS `!important`.