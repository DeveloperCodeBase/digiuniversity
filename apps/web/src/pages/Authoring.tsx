// Phase-A R2.5 — typed.
// =====================================================
// Course Authoring Studio — AI Planner + blueprint
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer, toFa } from "../shared";
import { Toggle, FormField } from "../components/widgets";
import { Button } from "../ui";
import type { Go } from "../router";

interface AuthoringPageProps { go: Go }

export const AuthoringPage: React.FC<AuthoringPageProps> = ({ go }) => {
  const [step, setStep] = React.useState<string>("blueprint");

  return (
    <main data-screen-label="13 استودیو">
      <section style={{ borderBottom: "1px solid var(--line)", padding: "32px 40px" }}>
        <div className="shell flex justify-between items-center p-0 flex-wrap gap-4" >
          <div>
            <div className="flex items-center gap-2.5 mb-2" >
              <span className="mono" style={{ color: "var(--fg-mute)" }}>کنسول استاد</span>
              <span style={{ color: "var(--fg-dim)" }}>/</span>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>دروس من</span>
              <span style={{ color: "var(--fg-dim)" }}>/</span>
              <span className="mono">پیش‌نویس جدید</span>
            </div>
            <h1 className="h-2">یادگیری تقویتی · سطح ارشد</h1>
          </div>
          <div className="flex gap-2" >
            <Button variant="ghost" onClick={() => { window.toast?.("پیش‌نمایش در پنجره جدید"); go("course"); }}
            ><Icon name="eye" size={14} />پیش‌نمایش</Button>
            <Button variant="outline" onClick={() => window.toast?.({ title: "پیش‌نویس ذخیره شد", msg: "تغییرات شما به‌صورت خودکار همگام شد.", kind: "success" })}
            ><Icon name="download" size={14} />ذخیره پیش‌نویس</Button>
            <Button variant="primary" onClick={async () => {
                const ok = await window.confirmAction?.({
                  title: "انتشار درس",
                  body: "پس از انتشار، درس به دانشجویان نمایش داده می‌شود. ادامه می‌دهید؟",
                  confirmLabel: "انتشار",
                });
                if (ok) window.toast?.({ title: "درس منتشر شد", msg: "همه‌ی دانشجویان درس را در کاتالوگ می‌بینند.", kind: "success" });
              }}
            >انتشار</Button>
          </div>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="shell flex gap-1"  style={{padding: "16px 40px"}}>
          {[
            ["blueprint", "Blueprint", "target"],
            ["outline", "سرفصل", "layers"],
            ["sessions", "جلسات", "calendar"],
            ["assessment", "ارزیابی", "check"],
            ["resources", "منابع", "folder"],
            ["agents", "عامل‌های AI", "sparkle"],
          ].map(([id, lbl, ic]) => (
            <button className="rounded-xl flex items-center gap-2 cursor-pointer" key={id} onClick={() => setStep(id)}  style={{padding: "10px 16px",
              background: step === id ? "var(--surface)" : "transparent",
              border: "1px solid " + (step === id ? "var(--line-2)" : "transparent"),
              color: step === id ? "var(--fg)" : "var(--fg-mute)",
              fontSize: 13,
              fontFamily: "inherit"}}>
              <Icon name={ic} size={14} />
              {lbl}
            </button>
          ))}
        </div>
      </section>

      <section className="shell" style={{ padding: "32px 40px" }}>
        <div className="grid gap-6"  style={{ gridTemplateColumns: "1fr 320px"}}>
          <div>
            {step === "blueprint" && <BlueprintStep />}
            {step === "outline" && <OutlineStep />}
            {step === "sessions" && <BlueprintStep />}
            {step === "assessment" && <BlueprintStep />}
            {step === "resources" && <BlueprintStep />}
            {step === "agents" && <AgentsStep />}
          </div>

          {/* AI planner side */}
          <aside className="sticky flex flex-col gap-4"  style={{ top: 90, alignSelf: "start"}}>
            <div className="card p-5"  style={{ background: "linear-gradient(135deg, color-mix(in oklch, var(--violet) 12%, var(--surface)), var(--surface))"}}>
              <div className="flex items-center gap-2.5 mb-3.5"  style={{ color: "var(--violet)"}}>
                <Icon name="sparkle" size={16} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>AI COURSE PLANNER</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
                می‌توانم برای این درس، ۱۲ جلسه با اهداف یادگیری، نقشه‌ی مفهومی و کوییز پیشنهاد بدهم. شما نهایی می‌کنید.
              </p>
              <Button variant="outline" className="justify-center mt-3.5" style={{width: "100%"}}
                onClick={() => window.toast?.({ title: "AI در حال تولید", msg: "ساختار اولیه‌ی درس در ۲۰ ثانیه آماده می‌شود…", kind: "info", ttl: 5000 })}
              >
                <Icon name="bolt" size={13} />
                تولید پیشنهاد اولیه
              </Button>
            </div>

            <div className="card p-5" >
              <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>ARCHIVES TO PULL FROM</div>
              <ul className="p-0 m-0 flex flex-col gap-2"  style={{listStyle: "none"}}>
                {[
                  ["مقاله Sutton & Barto", "PDF · ۵۲۰ صفحه"],
                  ["دوره قدیمی RL ۱۴۰۳", "۱۸ جلسه ضبط‌شده"],
                  ["یادداشت‌های استاد", "Markdown · ۱۲ فایل"],
                  ["بانک سوال موجود", "۲۳۴ سوال QTI"],
                ].map(([t, m]) => (
                  <li className="flex justify-between" key={t}  style={{ padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 12}}>
                    <span>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--fg-mute)" }}>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5" >
              <div className="mono mb-3"  style={{color: "var(--amber)", fontSize: 11, letterSpacing: "0.08em"}}>
                <Icon name="shield" size={12} /> SAFETY POLICY
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                هیچ محتوای تولیدی بدون تأیید نهایی استاد منتشر نمی‌شود. منبع هر پیشنهاد قابل ردیابی است.
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const BlueprintStep = () => (
  <div>
    <div className="card p-8 mb-5" >
      <h3 className="h-3 mb-6" >Course Blueprint</h3>
      <div className="grid gap-4.5"  style={{ gridTemplateColumns: "1fr 1fr"}}>
        <FormField label="عنوان فارسی" placeholder="یادگیری تقویتی" />
        <FormField label="عنوان انگلیسی" placeholder="Reinforcement Learning" />
        <FormField label="کد درس" placeholder="CS-650" mono />
        <FormField label="سطح" placeholder="ارشد" />
        <FormField label="تعداد ماژول" placeholder="۱۲" mono />
        <FormField label="مدت زمان" placeholder="۱۰ هفته" />
      </div>
      <div className="mt-6" >
        <div className="mono mb-2 uppercase"  style={{color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.1em"}}>توضیحات</div>
        <textarea className="rounded-xl resize-y" placeholder="درس یادگیری تقویتی، اصول و الگوریتم‌های یادگیری از تجربه را پوشش می‌دهد..." rows={4}  style={{width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)",
          padding: "12px 14px", color: "var(--fg)", fontFamily: "inherit", fontSize: 14, direction: "rtl"}} />
      </div>
    </div>

    <div className="card p-8" >
      <h3 className="h-3 mb-4.5" >Learning Outcomes</h3>
      <p className="mb-5"  style={{color: "var(--fg-mute)", fontSize: 13}}>تا پایان این درس، دانشجو می‌تواند:</p>
      <div className="flex flex-col gap-2.5" >
        {[
          "مسئله را در قالب MDP فرموله کند",
          "معادله بلمن را برای یک محیط ساده حل کند",
          "Q-Learning را از صفر در Python پیاده‌سازی کند",
          "تفاوت روش‌های on-policy و off-policy را توضیح دهد",
          "یک پروژه RL واقعی روی محیط Gym انجام دهد",
        ].map((o, i) => (
          <div className="flex items-center gap-3 p-3.5 rounded-xl" key={i}  style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
            <div className="rounded-lg grid"  style={{width: 28, height: 28, background: "var(--surface-3)", color: "var(--cyan)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700}}>
              LO{toFa(i + 1)}
            </div>
            <span className="flex-1"  style={{ fontSize: 14}}>{o}</span>
            <span className="pill" style={{ fontSize: 10 }}>{["یادآوری", "فهم", "کاربرد", "تحلیل", "ساختن"][i]}</span>
          </div>
        ))}
        <Button variant="ghost" style={{ alignSelf: "flex-start" }}
          onClick={() => window.toast?.({ title: "هدف یادگیری جدید", msg: "هدف به فهرست اضافه شد." })}
        >
          <Icon name="plus" size={14} />
          افزودن هدف یادگیری
        </Button>
      </div>
    </div>
  </div>
);

const OutlineStep = () => (
  <div className="studio-canvas">
    <h3 className="h-3 mb-5" >سرفصل · ۱۲ جلسه</h3>
    {[
      ["جلسه ۱", "مقدمه — تاریخچه و کاربردهای RL", "MDP, Bandit"],
      ["جلسه ۲", "فرآیندهای تصمیم مارکوف", "MDP, Policy"],
      ["جلسه ۳", "معادله بلمن", "Value Function, DP"],
      ["جلسه ۴", "روش‌های مونت‌کارلو", "MC Control"],
      ["جلسه ۵", "TD Learning · Q-Learning", "TD(0), SARSA"],
      ["جلسه ۶", "تابع تقریب — DQN", "Neural Networks"],
      ["جلسه ۷", "Policy Gradient", "REINFORCE"],
      ["جلسه ۸", "Actor-Critic, PPO", "A2C, PPO"],
    ].map(([n, t, tags], i) => (
      <div key={n} className="studio-block">
        <span className="handle">⋮⋮</span>
        <div>
          <div className="flex items-center gap-2.5 mb-1" >
            <span className="mono" style={{ color: "var(--cyan)", fontSize: 11 }}>{n}</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t}</span>
          </div>
          <div className="flex gap-1.5" >
            {tags.split(", ").map((tag) => <span key={tag} className="pill" style={{ fontSize: 9 }}>{tag}</span>)}
          </div>
        </div>
        <div className="flex gap-1" >
          <Button variant="ghost" size="sm" className="icon-btn" onClick={() => window.toast?.({ title: n, msg: t })}
            aria-label={"تنظیمات " + n}
            title="تنظیمات جلسه"
          ><Icon name="settings" size={13} /></Button>
        </div>
      </div>
    ))}
    <Button variant="outline" className="justify-center mt-3" style={{width: "100%"}}
      onClick={() => window.toast?.({ title: "جلسه‌ی جدید اضافه شد", kind: "success" })}
    >
      <Icon name="plus" size={14} />افزودن جلسه
    </Button>
  </div>
);

const AgentsStep = () => (
  <div className="card p-8" >
    <h3 className="h-3 mb-2" >سیاست عامل‌های AI برای این درس</h3>
    <p className="mb-6"  style={{color: "var(--fg-mute)", fontSize: 13}}>
      تعریف کنید هر عامل چه کارهایی مجاز است، از چه منابعی استفاده کند و کجا نیاز به تأیید انسانی دارد.
    </p>

    <div className="flex flex-col gap-3" >
      {[
        { name: "TUTOR — توضیح‌دهنده", role: "پاسخ به سوال دانشجو با مرجع داخلی", color: "var(--cyan)", on: true, controls: ["RAG", "ارجاع به ویدئو", "توضیح چندسطحی"] },
        { name: "COACH — مربی پرسش‌گر", role: "پرسیدن سوال کاوشی به‌جای پاسخ مستقیم", color: "var(--amber)", on: true, controls: ["پرسش کاوشگرانه", "feedback constructive"] },
        { name: "CRITIC — منتقد", role: "چالش فرضیات و یافتن خطاهای استدلال", color: "var(--violet)", on: false, controls: ["Critique mode"] },
        { name: "MENTOR — منتور بلندمدت", role: "راهنمایی مسیر یادگیری و انگیزشی", color: "var(--rose)", on: true, controls: ["Long-term plan", "Motivation"] },
        { name: "GRADER — ارزیاب", role: "نمره‌دهی اولیه با rubric · نیاز به تأیید", color: "var(--fg-mute)", on: true, controls: ["Rubric scoring", "تأیید استاد الزامی"] },
      ].map((a) => (
        <div className="p-5 rounded-xl" key={a.name}  style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
          <div className="flex justify-between items-center mb-2.5" >
            <div className="flex items-center gap-3" >
              <span style={{ width: 8, height: 8, borderRadius: 50, background: a.color, boxShadow: `0 0 10px ${a.color}` }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</span>
            </div>
            <Toggle on={a.on} />
          </div>
          <div className="mb-3"  style={{fontSize: 13, color: "var(--fg-mute)"}}>{a.role}</div>
          <div className="flex gap-1.5 flex-wrap" >
            {a.controls.map((c) => <span key={c} className="pill" style={{ fontSize: 10 }}>{c}</span>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);


export default AuthoringPage;
