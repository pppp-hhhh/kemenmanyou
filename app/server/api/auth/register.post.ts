import { hashPassword, issueTokens } from '~~/server/utils/authToken'
import { findUserByEmail, createUser, patchUser } from '~~/server/utils/local-db'
import { verifyInviteCode } from '~~/server/utils/inviteCode'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, invite_code } = body
  if (!email || !password) throw createError({ statusCode: 400, message: '邮箱和密码不能为空' })
  if (findUserByEmail(email)) throw createError({ statusCode: 409, message: '邮箱已被注册' })
  const { hash, salt } = hashPassword(password)
  let role = 'user'
  if (invite_code) {
    const decoded = verifyInviteCode(invite_code)
    if (decoded && decoded.role === 'admin') role = 'admin'
  }
  const user = await createUser({ email, password_hash: hash, password_salt: salt })
  await patchUser(user.id, { role }).catch(() => {})
  const { access, refresh } = issueTokens({ id: user.id, role, email })
  return { access_token: access, refresh_token: refresh, expires_in: 7200, expires_at: Math.floor(Date.now() / 1000) + 7200, token_type: 'bearer', user: { id: user.id, email, role, status: 'active', created_at: user.created_at } }
})
