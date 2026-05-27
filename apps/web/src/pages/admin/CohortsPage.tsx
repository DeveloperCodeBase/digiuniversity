// Phase B R2 Commit H (D65) — admin CohortsPage with «Legacy» banner.
//
// Routes to /admin/cohorts, lazy-loaded (chunk = admin-academic.{hash}.js
// per D61 Constraint #2).
//
// Per MIGRATION_POLICY §6 + D65 owner directive, the Cohort surface
// stays alive during the Sunset window (deprecation ≥ 4 sprints, drop
// no sooner than 2026-12-31). This page exists to:
//   1. Render a prominent «Legacy» banner explaining the migration.
//   2. Show existing cohorts (read-only — owner explicitly directed
//      to NOT add new CRUD on the legacy surface; new cohorts can
//      still be created via API for back-compat but the admin UI
//      pushes users toward Offerings).
//   3. For each cohort linked to an Offering (upgradedToOfferingId set),
//      show a «migrate to offering» CTA that jumps to the corresponding
//      OfferingsPage row.

import React from "react";

import { academicAdminApi } from "../../api/endpoints.js";
import { useGo } from "../../router";

interface Cohort {
  id: string;
  slug: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  programId: string;
  upgradedToOfferingId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CohortsPage: React.FC = () => {
  const go = useGo();
  const [items, setItems] = React.useState<Cohort[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await academicAdminApi.listCohorts();
        setItems((res?.data ?? []) as Cohort[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const linkedCount = items.filter((c) => c.upgradedToOfferingId).length;
  const orphanCount = items.length - linkedCount;

  return (
    <main className="page-shell admin-academic-page" data-screen-label="admin-cohorts">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">ساختار آکادمیک — Legacy</span>
          <h1 className="h-1">گروه‌های آموزشی</h1>
        </div>
      </header>

      {/* «Legacy» deprecation banner — prominent, role="alert" so
          screen readers announce it on page load. */}
      <div
        className="legacy-banner"
        role="alert"
        style={{
          background: "linear-gradient(135deg, var(--amber-50, #fff8e1) 0%, var(--amber-100, #ffecb3) 100%)",
          border: "1px solid var(--amber-300, #ffd54f)",
          borderInlineStart: "4px solid var(--amber-600, #ffb300)",
          borderRadius: "var(--r-md, 14px)",
          padding: "16px 20px",
          margin: "20px 0",
          color: "var(--amber-900, #5d4037)",
        }}
        data-legacy-banner="cohorts"
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              این بخش در حال منسوخ‌شدن است
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.7 }}>
              ساختار «گروه آموزشی» (Cohort) جای خود را به ساختار جدید «دوره‌ی ارائه‌شده» (Course Offering) داده است.
              ساختار جدید ویژگی‌های بیشتری دارد: وضعیت (state machine)، حالت برگزاری، ظرفیت، و قابلیت اتصال به استاد در آینده.
              {linkedCount > 0 ? (
                <>
                  {" "}<strong>{linkedCount}</strong> گروه از <strong>{items.length}</strong> گروه فعلی به دوره‌ی ارائه‌شده‌ی متناظر متصل شده‌اند.
                </>
              ) : null}
              {orphanCount > 0 && linkedCount > 0 ? (
                <>
                  {" "}<strong>{orphanCount}</strong> گروه دیگر هنوز در حال انتقال هستند.
                </>
              ) : null}
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => go("admin/offerings")}
                style={{ fontSize: 13 }}
              >
                ← رفتن به دوره‌های ارائه‌شده
              </button>
              <span style={{ fontSize: 12, color: "var(--mute, #6b7280)", alignSelf: "center" }}>
                این صفحه پس از <strong dir="ltr">2026-12-31</strong> حذف می‌شود.
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <p>هیچ گروه آموزشی (Legacy) ثبت نشده است.</p>
          <button
            type="button"
            className="btn btn-primary mt-3"
            onClick={() => go("admin/offerings")}
          >
            رفتن به ساختار جدید — دوره‌های ارائه‌شده
          </button>
        </div>
      ) : (
        <table className="admin-table" role="table">
          <thead>
            <tr>
              <th>نام</th>
              <th>شناسه</th>
              <th>تاریخ شروع</th>
              <th>وضعیت انتقال</th>
              <th aria-label="عملیات" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} data-cohort-id={c.id}>
                <td>{c.name}</td>
                <td dir="ltr">{c.slug}</td>
                <td dir="ltr">{c.startDate ? c.startDate.slice(0, 10) : "—"}</td>
                <td>
                  {c.upgradedToOfferingId ? (
                    <span className="pill pill-status pill-completed" data-migration="linked">
                      ✓ منتقل شد
                    </span>
                  ) : (
                    <span className="pill pill-status pill-scheduled" data-migration="orphan">
                      در انتظار انتقال
                    </span>
                  )}
                </td>
                <td className="admin-row-actions">
                  {c.upgradedToOfferingId ? (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => go("admin/offerings")}
                      aria-label={`نمایش دوره‌ی ارائه‌شده‌ی متناظر با ${c.name}`}
                      title="نمایش دوره‌ی ارائه‌شده‌ی متناظر"
                    >
                      → دوره‌ی متناظر
                    </button>
                  ) : (
                    <span className="text-mute" style={{ fontSize: 12 }}>
                      اولین ویرایش، انتقال خودکار را فعال می‌کند
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default CohortsPage;
