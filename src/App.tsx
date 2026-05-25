import React, { useEffect, useState, useMemo, lazy, Suspense, useDeferredValue } from 'react';
import { useAudio, AudioProvider } from './context/AudioContext';
import { ReciterCard } from './components/ReciterCard';
import { BottomNavbar } from './components/BottomNavbar';
import { 
  Search, Heart, Radio, AlertTriangle, Crown, Headphones, Play
} from 'lucide-react';
import type { Reciter } from './types';
import { getGeneratedReciterAvatar, getReciterImage } from './utils/images';

const SurahList = lazy(() => import('./components/SurahList').then((module) => ({ default: module.SurahList })));
const GlobalPlayer = lazy(() => import('./components/GlobalPlayer').then((module) => ({ default: module.GlobalPlayer })));
const AboutPanel = lazy(() => import('./components/AboutPanel').then((module) => ({ default: module.AboutPanel })));
const RECITER_BATCH_SIZE = 14;
const TAB_IDS = ['reciters', 'surahs', 'favorites', 'about'] as const;
type TabId = typeof TAB_IDS[number];

const getInitialTab = (): TabId => {
  if (typeof window === 'undefined') return 'reciters';
  const tab = new URLSearchParams(window.location.search).get('tab');
  return TAB_IDS.includes(tab as TabId) ? tab as TabId : 'reciters';
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
  <div className="flex flex-col gap-6 min-h-[520px]" aria-hidden="true">
    {[0, 1].map((section) => (
      <div key={section} className="flex flex-col gap-3">
        <div className="h-4 w-44 rounded-full bg-slate-800/70" />
        <div className="h-2.5 w-64 max-w-[70%] rounded-full bg-slate-900/90" />
        <div className="flex gap-4 overflow-hidden pb-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="w-20 shrink-0">
              <div className="shimmer-loader h-16 w-16 rounded-2xl border border-slate-900" />
              <div className="mt-2 h-2.5 w-16 rounded-full bg-slate-900/80" />
            </div>
          ))}
        </div>
      </div>
    ))}
    <div className="flex flex-col gap-3">
      <div className="h-2.5 w-36 rounded-full bg-slate-800/70" />
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className="h-8 w-10 shrink-0 rounded-lg bg-slate-900/80 border border-slate-800/70" />
        ))}
      </div>
    </div>
    <div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />
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
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Radio className="w-9 h-9 text-slate-950" />
          </div>
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
    setActiveReciter,
    currentTrack
  } = useAudio();


  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab());
  const [reciterSearch, setReciterSearch] = useState<string>('');
  const deferredReciterSearch = useDeferredValue(reciterSearch);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [reciterPaging, setReciterPaging] = useState({ key: '', limit: RECITER_BATCH_SIZE });
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [showLoadingHome, setShowLoadingHome] = useState(true);

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
    e.stopPropagation(); // Avoid selecting the card when favoriting
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

  // Extract available letters dynamically from loaded reciters
  const availableLetters = useMemo(() => {
    if (!reciters) return [];
    const letters = reciters.map(r => r.letter.toUpperCase().trim()).filter(Boolean);
    return Array.from(new Set(letters)).sort();
  }, [reciters]);

  const featuredReciters = useMemo(() => {
    if (!reciters) return [];

    return FEATURED_RECITER_IDS
      .map(id => reciters.find(r => r.id === id))
      .filter((r): r is Reciter => !!r);
  }, [reciters]);

  // Client-side fuzzy search and letter filter on reciters
  const filteredReciters = useMemo(() => {
    if (!reciters) return [];
    
    let result = reciters;

    // Apply alphabetical filter
    if (selectedLetter) {
      result = result.filter(
        (r) =>
          r.letter.toUpperCase() === selectedLetter.toUpperCase() ||
          r.name.toUpperCase().startsWith(selectedLetter.toUpperCase())
      );
    }

    // Apply search query with smart ranking
    if (deferredReciterSearch.trim()) {
      const queryNorm = normalizeString(deferredReciterSearch);
      
      // Calculate search scores for all items
      const scored = result
        .map(r => ({
          reciter: r,
          score: getSearchScore(r, queryNorm)
        }))
        .filter(item => item.score > 0); // Keep only matching items
        
      // Sort by score in descending order
      scored.sort((a, b) => b.score - a.score || a.reciter.name.localeCompare(b.reciter.name));
      
      return scored.map(item => item.reciter);
    }

    return result;
  }, [reciters, deferredReciterSearch, selectedLetter]);

  const reciterFilterKey = `${deferredReciterSearch.trim()}|${selectedLetter}`;
  const visibleReciterLimit = reciterPaging.key === reciterFilterKey
    ? reciterPaging.limit
    : RECITER_BATCH_SIZE;

  const visibleReciters = useMemo(
    () => filteredReciters.slice(0, visibleReciterLimit),
    [filteredReciters, visibleReciterLimit]
  );

  const hasMoreReciters = visibleReciterLimit < filteredReciters.length;
  const isSearchPending = reciterSearch !== deferredReciterSearch;

  const favoritedReciters = useMemo(() => {
    if (!reciters) return [];
    return reciters.filter((r) => favorites.includes(r.id));
  }, [reciters, favorites]);

  const handleSelectReciter = (reciter: Reciter) => {
    setActiveReciter(reciter);
    // Smooth transition: shift to the surahs tab immediately to let them play
    setActiveTab('surahs');
  };

  if (showLoadingHome) {
    return <LoadingHome progress={loadingProgress} reciterCount={reciters.length} />;
  }

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 max-w-lg mx-auto w-full mobile-shell-padding md:pl-32 md:pb-32 md:max-w-4xl md:px-8">
      {/* 1. App Header with Gold and Emerald Accents */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Radio className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-emerald-250 to-amber-350 bg-clip-text text-transparent m-0 py-1">
              QURANIFY
            </h1>
            <p className="text-[10px] tracking-widest text-slate-400 font-bold uppercase -mt-1.5">
              Lecteur Coranique Premium
            </p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          API V3 En Ligne
        </div>
      </header>

      {/* 2. Main Tab Views */}
      <main className="flex-1 flex flex-col gap-5">
        
        {/* 2.1 Tab Qurra / Reciters View */}
        {activeTab === 'reciters' && (
          <div className="flex flex-col gap-5">
            {/* Search inputs */}
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
                    {isSearchPending ? 'Recherche...' : `${filteredReciters.length} résultat${filteredReciters.length > 1 ? 's' : ''} proche${filteredReciters.length > 1 ? 's' : ''}`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                    Tolère accents, majuscules, lettres oubliées et orthographes proches.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Smart
                </span>
              </div>
            )}

            {!reciterSearch && !selectedLetter && featuredReciters.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      Grands récitateurs
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Les voix les plus connues pour commencer sans chercher.
                    </p>
                  </div>
                  <span className="hidden min-[390px]:inline-flex text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
                    Sélection
                  </span>
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

            {/* B. Alphabetical A-Z Letter Filter Bar */}
            {availableLetters.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Filtrer par lettre</span>
                  {selectedLetter && (
                    <button 
                      onClick={() => setSelectedLetter('')}
                      className="text-[10px] text-emerald-400 font-bold hover:underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                <div className="flex overflow-x-auto gap-1.5 pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  <button
                    onClick={() => setSelectedLetter('')}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold shrink-0 transition-all ${
                      !selectedLetter
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tous
                  </button>
                  {availableLetters.map(letter => (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(selectedLetter === letter ? '' : letter)}
                      className={`text-xs w-8 h-8 rounded-lg border font-bold flex items-center justify-center shrink-0 transition-all ${
                        selectedLetter === letter
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error notifications */}
            {error && (
              <div className="glass-panel p-4 rounded-2xl border-red-500/20 bg-red-500/5 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">Connexion interrompue</h4>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Skeleton Shimmer Loaders */}
            {isLoadingReciters ? (
              <RecitersLoadingSkeleton />
            ) : filteredReciters.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
                <p className="text-slate-400">Aucun récitateur trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {visibleReciters.map((reciter) => (
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
                {hasMoreReciters && (
                  <button
                    onClick={() => setReciterPaging({
                      key: reciterFilterKey,
                      limit: visibleReciterLimit + RECITER_BATCH_SIZE
                    })}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-slate-900 hover:text-emerald-300 tap-feedback"
                  >
                    Afficher plus ({filteredReciters.length - visibleReciterLimit})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2.2 Tab Surahs View */}
        {activeTab === 'surahs' && (
          <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
            <SurahList />
          </Suspense>
        )}

        {/* 2.3 Tab Favorites View */}
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
                    Appuyez sur l'icône de cœur sur la carte d'un récitateur dans l'onglet Récitateurs pour l'ajouter ici en favori.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('reciters')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-colors tap-feedback"
                >
                  Parcourir les Récitateurs
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

        {/* 2.4 Tab About specifications View */}
        {activeTab === 'about' && (
          <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
            <AboutPanel />
          </Suspense>
        )}
      </main>

      {/* 3. Global Audio Player Sheet */}
      {currentTrack && (
        <Suspense fallback={null}>
          <GlobalPlayer />
        </Suspense>
      )}

      {/* 4. Sticky Bottom Mobile Nav Bar */}
      <BottomNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
