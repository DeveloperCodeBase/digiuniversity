// =====================================================
// Mock Database — single source of truth for the whole app.
// All pages import from here. Designed to look realistic and
// internally consistent: students enroll in programs, programs
// belong to schools, courses have prerequisites, etc.
// =====================================================

// ---------- Helpers ----------
export const toFa = (n) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

// ---------- Schools (8) ----------
export const SCHOOLS = [
  {
    id: "eng", code: "ENG", name: "دانشکده مهندسی", icon: "chip",
    desc: "مهندسی کامپیوتر، برق، مکانیک، عمران، صنایع، شیمی، نفت، هوافضا و مواد. با آزمایشگاه‌های شبیه‌سازی صنعتی.",
    color: "var(--cyan)", established: 1402,
    programs: 48, faculty: 24, students: 2840, labs: 18,
  },
  {
    id: "med", code: "MED", name: "دانشکده علوم پزشکی", icon: "shield",
    desc: "پزشکی عمومی، دندان‌پزشکی، داروسازی، پرستاری، پاراپزشکی. آزمایشگاه‌های مجازی آناتومی و شبیه‌سازی بالینی.",
    color: "var(--rose)", established: 1403,
    programs: 22, faculty: 18, students: 1240, labs: 12,
  },
  {
    id: "sci", code: "SCI", name: "دانشکده علوم پایه", icon: "flask",
    desc: "ریاضی، آمار، فیزیک، شیمی، زیست‌شناسی. با شبیه‌سازی محاسباتی و آزمایشگاه‌های مجازی فیزیک کوانتومی.",
    color: "var(--violet)", established: 1402,
    programs: 32, faculty: 16, students: 1840, labs: 14,
  },
  {
    id: "ds", code: "DS", name: "دانشکده علوم داده و AI", icon: "sparkle",
    desc: "علوم داده، یادگیری ماشین، NLP، بینایی ماشین، رباتیک. آزمایشگاه‌های GPU و یادگیری تقویتی.",
    color: "var(--accent)", established: 1402,
    programs: 24, faculty: 14, students: 1620, labs: 8,
  },
  {
    id: "biz", code: "BIZ", name: "دانشکده مدیریت و اقتصاد", icon: "dollar",
    desc: "مدیریت بازرگانی، MBA، حسابداری، مالی، اقتصاد، بازاریابی دیجیتال، مدیریت پلتفرم.",
    color: "var(--amber)", established: 1403,
    programs: 28, faculty: 12, students: 1480, labs: 4,
  },
  {
    id: "hum", code: "HUM", name: "دانشکده علوم انسانی", icon: "book",
    desc: "زبان‌شناسی، فلسفه، تاریخ، روان‌شناسی، جامعه‌شناسی. تأکید ویژه بر زبان‌شناسی محاسباتی و فلسفه‌ی AI.",
    color: "var(--navy)", established: 1402,
    programs: 34, faculty: 18, students: 1240, labs: 3,
  },
  {
    id: "art", code: "ART", name: "دانشکده هنر و معماری", icon: "layers",
    desc: "طراحی، معماری، هنرهای دیجیتال، انیمیشن، طراحی محصول. با ابزارهای 3D، VR و طراحی پارامتری.",
    color: "var(--gold)", established: 1404,
    programs: 18, faculty: 10, students: 920, labs: 6,
  },
  {
    id: "law", code: "LAW", name: "دانشکده حقوق و علوم سیاسی", icon: "shield",
    desc: "حقوق عمومی، حقوق فناوری، حقوق بین‌الملل، علوم سیاسی، روابط بین‌الملل. حقوق هوش مصنوعی به‌عنوان گرایش جدید.",
    color: "var(--sage)", established: 1403,
    programs: 22, faculty: 12, students: 1080, labs: 0,
  },
];

// ---------- Degree levels ----------
export const DEGREE_LEVELS = [
  { code: "AS", name: "کاردانی فنی-حرفه‌ای", duration: "۲ ساله", desc: "مهارت‌محور", count: 18 },
  { code: "BS", name: "کارشناسی (B.Sc/B.A)", duration: "۴ ساله", desc: "پایه‌ی علمی", count: 86 },
  { code: "MS", name: "کارشناسی ارشد (M.Sc/M.A/MBA)", duration: "۲ ساله", desc: "تخصصی", count: 92 },
  { code: "PHD", name: "دکتری تخصصی (Ph.D)", duration: "۴+ ساله", desc: "پژوهش‌محور", count: 38 },
  { code: "MD", name: "دکتری حرفه‌ای (M.D / D.D.S)", duration: "۶-۷ ساله", desc: "بالینی", count: 8 },
  { code: "CERT", name: "گواهی‌نامه‌ی حرفه‌ای", duration: "۴-۱۲ ماه", desc: "مهارت ویژه", count: 124 },
];

