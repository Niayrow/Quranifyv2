import { useEffect, useState, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Heart as HeartStatic,
  House as HouseStatic,
  Headphones as HeadphonesStatic,
  Play as PlayStatic,
  Settings as SettingsStatic,
} from '../icons/motion';

export type NavTabIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  trigger?: 'hover' | 'click' | 'mount' | 'in-view' | 'parent-hover' | 'manual';
  mode?: 'draw' | 'signature';
  duration?: number;
}>;

type NavMotionModule = typeof import('../icons/navMotion');

const STATIC_ICONS = {
  home: HouseStatic as NavTabIcon,
  listen: HeadphonesStatic as NavTabIcon,
  moments: PlayStatic as NavTabIcon,
  favorites: HeartStatic as NavTabIcon,
  more: SettingsStatic as NavTabIcon,
} as const;

/**
 * Serves static Lucide icons immediately, then upgrades to
 * lucide-react-motion after idle so LCP stays light.
 */
export function useNavMotionIcons() {
  const [mod, setMod] = useState<NavMotionModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const load = () => {
      void import('../icons/navMotion').then((loaded) => {
        if (!cancelled) setMod(loaded);
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(load, { timeout: 2200 });
    } else {
      timeoutId = setTimeout(load, 900);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  const ready = Boolean(mod);

  return {
    ready,
    MotionIconConfig: mod?.MotionIconConfig ?? null,
    icons: {
      home: (mod?.House as NavTabIcon | undefined) ?? STATIC_ICONS.home,
      listen: (mod?.Headphones as NavTabIcon | undefined) ?? STATIC_ICONS.listen,
      moments: (mod?.Play as NavTabIcon | undefined) ?? STATIC_ICONS.moments,
      favorites: (mod?.Heart as NavTabIcon | undefined) ?? STATIC_ICONS.favorites,
      more: (mod?.Settings as NavTabIcon | undefined) ?? STATIC_ICONS.more,
    },
  };
}

export type { LucideIcon };
