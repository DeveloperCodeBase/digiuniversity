// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Auth — Login, Register, Forgot, Role Select
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useRole, ROLES } from "../role";
import { toFa } from "../shared";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client.js";

// Map API role names → local RoleProvider role IDs. The seed gives the
// admin user the "admin" role; self-registered accounts get "student".
const apiRoleToLocal = (roles) => {
  if (!roles || roles.length === 0) return "student";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("student")) return "student";
  return roles[0];
};

const AuthShell = ({ children, eyebrow, title, sub, side }) => (
  <main data-screen-label="Auth" style={{ minHeight: "calc(100vh - 64px)" }}>
    <div  style={{ gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 64px)"}}>
      {/* form side */}
      <div className="flex flex-col justify-center"  style={{padding: "60px 40px", maxWidth: 560, width: "100%", margin: "0 auto"}}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="h-1 mt-4 mb-3" >{title}</h1>
        <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>{sub}</p>
        <div className="mt-9" >{children}</div>
      </div>

      {/* visual side */}
      <div  style={{
        background: "linear-gradient(135deg, color-mix(in oklch, var(--accent) 18%, var(--bg)), color-mix(in oklch, var(--navy) 14%, var(--bg)))",
        borderRight: "1px solid var(--line)"}}>
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

const SocialBtn = ({ icon, label }) => (
  <button className="btn btn-outline justify-center flex-1"  style={{ padding: "12px 14px"}}>
    <span className="rounded grid"  style={{width: 18, height: 18, background: "var(--fg)", color: "var(--bg)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700}}>{icon}</span>
    {label}
  </button>
);

// =====================================================
// Login
// =====================================================
export const LoginPage = ({ go }) => {
  const { setRole } = useRole();
  const auth = useAuth();
  const [roleId, setRoleId] = React.useState("student");
  const [tenantSlug, setTenantSlug] = React.useState("demo");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [pending, setPending] = React.useState(false);

  const validate = () => {
    const e = {};
    if (!tenantSlug.trim()) e.tenantSlug = "شناسه سازمان الزامی است.";
    if (!email.trim()) e.email = "ایمیل/کد کاربری الزامی است.";
    else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "فرمت ایمیل صحیح نیست.";
    if (!password) e.password = "رمز عبور الزامی است.";
    else if (password.length < 8) e.password = "رمز عبور حداقل ۸ کاراکتر باشد.";
    return e;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      window.toast?.({ title: "خطا در ورود", msg: Object.values(errs)[0], kind: "warn" });
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
      const msg = err instanceof ApiError ? err.displayMessage : (err?.message || "خطای ناشناخته");
      setErrors({ general: msg });
      window.toast?.({ title: "ورود ناموفق", msg, kind: "warn" });
    } finally {
      setPending(false);
    }
  };

  const handleSocial = (id) => {
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
      <div className="grid gap-1 p-1 rounded-xl mb-6 login-role-tabs"  style={{ gridTemplateColumns: "repeat(5, 1fr)", background: "var(--surface-2)", border: "1px solid var(--line)"}}>
        {[
          ["student", "دانشجو", "user"],
          ["instructor", "استاد", "grad"],
          ["admin", "مدیر", "settings"],
          ["parent", "والد", "users"],
          ["org", "سازمان", "shield"],
        ].map(([id, lbl, ic]) => (
          <button className="rounded-lg cursor-pointer flex items-center justify-center" key={id} onClick={() => setRoleId(id)} type="button"  style={{padding: "10px 4px",
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

        <button type="submit" disabled={pending} className="btn btn-primary btn-lg mt-4 justify-center" >
          {pending ? "در حال ورود..." : "ورود به حساب"}
          {!pending && <Icon name="arrow" size={16} />}
        </button>
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
          <a href="#register" onClick={(e) => { e.preventDefault(); go("register"); }} style={{ fontWeight: 600, textDecoration: "underline" }}>
            همین حالا بسازید
          </a>
        </div>
      </div>
    </AuthShell>
  );
};

const AuthVisualLogin = () => (
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
export const RegisterPage = ({ go }) => {
  const { setRole } = useRole();
  const [roleId, setRoleId] = React.useState("student");

  const handleRegister = (e) => {
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
          <button className="p-4.5 rounded-xl text-right cursor-pointer flex items-start gap-3" key={r.id} onClick={() => setRoleId(r.id)} type="button"  style={{
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
            href="#honor-code"
            onClick={(e) => { e.preventDefault(); go("honor-code"); }}
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >قوانین استفاده</a>
          {" "}و{" "}
          <a
            href="#help"
            onClick={(e) => { e.preventDefault(); go("help"); }}
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >سیاست حریم خصوصی</a>
          {" "}موافق هستم.
        </label>

        <button type="submit" className="btn btn-primary btn-lg mt-3 justify-center" >
          ساخت حساب و ادامه
          <Icon name="arrow" size={16} />
        </button>
      </form>

      <div className="mt-6 text-center"  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <a href="#login" onClick={(e) => { e.preventDefault(); go("login"); }} style={{ color: "var(--accent)", fontWeight: 500 }}>
          ورود به حساب
        </a>
      </div>
    </AuthShell>
  );
};

const AuthVisualRegister = () => (
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

const PasswordStrength = () => (
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
export const ForgotPage = ({ go }) => (
  <AuthShell
    eyebrow="RECOVERY · بازیابی"
    title="رمز را فراموش کرده‌اید؟"
    sub="ایمیل خود را وارد کنید. یک لینک امن یک‌بار مصرف برای بازنشانی برای شما ارسال می‌کنیم."
    side={<AuthVisualLogin />}
  >
    <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); }} >
      <AuthField label="ایمیل ثبت‌شده" placeholder="nasrin@example.com" icon="user" />
      <button type="submit" className="btn btn-primary btn-lg mt-3.5 justify-center" >
        ارسال لینک بازیابی
        <Icon name="send" size={16} />
      </button>
    </form>
    <div className="mt-7 p-4 rounded-xl"  style={{ background: "var(--navy-soft)", fontSize: 12, color: "var(--navy)", lineHeight: 1.6}}>
      <strong>امن:</strong> لینک‌های بازیابی فقط ۱۵ دقیقه اعتبار دارند و فقط یک بار قابل استفاده‌اند. در صورت سواستفاده، فوراً به امنیت گزارش می‌شود.
    </div>
    <div className="mt-5 text-center"  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
      رمز خود را به یاد آوردید؟{" "}
      <a href="#login" onClick={(e) => { e.preventDefault(); go("login"); }} style={{ color: "var(--accent)", fontWeight: 500 }}>
        بازگشت به ورود
      </a>
    </div>
  </AuthShell>
);

// =====================================================
// Shared Auth Field
// =====================================================
const AuthField = ({ label, placeholder, type = "text", icon, rightAction, onAction, value, onChange, required, error, name, autoComplete }) => {
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
export const VerifyEmailPage = ({ go }) => {
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const inputs = React.useRef([]);

  const handleChange = (i, v) => {
    const cleaned = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = cleaned;
    setCode(next);
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
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

        <button type="submit" className="btn btn-primary btn-lg justify-center"  style={{width: "100%"}}>
          تأیید و ادامه
          <Icon name="arrow" size={16} />
        </button>
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
export const TwoFactorPage = ({ go }) => {
  const [method, setMethod] = React.useState("app");

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
          <button className="p-4.5 rounded-xl flex items-center gap-3.5 text-right cursor-pointer" key={m.id} onClick={() => setMethod(m.id)} type="button"  style={{
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
        <button className="btn btn-primary btn-lg" onClick={() => go("onboarding")}>
          فعال‌سازی
          <Icon name="check" size={16} stroke={3} />
        </button>
      </div>

      <button className="cursor-pointer" onClick={() => go("onboarding")}  style={{background: "none", border: "none", color: "var(--fg-mute)", fontSize: 13, fontFamily: "inherit"}}>
        فعلاً بگذار بعد · رفتن به داشبورد
      </button>
    </AuthShell>
  );
};

const AuthVisualSecurity = () => (
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
          <Icon name="check" size={14} stroke={3} style={{ color: "var(--accent)", marginTop: 3 }} />
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
export const OnboardingPage = ({ go }) => {
  const { role } = useRole();
  const [step, setStep] = React.useState(1);
  const steps = ["تعیین سطح", "علایق", "هدف‌گذاری", "آماده‌ایم"];

  const handleNext = () => {
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

const OnboardLevel = ({ onNext }) => {
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
      <button onClick={onNext} className="btn btn-primary btn-lg mt-8 justify-center"  style={{ width: "100%"}}>
        ادامه
        <Icon name="arrow" size={16} />
      </button>
    </div>
  );
};

const OnboardInterests = ({ onNext }) => {
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
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
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
        <button onClick={onNext} disabled={selected.length < 3} className="btn btn-primary btn-lg" style={{ opacity: selected.length >= 3 ? 1 : 0.5 }}>
          ادامه
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
};

const OnboardGoals = ({ onNext }) => {
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
      <button onClick={onNext} className="btn btn-primary btn-lg mt-8 justify-center"  style={{ width: "100%"}}>
        ادامه
        <Icon name="arrow" size={16} />
      </button>
    </div>
  );
};

const OnboardReady = ({ onNext, role }) => (
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
    <button onClick={onNext} className="btn btn-primary btn-lg mt-8" >
      شروع یادگیری
      <Icon name="arrow" size={16} />
    </button>
  </div>
);

export default LoginPage;
