// =====================================================
// App router — Phase-14 R3 BrowserRouter migration.
//
// History
// -------
// Until Phase 14, this repo used a hand-rolled hash router
// (`window.location.hash` + a switch statement in App.tsx). Hash
// routing hides every internal path from Google + breaks deep-link
// sharing for prerenderable pages. R3 switches to react-router-dom v6
// BrowserRouter without touching the 49 page components — they still
// accept the existing `go(id, param)` callback prop.
//
// The trick: `useGo()` returns a function with the exact old
// signature; internally it calls `useNavigate()`. Pages call
// `go("catalog")` exactly like before; the function now does
// `navigate("/catalog")` instead of `window.location.hash = "#catalog"`.
//
// Each route renders through `<RouteShell>`, which calls `useGo()`
// once per render and forwards `go` + the route's path param (if any)
// to the page. Param naming preserves the old prop names
// (`courseId`, `assessmentId`, `labId`) so pages don't change.
//
// Phase-14.5 C3: dropped @ts-nocheck. useGo's signature is now the
// authoritative typed contract for the 140 call sites; Phase 15
// per-page TS cleanup will extend the page-component types to consume
// it via `import type { Go } from "../router"`.
// =====================================================

import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { UIRoot } from "./ui";
import { AppShell } from "./layouts/AppShell";

// =====================================================
// Phase-A R7.1.b — route-level code splitting
// =====================================================
//
// Eagerly-imported files (stay in the main bundle):
//   - Home.tsx, Programs.tsx, Admissions.tsx  (PUBLIC entry points
//     that we need to paint fast on cold loads)
//   - Auth.tsx                                 (AUTH_FLOW entry point;
//     login is a frequent cold-load destination — keeping LoginPage
//     in the main chunk avoids a Suspense flicker on the most common
//     authed-user entry sequence)
//   - More.tsx, Roles.tsx, Academic.tsx        (MIXED files containing
//     both PUBLIC + WORKSPACE exports. Splitting them would require
//     a file-level refactor; keeping them eager preserves the public
//     pages' cold-paint speed and accepts the marginal main-bundle
//     cost. Follow-on R can split these if/when needed.)
//
// Lazy-imported files (each becomes its own chunk, downloaded on
// first navigation to a route inside the file):
//   - All purely-workspace single-page files (Dashboard, Classroom,
//     etc.) and the dedicated role-dashboards (SuperAdminDashboard,
//     ContentManagerDashboard, etc.).
//   - University.tsx + Productivity.tsx (no PUBLIC exports inside).
//   - Settings.tsx, Audit.tsx, etc.
//
// Each React.lazy(() => import(...)) creates a Rollup chunk boundary.
// The chunk hash is content-derived, so successive deploys that don't
// change a workspace page leave its chunk cached client-side.

import HomePage from "./pages/Home";
import ProgramsPage from "./pages/Programs";
import AdmissionsPage from "./pages/Admissions";
import {
  LoginPage,
  RegisterPage,
  ForgotPage,
  VerifyEmailPage,
  TwoFactorPage,
  OnboardingPage,
} from "./pages/Auth";
import {
  CalendarPage,
  LibraryPage,
  HelpPage,
  PricingPage,
  FacultyPage,
} from "./pages/More";
import {
  AdminPage,
  ParentPage,
  OfficeHoursPage,
  EventsPage,
  AboutPage,
} from "./pages/Roles";
import {
  TranscriptPage,
  DegreeAuditPage,
  RegistrationPage,
  CareerPage,
  FinancialAidPage,
  WellnessPage,
  AlumniPage,
  HackathonsPage,
  HonorCodePage,
} from "./pages/Academic";

