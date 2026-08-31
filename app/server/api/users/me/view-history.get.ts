import { requireLogin } from '~~/server/utils/auth'
import { getViewHistory } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const user = await requireLogin(event)
  const { page = '1', page_size = '20' } = getQuery(event)
  return getViewHistory(user.id, Number(page), Number(page_size))
})
