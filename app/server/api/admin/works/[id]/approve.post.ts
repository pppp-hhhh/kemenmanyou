import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { updateWorkStatus } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const w = await updateWorkStatus(id, 'approved')
  if (!w) throw createError({ statusCode: 404, message: '作品不存在' })
  await writeAuditLog(event, admin.id, 'work_approve', 'works', id)
  return { message: '已审核通过', ...w }
})
