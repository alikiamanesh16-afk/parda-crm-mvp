import type { Contact, CrmEvent } from '../../types';
import { ModuleFrame } from './ModuleFrame';
import { computeFunnelStatus, FUNNEL_STEP_LABELS } from '../../utils/funnel';
import { formatJalali } from '../../utils/format';

interface Props {
  contact: Contact;
  events: CrmEvent[];
  onBack: () => void;
}

// ─── Status module (fullscreen): stepper + flags + meta ───────────────────────
export function StatusModule({ contact, events, onBack }: Props) {
  const status = computeFunnelStatus(contact, events);
  const idx = ['lead', 'signup', 'product', 'sale'].indexOf(
    status.currentStep === 1 ? 'lead' : status.currentStep === 2 ? 'signup' : status.currentStep === 3 ? 'product' : 'sale',
  );
  void idx;

  const orderEvents = events.filter((e) => e.eventType === 'order_paid');
  const revenue = orderEvents.reduce((s, e) => s + (e.amountToman ?? 0), 0);
  const payoutPaid = events.filter((e) => e.eventType === 'payout_paid');

  const steps = [
    { key: 1, label: FUNNEL_STEP_LABELS[1] },
    { key: 2, label: FUNNEL_STEP_LABELS[2] },
    { key: 3, label: FUNNEL_STEP_LABELS[3] },
    { key: 4, label: FUNNEL_STEP_LABELS[4] },
  ];

  return (
    <ModuleFrame title="وضعیت غرفه‌دار" icon="📊" onBack={onBack}>
      <div className="flag-row" style={{ padding: '0 0 14px' }}>
        <span className={`flag big ${contact.pageConnected ? 'flag-on' : 'flag-off'}`}>
          {contact.pageConnected ? '🔗 اینستاگرام متصل است' : '⚠︎ اینستاگرام متصل نیست'}
        </span>
        {contact.pageConnectedAt && (
          <span className="flag-since">از {formatJalali(contact.pageConnectedAt)}</span>
        )}
      </div>

      <div className="steps-compact" dir="rtl">
        {steps.map((s, i) => {
          const done = i + 1 < status.currentStep;
          const current = i + 1 === status.currentStep;
          return (
            <div className={`sc-step ${done ? 'done' : ''} ${current ? 'cur' : ''}`} key={s.key}>
              <div className="sc-dot">{done ? '✓' : i + 1}</div>
              <div className="sc-label">{s.label}</div>
              {i > 0 && <div className="sc-line" />}
            </div>
          );
        })}
      </div>

      <div className="module-stats">
        <div className="mstat">
          <div className="mstat-val">{orderEvents.length}</div>
          <div className="mstat-lab">سفارش پرداخت‌شده</div>
        </div>
        <div className="mstat">
          <div className="mstat-val">{revenue.toLocaleString('fa-IR')}</div>
          <div className="mstat-lab">جمع فروش (تومان)</div>
        </div>
        <div className="mstat">
          <div className="mstat-val">{payoutPaid.length}</div>
          <div className="mstat-lab">تسویه پرداخت‌شده</div>
        </div>
        <div className="mstat">
          <div className="mstat-val">{formatJalali(contact.firstContactAt)}</div>
          <div className="mstat-lab">اولین تماس</div>
        </div>
      </div>
    </ModuleFrame>
  );
}
