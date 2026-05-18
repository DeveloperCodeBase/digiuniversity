// =====================================================
// Schools / Faculties / Programs — full university structure
// Virtual Lab — simulation environment
// Research — PhD / thesis
// =====================================================

// =====================================================
// Schools — top-level faculty landing
// =====================================================
const SchoolsPage = ({ go }) => {
  return (
    <main data-screen-label="26 دانشکده‌ها">
      <section style={{ padding: "80px 0 40px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <span className="eyebrow">SCHOOLS · ۸ دانشکده · ۲۴۸ برنامه</span>
          <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(40px, 5vw, 80px)" }}>
            یک دانشگاه کامل،<br />
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>تمام دیجیتال</span>
          </h1>
          <p className="lead" style={{ marginTop: 20, maxWidth: 680 }}>
            از مهندسی و علوم پزشکی تا علوم انسانی و هنر. ۲۴۸ برنامه‌ی آکادمیک در ۵ مقطع — همگی با کلاس زنده، آزمایشگاه مجازی، و گواهی قابل اثبات.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "60px 40px" }}>
        <div className="grid grid-2" style={{ gap: 20 }}>
          {SCHOOLS.map((s, i) => (
            <div key={s.id} className="card" style={{ padding: 32, cursor: "pointer" }} onClick={() => go("programs")}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em" }}>{toFa("0" + (i + 1))}/۰۸ · {s.code}</span>
                <span className="pill" style={{ fontSize: 10 }}>{toFa(s.programs)} برنامه</span>
              </div>
              <h2 className="h-2" style={{ marginBottom: 10 }}>{s.name}</h2>
              <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7, marginBottom: 24 }}>{s.desc}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>برنامه‌های شاخص</div>
                {s.featured.map((f, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{f.t}</div>
                      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{f.lvl} · {f.dur}</div>
                    </div>
                    <Icon name="arrow" size={14} stroke={2} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 18, fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>
                  <span><strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(s.faculty)}</strong> استاد</span>
                  <span><strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(s.students)}</strong> دانشجو</span>
                  <span><strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(s.labs)}</strong> آزمایشگاه</span>
                </div>
                <button className="btn btn-ghost btn-sm">مشاهده ←</button>
              </div>
            </div>
          ))}
        </div>

        {/* Degree levels strip */}
        <div className="card" style={{ padding: 40, marginTop: 40 }}>
          <span className="eyebrow">DEGREE LEVELS</span>
          <h2 className="h-2" style={{ marginTop: 16, marginBottom: 28 }}>پنج مقطع تحصیلی</h2>
          <div className="grid grid-3" style={{ gap: 16 }}>
            {[
              { t: "کاردانی فنی-حرفه‌ای", code: "AS", d: "۲ ساله · مهارت‌محور", n: 18 },
              { t: "کارشناسی (B.Sc/B.A)", code: "BS", d: "۴ ساله · پایه‌ی علمی", n: 86 },
              { t: "کارشناسی ارشد (M.Sc/M.A/MBA)", code: "MS", d: "۲ ساله · تخصصی", n: 92 },
              { t: "دکتری تخصصی (Ph.D)", code: "PHD", d: "۴+ سال · پژوهش‌محور", n: 38 },
              { t: "دکتری حرفه‌ای (M.D / D.D.S)", code: "MD", d: "۶-۷ ساله · بالینی", n: 8 },
              { t: "گواهی‌نامه‌ی حرفه‌ای", code: "CERT", d: "۴-۱۲ ماه · مهارت ویژه", n: 124 },
            ].map((d, i) => (
              <div key={d.code} className="card-flat" style={{ padding: 22 }}>
                <div className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>{d.code}</div>
                <h4 style={{ fontSize: 17, marginBottom: 6 }}>{d.t}</h4>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{d.d}</div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>
                  <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(d.n)}</strong> برنامه فعال
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const SCHOOLS = [
  {
    id: "eng", code: "ENG", name: "دانشکده مهندسی",
    desc: "مهندسی کامپیوتر، برق، مکانیک، عمران، صنایع، شیمی، نفت، هوا فضا و مواد. با آزمایشگاه‌های شبیه‌سازی صنعتی.",
    programs: 48, faculty: 24, students: 2840, labs: 18,
    featured: [
      { t: "مهندسی کامپیوتر — هوش مصنوعی", lvl: "ارشد", dur: "۲ سال" },
      { t: "مهندسی برق — سیستم‌های قدرت هوشمند", lvl: "دکتری", dur: "۴ سال" },
      { t: "مهندسی صنایع — بهینه‌سازی", lvl: "کارشناسی", dur: "۴ سال" },
    ],
  },
  {
    id: "med", code: "MED", name: "دانشکده علوم پزشکی",
    desc: "پزشکی عمومی، دندان‌پزشکی، داروسازی، پرستاری، پاراپزشکی. شامل آزمایشگاه‌های مجازی آناتومی، شبیه‌سازی بالینی، و کیس‌محور.",
    programs: 22, faculty: 18, students: 1240, labs: 12,
    featured: [
      { t: "پزشکی عمومی", lvl: "M.D", dur: "۷ سال" },
      { t: "بیوانفورماتیک پزشکی", lvl: "ارشد", dur: "۲ سال" },
      { t: "پرستاری بالینی", lvl: "کارشناسی", dur: "۴ سال" },
    ],
  },
  {
    id: "sci", code: "SCI", name: "دانشکده علوم پایه",
    desc: "ریاضی، آمار، فیزیک، شیمی، زیست‌شناسی. با شبیه‌سازی محاسباتی و آزمایشگاه‌های مجازی فیزیک کوانتومی و شیمی آلی.",
    programs: 32, faculty: 16, students: 1840, labs: 14,
    featured: [
      { t: "ریاضیات کاربردی", lvl: "ارشد", dur: "۲ سال" },
      { t: "فیزیک نظری", lvl: "دکتری", dur: "۴ سال" },
      { t: "آمار محاسباتی", lvl: "کارشناسی", dur: "۴ سال" },
    ],
  },
  {
    id: "ds", code: "DS", name: "دانشکده علوم داده و AI",
    desc: "علوم داده، یادگیری ماشین، NLP، بینایی ماشین، رباتیک. آزمایشگاه‌های GPU، شبیه‌سازی محیط‌های یادگیری تقویتی.",
    programs: 24, faculty: 14, students: 1620, labs: 8,
    featured: [
      { t: "یادگیری ماشین کاربردی", lvl: "ارشد", dur: "۲ سال" },
      { t: "هوش مصنوعی توضیح‌پذیر", lvl: "دکتری", dur: "۴ سال" },
      { t: "علوم داده", lvl: "کارشناسی", dur: "۴ سال" },
    ],
  },
  {
    id: "biz", code: "BIZ", name: "دانشکده مدیریت و اقتصاد",
    desc: "مدیریت بازرگانی، MBA، حسابداری، مالی، اقتصاد، بازاریابی دیجیتال، مدیریت پلتفرم.",
    programs: 28, faculty: 12, students: 1480, labs: 4,
    featured: [
      { t: "MBA · مدیریت پلتفرم", lvl: "ارشد", dur: "۱۸ ماه" },
      { t: "اقتصاد محاسباتی", lvl: "دکتری", dur: "۴ سال" },
      { t: "مدیریت محصول دیجیتال", lvl: "حرفه‌ای", dur: "۴ ماه" },
    ],
  },
  {
    id: "hum", code: "HUM", name: "دانشکده علوم انسانی",
    desc: "زبان‌شناسی، فلسفه، تاریخ، روان‌شناسی، جامعه‌شناسی. تأکید ویژه بر زبان‌شناسی محاسباتی و فلسفه‌ی هوش مصنوعی.",
    programs: 34, faculty: 18, students: 1240, labs: 3,
    featured: [
      { t: "زبان‌شناسی محاسباتی", lvl: "دکتری", dur: "۴ سال" },
      { t: "فلسفه‌ی ذهن و AI", lvl: "ارشد", dur: "۲ سال" },
      { t: "روان‌شناسی شناختی", lvl: "کارشناسی", dur: "۴ سال" },
    ],
  },
  {
    id: "art", code: "ART", name: "دانشکده هنر و معماری",
    desc: "طراحی، معماری، هنرهای دیجیتال، انیمیشن، طراحی محصول. با ابزارهای 3D، VR و طراحی پارامتری.",
    programs: 18, faculty: 10, students: 920, labs: 6,
    featured: [
      { t: "طراحی محصول دیجیتال", lvl: "ارشد", dur: "۲ سال" },
      { t: "معماری پارامتری", lvl: "کارشناسی", dur: "۵ سال" },
      { t: "هنرهای محاسباتی", lvl: "ارشد", dur: "۲ سال" },
    ],
  },
  {
    id: "law", code: "LAW", name: "دانشکده حقوق و علوم سیاسی",
    desc: "حقوق عمومی، حقوق فناوری، حقوق بین‌الملل، علوم سیاسی، روابط بین‌الملل. حقوق هوش مصنوعی به‌عنوان گرایش جدید.",
    programs: 22, faculty: 12, students: 1080, labs: 0,
    featured: [
      { t: "حقوق فناوری و AI", lvl: "ارشد", dur: "۲ سال" },
      { t: "حقوق عمومی", lvl: "دکتری", dur: "۴ سال" },
      { t: "علوم سیاسی", lvl: "کارشناسی", dur: "۴ سال" },
    ],
  },
];

// =====================================================
// Virtual Lab — simulation page
// =====================================================
const VirtualLabPage = ({ go }) => {
  const [activeTab, setActiveTab] = React.useState("anatomy");

  return (
    <main data-screen-label="27 آزمایشگاه" style={{ background: "#0d0d0c", color: "#f5f0e3", minHeight: "calc(100vh - 64px)" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="mono" style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.1em" }}>VIRTUAL LAB · شبیه‌سازی</div>
          <h1 style={{ fontSize: 22, marginTop: 4, fontFamily: "var(--f-display)" }}>آزمایشگاه آناتومی — قلب و سیستم گردش خون</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(34, 197, 94, 0.15)", borderRadius: 4, fontFamily: "var(--f-mono)", fontSize: 11, color: "oklch(0.7 0.18 145)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 50, background: "currentColor" }}></span>
            GPU سرور فعال
          </span>
          <button style={{ padding: "8px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#f5f0e3", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>
            <Icon name="settings" size={13} /> تنظیمات
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 320px", gap: 0, height: "calc(100vh - 132px)" }}>
        {/* Left: tools */}
        <aside style={{ padding: 16, borderLeft: "1px solid rgba(255,255,255,0.08)", overflow: "auto" }}>
          <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginBottom: 10 }}>ابزارها</div>
          {[
            { ic: "search", t: "بزرگ‌نمایی", k: "Z" },
            { ic: "target", t: "برش مقطعی", k: "X" },
            { ic: "eye", t: "نمای شفاف", k: "V" },
            { ic: "play", t: "انیمیشن جریان", k: "Space" },
            { ic: "layers", t: "لایه‌ها", k: "L" },
            { ic: "chip", t: "بزن نشانه", k: "M" },
          ].map((t, i) => (
            <button key={i} style={{
              width: "100%", padding: 12, marginBottom: 6,
              background: i === 0 ? "rgba(255,255,255,0.06)" : "transparent",
              border: "1px solid " + (i === 0 ? "rgba(255,255,255,0.15)" : "transparent"),
              borderRadius: 6,
              color: "#f5f0e3", fontFamily: "inherit", fontSize: 13,
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "right",
            }}>
              <Icon name={t.ic} size={14} />
              <span style={{ flex: 1 }}>{t.t}</span>
              <kbd style={{ padding: "1px 6px", background: "rgba(255,255,255,0.08)", borderRadius: 3, fontFamily: "var(--f-mono)", fontSize: 10 }}>{t.k}</kbd>
            </button>
          ))}

          <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginTop: 24, marginBottom: 10 }}>لایه‌ها</div>
          {[
            ["پوست", true],
            ["عضلات", true],
            ["استخوان‌ها", false],
            ["دستگاه گردش خون", true],
            ["دستگاه عصبی", false],
            ["اعضای داخلی", true],
          ].map(([t, on], i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked={on} style={{ accentColor: "oklch(0.7 0.18 145)" }} />
              {t}
            </label>
          ))}
        </aside>

        {/* Center: 3D viewport */}
        <div style={{ position: "relative", background: "radial-gradient(circle at 50% 50%, oklch(0.15 0.04 270), #050505)", display: "grid", placeItems: "center", overflow: "hidden" }}>
          {/* Mock 3D anatomy view */}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 23px, rgba(255,255,255,0.02) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,0.02) 23px 24px)" }}></div>

          <div style={{ position: "relative", width: 380, height: 480, display: "grid", placeItems: "center" }}>
            {/* Heart shape via SVG */}
            <svg viewBox="0 0 200 200" width="280" height="280" style={{ filter: "drop-shadow(0 0 60px oklch(0.55 0.22 25 / 0.4))" }}>
              <defs>
                <radialGradient id="heart-grad" cx="40%" cy="35%">
                  <stop offset="0%" stopColor="oklch(0.7 0.22 25)" />
                  <stop offset="60%" stopColor="oklch(0.5 0.2 20)" />
                  <stop offset="100%" stopColor="oklch(0.3 0.15 15)" />
                </radialGradient>
              </defs>
              <path d="M100 180 C 60 140, 20 110, 20 70 C 20 40, 50 25, 70 35 C 85 42, 100 55, 100 70 C 100 55, 115 42, 130 35 C 150 25, 180 40, 180 70 C 180 110, 140 140, 100 180 Z" fill="url(#heart-grad)" stroke="oklch(0.55 0.18 20)" strokeWidth="1" />
              {/* Aorta */}
              <path d="M95 45 Q 100 20 110 18 Q 120 18 122 35" fill="none" stroke="oklch(0.6 0.16 20)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
              {/* Labels */}
              <line x1="60" y1="80" x2="20" y2="60" stroke="oklch(0.7 0.18 145)" strokeWidth="0.5" />
              <line x1="140" y1="80" x2="180" y2="60" stroke="oklch(0.7 0.18 145)" strokeWidth="0.5" />
              <line x1="100" y1="100" x2="180" y2="120" stroke="oklch(0.7 0.18 145)" strokeWidth="0.5" />
            </svg>

            {/* Labels */}
            <div style={{ position: "absolute", top: 40, left: -20, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, fontFamily: "var(--f-mono)", fontSize: 11, color: "oklch(0.7 0.18 145)" }}>
              ← دهلیز چپ
            </div>
            <div style={{ position: "absolute", top: 40, right: -10, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, fontFamily: "var(--f-mono)", fontSize: 11, color: "oklch(0.7 0.18 145)" }}>
              دهلیز راست →
            </div>
            <div style={{ position: "absolute", bottom: 100, right: -10, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, fontFamily: "var(--f-mono)", fontSize: 11, color: "oklch(0.7 0.18 145)" }}>
              بطن راست →
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: 8, borderRadius: 10 }}>
            {["play","pause","arrow","layers","share"].map((ic, i) => (
              <button key={i} style={{ width: 36, height: 36, borderRadius: 6, background: i === 0 ? "oklch(0.55 0.22 25)" : "transparent", border: "1px solid " + (i === 0 ? "transparent" : "rgba(255,255,255,0.1)"), color: i === 0 ? "white" : "#f5f0e3", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Icon name={ic === "pause" ? "play" : ic} size={14} />
              </button>
            ))}
          </div>

          {/* Top right HUD */}
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--f-mono)", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
            <span>FPS: {toFa(60)}</span>
            <span>Latency: {toFa(18)}ms</span>
            <span>GPU: 32%</span>
          </div>
        </div>

        {/* Right: info panel */}
        <aside style={{ padding: 20, borderRight: "1px solid rgba(255,255,255,0.08)", overflow: "auto" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 18, padding: 3, background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
            {[
              ["anatomy", "آناتومی"],
              ["physiology", "فیزیولوژی"],
              ["clinical", "بالینی"],
            ].map(([id, lbl]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                flex: 1, padding: "6px 8px",
                background: activeTab === id ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none", borderRadius: 4,
                color: activeTab === id ? "#f5f0e3" : "rgba(255,255,255,0.5)",
                fontFamily: "inherit", fontSize: 11, cursor: "pointer",
              }}>{lbl}</button>
            ))}
          </div>

          <h3 style={{ fontSize: 16, fontFamily: "var(--f-display)" }}>قلب · Cardium</h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginTop: 12 }}>
            قلب یک عضله‌ی توخالی به اندازه‌ی مشت است که در میان دو ریه قرار دارد. وظیفه‌ی اصلی آن پمپاژ خون به سراسر بدن از طریق دستگاه گردش خون است.
          </p>

          <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginTop: 24, marginBottom: 10 }}>اطلاعات کلیدی</div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: 12 }}>
            {[
              ["تعداد دهلیز", "۲"],
              ["تعداد بطن", "۲"],
              ["ضربان نرمال", "۶۰-۱۰۰ bpm"],
              ["وزن", "۲۵۰-۳۵۰ گرم"],
              ["خون پمپاژ روزانه", "۷,۵۰۰ لیتر"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: k === "تعداد دهلیز" ? "none" : "1px solid rgba(255,255,255,0.08)", fontSize: 12 }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{k}</span>
                <span style={{ fontFamily: "var(--f-mono)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginTop: 24, marginBottom: 10 }}>تمرین این بخش</div>
          <button style={{ width: "100%", padding: 12, background: "oklch(0.55 0.22 25)", color: "white", border: "none", borderRadius: 6, fontFamily: "inherit", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            شروع کوییز تشخیصی
            <Icon name="arrow" size={13} />
          </button>
        </aside>
      </div>
    </main>
  );
};

// =====================================================
// Labs Catalog
// =====================================================
const LabsPage = ({ go }) => (
  <main data-screen-label="28 آزمایشگاه‌ها">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">VIRTUAL LABS · ۶۵ آزمایشگاه مجازی</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>آزمایشگاه‌های مجازی</h1>
        <p className="lead" style={{ marginTop: 14, maxWidth: 720 }}>
          از شبیه‌سازی آناتومی ۳D با کیفیت آناتومی هاروارد تا محیط‌های یادگیری تقویتی Gym،
          محیط‌های CAD مهندسی، آزمایشگاه شیمی آلی، و sandbox کدنویسی پیشرفته.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px 40px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {["همه", "پزشکی", "مهندسی", "علوم پایه", "AI/Data", "شیمی", "فیزیک", "کدنویسی"].map((t, i) => (
          <span key={t} className={"pill " + (i === 0 ? "pill-cyan" : "")} style={{ cursor: "pointer" }}>{t}</span>
        ))}
      </div>

      <div className="grid grid-3">
        {LABS.map((l, i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }} onClick={() => go("virtuallab")}>
            <div style={{ aspectRatio: "16/9", background: l.bg, position: "relative", display: "grid", placeItems: "center" }}>
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 16px)" }}></div>
              <div style={{ color: "white", fontFamily: "var(--f-mono)", fontSize: 14, letterSpacing: "0.1em", fontWeight: 700, position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontFamily: "var(--f-display)", fontWeight: 800, marginBottom: 4 }}>{l.code}</div>
                <div style={{ opacity: 0.8 }}>{l.field}</div>
              </div>
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                {l.realtime && <span className="pill pill-cyan" style={{ fontSize: 9, background: "rgba(255,255,255,0.9)", color: "var(--accent)", border: "none" }}>realtime</span>}
                {l.gpu && <span className="pill" style={{ fontSize: 9, background: "rgba(0,0,0,0.5)", color: "white", border: "none" }}>GPU</span>}
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <h4 style={{ fontSize: 16, marginBottom: 6 }}>{l.t}</h4>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.5 }}>{l.d}</div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>
                <span>{l.duration}</span>
                <span style={{ color: "var(--accent)" }}>ورود به آزمایشگاه ←</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

const LABS = [
  { code: "ANAT", field: "ANATOMY · 3D", t: "آناتومی تعاملی — قلب و گردش خون", d: "شبیه‌سازی ۳D با لایه‌بندی کامل، نمای مقطعی، انیمیشن جریان خون.", duration: "متوسط ۴۵ دقیقه", realtime: false, gpu: true, bg: "linear-gradient(135deg, oklch(0.45 0.2 25), oklch(0.3 0.16 20))" },
  { code: "MD-SIM", field: "CLINICAL · SIMULATION", t: "شبیه‌سازی بالینی — اورژانس", d: "کیس واقعی، تصمیم‌گیری مرحله به مرحله، بازخورد AI.", duration: "۹۰ دقیقه", realtime: true, gpu: false, bg: "linear-gradient(135deg, oklch(0.4 0.18 20), oklch(0.25 0.15 15))" },
  { code: "RL-GYM", field: "AI · REINFORCEMENT", t: "Reinforcement Learning Gym", d: "CartPole، MountainCar، LunarLander، Atari — محیط‌های استاندارد آماده.", duration: "open", realtime: true, gpu: true, bg: "linear-gradient(135deg, oklch(0.4 0.15 270), oklch(0.25 0.12 260))" },
  { code: "CAD", field: "ENG · CAD/CAM", t: "مدل‌سازی پارامتری CAD", d: "محیط مدل‌سازی سه‌بعدی با simulation تنش و حرارت.", duration: "open", realtime: false, gpu: true, bg: "linear-gradient(135deg, oklch(0.4 0.14 220), oklch(0.25 0.12 240))" },
  { code: "CHEM", field: "CHEMISTRY · MOLEC", t: "شیمی آلی — مولکول‌سازی", d: "ساخت مولکول، شبیه‌سازی واکنش، نمای ۳D باندها.", duration: "۶۰ دقیقه", realtime: false, gpu: true, bg: "linear-gradient(135deg, oklch(0.4 0.15 150), oklch(0.25 0.12 145))" },
  { code: "PHYS-Q", field: "PHYSICS · QUANTUM", t: "آزمایش‌های مکانیک کوانتومی", d: "دو شکاف، آزمایش بل، حالت‌های اسپین. تعاملی و قابل پارامتری‌سازی.", duration: "۹۰ دقیقه", realtime: true, gpu: true, bg: "linear-gradient(135deg, oklch(0.35 0.16 285), oklch(0.22 0.13 280))" },
  { code: "SHELL", field: "CS · TERMINAL", t: "Linux Terminal Sandbox", d: "محیط لینوکس کامل با امکان نصب پکیج و اجرای پروژه.", duration: "open", realtime: true, gpu: false, bg: "linear-gradient(135deg, oklch(0.25 0.05 240), oklch(0.15 0.04 240))" },
  { code: "DATA", field: "DS · JUPYTER", t: "Jupyter Notebook · GPU", d: "محیط Python با PyTorch، TensorFlow، scikit-learn و GPU.", duration: "open", realtime: true, gpu: true, bg: "linear-gradient(135deg, oklch(0.4 0.12 75), oklch(0.25 0.1 70))" },
  { code: "EE", field: "ELECTRICAL · CIRCUIT", t: "Circuit Simulator", d: "آنالوگ و دیجیتال، شبیه‌سازی time-domain و frequency.", duration: "open", realtime: true, gpu: false, bg: "linear-gradient(135deg, oklch(0.4 0.14 60), oklch(0.25 0.12 50))" },
];

// =====================================================
// Research / PhD Studio
// =====================================================
const ResearchPage = ({ go }) => (
  <main data-screen-label="29 پژوهش">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">RESEARCH · پژوهش</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>محیط پژوهشی دکتری</h1>
        <p className="lead" style={{ marginTop: 14, maxWidth: 720 }}>
          از یافتن استاد راهنما تا دفاع پایان‌نامه. هر دانشجوی دکتری یک workspace دائمی با ابزارهای پژوهش، ارتباط با گروه، و ردیابی پیشرفت دارد.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
        <div>
          {/* Active dissertation */}
          <div className="card" style={{ padding: 36, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <span className="pill pill-cyan" style={{ fontSize: 10 }}>پایان‌نامه فعال</span>
              <span className="pill" style={{ fontSize: 10 }}>Year 3 of 4</span>
              <span className="pill pill-violet" style={{ fontSize: 10 }}>مرحله: گردآوری</span>
            </div>
            <h2 className="h-2" style={{ marginBottom: 8 }}>
              مدل‌های زبانی فارسی با توجه به ساختار صرفی پیچیده
            </h2>
            <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              توسعه‌ی روش‌های جدید tokenization و pre-training برای زبان‌های با morphology غنی، با تمرکز بر فارسی.
            </p>

            <div style={{ display: "flex", gap: 32, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>استاد راهنما</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div className="avatar amber" style={{ width: 28, height: 28, fontSize: 10 }}>SM</div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>دکتر موسوی</span>
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>مشاوران</div>
                <div style={{ display: "flex", gap: -4, marginTop: 8 }}>
                  <div className="avatar cyan" style={{ width: 28, height: 28, fontSize: 9 }}>AA</div>
                  <div className="avatar violet" style={{ width: 28, height: 28, fontSize: 9, marginRight: -8 }}>RT</div>
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>پیشرفت</div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 22, fontWeight: 700, color: "var(--accent)", marginTop: 6 }}>۶۴٪</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>مهلت دفاع</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>دی ۱۴۰۶</div>
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <h3 className="h-3" style={{ marginBottom: 18 }}>نقشه‌ی راه</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {[
              { t: "بررسی پیشینه", s: "done", w: "هفته ۲ تا ۸" },
              { t: "تعیین مسئله و فرضیه‌ها", s: "done", w: "هفته ۸ تا ۱۲" },
              { t: "پروپوزال و دفاع", s: "done", w: "هفته ۱۲ تا ۱۶" },
              { t: "گردآوری داده — فارسی", s: "current", w: "هفته ۱۶ تا ۲۸" },
              { t: "پیاده‌سازی baseline", s: "current", w: "هفته ۲۴ تا ۳۲" },
              { t: "آزمایش‌ها", s: "todo", w: "هفته ۳۲ تا ۴۸" },
              { t: "تحلیل و نگارش", s: "todo", w: "هفته ۴۸ تا ۶۰" },
              { t: "دفاع نهایی", s: "todo", w: "هفته ۶۰" },
            ].map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr auto auto", gap: 16, padding: 18, borderTop: i > 0 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 50,
                  background: m.s === "done" ? "var(--accent)" : m.s === "current" ? "var(--accent-soft)" : "var(--surface-2)",
                  color: m.s === "done" ? "var(--accent-on)" : m.s === "current" ? "var(--accent)" : "var(--fg-dim)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 700,
                }}>
                  {m.s === "done" ? <Icon name="check" size={13} stroke={3} /> : toFa(i + 1)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.t}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2, fontFamily: "var(--f-mono)" }}>{m.w}</div>
                </div>
                <span className={"pill " + (m.s === "done" ? "pill-cyan" : m.s === "current" ? "pill-violet" : "")} style={{ fontSize: 9 }}>
                  {m.s === "done" ? "تکمیل" : m.s === "current" ? "فعال" : "آینده"}
                </span>
                <button className="btn btn-ghost btn-sm"><Icon name="arrow" size={13} /></button>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14 }}>منابع پژوهشی</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {[
                ["مقالات مرتبط", "۱۲۸"],
                ["یادداشت‌های شخصی", "۴۲"],
                ["داده‌های گردآوری شده", "۱۸"],
                ["آزمایش‌های انجام شده", "۳۴"],
              ].map(([t, n], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none", fontSize: 13 }}>
                  <span>{t}</span>
                  <span style={{ fontFamily: "var(--f-mono)", fontWeight: 600, color: "var(--accent)" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14 }}>مقالات منتشر شده</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {[
                { t: "Persian Sub-word Tokenization", venue: "ACL Workshop 2025", status: "منتشر شد" },
                { t: "Morphology-Aware Pre-training", venue: "EMNLP 2025", status: "زیر داوری" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.t}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{p.venue}</span>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: i === 0 ? "var(--accent)" : "var(--gold)" }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14 }}>گروه پژوهشی</h4>
            <p style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6, marginTop: 10 }}>
              عضو گروه «زبان‌شناسی محاسباتی فارسی» — ۱۲ پژوهشگر فعال، جلسه‌ی هفتگی پنج‌شنبه‌ها.
            </p>
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 14, fontSize: 12 }}>
              <Icon name="users" size={13} />ورود به فضای گروه
            </button>
          </div>
        </aside>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

window.SchoolsPage = SchoolsPage;
window.VirtualLabPage = VirtualLabPage;
window.LabsPage = LabsPage;
window.ResearchPage = ResearchPage;
