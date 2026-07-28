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
  ['#07111d', '#162538', '#f0d1bc', '#7990a1'],
  ['#0d1725', '#1b2d43', '#cea687', '#8fa3b0'],
  ['#111d2d', '#22364f', '#ddbca3', '#b8c7d2'],
  ['#09131f', '#203249', '#f1d4c1', '#95a7ba'],
  ['#0b1622', '#16293e', '#d7b299', '#7f97ab'],
  ['#07111d', '#1a2b3f', '#e6c8b3', '#aab7c5'],
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
  const [night, panel, warm, mist] = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const arcOffset = hash % 24;
  const beamShift = hash % 18;
  const sparkX = 30 + (hash % 52);
  const sparkY = 26 + (hash % 18);
  const lineOffset = hash % 14;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${reciter.name}">
      <defs>
        <linearGradient id="bg" x1="18" y1="12" x2="142" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${panel}"/>
          <stop offset=".52" stop-color="${night}"/>
          <stop offset="1" stop-color="#050b14"/>
        </linearGradient>
        <radialGradient id="topGlow" cx="50%" cy="18%" r="78%">
          <stop offset="0" stop-color="${warm}" stop-opacity=".34"/>
          <stop offset=".46" stop-color="${mist}" stop-opacity=".12"/>
          <stop offset="1" stop-color="#050b14" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="beam" x1="48" y1="26" x2="126" y2="138" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${warm}" stop-opacity=".95"/>
          <stop offset=".58" stop-color="${mist}" stop-opacity=".42"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity=".08"/>
        </linearGradient>
        <linearGradient id="beamSoft" x1="60" y1="22" x2="120" y2="132" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".65"/>
          <stop offset=".65" stop-color="${mist}" stop-opacity=".1"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#020617" flood-opacity=".52"/>
        </filter>
      </defs>
      <rect width="160" height="160" rx="34" fill="url(#bg)"/>
      <rect width="160" height="160" rx="34" fill="url(#topGlow)"/>
      <circle cx="112" cy="38" r="44" fill="${warm}" opacity=".08"/>
      <path d="M22 122 C46 ${118 + lineOffset} 63 ${104 + lineOffset} 80 86 C96 ${104 + lineOffset} 114 118 138 122" fill="none" stroke="${mist}" stroke-opacity=".18" stroke-width="2"/>
      <path d="M36 130 C49 102 58 80 80 58 C102 80 111 102 124 130 Z" fill="#050b14" opacity=".44" filter="url(#softShadow)"/>
      <path d="M52 ${124 + arcOffset * 0.08} C62 94 74 71 95 49 C109 63 118 80 128 112" fill="none" stroke="url(#beam)" stroke-width="5" stroke-linecap="round" opacity=".92"/>
      <path d="M62 ${123 + beamShift * 0.06} C70 96 80 77 95 58" fill="none" stroke="url(#beamSoft)" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M47 136 H113" stroke="${mist}" stroke-opacity=".18" stroke-width="2"/>
      <g transform="translate(${sparkX} ${sparkY})">
        <path d="M0 -5.5 L1.6 -1.6 L5.5 0 L1.6 1.6 L0 5.5 L-1.6 1.6 L-5.5 0 L-1.6 -1.6 Z" fill="${warm}" opacity=".92"/>
      </g>
      <circle cx="${118 - beamShift * 0.4}" cy="${34 + lineOffset * 0.32}" r="1.8" fill="#ffffff" opacity=".46"/>
      <circle cx="${42 + lineOffset * 0.45}" cy="101" r="1.5" fill="#ffffff" opacity=".24"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getReciterImage = (reciter: Reciter) => (
  RECITER_IMAGES[reciter.id] || getGeneratedReciterAvatar(reciter)
);
