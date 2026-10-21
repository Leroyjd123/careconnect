/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** "Ravi Kumar" → "RK" */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

/**
 * All dates render in one fixed time zone so server HTML (Vercel runs in UTC) and the
 * browser agree. Change APP_TIME_ZONE if the clinic is elsewhere.
 */
export const APP_TIME_ZONE = "Asia/Kolkata";
const LOCALE = "en-IN";

/** 10:16 am */
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: APP_TIME_ZONE });
}

/** 12 Oct 2026 */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: APP_TIME_ZONE });
}

/** Calendar day in the app time zone, e.g. "2026-10-12". */
function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
}

function daysAgo(iso: string, now = new Date()) {
  const a = Date.parse(dayKey(new Date(iso)));
  const b = Date.parse(dayKey(now));
  return Math.round((b - a) / 86_400_000);
}

/** Inbox style: time today, "Yesterday", else "12 Oct". */
export function formatRelative(iso: string, now = new Date()) {
  const diff = daysAgo(iso, now);
  if (diff <= 0) return formatTime(iso);
  if (diff === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short", timeZone: APP_TIME_ZONE });
}

/** Chat day divider: "Today", "Yesterday", "Mon, 12 Oct". */
export function formatDay(iso: string, now = new Date()) {
  const diff = daysAgo(iso, now);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short", timeZone: APP_TIME_ZONE });
}

/** True when two timestamps fall on different days (where a chat divider goes). */
export function isNewDay(prevIso: string | null, iso: string) {
  return !prevIso || dayKey(new Date(prevIso)) !== dayKey(new Date(iso));
}

/** 2516582 → "2.4 MB" */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Indian mobile numbers to one form: +91 and 10 digits. Accepts spaces, dashes, a leading 0 or 91.
 * Returns null when it isn't a plausible number.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length !== 10 || !/^[6-9]/.test(digits)) return null;
  return `+91${digits}`;
}
