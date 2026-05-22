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

  // Sidebar Sheet — workspace + <lg only. AppShell owns the open state;
  // Nav calls onWorkspaceMenuClick to open. Closed on every navigation.
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  React.useEffect(() => { setSidebarOpen(false); }, [route, routeParam]);

  // Auth gate — preserves the previous Layout's behaviour exactly.
  React.useEffect(() => {
    if (isWorkspace && !auth.isAuthenticated) go("login");
  }, [isWorkspace, auth.isAuthenticated, go]);

  if (isWorkspace && !auth.isAuthenticated) {
    return <AuthLoadingSkeleton label="در حال انتقال به ورود..." />;
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
          {/* R1.2 will inject <Breadcrumbs /> here for workspace routes. */}
          {isWorkspace ? (
            <div className="workspace-grid">
              {isLg ? <RoleSideNav active={route} go={go} /> : null}
              <div className="workspace-content"><Outlet /></div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Sidebar drawer at <lg. side="start" → right edge under RTL. */}
        {isWorkspace && !isLg ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="start" className="appshell-sidebar-drawer" aria-label="منوی workspace">
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
