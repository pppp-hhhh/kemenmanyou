export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  // Get user ID from token
  const user = await $fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  const userId = (user as any).id

  // Get user's own works
  const response = await $fetch(`${supabaseUrl}/rest/v1/works?user_id=eq.${userId}&order=created_at.desc`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  return response
})
