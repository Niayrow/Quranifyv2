/**
 * Curated catalogue (~30 récitateurs) — mp3quran IDs.
 * Sawra picks are always included.
 * Mujawwad variants stay as moshafs on the same reciter (not separate entries).
 */
export const CURATED_RECITER_IDS = [
  // Tier S
  123, // Mishary Rachid Al-Afasy
  54, // Abderrahmane Al-Soudais
  102, // Maher Al-Mouaiqly
  92, // Yasser Al-Dossary
  30, // Saad El-Ghamidi
  31, // Saoud Al-Shuraim
  51, // Abdel Bassit Abdel Samad
  112, // Mohamed Siddiq El-Menchaoui
  118, // Mahmoud Khalil Al-Housary
  4, // Abou Bakr Al-Chatri

  // Tier A
  5, // Ahmed El-Ajami
  217, // Bandar Balilah
  89, // Hani Arrifai
  76, // Ali Jaber
  109, // Mohamed Ayyoub
  86, // Nasser Al-Qatami
  12, // Idris Abkar
  81, // Fares Abbad
  60, // Abdullah Basfar
  121, // Mahmoud Ali Albanna

  // Tier B
  137, // Ahmad Talib bin Humaid
  125, // Mustafa Ismail
  225, // Abdulrahman Aloosi
  43, // Salah Al-Boudeir
  74, // Ali Al-Houdhayfi
  111, // Mohamed Jibreel
  221, // Raad Al-Kurdi
  152, // Yasser Salamah
  272, // Okasha Kameny
  84, // Fawaz Alkabi

  // Choix Sawra (compléments)
  107, // Mohamed El-Louhaïdan
  245, // Mansour Al-Salemi
  254, // Badr Al-Turki
  20, // Khaled Al-Jalil

  // Ajouts demandés
  62, // Abdullah Awad Al-Juhany
  253, // Islam Sobhi
  160, // Adel Al-Kalbani
  21, // Khalid Al-Qahtani
  16, // Laayoun El Kouchi
] as const;

export const CURATED_RECITER_ID_SET = new Set<number>(CURATED_RECITER_IDS);

export const filterCuratedReciters = <T extends { id: number }>(reciters: T[]): T[] =>
  reciters.filter((r) => CURATED_RECITER_ID_SET.has(r.id));
