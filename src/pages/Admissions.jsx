// =====================================================
// Admissions / Onboarding flow
// =====================================================
const AdmissionsPage = ({ go }) => {
  const [step, setStep] = React.useState(2);
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
        <div className="shell" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>ADMISSIONS 2026 · TERM 1</span>
          <h1 className="h-display" style={{ marginTop: 18, fontSize: "clamp(40px, 5vw, 80px)" }}>
            مسیر پذیرش، در یک نمای واحد
          </h1>
          <p className="lead" style={{ margin: "20px auto 0" }}>
            بدون مراجعه حضوری. احراز هویت دیجیتال، ارزیابی تطبیقی، و شروع اولین درس در همان روز پذیرش.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "60px 40px" }}>
        {/* progress */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8,
          marginBottom: 48,
          background: "var(--surface)",
          padding: 16,
          border: "1px solid var(--line)",
          borderRadius: 14,
        }}>
          {steps.map((s) => (
            <div key={s.n} onClick={() => setStep(s.n)} style={{
              padding: 16,
              borderRadius: 10,
              cursor: "pointer",
              background: step === s.n ? "color-mix(in oklch, var(--cyan) 12%, var(--surface-2))" : "transparent",
              border: "1px solid " + (step === s.n ? "color-mix(in oklch, var(--cyan) 40%, transparent)" : "transparent"),
              transition: "140ms ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 50,
                  background: s.done ? "var(--cyan)" : step === s.n ? "var(--violet)" : "var(--surface-3)",
                  color: s.done ? "#051418" : step === s.n ? "white" : "var(--fg-mute)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700,
                }}>
                  {s.done ? <Icon name="check" size={14} stroke={3} /> : toFa(s.n)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{s.t}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
          {/* form */}
          <div className="card" style={{ padding: 40 }}>
            {step === 1 && <Step1Programs go={go} />}
            {step === 2 && <Step2Info onNext={() => setStep(3)} />}
            {step === 3 && <Step3Assessment onNext={() => setStep(4)} />}
            {step === 4 && <Step4Payment onNext={() => setStep(5)} />}
            {step === 5 && <Step5Onboard go={go} />}
          </div>

          {/* side help */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--cyan)", marginBottom: 14 }}>
                <Icon name="headset" size={16} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>AI ADMISSIONS HELPER</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>
                دستیار پذیرش ۲۴/۷ پاسخگوست. اگر چیزی نامشخص است، همین‌جا بپرس — اگر پاسخ قطعی نیافت، تیکت به مشاور انسانی ارسال می‌شود.
              </p>
              <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                <Icon name="chat" size={14} />شروع گفتگو
              </button>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div className="mono" style={{ color: "var(--fg-mute)", marginBottom: 14, fontSize: 11, letterSpacing: "0.08em" }}>چه چیزی نیاز دارید</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["تصویر کارت ملی یا گذرنامه", true],
                  ["مدرک تحصیلی قبلی (PDF)", true],
                  ["یک عکس پرتره با وضوح", false],
                  ["شرح یک‌صفحه‌ای انگیزه", false],
                ].map(([t, d], i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: d ? "var(--fg)" : "var(--fg-mute)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 50, background: d ? "var(--cyan)" : "var(--surface-3)", color: "#051418", display: "grid", placeItems: "center" }}>
                      {d && <Icon name="check" size={11} stroke={3} />}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 24, background: "linear-gradient(135deg, color-mix(in oklch, var(--amber) 10%, var(--surface)), var(--surface))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--amber)", marginBottom: 10 }}>
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

      <Footer go={go} />
    </main>
  );
};

const Step1Programs = ({ go }) => (
  <div>
    <h2 className="h-2">برنامه‌ی موردنظر را انتخاب کنید</h2>
    <p style={{ color: "var(--fg-mute)", marginTop: 14 }}>هر برنامه شامل بسته‌ای از دروس، استادان و گواهی است.</p>
    <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={() => go("programs")}>
      <Icon name="layers" size={14} />
      مشاهده برنامه‌ها
    </button>
  </div>
);

const Step2Info = ({ onNext }) => (
  <div>
    <h2 className="h-2">مشخصات و مدارک</h2>
    <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>اطلاعات با کلید سازمانی رمز می‌شود. می‌توانید در هر مرحله ذخیره و ادامه دهید.</p>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}>
      <FormField label="نام" placeholder="نسرین" />
      <FormField label="نام خانوادگی" placeholder="رضوی" />
      <FormField label="کد ملی / شماره گذرنامه" placeholder="۰۰۱۲۳۴۵۶۷۸" mono />
      <FormField label="تاریخ تولد" placeholder="۱۳۷۸/۰۵/۱۲" mono />
      <FormField label="ایمیل" placeholder="nasrin@example.com" type="email" full />
      <FormField label="شماره تماس" placeholder="۰۹۱۲۳۴۵۶۷۸۹" mono full />
    </div>

    <div style={{ marginTop: 32 }}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>UPLOAD DOCUMENTS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Upload label="کارت ملی / گذرنامه" status="done" />
        <Upload label="مدرک تحصیلی قبلی" status="done" />
        <Upload label="عکس پرتره" status="pending" />
        <Upload label="شرح انگیزه (اختیاری)" status="optional" />
      </div>
    </div>

    <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>پیشرفت در این مرحله: ۸۰٪</span>
      <button className="btn btn-primary" onClick={onNext}>
        ادامه به ارزیابی ورودی
        <Icon name="arrow" size={14} />
      </button>
    </div>
  </div>
);

