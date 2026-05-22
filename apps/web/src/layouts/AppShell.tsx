// Phase-A R1.1 — AppShell: 3-mode chrome composer.
// PUBLIC: Nav (own drawer) + content + Footer. AUTH_FLOW: minimal Nav.
// WORKSPACE: Nav (workspace mode) + sidebar (fixed lg+, Sheet drawer <lg)
// + content. Replaces the inline Layout that lived in router.tsx.
// R1.2 will inject Breadcrumbs into the slot below the topbar.

import React from "react";
import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "../auth/ErrorBoundary";
import { useAuth } from "../auth/AuthContext";
import { AuthLoadingSkeleton } from "../components/AuthLoadingSkeleton";
import { BottomNav, cn, Sheet, SheetContent } from "../ui";
import { ScrollProgress } from "../motion";
import { Nav, Footer } from "../shared";
import { RoleSideNav } from "../sidenav";
import { useGo, useCurrentRoute } from "../router";
import { getRouteKind, type RouteKind } from "../router/route-classification";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Breadcrumbs } from "./Breadcrumbs";

type NavMode = "public" | "workspace" | "auth_flow";

const navModeFor = (kind: RouteKind): NavMode =>
  kind === "WORKSPACE" ? "workspace" : kind === "AUTH_FLOW" ? "auth_flow" : "public";

type SidebarPref = "open" | "closed";

const readSidebarPref = (): SidebarPref => {
  if (typeof window === "undefined") return "closed";
  try {
    return localStorage.getItem("digiu_sidebar_pref") === "open" ? "open" : "closed";
  } catch { return "closed"; }
};

const writeSidebarPref = (pref: SidebarPref): void => {
  try { localStorage.setItem("digiu_sidebar_pref", pref); } catch {}
};

export const AppShell: React.FC = () => {
  const { id: route, param: routeParam } = useCurrentRoute();
  const go = useGo();
  const auth = useAuth();
  const kind: RouteKind = getRouteKind(route);
  const isWorkspace = kind === "WORKSPACE";

  // R1.3 B5 — privacy: an authenticated visitor hitting the landing
  // (/ or /home) must NOT see any chrome rendered with their identity
  // before the redirect takes effect. Gate the shell behind a skeleton.
  const isLandingRoute = route === "" || route === "home";
  const redirectAuthedFromLanding = isLandingRoute && auth.isAuthenticated;

  // R1.3 D9 — sidebar is hamburger-toggle on every viewport. Sheet
  // drawer at <3xl (slides from start edge = right under RTL). At
  // ≥3xl + workspace + user pref="open", the sidebar pins inline
  // beside content — the only "stays-open" case, for power users on
  // big monitors. State is persisted as `digiu_sidebar_pref` in
  // localStorage and survives across reloads.
  const is3xl = useMediaQuery("(min-width: 1536px)");
  const [sidebarPref, setSidebarPrefState] = React.useState<SidebarPref>(readSidebarPref);
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  const pinned = is3xl && isWorkspace && sidebarPref === "open";

  // Mount + pref/viewport change: if pinned, render the sidebar open.
  React.useEffect(() => {
    if (pinned) setSidebarOpen(true);
  }, [pinned]);

  // Close transient drawer on every navigation — except when pinned
  // (the 3xl exception keeps the sidebar visible across navigation).
  React.useEffect(() => {
    if (!pinned) setSidebarOpen(false);
  }, [route, routeParam, pinned]);

  const setSidebarOpenWithPersist = (next: boolean): void => {
    setSidebarOpen(next);
    const nextPref: SidebarPref = next ? "open" : "closed";
    setSidebarPrefState(nextPref);
    writeSidebarPref(nextPref);
  };

  // R1.3 B1 — sticky-navbar scroll-aware shadow. Toggle data-scrolled
  // on <html> when scrollY > 4 so CSS can boost opacity + add depth
  // without making the nav opaque.
  React.useEffect(() => {
    const onScroll = (): void => {
      const scrolled = window.scrollY > 4;
      document.documentElement.dataset.scrolled = scrolled ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auth gate (workspace + not authed → /login) + landing redirect
  // (landing + authed → /dashboard). Both run via the same effect to
  // keep the holding-skeleton render logic centralised.
  React.useEffect(() => {
    if (isWorkspace && !auth.isAuthenticated) go("login");
    else if (redirectAuthedFromLanding) go("dashboard");
  }, [isWorkspace, auth.isAuthenticated, redirectAuthedFromLanding, go]);

  if (isWorkspace && !auth.isAuthenticated) {
    return <AuthLoadingSkeleton label="در حال انتقال به ورود..." />;
  }
  if (redirectAuthedFromLanding) {
    return <AuthLoadingSkeleton label="در حال انتقال به داشبورد..." />;
  }

  const navMode = navModeFor(kind);

  return (
    <>
      <a href="#main-content" className="skip-link">
        پرش به محتوای اصلی
      </a>
      <ScrollProgress />
      <Nav
        current={route}
        go={go}
        mode={navMode}
        onWorkspaceMenuClick={() => setSidebarOpenWithPersist(!sidebarOpen)}
      />
      <ErrorBoundary key={route + ":" + (routeParam || "")}>
        <main
          id="main-content"
          className={cn(
            "page-shell appshell-main",
            "pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0",
          )}
          tabIndex={-1}
          data-route-kind={kind}
        >
          {/* Breadcrumb row — workspace routes only. */}
          {isWorkspace ? <Breadcrumbs /> : null}
          {isWorkspace ? (
            <div className="workspace-grid" data-sidebar-pinned={pinned ? "true" : "false"}>
              {pinned ? <RoleSideNav active={route} go={go} /> : null}
              <div className="workspace-content"><Outlet /></div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Sidebar Sheet drawer — workspace mode, ANY viewport unless
            pinned inline at ≥3xl. side="start" → right edge under RTL.
            onCloseAutoFocus restores keyboard focus to the hamburger. */}
        {isWorkspace && !pinned ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpenWithPersist}>
            <SheetContent
              side="start"
              className="appshell-sidebar-drawer"
              aria-label="منوی workspace"
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                document.getElementById("appshell-sidebar-trigger")?.focus();
              }}
            >
              <RoleSideNav active={route} go={go} />
            </SheetContent>
          </Sheet>
        ) : null}

        {kind === "PUBLIC" && <Footer go={go} />}
        {auth.isAuthenticated && isWorkspace ? <BottomNav /> : null}
      </ErrorBoundary>
    </>
  );
};

export default AppShell;
