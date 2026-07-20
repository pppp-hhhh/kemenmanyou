export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { refresh_token } = body

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  const authResponse: any = await $fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
    },
    body: {
      refresh_token,
    },
  })

  const accessToken = authResponse.access_token
  const authHeader = `Bearer ${accessToken}`

  const profile: any = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authResponse.user.id}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
    },
  })

  const userProfile = Array.isArray(profile) ? profile[0] : profile

  return {
    access_token: authResponse.access_token,
    refresh_token: authResponse.refresh_token,
    expires_in: authResponse.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + authResponse.expires_in,
    token_type: authResponse.token_type,
    user: {
      id: authResponse.user.id,
      email: authResponse.user.email,
      role: userProfile?.role || 'user',
      display_name: userProfile?.display_name,
      avatar_url: userProfile?.avatar_url,
      created_at: userProfile?.created_at,
    },
  }
})
