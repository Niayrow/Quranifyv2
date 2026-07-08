import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Surah } from '../types';
import { SURAHS } from '../data/surahs';
import { useSurahVerses } from '../hooks/useSurahVerses';
import { useEveryAyahPlayer } from '../hooks/useEveryAyahPlayer';
import { Search, Play, Pause, BookOpenText, ScrollText, LoaderCircle, Radio, SkipBack, SkipForward } from 'lucide-react';

export const EveryAyahReader: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return SURAHS;
    const query = searchQuery.toLowerCase().trim();
    return SURAHS.filter((surah) =>
      surah.name.toLowerCase().includes(query) ||
      surah.englishTranslation.toLowerCase().includes(query) ||
      surah.arabicName.includes(query) ||
      surah.id.toString().includes(query)
    );
  }, [searchQuery]);

  const { verses, isLoading: isLoadingVerses, error: versesError } = useSurahVerses(selectedSurah);
  const everyAyahPlayer = useEveryAyahPlayer(selectedSurah?.id ?? null, verses.length, null);
  const selectedEveryAyahReciter = everyAyahPlayer.reciters.find((reciter) => reciter.id === everyAyahPlayer.selectedReciterId);
  const activeEveryAyahVerse = verses[everyAyahPlayer.currentVerseIndex];
  const activeVerseIndex = everyAyahPlayer.playbackStatus !== 'idle' ? everyAyahPlayer.currentVerseIndex : -1;
  const activeVerseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeVerseIndex < 0) return;
    activeVerseRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeVerseIndex]);

  return (
    <div className="flex flex-col gap-5">
      {/* Surah picker */}
      <div className="glass-panel rounded-3xl border border-slate-800/70 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher parmi les 114 sourates..."
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

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {filteredSurahs.map((surah) => {
            const isSelected = selectedSurah?.id === surah.id;
            return (
              <button
                key={surah.id}
                type="button"
                onClick={() => setSelectedSurah(surah)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-emerald-500/30 hover:text-slate-100'
                }`}
              >
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {surah.id}
                </span>
                <span className="block text-sm font-bold">{surah.name}</span>
                <span className="block font-serif text-xs text-slate-400 arabic-text">{surah.arabicName}</span>
              </button>
            );
          })}
          {filteredSurahs.length === 0 && (
            <p className="px-2 py-3 text-sm text-slate-400">Aucune sourate trouvée.</p>
          )}
        </div>
      </div>

      {/* Verse Reader */}
      <section className="glass-panel rounded-3xl border border-slate-800/70 overflow-hidden">
        <div className="border-b border-slate-800/80 bg-slate-950/60 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpenText className="w-4.5 h-4.5 text-emerald-400" />
                <h4 className="text-sm font-black text-slate-100">Lecture texte par verset</h4>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {selectedSurah
                  ? `Affichage de ${selectedSurah.name} avec timing exact EveryAyah.`
                  : 'Choisissez une sourate ci-dessus pour afficher son texte et sa phonétique.'}
              </p>
            </div>
            {activeVerseIndex >= 0 && verses.length > 0 && (
              <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Verset {activeVerseIndex + 1}/{verses.length}
              </span>
            )}
          </div>
        </div>

        {!selectedSurah ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <ScrollText className="w-10 h-10 text-slate-600" />
            <div>
              <h5 className="text-sm font-bold text-slate-200">Aucune sourate sélectionnée</h5>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Sélectionnez une sourate pour lire son texte, sa phonétique et l'écouter verset par verset.
              </p>
            </div>
          </div>
        ) : isLoadingVerses ? (
          <div className="flex items-center justify-center gap-3 px-6 py-10 text-slate-400">
            <LoaderCircle className="w-5 h-5 animate-spin" />
            <span className="text-sm">Chargement des versets...</span>
          </div>
        ) : versesError ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-amber-300">{versesError}</p>
          </div>
        ) : (
          <div className="max-h-[26rem] overflow-y-auto px-3 py-3">
            <div className="mb-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-bold text-slate-100">Mode EveryAyah</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Lecture ayah par ayah avec récitateurs compatibles et surlignage exact.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => everyAyahPlayer.playVerseAt(Math.max(0, everyAyahPlayer.currentVerseIndex - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 transition-colors hover:border-emerald-500/35 hover:text-emerald-300"
                    title="Verset précédent"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={everyAyahPlayer.togglePlayback}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors hover:bg-emerald-400"
                    title="Lecture EveryAyah"
                  >
                    {everyAyahPlayer.playbackStatus === 'playing' ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => everyAyahPlayer.playVerseAt(Math.min(Math.max(verses.length - 1, 0), everyAyahPlayer.currentVerseIndex + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 transition-colors hover:border-emerald-500/35 hover:text-emerald-300"
                    title="Verset suivant"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <select
                  value={everyAyahPlayer.selectedReciterId}
                  onChange={(e) => everyAyahPlayer.setSelectedReciterId(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/40 focus:outline-none"
                >
                  {everyAyahPlayer.reciters.map((reciter) => (
                    <option key={reciter.id} value={reciter.id}>
                      {reciter.label}
                    </option>
                  ))}
                </select>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                  {everyAyahPlayer.duration > 0
                    ? `Ayah ${everyAyahPlayer.currentVerseIndex + 1} • ${Math.max(0, Math.round(everyAyahPlayer.currentTime))}/${Math.max(0, Math.round(everyAyahPlayer.duration))}s`
                    : 'Prêt pour une lecture ayah par ayah'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {verses.map((verse, index) => {
                const isActiveVerse = index === activeVerseIndex;
                const isPastVerse = activeVerseIndex > index;

                return (
                  <div
                    key={`${selectedSurah.id}-${verse.id}`}
                    ref={isActiveVerse ? activeVerseRef : null}
                    className={`rounded-2xl border px-4 py-4 transition-all ${
                      isActiveVerse
                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_10px_24px_rgba(16,185,129,0.15)]'
                        : isPastVerse
                          ? 'border-slate-800/50 bg-slate-900/60'
                          : 'border-slate-800/40 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                        isActiveVerse
                          ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/20'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}>
                        Verset {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {isActiveVerse && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            En cours
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => everyAyahPlayer.playVerseAt(index)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                            isActiveVerse && everyAyahPlayer.playbackStatus === 'playing'
                              ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-emerald-500/35 hover:text-emerald-300'
                          }`}
                          title={`Lire le verset ${index + 1}`}
                        >
                          {isActiveVerse && everyAyahPlayer.playbackStatus === 'playing' ? (
                            <Pause className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className={`mt-3 text-right font-serif leading-[2.25] text-2xl arabic-text ${
                      isActiveVerse ? 'text-emerald-100' : 'text-slate-200'
                    }`}>
                      {verse.text}
                    </p>

                    {verse.transliteration && (
                      <p
                        className={`mt-3 text-sm leading-relaxed cursor-pointer ${
                          isActiveVerse ? 'text-slate-200' : 'text-slate-400'
                        }`}
                        onClick={() => everyAyahPlayer.selectVerse(index)}
                      >
                        {verse.transliteration}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Floating EveryAyah player bar */}
      {selectedSurah && !isLoadingVerses && !versesError && verses.length > 0 && (
        <div className="fixed z-50 left-3 right-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] rounded-2xl border border-emerald-500/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-2xl md:left-28 md:right-4 md:bottom-4 md:h-20 md:px-5">
          <div className="absolute left-0 right-0 top-0 h-0.5 overflow-hidden rounded-t-2xl bg-slate-900 md:h-1">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-100"
              style={{
                width: everyAyahPlayer.duration > 0
                  ? `${Math.min(100, Math.max(0, (everyAyahPlayer.currentTime / everyAyahPlayer.duration) * 100))}%`
                  : '0%',
              }}
            />
          </div>

          <div className="flex h-full items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                EveryAyah • Verset {everyAyahPlayer.currentVerseIndex + 1}/{verses.length}
              </p>
              <h4 className="mt-1 truncate text-sm font-bold text-slate-100">
                {selectedSurah.name} · {selectedEveryAyahReciter?.label ?? 'Récitateur EveryAyah'}
              </h4>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {activeEveryAyahVerse?.transliteration ?? 'Lecture verset par verset'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => everyAyahPlayer.playVerseAt(Math.max(0, everyAyahPlayer.currentVerseIndex - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                aria-label="Verset précédent"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={everyAyahPlayer.togglePlayback}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400"
                aria-label={everyAyahPlayer.playbackStatus === 'playing' ? 'Mettre en pause' : 'Lire'}
              >
                {everyAyahPlayer.playbackStatus === 'playing' ? (
                  <Pause className="h-4.5 w-4.5 fill-current" />
                ) : (
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => everyAyahPlayer.playVerseAt(Math.min(verses.length - 1, everyAyahPlayer.currentVerseIndex + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                aria-label="Verset suivant"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
