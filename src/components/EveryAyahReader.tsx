import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Surah } from '../types';
import { SURAHS } from '../data/surahs';
import { useSurahVerses } from '../hooks/useSurahVerses';
import { useEveryAyahPlayer } from '../hooks/useEveryAyahPlayer';
import { useAudio } from '../context/AudioContext';
import { EVERY_AYAH_RECITERS } from '../data/everyAyahReciters';
import {
  Search,
  Play,
  Pause,
  BookOpenText,
  ScrollText,
  LoaderCircle,
  Radio,
  SkipBack,
  SkipForward,
  Sparkles
} from 'lucide-react';

const AYAT_AL_KURSI = {
  surahId: 2,
  verseId: 255,
  name: "Ayat al-Kursi (Le Verset du Trône)",
  arabicText: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
  translation: "Allah! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même «al-Qayyûm». Ni somnolence ni sommeil ne S'emparent de Lui. A Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission? Il connaît leur passé et leur futur. Et, de Sa science, ils n'embrassent que ce qu'Il veut. Son Trône «Kursî» déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.",
  transliteration: "Allāhu Lā 'Ilāha 'Illā Huwa Al-Ĥayyu Al-Qayyūmu ۚ Lā Ta'khudhuhu Sinatun Wa Lā Nawmun ۚ Lahu Mā Fī As-Samāwāti Wa Mā Fī Al-'Arđi ۗ Man Dhā Al-Ladhī Yashfa'u `Indahu 'Illā Bi-'Idhnihi ۚ Ya'lamu Mā Bayna 'Aydīhim Wa Mā Khalfahum ۖ Wa Lā Yuĥīţūna Bishay'in Min `Ilmihi 'Illā Bimā Shā'a ۚ Wasi'a Kursiyyuhu As-Samāwāti Wa Al-'Arđa ۖ Wa Lā Ya'ūduhu Ĥifžuhumā ۚ Wa Huwa Al-`Alīyu Al-`Ažīmu"
};

const useAyatAlKursiPlayer = (pauseMainPlayer: () => void) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentReciterIndex, setCurrentReciterIndex] = useState(0);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'buffering' | 'playing' | 'paused' | 'error'>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reciterIndexRef = useRef(0);
  const autoplayNextRef = useRef(true);

  useEffect(() => {
    reciterIndexRef.current = currentReciterIndex;
  }, [currentReciterIndex]);

  useEffect(() => {
    autoplayNextRef.current = autoplayNext;
  }, [autoplayNext]);

  const reciters = EVERY_AYAH_RECITERS;
  const activeReciter = reciters[currentReciterIndex];

  const playReciter = useCallback((index: number, autoplay: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    const reciter = EVERY_AYAH_RECITERS[index];
    if (!reciter) return;

    setCurrentReciterIndex(index);
    audio.src = `https://everyayah.com/data/${reciter.folder}/002255.mp3`;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setPlaybackStatus('buffering');

    // Pause the main audio player in AudioContext
    pauseMainPlayer();

    if (autoplay) {
      audio.play()
        .then(() => {
          setPlaybackStatus('playing');
          setIsPlaying(true);
        })
        .catch(() => {
          setPlaybackStatus('error');
          setIsPlaying(false);
        });
    } else {
      setPlaybackStatus('paused');
      setIsPlaying(false);
    }
  }, [pauseMainPlayer]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playbackStatus === 'playing') {
      audio.pause();
      setPlaybackStatus('paused');
      setIsPlaying(false);
      return;
    }

    // Pause the main audio player in AudioContext
    pauseMainPlayer();

    if (!audio.src) {
      playReciter(reciterIndexRef.current, true);
      return;
    }

    audio.play()
      .then(() => {
        setPlaybackStatus('playing');
        setIsPlaying(true);
      })
      .catch(() => {
        setPlaybackStatus('error');
        setIsPlaying(false);
      });
  }, [playbackStatus, playReciter, pauseMainPlayer]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onPlay = () => {
      setPlaybackStatus('playing');
      setIsPlaying(true);
    };
    const onPause = () => {
      setPlaybackStatus('paused');
      setIsPlaying(false);
    };
    const onWaiting = () => setPlaybackStatus('buffering');
    const onPlaying = () => setPlaybackStatus('playing');
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    
    const onEnded = () => {
      if (autoplayNextRef.current) {
        const nextIndex = (reciterIndexRef.current + 1) % EVERY_AYAH_RECITERS.length;
        playReciter(nextIndex, true);
      } else {
        setPlaybackStatus('paused');
        setIsPlaying(false);
      }
    };
    const onError = () => {
      setPlaybackStatus('error');
      setIsPlaying(false);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [playReciter]);

  return {
    reciters,
    currentReciterIndex,
    activeReciter,
    isPlaying,
    playbackStatus,
    currentTime,
    duration,
    autoplayNext,
    setAutoplayNext,
    playReciter,
    togglePlayback,
  };
};

