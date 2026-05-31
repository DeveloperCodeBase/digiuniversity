// =====================================================
// Phase B R6 (D80–D82) — public applicant self-service: the /apply form.
//
// First anon *writable* route. Classified PUBLIC (route-classification.ts)
// so the AppShell auth gate never fires — no login required. AppShell
// supplies the public Nav + Footer; this page renders only the form.
//
// Two variants (Q4.a): student (program picker from the public catalog
// endpoint, D82) + instructor (free-text department preference + rank +
// expertise + CV). Both POST anon via publicApi. On success the
// confirmation (Q5.a) shows the reference + the /track?token= link (the
// applicant's bearer capability, D80) + a what-happens-next timeline.
// =====================================================
import React from "react";
import { useNavigate } from "react-router-dom";

import type { Go } from "../router";
import { Button, Input, Textarea, Label, cn } from "../ui";
import { studentApplicationsApi, instructorApplicationsApi, publicCatalogApi } from "../api/endpoints.js";
import { ApiError } from "../api/client.js";

// Single-tenant deploy: the applicant never sees a tenant chooser. Mirrors
// the login page default (Auth.tsx). A future multi-tenant build can lift
// this into a field / subdomain resolver.
const TENANT_SLUG = "demo";

type Variant = "student" | "instructor";

interface PublicProgram {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  degreeLevel: string;
  department: { name: string } | null;
}

const DEGREE_FA: Record<string, string> = {
  bachelor: "کارشناسی",
  master: "کارشناسی ارشد",
  phd: "دکتری",
  certificate: "گواهی",
};

const RANKS: { value: string; label: string }[] = [
  { value: "ASSISTANT", label: "استادیار" },
  { value: "ASSOCIATE", label: "دانشیار" },
  { value: "FULL", label: "استاد تمام" },
  { value: "EMERITUS", label: "استاد بازنشسته (Emeritus)" },
];

