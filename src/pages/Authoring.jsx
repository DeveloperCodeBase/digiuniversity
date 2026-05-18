// =====================================================
// Course Authoring Studio — AI Planner + blueprint
// =====================================================
const AuthoringPage = ({ go }) => {
  const [step, setStep] = React.useState("blueprint");

  return (
    <main data-screen-label="13 استودیو">
      <section style={{ borderBottom: "1px solid var(--line)", padding: "32px 40px" }}>
        <div className="shell" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>کنسول استاد</span>
              <span style={{ color: "var(--fg-dim)" }}>/</span>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>دروس من</span>
              <span style={{ color: "var(--fg-dim)" }}>/</span>
              <span className="mono">پیش‌نویس جدید</span>
            </div>
            <h1 className="h-2">یادگیری تقویتی · سطح ارشد</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost"><Icon name="eye" size={14} />پیش‌نمایش</button>
            <button className="btn btn-outline"><Icon name="download" size={14} />ذخیره پیش‌نویس</button>
            <button className="btn btn-primary">انتشار</button>
          </div>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="shell" style={{ padding: "16px 40px", display: "flex", gap: 4 }}>
          {[
            ["blueprint", "Blueprint", "target"],
            ["outline", "سرفصل", "layers"],
            ["sessions", "جلسات", "calendar"],
            ["assessment", "ارزیابی", "check"],
            ["resources", "منابع", "folder"],
            ["agents", "عامل‌های AI", "sparkle"],
          ].map(([id, lbl, ic]) => (
            <button key={id} onClick={() => setStep(id)} style={{
              padding: "10px 16px",
              background: step === id ? "var(--surface)" : "transparent",
              border: "1px solid " + (step === id ? "var(--line-2)" : "transparent"),
              borderRadius: 10,
              color: step === id ? "var(--fg)" : "var(--fg-mute)",
              fontSize: 13,
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer",
            }}>
              <Icon name={ic} size={14} />
              {lbl}
            </button>
          ))}
        </div>
      </section>

      <section className="shell" style={{ padding: "32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div>
            {step === "blueprint" && <BlueprintStep />}
            {step === "outline" && <OutlineStep />}
            {step === "sessions" && <BlueprintStep />}
            {step === "assessment" && <BlueprintStep />}
            {step === "resources" && <BlueprintStep />}
            {step === "agents" && <AgentsStep />}
          </div>

          {/* AI planner side */}
          <aside style={{ position: "sticky", top: 90, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20, background: "linear-gradient(135deg, color-mix(in oklch, var(--violet) 12%, var(--surface)), var(--surface))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--violet)", marginBottom: 14 }}>
                <Icon name="sparkle" size={16} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>AI COURSE PLANNER</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
                می‌توانم برای این درس، ۱۲ جلسه با اهداف یادگیری، نقشه‌ی مفهومی و کوییز پیشنهاد بدهم. شما نهایی می‌کنید.
              </p>
              <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                <Icon name="bolt" size={13} />
                تولید پیشنهاد اولیه
              </button>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="mono" style={{ color: "var(--fg-mute)", marginBottom: 14, fontSize: 11, letterSpacing: "0.08em" }}>ARCHIVES TO PULL FROM</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["مقاله Sutton & Barto", "PDF · ۵۲۰ صفحه"],
                  ["دوره قدیمی RL ۱۴۰۳", "۱۸ جلسه ضبط‌شده"],
                  ["یادداشت‌های استاد", "Markdown · ۱۲ فایل"],
                  ["بانک سوال موجود", "۲۳۴ سوال QTI"],
                ].map(([t, m]) => (
                  <li key={t} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
                    <span>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--fg-mute)" }}>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="mono" style={{ color: "var(--amber)", marginBottom: 12, fontSize: 11, letterSpacing: "0.08em" }}>
                <Icon name="shield" size={12} /> SAFETY POLICY
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                هیچ محتوای تولیدی بدون تأیید نهایی استاد منتشر نمی‌شود. منبع هر پیشنهاد قابل ردیابی است.
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const BlueprintStep = () => (
  <div>
    <div className="card" style={{ padding: 32, marginBottom: 20 }}>
      <h3 className="h-3" style={{ marginBottom: 24 }}>Course Blueprint</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <FormField label="عنوان فارسی" placeholder="یادگیری تقویتی" />
        <FormField label="عنوان انگلیسی" placeholder="Reinforcement Learning" />
        <FormField label="کد درس" placeholder="CS-650" mono />
        <FormField label="سطح" placeholder="ارشد" />
        <FormField label="تعداد ماژول" placeholder="۱۲" mono />
        <FormField label="مدت زمان" placeholder="۱۰ هفته" />
      </div>
      <div style={{ marginTop: 24 }}>
        <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>توضیحات</div>
        <textarea placeholder="درس یادگیری تقویتی، اصول و الگوریتم‌های یادگیری از تجربه را پوشش می‌دهد..." rows={4} style={{
          width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10,
          padding: "12px 14px", color: "var(--fg)", fontFamily: "inherit", fontSize: 14, direction: "rtl", resize: "vertical",
        }} />
      </div>
    </div>

    <div className="card" style={{ padding: 32 }}>
      <h3 className="h-3" style={{ marginBottom: 18 }}>Learning Outcomes</h3>
      <p style={{ color: "var(--fg-mute)", fontSize: 13, marginBottom: 20 }}>تا پایان این درس، دانشجو می‌تواند:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          "مسئله را در قالب MDP فرموله کند",
          "معادله بلمن را برای یک محیط ساده حل کند",
          "Q-Learning را از صفر در Python پیاده‌سازی کند",
          "تفاوت روش‌های on-policy و off-policy را توضیح دهد",
          "یک پروژه RL واقعی روی محیط Gym انجام دهد",
        ].map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface-3)", color: "var(--cyan)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700 }}>
              LO{toFa(i + 1)}
            </div>
            <span style={{ flex: 1, fontSize: 14 }}>{o}</span>
            <span className="pill" style={{ fontSize: 10 }}>{["یادآوری", "فهم", "کاربرد", "تحلیل", "ساختن"][i]}</span>
          </div>
        ))}
        <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}>
          <Icon name="plus" size={14} />
          افزودن هدف یادگیری
        </button>
      </div>
    </div>
  </div>
);

