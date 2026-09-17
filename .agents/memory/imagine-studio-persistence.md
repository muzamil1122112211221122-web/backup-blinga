---
name: Imagine Studio Persistence
description: How generated images are persisted across sessions in imagine-modal.tsx
---

## Storage
- Key: `blinga_my_images` in localStorage
- Format: `GenImage[]` (serialized, max 30 items, only completed images)
- Load on mount via state initializer: `useState(() => loadPersistedImages())`
- Persist after each image resolves (inside the `then` callback in generateSingle)

## UI Layout (redesigned)
- Header: "Images" title with purple sparkles icon
- Body: "Create an image" template carousel → "My images" grid
- My images shows actual user-generated images (not showcase/external URLs)
- "Clear all" button wipes localStorage + state
- Bottom bar: prompt input + count selector + generate button

**Why:** User wanted to see their own generated images, not external showcase images. Persistence ensures images survive closing/reopening the modal.
