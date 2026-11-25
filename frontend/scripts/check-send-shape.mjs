// Validate POST /messages auth + schema (text vs body). The recipient is an
// invalid number so the provider rejects it — proving OUR request shape/auth
// is correct without sending anything real.
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp'));

const me = await page.evaluate(async () => {
  const r = await fetch('https://hamgam.titanapp.dev/api/v1/me', { credentials: 'include' });
  return r.json();
});
const ws = me.organizations?.[0]?.workspaces?.[0]?.id;

const attempts = [
  { body: { to: { address: '+980000000000' }, text: 'TEST', kind: 'sms' }, label: 'text at top level' },
  { body: { to: { address: '+980000000000' }, content: { text: 'TEST' }, kind: 'sms' }, label: 'content.text' },
  { body: { to: { profileId: 'prf_nonexistent' }, content: { text: 'TEST' }, kind: 'sms' }, label: 'profileId ref' },
];

for (const a of attempts) {
  const r = await page.evaluate(
    async ({ ws, body }) => {
      const res = await fetch('https://hamgam.titanapp.dev/api/v1/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Hamgam-Workspace': ws,
          'Content-Type': 'application/json',
          'X-Hamgam-Csrf': '1',
        },
        body: JSON.stringify(body),
      });
      const b = await res.text();
      return { status: res.status, body: b.slice(0, 350) };
    },
    { ws, body: a.body },
  );
  console.log(`[${a.label}] -> ${r.status}`);
  console.log('   ', r.body.replace(/\s+/g, ' ').slice(0, 260));
}
await browser.close();
process.exit(0);
