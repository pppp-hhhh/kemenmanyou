import { verify, issueTokens } from '~~/server/utils/authToken'
import { findUserById } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const { refresh_token } = await readBody(event)
  if (!refresh_token) throw createError({ statusCode: 401, message: '缺少 refresh_token' })
  const claim = verify(refresh_token)
  if (!claim || claim.type !== 'refresh') throw createError({ statusCode: 401, message: 'refresh_token 无效或已过期' })
  const user = await findUserById(claim.sub)
  if (!user || user.status === 'banned') throw createError({ statusCode: 401, message: '用户不存在' })
  const { access, refresh } = issueTokens({ id: user.id, role: user.role, email: user.email })
  return { access_token: access, refresh_token: refresh, expires_in: 7200, expires_at: Math.floor(Date.now() / 1000) + 7200, token_type: 'bearer', user: { id: user.id, email: user.email, role: user.role, status: user.status } }
})
