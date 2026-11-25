import type { Contact, ContactDetail } from '../types';
import { DATA_SOURCE, API_BASE_URL } from '../config';
import { CsvSource } from './CsvSource';
import { ApiSource } from './ApiSource';

// ─── The single data contract of the UI ───────────────────────────────────────
// The UI only ever talks to this interface. Swapping CSV for a real API later
// means implementing this same interface — zero component changes.
export interface DataSource {
  /** Lightweight list for search / picker. */
  listContacts(): Promise<Contact[]>;
  /** Full detail (messages, events, history) for one contact. */
  getContactDetail(contactId: string): Promise<ContactDetail>;
}

let cached: DataSource | null = null;

export function getDataSource(): DataSource {
  if (cached) return cached;
  cached =
    DATA_SOURCE === 'api'
      ? new ApiSource({ baseUrl: API_BASE_URL })
      : new CsvSource();
  return cached;
}
