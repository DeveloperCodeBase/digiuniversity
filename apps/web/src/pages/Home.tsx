// =====================================================
// Home / Landing page — Phase A R-Landing redesign (D37 + D38 + D39)
// =====================================================
//
// Standalone-chrome landing page. Render policy per D39 (Option B):
//   - This file owns the FULL `/` route chrome (own Nav + Footer).
//   - AppShell.tsx early-returns <Outlet /> for the home route so its
//     global navbar/footer don't render here.
//   - All other routes continue to use the R6.5 + R6.6 + R7.5/6/7/12
//     production chrome — zero leakage.
//
// Aesthetic per D38:
//   - Template "University Press — Minimal Academic"
//     (off-white paper #fafaf5 + ink black #0d0d0c + oxford blue oklch)
//   - Scoped via .home-shell-v2 wrapper — see apps/web/src/pages/home-v2.css
//     which auto-prefixes the template's 99 KB styles.css.
//
// TypeScript: this file ships fully typed; `@ts-nocheck` retired
// (was deferred per docs/PHASE_A_DEFERRED_TYPES.md, removed in this
// sub-R as a baked-in deliverable).

import React from "react";
import { Icon } from "../icons";
import { Stagger, useMouseParallax } from "../motion";
import { Footer, toFa, KnowledgeGraph, ArchStack } from "../shared";
import { useAuth } from "../auth/AuthContext";
import { AuthLoadingSkeleton } from "../components/AuthLoadingSkeleton";
import type { Go } from "../router";
// Scoped landing CSS — only applies inside <div className="home-shell-v2">,
// which is rendered exclusively by this file.
import "./home-v2.css";

interface HomePageProps {
  go: Go;
}

// =====================================================
// HomeNav — standalone marketing nav (anonymous-only)
// =====================================================
//
// Mirrors the visual shape of the template's Nav (brand + nav-links +
// nav-actions) but with a minimal anonymous-marketing item set. No
// notifications dropdown, no user menu, no role-aware switching —
// this nav appears ONLY on `/` for anonymous visitors (logged-in
// users are bounced to /dashboard by the useEffect below).

interface HomeNavItem {
  id: string;
  label: string;
}

const HOME_NAV_ITEMS: HomeNavItem[] = [
  { id: "home", label: "خانه" },
  { id: "programs", label: "برنامه‌ها" },
  { id: "about", label: "درباره" },
  { id: "admissions", label: "پذیرش" },
  { id: "pricing", label: "قیمت" },
];

const HomeNav: React.FC<{ go: Go }> = ({ go }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <nav className="nav" aria-label="ناوبری صفحه اصلی">
      <div className="nav-inner">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
          className="brand"
          aria-label="دیجی‌یونیورسیتی — خانه"
        >
          <span className="brand-mark" aria-hidden="true"></span>
          <span>
            دیجی‌یونیورسیتی
            <span className="brand-sub">AI · NATIVE · LEARNING</span>
          </span>
        </a>

        <div className={"nav-links " + (open ? "open" : "")}>
          {HOME_NAV_ITEMS.map((n) => (
            <a
              key={n.id}
              href={"/" + (n.id === "home" ? "" : n.id)}
              onClick={(e) => {
                e.preventDefault();
                go(n.id);
                setOpen(false);
              }}
              className={"nav-link " + (n.id === "home" ? "active" : "")}
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => go("login")}
          >
            ورود
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => go("register")}
          >
            ثبت‌نام
            <Icon name="arrow" size={14} />
          </button>
          <button
            type="button"
            className="nav-icon-btn"
            aria-label="منوی موبایل"
            aria-expanded={open}
            aria-controls="home-nav-mobile"
            onClick={() => setOpen(!open)}
            style={{ display: "none" }}
            id="home-nav-mobile-trigger"
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

// =====================================================
// Sub-components — typed ports of template Home.jsx helpers
// =====================================================

const Stat: React.FC<{ v: string; unit?: string; l: string }> = ({ v, unit, l }) => (
  <div className="hero-stat">
    <div className="v">
      {v}
      {unit ? <span className="unit">{unit}</span> : null}
    </div>
    <div className="l">{l}</div>
  </div>
);

const Feature: React.FC<{ title: string; desc: string; icon: string }> = ({ title, desc, icon }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "var(--accent)",
        marginBottom: 8,
      }}
    >
      <Icon name={icon} size={18} />
      <div style={{ fontWeight: 600, color: "var(--fg)", fontSize: 14 }}>{title}</div>
    </div>
    <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>{desc}</div>
  </div>
);

