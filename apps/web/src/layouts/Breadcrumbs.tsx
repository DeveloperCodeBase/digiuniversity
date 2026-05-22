// Phase-A R1.2 — Breadcrumb row. WORKSPACE-only, 36px tall.
// At <md (<768) and >3 crumbs: truncate to first › … › last-2 with a
// Radix Popover on the … that shows the hidden hops as clickable links.
import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { useCurrentRoute, useGo } from "../router";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { breadcrumbLabel } from "../router/breadcrumb-map";

interface Crumb { label: string; routeId?: string; isLast: boolean }
interface Ellipsis { ellipsis: true; hidden: Crumb[] }

const Sep: React.FC = () => <span aria-hidden="true" className="breadcrumb-sep">›</span>;

export const Breadcrumbs: React.FC = () => {
  const { id: route, param } = useCurrentRoute();
  const go = useGo();
  const isMd = useMediaQuery("(min-width: 768px)");

  const crumbs: Crumb[] = [];
  if (route !== "home" && route !== "") {
    crumbs.push({ label: breadcrumbLabel("home"), routeId: "home", isLast: false });
  }
  if (route && route !== "home") {
    crumbs.push({ label: breadcrumbLabel(route), routeId: route, isLast: !param });
  }
  if (param) crumbs.push({ label: param, isLast: true });
  if (crumbs.length === 0) crumbs.push({ label: breadcrumbLabel("home"), isLast: true });

  const shouldTruncate = !isMd && crumbs.length > 3;
  const items: Array<Crumb | Ellipsis> = shouldTruncate
    ? [crumbs[0], { ellipsis: true, hidden: crumbs.slice(1, -2) }, ...crumbs.slice(-2)]
    : crumbs;

  return (
    <nav aria-label="مسیر صفحه" className="breadcrumb-row">
      <ol>
        {items.map((c, i) => {
          const isTail = i === items.length - 1;
          if ("ellipsis" in c) {
            return (
              <li key={`e-${i}`} className="breadcrumb-ellipsis">
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button type="button" aria-label="نمایش مسیر کامل">…</button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content className="breadcrumb-popover" sideOffset={4} align="start">
                      <ul>
                        {c.hidden.map((h, j) => (
                          <li key={j}>
                            <button type="button" onClick={() => h.routeId && go(h.routeId)}>{h.label}</button>
                          </li>
                        ))}
                      </ul>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
                {!isTail && <Sep />}
              </li>
            );
          }
          return (
            <li key={i}>
              {c.isLast || !c.routeId
                ? <span aria-current="page">{c.label}</span>
                : <a href={"/" + c.routeId} onClick={(e) => { e.preventDefault(); go(c.routeId!); }}>{c.label}</a>}
              {!isTail && <Sep />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
