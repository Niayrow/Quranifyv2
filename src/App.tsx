import React, { useEffect, useState, useMemo, lazy, Suspense, useDeferredValue, useCallback, useRef } from 'react';
import { useAudio, AudioProvider } from './context/AudioContext';
import { ReciterCard } from './components/ReciterCard';
import { Navbar } from './components/Navbar';
import { 
  Search, Heart, AlertTriangle, Crown, Headphones, Play, ArrowRight, BookOpenText,
  Bookmark, Download, GitCompare, Sparkles, Disc
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Reciter } from './types';
import { getGeneratedReciterAvatar, getReciterImage } from './utils/images';
import { getReciterCategory, type ReciterCategoryId } from './data/reciterCategories';
import { ReciterCategoryGrid, ReciterCategoryModal } from './components/ReciterCategoryModal';

const SurahList = lazy(() => import('./components/SurahList').then((module) => ({ default: module.SurahList })));
const EveryAyahReader = lazy(() => import('./components/EveryAyahReader').then((module) => ({ default: module.EveryAyahReader })));
const GlobalPlayerV2 = lazy(() => import('./components/GlobalPlayerV2').then((module) => ({ default: module.GlobalPlayerV2 })));
// Legacy player kept for reference: ./components/GlobalPlayer
const AboutPanel = lazy(() => import('./components/AboutPanel').then((module) => ({ default: module.AboutPanel })));
const ReciterCompare = lazy(() => import('./components/ReciterCompare').then((module) => ({ default: module.ReciterCompare })));
const TAB_IDS = ['home', 'listen', 'ayah', 'favorites', 'more'] as const;
type TabId = typeof TAB_IDS[number];
type MorePanel = 'priorities' | 'compare' | 'about';
type ListenStep = 'reciters' | 'surahs';

const PRODUCT_PRIORITIES: Array<{
  id: string;
  title: string;
  summary: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    id: 'offline',
    title: 'Mode hors-ligne audio',
    summary: 'Permettre le téléchargement ou le cache local des récitations pour écouter sans réseau.',
    detail: 'Priorité mobile la plus forte pour les trajets, le sommeil et les zones à faible connexion.',
    icon: Download,
  },
  {
    id: 'text',
    title: 'Texte du Coran et suivi par verset',
    summary: 'Ajouter la lecture ayah par ayah avec affichage du texte et suivi synchronisé.',
    detail: 'L’app deviendrait un vrai compagnon de lecture, révision et mémorisation.',
    icon: BookOpenText,
  },
  {
    id: 'library',
    title: 'Bibliothèque personnelle',
    summary: 'Étendre les favoris vers des signets de sourates, historique et reprise ciblée.',
    detail: 'Une couche personnelle améliore fortement la fidélisation et les reprises quotidiennes.',
    icon: Bookmark,
  },
];

const mapLegacyTab = (tab: string | null): TabId => {
  switch (tab) {
    case 'listen':
    case 'reciters':
    case 'surahs':
      return 'listen';
    case 'ayah':
    case 'everyayah':
      return 'ayah';
    case 'favorites':
      return 'favorites';
    case 'more':
    case 'compare':
    case 'about':
      return 'more';
    case 'home':
    default:
      return 'home';
  }
};

const getInitialTab = (): TabId => {
  if (typeof window === 'undefined') return 'home';
  const tab = new URLSearchParams(window.location.search).get('tab');
  return mapLegacyTab(tab);
};

const FEATURED_RECITER_IDS = [123, 54, 31, 30, 102, 5, 112, 118];
const FEATURED_RECITER_COPY: Record<number, { badge: string; note: string }> = {
  123: { badge: 'Top mondial', note: 'Voix moderne, claire et très écoutée' },
  54: { badge: 'Imam de La Mecque', note: 'Récitation iconique du Haram' },
  31: { badge: 'Grand classique', note: 'Voix puissante, très connue en prière' },
  30: { badge: 'Très demandé', note: 'Lecture douce, stable et facile à suivre' },
  102: { badge: 'Voix majeure', note: 'Ton posé, fluide et reconnaissable' },
  5: { badge: 'Style marquant', note: 'Récitation expressive et populaire' },
  112: { badge: 'Classique égyptien', note: 'Style profond et récitation historique' },
  118: { badge: 'Référence tajwid', note: 'École lente, précise et pédagogique' },
};

