import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';

const FAVORITES_KEY = 'quran_streamer_favorites';

interface CloudSyncProps {
  favorites: number[];
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
}

/**
 * Syncs Quranify favorites + playback resume with Supabase when logged in.
 * Keeps localStorage as offline cache.
 */
export const CloudSync: React.FC<CloudSyncProps> = ({ favorites, setFavorites }) => {
  const {
    user,
    syncFavoritesMerge,
    setFavoriteReciter,
    fetchPlaybackState,
    upsertPlaybackState,
  } = useAuth();
  const {
    currentTrack,
    currentTime,
    isLoadingReciters,
    hydratePlaybackState,
  } = useAudio();

  const lastPushedFavorites = useRef<string>('');
  const lastPlaybackPush = useRef(0);
  const didHydrateCloud = useRef(false);
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  // On login: merge favorites + restore cloud playback
  useEffect(() => {
    if (!user || isLoadingReciters) return;
    let cancelled = false;

    const run = async () => {
      const merged = await syncFavoritesMerge(favoritesRef.current);
      if (cancelled) return;
      setFavorites(merged);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      lastPushedFavorites.current = JSON.stringify([...merged].sort((a, b) => a - b));

      if (!didHydrateCloud.current) {
        didHydrateCloud.current = true;
        const remote = await fetchPlaybackState();
        if (cancelled || !remote) return;
        hydratePlaybackState({
          reciterId: remote.reciter_id,
          moshafId: remote.moshaf_id,
          surahId: remote.surah_id,
          positionSeconds: remote.position_seconds,
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    isLoadingReciters,
    syncFavoritesMerge,
    setFavorites,
    fetchPlaybackState,
    hydratePlaybackState,
  ]);

  useEffect(() => {
    if (!user) {
      didHydrateCloud.current = false;
    }
  }, [user]);

  // Push favorite changes after login merge
  useEffect(() => {
    if (!user) return;
    const signature = JSON.stringify([...favorites].sort((a, b) => a - b));
    if (signature === lastPushedFavorites.current) return;

    const previous = new Set<number>(
      lastPushedFavorites.current
        ? (JSON.parse(lastPushedFavorites.current) as number[])
        : []
    );
    const next = new Set(favorites);

    const added = favorites.filter((id) => !previous.has(id));
    const removed = [...previous].filter((id) => !next.has(id));

    lastPushedFavorites.current = signature;

    added.forEach((id) => {
      void setFavoriteReciter(id, true);
    });
    removed.forEach((id) => {
      void setFavoriteReciter(id, false);
    });
  }, [favorites, user, setFavoriteReciter]);

  // Debounced playback upsert
  useEffect(() => {
    if (!user || !currentTrack) return;
    const now = Date.now();
    if (now - lastPlaybackPush.current < 4000) return;

    const timer = window.setTimeout(() => {
      lastPlaybackPush.current = Date.now();
      void upsertPlaybackState({
        reciterId: currentTrack.reciter.id,
        moshafId: currentTrack.moshaf.id,
        surahId: currentTrack.surah.id,
        positionSeconds: currentTime,
      });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [user, currentTrack, currentTime, upsertPlaybackState]);

  return null;
};