const TechRow: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "100px 1fr",
      gap: 18,
      padding: "12px 0",
      borderTop: "1px solid var(--line)",
    }}
  >
    <div
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        color: "var(--fg-mute)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((i) => (
        <span
          key={i}
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 12,
            padding: "3px 9px",
            background: "var(--surface-2)",
            borderRadius: 6,
            border: "1px solid var(--line)",
          }}
        >
          {i}
        </span>
      ))}
    </div>
  </div>
);

const MasteryRing: React.FC<{ percent: number }> = ({ percent }) => {
  const r = 36;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width="90" height="90" viewBox="0 0 90 90" role="img" aria-label={`تسلط ${percent}٪`}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
        <circle
          cx="45"
          cy="45"
          r={r}
          fill="none"
          stroke="var(--sage)"
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text
          x="45"
          y="50"
          textAnchor="middle"
          fill="var(--fg)"
          fontFamily="var(--f-mono)"
          fontWeight="700"
          fontSize="18"
        >
          {toFa(percent)}٪
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>تسلط فعلی</div>
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            color: "var(--fg-mute)",
            marginTop: 4,
          }}
        >
          ۷ از ۹ هدف
        </div>
      </div>
    </div>
  );
};

const Hero3DClassroom: React.FC = () => (
  <div className="hero-card hc-classroom">
    <div className="head">
      <div className="title">کلاس زنده · جلسه ۸</div>
      <div className="meta">۴۲ حاضر</div>
    </div>
    <div className="mini-video">
      <span className="live-pill">
        <span className="dot"></span>LIVE
      </span>
      <span className="label">prof.azimi · sharing</span>
    </div>
    <div className="mini-faces">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <div key={i} className="mini-face" />
      ))}
    </div>
  </div>
);

const Hero3DTutor: React.FC = () => (
  <div className="hero-card hc-tutor">
    <div className="head">
      <div className="title">AI Tutor</div>
      <div className="meta">RAG ready</div>
    </div>
    <div className="tutor-bubble user">
      <div className="av">من</div>
      <div>چرا گرادیان نزولی همگرا می‌شود؟</div>
    </div>
    <div className="tutor-bubble">
      <div className="av">AI</div>
      <div>بستگی به نرخ یادگیری دارد. در ویدئوی جلسه‌ی ۵ از دقیقه ۲۲:۱۴ توضیح داده شد...</div>
    </div>
  </div>
);

interface BarRow {
  label: string;
  width: string;
  val: string;
  variant?: "amber" | "rose";
}

const ANALYTICS_BARS: BarRow[] = [
  { label: "مشارکت", width: "82%", val: "۸۲" },
  { label: "فهم", width: "64%", val: "۶۴", variant: "amber" },
  { label: "سرعت", width: "94%", val: "!۹۴", variant: "rose" },
  { label: "ابهام", width: "38%", val: "۳۸", variant: "amber" },
];

const Hero3DAnalytics: React.FC = () => (
  <div className="hero-card hc-analytics">
    <div className="head">
      <div className="title">سلامت کلاس</div>
      <div className="meta">real-time</div>
    </div>
    {ANALYTICS_BARS.map((row) => (
      <div className="bar-row" key={row.label}>
        <div className="bar-label">{row.label}</div>
        <div className="bar-track">
          <div
            className={"bar-fill" + (row.variant ? " " + row.variant : "")}
            style={{ width: row.width }}
          />
        </div>
        <div className="bar-val">{row.val}</div>
      </div>
    ))}
  </div>
);

const Hero3DCredential: React.FC = () => (
  <div className="hero-card hc-credential">
    <div className="head">
      <div className="title">گواهی دیجیتال</div>
      <div className="meta">verifiable</div>
    </div>
    <div className="credential-mini">
      <div className="credential-seal float"></div>
      <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 12 }}>تسلط کامل بر:</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>یادگیری عمیق</div>
      <div
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 10,
          color: "var(--fg-dim)",
          marginTop: 8,
        }}
      >
        #7f3a · OB 3.0
      </div>
    </div>
  </div>
);

