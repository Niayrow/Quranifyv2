const STORAGE_KEY = 'sawra_recent_reciters';
const MAX_RECENT = 6;

function safeParseIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

export function readRecentReciterIds(): number[] {
  try {
    return safeParseIds(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Prepends a reciter id and persists the list (most recent first). */
export function pushRecentReciterId(reciterId: number): number[] {
  if (!Number.isFinite(reciterId) || reciterId <= 0) return readRecentReciterIds();
  const next = [reciterId, ...readRecentReciterIds().filter((id) => id !== reciterId)].slice(
    0,
    MAX_RECENT,
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
  return next;
}
