// Phase-A R5 — Redesigned LoginPage.
// Visual design from docs/my-upload/login/LoginPage.tsx (owner template).
// Wired to the existing auth flow (auth.login, DEMO_CREDS, apiRoleToLocal,
// role-aware redirect, error toasts) — no behaviour regression vs the
// pre-R5 LoginPage in Auth.tsx.
//
// 5 visible roles in the selector (student/instructor/admin/parent/org)
// — the other 5 (ta/content_manager/support/moderator/super_admin) added
// in Phase 15 R7 are still reachable via the api on login, but the
// selector keeps the original 5 chips for clarity in the demo-tenant flow.
import React from "react";
import { useRole, ROLES, type RoleId } from "../../role";
import { apiRoleToLocal } from "../../auth/role-map";
import { useAuth } from "../../auth/AuthContext";
import { ApiError } from "../../api/client.js";
import type { Go } from "../../router";
import { useTheme } from "../../ui";
import { BrandPanel } from "./BrandPanel";
import { CoBrandFooter } from "./CoBrandFooter";
import {
  Icon,
  Field,
  TextInput,
  Checkbox,
  Eyebrow,
  PillButton,
  Wordmark,
  Spinner,
  PassStrength,
  SsoButton,
  GoogleGlyph,
  NationalGlyph,
  OrgGlyph,
  DemoBox,
  useR5Toast,
} from "./login-atoms";

// ---- Local role descriptor mirroring the owner template ------------------

interface VisibleRole {
  id: RoleId;
  label: string;
  hint: string;
  emailLabel: string;
  emailPlaceholder: string;
  iconPath: string;
  demoEmail: string;
  demoPassword: string;
}

const VISIBLE_ROLES: VisibleRole[] = [
  {
    id: "student",
    label: "دانشجو",
    hint: "پس از ورود به میز کار دانشجو می‌روید.",
    emailLabel: "ایمیل یا کد دانشجویی",
    emailPlaceholder: "you@example.com",
    iconPath: "M3 9.5 12 5l9 4.5L12 14 3 9.5Zm3 3.5v3.2c0 .9 2.7 2.3 6 2.3s6-1.4 6-2.3V13",
    demoEmail: "student1@digiuniversity.ir",
    demoPassword: "StudentPass!1",
  },
  {
    id: "instructor",
    label: "استاد",
    hint: "پس از ورود به پنل تدریس و کلاس‌ها می‌روید.",
    emailLabel: "ایمیل سازمانی",
    emailPlaceholder: "name@digiuniversity.ir",
    iconPath: "M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4V5Zm16 0h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6V5Z",
    demoEmail: "instructor1@digiuniversity.ir",
    demoPassword: "InstructorPass!1",
  },
  {
    id: "admin",
    label: "مدیر",
    hint: "دسترسی به داشبورد مدیریت و گزارش‌ها.",
    emailLabel: "ایمیل مدیریتی",
    emailPlaceholder: "admin@digiuniversity.ir",
    iconPath: "M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z",
    demoEmail: "admin@digiuniversity.ir",
    demoPassword: "ChangeMe!2026",
  },
  {
    id: "parent",
    label: "والد",
    hint: "مشاهده پیشرفت و گزارش‌های فرزند.",
    emailLabel: "شماره موبایل یا ایمیل",
    emailPlaceholder: "09…",
    iconPath:
      "M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 2c-2.7 0-5 1.3-5 3v2h10v-2c0-1.7-2.3-3-5-3Zm8 0c-.6 0-1.2.1-1.7.2 1 .7 1.7 1.7 1.7 2.8v2h6v-2c0-1.7-2.3-3-6-3Z",
    demoEmail: "parent1@digiuniversity.ir",
    demoPassword: "ParentPass!1",
  },
  {
    id: "org",
    label: "سازمان",
    hint: "حساب سازمانی برای تأمین آموزش جمعی.",
    emailLabel: "ایمیل کاری",
    emailPlaceholder: "work@company.ir",
    iconPath: "M4 21V5l8-3 8 3v16h-6v-5h-4v5H4Zm4-9h2v2H8v-2Zm6 0h2v2h-2v-2Z",
    demoEmail: "org1@digiuniversity.ir",
    demoPassword: "OrgPass!1",
  },
];

// ---- Role selector (segmented control with sliding indicator) -----------

