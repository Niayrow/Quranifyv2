import React, { useEffect, useState, useMemo, lazy, Suspense, useDeferredValue, useCallback, useRef } from 'react';
import { useAudio, AudioProvider } from './context/AudioContext';
import { AuthProvider } from './context/AuthContext';
import { ReciterCard } from './components/ReciterCard';
import { Navbar } from './components/Navbar';
import { 
  Search, Heart, AlertTriangle, Headphones, Play, ArrowRight,
  Bookmark, Download, Disc, ExternalLink, Cloud, WifiOff, ChevronDown
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Reciter } from './types';
import { getGeneratedReciterAvatar, getReciterImage } from './utils/images';
import { getReciterCategory, type ReciterCategoryId } from './data/reciterCategories';
import { ReciterCategoryGrid, ReciterCategoryModal } from './components/ReciterCategoryModal';
import { ListenReciterHeader } from './components/ListenReciterHeader';
import { CloudSync } from './components/CloudSync';
import { AuthPromptModal } from './components/AuthPromptModal';
import { useAuth } from './context/AuthContext';
import { getAudioUrl } from './utils/audioUrl';
import { useReciterNavFusion } from './hooks/useReciterNavFusion';

const SurahList = lazy(() => import('./components/SurahList').then((module) => ({ default: module.SurahList })));
const GlobalPlayerV2 = lazy(() => import('./components/GlobalPlayerV2').then((module) => ({ default: module.GlobalPlayerV2 })));
// Legacy player kept for reference: ./components/GlobalPlayer
const AboutPanel = lazy(() => import('./components/AboutPanel').then((module) => ({ default: module.AboutPanel })));
const ReciterCompare = lazy(() => import('./components/ReciterCompare').then((module) => ({ default: module.ReciterCompare })));
const AccountPanel = lazy(() => import('./components/AccountPanel').then((module) => ({ default: module.AccountPanel })));
const TAB_IDS = ['home', 'listen', 'moments', 'favorites', 'more'] as const;
type TabId = typeof TAB_IDS[number];
type MorePanel = 'account' | 'moments' | 'downloads' | 'priorities' | 'compare' | 'about';
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
    case 'moments':
      return 'moments';
    case 'ayah':
    case 'everyayah':
      return 'home';
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

const FEATURED_RECITER_IDS = [123, 54, 102, 92, 30, 31];
const GOMUSLIMLIFE_URL = 'https://gomuslimlife.com';
const MAKKAH_MOMENTS = [
  {
    id: 'shuraim-marking-recitation',
    title: 'Récitation marquante de Sheikh Shuraim',
    reciter: 'Sheikh Shuraim',
    youtubeUrl: 'https://www.youtube.com/watch?v=tXG1nFz-ozE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/tXG1nFz-ozE',
  },
  {
    id: 'ahmad-bin-taleb-marking-recitation',
    title: 'Récitation marquante de Sheikh Ahmad bin Taleb',
    reciter: 'Sheikh Ahmad bin Taleb',
    youtubeUrl: 'https://www.youtube.com/watch?v=QcjIp5cl5Fo',
    embedUrl: 'https://www.youtube-nocookie.com/embed/QcjIp5cl5Fo',
  },
  {
    id: 'abdul-razzaq-boukar-marking-recitation',
    title: 'Récitation marquante de Sheikh Abdul Razzaq Boukar',
    reciter: 'Sheikh Abdul Razzaq Boukar',
    youtubeUrl: 'https://www.youtube.com/watch?v=ofWia2Vm6Fc',
    embedUrl: 'https://www.youtube-nocookie.com/embed/ofWia2Vm6Fc',
  },
  {
    id: 'yasser-al-dossary-marking-recitation',
    title: 'Récitation marquante de Sheikh Yasser Al-Dossary',
    reciter: 'Sheikh Yasser Al-Dossary',
    youtubeUrl: 'https://www.youtube.com/watch?v=WUaCahSbDMI',
    embedUrl: 'https://www.youtube-nocookie.com/embed/WUaCahSbDMI',
  },
] as const;

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
    <div className="min-h-[100dvh] w-full bg-[#07111d] text-[#e6edf5] flex items-center justify-center px-6 py-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(240,209,188,0.12),transparent_42%),radial-gradient(circle_at_10%_90%,rgba(121,144,161,0.12),transparent_35%)] pointer-events-none" />
      <main className="relative w-full max-w-sm flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/icons/sansfond.png"
            alt="Sawra"
            className="w-32 h-32 object-contain drop-shadow-[0_0_24px_rgba(0,0,0,0.45)]"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#f6f8fb] m-0">SAWRA</h1>
            <p className="text-[11px] tracking-[0.22em] text-[#b4c0ce] font-bold uppercase mt-1">
              Lecteur Coranique Premium
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#b4c0ce]">
            <span>{statusText}</span>
            <span className="text-[#e7d0c0]">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#111d2d] border border-[#30455c] overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7990a1] via-[#b9c7d3] to-[#f0d1bc] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="brand-card rounded-2xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-[#95a7ba] font-bold">Récitants</p>
              <p className="text-lg font-black text-[#f6f8fb] mt-1">{reciterCount || '...'}</p>
            </div>
            <div className="brand-card rounded-2xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-[#95a7ba] font-bold">Sourates</p>
              <p className="text-lg font-black text-[#f6f8fb] mt-1">114</p>
            </div>
            <div className="brand-card rounded-2xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-[#95a7ba] font-bold">Départ</p>
              <p className="text-lg font-black text-[#f6f8fb] mt-1">{countdown}s</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#b4c0ce]">
          <span className="w-2 h-2 rounded-full bg-[#f0d1bc] animate-pulse" />
          Connexion à l’API coranique
        </div>
      </main>
    </div>
  );
};

