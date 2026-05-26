import React, { useState, useMemo } from 'react';
import { useAudio } from '../context/AudioContext';
import { 
  Play, Pause, SkipForward, SkipBack, 
  ChevronDown, Volume2, VolumeX, Gauge, 
  Disc, AlertCircle, RefreshCw, RotateCcw,
  RotateCw, ListMusic, Search, X 
} from 'lucide-react';

export const GlobalPlayer: React.FC = () => {
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
    getAvailableSurahs
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  // Time formatter (seconds -> mm:ss)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const speedOptions = [0.8, 1.0, 1.25, 1.5, 2.0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Filter available surahs inside the drawer search
  const filteredDrawerSurahs = useMemo(() => {
    if (!currentTrack) return [];
    const available = getAvailableSurahs(currentTrack.reciter, currentTrack.moshaf);
    if (!drawerSearch.trim()) return available;
    const query = drawerSearch.toLowerCase().trim();
    return available.filter(
      s => 
        s.name.toLowerCase().includes(query) ||
        s.id.toString().includes(query) ||
        s.arabicName.includes(query)
    );
  }, [currentTrack, drawerSearch, getAvailableSurahs]);

  if (!currentTrack) return null;

  return (
    <>
      {/* 1. RESPONSIVE PLAYER BAR: Floating mini-player on mobile, Full Player Bar on desktop */}
      <div 
        onClick={() => {
          if (window.innerWidth < 768) setIsExpanded(true);
        }}
        className={`fixed z-50 transition-all duration-300
          left-3 right-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] rounded-2xl p-3 glass-panel-opaque border border-slate-800/80 shadow-2xl flex flex-row items-center justify-between
          cursor-pointer active:scale-[0.98]
          md:left-0 md:right-0 md:bottom-0 md:h-24 md:rounded-none md:border-x-0 md:border-b-0 md:px-8 md:bg-slate-950/98 md:backdrop-blur-2xl md:grid md:grid-cols-3 md:cursor-default md:active:scale-100 md:transform-none md:shadow-[0_-15px_50px_rgba(0,0,0,0.6)]
          ${isExpanded ? 'opacity-0 pointer-events-none translate-y-4 md:opacity-100 md:pointer-events-auto md:translate-y-0' : 'opacity-100 translate-y-0'}
        `}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-0.5 md:h-1 bg-slate-900 rounded-t-2xl md:rounded-none overflow-hidden md:cursor-pointer md:overflow-visible group/progress"
          onClick={(e) => {
            if (window.innerWidth < 768) return;
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seekTo(percent * duration);
          }}
        >
          <div 
            className="h-full bg-emerald-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(16,185,129,0.8)] relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg translate-x-1/2 scale-0 group-hover/progress:scale-100 transition-transform duration-200" />
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0 flex-1 md:col-span-1">
          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-850 shrink-0 ${
            playbackStatus === 'playing' ? 'animate-[spin_8s_linear_infinite]' : ''
          }`}>
            <Disc className="w-5 h-5 md:w-8 md:h-8 text-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 md:gap-2">
              <h4 className="font-semibold text-sm md:text-base text-slate-100 truncate hover:text-emerald-400 transition-colors">
                {String(currentTrack.surah.id).padStart(3, '0')}. {currentTrack.surah.name}
              </h4>
              <span className="text-[10px] md:text-xs text-slate-400 font-serif shrink-0">
                ({currentTrack.surah.arabicName})
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {currentTrack.reciter.name} <span className="md:hidden">•</span> <span className="hidden md:inline-block mx-1.5">•</span> 
              <span className="text-[10px] text-emerald-400 bg-emerald-400/5 px-1 py-0.2 rounded border border-emerald-500/10">{currentTrack.moshaf.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-2 md:col-span-1 md:justify-center md:flex-col md:gap-1.5 md:ml-0" onClick={e => e.stopPropagation()}>
          
          <div className="flex items-center gap-2.5 md:gap-6">
            <button 
              onClick={playPrevTrack}
              className="hidden md:flex text-slate-400 hover:text-slate-200 transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {playbackStatus === 'buffering' ? (
              <div className="w-9 h-9 md:w-11 md:h-11 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex items-center justify-center" />
            ) : (
              <button 
                onClick={togglePlay}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/20 tap-feedback hover:scale-105 transition-all"
              >
                {playbackStatus === 'playing' ? (
                  <Pause className="w-4.5 h-4.5 md:w-5 md:h-5 fill-current" />
                ) : (
                  <Play className="w-4.5 h-4.5 md:w-5 md:h-5 fill-current ml-0.5 md:ml-1" />
                )}
              </button>
            )}

            <button 
              onClick={playNextTrack}
              className="w-9 h-9 md:w-auto md:h-auto md:bg-transparent md:border-none md:rounded-none rounded-full bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center tap-feedback transition-colors"
            >
              <SkipForward className="w-4.5 h-4.5 md:w-5 md:h-5 fill-current" />
            </button>
          </div>

          <div className="hidden md:flex items-center justify-center gap-3 w-full max-w-sm text-[10px] font-mono font-medium text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span className="w-24 border-t border-slate-800"></span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end gap-6 col-span-1" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 w-32 group">
            <button onClick={toggleMute} className="text-slate-400 hover:text-emerald-400 transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(isMuted ? 0 : volume) * 100}%, #1e293b ${(isMuted ? 0 : volume) * 100}%, #1e293b 100%)`
              }}
            />
          </div>

          <button 
            onClick={() => {
              setShowPlaylistDrawer(true);
              setDrawerSearch('');
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showPlaylistDrawer
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60'
            }`}
            title="Liste de lecture"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. IMMERSIVE FULL-SCREEN EXPANDED PLAYER DECK */}
      <div 
        className={`fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-50 flex flex-col justify-between px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] overflow-y-auto transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
          isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[30vh] bg-amber-500/3 blur-3xl pointer-events-none -z-10" />

        {/* 2.1 Header Nav Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              setIsExpanded(false);
              setShowSpeedMenu(false);
              setShowPlaylistDrawer(false);
            }}
            className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-slate-300 active:scale-90 transition-transform"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-0.5">Audio en Direct</span>
            <span className="text-xs font-semibold text-slate-300">Édition Saint Coran</span>
          </div>
          <div className="w-11 h-11" />
        </div>

        {/* 2.2 Immersive Center Deck: Rotator Panel */}
        <div className="flex flex-col items-center justify-center my-4 flex-1 max-w-sm mx-auto w-full min-h-[18rem]">
          <div className="relative group">
            <div className={`absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl transition-all duration-1000 ${
              playbackStatus === 'playing' ? 'scale-110 opacity-100' : 'scale-95 opacity-50'
            }`} />
            <div className={`w-56 h-56 min-[390px]:w-64 min-[390px]:h-64 md:w-72 md:h-72 rounded-full bg-slate-900 border-4 border-slate-800 shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden transition-transform duration-700 ${
              playbackStatus === 'playing' ? 'animate-[spin_20s_linear_infinite]' : 'rotate-45'
            }`}>
              <div className="absolute inset-4 rounded-full border border-emerald-500/20" />
              <div className="absolute inset-10 rounded-full border-2 border-dashed border-amber-500/20" />
              <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border-2 border-emerald-500/30 z-10">
                <Disc className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_transparent_40%,_black_90%),_repeating-radial-gradient(circle_at_center,_#10b981_0,_#f59e0b_10px)] pointer-events-none" />
            </div>
          </div>
          
          {playbackStatus === 'playing' && (
            <div className="flex items-center gap-1 h-6 mt-8">
              {[40, 85, 50, 100, 35, 75].map((height, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-emerald-500/80 rounded-full animate-[shimmer_0.8s_infinite_alternate]"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 0.12}s`
                  }}
                />
              ))}
            </div>
          )}
          {playbackStatus === 'buffering' && (
            <div className="flex items-center gap-2 mt-8 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 animate-spin" /> Chargement du flux...
            </div>
          )}
          {playbackStatus === 'error' && (
            <div className="flex items-center gap-2 mt-8 text-xs text-red-400 bg-red-400/10 border border-red-500/25 px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" /> Erreur de flux
            </div>
          )}
        </div>

        {/* 2.3 Audio Metadata & Titles */}
        <div className="text-center max-w-md mx-auto w-full mb-4">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 uppercase">
              Sourate {currentTrack.surah.id}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              {currentTrack.moshaf.name}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center justify-center gap-2 flex-wrap leading-tight">
            {currentTrack.surah.name}
            <span className="font-serif text-xl text-emerald-400 select-none arabic-text">
              ({currentTrack.surah.arabicName})
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 md:text-base">{currentTrack.reciter.name}</p>
        </div>

        {/* 2.4 Scrubbing slider & Timers */}
        <div className="max-w-md mx-auto w-full mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${progressPercent}%, #0f172a ${progressPercent}%, #0f172a 100%)`
            }}
          />
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 2.5 Console Control Deck */}
        <div className="max-w-md mx-auto w-full flex flex-col gap-5">
          <div className="flex items-center justify-between gap-1 min-[390px]:gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 rounded-full flex items-center justify-center border border-slate-850 tap-feedback transition-colors ${
                  playbackSpeed !== 1.0 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
                title="Vitesse de lecture"
              >
                <Gauge className="w-5 h-5" />
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-13 left-0 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-50 min-w-28 animate-[double-pulse_0.1s]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 block">Vitesse</span>
                  {speedOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPlaybackSpeed(opt);
                        setShowSpeedMenu(false);
                      }}
                      className={`text-xs text-left px-2.5 py-1.5 rounded-lg transition-colors font-mono ${
                        playbackSpeed === opt 
                          ? 'bg-emerald-500 text-slate-950 font-bold' 
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt === 1.0 ? 'Normale' : `${opt}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={playPrevTrack}
              className="w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition-all tap-feedback"
              title="Sourate précédente"
            >
              <SkipBack className="w-4.5 h-4.5 fill-current" />
            </button>

            <button 
              onClick={() => seekTo(Math.max(0, currentTime - 10))}
              className="w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition-all tap-feedback relative"
              title="Reculer de 10 secondes"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-[7px] font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 text-slate-400">10</span>
            </button>

            <button 
              onClick={togglePlay}
              className="w-16 h-16 min-[390px]:w-18 min-[390px]:h-18 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/30 active:scale-90 hover:scale-105 transition-all tap-feedback shrink-0"
            >
              {playbackStatus === 'playing' ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button 
              onClick={() => seekTo(Math.min(duration || 0, currentTime + 10))}
              className="w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition-all tap-feedback relative"
              title="Avancer de 10 secondes"
            >
              <RotateCw className="w-5 h-5" />
              <span className="text-[7px] font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 text-slate-400">10</span>
            </button>

            <button 
              onClick={playNextTrack}
              className="w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition-all tap-feedback"
              title="Sourate suivante"
            >
              <SkipForward className="w-4.5 h-4.5 fill-current" />
            </button>

            <button 
              onClick={() => {
                setShowPlaylistDrawer(true);
                setDrawerSearch('');
              }}
              className={`w-10 h-10 min-[390px]:w-11 min-[390px]:h-11 rounded-full flex items-center justify-center border border-slate-850 tap-feedback transition-colors ${
                showPlaylistDrawer
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Liste de lecture"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/40 border border-slate-900/60">
            <button onClick={toggleMute} className="text-slate-400 hover:text-slate-200">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(isMuted ? 0 : volume) * 100}%, #1e293b ${(isMuted ? 0 : volume) * 100}%, #1e293b 100%)`
              }}
            />
            <span className="font-mono text-slate-400 min-w-7 text-right text-[10px]">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. PLAYLIST / SURAH SELECTOR DRAWER */}
      {showPlaylistDrawer && (
        <>
          <div 
            onClick={() => setShowPlaylistDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          />
          <div className="fixed inset-x-0 bottom-0 max-h-[75vh] bg-slate-950/98 border-t border-slate-800/80 rounded-t-3xl px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-[55] flex flex-col gap-4 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-emerald-400" />
                  Liste des Sourates
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentTrack.reciter.name}</p>
              </div>
              <button 
                onClick={() => setShowPlaylistDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
              <input
                type="text"
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                placeholder="Rechercher une sourate par nom ou numéro..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900/60 focus:bg-slate-900 border border-slate-850 focus:border-emerald-500/30 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none transition-all"
              />
              {drawerSearch && (
                <button
                  onClick={() => setDrawerSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-450 hover:text-slate-200 px-1.5 py-0.5 bg-slate-800 rounded flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pb-6">
              {filteredDrawerSurahs.length === 0 ? (
                <p className="text-xs text-slate-550 text-center py-6">Aucune sourate trouvée.</p>
              ) : (
                filteredDrawerSurahs.map((surah) => {
                  const isCurrentSurah = currentTrack.surah.id === surah.id;
                  return (
                    <button
                      key={surah.id}
                      onClick={() => {
                        playTrack(currentTrack.reciter, currentTrack.moshaf, surah);
                        setShowPlaylistDrawer(false);
                      }}
                      className={`group w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all duration-300 relative ${
                        isCurrentSurah
                          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_4px_15px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20'
                          : 'border-slate-800/40 bg-slate-900/30 hover:bg-slate-900/80 hover:border-slate-700/60'
                      }`}
                    >
                      {isCurrentSurah && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      )}

                      <div className="relative flex items-center justify-center w-8 h-8 shrink-0 ml-1">
                        <div className={`absolute inset-0 rotate-45 rounded-md border transition-all duration-500 ${
                          isCurrentSurah 
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] scale-105' 
                            : 'bg-slate-950 border-slate-700 group-hover:border-slate-500 group-hover:rotate-[135deg]'
                        }`} />
                        <span className={`relative z-10 text-[10px] font-bold ${isCurrentSurah ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {surah.id}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-sm truncate transition-colors ${isCurrentSurah ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-400'}`}>
                          {surah.name}
                        </p>
                        <p className="text-[10px] text-slate-400/80 truncate mt-0.5 font-medium">{surah.englishTranslation}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-serif text-lg tracking-wide select-none arabic-text transition-colors ${
                          isCurrentSurah ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'text-slate-350 group-hover:text-slate-200'
                        }`}>
                          {surah.arabicName}
                        </span>
                        {isCurrentSurah && (
                          <div className="flex gap-0.5 items-end justify-center h-3 w-3 mr-1">
                            <div className="w-0.5 bg-emerald-400 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-0.5 bg-emerald-400 animate-[shimmer_0.6s_infinite_alternate] h-2/3 rounded-full" style={{ animationDelay: '0.3s' }}></div>
                            <div className="w-0.5 bg-emerald-400 animate-[shimmer_0.6s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }}></div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