interface RoleSelectorProps {
  value: RoleId;
  onChange: (v: RoleId) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange }) => {
  const wrap = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<{ x: number; w: number; h: number; y: number }>({
    x: 0, w: 0, h: 0, y: 0,
  });

  const reposition = React.useCallback((): void => {
    if (!wrap.current) return;
    const btn = wrap.current.querySelector<HTMLButtonElement>(`[data-role="${value}"]`);
    if (!btn) return;
    const wrect = wrap.current.getBoundingClientRect();
    const brect = btn.getBoundingClientRect();
    setIndicator({
      x: brect.left - wrect.left,
      y: brect.top - wrect.top,
      w: brect.width,
      h: brect.height,
    });
  }, [value]);

  React.useLayoutEffect(reposition, [reposition]);

  React.useEffect(() => {
    const ro = new ResizeObserver(reposition);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener("resize", reposition);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", reposition);
    };
  }, [reposition]);

  return (
    <div
      ref={wrap}
      role="tablist"
      aria-label="انتخاب نقش"
      className="r5-role-tabs"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${VISIBLE_ROLES.length}, 1fr)`,
        gap: 4,
        padding: 4,
        background: "var(--r5-bg-2)",
        border: "1px solid var(--r5-line)",
        borderRadius: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: indicator.x,
          top: indicator.y,
          width: indicator.w,
          height: indicator.h,
          background: "var(--r5-paper)",
          borderRadius: 10,
          boxShadow: "0 1px 0 rgba(255,255,255,.6) inset, 0 4px 14px -6px rgba(0,0,0,.25)",
          border: "1px solid var(--r5-line-strong)",
          transition: "all 380ms cubic-bezier(.22,1,.36,1)",
          zIndex: 0,
        }}
      />
      {VISIBLE_ROLES.map((r) => {
        const active = r.id === value;
        return (
          <button
            key={r.id}
            data-role={r.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(r.id)}
            style={{
              position: "relative",
              zIndex: 1,
              background: "transparent",
              border: 0,
              padding: "10px 6px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13.5,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--r5-ink)" : "var(--r5-muted)",
              transition: "color 220ms ease",
            }}
          >
            <Icon d={r.iconPath} size={15} />
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ---- Main page ------------------------------------------------------------

interface AuthPageProps { go: Go }

interface LoginErrors {
  tenantSlug?: string;
  email?: string;
  password?: string;
  general?: string;
}

// R7.9 — apiRoleToLocal moved to apps/web/src/auth/role-map.ts so
// LoginPage and the legacy Auth.tsx share a single source of truth.
// The previous local copy mapped only 3 of 10 API roles, silently
// bucketing parent/org/ta/cm/support/moderator/super_admin as
// "student" — that bug caused Gate A §5 + OWNER-FINDING-2.

export const LoginPage: React.FC<AuthPageProps> = ({ go }) => {
  const { setRole } = useRole();
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [roleId, setRoleId] = React.useState<RoleId>("student");
  const [tenantSlug, setTenantSlug] = React.useState<string>("demo");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [showPass, setShowPass] = React.useState<boolean>(false);
  const [remember, setRemember] = React.useState<boolean>(true);
  const [twofa, setTwofa] = React.useState<boolean>(true);
  const [errors, setErrors] = React.useState<LoginErrors>({});
  const [pending, setPending] = React.useState<boolean>(false);
  const { node: toastNode, show: showToast } = useR5Toast();

  const currentRole = VISIBLE_ROLES.find((r) => r.id === roleId) ?? VISIBLE_ROLES[0];

  const fillDemo = (): void => {
    setEmail(currentRole.demoEmail);
    setPassword(currentRole.demoPassword);
    showToast("اطلاعات نمونه پر شد — کلید «ورود به حساب» را بزنید");
  };

  const validate = (): LoginErrors => {
    const e: LoginErrors = {};
    if (!tenantSlug.trim()) e.tenantSlug = "شناسه سازمان الزامی است.";
    if (!email.trim()) e.email = "ایمیل/کد کاربری الزامی است.";
    else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "فرمت ایمیل صحیح نیست.";
    if (!password) e.password = "رمز عبور الزامی است.";
    else if (password.length < 8) e.password = "رمز عبور حداقل ۸ کاراکتر باشد.";
    return e;
  };

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast(Object.values(errs)[0] ?? "ورودی نامعتبر است.");
      return;
    }
    setPending(true);
    try {
      const user = await auth.login({
        tenantSlug: tenantSlug.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      const localRole = apiRoleToLocal(user.roles);
      setRole(localRole);
      showToast("با موفقیت وارد شدید — در حال انتقال…");
      const target = ROLES[localRole]?.homeRoute || "dashboard";
      go(target);
    } catch (err: unknown) {
      let msg = "خطای ناشناخته";
      if (err instanceof ApiError) {
        msg = (err as { displayMessage?: string }).displayMessage ?? msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrors({ general: msg });
      showToast(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <main
      className="r5-login-shell"
      data-screen-label="01 Login"
      style={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
        background: "var(--r5-bg)",
        color: "var(--r5-ink)",
      }}
    >
      {/* Brand panel — hidden by CSS at <=720px */}
      <BrandPanel showTestimonial />

      {/* Form panel */}
      <section
        className="r5-form-panel"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "clamp(20px, 4vw, 48px) clamp(20px, 5vw, 72px)",
          minHeight: "100dvh",
          background: "var(--r5-bg)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "clamp(20px, 4vh, 48px)",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Wordmark />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <PillButton onClick={() => showToast("جستجو در حالت نمونه فعال نیست")} ariaLabel="جستجو">
              <Icon d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35" size={16} />
            </PillButton>
            <PillButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              ariaLabel="تغییر تم"
            >
              {theme === "dark" ? (
                <Icon d="M12 3v2M12 19v2M5 12H3M21 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" size={16} />
              ) : (
                <Icon d="M21 12.8A9 9 0 0 1 11.2 3a7.5 7.5 0 1 0 9.8 9.8Z" size={16} />
              )}
            </PillButton>
            {/* R7.3 B.4 — was `ariaLabel="تغییر زبان"` with visible
                text "FA". Lighthouse's label-content-name-mismatch rule
                requires the visible text to be part of the accessible
                name. Including "FA" in the aria-label resolves it while
                preserving the Persian context. */}
            <PillButton onClick={() => showToast("زبان نمایش: فارسی")} ariaLabel="تغییر زبان (FA)">
              <span style={{ fontSize: 12, fontWeight: 600 }}>FA</span>
            </PillButton>
          </div>
        </header>

        <div className="r5-form-center" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              animation: "r5-card-in 700ms cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <Eyebrow text="WELCOME BACK" subtext="ورود" />
            <h1
              style={{
                fontSize: "clamp(34px, 4.4vw, 52px)",
                lineHeight: 1.05,
                margin: "10px 0 14px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--r5-ink)",
              }}
            >
              خوش آمدید
            </h1>
            <p style={{ color: "var(--r5-muted)", margin: 0, fontSize: 15, lineHeight: 1.65 }}>
              با حساب خود وارد شوید. اگر هنوز ثبت‌نام نکرده‌اید، می‌توانید در کمتر از{" "}
              <b style={{ color: "var(--r5-ink-2)" }}>۲ دقیقه</b> شروع کنید.
            </p>

            <form onSubmit={handleLogin} style={{ marginTop: 26, display: "grid", gap: 16 }} noValidate>
              {/* Role */}
              <div style={{ display: "grid", gap: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--r5-muted)",
                    fontFamily: "var(--r5-mono)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  من به عنوان …
                </div>
                <RoleSelector value={roleId} onChange={setRoleId} />
                <div
                  key={roleId}
                  style={{
                    fontSize: 13,
                    color: "var(--r5-ink-2)",
                    padding: "10px 14px",
                    background: "color-mix(in oklch, var(--r5-sage) 18%, var(--r5-paper))",
                    border: "1px solid color-mix(in oklch, var(--r5-sage) 35%, transparent)",
                    borderRadius: 10,
                    animation: "r5-fade-up 320ms ease both",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon d="M20 6 9 17l-5-5" size={14} stroke={2} />
                  <span>{currentRole.hint}</span>
                </div>
              </div>

              {/* Demo box (only when tenant=demo) */}
              {tenantSlug.trim().toLowerCase() === "demo" && (
                <DemoBox
                  onFill={fillDemo}
                  roleLabel={currentRole.label}
                  email={currentRole.demoEmail}
                  password={currentRole.demoPassword}
                />
              )}

              {/* Tenant */}
              <Field
                label="شناسه سازمان / TENANT"
                required
                hint={
                  <span style={{ fontSize: 11, color: "var(--r5-muted)", fontFamily: "var(--r5-mono)" }}>
                    اختیاری برای دانشجوی عمومی
                  </span>
                }
                error={errors.tenantSlug}
              >
                <TextInput
                  name="tenantSlug"
                  type="text"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="demo"
                  icon="M12 8v8M8 12h8M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"
                />
              </Field>

              {/* Email */}
              <Field label={currentRole.emailLabel} required error={errors.email}>
                <TextInput
                  name="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentRole.emailPlaceholder}
                  dir="ltr"
                  icon="M22 6 12 13 2 6m20 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"
                />
              </Field>

              {/* Password */}
              <Field
                label="رمز عبور"
                required
                error={errors.password}
                hint={
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      go("forgot");
                    }}
                    style={{
                      fontSize: 12,
                      color: "var(--r5-sage-deep)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    فراموش کرده‌اید؟
                  </a>
                }
              >
                <TextInput
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  dir="ltr"
                  icon="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6-7V8a6 6 0 1 0-12 0v2H4v12h16V10h-2Z"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "مخفی‌سازی رمز" : "نمایش رمز"}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    insetInlineStart: 4,
                    width: 36,
                    background: "transparent",
                    border: 0,
                    color: "var(--r5-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPass ? (
                    <Icon d="M3 3 21 21M10.6 6.1A10 10 0 0 1 12 6c5 0 9 6 9 6a14 14 0 0 1-3.2 3.6M6.6 6.6A14 14 0 0 0 3 12s4 6 9 6a10 10 0 0 0 4.4-1M9.5 9.5a3.5 3.5 0 0 0 5 5" />
                  ) : (
                    <Icon d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  )}
                </button>
                <PassStrength value={password} />
              </Field>

              {/* Toggles row */}
              <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
                <Checkbox checked={remember} onChange={setRemember} label="مرا به خاطر بسپار" />
                <Checkbox
                  checked={twofa}
                  onChange={setTwofa}
                  label="احراز دو‌مرحله‌ای فعال"
                  hint="پس از ورود، کد ۶ رقمی به ایمیل/پیامک شما ارسال می‌شود."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                style={{
                  marginTop: 10,
                  background: "var(--r5-ink)",
                  color: "var(--r5-paper)",
                  border: 0,
                  borderRadius: 14,
                  padding: "15px 20px",
                  fontSize: 15.5,
                  fontWeight: 600,
                  cursor: pending ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 160ms ease, box-shadow 200ms ease",
                  boxShadow: "0 8px 24px -8px color-mix(in oklch, var(--r5-ink) 70%, transparent)",
                  minHeight: 48,
                }}
                onMouseEnter={(e) => {
                  if (!pending) e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                }}
              >
                {pending ? (
                  <><Spinner /> در حال ورود …</>
                ) : (
                  <>
                    <span>ورود به حساب</span>
                    <Icon d="M5 12h14M13 5l7 7-7 7" size={18} stroke={2} />
                  </>
                )}
              </button>

              {/* OR divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "8px 0 0",
                  fontSize: 11,
                  color: "var(--r5-muted)",
                  fontFamily: "var(--r5-mono)",
                  letterSpacing: "0.18em",
                }}
              >
                <span style={{ flex: 1, height: 1, background: "var(--r5-line-strong)" }} />
                <span>یا · OR</span>
                <span style={{ flex: 1, height: 1, background: "var(--r5-line-strong)" }} />
              </div>

              {/* SSO */}
              <div className="r5-sso-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SsoButton label="گوگل" glyph={GoogleGlyph} onClick={() => showToast("Google SSO — به‌زودی")} />
                <SsoButton label="درگاه ملی" hint="ID.IR" glyph={NationalGlyph} onClick={() => showToast("ورود از درگاه ملی — به‌زودی")} />
                <SsoButton label="سازمان" hint="SAML / SSO" glyph={OrgGlyph} onClick={() => showToast("ورود سازمانی — به‌زودی")} />
              </div>

              {/* Sign-up CTA */}
              <a
                href="#signup"
                onClick={(e) => {
                  e.preventDefault();
                  go("register");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "color-mix(in oklch, var(--r5-sage) 14%, var(--r5-paper))",
                  border: "1px dashed color-mix(in oklch, var(--r5-sage) 40%, transparent)",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "var(--r5-ink-2)",
                  fontSize: 13.5,
                  marginTop: 4,
                  transition: "background 200ms ease",
                }}
              >
                <Icon d="M12 4v16M4 12h16" size={14} stroke={2} />
                <span>
                  حساب کاربری ندارید؟ <b style={{ color: "var(--r5-ink)" }}>همین حالا بسازید →</b>
                </span>
              </a>
            </form>
          </div>
        </div>

        <CoBrandFooter />
      </section>

      {toastNode}
    </main>
  );
};

export default LoginPage;
