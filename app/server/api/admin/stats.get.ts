import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // 使用 admin_stats_view 视图
  const stats = await $fetch(`${supabaseUrl}/rest/v1/admin_stats_view?select=*`, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  // 额外查询：最近 7 天每日新增作品数（仪表盘图表用）
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentWorks = await $fetch<any[]>(
    `${supabaseUrl}/rest/v1/works?select=created_at,review_status&created_at=gte.${sevenDaysAgo.toISOString()}&deleted_at=is.null`,
    { method: 'GET', headers: { 'apikey': supabaseKey, 'Authorization': authHeader } }
  )

  // 按日聚合
  const dailyMap: Record<string, { total: number; approved: number; pending: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = { total: 0, approved: 0, pending: 0 }
  }
  for (const w of recentWorks || []) {
    const key = (w.created_at as string).slice(0, 10)
    if (dailyMap[key]) {
      dailyMap[key].total++
      if (w.review_status === 'approved') dailyMap[key].approved++
      if (w.review_status === 'pending') dailyMap[key].pending++
    }
  }

  // 最近 10 条审计日志
  const recentLogs = await $fetch<any[]>(
    `${supabaseUrl}/rest/v1/audit_logs?order=created_at.desc&limit=10`,
    { method: 'GET', headers: { 'apikey': supabaseKey, 'Authorization': authHeader } }
  )

  const s = (stats as any[])?.[0] || {}

  return {
    works: {
      total: s.total_works || 0,
      pending: s.pending_works || 0,
      approved: s.approved_works || 0,
      rejected: s.rejected_works || 0,
    },
    lessons: {
      total: s.total_lessons || 0,
    },
    users: {
      total: s.total_users || 0,
      active: s.active_users || 0,
      banned: s.banned_users || 0,
    },
    daily_works: Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })),
    recent_logs: recentLogs || [],
  }
})
