import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Reciter, Moshaf, Surah, AudioTrack, PlaybackStatus } from '../types';
import { SURAHS } from '../data/surahs';
import { SEEDED_RECITERS } from '../data/recitersSeed';

interface AudioContextType {
  // Playback state
  currentTrack: AudioTrack | null;
  playbackStatus: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
  playbackSpeed: number;
  
  // Lists and loading states
  reciters: Reciter[];
  isLoadingReciters: boolean;
  error: string | null;
  
  // Selected configuration
  activeReciter: Reciter | null;
  activeMoshaf: Moshaf | null;
  activeSurah: Surah | null;
  
  // Actions
  setActiveReciter: (reciter: Reciter | null) => void;
  setActiveMoshaf: (moshaf: Moshaf | null) => void;
  setActiveSurah: (surah: Surah | null) => void;
  playTrack: (reciter: Reciter, moshaf: Moshaf, surah: Surah) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  getAvailableSurahs: (reciter: Reciter | null, moshaf: Moshaf | null) => Surah[];
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'quran_streamer_';
const RECITERS_CACHE_KEY = `${LOCAL_STORAGE_PREFIX}reciters_cache`;
const ARTWORK_URL = 'https://images.unsplash.com/photo-1609599006353-e629fffaae6f?auto=format&fit=crop&w=512&q=80';
const API_RECITERS_URL = 'https://mp3quran.net/api/v3/reciters?language=fr';

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
};

const parseSavedNumber = (key: string, fallback: number, min?: number, max?: number) => {
  const saved = readStorage(key);
  const parsed = saved === null ? NaN : Number.parseFloat(saved);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max ?? parsed, Math.max(min ?? parsed, parsed));
};

