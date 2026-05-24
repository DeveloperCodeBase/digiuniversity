// Phase-16 R8 — Mobile bottom navigation.
//
// Audit B-06 finding: sidenav collapsed to a horizontal chip-row on
// <md which lost hierarchy and discoverability. Replace with a fixed
// 5-slot bottom bar that follows iOS/Android conventions:
//
//   - h-16 fixed bottom-0 inset-x-0 (full width)
//   - safe-area-inset-bottom respected (env())
//   - role-aware slot table (see SLOT_TABLE)
//   - hidden at >=md via md:hidden
//   - hidden on /classroom (full-screen video workflow) and all auth
//     routes (login/register/forgot have their own shell)
//   - 48×48 minimum touch target per slot (WCAG 2.5.5)
//   - active slot gets a 2-px top border in --accent
//
// Mount once in router.tsx Layout, after Footer. The component
// returns null on routes where it shouldn't show so the parent
// doesn't need a conditional.
import * as React from "react";
import { useRole, type RoleId } from "../role";
import { useCurrentRoute, useGo, type Go } from "../router";
import { cn } from "./utils";

interface NavSlot {
  /** Route ID that `go(...)` accepts. */
  to: string;
  /** Persian label. */
  label: string;
  /** Slot icon name from our existing Icon set, or inline SVG fallback. */
  iconPath: string;
}

const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V11z",
  book: "M4 4h6a2 2 0 0 1 2 2v14a3 3 0 0 0-3-3H4V4zM20 4h-6a2 2 0 0 0-2 2v14a3 3 0 0 1 3-3h5V4z",
  live: "M12 1a4 4 0 0 1 4 4v3a4 4 0 1 1-8 0V5a4 4 0 0 1 4-4zM5 8a7 7 0 0 0 14 0M12 15v6M9 21h6",
  chat: "M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 4v-4H6a3 3 0 0 1-3-3V6z",
  graph: "M3 3v18h18M7 14l4-4 4 4 5-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0H4z",
  shield: "M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z",
  audit: "M9 2h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM9 12h6M9 16h6M9 8h4",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  more: "M5 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  community: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  schools: "M3 21V9l9-6 9 6v12M9 21V12h6v9",
  laptop: "M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM2 21h20",
};

// Per-role slot table. Keep ≤5 slots per role for thumb-reach UX.
//
// The mapping deliberately favours the user's *primary* workflows:
//   - Student: learn + practice + AI tutor
//   - Instructor: teaching + grading + content + analytics
//   - Admin / super_admin: ops + audit + analytics
//   - TA: lighter teach workflow
//   - Content manager: catalog + authoring + analytics
//   - Support / moderator: messages + audit + help
//   - Parent: child progress + inbox
//   - Org: cohort + analytics + catalog
const SLOT_TABLE: Record<RoleId, NavSlot[]> = {
  student: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "my-courses", label: "درس‌ها", iconPath: ICONS.book },
    { to: "classroom", label: "کلاس زنده", iconPath: ICONS.live },
    { to: "tutor", label: "تدریس‌یار", iconPath: ICONS.chat },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  instructor: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "instructor", label: "کلاس‌ها", iconPath: ICONS.live },
    { to: "authoring", label: "نگارش", iconPath: ICONS.book },
    { to: "analytics", label: "تحلیل", iconPath: ICONS.graph },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  admin: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "admin", label: "مدیریت", iconPath: ICONS.shield },
    { to: "audit", label: "نظارت", iconPath: ICONS.audit },
    { to: "analytics", label: "تحلیل", iconPath: ICONS.graph },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  super_admin: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "admin", label: "مدیریت", iconPath: ICONS.shield },
    { to: "audit", label: "نظارت", iconPath: ICONS.audit },
    { to: "analytics", label: "تحلیل", iconPath: ICONS.graph },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  ta: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "classroom", label: "کلاس", iconPath: ICONS.live },
    { to: "my-courses", label: "درس‌ها", iconPath: ICONS.book },
    { to: "tutor", label: "تدریس‌یار", iconPath: ICONS.chat },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  content_manager: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "catalog", label: "کاتالوگ", iconPath: ICONS.book },
    { to: "authoring", label: "نگارش", iconPath: ICONS.laptop },
    { to: "analytics", label: "تحلیل", iconPath: ICONS.graph },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  support: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "admin", label: "پشتیبانی", iconPath: ICONS.shield },
    { to: "audit", label: "نظارت", iconPath: ICONS.audit },
    { to: "help", label: "راهنما", iconPath: ICONS.inbox },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  moderator: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "community", label: "اجتماع", iconPath: ICONS.community },
    { to: "audit", label: "نظارت", iconPath: ICONS.audit },
    { to: "help", label: "راهنما", iconPath: ICONS.inbox },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  parent: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "parent", label: "فرزند", iconPath: ICONS.user },
    { to: "progress", label: "پیشرفت", iconPath: ICONS.graph },
    { to: "credential", label: "گواهی", iconPath: ICONS.audit },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
  org: [
    { to: "dashboard", label: "خانه", iconPath: ICONS.home },
    { to: "analytics", label: "تحلیل", iconPath: ICONS.graph },
    { to: "catalog", label: "کاتالوگ", iconPath: ICONS.book },
    { to: "schools", label: "دانشکده", iconPath: ICONS.schools },
    { to: "more", label: "بیشتر", iconPath: ICONS.more },
  ],
};

