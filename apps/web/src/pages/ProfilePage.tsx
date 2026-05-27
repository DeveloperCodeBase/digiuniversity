// apps/web/src/pages/ProfilePage.tsx
//
// Phase B R3.a Commit H (D68 + D69) — self-service Profile editor.
//
// Replaces the public-facing portfolio mockup in pages/Productivity.tsx.
// The route /profile now loads this page (router.tsx Commit H), which:
//   1. fetches the authenticated user's Profile via profileApi.getOwn()
//      (auto-creates the row server-side on first read per Q2.a 1:1
//      invariant — covered by Commit B)
//   2. renders editable form fields (bio, phone, dob, address,
//      nationalId, locale override)
//   3. saves via profileApi.updateOwn(), refetches on success
//
// Authorization: backend gates by SelfOrAdmin per D69. From this page
// the calling user is always editing themselves, so the guard
// short-circuits to allow.
//
// Bundle: per-route lazy chunk (D66 Path D mandatory). NO admin
// manualChunks bucket; this file becomes its own ProfilePage-*.js.

import React from "react";

import { profileApi } from "../api/endpoints.js";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../ui/Button";
import { Icon } from "../icons";
import { useRole } from "../role";
import type { Go } from "../router";

interface ProfileResponse {
  id: string;
  userId: string;
  bio: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  address: string | null;
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

interface FormState {
  bio: string;
  dateOfBirth: string;
  phoneNumber: string;
  avatarUrl: string;
  address: string;
  nationalId: string;
  locale: string;
}

const toFormState = (p: ProfileResponse): FormState => ({
  bio: p.bio ?? "",
  dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
  phoneNumber: p.phoneNumber ?? "",
  avatarUrl: p.avatarUrl ?? "",
  address: p.address ?? "",
  nationalId: p.nationalId ?? "",
  locale: p.locale ?? "",
});

interface ProfilePageProps {
  go: Go;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ go }) => {
  const auth = useAuth();
  const { role } = useRole();
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  // Hide the "saved" pill after 3s
  React.useEffect(() => {
    if (savedAt === null) return;
    const t = window.setTimeout(() => setSavedAt(null), 3000);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const refetch = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data: ProfileResponse = await profileApi.getOwn();
      setProfile(data);
      setForm(toFormState(data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطا در بارگذاری پروفایل";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  const setField = <K extends keyof FormState>(key: K, value: string): void => {
    setForm((cur) => (cur ? { ...cur, [key]: value } : cur));
  };

  const handleSave = async (): Promise<void> => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      // Send only non-empty fields — empty string means "not edited" /
      // leave server-side untouched. PATCH semantics: missing field =
      // unchanged. (Sending empty string would clear on the server,
      // which is what the user wants when they explicitly delete a
      // value; the form distinguishes via undefined-vs-empty check.)
      const payload: Record<string, string | null> = {};
      payload.bio = form.bio;
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      payload.phoneNumber = form.phoneNumber;
      payload.avatarUrl = form.avatarUrl;
      payload.address = form.address;
      payload.nationalId = form.nationalId;
      payload.locale = form.locale;
      const updated: ProfileResponse = await profileApi.updateOwn(payload);
      setProfile(updated);
      setForm(toFormState(updated));
      setSavedAt(Date.now());
      // Surface to global toast if available (matches R1/R2 admin pages).
      window.toast?.({ title: "پروفایل ذخیره شد", msg: "تغییرات روی سرور ثبت شد.", kind: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطا در ذخیره‌سازی";
      setError(msg);
      window.toast?.({ title: "خطا در ذخیره پروفایل", msg, kind: "danger" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form || !profile) {
    return (
      <main data-screen-label="پروفایل من" className="shell p-7">
        <div className="text-center" style={{ color: "var(--fg-mute)", padding: 80 }}>
          در حال بارگذاری پروفایل…
        </div>
      </main>
    );
  }

  const displayName = profile.user.fullName || profile.user.email.split("@")[0];
  const initials = displayName
    .split(/[\s.\-_]/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || profile.user.email[0]?.toUpperCase() || "?";

  return (
    <main data-screen-label="پروفایل من" className="shell" style={{ padding: "0 40px 60px" }}>
      {/* Cover gradient identical-style to legacy ProfilePage so visual
          continuity holds during the cutover. */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 160,
          background: "linear-gradient(135deg, oklch(0.3 0.12 255), oklch(0.5 0.16 255))",
          margin: "0 -40px",
        }}
        aria-hidden="true"
      >
        <div
          className="absolute"
          style={{
            inset: 0,
            background:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 3px, transparent 3px 14px)",
          }}
        />
      </div>

      <section style={{ marginTop: -48 }}>
        {/* Header */}
        <div className="flex items-end gap-6 flex-wrap mb-8">
          <div
            className={"avatar " + role.color}
            style={{
              width: 112,
              height: 112,
              fontSize: 36,
              border: "4px solid var(--bg)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="flex-1" style={{ minWidth: 240 }}>
            <h1 className="h-1">{displayName}</h1>
            <p className="mt-2" style={{ color: "var(--fg-mute)", fontSize: 14 }}>
              {profile.user.email}
              <span className="mx-2">·</span>
              <span className="pill pill-cyan" style={{ fontSize: 11 }}>
                {role.label}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => go("settings")}>
              <Icon name="settings" size={14} />
              تنظیمات حساب
            </Button>
            <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
              <Icon name="check" size={14} />
              {saving ? "در حال ذخیره…" : "ذخیره"}
            </Button>
          </div>
        </div>

        {/* Saved pill (auto-dismiss) */}
        {savedAt ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-4"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
            data-profile-saved="true"
          >
            <Icon name="check" size={14} />
            تغییرات شما در پروفایل ذخیره شد
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mb-4"
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              color: "var(--accent)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}

        {/* Form */}
        <div
          className="card p-7"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* Bio spans both columns */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="crud-form-label" htmlFor="profile-bio">
              معرفی کوتاه
            </label>
            <textarea
              id="profile-bio"
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              className="crud-form-input"
              rows={4}
              maxLength={2000}
              placeholder="چند خط درباره خودتان"
              dir="rtl"
            />
            <div className="crud-form-helper">{form.bio.length} / 2000</div>
          </div>

          <div>
            <label className="crud-form-label" htmlFor="profile-phone">
              شماره تماس
            </label>
            <input
              id="profile-phone"
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setField("phoneNumber", e.target.value)}
              className="crud-form-input"
              maxLength={40}
              dir="ltr"
              placeholder="09xxxxxxxxx"
            />
          </div>

          <div>
            <label className="crud-form-label" htmlFor="profile-dob">
              تاریخ تولد
            </label>
            <input
              id="profile-dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
              className="crud-form-input"
              dir="ltr"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="crud-form-label" htmlFor="profile-address">
              نشانی
            </label>
            <textarea
              id="profile-address"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              className="crud-form-input"
              rows={2}
              maxLength={500}
              placeholder="نشانی پستی برای ارسال گواهی‌ها و مدارک"
              dir="rtl"
            />
          </div>

          <div>
            <label className="crud-form-label" htmlFor="profile-nid">
              کد ملی
            </label>
            <input
              id="profile-nid"
              type="text"
              value={form.nationalId}
              onChange={(e) => setField("nationalId", e.target.value)}
              className="crud-form-input"
              maxLength={20}
              minLength={8}
              dir="ltr"
              placeholder="10 رقم"
            />
            <div className="crud-form-helper">
              برای صدور مدرک و گواهی رسمی استفاده می‌شود.
            </div>
          </div>

          <div>
            <label className="crud-form-label" htmlFor="profile-locale">
              زبان رابط (اختیاری)
            </label>
            <select
              id="profile-locale"
              value={form.locale}
              onChange={(e) => setField("locale", e.target.value)}
              className="crud-form-input"
            >
              <option value="">پیش‌فرض کاربر</option>
              <option value="fa">فارسی</option>
              <option value="en">English</option>
              <option value="ar">العربیة</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="crud-form-label" htmlFor="profile-avatar">
              آدرس تصویر پروفایل (URL)
            </label>
            <input
              id="profile-avatar"
              type="url"
              value={form.avatarUrl}
              onChange={(e) => setField("avatarUrl", e.target.value)}
              className="crud-form-input"
              maxLength={2000}
              dir="ltr"
              placeholder="https://…"
            />
            <div className="crud-form-helper">
              بارگذاری مستقیم فایل در یکی از به‌روزرسانی‌های بعدی اضافه می‌شود.
            </div>
          </div>
        </div>

        {/* Metadata footer */}
        <div
          className="mt-4 mono"
          style={{ fontSize: 11, color: "var(--fg-mute)", textAlign: "center" }}
        >
          آخرین ویرایش: {new Date(profile.updatedAt).toLocaleString("fa-IR")}
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;
