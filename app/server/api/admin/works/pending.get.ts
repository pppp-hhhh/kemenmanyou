import { requireAdmin } from '~~/server/utils/auth'
import { getWorksFilter } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { page = '1', page_size = '20' } = getQuery(event)
  return getWorksFilter(Number(page), Number(page_size), 'pending')
})
