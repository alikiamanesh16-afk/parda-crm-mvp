import type { ReactNode } from 'react';
import type { Contact } from '../types';
import { computeFunnelStatus, FUNNEL_STEP_LABELS } from '../utils/funnel';
import { formatJalali } from '../utils/format';
import { getAssignee } from '../utils/assign';

interface Props {
  contact: Contact;
  badges: Record<string, number>;
  onOpen: (m: 'status' | 'chat' | 'summary' | 'issues' | 'history' | 'orders') => void;
  onSwitch: () => void;
  children?: ReactNode; // an open module renders next to the dashboard
}

function stepLabel(c: Contact): string {
  const st = computeFunnelStatus(c, []);
  return FUNNEL_STEP_LABELS[st.currentStep];
}

// ─── Seller dashboard: stays visible while a module is open ───────────────────
// Layout: dashboard (right rail) + open module (fills the rest).
// The switch/close button is a half-circle arrow on the LEFT EDGE of the
// dashboard card; clicking it hides the dashboard → contacts list.
export function SellerDashboard({ contact, badges, onOpen, onSwitch, children }: Props) {
  const assignee = getAssignee(contact.contactId);

  const modules: {
    id: 'status' | 'chat' | 'summary' | 'issues' | 'history' | 'orders';
    icon: string;
    title: string;
    meta: string;
  }[] = [
    {
      id: 'status',
      icon: '📊',
      title: 'وضعیت غرفه‌دار',
      meta: stepLabel(contact) + (contact.pageConnected ? ' · اینستا متصل' : ' · متصل نیست'),
    },
    { id: 'chat', icon: '💬', title: 'دایرکت اینستاگرام', meta: `${contact.messageCount} پیام` },
    { id: 'summary', icon: '📞', title: 'خلاصه برای تماس', meta: 'وضعیت، پروفایل، درخواست‌ها' },
    {
      id: 'issues',
      icon: '⚠️',
      title: 'مشکلات باز',
      meta: `${contact.openIssues.split('\n').filter((l) => l.trim()).length} مورد`,
    },
    {
      id: 'orders',
      icon: '💳',
      title: 'سفارش‌ها و درگاه',
      meta: contact.lastContactAt ? 'آخرین تماس: ' + formatJalali(contact.lastContactAt) : '—',
    },
    { id: 'history', icon: '🕘', title: 'هیستوری و رویدادها', meta: 'تایم‌لاین کامل + یادداشت‌ها' },
  ];

  return (
    <div className="sd-wrap">
      {/* dashboard rail (always visible) */}
      <div className="sd-rail-wrap">
        {/* half-circle close button straddling the LEFT border of the card */}
        <button className="edge-close" onClick={onSwitch} title="بستن داشبورد و برگشت به لیست">
          <span className="edge-arrow">›</span>
        </button>
        <div className="cf-seller">
          <div className="cf-seller-head">
            <span className="cf-seller-ava">
              {(contact.shopName || contact.igUsername || '?').slice(0, 1).toUpperCase()}
            </span>
            <div className="cf-seller-id">
              <div className="cf-seller-name">{contact.shopName || contact.igUsername}</div>
              <div className="cf-seller-meta">
                {contact.igUsername && <span dir="ltr">@{contact.igUsername}</span>}
                {contact.phone && <span dir="ltr">{contact.phone}</span>}
                <span className={`cr-stage ${contact.pageConnected ? 'on' : 'off'}`}>
                  {contact.pageConnected ? 'متصل' : 'قطع'}
                </span>
              </div>
            </div>
          </div>

          <div className="cf-seller-info">
            <div className="info-row"><span>اولین تماس:</span><b>{formatJalali(contact.firstContactAt)}</b></div>
            <div className="info-row"><span>آخرین تماس:</span><b>{formatJalali(contact.lastContactAt)}</b></div>
            <div className="info-row"><span>تعداد پیام:</span><b>{contact.messageCount}</b></div>
            <div className="info-row"><span>مسئول حساب:</span><b>{assignee ?? 'نامشخص'}</b></div>
          </div>

          <div className="cf-modules">
            {modules.map((m) => {
              const badge = badges[m.id] ?? 0;
              return (
                <button
                  key={m.id}
                  className="dash-mod"
                  onClick={() => onOpen(m.id)}
                >
                  <span className="dm-icon">
                    {m.icon}
                    {badge > 0 && <span className="notif-badge">{badge > 99 ? '۹۹+' : badge}</span>}
                  </span>
                  <span className="dm-text">
                    <span className="dm-title">{m.title}</span>
                    <span className="dm-meta">{m.meta}</span>
                  </span>
                  <span className="dm-chevron">‹</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* module area: open module fills the rest; placeholder otherwise */}
      <div className="sd-module-area">
        {children ?? (
          <div className="dash-placeholder">
            <div className="dp-icon">🧩</div>
            <div>یکی از ماژول‌ها را از داشبورد انتخاب کن</div>
          </div>
        )}
      </div>
    </div>
  );
}
