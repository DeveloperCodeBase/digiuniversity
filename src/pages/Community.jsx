// =====================================================
// Community — Discussion forum + AI Q&A clustering
// =====================================================
const CommunityPage = ({ go }) => {
  const [filter, setFilter] = React.useState("trending");

  return (
    <main data-screen-label="11 جامعه">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">LEARNING COMMUNITY · PEER-TO-PEER</span>
              <h1 className="h-1" style={{ marginTop: 16 }}>سوال کسی، می‌تواند پاسخ همه باشد</h1>
              <p className="lead" style={{ marginTop: 14 }}>
                ۸۴۲ بحث فعال در ۲۳ درس. AI سوالات مشابه را خوشه‌بندی می‌کند و پاسخ‌های پراکنده را به دانش جمعی تبدیل می‌کند.
              </p>
            </div>
            <button className="btn btn-primary">
              <Icon name="plus" size={14} />
              شروع بحث جدید
            </button>
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: 32 }}>
          {/* Left filters */}
          <aside style={{ position: "sticky", top: 90, alignSelf: "start" }}>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>دسته‌ها</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                ["trending", "داغ هفته", 24],
                ["unanswered", "بدون پاسخ", 18],
                ["mycourses", "دروس من", 42],
                ["instructor", "از طرف استاد", 5],
                ["solved", "حل‌شده", 312],
              ].map(([id, lbl, n]) => (
                <li key={id}>
                  <button onClick={() => setFilter(id)} style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: filter === id ? "color-mix(in oklch, var(--cyan) 10%, var(--surface))" : "transparent",
                    border: "1px solid " + (filter === id ? "color-mix(in oklch, var(--cyan) 30%, transparent)" : "transparent"),
                    borderRadius: 8,
                    color: filter === id ? "var(--fg)" : "var(--fg-mute)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: 14,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}>
                    <span>{lbl}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{toFa(n)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginTop: 28, marginBottom: 12 }}>تگ‌های فعال</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["یادگیری ماشین", "پایتون", "ریاضی", "NLP", "PyTorch", "آمار", "SQL", "Linux"].map((t) => (
                <span key={t} className="pill" style={{ cursor: "pointer", fontSize: 10 }}>{t}</span>
              ))}
            </div>
          </aside>

          {/* Threads */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* AI synthesis at top */}
            <div className="ai-summary" style={{ marginTop: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--violet)", marginBottom: 12 }}>
                <Icon name="sparkle" size={16} />
                <span className="mono" style={{ letterSpacing: "0.1em" }}>AI CLUSTER · ۳ موضوع داغ این هفته</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["تفاوت Adam و SGD با مومنتوم", "۲۳ بحث · ۱۸ پاسخ تأیید‌شده"],
                  ["پیاده‌سازی Attention از صفر", "۱۴ بحث · ۱۲ پاسخ"],
                  ["خطای CUDA out of memory در آموزش", "۹ بحث · ۷ راه‌حل"],
                ].map(([t, m], i) => (
                  <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none", fontSize: 13 }}>
                    <span>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--fg-mute)", fontSize: 11 }}>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {THREADS.map((t, i) => (
              <div key={i} className="thread">
                <div className="thread-votes">
                  <Icon name="arrow" size={14} style={{ transform: "rotate(-90deg)" }} />
                  <span className="up">{toFa(t.up)}</span>
                  <Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    {t.solved && <span className="pill pill-cyan" style={{ fontSize: 10 }}>حل شده</span>}
                    {t.instructor && <span className="pill pill-amber" style={{ fontSize: 10 }}>پاسخ استاد</span>}
                    <span className="pill" style={{ fontSize: 10 }}>{t.course}</span>
                    <span className="pill" style={{ fontSize: 10 }}>{t.tag}</span>
                  </div>
                  <h4 style={{ fontSize: 17, marginBottom: 8 }}>{t.title}</h4>
                  <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>{t.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, fontSize: 12, color: "var(--fg-mute)" }}>
                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{t.av}</div>
                    <span>{t.who}</span>
                    <span>·</span>
                    <span className="mono">{t.time}</span>
                  </div>
                </div>
                <div style={{ textAlign: "left", fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>{toFa(t.replies)}</div>
                  <div>پاسخ</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right — leaderboard, online */}
          <aside style={{ position: "sticky", top: 90, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="mono" style={{ color: "var(--amber)", fontSize: 11, letterSpacing: "0.08em", marginBottom: 14 }}>
                <Icon name="trophy" size={12} /> برترین کمک‌رسانان
              </div>
              {[
                ["دکتر عظیمی", "استاد · ML", "۴۲۸", "amber"],
                ["مهرداد افشار", "ارشد · CS", "۲۹۱", "cyan"],
                ["ساره مومنی", "ارشد · NLP", "۱۸۴", "violet"],
                ["علی نوری", "کارشناسی · CE", "۹۲", "rose"],
              ].map(([n, r, p, c], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)", width: 16 }}>{toFa(i + 1)}</div>
                  <div className={"avatar " + c} style={{ width: 32, height: 32, fontSize: 11 }}>{n[0]}{n.split(" ")[1]?.[0] || ""}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)" }}>{r}</div>
                  </div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>{p}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="mono" style={{ color: "var(--cyan)", fontSize: 11, letterSpacing: "0.08em", marginBottom: 14 }}>
                <span className="dot dot-live" style={{ marginLeft: 6 }}></span>
                همین الان آنلاین
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["AA","NR","MK","SF","BR","MA","TT","JK","+ ۱۲"].map((a, i) => (
                  <div key={i} className={"avatar " + ["cyan","amber","violet","rose","cyan","amber",""," ",""][i]} style={{ width: 32, height: 32, fontSize: 10 }}>{a}</div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 12 }}>
                ۲۱ نفر در حال مطالعه · ۸ نفر در گروه مطالعه
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const THREADS = [
  { title: "چرا گرادیان نزولی با مومنتوم در نقاط زینی بهتر عمل می‌کند؟", excerpt: "دارم روی این موضوع کار می‌کنم و متوجه شدم در نقاط زینی، SGD ساده گاهی متوقف می‌شود ولی مومنتوم از آن عبور می‌کند...", course: "CS-410", tag: "بهینه‌سازی", who: "نسرین رضوی", av: "نر", time: "۲ ساعت پیش", up: 42, replies: 8, solved: true, instructor: true },
  { title: "بهترین کتاب فارسی برای یادگیری ریاضیات شبکه‌های عصبی؟", excerpt: "می‌خواهم پایه ریاضی قوی‌تری بسازم. کتاب فارسی یا منبع آموزشی به زبان فارسی پیشنهاد می‌دهید؟", course: "general", tag: "منابع", who: "بهنام رضوی", av: "بر", time: "۵ ساعت پیش", up: 28, replies: 14, solved: false, instructor: false },
  { title: "خطای CUDA out of memory در آموزش مدل ResNet50", excerpt: "روی GPU 8GB دارم ResNet50 رو آموزش می‌دم با batch size ۳۲ ولی خطای OOM می‌گیرم. راه‌حل؟", course: "CS-580", tag: "PyTorch", who: "مهرداد افشار", av: "ما", time: "دیروز", up: 18, replies: 12, solved: true, instructor: false },
  { title: "تفاوت دقیق attention با self-attention چیست؟", excerpt: "در ترنسفورمر، self-attention را داریم ولی همچنین cross-attention. تفاوت ریاضی دقیق آنها...", course: "CS-620", tag: "NLP", who: "ساره مومنی", av: "سم", time: "۲ روز پیش", up: 15, replies: 6, solved: false, instructor: false },
  { title: "اخلاق هوش مصنوعی: مسئولیت در تصمیمات خودکار", excerpt: "مقاله‌ای می‌نویسم درباره‌ی مسئولیت حقوقی تصمیمات الگوریتمی. منابع اصلی فارسی و انگلیسی...", course: "PHIL-220", tag: "اخلاق", who: "علی نوری", av: "عن", time: "۳ روز پیش", up: 11, replies: 9, solved: false, instructor: true },
];

window.CommunityPage = CommunityPage;
