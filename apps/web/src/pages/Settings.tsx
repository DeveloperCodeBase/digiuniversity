// Phase-A R2.7 — typed.
// =====================================================
// Settings / Profile page
// =====================================================
import React from "react";
import { Icon } from "../icons";
import { Footer } from "../shared";
import { Toggle } from "../components/widgets";
import { Button } from "../ui";
import type { Go } from "../router";

interface SettingsPageProps { go: Go }

export const SettingsPage: React.FC<SettingsPageProps> = ({ go }) => {
  const [tab, setTab] = React.useState<string>("profile");

  return (
    <main data-screen-label="15 تنظیمات">
      <div className="dash">
        <aside className="side-nav">
          <h6>حساب</h6>
          <ul>
            <li><a onClick={() => setTab("profile")} className={tab==="profile"?"active":""}><Icon name="user" size={14} />پروفایل</a></li>
            <li><a onClick={() => setTab("account")} className={tab==="account"?"active":""}><Icon name="settings" size={14} />حساب کاربری</a></li>
            <li><a onClick={() => setTab("security")} className={tab==="security"?"active":""}><Icon name="shield" size={14} />امنیت</a></li>
            <li><a onClick={() => setTab("notifications")} className={tab==="notifications"?"active":""}><Icon name="bell" size={14} />اعلان‌ها</a></li>
          </ul>
          <h6>یادگیری</h6>
          <ul>
            <li><a onClick={() => setTab("ai")} className={tab==="ai"?"active":""}><Icon name="sparkle" size={14} />دستیار AI</a></li>
            <li><a onClick={() => setTab("privacy")} className={tab==="privacy"?"active":""}><Icon name="eye" size={14} />حریم خصوصی</a></li>
            <li><a onClick={() => setTab("accessibility")} className={tab==="accessibility"?"active":""}><Icon name="target" size={14} />دسترس‌پذیری</a></li>
          </ul>
          <h6>مالی</h6>
          <ul>
            <li><a onClick={() => setTab("billing")} className={tab==="billing"?"active":""}><Icon name="dollar" size={14} />صورتحساب</a></li>
            <li><a onClick={() => setTab("wallet")} className={tab==="wallet"?"active":""}><Icon name="layers" size={14} />کیف پول</a></li>
          </ul>
        </aside>

        <div className="dash-main">
          {tab === "profile" && <ProfileTab />}
          {tab === "account" && <AccountTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "ai" && <AITab />}
          {tab === "privacy" && <PrivacyTab />}
          {tab === "accessibility" && <AccessibilityTab />}
          {tab === "billing" && <BillingTab />}
          {tab === "wallet" && <WalletTab />}
        </div>
      </div>
      <Footer go={go} />
    </main>
  );
};

const SectionH = ({ eyebrow, title, sub }) => (
  <div className="mb-7" >
    <span className="eyebrow">{eyebrow}</span>
    <h1 className="h-2 mt-2.5" >{title}</h1>
    {sub && <p className="mt-2.5"  style={{color: "var(--fg-mute)", fontSize: 14, maxWidth: 640}}>{sub}</p>}
  </div>
);

