// =====================================================
// Shared: Nav, Footer, common widgets
// =====================================================
import React from "react";
import { Icon } from "./icons.jsx";
import { useRole, ROLES } from "./role.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { useTheme } from "./ui.jsx";

// Nav highlights the LIVE routes that actually talk to the API (Phase 4-9).
// Mocked routes from the original SPA still hash-route alongside but are
// no longer the default landing surface for any role.
const NAV_ITEMS_BY_ROLE = {
  student: [
    { id: "progress", label: "پیشرفت من", live: true },
    { id: "catalog", label: "کاتالوگ", live: true },
    { id: "my-courses", label: "دوره‌های من", live: true },
    { id: "tutor", label: "دستیار AI", live: true },
    { id: "calendar", label: "تقویم" },
    { id: "community", label: "جامعه" },
  ],
  instructor: [
    { id: "progress", label: "میز کار", live: true },
    { id: "catalog", label: "کاتالوگ", live: true },
    { id: "authoring", label: "استودیو" },
    { id: "classroom", label: "کلاس زنده" },
    { id: "analytics", label: "تحلیل" },
    { id: "tutor", label: "دستیار AI", live: true },
  ],
  admin: [
    { id: "progress", label: "داشبورد", live: true },
    { id: "catalog", label: "کاتالوگ", live: true },
    { id: "admin", label: "مدیریت" },
    { id: "analytics", label: "تحلیل" },
    { id: "tutor", label: "دستیار AI", live: true },
    { id: "events", label: "رویدادها" },
  ],
  parent: [
    { id: "home", label: "خانه" },
    { id: "parent", label: "میز کار" },
    { id: "calendar", label: "تقویم فرزند" },
    { id: "credential", label: "گواهی‌ها" },
    { id: "help", label: "پشتیبانی" },
  ],
  org: [
    { id: "progress", label: "داشبورد", live: true },
    { id: "admin", label: "میز سازمان" },
    { id: "analytics", label: "تحلیل تیم" },
    { id: "events", label: "رویدادها" },
    { id: "pricing", label: "پلن‌ها" },
    { id: "help", label: "پشتیبانی" },
  ],
};

