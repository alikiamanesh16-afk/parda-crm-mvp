// Final probe: deliveries (SMS history incl. inbound?), events, filters.
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

// deliveries: check direction/filter params from OpenAPI knowledge: try kind & address & cursor
let r = await get('/api/v1/deliveries?limit=50');
const j = JSON.parse(r.body);
const kinds = {};
const statuses = {};
for (const it of j.items ?? []) {
  kinds[it.kind] = (kinds[it.kind] ?? 0) + 1;
  statuses[it.status] = (statuses[it.status] ?? 0) + 1;
}
console.log('DELIVERIES: total in page =', (j.items ?? []).length, '| kinds =', JSON.stringify(kinds), '| statuses =', JSON.stringify(statuses));
console.log('pagination:', JSON.stringify((j.page ?? j.meta ?? {})).slice(0, 300));
console.log('sample fields of one:', JSON.stringify(Object.keys((j.items ?? [])[0] ?? {})));
// does any item show inbound? (sms received) — check full first item
console.log('first item full:', JSON.stringify((j.items ?? [])[0]).slice(0, 900));

// events for the test profile
r = await get('/api/v1/profiles/prf_01m7q25gm8fvztx8eez333bbbt/events?limit=5');
console.log('\nPROFILE EVENTS ->', r.status);
console.log(r.body.replace(/\s+/g, ' ').slice(0, 700));

await browser.close();
process.exit(0);
