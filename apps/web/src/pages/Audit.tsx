// =====================================================
// /audit — production AuditLog viewer
// =====================================================
//
// Phase-15 R7. The api ships every mutating request to AuditLog via
// the global AuditInterceptor; this page surfaces those rows for
// admins / super_admins / support. Read-only — there's no edit or
// delete affordance because the audit table is append-only by policy.
//
// Authorization is enforced in TWO places:
//   - The api: @Roles("admin", "super_admin", "support") +
//     @CheckPolicies((ab) => ab.can("read", "AuditLog")).
//   - The SPA: this page calls `useAbility()` and renders a denial
//     state when the current user cannot read AuditLog. If they
//     somehow bypass the SPA guard, the api still 403s.
//
// Both layers must agree — the SPA gate is defence-in-depth so a
// disabled link doesn't leak; the api gate is what actually keeps
// the data safe.
// =====================================================

import React from "react";
import { api } from "../api/client.js";
import { useAbility } from "../auth/Can";
import { PageHeader, LoadingSkeleton, EmptyState, ErrorState } from "../components/States";
import type { Go } from "../router";

interface AuditRow {
  id: string;
  action: string;
  subject: string;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
  actor: { id: string; email: string; fullName: string | null } | null;
}

interface AuditResponse {
  total: number;
  limit: number;
  offset: number;
  items: AuditRow[];
}

interface AuditPageProps {
  go: Go;
}

export const AuditPage = ({ go: _go }: AuditPageProps): React.ReactElement => {
  const ability = useAbility();
  const allowed = ability.can("read", "AuditLog");

  const [data, setData] = React.useState<AuditResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [actionFilter, setActionFilter] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);

  const reload = React.useCallback(async (action: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = action
        ? `?action=${encodeURIComponent(action)}&limit=50`
        : "?limit=50";
      const resp = (await api.get("/v1/audit-logs" + qs)) as AuditResponse;
      setData(resp);
    } catch (e: unknown) {
      // ApiError carries a displayMessage; bare Error has .message;
      // anything else gets a generic string so the UI never crashes.
      const msg =
        e instanceof Error
          ? (e as Error & { displayMessage?: string }).displayMessage ?? e.message
          : "خطای ناشناخته";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (allowed) void reload("");
  }, [allowed, reload]);

  if (!allowed) {
    return (
      <main data-screen-label="audit · forbidden">
        <PageHeader
          title="دسترسی محدود"
          subtitle="گزارش حسابرسی فقط برای نقش‌های مدیر، ابرمدیر و پشتیبانی قابل مشاهده است."
          back={undefined}
          onBack={undefined}
          actions={undefined}
          badge={undefined}
        />
      </main>
    );
  }

  return (
    <main data-screen-label="audit · گزارش حسابرسی">
      <PageHeader
        title="گزارش حسابرسی"
        subtitle="هر تغییر داده‌ای در سامانه با کاربر، آدرس IP و نشان درخواست ثبت می‌شود."
        back={undefined}
        onBack={undefined}
        actions={undefined}
        badge={undefined}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.currentTarget.value)}
          placeholder="فیلتر بر اساس عمل (مثلاً course.create)"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border, #2a2f44)",
            background: "var(--bg-card, #14182b)",
            color: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => void reload(actionFilter.trim())}
          style={{ padding: "8px 16px", borderRadius: 8 }}
        >
          اعمال
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton kind="row" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload(actionFilter)} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="رکوردی برای نمایش نیست"
          body="با تغییر فیلترها دوباره امتحان کنید یا منتظر اولین تغییر داده‌ای بمانید."
          cta={undefined}
          onCta={undefined}
        />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr>
                <th style={cellStyle}>زمان</th>
                <th style={cellStyle}>کاربر</th>
                <th style={cellStyle}>عمل</th>
                <th style={cellStyle}>هدف</th>
                <th style={cellStyle}>IP</th>
                <th style={cellStyle}>درخواست</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td style={cellStyle}>
                    {new Date(row.createdAt).toLocaleString("fa-IR")}
                  </td>
                  <td style={cellStyle}>
                    {row.actor ? row.actor.fullName ?? row.actor.email : "—"}
                  </td>
                  <td style={{ ...cellStyle, fontFamily: "monospace" }}>
                    {row.action}
                  </td>
                  <td style={{ ...cellStyle, fontFamily: "monospace" }}>
                    {row.subject || "—"}
                  </td>
                  <td style={cellStyle}>{row.ip ?? "—"}</td>
                  <td
                    style={{
                      ...cellStyle,
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {row.requestId ? row.requestId.slice(0, 8) + "…" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ opacity: 0.6, fontSize: 12, marginTop: 12 }}>
            نمایش {data.items.length} از {data.total} رکورد
          </p>
        </div>
      )}
    </main>
  );
};

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "right",
  borderBottom: "1px solid var(--border, #2a2f44)",
  verticalAlign: "top",
};

export default AuditPage;
