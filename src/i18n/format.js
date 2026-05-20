// =====================================================
// i18n format helpers — Phase 12.
// Wraps the unsafe `toLocaleDateString("fa-IR")` pattern.
// On modern Node/Chrome it returns Jalali. On older runtimes that
// silently fall back to Gregorian we still return a sane Persian
// numeral string instead of leaking a Gregorian date into the UI.
// =====================================================

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export const toFaDigits = (input) =>
  String(input ?? "").replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

const PERSIAN_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر",
  "مرداد",   "شهریور",   "مهر",   "آبان",
  "آذر",     "دی",       "بهمن",  "اسفند",
];

const isJalaliCalendarSupported = (() => {
  try {
    const fmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" });
    return /^[۰-۹0-9]+$/.test(fmt.format(new Date()).trim());
  } catch {
    return false;
  }
})();

// Gregorian-to-Jalali algorithm (works without ICU).
// Source: well-known fallback implementation; small enough to inline so
// the SPA doesn't pull in date-fns-jalali during Phase 12.
const gregToJalali = (gy, gm, gd) => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
};

const coerceDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const formatJalaliDate = (d, { withTime = false, monthAsName = true } = {}) => {
  const date = coerceDate(d);
  if (!date) return "—";
  if (isJalaliCalendarSupported) {
    const opts = monthAsName
      ? { year: "numeric", month: "long", day: "numeric" }
      : { year: "numeric", month: "2-digit", day: "2-digit" };
    const dateStr = new Intl.DateTimeFormat("fa-IR-u-ca-persian", opts).format(date);
    if (!withTime) return dateStr;
    const timeStr = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date);
    return `${dateStr} · ${timeStr}`;
  }
  const [jy, jm, jd] = gregToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const datePart = monthAsName
    ? `${toFaDigits(jd)} ${PERSIAN_MONTHS_FA[jm - 1]} ${toFaDigits(jy)}`
    : `${toFaDigits(jy)}/${toFaDigits(String(jm).padStart(2, "0"))}/${toFaDigits(String(jd).padStart(2, "0"))}`;
  if (!withTime) return datePart;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${datePart} · ${toFaDigits(hh)}:${toFaDigits(mm)}`;
};

export const formatNumberFa = (n, { unit = "" } = {}) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const str = toFaDigits(Number(n).toLocaleString("en-US"));
  return unit ? `${str} ${unit}` : str;
};

export const formatRelativeFa = (d) => {
  const date = coerceDate(d);
  if (!date) return "—";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "همین الان";
  if (diffMin < 60) return `${toFaDigits(diffMin)} دقیقه پیش`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${toFaDigits(diffHr)} ساعت پیش`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${toFaDigits(diffDay)} روز پیش`;
  return formatJalaliDate(date, { monthAsName: true });
};

export default formatJalaliDate;
