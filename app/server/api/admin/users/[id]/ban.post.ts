import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { findUserById, patchUser } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const user = await findUserById(id)
  if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
  await patchUser(id, { status: 'banned' })
  await writeAuditLog(event, admin.id, 'user_ban', 'users', null, { user_id: id, email: user.email })
  return { message: '已封禁' }
})
