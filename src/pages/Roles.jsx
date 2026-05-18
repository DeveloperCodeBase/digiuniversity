// =====================================================
// Role-specific pages: Admin, Parent, Office Hours, Events, About
// =====================================================

// =====================================================
// Admin / Manager Dashboard
// =====================================================
const AdminPage = ({ go }) => {
  return (
    <main data-screen-label="21 میز مدیریت">
      <div className="dash">
        <RoleSideNav active="admin" go={go} />

        <div className="dash-main">
          <div className="dash-greet">
            <div>
              <span className="eyebrow">ADMIN CONSOLE · CONTROL CENTER</span>
              <h1 style={{ marginTop: 10 }}>سامانه‌ها سالم · ۳ مورد نیازمند توجه</h1>
              <p className="muted">آخرین به‌روزرسانی: ۲ دقیقه پیش · همه‌ی سرویس‌ها در حال اجرا</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span className="pill pill-violet"><span className="dot dot-live" style={{ marginLeft: 6 }}></span>SLA 99.94٪</span>
              <button className="btn btn-primary">گزارش روزانه</button>
            </div>
          </div>

          {/* KPI grid */}
          <div className="stat-row">
            <StatCard l="کاربران فعال" v="۱,۲۸۴" trend="+ ۳۲ این هفته" spark={[1100,1140,1180,1200,1220,1250,1270,1284]} color="var(--accent)" />
            <StatCard l="کلاس‌های زنده فعلی" v="۱۲" trend="۸ ضبط فعال" spark={[8,10,9,11,12,10,11,12]} color="var(--navy)" />
            <StatCard l="درآمد ماه" v="۸۴۲" unit="م ت" trend="+ ۱۲٪" spark={[600,650,700,720,750,790,820,842]} color="var(--sage)" />
            <StatCard l="هشدارهای فعال" v="۳" trend="۱ بحرانی" spark={[5,4,4,3,2,3,3,3]} color="var(--gold)" trendDown />
          </div>

          {/* Alerts panel */}
          <div className="card" style={{ padding: 28, borderColor: "color-mix(in oklch, var(--gold) 30%, var(--line))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--gold)" }}>ATTENTION REQUIRED</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>۳ مورد نیازمند بازبینی</h3>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { kind: "critical", t: "گزارش تخلف از کلاس CS-580", d: "گزارش‌شده توسط ۳ دانشجو — نیاز به بازبینی فوری", time: "۱۲ دقیقه پیش" },
                { kind: "warn", t: "افت کیفیت ASR فارسی", d: "دقت در کلاس‌های امروز ۸۲٪ (پایین‌تر از آستانه ۸۸٪)", time: "۱ ساعت پیش" },
                { kind: "warn", t: "درخواست استثنا برای پرداخت ۸۴-۹۱۱۲", d: "بهنام رضوی — تأخیر پرداخت ترم سوم", time: "۳ ساعت پیش" },
              ].map((a, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center",
                  padding: 18, background: "var(--surface-2)", borderRadius: 10,
                  borderRight: "3px solid " + (a.kind === "critical" ? "var(--gold)" : "var(--navy)"),
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: a.kind === "critical" ? "var(--gold-soft)" : "var(--navy-soft)",
                    color: a.kind === "critical" ? "var(--gold)" : "var(--navy)",
                    display: "grid", placeItems: "center",
                  }}>
                    <Icon name={a.kind === "critical" ? "shield" : "bell"} size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{a.t}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 3 }}>{a.d}</div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)", marginTop: 4 }}>{a.time}</div>
                  </div>
                  <button className="btn btn-outline btn-sm">بازبینی</button>
                </div>
              ))}
            </div>
          </div>

          {/* User management + Service status */}
          <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h3 className="h-3">آخرین کاربران ثبت‌نام شده</h3>
                <a className="mono" style={{ color: "var(--fg-mute)", fontSize: 11 }}>همه ←</a>
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {["نام", "نقش", "وضعیت", "تاریخ", ""].map((h) => (
                        <th key={h} style={{ textAlign: "right", padding: "12px 18px", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["مهسا کوهی", "MK", "cyan", "دانشجو", "تأیید شده", "۱۲ دقیقه پیش", "ok"],
                      ["دکتر سپهر رحیمی", "SR", "amber", "استاد", "در انتظار", "۱ ساعت پیش", "pending"],
                      ["علی نظری", "AN", "violet", "دانشجو", "تأیید شده", "۲ ساعت پیش", "ok"],
                      ["شرکت پارس داده", "PD", "rose", "سازمان", "در انتظار", "۴ ساعت پیش", "pending"],
                      ["ساره فرجی", "SF", "cyan", "دانشجو", "تأیید شده", "دیروز", "ok"],
                    ].map(([n, av, c, r, s, t, st], i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className={"avatar " + c} style={{ width: 28, height: 28, fontSize: 10 }}>{av}</div>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 13, color: "var(--fg-mute)" }}>{r}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span className={"pill " + (st === "ok" ? "pill-violet" : "pill-amber")} style={{ fontSize: 9 }}>{s}</span>
                        </td>
                        <td style={{ padding: "14px 18px", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{t}</td>
                        <td style={{ padding: "14px 18px", textAlign: "left" }}>
                          <button className="btn btn-ghost btn-sm"><Icon name="settings" size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="h-3" style={{ marginBottom: 16 }}>وضعیت سرویس‌ها</h3>
              <div className="card" style={{ padding: 24 }}>
                {[
                  ["LMS Core", "operational", "۴۲ms"],
                  ["AI Tutor Service", "operational", "۲۱۸ms"],
                  ["WebRTC SFU", "operational", "<۲۰۰ms"],
                  ["ASR · فارسی", "degraded", "۸۲٪ acc"],
                  ["Payment Gateway", "operational", "۱۲۰ms"],
                  ["Vector DB · Qdrant", "operational", "نرمال"],
                  ["Kafka · stream", "operational", "نرمال"],
                  ["CDN · video", "operational", "نرمال"],
                ].map(([t, s, m]) => (
                  <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 50, background: s === "operational" ? "var(--sage)" : "var(--gold)" }}></span>
                      <span style={{ fontSize: 13 }}>{t}</span>
                    </span>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Governance */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <span className="eyebrow">AI GOVERNANCE · حاکمیت</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>سیاست‌ها و کنترل عامل‌های هوشمند</h3>
              </div>
              <button className="btn btn-outline">پیکربندی</button>
            </div>
            <div className="grid grid-3">
              {[
                { t: "RAG only", d: "همه پاسخ‌ها فقط از منابع داخلی", on: true },
                { t: "Human review", d: "نمره نهایی توسط استاد تأیید", on: true },
                { t: "Audit log", d: "ثبت کامل تعاملات AI", on: true },
                { t: "Cost cap", d: "محدودیت هزینه‌ی روزانه LLM", on: true },
                { t: "Data residency", d: "داده‌ها فقط در ایران", on: true },
                { t: "Model fallback", d: "گزینه‌ی جایگزین در صورت خطا", on: false },
              ].map((p) => (
                <div key={p.t} className="card-flat" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>POLICY</span>
                    <Toggle on={p.on} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.t}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>{p.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer go={go} />
    </main>
  );
};

// =====================================================
// Parent / Guardian Dashboard
// =====================================================
const ParentPage = ({ go }) => (
  <main data-screen-label="22 میز والد">
    <div className="dash">
      <RoleSideNav active="parent" go={go} />

      <div className="dash-main">
        <div className="dash-greet">
          <div>
            <span className="eyebrow">PARENT PORTAL · والد</span>
            <h1 style={{ marginTop: 10 }}>سلام محمد، نسرین این هفته عملکرد خوبی داشته</h1>
            <p className="muted">۸ کلاس حضور · ۲ تمرین تحویل داده · میانگین تسلط ۸۲٪</p>
          </div>
          <button className="btn btn-primary"><Icon name="chat" size={14} />تماس با مشاور</button>
        </div>

        {/* Child profile card */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
            <div className="avatar cyan" style={{ width: 80, height: 80, fontSize: 28 }}>نر</div>
            <div style={{ flex: 1 }}>
              <h2 className="h-2">نسرین رضوی</h2>
              <div style={{ fontSize: 14, color: "var(--fg-mute)", marginTop: 6 }}>کد ۸۴-۰۲-۱۷ · کارشناسی ارشد علوم داده · ترم ۲</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <span className="pill pill-cyan" style={{ fontSize: 10 }}>وضعیت: عالی</span>
                <span className="pill" style={{ fontSize: 10 }}>۴ درس فعال</span>
                <span className="pill pill-violet" style={{ fontSize: 10 }}>میانگین ۸۲٪</span>
              </div>
            </div>
            <button className="btn btn-outline">پروفایل کامل</button>
          </div>

          <div className="stat-row" style={{ marginTop: 24 }}>
            <StatCard l="حضور در کلاس" v="۹۴" unit="٪" trend="عالی" spark={[88,90,92,93,94,93,94,94]} color="var(--accent)" />
            <StatCard l="تسلط بر اهداف" v="۸۲" unit="٪" trend="+ ۴.۲" spark={[72,74,76,77,79,80,81,82]} color="var(--navy)" />
            <StatCard l="ساعت مطالعه" v="۲۴" unit="h/هفته" trend="بالاتر از متوسط" spark={[16,18,20,22,23,24,23,24]} color="var(--sage)" />
            <StatCard l="ریسک افت" v="کم" trend="نگرانی نیست" spark={[0.3,0.25,0.2,0.18,0.15,0.13,0.12,0.1]} color="var(--gold)" trendDown />
          </div>
        </div>

        {/* Recent activity + Quick actions */}
        <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
          <div>
            <h3 className="h-3" style={{ marginBottom: 16 }}>فعالیت‌های اخیر فرزند</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { ic: "check", t: "تمرین ۴ بهینه‌سازی — نمره ۸۷/۱۰۰", time: "امروز", color: "sage" },
                { ic: "live", t: "حضور در جلسه ۸ یادگیری ماشین", time: "امروز", color: "accent" },
                { ic: "cert", t: "گواهی پایان دوره آمار بیزی صادر شد", time: "دیروز", color: "navy" },
                { ic: "play", t: "بازبینی ۲ ساعته از کلاس‌های ضبط‌شده", time: "۲ روز پیش", color: "accent" },
                { ic: "users", t: "شرکت در گروه مطالعه با علی و ساره", time: "۳ روز پیش", color: "sage" },
              ].map((a, i) => (
                <div key={i} className="card-flat" style={{ display: "flex", alignItems: "center", gap: 14, padding: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `var(--${a.color}-soft, var(--surface-2))`, color: `var(--${a.color})`, display: "grid", placeItems: "center" }}>
                    <Icon name={a.ic} size={14} />
                  </div>
                  <div style={{ flex: 1, fontSize: 14 }}>{a.t}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="h-3" style={{ marginBottom: 16 }}>دسترسی سریع</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="card-flat" style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, textAlign: "right", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="dollar" size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>پرداخت شهریه‌ی ترم</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>سررسید: ۱۵ شهریور</div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
              <button className="card-flat" style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, textAlign: "right", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--navy-soft)", color: "var(--navy)", display: "grid", placeItems: "center" }}><Icon name="chat" size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>پیام به استاد راهنما</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>دکتر عظیمی · معمولاً ظرف ۱ روز پاسخ می‌دهد</div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
              <button className="card-flat" style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, textAlign: "right", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--sage-soft)", color: "var(--sage)", display: "grid", placeItems: "center" }}><Icon name="calendar" size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>درخواست جلسه با مشاور</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>زمان‌های آزاد این هفته</div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer go={go} />
  </main>
);

// =====================================================
// Office Hours / Booking
// =====================================================
const OfficeHoursPage = ({ go }) => {
  const [selectedDay, setSelectedDay] = React.useState(2);
  const [selectedSlot, setSelectedSlot] = React.useState(null);

  const days = [
    { d: "شنبه", n: 8, full: false },
    { d: "یکشنبه", n: 9, full: false },
    { d: "دوشنبه", n: 10, full: false },
    { d: "سه‌شنبه", n: 11, full: true },
    { d: "چهارشنبه", n: 12, full: false },
    { d: "پنج‌شنبه", n: 13, full: false },
  ];

  const slots = [
    { t: "۰۹:۰۰", available: true },
    { t: "۰۹:۳۰", available: true },
    { t: "۱۰:۰۰", available: false },
    { t: "۱۰:۳۰", available: true },
    { t: "۱۱:۰۰", available: true },
    { t: "۱۱:۳۰", available: false },
    { t: "۱۴:۰۰", available: true },
    { t: "۱۴:۳۰", available: true },
    { t: "۱۵:۰۰", available: true },
    { t: "۱۵:۳۰", available: false },
    { t: "۱۶:۰۰", available: true },
    { t: "۱۶:۳۰", available: true },
  ];

  return (
    <main data-screen-label="23 Office Hours">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <span className="eyebrow">OFFICE HOURS · رزرو جلسه</span>
          <h1 className="h-1" style={{ marginTop: 16 }}>رزرو جلسه با استاد</h1>
          <p className="lead" style={{ marginTop: 14 }}>
            هر استاد ساعات تخصیصی هفتگی دارد. جلسات می‌توانند مجازی، گروهی یا فردی باشند.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32 }}>
          {/* Instructor select */}
          <aside>
            <h3 className="h-3" style={{ marginBottom: 16 }}>انتخاب استاد</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "دکتر آرش عظیمی", role: "ML · CS-410", av: "AA", color: "cyan", selected: true, available: "آزاد امروز" },
                { name: "دکتر سپیده موسوی", role: "NLP · CS-620", av: "SM", color: "amber", available: "فردا" },
                { name: "م. کیانی", role: "Sys · CS-580", av: "MK", color: "violet", available: "هفته‌ی بعد" },
                { name: "دکتر فرهادی", role: "آمار", av: "BF", color: "rose", available: "این هفته" },
              ].map((ins, i) => (
                <button key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: 14,
                  background: ins.selected ? "var(--accent-soft)" : "var(--surface)",
                  border: "1px solid " + (ins.selected ? "var(--accent)" : "var(--line)"),
                  borderRadius: 10,
                  textAlign: "right", fontFamily: "inherit", color: "var(--fg)", cursor: "pointer",
                }}>
                  <div className={"avatar " + ins.color}>{ins.av}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ins.name}</div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{ins.role}</div>
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--sage)" }}>{ins.available}</span>
                </button>
              ))}
            </div>
          </aside>

          <div>
            {/* Selected instructor info */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div className="avatar cyan" style={{ width: 56, height: 56, fontSize: 18 }}>AA</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18 }}>دکتر آرش عظیمی</h3>
                  <div style={{ fontSize: 13, color: "var(--fg-mute)", marginTop: 4 }}>دانشیار علوم رایانه · مدت جلسه: ۳۰ دقیقه</div>
                </div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, color: "var(--accent)" }}>۴.۹ ⭐</div>
              </div>
            </div>

            {/* Day picker */}
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>انتخاب روز</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 32 }}>
              {days.map((d, i) => (
                <button key={i} onClick={() => !d.full && setSelectedDay(i)} style={{
                  padding: 14,
                  background: selectedDay === i ? "var(--accent)" : d.full ? "var(--surface-3)" : "var(--surface)",
                  color: selectedDay === i ? "var(--accent-on)" : d.full ? "var(--fg-dim)" : "var(--fg)",
                  border: "1px solid " + (selectedDay === i ? "var(--accent)" : "var(--line)"),
                  borderRadius: 8,
                  textAlign: "center", fontFamily: "inherit",
                  cursor: d.full ? "not-allowed" : "pointer",
                  opacity: d.full ? 0.5 : 1,
                }}>
                  <div style={{ fontSize: 11, fontFamily: "var(--f-mono)" }}>{d.d}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--f-display)", marginTop: 4 }}>{toFa(d.n)}</div>
                  {d.full && <div style={{ fontSize: 9, color: "var(--gold)", marginTop: 4, fontFamily: "var(--f-mono)" }}>تکمیل</div>}
                </button>
              ))}
            </div>

            {/* Time slots */}
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>ساعت آزاد</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 32 }}>
              {slots.map((s, i) => (
                <button key={i} onClick={() => s.available && setSelectedSlot(i)} disabled={!s.available} style={{
                  padding: 12,
                  background: selectedSlot === i ? "var(--fg)" : s.available ? "var(--surface)" : "var(--surface-3)",
                  color: selectedSlot === i ? "var(--bg)" : s.available ? "var(--fg)" : "var(--fg-dim)",
                  border: "1px solid " + (selectedSlot === i ? "var(--fg)" : "var(--line)"),
                  borderRadius: 6,
                  fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 500,
                  cursor: s.available ? "pointer" : "not-allowed",
                  textDecoration: s.available ? "none" : "line-through",
                }}>{s.t}</button>
              ))}
            </div>

            {/* Booking form */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ fontSize: 15, marginBottom: 16 }}>جزئیات جلسه</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <label>
                  <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>نوع جلسه</div>
                  <select style={{ width: "100%", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}>
                    <option>فردی · ۳۰ دقیقه</option>
                    <option>گروهی · ۶۰ دقیقه</option>
                    <option>مشاوره پروژه · ۴۵ دقیقه</option>
                  </select>
                </label>
                <label>
                  <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>محل</div>
                  <select style={{ width: "100%", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }}>
                    <option>آنلاین · کلاس مجازی</option>
                    <option>تلفنی</option>
                    <option>چت ناهمزمان</option>
                  </select>
                </label>
              </div>
              <label>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>موضوع جلسه</div>
                <textarea placeholder="در چند خط بنویسید چه می‌خواهید بپرسید. این کمک می‌کند استاد قبل از جلسه آماده شود." rows={3} style={{ width: "100%", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}></textarea>
              </label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>تا ۲ ساعت قبل از جلسه قابل لغو</span>
                <button className="btn btn-primary">رزرو جلسه<Icon name="arrow" size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
};

// =====================================================
// Events / Webinars
// =====================================================
const EventsPage = ({ go }) => (
  <main data-screen-label="24 رویدادها">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">EVENTS · رویدادها و وبینارها</span>
        <h1 className="h-1" style={{ marginTop: 16 }}>رویدادها و وبینارها</h1>
        <p className="lead" style={{ marginTop: 14 }}>
          سخنرانی‌های مهمان، کارگاه‌های عملی، کنفرانس‌های پژوهشی، روز باز پذیرش.
        </p>
      </div>
    </section>

    {/* Featured event */}
    <section className="shell" style={{ padding: "40px 40px" }}>
      <div className="card" style={{ padding: 40, marginBottom: 40, display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <span className="pill pill-cyan">رویداد ویژه</span>
            <span className="pill">رایگان</span>
            <span className="pill">آنلاین</span>
          </div>
          <h2 className="h-1">آینده‌ی LLMها در آموزش — کنفرانس سالانه ۱۴۰۵</h2>
          <p className="lead" style={{ marginTop: 16, maxWidth: "100%" }}>
            ۴۰ سخنران از دانشگاه‌های ایران و جهان. ۸ کارگاه عملی. شبکه‌سازی با ۱۲۰۰ پژوهشگر فعال.
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em", textTransform: "uppercase" }}>تاریخ</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>۱۸ تا ۲۰ شهریور ۱۴۰۵</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em", textTransform: "uppercase" }}>زمان باقی‌مانده</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: "var(--accent)" }}>۴۲ روز</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em", textTransform: "uppercase" }}>ثبت‌نام شده</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>۸۴۲ نفر</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button className="btn btn-primary btn-lg">ثبت‌نام رایگان</button>
            <button className="btn btn-outline btn-lg"><Icon name="calendar" size={14} />افزودن به تقویم</button>
          </div>
        </div>
        <div style={{
          aspectRatio: "4 / 5",
          background: "linear-gradient(135deg, oklch(0.3 0.13 255), oklch(0.5 0.16 255))",
          borderRadius: 14,
          position: "relative",
          overflow: "hidden",
          padding: 24,
        }}>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 18px)" }}></div>
          <div style={{ position: "relative", color: "white", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.1em" }}>CONF · 1405</div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>LLMs in</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>EDUCATION</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 12, fontFamily: "var(--f-mono)" }}>SHAHRIVAR · 18-20</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {["همه", "وبینار", "کارگاه", "کنفرانس", "سخنرانی مهمان", "روز باز", "این هفته", "این ماه"].map((t, i) => (
          <span key={t} className={"pill " + (i === 0 ? "pill-cyan" : "")} style={{ cursor: "pointer" }}>{t}</span>
        ))}
      </div>

      {/* Event grid */}
      <div className="grid grid-3">
        {[
          { t: "وبینار: ساخت RAG با LangGraph", date: "۲۸ مرداد · ۱۹:۰۰", by: "دکتر موسوی", kind: "وبینار", attendees: 248, free: true },
          { t: "کارگاه: مدل‌سازی موضوعی فارسی", date: "۲ شهریور · ۱۴:۰۰", by: "دکتر طاهری", kind: "کارگاه", attendees: 32, free: false },
          { t: "سخنرانی: حاکمیت داده در ایران", date: "۵ شهریور · ۱۸:۰۰", by: "مهمان از وزارت ICT", kind: "سخنرانی", attendees: 412, free: true },
          { t: "روز باز پذیرش ۱۴۰۵", date: "۱۰ شهریور · کل روز", by: "تیم پذیرش", kind: "روز باز", attendees: 1240, free: true },
          { t: "کارگاه: Kubernetes از صفر", date: "۱۴ شهریور · ۱۰:۰۰", by: "م. کیانی", kind: "کارگاه", attendees: 56, free: false },
          { t: "وبینار: Backpropagation شهودی", date: "۲۱ شهریور · ۲۰:۰۰", by: "دکتر عظیمی", kind: "وبینار", attendees: 184, free: true },
        ].map((e, i) => (
          <div key={i} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <span className="pill" style={{ fontSize: 10 }}>{e.kind}</span>
              <span className={"pill " + (e.free ? "pill-violet" : "pill-amber")} style={{ fontSize: 10 }}>{e.free ? "رایگان" : "پرداختی"}</span>
            </div>
            <h4 style={{ fontSize: 16 }}>{e.t}</h4>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--accent)" }}>{e.date}</div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{e.by}</div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--line)", marginTop: 4 }}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{toFa(e.attendees)} نفر</span>
              <button className="btn btn-outline btn-sm">ثبت‌نام</button>
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// About / Mission
// =====================================================
const AboutPage = ({ go }) => (
  <main data-screen-label="25 درباره">
    <section style={{ padding: "100px 0 60px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell" style={{ maxWidth: 920 }}>
        <span className="eyebrow">ABOUT · درباره ما</span>
        <h1 className="h-display" style={{ marginTop: 24, fontSize: "clamp(40px, 5vw, 80px)" }}>
          دانشگاهی که می‌داند<br />
          <span style={{ color: "var(--accent)", fontStyle: "italic" }}>چطور یاد می‌گیری</span>
        </h1>
        <p style={{ fontSize: 22, lineHeight: 1.7, color: "var(--fg-mute)", marginTop: 32, fontFamily: "var(--f-display)", fontWeight: 400 }}>
          ما دانشگاهی نمی‌سازیم که از ابزارهای AI استفاده می‌کند — ما دانشگاهی می‌سازیم که <strong style={{ color: "var(--fg)" }}>از ابتدا با AI به‌عنوان زیرساخت یادگیری</strong> طراحی شده. تفاوت، در همه چیز است.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "80px 40px" }}>
      <div className="grid grid-3" style={{ marginBottom: 80 }}>
        {[
          { v: "۸,۴۰۰+", l: "دانشجوی فعال در ۸ دانشکده" },
          { v: "۹۴", l: "استاد متخصص از دانشگاه‌های برتر" },
          { v: "۲.۴M+", l: "رویداد یادگیری ثبت‌شده" },
          { v: "۹۹.۹%", l: "در دسترس بودن سرویس" },
          { v: "۲۳۸", l: "گواهی Verifiable Credential صادر شده" },
          { v: "۱۲", l: "زبان پشتیبانی‌شده" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "24px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--f-display)", fontSize: "clamp(40px, 4vw, 64px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--fg)", lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 14, color: "var(--fg-mute)", marginTop: 12 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Principles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 60, marginBottom: 80 }}>
        <div>
          <span className="eyebrow">PRINCIPLES · اصول</span>
          <h2 className="h-1" style={{ marginTop: 16 }}>چه چیزی ما را راهنمایی می‌کند</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            ["AI-Native, not AI-Added", "هوش مصنوعی شالوده‌ی یادگیری است، نه افزونه‌ی جانبی."],
            ["Mastery over Coverage", "تسلط واقعی بر اهداف، نه حضور صرف در کلاس."],
            ["Standards-First", "LTI، xAPI، QTI، Open Badges — استاندارد، نه قفل‌شده به فروشنده."],
            ["Human Judgment in Critical Loops", "هر تصمیم حساس بازبینی انسانی نهایی دارد."],
            ["Privacy by Design", "حریم خصوصی پیش‌فرض است، نه گزینه."],
            ["Persian-First, Global-Ready", "فارسی اولویت، انگلیسی استاندارد، باز برای زبان‌های دیگر."],
          ].map(([t, d], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 18, paddingBottom: 24, borderBottom: i < 5 ? "1px solid var(--line)" : "none" }}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.08em" }}>{toFa("0" + (i + 1))}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--f-display)" }}>{t}</div>
                <div style={{ fontSize: 14, color: "var(--fg-mute)", marginTop: 6, lineHeight: 1.6 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team teaser */}
      <div className="card" style={{ padding: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <span className="eyebrow">TEAM · تیم</span>
            <h2 className="h-2" style={{ marginTop: 16 }}>تیمی از پژوهشگران، طراحان آموزشی و مهندسان</h2>
            <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, marginTop: 14 }}>
              ۲۸ نفر تمام‌وقت، ۱۲ مشاور علمی، ۹۴ استاد در شبکه. متنوع از نظر تخصص، یکپارچه در ماموریت.
            </p>
            <button className="btn btn-outline" style={{ marginTop: 24 }}>دیدن همه‌ی تیم</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {["AA","SM","MK","BF","RT","SR","AN","MK","JK","TT","NR","BN"].map((a, i) => (
              <div key={i} className={"avatar " + (["cyan","amber","violet","rose","cyan","amber","violet","rose","cyan","amber","violet","rose"][i])} style={{ width: "100%", aspectRatio: "1", borderRadius: 8, fontSize: 14 }}>{a}</div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <Footer go={go} />
  </main>
);

window.AdminPage = AdminPage;
window.ParentPage = ParentPage;
window.OfficeHoursPage = OfficeHoursPage;
window.EventsPage = EventsPage;
window.AboutPage = AboutPage;
