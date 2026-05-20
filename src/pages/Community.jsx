// =====================================================
// Community — Discussion forum + AI Q&A clustering
// =====================================================
import React from "react";
import { Icon } from "../icons.jsx";
import { Footer, toFa } from "../shared.jsx";

export const CommunityPage = ({ go }) => {
  const [filter, setFilter] = React.useState("trending");

  return (
    <main data-screen-label="11 جامعه">
      <section style={{ padding: "60px 0 32px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="flex justify-between items-end gap-6 flex-wrap" >
            <div>
              <span className="eyebrow">LEARNING COMMUNITY · PEER-TO-PEER</span>
              <h1 className="h-1 mt-4" >سوال کسی، می‌تواند پاسخ همه باشد</h1>
              <p className="lead mt-3.5" >
                ۸۴۲ بحث فعال در ۲۳ درس. AI سوالات مشابه را خوشه‌بندی می‌کند و پاسخ‌های پراکنده را به دانش جمعی تبدیل می‌کند.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => window.toast?.({ title: "بحث جدید", msg: "ویرایشگر بحث آماده شد. عنوان و متن سوال را وارد کنید.", kind: "info" })}
            >
              <Icon name="plus" size={14} />
              شروع بحث جدید
            </button>
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px 40px" }}>
        <div className="grid gap-8"  style={{ gridTemplateColumns: "240px 1fr 280px"}}>
          {/* Left filters */}
          <aside className="sticky"  style={{ top: 90, alignSelf: "start"}}>
            <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>دسته‌ها</div>
            <ul className="p-0 m-0 flex flex-col gap-0.5"  style={{listStyle: "none"}}>
              {[
                ["trending", "داغ هفته", 24],
                ["unanswered", "بدون پاسخ", 18],
                ["mycourses", "دروس من", 42],
                ["instructor", "از طرف استاد", 5],
                ["solved", "حل‌شده", 312],
              ].map(([id, lbl, n]) => (
                <li key={id}>
                  <button className="rounded-lg flex justify-between items-center cursor-pointer" onClick={() => setFilter(id)}  style={{width: "100%",
                    padding: "10px 12px",
                    background: filter === id ? "color-mix(in oklch, var(--cyan) 10%, var(--surface))" : "transparent",
                    border: "1px solid " + (filter === id ? "color-mix(in oklch, var(--cyan) 30%, transparent)" : "transparent"),
                    color: filter === id ? "var(--fg)" : "var(--fg-mute)",
                    fontSize: 14,
                    fontFamily: "inherit"}}>
                    <span>{lbl}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{toFa(n)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mono mt-7 mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>تگ‌های فعال</div>
            <div className="flex flex-wrap gap-1.5" >
              {["یادگیری ماشین", "پایتون", "ریاضی", "NLP", "PyTorch", "آمار", "SQL", "Linux"].map((t) => (
                <span key={t} className="pill cursor-pointer"  style={{ fontSize: 10}}>{t}</span>
              ))}
            </div>
          </aside>

          {/* Threads */}
          <div className="flex flex-col gap-3.5" >
            {/* AI synthesis at top */}
            <div className="ai-summary mt-0" >
              <div className="flex items-center gap-2.5 mb-3"  style={{ color: "var(--violet)"}}>
                <Icon name="sparkle" size={16} />
                <span className="mono" style={{ letterSpacing: "0.1em" }}>AI CLUSTER · ۳ موضوع داغ این هفته</span>
              </div>
              <ul className="p-0 m-0 flex flex-col gap-2"  style={{listStyle: "none"}}>
                {[
                  ["تفاوت Adam و SGD با مومنتوم", "۲۳ بحث · ۱۸ پاسخ تأیید‌شده"],
                  ["پیاده‌سازی Attention از صفر", "۱۴ بحث · ۱۲ پاسخ"],
                  ["خطای CUDA out of memory در آموزش", "۹ بحث · ۷ راه‌حل"],
                ].map(([t, m], i) => (
                  <li className="flex justify-between" key={i}  style={{ padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none", fontSize: 13}}>
                    <span>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--fg-mute)", fontSize: 11 }}>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {THREADS.map((t, i) => (
              <div key={i} className="thread">
                <div className="thread-votes">
                  <Icon name="arrow" size={14} style={{ transform: "rotate(-90deg)" }} />
                  <span className="up">{toFa(t.up)}</span>
                  <Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5" >
                    {t.solved && <span className="pill pill-cyan" style={{ fontSize: 10 }}>حل شده</span>}
                    {t.instructor && <span className="pill pill-amber" style={{ fontSize: 10 }}>پاسخ استاد</span>}
                    <span className="pill" style={{ fontSize: 10 }}>{t.course}</span>
                    <span className="pill" style={{ fontSize: 10 }}>{t.tag}</span>
                  </div>
                  <h4 className="mb-2"  style={{fontSize: 17}}>{t.title}</h4>
                  <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.7 }}>{t.excerpt}</p>
                  <div className="flex items-center gap-3.5 mt-4"  style={{ fontSize: 12, color: "var(--fg-mute)"}}>
                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{t.av}</div>
                    <span>{t.who}</span>
                    <span>·</span>
                    <span className="mono">{t.time}</span>
                  </div>
                </div>
                <div className="text-left"  style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)"}}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)" }}>{toFa(t.replies)}</div>
                  <div>پاسخ</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right — leaderboard, online */}
          <aside className="sticky flex flex-col gap-4"  style={{ top: 90, alignSelf: "start"}}>
            <div className="card p-5" >
              <div className="mono mb-3.5"  style={{color: "var(--amber)", fontSize: 11, letterSpacing: "0.08em"}}>
                <Icon name="trophy" size={12} /> برترین کمک‌رسانان
              </div>
              {[
                ["دکتر عظیمی", "استاد · ML", "۴۲۸", "amber"],
                ["مهرداد افشار", "ارشد · CS", "۲۹۱", "cyan"],
                ["ساره مومنی", "ارشد · NLP", "۱۸۴", "violet"],
                ["علی نوری", "کارشناسی · CE", "۹۲", "rose"],
              ].map(([n, r, p, c], i) => (
                <div className="flex items-center gap-2.5" key={i}  style={{ padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none"}}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)", width: 16 }}>{toFa(i + 1)}</div>
                  <div className={"avatar " + c} style={{ width: 32, height: 32, fontSize: 11 }}>{n[0]}{n.split(" ")[1]?.[0] || ""}</div>
                  <div className="flex-1"  style={{ minWidth: 0}}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)" }}>{r}</div>
                  </div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>{p}</div>
                </div>
              ))}
            </div>

            <div className="card p-5" >
              <div className="mono mb-3.5"  style={{color: "var(--cyan)", fontSize: 11, letterSpacing: "0.08em"}}>
                <span className="dot dot-live ms-1.5" ></span>
                همین الان آنلاین
              </div>
              <div className="flex flex-wrap gap-1.5" >
                {["AA","NR","MK","SF","BR","MA","TT","JK","+ ۱۲"].map((a, i) => (
                  <div key={i} className={"avatar " + ["cyan","amber","violet","rose","cyan","amber",""," ",""][i]} style={{ width: 32, height: 32, fontSize: 10 }}>{a}</div>
                ))}
              </div>
              <div className="mt-3"  style={{fontSize: 12, color: "var(--fg-mute)"}}>
                ۲۱ نفر در حال مطالعه · ۸ نفر در گروه مطالعه
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Footer go={go} />
    </main>
  );
};

const THREADS = [
  { title: "چرا گرادیان نزولی با مومنتوم در نقاط زینی بهتر عمل می‌کند؟", excerpt: "دارم روی این موضوع کار می‌کنم و متوجه شدم در نقاط زینی، SGD ساده گاهی متوقف می‌شود ولی مومنتوم از آن عبور می‌کند...", course: "CS-410", tag: "بهینه‌سازی", who: "نسرین رضوی", av: "نر", time: "۲ ساعت پیش", up: 42, replies: 8, solved: true, instructor: true },
  { title: "بهترین کتاب فارسی برای یادگیری ریاضیات شبکه‌های عصبی؟", excerpt: "می‌خواهم پایه ریاضی قوی‌تری بسازم. کتاب فارسی یا منبع آموزشی به زبان فارسی پیشنهاد می‌دهید؟", course: "general", tag: "منابع", who: "بهنام رضوی", av: "بر", time: "۵ ساعت پیش", up: 28, replies: 14, solved: false, instructor: false },
  { title: "خطای CUDA out of memory در آموزش مدل ResNet50", excerpt: "روی GPU 8GB دارم ResNet50 رو آموزش می‌دم با batch size ۳۲ ولی خطای OOM می‌گیرم. راه‌حل؟", course: "CS-580", tag: "PyTorch", who: "مهرداد افشار", av: "ما", time: "دیروز", up: 18, replies: 12, solved: true, instructor: false },
  { title: "تفاوت دقیق attention با self-attention چیست؟", excerpt: "در ترنسفورمر، self-attention را داریم ولی همچنین cross-attention. تفاوت ریاضی دقیق آنها...", course: "CS-620", tag: "NLP", who: "ساره مومنی", av: "سم", time: "۲ روز پیش", up: 15, replies: 6, solved: false, instructor: false },
  { title: "اخلاق هوش مصنوعی: مسئولیت در تصمیمات خودکار", excerpt: "مقاله‌ای می‌نویسم درباره‌ی مسئولیت حقوقی تصمیمات الگوریتمی. منابع اصلی فارسی و انگلیسی...", course: "PHIL-220", tag: "اخلاق", who: "علی نوری", av: "عن", time: "۳ روز پیش", up: 11, replies: 9, solved: false, instructor: true },
];

export default CommunityPage;