// ---------- Programs (24 sample programs across all schools) ----------
export const PROGRAMS = [
  // ENG
  { id: "p-cs-ai", code: "ENG-CS-AI", school: "eng", title: "مهندسی کامپیوتر — هوش مصنوعی", level: "MS", duration: "۲ سال", credits: 32, students: 240, language: "fa+en", description: "مسیر تخصصی برای مهندسانی که می‌خواهند روی سیستم‌های هوشمند کار کنند." },
  { id: "p-ee-power", code: "ENG-EE-PWR", school: "eng", title: "مهندسی برق — سیستم‌های قدرت هوشمند", level: "PHD", duration: "۴ سال", credits: 36, students: 48, language: "fa+en", description: "پژوهش‌های پیشرفته در شبکه‌های هوشمند و انرژی تجدیدپذیر." },
  { id: "p-ie", code: "ENG-IE", school: "eng", title: "مهندسی صنایع — بهینه‌سازی", level: "BS", duration: "۴ سال", credits: 142, students: 320, language: "fa", description: "بهینه‌سازی فرایندها و تحلیل سیستم‌های تولیدی." },
  // MED
  { id: "p-md", code: "MED-MD", school: "med", title: "پزشکی عمومی", level: "MD", duration: "۷ سال", credits: 210, students: 180, language: "fa+en", description: "آموزش جامع پزشکی با شبیه‌سازی بالینی." },
  { id: "p-bioinfo", code: "MED-BIO", school: "med", title: "بیوانفورماتیک پزشکی", level: "MS", duration: "۲ سال", credits: 34, students: 64, language: "en", description: "تلاقی پزشکی، زیست‌شناسی محاسباتی و علوم داده." },
  { id: "p-nurse", code: "MED-NUR", school: "med", title: "پرستاری بالینی", level: "BS", duration: "۴ سال", credits: 138, students: 420, language: "fa", description: "تربیت پرستار با کارآموزی در شبیه‌سازی." },
  // SCI
  { id: "p-math-app", code: "SCI-MATH-AP", school: "sci", title: "ریاضیات کاربردی", level: "MS", duration: "۲ سال", credits: 32, students: 120, language: "fa+en", description: "ریاضیات کاربردی در علوم داده، مالی و فیزیک." },
  { id: "p-phys-theo", code: "SCI-PHYS-TH", school: "sci", title: "فیزیک نظری", level: "PHD", duration: "۴ سال", credits: 32, students: 28, language: "en", description: "پژوهش در نظریه‌های میدان، کوانتوم و نسبیت." },
  { id: "p-stat", code: "SCI-STAT", school: "sci", title: "آمار محاسباتی", level: "BS", duration: "۴ سال", credits: 138, students: 180, language: "fa", description: "آمار با تمرکز بر محاسبات و مدل‌سازی." },
  // DS
  { id: "p-ml", code: "DS-ML", school: "ds", title: "یادگیری ماشین کاربردی", level: "MS", duration: "۲ سال", credits: 34, students: 280, language: "fa+en", description: "از مبانی ML تا MLOps با پروژه‌ی صنعتی." },
  { id: "p-xai", code: "DS-XAI", school: "ds", title: "هوش مصنوعی توضیح‌پذیر", level: "PHD", duration: "۴ سال", credits: 32, students: 42, language: "en", description: "پژوهش روی Interpretability، Causality و AI Safety." },
  { id: "p-ds-bs", code: "DS-BS", school: "ds", title: "علوم داده", level: "BS", duration: "۴ سال", credits: 142, students: 380, language: "fa+en", description: "پایه‌ی کامل علوم داده برای ورود به صنعت یا تحصیلات تکمیلی." },
  // BIZ
  { id: "p-mba", code: "BIZ-MBA", school: "biz", title: "MBA · مدیریت پلتفرم", level: "MS", duration: "۱۸ ماه", credits: 36, students: 140, language: "fa+en", description: "MBA با تمرکز بر کسب‌وکارهای دیجیتال و پلتفرم‌محور." },
  { id: "p-econ-comp", code: "BIZ-ECON-C", school: "biz", title: "اقتصاد محاسباتی", level: "PHD", duration: "۴ سال", credits: 32, students: 32, language: "en", description: "مدل‌سازی محاسباتی پدیده‌های اقتصادی کلان و خرد." },
  { id: "p-pm", code: "BIZ-PM-DIG", school: "biz", title: "مدیریت محصول دیجیتال", level: "CERT", duration: "۴ ماه", credits: 16, students: 260, language: "fa", description: "مهارت‌محور برای PM‌های فعال در شرکت‌های فناوری." },
  // HUM
  { id: "p-cl", code: "HUM-CL", school: "hum", title: "زبان‌شناسی محاسباتی", level: "PHD", duration: "۴ سال", credits: 32, students: 24, language: "en", description: "پل بین زبان‌شناسی نظری و NLP." },
  { id: "p-phil-ai", code: "HUM-PHIL-AI", school: "hum", title: "فلسفه‌ی ذهن و AI", level: "MS", duration: "۲ سال", credits: 30, students: 56, language: "fa+en", description: "بررسی فلسفی هوش مصنوعی، آگاهی و اخلاق." },
  { id: "p-psy-cog", code: "HUM-PSY-COG", school: "hum", title: "روان‌شناسی شناختی", level: "BS", duration: "۴ سال", credits: 138, students: 220, language: "fa", description: "مطالعه‌ی فرایندهای ذهنی، یادگیری و تصمیم‌گیری." },
  // ART
  { id: "p-pd", code: "ART-PD", school: "art", title: "طراحی محصول دیجیتال", level: "MS", duration: "۲ سال", credits: 32, students: 96, language: "fa", description: "از تحقیق کاربر تا طراحی تعاملی محصولات دیجیتال." },
  { id: "p-arch-param", code: "ART-ARCH-P", school: "art", title: "معماری پارامتری", level: "BS", duration: "۵ سال", credits: 168, students: 140, language: "fa+en", description: "معماری با ابزارهای پارامتری و محاسباتی." },
  { id: "p-cart", code: "ART-CART", school: "art", title: "هنرهای محاسباتی", level: "MS", duration: "۲ سال", credits: 30, students: 64, language: "en", description: "تلاقی هنر، کد و رسانه‌ی تعاملی." },
  // LAW
  { id: "p-law-tech", code: "LAW-TECH", school: "law", title: "حقوق فناوری و AI", level: "MS", duration: "۲ سال", credits: 32, students: 80, language: "fa+en", description: "حقوق نوظهور در عصر AI، داده و فناوری‌های دیجیتال." },
  { id: "p-law-pub", code: "LAW-PUB", school: "law", title: "حقوق عمومی", level: "PHD", duration: "۴ سال", credits: 32, students: 28, language: "fa", description: "پژوهش در حقوق اساسی و اداری." },
  { id: "p-polsci", code: "LAW-POL", school: "law", title: "علوم سیاسی", level: "BS", duration: "۴ سال", credits: 138, students: 200, language: "fa", description: "نظریه‌های سیاسی، حکمرانی و روابط بین‌الملل." },
];

