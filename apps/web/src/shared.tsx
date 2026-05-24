// =====================================================
// Shared: Nav, Footer, common widgets
//
// Phase-14.5 C4: dropped @ts-nocheck. Components were the priority
// (Nav + dropdowns drive every page); the SVG helpers further down
// (Sparkline, CognitiveRadar, KnowledgeGraph, ArchStack) got
// function-signature typing but not deep type-safety on every SVG
// path expression — that's pure-render math, not RBAC-critical.
// =====================================================
import React from "react";
import { Icon } from "./icons";
import { useRole, ROLES, type RoleId, type Role } from "./role";
import { useAuth, type AuthContextValue } from "./auth/AuthContext";
import { Button, useTheme } from "./ui";
import type { Go } from "./router";
import { OrgAttribution } from "./components/OrgAttribution";

// (Window.toast / Window.confirmAction / Window.openCommandPalette
// types live in ui.tsx — the file that actually assigns them. Both
// declarations would merge if duplicated; keeping a single source.)

interface NavItem {
  id: string;
  label: string;
  /** Marks routes that hit the real API; renders the pulse dot. */
  live?: boolean;
}

// Nav highlights the LIVE routes that actually talk to the API (Phase 4-9).
// Mocked routes from the original SPA still hash-route alongside but are
// no longer the default landing surface for any role.
const NAV_ITEMS_BY_ROLE: Record<RoleId, NavItem[]> = {
  student: [
    { id: "progress", label: "پیشرفت من", live: true },
    { id: "catalog", label: "کاتالوگ", live: true },
    { id: "my-courses", label: "دوره‌های من", live: true },
    { id: "tutor", label: "دستیار AI", live: true },
    { id: "calendar", label: "تقویم" },
    { id: "community", label: "جامعه" },
  ],
  instructor: [
    { id: "progress", label: "میز کار", live: true },
    { id: "instructor", label: "کنسول استاد" },
    { id: "authoring", label: "استودیو" },
    { id: "classroom", label: "کلاس زنده" },
    { id: "analytics", label: "تحلیل" },
    { id: "tutor", label: "دستیار AI", live: true },
  ],
  admin: [
    { id: "progress", label: "داشبورد", live: true },
    { id: "admin", label: "مدیریت" },
    { id: "analytics", label: "تحلیل" },
    { id: "schools", label: "دانشکده‌ها" },
    { id: "events", label: "رویدادها" },
    { id: "tutor", label: "دستیار AI", live: true },
  ],
  // Parent role: lands on the parent dashboard first. The public "home"
  // route was the first item which felt jarring for a logged-in parent;
  // now we lead with the parent dashboard and drop "home" — parents
  // reach the public site via the logo in the brand area if needed.
  parent: [
    { id: "parent", label: "میز کار" },
    { id: "calendar", label: "تقویم فرزند" },
    { id: "credential", label: "گواهی‌ها" },
    { id: "messages", label: "پیام‌ها" },
    { id: "help", label: "پشتیبانی" },
  ],
  org: [
    { id: "admin", label: "میز سازمان" },
    { id: "analytics", label: "تحلیل تیم" },
    { id: "faculty", label: "مربیان" },
    { id: "events", label: "رویدادها" },
    { id: "pricing", label: "پلن‌ها" },
    { id: "help", label: "پشتیبانی" },
  ],
  // Phase-15 R7: nav for the 5 roles added in R1's seed.
  ta: [
    { id: "classroom", label: "کلاس", live: true },
    { id: "my-courses", label: "دوره‌های من", live: true },
    { id: "progress", label: "پیشرفت", live: true },
    { id: "tutor", label: "دستیار AI", live: true },
  ],
  content_manager: [
    { id: "catalog", label: "کاتالوگ", live: true },
    { id: "authoring", label: "استودیو" },
    { id: "analytics", label: "تحلیل" },
    { id: "help", label: "پشتیبانی" },
  ],
  support: [
    { id: "admin", label: "میز پشتیبانی" },
    { id: "audit", label: "گزارش حسابرسی", live: true },
    { id: "messages", label: "پیام‌ها" },
    { id: "help", label: "پشتیبانی" },
  ],
  moderator: [
    { id: "community", label: "جامعه" },
    { id: "messages", label: "پیام‌ها" },
    { id: "help", label: "پشتیبانی" },
  ],
  super_admin: [
    { id: "progress", label: "داشبورد", live: true },
    { id: "admin", label: "مدیریت" },
    { id: "audit", label: "گزارش حسابرسی", live: true },
    { id: "analytics", label: "تحلیل" },
    { id: "tutor", label: "دستیار AI", live: true },
  ],
};

