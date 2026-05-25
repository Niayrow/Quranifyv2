import React, { useState, useMemo } from 'react';
import { useAudio, AudioProvider } from './context/AudioContext';
import { ReciterCard } from './components/ReciterCard';
import { SurahList } from './components/SurahList';
import { GlobalPlayer } from './components/GlobalPlayer';
import { BottomNavbar } from './components/BottomNavbar';
import { 
  Compass, Search, Heart, Shield, Radio, 
  Layers, HardDrive, Smartphone, Sparkles, AlertTriangle
} from 'lucide-react';
import type { Reciter } from './types';
import { RECITER_IMAGES } from './utils/images';

// Dictionary of phonetic synonyms & aliases for the most famous reciters
const RECITER_ALIASES: Record<number, string[]> = {
  108: ["alafasy", "al afasy", "al-afasy", "alafasi", "afasy", "afasi", "mishary", "mishari", "rashid", "mishari rashid alafasy"],
  118: ["sudais", "soudais", "soudays", "sudays", "abdul rahman", "soudaiss", "sudaiss"],
  104: ["muaiqly", "al muaiqly", "al-muaiqly", "mueaqly", "maher", "mahir", "mouaiqly"],
  44: ["ghamdi", "al ghamdi", "al-ghamdi", "ghamidi", "saad", "sa'd"],
  122: ["dosari", "dossari", "dossary", "al dosari", "yasser", "yassir"],
  54: ["abdul basit", "abdelbasset", "abdel basit", "basit", "samad"],
  78: ["minshawi", "menshawi", "menshavi", "mohamed siddiq"],
  94: ["shuraim", "churaim", "shuraym", "saud"],
  112: ["ghamdi", "hassan", "hazem"],
  60: ["husary", "hussary", "al hussary", "mahmoud khalil"],
  2: ["tablawi", "al tablawi", "mahmoud"],
  3: ["hudhaify", "hudaify", "al hudhaify", "ali jaber"],
};

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

// High-performance search relevancy scoring algorithm
const getSearchScore = (reciter: Reciter, queryNormalized: string): number => {
  const nameNormalized = normalizeString(reciter.name);
  
  // 1. Exact match gets ultimate priority
  if (nameNormalized === queryNormalized) return 1000;
  
  // 2. Exact phrase containment
  if (nameNormalized.includes(queryNormalized)) return 500;
  
  // 3. Synonym / Alias match
  const aliases = RECITER_ALIASES[reciter.id] || [];
  for (const alias of aliases) {
    if (alias.includes(queryNormalized) || queryNormalized.includes(alias)) {
      return 400;
    }
  }

  // 4. Token prefix and initials matching
  const queryTokens = queryNormalized.split(" ");
  const nameTokens = nameNormalized.split(" ");
  
  // Match initials (e.g., 'MA' from 'Mishary Alafasy')
  const initials = nameTokens.map(t => t[0]).join("");
  if (initials.includes(queryNormalized) || queryNormalized === initials) {
    return 300;
  }

  let matchCount = 0;
  let prefixMatchCount = 0;
  
  for (const qToken of queryTokens) {
    if (!qToken) continue;
    
    // Prefix match on a token (e.g. 'shur' matches 'shuraim')
    const isPrefix = nameTokens.some(nToken => nToken.startsWith(qToken));
    if (isPrefix) {
      prefixMatchCount++;
    }
    
    // Simple containment
    const isContained = nameTokens.some(nToken => nToken.includes(qToken));
    if (isContained) {
      matchCount++;
    }
  }

  if (prefixMatchCount === queryTokens.length) {
    return 200 + prefixMatchCount * 10;
  }

  if (matchCount > 0) {
    return 100 + matchCount * 10;
  }

  // 5. Typo Tolerance via Jaccard char overlap (threshold of 0.55 similarity)
  const queryChars = new Set(queryNormalized.replace(/\s/g, ""));
  const nameChars = new Set(nameNormalized.replace(/\s/g, ""));
  let intersectionSize = 0;
  for (const c of queryChars) {
    if (nameChars.has(c)) {
      intersectionSize++;
    }
  }
  const JaccardScore = intersectionSize / (queryChars.size + nameChars.size - intersectionSize);
  
  if (JaccardScore > 0.55) {
    return 50 + Math.round(JaccardScore * 40);
  }

  return 0;
};

