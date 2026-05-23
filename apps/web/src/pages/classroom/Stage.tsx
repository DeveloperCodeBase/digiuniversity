// Phase-A R6 — Classroom stage.
//
// Composes the slide area (with animated canvas + REC badge + slide
// counter + AI insight + live caption + slide nav), the participant
// rail (vertical on wide / horizontal on narrow), the reactions row,
// and the control bar (mic / cam / screen / hand / notes / breakout /
// AI / leave). All wired to local React state — Phase D will swap the
// LiveKit-specific behaviors in.

import React from "react";
import { Icon } from "../../icons";
import {
  CAPTION_QUEUE,
  PARTICIPANTS,
  SLIDES,
  SlideCanvas,
} from "./classroom-atoms";

/* ============================================================
   Participant rail
============================================================ */

const ParticipantRail: React.FC = () => (
  <div className="r6-rail scroll-thin" aria-label="فهرست شرکت‌کنندگان">
    {PARTICIPANTS.map((p) => (
      <div
        key={p.id}
        className={
          "r6-rail-tile" +
          (p.host ? " is-host" : "") +
          (p.speaking ? " is-speaking" : "")
        }
        title={p.name}
      >
        {p.speaking ? <span className="r6-speaking-indic" aria-hidden="true" /> : null}
        <span className="r6-rail-init">{p.init}</span>
        <span className="r6-rail-name">{p.name}</span>
        {p.host ? <span className="r6-rail-host">HOST</span> : null}
        {!p.mic ? (
          <span className="r6-rail-mic-off" aria-label="میکروفون خاموش">
            <Icon name="micOff" />
          </span>
        ) : null}
      </div>
    ))}
    <div className="r6-rail-more" aria-label="۳۵ شرکت‌کننده‌ی دیگر">+۳۵</div>
  </div>
);

/* ============================================================
   Slide viewer
============================================================ */

interface SlideViewProps {
  idx: number;
  setIdx: (n: number) => void;
}

