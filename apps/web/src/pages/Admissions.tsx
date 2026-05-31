// Phase-A R2.6 — typed.
// =====================================================
// Admissions / Onboarding flow
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer, toFa } from "../shared";
import { Button } from "../ui";
import type { Go } from "../router";

interface AdmissionsPageProps { go: Go }

export const AdmissionsPage: React.FC<AdmissionsPageProps> = ({ go }) => {
  const [step, setStep] = React.useState<number>(2);
  const steps = [
    { n: 1, t: "انتخاب برنامه", done: true },
    { n: 2, t: "مشخصات و مدارک", done: false, current: true },
    { n: 3, t: "ارزیابی ورودی", done: false },
    { n: 4, t: "پرداخت شهریه", done: false },
    { n: 5, t: "Onboarding", done: false },
  ];

  return (
    <main data-screen-label="07 پذیرش">
      <section style={{ padding: "80px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell text-center" >
          <span className="eyebrow justify-center" >ADMISSIONS 2026 · TERM 1</span>
          <h1 className="h-display mt-4.5"  style={{ fontSize: "clamp(40px, 5vw, 80px)"}}>
            مسیر پذیرش، در یک نمای واحد
          </h1>
          <p className="lead" style={{ margin: "20px auto 0" }}>
            بدون مراجعه حضوری. احراز هویت دیجیتال، ارزیابی تطبیقی، و شروع اولین درس در همان روز پذیرش.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "60px 40px" }}>
        {/* progress */}
        <div className="grid gap-2 mb-12 p-4 rounded-2xl"  style={{
          gridTemplateColumns: "repeat(5, 1fr)",
          background: "var(--surface)",
          border: "1px solid var(--line)"}}>
          {steps.map((s) => (
            <button
              type="button"
              className="p-4 rounded-xl cursor-pointer text-right"
              key={s.n}
              onClick={() => setStep(s.n)}
              aria-current={step === s.n ? "step" : undefined}
              aria-label={`مرحله ${s.n}: ${s.t}${s.done ? " · تکمیل شده" : ""}`}
              style={{
                background: step === s.n ? "color-mix(in oklch, var(--cyan) 12%, var(--surface-2))" : "transparent",
                border: "1px solid " + (step === s.n ? "color-mix(in oklch, var(--cyan) 40%, transparent)" : "transparent"),
                transition: "140ms ease",
                fontFamily: "inherit",
                color: "var(--fg)",
              }}
            >
              <div className="flex items-center gap-2.5" >
                <div className="grid"  style={{width: 28, height: 28, borderRadius: 50,
                  background: s.done ? "var(--cyan)" : step === s.n ? "var(--violet)" : "var(--surface-3)",
                  color: s.done ? "#051418" : step === s.n ? "white" : "var(--fg-mute)", placeItems: "center",
                  fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700}}>
                  {s.done ? <Icon name="check" size={14} stroke={3} /> : toFa(s.n)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{s.t}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-8"  style={{ gridTemplateColumns: "1.4fr 1fr"}}>
          {/* form */}
          <div className="card p-10" >
            {step === 1 && <Step1Programs go={go} />}
            {step === 2 && <Step2Info onNext={() => setStep(3)} />}
            {step === 3 && <Step3Assessment onNext={() => setStep(4)} />}
            {step === 4 && <Step4Payment onNext={() => setStep(5)} />}
            {step === 5 && <Step5Onboard go={go} />}
          </div>

          {/* side help */}
          <aside className="flex flex-col gap-4" >
            <div className="card p-6" >
              <div className="flex items-center gap-2.5 mb-3.5"  style={{ color: "var(--cyan)"}}>
                <Icon name="headset" size={16} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>AI ADMISSIONS HELPER</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
                دستیار پذیرش ۲۴/۷ پاسخگوست. اگر چیزی نامشخص است، همین‌جا بپرس — اگر پاسخ قطعی نیافت، تیکت به مشاور انسانی ارسال می‌شود.
              </p>
              <Button variant="outline" className="justify-center mt-3.5" style={{width: "100%"}}>
                <Icon name="chat" size={14} />شروع گفتگو
              </Button>
            </div>

            <div className="card p-6" >
              <div className="mono mb-3.5"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>چه چیزی نیاز دارید</div>
              <ul className="p-0 m-0 flex flex-col gap-3"  style={{listStyle: "none"}}>
                {[
                  ["تصویر کارت ملی یا گذرنامه", true],
                  ["مدرک تحصیلی قبلی (PDF)", true],
                  ["یک عکس پرتره با وضوح", false],
                  ["شرح یک‌صفحه‌ای انگیزه", false],
                ].map(([t, d], i) => (
                  <li className="flex items-center gap-2.5" key={i}  style={{ fontSize: 13, color: d ? "var(--fg)" : "var(--fg-mute)"}}>
                    <span className="grid"  style={{width: 18, height: 18, borderRadius: 50, background: d ? "var(--cyan)" : "var(--surface-3)", color: "#051418", placeItems: "center"}}>
                      {d && <Icon name="check" size={11} stroke={3} />}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6"  style={{ background: "linear-gradient(135deg, color-mix(in oklch, var(--amber) 10%, var(--surface)), var(--surface))"}}>
              <div className="flex items-center gap-2.5 mb-2.5"  style={{ color: "var(--amber)"}}>
                <Icon name="shield" size={14} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>PRIVACY · ENCRYPTED</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                مدارک شما با کلید سازمانی رمز می‌شود و فقط برای اعتبارسنجی پذیرش استفاده می‌شود. در هر زمان قابل حذف است.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

const Step1Programs = ({ go }: { go: Go }) => (
  <div>
    <h2 className="h-2">برنامه‌ی موردنظر را انتخاب کنید</h2>
    <p className="mt-3.5"  style={{color: "var(--fg-mute)"}}>هر برنامه شامل بسته‌ای از دروس، استادان و گواهی است.</p>
    <Button variant="primary" className="mt-8" onClick={() => go("programs")}>
      <Icon name="layers" size={14} />
      مشاهده برنامه‌ها
    </Button>
  </div>
);

const Step2Info = ({ onNext }) => (
  <div>
    <h2 className="h-2">مشخصات و مدارک</h2>
    <p className="mt-3"  style={{color: "var(--fg-mute)"}}>اطلاعات با کلید سازمانی رمز می‌شود. می‌توانید در هر مرحله ذخیره و ادامه دهید.</p>

    <div className="grid gap-4 mt-8"  style={{ gridTemplateColumns: "1fr 1fr"}}>
      <FormField label="نام" placeholder="نسرین" />
      <FormField label="نام خانوادگی" placeholder="رضوی" />
      <FormField label="کد ملی / شماره گذرنامه" placeholder="۰۰۱۲۳۴۵۶۷۸" mono />
      <FormField label="تاریخ تولد" placeholder="۱۳۷۸/۰۵/۱۲" mono />
      <FormField label="ایمیل" placeholder="nasrin@example.com" type="email" full />
      <FormField label="شماره تماس" placeholder="۰۹۱۲۳۴۵۶۷۸۹" mono full />
    </div>

    <div className="mt-8" >
      <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>UPLOAD DOCUMENTS</div>
      <div className="grid gap-3"  style={{ gridTemplateColumns: "1fr 1fr"}}>
        <Upload label="کارت ملی / گذرنامه" status="done" />
        <Upload label="مدرک تحصیلی قبلی" status="done" />
        <Upload label="عکس پرتره" status="pending" />
        <Upload label="شرح انگیزه (اختیاری)" status="optional" />
      </div>
    </div>

    <div className="mt-10 flex justify-between items-center" >
      <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>پیشرفت در این مرحله: ۸۰٪</span>
      <Button variant="primary" onClick={onNext}>
        ادامه به ارزیابی ورودی
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </div>
);

const Step3Assessment = ({ onNext }) => (
  <div>
    <h2 className="h-2">ارزیابی ورودی تطبیقی</h2>
    <p className="mt-3"  style={{color: "var(--fg-mute)"}}>۱۲ سوال تطبیقی برای تعیین سطح ورود. این آزمون نمره ندارد — صرفاً مسیر شخصی‌سازی‌شده‌ی شما را می‌سازد.</p>
    <div className="mt-6 p-6 rounded-xl"  style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
      <div className="mono mb-3"  style={{color: "var(--cyan)", fontSize: 11, letterSpacing: "0.08em"}}>سوال ۵ از ۱۲ · تخمین سطح: ۰.۶۸</div>
      <h3 className="h-3">کدام عبارت دقیق‌ترین توصیف از overfitting است؟</h3>
      <div className="flex flex-col gap-2.5 mt-5" >
        {[
          "مدل بر داده‌های آموزش خیلی خوب و بر داده‌های جدید ضعیف عمل می‌کند.",
          "مدل بر همه‌ی داده‌ها به‌طور یکسان ضعیف عمل می‌کند.",
          "مدل از داده‌های آموزش هیچ یاد نمی‌گیرد.",
          "مدل با تعداد ویژگی‌های بسیار کم آموزش دیده است.",
        ].map((a, i) => (
          <label className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer" key={i}  style={{ background: "var(--surface)",
            border: "1px solid var(--line)", fontSize: 13}}>
            <input type="radio" name="q" defaultChecked={i === 0} style={{ accentColor: "var(--cyan)" }} />
            {a}
          </label>
        ))}
      </div>
    </div>
    <div className="mt-8 flex justify-between" >
      <Button variant="ghost">قبلی</Button>
      <Button variant="primary" onClick={onNext}>
        سوال بعدی
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </div>
);

const Step4Payment = ({ onNext }) => (
  <div>
    <h2 className="h-2">شهریه و پرداخت</h2>
    <p className="mt-3"  style={{color: "var(--fg-mute)"}}>گزینه‌های انعطاف‌پذیر برای پرداخت ترمی، اقساطی یا کامل.</p>
    <div className="grid grid-3 mt-7" >
      {[
        { t: "ترم اول", price: "۱۲", curr: "م. تومان", tag: "متداول", color: "var(--fg-mute)" },
        { t: "سال کامل", price: "۲۲", curr: "م. تومان", tag: "۸٪ تخفیف", color: "var(--cyan)" },
        { t: "اقساط", price: "۴.۵", curr: "م. × ۳", tag: "بدون بهره", color: "var(--amber)" },
      ].map((p) => (
        <div key={p.t} className="card-flat p-6"  style={{ borderColor: p.color + "40"}}>
          <div className="mono mb-3"  style={{fontSize: 11, color: p.color, letterSpacing: "0.08em"}}>{p.tag}</div>
          <div style={{ fontSize: 14, color: "var(--fg-mute)" }}>{p.t}</div>
          <div className="flex items-baseline gap-1.5 mt-2" >
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 700 }}>{p.price}</span>
            <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>{p.curr}</span>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-7 p-5 rounded-xl"  style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
      <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>روش پرداخت</div>
      <div className="grid gap-2"  style={{ gridTemplateColumns: "repeat(4, 1fr)"}}>
        {["درگاه ملی", "زرین‌پال", "کیف‌پول", "پرداخت سازمانی"].map((m, i) => (
          <Button variant="outline" className="justify-center" key={m}  style={{ background: i === 0 ? "var(--surface)" : "transparent", borderColor: i === 0 ? "var(--cyan)" : "var(--line-2)"}}>
            {m}
          </Button>
        ))}
      </div>
    </div>
    <div className="mt-8 flex justify-between" >
      <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>پرداخت امن · رمزنگاری end-to-end</span>
      <Button variant="primary" onClick={onNext}>
        پرداخت و نهایی‌سازی
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </div>
);

const Step5Onboard = ({ go }: { go: Go }) => (
  <div className="text-center"  style={{ padding: "20px 0"}}>
    <div className="grid relative"  style={{width: 100, height: 100, margin: "0 auto",
      borderRadius: 50,
      background: "conic-gradient(from 0deg, var(--cyan), var(--amber), var(--violet), var(--cyan))", placeItems: "center",
      boxShadow: "0 0 40px -8px var(--cyan)"}}>
      <div className="absolute grid"  style={{ inset: 6, borderRadius: 50, background: "var(--surface)", placeItems: "center"}}>
        <Icon name="check" size={36} stroke={2} />
      </div>
    </div>
    <h2 className="h-2 mt-7" >به دانشگاه برخط هوشمند ایران خوش آمدید، نسرین</h2>
    <p className="lead" style={{ margin: "16px auto 0" }}>
      پروفایل شناختی اولیه‌ی شما ساخته شد. اولین درس شما در ۹۰ دقیقه‌ی آینده آغاز می‌شود.
    </p>
    <div className="flex gap-3 justify-center mt-8" >
      <Button variant="primary" size="lg" onClick={() => go("dashboard")}>
        ورود به میز کار من
        <Icon name="arrow" size={14} />
      </Button>
      <Button variant="outline" size="lg" onClick={() => go("course")}>
        مشاهده اولین درس
      </Button>
    </div>
  </div>
);

const FormField = ({ label, placeholder, type = "text", mono, full }) => (
  <label style={{ gridColumn: full ? "1 / -1" : "auto" }}>
    <div className="mono mb-2 uppercase"  style={{color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.1em"}}>{label}</div>
    <input className="rounded-xl" type={type} placeholder={placeholder}  style={{width: "100%",
      background: "var(--surface-2)",
      border: "1px solid var(--line)",
      padding: "12px 14px",
      color: "var(--fg)",
      fontFamily: mono ? "var(--f-mono)" : "var(--f-sans)",
      fontSize: 14,
      direction: mono ? "ltr" : "rtl",
      textAlign: mono ? "left" : "right"}} />
  </label>
);

const Upload = ({ label, status }) => {
  const color = status === "done" ? "var(--cyan)" : status === "pending" ? "var(--amber)" : "var(--fg-mute)";
  return (
    <div className="p-4.5 rounded-xl flex items-center gap-3.5"  style={{
      background: "var(--surface-2)",
      border: "1px dashed " + (status === "done" ? color + "60" : "var(--line-2)")}}>
      <div className="rounded-lg grid"  style={{width: 36, height: 36, background: "var(--surface-3)", color: color, placeItems: "center"}}>
        <Icon name={status === "done" ? "check" : "plus"} size={16} stroke={status === "done" ? 3 : 2} />
      </div>
      <div className="flex-1" >
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div className="mono mt-1"  style={{fontSize: 10, color: color, letterSpacing: "0.06em"}}>
          {status === "done" ? "آپلود شد · تأیید AI" : status === "pending" ? "در انتظار آپلود" : "اختیاری"}
        </div>
      </div>
    </div>
  );
};

export default AdmissionsPage;
