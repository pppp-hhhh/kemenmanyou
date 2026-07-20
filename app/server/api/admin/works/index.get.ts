import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { page = 1, page_size = 20, status, search } = getQuery(event)

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // Build query params（排除已软删除的）
  let queryStr = `${supabaseUrl}/rest/v1/works?select=*&deleted_at=is.null&order=created_at.desc&offset=${(Number(page) - 1) * Number(page_size)}&limit=${page_size}`

  if (status && status !== 'all') {
    queryStr += `&review_status=eq.${status}`
  }

  if (search) {
    queryStr += `&title=ilike.*${search}*`
  }

  const response = await $fetch(queryStr, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  // Get total count
  let countQuery = `${supabaseUrl}/rest/v1/works?select=id&deleted_at=is.null`
  if (status && status !== 'all') {
    countQuery += `&review_status=eq.${status}`
  }
  if (search) {
    countQuery += `&title=ilike.*${search}*`
  }

  const countResponse = await $fetch<any[]>(countQuery, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Prefer': 'count=exact',
    },
  })

  // PostgREST 在 header 里返回总数，但 ofetch 拿不到 header，只能用 length
  const total = Array.isArray(countResponse) ? countResponse.length : 0

  return {
    data: response,
    total,
    page: Number(page),
    page_size: Number(page_size),
  }
})
