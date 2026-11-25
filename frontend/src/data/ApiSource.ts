import type { Contact, ContactDetail } from '../types';
import type { DataSource } from './DataSource';

// ─── API-backed DataSource (phase 2 — not active yet) ─────────────────────────
// Implements the exact same contract as CsvSource. When the real API is ready,
// adjust endpoint paths/field names HERE ONLY; UI stays untouched.
//
// Expected endpoints (suggestion for the backend team):
//   GET {base}/contacts                 → Contact[]
//   GET {base}/contacts/:id             → ContactDetail
//   GET {base}/contacts/:id/messages    → Message[]   (optional, if detail is heavy)
//   GET {base}/contacts/:id/events      → CrmEvent[]  (optional)
//   GET {base}/contacts/:id/history     → HistoryEntry[] (optional)

export class ApiSource implements DataSource {
  private baseUrl: string;
  constructor(opts: { baseUrl: string }) {
    this.baseUrl = opts.baseUrl;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async listContacts(): Promise<Contact[]> {
    return this.get<Contact[]>('/contacts');
  }

  async getContactDetail(contactId: string): Promise<ContactDetail> {
    return this.get<ContactDetail>(`/contacts/${encodeURIComponent(contactId)}`);
  }
}
