// Phase-A R5 — Animated knowledge-graph backdrop for the login brand panel.
// Typed adapter of docs/my-upload/login/KnowledgeGraph.tsx. SVG nodes drift,
// edges fade in/out by proximity. Honours prefers-reduced-motion (the rAF
// loop short-circuits when set), and uses a ResizeObserver so the graph
// re-fills on viewport changes.
import React from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
}

interface Edge { a: number; b: number; len: number }

export interface KnowledgeGraphProps {
  /** Hue used for nodes + edges. Defaults to the navy accent. */
  accent?: string;
  /**
   * Node-density multiplier (>0). Higher = more nodes per unit area.
   * 1.0 is "medium"; the template's "low"/"medium"/"high" map to 0.6/1.0/1.6.
   */
  density?: number;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  accent = "#7da5ff",
  density = 1,
}) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const rafRef = React.useRef<number>(0);
  const dataRef = React.useRef<{ nodes: Node[]; edges: Edge[]; w: number; h: number }>({
    nodes: [],
    edges: [],
    w: 0,
    h: 0,
  });

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;

    // Bail on prefers-reduced-motion — render the static initial frame only.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const init = (): void => {
      const rect = wrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      dataRef.current.w = w;
      dataRef.current.h = h;
      const count = Math.max(
        12,
        Math.round((w * h * density) / 38000),
      );
      const nodes: Node[] = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          id: i,
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1 + Math.random() * 2.4,
          pulse: Math.random() * Math.PI * 2,
        });
      }
      dataRef.current.nodes = nodes;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      buildSvg();
    };

    const buildSvg = (): void => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
        <radialGradient id="kg-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
          <stop offset="60%" stop-color="${accent}" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      `;
      svg.appendChild(defs);

      const ge = document.createElementNS("http://www.w3.org/2000/svg", "g");
      ge.setAttribute("id", "kg-edges");
      ge.setAttribute("stroke", accent);
      ge.setAttribute("stroke-width", "0.6");
      ge.setAttribute("fill", "none");
      svg.appendChild(ge);

      const gn = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gn.setAttribute("id", "kg-nodes");
      svg.appendChild(gn);

      dataRef.current.nodes.forEach((n) => {
        const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        halo.setAttribute("r", String(n.r * 6));
        halo.setAttribute("fill", "url(#kg-halo)");
        halo.dataset.kind = "halo";
        halo.dataset.id = String(n.id);
        gn.appendChild(halo);

        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", String(n.r));
        c.setAttribute("fill", accent);
        c.dataset.kind = "core";
        c.dataset.id = String(n.id);
        gn.appendChild(c);
      });
      // Draw a single static frame so reduced-motion users see the graph too.
      paintEdges();
    };

    const paintEdges = (): void => {
      const { nodes, w, h } = dataRef.current;
      const maxDist = Math.min(w, h) * 0.18;
      const maxDist2 = maxDist * maxDist;
      const ge = svg.querySelector("#kg-edges");
      if (!ge) return;
      ge.innerHTML = "";
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDist2) {
            const alpha = 1 - d2 / maxDist2;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", String(a.x));
            line.setAttribute("y1", String(a.y));
            line.setAttribute("x2", String(b.x));
            line.setAttribute("y2", String(b.y));
            line.setAttribute("opacity", String(alpha * 0.45));
            ge.appendChild(line);
          }
        }
      }
    };

    const step = (): void => {
      const { nodes, w, h } = dataRef.current;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.pulse += 0.01;
      }

      const halos = svg.querySelectorAll<SVGCircleElement>('[data-kind="halo"]');
      const cores = svg.querySelectorAll<SVGCircleElement>('[data-kind="core"]');
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const halo = halos[i];
        const core = cores[i];
        if (!halo || !core) continue;
        halo.setAttribute("cx", String(n.x));
        halo.setAttribute("cy", String(n.y));
        halo.setAttribute("opacity", String(0.35 + 0.25 * Math.sin(n.pulse)));
        core.setAttribute("cx", String(n.x));
        core.setAttribute("cy", String(n.y));
      }

      paintEdges();
      rafRef.current = requestAnimationFrame(step);
    };

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      init();
      if (!reduced) rafRef.current = requestAnimationFrame(step);
    });
    ro.observe(wrap);

    init();
    if (!reduced) rafRef.current = requestAnimationFrame(step);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [accent, density]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        ref={svgRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        preserveAspectRatio="xMidYMid slice"
      />
    </div>
  );
};

export default KnowledgeGraph;
