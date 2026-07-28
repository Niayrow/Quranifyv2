export interface Moshaf {
  id: number;
  name: string;
  server: string;
  surah_list: string;
}

export interface Reciter {
  id: number;
  name: string;
  letter: string;
  moshaf: Moshaf[];
}

export interface Surah {
  id: number;
  name: string;
  arabicName: string;
  englishName: string;
  englishTranslation: string;
}

export interface AudioTrack {
  reciter: Reciter;
  moshaf: Moshaf;
  surah: Surah;
}

export type PlaybackStatus = 'idle' | 'buffering' | 'playing' | 'paused' | 'error';
