import { useEffect, useRef, useState, useCallback } from 'react';

const DESKTOP_MIN = 768;
const MERGE_SCROLL_RANGE = 140;

/**
 * Desktop-only fusion progress (0→1).
 * Uses a sentinel placed just above the sticky header:
 * once the sentinel leaves the viewport under the navbar, further scroll
 * drives the merge into the navbar capsule.
 */
export function useReciterNavFusion(enabled: boolean) {
  const [progress, setProgress] = useState(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const stuckRef = useRef(false);
  const stickScrollY = useRef(0);
  const rafId = useRef<number | null>(null);

  const setHeaderRef = useCallback((node: HTMLElement | null) => {
    headerRef.current = node;
  }, []);

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stuckRef.current = false;
      stickScrollY.current = 0;
      setProgress(0);
      return;
    }

    const compute = () => {
      rafId.current = null;

      if (window.innerWidth < DESKTOP_MIN) {
        stuckRef.current = false;
        setProgress((prev) => (prev === 0 ? prev : 0));
        return;
      }

      const sentinel = sentinelRef.current;
      const header = headerRef.current;
      if (!sentinel || !header) return;

      const stickyTop = parseFloat(getComputedStyle(header).top) || 96;
      const sentinelBottom = sentinel.getBoundingClientRect().bottom;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const isStuck = sentinelBottom <= stickyTop + 1;

      if (!isStuck) {
        stuckRef.current = false;
        setProgress((prev) => (prev === 0 ? prev : 0));
        return;
      }

      if (!stuckRef.current) {
        stuckRef.current = true;
        stickScrollY.current = scrollY;
      }

      const delta = Math.max(0, scrollY - stickScrollY.current);
      const next = Math.min(1, delta / MERGE_SCROLL_RANGE);
      setProgress((prev) => (Math.abs(prev - next) < 0.008 ? prev : next));
    };

    const schedule = () => {
      if (rafId.current != null) return;
      rafId.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (rafId.current != null) window.cancelAnimationFrame(rafId.current);
    };
  }, [enabled]);

  return { progress, setHeaderRef, setSentinelRef };
}
