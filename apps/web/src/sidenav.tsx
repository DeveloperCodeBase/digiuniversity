// =====================================================
// Master role-aware sidebar — used in all dashboards
//
// Phase-14.5 C4: dropped @ts-nocheck. The SIDEBAR_BY_ROLE structure
// is two-dimensional: each role's array is a flat list of items, with
// "header" items (`{ h: "..." }`) interleaved between "link" items
// (`{ id, t, ic }`). The discriminated union below makes that explicit
// for both TS and future readers.
// =====================================================
import React from "react";
import { Icon } from "./icons";
import { useRole, type RoleId } from "./role";
import type { Go } from "./router";

interface SidebarHeader {
  h: string;
}
interface SidebarLink {
  id: string;
  t: string;
  ic: string;
}
type SidebarEntry = SidebarHeader | SidebarLink;

const isHeader = (e: SidebarEntry): e is SidebarHeader =>
  (e as SidebarHeader).h !== undefined;

export const SIDEBAR_BY_ROLE: Record<RoleId, SidebarEntry[]> = {
  student: [
    { h: "یادگیری" },
    { id: "dashboard", t: "میز کار", ic: "home" },
    { id: "course", t: "دروس من", ic: "book" },
    { id: "calendar", t: "تقویم", ic: "calendar" },
    { id: "registration", t: "ثبت‌نام واحد", ic: "plus" },
    { id: "submission", t: "تمرین‌ها و آزمون", ic: "check" },
    { id: "transcript", t: "کارنامه", ic: "file" },
    { id: "degree-audit", t: "مسیر مدرک", ic: "target" },
    { h: "منابع" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "labs", t: "آزمایشگاه مجازی", ic: "flask" },
    { id: "recordings", t: "آرشیو کلاس‌ها", ic: "video" },
    { id: "search", t: "جستجوی معنایی", ic: "search" },
    { h: "هوش مصنوعی" },
    { id: "classroom", t: "کلاس زنده + AI", ic: "sparkle" },
    { id: "assessment", t: "آزمون تطبیقی", ic: "chip" },
    { h: "اجتماع" },
    { id: "community", t: "انجمن و بحث", ic: "users" },
    { id: "messages", t: "پیام‌ها", ic: "chat" },
    { id: "officehours", t: "Office Hours", ic: "headset" },
    { id: "alumni", t: "شبکه فارغ‌التحصیلان", ic: "grad" },
    { id: "hackathons", t: "هکاتون و رقابت", ic: "trophy" },
    { id: "events", t: "رویدادها", ic: "live" },
    { h: "خدمات دانشجویی" },
    { id: "career", t: "خدمات شغلی", ic: "bolt" },
    { id: "financial-aid", t: "کمک‌هزینه", ic: "dollar" },
    { id: "wellness", t: "سلامت و مشاوره", ic: "shield" },
    { id: "credential", t: "گواهی‌ها", ic: "cert" },
    { h: "حساب" },
    { id: "profile", t: "پروفایل عمومی", ic: "user" },
    { id: "bookmarks", t: "ذخیره‌ها", ic: "star" },
    { id: "achievements", t: "دستاوردها", ic: "trophy" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
  ],

  instructor: [
    { h: "تدریس" },
    { id: "instructor", t: "نمای کلی", ic: "home" },
    { id: "classroom", t: "کلاس زنده", ic: "live" },
    { id: "authoring", t: "استودیوی تولید", ic: "sparkle" },
    { id: "course", t: "دروس من", ic: "book" },
    { id: "officehours", t: "Office Hours", ic: "headset" },
    { h: "دانشجویان" },
    { id: "analytics", t: "تحلیل کلاس", ic: "chart" },
    { id: "submission", t: "تصحیح تمرین", ic: "check" },
    { id: "messages", t: "پیام‌ها", ic: "chat" },
    { h: "پژوهش" },
    { id: "research", t: "محیط پژوهشی", ic: "flask" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "labs", t: "آزمایشگاه‌ها", ic: "chip" },
    { h: "اداری" },
    { id: "events", t: "رویدادها", ic: "calendar" },
    { id: "honor-code", t: "صداقت علمی", ic: "shield" },
    { id: "profile", t: "پروفایل", ic: "user" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
  ],

  admin: [
    { h: "عملیات" },
    { id: "admin", t: "نمای کلی", ic: "home" },
    { id: "analytics", t: "تحلیل سامانه", ic: "chart" },
    // Phase B R1 Commit I (D62) — 4 new academic-hierarchy admin
    // routes. Existing "schools" and "faculty" items repointed to the
    // new full-CRUD admin pages; "departments" and "programs" added.
    { h: "ساختار آکادمیک" },
    { id: "admin/schools", t: "دانشکده‌ها", ic: "grad" },
    { id: "admin/faculties", t: "هیأت‌ها", ic: "users" },
    { id: "admin/departments", t: "گروه‌ها", ic: "folder" },
    { id: "admin/programs", t: "برنامه‌ها", ic: "cert" },
    // Phase B R2 Commit F (D65) — Offerings + Cohorts admin entries.
    // Offerings is the modern surface; Cohorts retains its «Legacy»
    // banner per MIGRATION_POLICY §6 Sunset window.
    { id: "admin/offerings", t: "دوره‌های ارائه‌شده", ic: "live" },
    { id: "admin/cohorts", t: "گروه‌های آموزشی (Legacy)", ic: "users" },
    // Phase B R3.a Commit G (D68 + D69) — Identity track admin entries.
    // /admin/profiles is the D69 5th-page addition (admin convenience
    // pairing with the self-service /profile route). All three pages
    // land as per-route lazy chunks (D66 Path D — NO admin bucket).
    { h: "افراد" },
    { id: "admin/profiles", t: "پروفایل‌ها", ic: "user" },
    { id: "admin/students", t: "دانشجویان", ic: "users" },
    { id: "admin/instructors", t: "اساتید", ic: "grad" },
    // Phase B R3.b Commit G (D71) — Applications inbox. Single entry
    // serves both student + instructor apps (Q9.a unified surface);
    // type filter inside the page distinguishes them.
    { id: "admin/applications", t: "درخواست‌ها", ic: "inbox" },
    // Phase B R4 Commit E (D73) — Enrollments admin (closes the D72
    // spine gap). Program-term admissions + course-level enrollments
    // + manual enroll + status state machine.
    { id: "admin/enrollments", t: "ثبت‌نام‌ها", ic: "cert" },
    { h: "محتوا و منابع" },
    { id: "authoring", t: "استودیوی درس", ic: "sparkle" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "labs", t: "آزمایشگاه‌ها", ic: "flask" },
    { id: "events", t: "رویدادها", ic: "live" },
    { h: "حاکمیت" },
    { id: "honor-code", t: "صداقت علمی", ic: "shield" },
    { id: "financial-aid", t: "بورسیه و وام", ic: "dollar" },
    { id: "settings", t: "تنظیمات سامانه", ic: "settings" },
  ],

  parent: [
    { h: "فرزند" },
    { id: "parent", t: "نمای کلی", ic: "home" },
    { id: "calendar", t: "تقویم فرزند", ic: "calendar" },
    { id: "credential", t: "گواهی و نمرات", ic: "cert" },
    { h: "ارتباط" },
    { id: "messages", t: "پیام به استاد", ic: "chat" },
    { id: "inbox", t: "اعلان‌ها", ic: "bell" },
    { id: "officehours", t: "جلسه با مشاور", ic: "headset" },
    { h: "اداری" },
    { id: "financial-aid", t: "بورسیه و شهریه", ic: "dollar" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
    { id: "help", t: "پشتیبانی", ic: "headset" },
  ],

  org: [
    { h: "تیم" },
    { id: "admin", t: "نمای کلی", ic: "home" },
    { id: "analytics", t: "تحلیل تیم", ic: "chart" },
    { id: "faculty", t: "مربیان", ic: "users" },
    { h: "محتوا" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "events", t: "رویدادها", ic: "live" },
    { id: "authoring", t: "تولید محتوا", ic: "sparkle" },
    { h: "اداری" },
    { id: "pricing", t: "اشتراک و پلن", ic: "dollar" },
    { id: "settings", t: "تنظیمات سازمان", ic: "settings" },
    { id: "help", t: "پشتیبانی", ic: "headset" },
  ],

  // Phase-15 R7: sidebars for the 5 new roles added in R1's seed.
  ta: [
    { h: "تدریس" },
    { id: "classroom", t: "کلاس زنده", ic: "live" },
    { id: "course", t: "دروس من", ic: "book" },
    { id: "officehours", t: "Office Hours", ic: "headset" },
    { h: "دانشجویان" },
    { id: "submission", t: "تصحیح تمرین", ic: "check" },
    { id: "messages", t: "پیام‌ها", ic: "chat" },
    { id: "analytics", t: "تحلیل کلاس", ic: "chart" },
    { h: "حساب" },
    { id: "profile", t: "پروفایل", ic: "user" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
  ],

  content_manager: [
    { h: "محتوا" },
    { id: "authoring", t: "استودیوی درس", ic: "sparkle" },
    { id: "course", t: "دروس منتشرشده", ic: "book" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { h: "تحلیل" },
    { id: "analytics", t: "تحلیل کاتالوگ", ic: "chart" },
    { h: "حساب" },
    { id: "profile", t: "پروفایل", ic: "user" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
    { id: "help", t: "پشتیبانی", ic: "headset" },
  ],

  support: [
    { h: "پشتیبانی" },
    { id: "admin", t: "میز پشتیبانی", ic: "home" },
    { id: "audit", t: "گزارش حسابرسی", ic: "shield" },
    { id: "messages", t: "پیام‌های ورودی", ic: "chat" },
    { id: "inbox", t: "اعلان‌ها", ic: "bell" },
    { h: "حساب" },
    { id: "profile", t: "پروفایل", ic: "user" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
  ],

  moderator: [
    { h: "نظارت" },
    { id: "community", t: "انجمن و بحث", ic: "users" },
    { id: "messages", t: "گزارش‌ها", ic: "chat" },
    { h: "حساب" },
    { id: "profile", t: "پروفایل", ic: "user" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
    { id: "help", t: "پشتیبانی", ic: "headset" },
  ],

  super_admin: [
    { h: "ابرمدیریت" },
    { id: "admin", t: "نمای کلی", ic: "home" },
    { id: "analytics", t: "تحلیل سامانه", ic: "chart" },
    { id: "audit", t: "گزارش حسابرسی", ic: "shield" },
    { h: "ساختار" },
    { id: "schools", t: "دانشکده‌ها", ic: "grad" },
    { id: "faculty", t: "هیات علمی", ic: "users" },
    { id: "events", t: "رویدادها", ic: "live" },
    { h: "حساب" },
    { id: "settings", t: "تنظیمات سامانه", ic: "settings" },
  ],
};

// Wrap a list in <ul> if it isn't already (compat with existing CSS).
// Phase 12: items are real <a href> + onClick so they:
//   1. show their destination in the status bar on hover,
//   2. support Cmd-click / middle-click → background tab,
//   3. expose aria-current="page" for screen readers and styling,
//   4. are reachable via keyboard with the default focus ring (CSS).
// Phase-14 R3: href changed from "#route" to "/route" alongside the
// BrowserRouter migration. The status-bar hover, middle-click, and
// keyboard semantics all still apply.
export interface RoleSideNavProps {
  active: string;
  go: Go;
  /**
   * R7.12 — dual-mode rendering for the Mini-variant Drawer.
   * - "expanded" (default, backward-compatible): icon + label, group
   *   headers visible. Used by the <1024px Sheet drawer and (when
   *   wrapped by MiniRail) the ≥1024px expanded rail.
   * - "mini": icon-only, group headers hidden. Label travels via the
   *   anchor's `title=` (native tooltip) AND a sr-only span (screen
   *   readers still get the label). Used by the ≥1024px mini rail.
   */
  mode?: "mini" | "expanded";
}

interface SidebarGroup {
  h: string;
  items: SidebarLink[];
}

export const RoleSideNav = ({ active, go, mode = "expanded" }: RoleSideNavProps): React.ReactElement => {
  const { role } = useRole();
  const items: SidebarEntry[] = SIDEBAR_BY_ROLE[role.id] || SIDEBAR_BY_ROLE.student;
  const isMini = mode === "mini";
  // Group items: each `{ h: ... }` starts a new group
  const groups: SidebarGroup[] = [];
  let current: SidebarGroup | null = null;
  items.forEach((it) => {
    if (isHeader(it)) {
      current = { h: it.h, items: [] };
      groups.push(current);
    } else if (current) {
      current.items.push(it);
    } else {
      current = { h: "", items: [it] };
      groups.push(current);
    }
  });
  return (
    <aside
      className={"side-nav" + (isMini ? " side-nav-mini" : "")}
      aria-label={`ناوبری نقش ${role.label}`}
      data-mode={mode}
    >
      {groups.map((g, gi) => (
        <React.Fragment key={gi}>
          {/* Group headers hidden in mini mode (no room for text in a
              72px column). The sr-only sibling below keeps the
              semantic grouping accessible to screen readers. */}
          {g.h && !isMini ? <h6>{g.h}</h6> : null}
          {g.h && isMini ? <h6 className="sr-only">{g.h}</h6> : null}
          <ul>
            {g.items.map((it) => (
              <li key={it.id}>
                <a
                  href={"/" + it.id}
                  className={active === it.id ? "active" : ""}
                  aria-current={active === it.id ? "page" : undefined}
                  title={isMini ? it.t : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(it.id);
                  }}
                >
                  <Icon name={it.ic} size={14} />
                  {isMini ? <span className="sr-only">{it.t}</span> : it.t}
                </a>
              </li>
            ))}
          </ul>
        </React.Fragment>
      ))}
    </aside>
  );
};

export default RoleSideNav;
