import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import {
  Play, Pause, SkipForward, SkipBack, ChevronDown, Volume2, VolumeX,
  Disc, ListMusic, Search, X, Settings, Sparkles, Check, Moon, Repeat,
  Repeat1, Clock, RotateCcw, RotateCw, Gauge, SlidersHorizontal
} from 'lucide-react';
import { PLAYER_THEMES, PLAYER_THEME_IDS, type PlayerThemeId } from './player/playerThemes';
import {
  loadPlayerV2Prefs,
  savePlayerV2Prefs,
  type PlayerBarDensity,
  type PlayerV2Prefs,
  type SeekStepSeconds,
} from './player/playerV2Prefs';

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time < 0) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatSleepTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const DENSITY_META: Record<PlayerBarDensity, { label: string; barClass: string; padClass: string }> = {
  compact: {
    label: 'Compacte',
    barClass: 'md:h-[68px]',
    padClass: 'p-2.5 md:px-4',
  },
  comfortable: {
    label: 'Confort',
    barClass: 'md:h-20',
    padClass: 'p-3 md:px-5',
  },
  expanded: {
    label: 'Large',
    barClass: 'md:h-[92px]',
    padClass: 'p-3.5 md:px-6',
  },
};

export const GlobalPlayerV2: React.FC = () => {
  const {
    currentTrack,
    playbackStatus,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    togglePlay,
    seekTo,
    setVolume,
    setPlaybackSpeed,
    playNextTrack,
    playPrevTrack,
    playTrack,
    getAvailableSurahs,
    repeatMode,
    setRepeatMode,
    sleepTimer,
    setSleepTimer,
    playerTheme,
    setPlayerTheme,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [prefs, setPrefs] = useState<PlayerV2Prefs>(() => loadPlayerV2Prefs());
  const currentSurahRowRef = useRef<HTMLButtonElement | null>(null);
  const volumeWrapRef = useRef<HTMLDivElement | null>(null);

  const theme = PLAYER_THEMES[(playerTheme as PlayerThemeId)] || PLAYER_THEMES.emerald;
  const density = DENSITY_META[prefs.density];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];

  const filteredSurahs = useMemo(() => {
    if (!currentTrack) return [];
    const available = getAvailableSurahs(currentTrack.reciter, currentTrack.moshaf);
    if (!drawerSearch.trim()) return available;
    const query = drawerSearch.toLowerCase().trim();
    return available.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.englishTranslation.toLowerCase().includes(query) ||
        s.id.toString().includes(query) ||
        s.arabicName.includes(query)
    );
  }, [currentTrack, drawerSearch, getAvailableSurahs]);

  useEffect(() => {
    savePlayerV2Prefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!showPlaylist && !showPersonalize) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPlaylist(false);
        setShowPersonalize(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [showPlaylist, showPersonalize]);

  useEffect(() => {
    if (!showPlaylist) return;
    const id = window.requestAnimationFrame(() => {
      currentSurahRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [showPlaylist]);

  useEffect(() => {
    if (!showVolumePopover) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (volumeWrapRef.current && !volumeWrapRef.current.contains(target)) {
        setShowVolumePopover(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [showVolumePopover]);

  if (!currentTrack) return null;

  const updatePref = <K extends keyof PlayerV2Prefs>(key: K, value: PlayerV2Prefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const jumpBy = (delta: number) => {
    seekTo(Math.max(0, Math.min(duration || 0, currentTime + delta)));
  };

  const cycleRepeat = () => {
    const order = ['all', 'one', 'none'] as const;
    const idx = order.indexOf(repeatMode);
    setRepeatMode(order[(idx + 1) % order.length]);
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      setVolume(prevVolume || 0.8);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const openPlaylist = () => {
    setShowPersonalize(false);
    setShowVolumePopover(false);
    setShowPlaylist(true);
  };

  const openPersonalize = () => {
    setShowPlaylist(false);
    setShowVolumePopover(false);
    setShowPersonalize(true);
  };

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <>
      {/* ── Mini / Desktop bar V2 ── */}
      <div
        className={`fixed z-50 transition-all duration-300
          left-3 right-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))]
          md:left-6 md:right-6 md:mx-auto md:max-w-4xl md:bottom-6
          rounded-2xl md:rounded-3xl ${density.padClass} ${density.barClass}
          glass-panel-opaque border border-slate-800/80 md:border-slate-800/60
          shadow-2xl flex flex-col gap-2 md:gap-0 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_auto] md:items-center
          overflow-visible
          ${prefs.showGlow ? `bg-gradient-to-r ${theme.accentGlow} via-transparent to-transparent` : ''}
          ${isExpanded ? 'opacity-0 pointer-events-none translate-y-4 md:opacity-100 md:pointer-events-auto md:translate-y-0' : 'opacity-100'}
        `}
      >
        {/* Progress always visible on mobile */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900/70 md:hidden">
          <div
            className="h-full transition-[width] duration-100"
            style={{ width: `${progressPercent}%`, backgroundColor: theme.sliderAccentColor }}
          />
        </div>

        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 md:col-span-1">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="relative shrink-0 tap-feedback md:cursor-default"
            title="Agrandir"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
              <Disc className={`w-5 h-5 ${theme.glowDisc} ${playbackStatus === 'playing' ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
            </div>
          </button>

          <button
            type="button"
            onClick={openPlaylist}
            className="min-w-0 flex-1 text-left rounded-xl px-1 py-0.5 tap-feedback hover:bg-slate-900/50"
            title="Liste des sourates"
          >
            <p className={`text-xs md:text-sm font-semibold text-slate-100 truncate ${theme.accentTextHover}`}>
              {String(currentTrack.surah.id).padStart(3, '0')}. {currentTrack.surah.name}
              {prefs.showArabic && (
                <span className="ml-1.5 font-serif text-[10px] text-slate-450">
                  ({currentTrack.surah.arabicName})
                </span>
              )}
            </p>
            <p className="text-[10px] md:text-xs text-slate-400 truncate mt-0.5">
              {currentTrack.reciter.name}
            </p>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className={`md:hidden w-10 h-10 rounded-full ${theme.accent} text-slate-950 flex items-center justify-center shrink-0 tap-feedback shadow-md ${theme.accentShadow}`}
          >
            {playbackStatus === 'playing' ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Center controls */}
        <div className="hidden md:flex flex-col items-center gap-1.5 col-span-1 px-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => jumpBy(-prefs.seekStep)}
              className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900/60"
              title={`−${prefs.seekStep}s`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={playPrevTrack} className="text-slate-400 hover:text-slate-100 p-1.5">
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full ${theme.accent} text-slate-950 flex items-center justify-center shadow-lg ${theme.accentShadow} tap-feedback`}
            >
              {playbackStatus === 'playing' ? (
                <Pause className="w-4.5 h-4.5 fill-current" />
              ) : (
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              )}
            </button>
            <button type="button" onClick={playNextTrack} className="text-slate-400 hover:text-slate-100 p-1.5">
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={() => jumpBy(prefs.seekStep)}
              className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900/60"
              title={`+${prefs.seekStep}s`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-sm text-[9px] font-mono font-bold text-slate-500">
            <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-slate-800"
              style={{ background: theme.sliderBackground(progressPercent), accentColor: theme.sliderAccentColor }}
            />
            <span className="w-8 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 md:col-span-1">
          {prefs.showQuickControls && (
            <div className="hidden xl:flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={cycleRepeat}
                className={`h-8 w-8 rounded-lg border text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  repeatMode !== 'all'
                    ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                    : 'border-slate-800 text-slate-500 hover:text-slate-200'
                }`}
                title={`Répétition : ${repeatMode}`}
              >
                <RepeatIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPlaybackSpeed(playbackSpeed >= 1.5 ? 1 : playbackSpeed >= 1.25 ? 1.5 : playbackSpeed >= 1 ? 1.25 : 1)}
                className={`h-8 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                  playbackSpeed !== 1
                    ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                    : 'border-slate-800 text-slate-500 hover:text-slate-200'
                }`}
                title="Vitesse"
              >
                <Gauge className="w-3.5 h-3.5" />
                {playbackSpeed}x
              </button>

              {sleepTimer !== null && (
                <span className={`h-8 px-2 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${theme.accentBgLight} ${theme.accentBorder} ${theme.accentText}`}>
                  <Clock className="w-3 h-3 animate-pulse" />
                  {formatSleepTime(sleepTimer)}
                </span>
              )}
            </div>
          )}

          {/* Volume: inline on desktop, popover on mobile */}
          <div ref={volumeWrapRef} className="relative flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (window.matchMedia('(min-width: 768px)').matches) {
                  toggleMute();
                } else {
                  setShowVolumePopover((open) => !open);
                }
              }}
              className={`h-9 w-9 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 shrink-0 ${
                showVolumePopover || isMuted || volume === 0 ? theme.accentText : ''
              }`}
              title="Volume"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted || volume === 0 ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                setIsMuted(v === 0);
              }}
              className="hidden md:block w-16 lg:w-20 h-1.5 rounded appearance-none cursor-pointer bg-slate-800 shrink-0"
              style={{ accentColor: theme.sliderAccentColor }}
              aria-label="Volume"
            />

            {showVolumePopover && (
              <div className="md:hidden absolute bottom-[calc(100%+0.6rem)] right-0 z-[80] w-48 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Volume</span>
                  <span className={`text-[11px] font-mono font-bold ${theme.accentText}`}>
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted || volume === 0 ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    setIsMuted(v === 0);
                  }}
                  className="w-full h-1.5 rounded appearance-none cursor-pointer bg-slate-800"
                  style={{ accentColor: theme.sliderAccentColor }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={openPlaylist}
            className={`h-9 w-9 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 shrink-0 ${theme.accentTextHover}`}
            title="Sourates"
          >
            <ListMusic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={openPersonalize}
            className={`h-9 w-9 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 shrink-0 ${
              showPersonalize ? `${theme.accentText} ${theme.accentBgLight}` : ''
            }`}
            title="Personnaliser"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 shrink-0"
            title="Plein écran"
          >
            <ChevronDown className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Mobile seek row */}
        {prefs.density !== 'compact' && (
          <div className="flex md:hidden items-center gap-2 px-0.5">
            <button type="button" onClick={() => jumpBy(-prefs.seekStep)} className="text-slate-500 p-1">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="flex-1 h-1 rounded appearance-none cursor-pointer bg-slate-800"
              style={{ background: theme.sliderBackground(progressPercent), accentColor: theme.sliderAccentColor }}
            />
            <button type="button" onClick={() => jumpBy(prefs.seekStep)} className="text-slate-500 p-1">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={playNextTrack} className="text-slate-400 p-1">
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded mobile sheet ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col bg-slate-950 animate-page-enter">
          <div className={`absolute inset-0 bg-gradient-to-b ${theme.accentGlow} via-transparent to-transparent pointer-events-none`} />
          <div className="relative flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-2">
            <button type="button" onClick={() => setIsExpanded(false)} className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-300">
              <ChevronDown className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Player V2</span>
            <button type="button" onClick={openPersonalize} className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className={`w-44 h-44 rounded-full border ${theme.accentBorderActive} flex items-center justify-center bg-slate-900/50 ${playbackStatus === 'playing' ? 'animate-[spin_18s_linear_infinite]' : ''}`}>
              <Disc className={`w-16 h-16 ${theme.glowDisc}`} />
            </div>

            <button type="button" onClick={openPlaylist} className="text-center w-full tap-feedback">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}>Sourate {currentTrack.surah.id}</p>
              <h2 className="text-2xl font-black text-slate-100 mt-1">{currentTrack.surah.name}</h2>
              {prefs.showArabic && (
                <p className={`font-serif text-xl mt-1 ${theme.accentText}`}>{currentTrack.surah.arabicName}</p>
              )}
              <p className="text-sm text-slate-400 mt-2">{currentTrack.reciter.name}</p>
            </button>

            <div className="w-full max-w-sm">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded appearance-none cursor-pointer bg-slate-900"
                style={{ background: theme.sliderBackground(progressPercent), accentColor: theme.sliderAccentColor }}
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <button type="button" onClick={() => jumpBy(-prefs.seekStep)} className="text-slate-400 p-2"><RotateCcw className="w-5 h-5" /></button>
              <button type="button" onClick={playPrevTrack} className="text-slate-300 p-2"><SkipBack className="w-6 h-6 fill-current" /></button>
              <button type="button" onClick={togglePlay} className={`w-16 h-16 rounded-full ${theme.accent} text-slate-950 flex items-center justify-center shadow-xl ${theme.accentShadow}`}>
                {playbackStatus === 'playing' ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </button>
              <button type="button" onClick={playNextTrack} className="text-slate-300 p-2"><SkipForward className="w-6 h-6 fill-current" /></button>
              <button type="button" onClick={() => jumpBy(prefs.seekStep)} className="text-slate-400 p-2"><RotateCw className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button type="button" onClick={cycleRepeat} className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${repeatMode !== 'all' ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}` : 'border-slate-800 text-slate-400'}`}>
                <RepeatIcon className="w-3.5 h-3.5" /> {repeatMode}
              </button>
              <button type="button" onClick={openPlaylist} className="px-3 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5" /> Sourates
              </button>
              <button type="button" onClick={toggleMute} className="px-3 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                Volume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Personalization panel ── */}
      {showPersonalize && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-label="Fermer" onClick={() => setShowPersonalize(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:mx-4 animate-[slide-up_0.28s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-900 bg-slate-950/95 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${theme.accentBgLight} ${theme.accentText}`}>
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-100">Personnaliser</h3>
                  <p className="text-[11px] text-slate-500">Player Bar V2</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowPersonalize(false)} className="h-9 w-9 rounded-full border border-slate-800 flex items-center justify-center text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-6">
              {/* Theme */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Thème</h4>
                  <span className="text-[11px] text-slate-400">{theme.name}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {PLAYER_THEME_IDS.map((id) => {
                    const t = PLAYER_THEMES[id];
                    const active = playerTheme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlayerTheme(id)}
                        className={`h-10 rounded-xl border flex items-center justify-center ${active ? `ring-2 ${t.accentRing} ${t.accentBorderActive}` : 'border-slate-800'}`}
                        style={{ backgroundColor: `${t.sliderAccentColor}22` }}
                        title={t.name}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.sliderAccentColor }} />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Density */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Densité de la barre</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(DENSITY_META) as PlayerBarDensity[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updatePref('density', key)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-bold ${
                        prefs.density === key
                          ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      {DENSITY_META[key].label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Seek step */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Saut temporel</h4>
                <div className="grid grid-cols-3 gap-2">
                  {([5, 10, 15] as SeekStepSeconds[]).map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => updatePref('seekStep', step)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-bold ${
                        prefs.seekStep === step
                          ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      ±{step}s
                    </button>
                  ))}
                </div>
              </section>

              {/* Speed */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Vitesse</h4>
                <div className="flex flex-wrap gap-1.5">
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold ${
                        playbackSpeed === speed
                          ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </section>

              {/* Repeat */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Répétition</h4>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'all' as const, label: 'Toutes' },
                    { id: 'one' as const, label: 'Une' },
                    { id: 'none' as const, label: 'Off' },
                  ]).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setRepeatMode(mode.id)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-bold ${
                        repeatMode === mode.id
                          ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Sleep */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Minuteur</h4>
                  {sleepTimer !== null && (
                    <span className={`text-[10px] font-mono font-bold ${theme.accentText} flex items-center gap-1`}>
                      <Clock className="w-3 h-3" /> {formatSleepTime(sleepTimer)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { value: null, label: 'Off' },
                    { value: 15 * 60, label: '15m' },
                    { value: 30 * 60, label: '30m' },
                    { value: 45 * 60, label: '45m' },
                    { value: 60 * 60, label: '1h' },
                  ].map((opt) => {
                    const active =
                      (opt.value === null && sleepTimer === null) ||
                      (opt.value !== null && sleepTimer !== null && Math.abs(sleepTimer - opt.value) < 10);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSleepTimer(opt.value)}
                        className={`py-2 rounded-xl border text-[10px] font-bold ${
                          active
                            ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                            : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Toggles */}
              <section className="flex flex-col gap-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Affichage</h4>
                {(
                  [
                    { key: 'showArabic' as const, label: 'Afficher le nom arabe', icon: Moon },
                    { key: 'showGlow' as const, label: 'Lueur thématique', icon: Sparkles },
                    { key: 'showQuickControls' as const, label: 'Raccourcis (repeat / vitesse)', icon: Gauge },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const on = prefs[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updatePref(item.key, !on)}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left ${
                        on ? `${theme.accentBorder} ${theme.accentBgLight}` : 'border-slate-800 bg-slate-900/40'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-sm text-slate-200">
                        <Icon className={`w-4 h-4 ${on ? theme.accentText : 'text-slate-500'}`} />
                        {item.label}
                      </span>
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${on ? `${theme.accent} border-transparent text-slate-950` : 'border-slate-700 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ── Surah list drawer ── */}
      {showPlaylist && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" aria-label="Fermer" onClick={() => setShowPlaylist(false)} />
          <div className="relative z-10 flex w-full max-w-lg max-h-[82dvh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:mx-4 animate-[slide-up_0.28s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-slate-700" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-900">
              <div>
                <h3 className="font-bold text-slate-100">Sourates</h3>
                <p className="text-[11px] text-slate-500">{currentTrack.reciter.name} · {filteredSurahs.length}</p>
              </div>
              <button type="button" onClick={() => setShowPlaylist(false)} className="h-9 w-9 rounded-full border border-slate-800 flex items-center justify-center text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="search"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Nom, numéro ou arabe…"
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/70 border border-slate-800 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                />
                {drawerSearch && (
                  <button type="button" onClick={() => setDrawerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <ul>
                {filteredSurahs.map((surah) => {
                  const isCurrent = currentTrack.surah.id === surah.id;
                  const isPlaying = isCurrent && playbackStatus === 'playing';
                  return (
                    <li key={surah.id}>
                      <button
                        ref={isCurrent ? currentSurahRowRef : undefined}
                        type="button"
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else {
                            playTrack(currentTrack.reciter, currentTrack.moshaf, surah);
                            setShowPlaylist(false);
                            setDrawerSearch('');
                          }
                        }}
                        className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${isCurrent ? theme.accentBgLight : 'hover:bg-slate-900/80'}`}
                      >
                        <span className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums ${isCurrent ? `${theme.accentText} bg-slate-950/50` : 'bg-slate-900 text-slate-500'}`}>
                          {String(surah.id).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold truncate ${isCurrent ? theme.accentText : 'text-slate-100'}`}>{surah.name}</span>
                          <span className="block text-[11px] text-slate-500 truncate">{surah.englishTranslation}</span>
                        </span>
                        {prefs.showArabic && (
                          <span className={`font-serif text-lg arabic-text ${isCurrent ? theme.accentText : 'text-slate-400'}`}>{surah.arabicName}</span>
                        )}
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isCurrent ? `${theme.accent} text-slate-950` : 'opacity-0'}`}>
                          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalPlayerV2;
