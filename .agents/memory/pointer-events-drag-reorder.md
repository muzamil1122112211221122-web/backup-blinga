---
name: Pointer Events for mobile drag-and-drop reorder
description: Native HTML5 draggable does not fire on touch devices; use Pointer Events to unify mouse+touch reordering.
---

Native HTML5 `draggable`/`onDragStart`/`onDrop` attributes only fire for mouse input — they silently do nothing on touch devices (mobile browsers/webviews). A settings list that reorders fine with a mouse but is unresponsive to touch drags is usually this.

**Why:** `dragstart` requires the browser's native drag gesture recognizer, which most mobile browsers don't implement for arbitrary elements.

**How to apply:** Replace with the Pointer Events API (`onPointerDown` on the drag handle + `window.addEventListener('pointermove'/'pointerup'/'pointercancel', ...)` for the duration of the drag). Pointer events unify mouse, touch, and pen without separate touch-event handlers. Attach `style={{ touchAction: 'none' }}` to the handle so the browser doesn't hijack the gesture for scrolling. Compute the drop target by comparing `clientY` against each row's `getBoundingClientRect()` midpoint, not by relying on `dragover`/`drop` events.
