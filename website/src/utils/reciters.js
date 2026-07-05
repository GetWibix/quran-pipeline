export const reciters = [
  { id: 'Abdul_Basit_Murattal_64kbps', name: 'عبد الباسط (مرتل)', nameEn: 'Abdul Basit (Murattal)', img: '/images/abdul-basit.jpg' },
  { id: 'Alafasy_128kbps', name: 'مشاري العفاسي', nameEn: 'Mishary Alafasy', img: null },
  { id: 'Hudhaify_64kbps', name: 'علي الحذيفي', nameEn: 'Ali Al-Hudhaify', img: null },
  { id: 'Maher_AlMuaiqly_64kbps', name: 'ماهر المعيقلي', nameEn: 'Maher Al-Muaiqly', img: null },
  { id: 'Abdurrahmaan_As-Sudais_64kbps', name: 'عبد الرحمن السديس', nameEn: 'Abdurrahman As-Sudais', img: null },
  { id: 'Abu_Bakr_Ash-Shaatree_64kbps', name: 'أبو بكر الشاطري', nameEn: 'Abu Bakr Ash-Shaatree', img: null },
  { id: 'Yasser_Ad-Dussary_128kbps', name: 'ياسر الدوسري', nameEn: 'Yasser Ad-Dussary', img: null },
  { id: 'Ghamadi_40kbps', name: 'سعد الغامدي', nameEn: 'Saad Al-Ghamdi', img: null },
  { id: 'Husary_64kbps', name: 'محمود خليل الحصري', nameEn: 'Mahmoud Khalil Al-Husary', img: null },
  { id: 'Muhammad_Jibreel_64kbps', name: 'محمد جبريل', nameEn: 'Muhammad Jibreel', img: null },
  { id: 'Menshawi_32kbps', name: 'محمد المنشاوي', nameEn: 'Mohamed El-Menshawy', img: null },
  { id: 'Abdullah_Basfar_64kbps', name: 'عبد الله باسفر', nameEn: 'Abdullah Basfar', img: null },
  { id: 'Hani_Rifai_64kbps', name: 'هاني الرفاعي', nameEn: 'Hani Rifai', img: null },
  { id: 'Muhammad_Ayyoub_64kbps', name: 'محمد أيوب', nameEn: 'Muhammad Ayyoub', img: null },
  { id: 'Saood_ash-Shuraym_64kbps', name: 'سعود الشريم', nameEn: 'Saood Ash-Shuraym', img: null },
];

export const defaultReciter = reciters[0];

export function getReciterById(id) {
  return reciters.find(r => r.id === id) || defaultReciter;
}

export function getAudioUrl(surahNumber, ayahNumber, reciterId) {
  const num = surahNumber.toString().padStart(3, '0');
  const a = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/${reciterId}/${num}${a}.mp3`;
}
