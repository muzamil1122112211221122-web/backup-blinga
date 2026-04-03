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
  '/forus-logo.png',
  '/nomad-avatar.png',
  '/philosopher-avatar.png',
  '/forus-games-avatar.png',
  '/lumin-avatar.png',
  '/integration-icon.png',
  '/settings-icon.png',
];

const _preloadedImages: HTMLImageElement[] = [];

STATIC_IMAGES.forEach(src => {
  const img = new Image();
  img.src = src;
  _preloadedImages.push(img);
});
