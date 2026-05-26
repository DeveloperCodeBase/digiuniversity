// components.tsx — UI building blocks
const { useState, useEffect, useRef } = React;

// ============ Icons ============
const Icon = ({ d, size = 18, stroke = 1.6 }: { d: string; size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IconArrow = ({ size = 14 }: { size?: number }) => (
  // RTL — arrow points right→left
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="arrow">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconChevron = ({ size = 14, dir = 'left' }: { size?: number; dir?: 'left' | 'right' | 'down' }) => {
  const path = dir === 'down' ? 'M6 9l6 6 6-6' : dir === 'right' ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
};

// ============ Brand Lockup ============
// The Jahad emblem + center name — uses the user-provided PNGs.
// `variant` controls dark/light asset used.
type BrandProps = { variant?: 'light' | 'dark'; size?: number; compact?: boolean };
const BrandLockup = ({ variant = 'dark', size = 52, compact = false }: BrandProps) => {
  const src = variant === 'light' ? 'assets/light-logo.png' : 'assets/dark-logo.png';
  return (
    <a href="#" className="brand-lockup" aria-label="دانشگاه برخط هوشمند ایران">
      <div className="brand-mark" style={{ width: size, height: size }}>
        <img src={src} alt="مرکز راهبری پژوهش و پیشرفت هوش مصنوعی — جهاد دانشگاهی" />
      </div>
      <div className="brand-text">
        <span className="uni">دانشگاه برخط هوشمند ایران</span>
        {!compact && <span className="sub">مرکز راهبری پژوهش و پیشرفت هوش مصنوعی</span>}
      </div>
    </a>
  );
};

// Big logo card used in hero crown
const HeroLogoCard = ({
  src,
  title,
  sub,
}: { src: string; title: string; sub: string }) => (
  <div className="logo-card">
    <div className="l-img"><img src={src} alt={title} /></div>
    <div className="l-text">
      <b>{title}</b>
      <small>{sub}</small>
    </div>
  </div>
);

// ============ Avatar (initials) ============
const Avatar = ({ initials, size = 40 }: { initials: string; size?: number }) => (
  <div className="avatar" style={{ width: size, height: size, display: 'grid', placeItems: 'center', borderRadius: '50%', background: 'linear-gradient(135deg, var(--navy-300), var(--navy-500))', color: 'white', fontWeight: 700, fontSize: size * 0.36 }}>
    {initials}
  </div>
);

// ============ Course preview (used in hero) ============
const CoursePreview = () => {
  const modules = [
    { st: 'done', n: '1', title: 'مقدمه‌ای بر یادگیری ماشین', dur: '۲ ساعت' },
    { st: 'done', n: '2', title: 'پیش‌پردازش داده و پایتون', dur: '۳ ساعت' },
    { st: 'active', n: '3', title: 'الگوریتم‌های نظارت‌شده', dur: '۴ ساعت' },
    { st: '', n: '4', title: 'شبکه‌های عصبی و یادگیری عمیق', dur: '۵ ساعت' },
  ];
  return (
    <div className="showcase-card featured">
      <div className="showcase-head">
        <span className="live">پخش زنده</span>
        <span className="tag">DASHBOARD</span>
      </div>
      <div className="course-preview">
        <div className="instructor">
          <div className="avatar" />
          <span>دکتر مهدی شریعتی · مبانی یادگیری ماشین</span>
        </div>
        <h3>هفته‌ی سوم — الگوریتم‌های نظارت‌شده</h3>
        <div>
          <div className="progress">
            <div className="bar" />
          </div>
          <div className="pmeta" style={{ marginTop: 8 }}>
            <span>پیشرفت: ۶۴٪</span>
            <span>هفته‌ی ۳ از ۱۶</span>
          </div>
        </div>
        <div className="module-list">
          {modules.map((m) => (
            <div className={`module ${m.st}`} key={m.n}>
              <span className="num">
                {m.st === 'done' ? '✓' : m.n}
              </span>
              <span className="title">{m.title}</span>
              <span className="dur">{m.dur}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ Live stats card (used in hero) ============
const LiveStatsCard = ({ items }: { items: any[] }) => (
  <div className="showcase-card">
    <div className="showcase-head">
      <span className="live">آمار لحظه‌ای</span>
      <span className="tag">METRICS</span>
    </div>
    <div className="live-stats">
      {items.map((s, i) => (
        <div className="live-stat" key={i}>
          <span className="lbl">
            <span className="ico"><Icon d={s.ic} size={14} /></span>
            {s.lbl}
          </span>
          <span className="val latin">{s.val}</span>
          <span className="delta">{s.delta}</span>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// SVG Illustrations — Course covers (themed visuals)
// ============================================================

// Each cover paints a distinctive geometric / iconographic scene
// over a navy gradient. No external images required.

type CoverProps = { kind: 'ai' | 'mba' | 'web' | 'ds' | 'mkt' | 'ux' };

const CourseCover = ({ kind }: CoverProps) => {
  const palettes: any = {
    ai:  { from: '#1d4ed8', to: '#0a1830', accent: '#6e9bff', glow: '#c9a45c' },
    mba: { from: '#102441', to: '#050d1c', accent: '#c9a45c', glow: '#6e9bff' },
    web: { from: '#0e7490', to: '#0a1830', accent: '#5eead4', glow: '#a78bfa' },
    ds:  { from: '#1e3a8a', to: '#050d1c', accent: '#93c5fd', glow: '#fbbf24' },
    mkt: { from: '#7c2d12', to: '#0a1830', accent: '#fb923c', glow: '#fde68a' },
    ux:  { from: '#5b21b6', to: '#0a1830', accent: '#c4b5fd', glow: '#f0abfc' },
  };
  const p = palettes[kind];

  const Scene = () => {
    switch (kind) {
      case 'ai':
        return (
          <g>
            {/* Neural network nodes */}
            {[[60, 60], [60, 110], [60, 160], [140, 50], [140, 100], [140, 150], [140, 200], [220, 80], [220, 130], [220, 180], [300, 125]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="5" fill={p.accent} opacity="0.9" />
            ))}
            {/* Connections */}
            <g stroke={p.accent} strokeWidth="0.6" opacity="0.4" fill="none">
              {[60, 110, 160].flatMap((y1) => [50, 100, 150, 200].map((y2) => (
                <line key={`a${y1}-${y2}`} x1="60" y1={y1} x2="140" y2={y2} />
              )))}
              {[50, 100, 150, 200].flatMap((y1) => [80, 130, 180].map((y2) => (
                <line key={`b${y1}-${y2}`} x1="140" y1={y1} x2="220" y2={y2} />
              )))}
              {[80, 130, 180].map((y1) => (
                <line key={`c${y1}`} x1="220" y1={y1} x2="300" y2="125" />
              ))}
            </g>
            <circle cx="300" cy="125" r="8" fill={p.glow} />
            <circle cx="300" cy="125" r="14" fill="none" stroke={p.glow} strokeWidth="0.8" opacity="0.5" />
          </g>
        );
      case 'mba':
        return (
          <g>
            {/* Bar chart + trend line */}
            <g>
              {[
                { x: 50, h: 60 },
                { x: 100, h: 95 },
                { x: 150, h: 75 },
                { x: 200, h: 130 },
                { x: 250, h: 110 },
                { x: 300, h: 160 },
              ].map((b, i) => (
                <rect key={i} x={b.x} y={210 - b.h} width="30" height={b.h} rx="3"
                  fill={p.accent} opacity={0.3 + i * 0.1} />
              ))}
            </g>
            <polyline points="65,150 115,115 165,135 215,80 265,100 315,50"
              fill="none" stroke={p.glow} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {[[65, 150], [115, 115], [165, 135], [215, 80], [265, 100], [315, 50]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill={p.glow} />
            ))}
            {/* Crown */}
            <path d="M285 30 l8 -16 l8 16 l16 -6 l-4 22 h-40 l-4 -22 z"
              fill={p.glow} opacity="0.9" />
          </g>
        );
      case 'web':
        return (
          <g>
            {/* Browser window */}
            <rect x="50" y="40" width="270" height="170" rx="8" fill="none"
              stroke={p.accent} strokeWidth="1.5" opacity="0.5" />
            <rect x="50" y="40" width="270" height="28" rx="8" fill={p.accent} opacity="0.18" />
            <circle cx="64" cy="54" r="3" fill={p.glow} />
            <circle cx="76" cy="54" r="3" fill={p.accent} />
            <circle cx="88" cy="54" r="3" fill={p.accent} opacity="0.5" />
            {/* code lines */}
            <g opacity="0.85">
              {[
                { y: 90, w: 80, c: p.glow },
                { y: 90, x: 145, w: 100, c: p.accent },
                { y: 110, x: 80, w: 150, c: p.accent },
                { y: 130, w: 60, c: p.glow },
                { y: 130, x: 125, w: 70, c: p.accent },
                { y: 130, x: 210, w: 60, c: p.glow },
                { y: 150, x: 80, w: 110, c: p.accent },
                { y: 170, w: 90, c: p.glow },
                { y: 190, x: 80, w: 130, c: p.accent },
              ].map((l, i) => (
                <rect key={i} x={l.x ?? 60} y={l.y} width={l.w} height="6" rx="3" fill={l.c} opacity="0.7" />
              ))}
            </g>
            {/* tags */}
            <text x="220" y="180" fontFamily="monospace" fontSize="14" fill={p.glow} opacity="0.5"
              letterSpacing="0.05em">{`</>`}</text>
          </g>
        );
      case 'ds':
        return (
          <g>
            {/* Dashboard chart */}
            <g opacity="0.5" stroke={p.accent} strokeWidth="0.4" fill="none">
              {[50, 90, 130, 170, 210].map(y => (
                <line key={y} x1="40" y1={y} x2="330" y2={y} />
              ))}
            </g>
            <path d="M40 180 L80 150 L120 165 L160 130 L200 145 L240 95 L280 110 L320 60"
              fill="none" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M40 180 L80 150 L120 165 L160 130 L200 145 L240 95 L280 110 L320 60 L320 210 L40 210 Z"
              fill={p.accent} opacity="0.18" />
            {/* Scattered data points */}
            {[[100, 120], [180, 105], [260, 75], [220, 85], [140, 145], [290, 70]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3.5" fill={p.glow} />
            ))}
            {/* Donut */}
            <g transform="translate(70 80)">
              <circle r="22" fill="none" stroke={p.glow} strokeWidth="6" opacity="0.3" />
              <circle r="22" fill="none" stroke={p.glow} strokeWidth="6"
                strokeDasharray="80 138" transform="rotate(-90)" />
            </g>
          </g>
        );
      case 'mkt':
        return (
          <g>
            {/* Funnel */}
            <g transform="translate(110 30)">
              <path d="M0 0 L160 0 L130 50 L130 100 L100 150 L60 150 L30 100 L30 50 Z"
                fill={p.accent} opacity="0.18" stroke={p.accent} strokeWidth="1.2" />
              <line x1="0" y1="40" x2="160" y2="40" stroke={p.accent} opacity="0.45" />
              <line x1="20" y1="80" x2="140" y2="80" stroke={p.accent} opacity="0.45" />
              <line x1="40" y1="120" x2="120" y2="120" stroke={p.accent} opacity="0.45" />
            </g>
            {/* Arrows entering top */}
            {[145, 175, 205, 235].map((x, i) => (
              <g key={i}>
                <line x1={x} y1="5" x2={x} y2="22" stroke={p.glow} strokeWidth="1.5" />
                <polygon points={`${x-3},22 ${x+3},22 ${x},28`} fill={p.glow} />
              </g>
            ))}
            {/* Target icon */}
            <g transform="translate(280 180)">
              <circle r="20" fill="none" stroke={p.glow} strokeWidth="2" />
              <circle r="13" fill="none" stroke={p.glow} strokeWidth="2" />
              <circle r="5" fill={p.glow} />
            </g>
          </g>
        );
      case 'ux':
        return (
          <g>
            {/* Phone frame */}
            <rect x="130" y="30" width="110" height="180" rx="16"
              fill={p.accent} opacity="0.16" stroke={p.accent} strokeWidth="1.5" />
            <rect x="142" y="46" width="86" height="14" rx="4" fill={p.glow} opacity="0.7" />
            <rect x="142" y="70" width="86" height="50" rx="6" fill={p.accent} opacity="0.45" />
            <circle cx="160" cy="95" r="9" fill={p.glow} />
            <rect x="178" y="86" width="42" height="5" rx="2" fill="white" opacity="0.7" />
            <rect x="178" y="98" width="30" height="4" rx="2" fill="white" opacity="0.5" />
            <rect x="142" y="130" width="40" height="40" rx="6" fill={p.glow} opacity="0.5" />
            <rect x="188" y="130" width="40" height="40" rx="6" fill={p.accent} opacity="0.6" />
            <rect x="142" y="180" width="86" height="20" rx="6" fill={p.glow} opacity="0.8" />
            {/* sketch sparkles */}
            <circle cx="70" cy="60" r="3" fill={p.glow} />
            <circle cx="280" cy="80" r="2" fill={p.glow} />
            <circle cx="50" cy="160" r="4" fill={p.accent} />
            <circle cx="290" cy="180" r="2.5" fill={p.glow} />
            {/* lines */}
            <line x1="70" y1="60" x2="120" y2="100" stroke={p.glow} strokeWidth="0.6" opacity="0.5" />
            <line x1="280" y1="80" x2="245" y2="100" stroke={p.glow} strokeWidth="0.6" opacity="0.5" />
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 360 230" preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`cv-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
        <pattern id={`dot-${kind}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="white" opacity="0.10" />
        </pattern>
      </defs>
      <rect width="360" height="230" fill={`url(#cv-${kind})`} />
      <rect width="360" height="230" fill={`url(#dot-${kind})`} />
      <Scene />
    </svg>
  );
};

// ============================================================
// Faculty portrait illustrations — stylized, gender-balanced
// ============================================================

type PortraitProps = { variant: number; gender: 'm' | 'f'; tone?: number };

const FacultyPortrait = ({ variant, gender }: PortraitProps) => {
  // 4 background palettes
  const bgs = [
    { a: '#dbe5f5', b: '#b6c8e3', shirt: '#1e3a8a' },
    { a: '#e9deb5', b: '#d4c08c', shirt: '#0a1830' },
    { a: '#cce0d8', b: '#a1c1b3', shirt: '#102441' },
    { a: '#e4d4e8', b: '#c4a8cc', shirt: '#1e3a8a' },
  ];
  const bg = bgs[variant % bgs.length];
  const skin = '#e3b89e';
  const skinShade = '#c79478';

  const Hair = () => {
    if (gender === 'f') {
      return (
        <g>
          {/* long hair behind */}
          <path d="M40 70 Q40 38 80 32 Q120 28 130 60 Q140 78 138 110 Q140 130 130 145 L98 145 L98 92 Q70 88 60 95 Q50 100 50 110 L25 145 Q22 110 30 90 Q34 78 40 70 Z"
            fill="#3a2c1f" />
          {/* fringe */}
          <path d="M48 60 Q58 50 78 50 Q108 50 118 64 Q108 58 92 62 Q78 65 64 70 Q56 72 48 70 Z"
            fill="#2a1f15" />
        </g>
      );
    }
    return (
      <g>
        <path d="M50 68 Q52 50 80 46 Q108 44 118 60 Q124 68 122 78 Q108 62 80 64 Q60 66 52 78 Q48 74 50 68 Z"
          fill="#2a1f15" />
        {variant % 2 === 0 && (
          // beard
          <path d="M62 110 Q68 124 80 128 Q92 124 98 110 L96 108 L82 112 L66 108 Z"
            fill="#2a1f15" opacity="0.85" />
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`pbg-${variant}-${gender}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg.a} />
          <stop offset="100%" stopColor={bg.b} />
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill={`url(#pbg-${variant}-${gender})`} />
      {/* shoulders / shirt */}
      <path d="M20 160 Q22 130 50 122 Q70 116 80 116 Q90 116 110 122 Q138 130 140 160 Z"
        fill={bg.shirt} />
      {/* collar */}
      <path d="M68 122 Q80 132 92 122 L92 140 Q80 130 68 140 Z" fill="white" opacity="0.95" />
      {gender === 'm' && (
        <path d="M75 124 L80 138 L85 124" fill="none" stroke={bg.shirt} strokeWidth="2.5" />
      )}
      {/* neck */}
      <rect x="72" y="106" width="16" height="14" fill={skinShade} />
      {/* face */}
      <ellipse cx="80" cy="86" rx="28" ry="32" fill={skin} />
      {/* hair */}
      <Hair />
      {/* eyes */}
      <ellipse cx="69" cy="86" rx="2.5" ry="3.5" fill="#1a1a1a" />
      <ellipse cx="91" cy="86" rx="2.5" ry="3.5" fill="#1a1a1a" />
      {/* brows */}
      <path d="M64 78 Q69 75 74 78" fill="none" stroke="#2a1f15" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M86 78 Q91 75 96 78" fill="none" stroke="#2a1f15" strokeWidth="1.8" strokeLinecap="round" />
      {/* nose */}
      <path d="M80 88 Q78 96 80 100 Q82 98 80 96" fill="none" stroke={skinShade} strokeWidth="1.2" strokeLinecap="round" />
      {/* mouth */}
      <path d="M73 104 Q80 108 87 104" fill="none" stroke="#9a4634" strokeWidth="1.8" strokeLinecap="round" />
      {/* glasses for some */}
      {variant % 2 === 1 && (
        <g fill="none" stroke="#1a1a1a" strokeWidth="1.4">
          <circle cx="69" cy="86" r="7" />
          <circle cx="91" cy="86" r="7" />
          <line x1="76" y1="86" x2="84" y2="86" />
        </g>
      )}
    </svg>
  );
};

// Testimonial avatars — simpler version (round badge)
const TestiAvatar = ({ variant }: { variant: number }) => {
  const colors = [
    { a: '#1d4ed8', b: '#6e9bff' },
    { a: '#c9a45c', b: '#fbbf24' },
    { a: '#0e7490', b: '#5eead4' },
  ];
  const c = colors[variant % colors.length];
  return (
    <svg viewBox="0 0 40 40" style={{ width: 40, height: 40, borderRadius: '50%', display: 'block' }}>
      <defs>
        <linearGradient id={`ta-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.a} />
          <stop offset="100%" stopColor={c.b} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill={`url(#ta-${variant})`} />
      <circle cx="20" cy="16" r="6" fill="white" opacity="0.95" />
      <ellipse cx="20" cy="32" rx="12" ry="9" fill="white" opacity="0.95" />
    </svg>
  );
};

// Partner emblems — distinct geometric marks (no fake company logos)
const PartnerMark = ({ kind }: { kind: number }) => {
  const k = kind % 6;
  const c = '#102441';
  const ac = 'var(--accent)';
  switch (k) {
    case 0: return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke={c} strokeWidth="2">
        <circle cx="20" cy="20" r="15" />
        <path d="M20 5 L20 35 M5 20 L35 20" stroke={ac} strokeWidth="1.5" />
      </svg>
    );
    case 1: return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
        <path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" stroke={c} strokeWidth="2" />
        <circle cx="20" cy="20" r="6" fill={ac} />
      </svg>
    );
    case 2: return (
      <svg viewBox="0 0 40 40" width="36" height="36">
        <rect x="6" y="6" width="12" height="12" fill={c} />
        <rect x="22" y="6" width="12" height="12" fill={ac} opacity="0.5" />
        <rect x="6" y="22" width="12" height="12" fill={ac} opacity="0.5" />
        <rect x="22" y="22" width="12" height="12" fill={c} />
      </svg>
    );
    case 3: return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke={c} strokeWidth="2">
        <path d="M6 30 L20 8 L34 30 Z" />
        <line x1="14" y1="22" x2="26" y2="22" stroke={ac} />
      </svg>
    );
    case 4: return (
      <svg viewBox="0 0 40 40" width="36" height="36">
        <path d="M20 4 L24 16 L36 16 L26 24 L30 36 L20 28 L10 36 L14 24 L4 16 L16 16 Z"
          fill={c} />
        <circle cx="20" cy="20" r="3" fill={ac} />
      </svg>
    );
    case 5: default: return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke={c} strokeWidth="2">
        <circle cx="14" cy="20" r="8" />
        <circle cx="26" cy="20" r="8" />
        <circle cx="20" cy="20" r="3" fill={ac} stroke="none" />
      </svg>
    );
  }
};

// Hero scene illustration (decorative, complements showcase cards)
const HeroSceneSVG = () => (
  <svg viewBox="0 0 480 320" style={{ width: '100%', height: 'auto' }} fill="none">
    <defs>
      <linearGradient id="hs-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#c9a45c" stopOpacity="0.18" />
      </linearGradient>
    </defs>
    <rect width="480" height="320" rx="20" fill="url(#hs-bg)" />
    {/* Orbits */}
    <g stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none">
      <ellipse cx="240" cy="160" rx="180" ry="60" />
      <ellipse cx="240" cy="160" rx="140" ry="100" transform="rotate(35 240 160)" />
      <ellipse cx="240" cy="160" rx="140" ry="100" transform="rotate(-35 240 160)" />
    </g>
    <circle cx="240" cy="160" r="36" fill="#6e9bff" />
    <circle cx="240" cy="160" r="36" fill="white" opacity="0.15" />
    <text x="240" y="170" textAnchor="middle" fontSize="34" fontFamily="serif" fontWeight="700" fill="#c9a45c">د</text>
    {/* satellites */}
    <circle cx="60" cy="160" r="10" fill="#c9a45c" />
    <circle cx="420" cy="160" r="8" fill="#6e9bff" />
    <circle cx="180" cy="60" r="6" fill="#6e9bff" />
    <circle cx="300" cy="260" r="6" fill="#c9a45c" />
  </svg>
);

// Expose to window for app.tsx
// ============================================================
// Iranian Faculty Portraits — High-fidelity stylized SVG
// Women wearing hijab (headscarf), men with groomed beards
// ============================================================

type IranianPortraitProps = { variant: number; gender: 'm' | 'f' };

const IranianFacultyPortrait = ({ variant, gender }: IranianPortraitProps) => {
  // Background palettes — soft, professorial
  const bgs = [
    { a: '#dde6f3', b: '#b6c8e3' }, // blue-grey
    { a: '#e8e4d4', b: '#c9bf99' }, // warm beige
    { a: '#d4e0d8', b: '#a8c1b3' }, // sage
    { a: '#e0d8e3', b: '#b8a6c2' }, // muted lavender
  ];
  // Skin tones — Mediterranean / Iranian range
  const skinTones = [
    { base: '#e0b896', mid: '#c89878', shadow: '#a47a5e' },
    { base: '#d6a684', mid: '#b88766', shadow: '#946a4e' },
    { base: '#e8c2a0', mid: '#cea181', shadow: '#aa8164' },
    { base: '#ceb094', mid: '#b08c70', shadow: '#8e6e54' },
  ];
  // Hijab colors — modest professional
  const hijabs = [
    { main: '#1e3a5f', fold: '#0f2240', edge: '#162e4e' },  // navy
    { main: '#3d3025', fold: '#2a201a', edge: '#332821' },  // dark brown
    { main: '#4a4234', fold: '#332e25', edge: '#3d362b' },  // olive
    { main: '#2d3e3f', fold: '#1a2b2c', edge: '#243433' },  // teal
    { main: '#5d4a52', fold: '#3f323a', edge: '#4d3d44' },  // mauve
    { main: '#1a1a1a', fold: '#0a0a0a', edge: '#141414' },  // black
  ];
  // Suit colors for men
  const suits = [
    { main: '#1a2540', collar: '#0d1428' },
    { main: '#2a2520', collar: '#181410' },
    { main: '#1f1f1f', collar: '#0a0a0a' },
    { main: '#243440', collar: '#141e26' },
  ];

  const bg = bgs[variant % bgs.length];
  const skin = skinTones[variant % skinTones.length];
  const hijab = hijabs[variant % hijabs.length];
  const suit = suits[variant % suits.length];
  const uid = `${gender}-${variant}`;

  // Slight face-shape variation
  const faceRx = gender === 'f' ? 22 : 24;
  const faceRy = gender === 'f' ? 28 : 30;
  const cx = 80, cy = 82;

  const Woman = () => (
    <g>
      {/* Back shawl drape — falls below shoulders */}
      <path
        d={`M${cx-58} 160 Q${cx-50} 100 ${cx-44} 78 Q${cx-40} 56 ${cx-24} 48 Q${cx} 38 ${cx+24} 48 Q${cx+40} 56 ${cx+44} 78 Q${cx+50} 100 ${cx+58} 160 Z`}
        fill={hijab.main}
      />
      {/* Inner shadow on hijab — adds depth */}
      <path
        d={`M${cx-58} 160 Q${cx-52} 120 ${cx-46} 90 L${cx-40} 92 Q${cx-44} 130 ${cx-50} 160 Z`}
        fill={hijab.fold} opacity="0.6"
      />
      <path
        d={`M${cx+58} 160 Q${cx+52} 120 ${cx+46} 90 L${cx+40} 92 Q${cx+44} 130 ${cx+50} 160 Z`}
        fill={hijab.fold} opacity="0.6"
      />
      {/* Neck */}
      <rect x={cx-7} y={cy+24} width="14" height="14" fill={skin.shadow} />
      {/* Face — oval */}
      <ellipse cx={cx} cy={cy} rx={faceRx} ry={faceRy} fill={skin.base} />
      {/* Face contour shading on cheeks */}
      <ellipse cx={cx-16} cy={cy+8} rx="6" ry="9" fill={skin.mid} opacity="0.5" />
      <ellipse cx={cx+16} cy={cy+8} rx="6" ry="9" fill={skin.mid} opacity="0.5" />
      {/* Hijab front edge — covering hair and forehead */}
      <path
        d={`M${cx-44} 78 Q${cx-42} 50 ${cx-22} 46 Q${cx} 40 ${cx+22} 46 Q${cx+42} 50 ${cx+44} 78
            Q${cx+38} 70 ${cx+30} 64 Q${cx+20} 56 ${cx} 54 Q${cx-20} 56 ${cx-30} 64 Q${cx-38} 70 ${cx-44} 78 Z`}
        fill={hijab.main}
      />
      {/* Hijab edge highlight */}
      <path
        d={`M${cx-30} 62 Q${cx-18} 54 ${cx} 53 Q${cx+18} 54 ${cx+30} 62`}
        fill="none" stroke={hijab.edge} strokeWidth="0.7" opacity="0.8"
      />
      {/* Forehead piece of hijab covering hairline */}
      <path
        d={`M${cx-26} 60 Q${cx-14} 56 ${cx} 56 Q${cx+14} 56 ${cx+26} 60 Q${cx+22} 66 ${cx} 66 Q${cx-22} 66 ${cx-26} 60 Z`}
        fill={hijab.fold} opacity="0.4"
      />
      {/* Brows — refined */}
      <path d={`M${cx-13} 78 Q${cx-7} 75 ${cx-1} 78`} fill="none" stroke="#2a1a12" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M${cx+1} 78 Q${cx+7} 75 ${cx+13} 78`} fill="none" stroke="#2a1a12" strokeWidth="1.8" strokeLinecap="round" />
      {/* Eyes — almond shape */}
      <g>
        <ellipse cx={cx-8} cy="84" rx="3.5" ry="2.6" fill="white" />
        <circle cx={cx-8} cy="84" r="2" fill="#3a2a1a" />
        <circle cx={cx-8} cy="84" r="1" fill="#1a0e08" />
        <circle cx={cx-8.6} cy="83.4" r="0.5" fill="white" />
        <ellipse cx={cx+8} cy="84" rx="3.5" ry="2.6" fill="white" />
        <circle cx={cx+8} cy="84" r="2" fill="#3a2a1a" />
        <circle cx={cx+8} cy="84" r="1" fill="#1a0e08" />
        <circle cx={cx+7.4} cy="83.4" r="0.5" fill="white" />
      </g>
      {/* Eyelashes top */}
      <path d={`M${cx-12} 82 Q${cx-8} 80 ${cx-4} 82`} fill="none" stroke="#1a0e08" strokeWidth="1.2" strokeLinecap="round" />
      <path d={`M${cx+4} 82 Q${cx+8} 80 ${cx+12} 82`} fill="none" stroke="#1a0e08" strokeWidth="1.2" strokeLinecap="round" />
      {/* Nose */}
      <path d={`M${cx-2.5} 89 Q${cx-2.5} 96 ${cx} 100 Q${cx+2.5} 96 ${cx+2.5} 89`} fill="none" stroke={skin.shadow} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx={cx-2} cy="100" rx="1.5" ry="1" fill={skin.shadow} opacity="0.4" />
      <ellipse cx={cx+2} cy="100" rx="1.5" ry="1" fill={skin.shadow} opacity="0.4" />
      {/* Lips — subtle natural */}
      <path d={`M${cx-7} 108 Q${cx} 105 ${cx+7} 108 Q${cx} 113 ${cx-7} 108 Z`} fill="#a85a4a" opacity="0.85" />
      <path d={`M${cx-7} 108 Q${cx} 109 ${cx+7} 108`} stroke="#8a4636" strokeWidth="0.6" fill="none" />
    </g>
  );

  const Man = () => {
    const hasBeard = variant % 3 !== 2;
    const hasGlasses = variant % 2 === 1;
    return (
      <g>
        {/* Suit shoulders */}
        <path d={`M20 160 Q22 138 50 130 Q70 124 80 124 Q90 124 110 130 Q138 138 140 160 Z`}
          fill={suit.main} />
        {/* Suit collar */}
        <path d="M65 130 Q80 142 95 130 L98 160 L80 160 L62 160 Z" fill={suit.collar} />
        {/* White shirt */}
        <path d="M72 132 Q80 138 88 132 L88 160 L72 160 Z" fill="white" />
        {/* Tie */}
        <path d="M76 134 L80 144 L84 134 L82 160 L78 160 Z" fill="#7a1c1c" />
        {/* Neck */}
        <rect x={cx-8} y={cy+24} width="16" height="14" fill={skin.shadow} />
        {/* Back hair shape */}
        <path d={`M${cx-26} 76 Q${cx-26} 52 ${cx-12} 46 Q${cx} 42 ${cx+12} 46 Q${cx+26} 52 ${cx+26} 76 Q${cx+26} 64 ${cx+12} 60 Q${cx} 58 ${cx-12} 60 Q${cx-26} 64 ${cx-26} 76 Z`}
          fill="#1a0e08" />
        {/* Face */}
        <ellipse cx={cx} cy={cy} rx={faceRx} ry={faceRy} fill={skin.base} />
        {/* Face contour */}
        <ellipse cx={cx-17} cy={cy+10} rx="5" ry="9" fill={skin.mid} opacity="0.4" />
        <ellipse cx={cx+17} cy={cy+10} rx="5" ry="9" fill={skin.mid} opacity="0.4" />
        {/* Hair — top, slightly shaped */}
        <path d={`M${cx-22} 64 Q${cx-22} 52 ${cx-12} 48 Q${cx} 44 ${cx+12} 48 Q${cx+22} 52 ${cx+22} 64 Q${cx+18} 58 ${cx+8} 56 Q${cx-8} 56 ${cx-18} 58 Q${cx-22} 60 ${cx-22} 64 Z`}
          fill="#1a0e08" />
        {/* Hair side */}
        <path d={`M${cx-22} 64 Q${cx-22} 76 ${cx-18} 86 L${cx-15} 80 Q${cx-18} 72 ${cx-22} 64 Z`} fill="#1a0e08" />
        <path d={`M${cx+22} 64 Q${cx+22} 76 ${cx+18} 86 L${cx+15} 80 Q${cx+18} 72 ${cx+22} 64 Z`} fill="#1a0e08" />
        {/* Brows — thicker */}
        <path d={`M${cx-15} 78 Q${cx-7} 74 ${cx+1} 78`} fill="none" stroke="#1a0e08" strokeWidth="2.2" strokeLinecap="round" />
        <path d={`M${cx-1} 78 Q${cx+7} 74 ${cx+15} 78`} fill="none" stroke="#1a0e08" strokeWidth="2.2" strokeLinecap="round" />
        {/* Eyes */}
        <g>
          <ellipse cx={cx-8} cy="84" rx="3.5" ry="2.4" fill="white" />
          <circle cx={cx-8} cy="84" r="2" fill="#3a2a1a" />
          <circle cx={cx-8} cy="84" r="1" fill="#1a0e08" />
          <circle cx={cx-8.6} cy="83.4" r="0.5" fill="white" />
          <ellipse cx={cx+8} cy="84" rx="3.5" ry="2.4" fill="white" />
          <circle cx={cx+8} cy="84" r="2" fill="#3a2a1a" />
          <circle cx={cx+8} cy="84" r="1" fill="#1a0e08" />
          <circle cx={cx+7.4} cy="83.4" r="0.5" fill="white" />
        </g>
        {/* Nose */}
        <path d={`M${cx-3} 89 Q${cx-3} 97 ${cx} 102 Q${cx+3} 97 ${cx+3} 89`} fill="none" stroke={skin.shadow} strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx={cx-2.5} cy="101" rx="1.7" ry="1.1" fill={skin.shadow} opacity="0.45" />
        <ellipse cx={cx+2.5} cy="101" rx="1.7" ry="1.1" fill={skin.shadow} opacity="0.45" />
        {/* Mouth */}
        {hasBeard ? (
          /* Beard hides mouth slightly */
          <g>
            <path d={`M${cx-18} 100 Q${cx-20} 116 ${cx} 124 Q${cx+20} 116 ${cx+18} 100 Q${cx+15} 108 ${cx} 110 Q${cx-15} 108 ${cx-18} 100 Z`}
              fill="#1a0e08" />
            <path d={`M${cx-6} 110 Q${cx} 113 ${cx+6} 110`} fill="none" stroke="#5a2418" strokeWidth="1.4" strokeLinecap="round" />
            {/* mustache */}
            <path d={`M${cx-10} 105 Q${cx-5} 102 ${cx} 105 Q${cx+5} 102 ${cx+10} 105 Q${cx+6} 108 ${cx} 107 Q${cx-6} 108 ${cx-10} 105 Z`}
              fill="#1a0e08" />
          </g>
        ) : (
          <path d={`M${cx-7} 110 Q${cx} 114 ${cx+7} 110`} fill="none" stroke="#5a2418" strokeWidth="1.8" strokeLinecap="round" />
        )}
        {/* Glasses */}
        {hasGlasses && (
          <g fill="none" stroke="#0a0a0a" strokeWidth="1.4">
            <rect x={cx-15} y="79" width="13" height="10" rx="2" />
            <rect x={cx+2} y="79" width="13" height="10" rx="2" />
            <line x1={cx-2} y1="83" x2={cx+2} y2="83" />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`ifp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg.a} />
          <stop offset="100%" stopColor={bg.b} />
        </linearGradient>
        <radialGradient id={`ifv-${uid}`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="160" fill={`url(#ifp-${uid})`} />
      <rect width="160" height="160" fill={`url(#ifv-${uid})`} />
      {gender === 'f' ? <Woman /> : <Man />}
      {/* Soft bottom vignette for cinematic feel */}
      <rect x="0" y="120" width="160" height="40"
        fill={`url(#ifp-${uid})`} opacity="0" />
    </svg>
  );
};

Object.assign(window as any, { IranianFacultyPortrait });
