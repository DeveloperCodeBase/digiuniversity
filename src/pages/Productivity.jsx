// =====================================================
// More productivity pages: Notifications, Messages, Bookmarks,
// Achievements, Submission, Profile/Portfolio
// =====================================================

// =====================================================
// Notifications Inbox
// =====================================================
const NotificationsPage = ({ go }) => {
  const [filter, setFilter] = React.useState("all");
  return (
    <main data-screen-label="30 اعلان‌ها">
      <section className="shell" style={{ padding: "60px 40px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
          <div>
            <span className="eyebrow">NOTIFICATIONS · اعلان‌ها</span>
            <h1 className="h-1" style={{ marginTop: 12 }}>صندوق اعلان‌ها</h1>
            <p className="lead" style={{ marginTop: 12 }}>۳ اعلان جدید · ۴۲ اعلان در ۳۰ روز اخیر</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm">علامت‌گذاری همه به‌عنوان خوانده‌شده</button>
            <button className="btn btn-outline btn-sm" onClick={() => go("settings")}><Icon name="settings" size={13} />تنظیمات</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
          <aside>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>دسته‌بندی</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                ["all", "همه", 42, "bell"],
                ["academic", "آموزشی", 18, "book"],
                ["assignments", "تمارین و آزمون", 12, "check"],
                ["ai", "دستیار AI", 6, "sparkle"],
                ["social", "اجتماعی", 4, "users"],
                ["admin", "اداری", 2, "shield"],
              ].map(([id, lbl, n, ic]) => (
                <li key={id}>
                  <button onClick={() => setFilter(id)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    background: filter === id ? "var(--accent-soft)" : "transparent",
                    border: "1px solid " + (filter === id ? "color-mix(in oklch, var(--accent) 25%, transparent)" : "transparent"),
                    borderRadius: 8,
                    color: filter === id ? "var(--accent)" : "var(--fg-mute)",
                    fontFamily: "inherit", fontSize: 14, cursor: "pointer",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name={ic} size={14} />{lbl}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{toFa(n)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {NOTIFS.map((n, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 16, padding: 18,
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
                background: n.unread ? "color-mix(in oklch, var(--accent) 3%, transparent)" : "transparent",
                cursor: "pointer", alignItems: "center",
              }} onClick={() => go(n.go)}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--" + n.color + "-soft, var(--surface-2))",
                  color: "var(--" + n.color + ")",
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}><Icon name={n.ic} size={16} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--fg-mute)", textTransform: "uppercase" }}>{n.cat}</span>
                    {n.unread && <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }}></span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: n.unread ? 600 : 400 }}>{n.t}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 4 }}>{n.d}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)" }}>{n.time}</span>
                  <Icon name="arrow" size={13} stroke={2} />
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

