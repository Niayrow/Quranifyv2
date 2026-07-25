import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { supabase, type QuranifyPlaybackRow } from '../lib/supabase';
import { getLocalDeviceId, getLocalDeviceLabel } from '../lib/deviceId';

const FAVORITES_KEY = 'quran_streamer_favorites';
const POLL_MS = 2500;
const PAUSE_PUSH_DELAY_MS = 700;

interface CloudSyncProps {
  favorites: number[];
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
}

/**
 * Syncs Quranify favorites + playback resume with Supabase when logged in.
 * Also keeps multi-device "now playing" presence via Realtime + polling fallback.
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
  /** True only after THIS device successfully claimed is_playing=true */
  const weOwnPlaybackRef = useRef(false);
  const lastPushSignature = useRef('');
  const pausePushTimer = useRef<number | null>(null);
  const applyingRemoteRef = useRef(false);
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  const hydrateRef = useRef(hydratePlaybackState);
  hydrateRef.current = hydratePlaybackState;
  const setRemoteSessionRef = useRef(setRemoteSession);
  setRemoteSessionRef.current = setRemoteSession;
  const fetchPlaybackRef = useRef(fetchPlaybackState);
  fetchPlaybackRef.current = fetchPlaybackState;
  const upsertRef = useRef(upsertPlaybackState);
  upsertRef.current = upsertPlaybackState;

  const clearPauseTimer = () => {
    if (pausePushTimer.current !== null) {
      window.clearTimeout(pausePushTimer.current);
      pausePushTimer.current = null;
    }
  };

  const applyRemoteRow = (row: QuranifyPlaybackRow) => {
    if (!row.device_id) return;

    // Echo from this device
    if (row.device_id === localDeviceId.current) {
      weOwnPlaybackRef.current = Boolean(row.is_playing);
      setRemoteSessionRef.current(null);
      return;
    }

    if (row.is_playing) {
      applyingRemoteRef.current = true;
      weOwnPlaybackRef.current = false;
      if (playbackStatusRef.current === 'playing') {
        pauseRef.current();
      }
      hydrateRef.current({
        reciterId: row.reciter_id,
        moshafId: row.moshaf_id,
        surahId: row.surah_id,
        positionSeconds: row.position_seconds,
      });
      setRemoteSessionRef.current({
        reciterId: row.reciter_id,
        moshafId: row.moshaf_id,
        surahId: row.surah_id,
        positionSeconds: row.position_seconds,
        deviceId: row.device_id,
        deviceLabel: row.device_label,
        updatedAt: row.updated_at,
      });
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 900);
      return;
    }

    // Other device paused — clear banner only
    setRemoteSessionRef.current(null);
  };

  const pushPlayback = (isPlaying: boolean) => {
    const track = currentTrackRef.current;
    if (!user || !track) return;
    if (applyingRemoteRef.current) return;

    // Never let a passive/idle tab steal ownership with is_playing=false
    if (!isPlaying && !weOwnPlaybackRef.current) return;
    // Don't overwrite another device while we are only watching
    if (!isPlaying && remoteSessionRef.current) return;

    const signature = [
      isPlaying ? '1' : '0',
      track.reciter.id,
      track.moshaf.id,
      track.surah.id,
      Math.floor(currentTimeRef.current),
    ].join(':');

    if (signature === lastPushSignature.current) return;
    lastPushSignature.current = signature;

    if (isPlaying) {
      weOwnPlaybackRef.current = true;
      setRemoteSessionRef.current(null);
    } else {
      weOwnPlaybackRef.current = false;
    }

    void upsertRef.current({
      reciterId: track.reciter.id,
      moshafId: track.moshaf.id,
      surahId: track.surah.id,
      positionSeconds: currentTimeRef.current,
      isPlaying,
      deviceId: localDeviceId.current,
      deviceLabel: localDeviceLabel.current,
    });
  };

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
        applyRemoteRow(remote);

        const isOtherDevicePlaying =
          remote.is_playing &&
          Boolean(remote.device_id) &&
          remote.device_id !== localDeviceId.current;

        if (!isOtherDevicePlaying && !currentTrackRef.current) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      weOwnPlaybackRef.current = false;
      lastPushSignature.current = '';
      setRemoteSession(null);
      clearPauseTimer();
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

  // Claim ownership only when truly playing; release after a short pause debounce
  useEffect(() => {
    if (!user || !currentTrack) return;
    if (applyingRemoteRef.current) return;

    if (playbackStatus === 'playing') {
      clearPauseTimer();
      pushPlayback(true);
      return;
    }

    if (playbackStatus === 'paused' && weOwnPlaybackRef.current) {
      clearPauseTimer();
      pausePushTimer.current = window.setTimeout(() => {
        if (playbackStatusRef.current === 'paused' && weOwnPlaybackRef.current) {
          pushPlayback(false);
        }
      }, PAUSE_PUSH_DELAY_MS);
    }

    return () => clearPauseTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, playbackStatus, currentTrack?.reciter.id, currentTrack?.surah.id, currentTrack?.moshaf.id]);

  // Heartbeat position while this device owns playback
  useEffect(() => {
    if (!user || !currentTrack || playbackStatus !== 'playing') return;
    if (!weOwnPlaybackRef.current) return;

    const timer = window.setTimeout(() => {
      lastPushSignature.current = ''; // force position refresh
      pushPlayback(true);
    }, 2000);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTrack, currentTime, playbackStatus]);

  // Realtime + polling fallback (polling makes presence reliable across devices)
  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;
    const userId = user.id;

    // Ensure Realtime websocket uses the user JWT (required for RLS-filtered changes)
    void client.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        client.realtime.setAuth(token);
      }
    });

    const onRow = (row: QuranifyPlaybackRow) => {
      applyRemoteRow(row);
    };

    const channel = client
      .channel(`quranify-playback-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quranify_playback_state',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as QuranifyPlaybackRow | null;
          if (!row || typeof row.reciter_id !== 'number') return;
          if (payload.eventType === 'DELETE') {
            setRemoteSessionRef.current(null);
            return;
          }
          onRow(row);
        }
      )
      .subscribe();

    const poll = async () => {
      const remote = await fetchPlaybackRef.current();
      if (!remote) return;
      onRow(remote);
    };

    void poll();
    const pollId = window.setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      window.clearInterval(pollId);
      void client.removeChannel(channel);
    };
    // Stable subscription for the logged-in user only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
};
