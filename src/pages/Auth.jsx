// =====================================================
// Auth — Login, Register, Forgot, Role Select
// =====================================================

const AuthShell = ({ children, eyebrow, title, sub, side }) => (
  <main data-screen-label="Auth" style={{ minHeight: "calc(100vh - 64px)" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 64px)" }} className="auth-grid">
      {/* form side */}
      <div style={{ padding: "60px 40px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="h-1" style={{ marginTop: 16, marginBottom: 12 }}>{title}</h1>
        <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6, maxWidth: 440 }}>{sub}</p>
        <div style={{ marginTop: 36 }}>{children}</div>
      </div>

      {/* visual side */}
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, color-mix(in oklch, var(--accent) 18%, var(--bg)), color-mix(in oklch, var(--navy) 14%, var(--bg)))",
        borderRight: "1px solid var(--line)",
        overflow: "hidden",
      }} className="auth-visual">
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
  <button className="btn btn-outline" style={{ justifyContent: "center", flex: 1, padding: "12px 14px" }}>
    <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--fg)", color: "var(--bg)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700 }}>{icon}</span>
    {label}
  </button>
);

// =====================================================
// Login
// =====================================================
const LoginPage = ({ go }) => {
  const { setRole } = useRole();
  const [roleId, setRoleId] = React.useState("student");

  const handleLogin = (e) => {
    e.preventDefault();
    setRole(roleId);
    // Navigate to the role's home route
    const target = (window.ROLES && window.ROLES[roleId] && window.ROLES[roleId].homeRoute) || "dashboard";
    go(target);
  };

  const handleSocial = (id) => {
    setRole(roleId);
    const target = (window.ROLES && window.ROLES[roleId] && window.ROLES[roleId].homeRoute) || "dashboard";
    go(target);
  };

  return (
    <AuthShell
      eyebrow="WELCOME BACK · ورود"
      title="خوش آمدید"
      sub="با حساب خود وارد شوید. اگر هنوز ثبت‌نام نکرده‌اید، می‌توانید در کمتر از ۲ دقیقه شروع کنید."
      side={<AuthVisualLogin />}
    >
      {/* Role tabs — 5 roles */}
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>من به عنوان...</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: 4, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 24 }}>
        {[
          ["student", "دانشجو", "user"],
          ["instructor", "استاد", "grad"],
          ["admin", "مدیر", "settings"],
          ["parent", "والد", "users"],
          ["org", "سازمان", "shield"],
        ].map(([id, lbl, ic]) => (
          <button key={id} onClick={() => setRoleId(id)} type="button" style={{
            padding: "10px 4px",
            background: roleId === id ? "var(--surface)" : "transparent",
            border: "1px solid " + (roleId === id ? "var(--line-2)" : "transparent"),
            borderRadius: 8,
            color: roleId === id ? "var(--fg)" : "var(--fg-mute)",
            fontSize: 11, fontWeight: 500, fontFamily: "inherit",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: roleId === id ? "var(--shadow-1)" : "none",
            transition: "all 160ms ease",
          }}>
            <Icon name={ic} size={12} />{lbl}
          </button>
        ))}
      </div>

      {/* Role-aware hint */}
      <div style={{ marginBottom: 24, padding: "10px 14px", background: "var(--accent-soft)", borderRadius: 8, fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="check" size={12} stroke={3} />
        {roleId === "student" && "پس از ورود به میز کار دانشجو می‌روید."}
        {roleId === "instructor" && "پس از ورود به کنسول استاد می‌روید."}
        {roleId === "admin" && "پس از ورود به میز مدیریت می‌روید."}
        {roleId === "parent" && "پس از ورود به پورتال والد می‌روید."}
        {roleId === "org" && "پس از ورود به میز سازمان می‌روید."}
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AuthField
          label={roleId === "instructor" ? "ایمیل دانشگاهی یا کد عضو هیات علمی" :
                roleId === "admin" ? "ایمیل مدیر سامانه" :
                roleId === "org" ? "ایمیل سازمانی (SSO)" :
                "ایمیل یا کد دانشجویی"}
          placeholder={roleId === "instructor" ? "azimi@digiu.edu" :
                      roleId === "org" ? "sso@company.com" :
                      "you@example.com"}
          icon="user"
        />
        <AuthField label="رمز عبور" placeholder="••••••••••" icon="lock" type="password" rightAction="فراموش کرده‌اید؟" onAction={() => go("forgot")} />

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 13, color: "var(--fg-mute)", cursor: "pointer" }}>
          <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
          مرا به خاطر بسپار · احراز دومرحله‌ای فعال
        </label>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 16, justifyContent: "center" }}>
          ورود به حساب
          <Icon name="arrow" size={16} />
        </button>
      </form>

      {/* OR divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0", color: "var(--fg-dim)", fontSize: 12, fontFamily: "var(--f-mono)" }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }}></div>
        OR · یا
        <div style={{ flex: 1, height: 1, background: "var(--line)" }}></div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={() => handleSocial("google")} className="btn btn-outline" style={{ justifyContent: "center", flex: 1, padding: "12px 14px" }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--fg)", color: "var(--bg)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700 }}>G</span>
          گوگل
        </button>
        <button type="button" onClick={() => handleSocial("ssa")} className="btn btn-outline" style={{ justifyContent: "center", flex: 1, padding: "12px 14px" }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--fg)", color: "var(--bg)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700 }}>در</span>
          درگاه ملی
        </button>
        <button type="button" onClick={() => handleSocial("sso")} className="btn btn-outline" style={{ justifyContent: "center", flex: 1, padding: "12px 14px" }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--fg)", color: "var(--bg)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700 }}>SSO</span>
          سازمان
        </button>
      </div>

      <div style={{ marginTop: 28, padding: 16, background: "var(--accent-soft)", borderRadius: 10, fontSize: 13, color: "var(--accent)", display: "flex", alignItems: "center", gap: 10 }}>
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
  <div style={{ padding: 60, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
    {/* Floating quote card */}
    <div style={{ background: "var(--surface)", borderRadius: 16, padding: 28, border: "1px solid var(--line)", boxShadow: "var(--shadow-paper)", maxWidth: 420 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={14} />)}
      </div>
      <p style={{ fontSize: 18, lineHeight: 1.7, fontFamily: "var(--f-display)", color: "var(--fg)" }}>
        "اولین باری بود که حس کردم یک دستیار آموزشی واقعی دارم. پروفایل شناختی می‌داند کجا گیر کرده‌ام و چه باید بکنم."
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
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
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 28, letterSpacing: "0.12em" }}>
        ۲.۴M+ رویداد یادگیری · ۹۹.۹٪ uptime
      </div>
    </div>

    {/* Decorative concentric */}
    <div style={{
      position: "absolute", bottom: -100, right: -100,
      width: 400, height: 400,
      borderRadius: "50%",
      background: "radial-gradient(circle, transparent 30%, color-mix(in oklch, var(--accent) 8%, transparent) 31%, transparent 32%, color-mix(in oklch, var(--accent) 6%, transparent) 50%, transparent 51%)",
      pointerEvents: "none",
    }} />
  </div>
);

