// Phase-A R2.2 — typed.
// =====================================================
// Motion system — Reveal + ScrollProgress + Parallax
// =====================================================
import React from "react";

declare global {
  interface Window {
    __globalRevealInit?: boolean;
  }
}

export const useReveal = (threshold = 0.15): React.RefObject<HTMLElement> => {
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
};

type AnyTag = keyof JSX.IntrinsicElements;

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Tag to render as (default "div"). */
  as?: AnyTag;
  /** Modifier suffix appended to the `reveal-` class (e.g. "scale" → "reveal-scale"). */
  variant?: string;
  /** Stagger delay in ms; applied as the `--reveal-delay` CSS var. */
  delay?: number;
  children?: React.ReactNode;
}

export const Reveal: React.FC<RevealProps> = ({
  as: As = "div",
  variant = "",
  delay,
  children,
  className = "",
  ...rest
}) => {
  const ref = useReveal();
  const cls = "reveal" + (variant ? "-" + variant : "") + (className ? " " + className : "");
  const style: React.CSSProperties | undefined = delay
    ? { ...(rest.style || {}), ["--reveal-delay" as string]: delay + "ms" }
    : rest.style;
  // `as` is a polymorphic tag; React doesn't have a typed equivalent
  // without complex generics, but the runtime call is safe.
  const Tag = As as unknown as React.ElementType;
  return (
    <Tag ref={ref} className={cls} {...rest} style={style}>
      {children}
    </Tag>
  );
};

interface StaggerProps extends React.HTMLAttributes<HTMLElement> {
  as?: AnyTag;
  children?: React.ReactNode;
}

export const Stagger: React.FC<StaggerProps> = ({ as: As = "div", children, className = "", ...rest }) => {
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((c) => c.classList.add("in"));
      return;
    }
    items.forEach((c) => c.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);
  const Tag = As as unknown as React.ElementType;
  return (
    <Tag ref={ref} className={"stagger " + className} {...rest}>
      {children}
    </Tag>
  );
};

export const ScrollProgress: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = (): void => {
      const max = (document.documentElement.scrollHeight || 0) - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      el.style.transform = `scaleX(${pct})`;
      raf = 0;
    };
    const onScroll = (): void => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref} className="scroll-progress" />;
};

export const useMouseParallax = (selector = ".hero-bg .aurora", strength = 30): void => {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent): void => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const cx = e.clientX / window.innerWidth - 0.5;
        const cy = e.clientY / window.innerHeight - 0.5;
        const auroras = document.querySelectorAll<HTMLElement>(selector);
        auroras.forEach((el, i) => {
          const factor = (i + 1) * 0.4;
          el.style.transform = `translate(${cx * strength * factor}px, ${cy * strength * factor}px)`;
        });
        raf = 0;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [selector, strength]);
};

// Global reveal observer below uses window so it remains side-effecting.

// ---------- Global reveal observer ----------
// Picks up ANY .reveal element on the page, regardless of how it was added.
// Belt-and-braces for cases where .reveal is set as a class but the element
// isn't wrapped in <Reveal> / <Stagger>.
(() => {
  if (typeof window === "undefined" || window.__globalRevealInit) return;
  window.__globalRevealInit = true;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setupObserver = (): void => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const sweep = (): void => {
      const targets = document.querySelectorAll<HTMLElement>(
        ".reveal:not(.in), .reveal-scale:not(.in), .reveal-blur:not(.in)"
      );
      targets.forEach((el) => {
        if (reduced) {
          el.classList.add("in");
        } else {
          io.observe(el);
        }
      });
    };

    sweep();

    // Re-sweep on DOM mutations (e.g. route changes). Track the rAF
    // handle on a closure variable instead of stamping it on the
    // MutationObserver (which would require declaring an extra field
    // for strict-typed Mutationobserver). Same behaviour.
    let moRaf = 0;
    const mo = new MutationObserver(() => {
      if (moRaf) return;
      moRaf = requestAnimationFrame(() => {
        moRaf = 0;
        sweep();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupObserver);
  } else {
    // Defer slightly so React has rendered
    setTimeout(setupObserver, 50);
  }
})();