// ---------- Faculty (12 detailed professors) ----------
export const FACULTY = [
  { id: "f-azimi", name: "دکتر آرش عظیمی", role: "دانشیار · علوم رایانه", school: "ds", avatar: "AA", color: "cyan", bio: "تخصص در یادگیری ماشین کاربردی و مدل‌های زبانی فارسی. مولف ۴ کتاب درسی.", tags: ["ML", "NLP", "FA"], courses: 8, papers: 42, hIndex: 18, rating: 4.9, available: "آزاد امروز", email: "azimi@digiu.edu" },
  { id: "f-mousavi", name: "دکتر سپیده موسوی", role: "استادیار · پردازش زبان", school: "ds", avatar: "SM", color: "amber", bio: "پژوهش روی attention mechanism و ترجمه ماشینی. عضو هیات تحریریه دو ژورنال.", tags: ["NLP", "Transformer"], courses: 5, papers: 28, hIndex: 14, rating: 4.8, available: "فردا", email: "mousavi@digiu.edu" },
  { id: "f-kiani", name: "مهندس مهدی کیانی", role: "مدرس · مهندسی نرم‌افزار", school: "eng", avatar: "MK", color: "violet", bio: "۱۲ سال تجربه‌ی صنعتی در طراحی سیستم‌های توزیع‌شده مقیاس بالا. CTO سابق.", tags: ["Sys", "DDD"], courses: 6, papers: 8, hIndex: 6, rating: 4.7, available: "هفته‌ی بعد", email: "kiani@digiu.edu" },
  { id: "f-farhadi", name: "دکتر بهنام فرهادی", role: "دانشیار · آمار", school: "sci", avatar: "BF", color: "rose", bio: "آمار بیزی، MCMC، مدل‌های گرافیکی احتمالاتی. نویسنده کتاب آمار بیزی به فارسی.", tags: ["Bayes", "Stats"], courses: 4, papers: 36, hIndex: 16, rating: 4.6, available: "این هفته", email: "farhadi@digiu.edu" },
  { id: "f-taheri", name: "دکتر رویا طاهری", role: "استاد · فلسفه و اخلاق", school: "hum", avatar: "RT", color: "cyan", bio: "اخلاق هوش مصنوعی، عاملیت ماشین، حاکمیت داده. مشاور سیاست‌گذار.", tags: ["AI Ethics"], courses: 3, papers: 24, hIndex: 12, rating: 4.9, available: "این هفته", email: "taheri@digiu.edu" },
  { id: "f-razavi", name: "دکتر شهرام رضوی", role: "دانشیار · مدیریت محصول", school: "biz", avatar: "SR", color: "amber", bio: "تجربه‌ی مدیریت محصول در ۳ استارتاپ یونیکورن. مولف کتاب «محصول داده‌محور».", tags: ["PM"], courses: 4, papers: 6, hIndex: 4, rating: 4.5, available: "فردا", email: "razavi@digiu.edu" },
  { id: "f-khademi", name: "دکتر مریم خادمی", role: "استادیار · ساختمان داده", school: "ds", avatar: "MK", color: "navy", bio: "تخصص در الگوریتم‌های توزیع‌شده و پایگاه‌داده‌ی مقیاس‌پذیر.", tags: ["Algo", "DB"], courses: 5, papers: 19, hIndex: 9, rating: 4.7, available: "این هفته", email: "khademi@digiu.edu" },
  { id: "f-safavi", name: "دکتر علی صفوی", role: "دانشیار · ریاضی", school: "sci", avatar: "AS", color: "sage", bio: "جبر خطی کاربردی، نظریه ماتریس و کاربردهای آن در علوم محاسباتی.", tags: ["Math"], courses: 4, papers: 22, hIndex: 11, rating: 4.4, available: "هفته‌ی بعد", email: "safavi@digiu.edu" },
  { id: "f-bahman", name: "دکتر نسرین بهمن", role: "استادیار · زبان", school: "hum", avatar: "NB", color: "gold", bio: "زبان تخصصی، ESL و تدریس به دانشجویان مهاجر و بین‌المللی.", tags: ["EFL"], courses: 6, papers: 14, hIndex: 8, rating: 4.8, available: "این هفته", email: "bahman@digiu.edu" },
  { id: "f-ahmadi", name: "دکتر کامران احمدی", role: "دانشیار · شبکه", school: "eng", avatar: "KA", color: "navy", bio: "شبکه‌های کامپیوتری، امنیت سایبری، طراحی پروتکل.", tags: ["Net", "Sec"], courses: 5, papers: 30, hIndex: 13, rating: 4.6, available: "فردا", email: "ahmadi@digiu.edu" },
  { id: "f-noori", name: "دکتر شیوا نوری", role: "استادیار · بینایی ماشین", school: "ds", avatar: "SN", color: "rose", bio: "پژوهش بینایی ماشین و کاربرد آن در تصویربرداری پزشکی. Postdoc از MIT.", tags: ["CV", "Med"], courses: 4, papers: 26, hIndex: 12, rating: 4.9, available: "این هفته", email: "noori@digiu.edu" },
  { id: "f-kaveh", name: "دکتر علی کاوه", role: "استاد · ریاضی", school: "sci", avatar: "AK", color: "violet", bio: "ریاضی پیشرفته، بهینه‌سازی محدب و کاربردهای آن.", tags: ["Opt"], courses: 5, papers: 38, hIndex: 17, rating: 4.7, available: "هفته‌ی بعد", email: "kaveh@digiu.edu" },
];

