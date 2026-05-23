// Phase-A R5 — Co-brand footer for the redesigned login.
// Jahad mark + center text + nav links. Theme-aware logo swap via two <img>
// tags that toggle on html[data-theme] (same pattern as OrgAttribution).
import React from "react";

const FootLink: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <a
    href="#"
    onClick={(e) => e.preventDefault()}
    style={{
      color: "var(--r5-muted)",
      textDecoration: "none",
      transition: "color 160ms ease",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--r5-ink)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--r5-muted)"; }}
  >
    {children}
  </a>
);

const JahadMark: React.FC = () => (
  <>
    <img
      src="/logos/jdo-light.png"
      alt="نشان جهاد دانشگاهی"
      width="40"
      height="52"
      className="r5-jahad-mark is-light"
      style={{ width: 40, height: "auto", objectFit: "contain" }}
    />
    <img
      src="/logos/jdo-dark.png"
      alt=""
      aria-hidden="true"
      width="40"
      height="52"
      className="r5-jahad-mark is-dark"
      style={{ width: 40, height: "auto", objectFit: "contain" }}
    />
  </>
);

export const CoBrandFooter: React.FC = () => (
  <footer
    style={{
      marginTop: "clamp(28px, 5vh, 56px)",
      paddingTop: 20,
      borderTop: "1px solid var(--r5-line)",
      display: "flex",
      flexWrap: "wrap",
      gap: 18,
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 11.5,
      color: "var(--r5-muted)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <JahadMark />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
        <span style={{ fontWeight: 600, color: "var(--r5-ink-2)", fontSize: 12 }}>
          با همکاری جهاد دانشگاهی
        </span>
        <span style={{ fontFamily: "var(--r5-mono)", fontSize: 10, letterSpacing: "0.06em" }}>
          مرکز راهبری پژوهش و پیشرفت هوش مصنوعی · از ۱۳۵۹
        </span>
      </div>
    </div>
    <nav style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
      <FootLink>قوانین و حریم خصوصی</FootLink>
      <FootLink>پشتیبانی</FootLink>
      <FootLink>وضعیت سامانه</FootLink>
      <FootLink>API</FootLink>
    </nav>
  </footer>
);

export default CoBrandFooter;