// Dictionary of phonetic synonyms & aliases for the most famous reciters
const RECITER_ALIASES: Record<number, string[]> = {
  123: ["alafasy", "al afasy", "al-afasy", "alafasi", "afasy", "afasi", "mishary", "mshary", "mishari", "rashid", "mishari rashid alafasy"],
  54: ["sudais", "soudais", "soudays", "sudays", "abdul rahman", "soudaiss", "sudaiss"],
  102: ["muaiqly", "al muaiqly", "al-muaiqly", "mueaqly", "maher", "mahir", "mouaiqly", "meaqli"],
  31: ["shuraim", "shurim", "shuraym", "cherim", "saoud", "saud al shuraim"],
  30: ["ghamidi", "ghmidi", "ghamdi", "saad", "saad el ghamidi"],
  5: ["ajami", "ajmy", "el ajami", "ahmed ajami"],
  118: ["husary", "hussary", "al hussary", "mahmoud khalil"],
  112: ["minshawi", "menshawi", "menshavi", "mohamed siddiq", "manchaoui"],
  106: ["tablawi", "tablawy", "mohamed tablawi", "mohamed el tablawi"],
  74: ["hudhaify", "hudaify", "houdayfi", "ali hudhaify"],
  86: ["qattami", "qatami", "nasser qattami", "naser al qattami"],
  92: ["doussari", "dosari", "yasser dossari", "yasser al doussari"],
  226: ["ghamdi", "khalid ghamdi", "khaled al ghamdi"],
  60: ["basfer", "abdellah basfer", "abdullah basfar"],
  44: ["hachem", "hashem", "salah"],
  94: ["yasser", "faylakawi", "fylakawi"],
  2: ["jebrine", "jebreen", "ibrahime jebrine"],
  3: ["hudhaify", "hudaify", "al hudhaify", "ali jaber"],
};

const SEARCH_STOP_WORDS = new Set(['al', 'el', 'a', 'an', 'bin', 'ben', 'ibn', 'abu']);

// Advanced string normalizer that handles French diacritics, hyphens, and whitespace
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .replace(/[^a-z0-9]/g, " ")     // Replace dashes and punctuation with spaces
    .replace(/\s+/g, " ")           // Collapse duplicate spaces
    .trim();
};

const compactString = (str: string) => str.replace(/\s/g, '');

const getSearchTokens = (value: string) => (
  normalizeString(value)
    .split(' ')
    .filter((token) => token && !SEARCH_STOP_WORDS.has(token))
);

const uniqueSearchCandidates = (reciter: Reciter) => {
  const normalizedCandidates = [
    reciter.name,
    ...(RECITER_ALIASES[reciter.id] || [])
  ].map(normalizeString).filter(Boolean);

  return Array.from(new Set(normalizedCandidates));
};

const isSubsequence = (needle: string, haystack: string) => {
  if (!needle) return true;
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
};

const levenshteinDistance = (source: string, target: string, maxDistance = 4) => {
  if (source === target) return 0;
  if (Math.abs(source.length - target.length) > maxDistance) return maxDistance + 1;

  let previous = Array.from({ length: target.length + 1 }, (_, index) => index);
  let current = new Array<number>(target.length + 1);

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];

    for (let j = 1; j <= target.length; j += 1) {
      const substitutionCost = source[i - 1] === target[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > maxDistance) return maxDistance + 1;
    [previous, current] = [current, previous];
  }

  return previous[target.length];
};

const getBigramScore = (query: string, target: string) => {
  if (query.length < 2 || target.length < 2) return 0;

  const targetBigrams = new Map<string, number>();
  for (let index = 0; index < target.length - 1; index += 1) {
    const bigram = target.slice(index, index + 2);
    targetBigrams.set(bigram, (targetBigrams.get(bigram) || 0) + 1);
  }

  let overlap = 0;
  for (let index = 0; index < query.length - 1; index += 1) {
    const bigram = query.slice(index, index + 2);
    const count = targetBigrams.get(bigram) || 0;
    if (count > 0) {
      overlap += 1;
      targetBigrams.set(bigram, count - 1);
    }
  }

  return (2 * overlap) / (query.length + target.length - 2);
};

