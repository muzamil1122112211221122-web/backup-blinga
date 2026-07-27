---
name: Fius mobile-chat-interface also serves PC widths
description: Why a "desktop/PC" bug report can actually be about mobile-chat-interface.tsx, not chat-interface.tsx.
---

`useIsMobileOrTablet()` switches to `MobileChatInterface` for any window width < 1024px. Many laptops/browser
windows fall under that threshold, so a user testing on a PC can still be looking at the mobile component, not
`chat-interface.tsx` (the ≥1024px desktop component).

**Why:** A user reported "no drag-and-drop for attachments on PC" — `chat-interface.tsx` already had full
drag/drop + paste support, but `mobile-chat-interface.tsx` (which is what actually renders below 1024px) had
none. Fixing only the named "desktop" file would have missed the real bug.

**How to apply:** Before dismissing a "PC" bug as already-fixed by checking `chat-interface.tsx`, check whether
the same functionality also needs to exist in `mobile-chat-interface.tsx` — assume both files may need the fix
unless the report is clearly about a narrow phone screen.