const NOTIFS = [
  { cat: "کلاس زنده", ic: "live", color: "accent", t: "جلسه‌ی یادگیری ماشین تا ۱۵ دقیقه دیگر آغاز می‌شود", d: "CS-410 · دکتر عظیمی · کلاس آنلاین", time: "همین الان", unread: true, go: "classroom" },
  { cat: "AI Tutor", ic: "sparkle", color: "navy", t: "خلاصه‌ی پساکلاس جلسه ۷ آماده شد", d: "۸ فلش‌کارت، ۳ کوییز پیشنهاد شده", time: "۸ دقیقه پیش", unread: true, go: "recordings" },
  { cat: "نمره منتشر شد", ic: "check", color: "sage", t: "تمرین ۴ بهینه‌سازی: ۸۷ از ۱۰۰", d: "دکتر عظیمی · با ۲ نکته‌ی بازخورد", time: "۲ ساعت پیش", unread: true, go: "course" },
  { cat: "Office Hours", ic: "calendar", color: "navy", t: "دکتر موسوی جلسه‌ی شما فردا را تأیید کرد", d: "فردا ۱۴:۰۰ · ۳۰ دقیقه · مشاوره پروژه", time: "دیروز", unread: false, go: "officehours" },
  { cat: "پاسخ به سوال", ic: "chat", color: "accent", t: "دکتر عظیمی به سوال شما درباره مومنتوم پاسخ داد", d: "در انجمن CS-410 · ۴ نفر دیگر هم پاسخ دادند", time: "دیروز", unread: false, go: "community" },
  { cat: "گواهی صادر شد", ic: "cert", color: "accent", t: "گواهی پایان دوره آمار بیزی برای شما صادر شد", d: "Verifiable Credential · OB 3.0 · قابل اشتراک", time: "۲ روز پیش", unread: false, go: "credential" },
  { cat: "رویداد", ic: "live", color: "accent", t: "وبینار «ساخت RAG با LangGraph» تا ۳ روز دیگر", d: "ثبت‌نام شما تأیید شده · لینک ارسال شد", time: "۲ روز پیش", unread: false, go: "events" },
  { cat: "گروه مطالعه", ic: "users", color: "navy", t: "علی شما را به گروه مطالعه‌ی ریاضی دعوت کرد", d: "۸ نفر · جلسه‌ی هفتگی پنج‌شنبه‌ها", time: "۳ روز پیش", unread: false, go: "community" },
  { cat: "اداری", ic: "shield", color: "gold", t: "یادآوری پرداخت شهریه ترم تابستان", d: "تا ۱۵ شهریور باید پرداخت شود", time: "هفته پیش", unread: false, go: "settings" },
];

// =====================================================
// Messages / Inbox
// =====================================================
const MessagesPage = ({ go }) => {
  const [active, setActive] = React.useState(0);
  return (
    <main data-screen-label="31 پیام‌ها" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", height: "calc(100vh - 64px)", borderTop: "1px solid var(--line)" }}>
        {/* Conversations list */}
        <aside style={{ borderLeft: "1px solid var(--line)", overflow: "auto", background: "var(--surface)" }}>
          <div style={{ padding: 20, borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12, fontFamily: "var(--f-display)" }}>پیام‌ها</h2>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-dim)" }}><Icon name="search" size={14} /></span>
              <input placeholder="جستجو" style={{ width: "100%", padding: "8px 36px 8px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", fontSize: 13 }} />
            </div>
          </div>
          {CONVERSATIONS.map((c, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              width: "100%", display: "flex", gap: 12,
              padding: 14, borderBottom: "1px solid var(--line)",
              background: active === i ? "var(--accent-soft)" : "transparent",
              border: "none", textAlign: "right", cursor: "pointer", fontFamily: "inherit", color: "var(--fg)",
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div className={"avatar " + c.color}>{c.av}</div>
                {c.online && <span style={{ position: "absolute", bottom: 0, left: 0, width: 10, height: 10, borderRadius: 50, background: "var(--sage)", border: "2px solid var(--surface)" }}></span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{c.role}</div>
                <div style={{ fontSize: 12, color: c.unread ? "var(--fg)" : "var(--fg-mute)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: c.unread ? 600 : 400 }}>{c.last}</div>
              </div>
              {c.unread > 0 && (
                <div style={{ width: 20, height: 20, borderRadius: 50, background: "var(--accent)", color: "var(--accent-on)", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", alignSelf: "center", flexShrink: 0 }}>
                  {toFa(c.unread)}
                </div>
              )}
            </button>
          ))}
        </aside>

        {/* Active chat */}
        <section style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14, background: "var(--surface)" }}>
            <div className="avatar cyan" style={{ width: 40, height: 40 }}>AA</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>دکتر آرش عظیمی</div>
              <div style={{ fontSize: 11, color: "var(--sage)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--sage)" }}></span>
                آنلاین · در حال نوشتن...
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="nav-icon-btn" style={{ width: 36, height: 36 }}><Icon name="video" size={15} /></button>
              <button className="nav-icon-btn" style={{ width: 36, height: 36 }}><Icon name="settings" size={15} /></button>
            </div>
          </div>

          <div style={{ flex: 1, padding: 24, overflow: "auto", display: "flex", flexDirection: "column", gap: 14, background: "var(--bg)" }}>
            <ChatBubble side="them" t="نسرین سلام، تمرین ۴ رو بررسی کردم. کار خوبی انجام دادی روی پیاده‌سازی مومنتوم." time="۱۴:۲۰" />
            <ChatBubble side="them" t="فقط یه نکته — در فرمول update، باید نرخ یادگیری رو بعد از warm-up کاهش بدی. در گام ۲۰۰ به بعد متوجه می‌شی که نوسانات زیاد می‌شه." time="۱۴:۲۱" />
            <ChatBubble side="me" t="ممنون از بررسی استاد. یعنی learning rate scheduling؟ کسینوسی پیشنهاد می‌کنید یا خطی؟" time="۱۴:۲۸" />
            <ChatBubble side="them" t="کسینوسی برای این مسئله بهتر کار می‌کنه. می‌تونی PyTorch's CosineAnnealingLR رو با T_max برابر تعداد گام‌های باقی‌مونده تست کنی." time="۱۴:۳۰" />
            <ChatBubble side="them" t="برای پروژه پایان ترم چی فکر کردی؟" time="۱۴:۳۱" />
            <ChatBubble side="me" t="می‌خوام روی مدل‌های زبانی فارسی کار کنم. شاید pre-training یک مدل کوچک با data augmentation." time="۱۴:۳۵" />
          </div>

          <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "center" }}>
            <button className="nav-icon-btn" style={{ width: 38, height: 38 }}><Icon name="plus" size={15} /></button>
            <input placeholder="پیام بنویس..." style={{ flex: 1, padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "inherit", fontSize: 14 }} />
            <button className="btn btn-primary" style={{ minWidth: 0, padding: 12 }}><Icon name="send" size={15} /></button>
          </div>
        </section>
      </div>
    </main>
  );
};

