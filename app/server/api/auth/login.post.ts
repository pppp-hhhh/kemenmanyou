import { checkRateLimit, getClientIP } from '~~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: '邮箱和密码不能为空'
    })
  }

  // 速率限制：每 IP 每分钟 5 次登录尝试
  const ip = getClientIP(event)
  const limit = checkRateLimit(`login:${ip}`, 5, 60 * 1000)
  if (!limit.allowed) {
    throw createError({
      statusCode: 429,
      message: `登录尝试过于频繁，请 ${limit.retryAfter} 秒后再试`
    })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  let authResponse: any
  try {
    authResponse = await $fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: { email, password },
    })
  } catch (e: any) {
    // 不暴露具体错误（防用户枚举）
    throw createError({
      statusCode: 401,
      message: '邮箱或密码错误'
    })
  }

  const accessToken = authResponse.access_token
  const authHeader = `Bearer ${accessToken}`

  // 一次 RPC 拿 profile（含 role/status）
  const profile: any = await $fetch(`${supabaseUrl}/rest/v1/rpc/get_current_user`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: {},
  })

  // 封禁检查
  if (profile?.status === 'banned') {
    throw createError({
      statusCode: 403,
      message: '账号已被封禁，请联系管理员'
    })
  }

  // 异步更新 last_login_at（不阻塞登录响应）
  $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authResponse.user.id}`, {
    method: 'PATCH',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: { last_login_at: new Date().toISOString() },
  }).catch(() => {})

  return {
    access_token: authResponse.access_token,
    refresh_token: authResponse.refresh_token,
    expires_in: authResponse.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + authResponse.expires_in,
    token_type: authResponse.token_type,
    user: {
      id: authResponse.user.id,
      email: authResponse.user.email,
      role: profile?.role || 'user',
      status: profile?.status || 'active',
      display_name: profile?.display_name,
      avatar_url: profile?.avatar_url,
      created_at: profile?.created_at,
    },
  }
})
