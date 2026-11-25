// ─── Local SMS outbox (UI demonstration — no real messages are ever sent) ─────
// Each entry records what the user *would* send so the tab shows a realistic
// history. Replace this store with the Webroba deliveries API when wired.

export interface SmsRecord {
  id: string;
  to: string; // phone
  contactId: string; // CRM contact the message belongs to
  text: string;
  sentAt: string; // 'YYYY-MM-DD HH:MM'
  status: 'sent' | 'failed' | 'queued';
  templateTitle?: string;
}

const KEY = 'parda-crm:sms-outbox:v1';

export function listSms(contactId?: string): SmsRecord[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '[]') as SmsRecord[];
    return contactId ? all.filter((s) => s.contactId === contactId) : all;
  } catch {
    return [];
  }
}

export function addSms(rec: Omit<SmsRecord, 'id'>): SmsRecord {
  const all = listSms();
  const rec2: SmsRecord = { ...rec, id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  all.push(rec2);
  localStorage.setItem(KEY, JSON.stringify(all));
  return rec2;
}
