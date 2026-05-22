// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename.
// Phase-16 R6 leaves @ts-nocheck in place per the Phase 16.5 ruling
// (docs/MEMORY.md). The poll + breakout overlays were swapped to
// Radix-backed Dialog / Sheet in this commit; the rest of the file
// remains untyped.
// =====================================================
// Live Classroom — full workflow with lobby, polls,
// reactions, breakout rooms, transcript, and AI tutor.
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { toFa } from "../shared";
import { findCourse, findFaculty, CURRENT_USER, CLASSMATES } from "../data.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
} from "../ui";

export const ClassroomPage = ({ go }) => {
  // Lobby / Live phase
  const [phase, setPhase] = React.useState("lobby"); // lobby | live | ended

  // A/V state
  const [muted, setMuted] = React.useState(false);
  const [camOff, setCamOff] = React.useState(false);
  const [shareOn, setShareOn] = React.useState(false);
  const [handRaised, setHandRaised] = React.useState(false);

  // UI state
  const [tab, setTab] = React.useState("tutor");
  const [asideOpen, setAsideOpen] = React.useState(false);

  // Polls / reactions / breakouts
  const [activePoll, setActivePoll] = React.useState(null);
  const [pollAnswered, setPollAnswered] = React.useState(false);
  const [reactions, setReactions] = React.useState([]); // {id, emoji, x}
  const [showBreakout, setShowBreakout] = React.useState(false);

  // Live class metadata (from data layer)
  const course = findCourse("c-cs410");
  const instructor = findFaculty(course?.instructor);

  // Live timer
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Auto-poll after 30s into the live class
  React.useEffect(() => {
    if (phase !== "live" || activePoll) return;
    const t = setTimeout(() => {
      setActivePoll({
        question: "بهترین β برای مومنتوم در این مسئله چقدر است؟",
        options: ["۰.۵", "۰.۹", "۰.۹۹"],
        votes: [3, 18, 5],
        correct: 1,
      });
    }, 12000);
    return () => clearTimeout(t);
  }, [phase, activePoll]);

  // Cleanup reactions
  React.useEffect(() => {
    if (reactions.length === 0) return;
    const t = setTimeout(() => setReactions((r) => r.slice(1)), 2200);
    return () => clearTimeout(t);
  }, [reactions]);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const launchReaction = (emoji) => {
    const id = Math.random().toString(36).slice(2);
    const x = 40 + Math.random() * 60; // %
    setReactions((r) => [...r, { id, emoji, x }]);
  };

  const confirmEnd = async () => {
    const ok = await window.confirmAction?.({
      title: "خروج از کلاس",
      body: "آیا مطمئن هستید می‌خواهید کلاس را ترک کنید؟ ضبط برای شما ادامه پیدا می‌کند و در آرشیو در دسترس خواهد بود.",
      confirmLabel: "خروج",
      cancelLabel: "ماندن",
      danger: true,
    });
    if (ok) {
      setPhase("ended");
      window.toast?.({ title: "از کلاس خارج شدید", msg: "آرشیو ضبط در دسترس است.", kind: "success" });
      setTimeout(() => go("recordings"), 500);
    }
  };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setAsideOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (phase === "lobby") {
    return (
      <ClassroomLobby
        course={course}
        instructor={instructor}
        muted={muted} setMuted={setMuted}
        camOff={camOff} setCamOff={setCamOff}
        onJoin={() => { setPhase("live"); window.toast?.({ title: "به کلاس پیوستید", msg: "موفق باشید!", kind: "success" }); }}
        onBack={() => go("dashboard")}
      />
    );
  }

  return (
    <main data-screen-label="03 کلاس زنده" style={{ background: "var(--bg-deep)" }}>
      <button
        className="classroom-aside-toggle"
        onClick={() => setAsideOpen(!asideOpen)}
        aria-label={asideOpen ? "بستن دستیار" : "باز کردن دستیار AI"}
        title="دستیار AI"
      >
        <Icon name="sparkle" size={20} />
      </button>
      <div className="classroom-shell">
        <div className="classroom-main">
          {/* topbar */}
          <div className="classroom-topbar">
            <span className="dot dot-live"></span>
            <div className="flex-1"  style={{ minWidth: 0}}>
              <div className="title overflow-hidden truncate whitespace-nowrap" >
                {course.title} · جلسه ۸ — گرادیان نزولی تصادفی
              </div>
              <div className="sub">{instructor.name} · {course.code} · ترم بهار ۱۴۰۵</div>
            </div>
            <div className="classroom-meta">
              <span className="pill"><Icon name="users" size={11} />{toFa(42)} حاضر</span>
              <span className="pill pill-cyan"><Icon name="pulse" size={11} />ضبط فعال</span>
              <span className="mono" style={{ color: "var(--fg-mute)" }}>{fmtTime(elapsed + 2538)}</span>
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
                  <div className="slide-formula">v_t = β·v_{"{t-1}"} + (1-β)·∇L(θ)</div>
                  <div className="slide-formula mt-2.5"  style={{fontSize: 18}}>θ_t = θ_{"{t-1}"} - η·v_t</div>
                </div>

                {/* Floating reactions */}
                <div className="reaction-layer" aria-hidden="true">
                  {reactions.map((r) => (
                    <span key={r.id} className="reaction-bubble" style={{ left: r.x + "%" }}>{r.emoji}</span>
                  ))}
                </div>

                {/* Phase-16 R6 — poll moved out of the .stage-screen
                    layer (was position:absolute, which clipped on
                    mobile when stage-side reflowed below). Now a
                    proper Radix Dialog: focus trapped, Escape
                    dismissable, full-screen on <md with
                    safe-area-inset-bottom, screen-readers announce
                    role=dialog. */}
                <Dialog
                  open={!!activePoll}
                  onOpenChange={(open) => {
                    if (!open) {
                      setActivePoll(null);
                      setPollAnswered(false);
                    }
                  }}
                >
                  {activePoll && (
                    <DialogContent>
                      <DialogHeader>
                        <div className="poll-eyebrow">
                          <Icon name="chip" size={11} />
                          <span className="mono">
                            LIVE POLL · {toFa(activePoll.votes.reduce((a, b) => a + b, 0))} رای
                          </span>
                        </div>
                        <DialogTitle>{activePoll.question}</DialogTitle>
                        <DialogDescription className="sr-only">
                          نظرسنجی زنده در کلاس. یک گزینه را انتخاب کنید.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="poll-options">
                        {activePoll.options.map((opt, i) => {
                          const totalVotes = activePoll.votes.reduce((a, b) => a + b, 0);
                          const pct = Math.round((activePoll.votes[i] / totalVotes) * 100);
                          return (
                            <button
                              key={i}
                              className={"poll-option " + (pollAnswered ? "answered " : "") + (pollAnswered && i === activePoll.correct ? "correct" : "")}
                              onClick={() => {
                                if (pollAnswered) return;
                                setPollAnswered(true);
                                window.toast?.({ title: i === activePoll.correct ? "صحیح!" : "پاسخ صحیح: " + activePoll.options[activePoll.correct], kind: i === activePoll.correct ? "success" : "warn" });
                              }}
                            >
                              <span className="poll-pct" style={{ width: pollAnswered ? pct + "%" : "0%" }} />
                              <span className="poll-label">{opt}</span>
                              {pollAnswered && <span className="poll-num">{toFa(pct)}٪</span>}
                            </button>
                          );
                        })}
                      </div>
                      {pollAnswered && (
                        <div className="mt-3.5 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setActivePoll(null); setPollAnswered(false); }}
                          >
                            بستن نظرسنجی
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  )}
                </Dialog>

                {/* Phase-16 R6 — breakout overlay → Sheet from bottom.
                    Was position:absolute inside .stage-screen; on
                    mobile the stage-screen shrinks and the overlay
                    clipped into the participant grid below. Sheet
                    is a portal-mounted bottom drawer, which on >=md
                    gracefully fills more of the screen and on <md
                    becomes a true bottom-anchored sheet with the
                    safe-area-inset-bottom padding wired in. */}
                <Sheet
                  open={showBreakout}
                  onOpenChange={(open) => setShowBreakout(open)}
                >
                  <SheetContent side="bottom" className="max-w-[640px] mx-auto rounded-t-[var(--r-xl)]">
                    <SheetHeader>
                      <SheetTitle>گروه‌های breakout</SheetTitle>
                      <SheetDescription>
                        به یکی از این ۴ گروه بپیوندید؛ هر گروه ۴-۵ نفر است و ۱۰ دقیقه فرصت بحث دارد.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="breakout-grid">
                      {[
                        { name: "گروه ۱ — نظری", participants: ["ساره", "علی", "مهرداد", "نسرین"] },
                        { name: "گروه ۲ — کاربردی", participants: ["بهنام", "مهسا", "ساغر"] },
                        { name: "گروه ۳ — کد", participants: ["نگار", "آرین", "نیکا", "علی"] },
                        { name: "گروه ۴ — مقاله", participants: ["شیوا", "سحر", "محمد"] },
                      ].map((g, i) => (
                        <button key={i} className="breakout-room" onClick={() => {
                          setShowBreakout(false);
                          window.toast?.({ title: "وارد " + g.name + " شدید", msg: g.participants.length + " نفر در این گروه هستند.", kind: "success" });
                        }}>
                          <strong>{g.name}</strong>
                          <div className="mt-1" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{g.participants.join(" · ")}</div>
                        </button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="stage-side scrollable">
              {[
                { name: instructor.name.split(" ").slice(-1)[0], host: true, speaking: true, mic: true },
                { name: "نسرین", speaking: false, mic: true, host: false, self: true },
                ...CLASSMATES.slice(0, 4).map((c) => ({ name: c.name.split(" ")[0], avatar: c.avatar, color: c.color, speaking: Math.random() > 0.7, mic: Math.random() > 0.3, host: false })),
                { name: "+ ۳۶", speaking: false, mic: true, host: false, more: true },
              ].map((p, i) => (
                <div key={i} className={"participant " + (p.speaking ? "speaking " : "") + (p.host ? "host " : "") + (!p.mic ? "mic-off " : "")}>
                  <div className="ptch" style={p.more ? { background: "var(--surface-2)", display: "grid", placeItems: "center", color: "var(--fg-mute)", fontFamily: "var(--f-mono)", fontSize: 16, fontWeight: 600 } : undefined}>
                    {p.more && p.name}
                  </div>
                  {!p.more && <span className="pname">{p.name}{p.self ? " (شما)" : ""}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Reactions row */}
          <div className="reactions-row">
            {["👍", "👏", "❤", "🤔", "🎉", "✋"].map((e) => (
              <button key={e} className="reaction-btn" onClick={() => launchReaction(e)} aria-label={"واکنش " + e}>{e}</button>
            ))}
          </div>

          {/* toolbar */}
          <div className="classroom-toolbar">
            <div className="tool-group">
              <button
                className={"tool-btn " + (muted ? "danger" : "")}
                onClick={() => { setMuted(!muted); window.toast?.(muted ? "میکروفون فعال شد" : "میکروفون قطع شد"); }}
                aria-label={muted ? "روشن کردن میکروفون" : "بستن میکروفون"}
                aria-pressed={muted}
                title="میکروفون (M)"
              >
                <Icon name={muted ? "micOff" : "mic"} />
              </button>
              <button
                className={"tool-btn " + (camOff ? "danger" : "")}
                onClick={() => { setCamOff(!camOff); window.toast?.(camOff ? "دوربین فعال شد" : "دوربین قطع شد"); }}
                aria-label={camOff ? "روشن کردن دوربین" : "بستن دوربین"}
                aria-pressed={camOff}
                title="دوربین (V)"
              >
                <Icon name={camOff ? "videoOff" : "video"} />
              </button>
              <button
                className={"tool-btn " + (shareOn ? "primary" : "")}
                onClick={() => { setShareOn(!shareOn); window.toast?.(shareOn ? "اشتراک صفحه متوقف شد" : "اشتراک صفحه شروع شد"); }}
                aria-label="اشتراک صفحه"
                aria-pressed={shareOn}
                title="اشتراک صفحه (S)"
              >
                <Icon name="share" />
              </button>
              <button
                className={"tool-btn " + (handRaised ? "primary" : "")}
                onClick={() => { setHandRaised(!handRaised); window.toast?.(handRaised ? "دست پایین آمد" : "دست شما بالا رفت"); }}
                aria-label="دست بالا"
                aria-pressed={handRaised}
                title="دست بالا (H)"
              >
                <Icon name="hand" />
              </button>
              <button
                className="tool-btn"
                onClick={() => { setAsideOpen(true); setTab("qa"); }}
                aria-label="باز کردن پرسش‌وپاسخ"
                title="پرسش‌وپاسخ (Q)"
              >
                <Icon name="chat" />
              </button>
            </div>

            <div className="tool-group">
              <Button variant="outline" size="sm" onClick={() => { setAsideOpen(true); setTab("tutor"); }}>
                <Icon name="sparkle" size={14} />
                دستیار AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBreakout(true)}>
                <Icon name="users" size={14} />
                Breakout
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.toast?.({ title: "یادداشت ذخیره شد", msg: "یادداشت جلسه در آرشیو شخصی شما اضافه شد.", kind: "success" })}>
                <Icon name="file" size={14} />
                یادداشت
              </Button>
            </div>

            <div className="tool-group">
              <button className="tool-btn" onClick={() => go("settings")} aria-label="تنظیمات" title="تنظیمات">
                <Icon name="settings" />
              </button>
              <button className="tool-btn danger" onClick={confirmEnd} aria-label="خروج از کلاس" title="خروج">
                <Icon name="end" />
              </button>
            </div>
          </div>
        </div>

        <aside className={"classroom-aside " + (asideOpen ? "open" : "")}>
          {asideOpen && (
            <button
              onClick={() => setAsideOpen(false)}
              className="msg-back-btn inline-flex mb-2"
               style={{ alignSelf: "flex-start"}}
              aria-label="بستن پنل دستیار"
            >
              <Icon name="end" size={12} /> بستن
            </button>
          )}
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

// ---------- Lobby (pre-join) ----------
const ClassroomLobby = ({ course, instructor, muted, setMuted, camOff, setCamOff, onJoin, onBack }) => {
  const [audioLevel, setAudioLevel] = React.useState(0);

  // Simulate mic audio levels
  React.useEffect(() => {
    if (muted) { setAudioLevel(0); return; }
    const t = setInterval(() => setAudioLevel(Math.random() * 0.6 + 0.1), 200);
    return () => clearInterval(t);
  }, [muted]);

  return (
    <main className="grid" data-screen-label="03 لابی کلاس"  style={{minHeight: "calc(100vh - 64px)", placeItems: "center", padding: "32px 16px"}}>
      <div className="lobby-card">
        <div className="lobby-cover">
          <div className="lobby-cover-overlay">
            <button className="lobby-back" onClick={onBack} aria-label="بازگشت">
              <Icon name="arrow" size={14} /> بازگشت
            </button>
          </div>
          <div className="lobby-self">
            {camOff ? (
              <div className="lobby-self-off">
                <div className="avatar cyan" style={{ width: 80, height: 80, fontSize: 28 }}>{CURRENT_USER.avatar}</div>
              </div>
            ) : (
              <div className="lobby-self-cam">
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "var(--f-mono)" }}>دوربین فعال</div>
              </div>
            )}
            <div className="lobby-self-meta">
              <span style={{ fontWeight: 600 }}>{CURRENT_USER.name}</span>
              <div className="lobby-mic-bar">
                <div className="lobby-mic-fill" style={{ width: (audioLevel * 100) + "%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="lobby-content">
          <div className="flex items-center gap-2 mb-3" >
            <span className="pill pill-cyan"><span className="dot dot-live" />آماده‌ی شروع</span>
            <span className="pill">{course.code}</span>
          </div>
          <h1 className="m-0"  style={{fontSize: "clamp(22px, 3vw, 32px)"}}>{course.title}</h1>
          <p className="mt-2"  style={{fontSize: 14, color: "var(--fg-mute)"}}>
            جلسه ۸ — گرادیان نزولی تصادفی · {instructor.name}
          </p>

          <div className="lobby-info-grid">
            {[
              ["زمان شروع", "همین الان"],
              ["مدت پیش‌بینی شده", "۹۰ دقیقه"],
              ["شرکت‌کنندگان", "۴۲ از ۸۴۳"],
              ["نوع", "تعاملی + ضبط"],
            ].map(([l, v]) => (
              <div key={l} className="lobby-info">
                <span className="mono lobby-info-l">{l}</span>
                <span className="lobby-info-v">{v}</span>
              </div>
            ))}
          </div>

          <div className="lobby-controls">
            <button className={"lobby-btn " + (muted ? "off" : "")} onClick={() => setMuted(!muted)} aria-pressed={muted}>
              <Icon name={muted ? "micOff" : "mic"} size={18} />
              <span>{muted ? "میکروفون خاموش" : "میکروفون روشن"}</span>
            </button>
            <button className={"lobby-btn " + (camOff ? "off" : "")} onClick={() => setCamOff(!camOff)} aria-pressed={camOff}>
              <Icon name={camOff ? "videoOff" : "video"} size={18} />
              <span>{camOff ? "دوربین خاموش" : "دوربین روشن"}</span>
            </button>
            <button className="lobby-btn" onClick={() => window.toast?.({ title: "تست خروجی صدا", msg: "صدای تست در حال پخش است…", kind: "info" })}>
              <Icon name="headset" size={18} />
              <span>تست خروجی</span>
            </button>
          </div>

          <div className="lobby-actions">
            <Button variant="ghost" size="lg" onClick={onBack}>انصراف</Button>
            <Button variant="primary" size="lg" onClick={onJoin}>
              ورود به کلاس
              <Icon name="arrow" size={14} />
            </Button>
          </div>

          <div className="lobby-tips">
            <Icon name="sparkle" size={12} />
            <span>این کلاس به‌طور خودکار ضبط می‌شود و متن آن قابل جستجو خواهد بود.</span>
          </div>
        </div>
      </div>
    </main>
  );
};

const TutorPanel = () => {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    { from: "ai", t: "سلام نسرین. وقتی روی مفهومی مکث کردی یا سوالی داشتی، اینجا بپرس — جریان کلاس قطع نمی‌شود.", src: "system" },
    { from: "user", t: "تفاوت مومنتوم با میانگین متحرک نمایی چیست؟" },
    { from: "ai", t: "خوب پرسیدی. در واقع فرمولی که الان روی اسلاید است، خود یک EMA است روی گرادیان‌ها. β همان ضریب وزن گذشته است.", src: "lec-8 · 28:42" },
  ]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", t: input }]);
    const q = input;
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "ai", t: "اجازه بده روی همین مفهوم بیشتر توضیح بدم: " + q + " — این به عنوان یک نمونه‌ی واقعی در جلسه‌ی جاری مطرح شده.", src: "RAG · concept" }]);
    }, 600);
  };

  return (
    <div className="aside-panel">
      <div className="aside-head">
        <h4 className="flex items-center gap-2" >
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
            </div>
          </div>
        ))}
      </div>
      <form className="tutor-input" onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="بپرس... (مثلاً: یک مثال ساده‌تر بزن)" />
        <button className="tool-btn primary" type="submit" aria-label="ارسال"><Icon name="send" size={16} /></button>
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
        <h4 className="flex items-center gap-2" >
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
            <div className="mt-0.5" >{l.t}</div>
          </div>
        ))}
      </div>
      <div className="tutor-input">
        <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={() => window.toast?.("جستجو در متن جلسه")}>
          <Icon name="search" size={12} />جستجو در متن این کلاس
        </Button>
      </div>
    </div>
  );
};

