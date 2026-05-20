// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Motion system — Reveal + ScrollProgress + Parallax
// =====================================================
import React from "react";

export const useReveal = (threshold = 0.15) => {
  const ref = React.useRef(null);
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

export const Reveal = ({ as: As = "div", variant = "", delay, children, className = "", ...rest }) => {
  const ref = useReveal();
  const cls = "reveal" + (variant ? "-" + variant : "") + (className ? " " + className : "");
  const style = delay ? { "--reveal-delay": delay + "ms", ...(rest.style || {}) } : rest.style;
  return (
    <As ref={ref} className={cls} {...rest} style={style}>
      {children}
    </As>
  );
};

export const Stagger = ({ as: As = "div", children, className = "", ...rest }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children);
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
  return (
    <As ref={ref} className={"stagger " + className} {...rest}>
      {children}
    </As>
  );
};

export const ScrollProgress = () => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const max = (document.documentElement.scrollHeight || 0) - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      el.style.transform = `scaleX(${pct})`;
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref} className="scroll-progress" />;
};

export const useMouseParallax = (selector = ".hero-bg .aurora", strength = 30) => {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const cx = e.clientX / window.innerWidth - 0.5;
        const cy = e.clientY / window.innerHeight - 0.5;
        const auroras = document.querySelectorAll(selector);
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

  const setupObserver = () => {
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

    const sweep = () => {
      const targets = document.querySelectorAll(
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

    // Re-sweep on DOM mutations (e.g. route changes)
    const mo = new MutationObserver(() => {
      // throttle with rAF
      if (mo._raf) return;
      mo._raf = requestAnimationFrame(() => { mo._raf = 0; sweep(); });
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
