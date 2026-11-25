import type { CrmEvent, HistoryEntry } from '../../types';
import { mergeTimeline, EVENT_META } from '../../utils/timeline';
import { formatJalaliDay, formatTime, formatToman, convertIsoDatesInText, formatJalali } from '../../utils/format';
import { NoteBox } from '../NoteBox';
import { ModuleFrame } from './ModuleFrame';

interface Props {
  contactId: string;
  history: HistoryEntry[];
  events: CrmEvent[];
  onBack: () => void;
}

// ─── History module (fullscreen): merged timeline + notes ─────────────────────
export function HistoryModule({ contactId, history, events, onBack }: Props) {
  const items = mergeTimeline(history, events).filter(
    (it) => it.kind !== 'event' || it.eventType !== 'stage_changed',
  );

  const groups: { day: string; items: typeof items }[] = [];
  for (const it of items) {
    const day = it.at ? it.at.slice(0, 10) : '';
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(it);
    else groups.push({ day, items: [it] });
  }

  return (
    <ModuleFrame title="هیستوری و رویدادها" icon="🕘" onBack={onBack}>
      <div className="head-chips" style={{ paddingBottom: 10 }}>
        <span className="mini-chip">{history.length} خلاصه</span>
        <span className="mini-chip">{events.length} رویداد</span>
      </div>
      <div className="tl-wrap">
        {groups.length === 0 && <div className="chat-empty">تاریخچه‌ای ثبت نشده است</div>}
        {groups.map((g, gi) => (
          <div className="tl-group" key={gi}>
            <div className="tl-day"><span>{g.day ? formatJalaliDay(g.day) : 'بدون تاریخ'}</span></div>
            {g.items.map((it) => {
              if (it.kind === 'event') {
                const meta = EVENT_META[it.eventType!] ?? { icon: '•', label: it.eventType!, cls: '' };
                return (
                  <div className={`tl-item tl-event ${meta.cls}`} key={it.key}>
                    <div className="tl-rail">
                      <div className="tl-dot ev">{meta.icon}</div>
                    </div>
                    <div className="tl-body">
                      <div className="tl-title">
                        {meta.label}
                        {it.amountToman ? <span className="ev-amount">{formatToman(it.amountToman)}</span> : null}
                      </div>
                      {it.detail && <div className="tl-detail" dir="auto">{convertIsoDatesInText(it.detail)}</div>}
                      <div className="tl-foot">
                        <span className="tl-time">{it.at ? formatJalali(it.at) : '—'}</span>
                      </div>
                      <NoteBox contactId={contactId} itemKey={it.key} />
                    </div>
                  </div>
                );
              }
              return (
                <div className="tl-item tl-history" key={it.key}>
                  <div className="tl-rail">
                    <div className="tl-dot hs">💬</div>
                  </div>
                  <div className="tl-body">
                    <div className="tl-text" dir="auto">{convertIsoDatesInText(it.text)}</div>
                    <div className="tl-foot">
                      <span className="tl-time">{it.at ? formatTime(it.at) : ''}</span>
                    </div>
                    <NoteBox contactId={contactId} itemKey={it.key} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ModuleFrame>
  );
}
