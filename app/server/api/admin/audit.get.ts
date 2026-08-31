import { requireAdmin } from '~~/server/utils/auth'
import { getAuditLogs, getAuditActions } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { page = '1', page_size = '20', action } = getQuery(event)
  const data = getAuditLogs(Number(page), Number(page_size), action as any)
  return { ...data, actions: getAuditActions() }
})
