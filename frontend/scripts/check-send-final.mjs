// CONFIRMED shape: to.address + content.text + kind + Idempotency-Key header.
// Last check: real-looking valid-format recipient (user's own number will be
// used ONLY when the user says so). Here we validate with the test profile's
// masked number format to see validation pass to the provider stage.
// NOTE: this still targets +980000000000 (invalid) — no real SMS is sent.
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp'));

const me = await page.evaluate(async () => {
  const r = await fetch('https://hamgam.titanapp.dev/api/v1/me', { credentials: 'include' });
  return r.json();
});
const ws = me.organizations?.[0]?.workspaces?.[0]?.id;

const r = await page.evaluate(
  async ({ ws }) => {
    const res = await fetch('https://hamgam.titanapp.dev/api/v1/messages', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Hamgam-Workspace': ws,
        'Content-Type': 'application/json',
        'X-Hamgam-Csrf': '1',
        'Idempotency-Key': 'parda-ui-validation-1',
      },
      body: JSON.stringify({
        to: { address: '+980000000000' },
        content: { text: 'TEST' },
        kind: 'sms',
        category: 'transactional',
      }),
    });
    const b = await res.text();
    return { status: res.status, body: b.slice(0, 600) };
  },
  { ws },
);
console.log('->', r.status);
console.log(r.body.replace(/\s+/g, ' ').slice(0, 500));
await browser.close();
process.exit(0);