const getTokenScore = (queryToken: string, targetToken: string) => {
  if (!queryToken || !targetToken) return 0;
  if (queryToken === targetToken) return 180;
  if (targetToken.startsWith(queryToken)) return 150;
  if (targetToken.includes(queryToken)) return 122;
  if (queryToken.length >= 3 && isSubsequence(queryToken, targetToken)) return 96;

  const maxDistance = queryToken.length <= 4 ? 1 : queryToken.length <= 7 ? 2 : 3;
  const distance = levenshteinDistance(queryToken, targetToken, maxDistance);
  if (distance <= maxDistance) {
    return Math.max(72, 128 - distance * 24);
  }

  const bigramScore = getBigramScore(queryToken, targetToken);
  if (bigramScore >= 0.58) return Math.round(70 + bigramScore * 35);

  return 0;
};

const getCandidateScore = (candidate: string, queryNormalized: string) => {
  const candidateCompact = compactString(candidate);
  const queryCompact = compactString(queryNormalized);

  if (!queryCompact) return 0;
  if (candidate === queryNormalized) return 1200;
  if (candidateCompact === queryCompact) return 1140;
  if (candidate.startsWith(queryNormalized)) return 1020;
  if (candidateCompact.startsWith(queryCompact)) return 990;
  if (candidate.includes(queryNormalized)) return 900;
  if (candidateCompact.includes(queryCompact)) return 860;

  const queryTokens = getSearchTokens(queryNormalized);
  const candidateTokens = getSearchTokens(candidate);
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0;

  const initials = candidateTokens.map((token) => token[0]).join('');
  if (queryCompact.length >= 2 && initials.startsWith(queryCompact)) return 760;
  if (queryCompact.length >= 3 && isSubsequence(queryCompact, candidateCompact)) return 280;

  const tokenScores = queryTokens.map((queryToken) => (
    Math.max(...candidateTokens.map((candidateToken) => getTokenScore(queryToken, candidateToken)))
  ));
  const matchedTokens = tokenScores.filter((score) => score >= 72).length;
  const allTokensMatched = matchedTokens === queryTokens.length;

  if (allTokensMatched) {
    const averageTokenScore = tokenScores.reduce((sum, score) => sum + score, 0) / tokenScores.length;
    return Math.round(430 + averageTokenScore * 1.55);
  }

  if (matchedTokens > 0 && queryTokens.length > 1) {
    const matchRatio = matchedTokens / queryTokens.length;
    return Math.round(230 + matchRatio * 160 + Math.max(...tokenScores) * 0.45);
  }

  if (queryCompact.length >= 4) {
    const maxDistance = queryCompact.length <= 6 ? 2 : 3;
    const distance = levenshteinDistance(queryCompact, candidateCompact, maxDistance);
    if (distance <= maxDistance) return 420 - distance * 45;

    const bigramScore = getBigramScore(queryCompact, candidateCompact);
    if (bigramScore >= 0.5) return Math.round(220 + bigramScore * 220);
  }

  return 0;
};

const getSearchThreshold = (queryNormalized: string) => {
  const queryLength = compactString(queryNormalized).length;
  if (queryLength <= 2) return 120;
  if (queryLength === 3) return 260;
  return 540;
};

// Predictive search: accents/case-insensitive, alias-aware, typo-tolerant and stable.
const getSearchScore = (reciter: Reciter, queryNormalized: string): number => {
  if (!queryNormalized) return 0;

  const bestCandidateScore = Math.max(
    ...uniqueSearchCandidates(reciter).map((candidate) => getCandidateScore(candidate, queryNormalized))
  );
  const famousBoost = FEATURED_RECITER_IDS.includes(reciter.id) ? 18 : 0;

  return bestCandidateScore >= getSearchThreshold(queryNormalized) ? bestCandidateScore + famousBoost : 0;
};

const RecitersLoadingSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 min-h-[320px]" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((item) => (
      <div key={item} className="shimmer-loader h-[88px] rounded-2xl border border-slate-900" />
    ))}
  </div>
);

