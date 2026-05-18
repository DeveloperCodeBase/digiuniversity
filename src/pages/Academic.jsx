// =====================================================
// Real-university workflows: Transcript, Degree Audit,
// Registration, Career Services, Financial Aid, Wellness,
// Alumni, Hackathons, Honor Code
// =====================================================

// =====================================================
// Transcript / Academic Record
// =====================================================
const TranscriptPage = ({ go }) => (
  <main data-screen-label="36 کارنامه">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <div>
          <span className="eyebrow">OFFICIAL TRANSCRIPT · ریزنمرات رسمی</span>
          <h1 className="h-1" style={{ marginTop: 12 }}>کارنامه‌ی رسمی</h1>
          <p className="lead" style={{ marginTop: 12 }}>نسرین رضوی · کد ۸۴-۰۲-۱۷ · کارشناسی ارشد علوم داده · ترم ۲</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline"><Icon name="download" size={14} />PDF رسمی</button>
          <button className="btn btn-primary"><Icon name="shield" size={14} />استعلام دیجیتال</button>
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: 36, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24 }}>
          {[
            ["GPA کل", "۳.۸۲", "var(--accent)"],
            ["واحد گذرانده", "۴۸ از ۱۲۰", null],
            ["واحد فعلی", "۱۸", null],
            ["پایه", "ارشد", null],
            ["وضعیت", "ممتاز", "var(--sage)"],
          ].map(([l, v, c], i) => (
            <div key={i} style={{ borderRight: i < 4 ? "1px solid var(--line)" : "none", paddingRight: i < 4 ? 24 : 0 }}>
              <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 700, marginTop: 8, color: c || "var(--fg)" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Semesters */}
      {TRANSCRIPT_SEMESTERS.map((sem, si) => (
        <div key={si} className="card" style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>{sem.code}</div>
              <h3 className="h-3" style={{ marginTop: 4 }}>{sem.t}</h3>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, letterSpacing: "0.08em" }}>GPA</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>{sem.gpa}</div></div>
              <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, letterSpacing: "0.08em" }}>واحد</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 16 }}>{sem.cr}</div></div>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["کد", "عنوان درس", "واحد", "نمره", "حرف", "استاد"].map((h) => (
                  <th key={h} style={{ textAlign: "right", padding: "12px 24px", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sem.courses.map((c, ci) => (
                <tr key={ci} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "14px 24px", fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>{c.code}</td>
                  <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 500 }}>{c.t}</td>
                  <td style={{ padding: "14px 24px", fontFamily: "var(--f-mono)", fontSize: 12 }}>{c.cr}</td>
                  <td style={{ padding: "14px 24px", fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600 }}>{c.score}</td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, color: c.grade === "A" || c.grade === "A+" ? "var(--sage)" : c.grade === "B+" || c.grade === "B" ? "var(--accent)" : "var(--gold)" }}>{c.grade}</span>
                  </td>
                  <td style={{ padding: "14px 24px", fontSize: 12, color: "var(--fg-mute)" }}>{c.prof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
    <Footer go={go} />
  </main>
);

const TRANSCRIPT_SEMESTERS = [
  { code: "TERM-1404-2 · بهار ۱۴۰۴", t: "ترم دوم کارشناسی ارشد", gpa: "۳.۹۲", cr: "۱۸",
    courses: [
      { code: "CS-410", t: "مبانی یادگیری ماشین", cr: "۳", score: "۹۲", grade: "A", prof: "دکتر عظیمی" },
      { code: "STAT-440", t: "آمار بیزی کاربردی", cr: "۳", score: "۸۸", grade: "B+", prof: "دکتر فرهادی" },
      { code: "MATH-510", t: "ریاضی پیشرفته", cr: "۳", score: "۹۵", grade: "A+", prof: "دکتر کاوه" },
      { code: "CS-620", t: "پردازش زبان طبیعی", cr: "۳", score: "۹۰", grade: "A", prof: "دکتر موسوی" },
      { code: "PHIL-220", t: "اخلاق هوش مصنوعی", cr: "۲", score: "۸۴", grade: "B+", prof: "دکتر طاهری" },
      { code: "RES-501", t: "روش پژوهش", cr: "۲", score: "۹۱", grade: "A", prof: "دکتر رضوی" },
      { code: "SEM-001", t: "سمینار تخصصی", cr: "۲", score: "۸۸", grade: "B+", prof: "اعضای گروه" },
    ]
  },
  { code: "TERM-1404-1 · پاییز ۱۴۰۴", t: "ترم اول کارشناسی ارشد", gpa: "۳.۷۲", cr: "۱۸",
    courses: [
      { code: "CS-380", t: "ساختمان داده پیشرفته", cr: "۳", score: "۸۹", grade: "B+", prof: "دکتر خادمی" },
      { code: "CS-420", t: "پایگاه داده توزیع‌شده", cr: "۳", score: "۹۲", grade: "A", prof: "دکتر کیانی" },
      { code: "MATH-440", t: "جبر خطی کاربردی", cr: "۳", score: "۸۵", grade: "B+", prof: "دکتر صفوی" },
      { code: "CS-560", t: "شبکه‌های کامپیوتری", cr: "۳", score: "۸۲", grade: "B", prof: "دکتر احمدی" },
      { code: "LANG-501", t: "زبان تخصصی", cr: "۲", score: "۹۰", grade: "A", prof: "دکتر بهمن" },
      { code: "CS-450", t: "هوش مصنوعی", cr: "۳", score: "۹۴", grade: "A", prof: "دکتر عظیمی" },
      { code: "RES-401", t: "روش تحقیق مقدماتی", cr: "۱", score: "۹۲", grade: "A", prof: "دکتر طاهری" },
    ]
  },
];

// =====================================================
// Degree Audit / Progress
// =====================================================
const DegreeAuditPage = ({ go }) => (
  <main data-screen-label="37 مسیر مدرک">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow">DEGREE AUDIT · پیشرفت مدرک</span>
        <h1 className="h-1" style={{ marginTop: 12 }}>مسیر مدرک تحصیلی</h1>
        <p className="lead" style={{ marginTop: 12 }}>کارشناسی ارشد علوم داده · ۴۸ واحد گذرانده از ۱۲۰</p>
      </div>

      {/* Overall progress */}
      <div className="card" style={{ padding: 36, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <h3 className="h-3">پیشرفت کلی</h3>
          <span style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>۴۰٪</span>
        </div>
        <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ width: "40%", height: "100%", background: "linear-gradient(90deg, var(--accent), var(--navy))", borderRadius: 999 }}></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-mute)" }}>
          <span>۴۸ واحد کسب‌شده</span>
          <span>تخمین فارغ‌التحصیلی: تیر ۱۴۰۶</span>
        </div>
      </div>

      {/* Requirement categories */}
      <div className="grid grid-2" style={{ gap: 16 }}>
        {[
          { t: "دروس پایه و الزامی", done: 24, total: 30, color: "var(--accent)",
            courses: [
              { t: "مبانی یادگیری ماشین", s: "done", cr: 3 },
              { t: "ساختمان داده پیشرفته", s: "done", cr: 3 },
              { t: "آمار بیزی", s: "done", cr: 3 },
              { t: "ریاضی پیشرفته", s: "done", cr: 3 },
              { t: "بهینه‌سازی محاسباتی", s: "current", cr: 3 },
              { t: "روش پژوهش پیشرفته", s: "todo", cr: 3 },
            ] },
          { t: "دروس تخصصی و گرایش", done: 12, total: 36, color: "var(--navy)",
            courses: [
              { t: "پردازش زبان طبیعی", s: "done", cr: 3 },
              { t: "بینایی ماشین", s: "current", cr: 3 },
              { t: "یادگیری عمیق", s: "current", cr: 3 },
              { t: "سیستم‌های توصیه‌گر", s: "todo", cr: 3 },
              { t: "MLOps", s: "todo", cr: 3 },
              { t: "AI کاربردی", s: "todo", cr: 3 },
            ] },
          { t: "اختیاری", done: 6, total: 18, color: "var(--sage)",
            courses: [
              { t: "اخلاق AI", s: "done", cr: 2 },
              { t: "سمینار تخصصی", s: "done", cr: 2 },
              { t: "زبان تخصصی", s: "done", cr: 2 },
              { t: "نوآوری و استارتاپ", s: "todo", cr: 2 },
            ] },
          { t: "پایان‌نامه و سمینار", done: 6, total: 36, color: "var(--gold)",
            courses: [
              { t: "سمینار ۱", s: "done", cr: 2 },
              { t: "سمینار ۲", s: "current", cr: 2 },
              { t: "پروپوزال پایان‌نامه", s: "todo", cr: 4 },
              { t: "پایان‌نامه (۱ تا ۶)", s: "todo", cr: 24 },
              { t: "دفاع نهایی", s: "todo", cr: 4 },
            ] },
        ].map((cat, ci) => (
          <div key={ci} className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 className="h-3">{cat.t}</h3>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600, color: cat.color }}>{toFa(cat.done)} / {toFa(cat.total)}</span>
            </div>
            <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ width: (cat.done / cat.total * 100) + "%", height: "100%", background: cat.color, borderRadius: 999 }}></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cat.courses.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < cat.courses.length - 1 ? "1px solid var(--line)" : "none", fontSize: 13 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 50,
                    background: c.s === "done" ? cat.color : c.s === "current" ? "var(--surface-3)" : "transparent",
                    border: c.s === "todo" ? "1.5px dashed var(--line-2)" : "none",
                    color: c.s === "done" ? "white" : c.s === "current" ? "var(--accent)" : "var(--fg-dim)",
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    {c.s === "done" && <Icon name="check" size={10} stroke={3} />}
                    {c.s === "current" && <span style={{ width: 5, height: 5, borderRadius: 50, background: "var(--accent)" }}></span>}
                  </span>
                  <span style={{ flex: 1, color: c.s === "todo" ? "var(--fg-mute)" : "var(--fg)" }}>{c.t}</span>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{toFa(c.cr)} واحد</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Course Registration / Add-Drop
// =====================================================
const RegistrationPage = ({ go }) => {
  const [cart, setCart] = React.useState(["CS-580"]);
  const toggle = (code) => setCart(cart.includes(code) ? cart.filter(c => c !== code) : [...cart, code]);

  const available = [
    { code: "CS-580", t: "معماری سامانه‌های مقیاس‌پذیر", cr: 3, prof: "م. کیانی", day: "یکشنبه ۱۴:۰۰", capacity: 30, enrolled: 24, prereqs: ["CS-380"] },
    { code: "CS-650", t: "یادگیری تقویتی", cr: 3, prof: "دکتر عظیمی", day: "دوشنبه ۱۶:۰۰", capacity: 25, enrolled: 25, prereqs: ["CS-410", "MATH-510"] },
    { code: "CS-720", t: "هوش مصنوعی توضیح‌پذیر", cr: 3, prof: "دکتر طاهری", day: "سه‌شنبه ۱۰:۰۰", capacity: 20, enrolled: 12, prereqs: ["CS-410"] },
    { code: "STAT-540", t: "آمار غیرپارامتری", cr: 3, prof: "دکتر فرهادی", day: "چهارشنبه ۱۴:۰۰", capacity: 30, enrolled: 18, prereqs: ["STAT-440"] },
    { code: "RES-601", t: "پروپوزال پایان‌نامه", cr: 4, prof: "استاد راهنما", day: "انعطاف‌پذیر", capacity: 1, enrolled: 0, prereqs: [] },
    { code: "MGMT-410", t: "نوآوری و کارآفرینی", cr: 2, prof: "دکتر رضوی", day: "پنج‌شنبه ۱۰:۰۰", capacity: 40, enrolled: 28, prereqs: [] },
  ];

  const totalCredits = available.filter(c => cart.includes(c.code)).reduce((s, c) => s + c.cr, 0);

  return (
    <main data-screen-label="38 ثبت‌نام">
      <section className="shell" style={{ padding: "60px 40px" }}>
        <div style={{ marginBottom: 32 }}>
          <span className="eyebrow">REGISTRATION · ثبت‌نام ترم تابستان ۱۴۰۵</span>
          <h1 className="h-1" style={{ marginTop: 12 }}>انتخاب واحد</h1>
          <p className="lead" style={{ marginTop: 12 }}>پنجره ثبت‌نام: ۵ تا ۲۰ شهریور · مهلت Add/Drop: ۲ هفته اول ترم</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["همه", "الزامی", "تخصصی", "اختیاری", "خالی", "بدون تداخل"].map((t, i) => (
                <span key={t} className={"pill " + (i === 0 ? "pill-cyan" : "")} style={{ cursor: "pointer" }}>{t}</span>
              ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {available.map((c, i) => {
                const full = c.enrolled >= c.capacity;
                const inCart = cart.includes(c.code);
                return (
                  <div key={c.code} style={{
                    display: "grid", gridTemplateColumns: "120px 1fr auto",
                    gap: 18, padding: 18,
                    borderTop: i > 0 ? "1px solid var(--line)" : "none",
                    background: inCart ? "var(--accent-soft)" : "transparent",
                    alignItems: "center",
                  }}>
                    <div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{c.code}</div>
                      <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 700, marginTop: 4, color: "var(--accent)" }}>{toFa(c.cr)} واحد</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.t}</div>
                      <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>{c.prof} · {c.day}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {c.prereqs.map(p => <span key={p} className="pill" style={{ fontSize: 9 }}>پیش‌نیاز: {p}</span>)}
                        <span className={"pill " + (full ? "pill-rose" : "")} style={{ fontSize: 9 }}>
                          ظرفیت: {toFa(c.enrolled)} / {toFa(c.capacity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(c.code)}
                      disabled={full && !inCart}
                      className={inCart ? "btn btn-primary btn-sm" : full ? "btn btn-ghost btn-sm" : "btn btn-outline btn-sm"}
                      style={{ opacity: full && !inCart ? 0.5 : 1 }}
                    >
                      {inCart ? <>حذف<Icon name="end" size={13} /></> : full ? "تکمیل" : <><Icon name="plus" size={13} />افزودن</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <aside style={{ position: "sticky", top: 90, alignSelf: "start" }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 className="h-3">سبد ثبت‌نام</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>تعداد دروس</span>
                <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{toFa(cart.length)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>جمع واحدها</span>
                <span style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{toFa(totalCredits)}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 14, lineHeight: 1.6 }}>
                حداقل ۹ واحد · حداکثر ۲۴ واحد در ترم تابستان
              </div>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 20 }} disabled={totalCredits < 3}>
                نهایی‌سازی ثبت‌نام
                <Icon name="arrow" size={14} />
              </button>
            </div>

            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", marginBottom: 10 }}>
                <Icon name="sparkle" size={14} />
                <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em" }}>پیشنهاد AI</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                با توجه به مسیر مدرک و عملکرد قبلی، «یادگیری تقویتی» را برای پیشروی پژوهش پیشنهاد می‌کنم.
              </p>
            </div>
          </aside>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
};

// =====================================================
// Career Services / Jobs Board
// =====================================================
const CareerPage = ({ go }) => (
  <main data-screen-label="39 خدمات شغلی">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">CAREER SERVICES · خدمات شغلی</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>مرکز شغل و کارآموزی</h1>
        <p className="lead" style={{ marginTop: 14 }}>۴۸۲ موقعیت فعال · ۲۳۴ شرکت همکار · میانگین زمان استخدام: ۳۴ روز</p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px" }}>
      {/* AI Match Card */}
      <div className="card" style={{ padding: 32, marginBottom: 32, background: "linear-gradient(135deg, var(--surface), var(--accent-soft))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Icon name="sparkle" size={16} style={{ color: "var(--accent)" }} />
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--accent)" }}>AI CAREER MATCH</span>
        </div>
        <h2 className="h-2">۲۳ موقعیت مطابق با پروفایل شما</h2>
        <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
          AI بر اساس مهارت‌ها، دوره‌ها، پروژه‌ها و علایق شما، موقعیت‌های متناسب پیدا می‌کند.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="btn btn-primary">مشاهده تطابق‌ها<Icon name="arrow" size={14} /></button>
          <button className="btn btn-outline">به‌روزرسانی رزومه</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>
        <aside>
          <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>نوع</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
            {[["تمام وقت", 248], ["کارآموزی", 128], ["پاره‌وقت", 64], ["دورکار", 156], ["پروژه‌ای", 42]].map(([t, n]) => (
              <label key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", fontSize: 13, cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)" }} />
                  {t}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{toFa(n)}</span>
              </label>
            ))}
          </div>
          <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>تجربه</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[["دانشجویی", true], ["تازه‌کار", true], ["میانه", false], ["ارشد", false]].map(([t, d]) => (
              <label key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked={d} style={{ accentColor: "var(--accent)" }} />{t}
              </label>
            ))}
          </div>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { co: "اسنپ", t: "ML Engineer — Recommendation Systems", l: "تهران · دورکار", typ: "تمام‌وقت", sal: "۴۰ تا ۶۰ م/ماه", logo: "اس", c: "rose", match: 94 },
            { co: "دیجی‌کالا", t: "Data Scientist Intern — Search", l: "تهران · حضوری", typ: "کارآموزی", sal: "۱۸ م/ماه", logo: "دک", c: "amber", match: 91 },
            { co: "تپ‌سی", t: "NLP Researcher", l: "دورکار", typ: "تمام‌وقت", sal: "۵۰ تا ۸۰ م/ماه", logo: "تپ", c: "navy", match: 88 },
            { co: "آپ", t: "Backend Engineer — Python", l: "اصفهان · هیبریدی", typ: "تمام‌وقت", sal: "۳۵ تا ۵۵ م/ماه", logo: "آپ", c: "cyan", match: 76 },
            { co: "دانشگاه شریف", t: "پژوهشگر آزمایشگاه AI", l: "تهران · هیبریدی", typ: "پاره‌وقت", sal: "۲۰ م/ماه", logo: "شر", c: "violet", match: 89 },
          ].map((j, i) => (
            <div key={i} className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "56px 1fr auto", gap: 18, alignItems: "center", cursor: "pointer" }}>
              <div className={"avatar " + j.c} style={{ width: 56, height: 56, fontSize: 16 }}>{j.logo}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>{j.co}</span>
                  <span className="pill pill-cyan" style={{ fontSize: 9 }}>تطابق {toFa(j.match)}٪</span>
                </div>
                <h4 style={{ fontSize: 15 }}>{j.t}</h4>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "var(--fg-mute)", flexWrap: "wrap" }}>
                  <span>{j.l}</span>
                  <span>·</span>
                  <span>{j.typ}</span>
                  <span>·</span>
                  <span style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{j.sal}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="btn btn-primary btn-sm">درخواست</button>
                <button className="btn btn-ghost btn-sm"><Icon name="star" size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Financial Aid / Scholarships
// =====================================================
const FinancialAidPage = ({ go }) => (
  <main data-screen-label="40 کمک هزینه">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow">FINANCIAL AID · کمک هزینه</span>
        <h1 className="h-1" style={{ marginTop: 12 }}>وام و بورسیه</h1>
        <p className="lead" style={{ marginTop: 12 }}>۱۲ کمک هزینه فعال · ۸ بورسیه قابل درخواست</p>
      </div>

      {/* Active aid */}
      <div className="card" style={{ padding: 36, marginBottom: 32 }}>
        <span className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.08em" }}>کمک هزینه‌ی فعال شما</span>
        <h2 className="h-2" style={{ marginTop: 10 }}>بورسیه‌ی استعداد درخشان — ترم بهار ۱۴۰۵</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 28, padding: 20, background: "var(--accent-soft)", borderRadius: 10 }}>
          {[
            ["پوشش شهریه", "۷۰٪"],
            ["مبلغ", "۸,۴۰۰,۰۰۰ ت"],
            ["نوع", "بازپرداختی"],
            ["وضعیت", "فعال"],
          ].map(([l, v], i) => (
            <div key={i}>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>{l}</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 700, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Available scholarships */}
      <h3 className="h-3" style={{ marginBottom: 18 }}>بورسیه‌های قابل درخواست</h3>
      <div className="grid grid-2" style={{ gap: 16 }}>
        {[
          { t: "بورسیه‌ی پژوهشی هوش مصنوعی", amount: "۲۴ م ت/ترم", deadline: "۱۵ آذر", n: "محدودیت ۸ نفر", c: "var(--accent)", crit: ["GPA > 3.7", "پروپوزال پژوهشی"] },
          { t: "بورسیه‌ی استعداد برتر", amount: "پوشش کامل شهریه", deadline: "۲۰ آذر", n: "۱۲ نفر", c: "var(--gold)", crit: ["رتبه برتر ۱٪", "مصاحبه"] },
          { t: "بورسیه‌ی نیاز مالی", amount: "۵۰٪ شهریه", deadline: "۱۰ دی", n: "ظرفیت وسیع", c: "var(--sage)", crit: ["گزارش مالی خانواده"] },
          { t: "وام دانشجویی صندوق رفاه", amount: "۸ م ت/ماه", deadline: "همه ترم", n: "همه دانشجویان", c: "var(--navy)", crit: ["معدل > 12", "بازپرداخت بعد فارغ‌التحصیلی"] },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 24, borderRight: "3px solid " + s.c }}>
            <h4 style={{ fontSize: 17, marginBottom: 8 }}>{s.t}</h4>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 700, color: s.c, marginBottom: 14 }}>{s.amount}</div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--line)", marginBottom: 12, fontSize: 12 }}>
              <span style={{ color: "var(--fg-mute)" }}>مهلت</span>
              <span style={{ fontFamily: "var(--f-mono)" }}>{s.deadline}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 12 }}>
              <span style={{ color: "var(--fg-mute)" }}>ظرفیت</span>
              <span>{s.n}</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", marginBottom: 8 }}>شرایط</div>
            <ul style={{ paddingRight: 18, fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.7 }}>
              {s.crit.map(c => <li key={c}>{c}</li>)}
            </ul>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>درخواست</button>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Wellness / Counseling
