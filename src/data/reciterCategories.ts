import type { LucideIcon } from 'lucide-react';
import { Landmark, MoonStar, Building2, Sparkles } from 'lucide-react';

export type ReciterCategoryId = 'makkah' | 'madinah' | 'riyadh' | 'quranify';

export interface ReciterCategory {
  id: ReciterCategoryId;
  title: string;
  subtitle: string;
  arabicLabel: string;
  image: string;
  icon: LucideIcon;
  /** Accent classes for buttons / modal chrome */
  accent: {
    border: string;
    bg: string;
    glow: string;
    text: string;
    badge: string;
    iconBg: string;
  };
  reciterIds: number[];
}

/**
 * Curated city / editorial groupings (mp3quran IDs).
 * Only IDs present in the loaded catalogue are shown in the UI.
 */
export const RECITER_CATEGORIES: ReciterCategory[] = [
  {
    id: 'makkah',
    title: 'La Mecque',
    subtitle: 'Imams du Haram',
    arabicLabel: 'مكة',
    image: '/img/mecca.jpg',
    icon: Landmark,
    accent: {
      border: 'border-amber-400/35',
      bg: 'bg-gradient-to-br from-amber-500/15 via-slate-900/80 to-slate-950',
      glow: 'shadow-[0_12px_40px_rgba(245,158,11,0.18)]',
      text: 'text-amber-300',
      badge: 'bg-amber-400/10 border-amber-400/25 text-amber-300',
      iconBg: 'bg-amber-400/15 text-amber-300',
    },
    reciterIds: [
      54,  // Abderrahmane Al-Soudais
      31,  // Saoud Al-Shuraim
      102, // Maher Al-Mouaiqly
      92,  // Yasser Al-Dossary
      217, // Bandar Balilah
      62,  // Abdullah Al-Johani
      160, // Adel Al-Khalbani
    ],
  },
  {
    id: 'madinah',
    title: 'Médine',
    subtitle: 'Imams du Nabawi',
    arabicLabel: 'المدينة',
    image: '/img/medine.jpg',
    icon: MoonStar,
    accent: {
      border: 'border-emerald-400/35',
      bg: 'bg-gradient-to-br from-emerald-500/15 via-slate-900/80 to-slate-950',
      glow: 'shadow-[0_12px_40px_rgba(122, 145, 159,0.18)]',
      text: 'text-emerald-300',
      badge: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300',
      iconBg: 'bg-emerald-400/15 text-emerald-300',
    },
    reciterIds: [
      74,  // Ali Al-Houdhayfi
      43,  // Salah Al-Boudeir
      67,  // Abdelmohsen Al-Qasim
      49,  // Abdel Bari Al-Toubaïty
      109, // Mohamed Ayyoub
      1,   // Ibrahim Al-Akhdar
      71,  // Abdelwadoud Hanif
    ],
  },
  {
    id: 'riyadh',
    title: 'Riyad',
    subtitle: 'Voix de la capitale',
    arabicLabel: 'الرياض',
    image: '/img/riyad.jpg',
    icon: Building2,
    accent: {
      border: 'border-sky-400/35',
      bg: 'bg-gradient-to-br from-sky-500/15 via-slate-900/80 to-slate-950',
      glow: 'shadow-[0_12px_40px_rgba(56,189,248,0.16)]',
      text: 'text-sky-300',
      badge: 'bg-sky-400/10 border-sky-400/25 text-sky-300',
      iconBg: 'bg-sky-400/15 text-sky-300',
    },
    reciterIds: [
      86,  // Nasser Al-Qatami
      20,  // Khaled Al-Jalil
      30,  // Saad El-Ghamidi
      226, // Khalid Al-Ghamdi
      5,   // Ahmed El-Ajami
      21,  // Khaled Al-Qahtani
      4,   // Abou Bakr Al-Chatri
    ],
  },
  {
    id: 'quranify',
    title: 'Choix Quranify',
    subtitle: 'Sélection éditoriale',
    arabicLabel: 'مختار',
    image: '/img/choix.jpg',
    icon: Sparkles,
    accent: {
      border: 'border-rose-400/30',
      bg: 'bg-gradient-to-br from-rose-500/12 via-slate-900/80 to-slate-950',
      glow: 'shadow-[0_12px_40px_rgba(251,113,133,0.14)]',
      text: 'text-rose-300',
      badge: 'bg-rose-400/10 border-rose-400/25 text-rose-300',
      iconBg: 'bg-rose-400/15 text-rose-300',
    },
    reciterIds: [
      86,  // Nasser Al-Qatami
      31,  // Saoud Al-Shuraim
      107, // Mohamed El-Louhaïdan
      245, // Mansour Al-Salemi
      12,  // Idrees Abkar
      254, // Badr Al-Turki
      20,  // Khaled Al-Jalil
      221, // Raad Al-Kurdi
      92,  // Yasser Al-Dossary
      272, // Okasha Kameny
    ],
  },
];

export const getReciterCategory = (id: ReciterCategoryId) =>
  RECITER_CATEGORIES.find((category) => category.id === id);
