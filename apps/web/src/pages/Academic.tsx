// Phase-A R2.9 — typed.
// =====================================================
// Real-university workflows: Transcript, Degree Audit,
// Registration, Career Services, Financial Aid, Wellness,
// Alumni, Hackathons, Honor Code
// =====================================================

// =====================================================
// Transcript / Academic Record
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer, toFa } from "../shared";
import { Button } from "../ui";
import {
  TRANSCRIPT,
  JOBS,
  SCHOLARSHIPS,
  HACKATHONS,
  ALUMNI,
  findFaculty,
  CURRENT_USER,
} from "../data.js";
import type { Go } from "../router";

interface AcademicPageProps { go: Go }

export const TranscriptPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="36 کارنامه">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="flex justify-between items-end gap-4 flex-wrap mb-8" >
        <div>
          <span className="eyebrow">OFFICIAL TRANSCRIPT · ریزنمرات رسمی</span>
          <h1 className="h-1 mt-3" >کارنامه‌ی رسمی</h1>
          <p className="lead mt-3" >نسرین رضوی · کد ۸۴-۰۲-۱۷ · کارشناسی ارشد علوم داده · ترم ۲</p>
        </div>
        <div className="flex gap-2" >
          <Button variant="outline" onClick={() => window.toast?.({ title: "در حال دانلود", msg: "فایل PDF کارنامه آماده‌سازی شد.", kind: "success" })}
          ><Icon name="download" size={14} />PDF رسمی</Button>
          <Button variant="primary" onClick={() => go("credential")}
          ><Icon name="shield" size={14} />استعلام دیجیتال</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-9 mb-6" >
        <div className="grid gap-6"  style={{ gridTemplateColumns: "repeat(5, 1fr)"}}>
          {[
            ["GPA کل", "۳.۸۲", "var(--accent)"],
            ["واحد گذرانده", "۴۸ از ۱۲۰", null],
            ["واحد فعلی", "۱۸", null],
            ["پایه", "ارشد", null],
            ["وضعیت", "ممتاز", "var(--sage)"],
          ].map(([l, v, c], i) => (
            <div key={i} style={{ borderRight: i < 4 ? "1px solid var(--line)" : "none", paddingRight: i < 4 ? 24 : 0 }}>
              <div className="mono uppercase"  style={{color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.08em"}}>{l}</div>
              <div className="mt-2"  style={{fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 700, color: c || "var(--fg)"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Semesters */}
      {TRANSCRIPT_SEMESTERS.map((sem, si) => (
        <div key={si} className="card p-0 mb-6 overflow-hidden" >
          <div className="flex justify-between items-center flex-wrap gap-3"  style={{padding: "18px 24px", borderBottom: "1px solid var(--line)"}}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>{sem.code}</div>
              <h3 className="h-3 mt-1" >{sem.t}</h3>
            </div>
            <div className="flex gap-6" >
              <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, letterSpacing: "0.08em" }}>GPA</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>{sem.gpa}</div></div>
              <div><div className="mono" style={{ color: "var(--fg-dim)", fontSize: 10, letterSpacing: "0.08em" }}>واحد</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 16 }}>{sem.cr}</div></div>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["کد", "عنوان درس", "واحد", "نمره", "حرف", "استاد"].map((h) => (
                  <th className="text-right uppercase" key={h}  style={{ padding: "12px 24px", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", fontWeight: 500}}>{h}</th>
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

// Transcript from data.js — adapt to UI shape (t = title, cr = credits as string, ...)
const TRANSCRIPT_SEMESTERS = TRANSCRIPT.map((sem) => ({
  code: `${sem.code} · ${sem.season}`,
  t: sem.title,
  gpa: toFa(sem.gpa.toFixed(2)),
  cr: toFa(sem.credits),
  courses: sem.courses.map((c) => ({
    code: c.code,
    t: c.title,
    cr: toFa(c.credits),
    score: toFa(c.score),
    grade: c.grade,
    prof: c.prof ? findFaculty(c.prof)?.name || "—" : "—",
  })),
}));

// =====================================================
// Degree Audit / Progress
// =====================================================
export const DegreeAuditPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="37 مسیر مدرک">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="mb-8" >
        <span className="eyebrow">DEGREE AUDIT · پیشرفت مدرک</span>
        <h1 className="h-1 mt-3" >مسیر مدرک تحصیلی</h1>
        <p className="lead mt-3" >کارشناسی ارشد علوم داده · ۴۸ واحد گذرانده از ۱۲۰</p>
      </div>

      {/* Overall progress */}
      <div className="card p-9 mb-6" >
        <div className="flex justify-between items-baseline mb-3.5" >
          <h3 className="h-3">پیشرفت کلی</h3>
          <span style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>۴۰٪</span>
        </div>
        <div className="rounded-full overflow-hidden mb-2"  style={{height: 10, background: "var(--surface-2)"}}>
          <div className="rounded-full"  style={{width: "40%", height: "100%", background: "linear-gradient(90deg, var(--accent), var(--navy))"}}></div>
        </div>
        <div className="flex justify-between"  style={{ fontSize: 12, color: "var(--fg-mute)"}}>
          <span>۴۸ واحد کسب‌شده</span>
          <span>تخمین فارغ‌التحصیلی: تیر ۱۴۰۶</span>
        </div>
      </div>

      {/* Requirement categories */}
      <div className="grid grid-2 gap-4" >
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
          <div key={ci} className="card p-6" >
            <div className="flex justify-between mb-3.5" >
              <h3 className="h-3">{cat.t}</h3>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 600, color: cat.color }}>{toFa(cat.done)} / {toFa(cat.total)}</span>
            </div>
            <div className="rounded-full overflow-hidden mb-4.5"  style={{height: 4, background: "var(--surface-2)"}}>
              <div className="rounded-full"  style={{width: (cat.done / cat.total * 100) + "%", height: "100%", background: cat.color}}></div>
            </div>
            <div className="flex flex-col gap-2" >
              {cat.courses.map((c, i) => (
                <div className="flex items-center gap-2.5" key={i}  style={{ padding: "8px 0", borderBottom: i < cat.courses.length - 1 ? "1px solid var(--line)" : "none", fontSize: 13}}>
                  <span className="grid"  style={{width: 18, height: 18, borderRadius: 50,
                    background: c.s === "done" ? cat.color : c.s === "current" ? "var(--surface-3)" : "transparent",
                    border: c.s === "todo" ? "1.5px dashed var(--line-2)" : "none",
                    color: c.s === "done" ? "white" : c.s === "current" ? "var(--accent)" : "var(--fg-dim)", placeItems: "center", flexShrink: 0}}>
                    {c.s === "done" && <Icon name="check" size={10} stroke={3} />}
                    {c.s === "current" && <span style={{ width: 5, height: 5, borderRadius: 50, background: "var(--accent)" }}></span>}
                  </span>
                  <span className="flex-1"  style={{ color: c.s === "todo" ? "var(--fg-mute)" : "var(--fg)"}}>{c.t}</span>
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
const REGISTRATION_FILTERS = ["همه", "الزامی", "تخصصی", "اختیاری", "خالی", "بدون تداخل"];
const RegistrationFilterPills = () => {
  const [active, setActive] = React.useState(REGISTRATION_FILTERS[0]);
  return (
    <div className="flex gap-2 mb-5 flex-wrap" role="group" aria-label="فیلتر دروس">
      {REGISTRATION_FILTERS.map((t) => (
        <button
          key={t}
          type="button"
          className={"pill " + (t === active ? "pill-cyan" : "")}
          style={{ cursor: "pointer", border: "none", background: t === active ? undefined : "var(--surface)" }}
          aria-pressed={t === active}
          onClick={() => setActive(t)}
        >{t}</button>
      ))}
    </div>
  );
};

export const RegistrationPage: React.FC<AcademicPageProps> = ({ go }) => {
  const [cart, setCart] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("digiu_cart") || "[\"CS-580\"]"); } catch { return ["CS-580"]; }
  });
  React.useEffect(() => {
    try { localStorage.setItem("digiu_cart", JSON.stringify(cart)); } catch {}
  }, [cart]);
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
        <div className="mb-8" >
          <span className="eyebrow">REGISTRATION · ثبت‌نام ترم تابستان ۱۴۰۵</span>
          <h1 className="h-1 mt-3" >انتخاب واحد</h1>
          <p className="lead mt-3" >پنجره ثبت‌نام: ۵ تا ۲۰ شهریور · مهلت Add/Drop: ۲ هفته اول ترم</p>
        </div>

        <div className="grid gap-8"  style={{ gridTemplateColumns: "1fr 320px"}}>
          <div>
            <RegistrationFilterPills />


            <div className="card p-0 overflow-hidden" >
              {available.map((c, i) => {
                const full = c.enrolled >= c.capacity;
                const inCart = cart.includes(c.code);
                return (
                  <div className="grid gap-4.5 p-4.5 items-center" key={c.code}  style={{ gridTemplateColumns: "120px 1fr auto",
                    borderTop: i > 0 ? "1px solid var(--line)" : "none",
                    background: inCart ? "var(--accent-soft)" : "transparent"}}>
                    <div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{c.code}</div>
                      <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 13, fontWeight: 700, color: "var(--accent)"}}>{toFa(c.cr)} واحد</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.t}</div>
                      <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{c.prof} · {c.day}</div>
                      <div className="flex gap-1.5 mt-2 flex-wrap" >
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

          <aside className="sticky"  style={{ top: 90, alignSelf: "start"}}>
            <div className="card p-6" >
              <h3 className="h-3">سبد ثبت‌نام</h3>
              <div className="flex justify-between mt-3.5 mb-3.5" >
                <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>تعداد دروس</span>
                <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{toFa(cart.length)}</span>
              </div>
              <div className="flex justify-between pb-3.5"  style={{ borderBottom: "1px solid var(--line)"}}>
                <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>جمع واحدها</span>
                <span style={{ fontFamily: "var(--f-display)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{toFa(totalCredits)}</span>
              </div>
              <div className="mt-3.5"  style={{fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6}}>
                حداقل ۹ واحد · حداکثر ۲۴ واحد در ترم تابستان
              </div>
              <Button variant="primary" className="justify-center mt-5" style={{width: "100%"}}
                disabled={totalCredits < 3}
                onClick={async () => {
                  const ok = await window.confirmAction?.({
                    title: "نهایی‌سازی ثبت‌نام",
                    body: `${toFa(cart.length)} درس با مجموع ${toFa(totalCredits)} واحد ثبت می‌شود. پس از تأیید، Add/Drop تا ۲ هفته‌ی اول ترم ممکن است.`,
                    confirmLabel: "تأیید نهایی",
                  });
                  if (ok) window.toast?.({ title: "ثبت‌نام نهایی شد", msg: "برنامه‌ی ترم تابستان شما قطعی شد.", kind: "success" });
                }}
              >
                نهایی‌سازی ثبت‌نام
                <Icon name="arrow" size={14} />
              </Button>
            </div>

            <div className="card p-5 mt-4" >
              <div className="flex items-center gap-2 mb-2.5"  style={{ color: "var(--accent)"}}>
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
export const CareerPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="39 خدمات شغلی">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">CAREER SERVICES · خدمات شغلی</span>
        <h1 className="h-1 mt-4" >مرکز شغل و کارآموزی</h1>
        <p className="lead mt-3.5" >۴۸۲ موقعیت فعال · ۲۳۴ شرکت همکار · میانگین زمان استخدام: ۳۴ روز</p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px" }}>
      {/* AI Match Card */}
      <div className="card p-8 mb-8"  style={{ background: "linear-gradient(135deg, var(--surface), var(--accent-soft))"}}>
        <div className="flex items-center gap-3 mb-3.5" >
          <Icon name="sparkle" size={16} style={{ color: "var(--accent)" }} />
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--accent)" }}>AI CAREER MATCH</span>
        </div>
        <h2 className="h-2">۲۳ موقعیت مطابق با پروفایل شما</h2>
        <p className="mt-2.5"  style={{color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7}}>
          AI بر اساس مهارت‌ها، دوره‌ها، پروژه‌ها و علایق شما، موقعیت‌های متناسب پیدا می‌کند.
        </p>
        <div className="flex gap-3 mt-5" >
          <Button variant="primary" onClick={() => window.toast?.({ title: "۲۳ موقعیت مطابق پروفایل", msg: "نتایج زیر فهرست شده‌اند.", kind: "info" })}
          >مشاهده تطابق‌ها<Icon name="arrow" size={14} /></Button>
          <Button variant="outline" onClick={() => go("profile")}
          >به‌روزرسانی رزومه</Button>
        </div>
      </div>

      <div className="grid gap-8"  style={{ gridTemplateColumns: "260px 1fr"}}>
        <aside>
          <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>نوع</div>
          <div className="flex flex-col gap-1 mb-6" >
            {[["تمام وقت", 248], ["کارآموزی", 128], ["پاره‌وقت", 64], ["دورکار", 156], ["پروژه‌ای", 42]].map(([t, n]) => (
              <label className="flex justify-between items-center cursor-pointer" key={t}  style={{ padding: "8px 10px", fontSize: 13}}>
                <span className="flex items-center gap-2.5" >
                  <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)" }} />
                  {t}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{toFa(n)}</span>
              </label>
            ))}
          </div>
          <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>تجربه</div>
          <div className="flex flex-col gap-1" >
            {[["دانشجویی", true], ["تازه‌کار", true], ["میانه", false], ["ارشد", false]].map(([t, d]) => (
              <label className="flex items-center gap-2.5 cursor-pointer" key={t}  style={{ padding: "8px 10px", fontSize: 13}}>
                <input type="checkbox" defaultChecked={d} style={{ accentColor: "var(--accent)" }} />{t}
              </label>
            ))}
          </div>
        </aside>

        <div className="flex flex-col gap-3" >
          {JOBS.map((job, i) => {
            const j = {
              co: job.company, t: job.title, l: job.location, typ: job.type,
              sal: job.salary, logo: job.logo, c: job.color, match: job.match,
            };
            return (
            <div key={i} className="card p-5.5 grid gap-4.5 items-center cursor-pointer"  style={{ gridTemplateColumns: "56px 1fr auto"}}>
              <div className={"avatar " + j.c} style={{ width: 56, height: 56, fontSize: 16 }}>{j.logo}</div>
              <div>
                <div className="flex items-center gap-2.5 mb-1.5" >
                  <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>{j.co}</span>
                  <span className="pill pill-cyan" style={{ fontSize: 9 }}>تطابق {toFa(j.match)}٪</span>
                </div>
                <h4 style={{ fontSize: 15 }}>{j.t}</h4>
                <div className="flex gap-3 mt-2 flex-wrap"  style={{ fontSize: 12, color: "var(--fg-mute)"}}>
                  <span>{j.l}</span>
                  <span>·</span>
                  <span>{j.typ}</span>
                  <span>·</span>
                  <span style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{j.sal}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5" >
                <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); window.toast?.({ title: "درخواست ارسال شد", msg: `درخواست شما برای موقعیت در ${j.co} ارسال شد.`, kind: "success" }); }}
                  aria-label={"درخواست برای موقعیت در " + j.co}
                >درخواست</Button>
                <Button variant="ghost" size="sm" className="icon-btn" onClick={(e) => { e.stopPropagation(); window.toast?.("به علاقه‌مندی‌ها افزوده شد"); }}
                  aria-label="افزودن به علاقه‌مندی‌ها"
                  title="ذخیره"
                ><Icon name="star" size={13} /></Button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Financial Aid / Scholarships
// =====================================================
export const FinancialAidPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="40 کمک هزینه">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="mb-8" >
        <span className="eyebrow">FINANCIAL AID · کمک هزینه</span>
        <h1 className="h-1 mt-3" >وام و بورسیه</h1>
        <p className="lead mt-3" >۱۲ کمک هزینه فعال · ۸ بورسیه قابل درخواست</p>
      </div>

      {/* Active aid */}
      <div className="card p-9 mb-8" >
        <span className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.08em" }}>کمک هزینه‌ی فعال شما</span>
        <h2 className="h-2 mt-2.5" >بورسیه‌ی استعداد درخشان — ترم بهار ۱۴۰۵</h2>
        <div className="grid gap-6 mt-7 p-5 rounded-xl"  style={{ gridTemplateColumns: "repeat(4, 1fr)", background: "var(--accent-soft)"}}>
          {[
            ["پوشش شهریه", "۷۰٪"],
            ["مبلغ", "۸,۴۰۰,۰۰۰ ت"],
            ["نوع", "بازپرداختی"],
            ["وضعیت", "فعال"],
          ].map(([l, v], i) => (
            <div key={i}>
              <div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>{l}</div>
              <div className="mt-1"  style={{fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 700}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Available scholarships */}
      <h3 className="h-3 mb-4.5" >بورسیه‌های قابل درخواست</h3>
      <div className="grid grid-2 gap-4" >
        {SCHOLARSHIPS.map((sch, i) => {
          const s = { t: sch.title, amount: sch.amount, deadline: sch.deadline, n: sch.capacity, c: sch.color, crit: sch.criteria };
          return (
          <div key={i} className="card p-6"  style={{ borderRight: "3px solid " + s.c}}>
            <h4 className="mb-2"  style={{fontSize: 17}}>{s.t}</h4>
            <div className="mb-3.5"  style={{fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 700, color: s.c}}>{s.amount}</div>
            <div className="flex justify-between pb-3 mb-3"  style={{ borderBottom: "1px solid var(--line)", fontSize: 12}}>
              <span style={{ color: "var(--fg-mute)" }}>مهلت</span>
              <span style={{ fontFamily: "var(--f-mono)" }}>{s.deadline}</span>
            </div>
            <div className="flex justify-between mb-3.5"  style={{ fontSize: 12}}>
              <span style={{ color: "var(--fg-mute)" }}>ظرفیت</span>
              <span>{s.n}</span>
            </div>
            <div className="mono mb-2"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>شرایط</div>
            <ul className="pe-4.5"  style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.7}}>
              {s.crit.map(c => <li key={c}>{c}</li>)}
            </ul>
            <Button variant="primary" className="justify-center mt-4" style={{width: "100%"}}
              onClick={() => window.toast?.({ title: "درخواست ثبت شد", msg: `درخواست شما برای «${s.t}» در حال بررسی است.`, kind: "success" })}
              aria-label={"درخواست " + s.t}
            >درخواست</Button>
          </div>
          );
        })}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Wellness / Counseling
// =====================================================
export const WellnessPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="41 سلامت">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="mb-8" >
        <span className="eyebrow">WELLNESS · سلامت دانشجویی</span>
        <h1 className="h-1 mt-3" >سلامت ذهن و بدن</h1>
        <p className="lead mt-3"  style={{ maxWidth: 720}}>
          دانشجویی فشار خاص خودش رو داره. ما در کنارت هستیم — مشاوره روان‌شناختی، مدیریت استرس،
          همراه هوشمند برای روزهای سخت. همه چیز محرمانه.
        </p>
      </div>

      <div className="grid grid-3 gap-4 mb-8" >
        {[
          { ic: "headset", t: "مشاوره فردی", d: "جلسه‌ی محرمانه با روان‌شناس", cta: "رزرو جلسه", c: "var(--accent)", urgent: false },
          { ic: "users", t: "گروه‌های همتا", d: "گفتگو با هم‌دوره‌ای‌ها در فضای امن", cta: "ورود به گروه", c: "var(--navy)", urgent: false },
          { ic: "sparkle", t: "همراه AI ۲۴/۷", d: "گفتگوی محرمانه با AI آموزش‌دیده", cta: "شروع گفتگو", c: "var(--sage)", urgent: false },
          { ic: "pulse", t: "تست خودارزیابی", d: "PHQ-9 ، GAD-7 ، استرس", cta: "شروع تست", c: "var(--accent)", urgent: false },
          { ic: "calendar", t: "مدیریت زمان و خواب", d: "ابزارها و عادت‌سازی", cta: "شروع برنامه", c: "var(--navy)", urgent: false },
          { ic: "shield", t: "خط بحران ۲۴/۷", d: "اگر در شرایط بحرانی هستی", cta: "تماس فوری", c: "var(--gold)", urgent: true },
        ].map((s, i) => (
          <div key={i} className="card p-6"  style={{ border: s.urgent ? "1px solid var(--gold)" : "1px solid var(--line)"}}>
            <div className="rounded-xl grid mb-4"  style={{width: 44, height: 44, background: `color-mix(in oklch, ${s.c} 12%, var(--surface-2))`, color: s.c, placeItems: "center"}}>
              <Icon name={s.ic} size={20} />
            </div>
            <h4 style={{ fontSize: 17 }}>{s.t}</h4>
            <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6, margin: "8px 0 18px" }}>{s.d}</p>
            <button className={"justify-center " + " " + (s.urgent ? "btn btn-primary" : "btn btn-outline")}
               style={{width: "100%"}}
              onClick={() => {
                if (s.urgent) {
                  window.toast?.({ title: "خط بحران فعال است", msg: "اپراتور به‌زودی با شما تماس می‌گیرد.", kind: "danger", ttl: 6000 });
                } else if (s.t === "همراه AI ۲۴/۷" || s.t === "مشاوره فردی") {
                  go("messages");
                } else {
                  window.toast?.({ title: s.t, msg: s.d });
                }
              }}
              aria-label={s.cta}
            >{s.cta}</button>
          </div>
        ))}
      </div>

      <div className="card p-8" >
        <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>منابع</div>
        <div className="grid grid-2 gap-3.5" >
          {[
            "راهنمای مدیریت اضطراب امتحان",
            "تمرینات mindfulness ۵ دقیقه‌ای",
            "چگونه با اساتید گفتگوی سازنده داشته باشیم",
            "تکنیک‌های Pomodoro برای تمرکز",
            "خواب سالم برای دانشجویان",
            "مدیریت تعادل کار-تحصیل",
          ].map((t, i) => (
            <a
              key={i}
              className="card-flat flex items-center justify-between p-3.5 cursor-pointer"
              
              role="button"
              tabIndex={0}
              onClick={() => window.toast?.({ title: t, msg: "منبع آموزشی در آرشیو شخصی شما اضافه شد." })}
              onKeyDown={(e) => { if (e.key === "Enter") window.toast?.({ title: t, msg: "منبع آموزشی در آرشیو شخصی شما اضافه شد." }); }}
            >
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
export const AlumniPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="42 شبکه فارغ‌التحصیلان">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">ALUMNI · فارغ‌التحصیلان</span>
        <h1 className="h-1 mt-4" >شبکه‌ی فارغ‌التحصیلان</h1>
        <p className="lead mt-3.5"  style={{ maxWidth: 720}}>۱۲,۴۰۰ فارغ‌التحصیل در ۴۲ شهر و ۲۸ کشور. شبکه‌ای از مربی‌ها، همکاران و کارفرماهای آینده.</p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px" }}>
      <div className="grid grid-4 mb-10" >
        {[
          ["تعداد فارغ‌التحصیلان", "۱۲.۴K", "var(--accent)"],
          ["در شرکت‌های یونیکورن", "۲,۸۰۰", "var(--navy)"],
          ["در دانشگاه‌های جهان", "۱,۴۰۰", "var(--sage)"],
          ["میانگین حقوق ۳ سال بعد", "۸۲ م/ماه", "var(--gold)"],
        ].map(([l, v, c], i) => (
          <div key={i} className="card p-6" >
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em" }}>{l}</div>
            <div className="mt-2.5"  style={{fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 800, color: c}}>{v}</div>
          </div>
        ))}
      </div>

      <h3 className="h-3 mb-5" >یافتن مربی فارغ‌التحصیل</h3>
      <div className="grid grid-3">
        {ALUMNI.map((al, i) => {
          const a = { name: al.name, year: toFa(al.year), role: al.role, av: al.avatar, c: al.color, available: al.available, mentees: al.mentees };
          return (
          <div key={i} className="card p-6" >
            <div className="flex items-center gap-3.5 mb-3.5" >
              <div className={"relative " + " " + ("avatar " + a.c)}   style={{width: 52, height: 52, fontSize: 16}}>
                {a.av}
                {a.available && <span className="absolute"  style={{ bottom: 0, left: 0, width: 12, height: 12, borderRadius: 50, background: "var(--sage)", border: "2px solid var(--surface)"}}></span>}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</div>
                <div className="mono mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>دوره {a.year}</div>
              </div>
            </div>
            <p className="m-0"  style={{fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.5}}>{a.role}</p>
            <div className="flex justify-between pt-3.5 mt-3.5"  style={{ borderTop: "1px solid var(--line)"}}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{toFa(a.mentees)} mentee</span>
              <Button variant="outline" size="sm" disabled={!a.available}
                onClick={() => window.toast?.({ title: "درخواست منتورینگ ارسال شد", msg: `درخواست شما به ${a.name} ارسال شد.`, kind: "success" })}
                aria-label={"درخواست منتورینگ از " + a.name}
              >
                {a.available ? "درخواست منتورینگ" : "ظرفیت تکمیل"}
              </Button>
            </div>
          </div>
          );
        })}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Hackathons & Competitions
// =====================================================
export const HackathonsPage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="43 رقابت‌ها">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">HACKATHONS · رقابت‌ها</span>
        <h1 className="h-1 mt-4" >هکاتون‌ها و رقابت‌ها</h1>
        <p className="lead mt-3.5" >۱۲ رقابت فعال · جوایز کل ۲.۴ میلیارد تومان · فرصت‌های شغلی برای برترین‌ها</p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px" }}>
      {/* Featured */}
      <div className="card p-10 mb-8 grid gap-8 items-center"  style={{ gridTemplateColumns: "1fr 320px"}}>
        <div>
          <div className="flex gap-2 mb-3.5 flex-wrap" >
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>رقابت ویژه</span>
            <span className="pill" style={{ fontSize: 10 }}>تیم تا ۵ نفر</span>
            <span className="pill" style={{ fontSize: 10 }}>۴۸ ساعت</span>
          </div>
          <h2 className="h-1">هکاتون ملی AI سلامت ۱۴۰۵</h2>
          <p className="lead mt-3.5"  style={{ maxWidth: "100%"}}>
            ساخت ابزار AI برای کمک به پزشکان و بیماران. ۴۸ ساعت کار تیمی، با منتورینگ از متخصصان شیراز و mayoclinic.
          </p>
          <div className="flex gap-8 mt-7 flex-wrap" >
            <div><div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>جایزه اول</div><div className="mt-1"  style={{fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 800, color: "var(--accent)"}}>۸۰۰ م ت</div></div>
            <div><div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>تاریخ</div><div className="mt-1"  style={{fontSize: 16, fontWeight: 600}}>۲۸-۳۰ شهریور</div></div>
            <div><div className="mono" style={{ fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em" }}>ثبت‌نام تا</div><div className="mt-1"  style={{fontSize: 16, fontWeight: 600, color: "var(--gold)"}}>۲۰ شهریور</div></div>
          </div>
          <div className="flex gap-3 mt-6" >
            <Button variant="primary" size="lg" onClick={() => window.toast?.({ title: "ثبت‌نام تیم", msg: "فرم ثبت‌نام تیم در حال بارگذاری است.", kind: "info" })}
            >ثبت‌نام تیم</Button>
            <Button variant="outline" size="lg" onClick={() => go("community")}
            >یافتن هم‌تیمی</Button>
          </div>
        </div>
        <div className="rounded-2xl relative overflow-hidden p-6"  style={{aspectRatio: "1", background: "linear-gradient(135deg, oklch(0.3 0.14 25), oklch(0.5 0.18 30))"}}>
          <div className="absolute"  style={{ inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 16px)"}}></div>
          <div className="relative flex flex-col justify-between"  style={{ color: "white", height: "100%"}}>
            <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.1em" }}>HACK · 1405</div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>AI for</div>
              <div className="mt-1"  style={{fontFamily: "var(--f-display)", fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em"}}>HEALTH</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="h-3 mb-5" >رقابت‌های دیگر</h3>
      <div className="grid grid-3">
        {HACKATHONS.filter((h) => !h.featured).map((h, i) => {
          const c = { t: h.title, typ: h.kind, prize: h.prize, deadline: h.deadline, c: h.color };
          return (
          <div key={i} className="card p-5.5"  style={{ borderRight: "3px solid " + c.c}}>
            <span className="pill" style={{ fontSize: 10 }}>{c.typ}</span>
            <h4 className="mt-3"  style={{fontSize: 16}}>{c.t}</h4>
            <div className="mt-2"  style={{fontSize: 13, color: c.c, fontWeight: 600}}>{c.prize}</div>
            <div className="flex justify-between pt-3.5 mt-3.5"  style={{ borderTop: "1px solid var(--line)"}}>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>تا {c.deadline}</span>
              <Button variant="ghost" size="sm" onClick={() => window.toast?.({ title: c.t, msg: `${c.typ} · جایزه: ${c.prize} · مهلت: ${c.deadline}` })}
                aria-label={"جزئیات رقابت " + c.t}
              >جزئیات ←</Button>
            </div>
          </div>
          );
        })}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// =====================================================
// Honor Code / Academic Integrity
// =====================================================
export const HonorCodePage: React.FC<AcademicPageProps> = ({ go }) => (
  <main data-screen-label="44 منشور علمی">
    <section className="shell" style={{ padding: "60px 40px", maxWidth: 960 }}>
      <div className="mb-10" >
        <span className="eyebrow">HONOR CODE · منشور صداقت علمی</span>
        <h1 className="h-1 mt-3" >منشور صداقت علمی</h1>
        <p className="lead mt-3.5" >
          صداقت علمی پایه‌ی همه‌ی فعالیت‌های ما در دانشگاه برخط هوشمند ایران است. این منشور تعریف می‌کند چه چیزی پذیرفته است،
          چه چیزی نیست، و چه می‌شود اگر اشتباهی رخ دهد.
        </p>
      </div>

      <div className="card p-9 mb-6" >
        <h3 className="h-3 mb-4.5" >اصول اساسی</h3>
        <div className="flex flex-col gap-6" >
          {[
            { t: "صداقت در کار", d: "همه‌ی کار تحویلی متعلق به شما باشد، مگر آنکه صریحاً منبع آن ذکر شود. AI Tutor همراه شماست، نه جایگزین." },
            { t: "احترام به منبع", d: "هر فکر، کد یا متن که از دیگری گرفته‌اید را با ارجاع روشن مشخص کنید. این هم احترام و هم حفاظت از خودتان است." },
            { t: "آزمون فردی، آزمون فردی است", d: "در آزمون‌های اعتبارسنجی هویتی، استفاده از منابع خارجی یا کمک دیگری بدون مجوز تخلف است." },
            { t: "همکاری شفاف", d: "همکاری گروهی فوق‌العاده است — تا زمانی که در سرفصل تمرین مجاز اعلام شده باشد و مشارکت هر نفر روشن باشد." },
            { t: "گزارش‌گری شجاعانه", d: "اگر شاهد تخلفی هستید، گزارش بدهید. هویت شما محرمانه می‌ماند و انتقامی در کار نیست." },
          ].map((p, i) => (
            <div className="grid gap-4" key={i}  style={{ gridTemplateColumns: "30px 1fr"}}>
              <div className="mono" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{toFa("0" + (i + 1))}</div>
              <div>
                <h4 className="mb-1.5"  style={{fontSize: 16}}>{p.t}</h4>
                <p className="m-0"  style={{fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7}}>{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2 gap-4 mb-6" >
        <div className="card p-7"  style={{ borderRight: "3px solid var(--sage)"}}>
          <h3 className="h-3" style={{ color: "var(--sage)" }}>مجاز است ✓</h3>
          <ul className="pe-4.5 mt-3.5"  style={{ fontSize: 14, lineHeight: 1.9, color: "var(--fg-mute)"}}>
            <li>پرسش از AI Tutor درباره مفاهیم</li>
            <li>کار گروهی در پروژه‌های اعلام‌شده‌ی گروهی</li>
            <li>مشاوره با استاد در Office Hours</li>
            <li>استفاده از منابع برخط با ذکر منبع</li>
            <li>درخواست بازخورد دوستان قبل از تحویل</li>
            <li>کپی از کد خودتان از پروژه قبلی (با اطلاع)</li>
          </ul>
        </div>
        <div className="card p-7"  style={{ borderRight: "3px solid var(--gold)"}}>
          <h3 className="h-3" style={{ color: "var(--gold)" }}>تخلف است ✗</h3>
          <ul className="pe-4.5 mt-3.5"  style={{ fontSize: 14, lineHeight: 1.9, color: "var(--fg-mute)"}}>
            <li>کپی پاسخ کسی دیگر بدون اشاره</li>
            <li>پاسخ‌دهی به‌جای دیگری در آزمون</li>
            <li>تحویل کار AI به‌عنوان کار خود در آزمون</li>
            <li>دسترسی به سوالات آزمون پیش از زمان</li>
            <li>جعل داده‌های پژوهشی</li>
            <li>ارسال یک پروژه واحد در دو درس بدون مجوز</li>
          </ul>
        </div>
      </div>

      <div className="card p-9"  style={{ background: "var(--accent-soft)"}}>
        <h3 className="h-3">فرایند گزارش و اعتراض</h3>
        <p className="mt-3.5"  style={{fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7}}>
          هر گزارش تخلف به کمیته‌ی صداقت علمی ارجاع می‌شود. دانشجوی متهم فرصت پاسخ‌گویی و مدافع علمی دارد.
          هیچ تصمیمی نهایی نمی‌شود مگر با تأیید سه نفر از کمیته.
        </p>
        <div className="flex gap-3 mt-6" >
          <Button variant="primary" onClick={async () => {
              const ok = await window.confirmAction?.({
                title: "گزارش محرمانه",
                body: "این گزارش به کمیته‌ی صداقت علمی ارسال می‌شود. هویت شما محرمانه می‌ماند. ادامه می‌دهید؟",
                confirmLabel: "ارسال گزارش",
                cancelLabel: "انصراف",
              });
              if (ok) window.toast?.({ title: "گزارش ارسال شد", msg: "کمیته ظرف ۷۲ ساعت رسیدگی می‌کند.", kind: "success" });
            }}
          >گزارش محرمانه</Button>
          <Button variant="outline" onClick={async () => {
              const ok = await window.confirmAction?.({
                title: "امضای منشور صداقت علمی",
                body: "با امضای این منشور، تعهد می‌دهید همه‌ی اصول صداقت علمی را رعایت کنید.",
                confirmLabel: "امضا می‌کنم",
              });
              if (ok) window.toast?.({ title: "منشور امضا شد", msg: "تاریخ امضا در پروفایل شما ثبت شد.", kind: "success" });
            }}
          >امضای منشور</Button>
        </div>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

export default TranscriptPage;
