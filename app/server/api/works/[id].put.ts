import { requireLogin } from '~~/server/utils/auth'
import { getWork, updateWork } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const user = await requireLogin(event)
  const id = Number(getRouterParam(event, 'id'))
  const w = await getWork(id)
  if (!w) throw createError({ statusCode: 404, message: '作品不存在' })
  if (w.author_id !== user.id) throw createError({ statusCode: 403, message: '无权限' })
  const body = await readBody(event)
  const updated = await updateWork(id, { title: body.title, custom_title: body.custom_title, custom_content: body.custom_content, thumbnail: body.thumbnail, style: body.style, tags: body.tags, is_public: body.is_public })
  return updated ? { message: '更新成功', ...updated } : { message: '更新成功' }
})
