// Phase-A R6 — Classroom AI side panel.
//
// 4 tabs (دستیار · زیرنویس · پرسش · نظرسنجی), each with its own
// sticky head, content area, and (for chat + transcript) a chip-row
// + input. The panel renders as a sticky aside at ≥920px, or as a
// bottom sheet on phones (open prop wires the sheet).
//
// Every list/poll item is mock-only; the <MockBadge /> appears in
// each section head so the visitor knows.

import React from "react";
import { Icon } from "../../icons";
import { MockBadge } from "../dashboards/MockBadge";
import {
  AI_TABS,
  INITIAL_CHAT,
  INITIAL_POLL,
  POLL_TIMELINE,
  QUESTIONS,
  SUGGESTIONS,
  TRANSCRIPT_LIVE_POOL,
  TRANSCRIPT_SEED,
  type ChatTurn,
  type PollState,
  type QAItem,
  type TranscriptEntry,
  Pill,
  nowFa,
  renderHighlight,
} from "./classroom-atoms";

/* ============================================================
   Chat tab
============================================================ */

const ChatTab: React.FC = () => {
  const [chat, setChat] = React.useState<ChatTurn[]>(INITIAL_CHAT);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, typing]);

  const send = React.useCallback((override?: string) => {
    const t = (override ?? draft).trim();
    if (!t) return;
    const now = nowFa();
    setChat((c) => [...c, { role: "me", time: now, text: t }]);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setChat((c) => [
        ...c,
        {
          role: "ai",
          time: nowFa(),
          text: "گام‌به‌گام توضیح می‌دهم: ابتدا گرادیان را برای یک نمونه محاسبه کن، سپس θ را با ضریب η به‌روزرسانی کن. در ۱۰۰۰ تکرار به همگرایی نزدیک می‌شود.",
          actions: true,
        },
      ]);
    }, 1100);
  }, [draft]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(120, el.scrollHeight) + "px";
  };

  return (
    <>
      <div className="r6-ai-body scroll-thin">
        <div className="r6-ai-section-head">
          <Icon name="bot" className="ic" />
          دستیار درس · حافظه‌ی این جلسه فعال است
          <MockBadge size="sm" />
        </div>
        {chat.map((m, i) => (
          <div key={i} className={"r6-msg is-" + m.role}>
            <div className="r6-msg-avatar">{m.role === "ai" ? "AI" : "س"}</div>
            <div className="r6-msg-col">
              <div className="r6-msg-body">
                {m.text}
                {m.code ? <pre className="r6-msg-code">{m.code}</pre> : null}
                {m.actions ? (
                  <div className="r6-msg-actions">
                    <button type="button" title="کپی"><Icon name="copy" className="ic" /> کپی</button>
                    <button type="button" title="ذخیره"><Icon name="bookmark" className="ic" /> ذخیره</button>
                    <button type="button" title="مفید بود"><Icon name="thumbsUp" className="ic" /> مفید</button>
                  </div>
                ) : null}
              </div>
              <div className="r6-msg-meta">{m.time}</div>
            </div>
          </div>
        ))}
        {typing ? (
          <div className="r6-msg is-ai">
            <div className="r6-msg-avatar">AI</div>
            <div className="r6-msg-body r6-msg-typing">
              <span className="r6-typing-dots" aria-hidden="true">
                <span /><span /><span />
              </span>
              <span>در حال تحلیل…</span>
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="r6-ai-suggest-row">
        {SUGGESTIONS.map((s) => (
          <button key={s.id} type="button" className="r6-chip" onClick={() => send(s.text)}>
            {s.text}
            <Icon name={s.icon} className="ic" />
          </button>
        ))}
      </div>

      <div className="r6-ai-input">
        <div className="r6-ai-input-wrap">
          <textarea
            ref={taRef}
            className="r6-ai-input-field"
            placeholder="سؤالت رو بپرس… (Shift+Enter برای خط جدید)"
            rows={1}
            value={draft}
            onChange={autoResize}
            onKeyDown={onKey}
            aria-label="پیام به دستیار"
          />
        </div>
        <button
          type="button"
          className="r6-send-btn"
          disabled={!draft.trim()}
          onClick={() => send()}
          aria-label="ارسال"
          title="ارسال"
        >
          <Icon name="send" />
        </button>
      </div>
    </>
  );
};

/* ============================================================
   Live transcript tab
============================================================ */

const LiveTab: React.FC = () => {
  const [entries, setEntries] = React.useState<TranscriptEntry[]>(TRANSCRIPT_SEED);
  const [highlight, setHighlight] = React.useState("");
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let i = 0;
    const id = window.setInterval(() => {
      const next = TRANSCRIPT_LIVE_POOL[i % TRANSCRIPT_LIVE_POOL.length];
      const fresh: TranscriptEntry = { ...next, time: nowFa(), fresh: true };
      setEntries((e) => [...e.map((x) => ({ ...x, fresh: false })), fresh]);
      i++;
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = highlight
    ? entries.filter((e) => e.text.includes(highlight) || e.who.includes(highlight))
    : entries;

  return (
    <>
      <div className="r6-ai-body scroll-thin">
        <div className="r6-transcript-head">
          <Icon name="mic" className="ic" />
          ترجمه و رونویسی زنده · فارسی
          <span className="r6-wave" aria-hidden="true">
            <span /><span /><span /><span /><span /><span />
          </span>
          <MockBadge size="sm" />
        </div>
        <div className="r6-chip-row">
          <Pill active={!highlight} onClick={() => setHighlight("")}>همه</Pill>
          <Pill active={highlight === "دکتر عظیمی"} onClick={() => setHighlight("دکتر عظیمی")}>فقط استاد</Pill>
          <Pill active={highlight === "?"} onClick={() => setHighlight("?")}>سؤال‌ها</Pill>
          <Pill active={highlight === "Momentum"} onClick={() => setHighlight("Momentum")}>کلیدواژه: Momentum</Pill>
        </div>
        {filtered.map((e, i) => (
          <div key={i} className={"r6-tr-entry" + (e.fresh ? " is-fresh" : "")}>
            <div className="r6-tr-meta">
              <span className="r6-tr-speaker">{e.who}</span>
              {e.host ? <span className="r6-tr-role-host">استاد</span> : null}
              <span className="r6-tr-time">{e.time}</span>
            </div>
            <div className="r6-tr-text">
              {e.highlight ? renderHighlight(e.text, e.highlight) : e.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="r6-ai-suggest-row">
        <button type="button" className="r6-chip"><Icon name="download" className="ic" /> دانلود رونویسی</button>
        <button type="button" className="r6-chip"><Icon name="sparkleSm" className="ic" /> خلاصه‌ی جلسه</button>
        <button type="button" className="r6-chip"><Icon name="bookmark" className="ic" /> نشانه‌گذاری</button>
      </div>
    </>
  );
};

/* ============================================================
   Q&A tab
============================================================ */

const QATab: React.FC = () => {
  const [items, setItems] = React.useState<QAItem[]>(QUESTIONS);
  const [askText, setAskText] = React.useState("");

  const vote = (id: number, dir: 1 | -1): void => {
    setItems((arr) =>
      arr.map((it) =>
        it.id === id
          ? { ...it, votes: it.votes + dir, voted: dir > 0 }
          : it,
      ),
    );
  };

  const ask = (): void => {
    const t = askText.trim();
    if (!t) return;
    setItems((arr) => [
      {
        id: Date.now(),
        author: "سارا (شما)",
        init: "س",
        time: "اکنون",
        q: t,
        votes: 1,
        answered: false,
        voted: true,
      },
      ...arr,
    ]);
    setAskText("");
  };

  const sorted = [...items].sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.votes - a.votes,
  );

  return (
    <div className="r6-ai-body scroll-thin">
      <div className="r6-ai-section-head">
        <Icon name="question" className="ic" />
        پرسش و پاسخ ساختاریافته
        <span className="r6-tag-count">{items.length}</span>
        <MockBadge size="sm" />
      </div>

      <div className="r6-qa-ask">
        <div className="r6-qa-ask-row">
          <input
            type="text"
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
            placeholder="سؤال خودتو بنویس…"
            aria-label="نوشتن سؤال"
          />
          <button
            type="button"
            className="r6-send-btn r6-send-btn-sm"
            onClick={ask}
            aria-label="ارسال سؤال"
          >
            <Icon name="arrow" />
          </button>
        </div>
        <div className="r6-qa-ask-hint">
          سؤال‌های شما برای استاد نمایان می‌شود · ناشناس: <strong>خاموش</strong>
        </div>
      </div>

      {sorted.map((q) => (
        <div key={q.id} className={"r6-qa-card" + (q.pinned ? " is-pinned" : "")}>
          <div className="r6-qa-head">
            <span className="r6-qa-avatar">{q.init}</span>
            <span className="r6-qa-author">{q.author}</span>
            {q.tag ? (
              <span
                className={
                  "r6-qa-tag" +
                  (q.tag === "هایلایت" ? " is-gold" : q.tag === "کاربردی" ? " is-good" : "")
                }
              >
                {q.tag}
              </span>
            ) : null}
            {q.pinned ? <Icon name="pin" /> : null}
            <span className="r6-qa-time">{q.time}</span>
          </div>
          <div className="r6-qa-q">{q.q}</div>
          <div className="r6-qa-meta">
            <button
              type="button"
              className={"r6-vote" + (q.voted ? " is-up" : "")}
              onClick={() => vote(q.id, q.voted ? -1 : 1)}
              aria-label={q.voted ? "حذف رأی" : "رأی مثبت"}
            >
              <Icon name="thumbsUp" />
              <span className="num">{q.votes}</span>
            </button>
            {q.answered ? (
              <span className="r6-answered">
                <Icon name="check" /> پاسخ داده شد
              </span>
            ) : (
              <span className="r6-qa-queue">در صف پاسخ</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   Poll tab
============================================================ */

const PollTab: React.FC = () => {
  const [poll, setPoll] = React.useState<PollState>(INITIAL_POLL);

  React.useEffect(() => {
    if (!poll.open) return;
    const id = window.setInterval(() => {
      setPoll((p) =>
        p.timeLeft <= 0
          ? { ...p, open: false }
          : { ...p, timeLeft: p.timeLeft - 1 },
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [poll.open]);

  const total = poll.options.reduce((a, b) => a + b.votes, 0);

  const choose = (id: string): void => {
    if (poll.chose || !poll.open) return;
    setPoll((p) => ({
      ...p,
      chose: id,
      options: p.options.map((o) =>
        o.id === id ? { ...o, votes: o.votes + 1 } : o,
      ),
    }));
  };

  return (
    <div className="r6-ai-body scroll-thin">
      <div className="r6-ai-section-head">
        <Icon name="target" className="ic" />
        نظرسنجی زنده‌ی استاد
        <span className="r6-tag-count">
          {poll.open ? `${poll.timeLeft.toString().padStart(2, "0")}s` : "بسته"}
        </span>
        <MockBadge size="sm" />
      </div>

      <div className="r6-poll-card">
        <div className="r6-poll-eyebrow">POLL · پاسخ تک‌گزینه‌ای</div>
        <div className="r6-poll-q">{poll.q}</div>

        <div className="r6-poll-options">
          {poll.options.map((o) => {
            const pct = total ? Math.round((o.votes / total) * 100) : 0;
            const isMine = poll.chose === o.id;
            const showResults = !!poll.chose || !poll.open;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.id)}
                disabled={showResults}
                className={
                  "r6-poll-opt" +
                  (isMine ? " is-mine" : "") +
                  (showResults && o.correct ? " is-correct" : "") +
                  (showResults ? " is-results" : "")
                }
              >
                {showResults ? (
                  <span
                    className="r6-poll-opt-bar"
                    style={{ width: pct + "%" }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="r6-poll-opt-inner">
                  <span className="r6-poll-opt-letter">{o.id.toUpperCase()}</span>
                  <span className="r6-poll-opt-label">{o.label}</span>
                  {showResults ? (
                    <>
                      <span className="num r6-poll-opt-pct">{pct}٪</span>
                      {o.correct && !poll.open ? <Icon name="check" /> : null}
                    </>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="r6-poll-foot">
          <Icon name="users" />
          <span><b className="num">{total}</b> رأی</span>
          <span className="r6-poll-foot-right">
            {poll.open ? `بسته‌شدن: ${poll.timeLeft}s` : "نتیجه نهایی"}
          </span>
        </div>
      </div>

      <div className="r6-tl">
        <div className="r6-tl-eyebrow">خط‌زمان مفاهیم این جلسه</div>
        <div className="r6-tl-card">
          {POLL_TIMELINE.map((row, i) => (
            <div
              key={i}
              className={
                "r6-tl-row" +
                (!row.done ? " is-future" : "") +
                (row.now ? " is-now" : "")
              }
            >
              <span className="r6-tl-dot" aria-hidden="true" />
              <span className="r6-tl-time num">{row.t}</span>
              <span className="r6-tl-concept">{row.c}</span>
              {row.now ? <span className="r6-tl-now">NOW</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   AI Panel shell
============================================================ */

export interface AIPanelProps {
  /** Wide layouts pin this as a sticky aside; narrow uses a bottom sheet. */
  asSheet: boolean;
  open: boolean;
  onClose: () => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ asSheet, open, onClose }) => {
  const [tab, setTab] = React.useState<"chat" | "live" | "qa" | "poll">("chat");

  const content = (
    <>
      <div className="r6-ai-tabs" role="tablist" aria-label="بخش‌های دستیار">
        {AI_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={"r6-ai-tab" + (tab === t.id ? " is-active" : "")}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} className="ic" />
            <span>{t.label}</span>
            {t.count > 0 ? <span className="r6-ai-tab-count">{t.count}</span> : null}
          </button>
        ))}
        {asSheet ? (
          <button
            type="button"
            className="r6-icon-btn"
            onClick={onClose}
            aria-label="بستن پنل"
          >
            <Icon name="close" />
          </button>
        ) : null}
      </div>
      {tab === "chat" ? <ChatTab /> : null}
      {tab === "live" ? <LiveTab /> : null}
      {tab === "qa" ? <QATab /> : null}
      {tab === "poll" ? <PollTab /> : null}
    </>
  );

  if (asSheet) {
    return (
      <>
        <div
          className={"r6-sheet-backdrop" + (open ? " is-open" : "")}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={"r6-panel r6-ai-panel r6-ai-sheet" + (open ? " is-open" : "")}
          role="dialog"
          aria-label="دستیار هوشمند کلاس"
          aria-modal={open}
        >
          <div className="r6-sheet-handle" aria-hidden="true" />
          {content}
        </div>
      </>
    );
  }

  return (
    <aside className="r6-panel r6-ai-panel" aria-label="دستیار هوشمند کلاس">
      {content}
    </aside>
  );
};

export default AIPanel;
