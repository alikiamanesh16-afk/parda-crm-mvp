import { useMemo, useState } from 'react';
import type { Contact } from '../types';
import { computeFunnelStatus } from '../utils/funnel';
import { formatJalali } from '../utils/format';
import {
  getAssignee,
  setAssignee,
  getTeam,
  addMember,
  removeMember,
  assignmentCounts,
  resetTeamToDefault,
} from '../utils/assign';

interface Props {
  contacts: Contact[];
  onPick: (c: Contact) => void;
}

const ts = (at: string | null): number => (at ? new Date(at.replace(' ', 'T')).getTime() : 0);

type SortKey = 'name' | 'lastContact' | 'messages' | 'stage' | 'connected';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'lastContact', label: 'آخرین تماس (جدیدترین)' },
  { key: 'name', label: 'حرف الفبا (الف→ی)' },
  { key: 'messages', label: 'تعداد پیام (بیشترین)' },
  { key: 'stage', label: 'مرحله قیف (پیشرفته‌تر)' },
  { key: 'connected', label: 'وضعیت اتصال (متصل اول)' },
];

// ─── Fullscreen contact list: rows + assign dropdown + team manager ──────────
export function ContactList({ contacts, onPick }: Props) {
  const [q, setQ] = useState('');
  const [assignFilter, setAssignFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('lastContact');
  const [version, setVersion] = useState(0);
  const [teamOpen, setTeamOpen] = useState(false);
  const [newMember, setNewMember] = useState('');

  const team = getTeam();
  const counts = assignmentCounts();

  const stageNum = (c: Contact): number => computeFunnelStatus(c, []).currentStep;

  const filtered = useMemo(() => {
    void version;
    const query = q.trim().toLowerCase();
    const list = contacts.filter((c) => {
      const matchesQ =
        !query ||
        [c.igUsername, c.shopName, c.phone].join(' ').toLowerCase().includes(query);
      const a = getAssignee(c.contactId);
      const matchesA =
        assignFilter === 'all'
          ? true
          : assignFilter === 'unassigned'
            ? !a
            : a === assignFilter;
      return matchesQ && matchesA;
    });

    const byStr = (get: (c: Contact) => string) => (a: Contact, b: Contact) =>
      get(a).localeCompare(get(b), 'fa');
    const byNum = (get: (c: Contact) => number, desc = false) => (a: Contact, b: Contact) =>
      desc ? get(b) - get(a) : get(a) - get(b);

    const cmp: Record<SortKey, (a: Contact, b: Contact) => number> = {
      name: byStr((c) => c.shopName || c.igUsername || ''),
      lastContact: byNum((c) => ts(c.lastContactAt), true),
      messages: byNum((c) => c.messageCount, true),
      stage: byNum((c) => stageNum(c), true),
      connected: (a, b) => Number(b.pageConnected) - Number(a.pageConnected),
    };
    return [...list].sort(cmp[sortKey]);
  }, [contacts, q, assignFilter, version, sortKey]);

  const stageFa = (c: Contact): string => {
    const st = computeFunnelStatus(c, []);
    const names: Record<number, string> = { 1: 'سرنخ', 2: 'ثبت‌نام', 3: 'محصول', 4: 'فروش' };
    return names[st.currentStep] ?? '—';
  };

  const stageDot = (c: Contact): string => {
    const st = computeFunnelStatus(c, []);
    if (!c.pageConnected) return 'dot-red';
    return st.currentStep >= 4 ? 'dot-green' : st.currentStep >= 2 ? 'dot-amber' : 'dot-gray';
  };

  function bump() {
    setVersion((v) => v + 1);
  }

  return (
    <div className="cl-wrap">
      <div className="cl-head">
        <h2>مخاطبین</h2>
        <span className="mini-chip">{contacts.length} غرفه‌دار</span>
        <select
          className="cl-assign-filter"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          title="مرتب‌سازی بر اساس"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select
          className="cl-assign-filter"
          value={assignFilter}
          onChange={(e) => setAssignFilter(e.target.value)}
          title="فیلتر مسئول"
        >
          <option value="all">همه</option>
          <option value="unassigned">بدون مسئول</option>
          {team.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          className="cf-search"
          placeholder="جستجو (نام، آیدی، شماره)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="team-btn" onClick={() => setTeamOpen(true)} title="مدیریت اعضای تیم">
          👥 تیم
        </button>
      </div>

      <div className="cl-rows">
        <div className="cl-row cl-row-head">
          <span className="col-id">غرفه‌دار</span>
          <span className="col-stage">مرحله</span>
          <span className="col-last">آخرین تماس</span>
          <span className="col-assign">مسئول</span>
          <span className="col-open" />
        </div>
        {filtered.map((c) => {
          const name = c.shopName || c.igUsername || c.contactId;
          const assignee = getAssignee(c.contactId);
          return (
            <div className="cl-row" key={c.contactId}>
              <button className="cl-pick" onClick={() => onPick(c)}>
                <span className={`pr-avatar ${stageDot(c)}`}>{name.slice(0, 1).toUpperCase()}</span>
                <span className="cl-id">
                  <span className="cl-name" dir="auto">{name}</span>
                  <span className="cl-sub">
                    {c.igUsername && <span dir="ltr">@{c.igUsername}</span>}
                    {c.phone && <span dir="ltr">{c.phone}</span>}
                  </span>
                </span>
                <span className={`cr-stage ${c.pageConnected ? 'on' : 'off'} col-stage`}>
                  {stageFa(c)}
                </span>
                <span className="cl-last col-last">{formatJalali(c.lastContactAt)}</span>
                <span className="col-assign">
                  <select
                    className={`cl-assign ${assignee ? 'has' : ''}`}
                    value={assignee ?? ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setAssignee(c.contactId, e.target.value || null);
                      bump();
                    }}
                  >
                    <option value="">—</option>
                    {team.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </span>
                <span className="cl-open col-open">باز کردن داشبورد ›</span>
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="chat-empty">مخاطبی پیدا نشد</div>}
      </div>

      {teamOpen && (
        <>
          <div className="search-overlay-backdrop" onClick={() => setTeamOpen(false)} />
          <div className="search-overlay team-overlay">
            <div className="so-head">
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>👥 مدیریت اعضای تیم</h2>
              <button className="so-close" onClick={() => setTeamOpen(false)}>✕</button>
            </div>
            <div className="team-body">
              <div className="team-add">
                <input
                  className="so-input"
                  placeholder="اسم عضو جدید…"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMember.trim()) {
                      addMember(newMember);
                      setNewMember('');
                      bump();
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (newMember.trim()) {
                      addMember(newMember);
                      setNewMember('');
                      bump();
                    }
                  }}
                >
                  افزودن
                </button>
              </div>

              <div className="team-list">
                {team.map((m) => (
                  <div className="team-row" key={m}>
                    <span className="team-name">{m}</span>
                    <span className="team-count">{counts[m] ?? 0} حساب</span>
                    <button
                      className="team-del"
                      title="حذف عضو (اساین‌هایش هم پاک می‌شود)"
                      onClick={() => {
                        removeMember(m);
                        bump();
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))}
                {team.length === 0 && <div className="chat-empty">عضوی نیست — یکی اضافه کن</div>}
              </div>

              <button
                className="team-reset"
                onClick={() => {
                  resetTeamToDefault();
                  bump();
                }}
              >
                برگشت به لیست پیش‌فرض
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
