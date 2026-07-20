import { verifyInviteCode } from '~~/server/utils/inviteCode'

/**
 * 公开接口：注册前校验邀请码是否有效（不要求登录）
 * 用于前端在用户填写邀请码后实时反馈
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const { code } = body

  if (!code) {
    return { valid: false, reason: '邀请码不能为空' }
  }

  const decoded = verifyInviteCode(code)
  if (!decoded) {
    return { valid: false, reason: '邀请码无效或已过期' }
  }

  return {
    valid: true,
    role: decoded.role,
    exp: decoded.exp,
    iat: decoded.iat,
    ttl: decoded.ttl,
  }
})