// =====================================================
const WellnessPage = ({ go }) => (
  <main data-screen-label="41 سلامت">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow">WELLNESS · سلامت دانشجویی</span>
        <h1 className="h-1" style={{ marginTop: 12 }}>سلامت ذهن و بدن</h1>
        <p className="lead" style={{ marginTop: 12, maxWidth: 720 }}>
          دانشجویی فشار خاص خودش رو داره. ما در کنارت هستیم — مشاوره روان‌شناختی، مدیریت استرس،
          همراه هوشمند برای روزهای سخت. همه چیز محرمانه.
        </p>
      </div>

      <div className="grid grid-3" style={{ gap: 16, marginBottom: 32 }}>
        {[
          { ic: "headset", t: "مشاوره فردی", d: "جلسه‌ی محرمانه با روان‌شناس", cta: "رزرو جلسه", c: "var(--accent)", urgent: false },
          { ic: "users", t: "گروه‌های همتا", d: "گفتگو با هم‌دوره‌ای‌ها در فضای امن", cta: "ورود به گروه", c: "var(--navy)", urgent: false },
          { ic: "sparkle", t: "همراه AI ۲۴/۷", d: "گفتگوی محرمانه با AI آموزش‌دیده", cta: "شروع گفتگو", c: "var(--sage)", urgent: false },
          { ic: "pulse", t: "تست خودارزیابی", d: "PHQ-9 ، GAD-7 ، استرس", cta: "شروع تست", c: "var(--accent)", urgent: false },
          { ic: "calendar", t: "مدیریت زمان و خواب", d: "ابزارها و عادت‌سازی", cta: "شروع برنامه", c: "var(--navy)", urgent: false },
          { ic: "shield", t: "خط بحران ۲۴/۷", d: "اگر در شرایط بحرانی هستی", cta: "تماس فوری", c: "var(--gold)", urgent: true },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 24, border: s.urgent ? "1px solid var(--gold)" : "1px solid var(--line)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `color-mix(in oklch, ${s.c} 12%, var(--surface-2))`, color: s.c, display: "grid", placeItems: "center", marginBottom: 16 }}>
              <Icon name={s.ic} size={20} />
            </div>
            <h4 style={{ fontSize: 17 }}>{s.t}</h4>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6, margin: "8px 0 18px" }}>{s.d}</p>
            <button className={s.urgent ? "btn btn-primary" : "btn btn-outline"} style={{ width: "100%", justifyContent: "center" }}>{s.cta}</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 32 }}>
        <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em", marginBottom: 14 }}>منابع</div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          {[
            "راهنمای مدیریت اضطراب امتحان",
            "تمرینات mindfulness ۵ دقیقه‌ای",
            "چگونه با اساتید گفتگوی سازنده داشته باشیم",
            "تکنیک‌های Pomodoro برای تمرکز",
            "خواب سالم برای دانشجویان",
            "مدیریت تعادل کار-تحصیل",
          ].map((t, i) => (
            <a key={i} className="card-flat" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, cursor: "pointer" }}>
              <span style={{ fontSize: 13 }}>{t}</span>
              <Icon name="arrow" size={13} />
            </a>
          ))}
        </div>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Alumni Network
