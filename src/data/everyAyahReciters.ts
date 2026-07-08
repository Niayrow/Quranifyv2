export interface EveryAyahReciter {
  id: string;
  label: string;
  folder: string;
  appReciterIds: number[];
}

export const EVERY_AYAH_RECITERS: EveryAyahReciter[] = [
  { id: 'alafasy', label: 'Mishary Al-Afasy', folder: 'Alafasy_128kbps', appReciterIds: [123] },
  { id: 'sudais', label: 'Abderrahmane Al-Soudais', folder: 'Abdurrahmaan_As-Sudais_64kbps', appReciterIds: [54] },
  { id: 'muaiqly', label: 'Maher Al-Mouaiqly', folder: 'MaherAlMuaiqly128kbps', appReciterIds: [102] },
  { id: 'shuraym', label: 'Saoud Al-Shuraim', folder: 'Saood_ash-Shuraym_128kbps', appReciterIds: [31] },
  { id: 'ghamidi', label: 'Saad El-Ghamidi', folder: 'Ghamadi_40kbps', appReciterIds: [30, 226] },
  { id: 'ajamy', label: 'Ahmed Al-Ajamy', folder: 'ahmed_ibn_ali_al_ajamy_128kbps', appReciterIds: [5] },
  { id: 'minshawy', label: 'Mohamed Siddiq Al-Menchaoui', folder: 'Minshawy_Murattal_128kbps', appReciterIds: [112] },
  { id: 'husary', label: 'Mahmoud Khalil Al-Housary', folder: 'Husary_128kbps', appReciterIds: [118] },
  { id: 'abdulbasit', label: 'Abdel Bassit Abdel Samad', folder: 'AbdulSamad_64kbps_QuranExplorer.Com', appReciterIds: [51] },
  { id: 'hudhaify', label: 'Ali Al-Houdhayfi', folder: 'Hudhaify_64kbps', appReciterIds: [74] },
  { id: 'qatami', label: 'Nasser Al-Qatami', folder: 'Nasser_Alqatami_128kbps', appReciterIds: [86] },
  { id: 'dossary', label: 'Yasser Al-Dossary', folder: 'Yasser_Ad-Dussary_128kbps', appReciterIds: [92] },
  { id: 'jibreel', label: 'Mohamed Jibreel', folder: 'Muhammad_Jibreel_128kbps', appReciterIds: [111] },
  { id: 'ayyoub', label: 'Mohamed Ayyoub', folder: 'Muhammad_Ayyoub_128kbps', appReciterIds: [109] },
  { id: 'shatri', label: 'Abou Bakr Al-Chatri', folder: 'Abu_Bakr_Ash-Shaatree_128kbps', appReciterIds: [4] },
  { id: 'budair', label: 'Salah Al-Boudeir', folder: 'Salah_Al_Budair_128kbps', appReciterIds: [43] },
];

export const getPreferredEveryAyahReciterId = (appReciterId: number | null) => {
  if (!appReciterId) return EVERY_AYAH_RECITERS[0]?.id ?? '';

  return EVERY_AYAH_RECITERS.find((reciter) => reciter.appReciterIds.includes(appReciterId))?.id
    ?? EVERY_AYAH_RECITERS[0]?.id
    ?? '';
};

export const getEveryAyahReciterById = (id: string) => (
  EVERY_AYAH_RECITERS.find((reciter) => reciter.id === id) ?? null
);
