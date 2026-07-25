import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { supabase, type QuranifyPlaybackRow } from '../lib/supabase';
import { getLocalDeviceId, getLocalDeviceLabel } from '../lib/deviceId';
import { SURAHS } from '../data/surahs';

const FAVORITES_KEY = 'quran_streamer_favorites';
const POLL_MS = 2000;
const PAUSE_PUSH_DELAY_MS = 900;
const TAKEOVER_GRACE_MS = 5000;

interface CloudSyncProps {
  favorites: number[];
  setFavorites: React.Dispatch<React.SetStateAction<number[]>>;
}

/**
 * Syncs Quranify favorites + multi-device playback presence.
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
    playTrack,
    registerTakeOverHandler,
    setSuppressRemoteUntil,
    getAccurateCurrentTime,
    reciters,
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
  const recitersRef = useRef(reciters);
  recitersRef.current = reciters;

  const localDeviceId = useRef(getLocalDeviceId());
  const localDeviceLabel = useRef(getLocalDeviceLabel());
  const weOwnPlaybackRef = useRef(false);
  const lastPushKey = useRef('');
  const lastPushAtRef = useRef(0);
  const pausePushTimer = useRef<number | null>(null);
  const suppressRemoteUntilRef = useRef(0);
  const lastRemoteKeyRef = useRef('');
  const pausedForRemoteRef = useRef(false);

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
  const playTrackRef = useRef(playTrack);
  playTrackRef.current = playTrack;
  const getAccurateTimeRef = useRef(getAccurateCurrentTime);
  getAccurateTimeRef.current = getAccurateCurrentTime;
  const setSuppressRef = useRef(setSuppressRemoteUntil);
  setSuppressRef.current = setSuppressRemoteUntil;

  const clearPauseTimer = () => {
    if (pausePushTimer.current !== null) {
      window.clearTimeout(pausePushTimer.current);
      pausePushTimer.current = null;
    }
  };

  const readPosition = () => {
    const accurate = getAccurateTimeRef.current();
    if (Number.isFinite(accurate) && accurate > 0) return accurate;
    return Math.max(0, currentTimeRef.current || 0);
  };

  const applyRemoteRow = (row: QuranifyPlaybackRow) => {
    if (!row.device_id) return;

    if (Date.now() < suppressRemoteUntilRef.current) {
      // During takeover grace, ignore other devices
      if (row.device_id !== localDeviceId.current) return;
    }

    // Echo from this device
    if (row.device_id === localDeviceId.current) {
      weOwnPlaybackRef.current = Boolean(row.is_playing);
      if (row.is_playing) {
        pausedForRemoteRef.current = false;
        setRemoteSessionRef.current(null);
      }
      return;
    }

    // Another device owns playback and is actively playing
    if (row.is_playing) {
      weOwnPlaybackRef.current = false;

      const remoteKey = `${row.device_id}:${row.reciter_id}:${row.surah_id}`;
      const isNewRemoteTrack = remoteKey !== lastRemoteKeyRef.current;
      const positionChanged =
        !remoteSessionRef.current ||
        Math.abs((remoteSessionRef.current.positionSeconds || 0) - (row.position_seconds || 0)) > 1.25;

      // Pause local only once when remote starts owning
      if (playbackStatusRef.current === 'playing' && !pausedForRemoteRef.current) {
        pausedForRemoteRef.current = true;
        pauseRef.current();
      }

      if (isNewRemoteTrack) {
        lastRemoteKeyRef.current = remoteKey;
        hydrateRef.current({
          reciterId: row.reciter_id,
          moshafId: row.moshaf_id,
          surahId: row.surah_id,
          positionSeconds: row.position_seconds,
        });
      }

      if (isNewRemoteTrack || positionChanged) {
        setRemoteSessionRef.current({
          reciterId: row.reciter_id,
          moshafId: row.moshaf_id,
          surahId: row.surah_id,
          positionSeconds: Math.max(0, row.position_seconds || 0),
          deviceId: row.device_id,
          deviceLabel: row.device_label,
          updatedAt: row.updated_at,
        });
      }
      return;
    }

    // Other device paused
    lastRemoteKeyRef.current = '';
    pausedForRemoteRef.current = false;
    setRemoteSessionRef.current(null);
  };

  const pushPlayback = (isPlaying: boolean, positionOverride?: number) => {
    const track = currentTrackRef.current;
    if (!user || !track) return;

    if (!isPlaying && !weOwnPlaybackRef.current) return;
    if (!isPlaying && remoteSessionRef.current) return;

    let position = typeof positionOverride === 'number' ? positionOverride : readPosition();

    // Avoid clobbering a known mid-track position with 0 right after load/takeover
    const remotePos = remoteSessionRef.current?.positionSeconds ?? 0;
    if (
      isPlaying &&
      position < 1 &&
      remotePos > 2 &&
      remoteSessionRef.current?.surahId === track.surah.id &&
      remoteSessionRef.current?.reciterId === track.reciter.id
    ) {
      position = remotePos;
    }

    const key = `${isPlaying ? 1 : 0}:${track.reciter.id}:${track.surah.id}:${Math.floor(position)}`;
    const now = Date.now();
    // Allow ownership flips immediately; throttle same-key spam
    if (key === lastPushKey.current && now - lastPushAtRef.current < 1200) return;
    lastPushKey.current = key;
    lastPushAtRef.current = now;

    if (isPlaying) {
      weOwnPlaybackRef.current = true;
      pausedForRemoteRef.current = false;
      setRemoteSessionRef.current(null);
    } else {
      weOwnPlaybackRef.current = false;
    }

    void upsertRef.current({
      reciterId: track.reciter.id,
      moshafId: track.moshaf.id,
      surahId: track.surah.id,
      positionSeconds: position,
      isPlaying,
      deviceId: localDeviceId.current,
      deviceLabel: localDeviceLabel.current,
    });
  };

  // Register takeover handler: fetch fresh position, claim cloud, then play from there
  useEffect(() => {
    registerTakeOverHandler(async () => {
      const session = remoteSessionRef.current;
      const fresh = await fetchPlaybackRef.current();

      const reciterId = fresh?.reciter_id ?? session?.reciterId;
      const moshafId = fresh?.moshaf_id ?? session?.moshafId;
      const surahId = fresh?.surah_id ?? session?.surahId;
      if (!reciterId || !moshafId || !surahId) return false;

      const startAt = Math.max(
        0,
        fresh?.position_seconds ?? 0,
        session?.positionSeconds ?? 0
      );

      const catalog = recitersRef.current.find((r) => r.id === reciterId);
      if (!catalog) return false;
      const moshaf = catalog.moshaf.find((m) => m.id === moshafId) || catalog.moshaf[0];
      if (!moshaf) return false;
      const surah = SURAHS.find((s) => s.id === surahId);
      if (!surah) return false;

      const graceUntil = Date.now() + TAKEOVER_GRACE_MS;
      suppressRemoteUntilRef.current = graceUntil;
      setSuppressRef.current(graceUntil);
      weOwnPlaybackRef.current = true;
      pausedForRemoteRef.current = false;
      lastRemoteKeyRef.current = '';
      setRemoteSessionRef.current(null);

      // Claim ownership in cloud BEFORE audio starts (keeps position)
      await upsertRef.current({
        reciterId,
        moshafId: moshaf.id,
        surahId,
        positionSeconds: startAt,
        isPlaying: true,
        deviceId: localDeviceId.current,
        deviceLabel: localDeviceLabel.current,
      });
      lastPushKey.current = `1:${reciterId}:${surahId}:${Math.floor(startAt)}`;
      lastPushAtRef.current = Date.now();

      await playTrackRef.current(catalog, moshaf, surah, startAt);
      return true;
    });

    return () => registerTakeOverHandler(null);
  }, [registerTakeOverHandler]);

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
  ]);

  useEffect(() => {
    if (!user) {
      didHydrateCloud.current = false;
      weOwnPlaybackRef.current = false;
      lastPushKey.current = '';
      lastRemoteKeyRef.current = '';
      pausedForRemoteRef.current = false;
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

  // Claim / release ownership from local transport state
  useEffect(() => {
    if (!user || !currentTrack) return;

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

  // Heartbeat while owning — use audio element time, not stale React state
  useEffect(() => {
    if (!user || !currentTrack || playbackStatus !== 'playing') return;

    const timer = window.setInterval(() => {
      if (!weOwnPlaybackRef.current) return;
      if (playbackStatusRef.current !== 'playing') return;
      lastPushKey.current = ''; // force position write
      pushPlayback(true);
    }, 1500);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTrack?.reciter.id, currentTrack?.surah.id, playbackStatus]);

  // Realtime + polling
  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;
    const userId = user.id;

    void client.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) client.realtime.setAuth(token);
    });

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
          applyRemoteRow(row);
        }
      )
      .subscribe();

    const poll = async () => {
      const remote = await fetchPlaybackRef.current();
      if (!remote) return;
      applyRemoteRow(remote);
    };

    void poll();
    const pollId = window.setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      window.clearInterval(pollId);
      void client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
};
