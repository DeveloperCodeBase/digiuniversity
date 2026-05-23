// Phase-A R2.3 — typed.
// =====================================================
// Programs / Catalog page
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Stagger } from "../motion";
import { Footer, toFa } from "../shared";
import { PROGRAMS, findSchool } from "../data.js";
import type { Go } from "../router";

const LEVEL_LABEL: Record<string, string> = { MS: "ارشد", PHD: "دکتری", BS: "کارشناسی", MD: "M.D", CERT: "حرفه‌ای", AS: "کاردانی" };

interface ProgramsPageProps { go: Go }

export const ProgramsPage: React.FC<ProgramsPageProps> = ({ go }) => {
  const [activeLevel, setActiveLevel] = React.useState<string>("ALL");
  const levels = ["ALL", "MS", "PHD", "BS", "CERT"];
  const filtered = activeLevel === "ALL" ? PROGRAMS : PROGRAMS.filter((p) => p.level === activeLevel);
  const programs = filtered.map((p, i) => {
    const school = findSchool(p.school);
    return {
      num: toFa(String(i + 1).padStart(2, "0")),
      title: p.title,
      desc: p.description,
      duration: p.duration,
      credits: p.credits ? toFa(p.credits) + " واحد" : "—",
      level: LEVEL_LABEL[p.level] || p.level,
      tags: [school?.name || p.school, p.code, p.language === "en" ? "EN" : p.language === "fa+en" ? "FA+EN" : "FA"],
    };
  });

  return (
    <main data-screen-label="02 برنامه‌ها">
      <section className="programs-hero shell">
        <span className="eyebrow justify-center" >ACADEMIC PROGRAMS · 2026</span>
        <h1 className="h-display mt-6" >
          شش مسیر،
          <br /><span style={{ background: "linear-gradient(110deg, var(--cyan), var(--amber))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>یک دانشگاه</span>
        </h1>
        <p className="lead text-center"  style={{margin: "28px auto 0"}}>
          از کارشناسی ارشد رسمی تا بوت‌کمپ‌های فشرده. همگی با کلاس زنده، پروفایل شناختی و گواهی دیجیتال قابل راستی‌آزمایی.
        </p>
        <div className="flex gap-2.5 justify-center mt-8 flex-wrap" >
          {levels.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setActiveLevel(lv)}
              aria-pressed={activeLevel === lv}
              className={"pill " + (activeLevel === lv ? "pill-cyan" : "")}
              style={{ cursor: "pointer", border: "none", background: activeLevel === lv ? undefined : "var(--surface)" }}
            >
              {lv === "ALL" ? "همه" : LEVEL_LABEL[lv]}
            </button>
          ))}
        </div>
      </section>

      <section className="shell pb-20" >
        <Stagger className="programs-grid">
          {programs.map((p) => (
            <button
              key={p.num}
              type="button"
              className="prog-card reveal"
              onClick={() => go("course")}
              aria-label={`برنامه ${p.title} · ${p.level} · مشاهده دروس`}
            >
              <span className="num">{p.num}</span>
              <span className="pill mt-3"  style={{alignSelf: "flex-start"}}>{p.level}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="tags">
                {p.tags.map((t) => <span key={t} className="pill">{t}</span>)}
              </div>
              <div className="footer-row">
                <div>
                  <div className="meta">{p.duration} · {p.credits}</div>
                </div>
                <Icon name="arrow" size={18} />
              </div>
            </button>
          ))}
        </Stagger>
      </section>

      {/* Comparison panel */}
      <section className="section shell pt-0" >
        <div className="card p-10" >
          <div className="section-head mb-6" >
            <div className="text">
              <span className="eyebrow">DELIVERY MODES</span>
              <h2 className="h-2 mt-3.5" >چهار حالت یادگیری در یک پلتفرم</h2>
            </div>
          </div>
          <div className="grid grid-4">
            {[
              { t: "Live Synchronous", d: "کلاس‌های زنده دو طرفه، breakout room، کوییز زنده", c: "var(--cyan)", lat: "تأخیر < ۲۰۰ms" },
              { t: "Recorded · self-paced", d: "ویدئوهای ضبط‌شده با فصل‌بندی هوشمند و جستجوی معنایی", c: "var(--amber)", lat: "any-time" },
              { t: "Blended cohort", d: "ترکیب زنده و خودخوان با cohort مشترک و peer-review", c: "var(--violet)", lat: "weekly" },
              { t: "Project · mastery", d: "بدون امتحان نهایی. پروژه پایان و rubric شفاف", c: "var(--rose)", lat: "outcome-driven" },
            ].map((m) => (
              <div key={m.t} className="card-flat relative pt-6" >
                <span className="absolute"  style={{ top: 0, right: 0, width: 36, height: 3, background: m.c, borderRadius: "0 0 0 4px"}} />
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: m.c, letterSpacing: "0.06em" }}>{m.lat}</div>
                <h4 className="mt-2"  style={{ fontSize: 16}}>{m.t}</h4>
                <p className="mt-2"  style={{color: "var(--fg-mute)", fontSize: 13, lineHeight: 1.6}}>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProgramsPage;