// =====================================================
const AlumniPage = ({ go }) => (
  <main data-screen-label="42 شبکه فارغ‌التحصیلان">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">ALUMNI · فارغ‌التحصیلان</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>شبکه‌ی فارغ‌التحصیلان</h1>
        <p className="lead" style={{ marginTop: 14, maxWidth: 720 }}>۱۲,۴۰۰ فارغ‌التحصیل در ۴۲ شهر و ۲۸ کشور. شبکه‌ای از مربی‌ها، همکاران و کارفرماهای آینده.</p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px" }}>
      <div className="grid grid-4" style={{ marginBottom: 40 }}>
        {[
          ["تعداد فارغ‌التحصیلان", "۱۲.۴K", "var(--accent)"],
          ["در شرکت‌های یونیکورن", "۲,۸۰۰", "var(--navy)"],
          ["در دانشگاه‌های جهان", "۱,۴۰۰", "var(--sage)"],
          ["میانگین حقوق ۳ سال بعد", "۸۲ م/ماه", "var(--gold)"],
        ].map(([l, v, c], i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em" }}>{l}</div>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 800, marginTop: 10, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <h3 className="h-3" style={{ marginBottom: 20 }}>یافتن مربی فارغ‌التحصیل</h3>
      <div className="grid grid-3">
        {[
          { name: "نیکا کریمی", year: "۱۳۹۸", role: "ML Engineer @ گوگل (دوبلین)", av: "نک", c: "cyan", available: true, mentees: 8 },
          { name: "آرین فروزش", year: "۱۳۹۶", role: "Co-founder @ استارتاپ", av: "AF", c: "amber", available: true, mentees: 12 },
          { name: "دکتر شیوا نوری", year: "۱۳۹۴", role: "Postdoc @ MIT", av: "SN", c: "violet", available: false, mentees: 5 },
          { name: "مهدی صادقی", year: "۱۳۹۷", role: "Data Lead @ اسنپ", av: "MS", c: "rose", available: true, mentees: 18 },
          { name: "نگار رحیمی", year: "۱۳۹۹", role: "Research @ DeepMind", av: "NR", c: "cyan", available: true, mentees: 6 },
          { name: "علی حسینی", year: "۱۳۹۵", role: "CTO @ شرکت فناوری", av: "AH", c: "amber", available: false, mentees: 24 },
        ].map((a, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div className={"avatar " + a.c} style={{ width: 52, height: 52, fontSize: 16, position: "relative" }}>
                {a.av}
                {a.available && <span style={{ position: "absolute", bottom: 0, left: 0, width: 12, height: 12, borderRadius: 50, background: "var(--sage)", border: "2px solid var(--surface)" }}></span>}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>دوره {a.year}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.5, margin: 0 }}>{a.role}</p>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, marginTop: 14, borderTop: "1px solid var(--line)" }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{toFa(a.mentees)} mentee</span>
              <button className="btn btn-outline btn-sm" disabled={!a.available}>
                {a.available ? "درخواست منتورینگ" : "ظرفیت تکمیل"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Hackathons & Competitions
// =====================================================
const HackathonsPage = ({ go }) => (
  <main data-screen-label="43 رقابت‌ها">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">HACKATHONS · رقابت‌ها</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>هکاتون‌ها و رقابت‌ها</h1>
        <p className="lead" style={{ marginTop: 14 }}>۱۲ رقابت فعال · جوایز کل ۲.۴ میلیارد تومان · فرصت‌های شغلی برای برترین‌ها</p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px" }}>
      {/* Featured */}
      <div className="card" style={{ padding: 40, marginBottom: 32, display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>رقابت ویژه</span>
            <span className="pill" style={{ fontSize: 10 }}>تیم تا ۵ نفر</span>
            <span className="pill" style={{ fontSize: 10 }}>۴۸ ساعت</span>
          </div>
          <h2 className="h-1">هکاتون ملی AI سلامت ۱۴۰۵</h2>
          <p className="lead" style={{ marginTop: 14, maxWidth: "100%" }}>
            ساخت ابزار AI برای کمک به پزشکان و بیماران. ۴۸ ساعت کار تیمی، با منتورینگ از متخصصان شیراز و mayoclinic.
          </p>
          <div style={{ display: "flex", gap: 32, marginTop: 28, flexWrap: "wrap" }}>
            <div><div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>جایزه اول</div><div style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>۸۰۰ م ت</div></div>
            <div><div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>تاریخ</div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>۲۸-۳۰ شهریور</div></div>
            <div><div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>ثبت‌نام تا</div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: "var(--gold)" }}>۲۰ شهریور</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary btn-lg">ثبت‌نام تیم</button>
            <button className="btn btn-outline btn-lg">یافتن هم‌تیمی</button>
          </div>
        </div>
        <div style={{ aspectRatio: "1", background: "linear-gradient(135deg, oklch(0.3 0.14 25), oklch(0.5 0.18 30))", borderRadius: 14, position: "relative", overflow: "hidden", padding: 24 }}>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 16px)" }}></div>
          <div style={{ position: "relative", color: "white", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.1em" }}>HACK · 1405</div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>AI for</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>HEALTH</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="h-3" style={{ marginBottom: 20 }}>رقابت‌های دیگر</h3>
      <div className="grid grid-3">
        {[
          { t: "ICPC منطقه‌ای", typ: "برنامه‌نویسی", prize: "صعود به نهایی جهانی", deadline: "۱۵ مهر", c: "var(--navy)" },
          { t: "Kaggle Competition شریف", typ: "علوم داده", prize: "۴۰۰ م ت", deadline: "۲۲ مهر", c: "var(--accent)" },
          { t: "روبوکاپ ۱۴۰۵", typ: "رباتیک", prize: "۵۰۰ م ت + جذب", deadline: "۸ آبان", c: "var(--gold)" },
          { t: "چالش طراحی محصول", typ: "UX/PM", prize: "۱۲۰ م ت + کارآموزی", deadline: "۱۵ آبان", c: "var(--sage)" },
          { t: "هکاتون شهر هوشمند تهران", typ: "IoT", prize: "۲۰۰ م ت", deadline: "۲۲ آبان", c: "var(--accent)" },
          { t: "MUN — مدل سازمان ملل", typ: "علوم سیاسی", prize: "سفر کنفرانس", deadline: "۲۹ آبان", c: "var(--navy)" },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 22, borderRight: "3px solid " + c.c }}>
            <span className="pill" style={{ fontSize: 10 }}>{c.typ}</span>
            <h4 style={{ fontSize: 16, marginTop: 12 }}>{c.t}</h4>
            <div style={{ fontSize: 13, color: c.c, fontWeight: 600, marginTop: 8 }}>{c.prize}</div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, marginTop: 14, borderTop: "1px solid var(--line)" }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>تا {c.deadline}</span>
              <button className="btn btn-ghost btn-sm">جزئیات ←</button>
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Honor Code / Academic Integrity
// =====================================================
const HonorCodePage = ({ go }) => (
  <main data-screen-label="44 منشور علمی">
    <section className="shell" style={{ padding: "60px 40px", maxWidth: 960 }}>
      <div style={{ marginBottom: 40 }}>
        <span className="eyebrow">HONOR CODE · منشور صداقت علمی</span>
        <h1 className="h-1" style={{ marginTop: 12 }}>منشور صداقت علمی</h1>
        <p className="lead" style={{ marginTop: 14 }}>
          صداقت علمی پایه‌ی همه‌ی فعالیت‌های ما در دیجی‌یونیورسیتی است. این منشور تعریف می‌کند چه چیزی پذیرفته است،
          چه چیزی نیست، و چه می‌شود اگر اشتباهی رخ دهد.
        </p>
      </div>

      <div className="card" style={{ padding: 36, marginBottom: 24 }}>
        <h3 className="h-3" style={{ marginBottom: 18 }}>اصول اساسی</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { t: "صداقت در کار", d: "همه‌ی کار تحویلی متعلق به شما باشد، مگر آنکه صریحاً منبع آن ذکر شود. AI Tutor همراه شماست، نه جایگزین." },
            { t: "احترام به منبع", d: "هر فکر، کد یا متن که از دیگری گرفته‌اید را با ارجاع روشن مشخص کنید. این هم احترام و هم حفاظت از خودتان است." },
            { t: "آزمون فردی، آزمون فردی است", d: "در آزمون‌های اعتبارسنجی هویتی، استفاده از منابع خارجی یا کمک دیگری بدون مجوز تخلف است." },
            { t: "همکاری شفاف", d: "همکاری گروهی فوق‌العاده است — تا زمانی که در سرفصل تمرین مجاز اعلام شده باشد و مشارکت هر نفر روشن باشد." },
            { t: "گزارش‌گری شجاعانه", d: "اگر شاهد تخلفی هستید، گزارش بدهید. هویت شما محرمانه می‌ماند و انتقامی در کار نیست." },
          ].map((p, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 16 }}>
              <div className="mono" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{toFa("0" + (i + 1))}</div>
              <div>
                <h4 style={{ fontSize: 16, marginBottom: 6 }}>{p.t}</h4>
                <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7, margin: 0 }}>{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 28, borderRight: "3px solid var(--sage)" }}>
          <h3 className="h-3" style={{ color: "var(--sage)" }}>مجاز است ✓</h3>
          <ul style={{ paddingRight: 18, fontSize: 14, lineHeight: 1.9, marginTop: 14, color: "var(--fg-mute)" }}>
            <li>پرسش از AI Tutor درباره مفاهیم</li>
            <li>کار گروهی در پروژه‌های اعلام‌شده‌ی گروهی</li>
            <li>مشاوره با استاد در Office Hours</li>
            <li>استفاده از منابع آنلاین با ذکر منبع</li>
            <li>درخواست بازخورد دوستان قبل از تحویل</li>
            <li>کپی از کد خودتان از پروژه قبلی (با اطلاع)</li>
          </ul>
        </div>
        <div className="card" style={{ padding: 28, borderRight: "3px solid var(--gold)" }}>
          <h3 className="h-3" style={{ color: "var(--gold)" }}>تخلف است ✗</h3>
          <ul style={{ paddingRight: 18, fontSize: 14, lineHeight: 1.9, marginTop: 14, color: "var(--fg-mute)" }}>
            <li>کپی پاسخ کسی دیگر بدون اشاره</li>
            <li>پاسخ‌دهی به‌جای دیگری در آزمون</li>
            <li>تحویل کار AI به‌عنوان کار خود در آزمون</li>
            <li>دسترسی به سوالات آزمون پیش از زمان</li>
            <li>جعل داده‌های پژوهشی</li>
            <li>ارسال یک پروژه واحد در دو درس بدون مجوز</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ padding: 36, background: "var(--accent-soft)" }}>
        <h3 className="h-3">فرایند گزارش و اعتراض</h3>
        <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7, marginTop: 14 }}>
          هر گزارش تخلف به کمیته‌ی صداقت علمی ارجاع می‌شود. دانشجوی متهم فرصت پاسخ‌گویی و مدافع علمی دارد.
          هیچ تصمیمی نهایی نمی‌شود مگر با تأیید سه نفر از کمیته.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary">گزارش محرمانه</button>
          <button className="btn btn-outline">امضای منشور</button>
        </div>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

window.TranscriptPage = TranscriptPage;
window.DegreeAuditPage = DegreeAuditPage;
window.RegistrationPage = RegistrationPage;
window.CareerPage = CareerPage;
window.FinancialAidPage = FinancialAidPage;
window.WellnessPage = WellnessPage;
window.AlumniPage = AlumniPage;
window.HackathonsPage = HackathonsPage;
window.HonorCodePage = HonorCodePage;
