// =====================================================
// Analytics Dashboard — admin / institutional view
// =====================================================
const AnalyticsPage = ({ go }) => {
  return (
    <main data-screen-label="12 تحلیل‌گری">
      <div className="dash">
        <RoleSideNav active="analytics" go={go} />

        <div className="dash-main">
          {/* Header */}
          <div className="dash-greet">
            <div>
              <span className="eyebrow">INSTITUTIONAL ANALYTICS · TERM SPRING-1405</span>
              <h1 style={{ marginTop: 10 }}>دانشگاه شما، در یک نگاه</h1>
              <p className="muted">۸ دانشکده · ۲۳ برنامه · ۱۲۸۴ دانشجو فعال · ۹۴ استاد</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <select style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, color: "var(--fg)", fontFamily: "inherit", fontSize: 13 }}>
                <option>ترم بهار ۱۴۰۵</option>
                <option>سال ۱۴۰۴</option>
                <option>کل دوره</option>
              </select>
              <button className="btn btn-outline"><Icon name="download" size={14} />Export CSV</button>
            </div>
          </div>

          {/* KPI row */}
          <div className="stat-row">
            <StatCard l="نرخ تکمیل" v="۸۴" unit="٪" trend="+ ۶.۲ از پارسال" spark={[72,74,76,78,80,82,83,84]} color="var(--cyan)" />
            <StatCard l="میانگین تسلط" v="۷۹" unit="٪" trend="+ ۳.۱ از پارسال" spark={[70,72,74,75,76,77,78,79]} color="var(--amber)" />
            <StatCard l="ساعت کلاس زنده" v="۲.۴" unit="K" trend="+ ۱۸٪" spark={[1500,1700,1900,2000,2200,2300,2400,2400]} color="var(--violet)" />
            <StatCard l="ریسک افت تحصیلی" v="۸.۴" unit="٪" trend="- ۲.۳" spark={[12,11.5,11,10.5,10,9.5,9,8.4]} color="var(--rose)" trendDown />
          </div>

          {/* Engagement heatmap */}
          <div className="analytic-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <span className="eyebrow">LEARNING ACTIVITY · HEATMAP</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>فعالیت یادگیری · ۲۸ روز اخیر</h3>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>
                <span>کم</span>
                <div style={{ display: "flex", gap: 2 }}>
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
                    <div key={o} style={{ width: 14, height: 14, background: `oklch(0.5 0.14 195 / ${o})`, borderRadius: 2 }} />
                  ))}
                </div>
                <span>زیاد</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, alignItems: "center" }}>
              {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day, di) => (
                <React.Fragment key={day}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)", textAlign: "center" }}>{day}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(28, 1fr)", gap: 3 }}>
                    {Array.from({ length: 28 }, (_, i) => {
                      // Deterministic-ish "activity"
                      const v = ((Math.sin(i * 1.3 + di * 0.7) + 1) / 2) * 0.9 + 0.1;
                      const isWeekend = di >= 5;
                      const final = isWeekend ? v * 0.4 : v;
                      return <div key={i} style={{ aspectRatio: "1", background: `oklch(0.5 0.14 195 / ${final.toFixed(2)})`, borderRadius: 2, minHeight: 14 }} />;
                    })}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Cohort comparison + Mastery distribution */}
          <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            <div className="analytic-card">
              <div style={{ marginBottom: 24 }}>
                <span className="eyebrow">COHORT COMPARISON</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>عملکرد cohortها · تسلط در طول ترم</h3>
              </div>
              <CohortChart />
              <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
                <Legend color="var(--cyan)" label="Cohort 1405 — کنونی" />
                <Legend color="var(--amber)" label="Cohort 1404" />
                <Legend color="var(--violet)" label="Cohort 1403" />
              </div>
            </div>

            <div className="analytic-card">
              <div style={{ marginBottom: 24 }}>
                <span className="eyebrow">MASTERY DISTRIBUTION</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>توزیع تسلط</h3>
              </div>
              {[
                ["۹۰-۱۰۰٪", 24, "var(--cyan)"],
                ["۸۰-۹۰٪", 38, "var(--cyan)"],
                ["۷۰-۸۰٪", 22, "var(--amber)"],
                ["۶۰-۷۰٪", 11, "var(--amber)"],
                ["< ۶۰٪", 5, "var(--rose)"],
              ].map(([range, pct, c]) => (
                <div key={range} className="bar-chart-row">
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>{range}</span>
                  <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: pct * 2 + "%", height: "100%", background: c, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600, textAlign: "left" }}>{toFa(pct)}٪</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top courses + AI usage */}
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="analytic-card">
              <div style={{ marginBottom: 20 }}>
                <span className="eyebrow">TOP COURSES · BY ENGAGEMENT</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>پر تعامل‌ترین دروس</h3>
              </div>
              {[
                ["مبانی یادگیری ماشین", "CS-410", 92],
                ["NLP پیشرفته", "CS-620", 88],
                ["معماری سامانه‌ها", "CS-580", 84],
                ["آمار بیزی", "STAT-440", 79],
                ["اخلاق AI", "PHIL-220", 71],
              ].map(([name, code, score]) => (
                <div key={code} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{code}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 80, height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: score + "%", height: "100%", background: "var(--cyan)", borderRadius: 999 }} />
                    </div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600, minWidth: 30 }}>{toFa(score)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="analytic-card">
              <div style={{ marginBottom: 20 }}>
                <span className="eyebrow">AI AGENT USAGE</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>استفاده از عامل‌های هوشمند</h3>
              </div>
              {[
                ["TUTOR · توضیح‌دهنده", 42384, "var(--cyan)"],
                ["COACH · مربی", 18204, "var(--amber)"],
                ["GRADER · ارزیاب", 8932, "var(--violet)"],
                ["CRITIC · منتقد", 4128, "var(--rose)"],
                ["MENTOR · منتور", 2841, "var(--fg-mute)"],
              ].map(([name, count, c]) => (
                <div key={name} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: c, boxShadow: `0 0 10px ${c}` }} />
                  <div style={{ fontSize: 13 }}>{name}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600 }}>{toFa(count.toLocaleString())}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: 12, background: "var(--surface-2)", borderRadius: 8, fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--amber)" }}>● </span>
                ۹۲٪ از پاسخ‌های Tutor دارای منبع داخلی هستند (RAG-grounded).
              </div>
            </div>
          </div>

          {/* At-risk early warning */}
          <div className="analytic-card" style={{ borderColor: "color-mix(in oklch, var(--rose) 40%, var(--line))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <span className="eyebrow" style={{ color: "var(--rose)" }}>EARLY WARNING · ML PIPELINE</span>
                <h3 className="h-3" style={{ marginTop: 10 }}>هشدار افت تحصیلی</h3>
              </div>
              <span className="pill pill-rose">۲۳ دانشجو</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                ["خیلی بالا", 6, "var(--rose)"],
                ["بالا", 17, "var(--rose)"],
                ["متوسط", 34, "var(--amber)"],
                ["پایش", 72, "var(--fg-mute)"],
              ].map(([level, count, c]) => (
                <div key={level} style={{ padding: 16, background: "var(--surface-2)", borderRadius: 10, border: `1px solid ${c}33` }}>
                  <div className="mono" style={{ fontSize: 10, color: c, letterSpacing: "0.08em" }}>{level}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 28, fontWeight: 700, marginTop: 4, color: c }}>{toFa(count)}</div>
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

const AnalyticsSideNav = () => (
  <aside className="side-nav">
    <h6>تحلیل</h6>
    <ul>
      <li><a className="active"><Icon name="chart" size={14} />نمای کلی</a></li>
      <li><a><Icon name="pulse" size={14} />Real-time</a></li>
      <li><a><Icon name="users" size={14} />Cohort تحلیل</a></li>
      <li><a><Icon name="target" size={14} />Funnel</a></li>
    </ul>
    <h6>پیش‌بینی</h6>
    <ul>
      <li><a><Icon name="bell" size={14} />هشدار زودهنگام</a></li>
      <li><a><Icon name="flask" size={14} />آزمایش‌گری A/B</a></li>
      <li><a><Icon name="bolt" size={14} />Forecast</a></li>
    </ul>
    <h6>گزارش</h6>
    <ul>
      <li><a><Icon name="file" size={14} />هفتگی</a></li>
      <li><a><Icon name="file" size={14} />ترمی</a></li>
      <li><a><Icon name="download" size={14} />Export</a></li>
    </ul>
  </aside>
);

const Legend = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-mute)" }}>
    <span style={{ width: 12, height: 3, background: color, borderRadius: 999 }} />
    {label}
  </div>
);

const CohortChart = () => {
  const cohorts = [
    { name: "1405", color: "var(--cyan)", values: [10, 22, 35, 48, 58, 65, 71, 76, 79] },
    { name: "1404", color: "var(--amber)", values: [8, 18, 30, 41, 50, 58, 64, 70, 74] },
    { name: "1403", color: "var(--violet)", values: [6, 15, 26, 36, 44, 51, 57, 62, 67] },
  ];
  const W = 800, H = 240;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      {[0, 25, 50, 75, 100].map((y) => (
        <line key={y} x1="0" y1={H - (y / 100) * H} x2={W} y2={H - (y / 100) * H} stroke="var(--line)" strokeDasharray="4 4" />
      ))}
      {cohorts.map((c) => {
        const pts = c.values.map((v, i) => `${(i / (c.values.length - 1)) * W},${H - (v / 100) * H}`).join(" L ");
        return (
          <g key={c.name}>
            <path d={"M " + pts} fill="none" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {c.values.map((v, i) => (
              <circle key={i} cx={(i / (c.values.length - 1)) * W} cy={H - (v / 100) * H} r="3.5" fill={c.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

window.AnalyticsPage = AnalyticsPage;
