export default defineEventHandler(async (event) => {
  // Get user profile to check admin role
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }

  // Verify admin role
  const isAdmin = await verifyAdmin(authHeader)
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限'
    })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  // Get pending works
  const response = await $fetch(`${supabaseUrl}/rest/v1/works?review_status=eq.pending&order=created_at.desc`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  return response
})

async function verifyAdmin(authHeader: string): Promise<boolean> {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  try {
    const user = await $fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': authHeader,
      },
    })

    const profile = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${(user as any).id}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': authHeader,
      },
    })

    return (profile as any[])?.[0]?.role === 'admin'
  } catch {
    return false
  }
}
