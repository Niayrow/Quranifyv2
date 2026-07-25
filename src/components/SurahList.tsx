import React, { useState, useMemo } from 'react';
import { useAudio } from '../context/AudioContext';
import type { Surah } from '../types';
import {
  Search, Play, Pause, Disc, MoreHorizontal, Download, CheckCircle2, Trash2,
  Repeat1, Repeat, X,
} from 'lucide-react';
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
    repeatMode,
    setRepeatMode,
    selectedSurahIds,
    setSelectedSurahIds,
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

  const playlistActive = selectedSurahIds.size > 0;

  const toggleInLoop = (id: number) => {
    setSelectedSurahIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3 border-emerald-500/20 bg-emerald-500/5">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Récitateur sélectionné</span>
          <h4 className="font-semibold text-slate-200 truncate">{activeReciter.name}</h4>
          <p className="text-xs text-slate-400 truncate">
            {playlistActive
              ? `Boucle active · ${selectedSurahIds.size} sourate${selectedSurahIds.size > 1 ? 's' : ''}`
              : `${activeMoshaf.name} · « Boucle » pour répéter une sélection`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRepeatMode(repeatMode === 'one' ? 'all' : 'one')}
            title={repeatMode === 'one' ? 'Répétition d’une seule sourate active' : 'Répéter la même sourate'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
              repeatMode === 'one'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat1 className="w-4 h-4" />
          </button>
          {playlistActive && (
            <button
              type="button"
              onClick={() => setSelectedSurahIds(new Set())}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
              title="Lire toutes les sourates"
            >
              <X className="w-3 h-3" />
              Tout
            </button>
          )}
        </div>
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
            const inLoop = selectedSurahIds.has(surah.id);
            const isDimmed = playlistActive && !inLoop;
            const url = getAudioUrl(activeMoshaf, surah);
            const isDownloaded = cachedUrls.has(url);
            const progress = downloadProgress[url];
            const isDownloading = progress !== undefined;
            const menuOpen = openMenuId === surah.id;

            return (
              <div
                key={surah.id}
                className={`group relative p-3 min-[390px]:p-4 rounded-2xl flex items-center gap-2.5 transition-all duration-200 border ${
                  isCurrent
                    ? 'surah-row-active'
                    : isDimmed
                      ? 'border-slate-800/20 bg-slate-900/15 opacity-45'
                      : inLoop
                        ? 'border-[#2dd4a0]/20 bg-[#2dd4a0]/[0.04]'
                        : 'border-slate-800/40 bg-slate-900/30 hover:bg-slate-900/80 hover:border-slate-700/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handlePlay(surah)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left tap-feedback"
                >
                  <div className="relative flex items-center justify-center w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 shrink-0">
                    <div
                      className={`absolute inset-0 rotate-45 rounded-lg border transition-all duration-500 ${
                        isCurrent
                          ? 'border-transparent bg-slate-950/80 shadow-[0_0_0_1px_rgba(45,212,160,0.35)]'
                          : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
                      }`}
                      style={
                        isCurrent
                          ? {
                              backgroundImage:
                                'linear-gradient(rgba(15,23,42,0.92), rgba(15,23,42,0.92)), linear-gradient(135deg, rgba(45,212,160,0.65) 0%, rgba(45,212,160,0.4) 75%, rgba(255,255,255,0.45) 100%)',
                              backgroundOrigin: 'border-box',
                              backgroundClip: 'padding-box, border-box',
                              border: '1px solid transparent',
                            }
                          : undefined
                      }
                    />
                    <span
                      className={`relative z-10 text-xs font-bold transition-colors ${
                        isCurrent ? 'text-[#7decc4]' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {isBuffering ? (
                        <div className="w-4 h-4 border-2 border-[#2dd4a0]/80 border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <div className="flex gap-0.5 items-end justify-center h-3.5 w-3.5">
                          <div className="w-0.5 bg-[#2dd4a0] animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }} />
                          <div className="w-0.5 bg-white/80 animate-[shimmer_0.6s_infinite_alternate] h-2/3 rounded-full" style={{ animationDelay: '0.3s' }} />
                          <div className="w-0.5 bg-[#2dd4a0] animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }} />
                        </div>
                      ) : (
                        surah.id
                      )}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 py-1">
                    <h5
                      className={`font-bold text-base transition-colors ${
                        isCurrent ? 'text-slate-50' : 'text-slate-100 group-hover:text-slate-50'
                      }`}
                    >
                      {surah.name}
                    </h5>
                    <p className="text-xs text-slate-400/80 truncate mt-0.5 font-medium">
                      {surah.englishTranslation}
                    </p>
                  </div>

                  <span
                    className={`font-serif text-2xl tracking-wide select-none arabic-text transition-colors shrink-0 hidden min-[420px]:inline ${
                      isCurrent ? 'text-[#9ae6c8]' : 'text-slate-300 group-hover:text-slate-100'
                    }`}
                  >
                    {surah.arabicName}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleInLoop(surah.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full text-[11px] font-semibold tracking-wide transition-all tap-feedback ${
                    inLoop
                      ? 'bg-[#2dd4a0]/90 text-slate-950'
                      : 'bg-transparent text-slate-400 ring-1 ring-inset ring-slate-700/80 hover:text-[#9ae6c8] hover:ring-[#2dd4a0]/35'
                  }`}
                  title={inLoop ? 'Retirer de la boucle' : 'Ajouter à la boucle de répétition'}
                  aria-pressed={inLoop}
                  aria-label={inLoop ? `Retirer ${surah.name} de la boucle` : `Ajouter ${surah.name} à la boucle`}
                >
                  <Repeat className={`w-3.5 h-3.5 ${inLoop ? '' : 'opacity-80'}`} />
                  <span className="hidden min-[360px]:inline">{inLoop ? 'En boucle' : 'Boucle'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlay(surah)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 tap-feedback ${
                    isCurrent
                      ? 'text-slate-950 shadow-[0_4px_14px_rgba(45,212,160,0.25)]'
                      : 'bg-slate-800 text-slate-300 group-hover:text-slate-950 group-hover:bg-[#2dd4a0] border border-slate-700'
                  }`}
                  style={
                    isCurrent
                      ? {
                          background:
                            'linear-gradient(135deg, #2dd4a0 0%, #34d399 72%, #f8fafc 100%)',
                        }
                      : undefined
                  }
                  aria-label={isPlaying ? 'Pause' : 'Lire'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
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
