import { useCallback, useEffect, useRef, useState } from 'react';
import type { Reciter, Surah } from '../types';
import { getAudioUrl, getDefaultMoshaf } from '../utils/audioUrl';

export type CompareSide = 'A' | 'B';

export type ComparePlayerStatus = 'idle' | 'buffering' | 'playing' | 'paused' | 'error';

interface CompareSlotState {
  currentTime: number;
  duration: number;
  status: ComparePlayerStatus;
}

const emptySlot = (): CompareSlotState => ({
  currentTime: 0,
  duration: 0,
  status: 'idle',
});

export const useComparePlayers = () => {
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);

  const [slotA, setSlotA] = useState<CompareSlotState>(emptySlot);
  const [slotB, setSlotB] = useState<CompareSlotState>(emptySlot);
  const [activeSide, setActiveSide] = useState<CompareSide | null>(null);
  const [loadedKey, setLoadedKey] = useState('');

  const reciterARef = useRef<Reciter | null>(null);
  const reciterBRef = useRef<Reciter | null>(null);
  const surahRef = useRef<Surah | null>(null);
  const activeSideRef = useRef<CompareSide | null>(null);

  useEffect(() => {
    activeSideRef.current = activeSide;
  }, [activeSide]);

  const getAudioForSide = (side: CompareSide) => (side === 'A' ? audioARef.current : audioBRef.current);
  const setSlotForSide = (side: CompareSide, patch: Partial<CompareSlotState>) => {
    const setter = side === 'A' ? setSlotA : setSlotB;
    setter((prev) => ({ ...prev, ...patch }));
  };

  const pauseSide = useCallback((side: CompareSide) => {
    const audio = getAudioForSide(side);
    audio?.pause();
    setSlotForSide(side, { status: 'paused' });
  }, []);

  const pauseAll = useCallback(() => {
    audioARef.current?.pause();
    audioBRef.current?.pause();
    setSlotA((prev) => ({ ...prev, status: prev.status === 'playing' ? 'paused' : prev.status }));
    setSlotB((prev) => ({ ...prev, status: prev.status === 'playing' ? 'paused' : prev.status }));
    setActiveSide(null);
  }, []);

  const loadSide = useCallback((side: CompareSide, reciter: Reciter, surah: Surah) => {
    const audio = getAudioForSide(side);
    if (!audio) return;

    const moshaf = getDefaultMoshaf(reciter.moshaf);
    if (!moshaf) {
      setSlotForSide(side, { status: 'error' });
      return;
    }

    const url = getAudioUrl(moshaf, surah);
    setSlotForSide(side, { status: 'buffering', currentTime: 0, duration: 0 });
    audio.pause();
    audio.src = url;
    audio.load();
  }, []);

  const playSide = useCallback(async (side: CompareSide) => {
    const other: CompareSide = side === 'A' ? 'B' : 'A';
    pauseSide(other);

    const audio = getAudioForSide(side);
    if (!audio) return;

    setActiveSide(side);
    setSlotForSide(side, { status: 'buffering' });

    try {
      await audio.play();
      setSlotForSide(side, { status: 'playing' });
    } catch {
      setSlotForSide(side, { status: 'error' });
      setActiveSide(null);
    }
  }, [pauseSide]);

  const toggleSide = useCallback(async (side: CompareSide) => {
    const audio = getAudioForSide(side);
    if (!audio) return;

    if (activeSideRef.current === side && !audio.paused) {
      pauseSide(side);
      setActiveSide(null);
      return;
    }

    await playSide(side);
  }, [playSide, pauseSide]);

  const switchActiveSide = useCallback(async (target: CompareSide) => {
    const source = target === 'A' ? 'B' : 'A';
    const sourceAudio = getAudioForSide(source);
    const targetAudio = getAudioForSide(target);
    if (!sourceAudio || !targetAudio) return;

    const seekTime = sourceAudio.currentTime || (source === 'A' ? slotA.currentTime : slotB.currentTime);

    pauseSide(source);

    if (!targetAudio.src || targetAudio.src === window.location.href) {
      const reciter = target === 'A' ? reciterARef.current : reciterBRef.current;
      const surah = surahRef.current;
      if (reciter && surah) loadSide(target, reciter, surah);
    }

    const applySeekAndPlay = async () => {
      try {
        if (Number.isFinite(seekTime) && seekTime > 0) {
          targetAudio.currentTime = seekTime;
        }
        setSlotForSide(target, { currentTime: seekTime });
        await playSide(target);
      } catch {
        setSlotForSide(target, { status: 'error' });
      }
    };

    if (targetAudio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      await applySeekAndPlay();
    } else {
      targetAudio.addEventListener('loadedmetadata', () => { void applySeekAndPlay(); }, { once: true });
      if (!targetAudio.src) return;
      targetAudio.load();
    }
  }, [loadSide, pauseSide, playSide, slotA.currentTime, slotB.currentTime]);

  const seekActive = useCallback((time: number) => {
    if (!activeSideRef.current) return;
    const audio = getAudioForSide(activeSideRef.current);
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = time;
    setSlotForSide(activeSideRef.current, { currentTime: time });
  }, []);

  const syncSources = useCallback((reciterA: Reciter | null, reciterB: Reciter | null, surah: Surah | null) => {
    if (!reciterA || !reciterB || !surah) return;

    const key = `${reciterA.id}-${reciterB.id}-${surah.id}`;
    if (key === loadedKey) return;

    reciterARef.current = reciterA;
    reciterBRef.current = reciterB;
    surahRef.current = surah;

    pauseAll();
    loadSide('A', reciterA, surah);
    loadSide('B', reciterB, surah);
    setLoadedKey(key);
  }, [loadedKey, loadSide, pauseAll]);

  useEffect(() => {
    const audioA = new Audio();
    const audioB = new Audio();
    audioA.preload = 'metadata';
    audioB.preload = 'metadata';
    audioARef.current = audioA;
    audioBRef.current = audioB;

    const bindSlot = (side: CompareSide, audio: HTMLAudioElement) => {
      const onTimeUpdate = () => {
        if (activeSideRef.current !== side) return;
        setSlotForSide(side, { currentTime: audio.currentTime });
      };
      const onLoadedMetadata = () => setSlotForSide(side, { duration: audio.duration || 0 });
      const onPlay = () => setSlotForSide(side, { status: 'playing' });
      const onPause = () => {
        const setter = side === 'A' ? setSlotA : setSlotB;
        setter((prev) => ({
          ...prev,
          status: prev.status === 'error' ? 'error' : 'paused',
        }));
      };
      const onWaiting = () => setSlotForSide(side, { status: 'buffering' });
      const onError = () => setSlotForSide(side, { status: 'error' });

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('error', onError);

      return () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('error', onError);
        audio.pause();
        audio.src = '';
      };
    };

    const cleanupA = bindSlot('A', audioA);
    const cleanupB = bindSlot('B', audioB);

    return () => {
      cleanupA();
      cleanupB();
      audioARef.current = null;
      audioBRef.current = null;
    };
  }, []);

  const activeSlot = activeSide === 'A' ? slotA : activeSide === 'B' ? slotB : slotA;

  return {
    slotA,
    slotB,
    activeSide,
    activeSlot,
    syncSources,
    playSide,
    pauseAll,
    toggleSide,
    switchActiveSide,
    seekActive,
  };
};