const OutlineStep = () => (
  <div className="studio-canvas">
    <h3 className="h-3" style={{ marginBottom: 20 }}>سرفصل · ۱۲ جلسه</h3>
    {[
      ["جلسه ۱", "مقدمه — تاریخچه و کاربردهای RL", "MDP, Bandit"],
      ["جلسه ۲", "فرآیندهای تصمیم مارکوف", "MDP, Policy"],
      ["جلسه ۳", "معادله بلمن", "Value Function, DP"],
      ["جلسه ۴", "روش‌های مونت‌کارلو", "MC Control"],
      ["جلسه ۵", "TD Learning · Q-Learning", "TD(0), SARSA"],
      ["جلسه ۶", "تابع تقریب — DQN", "Neural Networks"],
      ["جلسه ۷", "Policy Gradient", "REINFORCE"],
      ["جلسه ۸", "Actor-Critic, PPO", "A2C, PPO"],
    ].map(([n, t, tags], i) => (
      <div key={n} className="studio-block">
        <span className="handle">⋮⋮</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="mono" style={{ color: "var(--cyan)", fontSize: 11 }}>{n}</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {tags.split(", ").map((tag) => <span key={tag} className="pill" style={{ fontSize: 9 }}>{tag}</span>)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="settings" size={13} /></button>
        </div>
      </div>
    ))}
    <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
      <Icon name="plus" size={14} />افزودن جلسه
    </button>
  </div>
);

const AgentsStep = () => (
  <div className="card" style={{ padding: 32 }}>
    <h3 className="h-3" style={{ marginBottom: 8 }}>سیاست عامل‌های AI برای این درس</h3>
    <p style={{ color: "var(--fg-mute)", fontSize: 13, marginBottom: 24 }}>
      تعریف کنید هر عامل چه کارهایی مجاز است، از چه منابعی استفاده کند و کجا نیاز به تأیید انسانی دارد.
    </p>

    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[
        { name: "TUTOR — توضیح‌دهنده", role: "پاسخ به سوال دانشجو با مرجع داخلی", color: "var(--cyan)", on: true, controls: ["RAG", "ارجاع به ویدئو", "توضیح چندسطحی"] },
        { name: "COACH — مربی پرسش‌گر", role: "پرسیدن سوال کاوشی به‌جای پاسخ مستقیم", color: "var(--amber)", on: true, controls: ["پرسش کاوشگرانه", "feedback constructive"] },
        { name: "CRITIC — منتقد", role: "چالش فرضیات و یافتن خطاهای استدلال", color: "var(--violet)", on: false, controls: ["Critique mode"] },
        { name: "MENTOR — منتور بلندمدت", role: "راهنمایی مسیر یادگیری و انگیزشی", color: "var(--rose)", on: true, controls: ["Long-term plan", "Motivation"] },
        { name: "GRADER — ارزیاب", role: "نمره‌دهی اولیه با rubric · نیاز به تأیید", color: "var(--fg-mute)", on: true, controls: ["Rubric scoring", "تأیید استاد الزامی"] },
      ].map((a) => (
        <div key={a.name} style={{ padding: 20, background: "var(--surface-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 50, background: a.color, boxShadow: `0 0 10px ${a.color}` }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</span>
            </div>
            <Toggle on={a.on} />
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-mute)", marginBottom: 12 }}>{a.role}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {a.controls.map((c) => <span key={c} className="pill" style={{ fontSize: 10 }}>{c}</span>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Toggle = ({ on }) => (
  <div style={{
    width: 40, height: 22, borderRadius: 999,
    background: on ? "var(--accent)" : "var(--surface-3)",
    position: "relative", transition: "200ms ease",
    cursor: "pointer",
  }}>
    <div style={{
      position: "absolute",
      top: 3, left: on ? 3 : 21,
      right: on ? 21 : 3,
      width: 16, height: 16, borderRadius: 50,
      background: "white",
      transition: "200ms ease",
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }} />
  </div>
);

window.AuthoringPage = AuthoringPage;
window.Toggle = Toggle;
