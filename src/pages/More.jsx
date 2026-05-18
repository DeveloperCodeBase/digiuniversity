// =====================================================
// More pages: Calendar, Library, Help, Pricing, Faculty
// =====================================================

// =====================================================
// Calendar / Schedule
// =====================================================
const CalendarPage = ({ go }) => {
  const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const events = [
    { day: 0, start: 10, dur: 2, t: "یادگیری ماشین", code: "CS-410", kind: "live" },
    { day: 0, start: 14, dur: 1.5, t: "تمرین تطبیقی", code: "AUTO", kind: "self" },
    { day: 1, start: 9, dur: 2, t: "NLP پیشرفته", code: "CS-620", kind: "live" },
    { day: 1, start: 16, dur: 2, t: "آمار بیزی", code: "STAT-440", kind: "live" },
    { day: 2, start: 11, dur: 1.5, t: "گروه مطالعه", code: "PEER", kind: "peer" },
    { day: 2, start: 14, dur: 3, t: "Office Hours", code: "OH", kind: "office" },
    { day: 3, start: 10, dur: 2, t: "یادگیری ماشین", code: "CS-410", kind: "live" },
    { day: 3, start: 18, dur: 1, t: "آزمون میان‌ترم", code: "EXAM", kind: "exam" },
    { day: 4, start: 9, dur: 2, t: "NLP پیشرفته", code: "CS-620", kind: "live" },
    { day: 4, start: 15, dur: 2, t: "کارگاه عملی", code: "WORK", kind: "lab" },
  ];

  const colorFor = (k) => ({
    live: "var(--accent)",
    self: "var(--navy)",
    peer: "var(--sage)",
    office: "var(--fg-mute)",
    exam: "var(--gold)",
    lab: "var(--navy-2)",
  })[k] || "var(--fg-mute)";

  return (
    <main data-screen-label="16 تقویم">
      <div className="dash">
        <RoleSideNav active="calendar" go={go} />
        <div className="dash-main">
          <div className="dash-greet">
            <div>
              <span className="eyebrow">CALENDAR · هفته‌ی جاری</span>
              <h1 style={{ marginTop: 10 }}>تقویم تحصیلی — هفته‌ی ۱۲</h1>
              <p className="muted">۸ کلاس زنده · ۳ تمرین · ۱ آزمون · همگامی با Google Calendar</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline btn-sm">روز</button>
              <button className="btn btn-outline btn-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }}>هفته</button>
              <button className="btn btn-outline btn-sm">ماه</button>
              <button className="btn btn-primary btn-sm"><Icon name="plus" size={13} />رویداد جدید</button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--line)" }}>
              <div style={{ padding: "16px 12px" }}></div>
              {days.map((d, i) => (
                <div key={d} style={{ padding: "16px 12px", textAlign: "center", borderRight: i < 6 ? "1px solid var(--line)" : "none", borderRightColor: "var(--line)" }}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{d}</div>
                  <div style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 700, marginTop: 4, color: i === 0 ? "var(--accent)" : "var(--fg)" }}>{toFa(8 + i)}</div>
                </div>
              ))}
            </div>

            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: 700 }}>
              <div>
                {hours.map((h) => (
                  <div key={h} style={{ height: 60, borderBottom: "1px solid var(--line)", padding: "4px 8px", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>
                    {toFa(h)}:۰۰
                  </div>
                ))}
              </div>
              {days.map((d, di) => (
                <div key={di} style={{ position: "relative", borderRight: di < 6 ? "1px solid var(--line)" : "none" }}>
                  {hours.map((h) => (
                    <div key={h} style={{ height: 60, borderBottom: "1px solid var(--line)" }}></div>
                  ))}
                  {events.filter(e => e.day === di).map((e, ei) => {
                    const top = (e.start - 8) * 60;
                    const height = e.dur * 60;
                    const c = colorFor(e.kind);
                    return (
                      <div key={ei} onClick={() => go("classroom")} style={{
                        position: "absolute",
                        top: top + 2,
                        right: 4, left: 4,
                        height: height - 4,
                        background: "color-mix(in oklch, " + c + " 10%, var(--surface))",
                        borderRight: "3px solid " + c,
                        borderRadius: 6,
                        padding: "8px 12px",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}>
                        <div className="mono" style={{ fontSize: 10, color: c, letterSpacing: "0.06em" }}>{e.code}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>{e.t}</div>
                        <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", marginTop: 2 }}>
                          {toFa(e.start)}:۰۰ — {toFa(e.start + e.dur)}:۰۰
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              ["کلاس زنده", "live"],
              ["تمرین خودخوان", "self"],
              ["گروه مطالعه", "peer"],
              ["Office Hours", "office"],
              ["آزمون", "exam"],
              ["کارگاه", "lab"],
            ].map(([t, k]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-mute)" }}>
                <span style={{ width: 12, height: 3, background: colorFor(k), borderRadius: 999 }}></span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer go={go} />
    </main>
  );
};

// =====================================================
// Library — Resources
// =====================================================
const LibraryPage = ({ go }) => {
  const cats = [
    { id: "all", t: "همه", n: 1284, ic: "folder" },
    { id: "video", t: "ویدئو", n: 524, ic: "video" },
    { id: "pdf", t: "کتاب و مقاله", n: 412, ic: "file" },
    { id: "slide", t: "اسلاید", n: 188, ic: "layers" },
    { id: "code", t: "نوت‌بوک", n: 96, ic: "code" },
    { id: "data", t: "داده", n: 64, ic: "chip" },
  ];

  return (
    <main data-screen-label="17 کتابخانه">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">DIGITAL LIBRARY · ۱۲۸۴ resource</span>
              <h1 className="h-1" style={{ marginTop: 16 }}>کتابخانه‌ی دیجیتال</h1>
              <p className="lead" style={{ marginTop: 14 }}>
                مقالات، کتاب‌ها، نوت‌بوک‌های Jupyter، دیتاست‌ها، اسلایدها. همه با جستجوی معنایی و قابل ارجاع از داخل درس.
              </p>
            </div>
            <button className="btn btn-primary"><Icon name="plus" size={14} />آپلود منبع</button>
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>
          <aside style={{ position: "sticky", top: 90, alignSelf: "start" }}>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>دسته‌ها</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {cats.map((c, i) => (
                <li key={c.id}>
                  <button style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: i === 0 ? "var(--accent-soft)" : "transparent",
                    border: "1px solid " + (i === 0 ? "color-mix(in oklch, var(--accent) 25%, transparent)" : "transparent"),
                    borderRadius: 8,
                    color: i === 0 ? "var(--accent)" : "var(--fg-mute)",
                    fontFamily: "inherit", fontSize: 14,
                    cursor: "pointer",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name={c.ic} size={14} />{c.t}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{toFa(c.n)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginTop: 32, marginBottom: 12 }}>فیلتر</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["زبان: فارسی", "زبان: انگلیسی", "سطح: ارشد", "سطح: کارشناسی", "سال: ۱۴۰۴", "موضوع: ML", "موضوع: NLP"].map((f) => (
                <label key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--fg-mute)", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked={f.includes("فارسی") || f.includes("ML")} style={{ accentColor: "var(--accent)" }} />
                  {f}
                </label>
              ))}
            </div>
          </aside>

          <div>
            <div className="search-bar" style={{ margin: "0 0 32px", maxWidth: "100%" }}>
              <Icon name="search" size={18} />
              <input placeholder="جستجو در کتابخانه — متن کامل، معنایی" />
              <span className="mono" style={{ color: "var(--fg-mute)" }}>⌘ K</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
              <h3 className="h-3">جدیدترین منابع</h3>
              <span className="mono" style={{ color: "var(--fg-mute)", fontSize: 11 }}>۱۲۸۴ نتیجه · ۳۲ صفحه</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LIBRARY_ITEMS.map((it, i) => (
                <div key={i} className="card-flat" style={{ display: "grid", gridTemplateColumns: "60px 1fr auto auto", gap: 18, alignItems: "center", padding: 18 }}>
                  <div style={{
                    width: 48, height: 60, borderRadius: 4,
                    background: it.t === "PDF" ? "var(--gold-soft)" : it.t === "VIDEO" ? "var(--accent-soft)" : it.t === "CODE" ? "var(--sage-soft)" : "var(--navy-soft)",
                    color: it.t === "PDF" ? "var(--gold)" : it.t === "VIDEO" ? "var(--accent)" : it.t === "CODE" ? "var(--sage)" : "var(--navy)",
                    display: "grid", placeItems: "center",
                    fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  }}>
                    {it.t}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{it.title}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--f-mono)" }}>
                      <span>{it.author}</span>
                      <span>·</span>
                      <span>{it.size}</span>
                      <span>·</span>
                      <span>{it.year}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {it.tags.map((t) => <span key={t} className="pill" style={{ fontSize: 9 }}>{t}</span>)}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm"><Icon name="eye" size={13} /></button>
                    <button className="btn btn-outline btn-sm"><Icon name="download" size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const LIBRARY_ITEMS = [
  { t: "PDF", title: "Deep Learning — Goodfellow, Bengio, Courville", author: "MIT Press", size: "۸۰۲ صفحه · ۱۸ MB", year: "۲۰۱۶", tags: ["ML", "DL", "EN"] },
  { t: "VIDEO", title: "ضبط جلسه ۸ — گرادیان نزولی با مومنتوم", author: "دکتر عظیمی · CS-410", size: "۱:۲۸ · ۴۸۰p", year: "۱۴۰۴", tags: ["FA"] },
  { t: "PDF", title: "Attention is All You Need", author: "Vaswani et al. — NeurIPS 2017", size: "۱۵ صفحه · ۱.۲ MB", year: "۲۰۱۷", tags: ["NLP", "EN"] },
  { t: "CODE", title: "Transformer from scratch — Jupyter notebook", author: "دکتر موسوی", size: "۲۴ سلول", year: "۱۴۰۴", tags: ["NLP", "Python"] },
  { t: "PDF", title: "آمار بیزی کاربردی — فصل ۳ و ۴", author: "دکتر فرهادی", size: "۸۲ صفحه · ۴.۱ MB", year: "۱۴۰۴", tags: ["Stats", "FA"] },
  { t: "DATA", title: "Persian Sentiment Corpus — v2", author: "آزمایشگاه NLP فارسی", size: "۱۲۴ MB", year: "۱۴۰۴", tags: ["NLP", "FA"] },
  { t: "VIDEO", title: "کارگاه — معماری میکروسرویس", author: "م. کیانی · CS-580", size: "۲:۱۲ · HD", year: "۱۴۰۴", tags: ["SYS"] },
  { t: "PDF", title: "Pattern Recognition and ML — Bishop", author: "Springer", size: "۷۳۸ صفحه · ۲۲ MB", year: "۲۰۰۶", tags: ["ML", "EN"] },
  { t: "CODE", title: "RAG implementation با LangGraph", author: "آرشیو درس CS-620", size: "Repo", year: "۱۴۰۵", tags: ["NLP", "RAG"] },
];

// =====================================================
// Help Center / Knowledge Base
// =====================================================
const HelpPage = ({ go }) => (
  <main data-screen-label="18 پشتیبانی">
    <section style={{ padding: "80px 0 60px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
      <div className="shell" style={{ textAlign: "center" }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>HELP CENTER · ۲۴/۷</span>
        <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(36px, 5vw, 72px)" }}>
          چطور می‌توانیم کمک کنیم؟
        </h1>
        <div className="search-bar" style={{ margin: "32px auto 0" }}>
          <Icon name="search" size={18} />
          <input placeholder="جستجو در راهنماها، آیین‌نامه‌ها و سوالات متداول" />
          <span className="mono" style={{ color: "var(--fg-mute)" }}>⌘ K</span>
        </div>
      </div>
    </section>

    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="grid grid-3" style={{ marginBottom: 60 }}>
        {[
          { ic: "play", t: "شروع سریع", d: "اولین کلاس، اولین تمرین، اولین گواهی"},
          { ic: "user", t: "حساب کاربری", d: "ثبت‌نام، احراز هویت، تغییر اطلاعات"},
          { ic: "live", t: "کلاس آنلاین", d: "ورود، تنظیم میکروفون، ضبط"},
          { ic: "dollar", t: "پرداخت و شهریه", d: "روش‌های پرداخت، بازگشت وجه"},
          { ic: "cert", t: "گواهی و مدرک", d: "صدور، راستی‌آزمایی، اشتراک"},
          { ic: "sparkle", t: "دستیار AI", d: "نحوه استفاده، محدودیت‌ها، تنظیمات"},
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 28, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
              <Icon name={c.ic} size={18} />
            </div>
            <h3 style={{ fontSize: 18 }}>{c.t}</h3>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6, margin: 0 }}>{c.d}</p>
            <div style={{ marginTop: 4, fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.08em" }}>
              ۱۲ مقاله ←
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32 }}>
        <div>
          <h2 className="h-2" style={{ marginBottom: 24 }}>سوالات متداول</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              ["چطور به اولین کلاس زنده‌ام بپیوندم؟", "از داشبورد، روی برنامه‌ی هفته کلیک کنید. ۱۵ دقیقه قبل از شروع، دکمه‌ی «ورود» فعال می‌شود..."],
              ["آیا گواهی DigiUniversity در ایران رسمی است؟", "گواهی‌های ما با مرجع وزارت علوم همخوانی دارند و در سامانه‌های ملی قابل استعلام هستند..."],
              ["دستیار AI به اطلاعات شخصی من دسترسی دارد؟", "AI Tutor فقط به اطلاعات درسی شما (پیشرفت، تمرین، سوال) دسترسی دارد..."],
              ["در صورت قطعی اینترنت، کلاس از دست می‌رود؟", "خیر. تمام کلاس‌های زنده ضبط می‌شوند و در آرشیو شخصی شما قابل بازیابی هستند..."],
              ["چگونه شهریه را اقساط بپردازم؟", "در مرحله‌ی پرداخت، گزینه‌ی اقساط ۳ ماهه بدون بهره را انتخاب کنید..."],
              ["آیا می‌توانم پروژه‌ی پایان درس را تغییر دهم؟", "تا پیش از انتخاب رسمی، می‌توانید پروژه را تغییر دهید. پس از تایید، نیاز به مجوز استاد دارد..."],
            ].map(([q, a], i) => (
              <details key={i} style={{ borderTop: i > 0 ? "1px solid var(--line)" : "1px solid var(--line)", borderBottom: i === 5 ? "1px solid var(--line)" : "none", padding: 0 }}>
                <summary style={{ padding: "20px 0", cursor: "pointer", fontWeight: 500, fontSize: 16, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <span>{q}</span>
                  <Icon name="plus" size={16} />
                </summary>
                <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7, paddingBottom: 20, margin: 0 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent)", marginBottom: 14 }}>
              <Icon name="headset" size={16} />
              <span className="mono" style={{ letterSpacing: "0.08em" }}>پشتیبانی زنده</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
              تیم پشتیبانی ۲۴/۷ آماده پاسخگویی است. زمان میانگین پاسخ: ۸ دقیقه.
            </p>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
              <Icon name="chat" size={14} />شروع گفتگو
            </button>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div className="mono" style={{ color: "var(--fg-mute)", marginBottom: 14, fontSize: 11, letterSpacing: "0.08em" }}>SYSTEM STATUS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["LMS", "operational"],
                ["کلاس زنده", "operational"],
                ["AI Tutor", "operational"],
                ["پرداخت", "operational"],
                ["ASR · فارسی", "degraded"],
              ].map(([t, s]) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{t}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: s === "operational" ? "var(--sage)" : "var(--gold)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 50, background: "currentColor" }}></span>
                    {s === "operational" ? "سالم" : "بررسی"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>

    <Footer go={go} />
  </main>
);

// =====================================================
// Pricing / Plans
// =====================================================
const PricingPage = ({ go }) => (
  <main data-screen-label="19 پلن‌ها">
    <section style={{ padding: "80px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell" style={{ textAlign: "center" }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>PRICING · شفاف، بدون شگفتی</span>
        <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(36px, 5vw, 72px)" }}>
          آموزش با کیفیت دانشگاهی،<br />
          <span style={{ color: "var(--accent)" }}>قیمت منصفانه</span>
        </h1>
        <p className="lead" style={{ margin: "20px auto 0" }}>
          همه‌ی پلن‌ها شامل: دستیار AI ۲۴/۷، کلاس زنده، آرشیو ضبط‌شده، گواهی دیجیتال.
        </p>
        <div style={{ display: "inline-flex", gap: 4, marginTop: 32, padding: 4, background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 999 }}>
          <button className="btn btn-sm" style={{ background: "var(--fg)", color: "var(--bg)", borderRadius: 999 }}>ماهانه</button>
          <button className="btn btn-ghost btn-sm" style={{ borderRadius: 999 }}>ترمی · ۱۵٪ تخفیف</button>
          <button className="btn btn-ghost btn-sm" style={{ borderRadius: 999 }}>سالانه · ۲۵٪ تخفیف</button>
        </div>
      </div>
    </section>

    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="grid grid-3">
        {[
          {
            t: "آزاد", p: "۰", curr: "رایگان", d: "برای کاوش پلتفرم",
            features: [
              ["دسترسی به ۳ درس آزاد", true],
              ["کلاس‌های زنده محدود", true],
              ["دستیار AI پایه", true],
              ["گواهی پایان", false],
              ["پروژه با راهنمایی استاد", false],
              ["دسترسی به آرشیو کامل", false],
            ],
            cta: "شروع رایگان",
            popular: false,
          },
          {
            t: "دانشجویی", p: "۳", curr: "میلیون / ماه", d: "محبوب‌ترین انتخاب",
            features: [
              ["دسترسی به همه‌ی دروس", true],
              ["کلاس‌های زنده نامحدود", true],
              ["دستیار AI پیشرفته", true],
              ["گواهی پایان دوره", true],
              ["پروژه با راهنمایی استاد", true],
              ["دسترسی به آرشیو کامل", true],
            ],
            cta: "انتخاب پلن",
            popular: true,
          },
          {
            t: "حرفه‌ای", p: "۸", curr: "میلیون / ماه", d: "برای دانشجویان ارشد و دکتری",
            features: [
              ["همه‌ی موارد پلن دانشجویی", true],
              ["دسترسی به برنامه‌های ارشد", true],
              ["AI Mentor شخصی", true],
              ["جلسات Office Hours خصوصی", true],
              ["پروژه پژوهشی با استاد", true],
              ["گواهی Verifiable Credential", true],
            ],
            cta: "انتخاب پلن",
            popular: false,
          },
        ].map((p) => (
          <div key={p.t} className="card" style={{
            padding: 36,
            position: "relative",
            border: p.popular ? "2px solid var(--accent)" : "1px solid var(--line)",
          }}>
            {p.popular && (
              <div style={{
                position: "absolute",
                top: -12, right: 24,
                background: "var(--accent)",
                color: "var(--accent-on)",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontFamily: "var(--f-mono)",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}>محبوب‌ترین</div>
            )}
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em" }}>{p.d}</div>
            <h3 style={{ fontSize: 28, marginTop: 8 }}>{p.t}</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16, marginBottom: 24 }}>
              <span style={{ fontFamily: "var(--f-display)", fontSize: 56, fontWeight: 800, letterSpacing: "-0.03em" }}>{p.p}</span>
              <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>{p.curr}</span>
            </div>
            <button className={"btn " + (p.popular ? "btn-primary" : "btn-outline")} style={{ width: "100%", justifyContent: "center", marginBottom: 28 }} onClick={() => go("register")}>
              {p.cta}
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {p.features.map(([t, on], i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: on ? "var(--fg)" : "var(--fg-dim)" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 50, background: on ? "var(--accent)" : "var(--surface-3)", color: on ? "var(--accent-on)" : "var(--fg-dim)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name={on ? "check" : "plus"} size={11} stroke={on ? 3 : 2} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 40, marginTop: 40, textAlign: "center" }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>ENTERPRISE · سازمانی</span>
        <h2 className="h-2" style={{ marginTop: 16 }}>پلن سازمانی — برای دانشگاه‌ها و شرکت‌ها</h2>
        <p className="lead" style={{ margin: "16px auto 0", maxWidth: 640 }}>
          چنددانشکده‌ای، چندمستاجره، Single Sign-On، API اختصاصی، SLA 99.9٪، استقرار on-premise.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button className="btn btn-primary btn-lg">گفتگو با تیم فروش</button>
          <button className="btn btn-outline btn-lg"><Icon name="download" size={14} />دانلود معماری</button>
        </div>
      </div>
    </section>

    <Footer go={go} />
  </main>
);

// =====================================================
// Faculty Directory
// =====================================================
const FacultyPage = ({ go }) => (
  <main data-screen-label="20 هیات علمی">
    <section style={{ padding: "80px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">FACULTY · هیات علمی</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>استادان دیجی‌یونیورسیتی</h1>
        <p className="lead" style={{ marginTop: 14 }}>
          ۹۴ استاد در ۸ دانشکده. پژوهشگران، صنعت‌گران، نویسندگان، فعالان آموزش.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px 40px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
        {["همه", "علوم رایانه", "ریاضی و آمار", "مدیریت", "زبان‌شناسی", "فلسفه و اخلاق", "علوم داده", "مهندسی"].map((t, i) => (
          <span key={t} className={"pill " + (i === 0 ? "pill-cyan" : "")} style={{ cursor: "pointer", padding: "6px 12px" }}>{t}</span>
        ))}
      </div>

      <div className="grid grid-3">
        {FACULTY.map((f, i) => (
          <div key={i} className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className={"avatar " + f.color} style={{ width: 56, height: 56, fontSize: 18 }}>{f.av}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, marginBottom: 4 }}>{f.name}</h4>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{f.role}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6, margin: 0 }}>{f.bio}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {f.tags.map((t) => <span key={t} className="pill" style={{ fontSize: 9 }}>{t}</span>)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>
              <span>{f.courses} درس</span>
              <span>{f.papers} مقاله</span>
              <span>h-index {f.h}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

const FACULTY = [
  { name: "دکتر آرش عظیمی", role: "دانشیار · علوم رایانه", av: "AA", color: "cyan", bio: "تخصص در یادگیری ماشین کاربردی و مدل‌های زبانی فارسی. مولف ۴ کتاب.", tags: ["ML", "NLP", "FA"], courses: 8, papers: 42, h: 18 },
  { name: "دکتر سپیده موسوی", role: "استادیار · پردازش زبان", av: "SM", color: "amber", bio: "پژوهش روی attention mechanism و ترجمه ماشینی. عضو هیات تحریریه دو ژورنال.", tags: ["NLP", "Transformer"], courses: 5, papers: 28, h: 14 },
  { name: "مهندس مهدی کیانی", role: "مدرس · مهندسی نرم‌افزار", av: "MK", color: "violet", bio: "۱۲ سال تجربه‌ی صنعتی در طراحی سیستم‌های توزیع‌شده مقیاس بالا. CTO سابق.", tags: ["Sys", "DDD"], courses: 6, papers: 8, h: 6 },
  { name: "دکتر بهنام فرهادی", role: "دانشیار · آمار", av: "BF", color: "rose", bio: "آمار بیزی، MCMC، مدل‌های گرافیکی احتمالاتی. نویسنده کتاب آمار بیزی به فارسی.", tags: ["Bayes", "Stats"], courses: 4, papers: 36, h: 16 },
  { name: "دکتر رویا طاهری", role: "استاد · فلسفه و اخلاق", av: "RT", color: "cyan", bio: "اخلاق هوش مصنوعی، عاملیت ماشین، حاکمیت داده. مشاور سیاست‌گذار.", tags: ["AI Ethics"], courses: 3, papers: 24, h: 12 },
  { name: "دکتر شهرام رضوی", role: "دانشیار · مدیریت محصول", av: "SR", color: "amber", bio: "تجربه‌ی مدیریت محصول در ۳ استارتاپ یونیکورن. مولف کتاب «محصول داده‌محور».", tags: ["PM"], courses: 4, papers: 6, h: 4 },
];

window.CalendarPage = CalendarPage;
window.LibraryPage = LibraryPage;
window.HelpPage = HelpPage;
window.PricingPage = PricingPage;
window.FacultyPage = FacultyPage;
