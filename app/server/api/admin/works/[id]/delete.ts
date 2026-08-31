import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { getWork, softDeleteWork } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const w = await getWork(id)
  if (!w) throw createError({ statusCode: 404, message: '作品不存在' })
  await softDeleteWork(id)
  await writeAuditLog(event, admin.id, 'work_delete', 'works', id)
  return { message: '已删除' }
})
