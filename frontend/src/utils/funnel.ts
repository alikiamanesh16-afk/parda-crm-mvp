import { FunnelStep } from '../types';
import type { Contact, CrmEvent, FunnelStepValue } from '../types';

// ─── Funnel mapping: raw data → the 4 steps shown in the UI ───────────────────
// UI funnel:  سرنخ → ثبت‌نام → ساخت اولین محصول → اولین فروش
//
// Mapping rules (derived strictly from data, nothing invented):
//   Lead        : no signed_up event  (future API data may include these)
//   SignedUp    : signed_up exists, but no product evidence yet
//   FirstProduct: product evidence (raw stage S2/S3 family, or 'N products'
//                 mentioned in a stage_changed detail)
//   FirstSale   : at least one order_paid event

export interface FunnelStatus {
  currentStep: FunnelStepValue;
  hasSignedUp: boolean;
  hasProduct: boolean;
  hasSale: boolean;
}

// Evidence patterns for 'has at least one product'.
// 'N products' with N >= 1 counts; '0 products' explicitly does NOT.
const PRODUCT_COUNT_RE = /(\d+)\s*products?/i;

function stageNumber(stage: string): number | null {
  const m = stage.match(/S(\d)/i);
  return m ? parseInt(m[1], 10) : null;
}

export function computeFunnelStatus(contact: Contact, events: CrmEvent[]): FunnelStatus {
  const hasSignedUp = events.some((e) => e.eventType === 'signed_up');
  const hasSale = events.some((e) => e.eventType === 'order_paid');

  const sn = stageNumber(contact.funnelStage);

  let hasProduct = false;
  if (hasSale) {
    hasProduct = true; // sellers necessarily have products
  } else if (sn !== null && sn >= 3) {
    // S3 'ready' / S4 'demand' / S5 / S6 'selling' are all past product creation.
    hasProduct = true;
  } else {
    // S1/S2 (or unknown): look for explicit 'N products' (N≥1) evidence in history.
    hasProduct = events.some((e) => {
      if (e.eventType !== 'stage_changed') return false;
      const m = e.detail.match(PRODUCT_COUNT_RE);
      return !!m && parseInt(m[1], 10) > 0;
    });
  }

  let currentStep: FunnelStepValue;
  if (hasSale) currentStep = FunnelStep.FirstSale;
  else if (hasProduct) currentStep = FunnelStep.FirstProduct;
  else if (hasSignedUp) currentStep = FunnelStep.SignedUp;
  else currentStep = FunnelStep.Lead;

  return { currentStep, hasSignedUp, hasProduct, hasSale };
}

/** Product count extracted from stage details, if present. Null = unknown. */
export function productCountFromEvents(events: CrmEvent[]): number | null {
  let best: number | null = null;
  for (const e of events) {
    if (e.eventType !== 'stage_changed') continue;
    const m = e.detail.match(PRODUCT_COUNT_RE);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && (best === null || n > best)) best = n;
    }
  }
  return best;
}

export const FUNNEL_STEP_LABELS: Record<FunnelStepValue, string> = {
  [FunnelStep.Lead]: 'سرنخ',
  [FunnelStep.SignedUp]: 'ثبت‌نام',
  [FunnelStep.FirstProduct]: 'ساخت اولین محصول',
  [FunnelStep.FirstSale]: 'اولین فروش',
};
