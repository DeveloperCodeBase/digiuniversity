// Phase-A R1.3 — Organizational attribution. Reused in Footer
// (PUBLIC), AppShell (WORKSPACE + AUTH_FLOW thin bar), and AboutPage.
// Theme-aware logo swap via two <img> tags + CSS toggle on
// html[data-theme].
import React from "react";

export type OrgAttributionVariant = "full" | "compact";

export interface OrgAttributionProps {
  /**
   * full    — long-form copyright + logo block. Used in the public
   *           marketing footer and the About page org section.
   * compact — single-line attribution row. Used as the workspace and
   *           auth-flow footnote bar.
   */
  variant?: OrgAttributionVariant;
  className?: string;
}

const LOGO_LIGHT = "/logos/jdo-light.png";
const LOGO_DARK = "/logos/jdo-dark.png";
const ORG_NAME_FA = "مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی";

export const OrgAttribution: React.FC<OrgAttributionProps> = ({
  variant = "full",
  className,
}) => {
  if (variant === "compact") {
    return (
      <div className={"org-attribution-compact " + (className ?? "")}>
        <img
          src={LOGO_LIGHT}
          alt=""
          aria-hidden="true"
          className="org-attribution-logo is-light"
        />
        <img
          src={LOGO_DARK}
          alt=""
          aria-hidden="true"
          className="org-attribution-logo is-dark"
        />
        <span>
          © ۱۴۰۵ {ORG_NAME_FA} — تمامی حقوق محفوظ است.
        </span>
      </div>
    );
  }
  return (
    <div className={"org-attribution-full " + (className ?? "")}>
      <div className="org-attribution-mark">
        <img
          src={LOGO_LIGHT}
          alt={ORG_NAME_FA}
          className="org-attribution-logo is-light"
        />
        <img
          src={LOGO_DARK}
          alt={ORG_NAME_FA}
          className="org-attribution-logo is-dark"
        />
      </div>
      <div className="org-attribution-text">
        <div className="org-attribution-name">{ORG_NAME_FA}</div>
        <div className="org-attribution-copyright">
          © ۱۴۰۵ — تمامی حقوق مادی و معنوی این وب‌سایت، نشان‌های تجاری و
          محتوای آن، متعلق به {ORG_NAME_FA} است. هرگونه بازنشر یا
          بهره‌برداری بدون اجازه‌ی کتبی ممنوع است.
        </div>
      </div>
    </div>
  );
};

export default OrgAttribution;
