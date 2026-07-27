import type { Reciter } from '../types';

/**
 * Real portraits for featured + category reciters (mp3quran IDs).
 * External URLs: Quran.com CDN when available, otherwise Wikimedia Commons.
 * Everyone else falls back to getGeneratedReciterAvatar.
 */
export const RECITER_IMAGES: Record<number, string> = {
  // Featured / Quran.com CDN portraits
  123: 'https://static.qurancdn.com/images/reciters/6/mishary-rashid-alafasy-profile.jpeg', // Mishary Rachid Al-Afasy
  54: 'https://static.qurancdn.com/images/reciters/2/abdul-rahman-al-sudais-profile.jpeg', // Abderrahmane Al-Soudais
  31: 'https://static.qurancdn.com/images/reciters/8/saoud-shuraim-profile.jpeg', // Saoud Al-Shuraim
  4: 'https://static.qurancdn.com/images/reciters/3/abu-bakr-al-shatri-pofile.jpeg', // Abou Bakr Al-Chatri
  118: 'https://static.qurancdn.com/images/reciters/5/mahmoud-khalil-al-hussary-profile.png', // Mahmoud Khalil Al-Housary
  112: 'https://static.qurancdn.com/images/reciters/7/mohamed-siddiq-el-minshawi-profile.jpeg', // Mohamed Siddiq El-Menchaoui

  // Wikimedia Commons
  102: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Maher_Al_Mueaqly.jpg', // Maher Al-Mouaiqly
  30: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Saad_al_Ghamdi.jpg', // Saad El-Ghamidi
  5: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Ahmad_bin_Ali_Al-Ajmi.png', // Ahmed El-Ajami
  92: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Yasser_Al-Dosari_%28cropped%29.jpg', // Yasser Al-Dossary
  86: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/%D8%B5%D9%88%D8%B1%D8%A9_%D8%B4%D8%AE%D8%B5%D9%8A%D8%A9_%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D9%86%D8%A7%D8%B5%D8%B1_%D8%A7%D9%84%D9%82%D8%B7%D8%A7%D9%85%D9%8A.jpg', // Nasser Al-Qatami
  217: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Bandar_Baleela.jpg', // Bandar Balilah
  62: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Abdullah_Al_Juhany_%28Cropped%29.png', // Abdullah Al-Johani
  160: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Kalbani.jpg', // Adel Al-Khalbani
  74: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Huthaify.jpg', // Ali Al-Houdhayfi
  43: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Salah_Ibn_Mohammed_Al_Budair.jpg', // Salah Al-Boudeir
  49: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Abdulbari_ath-Thubaity_delivering_sermon_at_Prophet%27s_Mosque_Medina.jpg", // Abdel Bari Al-Toubaïty
  67: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Abdul_Mohsin_Al-Qasim.jpg', // Abdelmohsen Al-Qasim
  221: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Raad_Mohammad_Al_Kurdi.png', // Raad Al-Kurdi
  245: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Mansurahsalme.jpg', // Mansour Al-Salemi
};

const AVATAR_PALETTES = [
  ['#0f766e', '#22c55e', '#f59e0b'],
  ['#155e75', '#06b6d4', '#fbbf24'],
  ['#1d4ed8', '#38bdf8', '#8fa3b0'],
  ['#6d28d9', '#a78bfa', '#f59e0b'],
  ['#9f1239', '#fb7185', '#fbbf24'],
  ['#166534', '#4ade80', '#fde68a'],
  ['#7c2d12', '#fb923c', '#8fa3b0'],
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
