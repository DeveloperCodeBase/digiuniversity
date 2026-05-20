// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Shared UI primitives: Toast, Modal, IconButton,
// Theme Provider, Command Palette, AI Floating FAB.
// All globally available via <UIRoot/>.
// =====================================================
import React from "react";
import { Icon } from "./icons";

const ToastContext = React.createContext({ push: () => {} });
const ThemeContext = React.createContext({ theme: "dark", setTheme: () => {} });

export const useToast = () => React.useContext(ToastContext);
export const useTheme = () => React.useContext(ThemeContext);

// ---------- IconButton ----------
export const IconButton = ({ icon, label, onClick, variant = "ghost", size = 14, className = "", ...rest }) => (
  <button
    type="button"
    className={`btn btn-${variant} icon-btn ${className}`}
    onClick={onClick}
    aria-label={label}
    title={label}
    {...rest}
  >
    <Icon name={icon} size={size} />
  </button>
);

export const stubAction = (msg) => () => window.toast?.(msg || "این عملیات در نسخه‌ی نمایشی فعال نیست.");

// ---------- ThemeProvider ----------
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = React.useState(() => {
    try { return localStorage.getItem("digiu_theme") || "dark"; } catch { return "dark"; }
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const setTheme = (t) => {
    setThemeState(t);
    try { localStorage.setItem("digiu_theme", t); } catch {}
  };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

// ---------- Command Palette ----------
const COMMANDS = [
  { id: "home", label: "خانه", icon: "home", route: "home", hint: "صفحه اصلی" },
  { id: "dashboard", label: "میز کار دانشجو", icon: "home", route: "dashboard" },
  { id: "classroom", label: "کلاس زنده", icon: "live", route: "classroom" },
  { id: "course", label: "درس من", icon: "book", route: "course" },
  { id: "calendar", label: "تقویم", icon: "calendar", route: "calendar" },
  { id: "library", label: "کتابخانه", icon: "folder", route: "library" },
  { id: "labs", label: "آزمایشگاه‌های مجازی", icon: "flask", route: "labs" },
  { id: "recordings", label: "آرشیو ضبط‌ها", icon: "video", route: "recordings" },
  { id: "search", label: "جستجوی معنایی", icon: "search", route: "search" },
  { id: "community", label: "جامعه", icon: "users", route: "community" },
  { id: "messages", label: "پیام‌ها", icon: "chat", route: "messages" },
  { id: "inbox", label: "اعلان‌ها", icon: "bell", route: "inbox" },
  { id: "officehours", label: "Office Hours", icon: "headset", route: "officehours" },
  { id: "assessment", label: "آزمون تطبیقی", icon: "chip", route: "assessment" },
  { id: "submission", label: "تحویل تمرین", icon: "check", route: "submission" },
  { id: "transcript", label: "کارنامه", icon: "file", route: "transcript" },
  { id: "degree-audit", label: "مسیر مدرک", icon: "target", route: "degree-audit" },
  { id: "registration", label: "ثبت‌نام واحد", icon: "plus", route: "registration" },
  { id: "career", label: "خدمات شغلی", icon: "bolt", route: "career" },
  { id: "financial-aid", label: "کمک‌هزینه و بورسیه", icon: "dollar", route: "financial-aid" },
  { id: "wellness", label: "سلامت و مشاوره", icon: "shield", route: "wellness" },
  { id: "credential", label: "گواهی دیجیتال", icon: "cert", route: "credential" },
  { id: "alumni", label: "شبکه فارغ‌التحصیلان", icon: "grad", route: "alumni" },
  { id: "hackathons", label: "هکاتون‌ها و رقابت", icon: "trophy", route: "hackathons" },
  { id: "honor-code", label: "منشور صداقت علمی", icon: "shield", route: "honor-code" },
  { id: "schools", label: "دانشکده‌ها", icon: "grad", route: "schools" },
  { id: "faculty", label: "هیات علمی", icon: "users", route: "faculty" },
  { id: "research", label: "پژوهش", icon: "flask", route: "research" },
  { id: "events", label: "رویدادها", icon: "live", route: "events" },
  { id: "pricing", label: "پلن‌ها و قیمت", icon: "dollar", route: "pricing" },
  { id: "help", label: "پشتیبانی", icon: "headset", route: "help" },
  { id: "about", label: "درباره ما", icon: "globe", route: "about" },
  { id: "instructor", label: "کنسول استاد", icon: "grad", route: "instructor" },
  { id: "authoring", label: "استودیوی تولید درس", icon: "sparkle", route: "authoring" },
  { id: "analytics", label: "تحلیل‌گری نهادی", icon: "chart", route: "analytics" },
  { id: "admin", label: "میز مدیریت", icon: "settings", route: "admin" },
  { id: "parent", label: "میز والد", icon: "users", route: "parent" },
  { id: "profile", label: "پروفایل عمومی", icon: "user", route: "profile" },
  { id: "bookmarks", label: "ذخیره‌ها", icon: "star", route: "bookmarks" },
  { id: "achievements", label: "دستاوردها", icon: "trophy", route: "achievements" },
  { id: "settings", label: "تنظیمات", icon: "settings", route: "settings" },
  { id: "admissions", label: "پذیرش", icon: "shield", route: "admissions" },
  { id: "login", label: "ورود", icon: "user", route: "login" },
  { id: "theme-light", label: "تم روشن", icon: "sparkle", action: "theme-light" },
  { id: "theme-dark", label: "تم تیره", icon: "sparkle", action: "theme-dark" },
];

const CommandPalette = ({ open, onClose, onNavigate, setTheme }) => {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  const filtered = React.useMemo(() => {
    if (!q.trim()) return COMMANDS.slice(0, 12);
    const lower = q.toLowerCase();
    return COMMANDS.filter((c) =>
      c.label.toLowerCase().includes(lower) ||
      c.id.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [q]);

  React.useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  React.useEffect(() => { setSel(0); }, [q]);

  const exec = (c) => {
    onClose();
    if (c.action === "theme-light") setTheme("light");
    else if (c.action === "theme-dark") setTheme("dark");
    else if (c.route) onNavigate(c.route);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[sel]) exec(filtered[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk-panel" role="dialog" aria-label="پالت دستورات" aria-modal="true">
        <div className="cmdk-input-wrap">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="جستجوی صفحه، دستور یا تنظیم… (مثلا: کلاس، تم، گواهی)"
            aria-label="جستجوی دستورات"
            spellCheck="false"
            autoComplete="off"
          />
          <kbd className="cmdk-kbd">ESC</kbd>
        </div>
        <div className="cmdk-list" role="listbox">
          {filtered.length === 0 && (
            <div className="cmdk-empty">نتیجه‌ای یافت نشد.</div>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              className={"cmdk-item " + (i === sel ? "selected" : "")}
              onClick={() => exec(c)}
              onMouseEnter={() => setSel(i)}
              role="option"
              aria-selected={i === sel}
            >
              <span className="cmdk-icon"><Icon name={c.icon} size={14} /></span>
              <span className="cmdk-label">{c.label}</span>
              {c.hint && <span className="cmdk-hint">{c.hint}</span>}
            </button>
          ))}
        </div>
        <div className="cmdk-footer">
          <span><kbd>↑↓</kbd> ناوبری</span>
          <span><kbd>Enter</kbd> انتخاب</span>
          <span><kbd>Esc</kbd> بستن</span>
        </div>
      </div>
    </div>
  );
};

// ---------- AI Floating FAB (chat) ----------
const AIFloatingFAB = ({ onNavigate }) => {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { from: "ai", t: "سلام! من دستیار AI دیجی‌یونیورسیتی هستم. هر سوالی داری بپرس — درباره دروس، تمرین‌ها یا مسیر تحصیلی." },
  ]);
  const [input, setInput] = React.useState("");
  const bodyRef = React.useRef(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  const send = (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    const next = [...messages, { from: "me", t: q }];
    setMessages(next);
    setInput("");
    // Simulated AI reply
    setTimeout(() => {
      let reply = "بگذار بیشتر تحقیق کنم و در یک لحظه پاسخ می‌دهم.";
      const lower = q.toLowerCase();
      if (lower.includes("کلاس")) reply = "می‌توانم کلاس بعدی شما (CS-410) را باز کنم. می‌خواهی به آنجا برویم؟";
      else if (lower.includes("تمرین")) reply = "تمرین فعال شما «بهینه‌سازی SGD با مومنتوم» است با ۳ روز مهلت.";
      else if (lower.includes("نمره") || lower.includes("کارنامه")) reply = "GPA فعلی شما ۳.۸۲ است. در صفحه کارنامه جزئیات کامل را ببینید.";
      else if (lower.includes("استاد")) reply = "دکتر عظیمی استاد راهنمای CS-410 شماست. می‌توانید در Office Hours فردا ساعت ۱۴ ببینیدش.";
      else if (lower.includes("ثبت") || lower.includes("واحد")) reply = "پنجره ثبت‌نام ترم تابستان از ۵ تا ۲۰ شهریور باز است.";
      setMessages((m) => [...m, { from: "ai", t: reply }]);
    }, 600);
  };

  return (
    <>
      <button
        className="ai-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? "بستن دستیار AI" : "باز کردن دستیار AI"}
        aria-expanded={open}
      >
        <Icon name="sparkle" size={22} />
      </button>
      {open && (
        <div className="ai-panel" role="dialog" aria-label="دستیار AI">
          <header className="ai-panel-head">
            <div className="flex items-center gap-2.5" >
              <span className="ai-panel-dot" />
              <strong>دستیار AI</strong>
              <span style={{ fontSize: 11, color: "var(--fg-mute)" }}>گراند روی پروفایل شما</span>
            </div>
            <button className="ai-panel-close" onClick={() => setOpen(false)} aria-label="بستن">
              <Icon name="end" size={14} />
            </button>
          </header>
          <div ref={bodyRef} className="ai-panel-body">
            {messages.map((m, i) => (
              <div key={i} className={"ai-msg " + (m.from === "me" ? "me" : "ai")}>
                <div className="ai-av">{m.from === "me" ? "من" : "AI"}</div>
                <div className="ai-bubble">{m.t}</div>
              </div>
            ))}
          </div>
          <form className="ai-panel-input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="بپرس..."
              aria-label="پیام به دستیار AI"
            />
            <button type="submit" disabled={!input.trim()} aria-label="ارسال">
              <Icon name="send" size={14} />
            </button>
          </form>
          <div className="ai-panel-suggestions">
            <button onClick={() => { setInput("کلاس بعدی من چه زمانیه؟"); setTimeout(() => send(new Event("submit")), 50); }}>کلاس بعدی</button>
            <button onClick={() => onNavigate("course")}>دروس من</button>
            <button onClick={() => onNavigate("library")}>منابع</button>
          </div>
        </div>
      )}
    </>
  );
};

// ---------- UIRoot ----------
export const UIRoot = ({ children, onNavigate }) => {
  const [toasts, setToasts] = React.useState([]);
  const [modal, setModal] = React.useState(null);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const { setTheme, theme } = useTheme();

  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const item = (t && typeof t === "object" && !Array.isArray(t)) ? t : { msg: t };
    setToasts((arr) => [...arr, { id, kind: "info", ...item }]);
    const ttl = item.ttl ?? 3200;
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), ttl);
  }, []);
  const dismiss = (id) => setToasts((arr) => arr.filter((x) => x.id !== id));

  // global helpers
  React.useEffect(() => {
    window.toast = (m, opts = {}) => {
      if (m && typeof m === "object" && !Array.isArray(m)) push({ ...m, ...opts });
      else push({ msg: m, ...opts });
    };
    window.confirmAction = (opts) =>
      new Promise((resolve) => {
        setModal({
          ...opts,
          onConfirm: () => { setModal(null); resolve(true); },
          onCancel: () => { setModal(null); resolve(false); },
        });
      });
    window.openCommandPalette = () => setCmdOpen(true);
  }, [push]);

  // Cmd+K / Ctrl+K to open palette
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={"toast toast-" + (t.kind || "info")} role="status">
            <div className="toast-icon" aria-hidden="true">
              <Icon name={t.kind === "success" ? "check" : t.kind === "danger" ? "shield" : t.kind === "warn" ? "bell" : "sparkle"} size={14} />
            </div>
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-msg">{t.msg}</div>
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="بستن">
              <Icon name="end" size={12} />
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) modal.onCancel?.(); }}
        >
          <div className="modal-card">
            <h3 id="modal-title" className="modal-title">{modal.title || "تأیید عملیات"}</h3>
            {modal.body && <p className="modal-body">{modal.body}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={modal.onCancel}>{modal.cancelLabel || "انصراف"}</button>
              <button className="btn btn-primary" onClick={modal.onConfirm} autoFocus>{modal.confirmLabel || "تأیید"}</button>
            </div>
          </div>
        </div>
      )}

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={(id) => onNavigate?.(id)}
        setTheme={setTheme}
      />

      <AIFloatingFAB onNavigate={(id) => onNavigate?.(id)} />
    </ToastContext.Provider>
  );
};