const Row = ({ label, hint, children }) => (
  <div className="grid gap-8 items-start"  style={{ gridTemplateColumns: "240px 1fr", padding: "20px 0", borderBottom: "1px solid var(--line)"}}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
      {hint && <div className="mt-1.5"  style={{fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.5}}>{hint}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const ProfileTab = () => (
  <div>
    <SectionH eyebrow="PROFILE · نمایه عمومی" title="پروفایل" sub="این اطلاعات روی پروفایل عمومی شما و در کلاس‌ها قابل مشاهده است." />
    <div className="card p-8" >
      <Row label="عکس پروفایل" hint="JPG یا PNG · حداکثر ۲MB · ابعاد مربعی پیشنهاد می‌شود">
        <div className="flex items-center gap-4 flex-wrap" >
          <div className="avatar cyan" style={{ width: 76, height: 76, fontSize: 22 }}>نر</div>
          <Button variant="outline" onClick={() => window.toast?.("انتخاب‌گر فایل به‌زودی")}>آپلود تصویر جدید</Button>
          <Button variant="ghost" onClick={async () => {
            const ok = await window.confirmAction?.({ title: "حذف عکس پروفایل", body: "آیا مطمئن هستید؟", confirmLabel: "حذف", danger: true });
            if (ok) window.toast?.({ title: "حذف شد", kind: "success" });
          }}>حذف</Button>
        </div>
      </Row>
      <Row label="نام نمایشی" hint="در کلاس‌ها و پروفایل عمومی نشان داده می‌شود">
        {/* R7.7d — Row's <div> label is decorative for screen readers
            because it isn't wired as <label htmlFor>. aria-label on the
            input gives axe the same semantic that the visible label
            provides for sighted users. (Rewiring Row to a proper
            <label> would touch many call sites — out of R7.7 scope.) */}
        <input className="rounded-xl" defaultValue="نسرین رضوی" aria-label="نام نمایشی"  style={{width: "100%", maxWidth: 400, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 14}} />
      </Row>
      <Row label="بیوگرافی کوتاه" hint="حداکثر ۲۸۰ کاراکتر">
        <textarea className="rounded-xl resize-y" defaultValue="دانشجوی ارشد علوم داده، علاقمند به مدل‌های زبانی فارسی و آموزش." rows={3}  style={{width: "100%", maxWidth: 600, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 14}} />
      </Row>
      <Row label="علایق پژوهشی" hint="با تب جدا کنید">
        <div className="flex flex-wrap gap-1.5" >
          {["NLP فارسی", "یادگیری عمیق", "RAG", "ترنسفورمر", "+ افزودن"].map((t, i) => (
            <span className={"cursor-pointer " + " " + ("pill " + (i === 4 ? "" : "pill-cyan"))} key={i}  >{t}</span>
          ))}
        </div>
      </Row>
      <Row label="پیوندها" hint="GitHub، LinkedIn، Google Scholar و...">
        <div className="flex flex-col gap-2" >
          <input className="rounded-xl text-left" placeholder="GitHub" defaultValue="github.com/nasrin"  style={{padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "var(--f-mono)", fontSize: 13, direction: "ltr"}} />
          <input className="rounded-xl text-left" placeholder="LinkedIn"  style={{padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "var(--f-mono)", fontSize: 13, direction: "ltr"}} />
        </div>
      </Row>
      <div className="pt-6 flex justify-end gap-2.5" >
        <Button variant="ghost" onClick={() => window.toast?.("تغییرات نادیده گرفته شد")}>انصراف</Button>
        <Button variant="primary" onClick={() => window.toast?.({ title: "ذخیره شد", msg: "تغییرات شما با موفقیت ذخیره شد.", kind: "success" })}>ذخیره تغییرات</Button>
      </div>
    </div>
  </div>
);

const SecurityTab = () => (
  <div>
    <SectionH eyebrow="SECURITY" title="امنیت حساب" sub="کنترل کامل بر دسترسی، احراز هویت دومرحله‌ای، و نشست‌های فعال." />
    <div className="card p-8" >
      <Row label="رمز عبور" hint="آخرین تغییر: ۲۳ روز پیش">
        <Button variant="outline" onClick={() => window.toast?.({ title: "تغییر رمز عبور", msg: "لینک تغییر رمز به ایمیل شما ارسال شد.", kind: "info" })}>تغییر رمز عبور</Button>
      </Row>
      <Row label="احراز هویت دو مرحله‌ای" hint="با اپلیکیشن authenticator یا پیامک امن‌تر شوید">
        <div className="flex items-center gap-3" >
          <Toggle on={true} />
          <span style={{ fontSize: 13, color: "var(--sage)", fontWeight: 500 }}>فعال · Google Authenticator</span>
        </div>
      </Row>
      <Row label="کلید سخت‌افزاری (FIDO2)" hint="بالاترین سطح امنیت — کلید فیزیکی USB یا NFC">
        <Button variant="outline" onClick={() => window.toast?.({ title: "ثبت کلید امنیتی", msg: "WebAuthn روی این مرورگر فعال نیست." , kind: "warn"})}>ثبت کلید جدید</Button>
      </Row>
      <Row label="نشست‌های فعال" hint="می‌توانید هر نشست را از راه دور خارج کنید">
        <div className="flex flex-col gap-2" >
          {[
            ["MacBook Pro · Chrome", "تهران · همین الان", "current"],
            ["iPhone 14 · Safari", "تهران · ۲ ساعت پیش", ""],
            ["iPad · Safari", "اصفهان · دیروز", ""],
          ].map(([d, w, s], i) => (
            <div className="flex items-center justify-between p-3.5 rounded-xl" key={i}  style={{ background: "var(--surface-2)"}}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d}</div>
                <div className="mt-1"  style={{fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)"}}>{w}</div>
              </div>
              {s === "current" ? <span className="pill pill-cyan" style={{ fontSize: 10 }}>این نشست</span> : <Button variant="ghost" size="sm" onClick={() => window.toast?.({ title: "نشست بسته شد", kind: "success" })}>خروج</Button>}
            </div>
          ))}
        </div>
      </Row>
      <Row label="منطقه‌ی خطر" hint="حذف یا غیرفعال‌سازی حساب">
        <div className="flex gap-2.5" >
          <Button variant="outline" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            onClick={async () => {
              const ok = await window.confirmAction?.({ title: "غیرفعال‌سازی موقت حساب", body: "حساب شما تا فعال‌سازی مجدد قابل دسترس نخواهد بود.", confirmLabel: "غیرفعال کن", danger: true });
              if (ok) window.toast?.({ title: "حساب غیرفعال شد", kind: "warn" });
            }}
          >غیرفعال‌سازی موقت</Button>
          <Button variant="outline" style={{ borderColor: "var(--rose)", color: "var(--rose)" }}
            onClick={async () => {
              const ok = await window.confirmAction?.({ title: "حذف کامل حساب", body: "این عملیات غیرقابل بازگشت است و همه‌ی داده‌های شما حذف می‌شوند.", confirmLabel: "حذف کامل", danger: true });
              if (ok) window.toast?.({ title: "درخواست حذف ثبت شد", msg: "تا ۳۰ روز قابل لغو است.", kind: "danger" });
            }}
          >حذف کامل حساب</Button>
        </div>
      </Row>
    </div>
  </div>
);

const AccountTab = () => (
  <div>
    <SectionH eyebrow="ACCOUNT" title="حساب کاربری" sub="اطلاعات هویتی و تماس." />
    <div className="card p-8" >
      <Row label="ایمیل اصلی" hint="برای ورود و اعلان‌ها استفاده می‌شود">
        <div className="flex gap-2.5 items-center" >
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 14 }}>nasrin@example.com</span>
          <span className="pill pill-cyan" style={{ fontSize: 10 }}>تأیید شده</span>
        </div>
      </Row>
      <Row label="شماره تماس" hint="برای پیامک اضطراری و 2FA">
        <input className="rounded-xl text-left" defaultValue="۰۹۱۲ ۱۲۳ ۴۵۶۷"  style={{width: "100%", maxWidth: 300, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "var(--f-mono)", fontSize: 13, direction: "ltr"}} />
      </Row>
      <Row label="کد دانشجویی" hint="در پروفایل شما ثابت است">
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 14, color: "var(--fg-mute)" }}>۸۴-۰۲-۱۷-۳۳</span>
      </Row>
      <Row label="زبان رابط" hint="بر زبان کلی پلتفرم اثر می‌گذارد">
        <select className="rounded-xl"  style={{padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 14}}>
          <option>فارسی</option>
          <option>English</option>
          <option>العربية</option>
        </select>
      </Row>
      <Row label="منطقه زمانی" hint="برای زمان‌بندی کلاس‌ها و یادآوری‌ها">
        <select className="rounded-xl"  style={{padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 14}}>
          <option>تهران (UTC+03:30)</option>
          <option>دبی (UTC+04:00)</option>
          <option>لندن (UTC+00:00)</option>
        </select>
      </Row>
    </div>
  </div>
);

