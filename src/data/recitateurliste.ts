/**
 * Récitateurs actuellement disponibles dans Sawra
 * (catalogue curaté — voir curatedReciters.ts / recitersSeed.ts).
 */

export type ReciteurListeEntry = {
  id: number;
  name: string;
  letter: string;
  moshafCount: number;
  moshafNames: string[];
};

export const RECITEUR_LISTE: ReciteurListeEntry[] = [
  { id: 123, name: "Mishary Rachid Al-Afasy", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 54, name: "Abderrahmane Al-Soudais", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 102, name: "Maher Al-Mouaiqly", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 92, name: "Yasser Al-Dossary", letter: "Y", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 30, name: "Saad El-Ghamidi", letter: "S", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 31, name: "Saoud Al-Shuraim", letter: "S", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 51, name: "Abdel Bassit Abdel Samad", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 112, name: "Mohamed Siddiq El-Menchaoui", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 118, name: "Mahmoud Khalil Al-Housary", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 4, name: "Abou Bakr Al-Chatri", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 5, name: "Ahmed El-Ajami", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 217, name: "Bandar Balilah", letter: "B", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 89, name: "Hani Arrifai", letter: "H", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 76, name: "Ali Jaber", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 109, name: "Mohamed Ayyoub", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 86, name: "Nasser Al-Qatami", letter: "N", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 12, name: "Idris Abkar", letter: "I", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 81, name: "Fares Abbad", letter: "F", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 60, name: "Abdullah Basfar", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 121, name: "Mahmoud Ali Albanna", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 137, name: "Ahmad Talib bin Humaid", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 125, name: "Mustafa Ismail", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 225, name: "Abdulrahman Aloosi", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 43, name: "Salah Al-Boudeir", letter: "S", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 74, name: "Ali Al-Houdhayfi", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 111, name: "Mohamed Jibreel", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 221, name: "Raad Al-Kurdi", letter: "R", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 152, name: "Yasser Salamah", letter: "Y", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 272, name: "Okasha Kameny", letter: "O", moshafCount: 1, moshafNames: ["Albizi"] },
  { id: 84, name: "Fawaz Alkabi", letter: "F", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 107, name: "Mohamed El-Louhaïdan", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 245, name: "Mansour Al-Salemi", letter: "M", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 254, name: "Badr Al-Turki", letter: "B", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 20, name: "Khaled Al-Jalil", letter: "K", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 62, name: "Abdullah Awad Al-Juhany", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 253, name: "Islam Sobhi", letter: "I", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 160, name: "Adel Al-Kalbani", letter: "A", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 21, name: "Khalid Al-Qahtani", letter: "K", moshafCount: 1, moshafNames: ["Hafs"] },
  { id: 16, name: "Laayoun El Kouchi", letter: "L", moshafCount: 1, moshafNames: ["Warsh"] },
];

export const RECITEUR_LISTE_COUNT = RECITEUR_LISTE.length;
