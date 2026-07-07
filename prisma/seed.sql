--
-- PostgreSQL database dump
--

\restrict 69o8DlPvDQrgUDXFye7dwZ8mJEx6OTS82RfNBmnrh7GVHAC2ijGeQ3V48GCCNhX

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: AgentDecisionLog; Type: TABLE DATA; Schema: public; Owner: quran_user
--



--
-- Data for Name: PublishedContent; Type: TABLE DATA; Schema: public; Owner: quran_user
--

INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmqzxlpiy00004a7hongcru87', 'SHORT', 2, 21, 22, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/SHORT-2-21-22.mp4', NULL, 'دعوة قلبك للعبادة: تذكير بنعمة الخالق في سورة البقرة', 'تُظهر الآيتان الكريمتان عظمة الخالق في خلق الإنسان والأرض والسماء، وتذكرنا بأن كل رزق يأتي من الماء الذي أنزل من السماء، فتُنبهنا إلى ضرورة توجيه العبادة للواحد دون شريك، مع الحرص على التقوى والشكر، لتجعل حياتنا مليئة بالسكينة والطمأنينة.

🎙️ القارئ: عبدالباسط عبدالصمد
📖 السورة: سُورَةُ البَقَرَةِ (21-22)

📜 نص الآيات:
يَٰٓأَيُّهَا ٱلنَّاسُ ٱعْبُدُوا۟ رَبَّكُمُ ٱلَّذِى خَلَقَكُمْ وَٱلَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ ٱلَّذِى جَعَلَ لَكُمُ ٱلْأَرْضَ فِرَٰشًۭا وَٱلسَّمَآءَ بِنَآءًۭ وَأَنزَلَ مِنَ ٱلسَّمَآءِ مَآءًۭ فَأَخْرَجَ بِهِۦ مِنَ ٱلثَّمَرَٰتِ رِزْقًۭا لَّكُمْ ۖ فَلَا تَجْعَلُوا۟ لِلَّهِ أَندَادًۭا وَأَنتُمْ تَعْلَمُونَ

#قرآن_كريم #سورة_البقرة #تلاوة #عبادة #تقوى #إيمان #ذكر_الله #دعوة_للتقوى #نعم_الله #حكمة_الإسلام #روحانية #توجيه_القلب #تسليم_لله', 'READY', '2026-06-30 04:00:00', NULL, 0, 0, 0, 0, 0, '2026-06-30 00:51:47.194', '2026-06-30 00:51:47.194', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmqzxr2nc0000fhhnx96pz3ve', 'SHORT', 2, 27, 28, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/SHORT-2-27-28.mp4', 'kGKEPneEZ7M', 'آيات تذكّرنا بعهد الله وفضيلة الإيمان… روحك تجد السكينة', 'في هاتين الآيتين من سورة البقرة يتجلى عظمة وعد الله للإنسان، ويُحذر من خيانة العهد وإفساد الأرض، فتتجدد فينا الوعي بأهمية الوفاء للميثاق الإلهي وتذّكرنا بأن الحياة بين الموت والبعث هي اختبار للقلوب، لتقوى إيماننا وتستقر قلوبنا في رحمة الله.

🎙️ القارئ: عبدالباسط عبدالصمد
📖 السورة: سُورَةُ البَقَرَةِ (27-28)

📜 نص الآيات:
ٱلَّذِينَ يَنقُضُونَ عَهْدَ ٱللَّهِ مِنۢ بَعْدِ مِيثَٰقِهِۦ وَيَقْطَعُونَ مَآ أَمَرَ ٱللَّهُ بِهِۦٓ أَن يُوصَلَ وَيُفْسِدُونَ فِى ٱلْأَرْضِ ۚ أُو۟لَٰٓئِكَ هُمُ ٱلْخَٰسِرُونَ كَيْفَ تَكْفُرُونَ بِٱللَّهِ وَكُنتُمْ أَمْوَٰتًۭا فَأَحْيَٰكُمْ ۖ ثُمَّ يُمِيتُكُمْ ثُمَّ يُحْيِيكُمْ ثُمَّ إِلَيْهِ تُرْجَعُونَ

