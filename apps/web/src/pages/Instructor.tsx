// Phase-A R2.5 — typed.
// =====================================================
// Instructor Console
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { toFa } from "../shared";
import { Button } from "../ui";
// Phase-14.7 R2: sidebar + footer come from Layout (router.tsx).
import type { Go } from "../router";

interface InstructorPageProps { go: Go }

export const InstructorPage: React.FC<InstructorPageProps> = ({ go }) => {
  return (
    <main data-screen-label="06 کنسول استاد">
      <div className="dash-main">
          <div className="dash-greet">
            <div>
              <span className="eyebrow">INSTRUCTOR CONSOLE</span>
              <h1 className="mt-2.5" >دکتر عظیمی، کلاسِ ساعت ۱۴ نیاز به بازبینی دارد</h1>
              <p className="muted">۳ هشدار آموزشی · ۸ پاسخ AI در انتظار تأیید · ۲ تمرین برای تصحیح نهایی.</p>
            </div>
            <Button variant="primary" onClick={() => go("classroom")}>
              ورود به کنسول کلاس
              <Icon name="arrow" size={14} />
            </Button>
          </div>

          {/* Class health */}
          <div className="card p-8" >
            <div className="flex justify-between items-baseline mb-5" >
              <div>
                <span className="eyebrow">CLASS HEALTH · CS-410</span>
                <h2 className="h-2 mt-2.5" >سلامت کلاس · جلسه ۸</h2>
              </div>
              <span className="pill pill-amber"><Icon name="bolt" size={11} />۲ هشدار</span>
            </div>

            <div className="grid grid-4 mb-8" >
              <HealthCard l="مشارکت" v="۸۲٪" status="ok" desc="بالاتر از میانگین ترم" />
              <HealthCard l="فهم محتوا" v="۶۴٪" status="warn" desc="افت ۱۲ نمره از جلسه قبل" />
              <HealthCard l="سرعت تدریس" v="بالا" status="warn" desc="۹۴ کلمه/دقیقه — کمی کند کنید" />
              <HealthCard l="پرسش‌گری" v="۲۳" status="ok" desc="۲ خوشه‌ی فعال" />
            </div>

            {/* Coach suggestions */}
            <div className="p-5 rounded-2xl"  style={{
              background: "color-mix(in oklch, var(--violet) 8%, var(--surface-2))",
              border: "1px solid color-mix(in oklch, var(--violet) 30%, transparent)"}}>
              <div className="flex items-center gap-2.5 mb-3.5"  style={{ color: "var(--violet)"}}>
                <Icon name="sparkle" size={16} />
                <span className="mono" style={{ letterSpacing: "0.1em" }}>AI COACH SUGGESTIONS · ۳ پیشنهاد</span>
              </div>
              <div className="flex flex-col gap-2.5" >
                {[
                  ["در ۲ دقیقه‌ی بعدی یک مقایسه‌ی کوتاه بین مومنتوم و Adam ارائه دهید — ۳ سوال مشابه در چت ثبت شده.", true],
                  ["نسرین و ۴ نفر دیگر روی این مفهوم گیر کرده‌اند. یک مثال عددی ساده پیشنهاد می‌شود.", false],
                  ["سرعت بیان شما در ۵ دقیقه‌ی اخیر ۱۸٪ بیشتر از میانگین است. مکث کوتاه پیشنهاد می‌شود.", false],
                ].map(([t, accepted], i) => (
                  <div className="flex gap-3 p-3.5 rounded-xl" key={i}  style={{ background: "var(--surface)", border: "1px solid var(--line)"}}>
                    <div className="flex-1"  style={{ fontSize: 13, lineHeight: 1.6}}>{t}</div>
                    <div className="flex gap-1.5" >
                      {accepted ? (
                        <span className="pill pill-cyan" style={{ fontSize: 10 }}>پذیرفته شد</span>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => window.toast?.({ title: "پیشنهاد پذیرفته شد", msg: "این پیشنهاد در نقشه‌ی درس اعمال شد.", kind: "success" })}
                          >پذیرش</Button>
                          <Button variant="ghost" size="sm" onClick={() => window.toast?.("به فهرست بعداً منتقل شد")}
                          >بعداً</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI review queue + cohort */}
          <div className="grid gap-6"  style={{gridTemplateColumns: "1.4fr 1fr"}}>
            <div>
              <div className="flex justify-between items-baseline mb-4" >
                <h3 className="h-3">صف بازبینی خروجی AI</h3>
                <span className="mono" style={{ color: "var(--fg-mute)" }}>۸ مورد در انتظار</span>
              </div>
              <div className="flex flex-col gap-2.5" >
                {[
                  { kind: "خلاصه پساکلاس", agent: "TUTOR", title: "خلاصه جلسه ۷ — اعتبارسنجی متقاطع", risk: "low", srcs: 5 },
                  { kind: "کوییز تولیدی", agent: "COACH", title: "۸ سوال چندگزینه‌ای بهینه‌سازی", risk: "med", srcs: 3 },
                  { kind: "بازخورد تمرین", agent: "GRADER", title: "نمره پیشنهادی تمرین ۴ نسرین — ۸۷/۱۰۰", risk: "low", srcs: 1 },
                  { kind: "پاسخ FAQ", agent: "MENTOR", title: "تفاوت overfitting و underfitting در RNN", risk: "high", srcs: 7 },
                ].map((r, i) => (
                  <div key={i} className="card-flat grid gap-4 items-center"  style={{ gridTemplateColumns: "auto 1fr auto auto"}}>
                    <div className="rounded-xl grid"  style={{width: 36, height: 36,
                      background: "color-mix(in oklch, var(--violet) 15%, var(--surface-3))",
                      color: "var(--violet)", placeItems: "center",
                      fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 10}}>{r.agent.slice(0, 3)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 3 }}>{r.kind} · {toFa(r.srcs)} منبع</div>
                    </div>
                    <span className={"pill " + (r.risk === "high" ? "pill-rose" : r.risk === "med" ? "pill-amber" : "pill-cyan")} style={{ fontSize: 10 }}>
                      ریسک {r.risk === "high" ? "بالا" : r.risk === "med" ? "متوسط" : "کم"}
                    </span>
                    <div className="flex gap-1.5" >
                      <Button variant="ghost" size="sm" className="icon-btn" onClick={() => window.toast?.({ title: r.title, msg: `${r.kind} · ایجنت: ${r.agent}` })}
                        aria-label={"پیش‌نمایش " + r.title}
                        title="پیش‌نمایش"
                      ><Icon name="eye" size={13} /></Button>
                      <Button variant="outline" size="sm" onClick={() => window.toast?.({ title: "تأیید شد", msg: r.title + " منتشر شد.", kind: "success" })}
                        aria-label={"تأیید " + r.title}
                      >تأیید</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cohort intervention */}
            <div>
              <div className="flex justify-between items-baseline mb-4" >
                <h3 className="h-3">دانشجویان در معرض ریسک</h3>
                <span className="mono" style={{ color: "var(--rose)" }}>۳ نفر</span>
              </div>
              <div className="flex flex-col gap-2.5" >
                {[
                  { name: "مهسا کوهی", id: "84-7723", risk: 0.68, reason: "افت تعامل + غیبت ۲ جلسه", av: "MK", cls: "rose" },
                  { name: "بهنام رضوی", id: "84-9112", risk: 0.54, reason: "۴ کوییز پشت سر هم زیر ۵۰٪", av: "BR", cls: "amber" },
                  { name: "ساغر فرجی", id: "84-2056", risk: 0.48, reason: "تأخیر مکرر در تحویل تمرین", av: "SF", cls: "amber" },
                ].map((s, i) => (
                  <div key={i} className="card-flat flex items-center gap-3.5" >
                    <div className={"avatar " + s.cls}>{s.av}</div>
                    <div className="flex-1"  style={{ minWidth: 0}}>
                      <div className="flex justify-between mb-1.5" >
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--rose)" }}>ریسک {toFa(Math.round(s.risk * 100))}٪</div>
                      </div>
                      <div className="rounded-full overflow-hidden"  style={{height: 3, background: "var(--surface-3)"}}>
                        <div className="rounded-full"  style={{width: (s.risk * 100) + "%", height: "100%", background: "var(--rose)"}}></div>
                      </div>
                      <div className="mt-1.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>{s.reason}</div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="justify-center" style={{width: "100%"}}
                  onClick={() => { go("messages"); window.toast?.({ title: "آماده‌ی ارسال", msg: "۳ دانشجو در گفتگوی گروهی اضافه شدند." }); }}
                >
                  ارسال پیام شخصی به همه
                </Button>
              </div>
            </div>
          </div>

          {/* Course Authoring Studio teaser */}
          <div className="card p-10 relative overflow-hidden" >
            <div className="absolute"  style={{ inset: 0, background: "radial-gradient(800px 300px at 80% 50%, color-mix(in oklch, var(--cyan) 14%, transparent), transparent 70%)", pointerEvents: "none"}} />
            <div className="relative grid gap-10 items-center"  style={{ gridTemplateColumns: "1.2fr 1fr"}}>
              <div>
                <span className="eyebrow">COURSE AUTHORING STUDIO</span>
                <h2 className="h-2 mt-3.5" >از یک ایده، تا یک درس کامل — در ۴۵ دقیقه</h2>
                <p className="mt-3.5"  style={{color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7}}>
                  AI Course Planner ساختار اولیه، اهداف یادگیری و نقشه‌ی مفهومی را پیشنهاد می‌دهد. شما تأیید، اصلاح یا رد می‌کنید. خروجی، یک Course Blueprint استاندارد است.
                </p>
                <div className="flex gap-3 mt-7" >
                  <Button variant="primary" onClick={() => go("authoring")}>
                    <Icon name="plus" size={14} />
                    شروع درس جدید
                  </Button>
                  <Button variant="outline" onClick={() => window.toast?.({ title: "قالب‌های آماده", msg: "۸ قالب درسی در دسترس است." })}
                  >
                    <Icon name="file" size={14} />
                    قالب‌ها
                  </Button>
                </div>
              </div>
              <div className="card-flat p-5" >
                <div className="mono mb-3.5"  style={{color: "var(--fg-mute)"}}>BLUEPRINT · DRAFT</div>
                {[
                  ["موضوع", "یادگیری تقویتی"],
                  ["سطح", "ارشد"],
                  ["مدت", "۱۰ هفته"],
                  ["پیش‌نیاز", "احتمالات، Python"],
                ].map(([k, v], i) => (
                  <div className="flex justify-between" key={i}  style={{ padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none"}}>
                    <span style={{ fontSize: 13, color: "var(--fg-mute)" }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div className="flex gap-1.5 mt-3.5 flex-wrap" >
                  {["MDP", "Bellman", "Q-Learning", "PPO", "Actor-Critic"].map((t) => (
                    <span key={t} className="pill">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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

const HealthCard = ({ l, v, status, desc }: { l: string; v: React.ReactNode; status: string; desc: string }) => {
  const color = status === "ok" ? "var(--cyan)" : status === "warn" ? "var(--amber)" : "var(--rose)";
  return (
    <div className="card-flat p-5"  style={{ borderColor: color + "40"}}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.08em" }}>{l}</div>
      <div className="mt-1.5"  style={{fontFamily: "var(--f-mono)", fontSize: 32, fontWeight: 700, color: color}}>{v}</div>
      <div className="mt-1.5"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{desc}</div>
    </div>
  );
};

export default InstructorPage;