interface ProductPriorityCardProps {
  title: string;
  summary: string;
  detail: string;
  icon: LucideIcon;
}

const ProductPriorityCard: React.FC<ProductPriorityCardProps> = ({ title, summary, detail, icon: Icon }) => (
  <div className="brand-card rounded-2xl p-4">
    <div className="flex items-start gap-3">
      <span className="brand-chip mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-[#f6f8fb]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#d0d9e3]">{summary}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#95a7ba]">{detail}</p>
      </div>
    </div>
  </div>
);

interface HomeFeaturedReciterProps {
  reciter: Reciter;
  isSelected: boolean;
  onSelect: () => void;
}

const HomeFeaturedReciter: React.FC<HomeFeaturedReciterProps> = ({ reciter, isSelected, onSelect }) => {
  const imageUrl = getReciterImage(reciter);
  const fallbackImage = getGeneratedReciterAvatar(reciter);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`shrink-0 w-[6.5rem] flex flex-col items-center gap-2.5 rounded-2xl p-2.5 text-center transition-all tap-feedback ${
        isSelected
          ? 'bg-[#f0d1bc]/10 ring-1 ring-[#f0d1bc]/35'
          : 'hover:bg-[#162538]/70'
      }`}
    >
      <span className={`relative h-16 w-16 overflow-hidden rounded-full border-2 bg-[#111d2d] ${
        isSelected ? 'border-[#f0d1bc] shadow-[0_0_18px_rgba(206,166,135,0.32)]' : 'border-[#46607b]'
      }`}>
        <img
          src={imageUrl}
          alt=""
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== fallbackImage) img.src = fallbackImage;
          }}
        />
      </span>
      <span className={`w-full text-[11px] font-semibold leading-tight line-clamp-2 ${
        isSelected ? 'text-[#f1d4c1]' : 'text-[#d0d9e3]'
      }`}>
        {reciter.name}
      </span>
    </button>
  );
};

