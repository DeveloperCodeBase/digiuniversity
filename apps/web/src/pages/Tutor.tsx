// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// AI Tutor chat surface.
//
// Reads /api/v1/tutor/sessions and lets the user open or start a
// conversation. Each ask posts to /sessions/:id/ask which forwards
// through the AI bridge to ai-gateway /v1/rag/query — and writes one
// row in AiInteractionLog plus a learning_event of type
// "ai_tutor_asked" (emitted server-side, no client work needed).
// =====================================================

import React from "react";
import { Icon } from "../icons";
import { useAuth } from "../auth/AuthContext";
import { tutorApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { toFa } from "../shared";
import { formatJalaliDate } from "../i18n/format.js";
import { Button } from "../ui";

const SignInPrompt = ({ go }) => (
  <main className="shell" style={{ paddingTop: 80, paddingBottom: 80 }}>
    <div
      className="rounded-2xl"
      style={{
        padding: 40,
        background: "var(--surface)",
        border: "1px solid var(--line)",
        maxWidth: 560,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <Icon name="lock" size={28} />
      <h2 className="h-2 mt-4">برای استفاده از دستیار AI وارد شوید</h2>
      <Button variant="primary" className="mt-7" onClick={() => go("login")}>
        ورود به حساب
        <Icon name="arrow" size={14} />
      </Button>
    </div>
  </main>
);

const Message = ({ m }) => {
  const isUser = m.role === "user";
  const citations = Array.isArray(m.citations) ? m.citations : [];
  return (
    <div
      className="flex"
      style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div
        className="rounded-2xl"
        style={{
          padding: "12px 16px",
          maxWidth: "78%",
          background: isUser
            ? "var(--accent-soft)"
            : "var(--surface)",
          border: "1px solid " + (isUser ? "var(--accent)" : "var(--line)"),
          color: isUser ? "var(--accent)" : "var(--fg)",
          lineHeight: 1.8,
          fontSize: 14,
          whiteSpace: "pre-wrap",
        }}
      >
        <div>{m.content}</div>
        {!isUser && citations.length > 0 && (
          <div className="mt-3" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em" }}>
              منابع
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 6 }}>
              {citations.map((c, i) => (
                <li
                  key={c.id || i}
                  className="flex items-center justify-between"
                  style={{ fontSize: 12, paddingBlock: 4 }}
                >
                  <span>{c.title || c.id}</span>
                  {typeof c.score === "number" && (
                    <span className="mono" style={{ color: "var(--fg-mute)" }}>
                      {toFa(c.score.toFixed(2))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isUser && (typeof m.confidence === "number" || m.humanReviewRequired) && (
          <div className="mt-2 flex gap-3" style={{ fontSize: 11, color: "var(--fg-mute)" }}>
            {typeof m.confidence === "number" && (
              <span>اعتماد: {toFa(m.confidence.toFixed(2))}</span>
            )}
            {m.humanReviewRequired && (
              <span style={{ color: "var(--warn)" }}>نیاز به بازبینی انسانی</span>
            )}
            {m.aiRequestId && (
              <span className="mono" style={{ direction: "ltr" }}>
                {m.aiRequestId}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TutorPage = ({ go }) => {
  const { isAuthenticated } = useAuth();
  const [loadingSessions, setLoadingSessions] = React.useState(true);
  const [sessions, setSessions] = React.useState([]);
  const [activeId, setActiveId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const scrollRef = React.useRef(null);

  const reloadSessions = React.useCallback(async () => {
    setLoadingSessions(true);
    try {
      const list = await tutorApi.listSessions();
      setSessions(list);
      // If nothing selected yet, pick the most recent.
      if (!activeId && list.length > 0) {
        setActiveId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : err.message);
    } finally {
      setLoadingSessions(false);
    }
  }, [activeId]);

  React.useEffect(() => {
    if (isAuthenticated) reloadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    tutorApi
      .getSession(activeId)
      .then((s) => {
        if (cancelled) return;
        setMessages(s.messages || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.displayMessage : err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isAuthenticated) return <SignInPrompt go={go} />;

  const newSession = async () => {
    try {
      const s = await tutorApi.createSession({});
      await reloadSessions();
      setActiveId(s.id);
    } catch (err) {
      window.toast?.({
        title: "ایجاد گفت‌و‌گو ناموفق",
        msg: err instanceof ApiError ? err.displayMessage : err.message,
        kind: "warn",
      });
    }
  };

  const send = async () => {
    const q = input.trim();
    if (!q || !activeId) return;
    setPending(true);
    setError(null);

    // Optimistic user bubble so the chat feels responsive.
    const tempUserId = "tmp_" + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: q, createdAt: new Date().toISOString() },
    ]);
    setInput("");

    try {
      const res = await tutorApi.ask(activeId, { question: q });
      setMessages((prev) => {
        // Replace the optimistic bubble with the persisted user msg + assistant.
        const without = prev.filter((m) => m.id !== tempUserId);
        return [...without, res.userMessage, res.assistantMessage];
      });
      // Refresh the session list so titles + lastMessageAt are current.
      reloadSessions();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : err.message);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
      setInput(q);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="shell" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="eyebrow">AI TUTOR · دستیار آموزشی</span>
          <h1 className="h-1 mt-3">گفت‌و‌گو با دستیار AI</h1>
          <p style={{ color: "var(--fg-mute)", marginTop: 12, maxWidth: 700 }}>
            هر پرسش از سرویس <code style={{ direction: "ltr" }}>/api/v1/tutor/sessions/:id/ask</code>
            عبور می‌کند، در <code style={{ direction: "ltr" }}>AiInteractionLog</code> ثبت می‌شود
            و یک رویداد <code style={{ direction: "ltr" }}>ai_tutor_asked</code> برای داشبورد
            تحلیلی شما تولید می‌کند.
          </p>
        </div>
        <Button variant="primary" onClick={newSession}>
          <Icon name="sparkle" size={14} />
          گفت‌و‌گوی جدید
        </Button>
      </header>

      <section
        className="mt-7 tutor-grid"
        style={{
          display: "grid",
          gap: 20,
          minHeight: 540,
        }}
      >
        {/* sidebar */}
        <aside
          className="rounded-2xl"
          style={{ padding: 14, background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <div
            className="mono"
            style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em", padding: "0 4px 8px" }}
          >
            گفت‌و‌گوها
          </div>
          {loadingSessions ? (
            <p style={{ color: "var(--fg-mute)", fontSize: 13, padding: "8px 4px" }}>
              در حال بارگذاری...
            </p>
          ) : sessions.length === 0 ? (
            <p style={{ color: "var(--fg-mute)", fontSize: 13, padding: "8px 4px" }}>
              هنوز گفت‌و‌گویی شروع نکرده‌اید.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {sessions.map((s) => {
                const active = s.id === activeId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(s.id)}
                      style={{
                        textAlign: "right",
                        width: "100%",
                        padding: "10px 12px",
                        background: active ? "var(--accent-soft)" : "transparent",
                        border: "1px solid " + (active ? "var(--accent)" : "transparent"),
                        borderRadius: 10,
                        color: active ? "var(--accent)" : "var(--fg)",
                        fontFamily: "inherit",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{s.title}</div>
                      <div
                        style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2, direction: "ltr", textAlign: "left" }}
                      >
                        {toFa(String(s._count?.messages ?? 0))} پیام ·{" "}
                        {formatJalaliDate(s.lastMessageAt)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* chat */}
        <section
          className="rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            minHeight: 540,
          }}
        >
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: 18,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: "60vh",
            }}
          >
            {!activeId ? (
              <div style={{ color: "var(--fg-mute)", textAlign: "center", marginTop: 60 }}>
                از سمت راست یک گفت‌و‌گو انتخاب کنید یا یکی جدید بسازید.
              </div>
            ) : loadingMessages ? (
              <p style={{ color: "var(--fg-mute)" }}>در حال بارگذاری پیام‌ها...</p>
            ) : messages.length === 0 ? (
              <div style={{ color: "var(--fg-mute)", textAlign: "center", marginTop: 40 }}>
                <Icon name="sparkle" size={28} />
                <p className="mt-3" style={{ fontSize: 14 }}>
                  هر پرسشی که دارید بپرسید — از مفاهیم درس تا تمرین‌های عملی.
                </p>
                {/* F-36: starter prompts so first-time users have a click-to-ask path */}
                <div
                  className="mt-5"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  {[
                    "تفاوت overfitting و underfitting چیست؟",
                    "الگوریتم درخت تصمیم را با مثال توضیح بده.",
                    "ساختمان داده پشته را با مثال شرح بده.",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="pill"
                      onClick={() => setInput(q)}
                      style={{
                        cursor: "pointer",
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                        padding: "8px 14px",
                        fontSize: 12,
                        color: "var(--fg)",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => <Message key={m.id} m={m} />)
            )}
            {pending && (
              <div className="flex" style={{ justifyContent: "flex-start" }}>
                <div
                  className="rounded-2xl"
                  style={{
                    padding: "12px 16px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: "var(--fg-mute)",
                    fontSize: 13,
                  }}
                >
                  دستیار در حال پاسخ‌دهی...
                </div>
              </div>
            )}
          </div>

          {activeId && (
            <div
              style={{
                borderTop: "1px solid var(--line)",
                padding: 14,
                display: "flex",
                gap: 10,
              }}
            >
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="پرسش خود را اینجا بنویسید..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: 14,
                  resize: "none",
                }}
                disabled={pending}
              />
              <Button variant="primary" onClick={send}
                disabled={pending || !input.trim()}
                aria-label="ارسال پرسش به دستیار AI"
                style={{ alignSelf: "stretch" }}
              >
                ارسال
                <Icon name="arrow" size={14} />
              </Button>
            </div>
          )}
        </section>
      </section>

      {error && (
        <div
          className="mt-5 rounded-lg"
          style={{
            padding: "10px 14px",
            background: "color-mix(in oklch, var(--warn) 18%, var(--bg))",
            border: "1px solid var(--warn)",
            color: "var(--warn)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </main>
  );
};

export default TutorPage;
