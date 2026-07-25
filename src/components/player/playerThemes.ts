export type PlayerThemeId = 'emerald' | 'amber' | 'blue' | 'purple' | 'oled';

export interface PlayerThemeTokens {
  name: string;
  accent: string;
  accentText: string;
  accentTextHover: string;
  accentBgLight: string;
  accentBorder: string;
  accentBorderActive: string;
  accentBorderLight: string;
  accentRing: string;
  accentShadow: string;
  accentGlow: string;
  glowDisc: string;
  sliderAccentColor: string;
  sliderBackground: (percent: number) => string;
}

export const PLAYER_THEMES: Record<PlayerThemeId, PlayerThemeTokens> = {
  emerald: {
    name: 'Acier Marine',
    accent: 'bg-emerald-500 hover:bg-emerald-400',
    accentText: 'text-emerald-400',
    accentTextHover: 'hover:text-emerald-400',
    accentBgLight: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
    accentBorderActive: 'border-emerald-500/40',
    accentBorderLight: 'border-emerald-500/10',
    accentRing: 'ring-emerald-500/20',
    accentShadow: 'shadow-emerald-500/20',
    accentGlow: 'from-emerald-500/5',
    glowDisc: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(122,145,159,0.35)]',
    sliderAccentColor: '#7a919f',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #7a919f 0%, #7a919f ${percent}%, #1e293b ${percent}%, #1e293b 100%)`,
  },
  amber: {
    name: 'Or Sacré',
    accent: 'bg-amber-500 hover:bg-amber-400',
    accentText: 'text-amber-400',
    accentTextHover: 'hover:text-amber-400',
    accentBgLight: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
    accentBorderActive: 'border-amber-500/40',
    accentBorderLight: 'border-amber-500/10',
    accentRing: 'ring-amber-500/20',
    accentShadow: 'shadow-amber-500/20',
    accentGlow: 'from-amber-500/5',
    glowDisc: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    sliderAccentColor: '#f59e0b',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #f59e0b 0%, #f59e0b ${percent}%, #1e293b ${percent}%, #1e293b 100%)`,
  },
  blue: {
    name: 'Sérénité Céleste',
    accent: 'bg-sky-500 hover:bg-sky-400',
    accentText: 'text-sky-400',
    accentTextHover: 'hover:text-sky-400',
    accentBgLight: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/20',
    accentBorderActive: 'border-sky-500/40',
    accentBorderLight: 'border-sky-500/10',
    accentRing: 'ring-sky-500/20',
    accentShadow: 'shadow-sky-500/20',
    accentGlow: 'from-sky-500/5',
    glowDisc: 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]',
    sliderAccentColor: '#0ea5e9',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${percent}%, #1e293b ${percent}%, #1e293b 100%)`,
  },
  purple: {
    name: 'Améthyste Royale',
    accent: 'bg-violet-500 hover:bg-violet-400',
    accentText: 'text-violet-400',
    accentTextHover: 'hover:text-violet-400',
    accentBgLight: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/20',
    accentBorderActive: 'border-violet-500/40',
    accentBorderLight: 'border-violet-500/10',
    accentRing: 'ring-violet-500/20',
    accentShadow: 'shadow-violet-500/20',
    accentGlow: 'from-violet-500/5',
    glowDisc: 'text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]',
    sliderAccentColor: '#8b5cf6',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percent}%, #1e293b ${percent}%, #1e293b 100%)`,
  },
  oled: {
    name: 'Nuit Infinie (OLED)',
    accent: 'bg-slate-100 hover:bg-white',
    accentText: 'text-slate-200',
    accentTextHover: 'hover:text-white',
    accentBgLight: 'bg-slate-900/50',
    accentBorder: 'border-slate-800',
    accentBorderActive: 'border-slate-700',
    accentBorderLight: 'border-slate-800/60',
    accentRing: 'ring-slate-800',
    accentShadow: 'shadow-slate-900/40',
    accentGlow: 'from-slate-900/5',
    glowDisc: 'text-slate-200 drop-shadow-[0_0_8px_rgba(241,245,249,0.4)]',
    sliderAccentColor: '#f1f5f9',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #f1f5f9 0%, #f1f5f9 ${percent}%, #111827 ${percent}%, #111827 100%)`,
  },
};

export const PLAYER_THEME_IDS = Object.keys(PLAYER_THEMES) as PlayerThemeId[];
