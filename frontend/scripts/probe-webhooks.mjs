// Check webhooks (the only plausible inbound path) + ingest source-keys.
// If webhooks exist for SMS replies, they'd be configured here. Also check
// /workspace/identity-secret and ingestUrl hints for inbound SMS ingestion.
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

for (const u of ['/api/v1/webhooks', '/api/v1/source-keys', '/api/v1/config']) {
  const r = await get(u);
  console.log('== ' + u + ' -> ' + r.status);
  console.log(r.body.replace(/\s+/g, ' ').slice(0, 800));
  console.log('');
}

// openapi: /webhooks POST body + webhook events described?
const specResp = await get('/api/v1/openapi.json');
const spec = JSON.parse(specResp.body);
const wh = spec.paths['/webhooks'];
console.log('WEBHOOKS methods:', Object.keys(wh).join(', '));
for (const m of Object.keys(wh)) {
  console.log(m.toUpperCase(), 'summary:', wh[m].summary ?? '');
}
// webhook delivery event types
const webhooksSchema = JSON.stringify(spec.components?.schemas ?? {});
const matched = webhooksSchema.match(/"\$[a-z_]+"/g) ?? [];
console.log('dollar-events mentioned in schemas:', [...new Set(matched)].join(', '));
await browser.close();
process.exit(0);
