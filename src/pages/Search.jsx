// =====================================================
// Search — Semantic search across courses, video, docs
// =====================================================
const SearchPage = ({ go }) => {
  const [query, setQuery] = React.useState("گرادیان نزولی با مومنتوم");
  const [mode, setMode] = React.useState("hybrid");

  return (
    <main data-screen-label="09 جستجو">
      <section className="search-hero shell">
        <span className="eyebrow" style={{ justifyContent: "center" }}>SEMANTIC SEARCH · HYBRID RETRIEVAL</span>
        <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(36px, 4.5vw, 72px)" }}>
          هر جمله‌ای که در کلاس گفته شد،
          <br /><span style={{ color: "var(--cyan)" }}>قابل جستجو است</span>
        </h1>

        <div className="search-bar">
          <Icon name="search" size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بپرس... (مثلاً: تفاوت overfitting و underfitting)" />
          <span className="mono" style={{ color: "var(--fg-mute)" }}>⌘ K</span>
        </div>

        <div className="search-chips">
          {[
            ["hybrid", "هیبرید (BM25 + معنایی)"],
            ["semantic", "فقط معنایی"],
            ["keyword", "فقط کلمه‌ای"],
            ["instructor", "صحبت استاد"],
            ["student", "پرسش دانشجو"],
          ].map(([id, lbl]) => (
            <span key={id} onClick={() => setMode(id)} className={"pill " + (mode === id ? "pill-cyan" : "")} style={{ cursor: "pointer" }}>
              {lbl}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 24, fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>
          ۴۲ نتیجه در ۲۳ میلی‌ثانیه · رتبه‌بندی هیبرید
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: 80 }}>
        {/* AI synthesized answer */}
        <div className="card" style={{ padding: 32, marginBottom: 32, background: "linear-gradient(135deg, color-mix(in oklch, var(--violet) 10%, var(--surface)), var(--surface))", border: "1px solid color-mix(in oklch, var(--violet) 30%, var(--line))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--violet)", marginBottom: 18 }}>
            <Icon name="sparkle" size={18} />
            <span className="mono" style={{ letterSpacing: "0.1em" }}>AI ANSWER · RAG · GROUNDED</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.8 }}>
            گرادیان نزولی با مومنتوم نسخه‌ای از SGD است که در آن میانگین متحرک نمایی از گرادیان‌های قبلی نگه داشته می‌شود. این کار باعث می‌شود مدل از minimaهای محلی عبور کند و در جهت‌های با گرادیان پایدار سریع‌تر حرکت کند. فرمول اصلی: <span style={{ fontFamily: "var(--f-mono)", color: "var(--amber)" }}>v_t = β·v_{"{t-1}"} + (1-β)·∇L</span>، که β معمولاً ۰.۹ است.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            <span className="pill" style={{ fontSize: 10 }}>۴ منبع</span>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>CS-410 جلسه ۸</span>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>جزوه ماژول ۴</span>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>کوییز ۳ — توضیح</span>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {RESULTS.map((r, i) => (
            <div key={i} className="search-result" onClick={() => go("classroom")}>
              <div className="search-thumb">
                <div className="play-trig"><Icon name="play" size={14} /></div>
                <span className="ts">{r.timestamp}</span>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span className="pill" style={{ fontSize: 10 }}>{r.course}</span>
                  <span className={"pill " + (r.role === "instructor" ? "pill-cyan" : "pill-amber")} style={{ fontSize: 10 }}>
                    {r.role === "instructor" ? "استاد" : r.role === "student" ? "دانشجو" : "جزوه"}
                  </span>
                  <span className="mono" style={{ color: "var(--fg-dim)" }}>score {r.score}</span>
                </div>
                <h4 style={{ fontSize: 17, marginBottom: 10 }}>{r.title}</h4>
                <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7 }}>{r.excerpt}</p>
                <div style={{ display: "flex", gap: 14, marginTop: 14, fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)" }}>
                  <span>{r.speaker}</span>
                  <span>·</span>
                  <span>{r.date}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="btn btn-ghost btn-sm"><Icon name="play" size={13} /> پخش</button>
                <button className="btn btn-ghost btn-sm"><Icon name="file" size={13} /> متن</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const RESULTS = [
  { course: "CS-410", role: "instructor", title: "مومنتوم در گرادیان نزولی — شهود توپ سراشیبی", excerpt: "...اینجاست که مومنتوم به کمک می‌آید. به نوعی حافظه‌ی کوتاه‌مدت از گرادیان‌های قبلی نگه می‌دارد...", speaker: "دکتر عظیمی", date: "جلسه ۸ · ۸ اسفند", timestamp: "۴۲:۴۸", score: "۰.۹۴" },
  { course: "CS-410", role: "instructor", title: "فرمول v_t و انتخاب β", excerpt: "...بنابراین v_t برابر است با β ضرب در v_{t-1} به علاوه‌ی (۱-β) ضرب در گرادیان. در عمل β معمولاً ۰.۹ است...", speaker: "دکتر عظیمی", date: "جلسه ۸ · ۸ اسفند", timestamp: "۴۳:۱۲", score: "۰.۹۱" },
  { course: "CS-620", role: "instructor", title: "Adam optimizer — ترکیب مومنتوم و RMSProp", excerpt: "...Adam هم مومنتوم گرادیان را نگه می‌دارد و هم مقیاس آن را با میانگین متحرک نمایی از مربعات کنترل می‌کند...", speaker: "دکتر موسوی", date: "جلسه ۳ · ۲۲ بهمن", timestamp: "۲۸:۱۴", score: "۰.۸۷" },
  { course: "CS-410", role: "student", title: "سوال نسرین: تفاوت با میانگین متحرک نمایی", excerpt: "...تفاوت مومنتوم با میانگین متحرک نمایی چیست؟ آیا اینها یک چیز هستند؟...", speaker: "نسرین رضوی", date: "جلسه ۸ · ۸ اسفند", timestamp: "۴۳:۲۸", score: "۰.۸۲" },
  { course: "CS-410", role: "doc", title: "جزوه ماژول ۴ — بهینه‌سازی", excerpt: "...در عمل، مومنتوم باعث می‌شود مسیر بهینه‌سازی نوسان کمتری داشته باشد و سریع‌تر همگرا شود. این به‌ویژه در شبکه‌های عصبی عمیق اهمیت دارد...", speaker: "متن مرجع", date: "PDF · صفحه ۲۳", timestamp: "—", score: "۰.۷۸" },
];

window.SearchPage = SearchPage;
