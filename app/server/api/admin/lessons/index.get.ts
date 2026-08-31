import { requireAdmin } from '~~/server/utils/auth'
import { getLessons } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getLessons()
})
