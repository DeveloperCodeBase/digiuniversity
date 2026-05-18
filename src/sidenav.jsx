// =====================================================
// Master role-aware sidebar — used in all dashboards
// =====================================================

const SIDEBAR_BY_ROLE = {
  student: [
    { h: "یادگیری" },
    { id: "dashboard", t: "میز کار", ic: "home" },
    { id: "course", t: "دروس من", ic: "book" },
    { id: "calendar", t: "تقویم", ic: "calendar" },
    { id: "registration", t: "ثبت‌نام واحد", ic: "plus" },
    { id: "submission", t: "تمرین‌ها و آزمون", ic: "check" },
    { id: "transcript", t: "کارنامه", ic: "file" },
    { id: "degree-audit", t: "مسیر مدرک", ic: "target" },
    { h: "منابع" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "labs", t: "آزمایشگاه مجازی", ic: "flask" },
    { id: "recordings", t: "آرشیو کلاس‌ها", ic: "video" },
    { id: "search", t: "جستجوی معنایی", ic: "search" },
    { h: "هوش مصنوعی" },
    { id: "classroom", t: "کلاس زنده + AI", ic: "sparkle" },
    { id: "assessment", t: "آزمون تطبیقی", ic: "chip" },
    { h: "اجتماع" },
    { id: "community", t: "انجمن و بحث", ic: "users" },
    { id: "messages", t: "پیام‌ها", ic: "chat" },
    { id: "officehours", t: "Office Hours", ic: "headset" },
    { id: "alumni", t: "شبکه فارغ‌التحصیلان", ic: "grad" },
    { id: "hackathons", t: "هکاتون و رقابت", ic: "trophy" },
    { id: "events", t: "رویدادها", ic: "live" },
    { h: "خدمات دانشجویی" },
    { id: "career", t: "خدمات شغلی", ic: "bolt" },
    { id: "financial-aid", t: "کمک‌هزینه", ic: "dollar" },
    { id: "wellness", t: "سلامت و مشاوره", ic: "shield" },
    { id: "credential", t: "گواهی‌ها", ic: "cert" },
    { h: "حساب" },
    { id: "profile", t: "پروفایل عمومی", ic: "user" },
    { id: "bookmarks", t: "ذخیره‌ها", ic: "star" },
    { id: "achievements", t: "دستاوردها", ic: "trophy" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
  ],

  instructor: [
    { h: "تدریس" },
    { id: "instructor", t: "نمای کلی", ic: "home" },
    { id: "classroom", t: "کلاس زنده", ic: "live" },
    { id: "authoring", t: "استودیوی تولید", ic: "sparkle" },
    { id: "course", t: "دروس من", ic: "book" },
    { id: "officehours", t: "Office Hours", ic: "headset" },
    { h: "دانشجویان" },
    { id: "analytics", t: "تحلیل کلاس", ic: "chart" },
    { id: "submission", t: "تصحیح تمرین", ic: "check" },
    { id: "messages", t: "پیام‌ها", ic: "chat" },
    { h: "پژوهش" },
    { id: "research", t: "محیط پژوهشی", ic: "flask" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "labs", t: "آزمایشگاه‌ها", ic: "chip" },
    { h: "اداری" },
    { id: "events", t: "رویدادها", ic: "calendar" },
    { id: "honor-code", t: "صداقت علمی", ic: "shield" },
    { id: "profile", t: "پروفایل", ic: "user" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
  ],

  admin: [
    { h: "عملیات" },
    { id: "admin", t: "نمای کلی", ic: "home" },
    { id: "analytics", t: "تحلیل سامانه", ic: "chart" },
    { id: "schools", t: "دانشکده‌ها", ic: "grad" },
    { id: "faculty", t: "هیات علمی", ic: "users" },
    { h: "محتوا و منابع" },
    { id: "authoring", t: "استودیوی درس", ic: "sparkle" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "labs", t: "آزمایشگاه‌ها", ic: "flask" },
    { id: "events", t: "رویدادها", ic: "live" },
    { h: "حاکمیت" },
    { id: "honor-code", t: "صداقت علمی", ic: "shield" },
    { id: "financial-aid", t: "بورسیه و وام", ic: "dollar" },
    { id: "settings", t: "تنظیمات سامانه", ic: "settings" },
  ],

  parent: [
    { h: "فرزند" },
    { id: "parent", t: "نمای کلی", ic: "home" },
    { id: "calendar", t: "تقویم فرزند", ic: "calendar" },
    { id: "credential", t: "گواهی و نمرات", ic: "cert" },
    { h: "ارتباط" },
    { id: "messages", t: "پیام به استاد", ic: "chat" },
    { id: "inbox", t: "اعلان‌ها", ic: "bell" },
    { id: "officehours", t: "جلسه با مشاور", ic: "headset" },
    { h: "اداری" },
    { id: "financial-aid", t: "بورسیه و شهریه", ic: "dollar" },
    { id: "settings", t: "تنظیمات", ic: "settings" },
    { id: "help", t: "پشتیبانی", ic: "headset" },
  ],

  org: [
    { h: "تیم" },
    { id: "admin", t: "نمای کلی", ic: "home" },
    { id: "analytics", t: "تحلیل تیم", ic: "chart" },
    { id: "faculty", t: "مربیان", ic: "users" },
    { h: "محتوا" },
    { id: "library", t: "کتابخانه", ic: "folder" },
    { id: "events", t: "رویدادها", ic: "live" },
    { id: "authoring", t: "تولید محتوا", ic: "sparkle" },
    { h: "اداری" },
    { id: "pricing", t: "اشتراک و پلن", ic: "dollar" },
    { id: "settings", t: "تنظیمات سازمان", ic: "settings" },
    { id: "help", t: "پشتیبانی", ic: "headset" },
  ],
};

const RoleSideNav = ({ active, go }) => {
  const { role } = useRole();
  const items = SIDEBAR_BY_ROLE[role.id] || SIDEBAR_BY_ROLE.student;
  return (
    <aside className="side-nav">
      {items.map((it, i) =>
        it.h ? (
          <h6 key={"h" + i}>{it.h}</h6>
        ) : (
          <a
            key={it.id}
            onClick={() => go(it.id)}
            className={active === it.id ? "active" : ""}
            style={{ cursor: "pointer" }}
          >
            <Icon name={it.ic} size={14} />
            {it.t}
          </a>
        )
      )}
    </aside>
  );
};

// Wrap a list in <ul> if it isn't already (compat with existing CSS)
const RoleSideNavWrapped = ({ active, go }) => {
  const { role } = useRole();
  const items = SIDEBAR_BY_ROLE[role.id] || SIDEBAR_BY_ROLE.student;
  // Group items: each h: starts a new group
  const groups = [];
  let current = null;
  items.forEach(it => {
    if (it.h) { current = { h: it.h, items: [] }; groups.push(current); }
    else if (current) current.items.push(it);
    else { current = { h: "", items: [it] }; groups.push(current); }
  });
  return (
    <aside className="side-nav">
      {groups.map((g, gi) => (
        <React.Fragment key={gi}>
          {g.h && <h6>{g.h}</h6>}
          <ul>
            {g.items.map(it => (
              <li key={it.id}>
                <a
                  onClick={() => go(it.id)}
                  className={active === it.id ? "active" : ""}
                  style={{ cursor: "pointer" }}
                >
                  <Icon name={it.ic} size={14} />
                  {it.t}
                </a>
              </li>
            ))}
          </ul>
        </React.Fragment>
      ))}
    </aside>
  );
};

window.SIDEBAR_BY_ROLE = SIDEBAR_BY_ROLE;
window.RoleSideNav = RoleSideNavWrapped;
