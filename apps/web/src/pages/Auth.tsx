// =====================================================
// Auth — Login, Register, Forgot, Role Select
//
// Phase-14.5 C6: dropped @ts-nocheck. All 6 exported pages plus the
// internal AuthShell / AuthField / AuthVisual* helpers + the 4
// Onboarding step components are typed. The form-state interfaces
// (LoginErrors, register inputs) live close to the component that
// owns them rather than at the top so reviewers don't have to chase.
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useRole, ROLES, type RoleId, type Role } from "../role";
import { apiRoleToLocal } from "../auth/role-map";
import { toFa } from "../shared";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client.js";
import type { Go } from "../router";
import { Button } from "../ui";

// R7.9 — apiRoleToLocal moved to apps/web/src/auth/role-map.ts so
// LoginPage and this legacy Auth.tsx share a single source of truth.
// The previous local copy mapped only 3 of 10 API roles, silently
// bucketing parent/org/ta/cm/support/moderator/super_admin as
// "student". That bug caused Gate A §5 + OWNER-FINDING-2.

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  sub: string;
  side: React.ReactNode;
}

const AuthShell = ({ children, eyebrow, title, sub, side }: AuthShellProps): React.ReactElement => (
  <main data-screen-label="Auth" style={{ minHeight: "calc(100vh - 64px)" }}>
    {/* Phase-16 Gate-2 smoke fix: the inline @media rule below used
        `.auth-grid` / `.auth-visual` class names that weren't actually
        attached to the divs — dead CSS, the visual panel never hid on
        mobile. That was the source of the iPhone-SE horizontal scroll
        on /login (a 400 px absolute decoration leaked past the
        viewport). Adding the class names + ensuring `display: grid`
        + `overflow: hidden` so the gradient & decoration stay
        contained. */}
    <div
      className="auth-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* form side */}
      <div className="flex flex-col justify-center"  style={{padding: "60px 40px", maxWidth: 560, width: "100%", margin: "0 auto"}}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="h-1 mt-4 mb-3" >{title}</h1>
        <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>{sub}</p>
        <div className="mt-9" >{children}</div>
      </div>

      {/* visual side */}
      <div
        className="auth-visual"
        style={{
          background: "linear-gradient(135deg, color-mix(in oklch, var(--accent) 18%, var(--bg)), color-mix(in oklch, var(--navy) 14%, var(--bg)))",
          borderRight: "1px solid var(--line)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {side}
      </div>
    </div>

    <style>{`
      @media (max-width: 980px) {
        .auth-grid { grid-template-columns: 1fr !important; }
        .auth-visual { display: none !important; }
      }
    `}</style>
  </main>
);

interface SocialBtnProps {
  icon: string;
  label: string;
}
const SocialBtn = ({ icon, label }: SocialBtnProps): React.ReactElement => (
  <Button variant="outline" className="justify-center flex-1" style={{ padding: "12px 14px"}}>
    <span className="rounded grid"  style={{width: 18, height: 18, background: "var(--fg)", color: "var(--bg)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700}}>{icon}</span>
    {label}
  </Button>
);

// =====================================================
// Login
// =====================================================
export interface AuthPageProps {
  go: Go;
}

interface LoginErrors {
  tenantSlug?: string;
  email?: string;
  password?: string;
  general?: string;
}

// Demo credentials seeded into the `demo` tenant. One user per role.
// Real credentials live in apps/api/src/prisma/seed.ts — these mirror
// it. If you rotate a password there, mirror it here. If you ship a
// non-demo tenant, the panel hides automatically (gated on tenantSlug).
//
// Documented at docs/DEMO_USERS.md.
const DEMO_CREDS: Record<RoleId, { email: string; password: string }> = {
  student:         { email: "student1@digiuniversity.ir",     password: "StudentPass!1" },
  instructor:      { email: "instructor1@digiuniversity.ir",  password: "InstructorPass!1" },
  admin:           { email: "admin@digiuniversity.ir",        password: "ChangeMe!2026" },
  parent:          { email: "parent1@digiuniversity.ir",      password: "ParentPass!1" },
  org:             { email: "org1@digiuniversity.ir",         password: "OrgPass!1" },
  // Phase-15 R7: seed.ts now ships demo users for the 5 new roles.
  // Documented at docs/DEMO_USERS.md (keep that in sync if you rotate
  // any of these — production .env overrides via SEED_*_PASSWORD).
  ta:              { email: "ta1@digiuniversity.ir",          password: "TaPass!1" },
  content_manager: { email: "cm1@digiuniversity.ir",          password: "ContentPass!1" },
  support:         { email: "support1@digiuniversity.ir",     password: "SupportPass!1" },
  moderator:       { email: "moderator1@digiuniversity.ir",   password: "ModeratorPass!1" },
  super_admin:     { email: "superadmin@digiuniversity.ir",   password: "SuperAdminPass!1" },
};

// Phase-A R5 — LoginPage redesigned. The legacy implementation below is
// kept in this file for reference but is no longer the default export. The
// new design lives in ./auth/LoginPage and is re-exported here so the
// router import (`import { LoginPage } from "./pages/Auth"`) still resolves
// without touching router.tsx.
import { LoginPage as R5LoginPage } from "./auth/LoginPage";
export const LoginPage = R5LoginPage;

const LegacyLoginPage = ({ go }: AuthPageProps): React.ReactElement => {
  const { setRole } = useRole();
  const auth = useAuth();
  const [roleId, setRoleId] = React.useState<RoleId>("student");
  const [tenantSlug, setTenantSlug] = React.useState("demo");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<LoginErrors>({});
  const [pending, setPending] = React.useState(false);

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
      window.toast?.({
        title: "خطا در ورود",
        msg: Object.values(errs)[0] ?? "ورودی نامعتبر است.",
        kind: "warn",
      });
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
      window.toast?.({ title: "خوش آمدید", msg: "با موفقیت وارد شدید.", kind: "success" });
      const target = ROLES[localRole]?.homeRoute || "dashboard";
      go(target);
    } catch (err) {
      // TS sees `err` as `unknown` under strict mode. Narrow before
      // reading `.message`. ApiError comes from api/client.js (untyped
      // .js) so we trust its `.displayMessage` field by isinstance.
      let msg = "خطای ناشناخته";
      if (err instanceof ApiError) {
        msg = (err as { displayMessage?: string }).displayMessage ?? msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrors({ general: msg });
      window.toast?.({ title: "ورود ناموفق", msg, kind: "warn" });
    } finally {
      setPending(false);
    }
  };

  const handleSocial = (id: string): void => {
    window.toast?.({
      title: "هنوز فعال نیست",
      msg: "ورود اجتماعی از " + id + " در فاز بعد پیاده‌سازی می‌شود.",
      kind: "info",
    });
  };

  return (
    <AuthShell
      eyebrow="WELCOME BACK · ورود"
      title="خوش آمدید"
      sub="با حساب خود وارد شوید. اگر هنوز ثبت‌نام نکرده‌اید، می‌توانید در کمتر از ۲ دقیقه شروع کنید."
      side={<AuthVisualLogin />}
    >
      {/* Role tabs — 5 roles */}
      <div className="mono mb-2.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>من به عنوان...</div>
      {/* Phase-A R1.3 B2: column count now driven purely by .login-role-tabs
          CSS (5 cols lg+, 2 cols <md). Inline gridTemplateColumns was
          fighting a flock of attribute-selector overrides in styles.css. */}
      <div className="grid gap-1 p-1 rounded-xl mb-6 login-role-tabs" style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
        {[
          ["student", "دانشجو", "user"],
          ["instructor", "استاد", "grad"],
          ["admin", "مدیر", "settings"],
          ["parent", "والد", "users"],
          ["org", "سازمان", "shield"],
        ].map(([id, lbl, ic]) => (
          <button className="rounded-lg cursor-pointer flex items-center justify-center" key={id} onClick={() => setRoleId(id as RoleId)} type="button"  style={{padding: "10px 4px",
            background: roleId === id ? "var(--surface)" : "transparent",
            border: "1px solid " + (roleId === id ? "var(--line-2)" : "transparent"),
            color: roleId === id ? "var(--fg)" : "var(--fg-mute)",
            fontSize: 11, fontWeight: 500, fontFamily: "inherit", gap: 5,
            boxShadow: roleId === id ? "var(--shadow-1)" : "none",
            transition: "all 160ms ease"}}>
            <Icon name={ic} size={12} />{lbl}
          </button>
        ))}
      </div>

      {/* Role-aware hint */}
      <div className="mb-6 rounded-lg flex items-center gap-2"  style={{ padding: "10px 14px", background: "var(--accent-soft)", fontSize: 12, color: "var(--accent)"}}>
        <Icon name="check" size={12} stroke={3} />
        {roleId === "student" && "پس از ورود به میز کار دانشجو می‌روید."}
        {roleId === "instructor" && "پس از ورود به کنسول استاد می‌روید."}
        {roleId === "admin" && "پس از ورود به میز مدیریت می‌روید."}
        {roleId === "parent" && "پس از ورود به پورتال والد می‌روید."}
        {roleId === "org" && "پس از ورود به میز سازمان می‌روید."}
      </div>

      {/* Phase-14.6 demo credentials panel. Only shown when the user
          is on the demo tenant — production tenants don't see it.
          One-click fills the email + password for the active role. */}
      {tenantSlug.trim().toLowerCase() === "demo" && (
        <div
          className="mb-6 rounded-xl"
          style={{
            padding: "14px 16px",
            background: "var(--surface-2)",
            border: "1px dashed var(--line-2)",
            fontSize: 12,
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span
              className="mono uppercase"
              style={{ color: "var(--fg-mute)", letterSpacing: "0.1em", fontSize: 10 }}
            >
              DEMO · حساب نمایشی برای {ROLES[roleId]?.label ?? roleId}
            </span>
            <button
              type="button"
              onClick={() => {
                const creds = DEMO_CREDS[roleId];
                setEmail(creds.email);
                setPassword(creds.password);
                setErrors({});
              }}
              style={{
                background: "var(--accent)",
                color: "var(--accent-on)",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontFamily: "inherit",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              پر کردن خودکار ←
            </button>
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              color: "var(--fg-mute)",
              direction: "ltr",
              textAlign: "left",
              lineHeight: 1.7,
            }}
          >
            <div>email · <strong style={{ color: "var(--fg)" }}>{DEMO_CREDS[roleId].email}</strong></div>
            <div>pass &nbsp;· <strong style={{ color: "var(--fg)" }}>{DEMO_CREDS[roleId].password}</strong></div>
          </div>
        </div>
      )}

      {/* Form */}
      <form className="flex flex-col gap-3.5" onSubmit={handleLogin}  noValidate>
        {errors.general && (
          <div className="rounded-lg flex items-center gap-2"
               style={{ padding: "10px 14px", background: "color-mix(in oklch, var(--warn) 20%, var(--bg))", border: "1px solid var(--warn)", fontSize: 13, color: "var(--warn)"}}>
            <Icon name="alert" size={14} />
            {errors.general}
          </div>
        )}
        <AuthField
          name="tenantSlug"
          autoComplete="organization"
          required
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value)}
          error={errors.tenantSlug}
          label="شناسه سازمان / Tenant"
          placeholder="demo"
          icon="shield"
        />
        <AuthField
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          label={roleId === "instructor" ? "ایمیل دانشگاهی یا کد عضو هیات علمی" :
                roleId === "admin" ? "ایمیل مدیر سامانه" :
                roleId === "org" ? "ایمیل سازمانی (SSO)" :
                "ایمیل یا کد دانشجویی"}
          placeholder={roleId === "instructor" ? "azimi@digiu.edu" :
                      roleId === "admin" ? "admin@digiuniversity.ir" :
                      roleId === "org" ? "sso@company.com" :
                      "you@example.com"}
          icon="user"
        />
        <AuthField
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          label="رمز عبور"
          placeholder="••••••••••"
          icon="lock"
          type="password"
          rightAction="فراموش کرده‌اید؟"
          onAction={() => go("forgot")}
        />

        <label className="flex items-center gap-2.5 mt-1.5 cursor-pointer"  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
          <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
          مرا به خاطر بسپار · احراز دومرحله‌ای فعال
        </label>

        <Button variant="primary" size="lg" className="mt-4 justify-center" type="submit" disabled={pending} >
          {pending ? "در حال ورود..." : "ورود به حساب"}
          {!pending && <Icon name="arrow" size={16} />}
        </Button>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-4"  style={{ margin: "28px 0", color: "var(--fg-dim)", fontSize: 12, fontFamily: "var(--f-mono)"}}>
        <div className="flex-1"  style={{ height: 1, background: "var(--line)"}}></div>
        OR · یا
        <div className="flex-1"  style={{ height: 1, background: "var(--line)"}}></div>
      </div>

      <div className="flex gap-2.5" >
        <button type="button" onClick={() => handleSocial("google")} className="btn btn-outline justify-center flex-1"  style={{ padding: "12px 14px"}}>
          <span className="rounded grid"  style={{width: 18, height: 18, background: "var(--fg)", color: "var(--bg)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700}}>G</span>
          گوگل
        </button>
        <button type="button" onClick={() => handleSocial("ssa")} className="btn btn-outline justify-center flex-1"  style={{ padding: "12px 14px"}}>
          <span className="rounded grid"  style={{width: 18, height: 18, background: "var(--fg)", color: "var(--bg)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700}}>در</span>
          درگاه ملی
        </button>
        <button type="button" onClick={() => handleSocial("sso")} className="btn btn-outline justify-center flex-1"  style={{ padding: "12px 14px"}}>
          <span className="rounded grid"  style={{width: 18, height: 18, background: "var(--fg)", color: "var(--bg)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700}}>SSO</span>
          سازمان
        </button>
      </div>

      <div className="mt-7 p-4 rounded-xl flex items-center gap-2.5"  style={{ background: "var(--accent-soft)", fontSize: 13, color: "var(--accent)"}}>
        <Icon name="sparkle" size={14} />
        <div>
          حساب کاربری ندارید؟{" "}
          <a href="/register" onClick={(e) => { e.preventDefault(); go("register"); }} style={{ fontWeight: 600, textDecoration: "underline" }}>
            همین حالا بسازید
          </a>
        </div>
      </div>
    </AuthShell>
  );
};

const AuthVisualLogin = (): React.ReactElement => (
  <div className="p-15 flex flex-col justify-between relative"  style={{ height: "100%"}}>
    {/* Floating quote card */}
    <div className="rounded-2xl p-7"  style={{background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-paper)", maxWidth: 420}}>
      <div className="flex gap-1 mb-4.5" >
        {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={14} />)}
      </div>
      <p style={{ fontSize: 18, lineHeight: 1.7, fontFamily: "var(--f-display)", color: "var(--fg)" }}>
        "اولین باری بود که حس کردم یک دستیار آموزشی واقعی دارم. پروفایل شناختی می‌داند کجا گیر کرده‌ام و چه باید بکنم."
      </p>
      <div className="flex items-center gap-3 mt-5 pt-5"  style={{ borderTop: "1px solid var(--line)"}}>
        <div className="avatar cyan" style={{ width: 40, height: 40 }}>نر</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>نسرین رضوی</div>
          <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>کارشناسی ارشد · علوم داده</div>
        </div>
      </div>
    </div>

    {/* Big serif quote */}
    <div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--fg)" }}>
        یادگیری شخصی،<br />
        <span style={{ color: "var(--accent)" }}>در مقیاس دانشگاه</span>
      </div>
      <div className="mt-7"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em"}}>
        ۲.۴M+ رویداد یادگیری · ۹۹.۹٪ uptime
      </div>
    </div>

    {/* Decorative concentric */}
    <div className="absolute rounded-full"  style={{ bottom: -100, right: -100,
      width: 400, height: 400,
      background: "radial-gradient(circle, transparent 30%, color-mix(in oklch, var(--accent) 8%, transparent) 31%, transparent 32%, color-mix(in oklch, var(--accent) 6%, transparent) 50%, transparent 51%)",
      pointerEvents: "none"}} />
  </div>
);

// =====================================================
// Register
// =====================================================
export const RegisterPage = ({ go }: AuthPageProps): React.ReactElement => {
  const { setRole } = useRole();
  const [roleId, setRoleId] = React.useState<RoleId>("student");

  const handleRegister = (e: React.FormEvent): void => {
    e.preventDefault();
    setRole(roleId);
    go("verify-email");
  };

  return (
    <AuthShell
      eyebrow="JOIN · ثبت‌نام"
      title="حساب کاربری بسازید"
      sub="دو دقیقه طول می‌کشد. به همه‌ی برنامه‌ها، دستیارهای هوشمند و کلاس‌های زنده دسترسی خواهید داشت."
      side={<AuthVisualRegister />}
    >
      {/* Role select */}
      <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>من به عنوان...</div>
      <div className="grid gap-2.5 mb-7"  style={{ gridTemplateColumns: "1fr 1fr"}}>
        {[
          { id: "student", t: "دانشجو", d: "یادگیری، آزمون و گواهی", ic: "user" },
          { id: "instructor", t: "استاد", d: "تدریس و طراحی درس با AI", ic: "grad" },
          { id: "org", t: "سازمان", d: "آموزش تیم با مدیریت مرکزی", ic: "shield" },
          { id: "parent", t: "والد", d: "نظارت بر یادگیری فرزند", ic: "users" },
        ].map((r) => (
          <button className="p-4.5 rounded-xl text-right cursor-pointer flex items-start gap-3" key={r.id} onClick={() => setRoleId(r.id as RoleId)} type="button"  style={{
            background: roleId === r.id ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (roleId === r.id ? "var(--accent)" : "var(--line)"),
            fontFamily: "inherit",
            color: "var(--fg)",
            transition: "all 160ms ease"}}>
            <div className="rounded-lg grid"  style={{width: 36, height: 36,
              background: roleId === r.id ? "var(--accent)" : "var(--surface-2)",
              color: roleId === r.id ? "var(--accent-on)" : "var(--fg-mute)", placeItems: "center", flexShrink: 0}}><Icon name={r.ic} size={16} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.t}</div>
              <div className="mt-1"  style={{fontSize: 11, color: "var(--fg-mute)"}}>{r.d}</div>
            </div>
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={handleRegister} >
        <div className="grid gap-2.5"  style={{ gridTemplateColumns: "1fr 1fr"}}>
          <AuthField label="نام" placeholder="نسرین" icon="user" />
          <AuthField label="نام خانوادگی" placeholder="رضوی" />
        </div>
        <AuthField label="ایمیل" placeholder="nasrin@example.com" icon="user" />
        <AuthField label="رمز عبور" placeholder="حداقل ۸ کاراکتر" icon="lock" type="password" />

        <PasswordStrength />

        <label className="flex items-start gap-2.5 mt-1.5 cursor-pointer"  style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6}}>
          <input className="mt-0.5" type="checkbox" defaultChecked  style={{accentColor: "var(--accent)", width: 16, height: 16, flexShrink: 0}} />
          با{" "}
          <a
            href="/honor-code"
            onClick={(e) => { e.preventDefault(); go("honor-code"); }}
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >قوانین استفاده</a>
          {" "}و{" "}
          <a
            href="/help"
            onClick={(e) => { e.preventDefault(); go("help"); }}
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >سیاست حریم خصوصی</a>
          {" "}موافق هستم.
        </label>

        <Button variant="primary" size="lg" className="mt-3 justify-center" type="submit" >
          ساخت حساب و ادامه
          <Icon name="arrow" size={16} />
        </Button>
      </form>

      <div className="mt-6 text-center"  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <a href="/login" onClick={(e) => { e.preventDefault(); go("login"); }} style={{ color: "var(--accent)", fontWeight: 500 }}>
          ورود به حساب
        </a>
      </div>
    </AuthShell>
  );
};

const AuthVisualRegister = (): React.ReactElement => (
  <div className="p-15 flex flex-col justify-center gap-8"  style={{ height: "100%"}}>
    <div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--fg)" }}>
        به دانشگاهی بپیوندید که<br />
        <span style={{ color: "var(--accent)" }}>هرگز نمی‌خوابد</span>
      </div>
    </div>

    <div className="flex flex-col gap-3" >
      {[
        ["دستیار شخصی ۲۴/۷", "هر سوال، هر زمان", "sparkle"],
        ["گواهی قابل اثبات", "Open Badges 3.0 · Verifiable", "cert"],
        ["شخصی‌سازی واقعی", "بر اساس نحوه‌ی یادگیری شما", "target"],
        ["پروژه عملی واقعی", "روی کد، داده و چالش‌های واقعی", "code"],
      ].map(([t, s, ic], i) => (
        <div className="flex items-center gap-4 p-4.5 rounded-xl" key={i}  style={{ background: "var(--surface)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-1)"}}>
          <div className="rounded-xl grid"  style={{width: 40, height: 40, background: "var(--accent-soft)", color: "var(--accent)", placeItems: "center", flexShrink: 0}}>
            <Icon name={ic} size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
            <div className="mt-0.5"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{s}</div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}>
      ۸,۴۰۰+ دانشجوی فعال · ۹۴ استاد · ۶ برنامه
    </div>
  </div>
);

const PasswordStrength = (): React.ReactElement => (
  <div>
    <div className="flex gap-1 mt-1.5" >
      {[1, 2, 3, 4].map((i) => (
        <div className="flex-1 rounded-full" key={i}  style={{ height: 4,
          background: i <= 3 ? "var(--accent)" : "var(--surface-3)"}} />
      ))}
    </div>
    <div className="mt-1.5"  style={{fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)"}}>
      قدرت: قوی · شامل حرف بزرگ، عدد، نماد
    </div>
  </div>
);

// =====================================================
// Forgot password
// =====================================================
export const ForgotPage = ({ go }: AuthPageProps): React.ReactElement => (
  <AuthShell
    eyebrow="RECOVERY · بازیابی"
    title="رمز را فراموش کرده‌اید؟"
    sub="ایمیل خود را وارد کنید. یک لینک امن یک‌بار مصرف برای بازنشانی برای شما ارسال می‌کنیم."
    side={<AuthVisualLogin />}
  >
    <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); }} >
      <AuthField label="ایمیل ثبت‌شده" placeholder="nasrin@example.com" icon="user" />
      <Button variant="primary" size="lg" className="mt-3.5 justify-center" type="submit" >
        ارسال لینک بازیابی
        <Icon name="send" size={16} />
      </Button>
    </form>
    <div className="mt-7 p-4 rounded-xl"  style={{ background: "var(--navy-soft)", fontSize: 12, color: "var(--navy)", lineHeight: 1.6}}>
      <strong>امن:</strong> لینک‌های بازیابی فقط ۱۵ دقیقه اعتبار دارند و فقط یک بار قابل استفاده‌اند. در صورت سواستفاده، فوراً به امنیت گزارش می‌شود.
    </div>
    <div className="mt-5 text-center"  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
      رمز خود را به یاد آوردید؟{" "}
      <a href="/login" onClick={(e) => { e.preventDefault(); go("login"); }} style={{ color: "var(--accent)", fontWeight: 500 }}>
        بازگشت به ورود
      </a>
    </div>
  </AuthShell>
);

// =====================================================
// Shared Auth Field
// =====================================================
interface AuthFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  icon?: string;
  rightAction?: string;
  onAction?: () => void;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  error?: string;
  name?: string;
  autoComplete?: string;
}
const AuthField = ({
  label,
  placeholder,
  type = "text",
  icon,
  rightAction,
  onAction,
  value,
  onChange,
  required,
  error,
  name,
  autoComplete,
}: AuthFieldProps): React.ReactElement => {
  const id = "f-" + (name || label.replace(/\s+/g, "-"));
  return (
    <label className="block"  htmlFor={id}>
      <div className="flex justify-between mb-2" >
        <span className="mono uppercase"  style={{color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.1em"}}>{label}{required && <span className="me-1"  style={{color: "var(--rose)"}}> *</span>}</span>
        {rightAction && (
          <button className="cursor-pointer" onClick={onAction} type="button"  style={{background: "none", border: "none", color: "var(--accent)", fontSize: 11, fontFamily: "var(--f-mono)"}}>{rightAction}</button>
        )}
      </div>
      <div className="relative" >
        {icon && <span className="absolute"  style={{ right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-dim)"}}><Icon name={icon} size={16} /></span>}
        <input className="rounded-xl"
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? id + "-err" : undefined}
           style={{width: "100%",
            background: "var(--surface)",
            border: "1px solid " + (error ? "var(--rose)" : "var(--line-2)"),
            padding: icon ? "12px 42px 12px 14px" : "12px 14px",
            color: "var(--fg)",
            fontFamily: "inherit",
            fontSize: 14}}
        />
      </div>
      {error && <div className="mt-1.5" id={id + "-err"}  style={{color: "var(--rose)", fontSize: 12}}>{error}</div>}
    </label>
  );
};



// =====================================================
// Email Verification
// =====================================================
export const VerifyEmailPage = ({ go }: AuthPageProps): React.ReactElement => {
  const [code, setCode] = React.useState<string[]>(["", "", "", "", "", ""]);
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (i: number, v: string): void => {
    const cleaned = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = cleaned;
    setCode(next);
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <AuthShell
      eyebrow="VERIFY · تأیید ایمیل"
      title="ایمیل خود را تأیید کنید"
      sub="یک کد ۶ رقمی به ایمیل شما ارسال کردیم. این کد ۱۰ دقیقه اعتبار دارد."
      side={<AuthVisualLogin />}
    >
      <div className="p-4.5 rounded-xl mb-7 flex items-center gap-3"  style={{ background: "var(--accent-soft)"}}>
        <Icon name="send" size={16} />
        <div style={{ fontSize: 13, color: "var(--accent)" }}>
          کد به <strong>n***@example.com</strong> ارسال شد
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); go("2fa-setup"); }}>
        <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>کد ۶ رقمی</div>
        <div className="grid gap-2.5 mb-7"  style={{ gridTemplateColumns: "repeat(6, 1fr)", direction: "ltr"}}>
          {code.map((c, i) => (
            <input className="rounded-xl text-center"
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={c}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              inputMode="numeric"
              maxLength={1}
               style={{width: "100%", aspectRatio: "1",
                background: "var(--surface)",
                border: "1px solid var(--line-2)",
                fontFamily: "var(--f-mono)",
                fontSize: 28, fontWeight: 600,
                color: "var(--fg)"}}
            />
          ))}
        </div>

        <Button variant="primary" size="lg" className="justify-center" type="submit"  style={{width: "100%"}}>
          تأیید و ادامه
          <Icon name="arrow" size={16} />
        </Button>
      </form>

      <div className="mt-6 text-center"  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
        کد را دریافت نکردید؟{" "}
        <button className="cursor-pointer"  style={{color: "var(--accent)", fontWeight: 500, background: "none", border: "none", fontFamily: "inherit", fontSize: 13}}>
          ارسال مجدد در ۰:۴۲
        </button>
      </div>

      <div className="mt-4 p-3.5 rounded-xl"  style={{ background: "var(--surface-2)", fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6}}>
        <strong>نکته:</strong> اگر ایمیل را در inbox پیدا نکردید، spam را بررسی کنید یا{" "}
        <button
          type="button"
          onClick={() => go("register")}
          style={{ color: "var(--accent)", background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer", textDecoration: "underline" }}
        >ایمیل را تغییر دهید</button>.
      </div>
    </AuthShell>
  );
};

// =====================================================
// 2FA Setup
// =====================================================
type TwoFactorMethod = "app" | "key" | "sms";

export const TwoFactorPage = ({ go }: AuthPageProps): React.ReactElement => {
  const [method, setMethod] = React.useState<TwoFactorMethod>("app");

  return (
    <AuthShell
      eyebrow="SECURITY · امنیت دومرحله‌ای"
      title="یک لایه‌ی امنیت اضافه کنید"
      sub="احراز هویت دومرحله‌ای از حساب شما در برابر دسترسی غیرمجاز محافظت می‌کند."
      side={<AuthVisualSecurity />}
    >
      <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>روش احراز دومرحله‌ای</div>
      <div className="flex flex-col gap-2.5 mb-7" >
        {[
          { id: "app", t: "اپلیکیشن Authenticator", d: "Google Authenticator، Authy، 1Password — توصیه می‌شود", ic: "chip", reco: true },
          { id: "key", t: "کلید سخت‌افزاری FIDO2", d: "YubiKey، SoloKey — بالاترین سطح امنیت", ic: "shield" },
          { id: "sms", t: "پیامک", d: "کد یک‌بار مصرف به شماره تماس شما", ic: "bell" },
        ].map((m) => (
          <button className="p-4.5 rounded-xl flex items-center gap-3.5 text-right cursor-pointer" key={m.id} onClick={() => setMethod(m.id as TwoFactorMethod)} type="button"  style={{
            background: method === m.id ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (method === m.id ? "var(--accent)" : "var(--line)"), fontFamily: "inherit", color: "var(--fg)"}}>
            <div className="rounded-lg grid"  style={{width: 40, height: 40, background: method === m.id ? "var(--accent)" : "var(--surface-2)", color: method === m.id ? "var(--accent-on)" : "var(--fg-mute)", placeItems: "center", flexShrink: 0}}>
              <Icon name={m.ic} size={16} />
            </div>
            <div className="flex-1" >
              <div className="flex items-center gap-2"  style={{fontSize: 14, fontWeight: 600}}>
                {m.t}
                {m.reco && <span className="pill pill-cyan" style={{ fontSize: 9 }}>پیشنهادی</span>}
              </div>
              <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{m.d}</div>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: 50, border: "2px solid " + (method === m.id ? "var(--accent)" : "var(--line-2)"), background: method === m.id ? "var(--accent)" : "transparent", flexShrink: 0 }}></div>
          </button>
        ))}
      </div>

      {/* QR code preview for app method */}
      {method === "app" && (
        <div className="card p-6 grid gap-6 items-center mb-7"  style={{ gridTemplateColumns: "180px 1fr"}}>
          <div className="rounded-xl relative grid"  style={{width: 180, height: 180,
            background: "var(--surface-2)",
            border: "1px solid var(--line)", placeItems: "center"}}>
            <div className="absolute"  style={{ inset: 14,
              background: `
                linear-gradient(90deg, var(--fg) 33%, transparent 33% 66%, var(--fg) 66%) 0 0 / 12px 12px,
                linear-gradient(var(--fg) 33%, transparent 33% 66%, var(--fg) 66%) 0 0 / 12px 12px`,
              backgroundColor: "transparent",
              backgroundBlendMode: "multiply"}}></div>
            <span className="absolute"  style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--fg-mute)"}}>QR</span>
          </div>
          <div>
            <div className="mono mb-2"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>گام ۱</div>
            <div className="mb-3.5"  style={{fontSize: 13, lineHeight: 1.6}}>این QR را با Google Authenticator اسکن کنید.</div>
            <div className="mono mb-2"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>یا کلید را به‌صورت دستی وارد کنید</div>
            <div className="rounded-md text-left"  style={{fontFamily: "var(--f-mono)", fontSize: 12, padding: "8px 12px", background: "var(--surface-2)", direction: "ltr", letterSpacing: "0.05em"}}>
              JBSW Y3DP EHPK 3PXP
            </div>
          </div>
        </div>
      )}

      {/* Verify code entry */}
      <div className="mono mb-2.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>گام ۲ · کد ۶ رقمی نشان داده شده</div>
      <div className="flex gap-2.5 mb-7" >
        <input className="flex-1 text-center rounded-xl" placeholder="۱۲۳۴۵۶"  style={{ padding: "14px 18px", fontFamily: "var(--f-mono)", fontSize: 18, letterSpacing: "0.3em", background: "var(--surface)", border: "1px solid var(--line-2)"}} />
        <Button variant="primary" size="lg" onClick={() => go("onboarding")}>
          فعال‌سازی
          <Icon name="check" size={16} stroke={3} />
        </Button>
      </div>

      <button className="cursor-pointer" onClick={() => go("onboarding")}  style={{background: "none", border: "none", color: "var(--fg-mute)", fontSize: 13, fontFamily: "inherit"}}>
        فعلاً بگذار بعد · رفتن به داشبورد
      </button>
    </AuthShell>
  );
};

const AuthVisualSecurity = (): React.ReactElement => (
  <div className="p-15 flex flex-col justify-center gap-8"  style={{ height: "100%"}}>
    <div>
      <div className="rounded-2xl grid mb-8"  style={{width: 80, height: 80, background: "var(--accent)", placeItems: "center"}}>
        <Icon name="shield" size={36} stroke={2} />
      </div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
        امنیت در اولویت<br />
        <span style={{ color: "var(--accent)" }}>از روز اول</span>
      </div>
    </div>
    <div className="flex flex-col gap-3" >
      {[
        ["رمزنگاری End-to-End", "همه‌ی داده‌ها از مبدأ به مقصد رمز می‌شوند"],
        ["نشست‌های قابل کنترل", "می‌توانید هر نشست را از راه دور خارج کنید"],
        ["گزارش امنیتی هفتگی", "خلاصه‌ی فعالیت‌های مشکوک به ایمیل"],
      ].map(([t, d], i) => (
        <div key={i} className="card-flat p-3.5 flex items-start gap-2.5" >
          <span style={{ color: "var(--accent)", marginTop: 3, display: "inline-flex" }}>
            <Icon name="check" size={14} stroke={3} />
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
            <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =====================================================
// Onboarding Wizard — after register, before dashboard
// =====================================================
export const OnboardingPage = ({ go }: AuthPageProps): React.ReactElement => {
  const { role } = useRole();
  const [step, setStep] = React.useState(1);
  const steps: readonly string[] = ["تعیین سطح", "علایق", "هدف‌گذاری", "آماده‌ایم"];

  const handleNext = (): void => {
    if (step < steps.length) setStep(step + 1);
    else go(role.homeRoute);
  };

  return (
    <main className="flex items-center justify-center p-10" data-screen-label="Onboarding"  style={{minHeight: "calc(100vh - 64px)"}}>
      <div style={{ maxWidth: 720, width: "100%" }}>
        {/* Progress */}
        <div className="flex gap-1.5 mb-8" >
          {steps.map((s, i) => (
            <div className="flex-1 rounded-full" key={i}  style={{ height: 4,
              background: i < step ? "var(--accent)" : "var(--surface-3)"}}></div>
          ))}
        </div>

        <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>
          گام {toFa(step)} از {toFa(steps.length)} · {steps[step - 1]}
        </div>

        {step === 1 && <OnboardLevel onNext={handleNext} />}
        {step === 2 && <OnboardInterests onNext={handleNext} />}
        {step === 3 && <OnboardGoals onNext={handleNext} />}
        {step === 4 && <OnboardReady onNext={handleNext} role={role} />}
      </div>
    </main>
  );
};

interface OnboardStepProps {
  onNext: () => void;
}

const OnboardLevel = ({ onNext }: OnboardStepProps): React.ReactElement => {
  const [level, setLevel] = React.useState(2);
  return (
    <div>
      <h1 className="h-1 mb-3.5" >سطح فعلی شما در یادگیری ماشین؟</h1>
      <p className="mb-9"  style={{color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6}}>
        این کمک می‌کند برنامه‌ی شخصی‌سازی‌شده‌ای برای شما بسازیم. بدون نگرانی — می‌توانید بعداً تغییر دهید.
      </p>
      <div className="flex flex-col gap-3" >
        {[
          { v: 1, t: "تازه‌کار", d: "هیچ تجربه‌ای ندارم، می‌خواهم از صفر شروع کنم" },
          { v: 2, t: "مقدماتی", d: "با مفاهیم پایه آشنا هستم، Python بلدم" },
          { v: 3, t: "متوسط", d: "چند مدل کلاسیک پیاده کرده‌ام، با scikit-learn کار کردم" },
          { v: 4, t: "پیشرفته", d: "روی deep learning کار می‌کنم، با PyTorch/TF تجربه دارم" },
          { v: 5, t: "حرفه‌ای", d: "تجربه‌ی صنعتی یا پژوهشی دارم" },
        ].map((l) => (
          <button className="p-4.5 rounded-xl text-right cursor-pointer flex items-center gap-4" key={l.v} onClick={() => setLevel(l.v)} type="button"  style={{
            background: level === l.v ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (level === l.v ? "var(--accent)" : "var(--line)"), fontFamily: "inherit", color: "var(--fg)"}}>
            <div className="rounded-lg grid"  style={{width: 36, height: 36, background: level === l.v ? "var(--accent)" : "var(--surface-2)", color: level === l.v ? "var(--accent-on)" : "var(--fg-mute)", placeItems: "center", fontFamily: "var(--f-mono)", fontWeight: 700, flexShrink: 0}}>
              L{toFa(l.v)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{l.t}</div>
              <div className="mt-1"  style={{fontSize: 13, color: "var(--fg-mute)"}}>{l.d}</div>
            </div>
          </button>
        ))}
      </div>
      <Button variant="primary" size="lg" className="mt-8 justify-center" onClick={onNext}  style={{ width: "100%"}}>
        ادامه
        <Icon name="arrow" size={16} />
      </Button>
    </div>
  );
};

const OnboardInterests = ({ onNext }: OnboardStepProps): React.ReactElement => {
  const [selected, setSelected] = React.useState(["nlp", "data"]);
  const tags = [
    { id: "nlp", t: "پردازش زبان طبیعی" },
    { id: "vision", t: "بینایی ماشین" },
    { id: "data", t: "علوم داده" },
    { id: "stats", t: "آمار و احتمالات" },
    { id: "rl", t: "یادگیری تقویتی" },
    { id: "sys", t: "سیستم‌های توزیع‌شده" },
    { id: "se", t: "مهندسی نرم‌افزار" },
    { id: "pm", t: "مدیریت محصول" },
    { id: "ux", t: "تجربه کاربری" },
    { id: "ethics", t: "اخلاق AI" },
    { id: "math", t: "ریاضیات کاربردی" },
    { id: "lin", t: "زبان‌شناسی محاسباتی" },
  ];
  const toggle = (id: string): void => setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  return (
    <div>
      <h1 className="h-1 mb-3.5" >چه چیزی برای شما جذاب است؟</h1>
      <p className="mb-9"  style={{color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6}}>
        حداقل ۳ علاقه انتخاب کنید. بر اساس این، دروس، مقالات و رویدادها پیشنهاد می‌شود.
      </p>
      <div className="flex flex-wrap gap-2 mb-8" >
        {tags.map((t) => (
          <button className="rounded-full cursor-pointer" key={t.id} onClick={() => toggle(t.id)} type="button"  style={{padding: "10px 18px",
            background: selected.includes(t.id) ? "var(--accent)" : "var(--surface)",
            border: "1px solid " + (selected.includes(t.id) ? "var(--accent)" : "var(--line-2)"),
            color: selected.includes(t.id) ? "var(--accent-on)" : "var(--fg)",
            fontFamily: "inherit", fontSize: 14,
            transition: "all 160ms ease"}}>{t.t}</button>
        ))}
      </div>
      <div className="flex justify-between items-center" >
        <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>{toFa(selected.length)} انتخاب شده</span>
        <Button variant="primary" size="lg" onClick={onNext} disabled={selected.length < 3} style={{ opacity: selected.length >= 3 ? 1 : 0.5 }}>
          ادامه
          <Icon name="arrow" size={16} />
        </Button>
      </div>
    </div>
  );
};

const OnboardGoals = ({ onNext }: OnboardStepProps): React.ReactElement => {
  const [goal, setGoal] = React.useState("career");
  return (
    <div>
      <h1 className="h-1 mb-3.5" >هدف اصلی شما چیست؟</h1>
      <p className="mb-9"  style={{color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6}}>
        این نحوه‌ی پیشنهاد دروس را تنظیم می‌کند.
      </p>
      <div className="grid gap-3"  style={{ gridTemplateColumns: "1fr 1fr"}}>
        {[
          { id: "career", t: "تغییر مسیر شغلی", d: "ورود به حوزه‌ی AI/Data", ic: "bolt" },
          { id: "promo", t: "رشد در شغل فعلی", d: "ارتقا و مهارت‌های جدید", ic: "trophy" },
          { id: "research", t: "پژوهش آکادمیک", d: "آماده‌سازی برای دکتری", ic: "flask" },
          { id: "project", t: "ساخت یک پروژه", d: "ایده‌ی شخصی یا استارتاپ", ic: "code" },
          { id: "curiosity", t: "کنجکاوی شخصی", d: "می‌خواهم بدانم چگونه کار می‌کند", ic: "sparkle" },
          { id: "cert", t: "گواهی برای کارفرما", d: "نیاز به مدرک رسمی دارم", ic: "cert" },
        ].map((g) => (
          <button className="p-5.5 rounded-xl text-right cursor-pointer flex flex-col gap-2.5" key={g.id} onClick={() => setGoal(g.id)} type="button"  style={{
            background: goal === g.id ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (goal === g.id ? "var(--accent)" : "var(--line)"), fontFamily: "inherit", color: "var(--fg)"}}>
            <div className="rounded-lg grid"  style={{width: 36, height: 36, background: goal === g.id ? "var(--accent)" : "var(--surface-2)", color: goal === g.id ? "var(--accent-on)" : "var(--fg-mute)", placeItems: "center"}}>
              <Icon name={g.ic} size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{g.t}</div>
              <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{g.d}</div>
            </div>
          </button>
        ))}
      </div>
      <Button variant="primary" size="lg" className="mt-8 justify-center" onClick={onNext}  style={{ width: "100%"}}>
        ادامه
        <Icon name="arrow" size={16} />
      </Button>
    </div>
  );
};

interface OnboardReadyProps extends OnboardStepProps {
  role: Role;
}
const OnboardReady = ({ onNext, role }: OnboardReadyProps): React.ReactElement => (
  <div className="text-center"  style={{ padding: "40px 0"}}>
    <div className="rounded-full grid"  style={{width: 100, height: 100, margin: "0 auto",
      background: "var(--accent)",
      color: "var(--accent-on)", placeItems: "center"}}>
      <Icon name="check" size={48} stroke={2.5} />
    </div>
    <h1 className="h-1 mt-8" >پروفایل شما ساخته شد</h1>
    <p className="mt-4"  style={{color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: "16px auto 0"}}>
      پروفایل شناختی اولیه‌ی شما با بیش از ۲۴ شاخص ساخته شد. AI آماده است تا مسیر یادگیری شخصی شما را پیشنهاد دهد.
    </p>
    <div className="card p-6 mt-8 text-right"  style={{ maxWidth: 480, margin: "32px auto 0"}}>
      <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>پیشنهاد اول</div>
      <h3 style={{ fontSize: 17 }}>مبانی یادگیری ماشین — CS-410</h3>
      <div className="mt-1.5"  style={{fontSize: 13, color: "var(--fg-mute)"}}>دکتر آرش عظیمی · ۱۲ هفته · با تسلط ۹۲٪ احتمال موفقیت</div>
    </div>
    <Button variant="primary" size="lg" className="mt-8" onClick={onNext} >
      شروع یادگیری
      <Icon name="arrow" size={16} />
    </Button>
  </div>
);

export default LoginPage;
