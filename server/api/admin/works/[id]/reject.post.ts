export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
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

  // Get current user ID
  const user = await $fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  // Update work status to rejected
  const response = await $fetch(`${supabaseUrl}/rest/v1/works?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Prefer': 'return=representation',
      'Content-Type': 'application/json',
    },
    body: {
      review_status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: (user as any).id,
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