const MakkahMomentCard: React.FC<((typeof MAKKAH_MOMENTS)[number] & { featured?: boolean })> = ({
  title,
  reciter,
  youtubeUrl,
  embedUrl,
  featured = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className={`overflow-hidden rounded-[1.6rem] border border-[#30455c]/55 bg-[linear-gradient(180deg,rgba(17,29,45,0.92),rgba(10,18,29,0.96))] ${
      featured ? 'shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]' : ''
    }`}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="block w-full text-left"
        aria-expanded={expanded}
      >
        <div className={`border-b border-[#30455c]/45 px-4 py-4 sm:px-5 ${featured ? 'sm:px-6 sm:py-5' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8ea1b3]">
                {featured ? 'À la une' : 'Moment marquant'}
              </p>
              <h3 className={`mt-1 font-black text-[#f6f8fb] ${featured ? 'text-lg sm:text-[1.35rem]' : 'text-base'}`}>
                {title}
              </h3>
              <p className={`mt-1 font-semibold text-[#f1d4c1] ${featured ? 'text-sm' : 'text-xs'}`}>{reciter}</p>
              {featured && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#b4c0ce]">
                  Une récitation mise en avant pour ouvrir la sélection.
                </p>
              )}
            </div>
            <span className="flex flex-col items-center gap-2 shrink-0">
              <span className={`flex items-center justify-center rounded-2xl bg-[#20334a] text-[#f0d1bc] ${featured ? 'h-12 w-12' : 'h-11 w-11'}`}>
                <Play className={`ml-0.5 fill-current ${featured ? 'h-5 w-5' : 'h-4.5 w-4.5'}`} />
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d0d9e3]">
                {expanded ? 'Réduire' : 'Ouvrir'}
                <ChevronDown className={`h-3.5 w-3.5 text-[#f0d1bc] transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </span>
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className={`px-4 py-4 sm:px-5 ${featured ? 'sm:px-6 sm:pb-6' : ''}`}>
          <div className="overflow-hidden rounded-[1.2rem] border border-[#30455c]/45 bg-[#0a1420]">
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title={title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-3 rounded-[1.2rem] border border-[#30455c]/45 bg-[#0f1928]/80 p-3.5 sm:p-4">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-black text-[#f6f8fb]">{title}</h4>
              <p className="text-xs font-semibold text-[#f1d4c1]">{reciter}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="brand-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold transition-colors tap-feedback"
              >
                Réduire
              </button>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold transition-colors"
              >
                Ouvrir sur YouTube
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const HomeExploreFusionButton: React.FC<{
  enabled: boolean;
  onExplore: () => void;
  onFusionProgressChange: (progress: number) => void;
}> = ({ enabled, onExplore, onFusionProgressChange }) => {
  const { progress, setHeaderRef, setSentinelRef } = useReciterNavFusion(enabled);

  React.useEffect(() => {
    onFusionProgressChange(progress);
  }, [progress, onFusionProgressChange]);

  React.useEffect(() => {
    if (!enabled) onFusionProgressChange(0);
  }, [enabled, onFusionProgressChange]);

  const mergeStyle = {
    ['--fusion-p' as string]: String(progress),
  } as React.CSSProperties;

  return (
    <div className="min-w-0">
      <div ref={setSentinelRef} className="hidden md:block h-0 w-full overflow-hidden" aria-hidden />
      <div
        ref={(node) => setHeaderRef(node)}
        className={`home-explore-fusion relative md:sticky md:top-24 md:z-20 ${
          enabled && progress > 0.01 ? 'is-fusing' : ''
        }`}
        style={enabled ? mergeStyle : undefined}
      >
        <button
          type="button"
          onClick={onExplore}
          className="home-explore-fusion-card group w-full rounded-[1.35rem] border border-[#46607b]/35 bg-[#132031]/72 px-4 py-3.5 text-left transition-colors hover:bg-[#162538]/88 tap-feedback"
          tabIndex={progress >= 0.92 ? -1 : 0}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#20334a] text-[#f1d4c1]">
            <Headphones className="h-4 w-4" />
          </span>
          <span className="mt-3 block text-[14px] font-black text-[#f6f8fb]">
            Explorer les voix
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-[#9fb1c3]">
            Récitateurs, sourates et découverte en quelques gestes.
          </span>
        </button>
      </div>
    </div>
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
    currentTrack,
    playbackStatus,
    play,
    cachedUrls,
    getAvailableSurahs,
    playTrack,
  } = useAudio();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>(() => getInitialTab());
  const [morePanel, setMorePanel] = useState<MorePanel>('account');
  const [listenStep, setListenStep] = useState<ListenStep>('reciters');
  const [categoryModalId, setCategoryModalId] = useState<ReciterCategoryId | null>(null);
  const [reciterSearch, setReciterSearch] = useState<string>('');
  const deferredReciterSearch = useDeferredValue(reciterSearch);
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [showLoadingHome, setShowLoadingHome] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const surahSectionRef = useRef<HTMLElement | null>(null);
  const didRestoreListenStep = useRef(false);
  const authPromptShownRef = useRef(false);
  const [reciterFusionProgress, setReciterFusionProgress] = useState(0);
  const [exploreFusionProgress, setExploreFusionProgress] = useState(0);

  const handleReciterFusionProgress = useCallback((progress: number) => {
    setReciterFusionProgress(progress);
  }, []);

  const handleExploreFusionProgress = useCallback((progress: number) => {
    setExploreFusionProgress(progress);
  }, []);

  const reciterFusionEnabled =
    activeTab === 'listen' && listenStep === 'surahs' && Boolean(activeReciter);
  const exploreFusionEnabled = activeTab === 'home';

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
      if (tab === 'account') {
        setMorePanel('account');
        setActiveTab('more');
        return;
      }
      if (tab === 'moments') {
        setActiveTab('moments');
        return;
      }
      if (tab) {
        setActiveTab(mapLegacyTab(tab));
      }
      if (url.protocol === 'sawra:' || url.protocol === 'quranify:' || url.pathname.includes('/surah')) {
        setActiveTab('listen');
      }
    } catch {
      if (rawUrl.includes('tab=compare')) {
        setMorePanel('compare');
        setActiveTab('more');
      } else if (rawUrl.includes('tab=about')) {
        setMorePanel('about');
        setActiveTab('more');
      } else if (rawUrl.includes('tab=moments')) {
        setActiveTab('moments');
      } else if (
        rawUrl.includes('tab=surahs') ||
        rawUrl.includes('tab=reciters') ||
        rawUrl.includes('tab=listen') ||
        rawUrl.includes('sawra://surah') ||
        rawUrl.includes('quranify://surah')
      ) {
        setActiveTab('listen');
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
    if (!user && !authLoading) {
      setShowAuthPrompt(true);
      authPromptShownRef.current = true;
    }
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

  const handlePlayFatihah = useCallback(() => {
    if (!activeReciter || !activeMoshaf) return;
    const available = getAvailableSurahs(activeReciter, activeMoshaf);
    const fatihah = available.find((s) => s.id === 1) ?? available[0];
    if (!fatihah) return;
    playTrack(activeReciter, activeMoshaf, fatihah);
  }, [activeReciter, activeMoshaf, getAvailableSurahs, playTrack]);

  const dismissAuthPrompt = () => {
    setShowAuthPrompt(false);
    try {
      sessionStorage.setItem('sawra_auth_prompt_dismissed', '1');
    } catch {
      // ignore
    }
  };

  const openAuthFromPrompt = () => {
    dismissAuthPrompt();
    setMorePanel('account');
    setActiveTab('more');
  };

  // Soft prompt once per session if logged out
  useEffect(() => {
    if (authLoading || user || showLoadingHome || authPromptShownRef.current) return;
    try {
      if (
        sessionStorage.getItem('sawra_auth_prompt_dismissed') === '1' ||
        sessionStorage.getItem('quranify_auth_prompt_dismissed') === '1'
      ) return;
    } catch {
      // ignore
    }
    const timer = window.setTimeout(() => {
      if (!user) {
        setShowAuthPrompt(true);
        authPromptShownRef.current = true;
      }
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [authLoading, user, showLoadingHome]);

  useEffect(() => {
    if (user) setShowAuthPrompt(false);
  }, [user]);

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

  const downloadedEntries = useMemo(() => {
    if (cachedUrls.size === 0 || reciters.length === 0) return [];

    const entries: Array<{
      key: string;
      reciterId: number;
      reciterName: string;
      surahId: number;
      surahName: string;
    }> = [];

    for (const reciter of reciters) {
      for (const moshaf of reciter.moshaf) {
        const availableSurahs = getAvailableSurahs(reciter, moshaf);
        for (const surah of availableSurahs) {
          const url = getAudioUrl(moshaf, surah);
          if (!cachedUrls.has(url)) continue;
          entries.push({
            key: `${reciter.id}-${moshaf.id}-${surah.id}`,
            reciterId: reciter.id,
            reciterName: reciter.name,
            surahId: surah.id,
            surahName: surah.name,
          });
        }
      }
    }

    return entries.sort((a, b) => {
      if (a.reciterName !== b.reciterName) {
        return a.reciterName.localeCompare(b.reciterName, 'fr');
      }
      return a.surahId - b.surahId;
    });
  }, [cachedUrls, getAvailableSurahs, reciters]);

  const downloadedGroups = useMemo(() => {
    const groups = new Map<number, { reciterName: string; surahs: Array<{ id: number; name: string }> }>();
    for (const entry of downloadedEntries) {
      const existing = groups.get(entry.reciterId);
      if (existing) {
        existing.surahs.push({ id: entry.surahId, name: entry.surahName });
        continue;
      }
      groups.set(entry.reciterId, {
        reciterName: entry.reciterName,
        surahs: [{ id: entry.surahId, name: entry.surahName }],
      });
    }

    return Array.from(groups.entries()).map(([reciterId, group]) => ({
      reciterId,
      reciterName: group.reciterName,
      surahs: group.surahs,
    }));
  }, [downloadedEntries]);

  const handleNavigate = (tab: TabId, panel?: MorePanel) => {
    setActiveTab(tab);
    if (panel) setMorePanel(panel);
    if (tab === 'listen') {
      setListenStep(activeReciter ? 'surahs' : 'reciters');
    }
  };

  const handleExploreVoices = () => {
    setActiveTab('listen');
    setListenStep('reciters');
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

  const handleResumeListening = () => {
    if (!currentTrack) {
      handleNavigate('listen');
      return;
    }
    setActiveReciter(currentTrack.reciter);
    setActiveMoshaf(currentTrack.moshaf);
    setActiveTab('listen');
    setListenStep('surahs');
    if (playbackStatus !== 'playing') {
      play();
    }
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
    <div className={`flex-1 flex flex-col px-4 max-w-lg mx-auto w-full mobile-shell-padding mobile-app-shell max-md:px-0 md:pt-28 md:w-[min(72rem,calc(100%-4rem))] md:max-w-6xl md:px-0 ${
      currentTrack ? 'md:pb-44' : 'md:pb-12'
    }`}>
      <CloudSync favorites={favorites} setFavorites={setFavorites} />
      <AuthPromptModal
        open={showAuthPrompt && !user}
        onClose={dismissAuthPrompt}
        onConnect={openAuthFromPrompt}
      />
      {/* Brand lives in the floating Navbar; keep an accessible page title */}
      <h1 className="sr-only">Sawra — Écouter le Coran en ligne, gratuit et sans publicité</h1>

      {/* 2. Main Tab Views */}
      <main
        className={`flex-1 flex flex-col mobile-app-main ${
          activeTab === 'listen' && listenStep === 'surahs' && activeReciter
            ? 'max-md:gap-0 gap-5'
            : 'gap-5'
        }`}
      >
        <div
          key={activeTab}
          className={`flex flex-col ${
            activeTab === 'listen' && listenStep === 'surahs' && activeReciter
              ? 'max-md:gap-0 gap-5 max-md:animate-none animate-page-enter'
              : 'gap-5 animate-page-enter'
          }`}
        >
        
        {activeTab === 'home' && (
          <div className="flex flex-col gap-4 md:gap-7 pb-16 sm:pb-20 max-md:pt-4 md:pt-5">
            <section className="relative isolate rounded-[1.75rem] md:rounded-[2.4rem] ring-1 ring-[#30455c]/90 brand-card">
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(240,209,188,0.24),transparent_42%),radial-gradient(circle_at_85%_18%,rgba(121,144,161,0.24),transparent_28%),linear-gradient(160deg,#162538_0%,#0f1a29_46%,#08111c_100%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f0d1bc]/45 to-transparent" />
                <div className="hero-glow-pulse absolute -right-10 top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(240,209,188,0.22),transparent_70%)] blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 max-w-[16rem] sm:max-w-sm">
                    <p className="inline-flex items-center rounded-full border border-[#f0d1bc]/20 bg-[#f0d1bc]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#f1d4c1]/90 select-none">
                      Sawra Audio
                    </p>
                    <h2 className="mt-2 text-[1.75rem] sm:text-[2.2rem] md:text-[3.4rem] font-black tracking-tight text-white leading-[1.02]">
                      Le Coran,
                      <span className="block text-[#f1d4c1]">simplement.</span>
                    </h2>
                    <p className="mt-3 text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed text-[#d0d9e3]/78">
                      Reprenez votre lecture, trouvez une belle voix et restez concentré sur l'essentiel.
                    </p>
                    <p className="mt-3 inline-flex items-center rounded-full border border-[#f0d1bc]/18 bg-[#111d2d]/70 px-3 py-1.5 text-[11px] font-bold text-[#f1d4c1] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      100% gratuit. Sans pub.
                    </p>
                  </div>

                  <div className="shrink-0 pt-1">
                    <img
                      src="/icons/sansfond.png"
                      alt=""
                      className="hero-logo-float h-16 w-16 sm:h-20 sm:w-20 md:h-32 md:w-32 object-contain drop-shadow-[0_10px_28px_rgba(30,80,140,0.45)]"
                      draggable={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={currentTrack ? handleResumeListening : () => handleNavigate('listen')}
                    className="group flex items-center justify-between rounded-[1.35rem] bg-[#f0d1bc] px-4 py-3.5 text-left text-[#132031] shadow-[0_14px_30px_rgba(240,209,188,0.18)] transition-transform hover:-translate-y-0.5 tap-feedback"
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#5d463a]">
                        {currentTrack ? 'Continuer' : 'Commencer'}
                      </span>
                      <span className="mt-1 block text-[14px] font-black text-[#132031]">
                        {currentTrack ? currentTrack.surah.name : 'Explorer les récitateurs'}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#30455c] truncate">
                        {currentTrack ? currentTrack.reciter.name : 'Choisissez une voix et lancez l’écoute'}
                      </span>
                    </span>
                    <span className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#132031] text-[#f7ebdf]">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </button>

                  <HomeExploreFusionButton
                    enabled={exploreFusionEnabled}
                    onExplore={handleExploreVoices}
                    onFusionProgressChange={handleExploreFusionProgress}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-left">
                  {[
                    { label: 'Hors-ligne', value: 'Audio prêt', icon: WifiOff },
                    { label: 'Multi-appareils', value: 'Sync fluide', icon: Cloud },
                    { label: 'Expérience', value: 'Mobile first', icon: Disc },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-[#46607b]/28 bg-[#132031]/58 px-3 py-3"
                      >
                        <Icon className="h-4 w-4 text-[#f0d1bc]" />
                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#8ea1b3]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-[#f6f8fb] leading-snug">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-[#30455c]/60 bg-[linear-gradient(180deg,rgba(19,32,49,0.94),rgba(13,23,36,0.9))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8ea1b3]">
                    Reprise rapide
                  </p>
                  <h3 className="mt-1 text-base font-black text-[#f6f8fb]">
                    {currentTrack ? 'Continuer votre dernière écoute' : 'Prêt pour une nouvelle écoute'}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#9fb1c3]">
                    {currentTrack
                      ? `${currentTrack.surah.name} avec ${currentTrack.reciter.name}.`
                      : 'Choisissez un réciteur et commencez depuis une interface pensée pour le mobile.'}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#20334a] text-[#f0d1bc]">
                  {currentTrack ? <Play className="ml-0.5 h-4 w-4 fill-current" /> : <Headphones className="h-4 w-4" />}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={currentTrack ? handleResumeListening : () => handleNavigate('listen')}
                  className="brand-button-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-bold tap-feedback"
                >
                  {currentTrack ? 'Reprendre' : 'Commencer'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('listen')}
                  className="brand-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-bold tap-feedback"
                >
                  Explorer
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="px-0.5">
                <h3 className="text-sm font-black text-[#f6f8fb]">Accès rapides</h3>
                <p className="mt-1 text-xs text-[#95a7ba]">L’essentiel, sans surcharge.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'listen',
                    label: 'Explorer',
                    hint: 'Récitateurs et sourates',
                    icon: Headphones,
                    onClick: () => handleNavigate('listen'),
                  },
                  {
                    id: 'favorites',
                    label: 'Favoris',
                    hint: favoritedReciters.length ? `${favoritedReciters.length} voix` : 'Vos sélections',
                    icon: Heart,
                    onClick: () => handleNavigate('favorites'),
                  },
                  {
                    id: 'downloads',
                    label: 'Téléchargées',
                    hint: downloadedEntries.length ? `${downloadedEntries.length} sourate(s)` : 'Voir le hors-ligne',
                    icon: Download,
                    onClick: () => handleNavigate('more', 'downloads'),
                  },
                  {
                    id: 'account',
                    label: 'Compte',
                    hint: 'Préférences et sync',
                    icon: Cloud,
                    onClick: () => handleNavigate('more', 'account'),
                  },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onClick}
                      className="group rounded-[1.35rem] border border-[#30455c]/60 bg-[#132031]/70 px-3.5 py-3.5 text-left transition-colors hover:bg-[#162538]/88 tap-feedback"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#20334a] text-[#f1d4c1]">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="mt-3 block text-[13px] font-black text-[#f6f8fb]">{action.label}</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-[#95a7ba]">{action.hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {!isLoadingReciters && (
              <section className="flex flex-col gap-3">
                <div className="px-0.5">
                  <h3 className="text-sm font-black text-[#f6f8fb]">Explorer par ambiance</h3>
                  <p className="mt-1 text-xs text-[#95a7ba]">Une entrée simple pour trouver la voix qui vous convient.</p>
                </div>
                <ReciterCategoryGrid
                  reciters={reciters}
                  activeCategoryId={categoryModalId}
                  onOpenCategory={setCategoryModalId}
                />
              </section>
            )}

            {featuredReciters.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3 px-0.5">
                  <div>
                    <h3 className="text-sm font-black text-[#f6f8fb]">Voix recommandées</h3>
                    <p className="mt-1 text-xs text-[#95a7ba]">Une sélection simple à lancer en un appui.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('listen');
                      setListenStep('reciters');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d0d9e3] hover:text-[#f1d4c1]"
                  >
                    Tous
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {featuredReciters.map((reciter) => (
                    <HomeFeaturedReciter
                      key={reciter.id}
                      reciter={reciter}
                      isSelected={activeReciter?.id === reciter.id}
                      onSelect={() => handleSelectReciter(reciter)}
                    />
                  ))}
                </div>
              </section>
            )}

            {favoritedReciters.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3 px-0.5">
                  <div>
                    <h3 className="text-sm font-black text-[#f6f8fb]">Vos favoris</h3>
                    <p className="mt-1 text-xs text-[#95a7ba]">Retrouvez vos voix préférées sans détour.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigate('favorites')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d0d9e3] hover:text-[#f1d4c1]"
                  >
                    Voir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {favoritedReciters.slice(0, 8).map((reciter) => (
                    <HomeFeaturedReciter
                      key={reciter.id}
                      reciter={reciter}
                      isSelected={activeReciter?.id === reciter.id}
                      onSelect={() => handleSelectReciter(reciter)}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#30455c]/50 bg-[#101b2a]/78 px-4 py-3 text-[11px] text-[#95a7ba]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b98d6e]" />
                App Store &amp; Google Play bientôt
              </span>
              <a
                href={GOMUSLIMLIFE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#b4c0ce] hover:text-[#f1d4c1] transition-colors"
              >
                GoMuslimLife
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>
        )}

        {/* 2.1 Listening Hub — wizard: reciters then surahs */}
        {activeTab === 'listen' && (
          <div
            className={`flex flex-col ${
              listenStep === 'surahs' && activeReciter
                ? 'gap-5 max-md:gap-0'
                : 'gap-5 max-md:pt-4'
            }`}
          >
            {error && (
              <div className="glass-panel p-4 rounded-2xl border-[#f08c8c]/25 bg-[#f08c8c]/8 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-[#f2a3a3] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#f6f8fb] text-sm">Connexion interrompue</h4>
                  <p className="text-xs text-[#c8d1db] mt-1">{error}</p>
                </div>
              </div>
            )}

            {listenStep === 'reciters' && (
              <div className="flex flex-col gap-5">
                <section className="flex flex-col gap-1">
                  <h2 className="text-lg font-black text-[#f6f8fb]">Choisis un récitateur</h2>
                  <p className="text-xs text-[#b4c0ce]">
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95a7ba]" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder="Rechercher un récitateur..."
                    className="w-full pl-12 pr-5 py-3.5 bg-[#111d2d]/78 hover:bg-[#162538]/88 focus:bg-[#162538] border border-[#30455c] focus:border-[#cea687]/55 rounded-2xl text-[#e6edf5] placeholder:text-[#8295aa] text-sm focus:outline-none transition-all"
                  />
                  {reciterSearch && (
                    <button
                      type="button"
                      onClick={() => setReciterSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#b4c0ce] hover:text-[#f6f8fb] px-2 py-1 bg-[#1b2d43] rounded-md"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {reciterSearch.trim() && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl brand-card-muted px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#e6edf5]">
                        {isSearchPending ? 'Recherche...' : `${filteredReciters.length} résultat${filteredReciters.length > 1 ? 's' : ''}`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#95a7ba] truncate">
                        Accents, aliases et orthographes proches.
                      </p>
                    </div>
                    <span className="brand-chip shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                      Smart
                    </span>
                  </div>
                )}

                {isLoadingReciters ? (
                  <RecitersLoadingSkeleton />
                ) : filteredReciters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
                    <p className="text-[#b4c0ce]">Aucun récitateur trouvé</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {listenFavoritedReciters.length > 0 && (
                      <section className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-[#d7e4ef] flex items-center gap-2">
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
                        <h3 className="text-sm font-bold text-[#d7e4ef]">
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
                <p className="text-[#b4c0ce] text-sm">Choisissez un récitateur pour continuer.</p>
                <button
                  type="button"
                  onClick={handleChangeReciter}
                  className="brand-button-primary px-5 py-2.5 rounded-xl font-semibold text-xs tap-feedback"
                >
                  Voir les récitateurs
                </button>
              </div>
            )}

            {listenStep === 'surahs' && activeReciter && (
              <div className="listen-surahs-panel flex flex-col gap-5 max-md:gap-0">
                <ListenReciterHeader
                  activeReciter={activeReciter}
                  activeMoshaf={activeMoshaf}
                  fusionEnabled={reciterFusionEnabled}
                  isFavorite={favorites.includes(activeReciter.id)}
                  onFusionProgressChange={handleReciterFusionProgress}
                  onChangeReciter={handleChangeReciter}
                  onSelectMoshaf={setActiveMoshaf}
                  onToggleFavorite={(e) => toggleFavorite(activeReciter.id, e)}
                  onPlay={handlePlayFatihah}
                  sectionRef={surahSectionRef}
                />

                <div className="max-md:px-0 max-md:pt-4">
                  <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
                    <SurahList onChooseReciter={handleChangeReciter} />
                  </Suspense>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'moments' && (
          <div className="flex flex-col gap-5 pb-16 sm:pb-20 max-md:pt-4">
            <section className="relative overflow-hidden rounded-3xl border border-[#30455c]/55 bg-[linear-gradient(180deg,rgba(17,29,45,0.94),rgba(9,17,28,0.98))] p-5 sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,209,188,0.12),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(121,144,161,0.14),transparent_28%)]" aria-hidden="true" />
              <div className="relative z-10 flex flex-col gap-5">
                <div className="max-w-2xl">
                  <span className="brand-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Moments
                  </span>
                  <h2 className="mt-3 text-xl font-black text-[#f6f8fb] sm:text-[1.75rem]">Récitations marquantes</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#b4c0ce]">
                    Une sélection mise en avant, puis d'autres récitations à ouvrir juste en dessous.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-2xl border border-[#30455c]/45 bg-[#101b2a]/78 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8ea1b3]">Sélection</p>
                    <p className="mt-1 text-lg font-black text-[#f6f8fb]">{MAKKAH_MOMENTS.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[#30455c]/45 bg-[#101b2a]/78 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8ea1b3]">À la une</p>
                    <p className="mt-1 text-sm font-black text-[#f6f8fb]">1 vidéo</p>
                  </div>
                  <div className="rounded-2xl border border-[#30455c]/45 bg-[#101b2a]/78 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8ea1b3]">Format</p>
                    <p className="mt-1 text-sm font-black text-[#f6f8fb]">YouTube</p>
                  </div>
                  <div className="rounded-2xl border border-[#30455c]/45 bg-[#101b2a]/78 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8ea1b3]">Accès</p>
                    <p className="mt-1 text-sm font-black text-[#f6f8fb]">Direct</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="px-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8ea1b3]">À la une</p>
                <h3 className="mt-1 text-lg font-black text-[#f6f8fb]">{MAKKAH_MOMENTS[0].reciter}</h3>
              </div>
              <MakkahMomentCard {...MAKKAH_MOMENTS[0]} featured />
            </section>

            <section className="flex flex-col gap-3">
              <div className="px-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8ea1b3]">Sélection</p>
                <h3 className="mt-1 text-lg font-black text-[#f6f8fb]">Autres récitations</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {MAKKAH_MOMENTS.slice(1).map((moment) => (
                  <MakkahMomentCard key={moment.id} {...moment} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 2.2 Tab Favorites View */}
        {activeTab === 'favorites' && (
          <div className="flex flex-col gap-5 pb-16 sm:pb-20 max-md:pt-4">
            <h2 className="text-lg font-bold text-[#f6f8fb] flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              Vos Récitateurs Favoris
            </h2>

            {favoritedReciters.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-4">
                <Heart className="w-12 h-12 text-[#46607b]" />
                <div>
                  <h3 className="font-semibold text-[#e6edf5]">Favoris Vides</h3>
                  <p className="text-xs text-[#b4c0ce] max-w-xs mt-1">
                    Appuyez sur l'icône de cœur sur la carte d'un récitateur dans l'espace Écouter pour l'ajouter ici.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('listen')}
                  className="brand-button-primary px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors tap-feedback"
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
          <div className="flex flex-col gap-5 max-md:pt-4">
            <section className="glass-panel rounded-3xl border border-[#30455c]/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="brand-chip-cool inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Plus
                  </span>
                  <h2 className="mt-3 text-lg font-black text-[#f6f8fb]">Fonctions avancées et informations</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#b4c0ce]">
                    Les vues secondaires quittent la navbar principale mais restent accessibles ici avec plus de contexte.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  onClick={() => setMorePanel('account')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'account'
                      ? 'border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f1d4c1]'
                      : 'border-[#30455c] bg-[#111d2d]/72 text-[#b4c0ce] hover:text-[#f6f8fb]'
                  }`}
                >
                  Compte
                </button>
                <button
                  onClick={() => setMorePanel('downloads')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'downloads'
                      ? 'border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f1d4c1]'
                      : 'border-[#30455c] bg-[#111d2d]/72 text-[#b4c0ce] hover:text-[#f6f8fb]'
                  }`}
                >
                  Téléchargées
                </button>
                <button
                  onClick={() => setMorePanel('priorities')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'priorities'
                      ? 'border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f1d4c1]'
                      : 'border-[#30455c] bg-[#111d2d]/72 text-[#b4c0ce] hover:text-[#f6f8fb]'
                  }`}
                >
                  Priorités
                </button>
                <button
                  onClick={() => setMorePanel('compare')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'compare'
                      ? 'border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f1d4c1]'
                      : 'border-[#30455c] bg-[#111d2d]/72 text-[#b4c0ce] hover:text-[#f6f8fb]'
                  }`}
                >
                  Comparer
                </button>
                <button
                  onClick={() => setMorePanel('about')}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    morePanel === 'about'
                      ? 'border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f1d4c1]'
                      : 'border-[#30455c] bg-[#111d2d]/72 text-[#b4c0ce] hover:text-[#f6f8fb]'
                  }`}
                >
                  À propos
                </button>
              </div>
            </section>

            {morePanel === 'account' && (
              <Suspense fallback={<div className="shimmer-loader h-40 rounded-2xl border border-slate-900" />}>
                <AccountPanel />
              </Suspense>
            )}

            {morePanel === 'downloads' && (
              <section className="flex flex-col gap-4 rounded-3xl border border-[#30455c]/50 bg-[#111d2d]/65 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8ea1b3]">
                      Hors-ligne
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#f6f8fb]">Sourates téléchargées</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#95a7ba]">
                      Retrouvez vos téléchargements et le récitateur associé.
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#20334a] text-[#f0d1bc]">
                    <Download className="h-4.5 w-4.5" />
                  </span>
                </div>

                {downloadedGroups.length === 0 ? (
                  <div className="rounded-2xl border border-[#30455c]/50 bg-[#0f1928]/80 px-4 py-5 text-center">
                    <p className="text-sm font-semibold text-[#f6f8fb]">Aucune sourate téléchargée</p>
                    <p className="mt-1 text-xs text-[#95a7ba]">
                      Téléchargez une sourate depuis l’écran d’écoute pour la retrouver ici.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {downloadedGroups.map((group) => (
                      <div
                        key={group.reciterId}
                        className="rounded-2xl border border-[#30455c]/45 bg-[#0f1928]/80 px-4 py-3.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-black text-[#f6f8fb]">{group.reciterName}</h4>
                            <p className="mt-0.5 text-[11px] text-[#95a7ba]">
                              {group.surahs.length} sourate(s) hors-ligne
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const selected = reciters.find((reciter) => reciter.id === group.reciterId);
                              if (!selected) return;
                              handleSelectReciter(selected);
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#46607b]/35 bg-[#132031]/75 px-3 py-1.5 text-[11px] font-semibold text-[#d7e4ef] hover:text-[#f1d4c1]"
                          >
                            Ouvrir
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.surahs.map((surah) => (
                            <span
                              key={`${group.reciterId}-${surah.id}`}
                              className="inline-flex items-center rounded-full border border-[#46607b]/30 bg-[#132031]/70 px-3 py-1.5 text-[11px] font-semibold text-[#d7e4ef]"
                            >
                              {surah.id}. {surah.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

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
      {currentTrack && (
        <Suspense fallback={null}>
          <GlobalPlayerV2 />
        </Suspense>
      )}

      {/* 4. Floating Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        dockWithPlayer={Boolean(currentTrack)}
        reciterFusion={
          reciterFusionEnabled && activeReciter
            ? {
                progress: reciterFusionProgress,
                reciter: activeReciter,
                activeMoshaf,
                onChangeReciter: handleChangeReciter,
              }
            : null
        }
        exploreFusion={
          exploreFusionEnabled
            ? {
                progress: exploreFusionProgress,
                onExplore: handleExploreVoices,
              }
            : null
        }
      />

    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
