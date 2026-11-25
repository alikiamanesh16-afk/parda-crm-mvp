// ─── Notification badges (new-data indicators) ────────────────────────────────
// Compares a stored snapshot of "last seen" counts against the current data.
// When a module has newer data than last seen, its dashboard card shows a red
// badge with the number of new items. Opening the module marks it seen.

const KEY = 'parda-crm:seen:v1';

type SeenMap = Record<string, string>; // moduleKey -> ISO timestamp last seen

function load(): SeenMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as SeenMap;
  } catch {
    return {};
  }
}

export function markSeen(moduleKey: string): void {
  const m = load();
  m[moduleKey] = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(m));
}

function lastSeen(moduleKey: string): number {
  const v = load()[moduleKey];
  return v ? new Date(v).getTime() : 0;
}

export interface NewCounts {
  chat: number; // new messages since last open
  history: number; // new history/event items
  issues: number; // always mirrors total (issues change rarely) — 0 unless first view
  orders: number; // new paid orders
}

export function computeNewCounts(contactId: string, opts: {
  lastMessageAt: string | null;
  messagesTotal: number;
  lastEventAt: string | null;
  lastOrderAt: string | null;
  issuesTotal: number;
}): NewCounts {
  const chatSeen = lastSeen(`${contactId}:chat`);
  const histSeen = lastSeen(`${contactId}:history`);
  const issuesSeen = lastSeen(`${contactId}:issues`);
  const statusSeen = lastSeen(`${contactId}:status`);

  const lastMsg = opts.lastMessageAt ? new Date(opts.lastMessageAt.replace(' ', 'T')).getTime() : 0;
  const lastEv = opts.lastEventAt ? new Date(opts.lastEventAt.replace(' ', 'T')).getTime() : 0;
  const lastOrd = opts.lastOrderAt ? new Date(opts.lastOrderAt.replace(' ', 'T')).getTime() : 0;

  return {
    chat: lastMsg > chatSeen ? Math.max(1, Math.min(opts.messagesTotal, 99)) : 0,
    history: lastEv > histSeen ? 1 : 0,
    issues: opts.issuesTotal > 0 && issuesSeen === 0 ? opts.issuesTotal : 0,
    status: 0,
    orders: lastOrd > statusSeen ? 1 : 0,
  } as NewCounts;
}

export function markSeenModule(contactId: string, module: string): void {
  markSeen(`${contactId}:${module}`);
}