interface BottomNavProps {
  /** Optional override — for stories that want to test a non-current role. */
  forceRole?: RoleId;
  /** Optional override — for stories without a real router. */
  active?: string;
  /** Optional override — for stories. */
  go?: Go;
}

/**
 * Routes that should hide the bottom nav. Both /classroom and the auth
 * shell render their own full-bleed UI; the bottom nav would either
 * overlap controls (classroom toolbar) or be visually wrong (auth
 * card layout). Admin desk routes deliberately keep the nav visible
 * on mobile so phone admins can still navigate.
 */
const HIDE_ON_ROUTES = new Set([
  "classroom",
  "course-live",
  "assessment-live",
  "auth",
  "login",
  "register",
  "forgot",
  "verify-email",
  "2fa-setup",
  "onboarding",
]);

export const BottomNav: React.FC<BottomNavProps> = ({
  forceRole,
  active: activeOverride,
  go: goOverride,
}) => {
  const role = useRole();
  const currentRoute = useCurrentRoute();
  const goHook = useGo();
  const activeRoute = activeOverride ?? currentRoute.id;
  const go = goOverride ?? goHook;
  const roleId: RoleId = forceRole ?? role.role.id;
  const slots = SLOT_TABLE[roleId] ?? SLOT_TABLE.student;

  if (HIDE_ON_ROUTES.has(activeRoute)) return null;

  return (
    <nav
      aria-label="پیمایش پایین"
      className={cn(
        "fixed bottom-0 inset-x-0 z-[1100]",
        "h-16 flex items-stretch justify-between",
        "bg-[color:var(--surface)] border-t border-[color:var(--line-2)]",
        // Add the safe-area inset as extra bottom padding so the bar
        // visually sits above the iOS home indicator and Android
        // gesture pill.
        "pb-[env(safe-area-inset-bottom)]",
        // Hide on >=md (desktop uses the sidenav)
        "md:hidden",
        // Print: never
        "print:hidden",
      )}
    >
      {slots.map((slot) => {
        const isActive = slot.to === activeRoute;
        return (
          <button
            key={slot.to}
            type="button"
            onClick={() => go(slot.to)}
            aria-current={isActive ? "page" : undefined}
            aria-label={slot.label}
            className={cn(
              // 48×48 min touch target via the flex sizing
              "relative flex-1 min-w-[48px] min-h-[48px]",
              "flex flex-col items-center justify-center gap-0.5",
              "text-[10px] font-medium leading-none",
              "transition-colors duration-150",
              // R7.7a — accent-as-text on white nav bg fails 4.5:1 contrast.
              // The 2px top accent bar (rendered below) carries the
              // "active" visual signal; the label uses --fg for legibility.
              isActive
                ? "text-[color:var(--fg)] font-semibold"
                : "text-[color:var(--fg-mute)] hover:text-[color:var(--fg)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40",
              "focus-visible:ring-inset",
            )}
          >
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute top-0 inset-x-3 h-[2px] rounded-b-full bg-[color:var(--accent)]"
              />
            ) : null}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={slot.iconPath} />
            </svg>
            <span>{slot.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
BottomNav.displayName = "BottomNav";
