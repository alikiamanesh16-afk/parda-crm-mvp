import { useState } from 'react';
import type { Contact } from '../../types';
import { convertIsoDatesInText } from '../../utils/format';
import { ModuleFrame } from './ModuleFrame';

interface Props {
  contact: Contact;
  onBack: () => void;
}

// ─── Open issues module (fullscreen): accordion titles → full text ────────────
export function IssuesModule({ contact, onBack }: Props) {
  const items = contact.openIssues
    .split('\n')
    .map((l) => l.replace(/^–\s*/, '').trim())
    .filter(Boolean);

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const title = (t: string): string => {
    const m = t.match(/^[^؛.!؟\n]{8,70}/);
    let s = (m ? m[0] : t.slice(0, 70)).trim();
    if (t.length > s.length + 2) s += '…';
    return s;
  };

  return (
    <ModuleFrame title="مشکلات باز" icon="⚠️" onBack={onBack}>
      <div className="head-chips" style={{ paddingBottom: 10 }}>
        <span className="mini-chip warn">{items.length} مورد</span>
      </div>
      <div className="issues-list module-issues">
        {items.length === 0 && <div className="chat-empty">مشکلی ثبت نشده است</div>}
        {items.map((t, i) => {
          const open = openIdx === i;
          return (
            <div className="issue-item" key={i}>
              <button
                className={`issue-row ${open ? 'open' : ''}`}
                onClick={() => setOpenIdx(open ? null : i)}
              >
                <span className="issue-dot" />
                <span className="issue-title" dir="auto">{convertIsoDatesInText(title(t))}</span>
                <span className="issue-chev">{open ? '▴' : '▾'}</span>
              </button>
              {open && <div className="issue-body" dir="auto">{convertIsoDatesInText(t)}</div>}
            </div>
          );
        })}
      </div>
    </ModuleFrame>
  );
}