#قرآن #سورة_البقرة #عهد_الله #الإيمان #التقوى #تلاوة #تدبر_القرآن #دروس_القرآن #حكمة_إسلامية #روحانية #تذكير_ديني #الآخرة #الإيمان_والعمل', 'PUBLISHED', '2026-06-30 04:00:00', '2026-07-05 19:20:19.683', 0, 0, 0, 0, 0, '2026-06-30 00:55:57.481', '2026-07-05 19:20:19.684', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr86s4nn0000wnwiyyyc8u1s', 'SHORT', 2, 77, 78, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/سورة_سُورَةُ_البَقَرَةِ_الآيات_77-78_عبدالباسط_عبدالصمد.mp4', 'hukX4ecfisw', 'سورة سُورَةُ البَقَرَةِ | الآيات 77-78 | عبدالباسط عبدالصمد', 'سورة سورة البقرة - الآيات 77-78

🎙️ القارئ: عبدالباسط عبدالصمد
📖 سورة سورة البقرة (77-78)

📜 نص الآيات:
أولا يعلمون أن ٱلله يعلم ما يسرون وما يعلنون ومنهم أميون لا يعلمون ٱلكتب إلا أمانى وإن هم إلا يظنون

🔔 اشترك في القناة لتصلك تلاوات جديدة يوميا

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #تلاوة_القرآن', 'PUBLISHED', '2026-07-05 20:00:00', '2026-07-05 19:31:12.14', 0, 0, 0, 0, 0, '2026-07-05 19:30:52.691', '2026-07-05 19:31:12.141', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr0t63fn0000h61c1ig5ap5g', 'SHORT', 2, 30, 30, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/SHORT-2-30-30.mp4', 'pnjGPFTMqCQ', 'خليفة الأرض: دروس الإيمان والهدوء في قلبك', 'في هذه الآية المباركة نتأمل حكمة خلق الإنسان كمخلوقٍ مكلفٍ في الأرض، نتعلم أن الله يعلم ما لا نعلمه، فتنبت في قلوبنا الثقة بقدرته وتطمئن نفوسنا إلى أن كل ما يأتي من السماء يحمل رحمة ودليل على عظمة الخالق، مما يزرع فينا السكينة والاعتماد على الله في كل قرار.

🎙️ القارئ: عبدالباسط عبدالصمد
📖 السورة: سُورَةُ البَقَرَةِ (30-30)

📜 نص الآيات:
وَإِذْ قَالَ رَبُّكَ لِلْمَلَٰٓئِكَةِ إِنِّى جَاعِلٌۭ فِى ٱلْأَرْضِ خَلِيفَةًۭ ۖ قَالُوٓا۟ أَتَجْعَلُ فِيهَا مَن يُفْسِدُ فِيهَا وَيَسْفِكُ ٱلدِّمَآءَ وَنَحْنُ نُسَبِّحُ بِحَمْدِكَ وَنُقَدِّسُ لَكَ ۖ قَالَ إِنِّىٓ أَعْلَمُ مَا لَا تَعْلَمُونَ

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#قرآن_كريم #سورة_البقرة #خليفة_الأرض #تدبر_الآية #الإيمان #الطمأنينة #حكمة_الخلق #ثق_بالله #دروس_دينية #تلاوة #نصوص_قرآنية #الإسلام #روحانية #قوة_الإيمان', 'PUBLISHED', '2026-06-30 17:00:00', '2026-06-30 15:35:42.907', 0, 0, 0, 0, 0, '2026-06-30 15:35:26.435', '2026-06-30 15:35:42.908', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr0tla6t0000gd3adb7mvuxi', 'SHORT', 2, 34, 36, 'Alafasy_128kbps', '/var/www/quran-pipeline/assets/videos/سورة_سُورَةُ_البَقَرَةِ_34-36_مشاري_العفاسي.mp4', 'f1DjHc-mC6s', 'سورة سُورَةُ البَقَرَةِ | 34-36 | مشاري العفاسي', 'من أقدار آدم عند الذِّكرى.. عبر حكيمة في أواقعنا

🎙️ القارئ: مشاري العفاسي
📖 سورة سُورَةُ البَقَرَةِ (34-36)

