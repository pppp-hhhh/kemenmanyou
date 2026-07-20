import type { H3Event } from 'h3'

interface CurrentUser {
  id: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'banned'
  display_name?: string | null
  avatar_url?: string | null
}

const SUPABASE_URL = 'https://sxxngtcljzwhvajubwno.supabase.co'

function getSupabaseKey(): string {
  return useRuntimeConfig().supabaseKey as string
}

/**
 * 获取当前登录用户（基于 Authorization header）
 * 通过 RPC 一次查询拿到 user + profile 信息
 */
export async function getCurrentUser(event: H3Event): Promise<CurrentUser | null> {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) return null

  const supabaseKey = getSupabaseKey()

  try {
    const res = await $fetch<{ data: CurrentUser | null }>(`${SUPABASE_URL}/rest/v1/rpc/get_current_user`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: {},
    })
    // PostgREST RPC 返回的是直接 JSON（不是 { data: ... }）
    return (res as any) as CurrentUser
  } catch (e) {
    return null
  }
}

/**
 * 要求登录，否则抛 401
 */
export async function requireLogin(event: H3Event): Promise<CurrentUser> {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: '未登录或登录已过期',
    })
  }
  if (user.status === 'banned') {
    throw createError({
      statusCode: 403,
      message: '账号已被封禁，请联系管理员',
    })
  }
  return user
}

/**
 * 要求管理员权限，否则抛 403
 */
export async function requireAdmin(event: H3Event): Promise<CurrentUser> {
  const user = await requireLogin(event)
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限',
    })
  }
  return user
}

/**
 * 写入审计日志（best-effort，失败不阻塞主流程）
 */
export async function writeAuditLog(
  event: H3Event,
  adminId: string,
  action: string,
  targetType: string,
  targetId: number | null = null,
  detail: any = null
): Promise<void> {
  const supabaseKey = getSupabaseKey()
  const authHeader = getHeader(event, 'authorization')

  try {
    await $fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': authHeader || `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        detail,
      },
    })
  } catch (e) {
    console.warn('audit_logs write failed', e)
  }
}
