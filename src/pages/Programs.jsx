// =====================================================
// Programs / Catalog page
// =====================================================
const ProgramsPage = ({ go }) => {
  const programs = [
    { num: "۰۱", title: "علوم داده و هوش مصنوعی", desc: "کارشناسی ارشد، چهار ترم، با گرایش‌های یادگیری عمیق، NLP و سیستم‌های توصیه‌گر.", duration: "۱۸ ماه", credits: "۳۶ واحد", level: "ارشد", tags: ["Python", "PyTorch", "MLOps", "ریاضیات کاربردی"] },
    { num: "۰۲", title: "مهندسی نرم‌افزار سامانه‌ای", desc: "کارشناسی ارشد با تمرکز بر معماری توزیع‌شده، DevOps و قابلیت اطمینان سامانه.", duration: "۱۸ ماه", credits: "۳۲ واحد", level: "ارشد", tags: ["DDD", "Kubernetes", "Kafka", "SRE"] },
    { num: "۰۳", title: "مدیریت محصول دیجیتال", desc: "MBA دیجیتال با تمرکز بر داده‌محوری، آزمایش‌گری و استراتژی پلتفرم.", duration: "۱۲ ماه", credits: "۲۴ واحد", level: "MBA", tags: ["Strategy", "Analytics", "UX"] },
    { num: "۰۴", title: "زبان‌شناسی محاسباتی", desc: "دکتری پژوهش‌محور با تمرکز بر زبان فارسی و مدل‌های زبانی بزرگ.", duration: "۴ سال", credits: "—", level: "دکتری", tags: ["LLM", "Persian NLP", "Research"] },
    { num: "۰۵", title: "طراحی تجربه یادگیری", desc: "گواهی حرفه‌ای برای طراحان آموزشی، با پروژه ساخت یک Agent Graph واقعی.", duration: "۴ ماه", credits: "۱۶ واحد", level: "حرفه‌ای", tags: ["LX", "Cognitive Science"] },
    { num: "۰۶", title: "نوآوری آموزشی و EdTech", desc: "بوت‌کمپ فشرده برای استادان دانشگاه — از تدریس سنتی به همکاری با AI.", duration: "۸ هفته", credits: "—", level: "بوت‌کمپ", tags: ["Teaching", "AI Literacy"] },
  ];

  return (
    <main data-screen-label="02 برنامه‌ها">
      <section className="programs-hero shell">
        <span className="eyebrow" style={{ justifyContent: "center" }}>ACADEMIC PROGRAMS · 2026</span>
        <h1 className="h-display" style={{ marginTop: 24 }}>
          شش مسیر،
          <br /><span style={{ background: "linear-gradient(110deg, var(--cyan), var(--amber))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>یک دانشگاه</span>
        </h1>
        <p className="lead" style={{ margin: "28px auto 0", textAlign: "center" }}>
          از کارشناسی ارشد رسمی تا بوت‌کمپ‌های فشرده. همگی با کلاس زنده، پروفایل شناختی و گواهی دیجیتال قابل راستی‌آزمایی.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <span className="pill pill-cyan">همه</span>
          <span className="pill">ارشد</span>
          <span className="pill">دکتری</span>
          <span className="pill">MBA</span>
          <span className="pill">حرفه‌ای</span>
          <span className="pill">بوت‌کمپ</span>
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: 80 }}>
        <Stagger className="programs-grid">
          {programs.map((p) => (
            <div key={p.num} className="prog-card reveal" onClick={() => go("course")}>
              <span className="num">{p.num}</span>
              <span className="pill" style={{ alignSelf: "flex-start", marginTop: 12 }}>{p.level}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="tags">
                {p.tags.map((t) => <span key={t} className="pill">{t}</span>)}
              </div>
              <div className="footer-row">
                <div>
                  <div className="meta">{p.duration} · {p.credits}</div>
                </div>
                <Icon name="arrow" size={18} />
              </div>
            </div>
          ))}
        </Stagger>
      </section>

      {/* Comparison panel */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: 40 }}>
          <div className="section-head" style={{ marginBottom: 24 }}>
            <div className="text">
              <span className="eyebrow">DELIVERY MODES</span>
              <h2 className="h-2" style={{ marginTop: 14 }}>چهار حالت یادگیری در یک پلتفرم</h2>
            </div>
          </div>
          <div className="grid grid-4">
            {[
              { t: "Live Synchronous", d: "کلاس‌های زنده دو طرفه، breakout room، کوییز زنده", c: "var(--cyan)", lat: "تأخیر < ۲۰۰ms" },
              { t: "Recorded · self-paced", d: "ویدئوهای ضبط‌شده با فصل‌بندی هوشمند و جستجوی معنایی", c: "var(--amber)", lat: "any-time" },
              { t: "Blended cohort", d: "ترکیب زنده و خودخوان با cohort مشترک و peer-review", c: "var(--violet)", lat: "weekly" },
              { t: "Project · mastery", d: "بدون امتحان نهایی. پروژه پایان و rubric شفاف", c: "var(--rose)", lat: "outcome-driven" },
            ].map((m) => (
              <div key={m.t} className="card-flat" style={{ position: "relative", paddingTop: 24 }}>
                <span style={{ position: "absolute", top: 0, right: 0, width: 36, height: 3, background: m.c, borderRadius: "0 0 0 4px" }} />
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: m.c, letterSpacing: "0.06em" }}>{m.lat}</div>
                <h4 style={{ marginTop: 8, fontSize: 16 }}>{m.t}</h4>
                <p style={{ color: "var(--fg-mute)", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

window.ProgramsPage = ProgramsPage;
