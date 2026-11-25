// Probe Webroba SMS endpoints with the workspace header (ws id from /me).
import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp')) ?? ctx.pages()[0];

// workspace id
const me = await page.evaluate(async () => {
  const r = await fetch('/api/v1/me', { credentials: 'include' });
  return r.json();
});
const ws = me.organizations?.[0]?.workspaces?.[0]?.id;
const org = me.organizations?.[0]?.id;
console.log('WORKSPACE:', ws, '| ORG:', org);

const H = { 'Hamgam-Workspace': ws };
const get = (u) =>
  page.evaluate(
    async ({ u, H }) => {
      const res = await fetch(u, { credentials: 'include', headers: H });
      const b = await res.text();
      return { status: res.status, body: b };
    },
    { u, H },
  );

for (const c of ['/api/v1/channels', '/api/v1/deliveries?limit=8', '/api/v1/profiles?limit=5']) {
  const r = await get(c);
  console.log('== ' + c + ' -> ' + r.status);
  console.log(r.body.replace(/\s+/g, ' ').slice(0, 1400));
  console.log('');
}
await browser.close();
process.exit(0);