const NotificationsTab = () => (
  <div>
    <SectionH eyebrow="NOTIFICATIONS" title="ترجیحات اعلان" sub="کنترل کنید چه چیزی، کجا و چه زمان به شما اطلاع داده شود." />
    <div className="card p-8" >
      {[
        { cat: "آموزشی", items: [["جلسه‌ی کلاس زنده", "۱۵ دقیقه قبل از شروع"], ["یادآوری تکلیف", "۲۴ ساعت قبل از موعد"], ["نمره منتشر شد", "بلافاصله"], ["AI Tutor پاسخ داد", "بلافاصله"]] },
        { cat: "اجتماعی", items: [["پاسخ به سوال شما", "بلافاصله"], ["لایک یا ارجاع", "خلاصه روزانه"], ["پیام خصوصی", "بلافاصله"]] },
        { cat: "اداری", items: [["تأیید پذیرش / مدرک", "بلافاصله"], ["یادآوری پرداخت", "۷ روز قبل"], ["به‌روزرسانی سامانه", "هفتگی"]] },
      ].map((g) => (
        <div className="mb-7" key={g.cat} >
          <h3 className="h-3 mb-3.5" >{g.cat}</h3>
          <div className="rounded-xl overflow-hidden"  style={{background: "var(--surface-2)", border: "1px solid var(--line)"}}>
            <div className="grid uppercase"  style={{ gridTemplateColumns: "1fr 100px 100px 100px", padding: "12px 18px", borderBottom: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em"}}>
              <span>نوع</span>
              <span className="text-center" >ایمیل</span>
              <span className="text-center" >اپ</span>
              <span className="text-center" >پیامک</span>
            </div>
            {g.items.map(([t, w], i) => (
              <div className="grid items-center" key={i}  style={{ gridTemplateColumns: "1fr 100px 100px 100px", padding: "14px 18px", borderBottom: i < g.items.length - 1 ? "1px solid var(--line)" : "none"}}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                  <div className="mt-0.5"  style={{fontSize: 11, color: "var(--fg-mute)"}}>{w}</div>
                </div>
                <div className="flex justify-center" ><Toggle on={true} /></div>
                <div className="flex justify-center" ><Toggle on={true} /></div>
                <div className="flex justify-center" ><Toggle on={i % 2 === 0} /></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ToneSelector = () => {
  const [tone, setTone] = React.useState(() => {
    try { return localStorage.getItem("digiu_tone") || "سقراطی"; } catch { return "سقراطی"; }
  });
  const set = (t) => {
    setTone(t);
    try { localStorage.setItem("digiu_tone", t); } catch {}
    window.toast?.({ title: "لحن دستیار", msg: `به «${t}» تغییر یافت.`, kind: "success" });
  };
  return (
    <div className="flex gap-2 flex-wrap" >
      {["دوستانه", "رسمی", "سقراطی"].map((t) => (
        <button
          key={t}
          onClick={() => set(t)}
          aria-pressed={tone === t}
          className={"btn " + (tone === t ? "btn-primary" : "btn-outline")}
        >{t}</button>
      ))}
    </div>
  );
};

const AITab = () => (
  <div>
    <SectionH eyebrow="AI ASSISTANT" title="تنظیمات دستیار هوشمند" sub="کنترل بر نحوه‌ی کمک‌رسانی AI، سطح توضیحات و گزینه‌های پیشرفته." />
    <div className="card p-8" >
      <Row label="سطح توضیحات" hint="چقدر توضیحات تفصیلی باشد">
        <select className="rounded-xl"  style={{padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", fontFamily: "inherit", fontSize: 14}}>
          <option>متعادل — پیشنهاد می‌شود</option>
          <option>کوتاه و سریع</option>
          <option>تفصیلی با مثال</option>
          <option>دانشگاهی با ارجاع</option>
        </select>
      </Row>
      <Row label="لحن دستیار" hint="چگونه با شما صحبت کند">
        <ToneSelector />
      </Row>
      <Row label="پاسخ خودکار در کلاس" hint="آیا AI می‌تواند سوال شما در چت کلاس را به طور خودکار پاسخ دهد؟">
        <Toggle on={true} />
      </Row>
      <Row label="استفاده از تاریخچه‌ی یادگیری" hint="AI می‌تواند به سوالات قبلی، یادداشت‌ها و تمرین‌های شما دسترسی داشته باشد">
        <Toggle on={true} />
      </Row>
      <Row label="ترجمه خودکار" hint="منابع انگلیسی به‌طور خودکار همراه با ترجمه‌ی فارسی نشان داده شوند">
        <Toggle on={false} />
      </Row>
    </div>
  </div>
);

const PrivacyTab = () => (
  <div>
    <SectionH eyebrow="PRIVACY" title="حریم خصوصی و داده" sub="کنترل کنید چه داده‌ای جمع‌آوری می‌شود و چگونه استفاده می‌شود." />
    <div className="card p-8" >
      <Row label="پروفایل عمومی" hint="آیا پروفایل شما برای دانشجویان دیگر قابل مشاهده باشد؟">
        <Toggle on={true} />
      </Row>
      <Row label="فعالیت در انجمن قابل مشاهده باشد" hint="سوالات و پاسخ‌های شما در انجمن">
        <Toggle on={true} />
      </Row>
      <Row label="آنالیتیکس آموزشی" hint="رفتار یادگیری شما برای بهبود مدل‌های شخصی استفاده می‌شود">
        <Toggle on={true} />
      </Row>
      <Row label="استفاده برای آموزش مدل‌های پایه" hint="داده‌ی ناشناس‌سازی‌شده‌ی شما برای آموزش مدل‌های کلی استفاده شود">
        <Toggle on={false} />
      </Row>
      <Row label="گزارش حقوق داده" hint="درخواست همه‌ی داده‌های جمع‌آوری‌شده درباره‌ی شما">
        <Button variant="outline" onClick={() => window.toast?.({ title: "درخواست ثبت شد", msg: "ظرف ۷۲ ساعت لینک دانلود به ایمیل شما ارسال می‌شود.", kind: "info" })}><Icon name="download" size={14} />درخواست export کامل (GDPR)</Button>
      </Row>
    </div>
  </div>
);

const AccessibilityTab = () => (
  <div>
    <SectionH eyebrow="ACCESSIBILITY · WCAG 2.2 AA" title="دسترس‌پذیری" sub="تنظیم رابط برای راحتی شخصی شما." />
    <div className="card p-8" >
      <Row label="اندازه فونت" hint="بر همه‌ی متون پلتفرم اثر می‌گذارد">
        <input type="range" min="14" max="22" defaultValue="16" style={{ width: 280, accentColor: "var(--accent)" }} />
      </Row>
      <Row label="کاهش حرکت" hint="انیمیشن‌ها و حرکت‌های ظریف حذف شوند">
        <Toggle on={false} />
      </Row>
      <Row label="حالت کنتراست بالا" hint="کنتراست بیشتر برای خوانایی بهتر">
        <Toggle on={false} />
      </Row>
      <Row label="زیرنویس بسته در ویدئوها" hint="به طور پیش‌فرض فعال باشد">
        <Toggle on={true} />
      </Row>
      <Row label="صفحه‌خوان" hint="بهینه‌سازی برای NVDA / JAWS / VoiceOver">
        <Toggle on={false} />
      </Row>
    </div>
  </div>
);

const BillingTab = () => (
  <div>
    <SectionH eyebrow="BILLING · صورتحساب" title="پرداخت و فاکتور" sub="مدیریت روش‌های پرداخت، فاکتورها و اشتراک." />
    <div className="card p-8 mb-4" >
      <h3 className="h-3 mb-4.5" >اشتراک فعلی</h3>
      <div className="grid gap-6 items-center p-6 rounded-xl"  style={{ gridTemplateColumns: "1fr auto", background: "var(--accent-soft)"}}>
        <div>
          <div style={{ fontSize: 12, color: "var(--accent-2)", fontFamily: "var(--f-mono)", letterSpacing: "0.08em" }}>پلن دانشجویی · ترم بهار ۱۴۰۵</div>
          <div className="mt-1.5"  style={{fontSize: 22, fontWeight: 700}}>۱۲ میلیون تومان</div>
          <div className="mt-1"  style={{fontSize: 13, color: "var(--fg-mute)"}}>تجدید خودکار: ۱۵ شهریور ۱۴۰۵</div>
        </div>
        <Button variant="outline" onClick={() => go("pricing")}>ارتقاء پلن</Button>
      </div>
    </div>

    <div className="card p-8" >
      <h3 className="h-3 mb-4.5" >فاکتورهای قبلی</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            <th className="text-right uppercase"  style={{ padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", fontWeight: 500}}>تاریخ</th>
            <th className="text-right uppercase"  style={{ padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", fontWeight: 500}}>شرح</th>
            <th className="text-right uppercase"  style={{ padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", fontWeight: 500}}>مبلغ</th>
            <th className="text-left uppercase"  style={{ padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", fontWeight: 500}}>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["۱۵ اسفند ۱۴۰۴", "شهریه ترم بهار ۱۴۰۵", "۱۲,۰۰۰,۰۰۰", "paid"],
            ["۱۵ آذر ۱۴۰۴", "شهریه ترم پاییز ۱۴۰۴", "۱۲,۰۰۰,۰۰۰", "paid"],
            ["۱۰ آبان ۱۴۰۴", "دوره تکمیلی Python", "۲,۸۰۰,۰۰۰", "paid"],
            ["۲۲ شهریور ۱۴۰۴", "گواهی Python", "۵۰۰,۰۰۰", "paid"],
          ].map(([d, t, a, s], i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "14px 0", fontFamily: "var(--f-mono)", fontSize: 13 }}>{d}</td>
              <td style={{ padding: "14px 0", fontSize: 14 }}>{t}</td>
              <td style={{ padding: "14px 0", fontFamily: "var(--f-mono)", fontSize: 13 }}>{a} ت</td>
              <td className="text-left"  style={{padding: "14px 0"}}>
                <span className="pill pill-violet" style={{ fontSize: 10 }}>پرداخت شد</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const WalletTab = () => (
  <div>
    <SectionH eyebrow="WALLET · کیف پول" title="موجودی و تراکنش‌ها" />
    <div className="card p-10"  style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-2))"}}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em" }}>BALANCE · موجودی</div>
      <div className="mt-3"  style={{fontFamily: "var(--f-mono)", fontSize: 56, fontWeight: 700, color: "var(--accent)"}}>۲,۴۵۰,۰۰۰<span className="me-2"  style={{fontSize: 20, color: "var(--fg-mute)"}}>تومان</span></div>
      <div className="flex gap-2.5 mt-6" >
        <Button variant="primary" onClick={() => window.toast?.({ title: "هدایت به درگاه پرداخت", msg: "در حال انتقال…", kind: "info" })}
        ><Icon name="plus" size={14} />شارژ کیف پول</Button>
        <Button variant="outline" onClick={async () => {
            const ok = await window.confirmAction?.({ title: "برداشت از کیف پول", body: "مبلغ به حساب بانکی متصل به حساب شما واریز می‌شود.", confirmLabel: "ادامه" });
            if (ok) window.toast?.({ title: "درخواست برداشت ثبت شد", kind: "success" });
          }}
        ><Icon name="download" size={14} />برداشت</Button>
      </div>
    </div>
  </div>
);

export default SettingsPage;
