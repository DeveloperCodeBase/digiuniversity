// =====================================================
// Phase B R6 (D80) — public applicant status page: /track?token=&type=.
//
// The anon applicant's bearer-capability surface. The token (minted at
// submit, shown on the confirmation page) is the sole credential — no
// login. Renders the PII-masked view from GET .../track (status +
// reference + masked contact), a read-only lifecycle stepper, and the
// one applicant action: withdraw (gated to non-terminal states via the
// backend's canWithdraw; the state machine is enforced server-side too).
//
// PUBLIC route (route-classification.ts) so the AppShell auth gate never
// forces a login. AppShell supplies the public Nav + Footer.
// =====================================================
import React from "react";
import { useSearchParams } from "react-router-dom";

import type { Go } from "../router";
import { Button } from "../ui";
import { studentApplicationsApi, instructorApplicationsApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";

type Variant = "student" | "instructor";

interface TrackView {
  reference: string;
  type: Variant;
  status: string;
  submittedAt: string;
  decidedAt: string | null;
  applicantFullName: string;
  applicantEmailMasked: string;
  applicantPhoneMasked: string | null;
  programName: string | null;
  departmentName: string | null;
  canWithdraw: boolean;
}

const STEPS: { key: string; label: string }[] = [
  { key: "SUBMITTED", label: "ثبت شد" },
  { key: "UNDER_REVIEW", label: "بررسی" },
  { key: "INTERVIEW", label: "مصاحبه" },
  { key: "ACCEPTED", label: "پذیرش" },
  { key: "ENROLLED", label: "ثبت‌نام" },
];
const HAPPY_IDX: Record<string, number> = {
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  INTERVIEW: 2,
  ACCEPTED: 3,
  ENROLLED: 4,
};
const STATUS_FA: Record<string, string> = {
  SUBMITTED: "ثبت شد",
  UNDER_REVIEW: "در حال بررسی",
  INTERVIEW: "دعوت به مصاحبه",
  ACCEPTED: "پذیرفته شد",
  ENROLLED: "ثبت‌نام نهایی",
  REJECTED: "رد شد",
  WITHDRAWN: "لغو شد",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

interface TrackPageProps {
  go: Go;
}

export const TrackPage: React.FC<TrackPageProps> = ({ go }) => {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();
  const variant: Variant = searchParams.get("type") === "instructor" ? "instructor" : "student";
  const apiFor = variant === "instructor" ? instructorApplicationsApi : studentApplicationsApi;

  const [view, setView] = React.useState<TrackView | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [withdrawing, setWithdrawing] = React.useState(false);

  const load = React.useCallback(() => {
    if (!token) {
      setError("پیوند نامعتبر است — کد پیگیری یافت نشد.");
      setLoading(false);
      return () => {};
    }
    let alive = true;
    setLoading(true);
    setError(null);
    apiFor
      .trackByToken(token)
      .then((row: TrackView) => {
        if (alive) setView(row);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const status = err instanceof ApiError ? (err as { status?: number }).status : undefined;
        setError(
          status === 404
            ? "درخواستی با این پیوند یافت نشد. ممکن است پیوند نادرست باشد."
            : err instanceof ApiError
              ? ((err as { displayMessage?: string }).displayMessage ?? "خطا در دریافت وضعیت")
              : "خطا در دریافت وضعیت درخواست",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, apiFor]);

  React.useEffect(() => load(), [load]);

  const doWithdraw = async (): Promise<void> => {
    setWithdrawing(true);
    try {
      const updated: TrackView = await apiFor.withdrawByToken(token);
      setView(updated);
      setConfirming(false);
      window.toast?.({ title: "لغو شد", msg: "درخواست شما لغو شد.", kind: "success" });
    } catch (err) {
      let msg = "لغو درخواست ناموفق بود";
      if (err instanceof ApiError) msg = (err as { displayMessage?: string }).displayMessage ?? msg;
      else if (err instanceof Error) msg = err.message;
      window.toast?.({ title: "لغو ناموفق", msg, kind: "warn" });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <main data-screen-label="09 پیگیری درخواست">
      <section className="shell" style={{ padding: "72px 0 80px", maxWidth: 720, margin: "0 auto" }}>
        <span className="eyebrow">APPLICATION STATUS · وضعیت درخواست</span>
        <h1 className="h-display mt-4.5" style={{ fontSize: "clamp(30px, 4vw, 52px)" }}>
          پیگیری درخواست
        </h1>

        {loading ? (
          <div data-track-state="loading" style={{ marginTop: 32, color: "var(--fg-mute)" }}>
            در حال بارگذاری وضعیت…
          </div>
        ) : error ? (
          <div
            data-track-state="error"
            role="alert"
            style={{
              marginTop: 28,
              padding: 20,
              borderRadius: 14,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--fg)",
            }}
          >
            <p style={{ margin: 0 }}>{error}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button type="button" variant="primary" onClick={() => go("apply")}>
                ثبت درخواست جدید
              </Button>
              <Button type="button" variant="ghost" onClick={() => go("home")}>
                بازگشت به خانه
              </Button>
            </div>
          </div>
        ) : view ? (
          <div data-track-state="loaded" data-track-status={view.status}>
            {/* Header card */}
            <div
              style={{
                marginTop: 28,
                padding: 20,
                borderRadius: 16,
                background: "var(--surface)",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "var(--fg-mute)", fontSize: 12 }}>کد پیگیری</div>
                  <div data-track-reference style={{ fontFamily: "var(--mono, monospace)", fontWeight: 700, fontSize: 18 }}>
                    {view.reference}
                  </div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "var(--fg-mute)", fontSize: 12 }}>وضعیت</div>
                  <div
                    data-track-status-label
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color:
                        view.status === "REJECTED"
                          ? "var(--gold, #b45309)"
                          : view.status === "WITHDRAWN"
                            ? "var(--fg-mute)"
                            : "var(--cyan, #06b6d4)",
                    }}
                  >
                    {STATUS_FA[view.status] ?? view.status}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "grid", gap: 6, fontSize: 14 }}>
                <Row label="نام متقاضی" value={view.applicantFullName} />
                {view.type === "student" && view.programName && <Row label="برنامهٔ تحصیلی" value={view.programName} />}
                {view.type === "instructor" && view.departmentName && (
                  <Row label="گروه آموزشی" value={view.departmentName} />
                )}
                <Row label="ایمیل" value={view.applicantEmailMasked} ltr />
                {view.applicantPhoneMasked && <Row label="تلفن" value={view.applicantPhoneMasked} ltr />}
                <Row label="تاریخ ثبت" value={fmtDate(view.submittedAt)} />
                {view.decidedAt && <Row label="تاریخ تصمیم" value={fmtDate(view.decidedAt)} />}
              </div>
            </div>

            {/* Lifecycle stepper (happy path) or terminal banner */}
            {view.status in HAPPY_IDX ? (
              <ol
                data-track-stepper
                style={{
                  marginTop: 24,
                  display: "grid",
                  gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
                  gap: 6,
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {STEPS.map((s, i) => {
                  const cur = HAPPY_IDX[view.status];
                  const state = i < cur ? "done" : i === cur ? "current" : "upcoming";
                  return (
                    <li key={s.key} data-step={s.key} data-step-state={state} style={{ textAlign: "center" }}>
                      <div
                        aria-hidden
                        style={{
                          height: 6,
                          borderRadius: 4,
                          background:
                            state === "upcoming"
                              ? "var(--line)"
                              : state === "current"
                                ? "var(--cyan, #06b6d4)"
                                : "color-mix(in oklch, var(--cyan, #06b6d4) 55%, var(--surface))",
                        }}
                      />
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          fontWeight: state === "current" ? 700 : 500,
                          color: state === "upcoming" ? "var(--fg-mute)" : "var(--fg)",
                        }}
                      >
                        {s.label}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div
                data-track-terminal={view.status}
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 12,
                  textAlign: "center",
                  background:
                    view.status === "REJECTED"
                      ? "color-mix(in oklch, var(--gold, #b45309) 12%, var(--surface))"
                      : "var(--surface)",
                  border: "1px solid var(--line)",
                  color: "var(--fg-mute)",
                  fontSize: 14,
                }}
              >
                {view.status === "REJECTED"
                  ? "متأسفانه این درخواست پذیرفته نشد."
                  : "این درخواست لغو شده است."}
              </div>
            )}

            {/* Withdraw (the one applicant action) */}
            <div style={{ marginTop: 28 }}>
              {view.canWithdraw ? (
                confirming ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                      padding: 14,
                      borderRadius: 12,
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>از لغو این درخواست مطمئنید؟ این عمل بازگشت‌پذیر نیست.</span>
                    <Button
                      type="button"
                      variant="danger"
                      data-track-withdraw-confirm
                      loading={withdrawing}
                      disabled={withdrawing}
                      onClick={doWithdraw}
                    >
                      بله، لغو کن
                    </Button>
                    <Button type="button" variant="ghost" disabled={withdrawing} onClick={() => setConfirming(false)}>
                      انصراف
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" data-track-withdraw onClick={() => setConfirming(true)}>
                    لغو درخواست
                  </Button>
                )
              ) : (
                <p style={{ color: "var(--fg-mute)", fontSize: 13, margin: 0 }}>
                  در این وضعیت امکان لغو درخواست وجود ندارد.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
};

const Row: React.FC<{ label: string; value: string; ltr?: boolean }> = ({ label, value, ltr }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
    <span style={{ color: "var(--fg-mute)" }}>{label}</span>
    <span style={{ fontWeight: 500 }} dir={ltr ? "ltr" : undefined}>
      {value}
    </span>
  </div>
);

export default TrackPage;
