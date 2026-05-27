// Phase B R3.a Commit I (D69) — admin ProfilesPage (read-only listing).
//
// Routes to /admin/profiles; lazy chunk per D66 Path D (NO bucket).
//
// D69 5th-page addition: lightweight read-only listing of all Profile
// rows in the tenant. Pairs with /profile (self-service) for support
// and admin lookup workflows. The drill-into-individual-user editor
// reuses the SelfOrAdmin /v1/users/:userId/profile endpoint and can
// be a follow-up sub-page; for R3.a we just surface the catalog.

import React from "react";

import { profileApi } from "../../api/endpoints.js";
import { useRole } from "../../role";

interface ProfileRow {
  id: string;
  userId: string;
  bio: string | null;
  phoneNumber: string | null;
  nationalId: string | null;
  locale: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    locale: string;
    isActive: boolean;
  };
}

export const ProfilesPage: React.FC = () => {
  const { role } = useRole();
  const isAdmin = role.id === "admin" || role.id === "super_admin";

  const [items, setItems] = React.useState<ProfileRow[]>([]);
  const [filter, setFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const data: ProfileRow[] = await profileApi.listAdmin();
        if (alive) setItems(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const name = (p.user.fullName ?? "").toLowerCase();
      const email = p.user.email.toLowerCase();
      const code = (p.nationalId ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [items, filter]);

  if (!isAdmin) {
    return (
      <main className="page-shell admin-academic-page" data-screen-label="admin-profiles">
        <div className="text-center" style={{ padding: 80, color: "var(--fg-mute)" }}>
          دسترسی فقط برای مدیران.
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-profiles">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">افراد</span>
          <h1 className="h-1">پروفایل‌ها</h1>
          <p className="mt-1" style={{ color: "var(--fg-mute)", fontSize: 13 }}>
            فهرست تمام پروفایل‌های کاربری در این مستأجر. ویرایش از طریق صفحه‌ی پروفایل کاربر انجام می‌شود.
          </p>
        </div>
      </header>

      <div className="admin-filter-row" style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="جستجو بر اساس نام، ایمیل یا کد ملی…"
          className="crud-form-input"
          style={{ maxWidth: 320 }}
          aria-label="جستجو در پروفایل‌ها"
        />
        <span style={{ alignSelf: "center", color: "var(--fg-mute)", fontSize: 12 }}>
          {filtered.length} از {items.length}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--fg-mute)" }}>
          در حال بارگذاری…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--fg-mute)" }}>
          هیچ پروفایلی یافت نشد.
        </div>
      ) : (
        <table className="admin-table" data-table="profiles">
          <thead>
            <tr>
              <th>نام</th>
              <th>ایمیل</th>
              <th>تلفن</th>
              <th>کد ملی</th>
              <th>وضعیت کاربر</th>
              <th>آخرین ویرایش</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.user.fullName || "—"}</td>
                <td className="mono" style={{ fontSize: 12 }}>{p.user.email}</td>
                <td className="mono" style={{ fontSize: 12 }}>{p.phoneNumber || "—"}</td>
                <td className="mono" style={{ fontSize: 12 }}>{p.nationalId || "—"}</td>
                <td>
                  <span
                    className={p.user.isActive ? "pill pill-green" : "pill"}
                    style={{ fontSize: 11 }}
                  >
                    {p.user.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {new Date(p.updatedAt).toLocaleString("fa-IR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default ProfilesPage;