export const EveryAyahReader: React.FC = () => {
  const [isAyatAlKursiMode, setIsAyatAlKursiMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const { pause: pauseMainPlayer } = useAudio();

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

  // Custom player for Ayat al-Kursi
  const ayatAlKursiPlayer = useAyatAlKursiPlayer(pauseMainPlayer);

  useEffect(() => {
    if (activeVerseIndex < 0) return;
    activeVerseRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeVerseIndex]);

  // Coordinated pauses when switching tabs/modes
  useEffect(() => {
    if (isAyatAlKursiMode) {
      if (everyAyahPlayer.playbackStatus === 'playing') {
        everyAyahPlayer.togglePlayback();
      }
    } else {
      if (ayatAlKursiPlayer.playbackStatus === 'playing') {
        ayatAlKursiPlayer.togglePlayback();
      }
    }
  }, [isAyatAlKursiMode]);

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Switcher Tabs */}
      <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-800">
        <button
          onClick={() => setIsAyatAlKursiMode(false)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            !isAyatAlKursiMode
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lecteur par Verset
        </button>
        <button
          onClick={() => setIsAyatAlKursiMode(true)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            isAyatAlKursiMode
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          Playliste Ayat al-Kursi
        </button>
      </div>

      {!isAyatAlKursiMode ? (
        <>
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
                        onClick={() => {
                          pauseMainPlayer();
                          everyAyahPlayer.playVerseAt(Math.max(0, everyAyahPlayer.currentVerseIndex - 1));
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 transition-colors hover:border-emerald-500/35 hover:text-emerald-300"
                        title="Verset précédent"
                      >
                        <SkipBack className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pauseMainPlayer();
                          everyAyahPlayer.togglePlayback();
                        }}
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
                        onClick={() => {
                          pauseMainPlayer();
                          everyAyahPlayer.playVerseAt(Math.min(Math.max(verses.length - 1, 0), everyAyahPlayer.currentVerseIndex + 1));
                        }}
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
                              onClick={() => {
                                pauseMainPlayer();
                                everyAyahPlayer.playVerseAt(index);
                              }}
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
        </>
      ) : (
        /* Ayat al-Kursi special Playlist mode */
        <div className="flex flex-col gap-5">
          {/* Ayat al-Kursi text showcase */}
          <div className="glass-panel rounded-3xl border border-slate-800/70 p-5 flex flex-col gap-4 relative overflow-hidden bg-slate-950/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-black text-sm text-slate-100 uppercase tracking-widest">Le Verset du Trône</h3>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Al-Baqarah (2:255)
              </span>
            </div>

            {/* Arabic */}
            <div className="py-4">
              <p className="text-right font-serif leading-[2.5] text-3xl text-emerald-100 drop-shadow-[0_0_12px_rgba(16,185,129,0.2)] arabic-text select-none">
                {AYAT_AL_KURSI.arabicText}
              </p>
            </div>

            {/* Phonetic and Translation details */}
            <div className="flex flex-col gap-4 border-t border-slate-850 pt-4">
              <div>
                <span className="inline-block rounded-md bg-emerald-400/15 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 mb-2">
                  Phonétique
                </span>
                <p className="text-sm leading-relaxed text-slate-300 italic font-medium">
                  {AYAT_AL_KURSI.transliteration}
                </p>
              </div>

              <div>
                <span className="inline-block rounded-md bg-slate-800/80 border border-slate-750 text-slate-300 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 mb-2">
                  Traduction
                </span>
                <p className="text-sm leading-relaxed text-slate-400 font-medium">
                  {AYAT_AL_KURSI.translation}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="glass-panel rounded-3xl border border-slate-800/70 p-4 bg-slate-950/40">
            <div className="flex flex-col gap-4">
              {/* Audio progress & main control bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-emerald-400">
                    {ayatAlKursiPlayer.activeReciter?.label ?? 'Récitateur'}
                  </span>
                  <span>
                    {ayatAlKursiPlayer.duration > 0
                      ? `${Math.round(ayatAlKursiPlayer.currentTime)}s / ${Math.round(ayatAlKursiPlayer.duration)}s`
                      : 'Prêt'}
                  </span>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900/80 border border-slate-800">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-[width] duration-100 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    style={{
                      width: ayatAlKursiPlayer.duration > 0
                        ? `${(ayatAlKursiPlayer.currentTime / ayatAlKursiPlayer.duration) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              {/* Autoplay & Play Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-850 pt-3">
                {/* Autoplay Next Reciter Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => ayatAlKursiPlayer.setAutoplayNext(!ayatAlKursiPlayer.autoplayNext)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      ayatAlKursiPlayer.autoplayNext ? 'bg-emerald-500' : 'bg-slate-850'
                    }`}
                    aria-label="Enchaîner les voix"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                        ayatAlKursiPlayer.autoplayNext ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-300">Enchaîner les Récitateurs</p>
                    <p className="text-[10px] text-slate-500">Passe automatiquement au récitant suivant après la fin.</p>
                  </div>
                </div>

                {/* Play Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIndex = (ayatAlKursiPlayer.currentReciterIndex - 1 + ayatAlKursiPlayer.reciters.length) % ayatAlKursiPlayer.reciters.length;
                      ayatAlKursiPlayer.playReciter(prevIndex, true);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                    title="Précédent"
                  >
                    <SkipBack className="h-4.5 w-4.5" />
                  </button>

                  <button
                    type="button"
                    onClick={ayatAlKursiPlayer.togglePlayback}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:bg-emerald-400"
                    title="Lecture"
                  >
                    {ayatAlKursiPlayer.playbackStatus === 'playing' ? (
                      <Pause className="h-6 w-6 fill-current" />
                    ) : (
                      <Play className="h-6 w-6 fill-current ml-1" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIndex = (ayatAlKursiPlayer.currentReciterIndex + 1) % ayatAlKursiPlayer.reciters.length;
                      ayatAlKursiPlayer.playReciter(nextIndex, true);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                    title="Suivant"
                  >
                    <SkipForward className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reciter Grid selection */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-2">
              Sélectionnez une Voix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[18rem] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {ayatAlKursiPlayer.reciters.map((reciter, idx) => {
                const isActive = idx === ayatAlKursiPlayer.currentReciterIndex;
                const isPlayingThis = isActive && ayatAlKursiPlayer.playbackStatus === 'playing';

                return (
                  <button
                    key={reciter.id}
                    onClick={() => ayatAlKursiPlayer.playReciter(idx, true)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.1)]'
                        : 'border-slate-850 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{reciter.label}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Dossier EveryAyah : {reciter.folder}</p>
                    </div>

                    {isActive && (
                      <div className="flex gap-0.5 items-end justify-center h-3 w-3 shrink-0 ml-2">
                        {isPlayingThis ? (
                          <>
                            <div className="w-0.5 bg-emerald-400 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }} />
                            <div className="w-0.5 bg-emerald-400 animate-[shimmer_0.6s_infinite_alternate] h-2/3 rounded-full" style={{ animationDelay: '0.3s' }} />
                            <div className="w-0.5 bg-emerald-400 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }} />
                          </>
                        ) : (
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating EveryAyah player bar (normal mode) */}
      {!isAyatAlKursiMode && selectedSurah && !isLoadingVerses && !versesError && verses.length > 0 && (
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
                onClick={() => {
                  pauseMainPlayer();
                  everyAyahPlayer.playVerseAt(Math.max(0, everyAyahPlayer.currentVerseIndex - 1));
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                aria-label="Verset précédent"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  pauseMainPlayer();
                  everyAyahPlayer.togglePlayback();
                }}
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
                onClick={() => {
                  pauseMainPlayer();
                  everyAyahPlayer.playVerseAt(Math.min(verses.length - 1, everyAyahPlayer.currentVerseIndex + 1));
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                aria-label="Verset suivant"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Ayat al-Kursi player bar */}
      {isAyatAlKursiMode && ayatAlKursiPlayer.playbackStatus !== 'idle' && (
        <div className="fixed z-50 left-3 right-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] rounded-2xl border border-emerald-500/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-2xl md:left-28 md:right-4 md:bottom-4 md:h-20 md:px-5">
          <div className="absolute left-0 right-0 top-0 h-0.5 overflow-hidden rounded-t-2xl bg-slate-900 md:h-1">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-100"
              style={{
                width: ayatAlKursiPlayer.duration > 0
                  ? `${Math.min(100, Math.max(0, (ayatAlKursiPlayer.currentTime / ayatAlKursiPlayer.duration) * 100))}%`
                  : '0%',
              }}
            />
          </div>

          <div className="flex h-full items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Playliste Ayat al-Kursi
              </p>
              <h4 className="mt-1 truncate text-sm font-bold text-slate-100">
                Al-Baqarah (2:255) · {ayatAlKursiPlayer.activeReciter?.label ?? 'Récitateur'}
              </h4>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {AYAT_AL_KURSI.transliteration}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const prevIndex = (ayatAlKursiPlayer.currentReciterIndex - 1 + ayatAlKursiPlayer.reciters.length) % ayatAlKursiPlayer.reciters.length;
                  ayatAlKursiPlayer.playReciter(prevIndex, true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                aria-label="Récitateur précédent"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={ayatAlKursiPlayer.togglePlayback}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400"
                aria-label={ayatAlKursiPlayer.playbackStatus === 'playing' ? 'Mettre en pause' : 'Lire'}
              >
                {ayatAlKursiPlayer.playbackStatus === 'playing' ? (
                  <Pause className="h-4.5 w-4.5 fill-current" />
                ) : (
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextIndex = (ayatAlKursiPlayer.currentReciterIndex + 1) % ayatAlKursiPlayer.reciters.length;
                  ayatAlKursiPlayer.playReciter(nextIndex, true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                aria-label="Récitateur suivant"
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
