// Autonomous Webroba API discovery:
// 1) check login state via /api/v1/me inside the authed tab
// 2) download all JS bundles, extract every endpoint template (GET/POST/...)
// 3) grep for SMS-related modules and dump their endpoints + routes
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes('titanapp'));
if (!page) {
  page = await ctx.newPage();
  await page.goto('https://hamgam.titanapp.dev/o/parda/w/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
}

// 1) login check
const me = await page.evaluate(async () => {
  const r = await fetch('/api/v1/me', { credentials: 'include' });
  return { status: r.status, body: (await r.text()).slice(0, 600) };
});
console.log('ME:', JSON.stringify(me));

// 2) collect asset URLs from the SPA index
const assets = await page.evaluate(async () => {
  const html = await (await fetch(location.origin + '/', { credentials: 'include' })).text();
  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  // also parse currently loaded module scripts
  const loaded = performance.getEntriesByType('resource')
    .map((e) => e.name)
    .filter((n) => n.includes('/assets/') && n.endsWith('.js'));
  return [...new Set([...urls, ...loaded.map((u) => u.replace(location.origin, ''))])];
});
console.log('ASSETS:', assets.length);

// 3) download bundles and extract endpoint templates
const found = new Map(); // path -> {verbs:Set, files:Set}
const smsFiles = [];
for (const a of assets.slice(0, 120)) {
  let code = '';
  try {
    code = await page.evaluate(async (u) => (await fetch(u, { credentials: 'include' })).text(), a);
  } catch { continue; }
  if (/sms|پیامک/i.test(code)) smsFiles.push(a);
  // i.GET(`/path`), n.POST(`/path`,...) etc
  const re = /\.(GET|POST|PATCH|PUT|DELETE)\(`([^`]+)`/g;
  let m;
  while ((m = re.exec(code))) {
    const path = m[2];
    if (!found.has(path)) found.set(path, { verbs: new Set(), files: new Set() });
    found.get(path).verbs.add(m[1]);
    found.get(path).files.add(a.split('/').pop());
  }
}
console.log('ENDPOINTS:', found.size);
const out = [];
for (const [path, info] of found) out.push({ path, verbs: [...info.verbs], files: [...info.files] });
writeFileSync('C:/Users/LENOVO/AppData/Local/hermes/cache/scratch/webroba-endpoints.json', JSON.stringify(out, null, 2));
console.log('SMS_FILES:', JSON.stringify(smsFiles));
console.log('---SMS-ish endpoints---');
for (const e of out) if (/sms|sms|پیامک|message|conversation|inbox|chat/i.test(e.path)) console.log(e.verbs.join(','), e.path);
console.log('---sample of all---');
for (const e of out.slice(0, 60)) console.log(e.verbs.join(','), e.path);
await browser.close();
process.exit(0);
