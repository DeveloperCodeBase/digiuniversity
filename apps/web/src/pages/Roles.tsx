// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Role-specific pages: Admin, Parent, Office Hours, Events, About
// =====================================================

// =====================================================
// Admin / Manager Dashboard
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { toFa } from "../shared";
import { Button } from "../ui";
// Phase-14.7 R2: sidebar + footer come from Layout (router.tsx).
import { StatCard, Toggle } from "../components/widgets";
import { EVENTS } from "../data.js";

export const AdminPage = ({ go }) => {
  return (
    <main data-screen-label="21 میز مدیریت">
      <div className="dash-main">
          <div className="dash-greet">
            <div>
              <span className="eyebrow">ADMIN CONSOLE · CONTROL CENTER</span>
              <h1 className="mt-2.5" >سامانه‌ها سالم · ۳ مورد نیازمند توجه</h1>
              <p className="muted">آخرین به‌روزرسانی: ۲ دقیقه پیش · همه‌ی سرویس‌ها در حال اجرا</p>
            </div>
            <div className="flex gap-2.5" >
              <span className="pill pill-violet"><span className="dot dot-live ms-1.5" ></span>SLA 99.94٪</span>
              <Button variant="primary" onClick={() => window.toast?.({ title: "گزارش تولید شد", msg: "فایل گزارش روزانه به ایمیل شما ارسال شد.", kind: "success" })}>گزارش روزانه</Button>
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
          <div className="card p-7"  style={{ borderColor: "color-mix(in oklch, var(--gold) 30%, var(--line))"}}>
            <div className="flex justify-between mb-4.5" >
              <div>
                <span className="eyebrow" style={{ color: "var(--gold)" }}>ATTENTION REQUIRED</span>
                <h3 className="h-3 mt-2.5" >۳ مورد نیازمند بازبینی</h3>
              </div>
            </div>
            <div className="flex flex-col gap-2.5" >
              {[
                { kind: "critical", t: "گزارش تخلف از کلاس CS-580", d: "گزارش‌شده توسط ۳ دانشجو — نیاز به بازبینی فوری", time: "۱۲ دقیقه پیش" },
                { kind: "warn", t: "افت کیفیت ASR فارسی", d: "دقت در کلاس‌های امروز ۸۲٪ (پایین‌تر از آستانه ۸۸٪)", time: "۱ ساعت پیش" },
                { kind: "warn", t: "درخواست استثنا برای پرداخت ۸۴-۹۱۱۲", d: "بهنام رضوی — تأخیر پرداخت ترم سوم", time: "۳ ساعت پیش" },
              ].map((a, i) => (
                <div className="grid gap-4 items-center p-4.5 rounded-xl" key={i}  style={{ gridTemplateColumns: "auto 1fr auto", background: "var(--surface-2)",
                  borderRight: "3px solid " + (a.kind === "critical" ? "var(--gold)" : "var(--navy)")}}>
                  <div className="rounded-lg grid"  style={{width: 32, height: 32,
                    background: a.kind === "critical" ? "var(--gold-soft)" : "var(--navy-soft)",
                    color: a.kind === "critical" ? "var(--gold)" : "var(--navy)", placeItems: "center"}}>
                    <Icon name={a.kind === "critical" ? "shield" : "bell"} size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{a.t}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 3 }}>{a.d}</div>
                    <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)"}}>{a.time}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.toast?.({ title: "در حال بررسی", msg: `«${a.t}» باز شد.`, kind: "info" })}
                    aria-label={"بازبینی: " + a.t}
                  >بازبینی</Button>
                </div>
              ))}
            </div>
          </div>

          {/* User management + Service status */}
          <div className="grid gap-6"  style={{gridTemplateColumns: "1.4fr 1fr"}}>
            <div>
              <div className="flex justify-between items-baseline mb-4" >
                <h3 className="h-3">آخرین کاربران ثبت‌نام شده</h3>
                <a
                  className="mono cursor-pointer"
                   style={{color: "var(--fg-mute)", fontSize: 11}}
                  onClick={() => window.toast?.("لیست کامل کاربران به‌زودی")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") window.toast?.("لیست کامل کاربران به‌زودی"); }}
                >همه ←</a>
              </div>
              <div className="card p-0 overflow-hidden" >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {["نام", "نقش", "وضعیت", "تاریخ", ""].map((h) => (
                        <th className="text-right uppercase" key={h}  style={{ padding: "12px 18px", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", fontWeight: 500}}>{h}</th>
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
                          <div className="flex items-center gap-2.5" >
                            <div className={"avatar " + c} style={{ width: 28, height: 28, fontSize: 10 }}>{av}</div>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 13, color: "var(--fg-mute)" }}>{r}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span className={"pill " + (st === "ok" ? "pill-violet" : "pill-amber")} style={{ fontSize: 9 }}>{s}</span>
                        </td>
                        <td style={{ padding: "14px 18px", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{t}</td>
                        <td className="text-left"  style={{padding: "14px 18px"}}>
                          <Button variant="ghost" size="sm" className="icon-btn" onClick={() => window.toast?.(`مدیریت کاربر: ${n}`)}
                            aria-label={"مدیریت کاربر " + n}
                            title="مدیریت کاربر"
                          ><Icon name="settings" size={13} /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="h-3 mb-4" >وضعیت سرویس‌ها</h3>
              <div className="card p-6" >
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
                  <div className="flex justify-between items-center" key={t}  style={{ padding: "10px 0", borderBottom: "1px solid var(--line)"}}>
                    <span className="flex items-center gap-2.5" >
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
          <div className="card p-8" >
            <div className="flex justify-between mb-6" >
              <div>
                <span className="eyebrow">AI GOVERNANCE · حاکمیت</span>
                <h3 className="h-3 mt-2.5" >سیاست‌ها و کنترل عامل‌های هوشمند</h3>
              </div>
              <Button variant="outline" onClick={() => go("settings")}>پیکربندی</Button>
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
                <div key={p.t} className="card-flat p-4" >
                  <div className="flex justify-between mb-2" >
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>POLICY</span>
                    <Toggle on={p.on} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.t}</div>
                  <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{p.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </main>
  );
};

// =====================================================
// Parent / Guardian Dashboard
// =====================================================
export const ParentPage = ({ go }) => (
  <main data-screen-label="22 میز والد">
      <div className="dash-main">
        <div className="dash-greet">
          <div>
            <span className="eyebrow">PARENT PORTAL · والد</span>
            <h1 className="mt-2.5" >سلام محمد، نسرین این هفته عملکرد خوبی داشته</h1>
            <p className="muted">۸ کلاس حضور · ۲ تمرین تحویل داده · میانگین تسلط ۸۲٪</p>
          </div>
          <Button variant="primary" onClick={() => go("messages")}><Icon name="chat" size={14} />تماس با مشاور</Button>
        </div>

        {/* Child profile card */}
        <div className="card p-8" >
          <div className="flex items-center gap-6 pb-6"  style={{ borderBottom: "1px solid var(--line)"}}>
            <div className="avatar cyan" style={{ width: 80, height: 80, fontSize: 28 }}>نر</div>
            <div className="flex-1" >
              <h2 className="h-2">نسرین رضوی</h2>
              <div className="mt-1.5"  style={{fontSize: 14, color: "var(--fg-mute)"}}>کد ۸۴-۰۲-۱۷ · کارشناسی ارشد علوم داده · ترم ۲</div>
              <div className="flex gap-2 mt-3" >
                <span className="pill pill-cyan" style={{ fontSize: 10 }}>وضعیت: عالی</span>
                <span className="pill" style={{ fontSize: 10 }}>۴ درس فعال</span>
                <span className="pill pill-violet" style={{ fontSize: 10 }}>میانگین ۸۲٪</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => go("profile")}>پروفایل کامل</Button>
          </div>

          <div className="stat-row mt-6" >
            <StatCard l="حضور در کلاس" v="۹۴" unit="٪" trend="عالی" spark={[88,90,92,93,94,93,94,94]} color="var(--accent)" />
            <StatCard l="تسلط بر اهداف" v="۸۲" unit="٪" trend="+ ۴.۲" spark={[72,74,76,77,79,80,81,82]} color="var(--navy)" />
            <StatCard l="ساعت مطالعه" v="۲۴" unit="h/هفته" trend="بالاتر از متوسط" spark={[16,18,20,22,23,24,23,24]} color="var(--sage)" />
            <StatCard l="ریسک افت" v="کم" trend="نگرانی نیست" spark={[0.3,0.25,0.2,0.18,0.15,0.13,0.12,0.1]} color="var(--gold)" trendDown />
          </div>
        </div>

        {/* Recent activity + Quick actions */}
        <div className="grid gap-6"  style={{gridTemplateColumns: "1.4fr 1fr"}}>
          <div>
            <h3 className="h-3 mb-4" >فعالیت‌های اخیر فرزند</h3>
            <div className="flex flex-col gap-2" >
              {[
                { ic: "check", t: "تمرین ۴ بهینه‌سازی — نمره ۸۷/۱۰۰", time: "امروز", color: "sage" },
                { ic: "live", t: "حضور در جلسه ۸ یادگیری ماشین", time: "امروز", color: "accent" },
                { ic: "cert", t: "گواهی پایان دوره آمار بیزی صادر شد", time: "دیروز", color: "navy" },
                { ic: "play", t: "بازبینی ۲ ساعته از کلاس‌های ضبط‌شده", time: "۲ روز پیش", color: "accent" },
                { ic: "users", t: "شرکت در گروه مطالعه با علی و ساره", time: "۳ روز پیش", color: "sage" },
              ].map((a, i) => (
                <div key={i} className="card-flat flex items-center gap-3.5 p-3.5" >
                  <div className="rounded-lg grid"  style={{width: 32, height: 32, background: `var(--${a.color}-soft, var(--surface-2))`, color: `var(--${a.color})`, placeItems: "center"}}>
                    <Icon name={a.ic} size={14} />
                  </div>
                  <div className="flex-1"  style={{ fontSize: 14}}>{a.t}</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="h-3 mb-4" >دسترسی سریع</h3>
            <div className="flex flex-col gap-2.5" >
              <button onClick={() => go("financial-aid")} className="card-flat flex items-center gap-3.5 p-4.5 text-right cursor-pointer"  style={{ border: "1px solid var(--line)", fontFamily: "inherit", color: "var(--fg)"}}>
                <div className="rounded-lg grid"  style={{width: 36, height: 36, background: "var(--accent-soft)", color: "var(--accent)", placeItems: "center"}}><Icon name="dollar" size={16} /></div>
                <div className="flex-1" >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>پرداخت شهریه‌ی ترم</div>
                  <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>سررسید: ۱۵ شهریور</div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
              <button onClick={() => go("messages")} className="card-flat flex items-center gap-3.5 p-4.5 text-right cursor-pointer"  style={{ border: "1px solid var(--line)", fontFamily: "inherit", color: "var(--fg)"}}>
                <div className="rounded-lg grid"  style={{width: 36, height: 36, background: "var(--navy-soft)", color: "var(--navy)", placeItems: "center"}}><Icon name="chat" size={16} /></div>
                <div className="flex-1" >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>پیام به استاد راهنما</div>
                  <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>دکتر عظیمی · معمولاً ظرف ۱ روز پاسخ می‌دهد</div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
              <button onClick={() => go("officehours")} className="card-flat flex items-center gap-3.5 p-4.5 text-right cursor-pointer"  style={{ border: "1px solid var(--line)", fontFamily: "inherit", color: "var(--fg)"}}>
                <div className="rounded-lg grid"  style={{width: 36, height: 36, background: "var(--sage-soft)", color: "var(--sage)", placeItems: "center"}}><Icon name="calendar" size={16} /></div>
                <div className="flex-1" >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>درخواست جلسه با مشاور</div>
                  <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>زمان‌های آزاد این هفته</div>
                </div>
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
  </main>
);

// =====================================================
// Office Hours / Booking
// =====================================================
export const OfficeHoursPage = ({ go }) => {
  const [selectedDay, setSelectedDay] = React.useState(2);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [selectedInstructor, setSelectedInstructor] = React.useState(0);

  const INSTRUCTORS = [
    { name: "دکتر آرش عظیمی", role: "ML · CS-410", av: "AA", color: "cyan", available: "آزاد امروز" },
    { name: "دکتر سپیده موسوی", role: "NLP · CS-620", av: "SM", color: "amber", available: "فردا" },
    { name: "م. کیانی", role: "Sys · CS-580", av: "MK", color: "violet", available: "هفته‌ی بعد" },
    { name: "دکتر فرهادی", role: "آمار", av: "BF", color: "rose", available: "این هفته" },
  ];

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
          <h1 className="h-1 mt-4" >رزرو جلسه با استاد</h1>
          <p className="lead mt-3.5" >
            هر استاد ساعات تخصیصی هفتگی دارد. جلسات می‌توانند مجازی، گروهی یا فردی باشند.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px 40px" }}>
        <div className="grid gap-8"  style={{ gridTemplateColumns: "320px 1fr"}}>
          {/* Instructor select */}
          <aside>
            <h3 className="h-3 mb-4" >انتخاب استاد</h3>
            <div className="flex flex-col gap-2.5" >
              {INSTRUCTORS.map((ins, i) => (
                <button className="flex items-center gap-3.5 p-3.5 rounded-xl text-right cursor-pointer" key={i} onClick={() => setSelectedInstructor(i)} aria-pressed={selectedInstructor === i}  style={{
                  background: selectedInstructor === i ? "var(--accent-soft)" : "var(--surface)",
                  border: "1px solid " + (selectedInstructor === i ? "var(--accent)" : "var(--line)"), fontFamily: "inherit", color: "var(--fg)"}}>
                  <div className={"avatar " + ins.color}>{ins.av}</div>
                  <div className="flex-1"  style={{ minWidth: 0}}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ins.name}</div>
                    <div className="mt-0.5"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>{ins.role}</div>
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--sage)" }}>{ins.available}</span>
                </button>
              ))}
            </div>
          </aside>

          <div>
            {/* Selected instructor info */}
            <div className="card p-6 mb-6" >
              <div className="flex gap-4.5 items-center" >
                <div className={"avatar " + INSTRUCTORS[selectedInstructor].color} style={{ width: 56, height: 56, fontSize: 18 }}>{INSTRUCTORS[selectedInstructor].av}</div>
                <div className="flex-1"  style={{ minWidth: 0}}>
                  <h3 style={{ fontSize: 18 }}>{INSTRUCTORS[selectedInstructor].name}</h3>
                  <div className="mt-1"  style={{fontSize: 13, color: "var(--fg-mute)"}}>{INSTRUCTORS[selectedInstructor].role} · مدت جلسه: ۳۰ دقیقه</div>
                </div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, color: "var(--accent)" }}>۴.۹ ⭐</div>
              </div>
            </div>

            {/* Day picker */}
            <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>انتخاب روز</div>
            <div className="grid gap-2 mb-8"  style={{ gridTemplateColumns: "repeat(6, 1fr)"}}>
              {days.map((d, i) => (
                <button className="p-3.5 rounded-lg text-center" key={i} onClick={() => !d.full && setSelectedDay(i)}  style={{
                  background: selectedDay === i ? "var(--accent)" : d.full ? "var(--surface-3)" : "var(--surface)",
                  color: selectedDay === i ? "var(--accent-on)" : d.full ? "var(--fg-dim)" : "var(--fg)",
                  border: "1px solid " + (selectedDay === i ? "var(--accent)" : "var(--line)"), fontFamily: "inherit",
                  cursor: d.full ? "not-allowed" : "pointer",
                  opacity: d.full ? 0.5 : 1}}>
                  <div style={{ fontSize: 11, fontFamily: "var(--f-mono)" }}>{d.d}</div>
                  <div className="mt-1"  style={{fontSize: 22, fontWeight: 700, fontFamily: "var(--f-display)"}}>{toFa(d.n)}</div>
                  {d.full && <div className="mt-1"  style={{fontSize: 9, color: "var(--gold)", fontFamily: "var(--f-mono)"}}>تکمیل</div>}
                </button>
              ))}
            </div>

            {/* Time slots */}
            <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>ساعت آزاد</div>
            <div className="grid gap-2 mb-8"  style={{ gridTemplateColumns: "repeat(6, 1fr)"}}>
              {slots.map((s, i) => (
                <button className="p-3 rounded-md" key={i} onClick={() => s.available && setSelectedSlot(i)} disabled={!s.available}  style={{
                  background: selectedSlot === i ? "var(--fg)" : s.available ? "var(--surface)" : "var(--surface-3)",
                  color: selectedSlot === i ? "var(--bg)" : s.available ? "var(--fg)" : "var(--fg-dim)",
                  border: "1px solid " + (selectedSlot === i ? "var(--fg)" : "var(--line)"),
                  fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 500,
                  cursor: s.available ? "pointer" : "not-allowed",
                  textDecoration: s.available ? "none" : "line-through"}}>{s.t}</button>
              ))}
            </div>

            {/* Booking form */}
            <div className="card p-6" >
              <h4 className="mb-4"  style={{fontSize: 15}}>جزئیات جلسه</h4>
              <div className="grid gap-3.5 mb-3.5"  style={{ gridTemplateColumns: "1fr 1fr"}}>
                <label>
                  <div className="mono mb-1.5 uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>نوع جلسه</div>
                  <select className="rounded-lg"  style={{width: "100%", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 13}}>
                    <option>فردی · ۳۰ دقیقه</option>
                    <option>گروهی · ۶۰ دقیقه</option>
                    <option>مشاوره پروژه · ۴۵ دقیقه</option>
                  </select>
                </label>
                <label>
                  <div className="mono mb-1.5 uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>محل</div>
                  <select className="rounded-lg"  style={{width: "100%", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 13}}>
                    <option>آنلاین · کلاس مجازی</option>
                    <option>تلفنی</option>
                    <option>چت ناهمزمان</option>
                  </select>
                </label>
              </div>
              <label>
                <div className="mono mb-1.5 uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>موضوع جلسه</div>
                <textarea className="rounded-lg resize-y" placeholder="در چند خط بنویسید چه می‌خواهید بپرسید. این کمک می‌کند استاد قبل از جلسه آماده شود." rows={3}  style={{width: "100%", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 13}}></textarea>
              </label>
              <div className="flex justify-between items-center mt-4.5" >
                <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>تا ۲ ساعت قبل از جلسه قابل لغو</span>
                <Button variant="primary" disabled={selectedSlot === null}
                  onClick={() => {
                    window.toast?.({ title: "جلسه ثبت شد", msg: `جلسه‌ی شما با دکتر عظیمی روز ${days[selectedDay].d} ساعت ${slots[selectedSlot].t} رزرو شد.`, kind: "success" });
                  }}
                  aria-label="رزرو جلسه"
                >رزرو جلسه<Icon name="arrow" size={14} /></Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

// =====================================================
// Events / Webinars
// =====================================================
const EventFilters = () => {
  const [active, setActive] = React.useState("همه");
  const items = ["همه", "وبینار", "کارگاه", "کنفرانس", "سخنرانی مهمان", "روز باز", "این هفته", "این ماه"];
  return (
    <div className="flex gap-2 mb-6 flex-wrap" >
      {items.map((t) => (
        <button
          key={t}
          className={"pill filter-pill " + (active === t ? "active" : "")}
          onClick={() => setActive(t)}
          style={{ border: "none", background: active === t ? "var(--accent-soft)" : "var(--surface)" }}
          aria-pressed={active === t}
        >{t}</button>
      ))}
    </div>
  );
};

export const EventsPage = ({ go }) => (
  <main data-screen-label="24 رویدادها">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">EVENTS · رویدادها و وبینارها</span>
        <h1 className="h-1 mt-4" >رویدادها و وبینارها</h1>
        <p className="lead mt-3.5" >
          سخنرانی‌های مهمان، کارگاه‌های عملی، کنفرانس‌های پژوهشی، روز باز پذیرش.
        </p>
      </div>
    </section>

    {/* Featured event */}
    <section className="shell" style={{ padding: "40px 40px" }}>
      <div className="card p-10 mb-10 grid gap-8 items-center"  style={{ gridTemplateColumns: "1fr 320px"}}>
        <div>
          <div className="flex gap-2 mb-4.5" >
            <span className="pill pill-cyan">رویداد ویژه</span>
            <span className="pill">رایگان</span>
            <span className="pill">آنلاین</span>
          </div>
          <h2 className="h-1">آینده‌ی LLMها در آموزش — کنفرانس سالانه ۱۴۰۵</h2>
          <p className="lead mt-4"  style={{ maxWidth: "100%"}}>
            ۴۰ سخنران از دانشگاه‌های ایران و جهان. ۸ کارگاه عملی. شبکه‌سازی با ۱۲۰۰ پژوهشگر فعال.
          </p>
          <div className="flex gap-6 mt-7 flex-wrap" >
            <div>
              <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em"}}>تاریخ</div>
              <div className="mt-1"  style={{fontSize: 14, fontWeight: 600}}>۱۸ تا ۲۰ شهریور ۱۴۰۵</div>
            </div>
            <div>
              <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em"}}>زمان باقی‌مانده</div>
              <div className="mt-1"  style={{fontSize: 14, fontWeight: 600, color: "var(--accent)"}}>۴۲ روز</div>
            </div>
            <div>
              <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em"}}>ثبت‌نام شده</div>
              <div className="mt-1"  style={{fontSize: 14, fontWeight: 600}}>۸۴۲ نفر</div>
            </div>
          </div>
          <div className="flex gap-3 mt-7" >
            <Button variant="primary" size="lg" onClick={() => window.toast?.({ title: "ثبت‌نام شد", msg: "ثبت‌نام شما در کنفرانس LLMs in Education انجام شد.", kind: "success" })}
            >ثبت‌نام رایگان</Button>
            <Button variant="outline" size="lg" onClick={() => { go("calendar"); window.toast?.("رویداد به تقویم اضافه شد"); }}
            ><Icon name="calendar" size={14} />افزودن به تقویم</Button>
          </div>
        </div>
        <div className="rounded-2xl relative overflow-hidden p-6"  style={{aspectRatio: "4 / 5",
          background: "linear-gradient(135deg, oklch(0.3 0.13 255), oklch(0.5 0.16 255))"}}>
          <div className="absolute"  style={{ inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 18px)"}}></div>
          <div className="relative flex flex-col justify-between"  style={{ color: "white", height: "100%"}}>
            <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.1em" }}>CONF · 1405</div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>LLMs in</div>
              <div className="mt-1"  style={{fontFamily: "var(--f-display)", fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em"}}>EDUCATION</div>
              <div className="mt-3"  style={{fontSize: 11, opacity: 0.7, fontFamily: "var(--f-mono)"}}>SHAHRIVAR · 18-20</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <EventFilters />

      {/* Event grid */}
      <div className="grid grid-3">
        {EVENTS.filter((ev) => !ev.featured).map((ev, i) => {
          const e = { t: ev.title, date: ev.date, by: ev.by, kind: ev.kind, attendees: ev.attendees, free: ev.free };
          return (
          <div key={i} className="card p-6 flex flex-col gap-3" >
            <div className="flex justify-between items-start" >
              <span className="pill" style={{ fontSize: 10 }}>{e.kind}</span>
              <span className={"pill " + (e.free ? "pill-violet" : "pill-amber")} style={{ fontSize: 10 }}>{e.free ? "رایگان" : "پرداختی"}</span>
            </div>
            <h4 style={{ fontSize: 16 }}>{e.t}</h4>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--accent)" }}>{e.date}</div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{e.by}</div>
            <div className="flex justify-between pt-3 mt-1"  style={{ borderTop: "1px solid var(--line)"}}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{toFa(e.attendees)} نفر</span>
              <Button variant="outline" size="sm" onClick={() => window.toast?.({ title: "ثبت‌نام شد", msg: `ثبت‌نام در «${e.t}» انجام شد.`, kind: "success" })}
                aria-label={"ثبت‌نام در " + e.t}
              >ثبت‌نام</Button>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  </main>
);

// =====================================================
// About / Mission
// =====================================================
export const AboutPage = ({ go }) => (
  <main data-screen-label="25 درباره">
    <section style={{ padding: "100px 0 60px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell" style={{ maxWidth: 920 }}>
        <span className="eyebrow">ABOUT · درباره ما</span>
        <h1 className="h-display mt-6"  style={{ fontSize: "clamp(40px, 5vw, 80px)"}}>
          دانشگاهی که می‌داند<br />
          <span className="italic"  style={{color: "var(--accent)"}}>چطور یاد می‌گیری</span>
        </h1>
        <p className="mt-8"  style={{fontSize: 22, lineHeight: 1.7, color: "var(--fg-mute)", fontFamily: "var(--f-display)", fontWeight: 400}}>
          ما دانشگاهی نمی‌سازیم که از ابزارهای AI استفاده می‌کند — ما دانشگاهی می‌سازیم که <strong style={{ color: "var(--fg)" }}>از ابتدا با AI به‌عنوان زیرساخت یادگیری</strong> طراحی شده. تفاوت، در همه چیز است.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "80px 40px" }}>
      <div className="grid grid-3 mb-20" >
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
            <div className="mt-3"  style={{fontSize: 14, color: "var(--fg-mute)"}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Principles */}
      <div className="grid gap-15 mb-20"  style={{ gridTemplateColumns: "1fr 1.4fr"}}>
        <div>
          <span className="eyebrow">PRINCIPLES · اصول</span>
          <h2 className="h-1 mt-4" >چه چیزی ما را راهنمایی می‌کند</h2>
        </div>
        <div className="flex flex-col gap-6" >
          {[
            ["AI-Native, not AI-Added", "هوش مصنوعی شالوده‌ی یادگیری است، نه افزونه‌ی جانبی."],
            ["Mastery over Coverage", "تسلط واقعی بر اهداف، نه حضور صرف در کلاس."],
            ["Standards-First", "LTI، xAPI، QTI، Open Badges — استاندارد، نه قفل‌شده به فروشنده."],
            ["Human Judgment in Critical Loops", "هر تصمیم حساس بازبینی انسانی نهایی دارد."],
            ["Privacy by Design", "حریم خصوصی پیش‌فرض است، نه گزینه."],
            ["Persian-First, Global-Ready", "فارسی اولویت، انگلیسی استاندارد، باز برای زبان‌های دیگر."],
          ].map(([t, d], i) => (
            <div className="grid gap-4.5 pb-6" key={i}  style={{ gridTemplateColumns: "40px 1fr", borderBottom: i < 5 ? "1px solid var(--line)" : "none"}}>
              <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.08em" }}>{toFa("0" + (i + 1))}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--f-display)" }}>{t}</div>
                <div className="mt-1.5"  style={{fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.6}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team teaser */}
      <div className="card p-12" >
        <div className="grid gap-10 items-center"  style={{ gridTemplateColumns: "1fr 1fr"}}>
          <div>
            <span className="eyebrow">TEAM · تیم</span>
            <h2 className="h-2 mt-4" >تیمی از پژوهشگران، طراحان آموزشی و مهندسان</h2>
            <p className="mt-3.5"  style={{color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7}}>
              ۲۸ نفر تمام‌وقت، ۱۲ مشاور علمی، ۹۴ استاد در شبکه. متنوع از نظر تخصص، یکپارچه در ماموریت.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => go("faculty")}>دیدن همه‌ی تیم</Button>
          </div>
          <div className="grid gap-2"  style={{ gridTemplateColumns: "repeat(4, 1fr)"}}>
            {["AA","SM","MK","BF","RT","SR","AN","MK","JK","TT","NR","BN"].map((a, i) => (
              <div className={"rounded-lg " + " " + ("avatar " + (["cyan","amber","violet","rose","cyan","amber","violet","rose","cyan","amber","violet","rose"][i]))} key={i}   style={{width: "100%", aspectRatio: "1", fontSize: 14}}>{a}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </main>
);

export default AdminPage;
