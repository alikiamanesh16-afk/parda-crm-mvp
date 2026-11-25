// ─── Team members + seller assignment ─────────────────────────────────────────
// Stored locally for now; moves to the API when connected.

const ASSIGN_KEY = 'parda-crm:assign:v1';
const TEAM_KEY = 'parda-crm:team:v1';

const DEFAULT_TEAM = ['علی', 'رضا', 'سارا', 'امیر', 'نگار'];

type AssignMap = Record<string, string>; // contactId -> member name

function loadAssign(): AssignMap {
  try {
    return JSON.parse(localStorage.getItem(ASSIGN_KEY) ?? '{}') as AssignMap;
  } catch {
    return {};
  }
}

export function getAssignee(contactId: string): string | null {
  return loadAssign()[contactId] ?? null;
}

export function setAssignee(contactId: string, name: string | null): void {
  const map = loadAssign();
  if (name) map[contactId] = name;
  else delete map[contactId];
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(map));
}

// ─── Team list management ─────────────────────────────────────────────────────
export function getTeam(): string[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : null;
    return list ? list : [...DEFAULT_TEAM];
  } catch {
    return [...DEFAULT_TEAM];
  }
}

export function setTeam(list: string[]): void {
  localStorage.setItem(TEAM_KEY, JSON.stringify(list));
}

export function addMember(name: string): void {
  const list = getTeam();
  const n = name.trim();
  if (!n) return;
  if (!list.includes(n)) list.push(n);
  setTeam(list);
}

export function removeMember(name: string): void {
  const list = getTeam().filter((m) => m !== name);
  setTeam(list);
  // also clear assignments to the removed member
  const map = loadAssign();
  let changed = false;
  for (const [cid, a] of Object.entries(map)) {
    if (a === name) {
      delete map[cid];
      changed = true;
    }
  }
  if (changed) localStorage.setItem(ASSIGN_KEY, JSON.stringify(map));
}

export function assignmentCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of Object.values(loadAssign())) {
    counts[a] = (counts[a] ?? 0) + 1;
  }
  return counts;
}

export function resetTeamToDefault(): void {
  localStorage.removeItem(TEAM_KEY);
}
