import { useState } from 'react';
import type { Contact } from '../../types';
import { buildCallBrief } from '../../utils/brief';
import { ModuleFrame } from './ModuleFrame';

interface Props {
  contact: Contact;
  onBack: () => void;
}

// ─── Call-brief module (fullscreen): 3 labeled lines + expandable detail ─────
export function SummaryModule({ contact, onBack }: Props) {
  const [expanded, setExpanded] = useState(false);
  const brief = buildCallBrief(contact.overallSummary);

  return (
    <ModuleFrame title="خلاصه برای تماس" icon="📞" onBack={onBack}>
      {!expanded ? (
        <div className="brief module-brief">
          {brief.current && (
            <div className="brief-row">
              <span className="brief-label lb-current">وضعیت</span>
              <span className="brief-text" dir="auto">{brief.current}</span>
            </div>
          )}
          {brief.identity && (
            <div className="brief-row">
              <span className="brief-label lb-id">پروفایل</span>
              <span className="brief-text" dir="auto">{brief.identity}</span>
            </div>
          )}
          {brief.requests && (
            <div className="brief-row">
              <span className="brief-label lb-req">درخواست‌ها</span>
              <span className="brief-text" dir="auto">{brief.requests}</span>
            </div>
          )}
          {!brief.current && !brief.identity && !brief.requests && (
            <div className="chat-empty">خلاصه‌ای ثبت نشده است</div>
          )}
        </div>
      ) : (
        <ul className="summary-compact module-summary">
          {brief.all.map((b, i) => (
            <li key={i} dir="auto">{b}</li>
          ))}
        </ul>
      )}
      <button className="expand-btn module-expand" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'بستن ▴' : 'جزئیات کامل ▾'}
      </button>
    </ModuleFrame>
  );
}