📜 نص الآيات:
وَإِذْ قُلْنَا لِلْمَلَٰٓئِكَةِ ٱسْجُدُوا۟ لِءَادَمَ فَسَجَدُوٓا۟ إِلَّآ إِبْلِيسَ أَبَىٰ وَٱسْتَكْبَرَ وَكَانَ مِنَ ٱلْكَٰفِرِينَ وَقُلْنَا يَٰٓـَٔادَمُ ٱسْكُنْ أَنتَ وَزَوْجُكَ ٱلْجَنَّةَ وَكُلَا مِنْهَا رَغَدًا حَيْثُ شِئْتُمَا وَلَا تَقْرَبَا هَٰذِهِ ٱلشَّجَرَةَ فَتَكُونَا مِنَ ٱلظَّٰلِمِينَ فَأَزَلَّهُمَا ٱلشَّيْطَٰنُ عَنْهَا فَأَخْرَجَهُمَا مِمَّا كَانَا فِيهِ ۖ وَقُلْنَا ٱهْبِطُوا۟ بَعْضُكُمْ لِبَعْضٍ عَدُوٌّۭ ۖ وَلَكُمْ فِى ٱلْأَرْضِ مُسْتَقَرٌّۭ وَمَتَٰعٌ إِلَىٰ حِينٍۢ

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #تدبر', 'PUBLISHED', '2026-06-30 17:00:00', '2026-06-30 15:47:26.328', 0, 0, 0, 0, 0, '2026-06-30 15:47:15.03', '2026-06-30 15:47:26.329', NULL, NULL, NULL, NULL, NULL, 5, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr86huyi00003xni5u63zgdv', 'SHORT', 2, 74, 74, 'Ghamadi_40kbps', '/var/www/quran-pipeline/assets/videos/ثم_قست_قلوبكم_منۢ_بعد_ذٰلك_فهى_كٱلحجارة_سورة_سُورَةُ_البَقَرَةِ.mp4', 'iwW_9qzqw9M', '﴿ثم قست قلوبكم منۢ بعد ذٰلك فهى كٱلحجارة...﴾ | سورة سُورَةُ البَقَرَةِ', 'سورة سورة البقرة - الآيات 74-74

🎙️ القارئ: سعد الغامدي
📖 سورة سورة البقرة (74-74)

📜 نص الآيات:
ثم قست قلوبكم من بعد ذلك فهى كٱلحجارة أو أشد قسوة  وإن من ٱلحجارة لما يتفجر منه ٱلأنهر  وإن منها لما يشقق فيخرج منه ٱلماء  وإن منها لما يهبط من خشية ٱلله  وما ٱلله بغفل عما تعملون

🔔 اشترك في القناة لتصلك تلاوات جديدة يوميا

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #خشوع', 'PUBLISHED', '2026-07-05 20:00:00', '2026-07-05 19:23:05.104', 0, 0, 0, 0, 0, '2026-07-05 19:22:53.562', '2026-07-05 19:23:05.105', NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr86k1of0000ur461rqtplf7', 'SHORT', 2, 75, 76, 'Maher_AlMuaiqly_64kbps', '/var/www/quran-pipeline/assets/videos/۞_أفتطمعون_أن_يؤمنوا۟_لكم_وقد_كان_فريقۭ_سورة_سُورَةُ_البَقَرَةِ.mp4', NULL, '﴿۞ أفتطمعون أن يؤمنوا۟ لكم وقد كان فريقۭ...﴾ | سورة سُورَةُ البَقَرَةِ', 'سورة سورة البقرة - الآيات 75-76

🎙️ القارئ: ماهر المعيقلي
📖 سورة سورة البقرة (75-76)

📜 نص الآيات:
 أفتطمعون أن يؤمنوا لكم وقد كان فريق منهم يسمعون كلم ٱلله ثم يحرفونه من بعد ما عقلوه وهم يعلمون وإذا لقوا ٱلذين ءامنوا قالوا ءامنا وإذا خلا بعضهم إلى بعض قالوا أتحدثونهم بما فتح ٱلله عليكم ليحاجوكم به عند ربكم  أفلا تعقلون

🔔 اشترك في القناة لتصلك تلاوات جديدة يوميا

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #قرآن_مكتوب', 'READY', '2026-07-05 20:00:00', NULL, 0, 0, 0, 0, 0, '2026-07-05 19:24:35.584', '2026-07-05 19:24:35.584', NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr0tou5v0000wjq9fca5sios', 'SHORT', 2, 37, 39, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/فتلقىٰٓ_ءادم_من_ربهۦ_كلمٰتۢ_فتاب_عليه_ۚ_سورة_سُورَةُ_البَقَرَةِ.mp4', 'A4hAq2enWMw', '﴿فتلقىٰٓ ءادم من ربهۦ كلمٰتۢ فتاب عليه ۚ...﴾ | سورة سُورَةُ البَقَرَةِ', 'عندما يتوب الله على العبد.. كلمات أعادت آدم للحياة

