// app.tsx — Smart Online University of Iran — landing page composition
const { useState: useStateApp, useEffect: useEffectApp } = React;

declare const UNI_DATA: any;
declare const Icon: any;
declare const IconArrow: any;
declare const IconChevron: any;
declare const BrandLockup: any;
declare const HeroLogoCard: any;
declare const Avatar: any;
declare const CoursePreview: any;
declare const LiveStatsCard: any;
declare const CourseCover: any;
declare const FacultyPortrait: any;
declare const TestiAvatar: any;
declare const PartnerMark: any;
declare const TweaksPanel: any;
declare const useTweaks: any;
declare const TweakSection: any;
declare const TweakRadio: any;
declare const TweakToggle: any;
declare const TweakColor: any;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2e6bff",
  "density": "comfy",
  "showLiveStats": true,
  "heroLayout": "split"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeTab, setActiveTab] = useStateApp<'all' | 'tech' | 'mgmt' | 'med' | 'art'>('all');
  const [drawerOpen, setDrawerOpen] = useStateApp(false);
  const [scrolled, setScrolled] = useStateApp(false);

  useEffectApp(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
  }, [tweaks.accent]);

  useEffectApp(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal-on-scroll: IntersectionObserver adds .in class to elements with [data-reveal]
  useEffectApp(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Feature card spotlight follows mouse
  useEffectApp(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.feature') as HTMLElement | null;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      target.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, []);

  const D = UNI_DATA;
  const filteredCourses = activeTab === 'all'
    ? D.COURSES
    : D.COURSES.filter((c: any) => c.group === activeTab);

  return (
    <React.Fragment>
      {/* ============ TOP BAR ============ */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="left">
            <span className="badge">
              <span className="icon"><Icon d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" size={14} /></span>
              زیرمجموعه‌ی <b style={{ color: 'white', fontWeight: 600, margin: '0 4px' }}>جهاد دانشگاهی</b> ایران
            </span>
            <span className="sep" />
            <span className="badge">
              <Icon d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" size={13} />
              ثبت‌نام دور پاییز ۱۴۰۵ آغاز شد
            </span>
          </div>
          <div className="right">
            <a href="mailto:info@digiuniversity.ir">
              <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" size={12} />
              <span>info@digiuniversity.ir</span>
            </a>
            <span className="sep" />
            <a href="#contact">
              <Icon d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" size={12} />
              <span>پشتیبانی ۲۴/۷</span>
            </a>
          </div>
        </div>
      </div>

      {/* ============ NAVBAR ============ */}
      <nav className={"nav" + (scrolled ? " scrolled" : "")}>
        <div className="container nav-inner">
          <BrandLockup variant="dark" size={56} />

          <div className="nav-links">
            {D.NAV_LINKS.map((l: any) => (
              <a key={l.id} href={`#${l.id}`} className={l.active ? 'active' : ''}>{l.t}</a>
            ))}
          </div>

          <div className="nav-cta">
            <button className="btn btn-ghost">ورود به سامانه</button>
            <button className="btn btn-primary">
              ثبت‌نام رایگان <IconArrow />
            </button>
            <button className="btn nav-burger" onClick={() => setDrawerOpen(true)} aria-label="منو">
              <Icon d="M3 6h18M3 12h18M3 18h18" size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* mobile drawer */}
      <div className={"drawer" + (drawerOpen ? " open" : "")}>
        <div className="drawer-head">
          <BrandLockup variant="dark" size={44} compact />
          <button className="btn nav-burger" onClick={() => setDrawerOpen(false)} aria-label="بستن">
            <Icon d="M18 6L6 18M6 6l12 12" size={20} />
          </button>
        </div>
        <div className="drawer-links">
          {D.NAV_LINKS.map((l: any) => (
            <a key={l.id} href={`#${l.id}`} onClick={() => setDrawerOpen(false)}>{l.t}</a>
          ))}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-outline">ورود به سامانه</button>
          <button className="btn btn-primary">ثبت‌نام رایگان <IconArrow /></button>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="container hero-inner">
          {/* Crown — logo lockups prominently displayed */}
          <div className="hero-crown">
            <HeroLogoCard
              src="assets/light-logo.png"
              title="جهاد دانشگاهی"
              sub="بنیان‌گذار از سال ۱۳۵۹"
            />
            <HeroLogoCard
              src="assets/airac-white.png"
              title="مرکز راهبری پژوهش و پیشرفت"
              sub="هوش مصنوعی"
            />
          </div>

          <h1 className="hero-headline">
            دانشگاه برخط هوشمند ایران
          </h1>

          <p className="hero-sub">
            با پشتوانه‌ی جهاد دانشگاهی و راهبری مرکز پژوهش و پیشرفت هوش مصنوعی، تجربه‌ی
            یادگیری در سطح استانداردهای جهانی را برای شما فراهم آورده‌ایم.
            آموزش معتبر، اساتید برجسته، و سامانه‌ی هوشمندی که در کنار شماست.
          </p>

          <div className="hero-cta">
            <button className="btn btn-primary btn-lg">
              مشاهده‌ی دوره‌ها <IconArrow />
            </button>
            <button className="btn btn-outline btn-lg" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}>
              مشاوره‌ی رایگان
            </button>
          </div>

          <div className="hero-meta">
            <span className="item"><span className="dot" />۱۲۸ هزار دانشجوی فعال</span>
            <span className="item">گواهی‌نامه‌ی رسمی</span>
            <span className="item">۳۲۰+ استاد همکار</span>
            <span className="item">۹۴٪ رضایت دانشجویان</span>
          </div>

          {tweaks.showLiveStats && (
            <div className="hero-showcase">
              <CoursePreview />
              <LiveStatsCard items={D.LIVE_STATS} />
            </div>
          )}
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <div className="trust">
        <div className="container trust-inner reveal" data-reveal>
          <span className="trust-label">با همکاری و حمایت</span>
          <div className="trust-logos">
            <span className="logo">جهاد دانشگاهی</span>
            <span className="logo">وزارت علوم</span>
            <span className="logo">دانشگاه شریف</span>
            <span className="logo">دانشگاه تهران</span>
            <span className="logo">دانشگاه امیرکبیر</span>
            <span className="logo">پارک فناوری پردیس</span>
          </div>
        </div>
      </div>

      {/* ============ ABOUT / FEATURES ============ */}
      <section id="about" className="section">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">چرا دانشگاه برخط هوشمند ایران</span>
              <h2>آموزش عالی، <span className="accent">بازطراحی‌شده</span> برای نسل امروز.</h2>
            </div>
            <p className="lede">
              ما با بهره‌گیری از پیشرفت‌های هوش مصنوعی و تجربه‌ی چهار دهه‌ای جهاد دانشگاهی،
              فضایی فراهم آورده‌ایم تا یادگیری نه یک محدودیت زمانی و مکانی، بلکه فرصتی
              برای رشد در هر زمان و هر مکان باشد. کیفیت آموزش حضوری، با انعطاف و هوشمندی برخط.
            </p>
          </div>

          <div className="reveal-stagger reveal features" data-reveal>
            {D.FEATURES.map((f: any, i: number) => (
              <div key={i} className={"feature" + (f.featured ? " featured" : "")}>
                <div className="f-icon">
                  <Icon d={f.icon} size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS BAND ============ */}
      <section className="stats-band">
        <div className="container">
          <div className="stats-grid">
            {D.STATS.map((s: any, i: number) => (
              <div className="stat" key={i}>
                <div className="n latin">
                  {s.n}<span className="suf">{s.suf}</span>
                </div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SCHOOLS ============ */}
      <section id="schools" className="section alt">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">دانشکده‌ها</span>
              <h2>شش دانشکده، <span className="accent">صدها مسیر</span> یادگیری.</h2>
            </div>
            <p className="lede">
              برنامه‌های آموزشی در شش دانشکده‌ی تخصصی با بیش از ۲۱۴ دوره‌ی پایه و پیشرفته
              ارائه می‌شود. هر دانشکده توسط هیأت علمی برجسته‌ای از دانشگاه‌های مادر کشور
              راهبری می‌گردد.
            </p>
          </div>

          <div className="reveal-stagger reveal schools" data-reveal>
            {D.SCHOOLS.map((s: any) => (
              <a key={s.id} className={"school" + (s.featured ? " featured" : "")} href="#">
                <div className="s-icon">
                  <Icon d={s.icon} size={22} />
                </div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <div className="s-meta">
                  <b>{s.courses}</b>
                  <span className="s-cta">{s.cta} <IconArrow /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COURSES ============ */}
      <section id="courses" className="section">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">دوره‌های پیشنهادی</span>
              <h2>دوره‌های <span className="accent">پرطرفدار</span> این فصل.</h2>
            </div>
            <p className="lede">
              منتخبی از پربازدیدترین دوره‌های دانشگاه که به‌صورت پیوسته توسط اساتید
              برجسته به‌روزرسانی و توسعه می‌یابد. هر دوره با پروژه‌ی واقعی همراه است.
            </p>
          </div>

          <div className="course-tabs">
            {[
              { k: 'all', l: 'همه‌ی دسته‌ها' },
              { k: 'tech', l: 'فناوری و برنامه‌نویسی' },
              { k: 'mgmt', l: 'مدیریت و کسب‌وکار' },
              { k: 'art', l: 'هنر و طراحی' },
            ].map((t) => (
              <button key={t.k} className={activeTab === t.k ? 'active' : ''}
                onClick={() => setActiveTab(t.k as any)}>{t.l}</button>
            ))}
          </div>

          <div className="reveal-stagger reveal courses" data-reveal>
            {filteredCourses.map((c: any, i: number) => (
              <div className="course" key={i}>
                <div className="c-cover">
                  <div className="c-art">
                    <CourseCover kind={c.cover} />
                  </div>
                  <span className="c-cat">{c.cat}</span>
                </div>
                <div className="c-body">
                  <h4>{c.title}</h4>
                  <p className="c-desc">{c.desc}</p>
                  <div className="c-stat">
                    <span><Icon d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" size={13} />{c.dur}</span>
                    <span><Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" size={13} />{c.students} نفر</span>
                  </div>
                  <div className="c-prof">
                    <div className="c-avatar"><TestiAvatar variant={i} /></div>
                    <div className="info">
                      <div className="n">{c.prof}</div>
                      <div className="r">{c.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section className="section alt">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">چگونه شروع کنیم</span>
              <h2>چهار گام تا <span className="accent">شروع</span> یادگیری.</h2>
            </div>
            <p className="lede">
              ثبت‌نام و آغاز تحصیل در دانشگاه برخط هوشمند ایران تنها چند دقیقه زمان
              می‌برد. تیم پشتیبانی در تمام مراحل در کنار شما خواهد بود.
            </p>
          </div>

          <div className="reveal-stagger reveal process-grid" data-reveal>
            {D.STEPS.map((s: any, i: number) => (
              <div className="process-step" key={i}>
                <div className="ico"><Icon d={s.icon} size={18} /></div>
                <div className="step-no" />
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FACULTY ============ */}
      <section id="faculty" className="section">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">اساتید همکار</span>
              <h2>تجربه‌ی <span className="accent">برترین‌ها</span> در کنار شما.</h2>
            </div>
            <p className="lede">
              بیش از سیصد استاد از دانشگاه‌های شریف، تهران، امیرکبیر و دیگر مراکز علمی
              برجسته‌ی کشور به‌همراه متخصصان فعال صنعت، در طراحی و تدریس دوره‌های ما
              همکاری می‌کنند.
            </p>
          </div>

          <div className="reveal-stagger reveal faculty" data-reveal>
            {D.FACULTY.map((p: any, i: number) => (
              <div className="prof" key={i}>
                <div className="portrait">
                  <img src={p.photo} alt={p.name} loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = `https://i.pravatar.cc/500?img=${(i * 7 + 3) % 70 + 1}`;
                    }} />
                </div>
                <div className="info">
                  <h5>{p.name}</h5>
                  <div className="r">{p.role}</div>
                  <div className="field">{p.field}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="section alt">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">تجربه‌ی دانشجویان</span>
              <h2>هزاران مسیر، <span className="accent">یک تجربه‌ی</span> مشترک.</h2>
            </div>
            <p className="lede">
              دانش‌آموختگان ما در شرکت‌های پیشروی کشور، استارتاپ‌های نوآور و مراکز
              پژوهشی برجسته فعالیت می‌کنند. روایت‌های آنان، گواه کیفیت برنامه‌های ماست.
            </p>
          </div>

          <div className="reveal-stagger reveal testimonials" data-reveal>
            {D.TESTIMONIALS.map((t: any, i: number) => (
              <div className="testi" key={i}>
                <div className="quote">”</div>
                <div className="body">{t.body}</div>
                <div className="author">
                  <img className="t-avatar" src={t.photo} alt={t.name} loading="lazy" />
                  <div className="info">
                    <div className="n">{t.name}</div>
                    <div className="r">{t.role}</div>
                  </div>
                  <div className="rating" title="امتیاز ۵ از ۵">★★★★★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARTNERS ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">شبکه‌ی همکاری</span>
              <h2>پشتوانه‌ی <span className="accent">نهادی</span> و علمی.</h2>
            </div>
            <p className="lede">
              همکاری ساختاریافته با نهادهای علمی، دانشگاه‌های مادر کشور، وزارت‌خانه‌های
              تخصصی و پارک‌های فناوری، اعتبار و کیفیت برنامه‌های دانشگاه برخط را تضمین می‌کند.
            </p>
          </div>

          <div className="partners-wrap">
            <div className="partners-band">
              <div className="partners-track">
                {[...D.PARTNERS, ...D.PARTNERS].map((p: any, i: number) => (
                  <div className="partner" key={`a-${i}`}>
                    <div className="pmark"><PartnerMark kind={i} /></div>
                    <div className="pinfo">
                      <div className="pname">{p.name}</div>
                      <div className="pcode">{p.code}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="partners-band rev">
              <div className="partners-track">
                {[...D.PARTNERS.slice().reverse(), ...D.PARTNERS.slice().reverse()].map((p: any, i: number) => (
                  <div className="partner" key={`b-${i}`}>
                    <div className="pmark"><PartnerMark kind={i + 3} /></div>
                    <div className="pinfo">
                      <div className="pname">{p.name}</div>
                      <div className="pcode">{p.code}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="cta-band">
        <div className="container cta-inner">
          <div>
            <span className="eyebrow on-dark">دور پاییز ۱۴۰۵</span>
            <h3>
              ثبت‌نام تا پایان شهریور با
              <br />
              <span style={{ background: 'linear-gradient(135deg, #6e9bff, #c9a45c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                ۳۰٪ تخفیف ویژه
              </span>
              .
            </h3>
            <p>برای دانشجویان نخبه، خانواده‌های معظم شهدا و توان‌خواهان تخفیف‌های ویژه‌ی تکمیلی نیز در نظر گرفته شده است.</p>
          </div>
          <button className="btn btn-gold btn-lg">
            ثبت‌نام و دریافت تخفیف <IconArrow />
          </button>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="section">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">پرسش‌های متداول</span>
              <h2>پاسخ به <span className="accent">پرسش‌های</span> رایج.</h2>
            </div>
            <p className="lede">
              پیش از ثبت‌نام، پاسخ بسیاری از پرسش‌های متداول دانشجویان را در زیر مرور
              کنید. اگر پرسش شما در این فهرست نبود، تیم پشتیبانی پاسخگوی شماست.
            </p>
          </div>

          <div className="faq-grid reveal" data-reveal>
            {D.FAQS.map((f: any, i: number) => (
              <details className="faq-item" key={i} open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <span className="ico">+</span>
                </summary>
                <div className="body">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" className="section alt">
        <div className="container">
          <div className="section-head reveal" data-reveal>
            <div>
              <span className="eyebrow">تماس با ما</span>
              <h2>پاسخگوی <span className="accent">پرسش‌های</span> شما هستیم.</h2>
            </div>
            <p className="lede">
              برای دریافت مشاوره‌ی رایگان، اطلاعات بیشتر در مورد دوره‌ها و یا همکاری
              با دانشگاه، می‌توانید با ما تماس بگیرید یا فرم مقابل را تکمیل نمایید.
            </p>
          </div>

          <div className="contact-grid reveal" data-reveal>
            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('پیام شما با موفقیت ثبت شد. کارشناسان ما طی ۲۴ ساعت آینده با شما تماس خواهند گرفت.'); }}>
              <div className="field row2">
                <div className="field">
                  <label>نام و نام خانوادگی</label>
                  <input type="text" required placeholder="مثلاً: علی محمدی" />
                </div>
                <div className="field">
                  <label>شماره تماس</label>
                  <input type="tel" required placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰" />
                </div>
              </div>
              <div className="field row2">
                <div className="field">
                  <label>پست الکترونیک</label>
                  <input type="email" required placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label>دانشکده‌ی موردنظر</label>
                  <select>
                    <option>هوش مصنوعی و علوم داده</option>
                    <option>مهندسی کامپیوتر</option>
                    <option>مدیریت و کسب‌وکار</option>
                    <option>مهندسی صنایع</option>
                    <option>هنر و طراحی</option>
                    <option>علوم سلامت</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>پیام شما</label>
                <textarea placeholder="در چند خط درباره‌ی موضوع پرسش یا درخواست خود توضیح دهید…"></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                  پاسخگویی در کمتر از ۲۴ ساعت کاری
                </span>
                <button className="btn btn-primary" type="submit">
                  ارسال پیام <IconArrow />
                </button>
              </div>
            </form>

            <div className="contact-info">
              <div className="row">
                <div className="ic"><Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z" /></div>
                <div>
                  <div className="lbl">آدرس</div>
                  <div className="val">تهران، خیابان انقلاب، ساختمان مرکزی جهاد دانشگاهی</div>
                  <div className="sub">پلاک ۱۲۸ · طبقه‌ی هشتم · مرکز پژوهش و پیشرفت هوش مصنوعی</div>
                </div>
              </div>
              <div className="row">
                <div className="ic"><Icon d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></div>
                <div>
                  <div className="lbl">تلفن تماس</div>
                  <div className="val latin" style={{ direction: 'ltr' }}>+98 (21) 66 955 800</div>
                  <div className="sub">شنبه تا چهارشنبه · ۸:۰۰ تا ۱۶:۳۰</div>
                </div>
              </div>
              <div className="row">
                <div className="ic"><Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" /></div>
                <div>
                  <div className="lbl">پست الکترونیک</div>
                  <div className="val latin" style={{ direction: 'ltr' }}>info@digiuniversity.ir</div>
                  <div className="sub">برای پشتیبانی فنی: support@digiuniversity.ir</div>
                </div>
              </div>
              <div className="row">
                <div className="ic"><Icon d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></div>
                <div>
                  <div className="lbl">شبکه‌های اجتماعی</div>
                  <div className="val">@digiuniversity</div>
                  <div className="sub">اینستاگرام · توییتر · لینکدین · آپارات</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="container">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="lockup">
                <div className="mk">
                  <img src="assets/light-logo.png" alt="جهاد دانشگاهی — مرکز پژوهش و پیشرفت هوش مصنوعی" />
                </div>
                <div className="nm">
                  <b>دانشگاه برخط هوشمند ایران</b>
                  <small>مرکز راهبری پژوهش و پیشرفت هوش مصنوعی</small>
                </div>
              </div>
              <p>
                بستر آموزش عالی هوشمند، با پشتوانه‌ی جهاد دانشگاهی و راهبری مرکز
                پژوهش و پیشرفت هوش مصنوعی. برای توسعه‌ی نیروی متخصص کشور در دسترس همگان.
              </p>
              <div className="socials">
                <a href="#" aria-label="instagram"><Icon d="M5 2h14a3 3 0 013 3v14a3 3 0 01-3 3H5a3 3 0 01-3-3V5a3 3 0 013-3zm7 5a5 5 0 100 10 5 5 0 000-10zM17.5 6.5h.01M9 12a3 3 0 116 0 3 3 0 01-6 0z" size={16} /></a>
                <a href="#" aria-label="linkedin"><Icon d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z" size={16} /></a>
                <a href="#" aria-label="twitter"><Icon d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" size={16} /></a>
                <a href="#" aria-label="telegram"><Icon d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" size={16} /></a>
                <a href="#" aria-label="aparat"><Icon d="M4 4h16v16H4zM10 8l6 4-6 4V8z" size={16} /></a>
              </div>
            </div>

            <div className="foot-col">
              <h6>دانشکده‌ها</h6>
              <ul>
                <li><a href="#">هوش مصنوعی و علوم داده</a></li>
                <li><a href="#">مهندسی کامپیوتر</a></li>
                <li><a href="#">مدیریت و کسب‌وکار</a></li>
                <li><a href="#">مهندسی صنایع</a></li>
                <li><a href="#">هنر و طراحی</a></li>
                <li><a href="#">علوم سلامت</a></li>
              </ul>
            </div>
            <div className="foot-col">
              <h6>دسترسی سریع</h6>
              <ul>
                <li><a href="#">ورود به سامانه</a></li>
                <li><a href="#">ثبت‌نام دوره</a></li>
                <li><a href="#">تقویم آموزشی</a></li>
                <li><a href="#">مرکز مشاوره</a></li>
                <li><a href="#">پشتیبانی فنی</a></li>
                <li><a href="#">استعلام مدرک</a></li>
              </ul>
            </div>
            <div className="foot-col">
              <h6>درباره‌ی ما</h6>
              <ul>
                <li><a href="#">معرفی دانشگاه</a></li>
                <li><a href="#">جهاد دانشگاهی</a></li>
                <li><a href="#">مرکز AIRAC</a></li>
                <li><a href="#">منشور اخلاق</a></li>
                <li><a href="#">حریم خصوصی</a></li>
                <li><a href="#">تماس با ما</a></li>
              </ul>
            </div>
          </div>

          <div className="foot-bottom">
            <span>© ۱۴۰۵ دانشگاه برخط هوشمند ایران · تمامی حقوق محفوظ است.</span>
            <div className="signature">
              <span>نماد اعتماد الکترونیکی</span>
              <span>·</span>
              <span>شناسه ملی: ۱۴۰۰۲۴۸۱۴۷</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ============ TWEAKS PANEL ============ */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="رنگ شاخص">
          <TweakColor
            label="رنگ"
            value={tweaks.accent}
            options={['#2e6bff', '#0e7490', '#7c3aed', '#c9a45c']}
            onChange={(v: string) => setTweak('accent', v)}
          />
        </TweakSection>
        <TweakSection label="نمایش">
          <TweakToggle
            label="پنل آمار لحظه‌ای هیرو"
            value={tweaks.showLiveStats}
            onChange={(v: boolean) => setTweak('showLiveStats', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
