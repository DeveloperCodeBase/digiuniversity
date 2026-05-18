// =====================================================
// Settings / Profile page
// =====================================================
const SettingsPage = ({ go }) => {
  const [tab, setTab] = React.useState("profile");

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
  <div style={{ marginBottom: 28 }}>
    <span className="eyebrow">{eyebrow}</span>
    <h1 className="h-2" style={{ marginTop: 10 }}>{title}</h1>
    {sub && <p style={{ color: "var(--fg-mute)", fontSize: 14, marginTop: 10, maxWidth: 640 }}>{sub}</p>}
  </div>
);

const Row = ({ label, hint, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32, padding: "20px 0", borderBottom: "1px solid var(--line)", alignItems: "start" }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const ProfileTab = () => (
  <div>
    <SectionH eyebrow="PROFILE · نمایه عمومی" title="پروفایل" sub="این اطلاعات روی پروفایل عمومی شما و در کلاس‌ها قابل مشاهده است." />
    <div className="card" style={{ padding: 32 }}>
      <Row label="عکس پروفایل" hint="JPG یا PNG · حداکثر ۲MB · ابعاد مربعی پیشنهاد می‌شود">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="avatar cyan" style={{ width: 76, height: 76, fontSize: 22 }}>نر</div>
          <button className="btn btn-outline">آپلود تصویر جدید</button>
          <button className="btn btn-ghost">حذف</button>
        </div>
      </Row>
      <Row label="نام نمایشی" hint="در کلاس‌ها و پروفایل عمومی نشان داده می‌شود">
        <input defaultValue="نسرین رضوی" style={{ width: "100%", maxWidth: 400, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "inherit", fontSize: 14 }} />
      </Row>
      <Row label="بیوگرافی کوتاه" hint="حداکثر ۲۸۰ کاراکتر">
        <textarea defaultValue="دانشجوی ارشد علوم داده، علاقمند به مدل‌های زبانی فارسی و آموزش." rows={3} style={{ width: "100%", maxWidth: 600, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "inherit", fontSize: 14, resize: "vertical" }} />
      </Row>
      <Row label="علایق پژوهشی" hint="با تب جدا کنید">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["NLP فارسی", "یادگیری عمیق", "RAG", "ترنسفورمر", "+ افزودن"].map((t, i) => (
            <span key={i} className={"pill " + (i === 4 ? "" : "pill-cyan")} style={{ cursor: "pointer" }}>{t}</span>
          ))}
        </div>
      </Row>
      <Row label="پیوندها" hint="GitHub، LinkedIn، Google Scholar و...">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="GitHub" defaultValue="github.com/nasrin" style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "var(--f-mono)", fontSize: 13, direction: "ltr", textAlign: "left" }} />
          <input placeholder="LinkedIn" style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "var(--f-mono)", fontSize: 13, direction: "ltr", textAlign: "left" }} />
        </div>
      </Row>
      <div style={{ paddingTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-ghost">انصراف</button>
        <button className="btn btn-primary">ذخیره تغییرات</button>
      </div>
    </div>
  </div>
);

const SecurityTab = () => (
  <div>
    <SectionH eyebrow="SECURITY" title="امنیت حساب" sub="کنترل کامل بر دسترسی، احراز هویت دومرحله‌ای، و نشست‌های فعال." />
    <div className="card" style={{ padding: 32 }}>
      <Row label="رمز عبور" hint="آخرین تغییر: ۲۳ روز پیش">
        <button className="btn btn-outline">تغییر رمز عبور</button>
      </Row>
      <Row label="احراز هویت دو مرحله‌ای" hint="با اپلیکیشن authenticator یا پیامک امن‌تر شوید">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle on={true} />
          <span style={{ fontSize: 13, color: "var(--sage)", fontWeight: 500 }}>فعال · Google Authenticator</span>
        </div>
      </Row>
      <Row label="کلید سخت‌افزاری (FIDO2)" hint="بالاترین سطح امنیت — کلید فیزیکی USB یا NFC">
        <button className="btn btn-outline">ثبت کلید جدید</button>
      </Row>
      <Row label="نشست‌های فعال" hint="می‌توانید هر نشست را از راه دور خارج کنید">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["MacBook Pro · Chrome", "تهران · همین الان", "current"],
            ["iPhone 14 · Safari", "تهران · ۲ ساعت پیش", ""],
            ["iPad · Safari", "اصفهان · دیروز", ""],
          ].map(([d, w, s], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, background: "var(--surface-2)", borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d}</div>
                <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", marginTop: 4 }}>{w}</div>
              </div>
              {s === "current" ? <span className="pill pill-cyan" style={{ fontSize: 10 }}>این نشست</span> : <button className="btn btn-ghost btn-sm">خروج</button>}
            </div>
          ))}
        </div>
      </Row>
      <Row label="منطقه‌ی خطر" hint="حذف یا غیرفعال‌سازی حساب">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>غیرفعال‌سازی موقت</button>
          <button className="btn btn-outline" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>حذف کامل حساب</button>
        </div>
      </Row>
    </div>
  </div>
);

