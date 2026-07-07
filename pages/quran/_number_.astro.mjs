import { d as createAstro, c as createComponent, a as renderTemplate, u as unescapeHTML, r as renderComponent, m as maybeRenderHead, b as addAttribute } from '../../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_CmgA8ERQ.mjs';
import { $ as $$Header, b as $$Footer } from '../../chunks/Footer_BmWIUhSZ.mjs';
export { renderers } from '../../renderers.mjs';

const reciters = [
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

const defaultReciter = reciters[0];

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://quran.waxbix.com");
function getStaticPaths() {
  const surahs = [
    { number: 1, name: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629", englishName: "Al-Fatiha", englishNameTranslation: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
    { number: 2, name: "\u0627\u0644\u0628\u0642\u0631\u0629", englishName: "Al-Baqarah", englishNameTranslation: "The Cow", numberOfAyahs: 286, revelationType: "Medinan" },
    { number: 3, name: "\u0622\u0644 \u0639\u0645\u0631\u0627\u0646", englishName: "Aali Imran", englishNameTranslation: "Family of Imran", numberOfAyahs: 200, revelationType: "Medinan" },
    { number: 4, name: "\u0627\u0644\u0646\u0633\u0627\u0621", englishName: "An-Nisa'", englishNameTranslation: "The Women", numberOfAyahs: 176, revelationType: "Medinan" },
    { number: 5, name: "\u0627\u0644\u0645\u0627\u0626\u062F\u0629", englishName: "Al-Ma'idah", englishNameTranslation: "The Table Spread", numberOfAyahs: 120, revelationType: "Medinan" },
    { number: 6, name: "\u0627\u0644\u0623\u0646\u0639\u0627\u0645", englishName: "Al-An'am", englishNameTranslation: "The Cattle", numberOfAyahs: 165, revelationType: "Meccan" },
    { number: 7, name: "\u0627\u0644\u0623\u0639\u0631\u0627\u0641", englishName: "Al-A'raf", englishNameTranslation: "The Heights", numberOfAyahs: 206, revelationType: "Meccan" },
    { number: 8, name: "\u0627\u0644\u0623\u0646\u0641\u0627\u0644", englishName: "Al-Anfal", englishNameTranslation: "The Spoils of War", numberOfAyahs: 75, revelationType: "Medinan" },
    { number: 9, name: "\u0627\u0644\u062A\u0648\u0628\u0629", englishName: "At-Tawbah", englishNameTranslation: "The Repentance", numberOfAyahs: 129, revelationType: "Medinan" },
    { number: 10, name: "\u064A\u0648\u0646\u0633", englishName: "Yunus", englishNameTranslation: "Jonah", numberOfAyahs: 109, revelationType: "Meccan" },
    { number: 11, name: "\u0647\u0648\u062F", englishName: "Hud", englishNameTranslation: "Hud", numberOfAyahs: 123, revelationType: "Meccan" },
    { number: 12, name: "\u064A\u0648\u0633\u0641", englishName: "Yusuf", englishNameTranslation: "Joseph", numberOfAyahs: 111, revelationType: "Meccan" },
    { number: 13, name: "\u0627\u0644\u0631\u0639\u062F", englishName: "Ar-Ra'd", englishNameTranslation: "The Thunder", numberOfAyahs: 43, revelationType: "Medinan" },
    { number: 14, name: "\u0625\u0628\u0631\u0627\u0647\u064A\u0645", englishName: "Ibrahim", englishNameTranslation: "Abraham", numberOfAyahs: 52, revelationType: "Meccan" },
    { number: 15, name: "\u0627\u0644\u062D\u062C\u0631", englishName: "Al-Hijr", englishNameTranslation: "The Stone Land", numberOfAyahs: 99, revelationType: "Meccan" },
    { number: 16, name: "\u0627\u0644\u0646\u062D\u0644", englishName: "An-Nahl", englishNameTranslation: "The Bee", numberOfAyahs: 128, revelationType: "Meccan" },
    { number: 17, name: "\u0627\u0644\u0625\u0633\u0631\u0627\u0621", englishName: "Al-Isra'", englishNameTranslation: "The Night Journey", numberOfAyahs: 111, revelationType: "Meccan" },
    { number: 18, name: "\u0627\u0644\u0643\u0647\u0641", englishName: "Al-Kahf", englishNameTranslation: "The Cave", numberOfAyahs: 110, revelationType: "Meccan" },
    { number: 19, name: "\u0645\u0631\u064A\u0645", englishName: "Maryam", englishNameTranslation: "Mary", numberOfAyahs: 98, revelationType: "Meccan" },
    { number: 20, name: "\u0637\u0647", englishName: "Ta-Ha", englishNameTranslation: "Ta-Ha", numberOfAyahs: 135, revelationType: "Meccan" },
    { number: 21, name: "\u0627\u0644\u0623\u0646\u0628\u064A\u0627\u0621", englishName: "Al-Anbiya'", englishNameTranslation: "The Prophets", numberOfAyahs: 112, revelationType: "Meccan" },
    { number: 22, name: "\u0627\u0644\u062D\u062C", englishName: "Al-Hajj", englishNameTranslation: "The Pilgrimage", numberOfAyahs: 78, revelationType: "Medinan" },
    { number: 23, name: "\u0627\u0644\u0645\u0624\u0645\u0646\u0648\u0646", englishName: "Al-Mu'minun", englishNameTranslation: "The Believers", numberOfAyahs: 118, revelationType: "Meccan" },
    { number: 24, name: "\u0627\u0644\u0646\u0648\u0631", englishName: "An-Nur", englishNameTranslation: "The Light", numberOfAyahs: 64, revelationType: "Medinan" },
    { number: 25, name: "\u0627\u0644\u0641\u0631\u0642\u0627\u0646", englishName: "Al-Furqan", englishNameTranslation: "The Criterion", numberOfAyahs: 77, revelationType: "Meccan" },
    { number: 26, name: "\u0627\u0644\u0634\u0639\u0631\u0627\u0621", englishName: "Ash-Shu'ara'", englishNameTranslation: "The Poets", numberOfAyahs: 227, revelationType: "Meccan" },
    { number: 27, name: "\u0627\u0644\u0646\u0645\u0644", englishName: "An-Naml", englishNameTranslation: "The Ant", numberOfAyahs: 93, revelationType: "Meccan" },
    { number: 28, name: "\u0627\u0644\u0642\u0635\u0635", englishName: "Al-Qasas", englishNameTranslation: "The Stories", numberOfAyahs: 88, revelationType: "Meccan" },
    { number: 29, name: "\u0627\u0644\u0639\u0646\u0643\u0628\u0648\u062A", englishName: "Al-Ankabut", englishNameTranslation: "The Spider", numberOfAyahs: 69, revelationType: "Meccan" },
    { number: 30, name: "\u0627\u0644\u0631\u0648\u0645", englishName: "Ar-Rum", englishNameTranslation: "The Romans", numberOfAyahs: 60, revelationType: "Meccan" },
    { number: 31, name: "\u0644\u0642\u0645\u0627\u0646", englishName: "Luqman", englishNameTranslation: "Luqman", numberOfAyahs: 34, revelationType: "Meccan" },
    { number: 32, name: "\u0627\u0644\u0633\u062C\u062F\u0629", englishName: "As-Sajdah", englishNameTranslation: "The Prostration", numberOfAyahs: 30, revelationType: "Meccan" },
    { number: 33, name: "\u0627\u0644\u0623\u062D\u0632\u0627\u0628", englishName: "Al-Ahzab", englishNameTranslation: "The Combined Forces", numberOfAyahs: 73, revelationType: "Medinan" },
    { number: 34, name: "\u0633\u0628\u0623", englishName: "Saba'", englishNameTranslation: "Sheba", numberOfAyahs: 54, revelationType: "Meccan" },
    { number: 35, name: "\u0641\u0627\u0637\u0631", englishName: "Fatir", englishNameTranslation: "The Originator", numberOfAyahs: 45, revelationType: "Meccan" },
    { number: 36, name: "\u064A\u0633", englishName: "Ya-Seen", englishNameTranslation: "Ya-Seen", numberOfAyahs: 83, revelationType: "Meccan" },
    { number: 37, name: "\u0627\u0644\u0635\u0627\u0641\u0627\u062A", englishName: "As-Saffat", englishNameTranslation: "Those Who Set the Ranks", numberOfAyahs: 182, revelationType: "Meccan" },
    { number: 38, name: "\u0635", englishName: "Sad", englishNameTranslation: "The Letter Sad", numberOfAyahs: 88, revelationType: "Meccan" },
    { number: 39, name: "\u0627\u0644\u0632\u0645\u0631", englishName: "Az-Zumar", englishNameTranslation: "The Groups", numberOfAyahs: 75, revelationType: "Meccan" },
    { number: 40, name: "\u063A\u0627\u0641\u0631", englishName: "Ghafir", englishNameTranslation: "The Forgiver", numberOfAyahs: 85, revelationType: "Meccan" },
    { number: 41, name: "\u0641\u0635\u0644\u062A", englishName: "Fussilat", englishNameTranslation: "Explained in Detail", numberOfAyahs: 54, revelationType: "Meccan" },
    { number: 42, name: "\u0627\u0644\u0634\u0648\u0631\u0649", englishName: "Ash-Shura", englishNameTranslation: "The Consultation", numberOfAyahs: 53, revelationType: "Meccan" },
    { number: 43, name: "\u0627\u0644\u0632\u062E\u0631\u0641", englishName: "Az-Zukhruf", englishNameTranslation: "The Ornaments of Gold", numberOfAyahs: 89, revelationType: "Meccan" },
    { number: 44, name: "\u0627\u0644\u062F\u062E\u0627\u0646", englishName: "Ad-Dukhan", englishNameTranslation: "The Smoke", numberOfAyahs: 59, revelationType: "Meccan" },
    { number: 45, name: "\u0627\u0644\u062C\u0627\u062B\u064A\u0629", englishName: "Al-Jathiyah", englishNameTranslation: "The Kneeling", numberOfAyahs: 37, revelationType: "Meccan" },
    { number: 46, name: "\u0627\u0644\u0623\u062D\u0642\u0627\u0641", englishName: "Al-Ahqaf", englishNameTranslation: "The Wind-Curved Sandhills", numberOfAyahs: 35, revelationType: "Meccan" },
    { number: 47, name: "\u0645\u062D\u0645\u062F", englishName: "Muhammad", englishNameTranslation: "Muhammad", numberOfAyahs: 38, revelationType: "Medinan" },
    { number: 48, name: "\u0627\u0644\u0641\u062A\u062D", englishName: "Al-Fath", englishNameTranslation: "The Victory", numberOfAyahs: 29, revelationType: "Medinan" },
    { number: 49, name: "\u0627\u0644\u062D\u062C\u0631\u0627\u062A", englishName: "Al-Hujurat", englishNameTranslation: "The Rooms", numberOfAyahs: 18, revelationType: "Medinan" },
    { number: 50, name: "\u0642", englishName: "Qaf", englishNameTranslation: "The Letter Qaf", numberOfAyahs: 45, revelationType: "Meccan" },
    { number: 51, name: "\u0627\u0644\u0630\u0627\u0631\u064A\u0627\u062A", englishName: "Adh-Dhariyat", englishNameTranslation: "The Winnowing Winds", numberOfAyahs: 60, revelationType: "Meccan" },
    { number: 52, name: "\u0627\u0644\u0637\u0648\u0631", englishName: "At-Tur", englishNameTranslation: "The Mount", numberOfAyahs: 49, revelationType: "Meccan" },
    { number: 53, name: "\u0627\u0644\u0646\u062C\u0645", englishName: "An-Najm", englishNameTranslation: "The Star", numberOfAyahs: 62, revelationType: "Meccan" },
    { number: 54, name: "\u0627\u0644\u0642\u0645\u0631", englishName: "Al-Qamar", englishNameTranslation: "The Moon", numberOfAyahs: 55, revelationType: "Meccan" },
    { number: 55, name: "\u0627\u0644\u0631\u062D\u0645\u0646", englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan" },
    { number: 56, name: "\u0627\u0644\u0648\u0627\u0642\u0639\u0629", englishName: "Al-Waqi'ah", englishNameTranslation: "The Inevitable", numberOfAyahs: 96, revelationType: "Meccan" },
    { number: 57, name: "\u0627\u0644\u062D\u062F\u064A\u062F", englishName: "Al-Hadid", englishNameTranslation: "The Iron", numberOfAyahs: 29, revelationType: "Medinan" },
    { number: 58, name: "\u0627\u0644\u0645\u062C\u0627\u062F\u0644\u0629", englishName: "Al-Mujadila", englishNameTranslation: "The Pleading Woman", numberOfAyahs: 22, revelationType: "Medinan" },
    { number: 59, name: "\u0627\u0644\u062D\u0634\u0631", englishName: "Al-Hashr", englishNameTranslation: "The Exile", numberOfAyahs: 24, revelationType: "Medinan" },
    { number: 60, name: "\u0627\u0644\u0645\u0645\u062A\u062D\u0646\u0629", englishName: "Al-Mumtahanah", englishNameTranslation: "She That Is to Be Examined", numberOfAyahs: 13, revelationType: "Medinan" },
    { number: 61, name: "\u0627\u0644\u0635\u0641", englishName: "As-Saf", englishNameTranslation: "The Ranks", numberOfAyahs: 14, revelationType: "Medinan" },
    { number: 62, name: "\u0627\u0644\u062C\u0645\u0639\u0629", englishName: "Al-Jumu'ah", englishNameTranslation: "The Congregation Friday", numberOfAyahs: 11, revelationType: "Medinan" },
    { number: 63, name: "\u0627\u0644\u0645\u0646\u0627\u0641\u0642\u0648\u0646", englishName: "Al-Munafiqun", englishNameTranslation: "The Hypocrites", numberOfAyahs: 11, revelationType: "Medinan" },
    { number: 64, name: "\u0627\u0644\u062A\u063A\u0627\u0628\u0646", englishName: "At-Taghabun", englishNameTranslation: "The Mutual Disillusion", numberOfAyahs: 18, revelationType: "Medinan" },
    { number: 65, name: "\u0627\u0644\u0637\u0644\u0627\u0642", englishName: "At-Talaq", englishNameTranslation: "The Divorce", numberOfAyahs: 12, revelationType: "Medinan" },
    { number: 66, name: "\u0627\u0644\u062A\u062D\u0631\u064A\u0645", englishName: "At-Tahrim", englishNameTranslation: "The Prohibition", numberOfAyahs: 12, revelationType: "Medinan" },
    { number: 67, name: "\u0627\u0644\u0645\u0644\u0643", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan" },
    { number: 68, name: "\u0627\u0644\u0642\u0644\u0645", englishName: "Al-Qalam", englishNameTranslation: "The Pen", numberOfAyahs: 52, revelationType: "Meccan" },
    { number: 69, name: "\u0627\u0644\u062D\u0627\u0642\u0629", englishName: "Al-Haqqah", englishNameTranslation: "The Reality", numberOfAyahs: 52, revelationType: "Meccan" },
    { number: 70, name: "\u0627\u0644\u0645\u0639\u0627\u0631\u062C", englishName: "Al-Ma'arij", englishNameTranslation: "The Ascending Stairways", numberOfAyahs: 44, revelationType: "Meccan" },
    { number: 71, name: "\u0646\u0648\u062D", englishName: "Nuh", englishNameTranslation: "Noah", numberOfAyahs: 28, revelationType: "Meccan" },
    { number: 72, name: "\u0627\u0644\u062C\u0646", englishName: "Al-Jinn", englishNameTranslation: "The Jinn", numberOfAyahs: 28, revelationType: "Meccan" },
    { number: 73, name: "\u0627\u0644\u0645\u0632\u0645\u0644", englishName: "Al-Muzzammil", englishNameTranslation: "The Enshrouded One", numberOfAyahs: 20, revelationType: "Meccan" },
    { number: 74, name: "\u0627\u0644\u0645\u062F\u062B\u0631", englishName: "Al-Muddaththir", englishNameTranslation: "The Cloaked One", numberOfAyahs: 56, revelationType: "Meccan" },
    { number: 75, name: "\u0627\u0644\u0642\u064A\u0627\u0645\u0629", englishName: "Al-Qiyamah", englishNameTranslation: "The Resurrection", numberOfAyahs: 40, revelationType: "Meccan" },
    { number: 76, name: "\u0627\u0644\u0625\u0646\u0633\u0627\u0646", englishName: "Al-Insan", englishNameTranslation: "The Man", numberOfAyahs: 31, revelationType: "Medinan" },
    { number: 77, name: "\u0627\u0644\u0645\u0631\u0633\u0644\u0627\u062A", englishName: "Al-Mursalat", englishNameTranslation: "The Emissaries", numberOfAyahs: 50, revelationType: "Meccan" },
    { number: 78, name: "\u0627\u0644\u0646\u0628\u0623", englishName: "An-Naba'", englishNameTranslation: "The Great News", numberOfAyahs: 40, revelationType: "Meccan" },
    { number: 79, name: "\u0627\u0644\u0646\u0627\u0632\u0639\u0627\u062A", englishName: "An-Nazi'at", englishNameTranslation: "Those Who Drag Forth", numberOfAyahs: 46, revelationType: "Meccan" },
    { number: 80, name: "\u0639\u0628\u0633", englishName: "Abasa", englishNameTranslation: "He Frowned", numberOfAyahs: 42, revelationType: "Meccan" },
    { number: 81, name: "\u0627\u0644\u062A\u0643\u0648\u064A\u0631", englishName: "At-Takwir", englishNameTranslation: "The Overthrowing", numberOfAyahs: 29, revelationType: "Meccan" },
    { number: 82, name: "\u0627\u0644\u0627\u0646\u0641\u0637\u0627\u0631", englishName: "Al-Infitar", englishNameTranslation: "The Cleaving", numberOfAyahs: 19, revelationType: "Meccan" },
    { number: 83, name: "\u0627\u0644\u0645\u0637\u0641\u0641\u064A\u0646", englishName: "Al-Mutaffifin", englishNameTranslation: "The Defrauding", numberOfAyahs: 36, revelationType: "Meccan" },
    { number: 84, name: "\u0627\u0644\u0627\u0646\u0634\u0642\u0627\u0642", englishName: "Al-Inshiqaq", englishNameTranslation: "The Sundering", numberOfAyahs: 25, revelationType: "Meccan" },
    { number: 85, name: "\u0627\u0644\u0628\u0631\u0648\u062C", englishName: "Al-Buruj", englishNameTranslation: "The Mansions of the Stars", numberOfAyahs: 22, revelationType: "Meccan" },
    { number: 86, name: "\u0627\u0644\u0637\u0627\u0631\u0642", englishName: "At-Tariq", englishNameTranslation: "The Nightcommer", numberOfAyahs: 17, revelationType: "Meccan" },
    { number: 87, name: "\u0627\u0644\u0623\u0639\u0644\u0649", englishName: "Al-A'la", englishNameTranslation: "The Most High", numberOfAyahs: 19, revelationType: "Meccan" },
    { number: 88, name: "\u0627\u0644\u063A\u0627\u0634\u064A\u0629", englishName: "Al-Ghashiyah", englishNameTranslation: "The Overwhelming", numberOfAyahs: 26, revelationType: "Meccan" },
    { number: 89, name: "\u0627\u0644\u0641\u062C\u0631", englishName: "Al-Fajr", englishNameTranslation: "The Dawn", numberOfAyahs: 30, revelationType: "Meccan" },
    { number: 90, name: "\u0627\u0644\u0628\u0644\u062F", englishName: "Al-Balad", englishNameTranslation: "The City", numberOfAyahs: 20, revelationType: "Meccan" },
    { number: 91, name: "\u0627\u0644\u0634\u0645\u0633", englishName: "Ash-Shams", englishNameTranslation: "The Sun", numberOfAyahs: 15, revelationType: "Meccan" },
    { number: 92, name: "\u0627\u0644\u0644\u064A\u0644", englishName: "Al-Layl", englishNameTranslation: "The Night", numberOfAyahs: 21, revelationType: "Meccan" },
    { number: 93, name: "\u0627\u0644\u0636\u062D\u0649", englishName: "Ad-Duha", englishNameTranslation: "The Morning Hours", numberOfAyahs: 11, revelationType: "Meccan" },
    { number: 94, name: "\u0627\u0644\u0634\u0631\u062D", englishName: "Ash-Sharh", englishNameTranslation: "The Relief", numberOfAyahs: 8, revelationType: "Meccan" },
    { number: 95, name: "\u0627\u0644\u062A\u064A\u0646", englishName: "At-Tin", englishNameTranslation: "The Fig", numberOfAyahs: 8, revelationType: "Meccan" },
    { number: 96, name: "\u0627\u0644\u0639\u0644\u0642", englishName: "Al-Alaq", englishNameTranslation: "The Clot", numberOfAyahs: 19, revelationType: "Meccan" },
    { number: 97, name: "\u0627\u0644\u0642\u062F\u0631", englishName: "Al-Qadr", englishNameTranslation: "The Power", numberOfAyahs: 5, revelationType: "Meccan" },
    { number: 98, name: "\u0627\u0644\u0628\u064A\u0646\u0629", englishName: "Al-Bayyinah", englishNameTranslation: "The Clear Proof", numberOfAyahs: 8, revelationType: "Medinan" },
    { number: 99, name: "\u0627\u0644\u0632\u0644\u0632\u0644\u0629", englishName: "Az-Zalzalah", englishNameTranslation: "The Earthquake", numberOfAyahs: 8, revelationType: "Medinan" },
    { number: 100, name: "\u0627\u0644\u0639\u0627\u062F\u064A\u0627\u062A", englishName: "Al-'Adiyat", englishNameTranslation: "The Courser", numberOfAyahs: 11, revelationType: "Meccan" },
    { number: 101, name: "\u0627\u0644\u0642\u0627\u0631\u0639\u0629", englishName: "Al-Qari'ah", englishNameTranslation: "The Calamity", numberOfAyahs: 11, revelationType: "Meccan" },
    { number: 102, name: "\u0627\u0644\u062A\u0643\u0627\u062B\u0631", englishName: "At-Takathur", englishNameTranslation: "The Rivalry in Worldly Increase", numberOfAyahs: 8, revelationType: "Meccan" },
    { number: 103, name: "\u0627\u0644\u0639\u0635\u0631", englishName: "Al-'Asr", englishNameTranslation: "The Declining Day", numberOfAyahs: 3, revelationType: "Meccan" },
    { number: 104, name: "\u0627\u0644\u0647\u0645\u0632\u0629", englishName: "Al-Humazah", englishNameTranslation: "The Traducer", numberOfAyahs: 9, revelationType: "Meccan" },
    { number: 105, name: "\u0627\u0644\u0641\u064A\u0644", englishName: "Al-Fil", englishNameTranslation: "The Elephant", numberOfAyahs: 5, revelationType: "Meccan" },
    { number: 106, name: "\u0642\u0631\u064A\u0634", englishName: "Quraysh", englishNameTranslation: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" },
    { number: 107, name: "\u0627\u0644\u0645\u0627\u0639\u0648\u0646", englishName: "Al-Ma'un", englishNameTranslation: "The Small Kindnesses", numberOfAyahs: 7, revelationType: "Meccan" },
    { number: 108, name: "\u0627\u0644\u0643\u0648\u062B\u0631", englishName: "Al-Kawthar", englishNameTranslation: "The Abundance", numberOfAyahs: 3, revelationType: "Meccan" },
    { number: 109, name: "\u0627\u0644\u0643\u0627\u0641\u0631\u0648\u0646", englishName: "Al-Kafirun", englishNameTranslation: "The Disbelievers", numberOfAyahs: 6, revelationType: "Meccan" },
    { number: 110, name: "\u0627\u0644\u0646\u0635\u0631", englishName: "An-Nasr", englishNameTranslation: "The Divine Support", numberOfAyahs: 3, revelationType: "Medinan" },
    { number: 111, name: "\u0627\u0644\u0645\u0633\u062F", englishName: "Al-Masad", englishNameTranslation: "The Palm Fiber", numberOfAyahs: 5, revelationType: "Meccan" },
    { number: 112, name: "\u0627\u0644\u0625\u062E\u0644\u0627\u0635", englishName: "Al-Ikhlas", englishNameTranslation: "The Sincerity", numberOfAyahs: 4, revelationType: "Meccan" },
    { number: 113, name: "\u0627\u0644\u0641\u0644\u0642", englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan" },
    { number: 114, name: "\u0627\u0644\u0646\u0627\u0633", englishName: "An-Nas", englishNameTranslation: "Mankind", numberOfAyahs: 6, revelationType: "Meccan" }
  ];
  return surahs.map((surah) => ({
    params: { number: String(surah.number) },
    props: { surah }
  }));
}
const $$number = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$number;
  const { surah } = Astro2.props;
  const revelationAr = surah.revelationType === "Meccan" ? "\u0645\u0643\u064A\u0629" : "\u0645\u062F\u0646\u064A\u0629";
  async function fetchAyahs(surahNumber) {
    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}`;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(1e4) });
        const data = await res.json();
        if (data.data?.ayahs) return data.data.ayahs;
      } catch {
      }
      await new Promise((r) => setTimeout(r, 1e3 * (i + 1)));
    }
    return [];
  }
  const ayahs = await fetchAyahs(surah.number);
  const ayahsJson = JSON.stringify(ayahs.map((a) => ({ numberInSurah: a.numberInSurah, text: a.text })));
  const recitersJson = JSON.stringify(reciters);
  const gradientFrom = surah.number % 3 === 0 ? "from-emerald-600" : surah.number % 3 === 1 ? "from-accent" : "from-green-700";
  const gradientVia = surah.number % 3 === 0 ? "via-emerald-800" : surah.number % 3 === 1 ? "via-accent/80" : "via-green-900";
  const gradientTo = "to-bg-dark";
  return renderTemplate(_a || (_a = __template(["", ' <script id="reciters-data" type="application/json">', '<\/script> <script id="ayahs-data" type="application/json">', "<\/script> "])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": `\u0633\u0648\u0631\u0629 ${surah.name} - \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645`, "description": `\u0627\u0633\u062A\u0645\u0639 \u0625\u0644\u0649 \u0633\u0648\u0631\u0629 ${surah.name} (${surah.englishName}) \u0645\u0643\u062A\u0648\u0628\u0629 \u0643\u0627\u0645\u0644\u0629 \u0628\u0635\u0648\u062A \u0623\u0634\u0647\u0631 \u0627\u0644\u0642\u0631\u0627\u0621. ${surah.numberOfAyahs} \u0622\u064A\u0629 ${revelationAr}. \u0627\u0633\u062A\u0645\u0627\u0639 \u0648\u062A\u062D\u0645\u064A\u0644 \u0648\u062A\u0641\u0633\u064A\u0631.`, "canonical": `https://quran.waxbix.com/quran/${surah.number}`, "ogImage": `https://quran.waxbix.com/og-quran.png` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<div class="min-h-screen flex flex-col"> <div${addAttribute(`bg-gradient-to-b ${gradientFrom} ${gradientVia} ${gradientTo} pt-16 md:pt-20`, "class")}> <div class="max-w-4xl mx-auto px-4 pt-8 pb-6 md:pb-8"> <a href="/quran" class="inline-flex items-center gap-1.5 text-xs xs:text-sm text-white/60 hover:text-white transition-colors mb-4 xs:mb-6 py-2 min-h-[44px]"> <svg class="w-3 h-3 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path> </svg>
رجوع
</a> <div class="relative flex flex-col md:flex-row gap-4 xs:gap-6 md:gap-8 items-center md:items-end"> <div class="flex gap-3 md:gap-4 items-end"> <div class="w-32 h-32 xs:w-40 xs:h-40 md:w-56 md:h-56 rounded-xl shadow-2xl bg-gradient-to-br from-accent/40 to-emerald-700 flex-shrink-0 flex items-center justify-center -mt-4"> <div class="text-center"> <div class="text-4xl xs:text-5xl md:text-7xl font-bold text-white font-amiri">${surah.number}</div> <div class="text-[10px] xs:text-xs text-white/60 mt-1">سورة</div> </div> </div> </div> <div class="flex-1 min-w-0 text-center md:text-right pb-1"> <p class="text-[10px] md:text-xs text-white/60 uppercase tracking-widest mb-1">القرآن الكريم</p> <h1 class="text-2xl xs:text-3xl md:text-5xl lg:text-6xl font-bold text-white font-amiri">${surah.name}</h1> <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center md:justify-start"> <span class="text-xs xs:text-sm md:text-base text-white/80">${surah.englishName}</span> <span class="text-white/40 hidden md:inline">·</span> <span class="text-xs xs:text-sm md:text-base text-white/60">${surah.englishNameTranslation}</span> </div> <div id="reciter-info" class="flex items-center gap-2 mt-3 justify-center md:justify-start cursor-pointer" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false"> <div id="reciter-avatar" class="w-7 h-7 xs:w-8 xs:h-8 md:w-10 md:h-10 rounded-full ring-2 ring-white/20 flex-shrink-0 overflow-hidden bg-accent/20 flex items-center justify-center"> <img src="/images/abdul-basit.jpg" alt="" class="w-full h-full object-cover" loading="lazy"> </div> <div> <p class="text-[10px] xs:text-xs text-white/50">القارئ</p> <div class="flex items-center gap-1"> <span id="reciter-name" class="text-xs xs:text-sm md:text-base text-white font-medium leading-tight">الشيخ عبد الباسط عبد الصمد</span> <svg class="w-2.5 h-2.5 xs:w-3 xs:h-3 text-white/40 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </div> </div> </div> <div id="reciter-dropdown" class="hidden absolute z-20 top-full mt-2 left-0 right-0 md:right-auto md:w-72 bg-bg-dark border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto" role="listbox"> <div class="p-2 space-y-0.5"> ${reciters.map((r) => renderTemplate`<button${addAttribute(r.id, "data-reciter")} class="reciter-option w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right hover:bg-white/5 transition-colors min-h-[44px]" role="option"${addAttribute(r.id === defaultReciter.id, "aria-selected")}> <div class="w-8 h-8 rounded-full bg-accent/20 flex-shrink-0 overflow-hidden flex items-center justify-center"> ${r.img ? renderTemplate`<img${addAttribute(r.img, "src")} alt="" class="w-full h-full object-cover" loading="lazy">` : renderTemplate`<span class="text-xs text-accent font-bold">${r.name.charAt(0)}</span>`} </div> <div class="text-right"> <p class="text-sm text-white font-medium">${r.name}</p> <p class="text-xs text-text-muted">${r.nameEn}</p> </div> </button>`)} </div> </div> </div> </div> <div class="flex items-center justify-between mt-2 md:mt-4"> <div class="flex items-center gap-3 text-[10px] xs:text-xs md:text-sm text-white/60"> <span>${surah.numberOfAyahs} آية</span> <span>·</span> <span>${revelationAr}</span> </div> </div> <div class="flex items-center gap-2 xs:gap-4 mt-4"> <button id="play-all-btn" class="w-12 h-12 xs:w-14 xs:h-14 rounded-full bg-accent hover:bg-accent/80 text-white flex items-center justify-center shadow-xl shadow-accent/30 transition-all hover:scale-105 active:scale-95 flex-shrink-0"> <svg class="w-5 h-5 xs:w-6 xs:h-6 mr-1" fill="currentColor" viewBox="0 0 384 512"> <path d="M73 39c-14.8-9.3-33.4-9.1-48 .3-14.7 9.5-23.7 25.9-23.7 43.6v346.2c0 17.7 9 34.1 23.7 43.6 14.6 9.4 33.2 9.6 48 .3l288-194.3c14.4-9.7 22.3-25.1 22.3-41s-7.9-31.3-22.3-41L73 39z"></path> </svg> </button> <div class="text-xs md:text-sm text-white/60"> <span class="font-bold text-white text-xs xs:text-sm md:text-base">شغل الكل</span> <br class="hidden md:block"> <span class="hidden md:inline text-white/50">استمع إلى السورة كاملة</span> </div> <div class="flex-1"></div> <button id="download-surah-btn" title="تحميل السورة" class="w-10 h-10 xs:w-11 xs:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 flex-shrink-0" aria-label="تحميل السورة"> <svg class="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path> </svg> </button> <a href="https://dm.qurancomplex.gov.sa/" target="_blank" rel="noopener noreferrer" title="تحميل المصحف الشريف" class="w-10 h-10 xs:w-11 xs:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 flex-shrink-0" aria-label="تحميل المصحف الشريف"> <svg class="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path> </svg> </a> </div> </div> </div> <div class="flex-1 bg-bg-dark px-4 pb-4" style="margin-top: -1px;"> <div class="max-w-4xl mx-auto"> <div class="pb-3 pt-4"> <div class="relative"> <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xs:w-4 xs:h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> <input type="text" id="ayah-search" placeholder="ابحث في الآيات..." class="w-full px-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors min-h-[44px]" autocomplete="off"> </div> </div> </div> </div> <div class="flex-1 bg-bg-dark px-4 pb-4" style="margin-top: -1px;"> <div class="max-w-4xl mx-auto"> <div class="flex items-center gap-4 px-3 py-2 border-b border-white/5 text-[10px] xs:text-xs text-text-muted sticky top-0 bg-bg-dark z-10"> <div class="w-7 md:w-8 flex-shrink-0 text-center">#</div> <div class="flex-1 pr-2">الآية</div> <div class="w-16 flex-shrink-0 flex items-center justify-center gap-1"> <svg class="w-3 h-3 xs:w-3.5 xs:h-3.5" fill="currentColor" viewBox="0 0 320 512"> <path d="M48 64C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48v288c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"></path> </svg> <span class="text-[10px] text-text-muted">تنزيل</span> </div> </div> <div id="ayahs-container" class="space-y-0"> ${ayahs.map((ayah) => renderTemplate`<div class="group flex items-center gap-2 xs:gap-4 px-2 xs:px-3 py-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer"${addAttribute(`ayah-${ayah.numberInSurah}`, "id")} role="button"${addAttribute(0, "tabindex")}> <div class="w-7 md:w-8 flex-shrink-0 text-center"> <span class="text-xs md:text-sm text-text-muted group-hover:hidden">${ayah.numberInSurah}</span> <button${addAttribute(ayah.numberInSurah, "data-ayah")} class="play-btn w-7 h-7 hidden group-hover:flex items-center justify-center mx-auto hover:scale-110 transition-transform"${addAttribute(`\u0627\u0633\u062A\u0645\u0627\u0639 \u0644\u0644\u0622\u064A\u0629 ${ayah.numberInSurah}`, "aria-label")}> <svg class="w-3.5 h-3.5 text-white mr-0.5" fill="currentColor" viewBox="0 0 384 512"> <path d="M73 39c-14.8-9.3-33.4-9.1-48 .3-14.7 9.5-23.7 25.9-23.7 43.6v346.2c0 17.7 9 34.1 23.7 43.6 14.6 9.4 33.2 9.6 48 .3l288-194.3c14.4-9.7 22.3-25.1 22.3-41s-7.9-31.3-22.3-41L73 39z"></path> </svg> </button> </div> <div class="flex-1 min-w-0 pr-2"> <div class="arabic-verse text-sm xs:text-base md:text-xl text-white group-hover:text-white transition-colors line-clamp-2">${ayah.text}</div> </div> <div class="flex items-center gap-1 flex-shrink-0"> <button${addAttribute(ayah.numberInSurah, "data-ayah")} class="play-btn hover:scale-110 transition-transform"${addAttribute(`\u0627\u0633\u062A\u0645\u0627\u0639 \u0644\u0644\u0622\u064A\u0629 ${ayah.numberInSurah}`, "aria-label")}> <svg class="w-3 h-3 xs:w-3.5 xs:h-3.5 md:w-4 md:h-4 text-text-muted hover:text-accent transition-colors mr-0.5" fill="currentColor" viewBox="0 0 384 512"> <path d="M73 39c-14.8-9.3-33.4-9.1-48 .3-14.7 9.5-23.7 25.9-23.7 43.6v346.2c0 17.7 9 34.1 23.7 43.6 14.6 9.4 33.2 9.6 48 .3l288-194.3c14.4-9.7 22.3-25.1 22.3-41s-7.9-31.3-22.3-41L73 39z"></path> </svg> </button> <button${addAttribute(ayah.numberInSurah, "data-ayah")} class="download-btn opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"${addAttribute(`\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0622\u064A\u0629 ${ayah.numberInSurah}`, "aria-label")}> <svg class="w-2.5 h-2.5 xs:w-3 xs:h-3 text-text-muted hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path> </svg> </button> </div> <audio${addAttribute(ayah.numberInSurah, "data-audio")} preload="none"></audio> </div>`)} </div> <div id="download-progress" class="hidden text-center text-xs text-text-muted py-4"></div> </div> </div> </div> ${renderComponent($$result2, "Footer", $$Footer, {})} ` }), unescapeHTML(recitersJson), unescapeHTML(ayahsJson));
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/quran/[number].astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/quran/[number].astro";
const $$url = "/quran/[number]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$number,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