// =====================================================
// Data tables (verbatim from template)
// =====================================================

interface CourseRow {
  title: string;
  code: string;
  by: string;
  desc: string;
  weeks: string;
  modules: string;
  students: string;
  cover: string;
  glyph: string;
}

const COURSES: CourseRow[] = [
  {
    title: "مبانی یادگیری ماشین",
    code: "CS-410",
    by: "دکتر عظیمی",
    desc: "از رگرسیون تا شبکه‌های عمیق، با تأکید بر شهود و کاربرد.",
    weeks: "۱۲",
    modules: "۲۴",
    students: "۸۴۳",
    cover: "cyan",
    glyph: "ML",
  },
  {
    title: "معماری سامانه‌های مقیاس‌پذیر",
    code: "CS-580",
    by: "مهندس کیانی",
    desc: "میکروسرویس، Kafka، Kubernetes — با پروژه عملی.",
    weeks: "۱۰",
    modules: "۲۰",
    students: "۵۱۲",
    cover: "amber",
    glyph: "SYS",
  },
  {
    title: "طراحی محصول داده‌محور",
    code: "PM-310",
    by: "دکتر رضوی",
    desc: "متریک‌ها، آزمایش، شهود و چارچوب‌های تصمیم‌گیری.",
    weeks: "۸",
    modules: "۱۶",
    students: "۳۲۷",
    cover: "violet",
    glyph: "PM",
  },
  {
    title: "پردازش زبان طبیعی پیشرفته",
    code: "CS-620",
    by: "دکتر موسوی",
    desc: "ترنسفورمرها، RAG، ارزیابی LLM و پیاده‌سازی.",
    weeks: "۱۴",
    modules: "۲۸",
    students: "۶۲۴",
    cover: "deep",
    glyph: "NLP",
  },
  {
    title: "اخلاق هوش مصنوعی",
    code: "PHIL-220",
    by: "دکتر طاهری",
    desc: "تعصب، عاملیت، حاکمیت داده و چارچوب‌های نظارتی.",
    weeks: "۶",
    modules: "۱۲",
    students: "۴۱۸",
    cover: "rose",
    glyph: "AI⁺",
  },
  {
    title: "آمار بیزی کاربردی",
    code: "STAT-440",
    by: "دکتر فرهادی",
    desc: "از قانون بیز تا MCMC با مثال‌های واقعی.",
    weeks: "۱۰",
    modules: "۲۰",
    students: "۲۸۹",
    cover: "green",
    glyph: "Σ",
  },
];

interface TourCard {
  id: string;
  t: string;
  d: string;
  ic: string;
}

const TOUR_CARDS: TourCard[] = [
  { id: "classroom", t: "کلاس زنده", d: "WebRTC + AI Tutor + Transcript فارسی", ic: "live" },
  { id: "labs", t: "آزمایشگاه‌های مجازی", d: "آناتومی ۳D، RL Gym، CAD، Jupyter GPU", ic: "flask" },
  { id: "schools", t: "دانشکده‌ها و مقاطع", d: "۸ دانشکده · ۲۴۸ برنامه · ۵ مقطع", ic: "grad" },
  { id: "research", t: "محیط پژوهشی دکتری", d: "نقشه راه، مقالات، گروه پژوهشی", ic: "flask" },
  { id: "dashboard", t: "میز کار دانشجو", d: "پروفایل شناختی · sparkline", ic: "home" },
  { id: "course", t: "صفحه درس", d: "نقشه ماژول، AI Tutor جانبی", ic: "book" },
  { id: "search", t: "جستجوی معنایی", d: "BM25 + dense + RAG", ic: "search" },
  { id: "calendar", t: "تقویم تحصیلی", d: "هفته/ماه · همگامی Google", ic: "calendar" },
  { id: "library", t: "کتابخانه دیجیتال", d: "۱۲۸۴ منبع، جستجوی معنایی", ic: "folder" },
  { id: "assessment", t: "آزمون تطبیقی", d: "IRT 2PL + CAT + proctoring", ic: "check" },
  { id: "community", t: "جامعه‌ی یادگیری", d: "انجمن + خوشه‌بندی AI", ic: "users" },
  { id: "recordings", t: "آرشیو کلاس‌ها", d: "ویدئو + متن + کوییز خودکار", ic: "video" },
  { id: "instructor", t: "کنسول استاد", d: "سلامت کلاس + بازبینی AI", ic: "chip" },
  { id: "authoring", t: "استودیوی تولید", d: "AI Course Planner", ic: "sparkle" },
  { id: "analytics", t: "تحلیل‌گری نهادی", d: "Cohort, heatmap, early warning", ic: "chart" },
  { id: "admin", t: "میز مدیریت", d: "KPI، حاکمیت AI، کاربران", ic: "settings" },
  { id: "parent", t: "پورتال والد", d: "پیشرفت فرزند + ارتباط با استاد", ic: "users" },
  { id: "officehours", t: "Office Hours", d: "رزرو جلسه با استاد", ic: "calendar" },
  { id: "events", t: "رویدادها و وبینارها", d: "کنفرانس، کارگاه، سخنرانی مهمان", ic: "live" },
  { id: "faculty", t: "هیات علمی", d: "۹۴ استاد در ۸ دانشکده", ic: "grad" },
  { id: "help", t: "مرکز پشتیبانی", d: "راهنماها، FAQ، چت ۲۴/۷", ic: "headset" },
  { id: "pricing", t: "پلن‌ها و قیمت‌گذاری", d: "آزاد، دانشجویی، حرفه‌ای، سازمانی", ic: "dollar" },
  { id: "credential", t: "گواهی دیجیتال", d: "Open Badges 3.0 + VC", ic: "cert" },
  { id: "about", t: "درباره ما", d: "ماموریت، اصول، تیم", ic: "sparkle" },
];

