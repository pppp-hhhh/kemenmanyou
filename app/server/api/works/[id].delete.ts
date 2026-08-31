import { requireLogin } from '~~/server/utils/auth'
import { getWork, softDeleteWork } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const user = await requireLogin(event)
  const id = Number(getRouterParam(event, 'id'))
  const w = await getWork(id)
  if (!w) throw createError({ statusCode: 404, message: '作品不存在' })
  if (w.author_id !== user.id) throw createError({ statusCode: 403, message: '无权限' })
  await softDeleteWork(id)
  return { message: '已删除' }
})
