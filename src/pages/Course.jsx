// =====================================================
// Course detail page — with AI tutor inline + outline
// =====================================================
const CoursePage = ({ go }) => {
  const [activeModule, setActiveModule] = React.useState(2);

  return (
    <main data-screen-label="05 درس">
      {/* hero band */}
      <section style={{
        position: "relative",
        padding: "60px 0 40px",
        borderBottom: "1px solid var(--line)",
        background: "linear-gradient(180deg, color-mix(in oklch, var(--cyan) 8%, var(--bg)) 0%, var(--bg) 100%)",
      }}>
        <div className="shell">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span className="mono" style={{ color: "var(--fg-mute)" }}>برنامه‌ها</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono" style={{ color: "var(--fg-mute)" }}>علوم داده</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono">CS-410</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 48, alignItems: "end" }}>
            <div>
              <span className="eyebrow">CORE COURSE · MASTERY-BASED</span>
              <h1 className="h-display" style={{ marginTop: 14, fontSize: "clamp(40px, 5.5vw, 84px)" }}>مبانی یادگیری ماشین</h1>
              <p className="lead" style={{ marginTop: 20 }}>
                از شهود آماری تا شبکه‌های عمیق. ۱۲ هفته، ۲۴ ماژول، ۸۴ تمرین تطبیقی. با گراف دانش زنده و دستیار شخصی.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                <span className="pill pill-cyan">۱۲ هفته</span>
                <span className="pill">۲۴ ماژول</span>
                <span className="pill">۸۴۳ دانشجو فعال</span>
                <span className="pill pill-amber">گواهی VC</span>
                <span className="pill">QTI · xAPI</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button className="btn btn-primary btn-lg" onClick={() => go("classroom")}>
                  <Icon name="play" size={14} />
                  ادامه از ماژول ۸
                </button>
                <button className="btn btn-outline btn-lg">
                  <Icon name="folder" size={14} />
                  منابع درس
                </button>
              </div>
            </div>

            {/* Right — Instructor card */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div className="avatar cyan" style={{ width: 60, height: 60 }}>AA</div>
                <div>
                  <div className="mono" style={{ color: "var(--fg-mute)", marginBottom: 4 }}>INSTRUCTOR</div>
                  <div style={{ fontWeight: 600 }}>دکتر آرش عظیمی</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>دانشکده علوم رایانه</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, marginBottom: 4 }}>RATING</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 18 }}>۴.۹</div></div>
                <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, marginBottom: 4 }}>STUDENTS</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 18 }}>۲.۱K</div></div>
                <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, marginBottom: 4 }}>COURSES</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 18 }}>۸</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="shell" style={{ padding: "60px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32 }}>
          {/* outline */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 className="h-2">نقشه‌ی درس</h2>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>۷ / ۲۴ ماژول کامل</span>
            </div>

            {/* Progress bar overall */}
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 32 }}>
              <div style={{ height: "100%", width: "32%", background: "linear-gradient(90deg, var(--cyan-dim), var(--cyan))", borderRadius: 999 }}></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MODULES.map((m, i) => (
                <ModuleRow key={i} module={m} idx={i} active={activeModule === i} onClick={() => setActiveModule(i)} />
              ))}
            </div>
          </div>

          {/* Sidebar AI tutor + outcomes */}
          <aside style={{ position: "sticky", top: 90, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--cyan)", marginBottom: 14 }}>
                <Icon name="target" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>LEARNING OUTCOMES</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["پیش‌بینی با مدل‌های خطی", true],
                  ["ارزیابی صحت و سوگیری مدل", true],
                  ["انتخاب الگوریتم برای مسئله", true],
                  ["پیاده‌سازی شبکه عصبی پایه", false],
                  ["تنظیم hyperparameter", false],
                  ["ساخت یک پروژه پایان دوره", false],
                ].map(([t, done], i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: done ? "var(--fg)" : "var(--fg-mute)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 50, background: done ? "var(--cyan)" : "var(--surface-3)", color: "#051418", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {done && <Icon name="check" size={11} stroke={3} />}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--violet)", marginBottom: 14 }}>
                <Icon name="sparkle" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>AI TUTOR · PERSONAL</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                دستیار درس می‌داند کجای راه هستی. می‌توانی هر لحظه بپرسی، تمرین جبرانی بخواهی یا یک ویدئوی مرتبط را پیدا کنی.
              </p>
              <button className="btn btn-outline" style={{ width: "100%", marginTop: 16, justifyContent: "center" }}>
                <Icon name="chat" size={14} />
                شروع گفتگو
              </button>
            </div>

            <div className="card" style={{ padding: 20, background: "linear-gradient(135deg, color-mix(in oklch, var(--amber) 12%, var(--surface)), var(--surface))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--amber)", marginBottom: 14 }}>
                <Icon name="trophy" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>NEXT MILESTONE</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>گواهی میانی · بهینه‌سازی</div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6 }}>۲ ماژول دیگر تا دریافت</div>
              <button className="btn btn-amber btn-sm" style={{ marginTop: 16, justifyContent: "center", width: "100%" }} onClick={() => go("credential")}>
                مشاهده پیش‌نمایش
              </button>
            </div>
          </aside>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const ModuleRow = ({ module, idx, active, onClick }) => {
  const status = module.status; // done / current / locked
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr auto auto",
        gap: 18,
        padding: 18,
        background: active ? "color-mix(in oklch, var(--cyan) 8%, var(--surface))" : "var(--surface)",
        border: "1px solid " + (active ? "color-mix(in oklch, var(--cyan) 40%, var(--line))" : "var(--line)"),
        borderRadius: 14,
        alignItems: "center",
        cursor: "pointer",
        transition: "140ms ease",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: status === "done" ? "var(--cyan)" : status === "current" ? "color-mix(in oklch, var(--cyan) 20%, var(--surface-3))" : "var(--surface-2)",
        color: status === "done" ? "#051418" : "var(--fg-mute)",
        display: "grid", placeItems: "center",
        fontFamily: "var(--f-mono)", fontWeight: 700,
      }}>
        {status === "done" ? <Icon name="check" size={18} stroke={2.5} /> : status === "locked" ? <Icon name="lock" size={16} /> : toFa(idx + 1)}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{module.title}</div>
        <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>{module.sub}</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {module.kinds.map((k, i) => (
          <span key={i} style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            padding: "3px 8px",
            border: "1px solid var(--line)",
            borderRadius: 4,
            color: "var(--fg-mute)",
          }}>{k}</span>
        ))}
      </div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)", minWidth: 70, textAlign: "left" }}>
        {module.duration}
      </div>
    </div>
  );
};

