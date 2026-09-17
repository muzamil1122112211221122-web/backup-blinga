---
name: Eager preload for tab content (desktop + mobile)
description: Pattern for warming caches/data at app mount instead of on tab-open, to avoid pop-in.
---

Tab content (Blinga Games logos/leaderboard, Philosophers avatars) used to only start
fetching once the user opened that tab, causing visible pop-in/blank states —
on both the desktop and mobile chat surfaces.

**Why:** desktop and mobile each had their *own* private module-level cache/fetch
helper for the same data (e.g. two separate Wikipedia-avatar caches), so warming
one surface never helped the other, and neither was triggered before the tab was
opened.

**How to apply:** put the cache + fetch/preload function in one shared module
(e.g. `client/src/lib/wiki-image-cache.ts`), have both `chat-interface.tsx` and
`mobile-chat-interface.tsx` import the same functions, and call the preload
eagerly in a mount-level `useEffect` (not gated on `activeTab === '<tab>'`). For
data that needs to survive component unmount/remount (e.g. BlingaGames leaderboard),
seed React state from a module-level cache variable so re-opening a tab shows the
last-known data instantly while a background refetch runs.
