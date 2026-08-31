import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { softDeleteLesson } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const ok = await softDeleteLesson(id)
  if (!ok) throw createError({ statusCode: 404, message: '课文不存在' })
  await writeAuditLog(event, admin.id, 'lesson_delete', 'lessons', id)
  return { message: '已删除' }
})