const stabilizeFirstScreenReciters = (apiReciters: Reciter[]) => {
  if (SEEDED_RECITERS.length === 0) return apiReciters;

  const seededIds = new Set(SEEDED_RECITERS.map((reciter) => reciter.id));
  return [
    ...SEEDED_RECITERS,
    ...apiReciters.filter((reciter) => !seededIds.has(reciter.id))
  ];
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reciters, setReciters] = useState<Reciter[]>(SEEDED_RECITERS);
  const [isLoadingReciters, setIsLoadingReciters] = useState<boolean>(SEEDED_RECITERS.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Active configurations
  const [activeReciter, setActiveReciterState] = useState<Reciter | null>(null);
  const [activeMoshaf, setActiveMoshafState] = useState<Moshaf | null>(null);
  const [activeSurah, setActiveSurahState] = useState<Surah | null>(null);

  // Playback states
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);

  // Audio HTML5 Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch Reciters on Startup
  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    const fetchReciters = async () => {
      try {
        if (SEEDED_RECITERS.length === 0) {
          setIsLoadingReciters(true);
        }
        const response = await fetch(API_RECITERS_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to fetch reciters from the Quran API.');
        }
        const data = await response.json();
        if (!isCurrentRequest) return;

        if (data && data.reciters) {
          setReciters(stabilizeFirstScreenReciters(data.reciters));
          writeStorage(RECITERS_CACHE_KEY, JSON.stringify(data.reciters));
          // Restore selected reciter from local storage if valid
          restoreFromLocalStorage(data.reciters);
        } else {
          throw new Error('Unexpected API response structure.');
        }
      } catch (err: unknown) {
        if (!isCurrentRequest || (err instanceof DOMException && err.name === 'AbortError')) return;

        console.error(err);
        const cached = readStorage(RECITERS_CACHE_KEY);
        if (cached) {
          try {
            const cachedReciters = JSON.parse(cached) as Reciter[];
            setReciters(stabilizeFirstScreenReciters(cachedReciters));
            restoreFromLocalStorage(cachedReciters);
            setError('Connexion instable : affichage des récitants sauvegardés localement.');
          } catch {
            setError('Impossible de charger les récitants. Vérifiez votre connexion puis réessayez.');
          }
        } else {
          setError('Impossible de charger les récitants. Vérifiez votre connexion puis réessayez.');
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingReciters(false);
        }
      }
    };

    fetchReciters();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, []);

  // Initialize Audio Object on Client Side (ONCE on mount)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;
    
    // Set restored volume
    const parsedVol = parseSavedNumber(`${LOCAL_STORAGE_PREFIX}volume`, 0.8, 0, 1);
    audio.volume = parsedVol;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolumeState(parsedVol);

    // Set restored playback speed
    const parsedSpeed = parseSavedNumber(`${LOCAL_STORAGE_PREFIX}speed`, 1, 0.5, 2);
    audio.defaultPlaybackRate = parsedSpeed;
    audio.playbackRate = parsedSpeed;
    setPlaybackSpeedState(parsedSpeed);

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Manage Audio Event Listeners to synchronize with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Listeners for audio state sync
    const onPlay = () => setPlaybackStatus('playing');
    const onPause = () => setPlaybackStatus('paused');
    const onWaiting = () => setPlaybackStatus('buffering');
    const onPlaying = () => setPlaybackStatus('playing');
    const onLoadStart = () => setPlaybackStatus('buffering');
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Persist timestamp occasionally
      writeStorage(`${LOCAL_STORAGE_PREFIX}timestamp`, String(audio.currentTime));
    };
    const onEnded = () => {
      setPlaybackStatus('paused');
      playNextTrack();
    };
    const onError = (e: Event | string | unknown) => {
      console.error('Audio Playback Error:', e);
      setPlaybackStatus('error');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciters, currentTrack]);

  // Synchronize Media Session controls and metadata
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    const audio = audioRef.current;

    if ('mediaSession' in navigator) {
      const paddedId = String(currentTrack.surah.id).padStart(3, '0');
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${paddedId}. ${currentTrack.surah.name}`,
        artist: currentTrack.reciter.name,
        album: `Holy Quran (${currentTrack.moshaf.name})`,
        artwork: [
          { src: ARTWORK_URL, sizes: '512x512', type: 'image/jpeg' },
          { src: ARTWORK_URL, sizes: '256x256', type: 'image/jpeg' }
        ]
      });

      // Synchronize action handlers
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          audio.play().catch(err => console.error(err));
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPrevTrack();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNextTrack();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            audio.currentTime = details.seekTime;
          }
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          audio.pause();
          audio.currentTime = 0;
          setPlaybackStatus('paused');
        });
      } catch (error) {
        console.warn('W3C Media Session action handlers configuration failed:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Update Media Session Position State
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack && audioRef.current && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: playbackSpeed,
          position: currentTime
        });
      } catch {
        // Safe check for range errors
      }
    }
  }, [currentTime, duration, playbackSpeed, currentTrack]);

  // Helper to extract list of available Surahs for a reciter
  const getAvailableSurahs = useCallback((reciter: Reciter | null, moshaf: Moshaf | null): Surah[] => {
    if (!reciter || !moshaf) return [];
    const availableIds = moshaf.surah_list
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
      
    return SURAHS.filter(surah => availableIds.includes(surah.id));
  }, []);

  // LocalStorage Helpers
  const restoreFromLocalStorage = (loadedReciters: Reciter[]) => {
    try {
      const savedReciterId = readStorage(`${LOCAL_STORAGE_PREFIX}reciter_id`);
      const savedMoshafId = readStorage(`${LOCAL_STORAGE_PREFIX}moshaf_id`);
      const savedSurahId = readStorage(`${LOCAL_STORAGE_PREFIX}surah_id`);

      if (savedReciterId) {
        const reciter = loadedReciters.find(r => r.id === parseInt(savedReciterId, 10));
        if (reciter) {
          setActiveReciterState(reciter);
          
          const moshaf = reciter.moshaf.find(m => m.id === parseInt(savedMoshafId || '', 10)) || reciter.moshaf[0];
          setActiveMoshafState(moshaf);
          
          if (savedSurahId) {
            const surah = SURAHS.find(s => s.id === parseInt(savedSurahId, 10));
            if (surah) {
              setActiveSurahState(surah);
              
              // Load track metadata into player state without playing
              const restoredTrack: AudioTrack = { reciter, moshaf, surah };
              setCurrentTrack(restoredTrack);
              
              const audio = audioRef.current;
              if (audio) {
                const paddedSurah = String(surah.id).padStart(3, '0');
                const server = moshaf.server.endsWith('/') ? moshaf.server : `${moshaf.server}/`;
                audio.src = `${server}${paddedSurah}.mp3`;
                
                const savedTime = readStorage(`${LOCAL_STORAGE_PREFIX}timestamp`);
                if (savedTime) {
                  const parsedTime = Number.parseFloat(savedTime);
                  if (Number.isFinite(parsedTime) && parsedTime >= 0) {
                    audio.currentTime = parsedTime;
                    setCurrentTime(parsedTime);
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore playback state from LocalStorage', e);
    }
  };

  const persistSelection = (reciter: Reciter | null, moshaf: Moshaf | null, surah: Surah | null) => {
    if (reciter) writeStorage(`${LOCAL_STORAGE_PREFIX}reciter_id`, String(reciter.id));
    if (moshaf) writeStorage(`${LOCAL_STORAGE_PREFIX}moshaf_id`, String(moshaf.id));
    if (surah) writeStorage(`${LOCAL_STORAGE_PREFIX}surah_id`, String(surah.id));
  };

  // State mutators with automatic persistence
  const setActiveReciter = (reciter: Reciter | null) => {
    setActiveReciterState(reciter);
    if (reciter) {
      const defaultMoshaf = reciter.moshaf[0] || null;
      setActiveMoshafState(defaultMoshaf);
      
      const available = getAvailableSurahs(reciter, defaultMoshaf);
      const defaultSurah = available.length > 0 ? available[0] : null;
      setActiveSurahState(defaultSurah);
      
      persistSelection(reciter, defaultMoshaf, defaultSurah);
    }
  };

  const setActiveMoshaf = (moshaf: Moshaf | null) => {
    setActiveMoshafState(moshaf);
    if (activeReciter && moshaf) {
      const available = getAvailableSurahs(activeReciter, moshaf);
      const defaultSurah = available.length > 0 ? available[0] : null;
      setActiveSurahState(defaultSurah);
      persistSelection(activeReciter, moshaf, defaultSurah);
    }
  };

  const setActiveSurah = (surah: Surah | null) => {
    setActiveSurahState(surah);
    persistSelection(activeReciter, activeMoshaf, surah);
  };

  // Play Actions
  function playTrack(reciter: Reciter, moshaf: Moshaf, surah: Surah) {
    if (!audioRef.current) return;
    if (!moshaf.server) {
      setPlaybackStatus('error');
      return;
    }
    
    // 1. Update State
    const newTrack: AudioTrack = { reciter, moshaf, surah };
    setCurrentTrack(newTrack);
    setActiveReciterState(reciter);
    setActiveMoshafState(moshaf);
    setActiveSurahState(surah);
    persistSelection(reciter, moshaf, surah);

    // 2. Play Audio File
    const paddedSurah = String(surah.id).padStart(3, '0');
    const server = moshaf.server.endsWith('/') ? moshaf.server : `${moshaf.server}/`;
    const audioUrl = `${server}${paddedSurah}.mp3`;

    audioRef.current.pause();
    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current.load();
    setCurrentTime(0);
    setDuration(0);
    setPlaybackStatus('buffering');
    
    audioRef.current.play()
      .then(() => {
        setPlaybackStatus('playing');
      })
      .catch(err => {
        console.error('Audio reproduction rejected:', err);
        setPlaybackStatus('error');
      });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (playbackStatus === 'playing') {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error(err);
        setPlaybackStatus('error');
      });
    }
  };

  const pause = () => {
    if (audioRef.current && playbackStatus === 'playing') {
      audioRef.current.pause();
    }
  };

  const play = () => {
    if (audioRef.current && currentTrack && playbackStatus !== 'playing') {
      audioRef.current.play().catch(err => console.error(err));
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current && Number.isFinite(time)) {
      const upperBound = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
      const safeTime = Math.min(upperBound, Math.max(0, time));
      audioRef.current.currentTime = safeTime;
      setCurrentTime(safeTime);
      writeStorage(`${LOCAL_STORAGE_PREFIX}timestamp`, String(safeTime));
    }
  };

  const setVolume = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    writeStorage(`${LOCAL_STORAGE_PREFIX}volume`, String(safeVol));
    if (audioRef.current) {
      audioRef.current.volume = safeVol;
    }
  };

  const setPlaybackSpeed = (speed: number) => {
    const safeSpeed = Math.max(0.5, Math.min(2, speed));
    setPlaybackSpeedState(safeSpeed);
    writeStorage(`${LOCAL_STORAGE_PREFIX}speed`, String(safeSpeed));
    if (audioRef.current) {
      audioRef.current.playbackRate = safeSpeed;
    }
  };

  // Next and Previous tracks playlist manager
  function playNextTrack() {
    if (!currentTrack) return;
    
    const available = getAvailableSurahs(currentTrack.reciter, currentTrack.moshaf);
    if (available.length === 0) return;

    const currentIndex = available.findIndex(s => s.id === currentTrack.surah.id);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= available.length) {
      nextIndex = 0; // Wrap around to the first available Surah
    }

    const nextSurah = available[nextIndex];
    playTrack(currentTrack.reciter, currentTrack.moshaf, nextSurah);
  };

  function playPrevTrack() {
    if (!currentTrack) return;
    
    const available = getAvailableSurahs(currentTrack.reciter, currentTrack.moshaf);
    if (available.length === 0) return;

    const currentIndex = available.findIndex(s => s.id === currentTrack.surah.id);
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = available.length - 1; // Wrap around to the last available Surah
    }

    const prevSurah = available[prevIndex];
    playTrack(currentTrack.reciter, currentTrack.moshaf, prevSurah);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      playbackStatus,
      currentTime,
      duration,
      volume,
      playbackSpeed,
      
      reciters,
      isLoadingReciters,
      error,
      
      activeReciter,
      activeMoshaf,
      activeSurah,
      
      setActiveReciter,
      setActiveMoshaf,
      setActiveSurah,
      playTrack,
      togglePlay,
      pause,
      play,
      seekTo,
      setVolume,
      setPlaybackSpeed,
      playNextTrack,
      playPrevTrack,
      getAvailableSurahs
    }}>
      {children}
    </AudioContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
