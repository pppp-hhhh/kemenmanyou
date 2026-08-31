// 本地鉴权工具（替代 Supabase Auth + RLS）
// 令牌由 authToken.ts 签发/校验，用户数据来自本地存储
import type { H3Event } from 'h3'
import { verify } from './authToken'
import { findUserById, addAuditLog } from './local-db'

interface CurrentUser {
  id: string; email: string; role: 'user' | 'admin'
  status: 'active' | 'banned'; display_name?: string | null
  avatar_url?: string | null; created_at?: string
}
export async function getCurrentUser(event: H3Event): Promise<CurrentUser | null> {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const claim = verify(token)
  if (!claim) return null
  const user = await findUserById(claim.sub)
  if (!user) return null
  return {
    id: user.id, email: user.email, role: user.role, status: user.status,
    display_name: user.display_name, avatar_url: user.avatar_url, created_at: user.created_at
  }
}
export async function requireLogin(event: H3Event): Promise<CurrentUser> {
  const user = await getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, message: '未登录或登录已过期' })
  if (user.status === 'banned') throw createError({ statusCode: 403, message: '账号已被封禁，请联系管理员' })
  return user
}
export async function requireAdmin(event: H3Event): Promise<CurrentUser> {
  const user = await requireLogin(event)
  if (user.role !== 'admin') throw createError({ statusCode: 403, message: '需要管理员权限' })
  return user
}
export async function writeAuditLog(event: H3Event, adminId: string, action: string, targetType: string, targetId: number | null = null, detail: any = null): Promise<void> {
  try { await addAuditLog({ admin_id: adminId, action, target_type: targetType, target_id: targetId, detail }) }
  catch (e) { console.warn('audit_logs write failed', e) }
}

