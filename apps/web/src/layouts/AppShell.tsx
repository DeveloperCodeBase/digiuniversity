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

export const AppShell: React.FC = () => {
  const { id: route, param: routeParam } = useCurrentRoute();
  const go = useGo();
  const auth = useAuth();
  const kind: RouteKind = getRouteKind(route);
  const isWorkspace = kind === "WORKSPACE";
  // 1024px = tailwind `lg`. Below lg: sidebar is a Sheet drawer.
  const isLg = useMediaQuery("(min-width: 1024px)");

  // R1.3 B5 — privacy: an authenticated visitor hitting the landing
  // (/ or /home) must NOT see any chrome rendered with their identity
  // (e.g., the Nav user-menu showing their name) before the redirect
  // takes effect. Gate the entire shell behind a skeleton until the
  // navigate() lands. Home.tsx keeps its own useEffect as defence in
  // depth but AppShell's gate is the primary mechanism now.
  const isLandingRoute = route === "" || route === "home";
  const redirectAuthedFromLanding = isLandingRoute && auth.isAuthenticated;

  // Sidebar Sheet — workspace + <lg only. AppShell owns the open state;
  // Nav calls onWorkspaceMenuClick to open. Closed on every navigation.
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  React.useEffect(() => { setSidebarOpen(false); }, [route, routeParam]);

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
        onWorkspaceMenuClick={() => setSidebarOpen(true)}
      />
      <ErrorBoundary key={route + ":" + (routeParam || "")}>
        <main
          id="main-content"
          className={cn(
            "page-shell appshell-main",
            // Leave room for the bottom nav on mobile (h-16 + safe-area).
            "pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0",
          )}
          tabIndex={-1}
          data-route-kind={kind}
        >
          {/* Breadcrumb row — workspace routes only. PUBLIC + AUTH_FLOW
              don't need a trail (the topbar's brand handles return-to-home). */}
          {isWorkspace ? <Breadcrumbs /> : null}
          {isWorkspace ? (
            <div className="workspace-grid">
              {isLg ? <RoleSideNav active={route} go={go} /> : null}
              <div className="workspace-content"><Outlet /></div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Sidebar drawer at <lg. side="start" → right edge under RTL.
            onCloseAutoFocus: Radix's default focus restore relies on tracking
            the trigger element, but our trigger lives in Nav (not a Radix
            DialogTrigger), so we restore focus manually via DOM lookup. */}
        {isWorkspace && !isLg ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
