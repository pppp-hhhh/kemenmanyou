export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { role } = body

  if (!role || !['user', 'admin'].includes(role)) {
    throw createError({
      statusCode: 400,
      message: '无效的角色'
    })
  }

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

  const response = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: {
      role,
      updated_at: new Date().toISOString(),
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
