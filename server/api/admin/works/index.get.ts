export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { status, search, page = '1', page_size = '20' } = query

  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }

  const isAdmin = await verifyAdmin(authHeader)
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限'
    })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  // Build query params
  let queryStr = `${supabaseUrl}/rest/v1/works?select=*&order=created_at.desc&offset=${(Number(page) - 1) * Number(page_size)}&limit=${page_size}`

  if (status && status !== 'all') {
    queryStr += `&review_status=eq.${status}`
  }

  if (search) {
    queryStr += `&title=ilike.*${search}*`
  }

  const response = await $fetch(queryStr, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  // Get total count
  let countQuery = `${supabaseUrl}/rest/v1/works?select=id`
  if (status && status !== 'all') {
    countQuery += `&review_status=eq.${status}`
  }

  const countResponse = await $fetch(countQuery, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  return {
    data: response,
    total: (countResponse as any[]).length,
    page: Number(page),
    page_size: Number(page_size),
  }
})

async function verifyAdmin(authHeader: string): Promise<boolean> {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  try {
    const user = await $fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    })

    const profile = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${(user as any).id}`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    })

    return (profile as any[])?.[0]?.role === 'admin'
  } catch {
    return false
  }
}
