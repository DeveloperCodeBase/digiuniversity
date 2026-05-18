// =====================================================
// Recordings library — post-class artifact bundle
// =====================================================
const RecordingsPage = ({ go }) => {
  return (
    <main data-screen-label="14 آرشیو کلاس‌ها">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">RECORDED CLASSES · ARTIFACT BUNDLES</span>
              <h1 className="h-1" style={{ marginTop: 16 }}>هر کلاس، یک دارایی آموزشی</h1>
              <p className="lead" style={{ marginTop: 14 }}>
                ویدئو + متن + اسلاید + خلاصه + کوییز + فلش‌کارت + FAQ — همه پس از کلاس به‌صورت خودکار تولید و آماده‌ی بازبینی استاد می‌شود.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, color: "var(--fg)", fontFamily: "inherit", fontSize: 13 }}>
                <option>همه‌ی دروس</option>
                <option>یادگیری ماشین</option>
                <option>NLP پیشرفته</option>
              </select>
              <button className="btn btn-outline"><Icon name="search" size={14} />جستجو</button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured recording */}
      <section className="shell" style={{ padding: "40px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "center" }}>
          <div className="recording-card" style={{ cursor: "pointer" }} onClick={() => go("classroom")}>
            <div className="rec-thumb" style={{ aspectRatio: "16 / 9" }}>
              <span className="rec-duration">۱:۲۸:۴۲</span>
              <div className="rec-play">
                <div className="rec-play-btn"><Icon name="play" size={20} /></div>
              </div>
              <div className="rec-chapters">
                {[true, true, true, true, false, false, false, false, false, false].map((p, i) => (
                  <div key={i} className={"ch " + (p ? "played" : "")} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className="pill pill-cyan" style={{ fontSize: 10 }}>تازه پردازش شد</span>
            <h2 className="h-2" style={{ marginTop: 14 }}>جلسه ۸ — گرادیان نزولی با مومنتوم</h2>
            <div style={{ fontSize: 13, color: "var(--fg-mute)", marginTop: 8 }}>
              دکتر آرش عظیمی · CS-410 · ۸ اسفند ۱۴۰۴
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "var(--line)", borderRadius: 10, overflow: "hidden", marginTop: 28, border: "1px solid var(--line)" }}>
              {[
                ["۱:۲۸", "ساعت کلاس"],
                ["۴۲", "حاضران"],
                ["۲۳", "سوال در چت"],
                ["۸", "ابهام تشخیص‌داده"],
              ].map(([v, l], i) => (
                <div key={i} style={{ background: "var(--surface)", padding: 16, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 22, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {[
                ["خلاصه کوتاه", "file"],
                ["جزوه PDF", "file"],
                ["۸ فلش‌کارت", "layers"],
                ["کوییز ۸ سوال", "check"],
                ["FAQ", "chat"],
              ].map(([t, ic]) => (
                <button key={t} className="btn btn-outline btn-sm">
                  <Icon name={ic} size={13} />{t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All recordings */}
      <section className="shell" style={{ padding: "60px 40px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 className="h-3">همه‌ی ضبط‌ها · ۸۴ ساعت محتوا</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {["جدیدترین", "محبوب", "کوتاه‌ترین", "بلندترین"].map((s, i) => (
              <span key={s} className={"pill " + (i === 0 ? "pill-cyan" : "")} style={{ cursor: "pointer" }}>{s}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-3">
          {RECORDINGS.map((r, i) => (
            <div key={i} className="recording-card" onClick={() => go("classroom")} style={{ cursor: "pointer" }}>
              <div className="rec-thumb">
                <span className="rec-duration">{r.duration}</span>
                <div className="rec-play">
                  <div className="rec-play-btn" style={{ width: 40, height: 40 }}><Icon name="play" size={14} /></div>
                </div>
                <div className="rec-chapters">
                  {Array.from({ length: r.chapters }, (_, j) => <div key={j} className={"ch " + (j < r.played ? "played" : "")} />)}
                </div>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="pill" style={{ fontSize: 9 }}>{r.code}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-dim)" }}>{r.date}</span>
                </div>
                <h4 style={{ fontSize: 15, marginBottom: 6 }}>{r.title}</h4>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{r.by}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
                  {r.tags.map((t) => <span key={t} style={{ fontFamily: "var(--f-mono)", fontSize: 9, padding: "2px 6px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4, color: "var(--fg-mute)" }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const RECORDINGS = [
  { title: "اعتبارسنجی متقاطع و انتخاب مدل", code: "CS-410", by: "دکتر عظیمی", date: "۱ اسفند", duration: "۱:۱۲:۳۸", chapters: 8, played: 8, tags: ["k-fold", "bias-variance"] },
  { title: "درخت تصمیم و جنگل تصادفی", code: "CS-410", by: "دکتر عظیمی", date: "۲۲ بهمن", duration: "۱:۳۴:۲۲", chapters: 10, played: 6, tags: ["ID3", "XGBoost"] },
  { title: "مکانیسم Attention از پایه", code: "CS-620", by: "دکتر موسوی", date: "۱۸ بهمن", duration: "۱:۴۸:۱۲", chapters: 12, played: 0, tags: ["Self-attention", "Q,K,V"] },
  { title: "Kafka و event streaming در عمل", code: "CS-580", by: "م. کیانی", date: "۱۵ بهمن", duration: "۱:۲۲:۰۴", chapters: 8, played: 3, tags: ["Kafka", "Streams"] },
  { title: "آزمون فرضیه با رویکرد بیزی", code: "STAT-440", by: "دکتر فرهادی", date: "۱۰ بهمن", duration: "۵۸:۱۸", chapters: 6, played: 6, tags: ["Bayes", "MCMC"] },
  { title: "اصول عاملیت اخلاقی در ML", code: "PHIL-220", by: "دکتر طاهری", date: "۸ بهمن", duration: "۱:۰۴:۵۲", chapters: 7, played: 0, tags: ["Ethics", "Bias"] },
  { title: "Backpropagation با دست", code: "CS-410", by: "دکتر عظیمی", date: "۲ بهمن", duration: "۱:۲۲:۳۰", chapters: 9, played: 9, tags: ["Calculus", "NN"] },
  { title: "Tokenization و BPE", code: "CS-620", by: "دکتر موسوی", date: "۳۰ دی", duration: "۴۲:۱۸", chapters: 5, played: 5, tags: ["BPE", "SentencePiece"] },
  { title: "میکروسرویس‌ها — نمونه عملی", code: "CS-580", by: "م. کیانی", date: "۲۵ دی", duration: "۱:۵۲:۲۲", chapters: 12, played: 4, tags: ["Microservices", "gRPC"] },
];

window.RecordingsPage = RecordingsPage;
