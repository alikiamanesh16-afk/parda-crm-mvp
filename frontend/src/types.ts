// ─── Domain models for Parda CRM MVP ─────────────────────────────────────────
// These types are UI-facing. Both CsvSource (now) and ApiSource (later) must
// produce these, so the UI never knows where data came from.

export interface Contact {
  contactId: string;
  igUsername: string;
  shopName: string;
  phone: string;
  pageConnected: boolean;
  pageConnectedAt: string | null; // 'YYYY-MM-DD HH:MM'
  funnelStage: string; // raw stage from data, e.g. 'S4'
  funnelStageLabel: string; // human label from data
  funnelStageAt: string | null;
  firstContactAt: string | null;
  lastContactAt: string | null;
  messageCount: number;
  historySummary: string; // raw 'YYYY-MM-DD HH:MM — text' lines from export
  overallSummary: string;
  openIssues: string;
}

export interface HistoryEntry {
  at: string; // 'YYYY-MM-DD HH:MM'
  text: string;
}

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  messageId: string;
  at: string;
  direction: MessageDirection;
  sender: string;
  channel: string; // instagram_dm_web | instagram_dm | sms | phone_call
  text: string;
}

export type EventType =
  | 'signed_up'
  | 'page_connected'
  | 'stage_changed'
  | 'order_paid'
  | 'payout_requested'
  | 'payout_paid';

export interface CrmEvent {
  eventId: string;
  at: string;
  eventType: EventType;
  detail: string;
  amountToman: number | null;
}

export interface ContactDetail {
  contact: Contact;
  messages: Message[]; // sorted ascending by time
  events: CrmEvent[]; // sorted ascending by time
  history: HistoryEntry[]; // sorted ascending by time
}

// The 4-step funnel requested for the UI (independent of raw S1..S6 stages)
export const FunnelStep = {
  Lead: 1, // سرنخ — not signed up yet
  SignedUp: 2, // ثبت‌نام
  FirstProduct: 3, // ساخت اولین محصول
  FirstSale: 4, // اولین فروش
} as const;

export type FunnelStepValue = (typeof FunnelStep)[keyof typeof FunnelStep];
