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
  
  const origin = request.headers.get("origin") || ""
  const referer = request.headers.get("referer") || ""
  
  // 判断是否命中允许列表
  const isAllowed = allowHosts.some(host => {
    const url = `https://${host}`
    return origin.startsWith(url) || referer.startsWith(url)
  })
  
  // 👇 判断是否是 API 请求（只限制 API，不限制资源）
  const url = new URL(request.url)
  const isApi = url.pathname.startsWith("/api")
  
  // ❗ 关键逻辑
  if (isApi) {
    // 有来源但不合法 → 拦
    if ((origin || referer) && !isAllowed) {
      return new Response("Forbidden", { status: 403 })
    }
  
    // 无来源（浏览器直接访问）→ 也拦
    if (!origin && !referer) {
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
