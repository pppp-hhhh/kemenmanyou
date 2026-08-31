import { requireLogin } from '~~/server/utils/auth'
import { getLessons } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  return getLessons()
})