const QAPanel = () => {
  const [questions, setQuestions] = React.useState([
    { who: "نسرین", t: "آیا با Adam مومنتوم ادغام شده است؟", up: 12, answered: false },
    { who: "ساره", t: "نرخ یادگیری چطور با مومنتوم تنظیم می‌شود؟", up: 8, answered: true },
    { who: "علی", t: "در عمل کدام در PyTorch پیش‌فرض است؟", up: 5, answered: false },
    { who: "بهنام", t: "تفاوت SGD معمولی با Nesterov چیست؟", up: 3, answered: false },
  ]);
  const [draft, setDraft] = React.useState("");

  const upvote = (i) => setQuestions((q) => q.map((x, idx) => idx === i ? { ...x, up: x.up + 1 } : x));
  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setQuestions([{ who: "شما", t: draft, up: 1, answered: false }, ...questions]);
    setDraft("");
    window.toast?.({ title: "سوال ارسال شد", msg: "استاد به زودی پاسخ می‌دهد.", kind: "success" });
  };

  return (
    <div className="aside-panel">
      <div className="aside-head">
        <h4>پرسش و پاسخ · {toFa(questions.length)} سوال</h4>
        <span className="pill pill-amber" style={{ fontSize: 9 }}>۲ خوشه</span>
      </div>
      <div className="aside-body scrollable">
        <div className="rounded-xl p-3"  style={{background: "color-mix(in oklch, var(--violet) 8%, var(--surface-2))", border: "1px solid color-mix(in oklch, var(--violet) 30%, transparent)", fontSize: 12, lineHeight: 1.6}}>
          <div className="flex items-center gap-2 mb-2"  style={{ color: "var(--violet)", fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em"}}>
            <Icon name="sparkle" size={11} />
            AI COACH · خوشه‌بندی
          </div>
          ۳ سوال مشابه درباره‌ی «تفاوت مومنتوم با Adam» مطرح شده. پیشنهاد می‌کنم استاد در ۲ دقیقه بعدی یک مقایسه‌ی کوتاه ارائه دهد.
        </div>
        {questions.map((q, i) => (
          <div className="p-3 rounded-xl" key={i}  style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
            <div className="flex items-center justify-between mb-2" >
              <div className="flex items-center gap-2"  style={{ fontSize: 12, color: "var(--fg-mute)"}}>
                <div className="grid"  style={{width: 22, height: 22, borderRadius: 50, background: "var(--surface-3)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 10}}>{q.who[0]}</div>
                {q.who}
              </div>
              <div className="flex items-center gap-2" >
                {q.answered && <span className="pill pill-cyan" style={{ fontSize: 9 }}>پاسخ شده</span>}
                <button className="rounded-md cursor-pointer" onClick={() => upvote(i)}  style={{background: "transparent", border: "1px solid var(--line)", padding: "2px 8px", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>▲ {toFa(q.up)}</button>
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>{q.t}</div>
          </div>
        ))}
      </div>
      <form className="tutor-input" onSubmit={submit}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="سوال جدید بنویس..." aria-label="سوال جدید" />
        <button type="submit" className="tool-btn primary" disabled={!draft.trim()} aria-label="ارسال سوال"><Icon name="send" size={16} /></button>
      </form>
    </div>
  );
};

export default ClassroomPage;