// ---------- Courses (~30 detailed courses) ----------
export const COURSES = [
  { id: "c-cs410", code: "CS-410", title: "مبانی یادگیری ماشین", school: "ds", program: "p-ml", instructor: "f-azimi", level: "MS", credits: 3, weeks: 12, students: 843, prereqs: ["MATH-440", "STAT-440"], modules: 24, exercises: 84, color: "cyan", description: "از شهود آماری تا شبکه‌های عمیق. ۱۲ هفته، ۲۴ ماژول، ۸۴ تمرین تطبیقی.", tags: ["ML", "Core"] },
  { id: "c-cs620", code: "CS-620", title: "پردازش زبان طبیعی پیشرفته", school: "ds", program: "p-ml", instructor: "f-mousavi", level: "MS", credits: 3, weeks: 12, students: 420, prereqs: ["CS-410"], modules: 18, exercises: 56, color: "amber", description: "از word embeddings تا LLMها و RAG.", tags: ["NLP"] },
  { id: "c-cs580", code: "CS-580", title: "معماری سامانه‌های مقیاس‌پذیر", school: "eng", program: "p-cs-ai", instructor: "f-kiani", level: "MS", credits: 3, weeks: 10, students: 320, prereqs: ["CS-380"], modules: 16, exercises: 48, color: "violet", description: "از مونولیت تا میکروسرویس، event-driven و K8s.", tags: ["Sys"] },
  { id: "c-cs650", code: "CS-650", title: "یادگیری تقویتی", school: "ds", program: "p-ml", instructor: "f-azimi", level: "MS", credits: 3, weeks: 12, students: 180, prereqs: ["CS-410", "MATH-510"], modules: 20, exercises: 60, color: "cyan", description: "MDP، بلمن، Q-Learning، Policy Gradient، PPO.", tags: ["RL"] },
  { id: "c-cs720", code: "CS-720", title: "هوش مصنوعی توضیح‌پذیر", school: "ds", program: "p-xai", instructor: "f-taheri", level: "PHD", credits: 3, weeks: 12, students: 64, prereqs: ["CS-410"], modules: 18, exercises: 36, color: "cyan", description: "Interpretability، Counterfactuals، Causality.", tags: ["XAI"] },
  { id: "c-stat440", code: "STAT-440", title: "آمار بیزی کاربردی", school: "sci", program: "p-stat", instructor: "f-farhadi", level: "MS", credits: 3, weeks: 12, students: 240, prereqs: ["STAT-310"], modules: 18, exercises: 54, color: "rose", description: "از قانون بیز تا MCMC و مدل‌های گرافیکی.", tags: ["Stats"] },
  { id: "c-stat540", code: "STAT-540", title: "آمار غیرپارامتری", school: "sci", program: "p-stat", instructor: "f-farhadi", level: "MS", credits: 3, weeks: 10, students: 96, prereqs: ["STAT-440"], modules: 14, exercises: 42, color: "rose", description: "تست‌های آماری بدون فرض توزیع.", tags: ["Stats"] },
  { id: "c-math510", code: "MATH-510", title: "ریاضی پیشرفته", school: "sci", program: "p-math-app", instructor: "f-kaveh", level: "MS", credits: 3, weeks: 12, students: 280, prereqs: ["MATH-440"], modules: 20, exercises: 60, color: "violet", description: "آنالیز، جبر خطی پیشرفته و بهینه‌سازی.", tags: ["Math"] },
  { id: "c-math440", code: "MATH-440", title: "جبر خطی کاربردی", school: "sci", program: "p-stat", instructor: "f-safavi", level: "BS", credits: 3, weeks: 12, students: 540, prereqs: [], modules: 18, exercises: 48, color: "sage", description: "ماتریس، تجزیه‌ها و کاربردها در علوم داده.", tags: ["Math"] },
  { id: "c-cs380", code: "CS-380", title: "ساختمان داده پیشرفته", school: "ds", program: "p-ds-bs", instructor: "f-khademi", level: "BS", credits: 3, weeks: 12, students: 460, prereqs: ["CS-280"], modules: 18, exercises: 56, color: "navy", description: "درخت‌ها، گراف، الگوریتم‌های پیشرفته.", tags: ["Algo"] },
  { id: "c-cs420", code: "CS-420", title: "پایگاه داده توزیع‌شده", school: "eng", program: "p-cs-ai", instructor: "f-kiani", level: "MS", credits: 3, weeks: 12, students: 240, prereqs: ["CS-380"], modules: 16, exercises: 48, color: "violet", description: "Replication، Partitioning، Consistency.", tags: ["DB"] },
  { id: "c-cs560", code: "CS-560", title: "شبکه‌های کامپیوتری", school: "eng", program: "p-cs-ai", instructor: "f-ahmadi", level: "BS", credits: 3, weeks: 12, students: 320, prereqs: ["CS-280"], modules: 16, exercises: 42, color: "navy", description: "از فیزیکی تا کاربرد، TCP/IP، QUIC.", tags: ["Net"] },
  { id: "c-cs450", code: "CS-450", title: "هوش مصنوعی", school: "ds", program: "p-ds-bs", instructor: "f-azimi", level: "BS", credits: 3, weeks: 14, students: 480, prereqs: ["CS-380", "MATH-440"], modules: 22, exercises: 64, color: "cyan", description: "مقدمه‌ای جامع بر AI کلاسیک و مدرن.", tags: ["AI"] },
  { id: "c-phil220", code: "PHIL-220", title: "اخلاق هوش مصنوعی", school: "hum", program: "p-phil-ai", instructor: "f-taheri", level: "MS", credits: 2, weeks: 8, students: 180, prereqs: [], modules: 12, exercises: 24, color: "amber", description: "چالش‌های اخلاقی AI: تبعیض، شفافیت، عاملیت.", tags: ["Ethics"] },
  { id: "c-lang501", code: "LANG-501", title: "زبان تخصصی", school: "hum", program: null, instructor: "f-bahman", level: "MS", credits: 2, weeks: 10, students: 380, prereqs: [], modules: 14, exercises: 36, color: "gold", description: "زبان انگلیسی برای متون فنی و مقاله‌نویسی.", tags: ["EFL"] },
  { id: "c-res501", code: "RES-501", title: "روش پژوهش", school: "sci", program: null, instructor: "f-razavi", level: "MS", credits: 2, weeks: 8, students: 220, prereqs: [], modules: 10, exercises: 20, color: "amber", description: "از تعریف مسئله تا انتشار.", tags: ["Research"] },
  { id: "c-mgmt410", code: "MGMT-410", title: "نوآوری و کارآفرینی", school: "biz", program: "p-pm", instructor: "f-razavi", level: "BS", credits: 2, weeks: 10, students: 320, prereqs: [], modules: 14, exercises: 24, color: "amber", description: "ایده، MVP، رشد و سرمایه‌گذاری.", tags: ["Biz"] },
];

// ---------- Labs (9 virtual labs) ----------
export const LABS = [
  { id: "ANAT", code: "ANAT", field: "آناتومی · ۳D", school: "med", t: "آناتومی تعاملی — قلب و گردش خون", d: "شبیه‌سازی ۳D با لایه‌بندی کامل، نمای مقطعی، انیمیشن جریان خون.", duration: "متوسط ۴۵ دقیقه", realtime: false, gpu: true, color: "oklch(0.55 0.22 25)", glyph: "♥" },
  { id: "MD-SIM", code: "MD-SIM", field: "بالینی · شبیه‌سازی", school: "med", t: "شبیه‌سازی بالینی — اورژانس", d: "کیس واقعی، تصمیم‌گیری مرحله به مرحله، بازخورد AI.", duration: "۹۰ دقیقه", realtime: true, gpu: false, color: "oklch(0.5 0.2 20)", glyph: "✚" },
  { id: "RL-GYM", code: "RL-GYM", field: "AI · یادگیری تقویتی", school: "ds", t: "Reinforcement Learning Gym", d: "CartPole، MountainCar، LunarLander، Atari — محیط‌های استاندارد آماده.", duration: "open", realtime: true, gpu: true, color: "oklch(0.5 0.16 270)", glyph: "⚙" },
  { id: "CAD", code: "CAD", field: "مهندسی · CAD/CAM", school: "eng", t: "مدل‌سازی پارامتری CAD", d: "محیط مدل‌سازی سه‌بعدی با simulation تنش و حرارت.", duration: "open", realtime: false, gpu: true, color: "oklch(0.5 0.14 220)", glyph: "▣" },
  { id: "CHEM", code: "CHEM", field: "شیمی · مولکولی", school: "sci", t: "شیمی آلی — مولکول‌سازی", d: "ساخت مولکول، شبیه‌سازی واکنش، نمای ۳D باندها.", duration: "۶۰ دقیقه", realtime: false, gpu: true, color: "oklch(0.5 0.15 150)", glyph: "⬢" },
  { id: "PHYS-Q", code: "PHYS-Q", field: "فیزیک · کوانتوم", school: "sci", t: "آزمایش‌های مکانیک کوانتومی", d: "دو شکاف، آزمایش بل، حالت‌های اسپین. تعاملی و قابل پارامتری‌سازی.", duration: "۹۰ دقیقه", realtime: true, gpu: true, color: "oklch(0.5 0.16 285)", glyph: "ψ" },
  { id: "SHELL", code: "SHELL", field: "علوم کامپیوتر · ترمینال", school: "ds", t: "Linux Terminal Sandbox", d: "محیط لینوکس کامل با امکان نصب پکیج و اجرای پروژه.", duration: "open", realtime: true, gpu: false, color: "oklch(0.25 0.05 240)", glyph: "▸_" },
  { id: "DATA", code: "DATA", field: "علوم داده · Jupyter", school: "ds", t: "Jupyter Notebook · GPU", d: "محیط Python با PyTorch، TensorFlow، scikit-learn و GPU.", duration: "open", realtime: true, gpu: true, color: "oklch(0.5 0.12 75)", glyph: "Py" },
  { id: "EE", code: "EE", field: "برق · مدارها", school: "eng", t: "Circuit Simulator", d: "آنالوگ و دیجیتال، شبیه‌سازی time-domain و frequency.", duration: "open", realtime: true, gpu: false, color: "oklch(0.5 0.14 60)", glyph: "Ω" },
];

