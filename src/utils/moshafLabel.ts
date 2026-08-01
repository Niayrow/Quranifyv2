/**
 * Strip verbose mp3quran moshaf labels:
 * "Rewayat Hafs A'n Assem - Psalmodié" → "Hafs"
 */
export function simplifyMoshafName(name: string): string {
  return name
    .replace(/\s*[-–—]\s*Psalmodié\b/gi, '')
    .replace(/\bPsalmodié\b/gi, '')
    .replace(/^Rewayat\s+/i, '')
    .replace(/\s+A['']n\s+.+$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
