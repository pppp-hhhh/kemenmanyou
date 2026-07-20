import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { search, status, page = 1, page_size = 20 } = getQuery(event)

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // 带过滤的用户列表
  let queryStr = `${supabaseUrl}/rest/v1/profiles?select=*&deleted_at=is.null&order=created_at.desc&offset=${(Number(page) - 1) * Number(page_size)}&limit=${page_size}`

  if (status && status !== 'all') {
    queryStr += `&status=eq.${status}`
  }

  if (search) {
    queryStr += `&or=(email.ilike.*${search}*,display_name.ilike.*${search}*)`
  }

  const response = await $fetch(queryStr, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  // 总数
  let countQuery = `${supabaseUrl}/rest/v1/profiles?select=id&deleted_at=is.null`
  if (status && status !== 'all') {
    countQuery += `&status=eq.${status}`
  }
  if (search) {
    countQuery += `&or=(email.ilike.*${search}*,display_name.ilike.*${search}*)`
  }

  const countResponse = await $fetch<any[]>(countQuery, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  return {
    data: response,
    total: Array.isArray(countResponse) ? countResponse.length : 0,
    page: Number(page),
    page_size: Number(page_size),
  }
})