export const Nav = ({ current, go }) => {
  const { role, setRole } = useRole();
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [notifsOpen, setNotifsOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); setNotifsOpen(false); setUserOpen(false); }, [current]);

  // close popovers on outside click
  React.useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest(".notif-wrap")) setNotifsOpen(false);
      if (!e.target.closest(".user-wrap")) setUserOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const items = NAV_ITEMS_BY_ROLE[role.id] || NAV_ITEMS_BY_ROLE.student;

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#home" onClick={(e) => { e.preventDefault(); go("home"); }} className="brand">
          <span className="brand-mark"></span>
          <span>
            دیجی‌یونیورسیتی
            <div className="brand-sub">AI · NATIVE · LEARNING</div>
          </span>
        </a>

        <div className={"nav-links " + (open ? "open" : "")}>
          {items.map((n) => (
            <a
              key={n.id}
              href={"#" + n.id}
              onClick={(e) => { e.preventDefault(); go(n.id); setOpen(false); }}
              className={"nav-link " + (current === n.id ? "active" : "")}
              aria-current={current === n.id ? "page" : undefined}
            >
              {n.label}
              {n.live && (
                <span
                  className="nav-live-dot"
                  aria-label="داده زنده"
                  title="متصل به API"
                />
              )}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          {/* Command palette trigger */}
          <button
            className="nav-icon-btn"
            onClick={() => window.openCommandPalette?.()}
            aria-label="پالت دستورات (Cmd+K)"
            title="جستجوی سریع (Ctrl+K)"
          >
            <Icon name="search" size={18} />
          </button>

          {/* Theme toggle */}
          <button
            className="nav-icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "تم روشن" : "تم تیره"}
            title={theme === "dark" ? "روشن" : "تیره"}
          >
            <Icon name={theme === "dark" ? "sparkle" : "globe"} size={18} />
          </button>

          {/* Notifications */}
          <div className="notif-wrap relative" >
            <button className="nav-icon-btn" onClick={() => setNotifsOpen(!notifsOpen)} aria-label="اعلان‌ها">
              <Icon name="bell" size={18} />
              <span className="notif-dot"></span>
            </button>
            {notifsOpen && <NotificationsDropdown go={go} />}
          </div>

          {/* User menu */}
          <div className="user-wrap relative" >
            <button className="user-btn" onClick={() => setUserOpen(!userOpen)}>
              <div className={"avatar " + role.color} style={{ width: 32, height: 32, fontSize: 11 }}>{role.avatar}</div>
              <span className="user-name">{role.name.split(" ").slice(-1)[0]}</span>
            </button>
            {userOpen && <UserDropdown go={go} role={role} setRole={setRole} auth={auth} />}
          </div>

          <button
            className="nav-toggle"
            onClick={() => setOpen(!open)}
            aria-label="منو"
            aria-expanded={open ? "true" : "false"}
          >
            <span className="bars"></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const NotificationsDropdown = ({ go }) => (
  <div className="dropdown" style={{ width: 380 }}>
    <div className="dropdown-head">
      <h4>اعلان‌ها</h4>
      <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)" }}>۳ جدید</span>
    </div>
    <div className="overflow-y-auto"  style={{maxHeight: 420}}>
      {[
        { ic: "live", k: "جلسه کلاس", t: "یادگیری ماشین · جلسه ۸ تا ۱۵ دقیقه دیگر شروع می‌شود", time: "همین الان", unread: true, action: () => go("classroom") },
        { ic: "sparkle", k: "AI Tutor", t: "خلاصه‌ی پساکلاس جلسه ۷ آماده شد. ۳ کوییز پیشنهاد شده.", time: "۸ دقیقه پیش", unread: true, action: () => go("recordings") },
        { ic: "check", k: "نمره منتشر شد", t: "تمرین ۴ — بهینه‌سازی: ۸۷ از ۱۰۰", time: "۲ ساعت پیش", unread: true, action: () => go("course") },
        { ic: "chat", k: "پاسخ به سوال", t: "دکتر عظیمی به سوال شما درباره‌ی مومنتوم پاسخ داد", time: "دیروز", unread: false, action: () => go("community") },
        { ic: "cert", k: "گواهی صادر شد", t: "گواهی آمار بیزی برای شما صادر شد", time: "۲ روز پیش", unread: false, action: () => go("credential") },
      ].map((n, i) => (
        <div key={i} onClick={n.action} className="notif-item">
          <div className="notif-icon"><Icon name={n.ic} size={14} /></div>
          <div className="flex-1"  style={{ minWidth: 0}}>
            <div className="flex items-center gap-2 mb-1" >
              <span className="uppercase"  style={{fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--fg-mute)"}}>{n.k}</span>
              {n.unread && <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }}></span>}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.t}</div>
            <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)"}}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="dropdown-foot">
      <button className="btn btn-ghost btn-sm">علامت‌گذاری همه به‌عنوان خوانده‌شده</button>
      <button className="btn btn-outline btn-sm" onClick={() => go("inbox")}>صندوق کامل</button>
    </div>
  </div>
);

const UserDropdown = ({ go, role, setRole, auth }) => {
  const [loggingOut, setLoggingOut] = React.useState(false);
  const handleLogout = async (e) => {
    e?.preventDefault?.();
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (auth?.logout) {
        await auth.logout();
      }
    } finally {
      // Clear local role so the next visitor sees the default.
      try {
        localStorage.removeItem("digiu_role");
      } catch {
        // ignore
      }
      setLoggingOut(false);
      go("login");
    }
  };

  const isDemoMode = typeof window !== "undefined" && (
    window.location.search.includes("demo=1") ||
    window.location.hash.includes("demo=1")
  );
  return (
  <div className="dropdown" style={{ width: 300 }}>
    <div className="p-4.5"  style={{ borderBottom: "1px solid var(--line)"}}>
      <div className="flex items-center gap-3" >
        <div className={"avatar " + role.color} style={{ width: 44, height: 44 }}>{role.avatar}</div>
        <div className="flex-1"  style={{ minWidth: 0}}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{role.name}</div>
          <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)"}}>{role.code}</div>
        </div>
      </div>
      <div className="flex gap-1.5 mt-3" >
        <span className="pill pill-cyan" style={{ fontSize: 10 }}>{role.label}</span>
        <span className="pill" style={{ fontSize: 10 }}>{role.subtitle}</span>
      </div>
    </div>

    {/* Role switcher — only in demo mode (?demo=1) */}
    {isDemoMode && (
      <div className="p-3.5"  style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-2)"}}>
        <div className="mono mb-2.5"  style={{fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.1em"}}>
          DEMO · مشاهده به عنوان
        </div>
        <div className="grid gap-1"  style={{ gridTemplateColumns: "repeat(5, 1fr)"}}>
          {Object.values(ROLES).map((r) => (
            <button className="rounded-md cursor-pointer flex flex-col items-center gap-1" key={r.id} onClick={() => { setRole(r.id); go(r.homeRoute); }}
              title={r.label}
               style={{padding: "8px 4px",
                background: role.id === r.id ? "var(--accent-soft)" : "var(--surface)",
                border: "1px solid " + (role.id === r.id ? "var(--accent)" : "var(--line)"),
                fontSize: 10,
                fontFamily: "inherit",
                color: role.id === r.id ? "var(--accent)" : "var(--fg-mute)"}}>
              <div className={"avatar " + (role.id === r.id ? r.color : "")} style={{ width: 22, height: 22, fontSize: 9, opacity: role.id === r.id ? 1 : 0.6 }}>{r.avatar}</div>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="p-1.5" >
      {[
        ["میز کار", "home", role.homeRoute],
        ["پروفایل عمومی", "user", "profile"],
        ["پیام‌ها", "chat", "messages"],
        ["ذخیره‌ها", "star", "bookmarks"],
        ["دستاوردها", "trophy", "achievements"],
        ["گواهی‌ها", "cert", "credential"],
        ["تنظیمات", "settings", "settings"],
        ["پشتیبانی", "headset", "help"],
      ].map(([t, ic, r]) => (
        <button key={t} onClick={() => go(r)} className="dropdown-item">
          <Icon name={ic} size={14} />
          {t}
        </button>
      ))}
    </div>
    <div className="p-1.5"  style={{ borderTop: "1px solid var(--line)"}}>
      <button onClick={handleLogout} disabled={loggingOut} className="dropdown-item" style={{ color: "var(--accent)" }}>
        <Icon name="end" size={14} />
        {loggingOut ? "در حال خروج..." : "خروج از حساب"}
      </button>
    </div>
  </div>
  );
};

export const Footer = ({ go }) => (
  <footer className="footer">
    <div className="shell">
      <div className="footer-grid">
        <div>
          <div className="brand mb-4.5" >
            <span className="brand-mark"></span>
            <span>دیجی‌یونیورسیتی
              <div className="brand-sub">AI · NATIVE · LEARNING</div>
            </span>
          </div>
          <p style={{ color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, maxWidth: 360 }}>
            یک زیرساخت آموزشی کاملاً دیجیتال که در آن هوش مصنوعی نه یک افزونه، بلکه شالوده‌ی یادگیری، طراحی برنامه و سنجش است.
          </p>
          <div className="standards mt-5" >
            <span className="std">LTI 1.3</span>
            <span className="std">xAPI</span>
            <span className="std">QTI</span>
            <span className="std">Caliper</span>
            <span className="std">WCAG 2.2</span>
          </div>
        </div>
        <div>
          <h5>محصول</h5>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("classroom")}}>کلاس آنلاین</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("labs")}}>آزمایشگاه‌های مجازی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("recordings")}}>آرشیو ضبط‌ها</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("search")}}>جستجوی معنایی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("assessment")}}>آزمون تطبیقی</a></li>
          </ul>
        </div>
        <div>
          <h5>دانشگاه</h5>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("schools")}}>دانشکده‌ها</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("faculty")}}>هیات علمی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("research")}}>پژوهش و دکتری</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("library")}}>کتابخانه دیجیتال</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("events")}}>رویدادها</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("admissions")}}>پذیرش</a></li>
          </ul>
        </div>
        <div>
          <h5>برای کاربران</h5>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("dashboard")}}>میز کار دانشجو</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("instructor")}}>کنسول استاد</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("parent")}}>پورتال والد</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("admin")}}>میز مدیریت</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("community")}}>جامعه</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("credential")}}>گواهی دیجیتال</a></li>
          </ul>
        </div>
        <div>
          <h5>منابع</h5>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("pricing")}}>پلن‌ها و قیمت</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("help")}}>مرکز پشتیبانی</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("about")}}>درباره ما</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault();go("officehours")}}>Office Hours</a></li>
            <li><a href="#">وضعیت سرویس</a></li>
            <li><a href="#">API و توسعه‌دهندگان</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bot">
        <span>© ۱۴۰۵ DigiUniversity · پلتفرم دانشگاه آنلاین هوشمند</span>
        <span>v1.0.0 · build 2026.05 · region: TEH-01</span>
      </div>
    </div>
  </footer>
);