// =====================================================
// Register
// =====================================================
const RegisterPage = ({ go }) => {
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
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>من به عنوان...</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[
          { id: "student", t: "دانشجو", d: "یادگیری، آزمون و گواهی", ic: "user" },
          { id: "instructor", t: "استاد", d: "تدریس و طراحی درس با AI", ic: "grad" },
          { id: "org", t: "سازمان", d: "آموزش تیم با مدیریت مرکزی", ic: "shield" },
          { id: "parent", t: "والد", d: "نظارت بر یادگیری فرزند", ic: "users" },
        ].map((r) => (
          <button key={r.id} onClick={() => setRoleId(r.id)} type="button" style={{
            padding: 18,
            background: roleId === r.id ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (roleId === r.id ? "var(--accent)" : "var(--line)"),
            borderRadius: 10,
            textAlign: "right",
            cursor: "pointer",
            fontFamily: "inherit",
            color: "var(--fg)",
            display: "flex", alignItems: "flex-start", gap: 12,
            transition: "all 160ms ease",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: roleId === r.id ? "var(--accent)" : "var(--surface-2)",
              color: roleId === r.id ? "var(--accent-on)" : "var(--fg-mute)",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}><Icon name={r.ic} size={16} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.t}</div>
              <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 4 }}>{r.d}</div>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <AuthField label="نام" placeholder="نسرین" icon="user" />
          <AuthField label="نام خانوادگی" placeholder="رضوی" />
        </div>
        <AuthField label="ایمیل" placeholder="nasrin@example.com" icon="user" />
        <AuthField label="رمز عبور" placeholder="حداقل ۸ کاراکتر" icon="lock" type="password" />

        <PasswordStrength />

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 6, fontSize: 12, color: "var(--fg-mute)", cursor: "pointer", lineHeight: 1.6 }}>
          <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)", width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
          با <a href="#" style={{ color: "var(--accent)", textDecoration: "underline" }}>قوانین استفاده</a> و <a href="#" style={{ color: "var(--accent)", textDecoration: "underline" }}>سیاست حریم خصوصی</a> موافق هستم.
        </label>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 12, justifyContent: "center" }}>
          ساخت حساب و ادامه
          <Icon name="arrow" size={16} />
        </button>
      </form>

      <div style={{ marginTop: 24, fontSize: 13, color: "var(--fg-mute)", textAlign: "center" }}>
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <a href="#login" onClick={(e) => { e.preventDefault(); go("login"); }} style={{ color: "var(--accent)", fontWeight: 500 }}>
          ورود به حساب
        </a>
      </div>
    </AuthShell>
  );
};