const SlideView: React.FC<SlideViewProps> = ({ idx, setIdx }) => {
  const slide = SLIDES[idx];
  const [capIdx, setCapIdx] = React.useState(0);
  const [showInsight, setShowInsight] = React.useState(true);

  // Rotate captions on a 4.8s timer. Stops when the page unmounts.
  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setCapIdx((v) => (v + 1) % CAPTION_QUEUE.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, []);

  const caption = CAPTION_QUEUE[capIdx];

  return (
    <div className="r6-slide" role="img" aria-label={slide.title}>
      <SlideCanvas />
      <span className="r6-slide-rec" aria-label="درحال ضبط">
        REC · 00:45:49
      </span>
      <span className="r6-slide-counter">
        {(idx + 1).toString().padStart(2, "0")} / {SLIDES.length.toString().padStart(2, "0")}
      </span>

      {showInsight ? (
        <div className="r6-slide-insight" role="note">
          <button
            type="button"
            className="r6-insight-close"
            onClick={() => setShowInsight(false)}
            aria-label="بستن بصیرت AI"
          >
            <Icon name="close" />
          </button>
          <Icon name="lightbulb" className="ic" />
          <div>
            <strong>AI INSIGHT</strong>
            این مفهوم در آزمون پایان‌ترم با وزن ۱۸٪ ظاهر می‌شود. توصیه: حل ۳ مسئله‌ی فصل ۴.
          </div>
        </div>
      ) : null}

      <div className="r6-slide-content">
        <div className="r6-slide-eyebrow">{slide.eyebrow}</div>
        <h2 className="r6-slide-title">{slide.title}</h2>
        <div className="r6-slide-formula">{slide.formula}</div>
        <p className="r6-slide-body-text">{slide.body}</p>
      </div>

      <div className="r6-slide-caption" key={capIdx}>
        <span className="r6-cap-speaker">{caption.who}</span>
        {caption.text}
      </div>

      <div className="r6-slide-nav" role="group" aria-label="پیمایش اسلایدها">
        <button
          type="button"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          aria-label="اسلاید قبلی"
          title="اسلاید قبلی"
        >
          <Icon name="chevronRight" />
        </button>
        <span className="r6-slide-count num">
          {idx + 1} / {SLIDES.length}
        </span>
        <button
          type="button"
          onClick={() => setIdx(Math.min(SLIDES.length - 1, idx + 1))}
          disabled={idx === SLIDES.length - 1}
          aria-label="اسلاید بعدی"
          title="اسلاید بعدی"
        >
          <Icon name="chevronLeft" />
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   Reactions row + fly-up animation
============================================================ */

interface ReactionsProps {
  onReact: (emoji: string, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const REACTIONS = ["👏", "🎯", "💡", "❤️", "🔥", "🤔"];

const Reactions: React.FC<ReactionsProps> = ({ onReact }) => (
  <div className="r6-reactions" role="toolbar" aria-label="واکنش‌ها">
    {REACTIONS.map((r) => (
      <button
        key={r}
        type="button"
        className="r6-react-btn"
        onClick={(e) => onReact(r, e)}
        title={`واکنش ${r}`}
      >
        {r}
      </button>
    ))}
  </div>
);

/* ============================================================
   Control bar
============================================================ */

interface ControlBarProps {
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  onLeave: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ aiOpen, setAiOpen, onLeave }) => {
  const [mic, setMic] = React.useState(false);
  const [cam, setCam] = React.useState(false);
  const [share, setShare] = React.useState(false);
  const [hand, setHand] = React.useState(false);
  return (
    <div className="r6-controls" role="toolbar" aria-label="نوار کنترل کلاس">
      <div className="r6-ctl-group">
        <button
          type="button"
          className={"r6-ctl-btn" + (mic ? " is-active" : "")}
          onClick={() => setMic(!mic)}
          title={mic ? "خاموش کردن میکروفون" : "روشن کردن میکروفون"}
        >
          <Icon name={mic ? "mic" : "micOff"} className="ic" />
          <span className="r6-ctl-label">{mic ? "میکروفون" : "بی‌صدا"}</span>
        </button>
        <button
          type="button"
          className={"r6-ctl-btn" + (cam ? " is-active" : "")}
          onClick={() => setCam(!cam)}
          title={cam ? "خاموش کردن وب‌کم" : "روشن کردن وب‌کم"}
        >
          <Icon name="video" className="ic" />
          <span className="r6-ctl-label">دوربین</span>
        </button>
        <button
          type="button"
          className={"r6-ctl-btn" + (share ? " is-active" : "")}
          onClick={() => setShare(!share)}
          title="اشتراک صفحه"
        >
          <Icon name="screen" className="ic" />
          <span className="r6-ctl-label">اشتراک</span>
        </button>
        <button
          type="button"
          className={"r6-ctl-btn" + (hand ? " is-active" : "")}
          onClick={() => setHand(!hand)}
          title="درخواست صحبت"
        >
          <Icon name="hand" className="ic" />
          <span className="r6-ctl-label">دست</span>
        </button>
      </div>

      <div className="r6-ctl-group">
        <button type="button" className="r6-ctl-btn is-icon-only" title="یادداشت" aria-label="یادداشت">
          <Icon name="note" className="ic" />
        </button>
        <button type="button" className="r6-ctl-btn is-icon-only" title="گروه‌بندی" aria-label="گروه‌بندی">
          <Icon name="breakout" className="ic" />
        </button>
        <button
          type="button"
          className={"r6-ctl-btn is-ai" + (aiOpen ? " is-active" : "")}
          onClick={() => setAiOpen(!aiOpen)}
          title="دستیار هوشمند"
        >
          <Icon name="sparkles" className="ic r6-ai-spark" />
          <span className="r6-ctl-label">دستیار AI</span>
        </button>
      </div>

      <span className="r6-conn-pill" aria-label="کیفیت اتصال">
        <span className="r6-bars" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </span>
        <span className="num">۴۲ms · HD</span>
      </span>

      <button
        type="button"
        className="r6-ctl-btn is-danger"
        title="خروج از کلاس"
        onClick={onLeave}
      >
        <Icon name="phoneOff" className="ic" />
        <span className="r6-ctl-label">خروج</span>
      </button>
    </div>
  );
};

/* ============================================================
   Stage
============================================================ */

export interface StageProps {
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  onLeave: () => void;
}

interface FlyReact {
  id: number;
  r: string;
  x: number;
  y: number;
}

export const Stage: React.FC<StageProps> = ({ aiOpen, setAiOpen, onLeave }) => {
  const [idx, setIdx] = React.useState(0);
  const [flies, setFlies] = React.useState<FlyReact[]>([]);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  const handleReact = (r: string, e: React.MouseEvent<HTMLButtonElement>): void => {
    const id = Date.now() + Math.random();
    const rect = wrapRef.current?.getBoundingClientRect();
    const btnRect = e.currentTarget.getBoundingClientRect();
    let x = 100;
    let y = 200;
    if (rect) {
      x = btnRect.left - rect.left + btnRect.width / 2;
      y = btnRect.top - rect.top;
    }
    setFlies((f) => [...f, { id, r, x, y }]);
    window.setTimeout(() => {
      setFlies((f) => f.filter((it) => it.id !== id));
    }, 1600);
  };

  return (
    <section className="r6-panel r6-stage" aria-label="صحنه کلاس زنده">
      <div className="r6-stage-top scroll-thin">
        <span className="r6-tag is-primary">
          <Icon name="screen" className="ic" />
          نمایش اسلاید
        </span>
        <span className="r6-tag is-gold">
          <Icon name="sparkles" className="ic" />
          AI همگام
        </span>
        <span className="r6-tag">
          <Icon name="text" className="ic" />
          زیرنویس
        </span>
        <span className="r6-tag">
          <Icon name="eye" className="ic" />
          توجه ۸۹٪
        </span>
        <span className="r6-tag">
          <Icon name="layers" className="ic" />
          فصل ۴
        </span>
      </div>

      <div className="r6-stage-body">
        <ParticipantRail />
        <div className="r6-stage-main" ref={wrapRef}>
          <div className="r6-slide-wrap">
            <SlideView idx={idx} setIdx={setIdx} />
            <Reactions onReact={handleReact} />
          </div>
          {flies.map((f) => (
            <span
              key={f.id}
              className="r6-react-fly"
              style={{ left: f.x, top: f.y }}
              aria-hidden="true"
            >
              {f.r}
            </span>
          ))}
        </div>
      </div>

      <ControlBar aiOpen={aiOpen} setAiOpen={setAiOpen} onLeave={onLeave} />
    </section>
  );
};

export default Stage;