const AppContent: React.FC = () => {
  const {
    reciters,
    isLoadingReciters,
    error,
    activeReciter,
    setActiveReciter
  } = useAudio();


  const [activeTab, setActiveTab] = useState<string>('reciters');
  const [reciterSearch, setReciterSearch] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('');

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

  // Extract dynamic curated categories for reciters
  const curatedCategories = useMemo(() => {
    if (!reciters) return [];
    
    return [
      {
        id: 'popular',
        title: '✨ Les Incontournables',
        description: 'Les voix les plus écoutées au monde',
        reciters: [108, 118, 104, 54, 44, 122]
          .map(id => reciters.find(r => r.id === id))
          .filter((r): r is Reciter => !!r)
      },
      {
        id: 'discover',
        title: '🌟 À Découvrir',
        description: 'Récitations classiques et styles uniques',
        reciters: [78, 60, 94, 112, 2, 3]
          .map(id => reciters.find(r => r.id === id))
          .filter((r): r is Reciter => !!r)
      }
    ].filter(category => category.reciters.length > 0);
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
    if (reciterSearch.trim()) {
      const queryNorm = normalizeString(reciterSearch);
      
      // Calculate search scores for all items
      const scored = result
        .map(r => ({
          reciter: r,
          score: getSearchScore(r, queryNorm)
        }))
        .filter(item => item.score > 0); // Keep only matching items
        
      // Sort by score in descending order
      scored.sort((a, b) => b.score - a.score);
      
      return scored.map(item => item.reciter);
    }

    return result;
  }, [reciters, reciterSearch, selectedLetter]);

  const favoritedReciters = useMemo(() => {
    if (!reciters) return [];
    return reciters.filter((r) => favorites.includes(r.id));
  }, [reciters, favorites]);

  const handleSelectReciter = (reciter: Reciter) => {
    setActiveReciter(reciter);
    // Smooth transition: shift to the surahs tab immediately to let them play
    setActiveTab('surahs');
  };

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

            {/* A. Curated Discover Categories */}
            {!reciterSearch && !selectedLetter && curatedCategories.length > 0 && (
              <div className="flex flex-col gap-6">
                {curatedCategories.map((category) => (
                  <div key={category.id} className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-emerald-400 flex items-center gap-1.5">
                        {category.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium ml-1 mt-0.5 uppercase tracking-widest">{category.description}</p>
                    </div>
                    <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory">
                      {category.reciters.map((reciter) => {
                        const isSelected = activeReciter?.id === reciter.id;
                        const nameParts = reciter.name.split(' ');
                        const initials = nameParts.map(n => n[0]).slice(0, 2).join('').toUpperCase();
                        const imageUrl = RECITER_IMAGES[reciter.id];
                        
                        return (
                          <button
                            key={reciter.id}
                            onClick={() => handleSelectReciter(reciter)}
                            className="flex flex-col items-center shrink-0 tap-feedback focus:outline-none w-20 snap-start group"
                          >
                            <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-tr flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300 overflow-hidden ${
                              isSelected 
                                ? 'from-emerald-500 to-amber-500 text-slate-950 scale-105 shadow-[0_10px_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950' 
                                : 'from-slate-900 to-slate-800 border border-slate-800/80 text-slate-350 hover:border-emerald-500/40 hover:text-emerald-400 hover:shadow-[0_8px_16px_rgba(16,185,129,0.1)] group-hover:-translate-y-1'
                            }`}>
                              {imageUrl ? (
                                <>
                                  <img 
                                    src={imageUrl} 
                                    alt={reciter.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <span className="hidden">{initials}</span>
                                </>
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <span className={`text-[10px] text-center mt-2 w-full transition-colors leading-tight ${
                              isSelected ? 'text-emerald-400 font-bold' : 'text-slate-300 font-medium group-hover:text-emerald-300'
                            }`}>
                              {reciter.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="grid grid-cols-1 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer-loader h-44 rounded-2xl border border-slate-900" />
                ))}
              </div>
            ) : filteredReciters.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
                <p className="text-slate-400">Aucun récitateur trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredReciters.map((reciter) => (
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
            )}
          </div>
        )}

        {/* 2.2 Tab Surahs View */}
        {activeTab === 'surahs' && <SurahList />}

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
          <div className="flex flex-col gap-5">
            {/* Immersive glassmorphic specifications deck */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
              
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-5.5 h-5.5 text-emerald-400 animate-pulse" />
                  Moteur Quranify V1.0
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Client de streaming audio haute performance, conçu pour mobile et synchronisé en temps réel avec les API coraniques officielles.
                </p>
              </div>

              {/* Technical features list */}
              <div className="flex flex-col gap-4.5">
                <div className="flex gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Architecture Tactile Mobile-First</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adaptations strictes de l'affichage, barres d'action élastiques et zones tactiles agrandies adaptées à l'ergonomie mobile iOS et Android.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Contrôle en Arrière-plan (W3C Media Session)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Intégration directe avec l'écran de verrouillage et les centres de notifications de vos téléphones. Lecture ininterrompue en arrière-plan.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <HardDrive className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Persistance Locale (LocalStorage)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sauvegarde automatique du volume, de la vitesse de lecture, du récitateur sélectionné et de la position d'écoute même après redémarrage.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Moteur Tailwind CSS v4</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rendu ultra-rapide et effets de flou translucides (glassmorphism) accélérés par processeur graphique (GPU).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Système de design épuré aux couleurs traditionnelles vertes émeraude et dorées, rendant hommage à la beauté de la calligraphie coranique.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Global Audio Player Sheet */}
      <GlobalPlayer />

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
