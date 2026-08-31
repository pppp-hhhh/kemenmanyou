import { requireLogin } from '~~/server/utils/auth'
import { softDeleteLesson } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const id = Number(getRouterParam(event, 'id'))
  const ok = await softDeleteLesson(id)
  if (!ok) throw createError({ statusCode: 404, message: '课文不存在' })
  return { message: '已删除' }
})
