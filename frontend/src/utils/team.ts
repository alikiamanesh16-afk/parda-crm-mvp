// ─── Team members + assignment store (persisted locally until API phase) ──────
// Team list is editable; assignments persist per contact in localStorage.
// When the DB API lands, both move server-side.

export interface TeamMember {
  id: string;
  name: string;
}

export interface Assignment {
  contactId: string;
  memberId: string | null; // null = unassigned
  assignedAt: string;
}

const TEAM_KEY = 'parda-crm:team:v1';
const ASSIGN_KEY = 'parda-crm:assignments:v1';

// Default team — edit here or via the UI dropdown; replaced by API later.
export const DEFAULT_TEAM: TeamMember[] = [
  { id: 'tm-1', name: 'علی' },
  { id: 'tm-2', name: 'رضا' },
  { id: 'tm-3', name: 'سارا' },
  { id: 'tm-4', name: 'محمد' },
];

export function listTeam(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (raw) return JSON.parse(raw) as TeamMember[];
  } catch { /* ignore */ }
  return DEFAULT_TEAM;
}

export function saveTeam(team: TeamMember[]): void {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function listAssignments(): Record<string, Assignment> {
  try {
    return JSON.parse(localStorage.getItem(ASSIGN_KEY) ?? '{}') as Record<string, Assignment>;
  } catch {
    return {};
  }
}

export function getAssignment(contactId: string): Assignment | null {
  return listAssignments()[contactId] ?? null;
}

export function assignContact(contactId: string, memberId: string | null): void {
  const all = listAssignments();
  if (memberId === null) delete all[contactId];
  else
    all[contactId] = {
      contactId,
      memberId,
      assignedAt: new Date().toISOString(),
    };
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(all));
}

export function memberName(memberId: string | null | undefined): string {
  if (!memberId) return '';
  const t = listTeam().find((m) => m.id === memberId);
  return t?.name ?? '';
}
