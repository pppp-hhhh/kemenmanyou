import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { generateInviteCode, formatTtl } from '~~/server/utils/inviteCode'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readBody(event).catch(() => ({}))
  const expiresInDays = Number(body?.expires_in_days) || 7

  // 限制有效期范围（1 ~ 90 天）
  const days = Math.min(90, Math.max(1, Math.floor(expiresInDays)))

  const code = generateInviteCode({ role: 'admin', expiresInDays: days })
  const now = Math.floor(Date.now() / 1000)

  await writeAuditLog(event, admin.id, 'invite_code_generate', 'system', null, {
    expires_in_days: days,
    exp: now + days * 86400,
  })

  return {
    code,
    role: 'admin',
    expires_in_days: days,
    exp: now + days * 86400,
    ttl_text: formatTtl(days * 86400),
    note: '请妥善保存，邀请码仅在过期前有效，注册时填入即可授予管理员身份',
  }
})
