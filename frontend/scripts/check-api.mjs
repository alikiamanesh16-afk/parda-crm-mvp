// Probe Webroba: session still valid? /me + /deliveries + /messages POST test
// (POST test only validates auth/params with a dry check — no real SMS).
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes('titanapp'));
if (!page) {
  page = await ctx.newPage();
  await page.goto('https://hamgam.titanapp.dev/o/parda/w/checkout', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
}
console.log('PAGE:', page.url());

const me = await page.evaluate(async () => {
  const r = await fetch('https://hamgam.titanapp.dev/api/v1/me', { credentials: 'include' });
  const b = await r.text();
  return { status: r.status, body: b.slice(0, 200) };
});
console.log('ME ->', me.status, me.body.replace(/\s+/g, ' ').slice(0, 150));

if (me.status !== 200) {
  console.log('SESSION EXPIRED — user must log in again in the debug Chrome window.');
  await browser.close();
  process.exit(2);
}

const ws = JSON.parse(
  await page.evaluate(async () => await (await fetch('https://hamgam.titanapp.dev/api/v1/me', { credentials: 'include' })).text()),
).organizations?.[0]?.workspaces?.[0]?.id;

const H = { 'Hamgam-Workspace': ws, 'Content-Type': 'application/json', 'X-Hamgam-Csrf': '1' };

// dry-check POST /messages with an impossible-recipient to validate auth works
// (provider will reject the number, but OUR auth/params are proven OK).
const dry = await page.evaluate(
  async ({ ws, H }) => {
    const r = await fetch('https://hamgam.titanapp.dev/api/v1/messages', {
      method: 'POST',
      credentials: 'include',
      headers: H,
      body: JSON.stringify({
        to: { address: '+980000000000' },
        content: { text: 'TEST - DO NOT SEND' },
        kind: 'sms',
      }),
    });
    const b = await r.text();
    return { status: r.status, body: b.slice(0, 500) };
  },
  { ws, H },
);
console.log('POST /messages (invalid-number dry check) ->', dry.status);
console.log(dry.body.replace(/\s+/g, ' ').slice(0, 400));

const dlv = await page.evaluate(
  async ({ ws }) => {
    const r = await fetch('https://hamgam.titanapp.dev/api/v1/deliveries?limit=3', {
      credentials: 'include',
      headers: { 'Hamgam-Workspace': ws },
    });
    const b = await r.text();
    return { status: r.status, body: b.slice(0, 300) };
  },
  { ws },
);
console.log('DELIVERIES ->', dlv.status, dlv.body.replace(/\s+/g, ' ').slice(0, 200));
await browser.close();
process.exit(0);
