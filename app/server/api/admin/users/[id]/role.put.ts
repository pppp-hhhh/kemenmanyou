import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { findUserById, patchUser } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const { role } = await readBody(event)
  const user = await findUserById(id)
  if (!user) throw createError({ statusCode: 404, message: '用户不存在' })
  if (role !== 'admin' && role !== 'user') throw createError({ statusCode: 400, message: '无效角色' })
  await patchUser(id, { role: role as any })
  await writeAuditLog(event, admin.id, 'user_role_change', 'users', null, { user_id: id, role })
  return { message: '角色已更新', role }
})
