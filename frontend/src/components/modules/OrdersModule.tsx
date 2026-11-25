import type { ContactDetail } from '../../types';
import { formatJalali, formatToman } from '../../utils/format';
import { ModuleFrame } from './ModuleFrame';

interface Props {
  detail: ContactDetail;
  onBack: () => void;
}

// ─── Orders module: every paid order with amount, date, gateway ───────────────
// Gateway data is NOT present in the current CSV export. Gateways are derived
// from the order-code prefix (SC = سلام‌پی code style, ZP = ZarinPal style) as a
// clearly-marked estimate until the API exposes the real gateway field.
function guessGateway(detail: string): { name: string; guessed: boolean } {
  const code = detail.match(/\b(SC|ZP|SP|DP)[-–]?/i);
  if (!code) return { name: 'نامشخص', guessed: true };
  switch (code[1].toUpperCase()) {
    case 'SC': return { name: 'سلام‌پی (حدسی از کد سفارش)', guessed: true };
    case 'ZP': return { name: 'زرین‌پال (حدسی از کد سفارش)', guessed: true };
    case 'SP': return { name: 'سپ (حدسی از کد سفارش)', guessed: true };
    case 'DP': return { name: 'دیجی‌پی (حدسی از کد سفارش)', guessed: true };
    default: return { name: 'نامشخص', guessed: true };
  }
}

export function OrdersModule({ detail, onBack }: Props) {
  const orders = detail.events
    .filter((e) => e.eventType === 'order_paid')
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ModuleFrame title="سفارش‌ها و درگاه پرداخت" icon="💳" onBack={onBack}>
      <div className="api-note">
        ℹ️ فیلد درگاه پرداخت در داده‌ی فعلی (CSV) وجود ندارد؛ درگاه از پیشوند کد سفارش
        **حدس زده شده** و بعد از وصل شدن به API با مقدار واقعی جایگزین می‌شود.
      </div>
      {orders.length === 0 ? (
        <div className="chat-empty">سفارشی ثبت نشده است</div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const g = guessGateway(o.detail);
            return (
              <div className="order-row" key={o.eventId || o.at}>
                <div className="order-main">
                  <span className="order-amount">{formatToman(o.amountToman)}</span>
                  <span className="order-code" dir="auto">{o.detail}</span>
                </div>
                <div className="order-side">
                  <span className="order-gw" data-guessed={g.guessed}>
                    🏦 {g.name}
                  </span>
                  <span className="order-date">{formatJalali(o.at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModuleFrame>
  );
}
