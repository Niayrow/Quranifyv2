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
  { id: 123, name: "Mishary Rachid Al-Afasy", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 54, name: "Abderrahmane Al-Soudais", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 102, name: "Maher Al-Mouaiqly", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 92, name: "Yasser Al-Dossary", letter: "Y", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 30, name: "Saad El-Ghamidi", letter: "S", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 31, name: "Saoud Al-Shuraim", letter: "S", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 51, name: "Abdel Bassit Abdel Samad", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 112, name: "Mohamed Siddiq El-Menchaoui", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 118, name: "Mahmoud Khalil Al-Housary", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 4, name: "Abou Bakr Al-Chatri", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 5, name: "Ahmed El-Ajami", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 217, name: "Bandar Balilah", letter: "B", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 89, name: "Hani Arrifai", letter: "H", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 76, name: "Ali Jaber", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 109, name: "Mohamed Ayyoub", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 86, name: "Nasser Al-Qatami", letter: "N", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 12, name: "Idris Abkar", letter: "I", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 81, name: "Fares Abbad", letter: "F", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 60, name: "Abdullah Basfar", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 121, name: "Mahmoud Ali Albanna", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 137, name: "Ahmad Talib bin Humaid", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 125, name: "Mustafa Ismail", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 225, name: "Abdulrahman Aloosi", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 43, name: "Salah Al-Boudeir", letter: "S", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 74, name: "Ali Al-Houdhayfi", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 111, name: "Mohamed Jibreel", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 221, name: "Raad Al-Kurdi", letter: "R", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 152, name: "Yasser Salamah", letter: "Y", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 272, name: "Okasha Kameny", letter: "O", moshafCount: 1, moshafNames: ["Rewayat Albizi A'n Ibn Katheer - Psalmodié"] },
  { id: 84, name: "Fawaz Alkabi", letter: "F", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 107, name: "Mohamed El-Louhaïdan", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 245, name: "Mansour Al-Salemi", letter: "M", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 254, name: "Badr Al-Turki", letter: "B", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 20, name: "Khaled Al-Jalil", letter: "K", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 62, name: "Abdullah Awad Al-Juhany", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 253, name: "Islam Sobhi", letter: "I", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 160, name: "Adel Al-Kalbani", letter: "A", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 21, name: "Khalid Al-Qahtani", letter: "K", moshafCount: 1, moshafNames: ["Rewayat Hafs A'n Assem - Psalmodié"] },
  { id: 16, name: "Laayoun El Kouchi", letter: "L", moshafCount: 1, moshafNames: ["Rewayat Warsh A'n Nafi' - Psalmodié"] },
];

export const RECITEUR_LISTE_COUNT = RECITEUR_LISTE.length;