// ---------- Students (current logged-in mock user + classmates) ----------
export const CURRENT_USER = {
  id: "s-84-02-17",
  code: "ST-84-02-17",
  name: "نسرین رضوی",
  avatar: "نر",
  color: "cyan",
  role: "student",
  program: "p-ml",
  term: 2,
  gpa: 3.82,
  creditsEarned: 48,
  creditsTotal: 120,
  level: 8,
  xp: 2480,
  xpToNext: 3000,
  streak: 18,
  bio: "دانشجوی ارشد علوم داده، علاقمند به مدل‌های زبانی فارسی و آموزش.",
  skills: [["Python", 95], ["PyTorch", 88], ["NLP", 82], ["آمار", 78], ["ریاضیات", 72], ["Linux", 86]],
  enrolledCourses: ["c-cs410", "c-cs620", "c-stat440", "c-math510"],
};

export const CLASSMATES = [
  { id: "s-ali", name: "علی نظری", avatar: "AN", color: "violet", program: "p-ml", gpa: 3.65 },
  { id: "s-saare", name: "ساره فرجی", avatar: "SF", color: "rose", program: "p-ml", gpa: 3.78 },
  { id: "s-mehrdad", name: "مهرداد افشار", avatar: "MA", color: "cyan", program: "p-ml", gpa: 3.5 },
  { id: "s-mahsa", name: "مهسا کوهی", avatar: "MK", color: "amber", program: "p-ds-bs", gpa: 3.2 },
  { id: "s-behnam", name: "بهنام رضوی", avatar: "BR", color: "navy", program: "p-cs-ai", gpa: 3.1 },
  { id: "s-saghar", name: "ساغر فرجی", avatar: "SF", color: "sage", program: "p-ml", gpa: 3.4 },
];

// ---------- Library resources ----------
export const LIBRARY_RESOURCES = [
  { id: "r-1", type: "PDF", title: "Deep Learning — Goodfellow, Bengio, Courville", author: "MIT Press", size: "۸۰۲ صفحه · ۱۸ MB", year: 2016, tags: ["ML", "DL", "EN"], lang: "en", level: "MS" },
  { id: "r-2", type: "VIDEO", title: "ضبط جلسه ۸ — گرادیان نزولی با مومنتوم", author: "دکتر عظیمی · CS-410", size: "۱:۲۸ · ۴۸۰p", year: 1404, tags: ["FA", "ML"], lang: "fa", level: "MS" },
  { id: "r-3", type: "PDF", title: "Attention is All You Need", author: "Vaswani et al. — NeurIPS 2017", size: "۱۵ صفحه · ۱.۲ MB", year: 2017, tags: ["NLP", "EN"], lang: "en", level: "MS" },
  { id: "r-4", type: "CODE", title: "Transformer from scratch — Jupyter notebook", author: "دکتر موسوی", size: "۲۴ سلول", year: 1404, tags: ["NLP", "Python"], lang: "en", level: "MS" },
  { id: "r-5", type: "PDF", title: "آمار بیزی کاربردی — فصل ۳ و ۴", author: "دکتر فرهادی", size: "۸۲ صفحه · ۴.۱ MB", year: 1404, tags: ["Stats", "FA"], lang: "fa", level: "MS" },
  { id: "r-6", type: "DATA", title: "Persian Sentiment Corpus — v2", author: "آزمایشگاه NLP فارسی", size: "۱۲۴ MB", year: 1404, tags: ["NLP", "FA"], lang: "fa", level: "all" },
  { id: "r-7", type: "VIDEO", title: "کارگاه — معماری میکروسرویس", author: "م. کیانی · CS-580", size: "۲:۱۲ · HD", year: 1404, tags: ["SYS"], lang: "fa", level: "MS" },
  { id: "r-8", type: "PDF", title: "Pattern Recognition and ML — Bishop", author: "Springer", size: "۷۳۸ صفحه · ۲۲ MB", year: 2006, tags: ["ML", "EN"], lang: "en", level: "MS" },
  { id: "r-9", type: "CODE", title: "RAG implementation با LangGraph", author: "آرشیو درس CS-620", size: "Repo", year: 1405, tags: ["NLP", "RAG"], lang: "fa", level: "MS" },
  { id: "r-10", type: "SLIDE", title: "اسلایدهای CS-410 — جلسات ۱ تا ۸", author: "دکتر عظیمی", size: "۱۸۰ اسلاید", year: 1404, tags: ["ML", "FA"], lang: "fa", level: "MS" },
  { id: "r-11", type: "VIDEO", title: "نشست تخصصی — حاکمیت داده در ایران", author: "وبینار · مهمان از وزارت ICT", size: "۱:۴۲ · HD", year: 1405, tags: ["Gov", "FA"], lang: "fa", level: "all" },
  { id: "r-12", type: "PDF", title: "Sutton & Barto — Reinforcement Learning", author: "MIT Press · 2nd ed", size: "۵۲۰ صفحه · ۱۴ MB", year: 2018, tags: ["RL", "EN"], lang: "en", level: "MS" },
];

// ---------- Recordings (class recordings) ----------
export const RECORDINGS = [
  { id: "rec-cs410-8", course: "c-cs410", session: 8, title: "گرادیان نزولی با مومنتوم", date: "۸ اسفند ۱۴۰۴", duration: "۱:۲۸:۴۲", chapters: 12, played: 8, attendees: 42, questions: 23 },
  { id: "rec-cs410-7", course: "c-cs410", session: 7, title: "اعتبارسنجی متقاطع", date: "۱ اسفند ۱۴۰۴", duration: "۱:۱۲:۲۰", chapters: 10, played: 10, attendees: 38, questions: 14 },
  { id: "rec-cs620-5", course: "c-cs620", session: 5, title: "Attention و Transformer", date: "۴ اسفند ۱۴۰۴", duration: "۱:۳۸:۱۰", chapters: 14, played: 5, attendees: 28, questions: 19 },
  { id: "rec-stat440-6", course: "c-stat440", session: 6, title: "MCMC و Metropolis-Hastings", date: "۲ اسفند ۱۴۰۴", duration: "۱:۲۰:۴۰", chapters: 11, played: 0, attendees: 22, questions: 9 },
  { id: "rec-cs580-3", course: "c-cs580", session: 3, title: "Event-Driven Architecture", date: "۲۵ بهمن ۱۴۰۴", duration: "۱:۴۵:۲۰", chapters: 13, played: 3, attendees: 30, questions: 12 },
  { id: "rec-math510-9", course: "c-math510", session: 9, title: "بهینه‌سازی محدب", date: "۲۸ بهمن ۱۴۰۴", duration: "۱:۱۵:۰۰", chapters: 9, played: 0, attendees: 34, questions: 6 },
];

