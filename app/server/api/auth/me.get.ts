export default defineEventHandler(async (event) => {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }

  const authUser: any = await $fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  const profile: any = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authUser.id}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  const userProfile = Array.isArray(profile) ? profile[0] : profile

  return {
    id: authUser.id,
    email: authUser.email,
    role: userProfile?.role || 'user',
    display_name: userProfile?.display_name,
    avatar_url: userProfile?.avatar_url,
    created_at: userProfile?.created_at,
  }
})
