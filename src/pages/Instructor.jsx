// =====================================================
// Instructor Console
// =====================================================
const InstructorPage = ({ go }) => {
  return (
    <main data-screen-label="06 کنسول استاد">
      <div className="dash">
        <RoleSideNav active="instructor" go={go} />

        <div className="dash-main">
          <div className="dash-greet">
            <div>
              <span className="eyebrow">INSTRUCTOR CONSOLE</span>
              <h1 style={{ marginTop: 10 }}>دکتر عظیمی، کلاسِ ساعت ۱۴ نیاز به بازبینی دارد</h1>
              <p className="muted">۳ هشدار آموزشی · ۸ پاسخ AI در انتظار تأیید · ۲ تمرین برای تصحیح نهایی.</p>
            </div>
            <button className="btn btn-primary" onClick={() => go("classroom")}>
              ورود به کنسول کلاس
              <Icon name="arrow" size={14} />
            </button>
          </div>

          {/* Class health */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <div>
                <span className="eyebrow">CLASS HEALTH · CS-410</span>
                <h2 className="h-2" style={{ marginTop: 10 }}>سلامت کلاس · جلسه ۸</h2>
              </div>
              <span className="pill pill-amber"><Icon name="bolt" size={11} />۲ هشدار</span>
            </div>

            <div className="grid grid-4" style={{ marginBottom: 32 }}>
              <HealthCard l="مشارکت" v="۸۲٪" status="ok" desc="بالاتر از میانگین ترم" />
              <HealthCard l="فهم محتوا" v="۶۴٪" status="warn" desc="افت ۱۲ نمره از جلسه قبل" />
              <HealthCard l="سرعت تدریس" v="بالا" status="warn" desc="۹۴ کلمه/دقیقه — کمی کند کنید" />
              <HealthCard l="پرسش‌گری" v="۲۳" status="ok" desc="۲ خوشه‌ی فعال" />
            </div>

            {/* Coach suggestions */}
            <div style={{
              padding: 20,
              background: "color-mix(in oklch, var(--violet) 8%, var(--surface-2))",
              border: "1px solid color-mix(in oklch, var(--violet) 30%, transparent)",
              borderRadius: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--violet)", marginBottom: 14 }}>
                <Icon name="sparkle" size={16} />
                <span className="mono" style={{ letterSpacing: "0.1em" }}>AI COACH SUGGESTIONS · ۳ پیشنهاد</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["در ۲ دقیقه‌ی بعدی یک مقایسه‌ی کوتاه بین مومنتوم و Adam ارائه دهید — ۳ سوال مشابه در چت ثبت شده.", true],
                  ["نسرین و ۴ نفر دیگر روی این مفهوم گیر کرده‌اند. یک مثال عددی ساده پیشنهاد می‌شود.", false],
                  ["سرعت بیان شما در ۵ دقیقه‌ی اخیر ۱۸٪ بیشتر از میانگین است. مکث کوتاه پیشنهاد می‌شود.", false],
                ].map(([t, accepted], i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: 14, background: "var(--surface)", borderRadius: 10, border: "1px solid var(--line)" }}>
                    <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>{t}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {accepted ? (
                        <span className="pill pill-cyan" style={{ fontSize: 10 }}>پذیرفته شد</span>
                      ) : (
                        <>
                          <button className="btn btn-outline btn-sm">پذیرش</button>
                          <button className="btn btn-ghost btn-sm">بعداً</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI review queue + cohort */}
          <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h3 className="h-3">صف بازبینی خروجی AI</h3>
                <span className="mono" style={{ color: "var(--fg-mute)" }}>۸ مورد در انتظار</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { kind: "خلاصه پساکلاس", agent: "TUTOR", title: "خلاصه جلسه ۷ — اعتبارسنجی متقاطع", risk: "low", srcs: 5 },
                  { kind: "کوییز تولیدی", agent: "COACH", title: "۸ سوال چندگزینه‌ای بهینه‌سازی", risk: "med", srcs: 3 },
                  { kind: "بازخورد تمرین", agent: "GRADER", title: "نمره پیشنهادی تمرین ۴ نسرین — ۸۷/۱۰۰", risk: "low", srcs: 1 },
                  { kind: "پاسخ FAQ", agent: "MENTOR", title: "تفاوت overfitting و underfitting در RNN", risk: "high", srcs: 7 },
                ].map((r, i) => (
                  <div key={i} className="card-flat" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 16, alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "color-mix(in oklch, var(--violet) 15%, var(--surface-3))",
                      color: "var(--violet)",
                      display: "grid", placeItems: "center",
                      fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 10,
                    }}>{r.agent.slice(0, 3)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 3 }}>{r.kind} · {toFa(r.srcs)} منبع</div>
                    </div>
                    <span className={"pill " + (r.risk === "high" ? "pill-rose" : r.risk === "med" ? "pill-amber" : "pill-cyan")} style={{ fontSize: 10 }}>
                      ریسک {r.risk === "high" ? "بالا" : r.risk === "med" ? "متوسط" : "کم"}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm"><Icon name="eye" size={13} /></button>
                      <button className="btn btn-outline btn-sm">تأیید</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cohort intervention */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h3 className="h-3">دانشجویان در معرض ریسک</h3>
                <span className="mono" style={{ color: "var(--rose)" }}>۳ نفر</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "مهسا کوهی", id: "84-7723", risk: 0.68, reason: "افت تعامل + غیبت ۲ جلسه", av: "MK", cls: "rose" },
                  { name: "بهنام رضوی", id: "84-9112", risk: 0.54, reason: "۴ کوییز پشت سر هم زیر ۵۰٪", av: "BR", cls: "amber" },
                  { name: "ساغر فرجی", id: "84-2056", risk: 0.48, reason: "تأخیر مکرر در تحویل تمرین", av: "SF", cls: "amber" },
                ].map((s, i) => (
                  <div key={i} className="card-flat" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div className={"avatar " + s.cls}>{s.av}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--rose)" }}>ریسک {toFa(Math.round(s.risk * 100))}٪</div>
                      </div>
                      <div style={{ height: 3, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: (s.risk * 100) + "%", height: "100%", background: "var(--rose)", borderRadius: 999 }}></div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 6 }}>{s.reason}</div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                  ارسال پیام شخصی به همه
                </button>
              </div>
            </div>
          </div>

          {/* Course Authoring Studio teaser */}
          <div className="card" style={{ padding: 40, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(800px 300px at 80% 50%, color-mix(in oklch, var(--cyan) 14%, transparent), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
              <div>
                <span className="eyebrow">COURSE AUTHORING STUDIO</span>
                <h2 className="h-2" style={{ marginTop: 14 }}>از یک ایده، تا یک درس کامل — در ۴۵ دقیقه</h2>
                <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, marginTop: 14 }}>
                  AI Course Planner ساختار اولیه، اهداف یادگیری و نقشه‌ی مفهومی را پیشنهاد می‌دهد. شما تأیید، اصلاح یا رد می‌کنید. خروجی، یک Course Blueprint استاندارد است.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  <button className="btn btn-primary">
                    <Icon name="plus" size={14} />
                    شروع درس جدید
                  </button>
                  <button className="btn btn-outline">
                    <Icon name="file" size={14} />
                    قالب‌ها
                  </button>
                </div>
              </div>
              <div className="card-flat" style={{ padding: 20 }}>
                <div className="mono" style={{ color: "var(--fg-mute)", marginBottom: 14 }}>BLUEPRINT · DRAFT</div>
                {[
                  ["موضوع", "یادگیری تقویتی"],
                  ["سطح", "ارشد"],
                  ["مدت", "۱۰ هفته"],
                  ["پیش‌نیاز", "احتمالات، Python"],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}>
                    <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  {["MDP", "Bellman", "Q-Learning", "PPO", "Actor-Critic"].map((t) => (
                    <span key={t} className="pill">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer go={go} />
    </main>
  );
};

const InstructorSideNav = () => (
  <aside className="side-nav">
    <h6>تدریس</h6>
    <ul>
      <li><a className="active"><Icon name="home" size={14} />نمای کلی</a></li>
      <li><a><Icon name="live" size={14} />کلاس‌های زنده</a></li>
      <li><a><Icon name="book" size={14} />دروس من</a></li>
      <li><a><Icon name="users" size={14} />دانشجویان</a></li>
    </ul>
    <h6>هوش مصنوعی</h6>
    <ul>
      <li><a><Icon name="sparkle" size={14} />صف بازبینی</a></li>
      <li><a><Icon name="chip" size={14} />سیاست عامل‌ها</a></li>
      <li><a><Icon name="folder" size={14} />منبع‌های مجاز</a></li>
    </ul>
    <h6>سنجش</h6>
    <ul>
      <li><a><Icon name="cert" size={14} />بانک سوال</a></li>
      <li><a><Icon name="check" size={14} />تصحیح تمرین</a></li>
      <li><a><Icon name="chart" size={14} />تحلیل کلاس</a></li>
    </ul>
  </aside>
);

const HealthCard = ({ l, v, status, desc }) => {
  const color = status === "ok" ? "var(--cyan)" : status === "warn" ? "var(--amber)" : "var(--rose)";
  return (
    <div className="card-flat" style={{ padding: 20, borderColor: color + "40" }}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.08em" }}>{l}</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 32, fontWeight: 700, marginTop: 6, color: color }}>{v}</div>
      <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6 }}>{desc}</div>
    </div>
  );
};

window.InstructorPage = InstructorPage;
