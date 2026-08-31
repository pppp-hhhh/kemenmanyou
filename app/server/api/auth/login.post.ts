import { checkRateLimit, getClientIP } from '~~/server/utils/rateLimit'
import { verifyPassword, issueTokens } from '~~/server/utils/authToken'
import { findUserByEmail, patchUser, nowISO } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  if (!email || !password) throw createError({ statusCode: 400, message: '邮箱和密码不能为空' })
  const ip = getClientIP(event)
  const limit = checkRateLimit('login:' + ip, 5, 60 * 1000)
  if (!limit.allowed) throw createError({ statusCode: 429, message: '登录尝试过于频繁，请 ' + limit.retryAfter + ' 秒后再试' })
  const user = findUserByEmail(email)
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash, user.password_salt || '')) {
    throw createError({ statusCode: 401, message: '邮箱或密码错误' })
  }
  if (user.status === 'banned') throw createError({ statusCode: 403, message: '账号已被封禁，请联系管理员' })
  await patchUser(user.id, { last_login_at: nowISO() }).catch(() => {})
  const { access, refresh } = issueTokens({ id: user.id, role: user.role, email: user.email })
  return { access_token: access, refresh_token: refresh, expires_in: 7200, expires_at: Math.floor(Date.now() / 1000) + 7200, token_type: 'bearer', user: { id: user.id, email: user.email, role: user.role, status: user.status, display_name: user.display_name, avatar_url: user.avatar_url, created_at: user.created_at } }
})
