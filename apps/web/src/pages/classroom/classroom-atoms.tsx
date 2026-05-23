// Phase-A R6 — Classroom shared atoms.
//
// Types + mock data + tiny shared widgets (SlideCanvas + Pill + Icon
// glyphs scoped to the classroom). Pulled out of the per-component
// files so the visual components stay focused on layout.
//
// Mock data shapes are deliberately the (future) Phase-D LiveKit/AI
// Gateway response shapes, so the day the api lands the only change
// is `const SLIDES = await fetchSlides()` etc. No re-shape required.

import React from "react";

/* ============================================================
   Types
============================================================ */

export interface Slide {
  eyebrow: string;
  title: string;
  formula: string;
  body: string;
}

export interface Participant {
  id: number;
  name: string;
  init: string;
  host?: boolean;
  speaking?: boolean;
  mic: boolean;
}

export interface CaptionLine {
  who: string;
  text: string;
}

export interface ChatTurn {
  role: "ai" | "me";
  time: string;
  text: string;
  code?: string;
  actions?: boolean;
}

export interface TranscriptEntry {
  who: string;
  time: string;
  text: string;
  host?: boolean;
  fresh?: boolean;
  highlight?: string;
}

export interface QAItem {
  id: number;
  author: string;
  init: string;
  time: string;
  q: string;
  votes: number;
  answered: boolean;
  pinned?: boolean;
  tag?: string;
  voted?: boolean;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  correct?: boolean;
}

export interface PollState {
  q: string;
  options: PollOption[];
  chose: string | null;
  open: boolean;
  timeLeft: number;
}

export interface Suggestion {
  id: string;
  text: string;
  icon: string;
}

export interface AITab {
  id: "chat" | "live" | "qa" | "poll";
  label: string;
  icon: string;
  count: number;
}

/* ============================================================
   Mock data — every surface that renders this must show <MockBadge />
============================================================ */

export const SLIDES: Slide[] = [
  {
    eyebrow: "FUNDAMENTALS · 04",
    title: "گرادیان نزولی تصادفی",
    formula: "θ ← θ − η · ∇L(θ; xᵢ, yᵢ)",
    body: "در هر گام، با یک نمونه‌ی تصادفی از داده‌ها وزن‌ها را به‌روز می‌کنیم. سریع‌تر از Batch GD اما با نوسان بیشتر در مسیر همگرایی.",
  },
  {
    eyebrow: "INTUITION · 05",
    title: "چرا نوسان مفید است؟",
    formula: "Variance(∇L) ≈ σ²/n",
    body: "نوسان تصادفی به الگوریتم اجازه می‌دهد از کمینه‌های محلی فرار کند و در سطوح غیرمحدب عملکرد بهتری داشته باشد.",
  },
  {
    eyebrow: "COMPARISON · 06",
    title: "Batch · Mini-batch · Stochastic",
    formula: "B = 1 ↔ B = m/k ↔ B = m",
    body: "Mini-batch تعادلی بین پایداری Batch و سرعت SGD ایجاد می‌کند. اندازه‌ی متداول: ۳۲ تا ۲۵۶.",
  },
];

export const PARTICIPANTS: Participant[] = [
  { id: 1, name: "دکتر عظیمی", init: "آع", host: true, mic: true },
  { id: 2, name: "سارا م.", init: "س", speaking: true, mic: true },
  { id: 3, name: "علی ر.", init: "ع", mic: false },
  { id: 4, name: "زهرا ک.", init: "ز", mic: true },
  { id: 5, name: "نیما ج.", init: "ن", mic: false },
  { id: 6, name: "آرمان ب.", init: "آ", mic: true },
  { id: 7, name: "هانیه ف.", init: "ه", mic: true },
];

export const CAPTION_QUEUE: CaptionLine[] = [
  { who: "دکتر عظیمی", text: "گرادیان نزولی تصادفی، در هر گام فقط یک نمونه را برای محاسبه‌ی گرادیان به‌کار می‌برد." },
  { who: "دکتر عظیمی", text: "این موضوع باعث می‌شود به‌روزرسانی‌ها سریع‌تر اما نوسانی‌تر باشند." },
  { who: "سارا م.", text: "استاد، نرخ یادگیری بهینه برای SGD چطور انتخاب می‌شود؟" },
  { who: "دکتر عظیمی", text: "سؤال خوبی است. معمولاً با Learning Rate Scheduler یا Adam ترکیب می‌کنیم." },
  { who: "دکتر عظیمی", text: "اگر η خیلی بزرگ باشد، تابع هزینه واگرا می‌شود و اگر کوچک باشد، همگرایی کند است." },
];

