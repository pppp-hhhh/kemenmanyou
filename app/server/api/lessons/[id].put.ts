import { requireLogin } from '~~/server/utils/auth'
import { updateLesson } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const id = Number(getRouterParam(event, 'id'))
  const { title, content, grade, source } = await readBody(event)
  const l = await updateLesson(id, { title, content, grade, source })
  if (!l) throw createError({ statusCode: 404, message: '课文不存在' })
  return l
})
