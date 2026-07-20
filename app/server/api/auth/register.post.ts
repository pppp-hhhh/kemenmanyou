import { verifyInviteCode } from '~~/server/utils/inviteCode'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, invite_code } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: '邮箱和密码不能为空'
    })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  // 验证邀请码（仅当用户填了邀请码才校验；非法/过期直接拒绝注册）
  const invite = invite_code ? verifyInviteCode(invite_code) : null
  const isAdminInvite = !!invite && invite.role === 'admin'
  if (invite_code && !invite) {
    throw createError({
      statusCode: 400,
      message: '邀请码无效或已过期'
    })
  }

  const authResponse: any = await $fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
    },
    body: {
      email,
      password,
    },
  })

  const accessToken = authResponse.access_token
  const authHeader = `Bearer ${accessToken}`

  // 如果是合法邀请码注册，按 payload 中的 role 升级
  if (isAdminInvite) {
    try {
      await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authResponse.user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: { role: 'admin' },
      })
    } catch (e) {
      console.warn('Failed to upgrade invite-code user to admin:', e)
    }
  }

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
