import type { Surah } from '../types';

/** French / phonetic aliases keyed by surah id */
const SURAH_ALIASES: Record<number, string[]> = {
  1: ['fatiha', 'fatihah', 'ouverture', 'alfatiha', 'al fatiha'],
  2: ['baqara', 'baqarah', 'vache', 'bakara'],
  3: ['imran', 'famille imran', 'al imran'],
  4: ['nisa', 'femmes', 'annisa'],
  5: ['maidah', 'table', 'table servie'],
  6: ['anam', 'bestiaux', 'betail'],
  7: ['araf', 'hauteurs'],
  8: ['anfal', 'butin'],
  9: ['tawbah', 'tawba', 'repentir'],
  10: ['yunus', 'jonas', 'younes'],
  12: ['yusuf', 'joseph', 'youssef'],
  14: ['ibrahim', 'abraham'],
  16: ['nahl', 'abeilles'],
  17: ['isra', 'voyage nocturne'],
  18: ['kahf', 'caverne'],
  19: ['maryam', 'marie'],
  20: ['taha', 'ta ha'],
  21: ['anbiya', 'prophetes'],
  22: ['hajj', 'pelerinage'],
  24: ['nur', 'lumiere'],
  27: ['naml', 'fourmis'],
  29: ['ankabut', 'araignee'],
  30: ['rum', 'romains'],
  32: ['sajdah', 'prosternation'],
  33: ['ahzab', 'coalises'],
  36: ['yasin', 'yassine', 'ya sin', 'ya-sin'],
  55: ['rahman', 'misericordieux'],
  56: ['waqiah', 'evenement'],
  67: ['mulk', 'royaute'],
  78: ['naba', 'nouvelle'],
  112: ['ikhlas', 'purete'],
  113: ['falaq', 'aube naissante'],
  114: ['nas', 'hommes'],
};

export const normalizeSurahQuery = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compact = (str: string) => str.replace(/\s/g, '');

const scoreField = (query: string, field: string): number => {
  const nq = normalizeSurahQuery(query);
  const nf = normalizeSurahQuery(field);
  if (!nq || !nf) return 0;
  if (nf === nq) return 1000;
  if (nf.startsWith(nq)) return 850;
  if (compact(nf).startsWith(compact(nq))) return 780;
  if (nf.includes(nq)) return 620;
  if (compact(nf).includes(compact(nq))) return 540;
  // token overlap
  const qTokens = nq.split(' ').filter(Boolean);
  const fTokens = nf.split(' ').filter(Boolean);
  let hits = 0;
  for (const qt of qTokens) {
    if (fTokens.some((ft) => ft.startsWith(qt) || qt.startsWith(ft))) hits += 1;
  }
  if (hits > 0) return 300 + hits * 80;
  return 0;
};

export const scoreSurahMatch = (surah: Surah, query: string): number => {
  const nq = normalizeSurahQuery(query);
  if (!nq) return 0;

  // Exact / prefix id
  const idStr = String(surah.id);
  if (idStr === nq) return 1200;
  if (idStr.startsWith(nq)) return 900;

  let best = Math.max(
    scoreField(nq, surah.name),
    scoreField(nq, surah.englishName),
    scoreField(nq, surah.translation),
    surah.arabicName.includes(query.trim()) ? 700 : 0
  );

  const aliases = SURAH_ALIASES[surah.id] ?? [];
  for (const alias of aliases) {
    best = Math.max(best, scoreField(nq, alias));
  }

  return best;
};

export type SurahSuggestion = {
  surah: Surah;
  score: number;
  reason: string;
};

export const getSurahSuggestions = (
  surahs: Surah[],
  query: string,
  limit = 8
): SurahSuggestion[] => {
  const nq = normalizeSurahQuery(query);
  if (!nq) return [];

  return surahs
    .map((surah) => {
      const score = scoreSurahMatch(surah, query);
      let reason = surah.translation;
      if (String(surah.id).startsWith(nq)) reason = `N° ${surah.id}`;
      else if (normalizeSurahQuery(surah.translation).includes(nq)) reason = surah.translation;
      else if (normalizeSurahQuery(surah.name).includes(nq)) reason = surah.name;
      return { surah, score, reason };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.surah.id - b.surah.id)
    .slice(0, limit);
};
