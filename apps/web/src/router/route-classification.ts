// Phase-A R1.1 — Route classification. Extracted from router.tsx so
// AppShell can consume the truth table without duplicating it.
// WORKSPACE by elimination = deny-by-default (Phase 15 RBAC extends with CASL).

export type RouteKind = "PUBLIC" | "AUTH_FLOW" | "WORKSPACE";

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

export const getRouteKind = (routeId: string): RouteKind => {
  if (PUBLIC_ROUTE_IDS.has(routeId)) return "PUBLIC";
  if (AUTH_FLOW_ROUTE_IDS.has(routeId)) return "AUTH_FLOW";
  return "WORKSPACE";
};

export const isPublicRoute = (routeId: string): boolean =>
  getRouteKind(routeId) === "PUBLIC";

export const isAuthFlowRoute = (routeId: string): boolean =>
  getRouteKind(routeId) === "AUTH_FLOW";

export const isWorkspaceRoute = (routeId: string): boolean =>
  getRouteKind(routeId) === "WORKSPACE";
