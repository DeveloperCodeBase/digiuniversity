// =====================================================
// Student Dashboard — with Cognitive Profile
// =====================================================
const DashboardPage = ({ go }) => {
  return (
    <main data-screen-label="04 میز کار من">
      <div className="dash">
        <RoleSideNav active="dashboard" go={go} />

        <div className="dash-main">
          {/* Greeting */}
          <div className="dash-greet">
            <div>
              <span className="eyebrow">پنل دانشجو · شناسه ۸۴۰۲۱۷</span>
              <h1 style={{ marginTop: 10 }}>سلام نسرین، امروز روی <span style={{ color: "var(--cyan)" }}>بهینه‌سازی</span> تمرکز کن.</h1>
              <p className="muted">۳ کار باز · جلسه‌ی بعدی ۹۰ دقیقه دیگر · پروفایل شناختی به‌روز.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline"><Icon name="bell" size={14} /></button>
              <button className="btn btn-primary" onClick={() => go("classroom")}>
                ورود به کلاس بعدی
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>

          {/* Stat row */}
          <div className="stat-row">
            <StatCard l="میانگین تسلط" v="۷۸" unit="٪" trend="+ ۴.۲" spark={[40,45,52,48,55,62,68,72,75,78]} color="var(--cyan)" />
            <StatCard l="دروس فعال" v="۴" trend="۲ امروز" spark={[3,3,3,4,4,4,4,4,4,4]} color="var(--amber)" />
            <StatCard l="ساعت یادگیری · هفته" v="۱۲.۴" unit="h" trend="+ ۱.۸h" spark={[8,10,9,12,11,13,14,11,12,12.4]} color="var(--violet)" />
            <StatCard l="ریسک افت" v="۰.۱۲" trend="کم" spark={[0.3,0.28,0.25,0.2,0.18,0.16,0.14,0.13,0.12,0.12]} color="var(--rose)" trendDown />
          </div>

          {/* Cognitive profile */}
          <div className="cog-profile">
            <div className="cog-grid">
              <div style={{ display: "grid", placeItems: "center" }}>
                <CognitiveRadar
                  values={[78, 64, 86, 52, 71, 90]}
                  labels={["مفاهیم پایه", "حل مسئله", "کدنویسی", "ریاضیات", "ارتباط", "استمرار"]}
                />
              </div>
              <div>
                <span className="eyebrow">COGNITIVE LEARNER PROFILE · live</span>
                <h2 className="h-2" style={{ marginTop: 14 }}>نقشه‌ی شناختی شما</h2>
                <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, marginTop: 14, maxWidth: 460 }}>
                  بر اساس ۲۳۴ تعامل در ۱۲ کلاس اخیر، پروفایل شناختی شما به‌روزرسانی شد.
                  مدل مشاهده می‌کند که در <strong style={{ color: "var(--fg)" }}>کدنویسی</strong> و <strong style={{ color: "var(--fg)" }}>استمرار</strong> قوی هستید، ولی در <strong style={{ color: "var(--fg)" }}>ریاضیات کاربردی</strong> فضای رشد دارید.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
                  <ActionCard
                    icon="target"
                    label="مفهوم پیشنهادی"
                    title="مشتق ماتریسی"
                    sub="۱۸ دقیقه · ۳ تمرین کوتاه"
                  />
                  <ActionCard
                    icon="play"
                    label="بازبینی پیشنهادی"
                    title="جلسه ۵ از دقیقه ۲۲"
                    sub="مفهوم مبهم ثبت شده"
                  />
                  <ActionCard
                    icon="users"
                    label="گروه مطالعه"
                    title="با علی و ساره"
                    sub="فردا ۲۰:۳۰"
                  />
                  <ActionCard
                    icon="bolt"
                    label="کوییز جبرانی"
                    title="بهینه‌سازی · سطح ۲"
                    sub="۸ سوال تطبیقی"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule + activity */}
          <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h3 className="h-3">برنامه‌ی این هفته</h3>
                <a href="#" style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>تقویم کامل ←</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SCHEDULE.map((s, i) => (
                  <div key={i} className="sched-item">
                    <div className="sched-time">
                      <span className="day">{s.day}</span>
                      {s.time}
                    </div>
                    <div>
                      <div className="sched-title">{s.title}</div>
                      <div className="sched-by">{s.by} · {s.kind}</div>
                    </div>
                    <div>
                      {s.now ? (
                        <button className="btn btn-primary btn-sm" onClick={() => go("classroom")}>
                          <span className="dot dot-live"></span>
                          ورود
                        </button>
                      ) : (
                        <span className="pill">{s.in}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h3 className="h-3">گواهی‌های اخیر</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); go("credential"); }} style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>همه ←</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <CredMini title="مبانی یادگیری ماشین" sub="۲۴ ماژول · تسلط ۹۲٪" date="۱۸ اسفند ۱۴۰۴" />
                <CredMini title="آمار بیزی کاربردی" sub="۲۰ ماژول · تسلط ۸۴٪" date="۲۵ بهمن ۱۴۰۴" />
                <CredMini title="پایگاه داده پیشرفته" sub="۱۸ ماژول · تسلط ۸۸٪" date="۱۰ دی ۱۴۰۴" />
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="card">
            <h3 className="h-3" style={{ marginBottom: 24 }}>فعالیت سامانه · ۲۴ ساعت اخیر</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              {[
                { l: "رویدادهای یادگیری ثبت‌شده", v: "۲۳۴", icon: "pulse" },
                { l: "پاسخ AI Tutor", v: "۱۸", icon: "sparkle" },
                { l: "جستجوی معنایی", v: "۹", icon: "search" },
                { l: "خوشه‌بندی سوال در کلاس", v: "۲", icon: "users" },
              ].map((a, i) => (
                <div key={i} style={{ background: "var(--surface)", padding: 20 }}>
                  <div style={{ color: "var(--cyan)" }}><Icon name={a.icon} size={16} /></div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 24, fontWeight: 700, marginTop: 8 }}>{a.v}</div>
                  <div style={{ color: "var(--fg-mute)", fontSize: 12, marginTop: 4 }}>{a.l}</div>
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

const SideNav = ({ active }) => (
  <aside className="side-nav">
    <h6>یادگیری</h6>
    <ul>
      <li><a className={active === "home" ? "active" : ""}><Icon name="home" size={14} />خانه</a></li>
      <li><a><Icon name="book" size={14} />دروس من</a></li>
      <li><a><Icon name="calendar" size={14} />تقویم</a></li>
      <li><a><Icon name="folder" size={14} />منابع</a></li>
      <li><a><Icon name="chart" size={14} />پیشرفت</a></li>
    </ul>
    <h6>هوش مصنوعی</h6>
    <ul>
      <li><a><Icon name="sparkle" size={14} />دستیار شخصی</a></li>
      <li><a><Icon name="target" size={14} />مسیر جبرانی</a></li>
      <li><a><Icon name="bolt" size={14} />تمرین تطبیقی</a></li>
    </ul>
    <h6>اجتماع</h6>
    <ul>
      <li><a><Icon name="users" size={14} />گروه‌های مطالعه</a></li>
      <li><a><Icon name="chat" size={14} />انجمن‌ها</a></li>
    </ul>
    <h6>کارنامه</h6>
    <ul>
      <li><a><Icon name="cert" size={14} />گواهی‌ها</a></li>
      <li><a><Icon name="trophy" size={14} />دستاوردها</a></li>
      <li><a><Icon name="dollar" size={14} />شهریه</a></li>
    </ul>
  </aside>
);

const StatCard = ({ l, v, unit, trend, spark, color, trendDown }) => (
  <div className="stat">
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    <div className="l">{l}</div>
    <div className={"trend " + (trendDown ? "down" : "")} style={trendDown ? { color: "var(--cyan)" } : {}}>
      <Icon name="arrow" size={11} stroke={2} />
      {trend}
    </div>
    {spark && <div className="spark"><Sparkline values={spark} color={color} /></div>}
  </div>
);

const ActionCard = ({ icon, label, title, sub }) => (
  <div className="card-flat" style={{ padding: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--cyan)", marginBottom: 8 }}>
      <Icon name={icon} size={13} />
      <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
    </div>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 4, fontFamily: "var(--f-mono)" }}>{sub}</div>
  </div>
);

const CredMini = ({ title, sub, date }) => (
  <div className="card-flat" style={{ display: "flex", alignItems: "center", gap: 14, padding: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 50, background: "conic-gradient(from 0deg, var(--amber), var(--cyan), var(--violet), var(--amber))", flexShrink: 0, position: "relative" }}>
      <div style={{ position: "absolute", inset: 3, borderRadius: 50, background: "var(--surface-2)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--amber)", fontWeight: 700 }}>VC</div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{sub}</div>
    </div>
    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>{date}</div>
  </div>
);

const SCHEDULE = [
  { day: "امروز", time: "۱۴:۰۰", title: "یادگیری ماشین — جلسه ۸", by: "دکتر عظیمی", kind: "کلاس زنده", now: false, in: "۹۰ دقیقه" },
  { day: "امروز", time: "۱۶:۳۰", title: "تمرین تطبیقی · بهینه‌سازی", by: "AI Coach", kind: "خودخوان", now: true, in: "اکنون" },
  { day: "فردا", time: "۱۰:۰۰", title: "NLP پیشرفته — workshop", by: "دکتر موسوی", kind: "کارگاه", now: false, in: "فردا" },
  { day: "چهارشنبه", time: "۱۸:۰۰", title: "مهارت تحلیل آماری · آزمون", by: "خودکار", kind: "آزمون تطبیقی", now: false, in: "۴۸ ساعت" },
  { day: "پنج‌شنبه", time: "۲۰:۳۰", title: "گروه مطالعه — ریاضیات", by: "نسرین، علی، ساره", kind: "همتا", now: false, in: "۹۶ ساعت" },
];

window.DashboardPage = DashboardPage;
window.SideNav = SideNav;
