// =====================================================
// Live Classroom — the heart of the platform
// =====================================================
const ClassroomPage = ({ go }) => {
  const [tab, setTab] = React.useState("tutor");
  const [muted, setMuted] = React.useState(false);
  const [camOff, setCamOff] = React.useState(false);

  return (
    <main data-screen-label="03 کلاس زنده" style={{ background: "var(--bg-deep)" }}>
      <div className="classroom-shell">
        {/* MAIN STAGE */}
        <div className="classroom-main">
          {/* topbar */}
          <div className="classroom-topbar">
            <span className="dot dot-live"></span>
            <div style={{ flex: 1 }}>
              <div className="title">یادگیری ماشین · جلسه ۸ — گرادیان نزولی تصادفی</div>
              <div className="sub">دکتر آرش عظیمی · CS-410 · ترم بهار ۱۴۰۵</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="pill">
                <Icon name="users" size={11} />
                {toFa(42)} حاضر
              </span>
              <span className="pill pill-cyan">
                <Icon name="pulse" size={11} />
                ضبط فعال
              </span>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>۰۰:۴۲:۱۸</span>
            </div>
          </div>

          {/* stage */}
          <div className="stage">
            <div className="stage-main">
              <div className="stage-screen">
                <span className="label">slide 14 / 22</span>
                <div className="slide-content">
                  <div className="slide-eyebrow">CONCEPT · MOMENTUM</div>
                  <div className="slide-title">گرادیان نزولی با مومنتوم</div>
                  <div className="slide-formula">
                    v_t = β·v_{"{t-1}"} + (1-β)·∇L(θ)
                  </div>
                  <div className="slide-formula" style={{ fontSize: 18, marginTop: 10 }}>
                    θ_t = θ_{"{t-1}"} - η·v_t
                  </div>
                </div>
              </div>
            </div>

            <div className="stage-side scrollable">
              {[
                { name: "دکتر عظیمی", host: true, speaking: true, mic: true },
                { name: "نسرین", speaking: false, mic: true, host: false },
                { name: "علی", speaking: false, mic: false, host: false },
                { name: "مهرداد", speaking: true, mic: true, host: false },
                { name: "ساره", speaking: false, mic: true, host: false },
                { name: "+ ۳۷", speaking: false, mic: true, host: false, more: true },
              ].map((p, i) => (
                <div key={i} className={"participant " + (p.speaking ? "speaking " : "") + (p.host ? "host " : "") + (!p.mic ? "mic-off " : "")}>
                  <div className="ptch" style={p.more ? { background: "var(--surface-2)", display: "grid", placeItems: "center", color: "var(--fg-mute)", fontFamily: "var(--f-mono)", fontSize: 16, fontWeight: 600 } : undefined}>
                    {p.more && p.name}
                  </div>
                  {!p.more && <span className="pname">{p.name}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* toolbar */}
          <div className="classroom-toolbar">
            <div className="tool-group">
              <button className={"tool-btn " + (muted ? "danger" : "")} onClick={() => setMuted(!muted)} title="میکروفون">
                <Icon name={muted ? "micOff" : "mic"} />
              </button>
              <button className={"tool-btn " + (camOff ? "danger" : "")} onClick={() => setCamOff(!camOff)} title="دوربین">
                <Icon name={camOff ? "videoOff" : "video"} />
              </button>
              <button className="tool-btn" title="اشتراک صفحه"><Icon name="share" /></button>
              <button className="tool-btn" title="دست بالا"><Icon name="hand" /></button>
              <button className="tool-btn" title="چت"><Icon name="chat" /></button>
            </div>

            <div className="tool-group">
              <button className="btn btn-outline btn-sm">
                <Icon name="sparkle" size={14} />
                درخواست توضیح
              </button>
              <button className="btn btn-outline btn-sm">
                <Icon name="file" size={14} />
                یادداشت جلسه
              </button>
            </div>

            <div className="tool-group">
              <button className="tool-btn" title="تنظیمات"><Icon name="settings" /></button>
              <button className="tool-btn danger" title="خروج"><Icon name="end" /></button>
            </div>
          </div>
        </div>

        {/* ASIDE — tutor / transcript / participants / Q&A */}
        <aside className="classroom-aside">
          <div className="aside-tabs">
            {[
              ["tutor", "دستیار من"],
              ["tx", "متن زنده"],
              ["qa", "پرسش و پاسخ"],
            ].map(([id, lbl]) => (
              <button key={id} className={"aside-tab " + (tab === id ? "active" : "")} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {tab === "tutor" && <TutorPanel />}
          {tab === "tx" && <TranscriptPanel />}
          {tab === "qa" && <QAPanel />}
        </aside>
      </div>
    </main>
  );
};

const TutorPanel = () => {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    { from: "ai", t: "سلام نسرین. وقتی روی مفهومی مکث کردی یا سوالی داشتی، اینجا بپرس — جریان کلاس قطع نمی‌شود.", src: "system" },
    { from: "user", t: "تفاوت مومنتوم با میانگین متحرک نمایی چیست؟" },
    { from: "ai", t: "خوب پرسیدی. در واقع فرمولی که الان روی اسلاید است، خود یک EMA است روی گرادیان‌ها. β همان ضریب وزن گذشته است. در ویدئوی این جلسه از دقیقه ۲۸:۴۲ همین مقایسه را روی نمودار می‌بینی.", src: "lec-8 · 28:42" },
    { from: "user", t: "اگر β = ۰.۹ باشد، یعنی چقدر از گذشته را نگه می‌داریم؟" },
    { from: "ai", t: "ضریب مؤثر تقریباً ۱۰ گام است. می‌خواهی یک شبیه‌سازی تعاملی نشانت بدهم؟", src: "RAG · concept · 0.91", action: "open-sim" },
  ]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", t: input }]);
    setInput("");
  };

  return (
    <div className="aside-panel">
      <div className="aside-head">
        <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="sparkle" size={14} />
          دستیار شخصی · گراندِد روی این درس
        </h4>
        <span className="pill pill-cyan" style={{ fontSize: 9 }}>RAG</span>
      </div>
      <div className="aside-body scrollable">
        {messages.map((m, i) => (
          <div key={i} className={"tutor-msg " + (m.from === "user" ? "you" : "")}>
            <div className="ai-av">{m.from === "user" ? "من" : "AI"}</div>
            <div className="content">
              {m.t}
              {m.src && <div className="source"><Icon name="play" size={10} />{m.src}</div>}
              {m.action === "open-sim" && (
                <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>
                  <Icon name="bolt" size={12} />
                  باز کردن شبیه‌سازی
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <form className="tutor-input" onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="بپرس... (مثلاً: یک مثال ساده‌تر بزن)" />
        <button className="tool-btn primary" type="submit"><Icon name="send" size={16} /></button>
      </form>
    </div>
  );
};

const TranscriptPanel = () => {
  const lines = [
    { sp: "دکتر عظیمی", role: "instructor", t: "بنابراین وقتی به یک minimum محلی نزدیک می‌شویم، اندازه‌ی گرادیان کوچک می‌شود.", time: "۴۲:۰۲" },
    { sp: "دکتر عظیمی", role: "instructor", t: "اینجاست که مومنتوم به کمک می‌آید. به نوعی حافظه‌ی کوتاه‌مدت از گرادیان‌های قبلی نگه می‌دارد.", time: "۴۲:۱۹" },
    { sp: "مهرداد", role: "student", t: "یعنی مثل اینکه یک توپ از سراشیبی پایین می‌آید؟", time: "۴۲:۴۱" },
    { sp: "دکتر عظیمی", role: "instructor", t: "دقیقاً همین تصویر کلاسیک. توپ مومنتوم خود را در فرورفتگی‌های کوچک حفظ می‌کند و از آن‌ها عبور می‌کند.", time: "۴۲:۴۸" },
    { sp: "دکتر عظیمی", role: "instructor", t: "حالا فرمول را با هم می‌بینیم. v_t یعنی سرعت در گام t.", time: "۴۳:۱۲", highlight: true },
    { sp: "نسرین", role: "student", t: "β چقدر باید باشد در عمل؟", time: "۴۳:۳۸" },
    { sp: "دکتر عظیمی", role: "instructor", t: "معمولاً بین ۰.۸ تا ۰.۹۹. شروع با ۰.۹ پیشنهاد می‌شود.", time: "۴۳:۴۸" },
  ];
  return (
    <div className="aside-panel">
      <div className="aside-head">
        <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="pulse" size={14} />
          متن زنده · ASR فارسی
        </h4>
        <span className="pill" style={{ fontSize: 9 }}>۰.۹۲ acc</span>
      </div>
      <div className="aside-body scrollable">
        {lines.map((l, i) => (
          <div key={i} className={"tx-line " + l.role + (l.highlight ? " highlight" : "")}>
            <span className="ts">{l.time}</span>
            <span className="speaker">{l.sp}</span>
            <div style={{ marginTop: 2 }}>{l.t}</div>
          </div>
        ))}
      </div>
      <div className="tutor-input">
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
          <Icon name="search" size={12} />
          جستجو در متن این کلاس
        </button>
      </div>
    </div>
  );
};

const QAPanel = () => {
  const qs = [
    { who: "نسرین", t: "آیا با Adam مومنتوم ادغام شده است؟", up: 12, answered: false },
    { who: "ساره", t: "نرخ یادگیری چطور با مومنتوم تنظیم می‌شود؟", up: 8, answered: true },
    { who: "علی", t: "در عمل کدام در PyTorch پیش‌فرض است؟", up: 5, answered: false },
    { who: "بهنام", t: "تفاوت SGD معمولی با Nesterov چیست؟", up: 3, answered: false },
  ];
  return (
    <div className="aside-panel">
      <div className="aside-head">
        <h4>پرسش و پاسخ · ۴ سوال فعال</h4>
        <span className="pill pill-amber" style={{ fontSize: 9 }}>۲ خوشه</span>
      </div>
      <div className="aside-body scrollable">
        <div style={{ background: "color-mix(in oklch, var(--violet) 8%, var(--surface-2))", border: "1px solid color-mix(in oklch, var(--violet) 30%, transparent)", borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--violet)", fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em" }}>
            <Icon name="sparkle" size={11} />
            AI COACH · خوشه‌بندی سوالات
          </div>
          ۳ سوال مشابه درباره‌ی «تفاوت مومنتوم با Adam» مطرح شده. پیشنهاد می‌کنم در ۲ دقیقه بعدی یک مقایسه‌ی کوتاه ارائه دهید.
        </div>
        {qs.map((q, i) => (
          <div key={i} style={{ padding: 12, background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-mute)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 50, background: "var(--surface-3)", display: "grid", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 10 }}>{q.who[0]}</div>
                {q.who}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {q.answered && <span className="pill pill-cyan" style={{ fontSize: 9 }}>پاسخ شده</span>}
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)" }}>▲ {toFa(q.up)}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>{q.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.ClassroomPage = ClassroomPage;
