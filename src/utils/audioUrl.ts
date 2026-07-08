import type { Moshaf, Surah } from '../types';

export const getAudioUrl = (moshaf: Moshaf, surah: Surah): string => {
  const paddedSurah = String(surah.id).padStart(3, '0');
  const server = moshaf.server.endsWith('/') ? moshaf.server : `${moshaf.server}/`;
  return `${server}${paddedSurah}.mp3`;
};

export const getDefaultMoshaf = (moshafList: Moshaf[]): Moshaf | null => {
  if (moshafList.length === 0) return null;
  return moshafList.find((m) => m.surah_list.split(',').length >= 100) ?? moshafList[0];
};
