import { createApp } from './app.js'
import { stripPrefix } from './utils/prefix.js'
import { refreshQQCookie } from './utils/refresher.js'

const app = createApp()

export default {
  async fetch (request, env, ctx) {

    // ====== 🔐 来源校验开始 ======
    const allowHost = env.METING_COOKIE_ALLOW_HOSTS || "www.retr0.xyz"

    const origin = request.headers.get("origin") || ""
    const referer = request.headers.get("referer") || ""

    const allowedOrigin = `https://${allowHost}`

    const isAllowed =
      origin.startsWith(allowedOrigin) ||
      referer.startsWith(allowedOrigin)

    // ❗ 拦截非法请求（无来源 / 非本站）
    if (!isAllowed) {
      return new Response("Forbidden", { status: 403 })
    }
    // ====== 🔐 来源校验结束 ======

    const normalizedRequest = stripPrefix(request, env)
    return app.fetch(normalizedRequest, env, ctx)
  },

  async scheduled (event, env, ctx) {
    ctx.waitUntil(refreshQQCookie(env))
  }
}
