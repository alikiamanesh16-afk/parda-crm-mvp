// Fetch Webroba OpenAPI spec and list SMS/inbox-related endpoints with params.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('titanapp')) ?? (await ctx.newPage());

const spec = await page.evaluate(async () => {
  const r = await fetch('/api/v1/openapi.json', { credentials: 'include' });
  return { status: r.status, body: await r.text() };
});
console.log('SPEC STATUS:', spec.status);
if (spec.status === 200) {
  const j = JSON.parse(spec.body);
  const paths = Object.keys(j.paths ?? {});
  console.log('TOTAL PATHS:', paths.length);
  writeFileSync('C:/Users/LENOVO/AppData/Local/hermes/cache/scratch/webroba-openapi.json', spec.body);
  const interesting = paths.filter((p) =>
    /sms|inbox|conversation|message|profile|contact|broadcast|template|sender|phone|number|delivery|event/i.test(p),
  );
  console.log('---INTERESTING---');
  for (const p of interesting) console.log(Object.keys(j.paths[p]).join(',').toUpperCase().ljust(20), p);
} else {
  console.log(spec.body.slice(0, 300));
}
await browser.close();
process.exit(0);
