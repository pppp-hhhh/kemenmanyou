import { getPublicWorks } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const { page = '1', page_size = '20' } = getQuery(event)
  return getPublicWorks(Number(page), Number(page_size))
})
