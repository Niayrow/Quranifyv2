import type { Reciter } from '../types';

const FULL_SURAH_LIST = Array.from({ length: 114 }, (_, index) => index + 1).join(',');

export const SEEDED_RECITERS: Reciter[] = [
  { id: 108, name: 'Mohammed El-Muhasny', letter: 'M', moshaf: [{ id: 108, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server11.mp3quran.net/mhsny/', surah_list: FULL_SURAH_LIST }] },
  { id: 118, name: 'Mahmoud Khalil Al-Hussary', letter: 'M', moshaf: [{ id: 118, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server13.mp3quran.net/husr/', surah_list: FULL_SURAH_LIST }] },
  { id: 104, name: 'Mohammad Al-Airawy', letter: 'M', moshaf: [{ id: 104, name: "Rewayat Warsh A'n Nafi' Men Tariq Alazraq - Psalmodié", server: 'https://server6.mp3quran.net/earawi/', surah_list: FULL_SURAH_LIST }] },
  { id: 54, name: 'Abderrahmane Soudais', letter: 'A', moshaf: [{ id: 54, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server11.mp3quran.net/sds/', surah_list: FULL_SURAH_LIST }] },
  { id: 44, name: 'Salah Al-Hachem', letter: 'S', moshaf: [{ id: 44, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server12.mp3quran.net/salah_hashim_m/', surah_list: FULL_SURAH_LIST }] },
  { id: 78, name: 'Imad Zouhaire Hafed', letter: 'I', moshaf: [{ id: 78, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server6.mp3quran.net/hafz/', surah_list: FULL_SURAH_LIST }] },
  { id: 60, name: 'Abdellah Basfer', letter: 'A', moshaf: [{ id: 60, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server6.mp3quran.net/bsfr/', surah_list: FULL_SURAH_LIST }] },
  { id: 94, name: 'Yasser Al-Faylakawi', letter: 'Y', moshaf: [{ id: 94, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server6.mp3quran.net/fyl/', surah_list: FULL_SURAH_LIST }] },
  { id: 112, name: 'Mohamed Seddik El Manchaoui', letter: 'M', moshaf: [{ id: 112, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server10.mp3quran.net/minsh/', surah_list: FULL_SURAH_LIST }] },
  { id: 2, name: 'Ibrahime Al Jebrine', letter: 'I', moshaf: [{ id: 2, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server6.mp3quran.net/jbreen/', surah_list: FULL_SURAH_LIST }] },
  { id: 3, name: 'Ibrahime Al Assiri', letter: 'I', moshaf: [{ id: 3, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server6.mp3quran.net/3siri/', surah_list: FULL_SURAH_LIST }] },
  { id: 1, name: 'Ibrahime Al Akhdar', letter: 'I', moshaf: [{ id: 1, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server6.mp3quran.net/akdr/', surah_list: FULL_SURAH_LIST }] },
  { id: 10, name: 'Akram Alalaqmi', letter: 'A', moshaf: [{ id: 10, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server9.mp3quran.net/akrm/', surah_list: FULL_SURAH_LIST }] },
  { id: 100, name: 'Majed Al Enezi', letter: 'M', moshaf: [{ id: 100, name: "Rewayat Hafs A'n Assem - Psalmodié", server: 'https://server8.mp3quran.net/majd_onazi/', surah_list: FULL_SURAH_LIST }] }
];
