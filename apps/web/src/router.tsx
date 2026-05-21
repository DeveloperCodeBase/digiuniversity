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
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { ErrorBoundary } from "./auth/ErrorBoundary";
import { useAuth } from "./auth/AuthContext";
import { UIRoot } from "./ui";
import { ScrollProgress } from "./motion";
import { Nav, Footer } from "./shared";
import { RoleSideNav } from "./sidenav";

import HomePage from "./pages/Home";
import AssessmentLivePage from "./pages/AssessmentLive";
import CatalogPage from "./pages/Catalog";
import CourseLivePage from "./pages/CourseLive";
import MyCoursesPage from "./pages/MyCourses";
import ProgressPage from "./pages/Progress";
import TutorPage from "./pages/Tutor";
import ProgramsPage from "./pages/Programs";
import ClassroomPage from "./pages/Classroom";
import DashboardPage from "./pages/Dashboard";
import CoursePage from "./pages/Course";
import InstructorPage from "./pages/Instructor";
import AdmissionsPage from "./pages/Admissions";
import CredentialPage from "./pages/Credential";
import SearchPage from "./pages/Search";
import AssessmentPage from "./pages/Assessment";
import CommunityPage from "./pages/Community";
import AnalyticsPage from "./pages/Analytics";
import AuthoringPage from "./pages/Authoring";
import RecordingsPage from "./pages/Recordings";
import {
  LoginPage,
  RegisterPage,
  ForgotPage,
  VerifyEmailPage,
  TwoFactorPage,
  OnboardingPage,
} from "./pages/Auth";
import SettingsPage from "./pages/Settings";
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
  SchoolsPage,
  VirtualLabPage,
  LabsPage,
  ResearchPage,
} from "./pages/University";
import {
  NotificationsPage,
  MessagesPage,
  BookmarksPage,
  AchievementsPage,
  SubmissionPage,
  ProfilePage,
} from "./pages/Productivity";
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

const RouteShell = ({ Component, paramKey }: RouteShellProps): React.ReactElement => {
  const go = useGo();
  const params = useParams();
  const extra: Record<string, string | undefined> = paramKey
    ? { [paramKey]: params[paramKey] }
    : {};
  return <Component go={go} {...extra} />;
};

// =====================================================
// Route classification
// =====================================================
//
// Phase-14.7: routes are partitioned into three groups so the Layout
// can choose the right chrome (and gate authentication):
//
//   PUBLIC      — anyone can view, no sidebar, footer shows
//                 (home, programs, about, pricing, admissions, help)
//   AUTH_FLOW   — login/register/forgot/verify/2fa/onboarding
//                 (anyone can view, but no sidebar + no footer —
//                 the auth shell has its own visual)
//   WORKSPACE   — everything else (dashboard, course, settings, ...)
//                 requires authentication, renders RoleSideNav,
//                 no footer (sidebar replaces footer nav for these)
//
// A route id is workspace by elimination: if it's NOT in PUBLIC and
// NOT in AUTH_FLOW, it's workspace. That's the deny-by-default
// behaviour Phase 15 RBAC will extend with CASL per-action.

const PUBLIC_ROUTE_IDS: ReadonlySet<string> = new Set([
  "",
  "home",
  "programs",
  "about",
  "pricing",
  "admissions",
  "help",
  "honor-code",
]);

const AUTH_FLOW_ROUTE_IDS: ReadonlySet<string> = new Set([
  "login",
  "register",
  "forgot",
  "verify-email",
  "2fa-setup",
  "onboarding",
]);

const isPublicRoute = (id: string): boolean => PUBLIC_ROUTE_IDS.has(id);
const isAuthFlowRoute = (id: string): boolean => AUTH_FLOW_ROUTE_IDS.has(id);
const isWorkspaceRoute = (id: string): boolean =>
  !isPublicRoute(id) && !isAuthFlowRoute(id);

// =====================================================
// Layout — chrome that wraps every route
// =====================================================
//
// Pulls `current` route id + param so Nav can highlight the active
// item and ErrorBoundary can reset on route change (key changes →
// React unmounts + remounts the subtree, clearing any latent error
// state from the previous page).
//
// Phase-14.7:
//   - workspace routes render RoleSideNav alongside <Outlet/> in a
//     `.workspace-grid` two-column layout. Sidebar stays present
//     across navigations between workspace pages — no more
//     "click sidebar item → sidebar disappears" because each page
//     used to render its own sidebar inconsistently.
//   - workspace routes are auth-gated: an unauthenticated user is
//     redirected to /login. Closes the "anyone can visit /instructor
//     without logging in" reporter F-122.
const Layout: React.FC = () => {
  const { id: route, param: routeParam } = useCurrentRoute();
  const go = useGo();
  const auth = useAuth();

  const isWorkspace = isWorkspaceRoute(route);

  // Phase-14.7 auth gate — redirect to /login when a non-authenticated
  // visitor hits a workspace route. Effect runs after the render so the
  // initial paint is the spinner-free shell (acceptable for a moment);
  // a tighter implementation pre-renders a "checking session" splash.
  React.useEffect(() => {
    if (isWorkspace && !auth.isAuthenticated) {
      go("login");
    }
  }, [isWorkspace, auth.isAuthenticated, go]);

  return (
    <UIRoot onNavigate={go}>
      <a href="#main-content" className="skip-link">
        پرش به محتوای اصلی
      </a>
      <ScrollProgress />
      <Nav current={route} go={go} />
      <ErrorBoundary key={route + ":" + (routeParam || "")}>
        <main id="main-content" className="page-shell" tabIndex={-1}>
          {isWorkspace ? (
            <div className="workspace-grid">
              <RoleSideNav active={route} go={go} />
              <div className="workspace-content">
                <Outlet />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
        {/* Phase-14.7 R2: footer is centralised here, not per-page.
            Public marketing pages get it; auth-flow + workspace
            routes don't (sidebar is the workspace nav, auth shell has
            its own visual). Pages that still import Footer themselves
            are deprecated — to be removed file-by-file. */}
        {isPublicRoute(route) && <Footer go={go} />}
      </ErrorBoundary>
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
    element: <Layout />,
    children: routes,
  },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
