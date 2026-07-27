---
name: AI response flicker prevention
description: Prevent black/white jitter in chat responses caused by client-side typing effects and remounting animations.
---

Chat responses that arrive as complete API results should render stable Markdown during and after the reveal. If a typing effect is kept, reveal whitespace-preserving chunks and feed the partial text through the same Markdown renderer so paragraphs and lists do not reflow at completion. Avoid a nested typing component or word-by-word animation inside the chat parent: parent state updates can recreate it, restart requestAnimationFrame/cursor effects, and repeatedly switch the response between partial text and markdown.

**Why:** Repeated remounts and animated opacity/cursor styles made the AI response visibly flicker between black and white while surrounding chat state changed.

**How to apply:** Keep the network loading indicator separate from message content. Use a stable message key, disable entrance animations on shared response bubble classes, preserve source whitespace while revealing, and render partial Markdown—not a plain pre-wrap span.