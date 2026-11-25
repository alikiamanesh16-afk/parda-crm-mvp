// Local SMS relay: POST /api/sms/send { to, text }
// Forwards to Webroba POST /api/v1/messages using the logged-in debug-Chrome
// session (CDP on :9222). Called ONLY when the CRM user presses Send.
import { chromium } from 'playwright';

const WSBASE = 'https://hamgam.titanapp.dev';

let browserPromise = null;

async function getPage() {
  if (!browserPromise) {
    browserPromise = chromium.connectOverCDP('http://127.0.0.1:9222').then(async (browser) => {
      const ctx = browser.contexts()[0];
      let page = ctx.pages().find((p) => p.url().includes('titanapp'));
      if (!page) {
        page = await ctx.newPage();
        await page.goto(`${WSBASE}/o/parda/w/checkout`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      }
      return { browser, page };
    });
  }
  return browserPromise;
}

export async function sendSmsViaSession(to, text) {
  const { page } = await getPage();
  const idem = `parda-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return page.evaluate(
    async ({ WSBASE, to, text, idem }) => {
      const meRes = await fetch(`${WSBASE}/api/v1/me`, { credentials: 'include' });
      if (!meRes.ok) {
        return { ok: false, error: `نشست وب‌ربا منقضی شده (${meRes.status}) — دوباره لاگین کن` };
      }
      const me = await meRes.json();
      const ws = me.organizations?.[0]?.workspaces?.[0]?.id;
      if (!ws) return { ok: false, error: 'ورک‌اسپیس پیدا نشد' };

      const res = await fetch(`${WSBASE}/api/v1/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Hamgam-Workspace': ws,
          'X-Hamgam-Csrf': '1',
          'Idempotency-Key': idem,
        },
        body: JSON.stringify({
          to: { address: to },
          content: { text },
          kind: 'sms',
          category: 'transactional',
        }),
      });
      const body = await res.text();
      return { status: res.status, body, ws };
    },
    { WSBASE, to, text, idem },
  );
}
