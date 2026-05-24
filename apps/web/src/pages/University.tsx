// Phase-A R2.8 — typed.
// =====================================================
// Schools / Faculties / Programs — full university structure
// Virtual Lab — simulation environment
// Research — PhD / thesis
// =====================================================

// =====================================================
// Schools — top-level faculty landing
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer, toFa } from "../shared";
import { SCHOOLS as SCHOOLS_DATA, PROGRAMS, LABS as LABS_DATA, DEGREE_LEVELS } from "../data.js";
import { Button } from "../ui";
import type { Go } from "../router";

interface UniPageProps { go: Go }
interface VirtualLabPageProps { go: Go; labId?: string }

// Compose page-shape from data: include 3 featured programs per school.
const SCHOOLS = SCHOOLS_DATA.map((s) => ({
  ...s,
  featured: PROGRAMS.filter((p) => p.school === s.id).slice(0, 3).map((p) => ({
    t: p.title,
    lvl: p.level === "MS" ? "ارشد" : p.level === "PHD" ? "دکتری" : p.level === "BS" ? "کارشناسی" : p.level === "MD" ? "M.D" : p.level === "CERT" ? "حرفه‌ای" : p.level === "AS" ? "کاردانی" : p.level,
    dur: p.duration,
  })),
}));

export const SchoolsPage: React.FC<UniPageProps> = ({ go }) => {
  return (
    <main data-screen-label="26 دانشکده‌ها">
      <section style={{ padding: "80px 0 40px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <span className="eyebrow">SCHOOLS · ۸ دانشکده · ۲۴۸ برنامه</span>
          <h1 className="h-display mt-4.5"  style={{ fontSize: "clamp(40px, 5vw, 80px)"}}>
            یک دانشگاه کامل،<br />
            <span className="italic"  style={{color: "var(--accent)"}}>تمام دیجیتال</span>
          </h1>
          <p className="lead mt-5"  style={{ maxWidth: 680}}>
            از مهندسی و علوم پزشکی تا علوم انسانی و هنر. ۲۴۸ برنامه‌ی آکادمیک در ۵ مقطع — همگی با کلاس زنده، آزمایشگاه مجازی، و گواهی قابل اثبات.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "60px 40px" }}>
        <div className="grid grid-2 gap-5" >
          {SCHOOLS.map((s, i) => (
            <div
              key={s.id}
              className="card p-8 cursor-pointer"
              role="link"
              tabIndex={0}
              aria-label={`دانشکده ${s.name} · ${s.programs} برنامه`}
              onClick={() => go("programs")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("programs"); } }}
            >
              <div className="flex justify-between mb-4.5" >
                <span className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em" }}>{toFa("0" + (i + 1))}/۰۸ · {s.code}</span>
                <span className="pill" style={{ fontSize: 10 }}>{toFa(s.programs)} برنامه</span>
              </div>
              <h2 className="h-2 mb-2.5" >{s.name}</h2>
              <p className="mb-6"  style={{fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7}}>{s.desc}</p>

              <div className="flex flex-col gap-2.5" >
                <div className="mono uppercase"  style={{color: "var(--fg-dim)", fontSize: 10, letterSpacing: "0.1em"}}>برنامه‌های شاخص</div>
                {s.featured.map((f, j) => (
                  <div className="flex justify-between items-center" key={j}  style={{ padding: "10px 0", borderTop: "1px solid var(--line)"}}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{f.t}</div>
                      <div className="mt-0.5"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>{f.lvl} · {f.dur}</div>
                    </div>
                    <Icon name="arrow" size={14} stroke={2} />
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-5 flex justify-between items-center"  style={{ borderTop: "1px solid var(--line)"}}>
                <div className="flex gap-4.5"  style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>
                  <span><strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(s.faculty)}</strong> استاد</span>
                  <span><strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(s.students)}</strong> دانشجو</span>
                  <span><strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(s.labs)}</strong> آزمایشگاه</span>
                </div>
                <Button variant="ghost" size="sm">مشاهده ←</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Degree levels strip */}
        <div className="card p-10 mt-10" >
          <span className="eyebrow">DEGREE LEVELS</span>
          <h2 className="h-2 mt-4 mb-7" >پنج مقطع تحصیلی</h2>
          <div className="grid grid-3 gap-4" >
            {DEGREE_LEVELS.map((d) => (
              <div key={d.code} className="card-flat p-5.5" >
                <div className="mono mb-3"  style={{color: "var(--accent)", fontSize: 11, letterSpacing: "0.1em"}}>{d.code}</div>
                <h4 className="mb-1.5"  style={{fontSize: 17}}>{d.name}</h4>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{d.duration} · {d.desc}</div>
                <div className="mt-4 pt-3.5"  style={{ borderTop: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>
                  <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{toFa(d.count)}</strong> برنامه فعال
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

// SCHOOLS hydrated above from data.js

// =====================================================
// Virtual Lab — simulation page
// =====================================================
const VIRTUAL_LABS = {
  ANAT: {
    title: "آزمایشگاه آناتومی — قلب و سیستم گردش خون",
    field: "آناتومی · ۳D",
    tools: [
      { ic: "search", t: "بزرگ‌نمایی", k: "Z" },
      { ic: "target", t: "برش مقطعی", k: "X" },
      { ic: "eye", t: "نمای شفاف", k: "V" },
      { ic: "play", t: "انیمیشن جریان", k: "Space" },
      { ic: "layers", t: "لایه‌ها", k: "L" },
      { ic: "chip", t: "بزن نشانه", k: "M" },
    ],
    layers: [["پوست", true], ["عضلات", true], ["استخوان‌ها", false], ["دستگاه گردش خون", true], ["دستگاه عصبی", false], ["اعضای داخلی", true]],
    tabs: [["anatomy", "آناتومی"], ["physiology", "فیزیولوژی"], ["clinical", "بالینی"]],
    objName: "قلب · Cardium",
    objDesc: "قلب یک عضله‌ی توخالی به اندازه‌ی مشت است که در میان دو ریه قرار دارد. وظیفه‌ی اصلی آن پمپاژ خون به سراسر بدن از طریق دستگاه گردش خون است.",
    facts: [["تعداد دهلیز", "۲"], ["تعداد بطن", "۲"], ["ضربان نرمال", "۶۰-۱۰۰ bpm"], ["وزن", "۲۵۰-۳۵۰ گرم"], ["خون پمپاژ روزانه", "۷,۵۰۰ لیتر"]],
    cta: "شروع کوییز تشخیصی",
    color: "oklch(0.55 0.22 25)",
    glyph: "♥",
  },
  "MD-SIM": {
    title: "شبیه‌سازی بالینی — اورژانس",
    field: "بالینی · شبیه‌سازی",
    tools: [
      { ic: "pulse", t: "علائم حیاتی", k: "V" },
      { ic: "file", t: "تاریخچه", k: "H" },
      { ic: "chip", t: "آزمایش", k: "T" },
      { ic: "play", t: "اقدام", k: "A" },
      { ic: "chat", t: "گفتگو با بیمار", k: "C" },
    ],
    layers: [["تاریخچه‌ی پزشکی", true], ["دارودرمانی فعلی", true], ["ECG", true], ["نتایج آزمایش", false], ["تصویربرداری", false]],
    tabs: [["case", "کیس"], ["vitals", "علائم"], ["decisions", "تصمیمات"]],
    objName: "بیمار: مرد ۵۸ ساله",
    objDesc: "بیمار با درد قفسه سینه و تنگی نفس به اورژانس مراجعه کرده است. در ۲ دقیقه ابتدا، اولویت تشخیصی را تعیین کنید.",
    facts: [["BP", "۱۸۰/۱۱۰"], ["HR", "۱۱۲"], ["O2 Sat", "۸۸٪"], ["Temp", "۳۷.۲°C"], ["GCS", "۱۵"]],
    cta: "ادامه‌ی سناریو",
    color: "oklch(0.5 0.2 20)",
    glyph: "✚",
  },
  "RL-GYM": {
    title: "Reinforcement Learning Gym",
    field: "AI · یادگیری تقویتی",
    tools: [
      { ic: "play", t: "اجرا", k: "Space" },
      { ic: "settings", t: "Hyperparams", k: "P" },
      { ic: "chart", t: "نمودار پاداش", k: "G" },
      { ic: "download", t: "ذخیره مدل", k: "S" },
      { ic: "pulse", t: "Tensorboard", k: "T" },
    ],
    layers: [["CartPole-v1", true], ["MountainCar-v0", false], ["LunarLander-v2", false], ["Pendulum-v1", false], ["Atari Breakout", false]],
    tabs: [["env", "محیط"], ["agent", "ایجنت"], ["metrics", "متریک"]],
    objName: "CartPole · PPO",
    objDesc: "Cart-Pole مسئله‌ی استاندارد کنترل است. هدف: نگه‌داشتن میله در حالت عمودی با اعمال نیروی افقی به cart.",
    facts: [["Episode", "۱,۲۴۰"], ["Reward", "۴۸۲"], ["LR", "۳e-۴"], ["γ (gamma)", "۰.۹۹"], ["Steps/s", "۸,۵۰۰"]],
    cta: "اجرای آموزش",
    color: "oklch(0.5 0.16 270)",
    glyph: "⚙",
  },
  CAD: {
    title: "مدل‌سازی پارامتری CAD",
    field: "مهندسی · CAD/CAM",
    tools: [
      { ic: "target", t: "اسکچ", k: "S" },
      { ic: "layers", t: "اکسترود", k: "E" },
      { ic: "settings", t: "پارامتر", k: "P" },
      { ic: "chip", t: "آنالیز تنش", k: "A" },
      { ic: "play", t: "شبیه‌سازی", k: "Space" },
    ],
    layers: [["sketch", true], ["features", true], ["assembly", false], ["mesh", false], ["FEA results", false]],
    tabs: [["model", "مدل"], ["sim", "شبیه‌سازی"], ["doc", "نقشه"]],
    objName: "براکت آلومینیومی",
    objDesc: "طراحی یک براکت پارامتری برای تحمل بار ۲۰۰ نیوتنی. ضخامت بهینه و توپولوژی را تعیین کنید.",
    facts: [["Vertices", "۸,۲۴۰"], ["Faces", "۴,۱۲۰"], ["Material", "Al-6061"], ["Max stress", "۱۲ MPa"], ["Safety factor", "۳.۲"]],
    cta: "تحلیل تنش",
    color: "oklch(0.5 0.14 220)",
    glyph: "▣",
  },
  CHEM: {
    title: "شیمی آلی — مولکول‌سازی",
    field: "شیمی · مولکولی",
    tools: [
      { ic: "plus", t: "اضافه‌ی اتم", k: "A" },
      { ic: "target", t: "ایجاد باند", k: "B" },
      { ic: "eye", t: "نمای ۳D", k: "3" },
      { ic: "play", t: "واکنش", k: "R" },
      { ic: "chip", t: "خواص", k: "P" },
    ],
    layers: [["کربن", true], ["هیدروژن", true], ["اکسیژن", true], ["نیتروژن", false], ["گروه‌های عاملی", true]],
    tabs: [["build", "ساخت"], ["properties", "خواص"], ["reaction", "واکنش"]],
    objName: "اتانول · C2H6O",
    objDesc: "ساختار اتانول را بسازید و خواص فیزیکی و شیمیایی آن را بررسی کنید. واکنش با اسید سولفوریک را شبیه‌سازی کنید.",
    facts: [["فرمول", "C₂H₆O"], ["جرم مولی", "۴۶.۰۷"], ["نقطه جوش", "۷۸.۳۷°C"], ["چگالی", "۰.۷۸۹ g/mL"], ["pKa", "۱۵.۹"]],
    cta: "شبیه‌سازی واکنش",
    color: "oklch(0.5 0.15 150)",
    glyph: "⬢",
  },
  "PHYS-Q": {
    title: "آزمایش‌های مکانیک کوانتومی",
    field: "فیزیک · کوانتوم",
    tools: [
      { ic: "settings", t: "پارامتر", k: "P" },
      { ic: "pulse", t: "اندازه‌گیری", k: "M" },
      { ic: "chart", t: "هیستوگرام", k: "H" },
      { ic: "play", t: "اجرا", k: "Space" },
      { ic: "eye", t: "آشکارساز", k: "D" },
    ],
    layers: [["منبع فوتون", true], ["شکاف دوگانه", true], ["پرده‌ی تشخیص", true], ["آشکارساز کدام-راه", false], ["میدان مغناطیسی", false]],
    tabs: [["setup", "چیدمان"], ["data", "داده"], ["theory", "نظریه"]],
    objName: "آزمایش دو شکاف",
    objDesc: "ذرات فوتون را از منبع به سمت دو شکاف ارسال می‌کنیم. الگوی تداخل را بر روی پرده مشاهده کنید.",
    facts: [["λ (طول موج)", "۶۳۲ nm"], ["فاصله شکاف", "۰.۲ mm"], ["فاصله پرده", "۱ m"], ["تعداد فوتون", "۱۰,۰۰۰"], ["زمان نمونه‌برداری", "۶۰s"]],
    cta: "اجرای آزمایش",
    color: "oklch(0.5 0.16 285)",
    glyph: "ψ",
  },
  SHELL: {
    title: "Linux Terminal Sandbox",
    field: "علوم کامپیوتر · ترمینال",
    tools: [
      { ic: "plus", t: "ترمینال جدید", k: "T" },
      { ic: "folder", t: "فایل‌ها", k: "F" },
      { ic: "settings", t: "تنظیمات", k: "P" },
      { ic: "download", t: "آپلود", k: "U" },
      { ic: "pulse", t: "وضعیت", k: "S" },
    ],
    layers: [["bash", true], ["zsh", false], ["fish", false], ["python", true], ["node", true]],
    tabs: [["shell", "Shell"], ["files", "Files"], ["resources", "Resources"]],
    objName: "Ubuntu 22.04 LTS",
    objDesc: "محیط لینوکس کامل با sudo دسترسی، قابل نصب پکیج و اجرای پروژه. ۴ GB RAM، ۱۰ GB دیسک، اتصال اینترنت.",
    facts: [["CPU", "۲ vCPU"], ["RAM", "۴ GB"], ["Disk", "۱۰ GB"], ["uptime", "۰۲:۴۸:۱۲"], ["users", "۱"]],
    cta: "اتصال به ترمینال",
    color: "oklch(0.25 0.05 240)",
    glyph: "▸_",
  },
  DATA: {
    title: "Jupyter Notebook · GPU",
    field: "علوم داده · Jupyter",
    tools: [
      { ic: "play", t: "اجرای cell", k: "⇧↵" },
      { ic: "plus", t: "cell جدید", k: "B" },
      { ic: "download", t: "ذخیره", k: "S" },
      { ic: "chart", t: "نمودار", k: "G" },
      { ic: "chip", t: "GPU info", k: "I" },
    ],
    layers: [["PyTorch", true], ["TensorFlow", true], ["scikit-learn", true], ["JAX", false], ["RAPIDS cuDF", false]],
    tabs: [["nb", "نوت‌بوک"], ["data", "داده"], ["gpu", "GPU"]],
    objName: "MNIST · CNN",
    objDesc: "آموزش یک شبکه عصبی کانولوشنی روی دیتاست MNIST. هدف رسیدن به دقت ۹۸٪+ روی validation در کمتر از ۵ epoch.",
    facts: [["GPU", "T4 · ۱۶GB"], ["CUDA", "۱۲.۱"], ["Epoch", "۳/۵"], ["Val Acc", "۹۷.۸٪"], ["Batch", "۱۲۸"]],
    cta: "اجرای کل نوت‌بوک",
    color: "oklch(0.5 0.12 75)",
    glyph: "Py",
  },
  EE: {
    title: "Circuit Simulator",
    field: "برق · مدارها",
    tools: [
      { ic: "plus", t: "اضافه‌ی قطعه", k: "C" },
      { ic: "target", t: "اتصال سیم", k: "W" },
      { ic: "play", t: "شبیه‌سازی", k: "Space" },
      { ic: "chart", t: "اسیلوسکوپ", k: "O" },
      { ic: "settings", t: "پارامتر", k: "P" },
    ],
    layers: [["مقاومت", true], ["خازن", true], ["سلف", true], ["دیود", false], ["OpAmp", true]],
    tabs: [["schematic", "مدار"], ["scope", "اسیلوسکوپ"], ["bode", "Bode"]],
    objName: "فیلتر RC پایین‌گذر",
    objDesc: "فیلتر RC با R=۱kΩ و C=۱۰nF طراحی کنید. فرکانس قطع و پاسخ فاز را در دامنه‌ی Bode بررسی کنید.",
    facts: [["R", "۱ kΩ"], ["C", "۱۰ nF"], ["fc", "۱۵.۹ kHz"], ["τ", "۱۰ µs"], ["گین DC", "۰ dB"]],
    cta: "اجرای شبیه‌سازی",
    color: "oklch(0.5 0.14 60)",
    glyph: "Ω",
  },
};

export const VirtualLabPage: React.FC<VirtualLabPageProps> = ({ go, labId }) => {
  const id = labId && VIRTUAL_LABS[labId] ? labId : "ANAT";
  const lab = VIRTUAL_LABS[id];
  const [activeTab, setActiveTab] = React.useState(lab.tabs[0][0]);

  // Reset active tab when lab changes
  React.useEffect(() => {
    setActiveTab(VIRTUAL_LABS[id].tabs[0][0]);
  }, [id]);

  return (
    <main data-screen-label="27 آزمایشگاه" style={{ background: "#0d0d0c", color: "#f5f0e3", minHeight: "calc(100vh - 64px)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-4"  style={{padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)"}}>
        <div className="flex items-center gap-3.5"  style={{ minWidth: 0}}>
          <button onClick={() => go("labs")} className="msg-back-btn inline-flex"  style={{ color: "#f5f0e3", borderColor: "rgba(255,255,255,0.15)"}} aria-label="بازگشت به فهرست آزمایشگاه‌ها">
            <Icon name="arrow" size={12} /> آزمایشگاه‌ها
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.1em" }}>VIRTUAL LAB · {lab.field}</div>
            <h1 className="mt-1"  style={{fontSize: 22, fontFamily: "var(--f-display)"}}>{lab.title}</h1>
          </div>
        </div>
        <div className="flex gap-2 items-center" >
          <span className="flex items-center gap-1.5 rounded"  style={{ padding: "6px 12px", background: "rgba(34, 197, 94, 0.15)", fontFamily: "var(--f-mono)", fontSize: 11, color: "oklch(0.7 0.18 145)"}}>
            <span style={{ width: 6, height: 6, borderRadius: 50, background: "currentColor" }}></span>
            GPU سرور فعال
          </span>
          <button className="rounded-md cursor-pointer inline-flex items-center gap-1.5"
            onClick={() => window.toast?.("تنظیمات آزمایشگاه به‌زودی")}
             style={{padding: "8px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#f5f0e3", fontFamily: "inherit", fontSize: 12}}
            aria-label="تنظیمات آزمایشگاه">
            <Icon name="settings" size={13} /> تنظیمات
          </button>
        </div>
      </div>

      <div className="grid gap-0"  style={{ gridTemplateColumns: "260px 1fr 320px", height: "calc(100vh - 132px)"}}>
        {/* Left: tools */}
        <aside className="p-4 overflow-auto"  style={{ borderLeft: "1px solid rgba(255,255,255,0.08)"}}>
          <div className="mono mb-2.5"  style={{fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em"}}>ابزارها</div>
          {lab.tools.map((t, i) => (
            <button className="p-3 mb-1.5 rounded-md flex items-center gap-2.5 cursor-pointer text-right"
              key={t.t}
              onClick={() => window.toast?.(`ابزار «${t.t}» انتخاب شد`)}
              aria-label={t.t}
               style={{width: "100%",
                background: i === 0 ? "rgba(255,255,255,0.06)" : "transparent",
                border: "1px solid " + (i === 0 ? "rgba(255,255,255,0.15)" : "transparent"),
                color: "#f5f0e3", fontFamily: "inherit", fontSize: 13}}>
              <Icon name={t.ic} size={14} />
              <span className="flex-1" >{t.t}</span>
              <kbd style={{ padding: "1px 6px", background: "rgba(255,255,255,0.08)", borderRadius: 3, fontFamily: "var(--f-mono)", fontSize: 10 }}>{t.k}</kbd>
            </button>
          ))}

          <div className="mono mt-6 mb-2.5"  style={{fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em"}}>لایه‌ها</div>
          {lab.layers.map(([t, on], i) => (
            <label className="flex items-center gap-2.5 cursor-pointer" key={t}  style={{ padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.8)"}}>
              <input type="checkbox" defaultChecked={on} style={{ accentColor: "oklch(0.7 0.18 145)" }} />
              {t}
            </label>
          ))}
        </aside>

        {/* Center: 3D viewport */}
        <div className="relative grid overflow-hidden"  style={{ background: "radial-gradient(circle at 50% 50%, oklch(0.15 0.04 270), #050505)", placeItems: "center"}}>
          {/* Mock 3D anatomy view */}
          <div className="absolute"  style={{ inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 23px, rgba(255,255,255,0.02) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,0.02) 23px 24px)"}}></div>

          <div className="relative grid"  style={{ width: 380, height: 480, placeItems: "center"}}>
            {id === "ANAT" && (
              <svg viewBox="0 0 200 200" width="280" height="280" style={{ filter: "drop-shadow(0 0 60px oklch(0.55 0.22 25 / 0.4))" }}>
                <defs>
                  <radialGradient id="heart-grad" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="oklch(0.7 0.22 25)" />
                    <stop offset="60%" stopColor="oklch(0.5 0.2 20)" />
                    <stop offset="100%" stopColor="oklch(0.3 0.15 15)" />
                  </radialGradient>
                </defs>
                <path d="M100 180 C 60 140, 20 110, 20 70 C 20 40, 50 25, 70 35 C 85 42, 100 55, 100 70 C 100 55, 115 42, 130 35 C 150 25, 180 40, 180 70 C 180 110, 140 140, 100 180 Z" fill="url(#heart-grad)" stroke="oklch(0.55 0.18 20)" strokeWidth="1" />
                <path d="M95 45 Q 100 20 110 18 Q 120 18 122 35" fill="none" stroke="oklch(0.6 0.16 20)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
              </svg>
            )}
            {id !== "ANAT" && (
              <div className="grid"  style={{width: 280, height: 280,
                borderRadius: 24,
                background: `radial-gradient(circle at 30% 30%, ${lab.color}, oklch(0.18 0.04 240))`, placeItems: "center",
                color: "white",
                fontFamily: "var(--f-display)",
                fontSize: id === "DATA" ? 64 : 110,
                fontWeight: 800,
                boxShadow: `0 0 80px -20px ${lab.color}`,
                border: "1px solid rgba(255,255,255,0.1)"}}>
                {lab.glyph}
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute flex gap-1.5 p-2 rounded-xl"  style={{ bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)"}}>
            {[
              { ic: "play", label: "اجرا" },
              { ic: "pause", label: "توقف" },
              { ic: "arrow", label: "بازنشانی" },
              { ic: "layers", label: "لایه‌ها" },
              { ic: "share", label: "اشتراک" },
            ].map((b, i) => (
              <button className="rounded-md grid cursor-pointer"
                key={b.ic}
                onClick={() => window.toast?.(`${b.label}: ${lab.objName}`)}
                aria-label={b.label}
                title={b.label}
                 style={{width: 36, height: 36, background: i === 0 ? lab.color : "transparent", border: "1px solid " + (i === 0 ? "transparent" : "rgba(255,255,255,0.1)"), color: i === 0 ? "white" : "#f5f0e3", placeItems: "center"}}>
                <Icon name={b.ic === "pause" ? "play" : b.ic} size={14} />
              </button>
            ))}
          </div>

          {/* Top right HUD */}
          <div className="absolute flex flex-col gap-1.5"  style={{ top: 16, right: 16, fontFamily: "var(--f-mono)", fontSize: 11, color: "rgba(255,255,255,0.6)"}}>
            <span>FPS: {toFa(60)}</span>
            <span>Latency: {toFa(18)}ms</span>
            <span>GPU: 32%</span>
          </div>
        </div>

        {/* Right: info panel */}
        <aside className="p-5 overflow-auto"  style={{ borderRight: "1px solid rgba(255,255,255,0.08)"}}>
          <div className="flex gap-1 mb-4.5 rounded-md"  style={{ padding: 3, background: "rgba(255,255,255,0.04)"}}>
            {lab.tabs.map(([tabId, lbl]) => (
              <button className="flex-1 rounded cursor-pointer" key={tabId} onClick={() => setActiveTab(tabId)}  style={{ padding: "6px 8px",
                background: activeTab === tabId ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                color: activeTab === tabId ? "#f5f0e3" : "rgba(255,255,255,0.5)",
                fontFamily: "inherit", fontSize: 11}}>{lbl}</button>
            ))}
          </div>

          <h3 style={{ fontSize: 16, fontFamily: "var(--f-display)" }}>{lab.objName}</h3>
          <p className="mt-3"  style={{fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7}}>
            {lab.objDesc}
          </p>

          <div className="mono mt-6 mb-2.5"  style={{fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em"}}>اطلاعات کلیدی</div>
          <div className="rounded-md p-3"  style={{background: "rgba(255,255,255,0.04)"}}>
            {lab.facts.map(([k, v], i) => (
              <div className="flex justify-between" key={k}  style={{ padding: "6px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)", fontSize: 12}}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{k}</span>
                <span style={{ fontFamily: "var(--f-mono)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="mono mt-6 mb-2.5"  style={{fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em"}}>تمرین این بخش</div>
          <button className="p-3 rounded-md cursor-pointer flex items-center justify-center gap-2"
            onClick={() => window.toast?.({ title: "آماده‌سازی محیط", msg: `محیط «${lab.title}» در حال راه‌اندازی است…`, kind: "info" })}
             style={{width: "100%", background: lab.color, color: "white", border: "none", fontFamily: "inherit", fontSize: 13}}>
            {lab.cta}
            <Icon name="arrow" size={13} />
          </button>
        </aside>
      </div>
    </main>
  );
};

// =====================================================
// Labs Catalog
// =====================================================
const LABS_FILTERS = ["همه", "پزشکی", "مهندسی", "علوم پایه", "AI/Data", "شیمی", "فیزیک", "کدنویسی"];
const LabsFilterPills = () => {
  const [active, setActive] = React.useState(LABS_FILTERS[0]);
  return (
    <div className="flex gap-2 mb-8 flex-wrap" role="group" aria-label="فیلتر آزمایشگاه‌ها">
      {LABS_FILTERS.map((t) => (
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

export const LabsPage: React.FC<UniPageProps> = ({ go }) => (
  <main data-screen-label="28 آزمایشگاه‌ها">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">VIRTUAL LABS · ۶۵ آزمایشگاه مجازی</span>
        <h1 className="h-1 mt-4" >آزمایشگاه‌های مجازی</h1>
        <p className="lead mt-3.5"  style={{ maxWidth: 720}}>
          از شبیه‌سازی آناتومی ۳D با کیفیت آناتومی هاروارد تا محیط‌های یادگیری تقویتی Gym،
          محیط‌های CAD مهندسی، آزمایشگاه شیمی آلی، و sandbox کدنویسی پیشرفته.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px 40px" }}>
      <LabsFilterPills />


      <div className="grid grid-3">
        {LABS.map((l, i) => (
          <div
            key={l.code}
            className="card p-0 overflow-hidden cursor-pointer"
            
            onClick={() => go("virtuallab", l.code)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("virtuallab", l.code); } }}
            tabIndex={0}
            role="button"
            aria-label={`ورود به آزمایشگاه ${l.t}`}
          >
            <div className="relative grid"  style={{aspectRatio: "16/9", background: l.bg, placeItems: "center"}}>
              <div className="absolute"  style={{ inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 3px, transparent 3px 16px)"}}></div>
              <div className="relative text-center"  style={{color: "white", fontFamily: "var(--f-mono)", fontSize: 14, letterSpacing: "0.1em", fontWeight: 700}}>
                <div className="mb-1"  style={{fontSize: 28, fontFamily: "var(--f-display)", fontWeight: 800}}>{l.code}</div>
                <div style={{ opacity: 0.8 }}>{l.field}</div>
              </div>
              <div className="absolute flex gap-1.5"  style={{ top: 10, right: 10}}>
                {l.realtime && <span className="pill pill-cyan" style={{ fontSize: 9, background: "rgba(255,255,255,0.9)", color: "var(--accent)", border: "none" }}>realtime</span>}
                {l.gpu && <span className="pill" style={{ fontSize: 9, background: "rgba(0,0,0,0.5)", color: "white", border: "none" }}>GPU</span>}
              </div>
            </div>
            <div className="p-5" >
              <h4 className="mb-1.5"  style={{fontSize: 16}}>{l.t}</h4>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.5 }}>{l.d}</div>
              <div className="mt-3.5 pt-3.5 flex justify-between"  style={{ borderTop: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>
                <span>{l.duration}</span>
                <span style={{ color: "var(--accent)" }}>ورود به آزمایشگاه ←</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// LABS for the catalog grid — derive from data.js + add bg gradient
const LABS = LABS_DATA.map((l) => ({
  ...l,
  bg: `linear-gradient(135deg, ${l.color}, oklch(0.18 0.04 240))`,
}));

// =====================================================
// Research / PhD Studio
// =====================================================
export const ResearchPage: React.FC<UniPageProps> = ({ go }) => (
  <main data-screen-label="29 پژوهش">
    <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
      <div className="shell">
        <span className="eyebrow">RESEARCH · پژوهش</span>
        <h1 className="h-1 mt-4" >محیط پژوهشی دکتری</h1>
        <p className="lead mt-3.5"  style={{ maxWidth: 720}}>
          از یافتن استاد راهنما تا دفاع پایان‌نامه. هر دانشجوی دکتری یک workspace دائمی با ابزارهای پژوهش، ارتباط با گروه، و ردیابی پیشرفت دارد.
        </p>
      </div>
    </section>

    <section className="shell" style={{ padding: "40px 40px" }}>
      <div className="grid gap-8"  style={{ gridTemplateColumns: "1fr 340px"}}>
        <div>
          {/* Active dissertation */}
          <div className="card p-9 mb-6" >
            <div className="flex gap-2 mb-3.5" >
              <span className="pill pill-cyan" style={{ fontSize: 10 }}>پایان‌نامه فعال</span>
              <span className="pill" style={{ fontSize: 10 }}>Year 3 of 4</span>
              <span className="pill pill-violet" style={{ fontSize: 10 }}>مرحله: گردآوری</span>
            </div>
            <h2 className="h-2 mb-2" >
              مدل‌های زبانی فارسی با توجه به ساختار صرفی پیچیده
            </h2>
            <p className="mb-6"  style={{color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7}}>
              توسعه‌ی روش‌های جدید tokenization و pre-training برای زبان‌های با morphology غنی، با تمرکز بر فارسی.
            </p>

            <div className="flex gap-8 pt-6"  style={{ borderTop: "1px solid var(--line)"}}>
              <div>
                <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>استاد راهنما</div>
                <div className="flex items-center gap-2 mt-2" >
                  <div className="avatar amber" style={{ width: 28, height: 28, fontSize: 10 }}>SM</div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>دکتر موسوی</span>
                </div>
              </div>
              <div>
                <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>مشاوران</div>
                <div className="flex mt-2"  style={{ gap: -4}}>
                  <div className="avatar cyan" style={{ width: 28, height: 28, fontSize: 9 }}>AA</div>
                  <div className="avatar violet" style={{ width: 28, height: 28, fontSize: 9, marginRight: -8 }}>RT</div>
                </div>
              </div>
              <div>
                <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>پیشرفت</div>
                <div className="mt-1.5"  style={{fontFamily: "var(--f-mono)", fontSize: 22, fontWeight: 700, color: "var(--accent)"}}>۶۴٪</div>
              </div>
              <div>
                <div className="mono uppercase"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>مهلت دفاع</div>
                <div className="mt-2"  style={{fontSize: 13}}>دی ۱۴۰۶</div>
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <h3 className="h-3 mb-4.5" >نقشه‌ی راه</h3>
          <div className="card p-0 overflow-hidden" >
            {[
              { t: "بررسی پیشینه", s: "done", w: "هفته ۲ تا ۸" },
              { t: "تعیین مسئله و فرضیه‌ها", s: "done", w: "هفته ۸ تا ۱۲" },
              { t: "پروپوزال و دفاع", s: "done", w: "هفته ۱۲ تا ۱۶" },
              { t: "گردآوری داده — فارسی", s: "current", w: "هفته ۱۶ تا ۲۸" },
              { t: "پیاده‌سازی baseline", s: "current", w: "هفته ۲۴ تا ۳۲" },
              { t: "آزمایش‌ها", s: "todo", w: "هفته ۳۲ تا ۴۸" },
              { t: "تحلیل و نگارش", s: "todo", w: "هفته ۴۸ تا ۶۰" },
              { t: "دفاع نهایی", s: "todo", w: "هفته ۶۰" },
            ].map((m, i) => (
              <div className="grid gap-4 p-4.5 items-center" key={i}  style={{ gridTemplateColumns: "40px 1fr auto auto", borderTop: i > 0 ? "1px solid var(--line)" : "none"}}>
                <div className="grid"  style={{width: 28, height: 28, borderRadius: 50,
                  background: m.s === "done" ? "var(--accent)" : m.s === "current" ? "var(--accent-soft)" : "var(--surface-2)",
                  color: m.s === "done" ? "var(--accent-on)" : m.s === "current" ? "var(--accent)" : "var(--fg-dim)", placeItems: "center",
                  fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 700}}>
                  {m.s === "done" ? <Icon name="check" size={13} stroke={3} /> : toFa(i + 1)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.t}</div>
                  <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)"}}>{m.w}</div>
                </div>
                <span className={"pill " + (m.s === "done" ? "pill-cyan" : m.s === "current" ? "pill-violet" : "")} style={{ fontSize: 9 }}>
                  {m.s === "done" ? "تکمیل" : m.s === "current" ? "فعال" : "آینده"}
                </span>
                {/* R7.7d — icon-only Button needs an accessible name. */}
                <Button variant="ghost" size="sm" aria-label="نمایش جزئیات مرحله"><Icon name="arrow" size={13} /></Button>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4" >
          <div className="card p-5.5" >
            <h4 style={{ fontSize: 14 }}>منابع پژوهشی</h4>
            <div className="flex flex-col gap-2.5 mt-3.5" >
              {[
                ["مقالات مرتبط", "۱۲۸"],
                ["یادداشت‌های شخصی", "۴۲"],
                ["داده‌های گردآوری شده", "۱۸"],
                ["آزمایش‌های انجام شده", "۳۴"],
              ].map(([t, n], i) => (
                <div className="flex justify-between" key={i}  style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none", fontSize: 13}}>
                  <span>{t}</span>
                  <span style={{ fontFamily: "var(--f-mono)", fontWeight: 600, color: "var(--accent)" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5.5" >
            <h4 style={{ fontSize: 14 }}>مقالات منتشر شده</h4>
            <div className="flex flex-col gap-2.5 mt-3.5" >
              {[
                { t: "Persian Sub-word Tokenization", venue: "ACL Workshop 2025", status: "منتشر شد" },
                { t: "Morphology-Aware Pre-training", venue: "EMNLP 2025", status: "زیر داوری" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.t}</div>
                  <div className="flex justify-between mt-1" >
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{p.venue}</span>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: i === 0 ? "var(--accent)" : "var(--gold)" }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5.5" >
            <h4 style={{ fontSize: 14 }}>گروه پژوهشی</h4>
            <p className="mt-2.5"  style={{fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6}}>
              عضو گروه «زبان‌شناسی محاسباتی فارسی» — ۱۲ پژوهشگر فعال، جلسه‌ی هفتگی پنج‌شنبه‌ها.
            </p>
            <Button variant="outline" className="justify-center mt-3.5" style={{width: "100%", fontSize: 12}}>
              <Icon name="users" size={13} />ورود به فضای گروه
            </Button>
          </div>
        </aside>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

export default SchoolsPage;