// Lazy — purely-workspace files. Each `() => import(...)` becomes its
// own Rollup chunk. The named-export wrappers (`.then(m => ({ default: ... }))`)
// are needed for multi-export files; single-default-export files can
// use the shorter form.
const AssessmentLivePage = React.lazy(() => import("./pages/AssessmentLive"));
const CatalogPage = React.lazy(() => import("./pages/Catalog"));
const CourseLivePage = React.lazy(() => import("./pages/CourseLive"));
const MyCoursesPage = React.lazy(() => import("./pages/MyCourses"));
const ProgressPage = React.lazy(() => import("./pages/Progress"));
const TutorPage = React.lazy(() => import("./pages/Tutor"));
const ClassroomPage = React.lazy(() => import("./pages/Classroom"));
const DashboardPage = React.lazy(() => import("./pages/Dashboard"));
const CoursePage = React.lazy(() => import("./pages/Course"));
const InstructorPage = React.lazy(() => import("./pages/Instructor"));
const CredentialPage = React.lazy(() => import("./pages/Credential"));
const SearchPage = React.lazy(() => import("./pages/Search"));
const AssessmentPage = React.lazy(() => import("./pages/Assessment"));
const CommunityPage = React.lazy(() => import("./pages/Community"));
const AnalyticsPage = React.lazy(() => import("./pages/Analytics"));
const AuthoringPage = React.lazy(() => import("./pages/Authoring"));
const RecordingsPage = React.lazy(() => import("./pages/Recordings"));
const AuditPage = React.lazy(() => import("./pages/Audit"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const SuperAdminDashboard = React.lazy(() => import("./pages/dashboards/SuperAdminDashboard"));
const ContentManagerDashboard = React.lazy(() => import("./pages/dashboards/ContentManagerDashboard"));
const TADashboard = React.lazy(() => import("./pages/dashboards/TADashboard"));
const SupportDashboard = React.lazy(() => import("./pages/dashboards/SupportDashboard"));
const ModeratorDashboard = React.lazy(() => import("./pages/dashboards/ModeratorDashboard"));
// Phase B R1 Commit I (D62 + D61 Constraint #2) — 4 admin pages lazy-
// loaded so they land in a separate admin-academic chunk (configured
// via manualChunks in vite.config.js, also this commit). Main bundle
// delta target: < 50 KB.
const SchoolsAdminPage = React.lazy(() => import("./pages/admin/SchoolsPage"));
const FacultiesAdminPage = React.lazy(() => import("./pages/admin/FacultiesPage"));
const DepartmentsAdminPage = React.lazy(() => import("./pages/admin/DepartmentsPage"));
const ProgramsAdminPage = React.lazy(() => import("./pages/admin/ProgramsPage"));
// Phase B R2 Commit I (D65) — Offerings + Cohorts admin lazy routes.
// Lazy-loading places both pages in admin-academic.{hash}.js per D61
// Constraint #2; main bundle delta target: 0 KB.
const OfferingsAdminPage = React.lazy(() => import("./pages/admin/OfferingsPage"));
const CohortsAdminPage = React.lazy(() => import("./pages/admin/CohortsPage"));
const OrgDashboard = React.lazy(() => import("./pages/dashboards/OrgDashboard"));
// University.tsx + Productivity.tsx are multi-export, all workspace:
const SchoolsPage = React.lazy(() => import("./pages/University").then((m) => ({ default: m.SchoolsPage })));
const VirtualLabPage = React.lazy(() => import("./pages/University").then((m) => ({ default: m.VirtualLabPage })));
const LabsPage = React.lazy(() => import("./pages/University").then((m) => ({ default: m.LabsPage })));
const ResearchPage = React.lazy(() => import("./pages/University").then((m) => ({ default: m.ResearchPage })));
const NotificationsPage = React.lazy(() => import("./pages/Productivity").then((m) => ({ default: m.NotificationsPage })));
const MessagesPage = React.lazy(() => import("./pages/Productivity").then((m) => ({ default: m.MessagesPage })));
const BookmarksPage = React.lazy(() => import("./pages/Productivity").then((m) => ({ default: m.BookmarksPage })));
const AchievementsPage = React.lazy(() => import("./pages/Productivity").then((m) => ({ default: m.AchievementsPage })));
const SubmissionPage = React.lazy(() => import("./pages/Productivity").then((m) => ({ default: m.SubmissionPage })));
// Phase B R3.a Commit H (D68 + D69) — /profile rerouted to the new
// self-service editor at pages/ProfilePage.tsx. The legacy mockup at
// pages/Productivity.tsx ProfilePage export stays in place (dead-code
// once unreferenced; left there to keep Productivity.tsx untouched in
// this commit). Per D66 Path D: own lazy chunk, NO admin bucket.
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));

