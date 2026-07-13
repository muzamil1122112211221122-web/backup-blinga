// Preloads every static /public icon and avatar the app references by string
// path (i.e. not bundled via an ES import), so they never "pop in" unstyled
// mid-session — model logos, mode avatars, game/podium art, and Imagine style
// thumbnails. Bundled assets (imported in code, e.g. `@assets/...`) are
// already handled by Vite's build pipeline and don't need this.
const STATIC_IMAGES = [
  '/chatgpt-logo.png',
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
  '/fius-logo.png',
  '/nomad-avatar.png',
  '/nomad-auto-icon.png',
  '/philosopher-avatar.png',
  '/fius-games-avatar.png',
  '/lumin-avatar.png',
  '/integration-icon.png',
  '/settings-icon.png',
  '/brain-icon.png',
  '/podium-bars.png',
  '/style-3d.jpg',
  '/style-anime.png',
  '/style-cinematic.jpg',
  '/style-oil.jpg',
  '/style-photo.jpg',
  '/style-pixel.jpg',
  '/style-sketch.jpg',
  '/style-watercolor.jpg',
];

const _preloadedImages: HTMLImageElement[] = [];

// Resolves once every image has either loaded or failed — whichever is
// faster — so callers can gate the "reveal" of the UI on real readiness
// instead of firing requestAnimationFrame blindly. Capped so a single slow/
// broken asset can never hang the app.
export const imagesReady: Promise<void> = Promise.race([
  Promise.all(
    STATIC_IMAGES.map(
      src =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
          _preloadedImages.push(img);
        })
    )
  ).then(() => undefined),
  new Promise<void>(resolve => setTimeout(resolve, 1500)),
]);
