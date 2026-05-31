// Phase-A R2.8 — typed.
// =====================================================
// More pages: Calendar, Library, Help, Pricing, Faculty
// =====================================================

// =====================================================
// Calendar / Schedule
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { toFa } from "../shared";
import { FACULTY as FACULTY_DATA, SCHOOLS, LIBRARY_RESOURCES, WEEKLY_SCHEDULE, WEEK_DAYS } from "../data.js";
import { Button } from "../ui";
import type { Go } from "../router";
// Phase-14.7 R2: sidebar + footer come from Layout (router.tsx). The
// per-page <Footer/> calls below are gone — CSS used to hide them on
// workspace routes; now we just don't render them.

interface MorePageProps { go: Go }

export const CalendarPage: React.FC<MorePageProps> = ({ go }) => {
  const [view, setView] = React.useState<string>("week");
  const days = WEEK_DAYS;
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  // Map data.js shape (`title`) to local shape (`t`)
  const events = WEEKLY_SCHEDULE.map((e) => ({ ...e, t: e.title }));

  const colorFor = (k: string): string => (({
    live: "var(--accent)",
    self: "var(--navy)",
    peer: "var(--sage)",
    office: "var(--fg-mute)",
    exam: "var(--gold)",
    lab: "var(--navy-2)",
  } as Record<string, string>)[k] || "var(--fg-mute)");

  return (
    <main data-screen-label="16 تقویم">
      <div className="dash-main">
          <div className="dash-greet">
            <div>
              <span className="eyebrow">CALENDAR · هفته‌ی جاری</span>
              <h1 className="mt-2.5" >تقویم تحصیلی — هفته‌ی ۱۲</h1>
              <p className="muted">۸ کلاس زنده · ۳ تمرین · ۱ آزمون · همگامی با Google Calendar</p>
            </div>
            <div className="flex gap-2" >
              {[["day", "روز"], ["week", "هفته"], ["month", "ماه"]].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className="btn btn-outline btn-sm"
                  style={view === v ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
                >{l}</button>
              ))}
              <Button variant="primary" size="sm" onClick={() => window.toast?.({ title: "فرم رویداد جدید", msg: "افزودن رویداد به‌زودی فعال می‌شود.", kind: "info" })}
              ><Icon name="plus" size={13} />رویداد جدید</Button>
            </div>
          </div>

          <div className="card p-0 overflow-hidden calendar-week-scroll" >
            <div className="grid"  style={{ gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--line)"}}>
              <div style={{ padding: "16px 12px" }}></div>
              {days.map((d, i) => (
                <div className="text-center" key={d}  style={{padding: "16px 12px", borderRight: i < 6 ? "1px solid var(--line)" : "none", borderRightColor: "var(--line)"}}>
                  <div className="uppercase"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)", letterSpacing: "0.08em"}}>{d}</div>
                  <div className="mt-1"  style={{fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--fg)"}}>{toFa(8 + i)}</div>
                </div>
              ))}
            </div>

            <div className="relative grid"  style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: 700}}>
              <div>
                {hours.map((h) => (
                  <div key={h} style={{ height: 60, borderBottom: "1px solid var(--line)", padding: "4px 8px", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>
                    {toFa(h)}:۰۰
                  </div>
                ))}
              </div>
              {days.map((d, di) => (
                <div className="relative" key={di}  style={{ borderRight: di < 6 ? "1px solid var(--line)" : "none"}}>
                  {hours.map((h) => (
                    <div key={h} style={{ height: 60, borderBottom: "1px solid var(--line)" }}></div>
                  ))}
                  {events.filter(e => e.day === di).map((e, ei) => {
                    const top = (e.start - 8) * 60;
                    const height = e.dur * 60;
                    const c = colorFor(e.kind);
                    return (
                      <button
                        type="button"
                        className="absolute rounded-md cursor-pointer overflow-hidden text-right"
                        key={ei}
                        onClick={() => go("classroom")}
                        aria-label={`رویداد ${e.code}: ${e.t} از ${toFa(e.start)}:۰۰ تا ${toFa(e.start + e.dur)}:۰۰`}
                        style={{
                        top: top + 2,
                        right: 4, left: 4,
                        height: height - 4,
                        background: "color-mix(in oklch, " + c + " 10%, var(--surface))",
                        borderRight: "3px solid " + c,
                        padding: "8px 12px",
                        fontFamily: "inherit",
                        color: "var(--fg)"}}>
                        <div className="mono" style={{ fontSize: 10, color: c, letterSpacing: "0.06em" }}>{e.code}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>{e.t}</div>
                        <div className="mt-0.5"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)"}}>
                          {toFa(e.start)}:۰۰ — {toFa(e.start + e.dur)}:۰۰
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 flex-wrap" >
            {[
              ["کلاس زنده", "live"],
              ["تمرین خودخوان", "self"],
              ["گروه مطالعه", "peer"],
              ["Office Hours", "office"],
              ["آزمون", "exam"],
              ["کارگاه", "lab"],
            ].map(([t, k]) => (
              <div className="flex items-center gap-2" key={k}  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
                <span className="rounded-full"  style={{width: 12, height: 3, background: colorFor(k)}}></span>
                {t}
              </div>
            ))}
          </div>
        </div>
    </main>
  );
};

// =====================================================
// Library — Resources
// =====================================================
export const LibraryPage: React.FC<MorePageProps> = ({ go }) => {
  const [activeCat, setActiveCat] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState({ "زبان: فارسی": true, "موضوع: ML": true });

  const cats = [
    { id: "all", t: "همه", n: 1284, ic: "folder" },
    { id: "video", t: "ویدئو", n: 524, ic: "video" },
    { id: "pdf", t: "کتاب و مقاله", n: 412, ic: "file" },
    { id: "slide", t: "اسلاید", n: 188, ic: "layers" },
    { id: "code", t: "نوت‌بوک", n: 96, ic: "code" },
    { id: "data", t: "داده", n: 64, ic: "chip" },
  ];

  const filteredItems = LIBRARY_ITEMS.filter((it) => {
    if (activeCat !== "all") {
      const map = { video: "VIDEO", pdf: "PDF", code: "CODE", data: "DATA", slide: "SLIDE" };
      if (it.t !== map[activeCat as keyof typeof map]) return false;
    }
    if (query && !it.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <main data-screen-label="17 کتابخانه">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="flex justify-between items-end gap-6 flex-wrap" >
            <div>
              <span className="eyebrow">DIGITAL LIBRARY · ۱۲۸۴ resource</span>
              <h1 className="h-1 mt-4" >کتابخانه‌ی دیجیتال</h1>
              <p className="lead mt-3.5" >
                مقالات، کتاب‌ها، نوت‌بوک‌های Jupyter، دیتاست‌ها، اسلایدها. همه با جستجوی معنایی و قابل ارجاع از داخل درس.
              </p>
            </div>
            <Button variant="primary" onClick={() => window.toast?.({ title: "آپلود منبع", msg: "فرم آپلود به‌زودی فعال می‌شود.", kind: "info" })}
            ><Icon name="plus" size={14} />آپلود منبع</Button>
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px 40px" }}>
        <div className="grid gap-8"  style={{ gridTemplateColumns: "260px 1fr"}}>
          <aside className="sticky"  style={{ top: 90, alignSelf: "start"}}>
            <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>دسته‌ها</div>
            <ul className="p-0 m-0 flex flex-col gap-0.5"  style={{listStyle: "none"}}>
              {cats.map((c) => (
                <li key={c.id}>
                  <button className="flex items-center justify-between rounded-lg cursor-pointer"
                    onClick={() => setActiveCat(c.id)}
                    aria-pressed={activeCat === c.id}
                     style={{width: "100%",
                      padding: "10px 14px",
                      background: activeCat === c.id ? "var(--accent-soft)" : "transparent",
                      border: "1px solid " + (activeCat === c.id ? "color-mix(in oklch, var(--accent) 25%, transparent)" : "transparent"),
                      color: activeCat === c.id ? "var(--accent)" : "var(--fg-mute)",
                      fontFamily: "inherit", fontSize: 14}}>
                    <span className="flex items-center gap-2.5" ><Icon name={c.ic} size={14} />{c.t}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{toFa(c.n)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mono mt-8 mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>فیلتر</div>
            <div className="flex flex-col gap-2" >
              {["زبان: فارسی", "زبان: انگلیسی", "سطح: ارشد", "سطح: کارشناسی", "سال: ۱۴۰۴", "موضوع: ML", "موضوع: NLP"].map((f) => (
                <label className="flex items-center gap-2.5 cursor-pointer" key={f}  style={{ fontSize: 13, color: "var(--fg-mute)"}}>
                  <input
                    type="checkbox"
                    checked={!!filters[f as keyof typeof filters]}
                    onChange={(e) => setFilters({ ...filters, [f]: e.target.checked })}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {f}
                </label>
              ))}
            </div>
          </aside>

          <div>
            <div className="search-bar" style={{ margin: "0 0 32px", maxWidth: "100%" }}>
              <Icon name="search" size={18} />
              <input
                placeholder="جستجو در کتابخانه — متن کامل، معنایی"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="جستجو در کتابخانه"
              />
              <span className="mono" style={{ color: "var(--fg-mute)" }}>⌘ K</span>
            </div>

            <div className="flex justify-between items-baseline mb-4.5" >
              <h3 className="h-3">جدیدترین منابع</h3>
              <span className="mono" style={{ color: "var(--fg-mute)", fontSize: 11 }}>{toFa(filteredItems.length)} نتیجه</span>
            </div>

            <div className="flex flex-col gap-2.5" >
              {filteredItems.length === 0 && (
                <div className="card-flat p-8 text-center"  style={{ color: "var(--fg-mute)"}}>
                  <Icon name="search" size={28} />
                  <div className="mt-2.5"  style={{ fontSize: 14}}>منبعی با این جستجو پیدا نشد.</div>
                </div>
              )}
              {filteredItems.map((it, i) => (
                <div key={i} className="card-flat grid gap-4.5 items-center p-4.5"  style={{ gridTemplateColumns: "60px 1fr auto auto"}}>
                  <div className="rounded grid"  style={{width: 48, height: 60,
                    background: it.t === "PDF" ? "var(--gold-soft)" : it.t === "VIDEO" ? "var(--accent-soft)" : it.t === "CODE" ? "var(--sage-soft)" : "var(--navy-soft)",
                    color: it.t === "PDF" ? "var(--gold)" : it.t === "VIDEO" ? "var(--accent)" : it.t === "CODE" ? "var(--sage)" : "var(--navy)", placeItems: "center",
                    fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em"}}>
                    {it.t}
                  </div>
                  <div>
                    <div className="mb-1"  style={{fontSize: 15, fontWeight: 500}}>{it.title}</div>
                    <div className="flex gap-3.5"  style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--f-mono)"}}>
                      <span>{it.author}</span>
                      <span>·</span>
                      <span>{it.size}</span>
                      <span>·</span>
                      <span>{it.year}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5" >
                    {it.tags.map((t) => <span key={t} className="pill" style={{ fontSize: 9 }}>{t}</span>)}
                  </div>
                  <div className="flex gap-1.5" >
                    <Button variant="ghost" size="sm" className="icon-btn" onClick={() => window.toast?.({ title: "پیش‌نمایش", msg: it.title })}
                      aria-label={"پیش‌نمایش " + it.title}
                      title="پیش‌نمایش"
                    ><Icon name="eye" size={13} /></Button>
                    <Button variant="outline" size="sm" className="icon-btn" onClick={() => window.toast?.({ title: "در حال دانلود", msg: it.title + " (" + it.size + ")", kind: "success" })}
                      aria-label={"دانلود " + it.title}
                      title="دانلود"
                    ><Icon name="download" size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

// Library items are sourced from data.js — adapt shape for the existing UI.
const LIBRARY_ITEMS = LIBRARY_RESOURCES.map((r) => ({
  t: r.type,
  title: r.title,
  author: r.author,
  size: r.size,
  year: String(r.year),
  tags: r.tags,
}));

// =====================================================
// Help Center / Knowledge Base
// =====================================================
export const HelpPage: React.FC<MorePageProps> = ({ go }) => (
  <main data-screen-label="18 پشتیبانی">
    <section style={{ padding: "80px 0 60px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
      <div className="shell text-center" >
        <span className="eyebrow justify-center" >HELP CENTER · ۲۴/۷</span>
        <h1 className="h-display mt-4.5"  style={{ fontSize: "clamp(36px, 5vw, 72px)"}}>
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
      <div className="grid grid-3 mb-15" >
        {[
          { ic: "play", t: "شروع سریع", d: "اولین کلاس، اولین تمرین، اولین گواهی"},
          { ic: "user", t: "حساب کاربری", d: "ثبت‌نام، احراز هویت، تغییر اطلاعات"},
          { ic: "live", t: "کلاس برخط", d: "ورود، تنظیم میکروفون، ضبط"},
          { ic: "dollar", t: "پرداخت و شهریه", d: "روش‌های پرداخت، بازگشت وجه"},
          { ic: "cert", t: "گواهی و مدرک", d: "صدور، راستی‌آزمایی، اشتراک"},
          { ic: "sparkle", t: "دستیار AI", d: "نحوه استفاده، محدودیت‌ها، تنظیمات"},
        ].map((c, i) => (
          <div key={i} className="card p-7 cursor-pointer flex flex-col gap-3.5" >
            <div className="rounded-lg grid"  style={{width: 40, height: 40, background: "var(--accent-soft)", color: "var(--accent)", placeItems: "center"}}>
              <Icon name={c.ic} size={18} />
            </div>
            <h3 style={{ fontSize: 18 }}>{c.t}</h3>
            <p className="m-0"  style={{fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6}}>{c.d}</p>
            <div className="mt-1"  style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.08em"}}>
              ۱۲ مقاله ←
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8"  style={{ gridTemplateColumns: "1fr 380px"}}>
        <div>
          <h2 className="h-2 mb-6" >سوالات متداول</h2>
          <div className="flex flex-col gap-0" >
            {[
              ["چطور به اولین کلاس زنده‌ام بپیوندم؟", "از داشبورد، روی برنامه‌ی هفته کلیک کنید. ۱۵ دقیقه قبل از شروع، دکمه‌ی «ورود» فعال می‌شود..."],
              ["آیا گواهی دانشگاه برخط هوشمند ایران در ایران رسمی است؟", "گواهی‌های ما با مرجع وزارت علوم همخوانی دارند و در سامانه‌های ملی قابل استعلام هستند..."],
              ["دستیار AI به اطلاعات شخصی من دسترسی دارد؟", "AI Tutor فقط به اطلاعات درسی شما (پیشرفت، تمرین، سوال) دسترسی دارد..."],
              ["در صورت قطعی اینترنت، کلاس از دست می‌رود؟", "خیر. تمام کلاس‌های زنده ضبط می‌شوند و در آرشیو شخصی شما قابل بازیابی هستند..."],
              ["چگونه شهریه را اقساط بپردازم؟", "در مرحله‌ی پرداخت، گزینه‌ی اقساط ۳ ماهه بدون بهره را انتخاب کنید..."],
              ["آیا می‌توانم پروژه‌ی پایان درس را تغییر دهم؟", "تا پیش از انتخاب رسمی، می‌توانید پروژه را تغییر دهید. پس از تایید، نیاز به مجوز استاد دارد..."],
            ].map(([q, a], i) => (
              <details className="p-0" key={i}  style={{borderTop: i > 0 ? "1px solid var(--line)" : "1px solid var(--line)", borderBottom: i === 5 ? "1px solid var(--line)" : "none"}}>
                <summary className="cursor-pointer flex justify-between items-center gap-4"  style={{padding: "20px 0", fontWeight: 500, fontSize: 16, listStyle: "none"}}>
                  <span>{q}</span>
                  <Icon name="plus" size={16} />
                </summary>
                <p className="pb-5 m-0"  style={{fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7}}>{a}</p>
              </details>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4" >
          <div className="card p-6" >
            <div className="flex items-center gap-2.5 mb-3.5"  style={{ color: "var(--accent)"}}>
              <Icon name="headset" size={16} />
              <span className="mono" style={{ letterSpacing: "0.08em" }}>پشتیبانی زنده</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
              تیم پشتیبانی ۲۴/۷ آماده پاسخگویی است. زمان میانگین پاسخ: ۸ دقیقه.
            </p>
            <Button variant="primary" className="justify-center mt-3.5" style={{width: "100%"}}
              onClick={() => window.toast?.({ title: "اتصال به پشتیبانی", msg: "اپراتور ظرف چند ثانیه پاسخ می‌دهد.", kind: "info" })}
            >
              <Icon name="chat" size={14} />شروع گفتگو
            </Button>
          </div>
          <div className="card p-6" >
            <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>SYSTEM STATUS</div>
            <div className="flex flex-col gap-2.5" >
              {[
                ["LMS", "operational"],
                ["کلاس زنده", "operational"],
                ["AI Tutor", "operational"],
                ["پرداخت", "operational"],
                ["ASR · فارسی", "degraded"],
              ].map(([t, s]) => (
                <div className="flex justify-between" key={t}  style={{ fontSize: 13}}>
                  <span>{t}</span>
                  <span className="flex items-center gap-1.5"  style={{ color: s === "operational" ? "var(--sage)" : "var(--gold)"}}>
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
  </main>
);

// =====================================================
// Pricing / Plans
// =====================================================
export const PricingPage: React.FC<MorePageProps> = ({ go }) => {
  const [billing, setBilling] = React.useState("month");
  const factor = billing === "month" ? 1 : billing === "term" ? 0.85 : 0.75;
  return (
  <main data-screen-label="19 پلن‌ها">
    <section style={{ padding: "80px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell text-center" >
        <span className="eyebrow justify-center" >PRICING · شفاف، بدون شگفتی</span>
        <h1 className="h-display mt-4.5"  style={{ fontSize: "clamp(36px, 5vw, 72px)"}}>
          آموزش با کیفیت دانشگاهی،<br />
          <span style={{ color: "var(--accent)" }}>قیمت منصفانه</span>
        </h1>
        <p className="lead" style={{ margin: "20px auto 0" }}>
          همه‌ی پلن‌ها شامل: دستیار AI ۲۴/۷، کلاس زنده، آرشیو ضبط‌شده، گواهی دیجیتال.
        </p>
        <div className="inline-flex gap-1 mt-8 p-1 rounded-full"  style={{ background: "var(--surface)", border: "1px solid var(--line-2)"}}>
          {[["month", "ماهانه"], ["term", "ترمی · ۱۵٪ تخفیف"], ["year", "سالانه · ۲۵٪ تخفیف"]].map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setBilling(id)}
              aria-pressed={billing === id}
              className={"btn btn-sm " + (billing === id ? "" : "btn-ghost")}
              style={billing === id ? { background: "var(--fg)", color: "var(--bg)", borderRadius: 999 } : { borderRadius: 999 }}
            >{lbl}</button>
          ))}
        </div>
      </div>
    </section>

    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="grid grid-3">
        {[
          {
            t: "آزاد", p: 0, curr: "رایگان", d: "برای کاوش سکو",
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
            t: "دانشجویی", p: 3, curr: billing === "month" ? "میلیون / ماه" : billing === "term" ? "میلیون / ترم" : "میلیون / سال", d: "محبوب‌ترین انتخاب",
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
            t: "حرفه‌ای", p: 8, curr: billing === "month" ? "میلیون / ماه" : billing === "term" ? "میلیون / ترم" : "میلیون / سال", d: "برای دانشجویان ارشد و دکتری",
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
          <div key={p.t} className="card p-9 relative"  style={{
            border: p.popular ? "2px solid var(--accent)" : "1px solid var(--line)"}}>
            {p.popular && (
              <div className="absolute rounded-full"  style={{
                top: -12, right: 24,
                background: "var(--accent)",
                color: "var(--accent-on)",
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "var(--f-mono)",
                letterSpacing: "0.08em",
                fontWeight: 600}}>محبوب‌ترین</div>
            )}
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em" }}>{p.d}</div>
            <h3 className="mt-2"  style={{fontSize: 28}}>{p.t}</h3>
            <div className="flex items-baseline gap-1.5 mt-4 mb-6" >
              <span style={{ fontFamily: "var(--f-display)", fontSize: 56, fontWeight: 800, letterSpacing: "-0.03em" }}>
                {p.p === 0 ? "۰" : toFa(Math.round(p.p * factor * 10) / 10)}
              </span>
              <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>{p.curr}</span>
            </div>
            <button className={"justify-center mb-7 " + " " + ("btn " + (p.popular ? "btn-primary" : "btn-outline"))}   style={{width: "100%"}} onClick={() => go("register")}>
              {p.cta}
            </button>
            <ul className="p-0 m-0 flex flex-col gap-3"  style={{listStyle: "none"}}>
              {p.features.map(([t, on], i) => (
                <li className="flex items-center gap-2.5" key={i}  style={{ fontSize: 13, color: on ? "var(--fg)" : "var(--fg-dim)"}}>
                  <span className="grid"  style={{width: 18, height: 18, borderRadius: 50, background: on ? "var(--accent)" : "var(--surface-3)", color: on ? "var(--accent-on)" : "var(--fg-dim)", placeItems: "center", flexShrink: 0}}>
                    <Icon name={on ? "check" : "plus"} size={11} stroke={on ? 3 : 2} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card p-10 mt-10 text-center" >
        <span className="eyebrow justify-center" >ENTERPRISE · سازمانی</span>
        <h2 className="h-2 mt-4" >پلن سازمانی — برای دانشگاه‌ها و شرکت‌ها</h2>
        <p className="lead" style={{ margin: "16px auto 0", maxWidth: 640 }}>
          چنددانشکده‌ای، چندمستاجره، Single Sign-On، API اختصاصی، SLA 99.9٪، استقرار on-premise.
        </p>
        <div className="flex gap-3 justify-center mt-6" >
          <Button variant="primary" size="lg" onClick={() => go("messages")}
          >گفتگو با تیم فروش</Button>
          <Button variant="outline" size="lg" onClick={() => window.toast?.({ title: "در حال دانلود", msg: "مستند معماری Enterprise در راه است.", kind: "success" })}
          ><Icon name="download" size={14} />دانلود معماری</Button>
        </div>
      </div>
    </section>
  </main>
  );
};

// =====================================================
// Faculty Directory
// =====================================================
export const FacultyPage: React.FC<MorePageProps> = ({ go }) => {
  const [activeDept, setActiveDept] = React.useState("همه");
  const DEPTS = ["همه", "علوم رایانه", "ریاضی و آمار", "مدیریت", "زبان‌شناسی", "فلسفه و اخلاق", "علوم داده", "مهندسی"];
  const filtered = activeDept === "همه" ? FACULTY : FACULTY.filter((f) => f.role.includes(activeDept) || (f.tags || []).some((t) => activeDept.includes(t)));
  return (
  <main data-screen-label="20 هیات علمی">
    <section style={{ padding: "80px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">FACULTY · هیات علمی</span>
        <h1 className="h-1 mt-4" >استادان دانشگاه برخط هوشمند ایران</h1>
        <p className="lead mt-3.5" >
          ۹۴ استاد در ۸ دانشکده. پژوهشگران، صنعت‌گران، نویسندگان، فعالان آموزش.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px 40px" }}>
      <div className="flex gap-2.5 mb-8 flex-wrap" >
        {DEPTS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveDept(t)}
            className={"pill filter-pill " + (activeDept === t ? "active" : "")}
            aria-pressed={activeDept === t}
            style={{ border: "none", background: activeDept === t ? "var(--accent-soft)" : "var(--surface)", padding: "6px 12px" }}
          >{t}</button>
        ))}
      </div>

      <div className="grid grid-3">
        {filtered.length === 0 && (
          <div className="card-flat p-8 text-center"  style={{ color: "var(--fg-mute)", gridColumn: "1 / -1"}}>
            استادی در این دانشکده پیدا نشد.
          </div>
        )}
        {filtered.map((f, i) => (
          <div key={i} className="card p-7 flex flex-col gap-3.5" >
            <div className="flex items-center gap-3.5" >
              <div className={"avatar " + f.color} style={{ width: 56, height: 56, fontSize: 18 }}>{f.av}</div>
              <div className="flex-1" >
                <h4 className="mb-1"  style={{fontSize: 16}}>{f.name}</h4>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{f.role}</div>
              </div>
            </div>
            <p className="m-0"  style={{fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6}}>{f.bio}</p>
            <div className="flex gap-1.5 flex-wrap mt-1" >
              {f.tags.map((t) => <span key={t} className="pill" style={{ fontSize: 9 }}>{t}</span>)}
            </div>
            <div className="flex justify-between pt-3.5"  style={{ borderTop: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>
              <span>{f.courses} درس</span>
              <span>{f.papers} مقاله</span>
              <span>h-index {f.h}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  </main>
  );
};

// Map data shape to the legacy fields the page uses (av/h/courses/papers).
const FACULTY = FACULTY_DATA.map((f) => ({
  name: f.name,
  role: f.role,
  av: f.avatar,
  color: f.color,
  bio: f.bio,
  tags: f.tags,
  courses: f.courses,
  papers: f.papers,
  h: f.hIndex,
}));

export default CalendarPage;