🎙️ القارئ: عبدالباسط عبدالصمد
📖 سورة سُورَةُ البَقَرَةِ (37-39)

📜 نص الآيات:
فَتَلَقَّىٰٓ ءَادَمُ مِن رَّبِّهِۦ كَلِمَٰتٍۢ فَتَابَ عَلَيْهِ ۚ إِنَّهُۥ هُوَ ٱلتَّوَّابُ ٱلرَّحِيمُ قُلْنَا ٱهْبِطُوا۟ مِنْهَا جَمِيعًۭا ۖ فَإِمَّا يَأْتِيَنَّكُم مِّنِّى هُدًۭى فَمَن تَبِعَ هُدَاىَ فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ وَٱلَّذِينَ كَفَرُوا۟ وَكَذَّبُوا۟ بِـَٔايَٰتِنَآ أُو۟لَٰٓئِكَ أَصْحَٰبُ ٱلنَّارِ ۖ هُمْ فِيهَا خَٰلِدُونَ

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #تلاوة_القرآن', 'PUBLISHED', '2026-06-30 17:00:00', '2026-06-30 15:50:20.215', 0, 0, 0, 0, 0, '2026-06-30 15:50:00.883', '2026-06-30 15:50:20.217', NULL, NULL, '941312065634233', NULL, NULL, 2, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr1zolk900007khje68vxhg8', 'SHORT', 2, 43, 45, 'Alafasy_128kbps', '/var/www/quran-pipeline/assets/videos/SHORT-2-43-45.mp4', '8zl5FhTp47M', 'تذكّر صلاةً خالصةً وزكاةً بقلوبٍ خاشعة لتطمئن روحك', 'تُظهر الآيات دعوة الله للثبات على الصلاة والصدقة وتواضع الركوع، وتُنبهنا إلى أن نكون قدوة في البر لا أن ننسى أنفسنا، فالصبر والصلاة يتعززان لتقوية القلب وإدراك حكمة العبادة، وهي تعطي سكينةً داخلية وتوجيهًا للعيش بخلقٍ رفيعٍ وتوازنٍ بين العطاء والنفس.

🎙️ القارئ: مشاري العفاسي
📖 السورة: سُورَةُ البَقَرَةِ (43-45)

📜 نص الآيات:
وَأَقِيمُوا۟ ٱلصَّلَوٰةَ وَءَاتُوا۟ ٱلزَّكَوٰةَ وَٱرْكَعُوا۟ مَعَ ٱلرَّٰكِعِينَ ۞ أَتَأْمُرُونَ ٱلنَّاسَ بِٱلْبِرِّ وَتَنسَوْنَ أَنفُسَكُمْ وَأَنتُمْ تَتْلُونَ ٱلْكِتَٰبَ ۚ أَفَلَا تَعْقِلُونَ وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلْخَٰشِعِينَ

#القرآن_الكريم #سورة_البقرة #الصلاة #الزكاة #التقوى #الركوع #الصبر #تدبر_الآيات #روحانية #ذكر_الله #الإيمان #العبادة #الهداية #توجيه_إسلامي', 'PUBLISHED', '2026-07-01 12:00:00', '2026-07-01 11:26:01.006', 0, 0, 0, 0, 0, '2026-07-01 11:25:33.609', '2026-07-01 11:26:01.007', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr2037mw0000762fenepqsie', 'SHORT', 2, 67, 68, 'Alafasy_128kbps', '/var/www/quran-pipeline/assets/videos/تلاوة_خاشعة_سورة_سُورَةُ_البَقَرَةِ_الآيات_67-68.mp4', 'zWjW-HTV8DQ', 'تلاوة خاشعة | سورة سُورَةُ البَقَرَةِ | الآيات 67-68', 'قصة البقرة من سورة البقرة.. درسٌ يطمئن القلب ويقوي الإيمان

🎙️ القارئ: مشاري العفاسي
📖 سورة سُورَةُ البَقَرَةِ (67-68)

