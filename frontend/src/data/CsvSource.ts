import Papa from 'papaparse';
import type {
  Contact,
  ContactDetail,
  CrmEvent,
  EventType,
  HistoryEntry,
  Message,
  MessageDirection,
} from '../types';
import type { DataSource } from './DataSource';
import { CSV_URL } from '../config';

// ─── CSV-backed DataSource (MVP phase 1) ──────────────────────────────────────
// Loads the whole export once, indexes it by contact_id, and serves
// listContacts / getContactDetail from memory.

interface RawRow {
  record_type: string;
  contact_id: string;
  ig_username: string;
  shop_name: string;
  phone: string;
  at: string;
  page_connected: string;
  page_connected_at: string;
  funnel_stage: string;
  funnel_stage_label: string;
  funnel_stage_at: string;
  first_contact_at: string;
  last_contact_at: string;
  message_count: string;
  history_summary: string;
  overall_summary: string;
  open_issues: string;
  message_id: string;
  direction: string;
  sender: string;
  channel: string;
  text: string;
  event_id: string;
  event_type: string;
  detail: string;
  amount_toman: string;
}

const EVENT_TYPES: EventType[] = [
  'signed_up',
  'page_connected',
  'stage_changed',
  'order_paid',
  'payout_requested',
  'payout_paid',
];

function byTime(a: { at: string }, b: { at: string }): number {
  return a.at.localeCompare(b.at);
}

export class CsvSource implements DataSource {
  private loading: Promise<void> | null = null;
  private contacts = new Map<string, Contact>();
  private details = new Map<string, { messages: Message[]; events: CrmEvent[]; history: HistoryEntry[] }>();

  private ensureLoaded(): Promise<void> {
    if (!this.loading) {
      this.loading = fetch(CSV_URL)
        .then((r) => {
          if (!r.ok) throw new Error(`CSV load failed: ${r.status}`);
          return r.text();
        })
        .then((text) => this.parse(text));
    }
    return this.loading;
  }

  private parse(text: string): void {
    const parsed = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    for (const row of parsed.data) {
      if (!row || !row.contact_id) continue;
      const cid = row.contact_id;

      switch (row.record_type) {
        case 'contact': {
          this.contacts.set(cid, {
            contactId: cid,
            igUsername: row.ig_username?.trim() ?? '',
            shopName: row.shop_name?.trim() ?? '',
            phone: row.phone?.trim() ?? '',
            pageConnected: row.page_connected === 'yes',
            pageConnectedAt: row.page_connected_at || null,
            funnelStage: row.funnel_stage?.trim() ?? '',
            funnelStageLabel: row.funnel_stage_label?.trim() ?? '',
            funnelStageAt: row.funnel_stage_at || null,
            firstContactAt: row.first_contact_at || null,
            lastContactAt: row.last_contact_at || null,
            messageCount: parseInt(row.message_count, 10) || 0,
            historySummary: row.history_summary?.trim() ?? '',
            overallSummary: row.overall_summary?.trim() ?? '',
            openIssues: row.open_issues?.trim() ?? '',
          });
          break;
        }
        case 'message': {
          const bucket = this.bucket(cid);
          bucket.messages.push({
            messageId: row.message_id,
            at: row.at,
            direction: (row.direction as MessageDirection) === 'outbound' ? 'outbound' : 'inbound',
            sender: row.sender,
            channel: row.channel,
            text: row.text ?? '',
          });
          break;
        }
        case 'event': {
          const bucket = this.bucket(cid);
          const et = EVENT_TYPES.includes(row.event_type as EventType)
            ? (row.event_type as EventType)
            : 'stage_changed';
          bucket.events.push({
            eventId: row.event_id,
            at: row.at,
            eventType: et,
            detail: row.detail ?? '',
            amountToman: row.amount_toman ? parseInt(row.amount_toman, 10) : null,
          });
          break;
        }
        case 'history': {
          const bucket = this.bucket(cid);
          bucket.history.push({ at: row.at, text: row.text ?? '' });
          break;
        }
      }
    }

    for (const b of this.details.values()) {
      b.messages.sort(byTime);
      b.events.sort(byTime);
      b.history.sort(byTime);
    }
  }

  private bucket(cid: string) {
    let b = this.details.get(cid);
    if (!b) {
      b = { messages: [], events: [], history: [] };
      this.details.set(cid, b);
    }
    return b;
  }

  async listContacts(): Promise<Contact[]> {
    await this.ensureLoaded();
    return [...this.contacts.values()].sort((a, b) => a.contactId.localeCompare(b.contactId, 'fa', { numeric: true }));
  }

  async getContactDetail(contactId: string): Promise<ContactDetail> {
    await this.ensureLoaded();
    const contact = this.contacts.get(contactId);
    if (!contact) throw new Error(`contact ${contactId} not found`);
    const b = this.bucket(contactId);
    return {
      contact,
      messages: b.messages,
      events: b.events,
      // In this export format, per-day history lives on the contact record as
      // 'YYYY-MM-DD HH:MM — text' lines inside history_summary.
      history: parseHistoryLines(contact.historySummary),
    };
  }
}

// Parses 'YYYY-MM-DD HH:MM — text' lines (em-dash separated) from the export.
export function parseHistoryLines(raw: string): HistoryEntry[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // '2026-10-17 17:00 — متن' → at + text
      const m = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*[—–-]\s*(.*)$/);
      if (m) return { at: m[1], text: m[2] };
      return { at: '', text: line };
    });
}
