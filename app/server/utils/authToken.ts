// HMAC-SHA256 令牌工具（本地鉴权，替代 Supabase Auth）
import crypto from 'node:crypto'

const SECRET = () => process.env.AUTH_SECRET || process.env.INVITE_CODE_SECRET || 'fallback-local-dev-secret'
export const ACCESS_TTL = 7200
export const REFRESH_TTL = 2592000
interface Claim { sub: string; role: string; email: string; iat: number; exp: number; type: 'access' | 'refresh'; jti: string }
function b64(s: string): string { return Buffer.from(s).toString('base64url') }
function unB64(s: string): string { return Buffer.from(s, 'base64url').toString('utf8') }
function sign(payload: any): string {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64(JSON.stringify(payload))
  const sig = b64(crypto.createHmac('sha256', SECRET()).update(header + '.' + body).digest())
  return header + '.' + body + '.' + sig
}
export function verify(token: string): Claim | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(unB64(parts[1])) as Claim
    const expected = crypto.createHmac('sha256', SECRET()).update(parts[0] + '.' + parts[1]).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) return null
    if (payload.exp < Date.now() / 1000) return null
    return payload
  } catch { return null }
}
export function hashPassword(pw: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const h = crypto.scryptSync(pw, salt, 64).toString('hex')
  return { hash: h, salt }
}
export function verifyPassword(pw: string, hash: string, salt: string): boolean {
  try { return crypto.timingSafeEqual(Buffer.from(crypto.scryptSync(pw, salt, 64).toString('hex')), Buffer.from(hash)) } catch { return false }
}
export function issueTokens(user: { id: string; role: string; email: string }) {
  const now = Math.floor(Date.now() / 1000)
  const access = sign({ sub: user.id, role: user.role, email: user.email, iat: now, exp: now + ACCESS_TTL, type: 'access', jti: crypto.randomUUID() })
  const refresh = sign({ sub: user.id, role: user.role, email: user.email, iat: now, exp: now + REFRESH_TTL, type: 'refresh', jti: crypto.randomUUID() })
  return { access, refresh }
}

