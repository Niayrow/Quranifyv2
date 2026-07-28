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
        <Disc className="w-12 h-12 text-[#46607b]" />
        <div>
          <h3 className="font-semibold text-lg text-[#f6f8fb]">Aucun récitateur sélectionné</h3>
          <p className="text-sm text-[#b4c0ce] max-w-xs mt-1">
            Choisissez un récitateur pour voir ses sourates.
          </p>
        </div>
        {onChooseReciter && (
          <button
            type="button"
            onClick={onChooseReciter}
            className="brand-button-primary px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors tap-feedback"
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95a7ba]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Rechercher ${availableSurahs.length} sourates...`}
          className="w-full pl-12 pr-5 py-3.5 bg-[#111d2d]/78 hover:bg-[#162538]/88 focus:bg-[#162538] border border-[#30455c] focus:border-[#cea687]/55 rounded-2xl text-[#e6edf5] placeholder:text-[#8295aa] text-sm focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#b4c0ce] hover:text-[#f6f8fb] px-2 py-1 bg-[#1b2d43] rounded-md"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3 border-[#cea687]/25 bg-[#f0d1bc]/6">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#f0d1bc]">Récitateur sélectionné</span>
          <h4 className="font-semibold text-[#f6f8fb] truncate">{activeReciter.name}</h4>
          <p className="text-xs text-[#b4c0ce] truncate">
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
                ? 'bg-[#f0d1bc]/16 border-[#cea687]/45 text-[#f1d4c1] shadow-[0_0_12px_rgba(206,166,135,0.25)]'
                : 'bg-[#162538]/60 border-[#46607b] text-[#aab7c5] hover:text-[#f6f8fb]'
            }`}
          >
            <Repeat1 className="w-4 h-4" />
          </button>
          {playlistActive && (
            <button
              type="button"
              onClick={() => setSelectedSurahIds(new Set())}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#46607b] text-[11px] font-semibold text-[#aab7c5] hover:text-[#f6f8fb]"
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
          <p className="text-[#b4c0ce]">Aucune sourate trouvée pour &quot;{searchQuery}&quot;</p>
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
                      ? 'border-[#30455c]/20 bg-[#111d2d]/20 opacity-45'
                      : inLoop
                        ? 'border-[#cea687]/28 bg-[#f0d1bc]/[0.05]'
                        : 'border-[#30455c]/45 bg-[#111d2d]/36 hover:bg-[#162538]/88 hover:border-[#46607b]/60'
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
                          ? 'border-transparent bg-[#07111d]/88 shadow-[0_0_0_1px_rgba(206,166,135,0.35)]'
                          : 'bg-[#07111d] border-[#46607b] group-hover:border-[#95a7ba]'
                      }`}
                      style={
                        isCurrent
                          ? {
                              backgroundImage:
                                'linear-gradient(rgba(7,17,29,0.92), rgba(7,17,29,0.92)), linear-gradient(135deg, rgba(240,209,188,0.72) 0%, rgba(206,166,135,0.46) 70%, rgba(121,144,161,0.4) 100%)',
                              backgroundOrigin: 'border-box',
                              backgroundClip: 'padding-box, border-box',
                              border: '1px solid transparent',
                            }
                          : undefined
                      }
                    />
                    <span
                      className={`relative z-10 text-xs font-bold transition-colors ${
                        isCurrent ? 'text-[#f1d4c1]' : 'text-[#aab7c5] group-hover:text-[#eef3f8]'
                      }`}
                    >
                      {isBuffering ? (
                        <div className="w-4 h-4 border-2 border-[#f0d1bc]/80 border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <div className="flex gap-0.5 items-end justify-center h-3.5 w-3.5">
                          <div className="w-0.5 bg-[#f0d1bc] animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }} />
                          <div className="w-0.5 bg-white/80 animate-[shimmer_0.6s_infinite_alternate] h-2/3 rounded-full" style={{ animationDelay: '0.3s' }} />
                          <div className="w-0.5 bg-[#7990a1] animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }} />
                        </div>
                      ) : (
                        surah.id
                      )}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 py-1">
                    <h5
                      className={`font-bold text-base transition-colors ${
                        isCurrent ? 'text-[#f8fbff]' : 'text-[#f1f5f9] group-hover:text-[#ffffff]'
                      }`}
                    >
                      {surah.name}
                    </h5>
                    <p className="text-xs text-[#aab7c5]/85 truncate mt-0.5 font-medium">
                      {surah.englishTranslation}
                    </p>
                  </div>

                  <span
                    className={`font-serif text-2xl tracking-wide select-none arabic-text transition-colors shrink-0 hidden min-[420px]:inline ${
                      isCurrent ? 'text-[#f1d4c1]' : 'text-[#d0d9e3] group-hover:text-[#f8fbff]'
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
                      ? 'bg-[#f0d1bc] text-[#111d2d]'
                      : 'bg-transparent text-[#aab7c5] ring-1 ring-inset ring-[#46607b]/80 hover:text-[#f1d4c1] hover:ring-[#cea687]/35'
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
                      ? 'text-[#111d2d] shadow-[0_4px_14px_rgba(206,166,135,0.25)]'
                      : 'bg-[#162538] text-[#d0d9e3] group-hover:text-[#111d2d] group-hover:bg-[#f0d1bc] border border-[#46607b]'
                  }`}
                  style={
                    isCurrent
                      ? {
                          background:
                            'linear-gradient(135deg, #f0d1bc 0%, #cea687 72%, #f7fbff 100%)',
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
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#95a7ba] hover:text-[#f6f8fb] hover:bg-[#162538]/85 transition-colors tap-feedback"
                    aria-label="Plus d'actions"
                  >
                    {isDownloading ? (
                      <span className="text-[9px] font-black text-[#f0d1bc]">{progress}%</span>
                    ) : isDownloaded ? (
                      <CheckCircle2 className="w-4 h-4 text-[#f0d1bc]" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" />
                    )}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] rounded-xl border border-[#46607b] bg-[#111d2d] shadow-xl py-1">
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
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#e6edf5] hover:bg-[#162538] tap-feedback"
                      >
                        {isDownloaded ? (
                          <>
                            <Trash2 className="w-3.5 h-3.5 text-[#f2a3a3]" />
                            Supprimer hors-ligne
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-[#f0d1bc]" />
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