export type NavMode = "public" | "workspace" | "auth_flow";

export interface NavProps {
  current: string;
  go: Go;
  /**
   * Phase-A R1.1: route-kind-aware mode set by AppShell.
   *   public    — top-nav links + own hamburger drawer for those links
   *               (existing behavior; default)
   *   workspace — top-nav links hidden; the single hamburger calls
   *               `onWorkspaceMenuClick` which AppShell wires to its
   *               sidebar Sheet drawer
   *   auth_flow — minimal chrome: brand + theme toggle only; no nav
   *               links, no hamburger, no notifications/user popovers
   */
  mode?: NavMode;
  /** Workspace-only: AppShell-provided callback to open the sidebar drawer. */
  onWorkspaceMenuClick?: () => void;
  /**
   * Workspace-only: whether the sidebar Sheet drawer is currently open.
   * Wired to `aria-expanded` on the hamburger trigger (R7.5). Replaces
   * the earlier `aria-controls="appshell-sidebar-drawer"` which axe-core
   * flagged as `aria-valid-attr-value` on every workspace route (the
   * referenced id wasn't in the DOM because Radix Sheet lazy-mounts).
   */
  workspaceMenuOpen?: boolean;
}

export const Nav = ({
  current,
  go,
  mode = "public",
  onWorkspaceMenuClick,
  workspaceMenuOpen = false,
}: NavProps): React.ReactElement => {
  const { role, setRole } = useRole();
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [notifsOpen, setNotifsOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); setNotifsOpen(false); setUserOpen(false); }, [current]);
  const isWorkspace = mode === "workspace";
  const isAuthFlow = mode === "auth_flow";

  // Logo destination is mode + auth aware. WORKSPACE always → dashboard;
  // PUBLIC: dashboard if logged in (back-to-workspace shortcut), else home;
  // AUTH_FLOW: home (escape back to the marketing site).
  const brandTarget: string = isWorkspace
    ? "dashboard"
    : isAuthFlow
      ? "home"
      : auth.isAuthenticated
        ? "dashboard"
        : "home";

  // close popovers on outside click
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest(".notif-wrap")) setNotifsOpen(false);
      if (!target?.closest(".user-wrap")) setUserOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Esc closes the mobile drawer + any popover.
  React.useEffect(() => {
    if (!open && !notifsOpen && !userOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setNotifsOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, notifsOpen, userOpen]);

  // Body-scroll lock while the mobile drawer is open. Without this the
  // page below can be scrolled with two-finger gestures while the drawer
  // is visible, which feels broken on iOS Safari.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("nav-drawer-open", open);
    return () => document.body.classList.remove("nav-drawer-open");
  }, [open]);

  const items = NAV_ITEMS_BY_ROLE[role.id] || NAV_ITEMS_BY_ROLE.student;

  return (
    <nav className="nav" data-mode={mode}>
      <div className="nav-inner">
        {/* Phase-A R6.6 — RTL navbar correctness:
            WORKSPACE renders the hamburger as the FIRST child of
            nav-inner so under RTL it sits at the START edge (right in
            Persian), matching the standard Persian sidebar pattern
            (menu opener on the right, logo next to it, user/theme/
            notification chips on the left). The PUBLIC mode keeps the
            hamburger inside `.nav-actions` at the end (left in RTL)
            because that's the established mobile pattern there — the
            user is opening a drawer of nav-links that fly out from the
            same edge as the brand. AUTH_FLOW has no hamburger. */}
        {isWorkspace ? (
          <button
            id="appshell-sidebar-trigger"
            type="button"
            className="nav-toggle nav-toggle-start"
            onClick={() => onWorkspaceMenuClick?.()}
            aria-label="منو"
            // R7.5 — disclosure-widget ARIA pattern:
            // aria-controls dropped because Radix Sheet lazy-mounts the
            // drawer, so the IDREF can't always resolve (axe-core
            // aria-valid-attr-value rule fired on all 53 workspace
            // routes). aria-expanded + aria-haspopup="dialog" is the
            // canonical pattern recommended by ARIA Authoring Practices
            // for buttons that open a dialog/menu — and it's the pattern
            // Radix wires automatically when you use <SheetTrigger>,
            // which we can't here because the trigger lives in Nav
            // (rendered by AppShell at a different tree depth than the
            // Sheet itself).
            aria-expanded={workspaceMenuOpen}
            aria-haspopup="dialog"
          >
            <span className="bars"></span>
          </button>
        ) : null}

        <a href={"/" + brandTarget} onClick={(e) => { e.preventDefault(); go(brandTarget); }} className="brand">
          <span className="brand-mark"></span>
          <span>
            دیجی‌یونیورسیتی
            <div className="brand-sub">AI · NATIVE · LEARNING</div>
          </span>
        </a>

        {/* Top-nav links: PUBLIC only. WORKSPACE relies on the sidebar
            for in-app navigation, AUTH_FLOW shows a minimal shell. */}
        {mode === "public" && (
          <div className={"nav-links " + (open ? "open" : "")}>
            {items.map((n) => (
              <a
                key={n.id}
                href={"#" + n.id}
                onClick={(e) => { e.preventDefault(); go(n.id); setOpen(false); }}
                className={"nav-link " + (current === n.id ? "active" : "")}
                aria-current={current === n.id ? "page" : undefined}
              >
                {n.label}
                {n.live && (
                  <span
                    className="nav-live-dot"
                    aria-label="داده زنده"
                    title="متصل به API"
                  />
                )}
              </a>
            ))}
          </div>
        )}

        <div className="nav-actions">
          {/* Command palette trigger.
              Phase-16 Gate-2 smoke: hidden at <sm because the 5-icon
              cluster + brand exceeds 320 px after R7' enforced 44 px
              touch targets. Keyboard users still get it via Ctrl/Cmd+K;
              touch users find it inside the hamburger drawer. */}
          <button
            className="nav-icon-btn hide-on-xs"
            onClick={() => window.openCommandPalette?.()}
            aria-label="پالت دستورات (Cmd+K)"
            title="جستجوی سریع (Ctrl+K)"
          >
            <Icon name="search" size={18} />
          </button>

          {/* Theme toggle — Phase-16 R4': dedicated sun/moon icons.
              Replaces the older sparkle/globe placeholder. The icon
              shows the destination state (sun when dark, moon when
              light) so users know what the click does. */}
          <button
            className="nav-icon-btn theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "تغییر به تم روشن" : "تغییر به تم تیره"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "روشن" : "تیره"}
            data-testid="theme-toggle"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>

          {/* Notifications.
              Phase-16 Gate-2 smoke: also `.hide-on-xs` for the same
              320-px width constraint. Notifications surface inside
              the hamburger drawer + via the bottom-nav badge. */}
          <div className="notif-wrap relative hide-on-xs" >
            <button className="nav-icon-btn" onClick={() => setNotifsOpen(!notifsOpen)} aria-label="اعلان‌ها">
              <Icon name="bell" size={18} />
              <span className="notif-dot"></span>
            </button>
            {notifsOpen && <NotificationsDropdown go={go} />}
          </div>

          {/* User menu.
              Phase-A R1.4 B5 — avatar fallback. Before this commit the
              avatar div unconditionally rendered `role.avatar` (e.g.
              "نر" for the student role), which leaked the mock
              identity to anonymous visitors on every PUBLIC + AUTH_FLOW
              route. Phase-14.8 already fixed the user-name fallback;
              we apply the same discipline to the avatar:
                - authed user: derive initials from fullName, else email[0]
                - anonymous: render a generic user-icon, no role colour. */}
          <div className="user-wrap relative" >
            {/* R7.3 A.1 — aria-label is context-aware (Q1 Option A): for
                anonymous it opens a dropdown that contains login/register
                links; for authed it opens the user menu. The visible
                `.user-name` span is display:none under 720px (mobile
                Lighthouse emulation), so without aria-label the accessible
                name is just the avatar initials (or nothing for anonymous),
                which axe + Lighthouse flag as button-name failure.

                NOTE: the anonymous label is intentionally NOT "ورود به حساب"
                (the form-submit string) — that collision broke the shared
                Playwright login helper which uses
                getByRole("button", { name: /ورود به حساب/ }).first().
                "منوی حساب" preserves the semantic without colliding. */}
            <button
              className="user-btn"
              onClick={() => setUserOpen(!userOpen)}
              aria-label={auth.user ? "منوی کاربر" : "منوی حساب"}
            >
              <div
                className={"avatar " + (auth.user ? role.color : "")}
                style={{ width: 32, height: 32, fontSize: 11 }}
                data-anon={auth.user ? undefined : "true"}
              >
                {auth.user ? (
                  auth.user.fullName?.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("")
                    || auth.user.email?.[0]?.toUpperCase()
                    || <Icon name="user" size={14} />
                ) : (
                  <Icon name="user" size={14} />
                )}
              </div>
              <span className="user-name">{
                (auth.user?.fullName?.split(" ")[0])
                  || auth.user?.email?.split("@")[0]
                  || role.label
              }</span>
            </button>
            {userOpen && <UserDropdown go={go} role={role} setRole={setRole} auth={auth} />}
          </div>

          {/* Hamburger button — PUBLIC mode only.
              WORKSPACE renders its own hamburger at the start of
              nav-inner (per R6.6). AUTH_FLOW has no hamburger. */}
          {!isAuthFlow && !isWorkspace && (
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setOpen(!open)}
              aria-label="منو"
              aria-expanded={open ? "true" : "false"}
            >
              <span className="bars"></span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

interface NotificationsDropdownProps {
  go: Go;
}
const NotificationsDropdown = ({ go }: NotificationsDropdownProps): React.ReactElement => (
  <div className="dropdown" style={{ width: 380 }}>
    <div className="dropdown-head">
      <h4>اعلان‌ها</h4>
      <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)" }}>۳ جدید</span>
    </div>
    <div className="overflow-y-auto"  style={{maxHeight: 420}}>
      {[
        { ic: "live", k: "جلسه کلاس", t: "یادگیری ماشین · جلسه ۸ تا ۱۵ دقیقه دیگر شروع می‌شود", time: "همین الان", unread: true, action: () => go("classroom") },
        { ic: "sparkle", k: "AI Tutor", t: "خلاصه‌ی پساکلاس جلسه ۷ آماده شد. ۳ کوییز پیشنهاد شده.", time: "۸ دقیقه پیش", unread: true, action: () => go("recordings") },
        { ic: "check", k: "نمره منتشر شد", t: "تمرین ۴ — بهینه‌سازی: ۸۷ از ۱۰۰", time: "۲ ساعت پیش", unread: true, action: () => go("course") },
        { ic: "chat", k: "پاسخ به سوال", t: "دکتر عظیمی به سوال شما درباره‌ی مومنتوم پاسخ داد", time: "دیروز", unread: false, action: () => go("community") },
        { ic: "cert", k: "گواهی صادر شد", t: "گواهی آمار بیزی برای شما صادر شد", time: "۲ روز پیش", unread: false, action: () => go("credential") },
      ].map((n, i) => (
        <div key={i} onClick={n.action} className="notif-item">
          <div className="notif-icon"><Icon name={n.ic} size={14} /></div>
          <div className="flex-1"  style={{ minWidth: 0}}>
            <div className="flex items-center gap-2 mb-1" >
              <span className="uppercase"  style={{fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--fg-mute)"}}>{n.k}</span>
              {n.unread && <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }}></span>}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.t}</div>
            <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)"}}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="dropdown-foot">
      <Button variant="ghost" size="sm">علامت‌گذاری همه به‌عنوان خوانده‌شده</Button>
      <Button variant="outline" size="sm" onClick={() => go("inbox")}>صندوق کامل</Button>
    </div>
  </div>
);

interface UserDropdownProps {
  go: Go;
  role: Role;
  setRole: (id: RoleId) => void;
  auth: AuthContextValue;
}

const UserDropdown = ({ go, role, setRole, auth }: UserDropdownProps): React.ReactElement => {
  const [loggingOut, setLoggingOut] = React.useState(false);
  const handleLogout = async (e?: React.MouseEvent): Promise<void> => {
    e?.preventDefault?.();
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (auth?.logout) {
        await auth.logout();
      }
    } finally {
      // Clear local role so the next visitor sees the default. Also
      // reset the in-memory role so the navbar avatar updates in the
      // same frame as the logout (F-38). Otherwise the previous
      // user's initials persist until a route change.
      try {
        localStorage.removeItem("digiu_role");
      } catch {
        // ignore
      }
      if (typeof setRole === "function") {
        setRole("student");
      }
      setLoggingOut(false);
      go("login");
    }
  };

  // Phase-14 R3: hash routing is gone; the `?demo=1` query flag is
  // the only legitimate path now. We keep the hash check for any
  // user with a saved `#demo=1` bookmark from before the migration —
  // works for one release cycle, then can be removed.
  const isDemoMode = typeof window !== "undefined" && (
    window.location.search.includes("demo=1") ||
    window.location.hash.includes("demo=1")
  );
  // Phase-14.8: real authed user only, never the mock identity.
  // - If authenticated: full name → email local-part.
  // - If NOT authenticated: role label ("دانشجو" / "استاد" / …) —
  //   never role.name (which is the mock "نسرین رضوی" for student).
  // - Same for identifier: email if authed, else "مهمان" (guest).
  const isAuthed = !!auth?.user;
  const displayName = isAuthed
    ? (auth.user?.fullName || auth.user?.email?.split("@")[0] || role.label)
    : role.label;
  const identifier = isAuthed ? (auth.user?.email ?? role.label) : "مهمان · بدون ورود";
  return (
  <div className="dropdown" style={{ width: 300 }}>
    <div className="p-4.5"  style={{ borderBottom: "1px solid var(--line)"}}>
      <div className="flex items-center gap-3" >
        {/* Phase-A R1.4 B5 — same fix as the trigger above: never leak
            `role.avatar` mock initials to anonymous visitors. */}
        <div
          className={"avatar " + (isAuthed ? role.color : "")}
          style={{ width: 44, height: 44 }}
          data-anon={isAuthed ? undefined : "true"}
        >
          {isAuthed ? (
            auth.user?.fullName?.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("")
              || auth.user?.email?.[0]?.toUpperCase()
              || <Icon name="user" size={18} />
          ) : (
            <Icon name="user" size={18} />
          )}
        </div>
        <div className="flex-1"  style={{ minWidth: 0}}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{displayName}</div>
          <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{identifier}</div>
        </div>
      </div>
      <div className="flex gap-1.5 mt-3" >
        <span className="pill pill-cyan" style={{ fontSize: 10 }}>{role.label}</span>
        <span className="pill" style={{ fontSize: 10 }}>{role.subtitle}</span>
      </div>
    </div>

    {/* Role switcher — only in demo mode (?demo=1) */}
    {isDemoMode && (
      <div className="p-3.5"  style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-2)"}}>
        <div className="mono mb-2.5"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em"}}>
          DEMO · مشاهده به عنوان
        </div>
        <div className="grid gap-1"  style={{ gridTemplateColumns: "repeat(5, 1fr)"}}>
          {Object.values(ROLES).map((r) => (
            <button className="rounded-md cursor-pointer flex flex-col items-center gap-1" key={r.id} onClick={() => { setRole(r.id); go(r.homeRoute); }}
              title={r.label}
               style={{padding: "8px 4px",
                background: role.id === r.id ? "var(--accent-soft)" : "var(--surface)",
                border: "1px solid " + (role.id === r.id ? "var(--accent)" : "var(--line)"),
                fontSize: 10,
                fontFamily: "inherit",
                color: role.id === r.id ? "var(--accent)" : "var(--fg-mute)"}}>
              <div className={"avatar " + (role.id === r.id ? r.color : "")} style={{ width: 22, height: 22, fontSize: 9, opacity: role.id === r.id ? 1 : 0.6 }}>{r.avatar}</div>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="p-1.5" >
      {[
        ["میز کار", "home", role.homeRoute],
        ["پروفایل عمومی", "user", "profile"],
        ["پیام‌ها", "chat", "messages"],
        ["ذخیره‌ها", "star", "bookmarks"],
        ["دستاوردها", "trophy", "achievements"],
        ["گواهی‌ها", "cert", "credential"],
        ["تنظیمات", "settings", "settings"],
        ["پشتیبانی", "headset", "help"],
      ].map(([t, ic, r]) => (
        <button key={t} onClick={() => go(r)} className="dropdown-item">
          <Icon name={ic} size={14} />
          {t}
        </button>
      ))}
    </div>
    <div className="p-1.5"  style={{ borderTop: "1px solid var(--line)"}}>
      <button onClick={handleLogout} disabled={loggingOut} className="dropdown-item" style={{ color: "var(--accent)" }}>
        <Icon name="end" size={14} />
        {loggingOut ? "در حال خروج..." : "خروج از حساب"}
      </button>
    </div>
  </div>
  );
};

export interface FooterProps {
  go: Go;
}

// Per-role workspace link in the footer's "برای کاربران" column.
// Phase-14.7 (F-123): the footer used to list every role's workspace
// link (student desk + instructor console + parent portal + admin
// desk) to every visitor, even unauthenticated ones. A student saw
// links to /instructor /admin /parent and clicking them landed on
// the wrong-role page with no permission check. After Phase-14.7
// router.tsx auth-gates workspace routes, but those links still
// shouldn't be visible to the wrong roles — clicking them just
// bounces to /login, which is confusing UX. Now we show ONLY the
// link for the logged-in user's role, and only when authenticated.
const ROLE_WORKSPACE_LINK: Record<RoleId, { route: string; label: string }> = {
  student: { route: "dashboard", label: "میز کار دانشجو" },
  instructor: { route: "instructor", label: "کنسول استاد" },
  admin: { route: "admin", label: "میز مدیریت" },
  parent: { route: "parent", label: "پورتال والد" },
  org: { route: "admin", label: "میز سازمان" },
  // Phase-15 R7: the 5 roles added in R1 each get their primary
  // workspace destination. Footer surfaces only the logged-in user's
  // entry, so a TA never sees the admin link and vice-versa.
  ta: { route: "classroom", label: "کلاس دستیار" },
  content_manager: { route: "authoring", label: "استودیو محتوا" },
  support: { route: "audit", label: "گزارش حسابرسی" },
  moderator: { route: "community", label: "میز نظارت" },
  super_admin: { route: "admin", label: "میز ابرمدیر" },
};

export const Footer = ({ go }: FooterProps): React.ReactElement => {
  const auth = useAuth();
  const { role } = useRole();
  const isAuthed = auth.isAuthenticated;
  const myWorkspace = ROLE_WORKSPACE_LINK[role.id];
  return (
  <footer className="footer">
    <div className="shell">
      <div className="footer-grid">
        <div>
          <div className="brand mb-4.5" >
            <span className="brand-mark"></span>
            <span>دیجی‌یونیورسیتی
              <div className="brand-sub">AI · NATIVE · LEARNING</div>
            </span>
          </div>
          {/* R7.3 A.2.i — drop the inline `color: var(--fg-mute)`.
              The footer-on-dark rule `.footer p { color: rgba(255,255,255,0.7) }`
              gives ~9.66:1 against the navy footer bg (AAA). The
              inline `--fg-mute` (#4a5a76) was 2.77:1 — Lighthouse fail. */}
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 360 }}>
            یک زیرساخت آموزشی کاملاً دیجیتال که در آن هوش مصنوعی نه یک افزونه، بلکه شالوده‌ی یادگیری، طراحی برنامه و سنجش است.
          </p>
          <div className="standards mt-5" >
            <span className="std">LTI 1.3</span>
            <span className="std">xAPI</span>
            <span className="std">QTI</span>
            <span className="std">Caliper</span>
            <span className="std">WCAG 2.2</span>
          </div>
        </div>
        <div>
          {/* R7.3 A.3.ii — footer column headers were `<h5>` directly
              after the page's last `<h2>` (heading-order skip). Renamed
              to `<h3>`; CSS rule `.footer h5` was renamed to `.footer h3`
              in styles.css to preserve the visual treatment. */}
          <h3>محصول</h3>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("classroom")}}>کلاس آنلاین</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("labs")}}>آزمایشگاه‌های مجازی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("recordings")}}>آرشیو ضبط‌ها</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("search")}}>جستجوی معنایی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("assessment")}}>آزمون تطبیقی</a></li>
          </ul>
        </div>
        <div>
          <h3>دانشگاه</h3>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("schools")}}>دانشکده‌ها</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("faculty")}}>هیات علمی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("research")}}>پژوهش و دکتری</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("library")}}>کتابخانه دیجیتال</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("events")}}>رویدادها</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("admissions")}}>پذیرش</a></li>
          </ul>
        </div>
        <div>
          <h3>برای کاربران</h3>
          <ul>
            {isAuthed ? (
              <>
                {/* Phase-14.7: only the logged-in user's own workspace
                    link. Other roles' portals would auth-redirect to
                    /login anyway, so showing them here was misleading. */}
                <li><a href={"/" + myWorkspace.route} onClick={(e)=>{e.preventDefault();go(myWorkspace.route)}}>{myWorkspace.label}</a></li>
                <li><a href="/community" onClick={(e)=>{e.preventDefault();go("community")}}>جامعه</a></li>
                <li><a href="/credential" onClick={(e)=>{e.preventDefault();go("credential")}}>گواهی دیجیتال</a></li>
                <li><a href="/settings" onClick={(e)=>{e.preventDefault();go("settings")}}>تنظیمات</a></li>
              </>
            ) : (
              <>
                {/* Unauthenticated visitors see public CTAs, not
                    role-specific portal links. */}
                <li><a href="/login" onClick={(e)=>{e.preventDefault();go("login")}}>ورود به حساب</a></li>
                <li><a href="/register" onClick={(e)=>{e.preventDefault();go("register")}}>ساخت حساب</a></li>
                <li><a href="/admissions" onClick={(e)=>{e.preventDefault();go("admissions")}}>پذیرش</a></li>
                <li><a href="/honor-code" onClick={(e)=>{e.preventDefault();go("honor-code")}}>صداقت علمی</a></li>
              </>
            )}
          </ul>
        </div>
        <div>
          <h3>منابع</h3>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("pricing")}}>پلن‌ها و قیمت</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("help")}}>مرکز پشتیبانی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("about")}}>درباره ما</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("officehours")}}>Office Hours</a></li>
            <li><a href="#">وضعیت سرویس</a></li>
            <li><a href="#">API و توسعه‌دهندگان</a></li>
          </ul>
        </div>
      </div>
      {/* Phase-A R1.3: organizational attribution. DigiUniversity is
          the product; ownership and copyright sit with مرکز راهبری
          پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی. */}
      <OrgAttribution variant="full" className="footer-org-attribution" />
      <div className="footer-bot">
        <span>دیجی‌یونیورسیتی · پلتفرم دانشگاه آنلاین هوشمند</span>
        <span>v1.0.0 · build 2026.05 · region: TEH-01</span>
      </div>
    </div>
  </footer>
  );
};