📜 نص الآيات:
وَإِذْ قَالَ مُوسَىٰ لِقَوْمِهِۦٓ إِنَّ ٱللَّهَ يَأْمُرُكُمْ أَن تَذْبَحُوا۟ بَقَرَةًۭ ۖ قَالُوٓا۟ أَتَتَّخِذُنَا هُزُوًۭا ۖ قَالَ أَعُوذُ بِٱللَّهِ أَنْ أَكُونَ مِنَ ٱلْجَٰهِلِينَ قَالُوا۟ ٱدْعُ لَنَا رَبَّكَ يُبَيِّن لَّنَا مَا هِىَ ۚ قَالَ إِنَّهُۥ يَقُولُ إِنَّهَا بَقَرَةٌۭ لَّا فَارِضٌۭ وَلَا بِكْرٌ عَوَانٌۢ بَيْنَ ذَٰلِكَ ۖ فَٱفْعَلُوا۟ مَا تُؤْمَرُونَ

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #خشوع', 'PUBLISHED', '2026-07-01 12:00:00', '2026-07-01 11:37:10.661', 0, 0, 0, 0, 0, '2026-07-01 11:36:55.401', '2026-07-01 11:37:10.662', NULL, NULL, '994535693453603', NULL, NULL, 3, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr86cl2z0000iyji78ahcjsg', 'SHORT', 2, 71, 72, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/سورة_سُورَةُ_البَقَرَةِ_عبدالباسط_عبدالصمد.mp4', 'rKkwVOpUZ9c', 'سورة سُورَةُ البَقَرَةِ | عبدالباسط عبدالصمد', 'سورة سورة البقرة - الآيات 71-72

🎙️ القارئ: عبدالباسط عبدالصمد
📖 سورة سورة البقرة (71-72)

📜 نص الآيات:
قال إنه يقول إنها بقرة لا ذلول تثير ٱلأرض ولا تسقى ٱلحرث مسلمة لا شية فيها  قالوا ٱلـن جئت بٱلحق  فذبحوها وما كادوا يفعلون وإذ قتلتم نفسا فٱدرتم فيها  وٱلله مخرج ما كنتم تكتمون

🔔 اشترك في القناة لتصلك تلاوات جديدة يوميا

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #قرآن_مكتوب', 'PUBLISHED', '2026-07-05 20:00:00', '2026-07-05 19:19:00.862', 0, 0, 0, 0, 0, '2026-07-05 19:18:47.483', '2026-07-05 19:19:00.863', NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr86g06j0000voas7ixictdn', 'SHORT', 2, 73, 73, 'Abdul_Basit_Murattal_192kbps', '/var/www/quran-pipeline/assets/videos/سورة_سُورَةُ_البَقَرَةِ_الآي_سورة_سُورَةُ_البَقَرَةِ_عبدالباسط_عبدالصمد.mp4', 'pIfHP-By1go', 'سورة سُورَةُ البَقَرَةِ  الآي | سورة سُورَةُ البَقَرَةِ | عبدالباسط عبدالصمد', 'سورة سورة البقرة - الآيات 73-73

🎙️ القارئ: عبدالباسط عبدالصمد
📖 سورة سورة البقرة (73-73)

📜 نص الآيات:
فقلنا ٱضربوه ببعضها  كذلك يحى ٱلله ٱلموتى ويريكم ءايته لعلكم تعقلون

🔔 اشترك في القناة لتصلك تلاوات جديدة يوميا

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #تلاوة_القرآن', 'PUBLISHED', '2026-07-05 20:00:00', '2026-07-05 19:21:38.381', 0, 0, 0, 0, 0, '2026-07-05 19:21:27.019', '2026-07-05 19:21:38.382', NULL, NULL, NULL, NULL, NULL, 4, NULL, NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr9yutmz0000phwye724m3wv', 'SHORT', 2, 136, 136, 'Alafasy_128kbps', '/var/www/quran-pipeline/assets/videos/همس_القلب_بآية_تجمعنا_في_الإيمان_والأخوة.mp4', 'YGgg8kDt5-M', 'سورة سُورَةُ البَقَرَةِ | 136-136 | مشاري العفاسي', 'همس القلب بآية تجمعنا في الإيمان والأخوة

🎙️ القارئ: مشاري العفاسي
📖 سورة سُورَةُ البَقَرَةِ (136-136)

📜 نص الآيات:
قولوا ءامنا بٱلله وما أنزل إلينا وما أنزل إلى إبرهم وإسمعيل وإسحق ويعقوب وٱلأسباط وما أوتى موسى وعيسى وما أوتى ٱلنبيون من ربهم لا نفرق بين أحد منهم ونحن له مسلمون

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #مشاري_العفاسي #العفاسي #تفسير