const AccountTab = () => (
  <div>
    <SectionH eyebrow="ACCOUNT" title="حساب کاربری" sub="اطلاعات هویتی و تماس." />
    <div className="card" style={{ padding: 32 }}>
      <Row label="ایمیل اصلی" hint="برای ورود و اعلان‌ها استفاده می‌شود">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--f-mono)", fontSize: 14 }}>nasrin@example.com</span>
          <span className="pill pill-cyan" style={{ fontSize: 10 }}>تأیید شده</span>
        </div>
      </Row>
      <Row label="شماره تماس" hint="برای پیامک اضطراری و 2FA">
        <input defaultValue="۰۹۱۲ ۱۲۳ ۴۵۶۷" style={{ width: "100%", maxWidth: 300, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "var(--f-mono)", fontSize: 13, direction: "ltr", textAlign: "left" }} />
      </Row>
      <Row label="کد دانشجویی" hint="در پروفایل شما ثابت است">
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 14, color: "var(--fg-mute)" }}>۸۴-۰۲-۱۷-۳۳</span>
      </Row>
      <Row label="زبان رابط" hint="بر زبان کلی پلتفرم اثر می‌گذارد">
        <select style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "inherit", fontSize: 14 }}>
          <option>فارسی</option>
          <option>English</option>
          <option>العربية</option>
        </select>
      </Row>
      <Row label="منطقه زمانی" hint="برای زمان‌بندی کلاس‌ها و یادآوری‌ها">
        <select style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "inherit", fontSize: 14 }}>
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
    <div className="card" style={{ padding: 32 }}>
      {[
        { cat: "آموزشی", items: [["جلسه‌ی کلاس زنده", "۱۵ دقیقه قبل از شروع"], ["یادآوری تکلیف", "۲۴ ساعت قبل از موعد"], ["نمره منتشر شد", "بلافاصله"], ["AI Tutor پاسخ داد", "بلافاصله"]] },
        { cat: "اجتماعی", items: [["پاسخ به سوال شما", "بلافاصله"], ["لایک یا ارجاع", "خلاصه روزانه"], ["پیام خصوصی", "بلافاصله"]] },
        { cat: "اداری", items: [["تأیید پذیرش / مدرک", "بلافاصله"], ["یادآوری پرداخت", "۷ روز قبل"], ["به‌روزرسانی سامانه", "هفتگی"]] },
      ].map((g) => (
        <div key={g.cat} style={{ marginBottom: 28 }}>
          <h3 className="h-3" style={{ marginBottom: 14 }}>{g.cat}</h3>
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", padding: "12px 18px", borderBottom: "1px solid var(--line)", fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <span>نوع</span>
              <span style={{ textAlign: "center" }}>ایمیل</span>
              <span style={{ textAlign: "center" }}>اپ</span>
              <span style={{ textAlign: "center" }}>پیامک</span>
            </div>
            {g.items.map(([t, w], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", padding: "14px 18px", borderBottom: i < g.items.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{w}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}><Toggle on={true} /></div>
                <div style={{ display: "flex", justifyContent: "center" }}><Toggle on={true} /></div>
                <div style={{ display: "flex", justifyContent: "center" }}><Toggle on={i % 2 === 0} /></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AITab = () => (
  <div>
    <SectionH eyebrow="AI ASSISTANT" title="تنظیمات دستیار هوشمند" sub="کنترل بر نحوه‌ی کمک‌رسانی AI، سطح توضیحات و گزینه‌های پیشرفته." />
    <div className="card" style={{ padding: 32 }}>
      <Row label="سطح توضیحات" hint="چقدر توضیحات تفصیلی باشد">
        <select style={{ padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10, fontFamily: "inherit", fontSize: 14 }}>
          <option>متعادل — پیشنهاد می‌شود</option>
          <option>کوتاه و سریع</option>
          <option>تفصیلی با مثال</option>
          <option>دانشگاهی با ارجاع</option>
        </select>
      </Row>
      <Row label="لحن دستیار" hint="چگونه با شما صحبت کند">
        <div style={{ display: "flex", gap: 8 }}>
          {["دوستانه", "رسمی", "سقراطی"].map((t, i) => (
            <button key={t} className={"btn " + (i === 2 ? "btn-primary" : "btn-outline")}>{t}</button>
          ))}
        </div>
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
    <div className="card" style={{ padding: 32 }}>
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
        <button className="btn btn-outline"><Icon name="download" size={14} />درخواست export کامل (GDPR)</button>
      </Row>
    </div>
  </div>
);

const AccessibilityTab = () => (
  <div>
    <SectionH eyebrow="ACCESSIBILITY · WCAG 2.2 AA" title="دسترس‌پذیری" sub="تنظیم رابط برای راحتی شخصی شما." />
    <div className="card" style={{ padding: 32 }}>
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
    <div className="card" style={{ padding: 32, marginBottom: 16 }}>
      <h3 className="h-3" style={{ marginBottom: 18 }}>اشتراک فعلی</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", padding: 24, background: "var(--accent-soft)", borderRadius: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--accent-2)", fontFamily: "var(--f-mono)", letterSpacing: "0.08em" }}>پلن دانشجویی · ترم بهار ۱۴۰۵</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>۱۲ میلیون تومان</div>
          <div style={{ fontSize: 13, color: "var(--fg-mute)", marginTop: 4 }}>تجدید خودکار: ۱۵ شهریور ۱۴۰۵</div>
        </div>
        <button className="btn btn-outline">ارتقاء پلن</button>
      </div>
    </div>

    <div className="card" style={{ padding: 32 }}>
      <h3 className="h-3" style={{ marginBottom: 18 }}>فاکتورهای قبلی</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            <th style={{ textAlign: "right", padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>تاریخ</th>
            <th style={{ textAlign: "right", padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>شرح</th>
            <th style={{ textAlign: "right", padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>مبلغ</th>
            <th style={{ textAlign: "left", padding: "12px 0", fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>وضعیت</th>
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
              <td style={{ padding: "14px 0", textAlign: "left" }}>
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
    <div className="card" style={{ padding: 40, background: "linear-gradient(135deg, var(--surface), var(--surface-2))" }}>
      <div className="mono" style={{ color: "var(--fg-mute)", fontSize: 11, letterSpacing: "0.08em" }}>BALANCE · موجودی</div>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 56, fontWeight: 700, marginTop: 12, color: "var(--accent)" }}>۲,۴۵۰,۰۰۰<span style={{ fontSize: 20, color: "var(--fg-mute)", marginRight: 8 }}>تومان</span></div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button className="btn btn-primary"><Icon name="plus" size={14} />شارژ کیف پول</button>
        <button className="btn btn-outline"><Icon name="download" size={14} />برداشت</button>
      </div>
    </div>
  </div>
);

window.SettingsPage = SettingsPage;
