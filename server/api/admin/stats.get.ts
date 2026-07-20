export default defineEventHandler(async (event) => {
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

  // Get counts
  const [worksCount, lessonsCount, usersCount, pendingCount, approvedCount] = await Promise.all([
    // Total works
    $fetch(`${supabaseUrl}/rest/v1/works?select=id`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    }),
    // Total lessons
    $fetch(`${supabaseUrl}/rest/v1/lessons?select=id`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    }),
    // Total users
    $fetch(`${supabaseUrl}/rest/v1/profiles?select=id`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    }),
    // Pending works
    $fetch(`${supabaseUrl}/rest/v1/works?review_status=eq.pending&select=id`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    }),
    // Approved works
    $fetch(`${supabaseUrl}/rest/v1/works?review_status=eq.approved&select=id`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    }),
  ])

  return {
    works: {
      total: (worksCount as any[]).length,
      pending: (pendingCount as any[]).length,
      approved: (approvedCount as any[]).length,
    },
    lessons: {
      total: (lessonsCount as any[]).length,
    },
    users: {
      total: (usersCount as any[]).length,
    },
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
