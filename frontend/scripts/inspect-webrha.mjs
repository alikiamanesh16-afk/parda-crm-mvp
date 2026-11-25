// Attach to the user's real Chrome session (profile) and keep CDP open so we
// can inspect webrha.com network calls. Run: node scripts/inspect-webrha.mjs
import { chromium } from 'playwright';

const port = Number(process.argv[2] ?? 9222);
const url = process.argv[3] ?? 'https://webrha.com';

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
const ctx = browser.contexts()[0];
if (!ctx) {
  console.log(JSON.stringify({ error: 'no context found' }));
  process.exit(1);
}

// open webrha in a new tab in the user's session
const page = await ctx.newPage();
const reqs = [];

page.on('request', (r) => {
  const u = r.url();
  if (u.includes('webrha') || u.includes('api')) {
    reqs.push({ method: r.method(), url: u.slice(0, 180) });
  }
});

page.on('response', async (res) => {
  const u = res.url();
  const ct = res.headers()['content-type'] ?? '';
  if (!ct.includes('json') && !u.includes('api')) return;
  try {
    const body = await res.text();
    reqs.push({
      response: true,
      status: res.status(),
      url: u.slice(0, 180),
      bodyPreview: body.slice(0, 1200),
    });
  } catch {
    /* ignore body read failures */
  }
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
console.log(JSON.stringify({ opened: url, title: await page.title() }));

// keep alive briefly to collect network traffic; then dump
await page.waitForTimeout(15000);
console.log('---NETWORK---');
for (const r of reqs) console.log(JSON.stringify(r));
await page.close();
await browser.close();
process.exit(0);
