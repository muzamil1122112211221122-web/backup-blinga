---
name: Logo pixelation fixes and honoring user-supplied brand assets
description: How to fix a small/pixelated logo image asset and why not to strip a user's provided background without confirming first.
---

When a user says a small logo/icon "looks pixelated," don't assume the source resolution is too low — check with sharp metadata first. Often the real fix is: trim transparent margins, resize with `kernel: 'lanczos3'`, apply a light `sharpen({ sigma: ~0.5-0.6 })`, and re-export as PNG. This produces a crisper baked-in anti-aliased asset instead of relying on the browser to downscale a much larger source at runtime (which can look soft/aliased on thin line-art strokes).

**Why:** thin white line-art icons downscaled a lot at runtime (e.g. 1000px source shown at 64-80px) can look mushy even though the source isn't literally low-res; pre-resizing server-side with a good resampling kernel bakes in cleaner edges than relying on the browser.

**How to apply:** when a user complains an icon/logo is "pixelated" or "small," process with sharp (trim → resize with lanczos3 → sharpen → export) rather than just changing CSS display size.

Separately: don't reinterpret an ambiguous complaint about a logo as "strip the background out of my logo." One user complaint about a logo "using a separate background" was about the image looking pasted-on against a dark overlay bar, not a request to remove the logo's own branded background (a gold rounded-square in this case). Stripping it produced an outline-only icon the user did not want — they reattached their original branded asset and asked for that back, just processed for sharpness. When a fix based on interpretation is a big visual change (e.g. removing an entire background layer from a user-supplied brand asset), it's safer to verify wording is actually asking for that structural change rather than a polish/sizing fix.
