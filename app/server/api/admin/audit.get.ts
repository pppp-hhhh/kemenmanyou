import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { action, target_type, admin_id, page = 1, page_size = 50 } = getQuery(event)

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // 列表查询（join profiles 拿 admin email/display_name）
  let queryStr = `${supabaseUrl}/rest/v1/audit_logs?select=*,admin:profiles!admin_id(email,display_name)&order=created_at.desc&offset=${(Number(page) - 1) * Number(page_size)}&limit=${page_size}`

  if (action) {
    queryStr += `&action=eq.${action}`
  }
  if (target_type) {
    queryStr += `&target_type=eq.${target_type}`
  }
  if (admin_id) {
    queryStr += `&admin_id=eq.${admin_id}`
  }

  const response = await $fetch(queryStr, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  // 总数
  let countQuery = `${supabaseUrl}/rest/v1/audit_logs?select=id`
  if (action) countQuery += `&action=eq.${action}`
  if (target_type) countQuery += `&target_type=eq.${target_type}`
  if (admin_id) countQuery += `&admin_id=eq.${admin_id}`

  const countResponse = await $fetch<any[]>(countQuery, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  // 所有出现过的 action 类型（用于过滤下拉）
  const distinctActions = await $fetch<any[]>(
    `${supabaseUrl}/rest/v1/audit_logs?select=action&order=action.asc`,
    {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    }
  ).catch(() => [])

  const actions = Array.from(new Set((distinctActions || []).map((r: any) => r.action)))

  return {
    data: response,
    total: Array.isArray(countResponse) ? countResponse.length : 0,
    page: Number(page),
    page_size: Number(page_size),
    actions,
  }
})
