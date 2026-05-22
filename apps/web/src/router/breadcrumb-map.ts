// Phase-A R1.2 — route-id → Persian breadcrumb label. Static dictionary.
// Phase-B will layer dynamic context-aware labels (e.g., resolved course
// title for `/course/:courseId`) via a future resolver hook; R1.2 keeps
// the surface minimal — just a lookup and a fallback to the raw id/param.

export const BREADCRUMB_LABELS: Record<string, string> = {
  home: "خانه", programs: "برنامه‌ها", catalog: "کاتالوگ", "my-courses": "دوره‌های من",
  progress: "پیشرفت", tutor: "دستیار AI", classroom: "کلاس زنده", dashboard: "میز کار",
  course: "درس", "course-live": "کلاس زنده درس", instructor: "کنسول استاد",
  admissions: "پذیرش", credential: "گواهی‌ها", search: "جستجو", assessment: "آزمون",
  "assessment-live": "آزمون زنده", community: "انجمن", analytics: "تحلیل",
  authoring: "استودیو", recordings: "بایگانی کلاس‌ها", audit: "گزارش حسابرسی",
  login: "ورود", register: "ثبت‌نام", forgot: "بازیابی رمز", "verify-email": "تأیید ایمیل",
  "2fa-setup": "تأیید دومرحله‌ای", onboarding: "آغاز کار", settings: "تنظیمات",
  calendar: "تقویم", library: "کتابخانه", help: "پشتیبانی", pricing: "پلن‌ها",
  faculty: "هیات علمی", admin: "میز مدیریت", parent: "میز والد", officehours: "Office Hours",
  events: "رویدادها", about: "درباره ما", schools: "دانشکده‌ها", labs: "آزمایشگاه‌ها",
  virtuallab: "آزمایشگاه مجازی", research: "پژوهش", inbox: "صندوق ورودی",
  messages: "پیام‌ها", bookmarks: "ذخیره‌ها", achievements: "دستاوردها",
  submission: "تمرین‌ها", profile: "پروفایل", transcript: "کارنامه",
  "degree-audit": "مسیر مدرک", registration: "ثبت‌نام واحد", career: "خدمات شغلی",
  "financial-aid": "کمک‌هزینه", wellness: "سلامت", alumni: "فارغ‌التحصیلان",
  hackathons: "هکاتون", "honor-code": "صداقت علمی",
};

export const breadcrumbLabel = (id: string): string => BREADCRUMB_LABELS[id] || id;