// =====================================================
// Persian numerals helper
// =====================================================
export const toFa = (n) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

// =====================================================
// Sparkline mini-chart (SVG)
// =====================================================
export const Sparkline = ({ values, color = "var(--cyan)", height = 50, width = 220 }) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.07;
    return [x, y];
  });
  const d = "M " + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");
  const dArea = d + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill={`url(#sg-${color.replace(/[^a-z]/gi, "")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// =====================================================
// Cognitive radar (SVG) — for student profile
// =====================================================
export const CognitiveRadar = ({ values, labels, size = 280 }) => {
  const cx = size / 2, cy = size / 2;
  const radius = size * 0.4;
  const n = values.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  const rings = [0.25, 0.5, 0.75, 1].map((f) => {
    const pts = Array.from({ length: n }, (_, i) => point(i, radius * f).join(",")).join(" ");
    return <polygon key={f} points={pts} fill="none" stroke="var(--line-2)" strokeWidth="1" />;
  });
  const spokes = Array.from({ length: n }, (_, i) => {
    const [x, y] = point(i, radius);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line-2)" strokeWidth="1" />;
  });
  const valuePts = values.map((v, i) => point(i, radius * (v / 100)).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings}
      {spokes}
      <polygon points={valuePts} fill="oklch(0.82 0.16 195 / 0.18)" stroke="var(--cyan)" strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = point(i, radius * (v / 100));
        return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--cyan)" />;
      })}
      {labels.map((l, i) => {
        const [x, y] = point(i, radius + 26);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill="var(--fg-mute)" fontSize="11" fontFamily="Vazirmatn, sans-serif" fontWeight="500">
            {l}
          </text>
        );
      })}
    </svg>
  );
};

// =====================================================
// Knowledge Graph visualization (SVG)
// =====================================================
export const KnowledgeGraph = () => {
  const nodes = [
    { id: "ml", x: 50, y: 40, r: 36, kind: "core", label: "یادگیری ماشین" },
    { id: "sup", x: 22, y: 22, r: 24, kind: "topic", label: "نظارت‌شده" },
    { id: "uns", x: 78, y: 22, r: 24, kind: "topic", label: "بدون‌نظارت" },
    { id: "rl",  x: 50, y: 76, r: 24, kind: "topic", label: "تقویتی" },
    { id: "lr",  x: 12, y: 50, r: 18, kind: "sub", label: "رگرسیون" },
    { id: "svm", x: 28, y: 70, r: 18, kind: "sub", label: "SVM" },
    { id: "nn",  x: 88, y: 50, r: 18, kind: "sub", label: "شبکه عصبی" },
    { id: "cl",  x: 70, y: 8,  r: 18, kind: "sub", label: "خوشه‌بندی" },
    { id: "q",   x: 70, y: 92, r: 18, kind: "sub", label: "Q-learning" },
  ];
  const edges = [
    ["ml", "sup"], ["ml", "uns"], ["ml", "rl"],
    ["sup", "lr"], ["sup", "svm"], ["sup", "nn"],
    ["uns", "cl"], ["uns", "nn"], ["rl", "q"],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const colorFor = (kind) => kind === "core" ? "var(--cyan)" : kind === "topic" ? "var(--amber)" : "var(--violet)";

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="node-glow">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map(([a, b], i) => {
        const A = byId[a], B = byId[b];
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
          stroke={"color-mix(in oklch, " + colorFor(A.kind) + " 50%, transparent)"}
          strokeWidth="0.3" />;
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          {n.kind === "core" && <circle cx={n.x} cy={n.y} r={n.r / 4} fill="url(#node-glow)" opacity="0.6" />}
          <circle cx={n.x} cy={n.y} r={n.r / 8} fill={colorFor(n.kind)} stroke={colorFor(n.kind)} strokeOpacity="0.4" strokeWidth={n.r / 8} fillOpacity="0.5" />
          <text x={n.x} y={n.y + n.r / 4 + 2} textAnchor="middle" fill="var(--fg)" fontSize="2.2" fontFamily="Vazirmatn">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

// =====================================================
// 3D-ish architecture diagram (isometric stack)
// =====================================================
export const ArchStack = () => {
  const layers = [
    { name: "Experience Layer", sub: "وب · موبایل · کلاس آنلاین · داشبورد", color: "var(--cyan)" },
    { name: "Agent Orchestration", sub: "AI Tutor · Coach · Critic · Mentor · Grader", color: "var(--violet)" },
    { name: "Domain Services", sub: "Course · Enrollment · Gradebook · Credential", color: "var(--amber)" },
    { name: "Data & Learning Record Store", sub: "PostgreSQL · ClickHouse · Vector · Object", color: "var(--fg-mute)" },
    { name: "Cloud-Native Platform", sub: "Kubernetes · Kafka · CDN · Observability", color: "var(--fg-dim)" },
  ];
  return (
    <div style={{ perspective: 1400, transformStyle: "preserve-3d", padding: "20px 0" }}>
      <div className="flex flex-col gap-4.5 items-center"  style={{transform: "rotateX(48deg) rotateZ(-28deg)",
        transformStyle: "preserve-3d"}}>
        {layers.map((L, i) => (
          <div className="rounded-xl relative flex flex-col justify-center" key={i}  style={{width: 320,
            height: 70,
            background: "linear-gradient(180deg, var(--surface-2), var(--surface))",
            border: "1px solid var(--line-2)",
            padding: "0 18px",
            transform: `translateZ(${(layers.length - i) * 20}px)`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.7)"}}>
            <div className="absolute"  style={{ top: 8, left: 12, width: 5, height: 5, borderRadius: 50, background: L.color, boxShadow: `0 0 12px ${L.color}`}} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>{L.name}</div>
            <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)"}}>{L.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// (exports above)
