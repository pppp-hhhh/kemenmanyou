import { requireAdmin } from '~~/server/utils/auth'
import { getAdminStats, getRecentAuditLogs } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const s = getAdminStats()
  return {
    works: { total: s.total_works, pending: s.pending_works, approved: s.approved_works, rejected: s.rejected_works },
    lessons: { total: s.total_lessons },
    users: { total: s.total_users, active: s.active_users, banned: s.banned_users },
    daily_works: s.daily_works,
    recent_logs: getRecentAuditLogs(10),
  }
})
