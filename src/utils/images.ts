import type { Reciter } from '../types';

export const RECITER_IMAGES: Record<number, string> = {
  123: "https://upload.wikimedia.org/wikipedia/commons/e/e4/%D0%9C%D0%B8%D1%88%D0%B0%D1%80%D0%B8_%D0%A0%D0%B0%D1%88%D0%B8%D0%B4.jpg",
  54: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Abdul_Rahman_Al-Sudais_in_2012.jpg/400px-Abdul_Rahman_Al-Sudais_in_2012.jpg",
  102: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Maher_Al_Muaiqly.jpg/400px-Maher_Al_Muaiqly.jpg",
  118: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mahmoud_Khalil_Al-Hussary.jpg/400px-Mahmoud_Khalil_Al-Hussary.jpg",
  112: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mohamed_Siddiq_El-Minshawi.jpg/400px-Mohamed_Siddiq_El-Minshawi.jpg",
};

const AVATAR_PALETTES = [
  ['#0f766e', '#22c55e', '#f59e0b'],
  ['#155e75', '#06b6d4', '#fbbf24'],
  ['#1d4ed8', '#38bdf8', '#34d399'],
  ['#6d28d9', '#a78bfa', '#f59e0b'],
  ['#9f1239', '#fb7185', '#fbbf24'],
  ['#166534', '#4ade80', '#fde68a'],
  ['#7c2d12', '#fb923c', '#34d399'],
  ['#312e81', '#818cf8', '#22c55e'],
];

const hashString = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const getGeneratedReciterAvatar = (reciter: Reciter) => {
  const hash = hashString(`${reciter.id}-${reciter.name}`);
  const [deep, accent, gold] = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const offset = hash % 18;
  const waveShift = (hash % 7) - 3;
  const starShift = hash % 28;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${reciter.name}">
      <defs>
        <linearGradient id="bg" x1="18" y1="12" x2="142" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${accent}"/>
          <stop offset=".52" stop-color="${deep}"/>
          <stop offset="1" stop-color="#020617"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="24%" r="70%">
          <stop offset="0" stop-color="${gold}" stop-opacity=".48"/>
          <stop offset=".55" stop-color="${accent}" stop-opacity=".14"/>
          <stop offset="1" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#020617" flood-opacity=".45"/>
        </filter>
      </defs>
      <rect width="160" height="160" rx="34" fill="url(#bg)"/>
      <rect width="160" height="160" rx="34" fill="url(#glow)"/>
      <path d="M28 132 C42 102 43 75 80 38 C117 75 118 102 132 132 Z" fill="#020617" opacity=".45" filter="url(#softShadow)"/>
      <path d="M43 130 C52 102 56 80 80 55 C104 80 108 102 117 130 Z" fill="none" stroke="${gold}" stroke-opacity=".75" stroke-width="4"/>
      <path d="M61 126 C66 108 69 92 80 77 C91 92 94 108 99 126" fill="none" stroke="#ffffff" stroke-opacity=".72" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${44 + starShift * 0.3}" cy="${35 + offset * 0.2}" r="3" fill="${gold}" opacity=".9"/>
      <circle cx="${114 - starShift * 0.18}" cy="${45 + offset * 0.28}" r="2" fill="#ffffff" opacity=".55"/>
      <circle cx="${35 + offset * 0.5}" cy="96" r="2" fill="#ffffff" opacity=".42"/>
      <g transform="translate(${waveShift} 0)" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round">
        <path d="M61 88 C56 81 56 73 61 66" opacity=".95"/>
        <path d="M99 88 C104 81 104 73 99 66" opacity=".95"/>
        <path d="M71 92 C65 81 65 69 71 58" opacity=".7"/>
        <path d="M89 92 C95 81 95 69 89 58" opacity=".7"/>
      </g>
      <circle cx="80" cy="78" r="7" fill="${gold}"/>
      <path d="M32 138 H128" stroke="#ffffff" stroke-opacity=".16" stroke-width="2"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getReciterImage = (reciter: Reciter) => (
  RECITER_IMAGES[reciter.id] || getGeneratedReciterAvatar(reciter)
);
