# دیجی‌یونیورسیتی — DigiUniversity

پروتوتایپ کامل فرانت‌اند برای پلتفرم دانشگاه آنلاین هوشمند مبتنی بر هوش مصنوعی.

> **یادداشت (silent fix per Landing-D38, 2026-05-24):** بخش‌های «Cognitive Cathedral» در ادامه‌ی این README تاریخ گذشته است. **پیاده‌سازی واقعی در `styles.css` (header comment صفحه ۴) = "University Press — Minimal Academic"**: پس‌زمینه‌ی کاغذ خامه‌ای (`#fafaf5`) + جوهر سیاه (`#0d0d0c`) + اکسنت آبی اکسفورد (`oklch(0.34 0.13 255)`). README در نسخه‌های بعدی به‌روزرسانی می‌شود؛ تا آن زمان، **CSS منبع حقیقت** است. توضیح کامل در `docs/PHASE_A_LANDING_AUDIT.md` Section A.5 و Section H Q-AUDIT-5.

## معماری زیبایی‌شناختی: "Cognitive Cathedral" (outdated — see note above)
- پس‌زمینه تیره سرمه‌ای + اکسنت‌های فیروزه‌ای، عنبر طلایی و بنفش (همگی oklch)
- فونت Vazirmatn برای فارسی + JetBrains Mono برای فنی
- RTL کامل، اثرات سه‌بعدی با CSS perspective، گرادیان aurora، و grain ظریف

## صفحات پیاده‌سازی‌شده — ۱۴ صفحه
1. **خانه** (`#home`) — هیرو با کارت‌های شناور سه‌بعدی، پنج عامل هوشمند، گراف دانش، معماری ایزومتریک، کاتالوگ دروس، تور پلتفرم
2. **برنامه‌ها** (`#programs`) — شش برنامه آکادمیک، چهار حالت یادگیری
3. **کلاس زنده** (`#classroom`) — استیج WebRTC، شرکت‌کنندگان، تولبار، AI Tutor + Transcript + Q&A
4. **آرشیو ضبط‌ها** (`#recordings`) — کتابخانه‌ی ویدئو با خلاصه و کوییز خودکار
5. **جستجوی معنایی** (`#search`) — Hybrid retrieval (BM25 + dense) با AI synthesis
6. **میز کار دانشجو** (`#dashboard`) — پروفایل شناختی رادار، sparkline، برنامه هفته
7. **درس** (`#course`) — نقشه ماژول‌ها، اهداف یادگیری، AI Tutor جانبی
8. **آزمون تطبیقی** (`#assessment`) — IRT 2PL، تخمین زنده‌ی سطح، proctoring
9. **جامعه** (`#community`) — انجمن با خوشه‌بندی AI سوالات و leaderboard
10. **کنسول استاد** (`#instructor`) — سلامت کلاس، Coach suggestions، صف بازبینی
11. **استودیوی تولید درس** (`#authoring`) — Blueprint، Outline، سیاست عامل‌های AI
12. **تحلیل‌گری نهادی** (`#analytics`) — Heatmap، Cohort، Early Warning
13. **پذیرش** (`#admissions`) — ۵ مرحله با احراز هویت و ارزیابی تطبیقی
14. **گواهی دیجیتال** (`#credential`) — Certificate طلایی، JSON-LD، Verifiable Credentials

## اجرا
این پروتوتایپ self-contained است. فقط `index.html` را در مرورگر باز کنید.

```bash
# یا با یک سرور ساده:
python3 -m http.server 8000
# سپس: http://localhost:8000
```

## پورت به Next.js — راهنمای سریع

ساختار کنونی به‌گونه‌ای طراحی شده که مستقیماً قابل پورت به Next.js 15 + App Router است:

```
my-next-app/
├── app/
│   ├── layout.tsx              # Nav + Footer از src/shared.jsx
│   ├── page.tsx                # از src/pages/Home.jsx
│   ├── programs/page.tsx       # از src/pages/Programs.jsx
│   ├── classroom/page.tsx      # از src/pages/Classroom.jsx
│   ├── dashboard/page.tsx      # از src/pages/Dashboard.jsx
│   ├── courses/[id]/page.tsx   # از src/pages/Course.jsx
│   ├── instructor/page.tsx     # از src/pages/Instructor.jsx
│   ├── admissions/page.tsx     # از src/pages/Admissions.jsx
│   └── credentials/page.tsx    # از src/pages/Credential.jsx
├── components/
│   ├── Icon.tsx                # از src/icons.jsx
│   ├── Nav.tsx
│   ├── Footer.tsx
│   ├── viz/
│   │   ├── KnowledgeGraph.tsx
│   │   ├── CognitiveRadar.tsx
│   │   ├── Sparkline.tsx
│   │   └── ArchStack.tsx
│   └── ui/                     # Stat, ActionCard, Upload, ...
├── styles/
│   └── globals.css             # از styles.css
└── public/fonts/               # Vazirmatn + JetBrains Mono
```

### مراحل پورت:
1. `npx create-next-app@latest my-app --typescript --app --tailwind`
2. `styles.css` را کپی کنید به `styles/globals.css`
3. هر فایل `.jsx` در `src/pages/` را به یک route تبدیل کنید (state hookها مستقیماً کار می‌کنند)
4. `'use client'` را در ابتدای صفحاتی که useState دارند اضافه کنید
5. فونت Vazirmatn را با `next/font/google` بارگذاری کنید
6. در `app/layout.tsx`، `<html lang="fa" dir="rtl">` تنظیم کنید

## استک پیشنهادی Backend (طبق پروپوزال)
- NestJS / Spring Boot / FastAPI (microservices)
- PostgreSQL + Redis + ClickHouse + Qdrant
- Kafka برای event stream
- WebRTC SFU (LiveKit / mediasoup) برای کلاس
- LangGraph + Whisper برای AI
- Kubernetes + ArgoCD

## استانداردهای رعایت‌شده در طراحی
LTI 1.3 · xAPI · QTI 3.0 · Caliper · OneRoster 1.2 · Open Badges 3.0 · Verifiable Credentials · WCAG 2.2 AA

---

تهیه شده برای پروپوزال دانشگاه آنلاین AI-Native · نسخه ۱.۰