// =====================================================
// Persian numerals helper
// =====================================================
export const toFa = (n: number | string): string =>
  String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

// =====================================================
// Sparkline mini-chart (SVG)
// =====================================================
export interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
}
export const Sparkline = ({
  values,
  color = "var(--cyan)",
  height = 50,
  width = 220,
}: SparklineProps): React.ReactElement => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.07;
    return [x, y];
  });
  const d = "M " + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");
  const dArea = d + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill={`url(#sg-${color.replace(/[^a-z]/gi, "")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// =====================================================
// Cognitive radar (SVG) — for student profile
// =====================================================
export interface CognitiveRadarProps {
  values: number[];
  labels: string[];
  size?: number;
}
export const CognitiveRadar = ({ values, labels, size = 280 }: CognitiveRadarProps): React.ReactElement => {
  const cx = size / 2, cy = size / 2;
  const radius = size * 0.4;
  const n = values.length;
  const angle = (i: number): number => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number): [number, number] => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  const rings = [0.25, 0.5, 0.75, 1].map((f) => {
    const pts = Array.from({ length: n }, (_, i) => point(i, radius * f).join(",")).join(" ");
    return <polygon key={f} points={pts} fill="none" stroke="var(--line-2)" strokeWidth="1" />;
  });
  const spokes = Array.from({ length: n }, (_, i) => {
    const [x, y] = point(i, radius);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line-2)" strokeWidth="1" />;
  });
  const valuePts = values.map((v, i) => point(i, radius * (v / 100)).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings}
      {spokes}
      <polygon points={valuePts} fill="oklch(0.82 0.16 195 / 0.18)" stroke="var(--cyan)" strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = point(i, radius * (v / 100));
        return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--cyan)" />;
      })}
      {labels.map((l, i) => {
        const [x, y] = point(i, radius + 26);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill="var(--fg-mute)" fontSize="11" fontFamily="Vazirmatn, sans-serif" fontWeight="500">
            {l}
          </text>
        );
      })}
    </svg>
  );
};

// =====================================================
// Knowledge Graph visualization (SVG)
// =====================================================
export const KnowledgeGraph = (): React.ReactElement => {
  const nodes = [
    { id: "ml", x: 50, y: 40, r: 36, kind: "core", label: "یادگیری ماشین" },
    { id: "sup", x: 22, y: 22, r: 24, kind: "topic", label: "نظارت‌شده" },
    { id: "uns", x: 78, y: 22, r: 24, kind: "topic", label: "بدون‌نظارت" },
    { id: "rl",  x: 50, y: 76, r: 24, kind: "topic", label: "تقویتی" },
    { id: "lr",  x: 12, y: 50, r: 18, kind: "sub", label: "رگرسیون" },
    { id: "svm", x: 28, y: 70, r: 18, kind: "sub", label: "SVM" },
    { id: "nn",  x: 88, y: 50, r: 18, kind: "sub", label: "شبکه عصبی" },
    { id: "cl",  x: 70, y: 8,  r: 18, kind: "sub", label: "خوشه‌بندی" },
    { id: "q",   x: 70, y: 92, r: 18, kind: "sub", label: "Q-learning" },
  ];
  const edges = [
    ["ml", "sup"], ["ml", "uns"], ["ml", "rl"],
    ["sup", "lr"], ["sup", "svm"], ["sup", "nn"],
    ["uns", "cl"], ["uns", "nn"], ["rl", "q"],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const colorFor = (kind: string): string =>
    kind === "core" ? "var(--cyan)" : kind === "topic" ? "var(--amber)" : "var(--violet)";

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="node-glow">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map(([a, b], i) => {
        const A = byId[a], B = byId[b];
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
          stroke={"color-mix(in oklch, " + colorFor(A.kind) + " 50%, transparent)"}
          strokeWidth="0.3" />;
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          {n.kind === "core" && <circle cx={n.x} cy={n.y} r={n.r / 4} fill="url(#node-glow)" opacity="0.6" />}
          <circle cx={n.x} cy={n.y} r={n.r / 8} fill={colorFor(n.kind)} stroke={colorFor(n.kind)} strokeOpacity="0.4" strokeWidth={n.r / 8} fillOpacity="0.5" />
          <text x={n.x} y={n.y + n.r / 4 + 2} textAnchor="middle" fill="var(--fg)" fontSize="2.2" fontFamily="Vazirmatn">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

// =====================================================
// 3D-ish architecture diagram (isometric stack)
// =====================================================
export const ArchStack = (): React.ReactElement => {
  const layers = [
    { name: "Experience Layer", sub: "وب · موبایل · کلاس آنلاین · داشبورد", color: "var(--cyan)" },
    { name: "Agent Orchestration", sub: "AI Tutor · Coach · Critic · Mentor · Grader", color: "var(--violet)" },
    { name: "Domain Services", sub: "Course · Enrollment · Gradebook · Credential", color: "var(--amber)" },
    { name: "Data & Learning Record Store", sub: "PostgreSQL · ClickHouse · Vector · Object", color: "var(--fg-mute)" },
    { name: "Cloud-Native Platform", sub: "Kubernetes · Kafka · CDN · Observability", color: "var(--fg-dim)" },
  ];
  return (
    <div
      // Phase-16 R11 — the 3D rotation (rotateX(48deg) rotateZ(-28deg))
      // projects the 320-px boxes to a visual width ~360 px, which on
      // 320-px viewports leaked past the page-shell. Clip horizontally
      // at the ArchStack parent so the diagram still renders inside
      // the slot.
      style={{
        perspective: 1400,
        transformStyle: "preserve-3d",
        padding: "20px 0",
        overflowX: "clip",
        maxWidth: "100%",
      }}
    >
      <div
        className="flex flex-col gap-4.5 items-center"
        style={{
          transform: "rotateX(48deg) rotateZ(-28deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {layers.map((L, i) => (
          <div
            className="rounded-xl relative flex flex-col justify-center"
            key={i}
            style={{
              // Cap at 320px on desktop, fluid below — the 3D tilt
              // never visually exceeds the slot now.
              width: "min(320px, calc(100% - 16px))",
              height: 70,
              background: "linear-gradient(180deg, var(--surface-2), var(--surface))",
              border: "1px solid var(--line-2)",
              padding: "0 18px",
              transform: `translateZ(${(layers.length - i) * 20}px)`,
              boxShadow: "0 20px 40px -20px rgba(0,0,0,0.7)",
            }}
          >
            <div
              className="absolute"
              style={{
                top: 8,
                left: 12,
                width: 5,
                height: 5,
                borderRadius: 50,
                background: L.color,
                boxShadow: `0 0 12px ${L.color}`,
              }}
            />
            <div style={{ fontSize: 14, fontWeight: 600 }}>{L.name}</div>
            <div className="mt-1" style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)" }}>{L.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// (exports above)
