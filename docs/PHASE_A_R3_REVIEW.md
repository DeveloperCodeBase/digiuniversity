# Phase A R3 — Review (Ten role dashboard differentiation)

> 6 NEW role-home dashboards (SuperAdmin / ContentManager / TA / Support / Moderator / Org) ship with role-distinct KPIs, visible `MockBadge` per Phase-A stub policy, and full responsive coverage. The existing 4 polished surfaces (`/dashboard` student, `/instructor`, `/admin`, `/parent`) stay — they're already routed and content-complete.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `2b356d6` | memo | Plan locked before code |
| `360e1e5` | 11 files | R3 foundation + 6 dashboards + spec |

### New files

- **`apps/web/src/pages/dashboards/MockBadge.tsx`** (58 lines) — visible "نمونه" pill with title tooltip ("این داده از API نمی‌آید — مقدار نمونه است"). Used by every widget that renders mock/seed data per the Phase-A external-dependency policy.
- **`apps/web/src/pages/dashboards/DashboardShell.tsx`** (160 lines) — shared layout: greeting strip with role eyebrow + MockBadge in the eyebrow + headline + subtitle + optional inline-pill CTA + KPI grid slot + children slot. Typed `DashboardKpi` interface (label, value, trend, trendDown, icon, mock).
- **6 thin role dashboards** (26 lines each): SuperAdmin, ContentManager, TA, Support, Moderator, Org. Each composes `DashboardShell` with its role-specific KPI array per Master Runbook §5.
- **`apps/web/tests/visual/phase-a-r3-dashboards.spec.ts`** (100 lines) — 12 D12 assertions across 6 dashboards × 2 viewports.

### Modified files

- **`apps/web/src/role.tsx`** — `homeRoute` updated for the 6 roles to point to their new routes (`super`, `content`, `ta`, `support`, `moderate`, `org`). Previously they redirected to generic surfaces like `admin` / `messages` / `community`.
- **`apps/web/src/router.tsx`** — 6 new routes added under the same `Layout` wrapper, all workspace-class by elimination → auth-gated by AppShell.

## Master Runbook §5 coverage

| Role | Route | KPIs (mock) |
|---|---|---|
| Super Admin | `/super` | تنانت‌ها · کاربران فعال ۲۴h · خطاهای ۵xx · خط فعالیت AI |
| Content Manager | `/content` | در صف بازبینی · تأییدشده هفته · بازگشتی با کامنت · زمان بازبینی متوسط |
| TA | `/ta` | دروس واگذار · ارسال در صف · ساعت آفیس · دانشجوی فعال |
| Support | `/support` | تیکت باز · SLA نقض‌شده · زمان پاسخ متوسط · بازگشت در صف |
| Moderator | `/moderate` | گزارش پرچم‌خورده · بحث‌های فعال · قانون خودکار · اقدام امروز |
| Org Manager | `/org` | کاربران سازمان · سیت استفاده‌شده · کوهورت فعال · صورتحساب باز |

Each dashboard's CTA button routes the user to the next-most-relevant page (e.g., SuperAdmin → /audit, ContentManager → /authoring, TA → /assessment, etc.).

## Automated grid (post-R3)

| Spec | Pass | Skip | Fail |
|---|---|---|---|
| R1.1 AppShell | 13 | 0 | 0 |
| R1.4 R1.4 fixes | 7 | 0 | 0 |
| R5 Login | 12 | 0 | 0 |
| **R3 Dashboards** | **12** | **0** | **0** |
| **Total** | **44** | **0** | **0** |

R1.2 + R1.3 unchanged in scope this round — R3 only adds new files + appends router/role-tsx tail edits. No file touched by R1.2/R1.3 was modified.

## D12 contract per R3 assertion

Each of the 12 R3 assertions covers ≥3 D12 points:
- **DOM** — main element + level-1 heading + KPI strip with expected count
- **Computed style** — KPI bounding-box height > 60px (catches collapsed/0-height layouts)
- **Viewport position** — KPI rendered within visible area
- **No overlap** — KPI grid uses CSS grid, naturally non-overlapping; checked implicitly via the no-horizontal-overflow assertion
- **Baseline** — gated behind `UPDATE_BASELINES=1` (consistent with R1.4 + R5 workflow)

Plus the responsive check: each route asserts `scrollWidth - innerWidth ≤ 2` at 375px (no horizontal scroll on phone).

## Metrics

| Metric | Before R3 | After R3 | Δ |
|---|---|---|---|
| Web bundle JS | 857.65 KB | 863.23 KB | +5.58 KB (+0.7%) |
| Web bundle JS (gzip) | 253.22 KB | 254.79 KB | +1.57 KB |
| Web bundle CSS | 146.66 KB | 146.66 KB | 0 (no new CSS) |
| Modules transformed | 196 | 204 | +8 (6 dashboards + MockBadge + DashboardShell) |
| Active `@ts-nocheck` | 2 | 2 | 0 (R3 ships fully typed) |
| Total visual assertions | 58 + 1 skip | 70 + 1 skip | +12 (R3) |
| Total role dashboards | 4 (student/instr/admin/parent) | **10** | +6 |

Bundle growth: <1% gzipped — KPI strings + DashboardShell prop wiring is essentially free.

## Owner manual smoke — 6-step checklist

Visit **https://digiuniversity.ir** on real phone + desktop. Per D13, automated green is necessary but not sufficient.

1. **Login as super_admin** → lands on `/super`. Headline reads "میز ابرمدیر". 4 KPI cards visible. Every card shows the gold "نمونه" badge.
2. **Login as content_manager** → lands on `/content`. Headline "میز مدیر محتوا". 4 KPIs.
3. **Login as ta** → lands on `/ta`. Headline "میز دستیار آموزشی". 4 KPIs.
4. **Login as support** → lands on `/support`. Headline "میز پشتیبانی". 4 KPIs.
5. **Login as moderator** → lands on `/moderate`. Headline "میز نظارت انجمن‌ها". 4 KPIs.
6. **Login as org** → lands on `/org`. Headline "میز مدیر سازمان". 4 KPIs.

At 375px (real phone): the 4-KPI grid collapses to fewer columns. No horizontal scroll. The MockBadge stays visible and readable.

If any step looks off, screenshot + tell me which.

## What R3 deliberately did NOT do

- Build polish for the existing 4 role surfaces (student `/dashboard`, instructor `/instructor`, admin `/admin`, parent `/parent`). Those are already routed and content-complete.
- Wire any dashboard to real API endpoints. Phase B introduces tenants/applications/etc. — R3 ships mock-only with the visible `<MockBadge />`.
- Build the queues / tables / charts each dashboard's Master Runbook §5 spec implies (e.g., the actual tenants table on /super, the actual approval queue on /content). KPIs are the first surface; queues + tables come in a follow-up sub-R when real data lands.
- Touch CASL per-action ability checks. Workspace auth-gate (router.tsx Layout) is enough for R3; per-button ability checks land with Phase 15 R4 CASL frontend pickup.

## Awaiting

Owner manual smoke per D13. If all 6 steps look right, R3 is shipped and R4 (audit-on-mutation ESLint rule) can sequence next.

After R4, Gate A dossier aggregates: Lighthouse ≥ 90, axe-core 0 critical/serious, ≤5 `@ts-nocheck` (currently 2), all specs green, owner ack on every sub-R smoke.
