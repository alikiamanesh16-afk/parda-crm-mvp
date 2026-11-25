// ─── Formatting helpers (Persian locale) ──────────────────────────────────────

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFaDigits(s: string | number): string {
  return String(s).replace(/\d/g, (d) => FA_DIGITS[+d]);
}

/** 'YYYY-MM-DD HH:MM' (Gregorian) → '۱۴ آبان ۱۴۰۵، ۱۴:۳۰' (Jalali). */
export function formatJalali(at: string | null | undefined): string {
  if (!at) return '—';
  const [datePart, timePart = ''] = at.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return at;
  const [jy, jm, jd] = gregorianToJalali(y, m, d);
  const base = `${jd} ${MONTHS[jm - 1]} ${jy}`;
  const time = timePart.slice(0, 5);
  return toFaDigits(time ? `${base}، ${time}` : base);
}

const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/**
 * Replace ISO dates/times inside free Persian text with Jalali.
 * Handles both ASCII digits and Persian digits (the export uses ۰-۹).
 * Fixes BiDi scrambling of '2026-10-17' patterns and reads naturally.
 */
export function convertIsoDatesInText(text: string | undefined | null): string {
  if (!text) return '';
  const ascii = /\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?/g;
  const persian = /[۰-۹]{4}-[۰-۹]{2}-[۰-۹]{2}( [۰-۹]{2}:[۰-۹]{2})?/g;
  return text
    .replace(ascii, (iso) => formatJalali(iso))
    .replace(persian, (iso) => formatJalali(toEnDigits(iso)));
}

function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/** Compact date for chat bubbles: '۱۴ آبان' or '۱۴ آبان، ۰۹:۰۰'. */
export function formatJalaliShort(at: string): string {
  if (!at) return '';
  const [datePart, timePart = ''] = at.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return at;
  const [, jm, jd] = gregorianToJalali(y, m, d);
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];
  const base = `${jd} ${months[jm - 1]}`;
  const time = timePart.slice(0, 5);
  return toFaDigits(time ? `${base}، ${time}` : base);
}

export function formatJalaliDay(at: string): string {
  const [datePart] = at.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return at;
  const [jy, jm, jd] = gregorianToJalali(y, m, d);
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];
  return toFaDigits(`${jd} ${months[jm - 1]} ${jy}`);
}

/** '۱۴ آبان، ۰۹:۰۰' → '۰۹:۰۰' fallback: returns HH:MM part in Persian digits. */
export function formatTime(at: string): string {
  const timePart = at.split(' ')[1] ?? '';
  return toFaDigits(timePart.slice(0, 5)) || '—';
}

/** 1234567 → '۱٬۲۳۴٬۵۶۷ تومان' */
export function formatToman(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return toFaDigits(n.toLocaleString('en-US').replace(/,/g, '٬')) + ' تومان';
}

// ─── Gregorian → Jalali conversion (standard algorithm, no dependency) ────────
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
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
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}
