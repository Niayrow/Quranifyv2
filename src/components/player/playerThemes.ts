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
    accent: 'bg-[#7990a1] hover:bg-[#8fa3b0]',
    accentText: 'text-[#b8c7d2]',
    accentTextHover: 'hover:text-[#d7e4ef]',
    accentBgLight: 'bg-[#7990a1]/12',
    accentBorder: 'border-[#7990a1]/18',
    accentBorderActive: 'border-[#7990a1]/36',
    accentBorderLight: 'border-[#7990a1]/10',
    accentRing: 'ring-[#7990a1]/24',
    accentShadow: 'shadow-[#7990a1]/20',
    accentGlow: 'from-[#7990a1]/12',
    glowDisc: 'text-[#b8c7d2] drop-shadow-[0_0_8px_rgba(121,144,161,0.35)]',
    sliderAccentColor: '#7990a1',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #7990a1 0%, #7990a1 ${percent}%, #162538 ${percent}%, #162538 100%)`,
  },
  amber: {
    name: 'Cuivre Doux',
    accent: 'bg-[#cea687] hover:bg-[#ddbca3]',
    accentText: 'text-[#f0d1bc]',
    accentTextHover: 'hover:text-[#f1d4c1]',
    accentBgLight: 'bg-[#f0d1bc]/12',
    accentBorder: 'border-[#cea687]/18',
    accentBorderActive: 'border-[#cea687]/38',
    accentBorderLight: 'border-[#cea687]/12',
    accentRing: 'ring-[#cea687]/24',
    accentShadow: 'shadow-[#b98d6e]/20',
    accentGlow: 'from-[#cea687]/12',
    glowDisc: 'text-[#f0d1bc] drop-shadow-[0_0_8px_rgba(206,166,135,0.45)]',
    sliderAccentColor: '#cea687',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #cea687 0%, #cea687 ${percent}%, #162538 ${percent}%, #162538 100%)`,
  },
  blue: {
    name: 'Brume Azurée',
    accent: 'bg-[#8fa3b0] hover:bg-[#b8c7d2]',
    accentText: 'text-[#d7e4ef]',
    accentTextHover: 'hover:text-[#eef3f8]',
    accentBgLight: 'bg-[#8fa3b0]/12',
    accentBorder: 'border-[#8fa3b0]/20',
    accentBorderActive: 'border-[#8fa3b0]/40',
    accentBorderLight: 'border-[#8fa3b0]/12',
    accentRing: 'ring-[#8fa3b0]/24',
    accentShadow: 'shadow-[#8fa3b0]/18',
    accentGlow: 'from-[#8fa3b0]/12',
    glowDisc: 'text-[#d7e4ef] drop-shadow-[0_0_8px_rgba(143,163,176,0.45)]',
    sliderAccentColor: '#8fa3b0',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #8fa3b0 0%, #8fa3b0 ${percent}%, #162538 ${percent}%, #162538 100%)`,
  },
  purple: {
    name: 'Sable Rosé',
    accent: 'bg-[#ddbca3] hover:bg-[#f0d1bc]',
    accentText: 'text-[#f1d4c1]',
    accentTextHover: 'hover:text-[#f6e0d3]',
    accentBgLight: 'bg-[#ddbca3]/12',
    accentBorder: 'border-[#ddbca3]/18',
    accentBorderActive: 'border-[#ddbca3]/36',
    accentBorderLight: 'border-[#ddbca3]/12',
    accentRing: 'ring-[#ddbca3]/22',
    accentShadow: 'shadow-[#ddbca3]/18',
    accentGlow: 'from-[#ddbca3]/10',
    glowDisc: 'text-[#f1d4c1] drop-shadow-[0_0_8px_rgba(221,188,163,0.4)]',
    sliderAccentColor: '#ddbca3',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #ddbca3 0%, #ddbca3 ${percent}%, #162538 ${percent}%, #162538 100%)`,
  },
  oled: {
    name: 'Nuit Infinie (OLED)',
    accent: 'bg-[#f6f8fb] hover:bg-white',
    accentText: 'text-[#eef3f8]',
    accentTextHover: 'hover:text-white',
    accentBgLight: 'bg-[#111d2d]/55',
    accentBorder: 'border-[#30455c]',
    accentBorderActive: 'border-[#46607b]',
    accentBorderLight: 'border-[#30455c]/60',
    accentRing: 'ring-[#30455c]',
    accentShadow: 'shadow-black/40',
    accentGlow: 'from-[#111d2d]/16',
    glowDisc: 'text-[#eef3f8] drop-shadow-[0_0_8px_rgba(241,245,249,0.35)]',
    sliderAccentColor: '#f6f8fb',
    sliderBackground: (percent) =>
      `linear-gradient(to right, #f6f8fb 0%, #f6f8fb ${percent}%, #07111d ${percent}%, #07111d 100%)`,
  },
};

export const PLAYER_THEME_IDS = Object.keys(PLAYER_THEMES) as PlayerThemeId[];
