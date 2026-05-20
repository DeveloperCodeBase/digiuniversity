# Phase 11 — Production-Quality Audit + Fix

این پروژه از نظر backend به سطح production نزدیک است اما تجربه کاربری SPA
به استاندارد حرفه‌ای نرسیده. این فاز یک audit سیستماتیک + fix iterative
برای رساندن وب‌سایت به سطح production است.

## هدف نهایی

یک پلتفرم دانشگاه آنلاین که:

- **در 5 نقش** (دانشجو، استاد، مدیر، والد، سازمان) به درستی کار می‌کند
- **روی هر اندازه دیوایس** (موبایل 375px / تبلت 768px / دسکتاپ 1440px) responsive است
- **Persian RTL** کامل دارد
- در همه browserهای modern (Chrome/Firefox/Safari/Edge) درست رندر می‌شود
- نمرات Lighthouse مناسبی دارد:
  - Performance > 85
  - Accessibility > 95
  - Best Practices > 90
  - SEO > 90
- WCAG 2.2 AA را پاس می‌کند (per `docs/product/PRODUCT_BRIEF.md`)
- خطای console ندارد
- error / loading / empty state برای هر surface async دارد
- keyboard navigation روی هر عنصر تعاملی کار می‌کند
- focus management درست است

## Scope

### 5 نقش کاربری

| نقش | route خانگی | nav انتظاری |
| --- | --- | --- |
| `student` | `#dashboard` یا `#progress` | home, programs/catalog, library, dashboard, calendar, community, credential, tutor |
| `instructor` | `#instructor` | home, instructor, authoring, classroom, analytics, library, officehours |
| `admin` | `#admin` | home, admin, analytics, faculty, library, events |
| `parent` | `#parent` | home, parent, calendar, credential, help |
| `org` | `#admin` | home, admin, analytics, events, pricing, help |

### Route ها (54 مورد)

**Live routes (با API واقعی):** login, catalog, course-live/:id, my-courses, assessment-live/:id, progress, tutor

**Mocked routes (با data.js):** home, programs, classroom, dashboard, course, instructor, admissions, credential, search, assessment, community, analytics, authoring, recordings, register, forgot, verify-email, 2fa-setup, onboarding, settings, calendar, library, help, pricing, faculty, admin, parent, officehours, events, about, schools, labs, virtuallab/:id, research, inbox, messages, bookmarks, achievements, submission, profile, transcript, degree-audit, registration, career, financial-aid, wellness, alumni, hackathons, honor-code

### Breakpoints

- **Mobile**: 375 × 667 (iPhone SE)
- **Tablet**: 768 × 1024 (iPad portrait)
- **Desktop**: 1440 × 900 (MacBook Pro 13")

## Methodology

### Round 1 — Reconnaissance (this turn)

1. **Connect to Chrome** via Claude in Chrome MCP
2. برای هر اندازه دیوایس × هر نقش × route های اصلی:
   - باز کردن صفحه
   - screenshot
   - بررسی console errors
   - کلیک روی هر دکمه primary
   - تست navigation
3. ثبت یافته‌ها در `docs/QUALITY_FINDINGS.md` با ساختار:
   ```
   [P0|P1|P2] <route> @ <breakpoint> · <role>
     - Description
     - Expected vs Actual
     - Screenshot ref
   ```

### Round 2 — Triage + Plan

- گروه‌بندی یافته‌ها بر اساس severity:
  - **P0** — broken (دکمه کار نمی‌کند، صفحه render نمی‌شود، crash می‌کند)
  - **P1** — responsive issue (overflow، unreadable، broken layout روی موبایل)
  - **P2** — polish (typography، spacing، loading state، empty state)
- اولویت‌بندی:
  - P0 های مسیر اصلی (login → catalog → enroll → tutor) اول
  - بعد P0 های جانبی
  - بعد P1 های مسیر اصلی
  - بعد بقیه

### Round 3 — Fix iteratively

- Fix → push → rebuild → reload → screenshot → verify → next
- یک commit متمرکز برای هر دسته (مثلاً "fix: nav responsive on mobile")

### Round 4 — Acceptance run

- Lighthouse روی 3 صفحه اصلی
- screenshot نهایی از هر breakpoint × نقش
- چک کردن RELEASE_CHECKLIST.md

## Standards per surface

### Layout

- container max-width: 1280px
- breakpoints CSS: `@media (max-width: 768px)` و `(max-width: 480px)`
- touch target حداقل 44 × 44 px
- spacing از scale: 4, 8, 12, 16, 20, 24, 32, 48, 64
- grid responsive: `repeat(auto-fill, minmax(280px, 1fr))`

### Typography

- font-size base: 16px
- line-height: 1.6 برای bodyـText
- RTL: `dir="rtl"` در root
- font-family Persian-friendly (موجود است)

### Color + contrast

- AA contrast ratio (4.5:1 برای متن نرمال)
- focus-visible روی هر عنصر تعاملی
- error/warn/success/info رنگ‌های متمایز

### State coverage

برای هر صفحه async:
- ✅ loading state
- ✅ error state (با retry)
- ✅ empty state (با CTA)
- ✅ success state

### Forms

- validation real-time
- error messages Persian
- aria-label / aria-describedby
- submit در Enter
- disabled state در pending

### Nav + sidebar

- mobile: hamburger menu
- tablet: collapsed sidebar
- desktop: full sidebar
- active route highlighted
- role-aware items only

## Tooling

- **Claude in Chrome MCP** برای browse + screenshot + click + console
- **Chrome DevTools Lighthouse** برای performance scoring (manual)
- **scripts/remote.ps1 up** برای push + rebuild
- **scripts/remote.ps1 logs** برای backend errors

## Out of scope (پروژه‌های جانبی)

اینها در tech debt هستند ولی این فاز روی آنها تمرکز نمی‌کند:

- Code-splitting bundle (600KB→<250KB) — Phase 11.1
- Playwright e2e خودکار — Phase 11.2
- A11y audit کامل با axe-core — Phase 11.3
- i18n (انگلیسی، عربی) — Phase 12
- LiveKit / BBB integration — Phase 12

## Tracking

- این سند سرفصل برنامه است
- `docs/QUALITY_FINDINGS.md` — لیست یافته‌ها
- `docs/QUALITY_FIXES.md` — لیست fix ها با commit hash
- در پایان: `docs/PHASE_11_REVIEW.md` با before/after screenshots
