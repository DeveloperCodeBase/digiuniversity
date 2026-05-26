// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename.
// Phase-16 R2 deliberately leaves @ts-nocheck in place: the file is 530+
// lines of inline JSX and the type sweep is scheduled for R16 (cleanup)
// after the new sections + primitives land. R2 only adds the auth-aware
// redirect + outcome-first headline.
// =====================================================
// Home / Landing page  —  R-Landing-v2 (D47, 2026-05-26)
// =====================================================
// Wrapped in .home-shell-v2 so the design's white+navy palette,
// typography (Vazirmatn + Plus Jakarta), section layouts, and
// reveal-on-scroll animations apply ONLY on / (and never on /login,
// /dashboard, etc.). Per Q1.a: AGENT ARCHITECTURE preserved with
// new palette. Per Q2.b: topbar wrapped INSIDE this scope (sticky
// inside the wrapper, so it physically cannot render on other routes
// since the wrapper isn't in DOM there). Per Q3.c: hero co-brand
// chips = Jahad + AIRAC (design fidelity); Footer untouched (R1.3-
// Brand JDO + dvcb).
//
// SW dispose (Commit A): VitePWA disabled + main.tsx top-level
// unregister/clear. This page deploys without any service worker
// caching it = no R-Landing-v1-style precache stickiness.
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Stagger, useMouseParallax } from "../motion";
import { Footer, toFa, KnowledgeGraph, ArchStack } from "../shared";
import { useAuth } from "../auth/AuthContext";
import { AuthLoadingSkeleton } from "../components/AuthLoadingSkeleton";
import type { Go } from "../router";
import { Button } from "../ui";
// Scoped CSS — every selector is .home-shell-v2-prefixed, so loading
// this file has NO global effect. The CSS only fires inside the
// wrapper div rendered below.
import "./home-v2.css";
// D48 round-2 polish: manual overrides + faculty + testimonials styles
// not covered by the auto-generated home-v2.css.
import "./home-v2-overrides.css";
// Plus Jakarta Sans deferred — adding it would have required a
// package-lock.json regen + full npm install in the build container.
// The Latin display text in Home falls back to Vazirmatn + system-ui
// sans-serif (declared in home-v2-overrides.css .home-shell-v2 font-family).
// Visually 95% indistinguishable for the demo; can be re-added in a
// future polish with proper lockfile sync.

interface HomePageProps {
  go: Go;
}

