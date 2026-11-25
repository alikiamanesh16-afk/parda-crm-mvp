import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Local SMS relay: POST /api/sms/send { to, text } → Webroba /api/v1/messages
// using the logged-in debug-Chrome session (CDP :9222).
// Called only when the CRM user clicks Send in the SMS tab.
function smsRelayPlugin(): Plugin {
  return {
    name: 'sms-relay',
    configureServer(server) {
      server.middlewares.use('/api/sms/send', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ ok: false, error: 'POST only' }))
          return
        }
        let raw = ''
        req.on('data', (c: Buffer) => (raw += c))
        req.on('end', async () => {
          try {
            const { to, text } = JSON.parse(raw) as { to?: string; text?: string }
            if (!to || !text?.trim()) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'to و text لازم است' }))
              return
            }
            const { sendSmsViaSession } = await import('./scripts/sms-relay-core.mjs')
            const result = await sendSmsViaSession(to, text.trim())
            const ok = result.status === 200 || result.status === 201 || result.status === 202
            res.statusCode = ok ? 200 : 502
            res.end(
              JSON.stringify(
                ok
                  ? { ok: true, delivery: safeParse(result.body) }
                  : { ok: false, error: explainError(result) },
              ),
            )
          } catch (e) {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                ok: false,
                error:
                  'رله پیامک در دسترس نیست (کروم دیباگ باز است؟): ' +
                  String(e).slice(0, 120),
              }),
            )
          }
        })
      })
    },
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

function explainError(result: { status: number; body: string }): string {
  try {
    const j = JSON.parse(result.body)
    if (j?.fields?.[0]?.message) return j.fields[0].message
    if (j?.detail) return j.detail
    if (j?.title) return j.title
  } catch {}
  return `خطای ${result.status}`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), smsRelayPlugin()],
})
