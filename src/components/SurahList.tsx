import React, { useState, useMemo } from 'react';
import { useAudio } from '../context/AudioContext';
import type { Surah } from '../types';
import { Search, Play, Pause, Disc, MoreHorizontal, Download, CheckCircle2, Trash2 } from 'lucide-react';
import { getAudioUrl } from '../utils/audioUrl';

interface SurahListProps {
  mode?: 'listen' | 'ayah';
  onChooseReciter?: () => void;
}

export const SurahList: React.FC<SurahListProps> = ({ onChooseReciter }) => {
  const {
    activeReciter,
    activeMoshaf,
    getAvailableSurahs,
    currentTrack,
    playbackStatus,
    playTrack,
    togglePlay,
    cachedUrls,
    downloadProgress,
    downloadSurah,
    deleteSurah,
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const availableSurahs = useMemo(() => {
    return getAvailableSurahs(activeReciter, activeMoshaf);
  }, [activeReciter, activeMoshaf, getAvailableSurahs]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return availableSurahs;
    const query = searchQuery.toLowerCase().trim();
    return availableSurahs.filter(surah =>
      surah.name.toLowerCase().includes(query) ||
      surah.englishTranslation.toLowerCase().includes(query) ||
      surah.arabicName.includes(query) ||
      surah.id.toString().includes(query)
    );
  }, [availableSurahs, searchQuery]);

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

  if (!activeReciter || !activeMoshaf) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-4">
        <Disc className="w-12 h-12 text-slate-600" />
        <div>
          <h3 className="font-semibold text-lg text-slate-200">Aucun récitateur sélectionné</h3>
          <p className="text-sm text-slate-400 max-w-xs mt-1">
            Choisissez un récitateur pour voir ses sourates.
          </p>
        </div>
        {onChooseReciter && (
          <button
            type="button"
            onClick={onChooseReciter}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-colors tap-feedback"
          >
            Choisir un récitateur
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 rounded-md"
          >
            Effacer
          </button>
        )}
      </div>

      {filteredSurahs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl gap-2">
          <p className="text-slate-400">Aucune sourate trouvée pour &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredSurahs.map((surah) => {
            const isCurrent =
              currentTrack?.surah.id === surah.id &&
              currentTrack?.reciter.id === activeReciter.id &&
              currentTrack?.moshaf.id === activeMoshaf.id;
            const isPlaying = isCurrent && playbackStatus === 'playing';
            const isBuffering = isCurrent && playbackStatus === 'buffering';
            const url = getAudioUrl(activeMoshaf, surah);
            const isDownloaded = cachedUrls.has(url);
            const progress = downloadProgress[url];
            const isDownloading = progress !== undefined;
            const menuOpen = openMenuId === surah.id;

            return (
              <div
                key={surah.id}
                className={`group relative p-3 min-[390px]:p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 border ${
                  isCurrent
                    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_8px_24px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                    : 'border-slate-800/40 bg-slate-900/30 hover:bg-slate-900/80 hover:border-slate-700/60'
                }`}
              >
                {isCurrent && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                )}

                <button
                  type="button"
                  onClick={() => handlePlay(surah)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left tap-feedback"
                >
                  <div className="relative flex items-center justify-center w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 shrink-0">
                    <div className={`absolute inset-0 rotate-45 rounded-lg border transition-all duration-500 ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105'
                        : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
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

                  <span className={`font-serif text-2xl tracking-wide select-none arabic-text transition-colors shrink-0 ${
                    isCurrent ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-slate-300 group-hover:text-slate-100'
                  }`}>
                    {surah.arabicName}
                  </span>

                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800 text-slate-300 group-hover:text-slate-950 group-hover:bg-emerald-400 border border-slate-700'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </span>
                </button>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(menuOpen ? null : surah.id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 transition-colors tap-feedback"
                    aria-label="Plus d'actions"
                  >
                    {isDownloading ? (
                      <span className="text-[9px] font-black text-emerald-400">{progress}%</span>
                    ) : isDownloaded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" />
                    )}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] rounded-xl border border-slate-700 bg-slate-900 shadow-xl py-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDownloaded) {
                            if (confirm(`Supprimer « ${surah.name} » du hors-ligne ?`)) {
                              deleteSurah(activeReciter, activeMoshaf, surah);
                            }
                          } else {
                            downloadSurah(activeReciter, activeMoshaf, surah);
                          }
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 tap-feedback"
                      >
                        {isDownloaded ? (
                          <>
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            Supprimer hors-ligne
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            Télécharger
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
