import React, { useState, useMemo } from 'react';
import { useAudio } from '../context/AudioContext';
import type { Surah } from '../types';
import { Search, Play, Pause, Disc, Repeat1 } from 'lucide-react';

interface SurahListProps {
  mode?: 'listen' | 'ayah';
}

export const SurahList: React.FC<SurahListProps> = () => {
  const {
    activeReciter,
    activeMoshaf,
    getAvailableSurahs,
    currentTrack,
    playbackStatus,
    playTrack,
    togglePlay,
    repeatMode,
    setRepeatMode,
    selectedSurahIds,
    setSelectedSurahIds,
    activeSurah,
    setActiveSurah,
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');

  const availableSurahs = useMemo(() => {
    return getAvailableSurahs(activeReciter, activeMoshaf);
  }, [activeReciter, activeMoshaf, getAvailableSurahs]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return availableSurahs;
    const query = searchQuery.toLowerCase().trim();
    return availableSurahs.filter(surah =>
      surah.name.toLowerCase().includes(query) ||
      surah.englishTranslation.toLowerCase().includes(query) ||
      surah.id.toString().includes(query)
    );
  }, [availableSurahs, searchQuery]);

  const playlistActive = selectedSurahIds.size > 0;
  const viewedSurah = activeSurah ?? currentTrack?.surah ?? null;

  const toggleCheck = (id: number) => {
    const next = new Set(selectedSurahIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSurahIds(next);
  };

  const handlePlay = (surah: Surah) => {
    if (!activeReciter || !activeMoshaf) return;
    const isCurrent =
      currentTrack?.surah.id === surah.id &&
      currentTrack?.reciter.id === activeReciter.id &&
      currentTrack?.moshaf.id === activeMoshaf.id;
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(activeReciter, activeMoshaf, surah);
    }
  };

  const handleSelectSurah = (surah: Surah) => {
    setActiveSurah(surah);
  };

  if (!activeReciter || !activeMoshaf) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-4">
        <Disc className="w-12 h-12 text-slate-600 animate-spin" style={{ animationDuration: '4s' }} />
        <div>
          <h3 className="font-semibold text-lg text-slate-200">Aucun récitateur sélectionné</h3>
          <p className="text-sm text-slate-400 max-w-xs mt-1">
            Veuillez choisir un récitateur dans l'espace Écouter pour voir ses sourates disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
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

      {/* Reciter Banner */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Récitateur Sélectionné</span>
          <h4 className="font-semibold text-slate-200 truncate">{activeReciter.name}</h4>
          <p className="text-xs text-slate-400 truncate">{activeMoshaf.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Repeat-one toggle */}
          <button
            onClick={() => setRepeatMode(repeatMode === 'one' ? 'all' : 'one')}
            title={repeatMode === 'one' ? 'Répétition sourate active' : 'Répéter la même sourate'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
              repeatMode === 'one'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat1 className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-emerald-400">
            {playlistActive
              ? `${selectedSurahIds.size} / ${availableSurahs.length}`
              : `${availableSurahs.length} Sourates`}
          </span>
        </div>
      </div>

      {/* Surah List */}
      {filteredSurahs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
          <p className="text-slate-400">Aucune sourate trouvée pour "{searchQuery}"</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredSurahs.map((surah) => {
            const isCurrent =
              currentTrack?.surah.id === surah.id &&
              currentTrack?.reciter.id === activeReciter.id &&
              currentTrack?.moshaf.id === activeMoshaf.id;
            const isPlaying  = isCurrent && playbackStatus === 'playing';
            const isBuffering = isCurrent && playbackStatus === 'buffering';
            const isChecked  = selectedSurahIds.has(surah.id);
            // Dim sourates that are NOT in the active playlist
            const isDimmed   = playlistActive && !isChecked;

            return (
              <div
                key={surah.id}
                className={`group relative p-3 min-[390px]:p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 border ${
                  isCurrent
                    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_8px_24px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                    : isDimmed
                      ? 'border-slate-800/20 bg-slate-900/15 opacity-35'
                      : isChecked
                        ? 'border-emerald-500/25 bg-emerald-500/5'
                        : 'border-slate-800/40 bg-slate-900/30 hover:bg-slate-900/80 hover:border-slate-700/60'
                }`}
              >
                {/* Active-track accent bar */}
                {isCurrent && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                )}

                {/* ── Checkbox ── always visible, left-most */}
                <button
                  onClick={() => toggleCheck(surah.id)}
                  className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]'
                      : 'border-slate-600 bg-transparent hover:border-emerald-500/60'
                  }`}
                  aria-checked={isChecked}
                  role="checkbox"
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-slate-950" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Surah number badge */}
                <div className="relative flex items-center justify-center w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 shrink-0">
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
                        <div className="w-0.5 bg-emerald-300 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 bg-emerald-300 animate-[shimmer_0.6s_infinite_alternate] h-2/3 rounded-full" style={{ animationDelay: '0.3s' }} />
                        <div className="w-0.5 bg-emerald-300 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }} />
                      </div>
                    ) : (
                      surah.id
                    )}
                  </span>
                </div>

                {/* Names */}
                <button
                  type="button"
                  className="min-w-0 flex-1 py-1 text-left cursor-pointer"
                  onClick={() => handleSelectSurah(surah)}
                >
                  <h5 className={`font-bold text-base transition-colors ${
                    viewedSurah?.id === surah.id ? 'text-emerald-400' : isCurrent ? 'text-emerald-400' : 'text-slate-100 group-hover:text-emerald-400'
                  }`}>
                    {surah.name}
                  </h5>
                  <p className="text-xs text-slate-400/80 truncate mt-0.5 font-medium">
                    {surah.englishTranslation}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {viewedSurah?.id === surah.id ? 'Texte ouvert' : 'Ouvrir les versets'}
                  </p>
                </button>

                {/* Arabic + Play button */}
                <div className="flex items-center gap-2 min-[390px]:gap-4 shrink-0 text-right">
                  <span className={`font-serif text-2xl tracking-wide select-none arabic-text transition-colors ${
                    isCurrent ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-slate-300 group-hover:text-slate-100'
                  }`}>
                    {surah.arabicName}
                  </span>

                  <button
                    onClick={() => handlePlay(surah)}
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
