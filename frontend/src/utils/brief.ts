import { convertIsoDatesInText } from './format';

// ─── Call brief: a few-line portrait of the seller, read during a call ────────
// Derived strictly from overall_summary bullets — nothing invented.
// Categories are matched by the bullet prefixes used in the export:
//   'فروشنده …' (identity), 'وضعیت فعلی …' (current state), 'درخواست‌های او …'

export interface CallBrief {
  identity: string | null;
  current: string | null;
  requests: string | null;
  all: string[];
}

/** First sentence of a bullet, capped at max chars. */
export function firstSentence(s: string, max = 160): string {
  const m = s.match(/^[^؛.!؟\n]+/);
  let t = (m ? m[0] : s).trim();
  if (t.length > max) t = t.slice(0, max).trimEnd() + '…';
  return t;
}

function cleanBullets(overallSummary: string): string[] {
  return overallSummary
    .split('\n')
    .map((l) => l.replace(/^[•·–-]\s*/, '').trim())
    .filter(Boolean)
    // hide internal funnel codes (S1..S6) from users
    .map((l) => l.replace(/در مرحلهٔ?\s*S\d[ab]?/g, '').replace(/مرحله\s*S\d[ab]?/g, ''))
    .map((l) => l.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);
}

export function buildCallBrief(overallSummary: string): CallBrief {
  const bullets = cleanBullets(overallSummary);
  const find = (prefix: string) => bullets.find((b) => b.startsWith(prefix)) ?? null;

  const currentRaw = find('وضعیت');
  const requestsRaw = find('درخواست');
  const identityRaw = bullets[0] && !bullets[0].startsWith('وضعیت') ? bullets[0] : null;

  return {
    identity: identityRaw ? convertIsoDatesInText(firstSentence(identityRaw)) : null,
    current: currentRaw ? convertIsoDatesInText(firstSentence(currentRaw, 200)) : null,
    requests: requestsRaw ? convertIsoDatesInText(firstSentence(requestsRaw)) : null,
    all: bullets.map((b) => convertIsoDatesInText(firstSentence(b, 240))),
  };
}
