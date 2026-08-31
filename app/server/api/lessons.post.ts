import { requireLogin } from '~~/server/utils/auth'
import { addLesson } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const { title, content, grade, source } = await readBody(event)
  if (!title || !content) throw createError({ statusCode: 400, message: '标题和内容不能为空' })
  const l = await addLesson(title, content, grade, source)
  return l
})