const Step3Assessment = ({ onNext }) => (
  <div>
    <h2 className="h-2">ارزیابی ورودی تطبیقی</h2>
    <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>۱۲ سوال تطبیقی برای تعیین سطح ورود. این آزمون نمره ندارد — صرفاً مسیر شخصی‌سازی‌شده‌ی شما را می‌سازد.</p>
    <div style={{ marginTop: 24, padding: 24, background: "var(--surface-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
      <div className="mono" style={{ color: "var(--cyan)", fontSize: 11, marginBottom: 12, letterSpacing: "0.08em" }}>سوال ۵ از ۱۲ · تخمین سطح: ۰.۶۸</div>
      <h3 className="h-3">کدام عبارت دقیق‌ترین توصیف از overfitting است؟</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {[
          "مدل بر داده‌های آموزش خیلی خوب و بر داده‌های جدید ضعیف عمل می‌کند.",
          "مدل بر همه‌ی داده‌ها به‌طور یکسان ضعیف عمل می‌کند.",
          "مدل از داده‌های آموزش هیچ یاد نمی‌گیرد.",
          "مدل با تعداد ویژگی‌های بسیار کم آموزش دیده است.",
        ].map((a, i) => (
          <label key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: 14, background: "var(--surface)", borderRadius: 10,
            border: "1px solid var(--line)", cursor: "pointer", fontSize: 13,
          }}>
            <input type="radio" name="q" defaultChecked={i === 0} style={{ accentColor: "var(--cyan)" }} />
            {a}
          </label>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between" }}>
      <button className="btn btn-ghost">قبلی</button>
      <button className="btn btn-primary" onClick={onNext}>
        سوال بعدی
        <Icon name="arrow" size={14} />
      </button>
    </div>
  </div>
);

const Step4Payment = ({ onNext }) => (
  <div>
    <h2 className="h-2">شهریه و پرداخت</h2>
    <p style={{ color: "var(--fg-mute)", marginTop: 12 }}>گزینه‌های انعطاف‌پذیر برای پرداخت ترمی، اقساطی یا کامل.</p>
    <div className="grid grid-3" style={{ marginTop: 28 }}>
      {[
        { t: "ترم اول", price: "۱۲", curr: "م. تومان", tag: "متداول", color: "var(--fg-mute)" },
        { t: "سال کامل", price: "۲۲", curr: "م. تومان", tag: "۸٪ تخفیف", color: "var(--cyan)" },
        { t: "اقساط", price: "۴.۵", curr: "م. × ۳", tag: "بدون بهره", color: "var(--amber)" },
      ].map((p) => (
        <div key={p.t} className="card-flat" style={{ padding: 24, borderColor: p.color + "40" }}>
          <div className="mono" style={{ fontSize: 11, color: p.color, letterSpacing: "0.08em", marginBottom: 12 }}>{p.tag}</div>
          <div style={{ fontSize: 14, color: "var(--fg-mute)" }}>{p.t}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
            <span style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 700 }}>{p.price}</span>
            <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>{p.curr}</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 28, padding: 20, background: "var(--surface-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, marginBottom: 12, letterSpacing: "0.08em" }}>روش پرداخت</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {["درگاه ملی", "زرین‌پال", "کیف‌پول", "پرداخت سازمانی"].map((m, i) => (
          <button key={m} className="btn btn-outline" style={{ justifyContent: "center", background: i === 0 ? "var(--surface)" : "transparent", borderColor: i === 0 ? "var(--cyan)" : "var(--line-2)" }}>
            {m}
          </button>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>پرداخت امن · رمزنگاری end-to-end</span>
      <button className="btn btn-primary" onClick={onNext}>
        پرداخت و نهایی‌سازی
        <Icon name="arrow" size={14} />
      </button>
    </div>
  </div>
);

const Step5Onboard = ({ go }) => (
  <div style={{ textAlign: "center", padding: "20px 0" }}>
    <div style={{
      width: 100, height: 100, margin: "0 auto",
      borderRadius: 50,
      background: "conic-gradient(from 0deg, var(--cyan), var(--amber), var(--violet), var(--cyan))",
      display: "grid", placeItems: "center",
      boxShadow: "0 0 40px -8px var(--cyan)",
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 6, borderRadius: 50, background: "var(--surface)", display: "grid", placeItems: "center" }}>
        <Icon name="check" size={36} stroke={2} />
      </div>
    </div>
    <h2 className="h-2" style={{ marginTop: 28 }}>به دیجی‌یونیورسیتی خوش آمدید، نسرین</h2>
    <p className="lead" style={{ margin: "16px auto 0" }}>
      پروفایل شناختی اولیه‌ی شما ساخته شد. اولین درس شما در ۹۰ دقیقه‌ی آینده آغاز می‌شود.
    </p>
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
      <button className="btn btn-primary btn-lg" onClick={() => go("dashboard")}>
        ورود به میز کار من
        <Icon name="arrow" size={14} />
      </button>
      <button className="btn btn-outline btn-lg" onClick={() => go("course")}>
        مشاهده اولین درس
      </button>
    </div>
  </div>
);

const FormField = ({ label, placeholder, type = "text", mono, full }) => (
  <label style={{ gridColumn: full ? "1 / -1" : "auto" }}>
    <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
    <input type={type} placeholder={placeholder} style={{
      width: "100%",
      background: "var(--surface-2)",
      border: "1px solid var(--line)",
      borderRadius: 10,
      padding: "12px 14px",
      color: "var(--fg)",
      fontFamily: mono ? "var(--f-mono)" : "var(--f-sans)",
      fontSize: 14,
      direction: mono ? "ltr" : "rtl",
      textAlign: mono ? "left" : "right",
    }} />
  </label>
);

const Upload = ({ label, status }) => {
  const color = status === "done" ? "var(--cyan)" : status === "pending" ? "var(--amber)" : "var(--fg-mute)";
  return (
    <div style={{
      padding: 18,
      background: "var(--surface-2)",
      border: "1px dashed " + (status === "done" ? color + "60" : "var(--line-2)"),
      borderRadius: 10,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface-3)", color: color, display: "grid", placeItems: "center" }}>
        <Icon name={status === "done" ? "check" : "plus"} size={16} stroke={status === "done" ? 3 : 2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div className="mono" style={{ fontSize: 10, color: color, marginTop: 4, letterSpacing: "0.06em" }}>
          {status === "done" ? "آپلود شد · تأیید AI" : status === "pending" ? "در انتظار آپلود" : "اختیاری"}
        </div>
      </div>
    </div>
  );
};

window.AdmissionsPage = AdmissionsPage;
