// Shared Wikipedia thumbnail cache used by the Philosophers/Historical
// Personalities picker on both desktop (chat-interface.tsx) and mobile
// (mobile-chat-interface.tsx). Previously each surface kept its own private
// Map + fetch helper, so warming the cache on one surface never helped the
// other, and — more importantly — nothing triggered a fetch until the user
// actually opened the tab, causing every avatar to visibly pop in one by
// one. Callers should invoke `preloadWikiImages` as early as possible
// (component mount, not tab-open) so images are already cached by the time
// the tab is opened.
const wikiImageCache = new Map<string, string>();
const wikiImagePending = new Map<string, Promise<string | null>>();

export function getCachedWikiImage(articleTitle: string): string | undefined {
  return wikiImageCache.get(articleTitle);
}

export function fetchWikiImage(articleTitle: string): Promise<string | null> {
  if (wikiImageCache.has(articleTitle)) return Promise.resolve(wikiImageCache.get(articleTitle)!);
  if (wikiImagePending.has(articleTitle)) return wikiImagePending.get(articleTitle)!;
  const title = articleTitle.replace(/ /g, '_');
  const p = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    .then(r => r.json())
    .then(data => {
      const url: string | null = data.thumbnail?.source ?? null;
      if (url) wikiImageCache.set(articleTitle, url);
      wikiImagePending.delete(articleTitle);
      return url;
    })
    .catch(() => { wikiImagePending.delete(articleTitle); return null; });
  wikiImagePending.set(articleTitle, p);
  return p;
}

// Warms the cache for a list of article titles, `concurrency` at a time.
// Safe to call multiple times (from both desktop and mobile mounts) —
// already-cached or in-flight titles are skipped.
export function preloadWikiImages(names: string[], concurrency = 6) {
  let idx = 0;
  function next() {
    if (idx >= names.length) return;
    const name = names[idx++];
    if (!wikiImageCache.has(name)) {
      fetchWikiImage(name).finally(next);
    } else {
      next();
    }
  }
  for (let i = 0; i < Math.min(concurrency, names.length); i++) next();
}

export { wikiImageCache };
