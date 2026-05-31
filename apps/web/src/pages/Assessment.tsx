// Phase-A R2.3 — typed.
// =====================================================
// Adaptive Assessment / Exam interface
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Nav, toFa, Sparkline } from "../shared";
import { Button } from "../ui";
import type { Go } from "../router";

interface AssessmentPageProps { go: Go }

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ go }) => {
  const [selected, setSelected] = React.useState<number>(1);
  const [current, setCurrent] = React.useState<number>(4);
  const total = 12;

  const steps = Array.from({ length: total }, (_, i) =>
    i < current - 1 ? "done" : i === current - 1 ? "current" : "todo"
  );

  return (
    <main data-screen-label="10 آزمون تطبیقی" style={{ background: "var(--bg-deep)" }}>
      <div className="exam-shell">
        <div className="exam-main">
          {/* Header */}
          <div className="exam-header">
            <div>
              <div className="mono" style={{ color: "var(--cyan)", fontSize: 11, letterSpacing: "0.1em" }}>
                ADAPTIVE TEST · IRT 2PL · CAT
              </div>
              <h2 className="h-3 mt-2" >آزمون میان‌ترم · بهینه‌سازی</h2>
            </div>
            <div className="exam-progress">
              {steps.map((s, i) => <span key={i} className={"step " + s} />)}
            </div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 14, fontWeight: 600 }}>
              {toFa(current)} / {toFa(total)}
            </div>
          </div>

          {/* Question */}
          <div className="exam-question">
            <div className="flex gap-3 items-center mb-4.5" >
              <span className="pill pill-violet" style={{ fontSize: 10 }}>سطح ۳ از ۵ · سختی ۰.۶۸</span>
              <span className="pill" style={{ fontSize: 10 }}>هدف: تنظیم نرخ یادگیری</span>
            </div>
            <div className="stem">
              در گرادیان نزولی با مومنتوم، اگر مقدار <span style={{ fontFamily: "var(--f-mono)", color: "var(--amber)" }}>β = ۰.۹</span> و نرخ یادگیری <span style={{ fontFamily: "var(--f-mono)", color: "var(--amber)" }}>η = ۰.۰۱</span> باشد، تقریباً چند گام گذشته در سرعت فعلی تأثیرگذار است؟
            </div>

            <div className="exam-options">
              {[
                ["A", "حدود ۲ گام", false],
                ["B", "حدود ۱۰ گام", true],
                ["C", "حدود ۹۰ گام", false],
                ["D", "همه‌ی گام‌های قبلی به‌طور یکسان", false],
              ].map(([letter, text, correct], i) => (
                <button key={String(letter)} className={"exam-option " + (selected === i ? "selected" : "")} onClick={() => setSelected(i)}>
                  <span className="letter">{letter}</span>
                  <span>{text}</span>
                  {selected === i && <Icon name="check" size={18} stroke={3} />}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div className="flex justify-between mt-12" >
              <Button variant="ghost" onClick={() => setCurrent(Math.max(1, current - 1))}>
                <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} />
                قبلی
              </Button>
              <Button variant="outline">
                <Icon name="hand" size={14} />
                علامت‌گذاری برای بازبینی
              </Button>
              <Button variant="primary" onClick={() => setCurrent(Math.min(total, current + 1))}>
                ثبت و سوال بعدی
                <Icon name="arrow" size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="exam-aside">
          <div>
            <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>زمان باقی‌مانده</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 48, fontWeight: 700, color: "var(--amber)" }}>۴۸:۲۲</div>
            <div className="rounded-full overflow-hidden mt-2"  style={{height: 4, background: "var(--surface-2)"}}>
              <div className="rounded-full"  style={{width: "32%", height: "100%", background: "var(--amber)"}} />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)" }}></div>

          <div>
            <div className="mono mb-3"  style={{color: "var(--cyan)", fontSize: 11, letterSpacing: "0.1em"}}>تخمین زنده‌ی سطح</div>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 700 }}>۰.۷۱</div>
            <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>
              ± ۰.۰۸ · در حال همگرایی
            </div>
            <div className="mt-3.5"  style={{ height: 60}}>
              <Sparkline values={[0.5, 0.55, 0.6, 0.58, 0.65, 0.68, 0.7, 0.71]} color="var(--cyan)" />
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)" }}></div>

          <div>
            <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>سوالات نمای کلی</div>
            <div className="grid gap-1.5"  style={{ gridTemplateColumns: "repeat(6, 1fr)"}}>
              {Array.from({ length: total }, (_, i) => (
                <button
                  type="button"
                  className="rounded-md grid cursor-pointer"
                  key={i}
                  onClick={() => setCurrent(i + 1)}
                  aria-current={i === current - 1 ? "step" : undefined}
                  aria-label={`سوال ${toFa(i + 1)}${i < current - 1 ? " · پاسخ داده شده" : i === current - 1 ? " · فعلی" : ""}`}
                  style={{aspectRatio: "1",
                  background: i < current - 1 ? "var(--cyan)" : i === current - 1 ? "var(--violet)" : "var(--surface-2)",
                  color: i <= current - 1 ? (i === current - 1 ? "white" : "#051418") : "var(--fg-mute)", placeItems: "center",
                  fontFamily: "var(--f-mono)", fontSize: 11, fontWeight: 700,
                  border: "1px solid " + (i === current - 1 ? "var(--violet)" : "transparent")}}>
                  {toFa(i + 1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--line)" }}></div>

          <div className="p-3.5 rounded-xl"  style={{ background: "color-mix(in oklch, var(--violet) 10%, var(--surface-2))", border: "1px solid color-mix(in oklch, var(--violet) 25%, transparent)"}}>
            <div className="flex items-center gap-2 mb-2"  style={{ color: "var(--violet)", fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em"}}>
              <Icon name="shield" size={12} />
              PROCTORING · ACTIVE
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.6 }}>
              نمایش تب مرورگر، الگوی پاسخ‌دهی و زمان هر سوال ثبت می‌شود. هیچ ادعای تقلبی بدون بازبینی انسانی نهایی نمی‌شود.
            </div>
          </div>

          <Button variant="outline" className="justify-center">
            ذخیره و ادامه بعداً
          </Button>
        </aside>
      </div>
    </main>
  );
};

export default AssessmentPage;
