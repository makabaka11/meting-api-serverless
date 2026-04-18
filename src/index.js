import { createApp } from './app.js'
import { stripPrefix } from './utils/prefix.js'
import { refreshQQCookie } from './utils/refresher.js'

const app = createApp()

export default {
  async fetch (request, env, ctx) {

  // ====== 🔐 来源校验开始 ======
  
  const allowHosts = (env.METING_COOKIE_ALLOW_HOSTS || "www.retr0.xyz")
    .split(",")
    .map(h => h.trim())
  
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  // 👉 优先使用 referer（最可靠）
  let source = referer || origin || ""
  
  // 👉 标准化
  source = source.toLowerCase()
  
  const isAllowed = allowHosts.some(host => {
    return source.startsWith(`https://${host}`)
  })
  
  // 👇 只限制 API
  const url = new URL(request.url)
  const isApi = url.pathname.startsWith("/api")
  
  if (isApi) {
    // ❗ 没来源 → 拦（防直接访问）
    if (!source) {
      return new Response("Forbidden", { status: 403 })
    }
  
    // ❗ 来源不合法 → 拦
    if (!isAllowed) {
      return new Response("Forbidden", { status: 403 })
    }
  }
  
  // ====== 🔐 来源校验结束 ======

    const normalizedRequest = stripPrefix(request, env)
    return app.fetch(normalizedRequest, env, ctx)
  },

  async scheduled (event, env, ctx) {
    ctx.waitUntil(refreshQQCookie(env))
  }
}
