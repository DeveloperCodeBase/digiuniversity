# دیجی‌یونیورسیتی — DigiUniversity

پلتفرم فرانت‌اند دانشگاه آنلاین هوشمند، با Vite + React + Tailwind.

## اجرا

```bash
npm install
npm run dev               # http://localhost:8000
npm run build             # production bundle → dist/
npm run preview           # سرو نسخه‌ی production روی :4173
npm run storybook         # http://localhost:6006
npm run build-storybook   # خروجی استاتیک Storybook
npm test                  # Vitest unit tests
npm run test:e2e          # Playwright end-to-end
```

## ساختار

```
src/
├── main.jsx                   # Entry point
├── App.jsx                    # Hash router + role/theme providers
├── data.js                    # Mock database (single source of truth)
├── icons.jsx
├── motion.jsx
├── role.jsx
├── ui.jsx                     # Toast, Modal, Theme, Command Palette, AI FAB
├── shared.jsx                 # Nav, Footer, KnowledgeGraph, ArchStack
├── sidenav.jsx
├── components/                # Atomic widgets (each with Storybook story)
│   ├── StatCard.jsx + .stories.jsx
│   ├── Toggle.jsx + .stories.jsx
│   ├── FormField.jsx + .stories.jsx
│   ├── Sparkline.jsx + .stories.jsx
│   ├── Stat.jsx + .stories.jsx
│   ├── MasteryRing.jsx + .stories.jsx
│   ├── Feature.jsx + .stories.jsx
│   ├── IconButton.jsx + .stories.jsx
│   └── widgets.jsx            # barrel (back-compat)
└── pages/                     # 49 routes — Home, Classroom, Library, ...

public/icons/                  # PWA SVG icons
tests/
├── data.test.js               # Vitest unit tests for data layer
├── setup.js
└── e2e/                       # Playwright specs (routes, features)
```

## استک

- **Build:** Vite 5 + React 18 + JSX
- **Style:** Tailwind CSS 3 (RTL plugin) + small custom CSS in `styles.css`
- **State:** React 18 hooks + Context (role, theme)
- **Router:** Hash-based با پارامتر (`#virtuallab/RL-GYM`)
- **Tests:** Vitest (unit) + Playwright (e2e)
- **Docs:** Storybook 8
- **PWA:** vite-plugin-pwa (manifest + service worker)

## فیچرهای کلیدی

- **۴۹ روت** با مسیریابی hash + پارامتر
- **۵ نقش** کاربر (دانشجو/استاد/مدیر/والد/سازمان)
- **Mock DB یکپارچه** — همه‌ی صفحات از `data.js` تغذیه می‌شوند: ۸ دانشکده، ۲۴ برنامه، ۱۲ استاد، ۱۸ درس، ۹ آزمایشگاه، ۶ ضبط، ۹ اعلان، ۶ مکالمه، ۷ event، ۶ شغل، ۴ بورسیه، ۷ هکاتون، ۶ alumni، ۸ badge، ۶ گواهی، ۲ ترم کارنامه
- **Dark/Light theme** runtime با persistence (`data-theme` attribute)
- **Command Palette (Ctrl+K)** — fuzzy search روی ۴۵+ دستور
- **AI Floating FAB** سراسری — چت کانتکست‌محور
- **Classroom workflow کامل** — pre-join lobby + live polls + reactions + breakout rooms + AI tutor + transcript + Q&A
- **PWA** — manifest + service worker + offline cache
- **RTL** + ریسپانسیو روی Desktop/Tablet/Mobile
- **Accessibility** — aria-label، focus-visible، touch target 44px

## استانداردها
LTI 1.3 · xAPI · QTI 3.0 · Caliper · OneRoster 1.2 · Open Badges 3.0 · Verifiable Credentials · WCAG 2.2 AA

---

نسخه ۲.۰ · Vite + React + Tailwind + Storybook + Vitest + Playwright · ۱۴۰۵
