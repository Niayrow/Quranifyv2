import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaybackStatus } from '../types';
import { EVERY_AYAH_RECITERS, getEveryAyahReciterById, getPreferredEveryAyahReciterId } from '../data/everyAyahReciters';

const buildEveryAyahUrl = (folder: string, surahId: number, verseNumber: number) => (
  `https://everyayah.com/data/${folder}/${String(surahId).padStart(3, '0')}${String(verseNumber).padStart(3, '0')}.mp3`
);

export const useEveryAyahPlayer = (surahId: number | null, verseCount: number, preferredAppReciterId: number | null) => {
  const [selectedReciterId, setSelectedReciterId] = useState(() => getPreferredEveryAyahReciterId(preferredAppReciterId));
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const surahIdRef = useRef<number | null>(surahId);
  const verseCountRef = useRef(verseCount);
  const currentVerseIndexRef = useRef(0);
  const selectedReciterIdRef = useRef(selectedReciterId);

  useEffect(() => {
    surahIdRef.current = surahId;
  }, [surahId]);

  useEffect(() => {
    verseCountRef.current = verseCount;
  }, [verseCount]);

  useEffect(() => {
    currentVerseIndexRef.current = currentVerseIndex;
  }, [currentVerseIndex]);

  useEffect(() => {
    selectedReciterIdRef.current = selectedReciterId;
  }, [selectedReciterId]);

  const loadVerse = useCallback((verseIndex: number, autoplay: boolean) => {
    const audio = audioRef.current;
    const activeSurahId = surahIdRef.current;
    const selectedReciter = getEveryAyahReciterById(selectedReciterIdRef.current);
    if (!audio || !activeSurahId || !selectedReciter) return;

    audio.pause();
    audio.src = buildEveryAyahUrl(selectedReciter.folder, activeSurahId, verseIndex + 1);
    audio.load();
    setCurrentVerseIndex(verseIndex);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackStatus('buffering');

    if (autoplay) {
      audio.play()
        .then(() => setPlaybackStatus('playing'))
        .catch(() => setPlaybackStatus('error'));
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onPlay = () => setPlaybackStatus('playing');
    const onPause = () => setPlaybackStatus((value) => value === 'buffering' ? value : 'paused');
    const onWaiting = () => setPlaybackStatus('buffering');
    const onPlaying = () => setPlaybackStatus('playing');
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      const nextIndex = currentVerseIndexRef.current + 1;
      if (nextIndex < verseCountRef.current) {
        loadVerse(nextIndex, true);
      } else {
        setPlaybackStatus('paused');
      }
    };
    const onError = () => setPlaybackStatus('error');

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
  }, [loadVerse]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const preferredId = getPreferredEveryAyahReciterId(preferredAppReciterId);
    setSelectedReciterId(preferredId);
  }, [preferredAppReciterId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    setCurrentVerseIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackStatus('idle');
  }, [surahId]);

  const playVerseAt = useCallback((verseIndex: number) => {
    loadVerse(verseIndex, true);
  }, [loadVerse]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !surahId) return;

    if (playbackStatus === 'playing') {
      audio.pause();
      return;
    }

    if (!audio.currentSrc) {
      loadVerse(currentVerseIndexRef.current, true);
      return;
    }

    audio.play()
      .then(() => setPlaybackStatus('playing'))
      .catch(() => setPlaybackStatus('error'));
  }, [loadVerse, playbackStatus, surahId]);

  const selectVerse = useCallback((verseIndex: number) => {
    setCurrentVerseIndex(verseIndex);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const updateSelectedReciter = useCallback((reciterId: string) => {
    const wasPlaying = playbackStatus === 'playing';
    setSelectedReciterId(reciterId);
    selectedReciterIdRef.current = reciterId;
    if (surahIdRef.current) {
      const activeIndex = currentVerseIndexRef.current;
      const audio = audioRef.current;
      if (audio?.currentSrc || wasPlaying) {
        loadVerse(activeIndex, wasPlaying);
      }
    }
  }, [loadVerse, playbackStatus]);

  return {
    reciters: EVERY_AYAH_RECITERS,
    selectedReciterId,
    setSelectedReciterId: updateSelectedReciter,
    currentVerseIndex,
    playbackStatus,
    currentTime,
    duration,
    volume,
    setVolume,
    playVerseAt,
    togglePlayback,
    selectVerse,
  };
};