const TIMELINE: { t: string; d: string }[] = [
  { t: "ثبت درخواست", d: "درخواست شما ثبت و کد پیگیری صادر شد." },
  { t: "بررسی کارشناسی", d: "تیم پذیرش ظرف حدود ۱۴ روز درخواست را بررسی می‌کند." },
  { t: "احراز ایمیل و تلفن", d: "در صورت نیاز، اطلاعات تماس شما تأیید می‌شود." },
  { t: "تصمیم نهایی", d: "نتیجه از طریق همین صفحهٔ پیگیری و ایمیل اعلام می‌شود." },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ApplyResult {
  type: Variant;
  reference: string;
  token: string;
  idempotent: boolean;
}

/** Derive the human-friendly reference shown to the applicant. Mirrors the
 *  API's deriveApplicationReference (APP- + last 6 of id, uppercased). */
function deriveReference(id: string): string {
  return `APP-${String(id).slice(-6).toUpperCase()}`;
}

interface ApplyPageProps {
  go: Go;
}

const fieldGap: React.CSSProperties = { display: "grid", gap: 6, marginBottom: 16 };

export const ApplyPage: React.FC<ApplyPageProps> = ({ go }) => {
  const navigate = useNavigate();

  // Initial variant from ?type= (so a future "apply as instructor" link
  // can deep-link the right tab). Defaults to student.
  const initialVariant: Variant =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("type") === "instructor"
      ? "instructor"
      : "student";

  const [variant, setVariant] = React.useState<Variant>(initialVariant);

  // Shared fields.
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [bio, setBio] = React.useState("");

  // Student-only.
  const [programId, setProgramId] = React.useState("");
  const [programs, setPrograms] = React.useState<PublicProgram[]>([]);
  const [programsLoading, setProgramsLoading] = React.useState(true);
  const [programsError, setProgramsError] = React.useState<string | null>(null);

  // Instructor-only.
  const [preferredDept, setPreferredDept] = React.useState("");
  const [desiredRank, setDesiredRank] = React.useState("");
  const [expertise, setExpertise] = React.useState("");
  const [cvUrl, setCvUrl] = React.useState("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ApplyResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Load the public program catalog once (student picker).
  React.useEffect(() => {
    let alive = true;
    setProgramsLoading(true);
    publicCatalogApi
      .listPrograms(TENANT_SLUG)
      .then((rows: PublicProgram[]) => {
        if (!alive) return;
        setPrograms(Array.isArray(rows) ? rows : []);
        setProgramsError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg =
          err instanceof ApiError
            ? ((err as { displayMessage?: string }).displayMessage ?? "خطا در دریافت فهرست برنامه‌ها")
            : "خطا در دریافت فهرست برنامه‌ها";
        setProgramsError(msg);
      })
      .finally(() => {
        if (alive) setProgramsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = "نام و نام خانوادگی الزامی است.";
    else if (fullName.trim().length > 160) e.fullName = "نام بیش از حد طولانی است.";
    if (!email.trim()) e.email = "ایمیل الزامی است.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "فرمت ایمیل صحیح نیست.";
    if (phone.trim() && phone.trim().length > 40) e.phone = "شمارهٔ تماس نامعتبر است.";
    if (nationalId.trim() && (nationalId.trim().length < 8 || nationalId.trim().length > 20))
      e.nationalId = "کد ملی باید بین ۸ تا ۲۰ رقم باشد.";
    if (bio.trim().length > 2000) e.bio = "توضیحات حداکثر ۲۰۰۰ کاراکتر.";
    if (variant === "student" && !programId) e.programId = "انتخاب برنامهٔ تحصیلی الزامی است.";
    if (variant === "instructor") {
      if (cvUrl.trim() && !/^https?:\/\/.+/i.test(cvUrl.trim())) e.cvUrl = "نشانی رزومه باید با http(s) شروع شود.";
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent): Promise<void> => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      window.toast?.({ title: "بازبینی فرم", msg: Object.values(errs)[0] ?? "ورودی نامعتبر است.", kind: "warn" });
      return;
    }
    setSubmitting(true);
    try {
      const shared = {
        tenantSlug: TENANT_SLUG,
        applicantFullName: fullName.trim(),
        applicantEmail: email.trim().toLowerCase(),
        applicantPhone: phone.trim() || undefined,
        applicantNationalId: nationalId.trim() || undefined,
        applicantBio: bio.trim() || undefined,
      };

      let row: { id: string; trackingToken?: string; _idempotent?: boolean };
      if (variant === "student") {
        row = await studentApplicationsApi.publicSubmit({ ...shared, programId });
      } else {
        const expertiseList = expertise
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20);
        row = await instructorApplicationsApi.publicSubmit({
          ...shared,
          preferredDepartmentSlug: preferredDept.trim() || undefined,
          desiredRank: desiredRank || undefined,
          expertise: expertiseList.length ? expertiseList : undefined,
          cvUrl: cvUrl.trim() || undefined,
        });
      }

      if (!row?.trackingToken) {
        // Defensive: backend always mints one (D80). If absent, send the
        // applicant to login/contact rather than a broken /track link.
        throw new Error("کد پیگیری دریافت نشد. لطفاً با پشتیبانی تماس بگیرید.");
      }

      setResult({
        type: variant,
        reference: deriveReference(row.id),
        token: row.trackingToken,
        idempotent: Boolean(row._idempotent),
      });
      try {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      } catch {
        window.scrollTo(0, 0);
      }
    } catch (err) {
      let msg = "خطای ناشناخته در ثبت درخواست";
      if (err instanceof ApiError) msg = (err as { displayMessage?: string }).displayMessage ?? msg;
      else if (err instanceof Error) msg = err.message;
      setErrors({ general: msg });
      window.toast?.({ title: "ثبت ناموفق", msg, kind: "warn" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Confirmation view (Q5.a) ----
  if (result) {
    const trackPath = `/track?token=${encodeURIComponent(result.token)}&type=${result.type}`;
    const trackUrl = (typeof window !== "undefined" ? window.location.origin : "") + trackPath;
    const copy = async (): Promise<void> => {
      try {
        await navigator.clipboard.writeText(trackUrl);
        setCopied(true);
        window.toast?.({ title: "کپی شد", msg: "پیوند پیگیری در حافظه کپی شد.", kind: "success" });
        window.setTimeout(() => setCopied(false), 2500);
      } catch {
        window.toast?.({ title: "کپی نشد", msg: "لطفاً پیوند را دستی انتخاب و کپی کنید.", kind: "warn" });
      }
    };

    return (
      <main data-screen-label="08 درخواست — تأیید">
        <section className="shell" style={{ padding: "72px 0 24px", maxWidth: 760, margin: "0 auto" }}>
          <span className="eyebrow">APPLICATION RECEIVED · ثبت شد</span>
          <h1 className="h-display mt-4.5" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
            {result.idempotent ? "درخواست شما از قبل ثبت شده بود" : "درخواست شما ثبت شد"}
          </h1>
          <p className="lead" style={{ marginTop: 16 }}>
            کد پیگیری شما: <b style={{ fontFamily: "var(--mono, monospace)" }}>{result.reference}</b>
          </p>

          <div
            style={{
              marginTop: 28,
              padding: 20,
              borderRadius: 16,
              background: "var(--surface)",
              border: "1px solid var(--line)",
            }}
          >
            <Label htmlFor="track-link">پیوند پیگیری وضعیت — این را ذخیره کنید</Label>
            <p style={{ color: "var(--fg-mute)", fontSize: 13, margin: "6px 0 12px" }}>
              با این پیوند می‌توانید وضعیت درخواست را ببینید و در صورت نیاز آن را لغو کنید. پس از
              راه‌اندازی اعلان‌ها، همین پیوند به ایمیل شما نیز ارسال می‌شود.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Input
                id="track-link"
                readOnly
                value={trackUrl}
                dir="ltr"
                onFocus={(e) => e.currentTarget.select()}
                style={{ flex: 1, minWidth: 240, fontFamily: "var(--mono, monospace)", fontSize: 12 }}
              />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? "کپی شد ✓" : "کپی پیوند"}
              </Button>
              <Button type="button" variant="primary" onClick={() => navigate(trackPath)}>
                مشاهدهٔ وضعیت
              </Button>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>مراحل بعدی</h2>
            <ol style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
              {TIMELINE.map((s, i) => (
                <li key={s.t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background: i === 0 ? "var(--cyan, #06b6d4)" : "var(--surface-2, var(--surface))",
                      color: i === 0 ? "#fff" : "var(--fg-mute)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.t}</div>
                    <div style={{ color: "var(--fg-mute)", fontSize: 13 }}>{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button type="button" variant="ghost" onClick={() => go("home")}>
              بازگشت به خانه
            </Button>
          </div>
        </section>
      </main>
    );
  }

  // ---- Form view ----
  const tabBtn = (v: Variant, label: string): React.ReactElement => (
    <button
      type="button"
      role="tab"
      aria-selected={variant === v}
      onClick={() => {
        setVariant(v);
        setErrors({});
      }}
      className={cn(
        "min-h-[44px] px-5 py-2.5 rounded-[var(--r)] text-sm font-medium transition-colors",
        variant === v
          ? "bg-[color:var(--cyan,#06b6d4)] text-white"
          : "bg-[color:var(--surface)] text-[color:var(--fg-mute)] border border-[color:var(--line)]",
      )}
    >
      {label}
    </button>
  );

  return (
    <main data-screen-label="08 درخواست">
      <section style={{ padding: "72px 0 28px", borderBottom: "1px solid var(--line)" }}>
        <div className="shell text-center">
          <span className="eyebrow justify-center">ADMISSIONS · درخواست پذیرش</span>
          <h1 className="h-display mt-4.5" style={{ fontSize: "clamp(34px, 4.5vw, 64px)" }}>
            درخواست خود را ثبت کنید
          </h1>
          <p className="lead" style={{ margin: "18px auto 0", maxWidth: 620 }}>
            بدون نیاز به ورود. فرم را پر کنید، کد پیگیری بگیرید و وضعیت درخواست را هر زمان دنبال کنید.
          </p>
        </div>
      </section>

      <section className="shell" style={{ padding: "32px 0 80px", maxWidth: 760, margin: "0 auto" }}>
        {/* Variant tabs */}
        <div role="tablist" aria-label="نوع درخواست" style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
          {tabBtn("student", "دانشجو")}
          {tabBtn("instructor", "مدرس / هیئت علمی")}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Student: program picker */}
          {variant === "student" && (
            <div style={fieldGap}>
              <Label htmlFor="programId" required>
                برنامهٔ تحصیلی
              </Label>
              {programsLoading ? (
                <div style={{ color: "var(--fg-mute)", fontSize: 14 }}>در حال بارگذاری برنامه‌ها…</div>
              ) : programsError ? (
                <div style={{ color: "var(--gold, #b45309)", fontSize: 14 }}>{programsError}</div>
              ) : programs.length === 0 ? (
                <div style={{ color: "var(--fg-mute)", fontSize: 14 }}>
                  در حال حاضر برنامهٔ فعالی برای پذیرش وجود ندارد.
                </div>
              ) : (
                <select
                  id="programId"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  aria-invalid={errors.programId ? true : undefined}
                  className="block w-full min-h-[44px] px-3.5 py-2.5 bg-[color:var(--surface)] text-[color:var(--fg)] border border-[color:var(--line-2)] rounded-[var(--r)] text-[14px]"
                >
                  <option value="">— انتخاب کنید —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.degreeLevel ? ` — ${DEGREE_FA[p.degreeLevel] ?? p.degreeLevel}` : ""}
                      {p.department?.name ? ` (${p.department.name})` : ""}
                    </option>
                  ))}
                </select>
              )}
              {errors.programId && <FieldError id="err-programId">{errors.programId}</FieldError>}
            </div>
          )}

          {/* Instructor: department preference + rank */}
          {variant === "instructor" && (
            <>
              <div style={fieldGap}>
                <Label htmlFor="preferredDept">گروه آموزشی مورد علاقه (اختیاری)</Label>
                <Input
                  id="preferredDept"
                  value={preferredDept}
                  onChange={(e) => setPreferredDept(e.target.value)}
                  placeholder="مثلاً: مهندسی کامپیوتر"
                  maxLength={64}
                />
              </div>
              <div style={fieldGap}>
                <Label htmlFor="desiredRank">مرتبهٔ علمی مورد نظر (اختیاری)</Label>
                <select
                  id="desiredRank"
                  value={desiredRank}
                  onChange={(e) => setDesiredRank(e.target.value)}
                  className="block w-full min-h-[44px] px-3.5 py-2.5 bg-[color:var(--surface)] text-[color:var(--fg)] border border-[color:var(--line-2)] rounded-[var(--r)] text-[14px]"
                >
                  <option value="">— انتخاب کنید —</option>
                  {RANKS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Shared identity fields */}
          <div style={fieldGap}>
            <Label htmlFor="fullName" required>
              نام و نام خانوادگی
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              invalid={Boolean(errors.fullName)}
              describedBy={errors.fullName ? "err-fullName" : undefined}
              maxLength={160}
              autoComplete="name"
            />
            {errors.fullName && <FieldError id="err-fullName">{errors.fullName}</FieldError>}
          </div>

          <div style={fieldGap}>
            <Label htmlFor="email" required>
              ایمیل
            </Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(errors.email)}
              describedBy={errors.email ? "err-email" : undefined}
              maxLength={160}
              autoComplete="email"
              placeholder="you@example.com"
            />
            {errors.email && <FieldError id="err-email">{errors.email}</FieldError>}
          </div>

          <div style={fieldGap}>
            <Label htmlFor="phone">شمارهٔ تماس (اختیاری)</Label>
            <Input
              id="phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              invalid={Boolean(errors.phone)}
              describedBy={errors.phone ? "err-phone" : undefined}
              maxLength={40}
              autoComplete="tel"
              placeholder="09…"
            />
            {errors.phone && <FieldError id="err-phone">{errors.phone}</FieldError>}
          </div>

          <div style={fieldGap}>
            <Label htmlFor="nationalId">کد ملی (اختیاری)</Label>
            <Input
              id="nationalId"
              dir="ltr"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              invalid={Boolean(errors.nationalId)}
              describedBy={errors.nationalId ? "err-nationalId" : undefined}
              maxLength={20}
            />
            {errors.nationalId && <FieldError id="err-nationalId">{errors.nationalId}</FieldError>}
          </div>

          {/* Instructor: expertise + CV */}
          {variant === "instructor" && (
            <>
              <div style={fieldGap}>
                <Label htmlFor="expertise">حوزه‌های تخصص (با کاما جدا کنید)</Label>
                <Input
                  id="expertise"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="یادگیری ماشین، شبکه، پایگاه داده"
                />
              </div>
              <div style={fieldGap}>
                <Label htmlFor="cvUrl">نشانی رزومه / CV (اختیاری)</Label>
                <Input
                  id="cvUrl"
                  dir="ltr"
                  value={cvUrl}
                  onChange={(e) => setCvUrl(e.target.value)}
                  invalid={Boolean(errors.cvUrl)}
                  describedBy={errors.cvUrl ? "err-cvUrl" : undefined}
                  placeholder="https://…"
                />
                {errors.cvUrl && <FieldError id="err-cvUrl">{errors.cvUrl}</FieldError>}
              </div>
            </>
          )}

          <div style={fieldGap}>
            <Label htmlFor="bio">دربارهٔ شما / انگیزه (اختیاری)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              invalid={Boolean(errors.bio)}
              describedBy={errors.bio ? "err-bio" : undefined}
              rows={4}
              maxLength={2000}
            />
            {errors.bio && <FieldError id="err-bio">{errors.bio}</FieldError>}
          </div>

          {errors.general && (
            <div role="alert" style={{ color: "var(--gold, #b45309)", fontSize: 14, marginBottom: 12 }}>
              {errors.general}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
              ثبت درخواست
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => go("home")} disabled={submitting}>
              انصراف
            </Button>
          </div>

          <p style={{ color: "var(--fg-mute)", fontSize: 12, marginTop: 16 }}>
            پس از ثبت، یک کد پیگیری و پیوند مشاهدهٔ وضعیت دریافت می‌کنید. تأیید ایمیل/تلفن در صورت
            نیاز توسط تیم پذیرش انجام می‌شود.
          </p>
        </form>
      </section>
    </main>
  );
};

const FieldError: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <span id={id} role="alert" style={{ color: "var(--gold, #b45309)", fontSize: 12.5 }}>
    {children}
  </span>
);

export default ApplyPage;
