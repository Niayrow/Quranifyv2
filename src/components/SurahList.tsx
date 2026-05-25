import React, { useState, useMemo } from 'react';
import { useAudio } from '../context/AudioContext';
import type { Surah } from '../types';
import { Search, Play, Pause, Disc } from 'lucide-react';


export const SurahList: React.FC = () => {
  const {
    activeReciter,
    activeMoshaf,
    getAvailableSurahs,
    currentTrack,
    playbackStatus,
    playTrack,
    togglePlay
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');

  // Get available surahs for active reciter + moshaf
  const availableSurahs = useMemo(() => {
    return getAvailableSurahs(activeReciter, activeMoshaf);
  }, [activeReciter, activeMoshaf, getAvailableSurahs]);

  // Fuzzy filter based on search query
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return availableSurahs;
    
    const query = searchQuery.toLowerCase().trim();
    return availableSurahs.filter(surah => 
      surah.name.toLowerCase().includes(query) ||
      surah.englishTranslation.toLowerCase().includes(query) ||
      surah.id.toString().includes(query)
    );
  }, [availableSurahs, searchQuery]);

  const handleSurahClick = (surah: Surah) => {
    if (!activeReciter || !activeMoshaf) return;
    
    const isCurrent = currentTrack?.surah.id === surah.id && 
                      currentTrack?.reciter.id === activeReciter.id &&
                      currentTrack?.moshaf.id === activeMoshaf.id;
                      
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(activeReciter, activeMoshaf, surah);
    }
  };

  if (!activeReciter || !activeMoshaf) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-4">
        <Disc className="w-12 h-12 text-slate-600 animate-spin" style={{ animationDuration: '4s' }} />
        <div>
          <h3 className="font-semibold text-lg text-slate-200">Aucun récitateur sélectionné</h3>
          <p className="text-sm text-slate-400 max-w-xs mt-1">
            Veuillez choisir un récitateur dans l'onglet Récitateurs pour voir ses sourates disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search and Filters Header */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Rechercher ${availableSurahs.length} sourates...`}
          className="w-full pl-12 pr-5 py-3.5 bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-2xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none transition-all"
        />
        {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 rounded-md"
            >
              Effacer
            </button>
        )}
      </div>

      {/* Reciter Details Context Banner */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Récitateur Sélectionné</span>
          <h4 className="font-semibold text-slate-200 truncate">{activeReciter.name}</h4>
          <p className="text-xs text-slate-400 truncate">{activeMoshaf.name}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-emerald-400">
            {availableSurahs.length} Sourates
          </span>
        </div>
      </div>

      {/* Surah List Items */}
      {filteredSurahs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
          <p className="text-slate-400">Aucune sourate trouvée pour "{searchQuery}"</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredSurahs.map((surah) => {
            const isCurrent = currentTrack?.surah.id === surah.id && 
                              currentTrack?.reciter.id === activeReciter.id &&
                              currentTrack?.moshaf.id === activeMoshaf.id;
            
            const isPlaying = isCurrent && playbackStatus === 'playing';
            const isBuffering = isCurrent && playbackStatus === 'buffering';

            return (
              <div
                key={surah.id}
                onClick={() => handleSurahClick(surah)}
                className={`group relative p-3 min-[390px]:p-4 rounded-2xl flex items-center gap-3 min-[390px]:gap-5 cursor-pointer transition-all duration-300 border ${
                  isCurrent 
                    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_8px_24px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
                    : 'border-slate-800/40 bg-slate-900/30 hover:bg-slate-900/80 hover:border-slate-700/60 shadow-sm'
                }`}
              >
                {/* Visual Accent border for current playing track */}
                {isCurrent && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                )}

                {/* Surah Number - Classic Rotated Square Design */}
                <div className="relative flex items-center justify-center w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 shrink-0 ml-1">
                  <div className={`absolute inset-0 rotate-45 rounded-lg border transition-all duration-500 ${
                    isCurrent 
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105' 
                      : 'bg-slate-950 border-slate-700 group-hover:border-slate-500 group-hover:rotate-[135deg]'
                  }`} />
                  <span className={`relative z-10 text-xs font-bold transition-colors ${
                    isCurrent ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {isBuffering ? (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <div className="flex gap-0.5 items-end justify-center h-3.5 w-3.5">
                        <div className="w-0.5 bg-emerald-300 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-0.5 bg-emerald-300 animate-[shimmer_0.6s_infinite_alternate] h-2/3 rounded-full" style={{ animationDelay: '0.3s' }}></div>
                        <div className="w-0.5 bg-emerald-300 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                    ) : (
                      surah.id
                    )}
                  </span>
                </div>

                {/* Transliterated Names and Translations */}
                <div className="min-w-0 flex-1 py-1">
                  <h5 className={`font-bold text-base transition-colors ${
                    isCurrent ? 'text-emerald-400' : 'text-slate-100 group-hover:text-emerald-400'
                  }`}>
                    {surah.name}
                  </h5>
                  <p className="text-xs text-slate-400/80 truncate mt-0.5 font-medium">
                    {surah.englishTranslation}
                  </p>
                </div>

                {/* Arabic Script Panel & Action */}
                <div className="flex items-center gap-2 min-[390px]:gap-4 shrink-0 text-right">
                  <span className={`font-serif text-2xl tracking-wide select-none arabic-text transition-colors ${
                    isCurrent ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-slate-300 group-hover:text-slate-100'
                  }`}>
                    {surah.arabicName}
                  </span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSurahClick(surah);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400'
                        : 'bg-slate-800 text-slate-300 hover:text-slate-950 hover:bg-emerald-400 border border-slate-700'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