const MODULES = [
  { title: "آشنایی با یادگیری ماشین", sub: "تاریخچه، تعاریف، انواع مسئله", status: "done", kinds: ["ویدئو", "خواندنی", "کوییز"], duration: "۴۵ دقیقه" },
  { title: "ریاضیات لازم برای ML", sub: "جبر خطی، احتمالات، حساب دیفرانسیل", status: "done", kinds: ["ویدئو ×۳", "تمرین ×۸"], duration: "۲ ساعت" },
  { title: "رگرسیون خطی و logistic", sub: "از فرضیه تا cost function و آزمون", status: "current", kinds: ["لایو", "کدنویسی", "آزمون"], duration: "۱.۵ ساعت" },
  { title: "بهینه‌سازی · گرادیان نزولی", sub: "SGD، مومنتوم، Adam، نرخ یادگیری", status: "current", kinds: ["لایو", "شبیه‌سازی"], duration: "۱.۵ ساعت" },
  { title: "اعتبارسنجی و انتخاب مدل", sub: "k-fold، bias-variance، regularization", status: "locked", kinds: ["ویدئو", "تمرین"], duration: "۱ ساعت" },
  { title: "درخت تصمیم و جنگل تصادفی", sub: "از ID3 تا XGBoost", status: "locked", kinds: ["ویدئو", "پروژه"], duration: "۲ ساعت" },
  { title: "شبکه عصبی · مقدمات", sub: "perceptron، backprop، توابع فعال‌سازی", status: "locked", kinds: ["ویدئو", "کدنویسی"], duration: "۲ ساعت" },
  { title: "CNN برای بینایی", sub: "کانولوشن، pooling، architectures کلاسیک", status: "locked", kinds: ["لایو", "پروژه"], duration: "۲.۵ ساعت" },
];

window.CoursePage = CoursePage;
