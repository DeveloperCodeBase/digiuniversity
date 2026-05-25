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
import { MiniRail } from "./MiniRail";
import { useGo, useCurrentRoute } from "../router";
import { getRouteKind, type RouteKind } from "../router/route-classification";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Breadcrumbs } from "./Breadcrumbs";
import { OrgAttribution } from "../components/OrgAttribution";

type NavMode = "public" | "workspace" | "auth_flow";

const navModeFor = (kind: RouteKind): NavMode =>
  kind === "WORKSPACE" ? "workspace" : kind === "AUTH_FLOW" ? "auth_flow" : "public";

// R7.12 — replaces the binary "open"|"closed" with a width-mode discriminator.
// The migration shim in readSidebarPref maps legacy values:
//   "open"   → { mode: "expanded" }
//   "closed" → { mode: "mini" }
// so users with a previous preference keep something close to their
// expectation. Default for new visitors: mini.
type SidebarMode = "mini" | "expanded";
interface SidebarPref {
  mode: SidebarMode;
}

const readSidebarPref = (): SidebarPref => {
  if (typeof window === "undefined") return { mode: "mini" };
  try {
    const raw = localStorage.getItem("digiu_sidebar_pref");
    if (!raw) return { mode: "mini" };
    if (raw === "open") return { mode: "expanded" };       // legacy → expanded
    if (raw === "closed") return { mode: "mini" };         // legacy → mini
    const parsed = JSON.parse(raw);
    return parsed?.mode === "expanded" ? { mode: "expanded" } : { mode: "mini" };
  } catch {
    return { mode: "mini" };
  }
};

const writeSidebarPref = (pref: SidebarPref): void => {
  try { localStorage.setItem("digiu_sidebar_pref", JSON.stringify(pref)); } catch {}
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

  // R7.12 — sidebar is now viewport-conditional:
  //   ≥1024px (workspace): persistent rail inline in the workspace
  //     grid. Width animates between 72px (mini) and 280px (expanded).
  //     The rail is ALWAYS in the DOM at this breakpoint; the mode
  //     persists across reloads via localStorage `digiu_sidebar_pref`.
  //   <1024px (workspace): R6.6 Sheet drawer unchanged — overlay,
  //     lazy-mounted, hamburger-toggled. R1.3-D9 still applies here.
  //
  // Pre-R7.12: pinned inline only at ≥1536px (3xl) and only when user
  // had opted-in. Sheet drawer at all other sizes. R7.12 lowers that
  // breakpoint to 1024px and makes pinning the default.
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [sidebarPref, setSidebarPrefState] = React.useState<SidebarPref>(readSidebarPref);
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  // The rail renders at ≥1024px in workspace mode. <1024px keeps the
  // Sheet drawer for the R6.6 mobile pattern.
  const railVisible = isWide && isWorkspace;

  // Close the (mobile) Sheet on every navigation. No equivalent for
  // the rail because it's persistent — its open/closed state is
  // expressed as mini vs expanded, not visibility.
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [route, routeParam]);

  /** Toggle between mini and expanded — used by the rail's chevron. */
  const toggleRailMode = (): void => {
    const next: SidebarPref = {
      mode: sidebarPref.mode === "mini" ? "expanded" : "mini",
    };
    setSidebarPrefState(next);
    writeSidebarPref(next);
  };

  /** Open/close the <1024px Sheet drawer. The mobile path doesn't
   *  persist; users expect mobile drawers to default-close on every
   *  page entry. */
  const setSidebarOpenWithPersist = (next: boolean): void => {
    setSidebarOpen(next);
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

  // Phase-A R-Landing (D39 / Option B) — for the landing route,
  // AppShell renders NOTHING and lets Home.tsx own the full chrome
  // (its own Nav + skip-link + main + Footer, all scoped via
  // .home-shell-v2). The R6 .r6-classroom-shell precedent is the
  // model here: a standalone-chrome page inside the router tree.
  //
  // Note: this happens AFTER the redirectAuthedFromLanding check
  // above, so an authed visitor still sees the skeleton + bounce
  // to /dashboard (Home.tsx never renders for authed users on /).
  if (isLandingRoute) {
    return <Outlet />;
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
        // R7.5 — plumb open state for the hamburger's aria-expanded.
        // At ≥1024px workspace, the hamburger is hidden via CSS
        // (R7.12), so this value only matters at <1024px.
        workspaceMenuOpen={sidebarOpen}
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
            <div
              className={cn("workspace-grid", railVisible && "has-rail")}
              data-rail-mode={railVisible ? sidebarPref.mode : undefined}
              // R7.12 — Sidebar pinning indicator preserved for any
              // page-level CSS that still keys off it (5 legacy pages
              // per the workspace-grid comment); semantic for the new
              // pattern is data-rail-mode above.
              data-sidebar-pinned={railVisible ? "true" : "false"}
            >
              {/* R7.12 — Persistent rail at ≥1024px. Always in DOM
                  (not lazy-mounted), width animated via CSS variable
                  set on the grid wrapper above. */}
              {railVisible ? (
                <MiniRail
                  mode={sidebarPref.mode}
                  onToggle={toggleRailMode}
                  go={go}
                  active={route}
                />
              ) : null}
              <div className="workspace-content"><Outlet /></div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* R7.12 — Sidebar Sheet drawer at <1024px workspace mode ONLY.
            At ≥1024px the persistent rail above replaces it. Pre-R7.12
            the Sheet rendered at <1536px; R7.12 lowers the cutover to
            1024px so all desktop/tablet sizes get the inline rail. */}
        {isWorkspace && !railVisible ? (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpenWithPersist}>
            <SheetContent
              side="start"
              id="appshell-sidebar-drawer"
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
        {/* Phase-A R1.3 Brand: workspace + auth_flow get a thin attribution
            bar (the marketing Footer above already carries the full version
            for PUBLIC). Owner asked for org credit on every page. */}
        {kind !== "PUBLIC" ? <OrgAttribution variant="compact" /> : null}
        {auth.isAuthenticated && isWorkspace ? <BottomNav /> : null}
      </ErrorBoundary>
    </>
  );
};

export default AppShell;
