// Phase-A R2.3 — typed.
// =====================================================
// Search — Semantic search across courses, video, docs
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer } from "../shared";
import { Button } from "../ui";
import type { Go } from "../router";

interface SearchPageProps { go: Go }

export const SearchPage: React.FC<SearchPageProps> = ({ go }) => {
  const [query, setQuery] = React.useState<string>("گرادیان نزولی با مومنتوم");
  const [mode, setMode] = React.useState<string>("hybrid");

  return (
    <main data-screen-label="09 جستجو">
      <section className="search-hero shell">
        <span className="eyebrow justify-center" >SEMANTIC SEARCH · HYBRID RETRIEVAL</span>
        <h1 className="h-display mt-4.5"  style={{ fontSize: "clamp(36px, 4.5vw, 72px)"}}>
          هر جمله‌ای که در کلاس گفته شد،
          <br /><span style={{ color: "var(--cyan)" }}>قابل جستجو است</span>
        </h1>

        <div className="search-bar">
          <Icon name="search" size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بپرس... (مثلاً: تفاوت overfitting و underfitting)" />
          <span className="mono" style={{ color: "var(--fg-mute)" }}>⌘ K</span>
        </div>

        <div className="search-chips" role="group" aria-label="حالت جستجو">
          {[
            ["hybrid", "هیبرید (BM25 + معنایی)"],
            ["semantic", "فقط معنایی"],
            ["keyword", "فقط کلمه‌ای"],
            ["instructor", "صحبت استاد"],
            ["student", "پرسش دانشجو"],
          ].map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              className={"pill " + (mode === id ? "pill-cyan" : "")}
              style={{ cursor: "pointer", border: "none", background: mode === id ? undefined : "var(--surface)" }}
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="mt-6"  style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)"}}>
          ۴۲ نتیجه در ۲۳ میلی‌ثانیه · رتبه‌بندی هیبرید
        </div>
      </section>

      <section className="shell pb-20" >
        {/* AI synthesized answer */}
        <div className="card p-8 mb-8"  style={{ background: "linear-gradient(135deg, color-mix(in oklch, var(--violet) 10%, var(--surface)), var(--surface))", border: "1px solid color-mix(in oklch, var(--violet) 30%, var(--line))"}}>
          <div className="flex items-center gap-2.5 mb-4.5"  style={{ color: "var(--violet)"}}>
            <Icon name="sparkle" size={18} />
            <span className="mono" style={{ letterSpacing: "0.1em" }}>AI ANSWER · RAG · GROUNDED</span>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.8 }}>
            گرادیان نزولی با مومنتوم نسخه‌ای از SGD است که در آن میانگین متحرک نمایی از گرادیان‌های قبلی نگه داشته می‌شود. این کار باعث می‌شود مدل از minimaهای محلی عبور کند و در جهت‌های با گرادیان پایدار سریع‌تر حرکت کند. فرمول اصلی: <span style={{ fontFamily: "var(--f-mono)", color: "var(--amber)" }}>v_t = β·v_{"{t-1}"} + (1-β)·∇L</span>، که β معمولاً ۰.۹ است.
          </p>
          <div className="flex gap-2 mt-4.5 flex-wrap" >
            <span className="pill" style={{ fontSize: 10 }}>۴ منبع</span>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>CS-410 جلسه ۸</span>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>جزوه ماژول ۴</span>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>کوییز ۳ — توضیح</span>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-3.5" >
          {RESULTS.map((r, i) => (
            <div
              key={i}
              className="search-result"
              role="link"
              tabIndex={0}
              aria-label={`${r.title} · ${r.course} · ${r.role === "instructor" ? "استاد" : r.role === "student" ? "دانشجو" : "جزوه"} در ${r.timestamp}`}
              onClick={() => go("classroom")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("classroom"); } }}
            >
              <div className="search-thumb">
                <div className="play-trig"><Icon name="play" size={14} /></div>
                <span className="ts">{r.timestamp}</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-2" >
                  <span className="pill" style={{ fontSize: 10 }}>{r.course}</span>
                  <span className={"pill " + (r.role === "instructor" ? "pill-cyan" : "pill-amber")} style={{ fontSize: 10 }}>
                    {r.role === "instructor" ? "استاد" : r.role === "student" ? "دانشجو" : "جزوه"}
                  </span>
                  <span className="mono" style={{ color: "var(--fg-dim)" }}>score {r.score}</span>
                </div>
                <h4 className="mb-2.5"  style={{fontSize: 17}}>{r.title}</h4>
                <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.7 }}>{r.excerpt}</p>
                <div className="flex gap-3.5 mt-3.5"  style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)"}}>
                  <span>{r.speaker}</span>
                  <span>·</span>
                  <span>{r.date}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5" >
                <Button variant="ghost" size="sm" onClick={() => go("recordings")}
                  aria-label={"پخش " + r.title}
                ><Icon name="play" size={13} /> پخش</Button>
                <Button variant="ghost" size="sm" onClick={() => window.toast?.({ title: "متن کامل", msg: r.excerpt })}
                  aria-label={"متن " + r.title}
                ><Icon name="file" size={13} /> متن</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const RESULTS = [
  { course: "CS-410", role: "instructor", title: "مومنتوم در گرادیان نزولی — شهود توپ سراشیبی", excerpt: "...اینجاست که مومنتوم به کمک می‌آید. به نوعی حافظه‌ی کوتاه‌مدت از گرادیان‌های قبلی نگه می‌دارد...", speaker: "دکتر عظیمی", date: "جلسه ۸ · ۸ اسفند", timestamp: "۴۲:۴۸", score: "۰.۹۴" },
  { course: "CS-410", role: "instructor", title: "فرمول v_t و انتخاب β", excerpt: "...بنابراین v_t برابر است با β ضرب در v_{t-1} به علاوه‌ی (۱-β) ضرب در گرادیان. در عمل β معمولاً ۰.۹ است...", speaker: "دکتر عظیمی", date: "جلسه ۸ · ۸ اسفند", timestamp: "۴۳:۱۲", score: "۰.۹۱" },
  { course: "CS-620", role: "instructor", title: "Adam optimizer — ترکیب مومنتوم و RMSProp", excerpt: "...Adam هم مومنتوم گرادیان را نگه می‌دارد و هم مقیاس آن را با میانگین متحرک نمایی از مربعات کنترل می‌کند...", speaker: "دکتر موسوی", date: "جلسه ۳ · ۲۲ بهمن", timestamp: "۲۸:۱۴", score: "۰.۸۷" },
  { course: "CS-410", role: "student", title: "سوال نسرین: تفاوت با میانگین متحرک نمایی", excerpt: "...تفاوت مومنتوم با میانگین متحرک نمایی چیست؟ آیا اینها یک چیز هستند؟...", speaker: "نسرین رضوی", date: "جلسه ۸ · ۸ اسفند", timestamp: "۴۳:۲۸", score: "۰.۸۲" },
  { course: "CS-410", role: "doc", title: "جزوه ماژول ۴ — بهینه‌سازی", excerpt: "...در عمل، مومنتوم باعث می‌شود مسیر بهینه‌سازی نوسان کمتری داشته باشد و سریع‌تر همگرا شود. این به‌ویژه در شبکه‌های عصبی عمیق اهمیت دارد...", speaker: "متن مرجع", date: "PDF · صفحه ۲۳", timestamp: "—", score: "۰.۷۸" },
];

export default SearchPage;
