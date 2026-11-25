// ─── User notes attached to timeline items (persisted in localStorage) ───────
// key: `${contactId}:${itemKey}` → markdown note
// Rendering uses utils/markdown.ts (safe renderer).

const STORE_KEY = 'parda-crm:notes:v1';

type NoteMap = Record<string, string>;

function load(): NoteMap {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as NoteMap;
  } catch {
    return {};
  }
}

function save(map: NoteMap): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(map));
}

export function getNote(contactId: string, itemKey: string): string {
  return load()[`${contactId}:${itemKey}`] ?? '';
}

export function setNote(contactId: string, itemKey: string, note: string): void {
  const map = load();
  const k = `${contactId}:${itemKey}`;
  if (note.trim()) map[k] = note;
  else delete map[k];
  save(map);
}

export function getAllNotes(contactId: string): { itemKey: string; note: string }[] {
  const prefix = `${contactId}:`;
  return Object.entries(load())
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, note]) => ({ itemKey: k.slice(prefix.length), note }));
}
