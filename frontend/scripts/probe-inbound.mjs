// Live test: search events for any SMS inbound/received event kinds, and list
// distinct event names + check deliveries for non-'sent' statuses (received
// messages might appear as a delivery with a different status or direction).
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp')) ?? ctx.pages()[0];
const me = await page.evaluate(async () => (await fetch('/api/v1/me', { credentials: 'include' })).json());
const ws = me.organizations?.[0]?.workspaces?.[0]?.id;
const H = { 'Hamgam-Workspace': ws };
const get = (u) =>
  page.evaluate(async ({ u, H }) => {
    const res = await fetch(u, { credentials: 'include', headers: H });
    return { status: res.status, body: await res.text() };
  }, { u, H });

// 1) all events, list distinct event names (100 sample pages)
const ev = await get('/api/v1/events?limit=100');
const ej = JSON.parse(ev.body);
const names = {};
for (const it of ej.items ?? []) names[it.event] = (names[it.event] ?? 0) + 1;
console.log('EVENT NAMES:', JSON.stringify(names, null, 1).slice(0, 1200));

// 2) deliveries with status filter probes
for (const q of ['status=received', 'status=delivered', 'status=failed', 'status=inbound', 'direction=inbound', 'kind=inbound']) {
  const r = await get('/api/v1/deliveries?limit=3&' + q);
  const ok = r.status === 200;
  let count = '-';
  if (ok) {
    try { count = (JSON.parse(r.body).items ?? []).length; } catch {}
  }
  console.log(`deliveries?${q} -> ${r.status} items=${count}`);
  if (!ok) console.log('   ', r.body.replace(/\s+/g, ' ').slice(0, 160));
}

// 3) DeliveryStatus enum values from spec
const specResp = await get('/api/v1/openapi.json');
const spec = JSON.parse(specResp.body);
const ds = spec.components?.schemas?.DeliveryStatus ?? {};
console.log('DeliveryStatus enum:', JSON.stringify(ds));
const ck = spec.components?.schemas?.ChannelKind ?? {};
console.log('ChannelKind enum:', JSON.stringify(ck));
const mc = spec.components?.schemas?.MessageContent ?? {};
console.log('MessageContent:', JSON.stringify(mc).slice(0, 400));
await browser.close();
process.exit(0);