const LoadingHome: React.FC<{ progress: number; reciterCount: number }> = ({ progress, reciterCount }) => {
  const countdown = Math.max(0, Math.ceil((100 - progress) / 20));
  const statusText = progress >= 96
    ? 'Préparation de l’interface'
    : reciterCount > 0
      ? 'Synchronisation du catalogue complet'
      : 'Chargement des récitateurs';

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(245,158,11,0.06),transparent_35%)] pointer-events-none" />
      <main className="relative w-full max-w-sm flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/icons/logo.png"
            alt="Quranify"
            className="w-32 h-32 object-contain drop-shadow-[0_0_24px_rgba(16,185,129,0.35)]"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-100 m-0">QURANIFY</h1>
            <p className="text-[11px] tracking-[0.22em] text-slate-400 font-bold uppercase mt-1">
              Lecteur Coranique Premium
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>{statusText}</span>
            <span className="text-emerald-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-300 to-amber-400 transition-[width] duration-500 ease-out shadow-[0_0_18px_rgba(16,185,129,0.45)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Récitants</p>
              <p className="text-lg font-black text-slate-100 mt-1">{reciterCount || '...'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Sourates</p>
              <p className="text-lg font-black text-slate-100 mt-1">114</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Départ</p>
              <p className="text-lg font-black text-slate-100 mt-1">{countdown}s</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Connexion à l’API coranique
        </div>
      </main>
    </div>
  );
};

interface ShortcutCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