// ---------- Notifications ----------
export const NOTIFICATIONS = [
  { id: "n-1", category: "live", title: "جلسه‌ی یادگیری ماشین تا ۱۵ دقیقه دیگر آغاز می‌شود", body: "CS-410 · دکتر عظیمی", time: "همین الان", unread: true, route: "classroom", icon: "live" },
  { id: "n-2", category: "ai", title: "خلاصه‌ی پساکلاس جلسه ۷ آماده شد", body: "۸ فلش‌کارت، ۳ کوییز پیشنهاد شده", time: "۸ دقیقه پیش", unread: true, route: "recordings", icon: "sparkle" },
  { id: "n-3", category: "grade", title: "تمرین ۴ بهینه‌سازی: ۸۷ از ۱۰۰", body: "دکتر عظیمی · با ۲ نکته‌ی بازخورد", time: "۲ ساعت پیش", unread: true, route: "course", icon: "check" },
  { id: "n-4", category: "office", title: "دکتر موسوی جلسه‌ی شما فردا را تأیید کرد", body: "فردا ۱۴:۰۰ · ۳۰ دقیقه", time: "دیروز", unread: false, route: "officehours", icon: "calendar" },
  { id: "n-5", category: "social", title: "دکتر عظیمی به سوال شما درباره مومنتوم پاسخ داد", body: "در انجمن CS-410", time: "دیروز", unread: false, route: "community", icon: "chat" },
  { id: "n-6", category: "cert", title: "گواهی پایان دوره آمار بیزی برای شما صادر شد", body: "Verifiable Credential · OB 3.0", time: "۲ روز پیش", unread: false, route: "credential", icon: "cert" },
  { id: "n-7", category: "event", title: "وبینار ساخت RAG با LangGraph تا ۳ روز دیگر", body: "ثبت‌نام شما تأیید شده", time: "۲ روز پیش", unread: false, route: "events", icon: "live" },
  { id: "n-8", category: "social", title: "علی شما را به گروه مطالعه‌ی ریاضی دعوت کرد", body: "۸ نفر · جلسه‌ی هفتگی پنج‌شنبه‌ها", time: "۳ روز پیش", unread: false, route: "community", icon: "users" },
  { id: "n-9", category: "admin", title: "یادآوری پرداخت شهریه ترم تابستان", body: "تا ۱۵ شهریور باید پرداخت شود", time: "هفته پیش", unread: false, route: "settings", icon: "shield" },
];

// ---------- Conversations ----------
export const CONVERSATIONS = [
  { id: "conv-1", peerId: "f-azimi", name: "دکتر آرش عظیمی", role: "استاد · CS-410", avatar: "AA", color: "cyan", last: "برای پروژه پایان ترم چی فکر کردی؟", time: "۱۴:۳۱", unread: 2, online: true },
  { id: "conv-2", peerId: "g-math", name: "گروه مطالعه ریاضی", role: "۸ عضو", avatar: "MS", color: "amber", last: "علی: فردا ۲۰:۳۰ همگی هستیم؟", time: "۲ ساعت", unread: 4, online: true, isGroup: true },
  { id: "conv-3", peerId: "f-mousavi", name: "دکتر سپیده موسوی", role: "استاد · CS-620", avatar: "SM", color: "violet", last: "مقاله رو فرستادم، نظرت چیه؟", time: "دیروز", unread: 0, online: false },
  { id: "conv-4", peerId: "s-saare", name: "ساره فرجی", role: "هم‌کلاسی", avatar: "SF", color: "rose", last: "ممنون که توضیح دادی", time: "دیروز", unread: 0, online: true },
  { id: "conv-5", peerId: "s-mehrdad", name: "مهرداد افشار", role: "هم‌کلاسی", avatar: "MA", color: "cyan", last: "تشکر بابت notebook", time: "۲ روز", unread: 0, online: false },
  { id: "conv-6", peerId: "support", name: "پشتیبانی پلتفرم", role: "تیم", avatar: "DU", color: "amber", last: "تیکت شما حل شد", time: "۳ روز", unread: 0, online: true },
];

export const CHAT_HISTORY = {
  "conv-1": [
    { from: "them", text: "نسرین سلام، تمرین ۴ رو بررسی کردم. کار خوبی انجام دادی روی پیاده‌سازی مومنتوم.", time: "۱۴:۲۰" },
    { from: "them", text: "فقط یه نکته — در فرمول update، باید نرخ یادگیری رو بعد از warm-up کاهش بدی.", time: "۱۴:۲۱" },
    { from: "me", text: "ممنون از بررسی استاد. یعنی learning rate scheduling؟", time: "۱۴:۲۸" },
    { from: "them", text: "کسینوسی برای این مسئله بهتر کار می‌کنه. می‌تونی CosineAnnealingLR رو تست کنی.", time: "۱۴:۳۰" },
    { from: "them", text: "برای پروژه پایان ترم چی فکر کردی؟", time: "۱۴:۳۱" },
  ],
  "conv-2": [
    { from: "them", text: "علی: فردا ۲۰:۳۰ همگی هستیم؟", time: "۱۲:۳۰" },
    { from: "them", text: "ساره: من هستم", time: "۱۲:۳۲" },
    { from: "them", text: "مهرداد: من ۲۰:۴۵ می‌رسم", time: "۱۲:۴۵" },
  ],
};

// ---------- Events / Webinars ----------
export const EVENTS = [
  { id: "ev-1", title: "آینده‌ی LLMها در آموزش — کنفرانس سالانه ۱۴۰۵", kind: "کنفرانس", date: "۱۸ تا ۲۰ شهریور ۱۴۰۵", attendees: 842, free: true, by: "تیم برگزاری", featured: true },
  { id: "ev-2", title: "ساخت RAG با LangGraph", kind: "وبینار", date: "۲۸ مرداد · ۱۹:۰۰", attendees: 248, free: true, by: "دکتر موسوی" },
  { id: "ev-3", title: "مدل‌سازی موضوعی فارسی", kind: "کارگاه", date: "۲ شهریور · ۱۴:۰۰", attendees: 32, free: false, by: "دکتر طاهری" },
  { id: "ev-4", title: "حاکمیت داده در ایران", kind: "سخنرانی مهمان", date: "۵ شهریور · ۱۸:۰۰", attendees: 412, free: true, by: "مهمان از وزارت ICT" },
  { id: "ev-5", title: "روز باز پذیرش ۱۴۰۵", kind: "روز باز", date: "۱۰ شهریور · کل روز", attendees: 1240, free: true, by: "تیم پذیرش" },
  { id: "ev-6", title: "Kubernetes از صفر", kind: "کارگاه", date: "۱۴ شهریور · ۱۰:۰۰", attendees: 56, free: false, by: "م. کیانی" },
  { id: "ev-7", title: "Backpropagation شهودی", kind: "وبینار", date: "۲۱ شهریور · ۲۰:۰۰", attendees: 184, free: true, by: "دکتر عظیمی" },
];