const ChatBubble = ({ side, t, time }) => (
  <div style={{ display: "flex", justifyContent: side === "me" ? "flex-start" : "flex-end", gap: 10 }}>
    <div style={{ maxWidth: "70%" }}>
      <div style={{
        padding: "10px 14px",
        background: side === "me" ? "var(--accent)" : "var(--surface)",
        color: side === "me" ? "var(--accent-on)" : "var(--fg)",
        borderRadius: side === "me" ? "12px 12px 12px 4px" : "12px 12px 4px 12px",
        fontSize: 14, lineHeight: 1.6,
        boxShadow: "var(--shadow-1)",
      }}>{t}</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)", marginTop: 4, textAlign: side === "me" ? "left" : "right" }}>{time}</div>
    </div>
  </div>
);

const CONVERSATIONS = [
  { name: "دکتر آرش عظیمی", role: "استاد · CS-410", av: "AA", color: "cyan", last: "برای پروژه پایان ترم چی فکر کردی؟", time: "۱۴:۳۱", unread: 2, online: true },
  { name: "گروه مطالعه ریاضی", role: "۸ عضو", av: "MS", color: "amber", last: "علی: فردا ۲۰:۳۰ همگی هستیم؟", time: "۲ ساعت", unread: 4, online: true },
  { name: "دکتر سپیده موسوی", role: "استاد · CS-620", av: "SM", color: "violet", last: "مقاله رو فرستادم، نظرت چیه؟", time: "دیروز", unread: 0, online: false },
  { name: "ساره فرجی", role: "هم‌کلاسی", av: "SF", color: "rose", last: "ممنون که توضیح دادی", time: "دیروز", unread: 0, online: true },
  { name: "مهرداد افشار", role: "هم‌کلاسی", av: "MA", color: "cyan", last: "تشکر بابت notebook", time: "۲ روز", unread: 0, online: false },
  { name: "پشتیبانی پلتفرم", role: "تیم", av: "DU", color: "amber", last: "تیکت شما حل شد", time: "۳ روز", unread: 0, online: true },
];

