import { useMemo, useState } from 'react';
import type { Contact } from '../../types';
import { computeFunnelStatus } from '../../utils/funnel';
import { formatJalali } from '../../utils/format';
import { ModuleFrame } from './ModuleFrame';

interface Props {
  contacts: Contact[];
  activeId: string | null;
  onOpenContact: (c: Contact) => void;
  onBack: () => void;
}

// ─── All contacts module (fullscreen): searchable list with brief info ────────
export function ContactsModule({ contacts, activeId, onOpenContact, onBack }: Props) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((c) =>
      [c.igUsername, c.shopName, c.phone, c.funnelStage].join(' ').toLowerCase().includes(query),
    );
  }, [contacts, q]);

  const stageFa = (c: Contact): string => {
    const st = computeFunnelStatus(c, []);
    const names: Record<number, string> = {
      1: 'سرنخ',
      2: 'ثبت‌نام',
      3: 'محصول',
      4: 'فروش',
    };
    return names[st.currentStep] ?? '—';
  };

  return (
    <ModuleFrame title="همه مخاطبین" icon="👥" onBack={onBack}>
      <input
        className="contacts-search"
        placeholder={`جستجو در ${contacts.length} مخاطب… (نام، آیدی، شماره)`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="contacts-list">
        {filtered.length === 0 && <div className="chat-empty">مخاطبی پیدا نشد</div>}
        {filtered.map((c) => (
          <button
            key={c.contactId}
            className={`contact-row ${c.contactId === activeId ? 'active' : ''}`}
            onClick={() => onOpenContact(c)}
          >
            <span className="cr-avatar">{(c.igUsername || c.shopName || '?').slice(0, 1).toUpperCase()}</span>
            <span className="cr-main">
              <span className="cr-name">{c.shopName || c.igUsername || c.contactId}</span>
              <span className="cr-sub">
                {c.igUsername && <span dir="ltr">@{c.igUsername}</span>}
                {c.phone && <span dir="ltr">{c.phone}</span>}
              </span>
            </span>
            <span className="cr-side">
              <span className={`cr-stage ${c.pageConnected ? 'on' : 'off'}`}>
                {stageFa(c)}{c.pageConnected ? ' · متصل' : ' · قطع'}
              </span>
              <span className="cr-last">آخرین تماس: {formatJalali(c.lastContactAt)}</span>
            </span>
          </button>
        ))}
      </div>
    </ModuleFrame>
  );
}
