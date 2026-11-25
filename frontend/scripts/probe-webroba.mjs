// Probe live Webroba endpoints from the authed Chrome session.
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp')) ?? ctx.pages()[0];

const calls = [
  '/api/v1/profiles?limit=5',
  '/api/v1/events?limit=5',
  '/api/v1/deliveries?limit=5',
  '/api/v1/channel-providers',
  '/api/v1/channels',
];

for (const c of calls) {
  const r = await page.evaluate(async (u) => {
    const res = await fetch(u, { credentials: 'include' });
    let b = '';
    try { b = await res.text(); } catch {}
    return { status: res.status, body: b };
  }, c);
  console.log('== ' + c + ' -> ' + r.status);
  console.log(r.body.replace(/\s+/g, ' ').slice(0, 1100));
  console.log('');
}
await browser.close();
process.exit(0);