// =====================================================
// Bookmarks / Saved
// =====================================================
const BookmarksPage = ({ go }) => (
  <main data-screen-label="32 ذخیره‌ها">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow">SAVED · ذخیره شده‌ها</span>
        <h1 className="h-1" style={{ marginTop: 12 }}>ذخیره‌ها و علاقه‌مندی‌ها</h1>
        <p className="lead" style={{ marginTop: 12 }}>۸۴ مورد ذخیره شده در ۶ مجموعه</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>
        <aside>
          <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>مجموعه‌ها</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              ["all", "همه ذخیره‌ها", 84, "var(--accent)"],
              ["readlater", "بعداً بخوان", 24, "var(--navy)"],
              ["important", "مهم", 18, "var(--gold)"],
              ["thesis", "برای پایان‌نامه", 16, "var(--sage)"],
              ["fav-papers", "مقالات محبوب", 14, "var(--accent)"],
              ["recipes", "کدهای مفید", 12, "var(--navy)"],
            ].map(([id, t, n, c], i) => (
              <li key={id}>
                <button style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px",
                  background: i === 0 ? "var(--accent-soft)" : "transparent",
                  border: "1px solid " + (i === 0 ? "color-mix(in oklch, var(--accent) 25%, transparent)" : "transparent"),
                  borderRadius: 8, color: "var(--fg)", fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 4, height: 16, background: c, borderRadius: 999 }}></span>{t}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{toFa(n)}</span>
                </button>
              </li>
            ))}
            <li style={{ marginTop: 8 }}>
              <button className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                <Icon name="plus" size={13} />مجموعه جدید
              </button>
            </li>
          </ul>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SAVED_ITEMS.map((s, i) => (
            <div key={i} className="card-flat" style={{ display: "grid", gridTemplateColumns: "50px 1fr auto", gap: 16, padding: 18, cursor: "pointer" }}>
              <div style={{ width: 40, height: 50, borderRadius: 4, background: "var(--" + s.color + "-soft)", color: "var(--" + s.color + ")", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700 }}>{s.t}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{s.meta}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {s.tags.map((tg) => <span key={tg} className="pill" style={{ fontSize: 9 }}>{tg}</span>)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>{s.saved}</span>
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

const SAVED_ITEMS = [
  { t: "PDF", title: "Attention is All You Need", meta: "Vaswani et al. · NeurIPS 2017 · ۱۵ صفحه", tags: ["NLP", "Transformer"], color: "gold", saved: "دیروز" },
  { t: "VIDEO", title: "جلسه ۸ یادگیری ماشین — مومنتوم", meta: "دکتر عظیمی · CS-410 · ۸ اسفند", tags: ["ML", "Optimization"], color: "accent", saved: "۲ روز" },
  { t: "CODE", title: "Transformer implementation از صفر", meta: "دکتر موسوی · Jupyter notebook", tags: ["NLP", "PyTorch"], color: "sage", saved: "۳ روز" },
  { t: "POST", title: "بحث: تفاوت Adam و SGD با مومنتوم", meta: "انجمن CS-410 · ۲۳ پاسخ", tags: ["Optimization"], color: "navy", saved: "هفته پیش" },
  { t: "PDF", title: "آمار بیزی کاربردی — فصل ۳", meta: "دکتر فرهادی · ۸۲ صفحه", tags: ["Stats", "Bayes"], color: "gold", saved: "هفته پیش" },
  { t: "VIDEO", title: "کارگاه: ساخت RAG با LangGraph", meta: "وبینار · ۲ ساعت", tags: ["NLP", "RAG"], color: "accent", saved: "هفته پیش" },
];

// =====================================================
// Achievements / Badges
// =====================================================
const AchievementsPage = ({ go }) => (
  <main data-screen-label="33 دستاوردها">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow">ACHIEVEMENTS · دستاوردها</span>
        <h1 className="h-1" style={{ marginTop: 12 }}>دستاوردها و نشان‌ها</h1>
        <p className="lead" style={{ marginTop: 12 }}>۲۴ از ۸۴ دستاورد کسب شده · سطح ۸ یادگیرنده</p>
      </div>

      {/* Level progress */}
      <div className="card" style={{ padding: 36, marginBottom: 32, background: "linear-gradient(135deg, var(--surface), var(--accent-soft))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, background: "var(--accent)", color: "var(--accent-on)", display: "grid", placeItems: "center", fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 800 }}>۸</div>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em" }}>سطح ۸ · یادگیرنده‌ی متعهد</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 700 }}>۲,۴۸۰</span>
              <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>/ ۳,۰۰۰ XP</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
              <div style={{ width: "82%", height: "100%", background: "var(--accent)", borderRadius: 999 }}></div>
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 8 }}>تا سطح ۹ · ۵۲۰ XP باقی</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 700, color: "var(--accent)" }}>۱۸</div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>روز استمرار</div>
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <h3 className="h-3" style={{ marginBottom: 18 }}>نشان‌ها</h3>
      <div className="grid grid-4">
        {BADGES.map((b, i) => (
          <div key={i} className="card" style={{ padding: 24, textAlign: "center", opacity: b.locked ? 0.5 : 1 }}>
            <div style={{
              width: 80, height: 80, margin: "0 auto",
              borderRadius: "50%",
              background: b.locked ? "var(--surface-2)" : `conic-gradient(from 0deg, ${b.color}, ${b.color2 || b.color})`,
              display: "grid", placeItems: "center",
              position: "relative",
              filter: b.locked ? "grayscale(1)" : "none",
            }}>
              <div style={{ position: "absolute", inset: 5, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", color: b.locked ? "var(--fg-dim)" : b.color }}>
                <Icon name={b.locked ? "lock" : b.ic} size={28} />
              </div>
            </div>
            <h4 style={{ fontSize: 14, marginTop: 16 }}>{b.t}</h4>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6, lineHeight: 1.5 }}>{b.d}</div>
            {b.locked && <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--accent)", marginTop: 12 }}>+{toFa(b.xp)} XP</div>}
            {!b.locked && <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--sage)", marginTop: 12 }}>کسب شد · {b.date}</div>}
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

const BADGES = [
  { t: "اولین قدم", d: "اولین کلاس را تکمیل کردی", ic: "star", color: "var(--accent)", date: "۱۰ بهمن", locked: false },
  { t: "تسلط بر مفهوم", d: "۹۰٪+ در یک ماژول", ic: "target", color: "var(--accent)", color2: "var(--navy)", date: "۱۸ بهمن", locked: false },
  { t: "همکار", d: "۵ پاسخ مفید در انجمن", ic: "users", color: "var(--sage)", date: "دیروز", locked: false },
  { t: "متعهد", d: "۷ روز استمرار", ic: "trophy", color: "var(--gold)", date: "هفته پیش", locked: false },
  { t: "جستجوگر", d: "۱۰۰ جستجو در کتابخانه", ic: "search", color: "var(--accent)", xp: 100, locked: true },
  { t: "مربی همتا", d: "۱۰ پاسخ تأیید شده", ic: "grad", color: "var(--navy)", xp: 200, locked: true },
  { t: "پژوهشگر", d: "اولین مقاله علمی", ic: "flask", color: "var(--gold)", xp: 500, locked: true },
  { t: "Master", d: "تسلط کامل بر یک رشته", ic: "cert", color: "var(--accent)", xp: 1000, locked: true },
];

// =====================================================
// Assignment Submission
// =====================================================
const SubmissionPage = ({ go }) => {
  const [tab, setTab] = React.useState("upload");
  return (
    <main data-screen-label="34 تحویل تمرین">
      <section style={{ padding: "32px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span className="mono" style={{ color: "var(--fg-mute)" }}>CS-410</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono" style={{ color: "var(--fg-mute)" }}>تمارین</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono">۰۴</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="eyebrow">ASSIGNMENT 04 · بهینه‌سازی</span>
              <h1 className="h-2" style={{ marginTop: 12 }}>پیاده‌سازی SGD با مومنتوم</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="pill pill-amber" style={{ fontSize: 11 }}>مهلت: ۳ روز</span>
              <span className="pill" style={{ fontSize: 11 }}>۱۰۰ نمره</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 24, padding: 4, background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
              {[["task", "صورت مسئله", "file"], ["upload", "تحویل", "download"], ["history", "تاریخچه", "pulse"]].map(([id, lbl, ic]) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  flex: 1, padding: "10px 16px",
                  background: tab === id ? "var(--surface)" : "transparent",
                  border: "1px solid " + (tab === id ? "var(--line-2)" : "transparent"),
                  borderRadius: 8, color: tab === id ? "var(--fg)" : "var(--fg-mute)",
                  fontSize: 13, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Icon name={ic} size={13} />{lbl}
                </button>
              ))}
            </div>

            {tab === "task" && (
              <div className="card" style={{ padding: 32 }}>
                <h3 className="h-3" style={{ marginBottom: 16 }}>توضیح تمرین</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--fg-mute)" }}>
                  در این تمرین، باید بهینه‌ساز SGD با مومنتوم را از صفر در Python پیاده‌سازی کنید و آن را روی یک شبکه‌ی عصبی کوچک برای دیتاست MNIST آموزش دهید.
                </p>
                <h4 style={{ marginTop: 24, marginBottom: 12, fontSize: 15 }}>الزامات:</h4>
                <ul style={{ paddingRight: 20, fontSize: 14, lineHeight: 1.8, color: "var(--fg-mute)" }}>
                  <li>پیاده‌سازی کلاس <code style={{ fontFamily: "var(--f-mono)", background: "var(--surface-2)", padding: "1px 6px", borderRadius: 3, color: "var(--accent)" }}>MomentumSGD</code></li>
                  <li>تست با β = ۰.۹ و η = ۰.۰۱</li>
                  <li>رسم منحنی loss</li>
                  <li>گزارش accuracy نهایی (هدف: > ۹۲٪)</li>
                  <li>گزارش نوشتاری ۲-۳ صفحه‌ای</li>
                </ul>
                <h4 style={{ marginTop: 24, marginBottom: 12, fontSize: 15 }}>Rubric:</h4>
                <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: 16 }}>
                  {[
                    ["پیاده‌سازی صحیح", "۳۰"],
                    ["کیفیت کد", "۲۰"],
                    ["نتایج تجربی", "۲۵"],
                    ["گزارش نوشتاری", "۱۵"],
                    ["نوآوری", "۱۰"],
                  ].map(([t, p]) => (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                      <span>{t}</span>
                      <span style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "upload" && (
              <div className="card" style={{ padding: 32 }}>
                <h3 className="h-3" style={{ marginBottom: 18 }}>تحویل تمرین</h3>

                <div style={{ padding: 32, background: "var(--surface-2)", border: "2px dashed var(--line-2)", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, margin: "0 auto", borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 16 }}>
                    <Icon name="download" size={24} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>فایل‌ها را اینجا رها کنید</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6 }}>یا کلیک کنید · حداکثر ۵۰MB · ipynb, py, pdf</div>
                  <button className="btn btn-outline" style={{ marginTop: 20 }}><Icon name="folder" size={13} />انتخاب فایل</button>
                </div>

                <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em", marginTop: 28, marginBottom: 12 }}>فایل‌های آپلود شده</div>
                {[
                  { name: "momentum_sgd.ipynb", size: "245 KB", t: "CODE", c: "sage" },
                  { name: "report_final.pdf", size: "1.2 MB", t: "PDF", c: "gold" },
                  { name: "training_curves.png", size: "180 KB", t: "IMG", c: "accent" },
                ].map((f, i) => (
                  <div key={i} className="card-flat" style={{ display: "grid", gridTemplateColumns: "40px 1fr auto auto", gap: 14, padding: 14, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ width: 32, height: 40, borderRadius: 4, background: `var(--${f.c}-soft)`, color: `var(--${f.c})`, display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700 }}>{f.t}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{f.size}</div>
                    </div>
                    <span className="pill pill-cyan" style={{ fontSize: 9 }}>آپلود شد</span>
                    <button className="btn btn-ghost btn-sm"><Icon name="end" size={13} /></button>
                  </div>
                ))}

                <div style={{ marginTop: 24 }}>
                  <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>یادداشت تحویل (اختیاری)</div>
                  <textarea placeholder="نکاتی که می‌خواهید استاد بداند..." rows={3} style={{ width: "100%", padding: 12, background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" }}></textarea>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>قبل از تحویل، AI نسخه‌ی شما را برای تشابه احتمالی بررسی می‌کند.</span>
                  <button className="btn btn-primary">تحویل نهایی<Icon name="check" size={14} stroke={3} /></button>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div className="card" style={{ padding: 32 }}>
                <h3 className="h-3" style={{ marginBottom: 18 }}>تاریخچه‌ی تحویل</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { v: "v3", t: "تحویل نهایی", d: "۱۰ روز پیش · ۳ فایل", grade: "۸۷/۱۰۰", c: "sage" },
                    { v: "v2", t: "نسخه دوم · با اصلاح‌ها", d: "۱۲ روز پیش", grade: null },
                    { v: "v1", t: "نسخه اول", d: "۲ هفته پیش", grade: null },
                  ].map((h, i) => (
                    <div key={i} style={{ display: "flex", gap: 16, padding: 16, background: "var(--surface-2)", borderRadius: 10, alignItems: "center", border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line)" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: i === 0 ? "var(--accent)" : "var(--surface-3)", color: i === 0 ? "var(--accent-on)" : "var(--fg)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 11 }}>{h.v}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{h.t}</div>
                        <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 2 }}>{h.d}</div>
                      </div>
                      {h.grade && <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700, color: "var(--sage)" }}>{h.grade}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 90, alignSelf: "start" }}>
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, marginBottom: 14 }}>وضعیت تحویل</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--fg-mute)" }}>مهلت</span>
                  <span style={{ fontFamily: "var(--f-mono)", color: "var(--gold)" }}>۳ روز ۱۲ ساعت</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--fg-mute)" }}>نمره</span>
                  <span style={{ fontFamily: "var(--f-mono)" }}>۱۰۰</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--fg-mute)" }}>نوع کار</span>
                  <span>فردی</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--fg-mute)" }}>ارزیاب</span>
                  <span>استاد + Peer × ۲</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", marginBottom: 12 }}>
                <Icon name="sparkle" size={14} />
                <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em" }}>AI کمک</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                می‌توانم درباره‌ی اصول مومنتوم توضیح بدهم، اما در حین این تمرین پاسخ کد را به شما نمی‌دهم.
              </p>
              <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 12, fontSize: 12 }}>
                <Icon name="chat" size={13} />شروع گفتگو
              </button>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>منابع مفید</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["جزوه‌ی بهینه‌سازی", "PDF · ۴۲ ص"],
                  ["ویدئو جلسه ۸", "۱:۲۸"],
                  ["نمونه کد قبلی ترم", "Repo"],
                ].map(([t, m]) => (
                  <li key={t} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--accent)" }}>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--fg-mute)" }}>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
};

