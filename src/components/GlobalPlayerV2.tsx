import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import {
  Play, Pause, SkipForward, SkipBack, ChevronDown, Volume2, VolumeX,
  Disc, ListMusic, Search, X, Settings, Sparkles, Check, Moon, Repeat,
  Repeat1, Clock, RotateCcw, RotateCw, Gauge, SlidersHorizontal, MonitorSmartphone
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
    remoteSession,
    takeOverRemoteSession,
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
  const [liveRemotePos, setLiveRemotePos] = useState(0);
  const remoteClockAnchorRef = useRef<{ pos: number; at: number; key: string } | null>(null);

  const theme = PLAYER_THEMES[(playerTheme as PlayerThemeId)] || PLAYER_THEMES.emerald;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];

  // Smooth second-by-second clock for remote playback banner
  useEffect(() => {
    if (!remoteSession) {
      remoteClockAnchorRef.current = null;
      setLiveRemotePos(0);
      return;
    }

    const key = `${remoteSession.deviceId}:${remoteSession.surahId}:${remoteSession.reciterId}`;
    const serverPos = Math.max(0, remoteSession.positionSeconds || 0);
    const serverAt = Date.parse(remoteSession.updatedAt) || Date.now();
    const prev = remoteClockAnchorRef.current;

    if (!prev || prev.key !== key) {
      remoteClockAnchorRef.current = { pos: serverPos, at: serverAt, key };
    } else {
      const estimatedNow = prev.pos + (Date.now() - prev.at) / 1000;
      // Resync only on meaningful drift to avoid second jumps
      if (Math.abs(estimatedNow - serverPos) > 1.25) {
        remoteClockAnchorRef.current = { pos: serverPos, at: serverAt, key };
      }
    }

    const tick = () => {
      const anchor = remoteClockAnchorRef.current;
      if (!anchor) return;
      setLiveRemotePos(Math.max(0, anchor.pos + (Date.now() - anchor.at) / 1000));
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [remoteSession]);

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

  useEffect(() => {
    if (!isExpanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isExpanded]);

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
      {/* ── Mini bar: docks with navbar on mobile, full on desktop ── */}
      <div
        className={`fixed z-[51] transition-all duration-300
          left-1/2 -translate-x-1/2 w-[95%] max-w-md
          bottom-[calc(5.35rem+env(safe-area-inset-bottom,0px))]
          md:left-6 md:right-6 md:translate-x-0 md:w-auto md:mx-auto md:max-w-4xl md:bottom-6
          rounded-t-3xl rounded-b-none md:rounded-3xl p-2 md:px-5 md:py-3
          glass-panel-opaque border border-slate-700/50 border-b-0 md:border md:border-slate-800/60
          shadow-[0_-8px_24px_rgba(0,0,0,0.35)] md:shadow-2xl
          flex items-center gap-2 md:gap-0 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_auto] md:items-center
          overflow-visible md:h-20
          ${prefs.showGlow ? `bg-gradient-to-r ${theme.accentGlow} via-transparent to-transparent` : ''}
          ${isExpanded ? 'opacity-0 pointer-events-none translate-y-3 md:opacity-100 md:pointer-events-auto md:translate-y-0' : 'opacity-100'}
        `}
      >
        {remoteSession && !isExpanded && (
          <div className="absolute -top-[2.85rem] left-0 right-0 z-10 px-0.5">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-slate-950/95 px-3 py-2 shadow-lg backdrop-blur-xl">
              <MonitorSmartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-100 truncate">
                  Écoute sur un autre appareil
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  <span className="font-mono text-emerald-300/90 tabular-nums">
                    {formatTime(liveRemotePos)}
                  </span>
                  {remoteSession.deviceLabel ? ` · ${remoteSession.deviceLabel}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void takeOverRemoteSession();
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-950 tap-feedback ${theme.accent}`}
              >
                Basculer ici
              </button>
            </div>
          </div>
        )}

        {/* Seam with navbar — mobile dock only */}
        <div className="absolute bottom-0 left-3 right-3 h-px bg-slate-700/40 md:hidden" aria-hidden />
        {/* Thin progress — mobile only */}
        <div className="absolute top-0 left-3 right-3 h-[3px] rounded-full bg-slate-900/80 overflow-hidden md:hidden">
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{ width: `${progressPercent}%`, backgroundColor: theme.sliderAccentColor }}
          />
        </div>

        {/* Track info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 md:col-span-1 md:gap-3 pt-1 md:pt-0">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="relative shrink-0 tap-feedback md:pointer-events-none"
            title="Agrandir le lecteur"
            aria-label="Agrandir le lecteur"
          >
            <div className="w-11 h-11 md:w-11 md:h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
              <Disc className={`w-5 h-5 ${theme.glowDisc} ${playbackStatus === 'playing' ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="min-w-0 flex-1 text-left rounded-xl px-0.5 py-1 tap-feedback md:hidden"
            title="Ouvrir le lecteur"
          >
            <p className="text-sm font-semibold text-slate-100 truncate">
              {currentTrack.surah.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentTrack.reciter.name}
            </p>
          </button>

          <button
            type="button"
            onClick={openPlaylist}
            className="hidden md:block min-w-0 flex-1 text-left rounded-xl px-1 py-0.5 tap-feedback hover:bg-slate-900/50"
            title="Liste des sourates"
          >
            <p className={`text-sm font-semibold text-slate-100 truncate ${theme.accentTextHover}`}>
              {String(currentTrack.surah.id).padStart(3, '0')}. {currentTrack.surah.name}
              {prefs.showArabic && (
                <span className="ml-1.5 font-serif text-[10px] text-slate-450">
                  ({currentTrack.surah.arabicName})
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {currentTrack.reciter.name}
            </p>
          </button>

          {/* Mobile primary controls — prev / play / next */}
          <div className="flex items-center gap-1 shrink-0 md:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playPrevTrack();
              }}
              className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center tap-feedback"
              aria-label="Précédent"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className={`w-12 h-12 rounded-full ${theme.accent} text-slate-950 flex items-center justify-center tap-feedback shadow-md ${theme.accentShadow}`}
              aria-label={playbackStatus === 'playing' ? 'Pause' : 'Lecture'}
            >
              {playbackStatus === 'playing' ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playNextTrack();
              }}
              className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center tap-feedback"
              aria-label="Suivant"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Center controls — desktop */}
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

        {/* Right tools — desktop only on mini bar */}
        <div className="hidden md:flex items-center justify-end gap-1.5 shrink-0 md:col-span-1">
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

          <div ref={volumeWrapRef} className="relative flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className={`h-9 w-9 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 shrink-0 ${
                isMuted || volume === 0 ? theme.accentText : ''
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
              className="w-16 lg:w-20 h-1.5 rounded appearance-none cursor-pointer bg-slate-800 shrink-0"
              style={{ accentColor: theme.sliderAccentColor }}
              aria-label="Volume"
            />
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
        </div>
      </div>

      {/* ── Expanded mobile sheet ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col bg-slate-950">
          <div className={`absolute inset-0 bg-gradient-to-b ${theme.accentGlow} via-transparent to-transparent pointer-events-none`} />

          {/* Clear collapse header */}
          <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-[calc(0.85rem+env(safe-area-inset-top,0px))] pb-3 border-b border-slate-900/80">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-slate-700 bg-slate-900 text-slate-100 font-bold text-sm tap-feedback"
              aria-label="Réduire le lecteur"
            >
              <ChevronDown className="w-5 h-5" />
              Réduire
            </button>
            <button
              type="button"
              onClick={openPersonalize}
              className="h-11 w-11 rounded-full border border-slate-800 flex items-center justify-center text-slate-300 tap-feedback"
              aria-label="Options"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {remoteSession && (
            <div className="relative z-10 mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-slate-900/90 px-3 py-2.5">
              <MonitorSmartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100">Écoute sur un autre appareil</p>
                <p className="text-[10px] text-slate-400 truncate">
                  <span className="font-mono text-emerald-300/90 tabular-nums">
                    {formatTime(liveRemotePos)}
                  </span>
                  {remoteSession.deviceLabel ? ` · ${remoteSession.deviceLabel}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void takeOverRemoteSession();
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-950 tap-feedback ${theme.accent}`}
              >
                Basculer ici
              </button>
            </div>
          )}

          <div className="relative z-10 flex-1 flex flex-col px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] overflow-y-auto">
            <button
              type="button"
              onClick={openPlaylist}
              className="text-center w-full tap-feedback mb-6"
            >
              <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.accentText}`}>
                Sourate {currentTrack.surah.id}
              </p>
              <h2 className="text-2xl font-black text-slate-100 mt-1.5 leading-tight">
                {currentTrack.surah.name}
              </h2>
              {prefs.showArabic && (
                <p className={`font-serif text-xl mt-1.5 ${theme.accentText}`}>
                  {currentTrack.surah.arabicName}
                </p>
              )}
              <p className="text-sm text-slate-400 mt-2">{currentTrack.reciter.name}</p>
            </button>

            <div className="mx-auto mb-7 w-28 h-28 rounded-full border border-slate-800 bg-slate-900/60 flex items-center justify-center">
              <Disc className={`w-12 h-12 ${theme.glowDisc} ${playbackStatus === 'playing' ? 'animate-[spin_12s_linear_infinite]' : ''}`} />
            </div>

            <div className="w-full mb-6">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-900"
                style={{ background: theme.sliderBackground(progressPercent), accentColor: theme.sliderAccentColor }}
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-2.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => jumpBy(-prefs.seekStep)}
                className="w-12 h-12 rounded-full border border-slate-800 bg-slate-900 text-slate-300 flex items-center justify-center tap-feedback"
                aria-label={`Reculer de ${prefs.seekStep} secondes`}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={playPrevTrack}
                className="w-12 h-12 rounded-full border border-slate-800 bg-slate-900 text-slate-200 flex items-center justify-center tap-feedback"
                aria-label="Précédent"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className={`w-[4.25rem] h-[4.25rem] rounded-full ${theme.accent} text-slate-950 flex items-center justify-center shadow-xl ${theme.accentShadow} tap-feedback`}
                aria-label={playbackStatus === 'playing' ? 'Pause' : 'Lecture'}
              >
                {playbackStatus === 'playing' ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>
              <button
                type="button"
                onClick={playNextTrack}
                className="w-12 h-12 rounded-full border border-slate-800 bg-slate-900 text-slate-200 flex items-center justify-center tap-feedback"
                aria-label="Suivant"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => jumpBy(prefs.seekStep)}
                className="w-12 h-12 rounded-full border border-slate-800 bg-slate-900 text-slate-300 flex items-center justify-center tap-feedback"
                aria-label={`Avancer de ${prefs.seekStep} secondes`}
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
              <button
                type="button"
                onClick={cycleRepeat}
                className={`h-12 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 tap-feedback ${
                  repeatMode !== 'all'
                    ? `${theme.accentBgLight} ${theme.accentBorderActive} ${theme.accentText}`
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                <RepeatIcon className="w-4 h-4" />
                {repeatMode === 'one' ? '1' : repeatMode === 'none' ? 'Off' : 'All'}
              </button>
              <button
                type="button"
                onClick={openPlaylist}
                className="h-12 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 tap-feedback"
              >
                <ListMusic className="w-4 h-4" />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setShowVolumePopover(true)}
                className="h-12 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 tap-feedback"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                Volume
              </button>
            </div>

            {/* Always-visible collapse CTA at bottom */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="mt-4 w-full h-12 rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 tap-feedback"
            >
              <ChevronDown className="w-5 h-5" />
              Réduire le lecteur
            </button>
          </div>

          {/* Mobile volume sheet */}
          {showVolumePopover && (
            <div className="absolute inset-0 z-20 flex items-end bg-slate-950/60" onClick={() => setShowVolumePopover(false)}>
              <div
                className="w-full rounded-t-3xl border border-slate-800 bg-slate-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-100">Volume</span>
                  <span className={`text-sm font-mono font-bold ${theme.accentText}`}>
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={toggleMute} className="h-11 w-11 rounded-full border border-slate-800 flex items-center justify-center text-slate-300">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
                    className="flex-1 h-2 rounded appearance-none cursor-pointer bg-slate-800"
                    style={{ accentColor: theme.sliderAccentColor }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowVolumePopover(false)}
                  className="mt-4 w-full h-11 rounded-xl border border-slate-700 text-sm font-bold text-slate-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
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
