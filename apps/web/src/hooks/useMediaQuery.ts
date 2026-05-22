// Phase-A R1.1 — SSR-safe matchMedia hook. Returns false on the server.
// Used by AppShell (lg=1024 drawer/fixed swap) and R1.2 Breadcrumbs
// (md=768 truncation).

import { useEffect, useState } from "react";

export const useMediaQuery = (query: string): boolean => {
  const getMatch = (): boolean => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent): void => setMatches(e.matches);
    // Set immediately in case the value changed between render and effect.
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};