// =====================================================
// Profile / Portfolio (public-facing)
// =====================================================
const ProfilePage = ({ go }) => (
  <main data-screen-label="35 پروفایل">
    {/* Cover */}
    <div style={{ height: 200, background: "linear-gradient(135deg, oklch(0.3 0.12 255), oklch(0.5 0.16 255))", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 3px, transparent 3px 14px)" }}></div>
    </div>

    <section className="shell" style={{ padding: "0 40px 60px", marginTop: -56, position: "relative" }}>
      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap", marginBottom: 32 }}>
        <div className="avatar cyan" style={{ width: 112, height: 112, fontSize: 36, border: "4px solid var(--bg)", flexShrink: 0 }}>نر</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 className="h-1">نسرین رضوی</h1>
          <p style={{ color: "var(--fg-mute)", fontSize: 15, marginTop: 8 }}>کارشناسی ارشد علوم داده · علاقمند به NLP فارسی و آموزش</p>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <span className="pill pill-cyan" style={{ fontSize: 11 }}>سطح ۸ · یادگیرنده متعهد</span>
            <span className="pill" style={{ fontSize: 11 }}>۱۲ گواهی</span>
            <span className="pill" style={{ fontSize: 11 }}>۲۴ دستاورد</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline"><Icon name="share" size={14} />اشتراک</button>
          <button className="btn btn-primary" onClick={() => go("settings")}><Icon name="settings" size={14} />ویرایش</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="card" style={{ padding: 28, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24, marginBottom: 32 }}>
        {[
          ["XP کسب شده", "۲,۴۸۰"],
          ["گواهی‌ها", "۱۲"],
          ["تسلط متوسط", "۸۴٪"],
          ["استمرار", "۱۸ روز"],
          ["پاسخ مفید", "۴۲"],
        ].map(([l, v], i) => (
          <div key={i}>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.08em" }}>{l}</div>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 700, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        <div>
          {/* About */}
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <h3 className="h-3" style={{ marginBottom: 12 }}>درباره من</h3>
            <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.8 }}>
              دانشجوی کارشناسی ارشد علوم داده هستم. علاقه‌ی اصلی من به مدل‌های زبانی فارسی و چگونگی استفاده از AI در بهبود آموزش است. در حال کار روی پروژه‌ای برای ساخت یک tokenizer بهینه‌شده برای فارسی.
            </p>
          </div>

          {/* Featured projects */}
          <h3 className="h-3" style={{ marginBottom: 16 }}>پروژه‌های شاخص</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { t: "Persian BPE Tokenizer", d: "Tokenizer بهینه برای فارسی، بهبود ۲۳٪ کارایی روی benchmarks", tags: ["NLP", "Python", "Research"], stars: 84 },
              { t: "Sentiment Analysis on Persian Tweets", d: "مدل دسته‌بندی حسی روی ۲ میلیون توییت فارسی", tags: ["NLP", "PyTorch"], stars: 42 },
              { t: "AI Tutor for Calculus", d: "دستیار آموزشی برای حساب دیفرانسیل با RAG", tags: ["EdTech", "RAG", "LLM"], stars: 28 },
            ].map((p, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4 style={{ fontSize: 16 }}>{p.t}</h4>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--gold)" }}>★ {toFa(p.stars)}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6, margin: 0 }}>{p.d}</p>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  {p.tags.map((t) => <span key={t} className="pill" style={{ fontSize: 10 }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14 }}>مهارت‌ها</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {[
                ["Python", 95],
                ["PyTorch", 88],
                ["NLP", 82],
                ["آمار", 78],
                ["ریاضیات", 72],
                ["Linux", 86],
              ].map(([s, l]) => (
                <div key={s}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{s}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{toFa(l)}٪</span>
                  </div>
                  <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: l + "%", height: "100%", background: "var(--accent)", borderRadius: 999 }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14 }}>لینک‌ها</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["GitHub", "github.com/nasrin"],
                ["LinkedIn", "linkedin.com/in/nasrin"],
                ["Google Scholar", "scholar.google.com/..."],
                ["Twitter / X", "@nasrin_dev"],
              ].map(([k, v]) => (
                <li key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--line)", fontSize: 12 }}>
                  <span style={{ color: "var(--fg-mute)" }}>{k}</span>
                  <a style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{v}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ padding: 20, background: "linear-gradient(135deg, var(--surface), var(--accent-soft))" }}>
            <div className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.08em" }}>پروفایل عمومی</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, marginTop: 8, direction: "ltr", textAlign: "left" }}>digiu.edu/u/nasrin</div>
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 14, fontSize: 12 }}>
              <Icon name="share" size={12} />کپی لینک
            </button>
          </div>
        </aside>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

window.NotificationsPage = NotificationsPage;
window.MessagesPage = MessagesPage;
window.BookmarksPage = BookmarksPage;
window.AchievementsPage = AchievementsPage;
window.SubmissionPage = SubmissionPage;
window.ProfilePage = ProfilePage;
