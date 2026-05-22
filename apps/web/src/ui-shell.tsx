// =====================================================
// Shared UI primitives: Toast, Modal, IconButton,
// Theme Provider, Command Palette, AI Floating FAB.
// All globally available via <UIRoot/>.
//
// Phase-14.5 C5: dropped @ts-nocheck. UseThemeReturn / UseToastReturn /
// ToastMessage / ConfirmActionOptions are the typed surface other
// chrome files (shared.tsx, pages) import. Window.toast and Window.
// confirmAction are declared here (single source of truth) so any
// page that calls them through ui.tsx's global setup gets typed
// autocomplete.
// =====================================================
import React from "react";
import { Icon } from "./icons";
// Phase-16 R5': use the typed Button primitive in the modal footer.
// Direct import (not via `./ui` barrel) to avoid the ui→ui-shell→ui
// circular dependency.
import { Button } from "./ui/Button";

// ---------- Theme ----------
export type Theme = "dark" | "light";

export interface UseThemeReturn {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = React.createContext<UseThemeReturn>({
  theme: "dark",
  setTheme: () => {
    // overridden by ThemeProvider; default no-op for safety
  },
});

export const useTheme = (): UseThemeReturn => React.useContext(ThemeContext);

// ---------- Toast ----------
export type ToastKind = "info" | "success" | "warn" | "danger";

export interface ToastMessage {
  msg: string;
  title?: string;
  kind?: ToastKind;
  /** Milliseconds until auto-dismiss. Default 3200. */
  ttl?: number;
}

export type ToastInput = string | ToastMessage;

interface ToastItem extends ToastMessage {
  id: string;
}

export interface UseToastReturn {
  push: (t: ToastInput) => void;
}

const ToastContext = React.createContext<UseToastReturn>({
  push: () => {
    // overridden by UIRoot
  },
});

export const useToast = (): UseToastReturn => React.useContext(ToastContext);

// ---------- Confirm modal ----------
export interface ConfirmActionOptions {
  title?: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ModalState extends ConfirmActionOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

// ---------- Globals exposed by <UIRoot> ----------
declare global {
  interface Window {
    /** Show a toast — pass a string for a quick info toast, or a full ToastMessage. */
    toast?: (input: ToastInput, opts?: Partial<ToastMessage>) => void;
    /** Show a confirm modal; resolves true if confirmed. */
    confirmAction?: (opts: ConfirmActionOptions) => Promise<boolean>;
    /** Open the Ctrl/Cmd+K command palette. */
    openCommandPalette?: () => void;
  }
}

// ---------- IconButton ----------
export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className"> {
  icon: string;
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: "ghost" | "primary" | "outline" | "danger";
  size?: number;
  className?: string;
}

export const IconButton = ({
  icon,
  label,
  onClick,
  variant = "ghost",
  size = 14,
  className = "",
  ...rest
}: IconButtonProps): React.ReactElement => (
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

export const stubAction = (msg?: string): (() => void) => () =>
  window.toast?.(msg || "این عملیات در نسخه‌ی نمایشی فعال نیست.");

// ---------- ThemeProvider ----------
export interface ThemeProviderProps {
  children: React.ReactNode;
}

const readPersistedTheme = (): Theme => {
  try {
    const raw = localStorage.getItem("digiu_theme");
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* localStorage blocked */
  }
  // Phase-16 R4': honour `prefers-color-scheme` on first visit. Previously
  // the default was hard-coded "dark", which surprised users whose OS was
  // in light mode. localStorage takes precedence if the user has explicitly
  // toggled — only the FIRST visit falls back to the system pref.
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      return "light";
    }
  } catch {
    /* matchMedia unsupported (jsdom + older browsers) */
  }
  return "dark";
};

export const ThemeProvider = ({ children }: ThemeProviderProps): React.ReactElement => {
  const [theme, setThemeState] = React.useState<Theme>(readPersistedTheme);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const setTheme = React.useCallback((t: Theme): void => {
    setThemeState(t);
    try {
      localStorage.setItem("digiu_theme", t);
    } catch {
      /* localStorage blocked */
    }
  }, []);
  const value = React.useMemo<UseThemeReturn>(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ---------- Command Palette ----------
interface Command {
  id: string;
  label: string;
  icon: string;
  route?: string;
  action?: "theme-light" | "theme-dark";
  hint?: string;
}

const COMMANDS: Command[] = [
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

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  setTheme: (t: Theme) => void;
}

const CommandPalette = ({
  open,
  onClose,
  onNavigate,
  setTheme,
}: CommandPaletteProps): React.ReactElement | null => {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const filtered = React.useMemo<Command[]>(() => {
    if (!q.trim()) return COMMANDS.slice(0, 12);
    const lower = q.toLowerCase();
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(lower) || c.id.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [q]);

  React.useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  React.useEffect(() => {
    setSel(0);
  }, [q]);

  const exec = (c: Command): void => {
    onClose();
    if (c.action === "theme-light") setTheme("light");
    else if (c.action === "theme-dark") setTheme("dark");
    else if (c.route) onNavigate(c.route);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[sel]) exec(filtered[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
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
            spellCheck={false}
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
interface ChatMessage {
  from: "ai" | "me";
  t: string;
}

interface AIFloatingFABProps {
  onNavigate: (route: string) => void;
}

const AIFloatingFAB = ({ onNavigate }: AIFloatingFABProps): React.ReactElement => {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { from: "ai", t: "سلام! من دستیار AI دیجی‌یونیورسیتی هستم. هر سوالی داری بپرس — درباره دروس، تمرین‌ها یا مسیر تحصیلی." },
  ]);
  const [input, setInput] = React.useState("");
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  // Accepts a React.FormEvent (submit handler) or a synthetic Event
  // (the canned-question buttons fire `send(new Event("submit"))`).
  // Both expose `preventDefault()`, so we just narrow on availability.
  const send = (e?: React.FormEvent | Event): void => {
    e?.preventDefault?.();
    const q = input.trim();
    if (!q) return;
    const next: ChatMessage[] = [...messages, { from: "me", t: q }];
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
export interface UIRootProps {
  children: React.ReactNode;
  onNavigate?: (route: string) => void;
}

export const UIRoot = ({ children, onNavigate }: UIRootProps): React.ReactElement => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [modal, setModal] = React.useState<ModalState | null>(null);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const { setTheme } = useTheme();

  const push = React.useCallback((input: ToastInput): void => {
    const id = Math.random().toString(36).slice(2);
    const item: ToastMessage =
      typeof input === "object" && input !== null && !Array.isArray(input)
        ? input
        : { msg: String(input) };
    setToasts((arr) => [...arr, { id, kind: "info", ...item }]);
    const ttl = item.ttl ?? 3200;
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), ttl);
  }, []);
  const dismiss = (id: string): void =>
    setToasts((arr) => arr.filter((x) => x.id !== id));

  // global helpers — exposed on window for non-React call sites
  React.useEffect(() => {
    window.toast = (m, opts = {}) => {
      if (typeof m === "object" && m !== null && !Array.isArray(m)) push({ ...m, ...opts });
      else push({ msg: String(m), ...opts });
    };
    window.confirmAction = (opts: ConfirmActionOptions): Promise<boolean> =>
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
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toastValue = React.useMemo<UseToastReturn>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={toastValue}>
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
              <Button variant="ghost" onClick={modal.onCancel}>{modal.cancelLabel || "انصراف"}</Button>
              <Button variant="primary" onClick={modal.onConfirm} autoFocus>{modal.confirmLabel || "تأیید"}</Button>
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