const AuthVisualRegister = () => (
  <div style={{ padding: 60, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>
    <div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--fg)" }}>
        به دانشگاهی بپیوندید که<br />
        <span style={{ color: "var(--accent)" }}>هرگز نمی‌خوابد</span>
      </div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[
        ["دستیار شخصی ۲۴/۷", "هر سوال، هر زمان", "sparkle"],
        ["گواهی قابل اثبات", "Open Badges 3.0 · Verifiable", "cert"],
        ["شخصی‌سازی واقعی", "بر اساس نحوه‌ی یادگیری شما", "target"],
        ["پروژه عملی واقعی", "روی کد، داده و چالش‌های واقعی", "code"],
      ].map(([t, s, ic], i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: 18, background: "var(--surface)",
          border: "1px solid var(--line)", borderRadius: 12,
          boxShadow: "var(--shadow-1)",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={ic} size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 2 }}>{s}</div>
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
    <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 999,
          background: i <= 3 ? "var(--accent)" : "var(--surface-3)",
        }} />
      ))}
    </div>
    <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 6, fontFamily: "var(--f-mono)" }}>
      قدرت: قوی · شامل حرف بزرگ، عدد، نماد
    </div>
  </div>
);

// =====================================================
// Forgot password
// =====================================================
const ForgotPage = ({ go }) => (
  <AuthShell
    eyebrow="RECOVERY · بازیابی"
    title="رمز را فراموش کرده‌اید؟"
    sub="ایمیل خود را وارد کنید. یک لینک امن یک‌بار مصرف برای بازنشانی برای شما ارسال می‌کنیم."
    side={<AuthVisualLogin />}
  >
    <form onSubmit={(e) => { e.preventDefault(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <AuthField label="ایمیل ثبت‌شده" placeholder="nasrin@example.com" icon="user" />
      <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 14, justifyContent: "center" }}>
        ارسال لینک بازیابی
        <Icon name="send" size={16} />
      </button>
    </form>
    <div style={{ marginTop: 28, padding: 16, background: "var(--navy-soft)", borderRadius: 10, fontSize: 12, color: "var(--navy)", lineHeight: 1.6 }}>
      <strong>امن:</strong> لینک‌های بازیابی فقط ۱۵ دقیقه اعتبار دارند و فقط یک بار قابل استفاده‌اند. در صورت سواستفاده، فوراً به امنیت گزارش می‌شود.
    </div>
    <div style={{ marginTop: 20, fontSize: 13, color: "var(--fg-mute)", textAlign: "center" }}>
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
const AuthField = ({ label, placeholder, type = "text", icon, rightAction, onAction }) => (
  <label style={{ display: "block" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      {rightAction && (
        <button onClick={onAction} type="button" style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, fontFamily: "var(--f-mono)", cursor: "pointer" }}>{rightAction}</button>
      )}
    </div>
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-dim)" }}><Icon name={icon} size={16} /></span>}
      <input type={type} placeholder={placeholder} style={{
        width: "100%",
        background: "var(--surface)",
        border: "1px solid var(--line-2)",
        borderRadius: 10,
        padding: icon ? "12px 42px 12px 14px" : "12px 14px",
        color: "var(--fg)",
        fontFamily: "inherit",
        fontSize: 14,
      }} />
    </div>
  </label>
);

window.LoginPage = LoginPage;
window.RegisterPage = RegisterPage;
window.ForgotPage = ForgotPage;

// =====================================================
// Email Verification
// =====================================================
const VerifyEmailPage = ({ go }) => {
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
      <div style={{ padding: 18, background: "var(--accent-soft)", borderRadius: 10, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="send" size={16} />
        <div style={{ fontSize: 13, color: "var(--accent)" }}>
          کد به <strong>n***@example.com</strong> ارسال شد
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); go("2fa-setup"); }}>
        <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>کد ۶ رقمی</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 28, direction: "ltr" }}>
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={c}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              style={{
                width: "100%", aspectRatio: "1",
                background: "var(--surface)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                textAlign: "center",
                fontFamily: "var(--f-mono)",
                fontSize: 28, fontWeight: 600,
                color: "var(--fg)",
              }}
            />
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
          تأیید و ادامه
          <Icon name="arrow" size={16} />
        </button>
      </form>

      <div style={{ marginTop: 24, fontSize: 13, color: "var(--fg-mute)", textAlign: "center" }}>
        کد را دریافت نکردید؟{" "}
        <button style={{ color: "var(--accent)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
          ارسال مجدد در ۰:۴۲
        </button>
      </div>

      <div style={{ marginTop: 16, padding: 14, background: "var(--surface-2)", borderRadius: 10, fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
        <strong>نکته:</strong> اگر ایمیل را در inbox پیدا نکردید، spam را بررسی کنید یا{" "}
        <a href="#" style={{ color: "var(--accent)" }}>ایمیل را تغییر دهید</a>.
      </div>
    </AuthShell>
  );
};

// =====================================================
// 2FA Setup
// =====================================================
const TwoFactorPage = ({ go }) => {
  const [method, setMethod] = React.useState("app");

  return (
    <AuthShell
      eyebrow="SECURITY · امنیت دومرحله‌ای"
      title="یک لایه‌ی امنیت اضافه کنید"
      sub="احراز هویت دومرحله‌ای از حساب شما در برابر دسترسی غیرمجاز محافظت می‌کند."
      side={<AuthVisualSecurity />}
    >
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>روش احراز دومرحله‌ای</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {[
          { id: "app", t: "اپلیکیشن Authenticator", d: "Google Authenticator، Authy، 1Password — توصیه می‌شود", ic: "chip", reco: true },
          { id: "key", t: "کلید سخت‌افزاری FIDO2", d: "YubiKey، SoloKey — بالاترین سطح امنیت", ic: "shield" },
          { id: "sms", t: "پیامک", d: "کد یک‌بار مصرف به شماره تماس شما", ic: "bell" },
        ].map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)} type="button" style={{
            padding: 18,
            background: method === m.id ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (method === m.id ? "var(--accent)" : "var(--line)"),
            borderRadius: 10,
            display: "flex", alignItems: "center", gap: 14,
            textAlign: "right", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: method === m.id ? "var(--accent)" : "var(--surface-2)", color: method === m.id ? "var(--accent-on)" : "var(--fg-mute)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name={m.ic} size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                {m.t}
                {m.reco && <span className="pill pill-cyan" style={{ fontSize: 9 }}>پیشنهادی</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>{m.d}</div>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: 50, border: "2px solid " + (method === m.id ? "var(--accent)" : "var(--line-2)"), background: method === m.id ? "var(--accent)" : "transparent", flexShrink: 0 }}></div>
          </button>
        ))}
      </div>

      {/* QR code preview for app method */}
      {method === "app" && (
        <div className="card" style={{ padding: 24, display: "grid", gridTemplateColumns: "180px 1fr", gap: 24, alignItems: "center", marginBottom: 28 }}>
          <div style={{
            width: 180, height: 180,
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            position: "relative",
            display: "grid", placeItems: "center",
          }}>
            <div style={{
              position: "absolute", inset: 14,
              background: `
                linear-gradient(90deg, var(--fg) 33%, transparent 33% 66%, var(--fg) 66%) 0 0 / 12px 12px,
                linear-gradient(var(--fg) 33%, transparent 33% 66%, var(--fg) 66%) 0 0 / 12px 12px`,
              backgroundColor: "transparent",
              backgroundBlendMode: "multiply",
            }}></div>
            <span style={{ position: "absolute", padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 9, color: "var(--fg-mute)" }}>QR</span>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", marginBottom: 8 }}>گام ۱</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>این QR را با Google Authenticator اسکن کنید.</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", marginBottom: 8 }}>یا کلید را به‌صورت دستی وارد کنید</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, padding: "8px 12px", background: "var(--surface-2)", borderRadius: 6, direction: "ltr", textAlign: "left", letterSpacing: "0.05em" }}>
              JBSW Y3DP EHPK 3PXP
            </div>
          </div>
        </div>
      )}

      {/* Verify code entry */}
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>گام ۲ · کد ۶ رقمی نشان داده شده</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <input placeholder="۱۲۳۴۵۶" style={{ flex: 1, padding: "14px 18px", fontFamily: "var(--f-mono)", fontSize: 18, letterSpacing: "0.3em", textAlign: "center", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10 }} />
        <button className="btn btn-primary btn-lg" onClick={() => go("onboarding")}>
          فعال‌سازی
          <Icon name="check" size={16} stroke={3} />
        </button>
      </div>

      <button onClick={() => go("onboarding")} style={{ background: "none", border: "none", color: "var(--fg-mute)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        فعلاً بگذار بعد · رفتن به داشبورد
      </button>
    </AuthShell>
  );
};

