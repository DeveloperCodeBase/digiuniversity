// =====================================================
// Adaptive Assessment / Exam interface
// =====================================================
const AssessmentPage = ({ go }) => {
  const [selected, setSelected] = React.useState(1);
  const [current, setCurrent] = React.useState(4);
  const total = 12;

  const steps = Array.from({ length: total }, (_, i) =>
    i < current - 1 ? "done" : i === current - 1 ? "current" : "todo"
  );

  return (
    <main data-screen-label="10 آزمون تطبیقی" style={{ background: "var(--bg-deep)" }}>
      <div className="exam-shell">
        <div className="exam-main">
          {/* Header */}
          <div className="exam-header">
            <div>
              <div className="mono" style={{ color: "var(--cyan)", fontSize: 11, letterSpacing: "0.1em" }}>
                ADAPTIVE TEST · IRT 2PL · CAT
              </div>
              <h2 className="h-3" style={{ marginTop: 8 }}>آزمون میان‌ترم · بهینه‌سازی</h2>
            </div>
            <div className="exam-progress">
              {steps.map((s, i) => <span key={i} className={"step " + s} />)}
            </div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 14, fontWeight: 600 }}>
              {toFa(current)} / {toFa(total)}
            </div>
          </div>

          {/* Question */}
          <div className="exam-question">
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <span className="pill pill-violet" style={{ fontSize: 10 }}>سطح ۳ از ۵ · سختی ۰.۶۸</span>
              <span className="pill" style={{ fontSize: 10 }}>هدف: تنظیم نرخ یادگیری</span>
            </div>
            <div className="stem">
              در گرادیان نزولی با مومنتوم، اگر مقدار <span style={{ fontFamily: "var(--f-mono)", color: "var(--amber)" }}>β = ۰.۹</span> و نرخ یادگیری <span style={{ fontFamily: "var(--f-mono)", color: "var(--amber)" }}>η = ۰.۰۱</span> باشد، تقریباً چند گام گذشته در سرعت فعلی تأثیرگذار است؟
            </div>

            <div className="exam-options">
              {[
                ["A", "حدود ۲ گام", false],
                ["B", "حدود ۱۰ گام", true],
                ["C", "حدود ۹۰ گام", false],
                ["D", "همه‌ی گام‌های قبلی به‌طور یکسان", false],
              ].map(([letter, text, correct], i) => (
                <button key={letter} className={"exam-option " + (selected === i ? "selected" : "")} onClick={() => setSelected(i)}>
                  <span className="letter">{letter}</span>
                  <span>{text}</span>
                  {selected === i && <Icon name="check" size={18} stroke={3} />}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48 }}>
              <button className="btn btn-ghost" onClick={() => setCurrent(Math.max(1, current - 1))}>
                <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} />
                قبلی
              </button>
              <button className="btn btn-outline">
                <Icon name="hand" size={14} />
                علامت‌گذاری برای بازبینی
              </button>
              <button className="btn btn-primary" onClick={() => setCurrent(Math.min(total, current + 1))}>
                ثبت و سوال بعدی
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="exam-aside">
          <div>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>زمان باقی‌مانده</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 48, fontWeight: 700, color: "var(--amber)" }}>۴۸:۲۲</div>
            <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
              <div style={{ width: "32%", height: "100%", background: "var(--amber)", borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)" }}></div>

          <div>
            <div className="mono" style={{ color: "var(--cyan)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>تخمین زنده‌ی سطح</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 700 }}>۰.۷۱</div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>
              ± ۰.۰۸ · در حال همگرایی
            </div>
            <div style={{ marginTop: 14, height: 60 }}>
              <Sparkline values={[0.5, 0.55, 0.6, 0.58, 0.65, 0.68, 0.7, 0.71]} color="var(--cyan)" />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)" }}></div>

          <div>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>سوالات نمای کلی</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
              {Array.from({ length: total }, (_, i) => (
                <div key={i} onClick={() => setCurrent(i + 1)} style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: i < current - 1 ? "var(--cyan)" : i === current - 1 ? "var(--violet)" : "var(--surface-2)",
                  color: i <= current - 1 ? (i === current - 1 ? "white" : "#051418") : "var(--fg-mute)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid " + (i === current - 1 ? "var(--violet)" : "transparent"),
                }}>
                  {toFa(i + 1)}
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)" }}></div>

          <div style={{ padding: 14, background: "color-mix(in oklch, var(--violet) 10%, var(--surface-2))", borderRadius: 10, border: "1px solid color-mix(in oklch, var(--violet) 25%, transparent)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--violet)", marginBottom: 8, fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em" }}>
              <Icon name="shield" size={12} />
              PROCTORING · ACTIVE
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
              نمایش تب مرورگر، الگوی پاسخ‌دهی و زمان هر سوال ثبت می‌شود. هیچ ادعای تقلبی بدون بازبینی انسانی نهایی نمی‌شود.
            </div>
          </div>

          <button className="btn btn-outline" style={{ justifyContent: "center" }}>
            ذخیره و ادامه بعداً
          </button>
        </aside>
      </div>
    </main>
  );
};

window.AssessmentPage = AssessmentPage;