// ---------- Jobs ----------
export const JOBS = [
  { id: "j-1", company: "اسنپ", logo: "اس", color: "rose", title: "ML Engineer — Recommendation Systems", location: "تهران · دورکار", type: "تمام‌وقت", salary: "۴۰ تا ۶۰ م/ماه", match: 94, posted: "۲ روز پیش" },
  { id: "j-2", company: "دیجی‌کالا", logo: "دک", color: "amber", title: "Data Scientist Intern — Search", location: "تهران · حضوری", type: "کارآموزی", salary: "۱۸ م/ماه", match: 91, posted: "۵ روز پیش" },
  { id: "j-3", company: "تپ‌سی", logo: "تپ", color: "navy", title: "NLP Researcher", location: "دورکار", type: "تمام‌وقت", salary: "۵۰ تا ۸۰ م/ماه", match: 88, posted: "هفته پیش" },
  { id: "j-4", company: "آپ", logo: "آپ", color: "cyan", title: "Backend Engineer — Python", location: "اصفهان · هیبریدی", type: "تمام‌وقت", salary: "۳۵ تا ۵۵ م/ماه", match: 76, posted: "هفته پیش" },
  { id: "j-5", company: "دانشگاه شریف", logo: "شر", color: "violet", title: "پژوهشگر آزمایشگاه AI", location: "تهران · هیبریدی", type: "پاره‌وقت", salary: "۲۰ م/ماه", match: 89, posted: "۳ روز پیش" },
  { id: "j-6", company: "بانک پاسارگاد", logo: "پس", color: "sage", title: "Data Engineer", location: "تهران · حضوری", type: "تمام‌وقت", salary: "۴۵ تا ۶۵ م/ماه", match: 72, posted: "دو هفته پیش" },
];

// ---------- Scholarships ----------
export const SCHOLARSHIPS = [
  { id: "sch-1", title: "بورسیه‌ی پژوهشی هوش مصنوعی", amount: "۲۴ م ت/ترم", deadline: "۱۵ آذر", capacity: "محدودیت ۸ نفر", color: "var(--accent)", criteria: ["GPA > 3.7", "پروپوزال پژوهشی"] },
  { id: "sch-2", title: "بورسیه‌ی استعداد برتر", amount: "پوشش کامل شهریه", deadline: "۲۰ آذر", capacity: "۱۲ نفر", color: "var(--gold)", criteria: ["رتبه برتر ۱٪", "مصاحبه"] },
  { id: "sch-3", title: "بورسیه‌ی نیاز مالی", amount: "۵۰٪ شهریه", deadline: "۱۰ دی", capacity: "ظرفیت وسیع", color: "var(--sage)", criteria: ["گزارش مالی خانواده"] },
  { id: "sch-4", title: "وام دانشجویی صندوق رفاه", amount: "۸ م ت/ماه", deadline: "همه ترم", capacity: "همه دانشجویان", color: "var(--navy)", criteria: ["معدل > 12", "بازپرداخت بعد فارغ‌التحصیلی"] },
];

// ---------- Hackathons ----------
export const HACKATHONS = [
  { id: "h-1", title: "هکاتون ملی AI سلامت ۱۴۰۵", kind: "سلامت", prize: "۸۰۰ م ت", date: "۲۸-۳۰ شهریور", deadline: "۲۰ شهریور", color: "var(--rose)", featured: true, teamSize: 5, hours: 48 },
  { id: "h-2", title: "ICPC منطقه‌ای", kind: "برنامه‌نویسی", prize: "صعود به نهایی جهانی", deadline: "۱۵ مهر", color: "var(--navy)" },
  { id: "h-3", title: "Kaggle Competition شریف", kind: "علوم داده", prize: "۴۰۰ م ت", deadline: "۲۲ مهر", color: "var(--accent)" },
  { id: "h-4", title: "روبوکاپ ۱۴۰۵", kind: "رباتیک", prize: "۵۰۰ م ت + جذب", deadline: "۸ آبان", color: "var(--gold)" },
  { id: "h-5", title: "چالش طراحی محصول", kind: "UX/PM", prize: "۱۲۰ م ت + کارآموزی", deadline: "۱۵ آبان", color: "var(--sage)" },
  { id: "h-6", title: "هکاتون شهر هوشمند تهران", kind: "IoT", prize: "۲۰۰ م ت", deadline: "۲۲ آبان", color: "var(--accent)" },
  { id: "h-7", title: "MUN — مدل سازمان ملل", kind: "علوم سیاسی", prize: "سفر کنفرانس", deadline: "۲۹ آبان", color: "var(--navy)" },
];

// ---------- Alumni ----------
export const ALUMNI = [
  { id: "a-1", name: "نیکا کریمی", year: 1398, role: "ML Engineer @ گوگل (دوبلین)", avatar: "نک", color: "cyan", available: true, mentees: 8 },
  { id: "a-2", name: "آرین فروزش", year: 1396, role: "Co-founder @ استارتاپ", avatar: "AF", color: "amber", available: true, mentees: 12 },
  { id: "a-3", name: "دکتر شیوا نوری", year: 1394, role: "Postdoc @ MIT", avatar: "SN", color: "violet", available: false, mentees: 5 },
  { id: "a-4", name: "مهدی صادقی", year: 1397, role: "Data Lead @ اسنپ", avatar: "MS", color: "rose", available: true, mentees: 18 },
  { id: "a-5", name: "نگار رحیمی", year: 1399, role: "Research @ DeepMind", avatar: "NR", color: "cyan", available: true, mentees: 6 },
  { id: "a-6", name: "علی حسینی", year: 1395, role: "CTO @ شرکت فناوری", avatar: "AH", color: "amber", available: false, mentees: 24 },
];

// ---------- Badges (achievements) ----------
export const BADGES = [
  { id: "b-1", t: "اولین قدم", d: "اولین کلاس را تکمیل کردی", ic: "star", color: "var(--accent)", date: "۱۰ بهمن", locked: false },
  { id: "b-2", t: "تسلط بر مفهوم", d: "۹۰٪+ در یک ماژول", ic: "target", color: "var(--accent)", color2: "var(--navy)", date: "۱۸ بهمن", locked: false },
  { id: "b-3", t: "همکار", d: "۵ پاسخ مفید در انجمن", ic: "users", color: "var(--sage)", date: "دیروز", locked: false },
  { id: "b-4", t: "متعهد", d: "۷ روز استمرار", ic: "trophy", color: "var(--gold)", date: "هفته پیش", locked: false },
  { id: "b-5", t: "جستجوگر", d: "۱۰۰ جستجو در کتابخانه", ic: "search", color: "var(--accent)", xp: 100, locked: true },
  { id: "b-6", t: "مربی همتا", d: "۱۰ پاسخ تأیید شده", ic: "grad", color: "var(--navy)", xp: 200, locked: true },
  { id: "b-7", t: "پژوهشگر", d: "اولین مقاله علمی", ic: "flask", color: "var(--gold)", xp: 500, locked: true },
  { id: "b-8", t: "Master", d: "تسلط کامل بر یک رشته", ic: "cert", color: "var(--accent)", xp: 1000, locked: true },
];

