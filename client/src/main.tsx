if (localStorage.getItem("force_wipe_v1") !== "true") {
  localStorage.clear();
  localStorage.setItem("force_wipe_v1", "true");
}

// Force migrate to blinga-lite for this update
if (localStorage.getItem("force_wipe_v2") !== "true") {
  localStorage.setItem("selectedModel", "blinga-lite");
  localStorage.setItem("force_wipe_v2", "true");
}
// Migrate blinga-prime out of localStorage (model doesn't exist)
if (localStorage.getItem("selectedModel") === "blinga-prime") {
  localStorage.setItem("selectedModel", "blinga-lite");
}
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

// ── Boot-time Radix UI cleanup ──────────────────────────────────────────────
// Clean up any stale scroll-lock or aria-hidden left by Radix modals/selects
// that were open during a previous session or a fast navigation.
function clearRadixLocks() {
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.removeProperty('pointer-events');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  const root = document.getElementById('root');
  if (root) { root.removeAttribute('aria-hidden'); root.removeAttribute('inert'); }
}
clearRadixLocks();

createRoot(document.getElementById("root")!).render(<App />);

// ── Watchdog: detect & fix stuck body pointer-events ─────────────────────
// Runs every 500 ms. If body has pointer-events:none and no open Radix modal
// exists, we clear it immediately. This covers edge-cases where the cleanup
// in Router hasn't fired yet (e.g. fast refresh, first paint).
setInterval(() => {
  const computed = window.getComputedStyle(document.body).pointerEvents;
  const hasOpenModal = !!document.querySelector('[data-state="open"]');
  if (computed === 'none' && !hasOpenModal) {
    clearRadixLocks();
  }
}, 500);

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