🌐 تابعونا على: https://quran.waxbix.com/', 'SCHEDULED', '2026-07-07 02:23:32.92', '2026-07-07 01:24:45.715', 0, 0, 0, 0, 0, '2026-07-07 01:24:33.804', '2026-07-07 01:24:45.716', NULL, NULL, NULL, NULL, NULL, 5, 'be03bc8768993cf90a57447bf024de143708d65d1e93562c7415d4154ea6eb9c', NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr9z25u00000qutjugr348aj', 'SHORT', 2, 149, 150, 'Alafasy_128kbps', '/var/www/quran-pipeline/assets/videos/قلبه_يستقر_حين_يواجه_الكعبة_وعد_الله_بالوعي_والرحمة.mp4', 'LvTOiXVXiWc', '﴿ومن حيث خرجت فول وجهك شطر ٱلمسجد ٱلحرام...﴾ | سورة سُورَةُ البَقَرَةِ', 'قلبه يستقر حين يواجه الكعبة: وعد الله بالوعي والرحمة

🎙️ القارئ: مشاري العفاسي
📖 سورة سُورَةُ البَقَرَةِ (149-150)

📜 نص الآيات:
ومن حيث خرجت فول وجهك شطر ٱلمسجد ٱلحرام  وإنه للحق من ربك  وما ٱلله بغفل عما تعملون ومن حيث خرجت فول وجهك شطر ٱلمسجد ٱلحرام  وحيث ما كنتم فولوا وجوهكم شطره لئلا يكون للناس عليكم حجة إلا ٱلذين ظلموا منهم فلا تخشوهم وٱخشونى ولأتم نعمتى عليكم ولعلكم تهتدون

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #مشاري_العفاسي #العفاسي #تدبر

