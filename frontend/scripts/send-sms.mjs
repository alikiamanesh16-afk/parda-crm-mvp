// Send one SMS via Webroba using the authed Chrome session.
// Usage: node scripts/send-sms.mjs <phone> <text>
import { chromium } from 'playwright';

const phone = process.argv[2] ?? '';
const text = process.argv[3] ?? '';

if (!phone || !text) {
  console.error('usage: node scripts/send-sms.mjs <phone> <text>');
  process.exit(1);
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp')) ?? ctx.pages()[0];

const me = await page.evaluate(async () => {
  const r = await fetch('/api/v1/me', { credentials: 'include' });
  return r.json();
});
const ws = me.organizations?.[0]?.workspaces?.[0]?.id;

const result = await page.evaluate(
  async ({ ws, phone, text }) => {
    const r = await fetch('/api/v1/messages', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Hamgam-Workspace': ws, 'X-Hamgam-Csrf': '1' },
      body: JSON.stringify({
        to: { address: phone },
        content: { text },
        kind: 'sms',
        category: 'transactional',
      }),
    });
    const body = await r.text();
    return { status: r.status, body };
  },
  { ws, phone, text },
);

console.log('STATUS:', result.status);
console.log(result.body.slice(0, 1200));
await browser.close();
process.exit(result.status === 200 || result.status === 201 ? 0 : 1);