// =====================================================
// useGo — back-compat shim
// =====================================================
//
// The old App.tsx exposed `go(id, param)` to every page; ~140 call
// sites use the signature. We preserve it exactly so no page changes
// during R3 — only App.tsx and the new router.tsx wire react-router.
//
// Future sprints can migrate call sites to useNavigate() directly,
// but that's per-page polish, not the critical path here.
//
// `param` is optional and accepts string | number for ergonomics
// (route ids like course/abc-123 come from string ids; tutorial IDs
// might be numeric in some pages). It's String()-coerced before use.

/**
 * Type of the navigation function passed as `go` prop throughout the
 * app. Pages import this as `import type { Go } from "../router"`.
 */
export type Go = (id: string, param?: string | number | null) => void;

export const useGo = (): Go => {
  const navigate = useNavigate();
  return React.useCallback<Go>(
    (id, param) => {
      const safe = String(id || "home").replace(/^[#/]+/, "");
      const path =
        "/" + safe + (param != null && param !== "" ? "/" + encodeURIComponent(String(param)) : "");
      navigate(path);
      // Mirror the old behaviour: scroll to top on every nav so pages
      // start fresh, never inheriting the previous scroll position.
      try {
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch {
        window.scrollTo(0, 0);
      }
    },
    [navigate]
  );
};

// =====================================================
// useCurrentRoute — mimics the old { id, param } shape
// =====================================================
//
// A few components (Nav, the ErrorBoundary `key`) need the active
// route id + param to drive aria-current / focus-reset semantics.
// We compute it from useLocation() so it stays in sync with whatever
// the router thinks the current URL is.
export interface CurrentRoute {
  id: string;
  param: string | null;
}

export const useCurrentRoute = (): CurrentRoute => {
  const location = useLocation();
  const path = location.pathname.replace(/^\/+/, "");
  if (!path) return { id: "home", param: null };
  const [id, ...rest] = path.split("/");
  return {
    id: id || "home",
    param: rest.length ? decodeURIComponent(rest.join("/")) : null,
  };
};

// =====================================================
// RouteShell — injects `go` + path param into a page
// =====================================================
//
// Each route's element is `<RouteShell Component={SomePage} paramKey="courseId" />`.
// The shell calls hooks once, then renders the page with the same
// prop names the page already uses. paramKey is omitted for routes
// without a URL param.
//
// `Component` is typed as `React.ComponentType<any>` rather than a
// precise prop shape because pages haven't been individually typed
// yet (Phase 15+ retires more @ts-nocheck per file). When the page
// types land, swap to a generic-typed RouteShell<P>.
interface RouteShellProps {
  Component: React.ComponentType<any>;
  paramKey?: string;
}

// Phase-A R7.1.b — Suspense fallback for lazy-loaded route components.
// React.lazy components throw a promise on first render; the Suspense
// boundary catches it and renders the fallback until the chunk loads.
// Eagerly-imported components render synchronously and never trigger
// the Suspense — so the eager PUBLIC + AUTH_FLOW routes are unaffected.
//
// The fallback uses Tailwind utilities for centering + a subtle pulse
// animation. Keep it lightweight (no Radix, no third-party) so it
// itself ships in the main bundle and renders instantly. The styling
// is intentionally close to "blank workspace surface" so the user
// reads it as "loading" not as a content state.
const RouteLoadFallback: React.FC = () => (
  <div
    className="flex items-center justify-center min-h-[60vh] text-[color:var(--fg-mute)] animate-pulse"
    role="status"
    aria-live="polite"
    aria-label="در حال بارگذاری…"
  >
    <div className="text-sm">در حال بارگذاری…</div>
  </div>
);

const RouteShell = ({ Component, paramKey }: RouteShellProps): React.ReactElement => {
  const go = useGo();
  const params = useParams();
  const extra: Record<string, string | undefined> = paramKey
    ? { [paramKey]: params[paramKey] }
    : {};
  return (
    <React.Suspense fallback={<RouteLoadFallback />}>
      <Component go={go} {...extra} />
    </React.Suspense>
  );
};

// =====================================================
// Route classification + Layout
// =====================================================
//
// Phase-A R1.1: the inline Layout + route classification that lived
// here were extracted. Layout → apps/web/src/layouts/AppShell.tsx (3-mode
// shell with adaptive sidebar). Route classification →
// apps/web/src/router/route-classification.ts (getRouteKind +
// isPublicRoute / isAuthFlowRoute / isWorkspaceRoute helpers).
//
// We still wrap AppShell in UIRoot here so theme / toast / confirm /
// command-palette / AI FAB context is available everywhere. UIRoot
// previously lived inside Layout; pulling it up means AppShell's three
// modes can compose without owning the global context, and any future
// shell variant (e.g., a print-only shell) gets the same context for free.
const LayoutWithChrome: React.FC = () => {
  const go = useGo();
  return (
    <UIRoot onNavigate={go}>
      <AppShell />
    </UIRoot>
  );
};

// =====================================================
// Route table
// =====================================================
//
// 1:1 with the old `switch (route)` in App.tsx. Three routes carry
// a URL param: `/course-live/:courseId`, `/assessment-live/:assessmentId`,
// `/course/:courseId`, `/virtuallab/:labId`. The catch-all `*` falls
// back to HomePage (matches the old default branch).
//
// Ordering matters for `path="*"` but not for the others (react-router
// resolves the most-specific match first).
const routes = [
  { path: "/", element: <RouteShell Component={HomePage} /> },
  { path: "/home", element: <RouteShell Component={HomePage} /> },
  { path: "/programs", element: <RouteShell Component={ProgramsPage} /> },
  { path: "/catalog", element: <RouteShell Component={CatalogPage} /> },
  { path: "/my-courses", element: <RouteShell Component={MyCoursesPage} /> },
  {
    path: "/course-live/:courseId",
    element: <RouteShell Component={CourseLivePage} paramKey="courseId" />,
  },
  {
    path: "/assessment-live/:assessmentId",
    element: (
      <RouteShell Component={AssessmentLivePage} paramKey="assessmentId" />
    ),
  },
  { path: "/progress", element: <RouteShell Component={ProgressPage} /> },
  { path: "/tutor", element: <RouteShell Component={TutorPage} /> },
  { path: "/classroom", element: <RouteShell Component={ClassroomPage} /> },
  { path: "/dashboard", element: <RouteShell Component={DashboardPage} /> },
  // Phase-A R3: dedicated role-home dashboards. role.tsx's homeRoute fields
  // point here so the post-login redirect lands on the correct surface
  // per role. The legacy /dashboard, /instructor, /admin, /parent routes
  // remain for student/instructor/admin/parent respectively.
  { path: "/super", element: <RouteShell Component={SuperAdminDashboard} /> },
  { path: "/content", element: <RouteShell Component={ContentManagerDashboard} /> },
  { path: "/ta", element: <RouteShell Component={TADashboard} /> },
  { path: "/support", element: <RouteShell Component={SupportDashboard} /> },
  { path: "/moderate", element: <RouteShell Component={ModeratorDashboard} /> },
  { path: "/org", element: <RouteShell Component={OrgDashboard} /> },
  {
    path: "/course/:courseId",
    element: <RouteShell Component={CoursePage} paramKey="courseId" />,
  },
  { path: "/course", element: <RouteShell Component={CoursePage} /> },
  { path: "/instructor", element: <RouteShell Component={InstructorPage} /> },
  { path: "/admissions", element: <RouteShell Component={AdmissionsPage} /> },
  { path: "/credential", element: <RouteShell Component={CredentialPage} /> },
  { path: "/search", element: <RouteShell Component={SearchPage} /> },
  { path: "/assessment", element: <RouteShell Component={AssessmentPage} /> },
  { path: "/community", element: <RouteShell Component={CommunityPage} /> },
  { path: "/analytics", element: <RouteShell Component={AnalyticsPage} /> },
  { path: "/authoring", element: <RouteShell Component={AuthoringPage} /> },
  { path: "/recordings", element: <RouteShell Component={RecordingsPage} /> },
  // Phase-15 R7: audit-log viewer. The page itself uses useAbility()
  // to render a denial state for users without read access, and the
  // api enforces the same gate via @Roles + @CheckPolicies. Both
  // layers must agree — defence in depth.
  { path: "/audit", element: <RouteShell Component={AuditPage} /> },
  { path: "/login", element: <RouteShell Component={LoginPage} /> },
  { path: "/register", element: <RouteShell Component={RegisterPage} /> },
  { path: "/forgot", element: <RouteShell Component={ForgotPage} /> },
  {
    path: "/verify-email",
    element: <RouteShell Component={VerifyEmailPage} />,
  },
  { path: "/2fa-setup", element: <RouteShell Component={TwoFactorPage} /> },
  { path: "/onboarding", element: <RouteShell Component={OnboardingPage} /> },
  { path: "/settings", element: <RouteShell Component={SettingsPage} /> },
  { path: "/calendar", element: <RouteShell Component={CalendarPage} /> },
  { path: "/library", element: <RouteShell Component={LibraryPage} /> },
  { path: "/help", element: <RouteShell Component={HelpPage} /> },
  { path: "/pricing", element: <RouteShell Component={PricingPage} /> },
  { path: "/faculty", element: <RouteShell Component={FacultyPage} /> },
  { path: "/admin", element: <RouteShell Component={AdminPage} /> },
  // Phase B R1 Commit I (D62) — 4 nested admin academic routes (lazy
  // per D61 Constraint #2 — land in admin-academic chunk).
  { path: "/admin/schools", element: <RouteShell Component={SchoolsAdminPage} /> },
  { path: "/admin/faculties", element: <RouteShell Component={FacultiesAdminPage} /> },
  { path: "/admin/departments", element: <RouteShell Component={DepartmentsAdminPage} /> },
  { path: "/admin/programs", element: <RouteShell Component={ProgramsAdminPage} /> },
  // Phase B R2 (D65) — Offerings + Cohorts admin routes.
  { path: "/admin/offerings", element: <RouteShell Component={OfferingsAdminPage} /> },
  { path: "/admin/cohorts", element: <RouteShell Component={CohortsAdminPage} /> },
  { path: "/parent", element: <RouteShell Component={ParentPage} /> },
  {
    path: "/officehours",
    element: <RouteShell Component={OfficeHoursPage} />,
  },
  { path: "/events", element: <RouteShell Component={EventsPage} /> },
  { path: "/about", element: <RouteShell Component={AboutPage} /> },
  { path: "/schools", element: <RouteShell Component={SchoolsPage} /> },
  { path: "/labs", element: <RouteShell Component={LabsPage} /> },
  {
    path: "/virtuallab/:labId",
    element: <RouteShell Component={VirtualLabPage} paramKey="labId" />,
  },
  { path: "/virtuallab", element: <RouteShell Component={VirtualLabPage} /> },
  { path: "/research", element: <RouteShell Component={ResearchPage} /> },
  { path: "/inbox", element: <RouteShell Component={NotificationsPage} /> },
  { path: "/messages", element: <RouteShell Component={MessagesPage} /> },
  { path: "/bookmarks", element: <RouteShell Component={BookmarksPage} /> },
  {
    path: "/achievements",
    element: <RouteShell Component={AchievementsPage} />,
  },
  { path: "/submission", element: <RouteShell Component={SubmissionPage} /> },
  { path: "/profile", element: <RouteShell Component={ProfilePage} /> },
  { path: "/transcript", element: <RouteShell Component={TranscriptPage} /> },
  {
    path: "/degree-audit",
    element: <RouteShell Component={DegreeAuditPage} />,
  },
  {
    path: "/registration",
    element: <RouteShell Component={RegistrationPage} />,
  },
  { path: "/career", element: <RouteShell Component={CareerPage} /> },
  {
    path: "/financial-aid",
    element: <RouteShell Component={FinancialAidPage} />,
  },
  { path: "/wellness", element: <RouteShell Component={WellnessPage} /> },
  { path: "/alumni", element: <RouteShell Component={AlumniPage} /> },
  { path: "/hackathons", element: <RouteShell Component={HackathonsPage} /> },
  { path: "/honor-code", element: <RouteShell Component={HonorCodePage} /> },
  // Catch-all: any unknown path lands on Home (matches the old default
  // branch of the switch). When prerender lands in Phase 16, swap to
  // a dedicated NotFound page.
  { path: "*", element: <RouteShell Component={HomePage} /> },
];

const router = createBrowserRouter([
  {
    element: <LayoutWithChrome />,
    children: routes,
  },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