🌐 تابعونا على: https://quran.waxbix.com/', 'SCHEDULED', '2026-07-07 02:29:27.172', '2026-07-07 01:30:26.442', 0, 0, 0, 0, 0, '2026-07-07 01:30:16.201', '2026-07-07 01:30:26.443', NULL, NULL, NULL, NULL, NULL, 2, 'e499b00b807944733e29d9e0e657f0454aa6346ddba4a579b4a09db9bf1b0852', NULL);
INSERT INTO public."PublishedContent" (id, "contentType", "surahNumber", "fromAyah", "toAyah", reciter, "videoFilePath", "youtubeVideoId", title, description, status, "scheduledAt", "publishedAt", views, likes, comments, "watchTimeMinutes", "engagementScore", "createdAt", "updatedAt", "facebookEngagement", "instagramEngagement", "facebookVideoId", "instagramMediaId", "threadsPostId", "titlePatternId", "contentHash", "facebookPostStatus") VALUES ('cmr9z7uzm0000shpyx9vjjdj7', 'SHORT', 2, 152, 155, 'Ghamadi_40kbps', '/var/www/quran-pipeline/assets/videos/آية_الصبر_طمأنينة_القلب_بذكر_الله.mp4', 'TOXaru7B0KI', 'سورة سُورَةُ البَقَرَةِ | الآيات 152-155 | سعد الغامدي', 'آية الصبر.. طمأنينة القلب بذكر الله

🎙️ القارئ: سعد الغامدي
📖 سورة سُورَةُ البَقَرَةِ (152-155)

📜 نص الآيات:
فٱذكرونى أذكركم وٱشكروا لى ولا تكفرون يأيها ٱلذين ءامنوا ٱستعينوا بٱلصبر وٱلصلوة  إن ٱلله مع ٱلصبرين ولا تقولوا لمن يقتل فى سبيل ٱلله أموت  بل أحياء ولكن لا تشعرون ولنبلونكم بشىء من ٱلخوف وٱلجوع ونقص من ٱلأمول وٱلأنفس وٱلثمرت  وبشر ٱلصبرين

🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً

#القرآن_الكريم #تلاوة #اسلام #سورة_البقرة #البقرة #آية_الكرسي #سعد_الغامدي #الغامدي #قرآن_مكتوب

🌐 تابعونا على: https://quran.waxbix.com/', 'SCHEDULED', '2026-07-07 02:33:55.595', '2026-07-07 01:35:03.793', 0, 0, 0, 0, 0, '2026-07-07 01:34:42.082', '2026-07-07 01:35:03.795', NULL, NULL, '3793666977440401', NULL, NULL, 1, '70a0d8d194ff699194394349cc936f9d9d24b5ac4dfa8cf212ca5efcbfdd6b0f', 'SCHEDULED');


--
-- Data for Name: PublishExperiment; Type: TABLE DATA; Schema: public; Owner: quran_user
--



--
-- Data for Name: ExperimentResult; Type: TABLE DATA; Schema: public; Owner: quran_user
--



--
-- Data for Name: PublishReport; Type: TABLE DATA; Schema: public; Owner: quran_user
--



--
-- Data for Name: QuotaUsage; Type: TABLE DATA; Schema: public; Owner: quran_user
--

INSERT INTO public."QuotaUsage" (id, date, "unitsUsed", "updatedAt") VALUES (1, '2026-06-30', 6400, '2026-06-30 15:50:08.05');
INSERT INTO public."QuotaUsage" (id, date, "unitsUsed", "updatedAt") VALUES (5, '2026-07-01', 3200, '2026-07-01 11:36:59.998');
INSERT INTO public."QuotaUsage" (id, date, "unitsUsed", "updatedAt") VALUES (7, '2026-07-05', 8000, '2026-07-05 19:30:59.399');
INSERT INTO public."QuotaUsage" (id, date, "unitsUsed", "updatedAt") VALUES (12, '2026-07-07', 4800, '2026-07-07 01:34:48.241');


--
-- Data for Name: ReadingProgress; Type: TABLE DATA; Schema: public; Owner: quran_user
--

INSERT INTO public."ReadingProgress" (id, "contentType", "currentSurah", "currentAyah", "updatedAt") VALUES (2, 'POSTER', 2, 36, '2026-06-30 15:36:10.726');
INSERT INTO public."ReadingProgress" (id, "contentType", "currentSurah", "currentAyah", "updatedAt") VALUES (1, 'SHORT', 2, 156, '2026-07-07 01:34:25.029');


--
-- Data for Name: TimeSlotScore; Type: TABLE DATA; Schema: public; Owner: quran_user
--



--
-- Data for Name: TitlePatternPerformance; Type: TABLE DATA; Schema: public; Owner: quran_user
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: quran_user
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4ac4eb1f-b634-48f8-b076-51f02e04c1ea', '4306bc5a0b1b1910a1bb6bb16f42999373b60f89bb769441d599dcbcf914c38d', '2026-06-29 15:11:15.128393-07', '20260617171152_init', NULL, NULL, '2026-06-29 15:11:15.101378-07', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ec5d0110-a3dc-4f70-a7dd-a546f7ccf691', 'e4c70be339b1696d70c8a4df6d0641ed181ee89be646413707d413b95059845e', '2026-06-29 15:12:48.655575-07', '20260629_add_platform_engagement', '', NULL, '2026-06-29 15:12:48.655575-07', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('76eaf528-46a7-48ed-a53a-90d95d1871d0', '1fd813b20acd621e855a88eb3e63ba01d149d0100f15acc1fbb5a8a150d96e2f', NULL, '20260624_add_publishing_engine', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20260624_add_publishing_engine

Database error code: 42710

Database error:
ERROR: type "ContentType" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \"ContentType\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1167), routine: Some("DefineEnum") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20260624_add_publishing_engine"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20260624_add_publishing_engine"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2026-06-29 17:50:13.162694-07', '2026-06-29 15:11:15.129623-07', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('7e3d92d1-0088-4c9a-a346-34affd0d5c0e', '1fd813b20acd621e855a88eb3e63ba01d149d0100f15acc1fbb5a8a150d96e2f', '2026-06-29 17:50:22.788038-07', '20260624_add_publishing_engine', '', NULL, '2026-06-29 17:50:22.788038-07', 0);


--
-- Name: QuotaUsage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: quran_user
--

SELECT pg_catalog.setval('public."QuotaUsage_id_seq"', 14, true);


--
-- Name: ReadingProgress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: quran_user
--

SELECT pg_catalog.setval('public."ReadingProgress_id_seq"', 2, true);


--
-- Name: TitlePatternPerformance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: quran_user
--

SELECT pg_catalog.setval('public."TitlePatternPerformance_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 69o8DlPvDQrgUDXFye7dwZ8mJEx6OTS82RfNBmnrh7GVHAC2ijGeQ3V48GCCNhX