const ShortcutCard: React.FC<ShortcutCardProps> = ({ title, description, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="group rounded-2xl border border-slate-800/80 bg-slate-900/55 p-4 text-left transition-all hover:border-emerald-500/35 hover:bg-slate-900/80 tap-feedback"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-black text-slate-100">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
        <Icon className="h-4.5 w-4.5" />
      </span>
    </div>
    <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-400">
      Ouvrir
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </span>
  </button>
);

interface ProductPriorityCardProps {
  title: string;
  summary: string;
  detail: string;
  icon: LucideIcon;
}

const ProductPriorityCard: React.FC<ProductPriorityCardProps> = ({ title, summary, detail, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/55 p-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-slate-100">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">{summary}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{detail}</p>
      </div>
    </div>
  </div>
);

interface FeaturedReciterCardProps {
  reciter: Reciter;
  isSelected: boolean;
  onSelect: () => void;
}

const FeaturedReciterCard: React.FC<FeaturedReciterCardProps> = ({ reciter, isSelected, onSelect }) => {
  const profile = FEATURED_RECITER_COPY[reciter.id] || {
    badge: 'Récitateur reconnu',
    note: 'Sélection recommandée pour commencer',
  };
  const imageUrl = getReciterImage(reciter);
  const fallbackImage = getGeneratedReciterAvatar(reciter);
  const moshaf = reciter.moshaf.find((item) => item.surah_list.split(',').length >= 100) || reciter.moshaf[0];
  const surahCount = moshaf?.surah_list.split(',').length || 0;

  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all tap-feedback ${
        isSelected
          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_12px_28px_rgba(16,185,129,0.16)]'
          : 'border-slate-800/70 bg-slate-900/55 hover:border-emerald-500/35 hover:bg-slate-900/85'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.14),transparent_38%)] opacity-70 pointer-events-none" />
      <div className="relative flex gap-4">
        <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-950 shadow-xl">
          <img
            src={imageUrl}
            alt={reciter.name}
            width="80"
            height="80"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== fallbackImage) {
                img.src = fallbackImage;
              }
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
              <Crown className="w-3 h-3" />
              {profile.badge}
            </span>
          </div>
          <h3 className="text-base font-black text-slate-100 leading-tight truncate">{reciter.name}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2">{profile.note}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <Headphones className="w-3.5 h-3.5" />
              {surahCount} sourates
            </span>
            <span className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const AppContent: React.FC = () => {
  const {
    reciters,
    isLoadingReciters,
    error,
    activeReciter,
    activeMoshaf,
    setActiveReciter,
    setActiveMoshaf,
    currentTrack
  } = useAudio();


  const [activeTab, setActiveTab] = useState<TabId>(() => getInitialTab());
  const [morePanel, setMorePanel] = useState<MorePanel>('priorities');
  const [listenStep, setListenStep] = useState<ListenStep>('reciters');
  const [categoryModalId, setCategoryModalId] = useState<ReciterCategoryId | null>(null);
  const [reciterSearch, setReciterSearch] = useState<string>('');
  const deferredReciterSearch = useDeferredValue(reciterSearch);
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [showLoadingHome, setShowLoadingHome] = useState(true);
  const surahSectionRef = useRef<HTMLElement | null>(null);
  const didRestoreListenStep = useRef(false);

  const applyDeepLink = useCallback((rawUrl: string) => {
    try {
      const url = new URL(rawUrl, window.location.origin);
      const tab = url.searchParams.get('tab');
      if (tab === 'compare') {
        setMorePanel('compare');
        setActiveTab('more');
        return;
      }
      if (tab === 'about') {
        setMorePanel('about');
        setActiveTab('more');
        return;
      }
      if (tab) {
        setActiveTab(mapLegacyTab(tab));
      }
      if (url.protocol === 'quranify:' || url.pathname.includes('/surah')) {
        setActiveTab('listen');
      }
    } catch {
      if (rawUrl.includes('tab=compare')) {
        setMorePanel('compare');
        setActiveTab('more');
      } else if (rawUrl.includes('tab=about')) {
        setMorePanel('about');
        setActiveTab('more');
      } else if (
        rawUrl.includes('tab=surahs') ||
        rawUrl.includes('tab=reciters') ||
        rawUrl.includes('tab=listen') ||
        rawUrl.includes('tab=ayah') ||
        rawUrl.includes('quranify://surah')
      ) {
        setActiveTab(rawUrl.includes('tab=ayah') ? 'ayah' : 'listen');
      }
    }
  }, []);

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const bindDeepLinks = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const launch = await App.getLaunchUrl();
        if (launch?.url) applyDeepLink(launch.url);

        const handle = await App.addListener('appUrlOpen', (event) => {
          applyDeepLink(event.url);
        });
        removeListener = () => { void handle.remove(); };
      } catch {
        // Web/PWA: URL query params only.
      }
    };

    void bindDeepLinks();
    return () => removeListener?.();
  }, [applyDeepLink]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    if (activeTab === 'more') {
      params.set('panel', morePanel);
    } else {
      params.delete('panel');
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [activeTab, morePanel]);

  useEffect(() => {
    if (!isLoadingReciters) {
      const completeTimer = window.setTimeout(() => setLoadingProgress(100), 0);
      const doneTimer = window.setTimeout(() => setShowLoadingHome(false), 550);
      return () => {
        window.clearTimeout(completeTimer);
        window.clearTimeout(doneTimer);
      };
    }

    const showTimer = window.setTimeout(() => setShowLoadingHome(true), 0);
    const progressTimer = window.setInterval(() => {
      setLoadingProgress((value) => {
        if (value >= 88) return value;
        const step = value < 45 ? 9 : value < 70 ? 5 : 2;
        return Math.min(88, value + step);
      });
    }, 280);

    return () => {
      window.clearTimeout(showTimer);
      window.clearInterval(progressTimer);
    };
  }, [isLoadingReciters]);

  // Favorites state persisted locally
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('quran_streamer_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id];
      try {
        localStorage.setItem('quran_streamer_favorites', JSON.stringify(updated));
      } catch {
        // The in-memory favorite still updates when storage is unavailable.
      }
      return updated;
    });
  };

  const featuredReciters = useMemo(() => {
    if (!reciters) return [];

    return FEATURED_RECITER_IDS
      .map(id => reciters.find(r => r.id === id))
      .filter((r): r is Reciter => !!r);
  }, [reciters]);

  // Client-side fuzzy search on reciters
  const filteredReciters = useMemo(() => {
    if (!reciters) return [];

    if (!deferredReciterSearch.trim()) return reciters;

    const queryNorm = normalizeString(deferredReciterSearch);
    const scored = reciters
      .map(r => ({
        reciter: r,
        score: getSearchScore(r, queryNorm)
      }))
      .filter(item => item.score > 0);

    scored.sort((a, b) => b.score - a.score || a.reciter.name.localeCompare(b.reciter.name));
    return scored.map(item => item.reciter);
  }, [reciters, deferredReciterSearch]);

  const isSearchPending = reciterSearch !== deferredReciterSearch;

  const favoritedReciters = useMemo(() => {
    if (!reciters) return [];
    return reciters.filter((r) => favorites.includes(r.id));
  }, [reciters, favorites]);

  const listenFavoritedReciters = useMemo(() => {
    if (deferredReciterSearch.trim()) return [];
    return favoritedReciters;
  }, [favoritedReciters, deferredReciterSearch]);

  const catalogReciters = useMemo(() => {
    if (deferredReciterSearch.trim()) return filteredReciters;
    const favoriteIds = new Set(favoritedReciters.map((r) => r.id));
    return filteredReciters.filter((r) => !favoriteIds.has(r.id));
  }, [filteredReciters, favoritedReciters, deferredReciterSearch]);

  const handleNavigate = (tab: TabId, panel?: MorePanel) => {
    setActiveTab(tab);
    if (panel) setMorePanel(panel);
    if (tab === 'listen') {
      setListenStep(activeReciter ? 'surahs' : 'reciters');
    }
  };

  const handleSelectReciter = (reciter: Reciter) => {
    setCategoryModalId(null);
    setActiveReciter(reciter);
    setActiveTab('listen');
    setListenStep('surahs');
    setReciterSearch('');
    window.setTimeout(() => {
      surahSectionRef.current?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  };

  const activeCategory = categoryModalId ? getReciterCategory(categoryModalId) : undefined;

  const handleChangeReciter = () => {
    setListenStep('reciters');
    setReciterSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isLoadingReciters) return;
    if (!activeReciter) {
      setListenStep('reciters');
      return;
    }
    if (!didRestoreListenStep.current) {
      didRestoreListenStep.current = true;
      setListenStep('surahs');
    }
  }, [activeReciter, isLoadingReciters]);

  const handleSetActiveTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'listen') {
      setListenStep(activeReciter ? 'surahs' : 'reciters');
    }
  };

  if (showLoadingHome) {
    return <LoadingHome progress={loadingProgress} reciterCount={reciters.length} />;
  }

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 max-w-lg mx-auto w-full mobile-shell-padding md:pt-28 md:pb-12 md:max-w-4xl md:px-8">
      {/* 1. App Header with Gold and Emerald Accents */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="sr-only">Quranify — Lecteur Coranique Premium</h1>
          <img
            src="/icons/logo.png"
            alt="Quranify"
            className="h-16 w-auto object-contain drop-shadow-[0_0_16px_rgba(16,185,129,0.35)]"
          />
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          API V3 En Ligne
        </div>
      </header>

      {/* 2. Main Tab Views */}
      <main className="flex-1 flex flex-col gap-5">
        <div key={activeTab} className="animate-page-enter flex flex-col gap-5">
        
        {activeTab === 'home' && (
          <div className="flex flex-col gap-5">
            <section className="glass-panel rounded-3xl border border-emerald-500/15 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_50%)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Démarrage rapide
                  </span>
                  <h2 className="mt-3 text-xl font-black text-slate-100">Accueil Quranify</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                    Reprenez votre lecture ou choisissez une voix connue — le catalogue complet est dans Écouter.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ShortcutCard
                  title={currentTrack ? 'Reprendre la lecture' : 'Commencer à écouter'}
                  description={currentTrack
                    ? `${currentTrack.surah.name} avec ${currentTrack.reciter.name}`
                    : activeReciter
                      ? `Retourner aux sourates de ${activeReciter.name}`
                      : 'Choisissez un récitateur puis une sourate.'}
                  icon={Play}
                  onClick={() => handleNavigate('listen')}
                />
                <ShortcutCard
                  title="Comparer deux récitateurs"
                  description="Basculez entre deux voix sur la même sourate depuis l'espace Plus."
                  icon={GitCompare}
                  onClick={() => handleNavigate('more', 'compare')}
                />
              </div>
            </section>

            {isLoadingReciters ? (
              <RecitersLoadingSkeleton />
            ) : featuredReciters.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      Grands récitateurs
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      1 clic pour ouvrir leurs sourates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('listen');
                      setListenStep('reciters');
                    }}
                    className="hidden min-[390px]:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1"
                  >
                    Tous les récitateurs
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {featuredReciters.map((reciter) => (
                    <FeaturedReciterCard
                      key={reciter.id}
                      reciter={reciter}
                      isSelected={activeReciter?.id === reciter.id}
                      onSelect={() => handleSelectReciter(reciter)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 2.1 Listening Hub — wizard: reciters then surahs */}
        {activeTab === 'listen' && (
          <div className="flex flex-col gap-5">
            {error && (
              <div className="glass-panel p-4 rounded-2xl border-red-500/20 bg-red-500/5 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">Connexion interrompue</h4>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
              </div>
            )}

            {listenStep === 'reciters' && (
              <div className="flex flex-col gap-5">
                <section className="flex flex-col gap-1">
                  <h2 className="text-lg font-black text-slate-100">Choisis un récitateur</h2>
                  <p className="text-xs text-slate-400">
                    Ensuite, choisis une sourate pour lancer l&apos;écoute.
                  </p>
                </section>

                {!isLoadingReciters && (
                  <ReciterCategoryGrid
                    reciters={reciters}
                    activeCategoryId={categoryModalId}
                    onOpenCategory={setCategoryModalId}
                  />
                )}

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder="Rechercher un récitateur..."
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-2xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none transition-all"
                  />
                  {reciterSearch && (
                    <button
                      type="button"
                      onClick={() => setReciterSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 rounded-md"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {reciterSearch.trim() && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/45 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200">
                        {isSearchPending ? 'Recherche...' : `${filteredReciters.length} résultat${filteredReciters.length > 1 ? 's' : ''}`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                        Accents, aliases et orthographes proches.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      Smart
                    </span>
                  </div>
                )}

                {isLoadingReciters ? (
                  <RecitersLoadingSkeleton />
                ) : filteredReciters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
                    <p className="text-slate-400">Aucun récitateur trouvé</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {listenFavoritedReciters.length > 0 && (
                      <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-400 fill-current" />
                          Favoris
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {listenFavoritedReciters.map((reciter) => (
                            <ReciterCard
                              key={reciter.id}
                              reciter={reciter}
                              isSelected={activeReciter?.id === reciter.id}
                              onSelect={() => handleSelectReciter(reciter)}
                              isFavorite={true}
                              onToggleFavorite={(e) => toggleFavorite(reciter.id, e)}
                              searchQuery={reciterSearch}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="flex flex-col gap-3">
                      {!deferredReciterSearch.trim() && (
                        <h3 className="text-sm font-bold text-slate-300">
                          {listenFavoritedReciters.length > 0 ? 'Tous les récitateurs' : 'Récitateurs'}
                        </h3>
                      )}
                      <div className="grid grid-cols-1 gap-3">
                        {catalogReciters.map((reciter) => (
                          <ReciterCard
                            key={reciter.id}
                            reciter={reciter}
                            isSelected={activeReciter?.id === reciter.id}
                            onSelect={() => handleSelectReciter(reciter)}
                            isFavorite={favorites.includes(reciter.id)}
                            onToggleFavorite={(e) => toggleFavorite(reciter.id, e)}
                            searchQuery={reciterSearch}
                          />
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            )}

            {listenStep === 'surahs' && !activeReciter && (
              <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-4">
                <p className="text-slate-400 text-sm">Choisissez un récitateur pour continuer.</p>
                <button
                  type="button"
                  onClick={handleChangeReciter}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs tap-feedback"
                >
                  Voir les récitateurs
                </button>
              </div>
            )}

            {listenStep === 'surahs' && activeReciter && (
              <div className="flex flex-col gap-5">
                <section
                  ref={surahSectionRef}
                  className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 bg-slate-950/90 backdrop-blur-md scroll-mt-6 md:top-24"
                >
                  <div className="glass-panel rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700/70 bg-slate-950 shrink-0">
                        <img
                          src={getReciterImage(activeReciter)}
                          alt={activeReciter.name}
                          width="48"
                          height="48"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget;
                            const fallback = getGeneratedReciterAvatar(activeReciter);
                            if (img.src !== fallback) img.src = fallback;
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                          Étape 2 · Sourates
                        </span>
                        <h2 className="font-semibold text-slate-100 truncate">{activeReciter.name}</h2>
                        {activeMoshaf && (
                          <p className="text-xs text-slate-400 truncate">{activeMoshaf.name}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleChangeReciter}
                        className="shrink-0 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] font-bold text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors tap-feedback"
                      >
                        Changer
                      </button>
                    </div>

                    {activeReciter.moshaf.length > 1 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Disc className="w-3 h-3 text-emerald-400" />
                          Riwaya
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeReciter.moshaf.map((m) => {
                            const isMoshafSelected = activeMoshaf?.id === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setActiveMoshaf(m)}
                                className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all tap-feedback ${
                                  isMoshafSelected
                                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div>
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Choisis une sourate</h3>
                  <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
                    <SurahList mode="listen" onChooseReciter={handleChangeReciter} />
                  </Suspense>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ayah' && (
          <div className="flex flex-col gap-5">
            <section className="glass-panel rounded-3xl border border-slate-800/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    <BookOpenText className="h-3.5 w-3.5" />
                    EveryAyah
                  </span>
                  <h2 className="mt-3 text-lg font-black text-slate-100">Lecture verset par verset</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Cette section est dédiée au texte, à la phonétique et à la lecture ayah par ayah avec timing exact.
                  </p>
                </div>
              </div>
            </section>

            <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
              <EveryAyahReader />
            </Suspense>
          </div>
        )}

        {/* 2.2 Tab Favorites View */}
        {activeTab === 'favorites' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              Vos Récitateurs Favoris
            </h2>

            {favoritedReciters.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-4">
                <Heart className="w-12 h-12 text-slate-700" />
                <div>
                  <h3 className="font-semibold text-slate-350">Favoris Vides</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Appuyez sur l'icône de cœur sur la carte d'un récitateur dans l'espace Écouter pour l'ajouter ici.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('listen')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-colors tap-feedback"
                >
                  Aller vers Écouter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {favoritedReciters.map((reciter) => (
                  <ReciterCard
                    key={reciter.id}
                    reciter={reciter}
                    isSelected={activeReciter?.id === reciter.id}
                    onSelect={() => handleSelectReciter(reciter)}
                    isFavorite={true}
                    onToggleFavorite={(e) => toggleFavorite(reciter.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2.3 Tab More View */}
        {activeTab === 'more' && (
          <div className="flex flex-col gap-5">
            <section className="glass-panel rounded-3xl border border-slate-800/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Plus
                  </span>
                  <h2 className="mt-3 text-lg font-black text-slate-100">Fonctions avancées et informations</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Les vues secondaires quittent la navbar principale mais restent accessibles ici avec plus de contexte.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMorePanel('priorities')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'priorities'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Priorités
                </button>
                <button
                  onClick={() => setMorePanel('compare')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'compare'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Comparer
                </button>
                <button
                  onClick={() => setMorePanel('about')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'about'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  À propos
                </button>
              </div>
            </section>

            {morePanel === 'priorities' && (
              <div className="grid grid-cols-1 gap-3">
                {PRODUCT_PRIORITIES.map((priority) => (
                  <ProductPriorityCard key={priority.id} {...priority} />
                ))}
              </div>
            )}

            {morePanel === 'compare' && (
              <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
                <ReciterCompare />
              </Suspense>
            )}

            {morePanel === 'about' && (
              <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
                <AboutPanel />
              </Suspense>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Category modal (listen step) */}
      {activeCategory && (
        <ReciterCategoryModal
          category={activeCategory}
          reciters={reciters}
          activeReciterId={activeReciter?.id}
          favorites={favorites}
          onClose={() => setCategoryModalId(null)}
          onSelect={handleSelectReciter}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* 3. Global Audio Player Sheet */}
      {currentTrack && activeTab !== 'ayah' && (
        <Suspense fallback={null}>
          <GlobalPlayerV2 />
        </Suspense>
      )}

      {/* 4. Floating Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
      />

    </div>
  );
};

function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}

export default App;
