const API_BASE = 'https://api.alquran.cloud/v1';

export async function getSurahs() {
  const res = await fetch(`${API_BASE}/surah`);
  const data = await res.json();
  return data.data;
}

export async function getSurah(number) {
  const res = await fetch(`${API_BASE}/surah/${number}`);
  const data = await res.json();
  return data.data;
}

export async function getAyahs(surahNumber) {
  const res = await fetch(`${API_BASE}/surah/${surahNumber}/ar.asad`);
  const data = await res.json();
  return data.data.ayahs;
}

export function getAudioUrl(ayahKey) {
  const [surah, ayah] = ayahKey.split(':');
  const num = surah.toString().padStart(3, '0');
  const a = ayah.toString().padStart(3, '0');
  return `https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/${num}${a}.mp3`;
}
