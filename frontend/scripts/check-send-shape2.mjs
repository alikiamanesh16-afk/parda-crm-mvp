// Find the exact validation error: try with channel id, full category, and
// capture raw response headers/body. The 400 'invalid_request' suggests body
// shape; maybe 'kind' must be omitted when 'channel' given, or address format.
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp'));

const me = await page.evaluate(async () => {
  const r = await fetch('https://hamgam.titanapp.dev/api/v1/me', { credentials: 'include' });
  return r.json();
});
const ws = me.organizations?.[0]?.workspaces?.[0]?.id;
const CH = 'chn_01m7fs4jsmere9y1h4ye40jb99'; // Pishgam SMS channel (active)

const tries = [
  { label: 'channel+content.text+no kind', body: { to: { address: '+980000000000' }, channel: CH, content: { text: 'TEST' } } },
  { label: 'with Idempotency-Key header', body: { to: { address: '+980000000000' }, content: { text: 'TEST' }, kind: 'sms' }, extra: { 'Idempotency-Key': 'test-1' } },
  { label: 'kind only, no content (template absent)', body: { to: { address: '+980000000000' }, kind: 'sms' } },
];

for (const t of tries) {
  const r = await page.evaluate(
    async ({ ws, body, extra }) => {
      const res = await fetch('https://hamgam.titanapp.dev/api/v1/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Hamgam-Workspace': ws,
          'Content-Type': 'application/json',
          'X-Hamgam-Csrf': '1',
          ...(extra ?? {}),
        },
        body: JSON.stringify(body),
      });
      const b = await res.text();
      return { status: res.status, body: b };
    },
    { ws, body: t.body, extra: t.extra },
  );
  console.log(`[${t.label}] -> ${r.status}`);
  console.log('   ', r.body.replace(/\s+/g, ' ').slice(0, 300));
}
await browser.close();
process.exit(0);
