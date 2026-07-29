export type NavDesktopStyle = 'dock' | 'classic';

const STORAGE_KEY = 'quran_streamer_nav_desktop_style';
export const DEFAULT_NAV_DESKTOP_STYLE: NavDesktopStyle = 'dock';

export function loadNavDesktopStyle(): NavDesktopStyle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'dock' || raw === 'classic') return raw;
  } catch {
    // ignore private mode
  }
  return DEFAULT_NAV_DESKTOP_STYLE;
}

export function saveNavDesktopStyle(style: NavDesktopStyle) {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // ignore quota / private mode
  }
}
