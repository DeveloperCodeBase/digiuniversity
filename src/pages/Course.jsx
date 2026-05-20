// =====================================================
// Course detail page — with AI tutor inline + outline
// =====================================================
import React from "react";
import { Icon } from "../icons.jsx";
import { Footer, toFa } from "../shared.jsx";

export const CoursePage = ({ go }) => {
  const [activeModule, setActiveModule] = React.useState(2);

  return (
    <main data-screen-label="05 درس">
      {/* hero band */}
      <section className="relative"  style={{
        padding: "60px 0 40px",
        borderBottom: "1px solid var(--line)",
        background: "linear-gradient(180deg, color-mix(in oklch, var(--cyan) 8%, var(--bg)) 0%, var(--bg) 100%)"}}>
        <div className="shell">
          <div className="flex items-center gap-2.5 mb-4.5" >
            <span className="mono" style={{ color: "var(--fg-mute)" }}>برنامه‌ها</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono" style={{ color: "var(--fg-mute)" }}>علوم داده</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono">CS-410</span>
          </div>
          <div className="grid gap-12 items-end"  style={{ gridTemplateColumns: "1.6fr 1fr"}}>
            <div>
              <span className="eyebrow">CORE COURSE · MASTERY-BASED</span>
              <h1 className="h-display mt-3.5"  style={{ fontSize: "clamp(40px, 5.5vw, 84px)"}}>مبانی یادگیری ماشین</h1>
              <p className="lead mt-5" >
                از شهود آماری تا شبکه‌های عمیق. ۱۲ هفته، ۲۴ ماژول، ۸۴ تمرین تطبیقی. با گراف دانش زنده و دستیار شخصی.
              </p>
              <div className="flex gap-2 mt-5 flex-wrap" >
                <span className="pill pill-cyan">۱۲ هفته</span>
                <span className="pill">۲۴ ماژول</span>
                <span className="pill">۸۴۳ دانشجو فعال</span>
                <span className="pill pill-amber">گواهی VC</span>
                <span className="pill">QTI · xAPI</span>
              </div>
              <div className="flex gap-3 mt-8" >
                <button className="btn btn-primary btn-lg" onClick={() => go("classroom")}>
                  <Icon name="play" size={14} />
                  ادامه از ماژول ۸
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => go("library")}>
                  <Icon name="folder" size={14} />
                  منابع درس
                </button>
              </div>
            </div>

            {/* Right — Instructor card */}
            <div className="card">
              <div className="flex items-center gap-3.5 mb-4.5" >
                <div className="avatar cyan" style={{ width: 60, height: 60 }}>AA</div>
                <div>
                  <div className="mono mb-1"  style={{color: "var(--fg-mute)"}}>INSTRUCTOR</div>
                  <div style={{ fontWeight: 600 }}>دکتر آرش عظیمی</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>دانشکده علوم رایانه</div>
                </div>
              </div>
              <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }}></div>
              <div className="grid gap-4"  style={{ gridTemplateColumns: "1fr 1fr 1fr"}}>
                <div><div className="mono mb-1"  style={{color: "var(--fg-dim)", fontSize: 10}}>RATING</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 18 }}>۴.۹</div></div>
                <div><div className="mono mb-1"  style={{color: "var(--fg-dim)", fontSize: 10}}>STUDENTS</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 18 }}>۲.۱K</div></div>
                <div><div className="mono mb-1"  style={{color: "var(--fg-dim)", fontSize: 10}}>COURSES</div><div style={{ fontFamily: "var(--f-mono)", fontWeight: 600, fontSize: 18 }}>۸</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="shell" style={{ padding: "60px 40px" }}>
        <div className="grid gap-8"  style={{ gridTemplateColumns: "1fr 360px"}}>
          {/* outline */}
          <div>
            <div className="flex items-baseline justify-between mb-5" >
              <h2 className="h-2">نقشه‌ی درس</h2>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>۷ / ۲۴ ماژول کامل</span>
            </div>

            {/* Progress bar overall */}
            <div className="rounded-full overflow-hidden mb-8"  style={{height: 6, background: "var(--surface-2)"}}>
              <div className="rounded-full"  style={{height: "100%", width: "32%", background: "linear-gradient(90deg, var(--cyan-dim), var(--cyan))"}}></div>
            </div>

            <div className="flex flex-col gap-2.5" >
              {MODULES.map((m, i) => (
                <ModuleRow key={i} module={m} idx={i} active={activeModule === i} onClick={() => setActiveModule(i)} />
              ))}
            </div>
          </div>

          {/* Sidebar AI tutor + outcomes */}
          <aside className="sticky flex flex-col gap-4"  style={{ top: 90, alignSelf: "start"}}>
            <div className="card p-5" >
              <div className="flex items-center gap-2 mb-3.5"  style={{ color: "var(--cyan)"}}>
                <Icon name="target" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>LEARNING OUTCOMES</span>
              </div>
              <ul className="p-0 m-0 flex flex-col gap-2.5"  style={{listStyle: "none"}}>
                {[
                  ["پیش‌بینی با مدل‌های خطی", true],
                  ["ارزیابی صحت و سوگیری مدل", true],
                  ["انتخاب الگوریتم برای مسئله", true],
                  ["پیاده‌سازی شبکه عصبی پایه", false],
                  ["تنظیم hyperparameter", false],
                  ["ساخت یک پروژه پایان دوره", false],
                ].map(([t, done], i) => (
                  <li className="flex items-center gap-2.5" key={i}  style={{ fontSize: 13, color: done ? "var(--fg)" : "var(--fg-mute)"}}>
                    <span className="grid"  style={{width: 18, height: 18, borderRadius: 50, background: done ? "var(--cyan)" : "var(--surface-3)", color: "#051418", placeItems: "center", flexShrink: 0}}>
                      {done && <Icon name="check" size={11} stroke={3} />}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5" >
              <div className="flex items-center gap-2 mb-3.5"  style={{ color: "var(--violet)"}}>
                <Icon name="sparkle" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>AI TUTOR · PERSONAL</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                دستیار درس می‌داند کجای راه هستی. می‌توانی هر لحظه بپرسی، تمرین جبرانی بخواهی یا یک ویدئوی مرتبط را پیدا کنی.
              </p>
              <button
                className="btn btn-outline mt-4 justify-center"
                 style={{width: "100%"}}
                onClick={() => go("classroom")}
              >
                <Icon name="chat" size={14} />
                شروع گفتگو
              </button>
            </div>

            <div className="card p-5"  style={{ background: "linear-gradient(135deg, color-mix(in oklch, var(--amber) 12%, var(--surface)), var(--surface))"}}>
              <div className="flex items-center gap-2 mb-3.5"  style={{ color: "var(--amber)"}}>
                <Icon name="trophy" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>NEXT MILESTONE</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>گواهی میانی · بهینه‌سازی</div>
              <div className="mt-1.5"  style={{fontSize: 12, color: "var(--fg-mute)"}}>۲ ماژول دیگر تا دریافت</div>
              <button className="btn btn-amber btn-sm mt-4 justify-center"  style={{ width: "100%"}} onClick={() => go("credential")}>
                مشاهده پیش‌نمایش
              </button>
            </div>
          </aside>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const ModuleRow = ({ module, idx, active, onClick }) => {
  const status = module.status; // done / current / locked
  return (
    <div className="grid gap-4.5 p-4.5 rounded-2xl items-center cursor-pointer"
      onClick={onClick}
       style={{
        gridTemplateColumns: "60px 1fr auto auto",
        background: active ? "color-mix(in oklch, var(--cyan) 8%, var(--surface))" : "var(--surface)",
        border: "1px solid " + (active ? "color-mix(in oklch, var(--cyan) 40%, var(--line))" : "var(--line)"),
        transition: "140ms ease"}}
    >
      <div className="rounded-xl grid"  style={{width: 44, height: 44,
        background: status === "done" ? "var(--cyan)" : status === "current" ? "color-mix(in oklch, var(--cyan) 20%, var(--surface-3))" : "var(--surface-2)",
        color: status === "done" ? "#051418" : "var(--fg-mute)", placeItems: "center",
        fontFamily: "var(--f-mono)", fontWeight: 700}}>
        {status === "done" ? <Icon name="check" size={18} stroke={2.5} /> : status === "locked" ? <Icon name="lock" size={16} /> : toFa(idx + 1)}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{module.title}</div>
        <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{module.sub}</div>
      </div>
      <div className="flex gap-1.5" >
        {module.kinds.map((k, i) => (
          <span className="rounded" key={i}  style={{fontFamily: "var(--f-mono)",
            fontSize: 10,
            padding: "3px 8px",
            border: "1px solid var(--line)",
            color: "var(--fg-mute)"}}>{k}</span>
        ))}
      </div>
      <div className="text-left"  style={{fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)", minWidth: 70}}>
        {module.duration}
      </div>
    </div>
  );
};

const MODULES = [
  { title: "آشنایی با یادگیری ماشین", sub: "تاریخچه، تعاریف، انواع مسئله", status: "done", kinds: ["ویدئو", "خواندنی", "کوییز"], duration: "۴۵ دقیقه" },
  { title: "ریاضیات لازم برای ML", sub: "جبر خطی، احتمالات، حساب دیفرانسیل", status: "done", kinds: ["ویدئو ×۳", "تمرین ×۸"], duration: "۲ ساعت" },
  { title: "رگرسیون خطی و logistic", sub: "از فرضیه تا cost function و آزمون", status: "current", kinds: ["لایو", "کدنویسی", "آزمون"], duration: "۱.۵ ساعت" },
  { title: "بهینه‌سازی · گرادیان نزولی", sub: "SGD، مومنتوم، Adam، نرخ یادگیری", status: "current", kinds: ["لایو", "شبیه‌سازی"], duration: "۱.۵ ساعت" },
  { title: "اعتبارسنجی و انتخاب مدل", sub: "k-fold، bias-variance، regularization", status: "locked", kinds: ["ویدئو", "تمرین"], duration: "۱ ساعت" },
  { title: "درخت تصمیم و جنگل تصادفی", sub: "از ID3 تا XGBoost", status: "locked", kinds: ["ویدئو", "پروژه"], duration: "۲ ساعت" },
  { title: "شبکه عصبی · مقدمات", sub: "perceptron، backprop، توابع فعال‌سازی", status: "locked", kinds: ["ویدئو", "کدنویسی"], duration: "۲ ساعت" },
  { title: "CNN برای بینایی", sub: "کانولوشن، pooling، architectures کلاسیک", status: "locked", kinds: ["لایو", "پروژه"], duration: "۲.۵ ساعت" },
];

export default CoursePage;