export const INITIAL_CHAT: ChatTurn[] = [
  {
    role: "ai",
    time: "۱۴:۲۳",
    text: "سلام 👋 من دستیار هوشمند این جلسه هستم. می‌توانم خلاصه‌ی لحظه‌ای، توضیح ساده‌تر مفاهیم، یا تمرین اضافه پیشنهاد دهم.",
  },
  {
    role: "me",
    time: "۱۴:۲۵",
    text: "یک مثال عددی از به‌روزرسانی وزن‌ها در SGD می‌دی؟",
  },
  {
    role: "ai",
    time: "۱۴:۲۵",
    text: "حتماً. فرض کن θ = ۰٫۸ و گرادیان = ۲٫۴ و η = ۰٫۱. آنگاه:",
    code: "θ ← 0.8 − 0.1 × 2.4 = 0.56",
    actions: true,
  },
];

export const SUGGESTIONS: Suggestion[] = [
  { id: "sum", text: "خلاصه‌ی ۲ دقیقه‌ی اخیر", icon: "note" },
  { id: "ex",  text: "تمرین مشابه بساز", icon: "sparkleSm" },
  { id: "exp", text: "ساده‌تر توضیح بده", icon: "lightbulb" },
  { id: "ref", text: "منابع تکمیلی", icon: "book2" },
];

export const TRANSCRIPT_SEED: TranscriptEntry[] = [
  { who: "دکتر عظیمی", time: "۱۴:۲۰", host: true, text: "در گرادیان نزولی تصادفی، در هر گام تنها یک نمونه برای محاسبه گرادیان استفاده می‌شود." },
  { who: "دکتر عظیمی", time: "۱۴:۲۱", host: true, text: "این موضوع باعث افزایش سرعت محاسبات و کاهش حافظه می‌شود." },
  { who: "سارا م.",    time: "۱۴:۲۲", text: "استاد، نرخ یادگیری بهینه چطور انتخاب می‌شود؟", highlight: "نرخ یادگیری بهینه" },
  { who: "دکتر عظیمی", time: "۱۴:۲۲", host: true, text: "معمولاً با Learning Rate Scheduler یا الگوریتم‌های تطبیقی مثل Adam ترکیب می‌کنیم.", highlight: "Learning Rate Scheduler" },
  { who: "علی ر.",     time: "۱۴:۲۳", text: "تفاوت اصلی SGD با Mini-batch چیه دقیقاً؟" },
  { who: "دکتر عظیمی", time: "۱۴:۲۳", host: true, text: "اندازه‌ی دسته. در Mini-batch بین ۳۲ تا ۲۵۶ نمونه می‌گیریم تا تعادل بهتری بین پایداری و سرعت داشته باشیم.", fresh: true },
];

export const TRANSCRIPT_LIVE_POOL: TranscriptEntry[] = [
  { who: "دکتر عظیمی", host: true, time: "", text: "اگر یاد گیری را با لحاظ مقدار قبلی به‌روزرسانی کنیم، به آن Momentum می‌گویند." },
  { who: "زهرا ک.", time: "", text: "این روش با Nesterov چه تفاوتی دارد؟" },
  { who: "دکتر عظیمی", host: true, time: "", text: "Nesterov ابتدا یک پیش‌بینی از موقعیت بعدی می‌سازد و گرادیان را آنجا حساب می‌کند." },
  { who: "نیما ج.", time: "", text: "می‌شود این ایده را در پای‌تورچ پیاده کرد؟" },
];

export const QUESTIONS: QAItem[] = [
  { id: 1, author: "ندا کاظمی", init: "ن", time: "۲ دقیقه پیش", q: "اگر تابع هزینه غیرمحدب باشد، آیا SGD به حداقل سراسری همگرا می‌شود؟", votes: 12, answered: true, pinned: true, tag: "هایلایت" },
  { id: 2, author: "علی ر.", init: "ع", time: "۵ دقیقه پیش", q: "تفاوت Momentum و Adam در عمل چقدر است؟", votes: 8, answered: false, tag: "تطبیقی" },
  { id: 3, author: "محسن ح.", init: "م", time: "۸ دقیقه پیش", q: "Mini-batch چه اندازه‌ای برای ResNet-50 توصیه می‌شود؟", votes: 5, answered: false },
  { id: 4, author: "هانیه ف.", init: "ه", time: "۱۲ دقیقه پیش", q: "برای داده‌های نامتوازن، چه تنظیماتی روی SGD اعمال کنیم؟", votes: 4, answered: true, tag: "کاربردی" },
];

export const INITIAL_POLL: PollState = {
  q: "کدام روش بهینه‌سازی برای آموزش شبکه‌های عمیق با داده‌ی نامتوازن مناسب‌تر است؟",
  options: [
    { id: "a", label: "SGD ساده با Momentum", votes: 7 },
    { id: "b", label: "Adam با وزن‌دهی کلاس‌ها", votes: 23, correct: true },
    { id: "c", label: "RMSprop با Warm-up", votes: 9 },
    { id: "d", label: "AdaGrad", votes: 3 },
  ],
  chose: null,
  open: true,
  timeLeft: 32,
};

