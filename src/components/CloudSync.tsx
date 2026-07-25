import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { supabase, type QuranifyPlaybackRow } from '../lib/supabase';
import { getLocalDeviceId, getLocalDeviceLabel } from '../lib/deviceId';

const FAVORITES_KEY = 'quran_streamer_favorites';

interface CloudSyncProps {
  favorites: number[];
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
}

/**
 * Syncs Quranify favorites + playback resume with Supabase when logged in.
 * Also keeps multi-device "now playing" presence via Realtime.
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
    playbackStatus,
    isLoadingReciters,
    hydratePlaybackState,
    remoteSession,
    setRemoteSession,
    pause,
  } = useAudio();

  const lastPushedFavorites = useRef<string>('');
  const lastPlaybackPush = useRef(0);
  const didHydrateCloud = useRef(false);
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const playbackStatusRef = useRef(playbackStatus);
  playbackStatusRef.current = playbackStatus;
  const remoteSessionRef = useRef(remoteSession);
  remoteSessionRef.current = remoteSession;

  const localDeviceId = useRef(getLocalDeviceId());
  const localDeviceLabel = useRef(getLocalDeviceLabel());
  const lastStatusPushed = useRef<string>('');
  const suppressRemoteClobber = useRef(false);

  // On login: merge favorites + restore cloud playback metadata
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

        const isOtherDevicePlaying =
          remote.is_playing &&
          Boolean(remote.device_id) &&
          remote.device_id !== localDeviceId.current;

        if (isOtherDevicePlaying) {
          hydratePlaybackState({
            reciterId: remote.reciter_id,
            moshafId: remote.moshaf_id,
            surahId: remote.surah_id,
            positionSeconds: remote.position_seconds,
          });
          setRemoteSession({
            reciterId: remote.reciter_id,
            moshafId: remote.moshaf_id,
            surahId: remote.surah_id,
            positionSeconds: remote.position_seconds,
            deviceId: remote.device_id!,
            deviceLabel: remote.device_label,
            updatedAt: remote.updated_at,
          });
        } else if (!currentTrackRef.current) {
          hydratePlaybackState({
            reciterId: remote.reciter_id,
            moshafId: remote.moshaf_id,
            surahId: remote.surah_id,
            positionSeconds: remote.position_seconds,
          });
        }
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
    setRemoteSession,
  ]);

  useEffect(() => {
    if (!user) {
      didHydrateCloud.current = false;
      setRemoteSession(null);
      lastStatusPushed.current = '';
    }
  }, [user, setRemoteSession]);

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

  const pushPlayback = (immediate = false) => {
    const track = currentTrackRef.current;
    if (!user || !track) return;

    const isPlaying = playbackStatusRef.current === 'playing';
    // Another device owns playback — don't overwrite with our paused/idle state
    if (remoteSessionRef.current && !isPlaying) return;

    const statusKey = `${isPlaying}:${track.reciter.id}:${track.surah.id}`;
    const now = Date.now();

    if (!immediate && now - lastPlaybackPush.current < 2500) return;

    lastPlaybackPush.current = now;
    lastStatusPushed.current = statusKey;

    void upsertPlaybackState({
      reciterId: track.reciter.id,
      moshafId: track.moshaf.id,
      surahId: track.surah.id,
      positionSeconds: currentTimeRef.current,
      isPlaying,
      deviceId: localDeviceId.current,
      deviceLabel: localDeviceLabel.current,
    });
  };

  // Clear remote banner as soon as this device starts playing
  useEffect(() => {
    if (playbackStatus === 'playing' && remoteSession) {
      setRemoteSession(null);
    }
  }, [playbackStatus, remoteSession, setRemoteSession]);

  // Immediate push on play/pause transitions
  useEffect(() => {
    if (!user || !currentTrack) return;
    if (suppressRemoteClobber.current) return;
    if (playbackStatus === 'playing' || playbackStatus === 'paused' || playbackStatus === 'idle') {
      pushPlayback(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, playbackStatus, currentTrack?.reciter.id, currentTrack?.surah.id, currentTrack?.moshaf.id]);

  // Debounced position updates while playing
  useEffect(() => {
    if (!user || !currentTrack || playbackStatus !== 'playing') return;

    const timer = window.setTimeout(() => {
      pushPlayback(false);
    }, 2200);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTrack, currentTime, playbackStatus]);

  // Realtime subscription for multi-device presence
  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;

    const applyRemoteRow = (row: QuranifyPlaybackRow) => {
      if (!row.device_id || row.device_id === localDeviceId.current) {
        setRemoteSession(null);
        return;
      }

      if (row.is_playing) {
        if (playbackStatusRef.current === 'playing') {
          suppressRemoteClobber.current = true;
          pause();
          window.setTimeout(() => {
            suppressRemoteClobber.current = false;
          }, 800);
        }
        hydratePlaybackState({
          reciterId: row.reciter_id,
          moshafId: row.moshaf_id,
          surahId: row.surah_id,
          positionSeconds: row.position_seconds,
        });
        setRemoteSession({
          reciterId: row.reciter_id,
          moshafId: row.moshaf_id,
          surahId: row.surah_id,
          positionSeconds: row.position_seconds,
          deviceId: row.device_id,
          deviceLabel: row.device_label,
          updatedAt: row.updated_at,
        });
        return;
      }

      setRemoteSession(null);
    };

    const channel = client
      .channel(`quranify-playback-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quranify_playback_state',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = (payload.new || payload.old) as QuranifyPlaybackRow | null;
          if (!row || !('reciter_id' in row)) return;
          if (payload.eventType === 'DELETE') {
            setRemoteSession(null);
            return;
          }
          applyRemoteRow(row);
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [user, pause, setRemoteSession, hydratePlaybackState]);

  return null;
};
