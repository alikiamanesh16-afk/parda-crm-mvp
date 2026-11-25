import type { CrmEvent, HistoryEntry } from '../types';

// ─── Unified timeline: history entries + events, merged chronologically ──────

export type TimelineKind = 'history' | 'event';

export interface TimelineItem {
  key: string;
  at: string; // 'YYYY-MM-DD HH:MM' ('' if unknown)
  kind: TimelineKind;
  text?: string; // history summary
  eventType?: CrmEvent['eventType'];
  detail?: string;
  amountToman?: number | null;
}

export function mergeTimeline(history: HistoryEntry[], events: CrmEvent[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  history.forEach((h, i) => {
    items.push({ key: `h-${i}-${h.at}`, at: h.at, kind: 'history', text: h.text });
  });

  events.forEach((e) => {
    items.push({
      key: `e-${e.eventId || e.at}-${e.eventType}`,
      at: e.at,
      kind: 'event',
      eventType: e.eventType,
      detail: e.detail,
      amountToman: e.amountToman,
    });
  });

  items.sort((a, b) => {
    const ta = a.at || '9999';
    const tb = b.at || '9999';
    if (ta !== tb) return ta.localeCompare(tb);
    return a.kind === b.kind ? 0 : a.kind === 'history' ? -1 : 1;
  });

  return items;
}

export const EVENT_META: Record<string, { icon: string; label: string; cls: string }> = {
  signed_up:        { icon: '✏️', label: 'ثبت‌نام',             cls: 'ev-signed' },
  page_connected:   { icon: '🔗', label: 'اتصال اینستاگرام',     cls: 'ev-connected' },
  stage_changed:    { icon: '🔀', label: 'تغییر مرحله',          cls: 'ev-stage' },
  order_paid:       { icon: '🛒', label: 'سفارش پرداخت‌شده',     cls: 'ev-order' },
  payout_requested: { icon: '🏦', label: 'درخواست تسویه',        cls: 'ev-payout-req' },
  payout_paid:      { icon: '✅', label: 'تسویه پرداخت‌شده',      cls: 'ev-payout' },
};