export const AI_TABS: AITab[] = [
  { id: "chat", label: "دستیار", icon: "bot", count: 0 },
  { id: "live", label: "زیرنویس", icon: "text", count: 0 },
  { id: "qa", label: "پرسش", icon: "question", count: 4 },
  { id: "poll", label: "نظرسنجی", icon: "target", count: 1 },
];

export interface TimelineRow {
  t: string;
  c: string;
  done: boolean;
  now?: boolean;
}

export const POLL_TIMELINE: TimelineRow[] = [
  { t: "۱۴:۰۲", c: "مرور جلسه قبل", done: true },
  { t: "۱۴:۰۸", c: "مفهوم گرادیان نزولی", done: true },
  { t: "۱۴:۱۶", c: "نسخه‌ی Batch", done: true },
  { t: "۱۴:۲۲", c: "گرادیان نزولی تصادفی", done: true, now: true },
  { t: "۱۴:۳۵", c: "Momentum و Adam", done: false },
  { t: "۱۴:۴۵", c: "تمرین تعاملی + پرسش", done: false },
];

/* ============================================================
   Helpers
============================================================ */

/** Persian-friendly time stamp. */
export function nowFa(): string {
  return new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

/** Split a string by a substring and wrap matches in <mark>. */
export function renderHighlight(text: string, h: string): React.ReactNode {
  if (!h) return text;
  const parts = text.split(h);
  return parts.map((p, i) => (
    <React.Fragment key={i}>
      {p}
      {i < parts.length - 1 ? <mark>{h}</mark> : null}
    </React.Fragment>
  ));
}

/* ============================================================
   SlideCanvas — animated 4-layer neural net behind the slide
============================================================ */

/**
 * Animated SVG/canvas decoration drawn under the slide content.
 * Pure visual — no semantic meaning. Skips the rAF loop entirely
 * when the user prefers reduced motion (a11y must-have for the
 * Phase-A polish surface).
 */
export const SlideCanvas: React.FC = () => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = (): void => {
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const layers = [4, 6, 6, 3];
    type Node = { x: number; y: number; phase: number };

    const compute = (): { nodes: Node[][] } => {
      const W = cv.width;
      const H = cv.height;
      const padX = W * 0.18;
      const padY = H * 0.16;
      const innerW = W - padX * 2;
      const innerH = H - padY * 2;
      const nodes: Node[][] = [];
      layers.forEach((n, li) => {
        const x = padX + (innerW * li) / (layers.length - 1);
        const colNodes: Node[] = [];
        for (let i = 0; i < n; i++) {
          const y = padY + (innerH * (i + 0.5)) / n;
          colNodes.push({ x, y, phase: Math.random() * Math.PI * 2 });
        }
        nodes.push(colNodes);
      });
      return { nodes };
    };

    let { nodes } = compute();
    const handleResize = (): void => {
      resize();
      nodes = compute().nodes;
    };
    window.addEventListener("resize", handleResize);

    let t = 0;
    const tick = (): void => {
      t += 0.012;
      const W = cv.width;
      const H = cv.height;
      ctx.clearRect(0, 0, W, H);

      // Edges
      for (let li = 0; li < nodes.length - 1; li++) {
        const a = nodes[li];
        const b = nodes[li + 1];
        for (const na of a) {
          for (const nb of b) {
            const flow = (Math.sin(t * 1.5 + na.phase + nb.phase) + 1) / 2;
            const alpha = 0.05 + flow * 0.18;
            ctx.strokeStyle = `rgba(231,200,122,${alpha})`;
            ctx.lineWidth = 0.7 * dpr;
            ctx.beginPath();
            ctx.moveTo(na.x, na.y);
            ctx.lineTo(nb.x, nb.y);
            ctx.stroke();
            // Pulse traveling along edge
            const pulse = (t * 0.6 + na.phase) % 1;
            const px = na.x + (nb.x - na.x) * pulse;
            const py = na.y + (nb.y - na.y) * pulse;
            ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - Math.abs(pulse - 0.5) * 2)})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.4 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // Nodes
      for (const col of nodes) {
        for (const nd of col) {
          const pulse = (Math.sin(t * 2 + nd.phase) + 1) / 2;
          ctx.fillStyle = `rgba(255,255,255,${0.55 + pulse * 0.4})`;
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, (3 + pulse * 1.4) * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(231,200,122,${0.4 + pulse * 0.3})`;
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, (6 + pulse * 2) * dpr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={ref} className="r6-slide-canvas" aria-hidden="true" />;
};

/* ============================================================
   Pill — chip-style toggle used inside the live-transcript filter
============================================================ */

export interface PillProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Pill: React.FC<PillProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={"r6-chip" + (active ? " is-active" : "")}
    type="button"
  >
    {children}
  </button>
);
