import { useEffect, useState } from 'react';
import type { Surah, Verse } from '../types';

interface UseSurahVersesState {
  verses: Verse[];
  isLoading: boolean;
  error: string | null;
}

interface QuranJsonVerse {
  id: number;
  text: string;
  transliteration?: string;
}

interface QuranJsonSurah {
  id: number;
  verses: QuranJsonVerse[];
}

const surahVerseCache = new Map<number, Verse[]>();
const quranChapterLoaders = import.meta.glob('../../node_modules/quran-json/dist/chapters/fr/*.json', {
  import: 'default',
});

export const getSyncedVerseIndex = (currentTime: number, duration: number, totalVerses: number) => {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0 || totalVerses <= 0) {
    return 0;
  }

  const progress = Math.min(1, Math.max(0, currentTime / duration));
  return Math.min(totalVerses - 1, Math.floor(progress * totalVerses));
};

export const useSurahVerses = (surah: Surah | null) => {
  const [state, setState] = useState<UseSurahVersesState>({
    verses: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!surah) {
      setState({ verses: [], isLoading: false, error: null });
      return;
    }

    const cached = surahVerseCache.get(surah.id);
    if (cached) {
      setState({ verses: cached, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    setState((prev) => ({
      verses: prev.verses,
      isLoading: true,
      error: null,
    }));

    const loadVerses = async () => {
      try {
        const chapterPath = `../../node_modules/quran-json/dist/chapters/fr/${surah.id}.json`;
        const loadChapter = quranChapterLoaders[chapterPath];

        if (!loadChapter) {
          throw new Error('Sourate introuvable dans les données locales.');
        }

        const chapter = await loadChapter() as QuranJsonSurah;

        if (!chapter) {
          throw new Error('Sourate introuvable dans les données locales.');
        }

        const verses = chapter.verses.map((verse) => ({
          id: verse.id,
          text: verse.text,
          transliteration: verse.transliteration,
        }));

        surahVerseCache.set(surah.id, verses);

        if (isCurrent) {
          setState({
            verses,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!isCurrent || (error instanceof DOMException && error.name === 'AbortError')) {
          return;
        }

        setState({
          verses: [],
          isLoading: false,
          error: 'Le texte des versets locaux est indisponible pour le moment.',
        });
      }
    };

    void loadVerses();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [surah]);

  return state;
};