export const HomePage = ({ go }: HomePageProps) => {
  // Phase-16 R2 (B-01): a logged-in user landing on "/" is bounced to
  // /dashboard. Without this, the public marketing page rendered on top
  // of the authenticated shell — owner reported "اطلاعات یه یوزر لاگین
  // کرده تو لندینگ هست".
  //
  // Gate-1 Fix 2: render <AuthLoadingSkeleton/> during the one-frame
  // interval between mount and useEffect firing, instead of `return null`
  // (which flashed a blank background). The skeleton matches the nav
  // chrome height so the swap to the real dashboard is layout-silent.
  const auth = useAuth();
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      go("dashboard");
    }
  }, [auth.isAuthenticated, go]);
  // useMouseParallax MUST run unconditionally to satisfy the rules of
  // hooks; the hook itself opts out at runtime when the marketing page
  // isn't mounted (no `.hero-bg .aurora` in the DOM = no work).
  useMouseParallax();

  // R-Landing-v2: reveal-on-scroll IntersectionObserver. Elements with
  // [data-reveal] get .in class when 8% in view. Pulled from the design's
  // app.tsx pattern. Lightweight — no TBT hit at the v1 levels (single
  // observer, no animation clustering).
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".home-shell-v2 [data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // R-Landing-v2: feature card spotlight follows the mouse. Scoped to
  // .home-shell-v2 .feature elements only (won't fire elsewhere).
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".home-shell-v2 .feature") as HTMLElement | null;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      target.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);

  // D48 ITEM 2 — mark body so home-v2-overrides.css can hide the AppShell
  // global Nav while Home is mounted. No :has() involved — React lifecycle
  // controls the attribute. D49 supersedes this with a direct AppShell
  // conditional but the data attribute stays as belt-and-suspenders.
  React.useEffect(() => {
    document.body.dataset.homeShell = "true";
    return () => { delete document.body.dataset.homeShell; };
  }, []);

  // D49 ITEM 7 — mobile hamburger state for the home Nav. Below 1024px
  // the nav-actions row collapses behind a hamburger button; tap opens
  // a drawer from the right edge (RTL start edge). Auto-closes on any
  // nav-link tap so the user can navigate immediately.
  const [homeMenuOpen, setHomeMenuOpen] = React.useState(false);
  // Close on Escape for keyboard a11y.
  React.useEffect(() => {
    if (!homeMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHomeMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [homeMenuOpen]);

  // Phase-A R7.1.1.a — REVERTED the .is-ready gated-animation pattern.
  // Initial attempt clustered 8+ animations into one trigger moment
  // and Lighthouse counted that concentrated work as a +1290ms TBT
  // spike (440 → 1730). Final shape: the static hero IS the design;
  // no JS-driven animation toggle. The auroras and 3D cards paint
  // in their final state and stay there. (Code intentionally absent.)

  if (auth.isAuthenticated) return <AuthLoadingSkeleton />;

  return (
    <div className="home-shell-v2">
      {/* ============== TOPBAR (Q2.b — Jahad institutional badge) ============== */}
      {/* Scoped INSIDE .home-shell-v2 so it cannot render on any other
          route. position: sticky from home-v2.css makes it stick within
          this wrapper. */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="left">
            <span className="badge">
              <Icon name="star" size={14} />
              زیرمجموعه‌ی <b style={{ color: "white", fontWeight: 600, margin: "0 4px" }}>جهاد دانشگاهی</b> ایران
            </span>
            <span className="sep" />
            <span className="badge">
              <Icon name="check" size={13} />
              ثبت‌نام دور پاییز ۱۴۰۵ آغاز شد
            </span>
          </div>
          <div className="right">
            <a href="mailto:info@digiuniversity.ir">
              <Icon name="globe" size={12} />
              info@digiuniversity.ir
            </a>
            <span className="sep" />
            <span>
              <Icon name="chat" size={12} />
              پشتیبانی ۲۴ / ۷
            </span>
          </div>
        </div>
      </div>

      {/* ============== HOME NAV (D48 ITEM 2 — replaces AppShell Nav on /) ============== */}
      {/* AppShell Nav is hidden via body[data-home-shell] data-attribute set
          by the useEffect above. This local nav uses the design's logo +
          brand text and routes to the same public destinations. */}
      <nav className="home-nav-v2" aria-label="ناوبری اصلی صفحه خانه">
        <div className="home-nav-inner">
          <div className="home-brand">
            <img src="/landing-v2/jahad-dark.png" alt="جهاد دانشگاهی" width="44" height="44" />
            <div className="home-brand-text">
              <span className="home-brand-name">دانشگاه برخط هوشمند ایران</span>
              <span className="home-brand-sub">JAHAD · AIRAC</span>
            </div>
          </div>
          {/* D49 ITEM 7 — mobile hamburger. CSS hides this above 1024px
              and hides the inline .home-nav-actions below 1024px. */}
          <button
            type="button"
            className="home-nav-burger"
            aria-label={homeMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={homeMenuOpen}
            aria-controls="home-nav-drawer"
            onClick={() => setHomeMenuOpen((v) => !v)}
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>
          <div className="home-nav-actions">
            <button type="button" className="home-nav-link" onClick={() => go("about")}>
              درباره‌ی ما
            </button>
            <button type="button" className="home-nav-link" onClick={() => go("schools")}>
              دانشکده‌ها
            </button>
            <button type="button" className="home-nav-link" onClick={() => go("login")}>
              ورود
            </button>
            <button type="button" className="home-nav-link is-primary" onClick={() => go("register")}>
              ثبت‌نام رایگان
            </button>
          </div>
        </div>
        {/* Mobile drawer — collapsed at ≥1024 via CSS. */}
        {homeMenuOpen ? (
          <>
            <div
              className="home-nav-backdrop"
              onClick={() => setHomeMenuOpen(false)}
              aria-hidden="true"
            />
            <div id="home-nav-drawer" className="home-nav-drawer" role="dialog" aria-label="منوی ناوبری">
              <button
                type="button"
                className="home-nav-link"
                onClick={() => { setHomeMenuOpen(false); go("about"); }}
              >
                درباره‌ی ما
              </button>
              <button
                type="button"
                className="home-nav-link"
                onClick={() => { setHomeMenuOpen(false); go("schools"); }}
              >
                دانشکده‌ها
              </button>
              <button
                type="button"
                className="home-nav-link"
                onClick={() => { setHomeMenuOpen(false); go("login"); }}
              >
                ورود
              </button>
              <button
                type="button"
                className="home-nav-link is-primary"
                onClick={() => { setHomeMenuOpen(false); go("register"); }}
              >
                ثبت‌نام رایگان
              </button>
            </div>
          </>
        ) : null}
      </nav>

      <main data-screen-label="01 خانه">
      {/* ============== HERO ============== */}
      <section className="hero">
        <div className="hero-bg">
          <div className="aurora aurora-1"></div>
          <div className="aurora aurora-2"></div>
          <div className="aurora aurora-3"></div>
        </div>

        <div className="shell hero-stage">
          <div className="hero-headline">
            {/* Q3.c hybrid co-brand chips: Jahad + AIRAC. D48 ITEM 3 update —
                real <img> tags using the design's PNG assets (light-bg variants)
                instead of placeholder icons. */}
            <div className="hero-crown" data-reveal>
              <div className="logo-card">
                <div className="l-img">
                  {/* D51 round-3 ITEM B — white Jahad seal for the dark
                      navy cobrand pill. jahad-dark.png renders invisible
                      on dark bg (was the bug); jahad-light.png is the
                      white-linework variant designed for dark surfaces. */}
                  <img src="/landing-v2/jahad-light.png" alt="جهاد دانشگاهی" />
                </div>
                <div className="l-text">
                  <b>جهاد دانشگاهی</b>
                  <small>بنیان‌گذار از سال ۱۳۵۹</small>
                </div>
              </div>
              <div className="logo-card">
                <div className="l-img">
                  <img src="/landing-v2/airac-white.png" alt="AIRAC" />
                </div>
                <div className="l-text">
                  <b>مرکز راهبری پژوهش و پیشرفت</b>
                  <small>هوش مصنوعی · AIRAC</small>
                </div>
              </div>
            </div>
            <div className="hero-eyebrow">
              <span className="dot"></span>
              <span>EST. 2026 · CHARTERED ONLINE UNIVERSITY · AI-NATIVE</span>
            </div>
            {/* D48 ITEM 3 — hero title refinement per owner feedback.
                Title simplified to design's institutional phrasing.
                Sub paragraph rephrased: «برخط» replaces «آنلاین» per ITEM 6 sweep. */}
            <h1 className="hero-title">
              <span className="hero-title-line">دانشگاه برخط هوشمند ایران</span>
            </h1>
            <p className="hero-sub">
              از کلاس‌های زنده تا آزمایشگاه‌های مجازی، با همراهی هوش مصنوعی — همگام با استانداردهای جهانی LTI، xAPI، QTI و Open Badges 3.0. ۸ دانشکده، ۹۴ استاد، مدارک قابل راستی‌آزمایی.
            </p>
            <div className="hero-cta">
              <Button variant="primary" size="lg" onClick={() => go("admissions")}>
                درخواست پذیرش
                <Icon name="arrow" size={16} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => go("schools")}>
                <Icon name="grad" size={16} />
                دانشکده‌ها و برنامه‌ها
              </Button>
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

      {/* ============== TRUST STRIP (R9 §2) ============== */}
      <TrustStrip />

      {/* ============== STATS BAND (R9 §3) ============== */}
      <StatsBand />

      {/* ============== FACULTY SHOWCASE (R10 §4) ============== */}
      {/* D48 ITEM 4 — Faculty section per design (8 portraits + data verbatim).
          Replaces the prior FacultyShowcase which used 4 cards + different data. */}
      <FacultyV2Section />

      {/* ============== CATALOG TEASER (R10 §5) ============== */}
      <CatalogTeaser go={go} />

      {/* ============== TESTIMONIALS + DUAL CTA (R10 §6) ============== */}
      {/* D48 ITEM 5 — Testimonials per design (3 cards with photo avatars).
          Replaces prior <Testimonials /> which used a different layout. */}
      <TestiV2Section />

      {/* ============== AGENT SYSTEM ============== */}
      <section className="section">
        <div className="shell">
          <div className="section-head reveal">
            <div className="text">
              <span className="eyebrow">AGENT ARCHITECTURE</span>
              <h2 className="h-1">
                به‌جای یک چت‌بات،
                <br />
                <span style={{ color: "var(--violet)" }}>یک تیم آموزشی</span>
              </h2>
            </div>
            <p className="lead">
              هر درس یک Agent Graph مستقل دارد. پنج عامل تخصصی، هر یک با نقش، مرز، منابع مجاز و معیار ارزیابی خود. استاد بر همه چیز نظارت دارد.
            </p>
          </div>

          <div className="pillar-grid stagger">
            {/* Pillar 1 — agent graph */}
            <div className="pillar pillar-1 reveal">
              <div className="glow"></div>
              <span className="num">۰۱ / موتور یادگیری</span>
              <h3>پنج عامل، یک هدف: تسلط واقعی</h3>
              <p>توضیح‌دهنده، مربی پرسش‌گر، منتقد، منتور بلندمدت و ارزیاب — هر کدام در حوزه‌ی تخصص خود و تحت کنترل استاد.</p>
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
              <p>دانش قبلی، سرعت یادگیری، مفاهیم مسلط و مبهم، سبک تعامل و ریسک افت — همگی به‌روزرسانی لحظه‌ای.</p>
              <div className="pt-5 flex gap-2.5 flex-wrap"  style={{marginTop: "auto"}}>
                <span className="pill pill-cyan">Bayesian KT</span>
                <span className="pill pill-amber">Deep KT</span>
                <span className="pill">IRT 2PL</span>
              </div>
            </div>

            <div className="pillar pillar-3 reveal">
              <div className="glow"></div>
              <span className="num">۰۳ / تسلط</span>
              <h3>عبور با شواهد، نه با حضور</h3>
              <p>هر فعالیت به یک هدف یادگیری متصل است. آستانه‌ی تسلط قابل تنظیم. سامانه می‌داند کجا تمرین بیشتر نیاز است.</p>
              <div className="pt-5"  style={{marginTop: "auto"}}>
                <MasteryRing percent={78} />
              </div>
            </div>

            <div className="pillar pillar-4 reveal">
              <div className="glow"></div>
              <span className="num">۰۴ / کلاس زنده</span>
              <h3>WebRTC · LL-HLS · ضبط هوشمند</h3>
              <p>کلاس کوچک تعاملی تا وبینار هزاران‌نفره. ضبط، گفتار به متن، تشخیص گوینده، فصل‌بندی خودکار — همه استاندارد.</p>
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

      {/* ============== MARQUEE — TRUSTED BY ============== */}
      <div className="marquee">
        <div className="marquee-track">
          {[
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
          ].map((n, i) => (
            <span key={i} className="marquee-item">{n}</span>
          ))}
        </div>
      </div>

      {/* ============== KNOWLEDGE GRAPH ============== */}
      <section className="section pt-0" >
        <div className="shell">
          <div className="grid grid-2 gap-12 items-center"  style={{gridTemplateColumns: "1fr 1.1fr"}}>
            <div>
              <span className="eyebrow">KNOWLEDGE GRAPH</span>
              <h2 className="h-1 mt-4" >
                هر درس یک
                <br />
                <span style={{ color: "var(--cyan)" }}>شبکه‌ی مفهومی</span> است
              </h2>
              <p className="lead mt-5" >
                وقتی دانشجو روی یک مفهوم گیر می‌کند، سامانه می‌داند کدام پیش‌نیازها را مرور کند، کدام تمرین جبرانی بدهد و کدام بخش از ویدئوی کلاس را نشان دهد.
              </p>
              <div className="grid mt-8 gap-4.5"  style={{gridTemplateColumns: "1fr 1fr"}}>
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
      <section className="section pt-0" >
        <div className="shell">
          <div className="grid grid-2 gap-12 items-center"  style={{gridTemplateColumns: "1.1fr 1fr"}}>
            <div className="kg-wrap grid"  style={{minHeight: 480, placeItems: "center"}}>
              <ArchStack />
            </div>
            <div>
              <span className="eyebrow">PLATFORM ARCHITECTURE</span>
              <h2 className="h-1 mt-4" >
                معماری <span style={{ color: "var(--amber)" }}>پنج لایه</span>،
                <br />
                cloud-native و قابل خودمیزبانی
              </h2>
              <p className="lead mt-5" >
                از SaaS برای مؤسسات کوچک تا Private Cloud و On-Premise برای نهادهای حساس. هر سرویس مستقل، هر سرویس قابل جایگزینی.
              </p>
              <div className="mt-7" >
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
              <h2 className="h-1 mt-4" >دروسی که با تو رشد می‌کنند</h2>
            </div>
            <Button variant="outline" onClick={() => go("programs")}>
              همه‌ی دروس
              <Icon name="arrow" size={14} />
            </Button>
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
                  {/* R7.3 A.3.i — was `<h4>` directly under section's
                      `<h2>` ("دروسی که با تو رشد می‌کنند") which skips
                      h3 (heading-order fail). Renamed to `<h3>`;
                      `.course-body h4` rule in styles.css updated to
                      `.course-body h3` to keep the visual treatment. */}
                  <h3>{c.title}</h3>
                  <div className="by">با {c.by}</div>
                  <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>{c.desc}</p>
                  <div className="course-meta">
                    <span className="it"><strong>{c.weeks}</strong> هفته</span>
                    <span className="it"><strong>{c.modules}</strong> ماژول</span>
                    <span className="it"><strong>{c.students}</strong> دانشجو</span>
                  </div>
                </div>
              </button>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============== STANDARDS ============== */}
      <section className="section pt-0" >
        <div className="shell">
          <div className="card p-12 text-center" >
            <span className="eyebrow justify-center" >STANDARDS · INTEROPERABILITY</span>
            <h2 className="h-2 mt-4.5"  style={{ maxWidth: 720, margin: "18px auto 0"}}>
              ساخته‌شده بر شانه‌ی استانداردهایی که دانشگاه‌های دنیا با آن کار می‌کنند
            </h2>
            <div className="standards justify-center mt-8" >
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
      <section className="section pt-0" >
        <div className="shell">
          <div className="section-head">
            <div className="text">
              <span className="eyebrow">PLATFORM TOUR · ۲۰ SCREEN</span>
              <h2 className="h-1 mt-4" >هر نقش، یک محیط کاری مستقل</h2>
            </div>
            <p className="lead">
              دانشجو، استاد، طراح آموزشی، مدیر — هر یک ابزار خود را دارد. همه روی یک سکو.
            </p>
          </div>

          <Stagger className="grid grid-4">
            {[
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
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className="reveal rounded-xl p-5 cursor-pointer relative overflow-hidden text-right"
                onClick={() => go(p.id)}
                aria-label={`${p.t} · ${p.d}`}
                style={{background: "var(--surface)",
                border: "1px solid var(--line)",
                transition: "200ms ease",
                fontFamily: "inherit",
                color: "var(--fg)"}}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--line)"; }}
              >
                <div className="flex items-center justify-between mb-3.5" >
                  <div className="rounded-lg grid"  style={{width: 36, height: 36, background: "var(--surface-2)", color: "var(--accent)", placeItems: "center"}}>
                    <Icon name={p.ic} size={16} />
                  </div>
                  <Icon name="arrow" size={14} stroke={2} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.t}</div>
                <div className="mt-1.5"  style={{fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.5}}>{p.d}</div>
              </button>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section className="section">
        <div className="shell">
          <div className="card grid gap-12 items-center"  style={{padding: "64px 48px",
            background: "linear-gradient(135deg, var(--surface) 0%, color-mix(in oklch, var(--cyan) 8%, var(--surface-2)) 100%)", gridTemplateColumns: "1.4fr 1fr"}}>
            <div>
              <span className="eyebrow">GET STARTED</span>
              <h2 className="h-1 mt-4" >دانشگاهی تأسیس کنید که هرگز نمی‌خوابد</h2>
              <p className="lead mt-4" >
                در کمتر از ۳۰ روز، اولین ترم برخط خود را با کلاس زنده، ضبط هوشمند، آزمون تطبیقی و گواهی دیجیتال اجرا کنید.
              </p>
              <div className="flex gap-3 mt-8" >
                <Button variant="primary" size="lg" onClick={() => go("admissions")}>
                  درخواست دموی نهادی
                  <Icon name="arrow" size={16} />
                </Button>
                <Button variant="outline" size="lg">
                  <Icon name="download" size={16} />
                  دانلود پروپوزال
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2.5" >
              {[
                ["MVP در ۳۰ روز", "اولین درس برخط قابل اجرا"],
                ["ترم کامل در ۹۰ روز", "تمام سرویس‌های دانشگاه آماده"],
                ["مقیاس ملی در ۶ ماه", "چند مستاجره، SLA 99.9٪"],
              ].map(([t, s], i) => (
                <div key={i} className="card-flat flex items-center gap-3.5" >
                  <div className="rounded-xl grid"  style={{width: 36, height: 36, background: "var(--surface-3)", color: "var(--cyan)", placeItems: "center", fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 13}}>
                    {toFa(i + 1)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
                    <div className="mt-0.5"  style={{color: "var(--fg-mute)", fontSize: 12}}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
};

// ====== sub-components for home ======

// D48 ITEM 4 — Faculty section per Claude Design data.tsx verbatim.
// 8 portraits served from /landing-v2/faculty/. Data preserves design's
// exact names, roles, and fields. Layout: 4-col desktop / 2-col tablet
// / 1-col mobile (CSS in home-v2-overrides.css .faculty-v2-grid).
const FACULTY_V2 = [
  { name: "دکتر سید محمد حسینی", role: "دانشیار دانشگاه شریف",         field: "هوش مصنوعی و یادگیری ماشین",       photo: "/landing-v2/faculty/m2.png" },
  { name: "دکتر زهرا کریمی",     role: "استاد دانشگاه تهران",            field: "علوم داده و آمار کاربردی",        photo: "/landing-v2/faculty/w1.jpg" },
  { name: "دکتر علیرضا مظفری",   role: "استادیار دانشگاه امیرکبیر",       field: "مهندسی نرم‌افزار و سامانه‌ها",     photo: "/landing-v2/faculty/m1.jpg" },
  { name: "دکتر مریم باقری",     role: "پژوهشگر ارشد جهاد دانشگاهی",      field: "مدیریت کسب‌وکار دیجیتال",         photo: "/landing-v2/faculty/w2.png" },
  { name: "دکتر امیر طاهری",     role: "هیأت علمی دانشگاه علم و صنعت",   field: "بینایی ماشین و رباتیک",           photo: "/landing-v2/faculty/m3.png" },
  { name: "دکتر نسرین مرادی",    role: "هیأت علمی دانشگاه الزهرا",        field: "طراحی تجربه کاربری",              photo: "/landing-v2/faculty/w3.png" },
  { name: "دکتر کامران اسدی",    role: "پژوهشگر پژوهشگاه دانش‌های بنیادی", field: "پردازش زبان طبیعی فارسی",       photo: "/landing-v2/faculty/m4.png" },
  { name: "دکتر فاطمه نصیری",    role: "استادیار دانشگاه فردوسی مشهد",   field: "مهندسی صنایع و بهینه‌سازی",        photo: "/landing-v2/faculty/w4.png" },
];

const FacultyV2Section = () => (
  <section className="faculty-v2-section" data-reveal>
    <div className="shell">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">اساتید همکار</div>
          <h2 className="section-title">
            تجربه‌ی <span className="em">برترین‌ها</span> در کنار شما.
          </h2>
        </div>
        <p className="section-lead">
          بیش از سیصد استاد از دانشگاه‌های شریف، تهران، امیرکبیر و دیگر مراکز علمی برجسته‌ی کشور به‌همراه متخصصان فعال صنعت، در طراحی و تدریس دوره‌های ما همکاری می‌کنند.
        </p>
      </div>
      <div className="faculty-v2-grid">
        {FACULTY_V2.map((f) => (
          <article key={f.name} className="faculty-v2-card">
            <div className="portrait">
              <img src={f.photo} alt={f.name} loading="lazy" />
            </div>
            <div className="info">
              <div className="name">{f.name}</div>
              <div className="role">{f.role}</div>
              <div className="field">{f.field}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const Stat = ({ v, unit, l }) => (
  <div className="hero-stat">
    <div className="v">{v}{unit && <span className="unit">{unit}</span>}</div>
    <div className="l">{l}</div>
  </div>
);

// D48 ITEM 5 — Testimonials per Claude Design data.tsx verbatim.
// 3 student stories with circular avatar (photo reused from faculty
// portraits per design's pattern — the design also reuses these as
// generic student avatars). Initials are the text fallback if photo
// fails to load. Layout: 3-col desktop / 2-col tablet (≤1024) / 1-col
// mobile (≤640) via .testi-v2-grid in home-v2-overrides.css.
// D51 ITEM C — testimonials avatars upgraded. Removed faculty-photo reuse
// (owner reported the faculty headshots looked off as "student" avatars).
// Replaced with stylized initial-letter avatars on gradient circles +
// inline graduation-cap SVG decoration in each card. Professional,
// student-relevant, no external asset dependency.
// D52 ITEM 2 — owner directive «تجربه واقعی از دانشجویان ما از عکسهایی
// که تو اپلود فولدر گذاشتم استفاده کنه» — use the real student photos
// from docs/my-upload/landing-v2/uploads/. Each card now has a real
// portrait + initial-letter fallback if image fails.
const TESTI_V2 = [
  {
    body: "فضای آموزشی هوشمند دانشگاه به من اجازه داد همزمان با کار تمام‌وقت، دوره‌ی فول‌استک را با کیفیتی فراتر از انتظار به اتمام برسانم. شش ماه پس از فارغ‌التحصیلی به‌عنوان توسعه‌دهنده در یک شرکت بزرگ مشغول شدم.",
    name: "حسین رضایی",
    role: "مهندس نرم‌افزار، فارغ‌التحصیل دوره‌ی فول‌استک",
    initials: "ح.ر",
    accent: "navy",
    photo: "/landing-v2/students/student-man-1.jpg",
  },
  {
    body: "پشتیبانی اساتید و دسترسی ۲۴ ساعته به محتوا، تجربه‌ای متفاوت از آموزش‌های برخط معمولی بود. آنچه واقعاً تفاوت ایجاد کرد، کیفیت مشاوران و پروژه‌های واقعی بود که در کارنامه‌ی حرفه‌ای‌ام ماندگار شد.",
    name: "نگار صفری",
    role: "متخصص علوم داده، فارغ‌التحصیل MBA دیجیتال",
    initials: "ن.ص",
    accent: "cobalt",
    photo: "/landing-v2/students/student-woman-1.jpg",
  },
  {
    body: "به‌عنوان مادر دو فرزند، یافتن زمان برای آموزش حضوری ممکن نبود. این سامانه به من فرصت داد بدون از دست دادن خانواده، در رشته‌ی طراحی UX به سطحی برسم که اکنون از خانه فعالیت حرفه‌ای دارم.",
    name: "فاطمه احمدی",
    role: "طراح UX، فارغ‌التحصیل دوره‌ی طراحی",
    initials: "ف.ا",
    accent: "gold",
    photo: "/landing-v2/students/student-woman-2.png",
  },
];

// Small inline grad-cap SVG used as a decorative element in each testimonial
// card. Single-color, currentColor-aware, ~28px square.
const GradCapSvg = () => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m12 4 10 5-10 5L2 9z" />
    <path d="M6 11v4a6 6 0 0 0 12 0v-4" />
    <path d="M21 10v6" />
  </svg>
);

const TestiV2Section = () => (
  <section className="testi-v2-section" data-reveal>
    <div className="shell">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">پیشنهاد دانشجویان فعلی</div>
          <h2 className="section-title">
            <span className="em">تجربه‌ی واقعی</span> از دانشجویان ما.
          </h2>
        </div>
        <p className="section-lead">
          فارغ‌التحصیلان دوره‌های ما در شرکت‌های فناوری، پژوهشگاه‌ها و کسب‌وکارهای دیجیتال مشغول فعالیت‌اند. صدای آن‌ها معیار ما برای کیفیت یادگیری است.
        </p>
      </div>
      <div className="testi-v2-grid">
        {TESTI_V2.map((t) => (
          <article key={t.name} className={`testi-v2-card accent-${t.accent}`}>
            <div className="testi-card-top">
              <div className="quote-mark" aria-hidden="true">&ldquo;</div>
              <div className="testi-card-grad" aria-hidden="true"><GradCapSvg /></div>
            </div>
            <p className="quote-body">{t.body}</p>
            <div className="person">
              <div className="person-avatar" aria-hidden="true">
                {t.photo ? (
                  <img src={t.photo} alt="" loading="lazy" />
                ) : (
                  <span>{t.initials}</span>
                )}
              </div>
              <div className="person-info">
                <span className="person-name">{t.name}</span>
                <span className="person-role">{t.role}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const Feature = ({ title, desc, icon }) => (
  <div>
    <div className="flex items-center gap-2.5 mb-2"  style={{ color: "var(--cyan)"}}>
      <Icon name={icon} size={18} />
      <div style={{ fontWeight: 600, color: "var(--fg)", fontSize: 14 }}>{title}</div>
    </div>
    <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>{desc}</div>
  </div>
);

const TechRow = ({ label, items }) => (
  <div className="grid gap-4.5"  style={{ gridTemplateColumns: "100px 1fr", padding: "12px 0", borderTop: "1px solid var(--line)"}}>
    <div className="uppercase"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.1em"}}>{label}</div>
    <div className="flex flex-wrap gap-1.5" >
      {items.map((i) => <span className="rounded-md" key={i}  style={{fontFamily: "var(--f-mono)", fontSize: 12, padding: "3px 9px", background: "var(--surface-2)", border: "1px solid var(--line)"}}>{i}</span>)}
    </div>
  </div>
);

// Mastery ring for pillar 3
const MasteryRing = ({ percent }) => {
  const r = 36, c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div className="flex items-center gap-4.5" >
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--violet)" strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 45 45)" />
        <text x="45" y="50" textAnchor="middle" fill="var(--fg)" fontFamily="var(--f-mono)" fontWeight="700" fontSize="18">{toFa(percent)}٪</text>
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>تسلط فعلی</div>
        <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>۷ از ۹ هدف</div>
      </div>
    </div>
  );
};

// ====== 3D hero floating cards ======
const Hero3DClassroom = () => (
  <div className="hero-card hc-classroom">
    <div className="head">
      <div className="title">کلاس زنده · جلسه ۸</div>
      <div className="meta">۴۲ حاضر</div>
    </div>
    <div className="mini-video">
      <span className="live-pill"><span className="dot"></span>LIVE</span>
      <span className="label">prof.azimi · sharing</span>
    </div>
    <div className="mini-faces">
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => <div key={i} className="mini-face" />)}
    </div>
  </div>
);

const Hero3DTutor = () => (
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

const Hero3DAnalytics = () => (
  <div className="hero-card hc-analytics">
    <div className="head">
      <div className="title">سلامت کلاس</div>
      <div className="meta">real-time</div>
    </div>
    <div className="bar-row"><div className="bar-label">مشارکت</div><div className="bar-track"><div className="bar-fill" style={{width:"82%"}}/></div><div className="bar-val">۸۲</div></div>
    <div className="bar-row"><div className="bar-label">فهم</div><div className="bar-track"><div className="bar-fill amber" style={{width:"64%"}}/></div><div className="bar-val">۶۴</div></div>
    <div className="bar-row"><div className="bar-label">سرعت</div><div className="bar-track"><div className="bar-fill rose" style={{width:"94%"}}/></div><div className="bar-val">!۹۴</div></div>
    <div className="bar-row"><div className="bar-label">ابهام</div><div className="bar-track"><div className="bar-fill amber" style={{width:"38%"}}/></div><div className="bar-val">۳۸</div></div>
  </div>
);

const Hero3DCredential = () => (
  <div className="hero-card hc-credential">
    <div className="head">
      <div className="title">گواهی دیجیتال</div>
      <div className="meta">verifiable</div>
    </div>
    <div className="credential-mini">
      <div className="credential-seal float"></div>
      <div className="mt-3"  style={{fontSize: 12, color: "var(--fg-mute)"}}>تسلط کامل بر:</div>
      <div className="mt-1"  style={{fontSize: 13, fontWeight: 600}}>یادگیری عمیق</div>
      <div className="mt-2"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)"}}>#7f3a · OB 3.0</div>
    </div>
  </div>
);

// ====== Phase-16 R9 — Trust strip (§2) ======
//
// Six partner logos rendered as inline SVGs so we don't pay an extra
// HTTP round-trip per logo. Grayscale by default — saturate on hover.
// The placeholders are generic monograms; replace with real partners
// in a future content sprint.
const TRUST_PARTNERS = [
  { id: "msa", name: "MSA", glyph: "M" },
  { id: "ut", name: "UT", glyph: "ا" },
  { id: "sharif", name: "Sharif", glyph: "ش" },
  { id: "khu", name: "KHU", glyph: "خ" },
  { id: "iut", name: "IUT", glyph: "ا" },
  { id: "amir", name: "Amirkabir", glyph: "م" },
];

const TrustStrip = () => (
  <section className="trust-strip" aria-label="سازمان‌های همکار">
    <div className="shell">
      <div className="trust-strip-eyebrow">
        <span className="dot"></span>
        <span>سازمان‌های همکار و دانشگاه‌های شریک</span>
      </div>
      <ul className="trust-strip-row">
        {TRUST_PARTNERS.map((p) => (
          <li key={p.id} className="trust-strip-item" title={p.name}>
            <span className="trust-strip-glyph" aria-hidden="true">
              {p.glyph}
            </span>
            <span className="trust-strip-name">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

// ====== Phase-16 R9 — Animated stats band (§3) ======
//
// Four numbers count up when the band scrolls into view. We honour
// `prefers-reduced-motion: reduce` by skipping the animation and
// rendering the final value immediately.
const STATS_BAND = [
  { value: 8, suffix: "", label: "دانشکده" },
  { value: 248, suffix: "", label: "برنامه آکادمیک" },
  { value: 94, suffix: "", label: "استاد" },
  { value: 8400, suffix: "+", label: "دانشجو" },
];

// Persian numeral conversion — share with the existing `toFa` helper
// in `shared.tsx` once we type that file, for now inline.
const toFaDigits = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const StatsBand = () => {
  const ref = React.useRef(null);
  const [displayed, setDisplayed] = React.useState(() => STATS_BAND.map(() => 0));
  const [hasRun, setHasRun] = React.useState(false);

  React.useEffect(() => {
    if (hasRun) return;
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayed(STATS_BAND.map((s) => s.value));
      setHasRun(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (!visible || hasRun) return;
        setHasRun(true);
        const start = performance.now();
        const DURATION = 1400; // ms
        const tick = (now) => {
          const t = Math.min(1, (now - start) / DURATION);
          // ease-out cubic for a friendly count-up
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplayed(STATS_BAND.map((s) => Math.round(s.value * eased)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasRun]);

  return (
    <section className="stats-band" ref={ref} aria-label="اعداد دانشگاه">
      <div className="shell">
        <div className="stats-band-grid">
          {STATS_BAND.map((s, i) => (
            <div className="stats-band-cell" key={s.label}>
              <div className="stats-band-value">
                {toFaDigits(displayed[i])}
                {s.suffix}
              </div>
              <div className="stats-band-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ====== Phase-16 R10 §4 — Faculty showcase ======
//
// 6 instructor cards in a responsive grid. Each card reuses the
// existing 3D treatment (paper shadow + accent border on hover). The
// data is hardcoded here for now — TODO(phase-17) pull from
// /v1/users?role=instructor.
const FACULTY_SHOWCASE = [
  {
    initials: "د. ع",
    name: "دکتر سپیده عظیمی",
    affiliation: "صنعتی شریف",
    bio: "یادگیری ماشین · ۱۸ سال سابقه تدریس",
  },
  {
    initials: "م. ک",
    name: "مهندس آرش کیانی",
    affiliation: "تهران",
    bio: "معماری سامانه‌های مقیاس‌پذیر · ۱۲ سال صنعت",
  },
  {
    initials: "د. ر",
    name: "دکتر مهرنوش رضوی",
    affiliation: "علم و صنعت",
    bio: "طراحی محصول داده‌محور · پژوهش ارشد در گوگل",
  },
  {
    initials: "د. م",
    name: "دکتر بابک موسوی",
    affiliation: "امیرکبیر",
    bio: "پردازش زبان طبیعی · مؤلف ۴ کتاب",
  },
  {
    initials: "د. ط",
    name: "دکتر فاطمه طاهری",
    affiliation: "خوارزمی",
    bio: "اخلاق و حاکمیت هوش مصنوعی",
  },
  {
    initials: "د. ف",
    name: "دکتر بهنام فرهادی",
    affiliation: "صنعتی اصفهان",
    bio: "آمار بیزی کاربردی · ۲۰ سال پژوهش",
  },
];

const FacultyShowcase = ({ go }) => (
  <section className="section faculty-showcase" aria-label="استادان">
    <div className="shell">
      <div className="section-head reveal">
        <div className="text">
          <span className="eyebrow">FACULTY</span>
          <h2 className="h-1">استادانی از <span style={{ color: "var(--accent)" }}>دانشگاه‌های برتر</span></h2>
        </div>
        <p className="lead">
          ۹۴ عضو هیات علمی از صنعتی شریف، تهران، علم و صنعت، امیرکبیر و خوارزمی — کنار همکاران بین‌المللی از MIT، Stanford و ETH.
        </p>
      </div>
      <div className="faculty-grid">
        {FACULTY_SHOWCASE.map((f) => (
          <article key={f.name} className="faculty-card reveal">
            <div className="faculty-avatar" aria-hidden="true">{f.initials}</div>
            <h3 className="faculty-name">{f.name}</h3>
            <span className="faculty-affiliation">{f.affiliation}</span>
            <p className="faculty-bio">{f.bio}</p>
          </article>
        ))}
      </div>
      <div className="faculty-cta">
        <Button variant="outline" onClick={() => go("schools")}>
          مشاهده همه‌ی استادان
          <Icon name="arrow" size={14} />
        </Button>
      </div>
    </div>
  </section>
);

// ====== Phase-16 R10 §5 — Catalog teaser ======
//
// 6 featured courses in a responsive grid. On `<sm` they switch to a
// horizontal scroll-snap carousel so the user sees one course at a
// time without crammed half-cards. Container query inside the grid
// item makes the inner layout adapt to the slot, not just the
// viewport (so a course card in a sidebar elsewhere stacks
// vertically instead of overflowing).
const CATALOG_TEASER = [
  { code: "CS-410", title: "مبانی یادگیری ماشین", by: "دکتر عظیمی", desc: "از رگرسیون تا شبکه‌های عمیق.", weeks: "۱۲", glyph: "ML" },
  { code: "CS-580", title: "معماری سامانه‌های مقیاس‌پذیر", by: "مهندس کیانی", desc: "میکروسرویس · Kafka · Kubernetes.", weeks: "۱۰", glyph: "SYS" },
  { code: "PM-310", title: "طراحی محصول داده‌محور", by: "دکتر رضوی", desc: "متریک‌ها و آزمایش‌های A/B.", weeks: "۸", glyph: "PM" },
  { code: "CS-620", title: "NLP پیشرفته", by: "دکتر موسوی", desc: "ترنسفورمرها، RAG، ارزیابی LLM.", weeks: "۱۴", glyph: "NLP" },
  { code: "PHIL-220", title: "اخلاق هوش مصنوعی", by: "دکتر طاهری", desc: "تعصب، عاملیت و حاکمیت داده.", weeks: "۶", glyph: "AI⁺" },
  { code: "STAT-440", title: "آمار بیزی کاربردی", by: "دکتر فرهادی", desc: "از قانون بیز تا MCMC.", weeks: "۱۰", glyph: "Σ" },
];

const CatalogTeaser = ({ go }) => (
  <section className="section catalog-teaser" aria-label="درس‌های برگزیده">
    <div className="shell">
      <div className="section-head reveal">
        <div className="text">
          <span className="eyebrow">FEATURED COURSES</span>
          <h2 className="h-1">از پیشنهادهای <span style={{ color: "var(--navy)" }}>دانشجویان فعلی</span></h2>
        </div>
        <p className="lead">
          شش درس پربازدید ترم. هر کدام به‌صورت کامل قابل اعتبارسنجی است، با گواهی Open Badges 3.0.
        </p>
      </div>
      <div className="catalog-teaser-rail">
        {CATALOG_TEASER.map((c) => (
          <article key={c.code} className="catalog-teaser-card reveal">
            <div className={"catalog-teaser-glyph"}>{c.glyph}</div>
            <div className="catalog-teaser-body">
              <div className="catalog-teaser-code">{c.code}</div>
              <h3 className="catalog-teaser-title">{c.title}</h3>
              <p className="catalog-teaser-by">{c.by}</p>
              <p className="catalog-teaser-desc">{c.desc}</p>
              <div className="catalog-teaser-meta">
                <span>{c.weeks} هفته</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="catalog-teaser-cta">
        <Button variant="outline" onClick={() => go("catalog")}>
          همه‌ی ۲۴۸ برنامه
          <Icon name="arrow" size={14} />
        </Button>
      </div>
    </div>
  </section>
);

// ====== Phase-16 R10 §6 — Testimonials + dual CTA ======
const TESTIMONIALS = [
  {
    initials: "ن. ر",
    name: "نسرین رضوی",
    role: "دانشجو · صنعتی اصفهان · فارغ‌التحصیل CS-410",
    quote:
      "من از ترم اول این دانشگاه استفاده می‌کنم. کلاس‌های زنده، آزمایشگاه مجازی و تدریس‌یار AI کنار هم یه تجربه‌ای رو می‌ساختن که قبلاً تجربه نکرده بودم.",
  },
  {
    initials: "ع. ج",
    name: "علی جوادی",
    role: "Senior SWE · Snapp · فارغ‌التحصیل CS-580",
    quote:
      "گواهی Open Badges که گرفتم رو روی LinkedIn زدم و سه‌تا offer گرفتم. اعتبار سکو خیلی فرق می‌کنه با دوره‌های برخط رایج.",
  },
  {
    initials: "م. ک",
    name: "مهسا کیانی",
    role: "پدر و مادر · فرزند در پایه‌ی دوم دبیرستان",
    quote:
      "بخش والدین رو دارم پیگیری می‌کنم. به‌جای صد نوع پیام‌رسان، همه‌ی نمرات و حضور و غیاب و پیام معلم رو یه‌جا می‌بینم.",
  },
];

const Testimonials = ({ go }) => (
  <section className="section testimonials" aria-label="نظرات کاربران">
    <div className="shell">
      <div className="section-head reveal">
        <div className="text">
          <span className="eyebrow">ALUMNI</span>
          <h2 className="h-1">از کسانی که اینجا <span style={{ color: "var(--sage)" }}>ساخته شدند</span></h2>
        </div>
        <p className="lead">
          سه روایت کوتاه از دانشجو، فارغ‌التحصیل، و والدین — درباره‌ی این که چرا اینجا ماندند.
        </p>
      </div>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((t) => (
          <article key={t.name} className="testimonial-card reveal">
            <svg
              className="testimonial-mark"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="M9 8c-3 1-5 4-5 8v8h8v-9H7c0-2 1-4 3-5l-1-2zm14 0c-3 1-5 4-5 8v8h8v-9h-5c0-2 1-4 3-5l-1-2z" />
            </svg>
            <p className="testimonial-quote">«{t.quote}»</p>
            <footer className="testimonial-footer">
              <span className="testimonial-avatar" aria-hidden="true">{t.initials}</span>
              <span>
                <strong>{t.name}</strong>
                <br />
                <span>{t.role}</span>
              </span>
            </footer>
          </article>
        ))}
      </div>
      <div className="testimonials-cta-row">
        <Button variant="primary" size="lg" onClick={() => go("admissions")}
        >
          شروع رایگان
          <Icon name="arrow" size={16} />
        </Button>
        <Button variant="outline" size="lg" onClick={() => go("programs")}
        >
          مشاهده برنامه‌ها
          <Icon name="grad" size={16} />
        </Button>
      </div>
    </div>
  </section>
);

// ====== Course catalog data ======
const COURSES = [
  { title: "مبانی یادگیری ماشین", code: "CS-410", by: "دکتر عظیمی", desc: "از رگرسیون تا شبکه‌های عمیق، با تأکید بر شهود و کاربرد.", weeks: "۱۲", modules: "۲۴", students: "۸۴۳", cover: "cyan", glyph: "ML" },
  { title: "معماری سامانه‌های مقیاس‌پذیر", code: "CS-580", by: "مهندس کیانی", desc: "میکروسرویس، Kafka، Kubernetes — با پروژه عملی.", weeks: "۱۰", modules: "۲۰", students: "۵۱۲", cover: "amber", glyph: "SYS" },
  { title: "طراحی محصول داده‌محور", code: "PM-310", by: "دکتر رضوی", desc: "متریک‌ها، آزمایش، شهود و چارچوب‌های تصمیم‌گیری.", weeks: "۸", modules: "۱۶", students: "۳۲۷", cover: "violet", glyph: "PM" },
  { title: "پردازش زبان طبیعی پیشرفته", code: "CS-620", by: "دکتر موسوی", desc: "ترنسفورمرها، RAG، ارزیابی LLM و پیاده‌سازی.", weeks: "۱۴", modules: "۲۸", students: "۶۲۴", cover: "deep", glyph: "NLP" },
  { title: "اخلاق هوش مصنوعی", code: "PHIL-220", by: "دکتر طاهری", desc: "تعصب، عاملیت، حاکمیت داده و چارچوب‌های نظارتی.", weeks: "۶", modules: "۱۲", students: "۴۱۸", cover: "rose", glyph: "AI⁺" },
  { title: "آمار بیزی کاربردی", code: "STAT-440", by: "دکتر فرهادی", desc: "از قانون بیز تا MCMC با مثال‌های واقعی.", weeks: "۱۰", modules: "۲۰", students: "۲۸۹", cover: "green", glyph: "Σ" },
];

export default HomePage;
