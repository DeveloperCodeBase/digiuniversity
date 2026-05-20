// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename. Remove when this file's props/state are typed.
// =====================================================
// More productivity pages: Notifications, Messages, Bookmarks,
// Achievements, Submission, Profile/Portfolio
// =====================================================

// =====================================================
// Notifications Inbox
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer, toFa } from "../shared";
import {
  NOTIFICATIONS,
  CONVERSATIONS as CONVERSATIONS_DATA,
  CHAT_HISTORY,
  LIBRARY_RESOURCES,
  BADGES as BADGES_DATA,
  CURRENT_USER,
} from "../data.js";

export const NotificationsPage = ({ go }) => {
  const [filter, setFilter] = React.useState("all");
  return (
    <main data-screen-label="30 اعلان‌ها">
      <section className="shell" style={{ padding: "60px 40px 40px" }}>
        <div className="flex justify-between items-end gap-4 flex-wrap mb-8" >
          <div>
            <span className="eyebrow">NOTIFICATIONS · اعلان‌ها</span>
            <h1 className="h-1 mt-3" >صندوق اعلان‌ها</h1>
            <p className="lead mt-3" >۳ اعلان جدید · ۴۲ اعلان در ۳۰ روز اخیر</p>
          </div>
          <div className="flex gap-2" >
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.toast?.({ title: "علامت‌گذاری شد", msg: "همه‌ی اعلان‌ها به‌عنوان خوانده‌شده ذخیره شدند.", kind: "success" })}
            >علامت‌گذاری همه به‌عنوان خوانده‌شده</button>
            <button className="btn btn-outline btn-sm" onClick={() => go("settings")}><Icon name="settings" size={13} />تنظیمات</button>
          </div>
        </div>

        <div className="grid gap-8"  style={{ gridTemplateColumns: "240px 1fr"}}>
          <aside>
            <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>دسته‌بندی</div>
            <ul className="p-0 m-0 flex flex-col gap-0.5"  style={{listStyle: "none"}}>
              {[
                ["all", "همه", 42, "bell"],
                ["academic", "آموزشی", 18, "book"],
                ["assignments", "تمارین و آزمون", 12, "check"],
                ["ai", "دستیار AI", 6, "sparkle"],
                ["social", "اجتماعی", 4, "users"],
                ["admin", "اداری", 2, "shield"],
              ].map(([id, lbl, n, ic]) => (
                <li key={id}>
                  <button className="flex items-center justify-between rounded-lg cursor-pointer" onClick={() => setFilter(id)}  style={{width: "100%",
                    padding: "10px 14px",
                    background: filter === id ? "var(--accent-soft)" : "transparent",
                    border: "1px solid " + (filter === id ? "color-mix(in oklch, var(--accent) 25%, transparent)" : "transparent"),
                    color: filter === id ? "var(--accent)" : "var(--fg-mute)",
                    fontFamily: "inherit", fontSize: 14}}>
                    <span className="flex items-center gap-2.5" ><Icon name={ic} size={14} />{lbl}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{toFa(n)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="card p-0 overflow-hidden" >
            {NOTIFS.map((n, i) => (
              <div className="grid gap-4 p-4.5 cursor-pointer items-center" key={i}  style={{
                gridTemplateColumns: "44px 1fr auto",
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
                background: n.unread ? "color-mix(in oklch, var(--accent) 3%, transparent)" : "transparent"}} onClick={() => go(n.go)}>
                <div className="rounded-xl grid"  style={{width: 40, height: 40,
                  background: "var(--" + n.color + "-soft, var(--surface-2))",
                  color: "var(--" + n.color + ")", placeItems: "center", flexShrink: 0}}><Icon name={n.ic} size={16} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-2.5 mb-1" >
                    <span className="mono uppercase"  style={{fontSize: 10, letterSpacing: "0.08em", color: "var(--fg-mute)"}}>{n.cat}</span>
                    {n.unread && <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }}></span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: n.unread ? 600 : 400 }}>{n.t}</div>
                  <div className="mt-1"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{n.d}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5" >
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-dim)" }}>{n.time}</span>
                  <Icon name="arrow" size={13} stroke={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
};

// Notifications from data.js — adapt to the legacy shape (t/d/go/ic/color)
const NOTIFS = NOTIFICATIONS.map((n) => {
  const colorByCategory = { live: "accent", ai: "navy", grade: "sage", office: "navy", social: "accent", cert: "accent", event: "accent", admin: "gold" };
  const catLabel = { live: "کلاس زنده", ai: "AI Tutor", grade: "نمره منتشر شد", office: "Office Hours", social: "پاسخ به سوال", cert: "گواهی صادر شد", event: "رویداد", admin: "اداری" };
  return {
    cat: catLabel[n.category] || n.category,
    ic: n.icon,
    color: colorByCategory[n.category] || "accent",
    t: n.title,
    d: n.body,
    time: n.time,
    unread: n.unread,
    go: n.route,
  };
});

// =====================================================
// Messages / Inbox
// =====================================================
export const MessagesPage = ({ go }) => {
  const [active, setActive] = React.useState(0);
  const [view, setView] = React.useState("list"); // mobile-only: "list" | "chat"
  const [draft, setDraft] = React.useState("");

  const sendDraft = () => {
    if (!draft.trim()) return;
    window.toast?.({ title: "ارسال شد", msg: "پیام شما به " + CONVERSATIONS[active].name + " ارسال شد.", kind: "success" });
    setDraft("");
  };

  return (
    <main data-screen-label="31 پیام‌ها" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="msg-shell grid"  style={{ gridTemplateColumns: "340px 1fr", height: "calc(100vh - 64px)", borderTop: "1px solid var(--line)"}}>
        {/* Conversations list */}
        <aside className={"overflow-auto " + " " + ("msg-list " + (view === "chat" ? "hide-on-mobile" : ""))}   style={{borderLeft: "1px solid var(--line)", background: "var(--surface)"}}>
          <div className="p-5 sticky"  style={{ borderBottom: "1px solid var(--line)", top: 0, background: "var(--surface)", zIndex: 2}}>
            <h2 className="mb-3"  style={{fontSize: 18, fontFamily: "var(--f-display)"}}>پیام‌ها</h2>
            <div className="relative" >
              <span className="absolute"  style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-dim)"}}><Icon name="search" size={14} /></span>
              <input className="rounded-lg" placeholder="جستجو"  style={{width: "100%", padding: "8px 36px 8px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", fontFamily: "inherit", fontSize: 13}} />
            </div>
          </div>
          {CONVERSATIONS.map((c, i) => (
            <button className="flex gap-3 p-3.5 text-right cursor-pointer" key={i} onClick={() => { setActive(i); setView("chat"); }}  style={{width: "100%", borderBottom: "1px solid var(--line)",
              background: active === i ? "var(--accent-soft)" : "transparent",
              border: "none", fontFamily: "inherit", color: "var(--fg)"}}>
              <div className="relative"  style={{ flexShrink: 0}}>
                <div className={"avatar " + c.color}>{c.av}</div>
                {c.online && <span className="absolute"  style={{ bottom: 0, left: 0, width: 10, height: 10, borderRadius: 50, background: "var(--sage)", border: "2px solid var(--surface)"}}></span>}
              </div>
              <div className="flex-1"  style={{ minWidth: 0}}>
                <div className="flex justify-between items-baseline" >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>{c.time}</span>
                </div>
                <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>{c.role}</div>
                <div className="mt-1.5 overflow-hidden truncate whitespace-nowrap"  style={{fontSize: 12, color: c.unread ? "var(--fg)" : "var(--fg-mute)", fontWeight: c.unread ? 600 : 400}}>{c.last}</div>
              </div>
              {c.unread > 0 && (
                <div className="grid"  style={{width: 20, height: 20, borderRadius: 50, background: "var(--accent)", color: "var(--accent-on)", fontSize: 10, fontWeight: 700, placeItems: "center", alignSelf: "center", flexShrink: 0}}>
                  {toFa(c.unread)}
                </div>
              )}
            </button>
          ))}
        </aside>

        {/* Active chat */}
        <section className={"flex flex-col overflow-hidden " + " " + ("msg-chat " + (view === "list" ? "hide-on-mobile" : ""))}  >
          <div className="flex items-center gap-3.5"  style={{padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "var(--surface)"}}>
            <button
              onClick={() => setView("list")}
              className="msg-back-btn"
              aria-label="بازگشت به فهرست مکالمات"
              title="بازگشت"
            >
              <Icon name="arrow" size={12} /> فهرست
            </button>
            <div className="avatar cyan" style={{ width: 40, height: 40 }}>{CONVERSATIONS[active]?.av || "AA"}</div>
            <div className="flex-1"  style={{ minWidth: 0}}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{CONVERSATIONS[active]?.name || "دکتر آرش عظیمی"}</div>
              <div className="flex items-center mt-0.5"  style={{fontSize: 11, color: "var(--sage)", gap: 5}}>
                <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--sage)" }}></span>
                {CONVERSATIONS[active]?.online ? "آنلاین" : "آفلاین"}
              </div>
            </div>
            <div className="flex gap-1.5" >
              <button
                className="nav-icon-btn"
                style={{ width: 36, height: 36 }}
                onClick={() => window.toast?.({ title: "تماس تصویری", msg: "در حال برقراری تماس...", kind: "info" })}
                aria-label="تماس تصویری"
                title="تماس تصویری"
              >
                <Icon name="video" size={15} />
              </button>
              <button
                className="nav-icon-btn"
                style={{ width: 36, height: 36 }}
                onClick={() => window.toast?.("تنظیمات مکالمه به‌زودی")}
                aria-label="تنظیمات مکالمه"
                title="تنظیمات"
              >
                <Icon name="settings" size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto flex flex-col gap-3.5"  style={{ background: "var(--bg)"}}>
            <ChatBubble side="them" t="نسرین سلام، تمرین ۴ رو بررسی کردم. کار خوبی انجام دادی روی پیاده‌سازی مومنتوم." time="۱۴:۲۰" />
            <ChatBubble side="them" t="فقط یه نکته — در فرمول update، باید نرخ یادگیری رو بعد از warm-up کاهش بدی. در گام ۲۰۰ به بعد متوجه می‌شی که نوسانات زیاد می‌شه." time="۱۴:۲۱" />
            <ChatBubble side="me" t="ممنون از بررسی استاد. یعنی learning rate scheduling؟ کسینوسی پیشنهاد می‌کنید یا خطی؟" time="۱۴:۲۸" />
            <ChatBubble side="them" t="کسینوسی برای این مسئله بهتر کار می‌کنه. می‌تونی PyTorch's CosineAnnealingLR رو با T_max برابر تعداد گام‌های باقی‌مونده تست کنی." time="۱۴:۳۰" />
            <ChatBubble side="them" t="برای پروژه پایان ترم چی فکر کردی؟" time="۱۴:۳۱" />
            <ChatBubble side="me" t="می‌خوام روی مدل‌های زبانی فارسی کار کنم. شاید pre-training یک مدل کوچک با data augmentation." time="۱۴:۳۵" />
          </div>

          <form className="p-4 flex gap-2.5 items-center"
            onSubmit={(e) => { e.preventDefault(); sendDraft(); }}
             style={{ borderTop: "1px solid var(--line)", background: "var(--surface)"}}
          >
            <button type="button" className="nav-icon-btn" style={{ width: 38, height: 38 }} onClick={() => window.toast?.("افزودن فایل به‌زودی")} aria-label="افزودن پیوست" title="پیوست">
              <Icon name="plus" size={15} />
            </button>
            <input className="flex-1 rounded-xl"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="پیام بنویس..."
              aria-label="متن پیام"
               style={{ padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 14}}
            />
            <button type="submit" className="btn btn-primary p-3"  style={{minWidth: 0}} disabled={!draft.trim()} aria-label="ارسال پیام">
              <Icon name="send" size={15} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

const ChatBubble = ({ side, t, time }) => (
  <div className="flex gap-2.5"  style={{ justifyContent: side === "me" ? "flex-start" : "flex-end"}}>
    <div style={{ maxWidth: "70%" }}>
      <div style={{
        padding: "10px 14px",
        background: side === "me" ? "var(--accent)" : "var(--surface)",
        color: side === "me" ? "var(--accent-on)" : "var(--fg)",
        borderRadius: side === "me" ? "12px 12px 12px 4px" : "12px 12px 4px 12px",
        fontSize: 14, lineHeight: 1.6,
        boxShadow: "var(--shadow-1)",
      }}>{t}</div>
      <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)", textAlign: side === "me" ? "left" : "right"}}>{time}</div>
    </div>
  </div>
);

// Conversations from data.js — adapt the shape (avatar→av).
const CONVERSATIONS = CONVERSATIONS_DATA.map((c) => ({
  id: c.id,
  name: c.name,
  role: c.role,
  av: c.avatar,
  color: c.color,
  last: c.last,
  time: c.time,
  unread: c.unread,
  online: c.online,
}));

// =====================================================
// Bookmarks / Saved
// =====================================================
export const BookmarksPage = ({ go }) => {
  const [activeCat, setActiveCat] = React.useState("all");
  return (
  <main data-screen-label="32 ذخیره‌ها">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="mb-8" >
        <span className="eyebrow">SAVED · ذخیره شده‌ها</span>
        <h1 className="h-1 mt-3" >ذخیره‌ها و علاقه‌مندی‌ها</h1>
        <p className="lead mt-3" >۸۴ مورد ذخیره شده در ۶ مجموعه</p>
      </div>

      <div className="grid gap-8"  style={{ gridTemplateColumns: "260px 1fr"}}>
        <aside>
          <div className="mono mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em"}}>مجموعه‌ها</div>
          <ul className="p-0 m-0 flex flex-col gap-1"  style={{listStyle: "none"}}>
            {[
              ["all", "همه ذخیره‌ها", 84, "var(--accent)"],
              ["readlater", "بعداً بخوان", 24, "var(--navy)"],
              ["important", "مهم", 18, "var(--gold)"],
              ["thesis", "برای پایان‌نامه", 16, "var(--sage)"],
              ["fav-papers", "مقالات محبوب", 14, "var(--accent)"],
              ["recipes", "کدهای مفید", 12, "var(--navy)"],
            ].map(([id, t, n, c]) => (
              <li key={id}>
                <button className="flex items-center justify-between rounded-lg cursor-pointer"
                  onClick={() => setActiveCat(id)}
                  aria-pressed={activeCat === id}
                   style={{width: "100%",
                    padding: "10px 14px",
                    background: activeCat === id ? "var(--accent-soft)" : "transparent",
                    border: "1px solid " + (activeCat === id ? "color-mix(in oklch, var(--accent) 25%, transparent)" : "transparent"), color: "var(--fg)", fontFamily: "inherit", fontSize: 13}}>
                  <span className="flex items-center gap-2.5" >
                    <span className="rounded-full"  style={{width: 4, height: 16, background: c}}></span>{t}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-mute)" }}>{toFa(n)}</span>
                </button>
              </li>
            ))}
            <li className="mt-2" >
              <button
                className="btn btn-outline btn-sm justify-center"
                 style={{width: "100%"}}
                onClick={async () => {
                  const ok = await window.confirmAction?.({
                    title: "مجموعه جدید",
                    body: "آیا می‌خواهید یک مجموعه‌ی جدید برای ذخیره‌ها بسازید؟",
                    confirmLabel: "بساز",
                  });
                  if (ok) window.toast?.({ title: "مجموعه ساخته شد", kind: "success" });
                }}
              >
                <Icon name="plus" size={13} />مجموعه جدید
              </button>
            </li>
          </ul>
        </aside>

        <div className="flex flex-col gap-2.5" >
          {SAVED_ITEMS.map((s, i) => (
            <div key={i} className="card-flat grid gap-4 p-4.5 cursor-pointer"  style={{ gridTemplateColumns: "50px 1fr auto"}}>
              <div className="rounded grid"  style={{width: 40, height: 50, background: "var(--" + s.color + "-soft)", color: "var(--" + s.color + ")", placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700}}>{s.t}</div>
              <div>
                <div className="mb-1"  style={{fontSize: 14, fontWeight: 500}}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{s.meta}</div>
                <div className="flex gap-1.5 mt-2" >
                  {s.tags.map((tg) => <span key={tg} className="pill" style={{ fontSize: 9 }}>{tg}</span>)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2" >
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-dim)" }}>{s.saved}</span>
                <button
                  className="btn btn-ghost btn-sm icon-btn"
                  onClick={(e) => { e.stopPropagation(); window.toast?.("از علاقه‌مندی‌ها حذف شد"); }}
                  aria-label={"حذف از علاقه‌مندی‌ها: " + s.title}
                  title="حذف از علاقه‌مندی‌ها"
                ><Icon name="star" size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer go={go} />
  </main>
  );
};

// Bookmarks: first 6 library resources, mapped to the bookmark-card shape
const SAVED_ITEMS = LIBRARY_RESOURCES.slice(0, 6).map((r, i) => {
  const colorByType = { PDF: "gold", VIDEO: "accent", CODE: "sage", DATA: "navy", SLIDE: "violet" };
  const savedRel = ["دیروز", "۲ روز", "۳ روز", "هفته پیش", "هفته پیش", "هفته پیش"];
  return {
    t: r.type,
    title: r.title,
    meta: `${r.author} · ${r.size}`,
    tags: r.tags,
    color: colorByType[r.type] || "accent",
    saved: savedRel[i] || "اخیر",
  };
});

// =====================================================
// Achievements / Badges
// =====================================================
export const AchievementsPage = ({ go }) => (
  <main data-screen-label="33 دستاوردها">
    <section className="shell" style={{ padding: "60px 40px" }}>
      <div className="mb-8" >
        <span className="eyebrow">ACHIEVEMENTS · دستاوردها</span>
        <h1 className="h-1 mt-3" >دستاوردها و نشان‌ها</h1>
        <p className="lead mt-3" >۲۴ از ۸۴ دستاورد کسب شده · سطح ۸ یادگیرنده</p>
      </div>

      {/* Level progress */}
      <div className="card p-9 mb-8"  style={{ background: "linear-gradient(135deg, var(--surface), var(--accent-soft))"}}>
        <div className="flex items-center gap-6" >
          <div className="rounded-2xl grid"  style={{width: 80, height: 80, background: "var(--accent)", color: "var(--accent-on)", placeItems: "center", fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 800}}>۸</div>
          <div className="flex-1" >
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.1em" }}>سطح ۸ · یادگیرنده‌ی متعهد</div>
            <div className="flex items-baseline gap-2 mt-1" >
              <span style={{ fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 700 }}>۲,۴۸۰</span>
              <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>/ ۳,۰۰۰ XP</span>
            </div>
            <div className="rounded-full overflow-hidden mt-2.5"  style={{height: 6, background: "var(--surface-3)"}}>
              <div className="rounded-full"  style={{width: "82%", height: "100%", background: "var(--accent)"}}></div>
            </div>
            <div className="mt-2"  style={{fontSize: 12, color: "var(--fg-mute)"}}>تا سطح ۹ · ۵۲۰ XP باقی</div>
          </div>
          <div className="text-center" >
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 36, fontWeight: 700, color: "var(--accent)" }}>۱۸</div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>روز استمرار</div>
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <h3 className="h-3 mb-4.5" >نشان‌ها</h3>
      <div className="grid grid-4">
        {BADGES.map((b, i) => (
          <div key={i} className="card p-6 text-center"  style={{ opacity: b.locked ? 0.5 : 1}}>
            <div className="rounded-full grid relative"  style={{width: 80, height: 80, margin: "0 auto",
              background: b.locked ? "var(--surface-2)" : `conic-gradient(from 0deg, ${b.color}, ${b.color2 || b.color})`, placeItems: "center",
              filter: b.locked ? "grayscale(1)" : "none"}}>
              <div className="absolute rounded-full grid"  style={{ inset: 5, background: "var(--surface)", placeItems: "center", color: b.locked ? "var(--fg-dim)" : b.color}}>
                <Icon name={b.locked ? "lock" : b.ic} size={28} />
              </div>
            </div>
            <h4 className="mt-4"  style={{fontSize: 14}}>{b.t}</h4>
            <div className="mt-1.5"  style={{fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.5}}>{b.d}</div>
            {b.locked && <div className="mt-3"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--accent)"}}>+{toFa(b.xp)} XP</div>}
            {!b.locked && <div className="mt-3"  style={{fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--sage)"}}>کسب شد · {b.date}</div>}
          </div>
        ))}
      </div>
    </section>
    <Footer go={go} />
  </main>
);

// Badges from data.js (already in the right shape).
const BADGES = BADGES_DATA;

// =====================================================
// Assignment Submission
// =====================================================
export const SubmissionPage = ({ go }) => {
  const [tab, setTab] = React.useState("upload");
  return (
    <main data-screen-label="34 تحویل تمرین">
      <section style={{ padding: "32px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="flex items-center gap-2.5 mb-3" >
            <span className="mono" style={{ color: "var(--fg-mute)" }}>CS-410</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono" style={{ color: "var(--fg-mute)" }}>تمارین</span>
            <span style={{ color: "var(--fg-dim)" }}>/</span>
            <span className="mono">۰۴</span>
          </div>
          <div className="flex justify-between items-center flex-wrap gap-4" >
            <div>
              <span className="eyebrow">ASSIGNMENT 04 · بهینه‌سازی</span>
              <h1 className="h-2 mt-3" >پیاده‌سازی SGD با مومنتوم</h1>
            </div>
            <div className="flex gap-2" >
              <span className="pill pill-amber" style={{ fontSize: 11 }}>مهلت: ۳ روز</span>
              <span className="pill" style={{ fontSize: 11 }}>۱۰۰ نمره</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: "40px" }}>
        <div className="grid gap-8"  style={{ gridTemplateColumns: "1fr 320px"}}>
          <div>
            <div className="flex gap-1 mb-6 p-1 rounded-xl"  style={{ background: "var(--surface-2)", border: "1px solid var(--line)"}}>
              {[["task", "صورت مسئله", "file"], ["upload", "تحویل", "download"], ["history", "تاریخچه", "pulse"]].map(([id, lbl, ic]) => (
                <button className="flex-1 rounded-lg cursor-pointer flex items-center justify-center gap-2" key={id} onClick={() => setTab(id)}  style={{ padding: "10px 16px",
                  background: tab === id ? "var(--surface)" : "transparent",
                  border: "1px solid " + (tab === id ? "var(--line-2)" : "transparent"), color: tab === id ? "var(--fg)" : "var(--fg-mute)",
                  fontSize: 13, fontFamily: "inherit"}}>
                  <Icon name={ic} size={13} />{lbl}
                </button>
              ))}
            </div>

            {tab === "task" && (
              <div className="card p-8" >
                <h3 className="h-3 mb-4" >توضیح تمرین</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--fg-mute)" }}>
                  در این تمرین، باید بهینه‌ساز SGD با مومنتوم را از صفر در Python پیاده‌سازی کنید و آن را روی یک شبکه‌ی عصبی کوچک برای دیتاست MNIST آموزش دهید.
                </p>
                <h4 className="mt-6 mb-3"  style={{ fontSize: 15}}>الزامات:</h4>
                <ul className="pe-5"  style={{ fontSize: 14, lineHeight: 1.8, color: "var(--fg-mute)"}}>
                  <li>پیاده‌سازی کلاس <code style={{ fontFamily: "var(--f-mono)", background: "var(--surface-2)", padding: "1px 6px", borderRadius: 3, color: "var(--accent)" }}>MomentumSGD</code></li>
                  <li>تست با β = ۰.۹ و η = ۰.۰۱</li>
                  <li>رسم منحنی loss</li>
                  <li>گزارش accuracy نهایی (هدف: &gt; ۹۲٪)</li>
                  <li>گزارش نوشتاری ۲-۳ صفحه‌ای</li>
                </ul>
                <h4 className="mt-6 mb-3"  style={{ fontSize: 15}}>Rubric:</h4>
                <div className="rounded-lg p-4"  style={{background: "var(--surface-2)"}}>
                  {[
                    ["پیاده‌سازی صحیح", "۳۰"],
                    ["کیفیت کد", "۲۰"],
                    ["نتایج تجربی", "۲۵"],
                    ["گزارش نوشتاری", "۱۵"],
                    ["نوآوری", "۱۰"],
                  ].map(([t, p]) => (
                    <div className="flex justify-between" key={t}  style={{ padding: "6px 0", fontSize: 13}}>
                      <span>{t}</span>
                      <span style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "upload" && (
              <div className="card p-8" >
                <h3 className="h-3 mb-4.5" >تحویل تمرین</h3>

                <div className="p-8 rounded-xl text-center"  style={{ background: "var(--surface-2)", border: "2px dashed var(--line-2)"}}>
                  <div className="rounded-xl grid mb-4"  style={{width: 56, height: 56, margin: "0 auto", background: "var(--accent-soft)", color: "var(--accent)", placeItems: "center"}}>
                    <Icon name="download" size={24} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>فایل‌ها را اینجا رها کنید</div>
                  <div className="mt-1.5"  style={{fontSize: 12, color: "var(--fg-mute)"}}>یا کلیک کنید · حداکثر ۵۰MB · ipynb, py, pdf</div>
                  <button className="btn btn-outline mt-5"  onClick={() => window.toast?.("انتخاب‌گر فایل به‌زودی")}><Icon name="folder" size={13} />انتخاب فایل</button>
                </div>

                <div className="mono mt-7 mb-3"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>فایل‌های آپلود شده</div>
                {[
                  { name: "momentum_sgd.ipynb", size: "245 KB", t: "CODE", c: "sage" },
                  { name: "report_final.pdf", size: "1.2 MB", t: "PDF", c: "gold" },
                  { name: "training_curves.png", size: "180 KB", t: "IMG", c: "accent" },
                ].map((f, i) => (
                  <div key={i} className="card-flat grid gap-3.5 p-3.5 items-center mb-2"  style={{ gridTemplateColumns: "40px 1fr auto auto"}}>
                    <div className="rounded grid"  style={{width: 32, height: 40, background: `var(--${f.c}-soft)`, color: `var(--${f.c})`, placeItems: "center", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 700}}>{f.t}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                      <div className="mt-0.5"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>{f.size}</div>
                    </div>
                    <span className="pill pill-cyan" style={{ fontSize: 9 }}>آپلود شد</span>
                    <button
                      className="btn btn-ghost btn-sm icon-btn"
                      onClick={() => window.toast?.({ title: "حذف فایل", msg: f.name + " حذف شد." })}
                      aria-label={"حذف فایل " + f.name}
                      title="حذف"
                    ><Icon name="end" size={13} /></button>
                  </div>
                ))}

                <div className="mt-6" >
                  <div className="mono mb-2"  style={{color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em"}}>یادداشت تحویل (اختیاری)</div>
                  <textarea className="p-3 rounded-lg resize-y" placeholder="نکاتی که می‌خواهید استاد بداند..." rows={3}  style={{width: "100%", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 13}}></textarea>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6"  style={{ borderTop: "1px solid var(--line)"}}>
                  <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>قبل از تحویل، AI نسخه‌ی شما را برای تشابه احتمالی بررسی می‌کند.</span>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      const ok = await window.confirmAction?.({
                        title: "تحویل نهایی تمرین",
                        body: "پس از تحویل، امکان تغییر فایل‌ها وجود ندارد. ادامه می‌دهید؟",
                        confirmLabel: "تحویل نهایی",
                      });
                      if (ok) window.toast?.({ title: "تحویل شد", msg: "تمرین شما برای ارزیابی ارسال شد.", kind: "success" });
                    }}
                  >تحویل نهایی<Icon name="check" size={14} stroke={3} /></button>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div className="card p-8" >
                <h3 className="h-3 mb-4.5" >تاریخچه‌ی تحویل</h3>
                <div className="flex flex-col gap-3" >
                  {[
                    { v: "v3", t: "تحویل نهایی", d: "۱۰ روز پیش · ۳ فایل", grade: "۸۷/۱۰۰", c: "sage" },
                    { v: "v2", t: "نسخه دوم · با اصلاح‌ها", d: "۱۲ روز پیش", grade: null },
                    { v: "v1", t: "نسخه اول", d: "۲ هفته پیش", grade: null },
                  ].map((h, i) => (
                    <div className="flex gap-4 p-4 rounded-xl items-center" key={i}  style={{ background: "var(--surface-2)", border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line)"}}>
                      <div className="rounded-lg grid"  style={{width: 40, height: 40, background: i === 0 ? "var(--accent)" : "var(--surface-3)", color: i === 0 ? "var(--accent-on)" : "var(--fg)", placeItems: "center", fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 11}}>{h.v}</div>
                      <div className="flex-1" >
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{h.t}</div>
                        <div className="mt-0.5"  style={{fontSize: 12, color: "var(--fg-mute)"}}>{h.d}</div>
                      </div>
                      {h.grade && <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700, color: "var(--sage)" }}>{h.grade}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 sticky"  style={{ top: 90, alignSelf: "start"}}>
            <div className="card p-5" >
              <h4 className="mb-3.5"  style={{fontSize: 14}}>وضعیت تحویل</h4>
              <div className="flex flex-col gap-3"  style={{ fontSize: 13}}>
                <div className="flex justify-between" >
                  <span style={{ color: "var(--fg-mute)" }}>مهلت</span>
                  <span style={{ fontFamily: "var(--f-mono)", color: "var(--gold)" }}>۳ روز ۱۲ ساعت</span>
                </div>
                <div className="flex justify-between" >
                  <span style={{ color: "var(--fg-mute)" }}>نمره</span>
                  <span style={{ fontFamily: "var(--f-mono)" }}>۱۰۰</span>
                </div>
                <div className="flex justify-between" >
                  <span style={{ color: "var(--fg-mute)" }}>نوع کار</span>
                  <span>فردی</span>
                </div>
                <div className="flex justify-between" >
                  <span style={{ color: "var(--fg-mute)" }}>ارزیاب</span>
                  <span>استاد + Peer × ۲</span>
                </div>
              </div>
            </div>

            <div className="card p-5" >
              <div className="flex items-center gap-2 mb-3"  style={{ color: "var(--accent)"}}>
                <Icon name="sparkle" size={14} />
                <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em" }}>AI کمک</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6 }}>
                می‌توانم درباره‌ی اصول مومنتوم توضیح بدهم، اما در حین این تمرین پاسخ کد را به شما نمی‌دهم.
              </p>
              <button
                className="btn btn-outline justify-center mt-3"
                 style={{width: "100%", fontSize: 12}}
                onClick={() => go("classroom")}
              >
                <Icon name="chat" size={13} />شروع گفتگو
              </button>
            </div>

            <div className="card p-5" >
              <h4 className="mb-3"  style={{fontSize: 14}}>منابع مفید</h4>
              <ul className="p-0 m-0 flex flex-col gap-2"  style={{listStyle: "none"}}>
                {[
                  ["جزوه‌ی بهینه‌سازی", "PDF · ۴۲ ص"],
                  ["ویدئو جلسه ۸", "۱:۲۸"],
                  ["نمونه کد قبلی ترم", "Repo"],
                ].map(([t, m]) => (
                  <li className="flex justify-between" key={t}  style={{ fontSize: 12, padding: "6px 0", borderTop: "1px solid var(--line)"}}>
                    <span style={{ color: "var(--accent)" }}>{t}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--fg-mute)" }}>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
};

// =====================================================
// Profile / Portfolio (public-facing)
// =====================================================
export const ProfilePage = ({ go }) => (
  <main data-screen-label="35 پروفایل">
    {/* Cover */}
    <div className="relative overflow-hidden"  style={{height: 200, background: "linear-gradient(135deg, oklch(0.3 0.12 255), oklch(0.5 0.16 255))"}}>
      <div className="absolute"  style={{ inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 3px, transparent 3px 14px)"}}></div>
    </div>

    <section className="shell relative"  style={{padding: "0 40px 60px", marginTop: -56}}>
      {/* Profile header */}
      <div className="flex items-end gap-6 flex-wrap mb-8" >
        <div className="avatar cyan" style={{ width: 112, height: 112, fontSize: 36, border: "4px solid var(--bg)", flexShrink: 0 }}>نر</div>
        <div className="flex-1"  style={{ minWidth: 240}}>
          <h1 className="h-1">نسرین رضوی</h1>
          <p className="mt-2"  style={{color: "var(--fg-mute)", fontSize: 15}}>کارشناسی ارشد علوم داده · علاقمند به NLP فارسی و آموزش</p>
          <div className="flex gap-2.5 mt-3.5 flex-wrap" >
            <span className="pill pill-cyan" style={{ fontSize: 11 }}>سطح ۸ · یادگیرنده متعهد</span>
            <span className="pill" style={{ fontSize: 11 }}>۱۲ گواهی</span>
            <span className="pill" style={{ fontSize: 11 }}>۲۴ دستاورد</span>
          </div>
        </div>
        <div className="flex gap-2" >
          <button
            className="btn btn-outline"
            onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText("https://digiu.edu/u/nasrin").catch(() => {});
              window.toast?.({ title: "لینک کپی شد", msg: "digiu.edu/u/nasrin", kind: "success" });
            }}
          ><Icon name="share" size={14} />اشتراک</button>
          <button className="btn btn-primary" onClick={() => go("settings")}><Icon name="settings" size={14} />ویرایش</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="card p-7 grid gap-6 mb-8"  style={{ gridTemplateColumns: "repeat(5, 1fr)"}}>
        {[
          ["XP کسب شده", "۲,۴۸۰"],
          ["گواهی‌ها", "۱۲"],
          ["تسلط متوسط", "۸۴٪"],
          ["استمرار", "۱۸ روز"],
          ["پاسخ مفید", "۴۲"],
        ].map(([l, v], i) => (
          <div key={i}>
            <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 10, letterSpacing: "0.08em" }}>{l}</div>
            <div className="mt-1"  style={{fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 700}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8"  style={{ gridTemplateColumns: "1fr 320px"}}>
        <div>
          {/* About */}
          <div className="card p-7 mb-6" >
            <h3 className="h-3 mb-3" >درباره من</h3>
            <p style={{ fontSize: 14, color: "var(--fg-mute)", lineHeight: 1.8 }}>
              دانشجوی کارشناسی ارشد علوم داده هستم. علاقه‌ی اصلی من به مدل‌های زبانی فارسی و چگونگی استفاده از AI در بهبود آموزش است. در حال کار روی پروژه‌ای برای ساخت یک tokenizer بهینه‌شده برای فارسی.
            </p>
          </div>

          {/* Featured projects */}
          <h3 className="h-3 mb-4" >پروژه‌های شاخص</h3>
          <div className="flex flex-col gap-3" >
            {[
              { t: "Persian BPE Tokenizer", d: "Tokenizer بهینه برای فارسی، بهبود ۲۳٪ کارایی روی benchmarks", tags: ["NLP", "Python", "Research"], stars: 84 },
              { t: "Sentiment Analysis on Persian Tweets", d: "مدل دسته‌بندی حسی روی ۲ میلیون توییت فارسی", tags: ["NLP", "PyTorch"], stars: 42 },
              { t: "AI Tutor for Calculus", d: "دستیار آموزشی برای حساب دیفرانسیل با RAG", tags: ["EdTech", "RAG", "LLM"], stars: 28 },
            ].map((p, i) => (
              <div key={i} className="card p-5.5" >
                <div className="flex justify-between mb-2" >
                  <h4 style={{ fontSize: 16 }}>{p.t}</h4>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--gold)" }}>★ {toFa(p.stars)}</span>
                </div>
                <p className="m-0"  style={{fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.6}}>{p.d}</p>
                <div className="flex gap-1.5 mt-3" >
                  {p.tags.map((t) => <span key={t} className="pill" style={{ fontSize: 10 }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4" >
          <div className="card p-5" >
            <h4 style={{ fontSize: 14 }}>مهارت‌ها</h4>
            <div className="flex flex-col gap-2.5 mt-3.5" >
              {[
                ["Python", 95],
                ["PyTorch", 88],
                ["NLP", 82],
                ["آمار", 78],
                ["ریاضیات", 72],
                ["Linux", 86],
              ].map(([s, l]) => (
                <div key={s}>
                  <div className="flex justify-between mb-1"  style={{ fontSize: 12}}>
                    <span>{s}</span>
                    <span style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{toFa(l)}٪</span>
                  </div>
                  <div className="rounded-full overflow-hidden"  style={{height: 4, background: "var(--surface-2)"}}>
                    <div className="rounded-full"  style={{width: l + "%", height: "100%", background: "var(--accent)"}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5" >
            <h4 style={{ fontSize: 14 }}>لینک‌ها</h4>
            <ul className="p-0 flex flex-col gap-2"  style={{listStyle: "none", margin: "14px 0 0"}}>
              {[
                ["GitHub", "github.com/nasrin"],
                ["LinkedIn", "linkedin.com/in/nasrin"],
                ["Google Scholar", "scholar.google.com/..."],
                ["Twitter / X", "@nasrin_dev"],
              ].map(([k, v]) => (
                <li className="flex justify-between" key={k}  style={{ padding: "6px 0", borderTop: "1px solid var(--line)", fontSize: 12}}>
                  <span style={{ color: "var(--fg-mute)" }}>{k}</span>
                  <a style={{ fontFamily: "var(--f-mono)", color: "var(--accent)" }}>{v}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5"  style={{ background: "linear-gradient(135deg, var(--surface), var(--accent-soft))"}}>
            <div className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.08em" }}>پروفایل عمومی</div>
            <div className="mt-2 text-left"  style={{fontFamily: "var(--f-mono)", fontSize: 12, direction: "ltr"}}>digiu.edu/u/nasrin</div>
            <button
              className="btn btn-outline justify-center mt-3.5"
               style={{width: "100%", fontSize: 12}}
              onClick={() => {
                if (navigator.clipboard) navigator.clipboard.writeText("https://digiu.edu/u/nasrin").catch(() => {});
                window.toast?.({ title: "لینک کپی شد", msg: "digiu.edu/u/nasrin", kind: "success" });
              }}
            >
              <Icon name="share" size={12} />کپی لینک
            </button>
          </div>
        </aside>
      </div>
    </section>
    <Footer go={go} />
  </main>
);

export default NotificationsPage;
