import "./preload-images"; // kick off background memory-caching immediately
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyAppFont } from "./lib/appearance-settings";

// Apply the saved global font before React paints so the default is
// Google Sans Flex even on the landing screen and during lazy loading.
applyAppFont();

// ── Global drag prevention ──────────────────────────────────────────────────
// Prevent ALL native browser drag operations on app elements.
// File-upload works via onDrop (user drags files FROM OS into the app),
// so blocking dragstart on app elements doesn't break file uploads at all.
document.addEventListener('dragstart', (e) => {
  e.preventDefault();
}, { capture: true });

createRoot(document.getElementById("root")!).render(<App />);

// Remove the preload class (transition/animation suppressor) after the very
// first committed render — 2 rAFs is enough for all useLayoutEffects to fire
// and position nav pills / pills correctly before transitions are enabled.
// We do NOT gate this on imagesReady: images are preloaded via <link> in
// index.html so they are cache-warm before JS even runs; waiting 3 s here
// would suppress ALL transitions while users interact with the app.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('preload');
  });
});
