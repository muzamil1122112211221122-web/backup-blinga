// ─────────────────────────────────────────────────────────────────────────────
// Global image pre-cache
//
// Two-layer strategy:
//   Layer 1 — <link rel="preload"> in index.html  (browser level, before JS)
//              Browser's preload scanner fetches every image before React mounts
//              or login screen appears.  Zero JS overhead.
//
//   Layer 2 — new Image() here  (JS level, keeps images in memory)
//              Pins decoded pixel data in browser memory so images are truly
//              instant on first render — no decode stall even if the HTTP cache
//              was warm.  Runs immediately when the module loads (before the
//              React tree mounts).
//
// Bundled assets (@assets/… imports) are handled by Vite's pipeline and don't
// need either layer.
// ─────────────────────────────────────────────────────────────────────────────
import { SIDEBAR_ASSETS } from "./lib/sidebar-assets";

const STATIC_IMAGES: string[] = [
  // ── AI model logos ─────────────────────────────────────────────────────────
  '/chatgpt-logo.png',
  '/chatgpt-logo-white.png',
  '/claude-logo.png',
  '/gemini-logo.png',
  '/grok-logo.png',
  '/deepseek-logo.png',
  '/kimi-logo.png',
  '/perplexity-logo.png',
  '/mistral-logo.png',
  '/qwen-logo.png',
  '/llama-logo.png',
  '/doubao-logo.png',
  '/blinga-logo.png',
  '/bytedance-logo.png',
  '/copilot-logo.png',
  '/meta-ai-logo.png',
  '/forus-logo.png',

  // ── Mode / avatar icons ────────────────────────────────────────────────────
  '/nomad-avatar.png',
  '/nomad-auto-icon.png',
  '/nomad-multi-icon.png',
  '/nomad-multi-dark.png',
  '/nomad-multi-light.png',
  '/philosopher-avatar.png',
  '/blinga-games-avatar.png',
  '/forus-games-avatar.png',
  '/lumin-avatar.png',
  '/incognito-dark.png',
  '/incognito-light.png',
  '/owl-dark.png',
  '/owl-light.png',

  // ── Settings sidebar tab icons ─────────────────────────────────────────────
  '/settings-account-gray.png',
  '/settings-account-black.png',
  '/settings-appearance-gray.png',
  '/settings-appearance-black.png',
  '/settings-behaviour-gray.png',
  '/settings-behaviour-black.png',
  '/settings-nomad-gray.png',
  '/settings-nomad-black.png',

  // ── Sidebar icons ──────────────────────────────────────────────────────────
  '/sb-search-icon.png',
  '/sb-chat-icon.png',
  '/sb-voice-icon.png',
  '/sb-imagine-icon.png',
  '/sb-history-icon.png',
  '/creativity-icon.png',
  '/integration-icon.png',
  '/settings-icon.png',
  '/brain-icon.png',
  ...Object.values(SIDEBAR_ASSETS).flatMap(icons => [icons.light, icons.dark]),

  // ── General UI icons ───────────────────────────────────────────────────────
  '/audio-icon.png',
  '/chat-ai-icon.png',
  '/copy-icon.png',
  '/dislike-icon.png',
  '/downloads-icon.png',
  '/high-volume-icon.png',
  '/mute-icon.png',
  '/thumbs-up-icon.png',
  '/icon-edit-image.png',
  '/icon-remove-bg.png',
  '/icon-orient-none.png',
  '/icon-orient-portrait.png',
  '/icon-orient-square.png',
  '/icon-orient-wide.png',
  '/podium-bars.png',
  '/leaderboard-bg.png',

  // ── Imagine style thumbnails ───────────────────────────────────────────────
  '/style-anime.png',

  // ── Blinga Games — banner + logo for every game ─────────────────────────────
  '/game-memory-banner.png',
  '/game-memory-logo.png',
  '/game-maths-banner.png',
  '/game-maths-logo.png',
  '/game-word-banner.png',
  '/game-word-logo.png',
  '/game-quiz-banner.png',
  '/game-quiz-logo.png',
  '/game-car-banner.png',
  '/game-car-logo.png',
  '/game-oddword-banner.png',
  '/game-oddword-logo.png',
  '/game-rps.png',
  '/game-tictactoe.png',

  // ── Blinga Imagine templates ─────────────────────────────────────────────────
  '/templates/anime.png',
  '/templates/ceo.png',
  '/templates/redecorate.png',
  '/templates/restore.png',
  '/templates/sketch.png',
  '/templates/style-upgrade.png',
  '/templates/winter.png',

  // ── Blinga Minds — personality avatars (all 27) ─────────────────────────────
  '/personalities/akbar.png',
  '/personalities/alexander.png',
  '/personalities/aristotle.png',
  '/personalities/caesar.png',
  '/personalities/confucius.png',
  '/personalities/da_vinci.png',
  '/personalities/einstein.png',
  '/personalities/gandhi.png',
  '/personalities/genghis.png',
  '/personalities/hawking.png',
  '/personalities/jinnah.png',
  '/personalities/kant.png',
  '/personalities/machiavelli.png',
  '/personalities/mandela.png',
  '/personalities/marx.png',
  '/personalities/napoleon.png',
  '/personalities/newton.png',
  '/personalities/nietzsche.png',
  '/personalities/plato.png',
  '/personalities/rumi.png',
  '/personalities/shakespeare.png',
  '/personalities/socrates.png',
  '/personalities/suleiman.png',
  '/personalities/suntzu.png',
  '/personalities/tesla.png',
  '/personalities/tipu.png',
  '/personalities/turing.png',
];

// Holds decoded HTMLImageElement references so the browser keeps pixel data
// in memory rather than evicting it from the HTTP cache.
const _pinned: HTMLImageElement[] = [];

// Resolves once every image has loaded or failed.
// Capped at 3 s so a single broken/slow asset can never hang the app.
export const imagesReady: Promise<void> = Promise.race([
  Promise.all(
    STATIC_IMAGES.map(
      src =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.onload  = () => resolve();
          img.onerror = () => resolve(); // missing asset → skip, don't block
          img.src = src;
          _pinned.push(img);            // keep alive in module scope
        })
    )
  ).then(() => undefined),
  new Promise<void>(resolve => setTimeout(resolve, 3000)),
]);
