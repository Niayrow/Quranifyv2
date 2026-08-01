import { RECITER_IMAGES } from './images';
import { RECITER_CATEGORIES } from '../data/reciterCategories';

const STATIC_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/site.webmanifest',
  '/icons/sansfond.webp',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/maskable-192x192.png',
  '/icons/maskable-512x512.png',
  '/icons/artwork.png',
  '/icons/logo.png',
];

const waitForServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;
  const ready = await navigator.serviceWorker.ready.catch(() => null);
  if (!ready) return;
  // Prefer an active controlling worker when available
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve) => {
    const onChange = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      resolve();
    }, 4000);
  });
};

const collectShellUrls = (): string[] => {
  const origin = window.location.origin;
  const urls = new Set<string>();

  for (const path of STATIC_SHELL) {
    urls.add(new URL(path, origin).href);
  }

  document
    .querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"], link[rel="modulepreload"], link[rel="preload"]')
    .forEach((el) => {
      const href = 'href' in el && el.href ? el.href : (el as HTMLScriptElement).src;
      if (href && href.startsWith(origin)) urls.add(href);
    });

  Object.values(RECITER_IMAGES).forEach((path) => {
    urls.add(new URL(path, origin).href);
  });

  RECITER_CATEGORIES.forEach((category) => {
    urls.add(new URL(category.image, origin).href);
  });

  return Array.from(urls);
};

const fetchWithConcurrency = async (urls: string[], concurrency = 4) => {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (index < urls.length) {
      const current = urls[index];
      index += 1;
      try {
        await fetch(current, { credentials: 'same-origin', cache: 'reload' });
      } catch {
        // Best-effort precache — ignore individual failures
      }
    }
  });
  await Promise.all(workers);
};

/**
 * After first paint, warm the service-worker caches so app navigation
 * keeps working offline (audio downloads remain separate / on demand).
 */
export const precacheAppShellInBackground = (): void => {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  if (!('caches' in window) || !('serviceWorker' in navigator)) return;

  const run = async () => {
    try {
      await waitForServiceWorker();
      if (!navigator.onLine) return;
      const urls = collectShellUrls();
      await fetchWithConcurrency(urls, 4);
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      registration?.active?.postMessage({ type: 'PRECACHE_URLS', urls });
    } catch {
      // Silent — precache must never break the app
    }
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      void run();
    }, { timeout: 5000 });
  } else {
    window.setTimeout(() => {
      void run();
    }, 1800);
  }
};