const AuthVisualSecurity = () => (
  <div style={{ padding: 60, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>
    <div>
      <div style={{ width: 80, height: 80, borderRadius: 16, background: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 32 }}>
        <Icon name="shield" size={36} stroke={2} />
      </div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
        امنیت در اولویت<br />
        <span style={{ color: "var(--accent)" }}>از روز اول</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[
        ["رمزنگاری End-to-End", "همه‌ی داده‌ها از مبدأ به مقصد رمز می‌شوند"],
        ["نشست‌های قابل کنترل", "می‌توانید هر نشست را از راه دور خارج کنید"],
        ["گزارش امنیتی هفتگی", "خلاصه‌ی فعالیت‌های مشکوک به ایمیل"],
      ].map(([t, d], i) => (
        <div key={i} className="card-flat" style={{ padding: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Icon name="check" size={14} stroke={3} style={{ color: "var(--accent)", marginTop: 3 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// =====================================================
// Onboarding Wizard — after register, before dashboard
// =====================================================
const OnboardingPage = ({ go }) => {
  const { role } = useRole();
  const [step, setStep] = React.useState(1);
  const steps = ["تعیین سطح", "علایق", "هدف‌گذاری", "آماده‌ایم"];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else go(role.homeRoute);
  };

  return (
    <main data-screen-label="Onboarding" style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ maxWidth: 720, width: "100%" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i < step ? "var(--accent)" : "var(--surface-3)",
            }}></div>
          ))}
        </div>

        <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>
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
      <h1 className="h-1" style={{ marginBottom: 14 }}>سطح فعلی شما در یادگیری ماشین؟</h1>
      <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6, marginBottom: 36 }}>
        این کمک می‌کند برنامه‌ی شخصی‌سازی‌شده‌ای برای شما بسازیم. بدون نگرانی — می‌توانید بعداً تغییر دهید.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { v: 1, t: "تازه‌کار", d: "هیچ تجربه‌ای ندارم، می‌خواهم از صفر شروع کنم" },
          { v: 2, t: "مقدماتی", d: "با مفاهیم پایه آشنا هستم، Python بلدم" },
          { v: 3, t: "متوسط", d: "چند مدل کلاسیک پیاده کرده‌ام، با scikit-learn کار کردم" },
          { v: 4, t: "پیشرفته", d: "روی deep learning کار می‌کنم، با PyTorch/TF تجربه دارم" },
          { v: 5, t: "حرفه‌ای", d: "تجربه‌ی صنعتی یا پژوهشی دارم" },
        ].map((l) => (
          <button key={l.v} onClick={() => setLevel(l.v)} type="button" style={{
            padding: 18,
            background: level === l.v ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (level === l.v ? "var(--accent)" : "var(--line)"),
            borderRadius: 10, textAlign: "right", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: level === l.v ? "var(--accent)" : "var(--surface-2)", color: level === l.v ? "var(--accent-on)" : "var(--fg-mute)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontWeight: 700, flexShrink: 0 }}>
              L{toFa(l.v)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{l.t}</div>
              <div style={{ fontSize: 13, color: "var(--fg-mute)", marginTop: 4 }}>{l.d}</div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onNext} className="btn btn-primary btn-lg" style={{ marginTop: 32, justifyContent: "center", width: "100%" }}>
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
      <h1 className="h-1" style={{ marginBottom: 14 }}>چه چیزی برای شما جذاب است؟</h1>
      <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6, marginBottom: 36 }}>
        حداقل ۳ علاقه انتخاب کنید. بر اساس این، دروس، مقالات و رویدادها پیشنهاد می‌شود.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
        {tags.map((t) => (
          <button key={t.id} onClick={() => toggle(t.id)} type="button" style={{
            padding: "10px 18px",
            background: selected.includes(t.id) ? "var(--accent)" : "var(--surface)",
            border: "1px solid " + (selected.includes(t.id) ? "var(--accent)" : "var(--line-2)"),
            borderRadius: 999,
            color: selected.includes(t.id) ? "var(--accent-on)" : "var(--fg)",
            fontFamily: "inherit", fontSize: 14, cursor: "pointer",
            transition: "all 160ms ease",
          }}>{t.t}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      <h1 className="h-1" style={{ marginBottom: 14 }}>هدف اصلی شما چیست؟</h1>
      <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.6, marginBottom: 36 }}>
        این نحوه‌ی پیشنهاد دروس را تنظیم می‌کند.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { id: "career", t: "تغییر مسیر شغلی", d: "ورود به حوزه‌ی AI/Data", ic: "bolt" },
          { id: "promo", t: "رشد در شغل فعلی", d: "ارتقا و مهارت‌های جدید", ic: "trophy" },
          { id: "research", t: "پژوهش آکادمیک", d: "آماده‌سازی برای دکتری", ic: "flask" },
          { id: "project", t: "ساخت یک پروژه", d: "ایده‌ی شخصی یا استارتاپ", ic: "code" },
          { id: "curiosity", t: "کنجکاوی شخصی", d: "می‌خواهم بدانم چگونه کار می‌کند", ic: "sparkle" },
          { id: "cert", t: "گواهی برای کارفرما", d: "نیاز به مدرک رسمی دارم", ic: "cert" },
        ].map((g) => (
          <button key={g.id} onClick={() => setGoal(g.id)} type="button" style={{
            padding: 22,
            background: goal === g.id ? "var(--accent-soft)" : "var(--surface)",
            border: "1px solid " + (goal === g.id ? "var(--accent)" : "var(--line)"),
            borderRadius: 10, textAlign: "right", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: goal === g.id ? "var(--accent)" : "var(--surface-2)", color: goal === g.id ? "var(--accent-on)" : "var(--fg-mute)", display: "grid", placeItems: "center" }}>
              <Icon name={g.ic} size={16} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{g.t}</div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>{g.d}</div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onNext} className="btn btn-primary btn-lg" style={{ marginTop: 32, justifyContent: "center", width: "100%" }}>
        ادامه
        <Icon name="arrow" size={16} />
      </button>
    </div>
  );
};

const OnboardReady = ({ onNext, role }) => (
  <div style={{ textAlign: "center", padding: "40px 0" }}>
    <div style={{
      width: 100, height: 100, margin: "0 auto",
      borderRadius: "50%",
      background: "var(--accent)",
      color: "var(--accent-on)",
      display: "grid", placeItems: "center",
    }}>
      <Icon name="check" size={48} stroke={2.5} />
    </div>
    <h1 className="h-1" style={{ marginTop: 32 }}>پروفایل شما ساخته شد</h1>
    <p style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1.7, marginTop: 16, maxWidth: 520, margin: "16px auto 0" }}>
      پروفایل شناختی اولیه‌ی شما با بیش از ۲۴ شاخص ساخته شد. AI آماده است تا مسیر یادگیری شخصی شما را پیشنهاد دهد.
    </p>
    <div className="card" style={{ padding: 24, marginTop: 32, textAlign: "right", maxWidth: 480, margin: "32px auto 0" }}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>پیشنهاد اول</div>
      <h3 style={{ fontSize: 17 }}>مبانی یادگیری ماشین — CS-410</h3>
      <div style={{ fontSize: 13, color: "var(--fg-mute)", marginTop: 6 }}>دکتر آرش عظیمی · ۱۲ هفته · با تسلط ۹۲٪ احتمال موفقیت</div>
    </div>
    <button onClick={onNext} className="btn btn-primary btn-lg" style={{ marginTop: 32 }}>
      شروع یادگیری
      <Icon name="arrow" size={16} />
    </button>
  </div>
);

window.VerifyEmailPage = VerifyEmailPage;
window.TwoFactorPage = TwoFactorPage;
window.OnboardingPage = OnboardingPage;