// ---------- Credentials (issued certificates) ----------
export const CREDENTIALS = [
  { id: "cred-1", course: "c-cs410", title: "مبانی یادگیری ماشین", mastery: 92, kind: "گواهی پایان دوره", date: "اسفند ۱۴۰۴", color: "cyan", verifiableId: "DU-2026-CS410-04217-A1" },
  { id: "cred-2", course: "c-stat440", title: "آمار بیزی کاربردی", mastery: 84, kind: "گواهی پایان دوره", date: "بهمن ۱۴۰۴", color: "amber", verifiableId: "DU-2026-STAT440-04217-A1" },
  { id: "cred-3", course: "c-cs420", title: "پایگاه داده پیشرفته", mastery: 88, kind: "گواهی پایان دوره", date: "دی ۱۴۰۴", color: "violet", verifiableId: "DU-2026-CS420-04217-A1" },
  { id: "cred-4", course: null, title: "Python برای تحلیل داده", mastery: 95, kind: "نشان مهارت", date: "آذر ۱۴۰۴", color: "cyan", verifiableId: "DU-2026-PY-04217-S1" },
  { id: "cred-5", course: null, title: "تحلیل آماری SPSS", mastery: 79, kind: "نشان مهارت", date: "آبان ۱۴۰۴", color: "rose", verifiableId: "DU-2026-SPSS-04217-S1" },
  { id: "cred-6", course: null, title: "Git و کنترل نسخه", mastery: 96, kind: "نشان مهارت", date: "مهر ۱۴۰۴", color: "amber", verifiableId: "DU-2026-GIT-04217-S1" },
];

// ---------- Transcript ----------
export const TRANSCRIPT = [
  {
    code: "TERM-1404-2", season: "بهار ۱۴۰۴", title: "ترم دوم کارشناسی ارشد",
    gpa: 3.92, credits: 18,
    courses: [
      { code: "CS-410", title: "مبانی یادگیری ماشین", credits: 3, score: 92, grade: "A", prof: "f-azimi" },
      { code: "STAT-440", title: "آمار بیزی کاربردی", credits: 3, score: 88, grade: "B+", prof: "f-farhadi" },
      { code: "MATH-510", title: "ریاضی پیشرفته", credits: 3, score: 95, grade: "A+", prof: "f-kaveh" },
      { code: "CS-620", title: "پردازش زبان طبیعی", credits: 3, score: 90, grade: "A", prof: "f-mousavi" },
      { code: "PHIL-220", title: "اخلاق هوش مصنوعی", credits: 2, score: 84, grade: "B+", prof: "f-taheri" },
      { code: "RES-501", title: "روش پژوهش", credits: 2, score: 91, grade: "A", prof: "f-razavi" },
      { code: "SEM-001", title: "سمینار تخصصی", credits: 2, score: 88, grade: "B+", prof: null },
    ],
  },
  {
    code: "TERM-1404-1", season: "پاییز ۱۴۰۴", title: "ترم اول کارشناسی ارشد",
    gpa: 3.72, credits: 18,
    courses: [
      { code: "CS-380", title: "ساختمان داده پیشرفته", credits: 3, score: 89, grade: "B+", prof: "f-khademi" },
      { code: "CS-420", title: "پایگاه داده توزیع‌شده", credits: 3, score: 92, grade: "A", prof: "f-kiani" },
      { code: "MATH-440", title: "جبر خطی کاربردی", credits: 3, score: 85, grade: "B+", prof: "f-safavi" },
      { code: "CS-560", title: "شبکه‌های کامپیوتری", credits: 3, score: 82, grade: "B", prof: "f-ahmadi" },
      { code: "LANG-501", title: "زبان تخصصی", credits: 2, score: 90, grade: "A", prof: "f-bahman" },
      { code: "CS-450", title: "هوش مصنوعی", credits: 3, score: 94, grade: "A", prof: "f-azimi" },
      { code: "RES-401", title: "روش تحقیق مقدماتی", credits: 1, score: 92, grade: "A", prof: "f-taheri" },
    ],
  },
];

// ---------- Helpers / selectors ----------
export const findCourse = (id) => COURSES.find((c) => c.id === id);
export const findFaculty = (id) => FACULTY.find((f) => f.id === id);
export const findSchool = (id) => SCHOOLS.find((s) => s.id === id);
export const findProgram = (id) => PROGRAMS.find((p) => p.id === id);
export const findLab = (id) => LABS.find((l) => l.id === id);
export const programsBySchool = (schoolId) => PROGRAMS.filter((p) => p.school === schoolId);
export const coursesByInstructor = (facultyId) => COURSES.filter((c) => c.instructor === facultyId);
export const coursesByStudent = (student = CURRENT_USER) => student.enrolledCourses.map(findCourse).filter(Boolean);

// ---------- Schedule (weekly) ----------
export const WEEKLY_SCHEDULE = [
  { day: 0, start: 10, dur: 2, title: "یادگیری ماشین", code: "CS-410", kind: "live", course: "c-cs410" },
  { day: 0, start: 14, dur: 1.5, title: "تمرین تطبیقی", code: "AUTO", kind: "self" },
  { day: 1, start: 9, dur: 2, title: "NLP پیشرفته", code: "CS-620", kind: "live", course: "c-cs620" },
  { day: 1, start: 16, dur: 2, title: "آمار بیزی", code: "STAT-440", kind: "live", course: "c-stat440" },
  { day: 2, start: 11, dur: 1.5, title: "گروه مطالعه", code: "PEER", kind: "peer" },
  { day: 2, start: 14, dur: 3, title: "Office Hours", code: "OH", kind: "office" },
  { day: 3, start: 10, dur: 2, title: "یادگیری ماشین", code: "CS-410", kind: "live", course: "c-cs410" },
  { day: 3, start: 18, dur: 1, title: "آزمون میان‌ترم", code: "EXAM", kind: "exam" },
  { day: 4, start: 9, dur: 2, title: "NLP پیشرفته", code: "CS-620", kind: "live", course: "c-cs620" },
  { day: 4, start: 15, dur: 2, title: "کارگاه عملی", code: "WORK", kind: "lab" },
];

export const WEEK_DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
