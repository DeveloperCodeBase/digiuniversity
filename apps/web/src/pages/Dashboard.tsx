// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// Student Dashboard — with Cognitive Profile
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Sparkline, CognitiveRadar } from "../shared";
import { Button } from "../ui";
// Phase-14.7 R2: RoleSideNav + Footer removed — Layout (router.tsx)
// now renders the sidebar for every workspace route. Footer is hidden
// on workspace routes by the centralised chrome.
import { StatCard } from "../components/widgets";
import { useRole } from "../role";
import { useAuth } from "../auth/AuthContext";

export const DashboardPage = ({ go }) => {
  const { role } = useRole();
  const auth = useAuth();
  // Phase-14.8: greeting NEVER falls back to ROLES.student.name (which
  // is the mock "نسرین رضوی"). The chain is real-auth-only:
  //   1) auth.user.fullName    (api returns it; preferred)
  //   2) auth.user.email local-part (e.g. "student1") as fallback
  //   3) "خوش آمدید" — generic Persian greeting with NO name
  //
  // Without auth (auth.user === null), we shouldn't be rendering this
  // page at all (Layout auth-gates /dashboard). But if a user somehow
  // lands here with a stale session that lacks both fullName + email,
  // the generic greeting is still readable and doesn't lie.
  const userFullName = auth.user?.fullName ?? undefined;
  const userEmail = auth.user?.email;
  const emailLocal = userEmail?.split("@")[0];
  const firstName = (userFullName?.split(" ")[0]) || emailLocal || null;
  const greeting = firstName ? `سلام ${firstName}` : "خوش آمدید";
  return (
    <main data-screen-label="04 میز کار من">
      <div className="dash-main">
          {/* Greeting */}
          <div className="dash-greet">
            <div>
              <span className="eyebrow">پنل {role?.label || "دانشجو"}{auth.user ? "" : (role?.code ? " · شناسه " + role.code : "")}</span>
              <h1 className="mt-2.5" >{greeting}، امروز روی <span style={{ color: "var(--cyan)" }}>بهینه‌سازی</span> تمرکز کن.</h1>
              <p className="muted">۳ کار باز · جلسه‌ی بعدی ۹۰ دقیقه دیگر · پروفایل شناختی به‌روز.</p>
            </div>
            <div className="flex gap-2.5" >
              <Button variant="outline" className="icon-btn" onClick={() => go("inbox")}
                aria-label="صندوق اعلان‌ها"
                title="اعلان‌ها"
              ><Icon name="bell" size={14} /></Button>
              <Button variant="primary" onClick={() => go("classroom")}>
                ورود به کلاس بعدی
                <Icon name="arrow" size={14} />
              </Button>
            </div>
          </div>

          {/* Stat row */}
          <div className="stat-row">
            <StatCard l="میانگین تسلط" v="۷۸" unit="٪" trend="+ ۴.۲" spark={[40,45,52,48,55,62,68,72,75,78]} color="var(--cyan)" />
            <StatCard l="دروس فعال" v="۴" trend="۲ امروز" spark={[3,3,3,4,4,4,4,4,4,4]} color="var(--amber)" />
            <StatCard l="ساعت یادگیری · هفته" v="۱۲.۴" unit="h" trend="+ ۱.۸h" spark={[8,10,9,12,11,13,14,11,12,12.4]} color="var(--violet)" />
            <StatCard l="ریسک افت" v="۰.۱۲" trend="کم" spark={[0.3,0.28,0.25,0.2,0.18,0.16,0.14,0.13,0.12,0.12]} color="var(--rose)" trendDown />
          </div>

          {/* Cognitive profile */}
          <div className="cog-profile">
            <div className="cog-grid">
              <div className="grid"  style={{ placeItems: "center"}}>
                <CognitiveRadar
                  values={[78, 64, 86, 52, 71, 90]}
                  labels={["مفاهیم پایه", "حل مسئله", "کدنویسی", "ریاضیات", "ارتباط", "استمرار"]}
                />
              </div>
              <div>
                <span className="eyebrow">COGNITIVE LEARNER PROFILE · live</span>
                <h2 className="h-2 mt-3.5" >نقشه‌ی شناختی شما</h2>
                <p className="mt-3.5"  style={{color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.7, maxWidth: 460}}>
                  بر اساس ۲۳۴ تعامل در ۱۲ کلاس اخیر، پروفایل شناختی شما به‌روزرسانی شد.
                  مدل مشاهده می‌کند که در <strong style={{ color: "var(--fg)" }}>کدنویسی</strong> و <strong style={{ color: "var(--fg)" }}>استمرار</strong> قوی هستید، ولی در <strong style={{ color: "var(--fg)" }}>ریاضیات کاربردی</strong> فضای رشد دارید.
                </p>
                <div className="grid gap-3 mt-6"  style={{ gridTemplateColumns: "1fr 1fr"}}>
                  <ActionCard
                    icon="target"
                    label="مفهوم پیشنهادی"
                    title="مشتق ماتریسی"
                    sub="۱۸ دقیقه · ۳ تمرین کوتاه"
                  />
                  <ActionCard
                    icon="play"
                    label="بازبینی پیشنهادی"
                    title="جلسه ۵ از دقیقه ۲۲"
                    sub="مفهوم مبهم ثبت شده"
                  />
                  <ActionCard
                    icon="users"
                    label="گروه مطالعه"
                    title="با علی و ساره"
                    sub="فردا ۲۰:۳۰"
                  />
                  <ActionCard
                    icon="bolt"
                    label="کوییز جبرانی"
                    title="بهینه‌سازی · سطح ۲"
                    sub="۸ سوال تطبیقی"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule + activity */}
          <div className="grid gap-6"  style={{gridTemplateColumns: "1.4fr 1fr"}}>
            <div>
              <div className="flex justify-between items-baseline mb-4" >
                <h3 className="h-3">برنامه‌ی این هفته</h3>
                <a
                  href="/calendar"
                  onClick={(e) => { e.preventDefault(); go("calendar"); }}
                  style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}
                >تقویم کامل ←</a>
              </div>
              <div className="flex flex-col gap-2" >
                {SCHEDULE.map((s, i) => (
                  <div key={i} className="sched-item">
                    <div className="sched-time">
                      <span className="day">{s.day}</span>
                      {s.time}
                    </div>
                    <div>
                      <div className="sched-title">{s.title}</div>
                      <div className="sched-by">{s.by} · {s.kind}</div>
                    </div>
                    <div>
                      {s.now ? (
                        <Button variant="primary" size="sm" onClick={() => go("classroom")}>
                          <span className="dot dot-live"></span>
                          ورود
                        </Button>
                      ) : (
                        <span className="pill">{s.in}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-4" >
                <h3 className="h-3">گواهی‌های اخیر</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); go("credential"); }} style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--fg-mute)" }}>همه ←</a>
              </div>
              <div className="flex flex-col gap-3" >
                <CredMini title="مبانی یادگیری ماشین" sub="۲۴ ماژول · تسلط ۹۲٪" date="۱۸ اسفند ۱۴۰۴" />
                <CredMini title="آمار بیزی کاربردی" sub="۲۰ ماژول · تسلط ۸۴٪" date="۲۵ بهمن ۱۴۰۴" />
                <CredMini title="پایگاه داده پیشرفته" sub="۱۸ ماژول · تسلط ۸۸٪" date="۱۰ دی ۱۴۰۴" />
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="card">
            <h3 className="h-3 mb-6" >فعالیت سامانه · ۲۴ ساعت اخیر</h3>
            <div className="grid rounded-xl overflow-hidden"  style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "var(--line)", border: "1px solid var(--line)"}}>
              {[
                { l: "رویدادهای یادگیری ثبت‌شده", v: "۲۳۴", icon: "pulse" },
                { l: "پاسخ AI Tutor", v: "۱۸", icon: "sparkle" },
                { l: "جستجوی معنایی", v: "۹", icon: "search" },
                { l: "خوشه‌بندی سوال در کلاس", v: "۲", icon: "users" },
              ].map((a, i) => (
                <div className="p-5" key={i}  style={{background: "var(--surface)"}}>
                  <div style={{ color: "var(--cyan)" }}><Icon name={a.icon} size={16} /></div>
                  <div className="mt-2"  style={{fontFamily: "var(--f-mono)", fontSize: 24, fontWeight: 700}}>{a.v}</div>
                  <div className="mt-1"  style={{color: "var(--fg-mute)", fontSize: 12}}>{a.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
  );
};

// (Phase 12 R2: deleted dead SideNav export. It listed links with no
// href/onClick — every click was a no-op. The canonical sidebar is
// `RoleSideNav` from `src/sidenav.jsx`, which is what every page now
// imports.)


const ActionCard = ({ icon, label, title, sub }) => (
  <div className="card-flat p-3.5" >
    <div className="flex items-center gap-2 mb-2"  style={{ color: "var(--cyan)"}}>
      <Icon name={icon} size={13} />
      <span className="uppercase"  style={{fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.08em"}}>{label}</span>
    </div>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
    <div className="mt-1"  style={{fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--f-mono)"}}>{sub}</div>
  </div>
);

const CredMini = ({ title, sub, date }) => (
  <div className="card-flat flex items-center gap-3.5 p-3.5" >
    <div className="relative"  style={{width: 44, height: 44, borderRadius: 50, background: "conic-gradient(from 0deg, var(--amber), var(--cyan), var(--violet), var(--amber))", flexShrink: 0}}>
      <div className="absolute grid"  style={{ inset: 3, borderRadius: 50, background: "var(--surface-2)", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--amber)", fontWeight: 700}}>VC</div>
    </div>
    <div className="flex-1"  style={{ minWidth: 0}}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
      <div className="mt-0.5"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>{sub}</div>
    </div>
    <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>{date}</div>
  </div>
);

const SCHEDULE = [
  { day: "امروز", time: "۱۴:۰۰", title: "یادگیری ماشین — جلسه ۸", by: "دکتر عظیمی", kind: "کلاس زنده", now: false, in: "۹۰ دقیقه" },
  { day: "امروز", time: "۱۶:۳۰", title: "تمرین تطبیقی · بهینه‌سازی", by: "AI Coach", kind: "خودخوان", now: true, in: "اکنون" },
  { day: "فردا", time: "۱۰:۰۰", title: "NLP پیشرفته — workshop", by: "دکتر موسوی", kind: "کارگاه", now: false, in: "فردا" },
  { day: "چهارشنبه", time: "۱۸:۰۰", title: "مهارت تحلیل آماری · آزمون", by: "خودکار", kind: "آزمون تطبیقی", now: false, in: "۴۸ ساعت" },
  { day: "پنج‌شنبه", time: "۲۰:۳۰", title: "گروه مطالعه — ریاضیات", by: "نسرین، علی، ساره", kind: "همتا", now: false, in: "۹۶ ساعت" },
];

export default DashboardPage;
