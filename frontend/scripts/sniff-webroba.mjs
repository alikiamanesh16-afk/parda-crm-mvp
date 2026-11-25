// Sniff Webroba (titanapp) network traffic: log every /api call with method,
// URL, status and a JSON body preview. Keep alive until ENTER is pressed on
// stdin or MAX seconds elapse. Usage: node scripts/sniff-webroba.mjs [seconds]
import { chromium } from 'playwright';
import readline from 'node:readline';

const MAX = Number(process.argv[2] ?? 120);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];

const seen = new Set();
const logs = [];

for (const page of ctx.pages()) {
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/api/')) return;
    const key = res.request().method() + ' ' + u.split('?')[0] + ' ' + res.status();
    if (seen.has(key)) return;
    seen.add(key);
    let body = '';
    try {
      body = (await res.text()).slice(0, 1500);
    } catch {}
    logs.push({ method: res.request().method(), status: res.status(), url: u, body });
  });
}

// also cover future tabs
ctx.on('page', (page) => {
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/api/')) return;
    const key = res.request().method() + ' ' + u.split('?')[0] + ' ' + res.status();
    if (seen.has(key)) return;
    seen.add(key);
    let body = '';
    try {
      body = (await res.text()).slice(0, 1500);
    } catch {}
    logs.push({ method: res.request().method(), status: res.status(), url: u, body });
  });
});

console.log(JSON.stringify({ sniffing: true, pages: ctx.pages().length, maxSeconds: MAX }));

const deadline = Date.now() + MAX * 1000;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 2000));
}
console.log('---CAPTURED---');
for (const l of logs) console.log(JSON.stringify(l));
await browser.close();
process.exit(0);