const MARQUEE_PARTNERS: string[] = [
  "دانشگاه تهران",
  "صنعتی شریف",
  "علم و صنعت",
  "بهشتی",
  "اصفهان",
  "خواجه نصیر",
  "علامه طباطبایی",
  "تربیت مدرس",
  "Stanford Online",
  "MIT OpenCourseWare",
  "edX",
  "Coursera Partners",
];

// =====================================================
// HomePage — top-level component
// =====================================================

export const HomePage: React.FC<HomePageProps> = ({ go }) => {
  // Logged-in users bounce to /dashboard. Same logic as the pre-redesign
  // Home.tsx; preserved by D38 (auth-redirect behavior unchanged).
  const auth = useAuth();
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      go("dashboard");
    }
  }, [auth.isAuthenticated, go]);
  // useMouseParallax must run unconditionally per the rules of hooks.
  // The hook is a no-op if .hero-bg .aurora doesn't exist in the DOM.
  useMouseParallax();
  if (auth.isAuthenticated) return <AuthLoadingSkeleton />;

  return (
    <div className="home-shell-v2">
      {/* Accessibility skip-link — Home renders its own since AppShell
          early-returns for this route (Option B per D39). */}
      <a href="#home-main" className="skip-link">
        پرش به محتوای اصلی
      </a>

      <HomeNav go={go} />

      <main id="home-main" data-screen-label="01 خانه">
        {/* ============== HERO ============== */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true">
            <div className="aurora aurora-1"></div>
            <div className="aurora aurora-2"></div>
            <div className="aurora aurora-3"></div>
          </div>

          <div className="shell hero-stage">
            <div className="hero-headline">
              <div className="hero-eyebrow">
                <span className="dot"></span>
                <span>EST. 2026 · CHARTERED ONLINE UNIVERSITY · AI-NATIVE</span>
              </div>
              <h1 className="hero-title">
                <span className="hero-title-line">دانشگاهی نسل جدید،</span>
                <span className="hero-title-line">
                  برای <span className="em">عصر هوشمندی</span>
                </span>
              </h1>
              <p className="hero-sub">
                دانشگاه آنلاین معتبر با ۸ دانشکده، ۲۴۸ برنامه آکادمیک از کارشناسی تا دکتری، مدارک قابل
                راستی‌آزمایی، و زیرساخت یادگیری مبتنی بر هوش مصنوعی — همگام با استانداردهای جهانی LTI، xAPI،
                QTI و Open Badges 3.0.
              </p>
              <div className="hero-cta">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => go("admissions")}
                >
                  درخواست پذیرش
                  <Icon name="arrow" size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => go("schools")}
                >
                  <Icon name="grad" size={16} />
                  دانشکده‌ها و برنامه‌ها
                </button>
              </div>
            </div>

            {/* 3D layered preview */}
            <div className="hero-3d">
              <Hero3DClassroom />
              <Hero3DTutor />
              <Hero3DAnalytics />
              <Hero3DCredential />
            </div>

            <div className="hero-stats">
              <Stat v={"۸"} unit=" دانشکده" l="مهندسی · پزشکی · علوم پایه · AI · مدیریت · انسانی · هنر · حقوق" />
              <Stat v={"۲۴۸"} unit=" برنامه" l="از کاردانی تا دکتری، در ۵ مقطع تحصیلی" />
              <Stat v={"۹۴"} unit=" استاد" l="از دانشگاه‌های برتر ایران و جهان" />
              <Stat v={"۸,۴۰۰"} unit=" دانشجو" l="در ۴۲ شهر و ۲۸ کشور" />
            </div>
          </div>
        </section>

        {/* ============== AGENT SYSTEM ============== */}
        <section className="section">
          <div className="shell">
            <div className="section-head reveal">
              <div className="text">
                <span className="eyebrow">AGENT ARCHITECTURE</span>
                <h2 className="h-1">
                  به‌جای یک چت‌بات،
                  <br />
                  <span style={{ color: "var(--sage)" }}>یک تیم آموزشی</span>
                </h2>
              </div>
              <p className="lead">
                هر درس یک Agent Graph مستقل دارد. پنج عامل تخصصی، هر یک با نقش، مرز، منابع مجاز و معیار
                ارزیابی خود. استاد بر همه چیز نظارت دارد.
              </p>
            </div>

            <div className="pillar-grid stagger">
              <div className="pillar pillar-1 reveal">
                <div className="glow"></div>
                <span className="num">۰۱ / موتور یادگیری</span>
                <h3>پنج عامل، یک هدف: تسلط واقعی</h3>
                <p>
                  توضیح‌دهنده، مربی پرسش‌گر، منتقد، منتور بلندمدت و ارزیاب — هر کدام در حوزه‌ی تخصص خود و
                  تحت کنترل استاد.
                </p>
                <div className="agent-graph">
                  {[
                    ["TUTOR", "توضیح‌دهنده"],
                    ["COACH", "مربی"],
                    ["CRITIC", "منتقد"],
                    ["MENTOR", "منتور"],
                    ["GRADER", "ارزیاب"],
                    ["HUMAN", "استاد"],
                  ].map(([k, l]) => (
                    <div key={k} className="agent-node">
                      <div className="nm">{k}</div>
                      <div className="lb">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pillar pillar-2 reveal">
                <div className="glow"></div>
                <span className="num">۰۲ / پروفایل شناختی</span>
                <h3>هر دانشجو، یک نقشه‌ی زنده</h3>
                <p>
                  دانش قبلی، سرعت یادگیری، مفاهیم مسلط و مبهم، سبک تعامل و ریسک افت — همگی به‌روزرسانی
                  لحظه‌ای.
                </p>
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 20,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="pill pill-cyan">Bayesian KT</span>
                  <span className="pill pill-amber">Deep KT</span>
                  <span className="pill">IRT 2PL</span>
                </div>
              </div>

              <div className="pillar pillar-3 reveal">
                <div className="glow"></div>
                <span className="num">۰۳ / تسلط</span>
                <h3>عبور با شواهد، نه با حضور</h3>
                <p>
                  هر فعالیت به یک هدف یادگیری متصل است. آستانه‌ی تسلط قابل تنظیم. سامانه می‌داند کجا تمرین
                  بیشتر نیاز است.
                </p>
                <div style={{ marginTop: "auto", paddingTop: 20 }}>
                  <MasteryRing percent={78} />
                </div>
              </div>

              <div className="pillar pillar-4 reveal">
                <div className="glow"></div>
                <span className="num">۰۴ / کلاس زنده</span>
                <h3>WebRTC · LL-HLS · ضبط هوشمند</h3>
                <p>
                  کلاس کوچک تعاملی تا وبینار هزاران‌نفره. ضبط، گفتار به متن، تشخیص گوینده، فصل‌بندی
                  خودکار — همه استاندارد.
                </p>
              </div>

              <div className="pillar pillar-5 reveal">
                <div className="glow"></div>
                <span className="num">۰۵ / حاکمیت AI</span>
                <h3>Human-in-the-loop در نقاط حساس</h3>
                <p>هیچ نمره‌ای بدون امکان بازبینی انسانی نهایی نمی‌شود. هر پاسخ AI با منبع و امضای عامل.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== MARQUEE ============== */}
        <div className="marquee" aria-label="سازمان‌های همکار">
          <div className="marquee-track">
            {[...MARQUEE_PARTNERS, ...MARQUEE_PARTNERS].map((n, i) => (
              <span key={i} className="marquee-item">
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* ============== KNOWLEDGE GRAPH ============== */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell">
            <div
              className="grid grid-2"
              style={{ gridTemplateColumns: "1fr 1.1fr", gap: 48, alignItems: "center" }}
            >
              <div>
                <span className="eyebrow">KNOWLEDGE GRAPH</span>
                <h2 className="h-1" style={{ marginTop: 16 }}>
                  هر درس یک
                  <br />
                  <span style={{ color: "var(--accent)" }}>شبکه‌ی مفهومی</span> است
                </h2>
                <p className="lead" style={{ marginTop: 20 }}>
                  وقتی دانشجو روی یک مفهوم گیر می‌کند، سامانه می‌داند کدام پیش‌نیازها را مرور کند، کدام
                  تمرین جبرانی بدهد و کدام بخش از ویدئوی کلاس را نشان دهد.
                </p>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "1fr 1fr", marginTop: 32, gap: 18 }}
                >
                  <Feature title="بازیابی هیبرید" desc="BM25 + dense embeddings برای جستجوی معنایی" icon="search" />
                  <Feature title="جهش به ثانیه" desc="نتایج جستجو مستقیماً به ثانیه‌ی دقیق ویدئو" icon="play" />
                  <Feature title="استخراج مفهوم" desc="NER و تحلیل ابهام در لحظه‌ی تدریس" icon="sparkle" />
                  <Feature title="مسیر جبرانی" desc="پیشنهاد خودکار بر اساس پروفایل شناختی" icon="target" />
                </div>
              </div>

              <div className="kg-wrap">
                <KnowledgeGraph />
              </div>
            </div>
          </div>
        </section>

        {/* ============== ARCHITECTURE ============== */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell">
            <div
              className="grid grid-2"
              style={{ gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center" }}
            >
              <div className="kg-wrap" style={{ minHeight: 480, display: "grid", placeItems: "center" }}>
                <ArchStack />
              </div>
              <div>
                <span className="eyebrow">PLATFORM ARCHITECTURE</span>
                <h2 className="h-1" style={{ marginTop: 16 }}>
                  معماری <span style={{ color: "var(--navy)" }}>پنج لایه</span>،
                  <br />
                  cloud-native و قابل خودمیزبانی
                </h2>
                <p className="lead" style={{ marginTop: 20 }}>
                  از SaaS برای مؤسسات کوچک تا Private Cloud و On-Premise برای نهادهای حساس. هر سرویس مستقل،
                  هر سرویس قابل جایگزینی.
                </p>
                <div style={{ marginTop: 28 }}>
                  <TechRow label="Frontend" items={["Next.js 15", "TypeScript", "Tailwind", "WebRTC client"]} />
                  <TechRow label="Backend" items={["NestJS", "Spring Boot", "FastAPI", "gRPC"]} />
                  <TechRow label="AI & Data" items={["LangGraph", "Qdrant", "Whisper", "MLflow"]} />
                  <TechRow label="Infra" items={["Kubernetes", "Kafka", "ClickHouse", "ArgoCD"]} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== COURSES ============== */}
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div className="text">
                <span className="eyebrow">CATALOG</span>
                <h2 className="h-1" style={{ marginTop: 16 }}>
                  دروسی که با تو رشد می‌کنند
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => go("programs")}
              >
                همه‌ی دروس
                <Icon name="arrow" size={14} />
              </button>
            </div>

            <Stagger className="grid grid-3">
              {COURSES.map((c) => (
                <button
                  key={c.title}
                  type="button"
                  className="course-card reveal"
                  onClick={() => go("course")}
                  aria-label={`درس ${c.title} با ${c.by}`}
                >
                  <div className={"course-cover " + c.cover}>
                    <span className="glyph">{c.glyph}</span>
                    <span className="pill mono">{c.code}</span>
                  </div>
                  <div className="course-body">
                    <h3>{c.title}</h3>
                    <div className="by">با {c.by}</div>
                    <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>{c.desc}</p>
                    <div className="course-meta">
                      <span className="it">
                        <strong>{c.weeks}</strong> هفته
                      </span>
                      <span className="it">
                        <strong>{c.modules}</strong> ماژول
                      </span>
                      <span className="it">
                        <strong>{c.students}</strong> دانشجو
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ============== STANDARDS ============== */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell">
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <span className="eyebrow" style={{ justifyContent: "center" }}>
                STANDARDS · INTEROPERABILITY
              </span>
              <h2 className="h-2" style={{ marginTop: 18, maxWidth: 720, margin: "18px auto 0" }}>
                ساخته‌شده بر شانه‌ی استانداردهایی که دانشگاه‌های دنیا با آن کار می‌کنند
              </h2>
              <div className="standards" style={{ justifyContent: "center", marginTop: 32 }}>
                <span className="std">LTI 1.3 / Advantage</span>
                <span className="std">xAPI · cmi5</span>
                <span className="std">QTI 3.0</span>
                <span className="std">Caliper Analytics</span>
                <span className="std">OneRoster 1.2</span>
                <span className="std">Open Badges 3.0</span>
                <span className="std">Verifiable Credentials</span>
                <span className="std">WCAG 2.2 AA</span>
                <span className="std">SCORM legacy</span>
                <span className="std">SAML 2.0 / OIDC</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============== PLATFORM TOUR ============== */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell">
            <div className="section-head">
              <div className="text">
                <span className="eyebrow">PLATFORM TOUR · ۲۰ SCREEN</span>
                <h2 className="h-1" style={{ marginTop: 16 }}>
                  هر نقش، یک محیط کاری مستقل
                </h2>
              </div>
              <p className="lead">
                دانشجو، استاد، طراح آموزشی، مدیر — هر یک ابزار خود را دارد. همه روی یک پلتفرم.
              </p>
            </div>

            <Stagger className="grid grid-4">
              {TOUR_CARDS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="reveal home-tour-card"
                  onClick={() => go(p.id)}
                  aria-label={`${p.t} — ${p.d}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--surface-2)",
                        color: "var(--accent)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Icon name={p.ic} size={16} />
                    </div>
                    <Icon name="arrow" size={14} stroke={2} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{p.t}</div>
                  <div
                    style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6, lineHeight: 1.5 }}
                  >
                    {p.d}
                  </div>
                </button>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ============== CTA ============== */}
        <section className="section">
          <div className="shell">
            <div
              className="card"
              style={{
                padding: "64px 48px",
                background:
                  "linear-gradient(135deg, var(--surface) 0%, color-mix(in oklch, var(--accent) 8%, var(--surface-2)) 100%)",
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr",
                gap: 48,
                alignItems: "center",
              }}
            >
              <div>
                <span className="eyebrow">GET STARTED</span>
                <h2 className="h-1" style={{ marginTop: 16 }}>
                  دانشگاهی تأسیس کنید که هرگز نمی‌خوابد
                </h2>
                <p className="lead" style={{ marginTop: 16 }}>
                  در کمتر از ۳۰ روز، اولین ترم آنلاین خود را با کلاس زنده، ضبط هوشمند، آزمون تطبیقی و
                  گواهی دیجیتال اجرا کنید.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() => go("admissions")}
                  >
                    درخواست دموی نهادی
                    <Icon name="arrow" size={16} />
                  </button>
                  <button type="button" className="btn btn-outline btn-lg">
                    <Icon name="download" size={16} />
                    دانلود پروپوزال
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["MVP در ۳۰ روز", "اولین درس آنلاین قابل اجرا"],
                  ["ترم کامل در ۹۰ روز", "تمام سرویس‌های دانشگاه آماده"],
                  ["مقیاس ملی در ۶ ماه", "چند مستاجره، SLA 99.9٪"],
                ].map(([t, s], i) => (
                  <div
                    key={t}
                    className="card-flat"
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "var(--surface-3)",
                        color: "var(--accent)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--f-mono)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {toFa(i + 1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
                      <div style={{ color: "var(--fg-mute)", fontSize: 12, marginTop: 2 }}>{s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer go={go} />
    </div>
  );
};

export default HomePage;
