// Phase-A R5 — Brand panel for the redesigned login (lg+ only).
// Knowledge-graph backdrop + auroras + testimonial + editorial headline + stats.
// Visible only at >720px; hidden entirely on phone via the .r5-login-shell
// responsive CSS. Internally dark-themed so the white-on-navy palette holds
// regardless of the user's app-wide theme.
import React from "react";
import { KnowledgeGraph } from "../../components/KnowledgeGraph";
import { Eyebrow } from "./login-atoms";

const TestimonialCard: React.FC = () => (
  <div
    style={{
      background: "color-mix(in oklch, var(--r5-paper) 92%, transparent)",
      backdropFilter: "blur(8px)",
      border: "1px solid var(--r5-line)",
      borderRadius: 16,
      padding: "16px 18px",
      maxWidth: 360,
      boxShadow: "0 24px 40px -24px rgba(0,0,0,.25)",
      animation: "r5-card-in 800ms cubic-bezier(.22,1,.36,1) 200ms both",
    }}
  >
    <div style={{ display: "flex", gap: 4, marginBottom: 10 }} aria-label="پنج ستاره">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--r5-gold)" aria-hidden="true">
          <path d="m12 2 3.1 6.3 6.9 1L17 14.1l1.2 7L12 17.8 5.8 21l1.2-6.9L2 9.3l7-1L12 2Z" />
        </svg>
      ))}
    </div>
    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "var(--r5-ink-2)" }}>
      «اولین باری بود که حس کردم یک دستیار آموزشی واقعی دارم. پروفایل شناختی
      می‌داند کجا گیر کرده‌ام و چه باید بکنم.»
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--r5-sage), var(--r5-sage-deep))",
          color: "var(--r5-paper)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 13,
        }}
        aria-hidden
      >
        ن.ر
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>نسرین رضوی</span>
        <span style={{ fontSize: 11, color: "var(--r5-muted)" }}>کارشناسی ارشد · علوم داده</span>
      </div>
    </div>
  </div>
);

const StatRow: React.FC = () => {
  const stats: Array<{ v: string; l: string }> = [
    { v: "۱۲۴+", l: "دانشگاه و سازمان" },
    { v: "۲۱۰K", l: "یادگیرنده فعال" },
    { v: "۹۹٫۹٪", l: "پایداری سرویس" },
  ];
  return (
    <div
      style={{
        marginTop: 28,
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        paddingTop: 18,
        borderTop: "1px solid var(--r5-line)",
      }}
    >
      {stats.map((s) => (
        <div key={s.l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--r5-ink)" }}>{s.v}</span>
          <span style={{ fontSize: 11, color: "var(--r5-muted)", fontFamily: "var(--r5-mono)", letterSpacing: "0.08em" }}>
            {s.l}
          </span>
        </div>
      ))}
    </div>
  );
};

export interface BrandPanelProps {
  showTestimonial?: boolean;
}

export const BrandPanel: React.FC<BrandPanelProps> = ({ showTestimonial = true }) => {
  // Pin the brand panel to its own internal dark palette by overriding the
  // R5-scoped vars on this aside only. The form panel's theme stays whatever
  // the user picked; the brand panel is always the marketing-dark aesthetic.
  const brandVars: React.CSSProperties = {
    ["--r5-bg-2" as unknown as keyof React.CSSProperties]: "#0a1730",
    ["--r5-paper" as unknown as keyof React.CSSProperties]: "#0f1f3d",
    ["--r5-ink" as unknown as keyof React.CSSProperties]: "#eef3ff",
    ["--r5-ink-2" as unknown as keyof React.CSSProperties]: "#c8d3eb",
    ["--r5-muted" as unknown as keyof React.CSSProperties]: "#8092b3",
    ["--r5-line" as unknown as keyof React.CSSProperties]: "rgba(238,243,255,0.10)",
    ["--r5-line-strong" as unknown as keyof React.CSSProperties]: "rgba(238,243,255,0.22)",
    ["--r5-sage" as unknown as keyof React.CSSProperties]: "#7da5ff",
    ["--r5-sage-deep" as unknown as keyof React.CSSProperties]: "#a8c2ff",
  } as React.CSSProperties;

  return (
    <aside
      className="r5-brand-panel"
      style={{
        ...brandVars,
        position: "sticky",
        top: 0,
        alignSelf: "start",
        height: "100dvh",
        color: "#eef3ff",
        background:
          "radial-gradient(120% 90% at 100% 0%, #1a3a7a 0%, #0d1f44 40%, #060e22 100%)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(20px, 4vw, 48px)",
        isolation: "isolate",
      }}
    >
      <KnowledgeGraph accent="#7da5ff" />

      {/* Aurora glow A */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          insetInlineStart: "-15%",
          top: "-20%",
          width: "70%",
          aspectRatio: "1",
          background: "radial-gradient(closest-side, rgba(125,165,255,0.32), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "r5-aurora-1 24s ease-in-out infinite alternate",
          zIndex: 0,
        }}
      />
      {/* Aurora glow B */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          insetInlineEnd: "-10%",
          bottom: "-15%",
          width: "60%",
          aspectRatio: "1",
          background: "radial-gradient(closest-side, rgba(64,108,200,0.30), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          animation: "r5-aurora-2 30s ease-in-out infinite alternate",
          zIndex: 0,
        }}
      />

      {/* Vignette + grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)," +
            "repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,0.025) 38px 39px)," +
            "repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,0.025) 38px 39px)",
          pointerEvents: "none",
          maskImage: "radial-gradient(120% 80% at 60% 40%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 60% 40%, black 30%, transparent 75%)",
          zIndex: 0,
        }}
      />

      {/* Top: testimonial */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {showTestimonial && <TestimonialCard />}
      </div>

      {/* Watermark — JDO logo, faded into the background */}
      <div
        className="r5-brand-watermark"
        style={{
          position: "absolute",
          insetInlineEnd: "clamp(12px, 4vw, 48px)",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.09,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <img
          src="/logos/jdo-dark.png"
          alt=""
          aria-hidden="true"
          width="260"
          height="340"
          style={{ width: "clamp(200px, 22vw, 320px)", height: "auto", filter: "invert(1)" }}
        />
      </div>

      {/* Bottom: editorial headline + stats */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <Eyebrow text="LEARN AT SCALE" subtext="یادگیری در مقیاس" />
        <h2
          style={{
            fontSize: "clamp(34px, 4.5vw, 56px)",
            lineHeight: 1.05,
            margin: "10px 0 4px",
            fontWeight: 800,
            letterSpacing: "-0.015em",
            maxWidth: "16ch",
            color: "#eef3ff",
          }}
        >
          یادگیری شخصی،
          <br />
          در مقیاس{" "}
          <span
            style={{
              background: "linear-gradient(120deg, #a8c2ff, #7da5ff 40%, #ffffff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            دانشگاه
          </span>
        </h2>
        <p
          style={{
            color: "rgba(238,243,255,0.72)",
            maxWidth: "44ch",
            fontSize: 14.5,
            lineHeight: 1.7,
            margin: "10px 0 0",
          }}
        >
          سامانه‌ی بومی هوش مصنوعی برای آموزش عالی — توسعه‌یافته در همکاری با
          مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی.
        </p>
        <StatRow />
      </div>
    </aside>
  );
};

export default BrandPanel;
