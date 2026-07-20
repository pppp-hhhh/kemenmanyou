import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * HMAC 签名邀请码（无状态、可加密、可验证、可过期）
 *
 * 格式: {payloadBase64Url}.{signatureBase64Url}
 * payload: { role, exp, iat, jti }
 *   - role:  'admin' (可扩展)
 *   - exp:   过期 unix 秒
 *   - iat:   签发 unix 秒
 *   - jti:   随机 id（用于唯一标识一次签发）
 */

const DEFAULT_EXPIRES_DAYS = 7
const DEFAULT_ROLE: InviteRole = 'admin'
export type InviteRole = 'admin'

interface InvitePayload {
  role: InviteRole
  iat: number  // 签发时间（秒）
  exp: number  // 过期时间（秒）
  jti: string  // 唯一 id
}

export interface DecodedInvite {
  role: InviteRole
  iat: number
  exp: number
  jti: string
  /** 剩余有效秒数（已过期则为 0） */
  ttl: number
}

/** 获取 HMAC 密钥（来自环境变量；未设置则使用进程级随机密钥，重启后失效） */
function getSecret(): string {
  const fromEnv = process.env.INVITE_CODE_SECRET
  if (fromEnv && fromEnv.length >= 16) return fromEnv
  // 兜底：进程级随机密钥（仅适合开发，生产必须设置 INVITE_CODE_SECRET）
  if (!(globalThis as any).__INVITE_SECRET__) {
    (globalThis as any).__INVITE_SECRET__ = randomBytes(32).toString('hex')
  }
  return (globalThis as any).__INVITE_SECRET__ as string
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecode(input: string): Buffer {
  const pad = '='.repeat((4 - (input.length % 4)) % 4)
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(normalized, 'base64')
}

function sign(payloadStr: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(payloadStr, 'utf8').digest())
}

/**
 * 生成邀请码
 * @param options.role       授予的角色（默认 admin）
 * @param options.expiresInDays 过期天数（默认 7）
 */
export function generateInviteCode(options?: { role?: InviteRole; expiresInDays?: number }): string {
  const role = options?.role ?? DEFAULT_ROLE
  const days = options?.expiresInDays ?? DEFAULT_EXPIRES_DAYS
  const now = Math.floor(Date.now() / 1000)

  const payload: InvitePayload = {
    role,
    iat: now,
    exp: now + days * 86400,
    jti: randomBytes(6).toString('hex'),
  }

  const payloadStr = JSON.stringify(payload)
  const payloadB64 = b64url(payloadStr)
  const signature = sign(payloadB64, getSecret())

  return `${payloadB64}.${signature}`
}

/**
 * 验证邀请码
 * @returns 解码后的 payload；签名错误或已过期返回 null
 */
export function verifyInviteCode(code: string): DecodedInvite | null {
  if (!code || typeof code !== 'string') return null
  const parts = code.split('.')
  if (parts.length !== 2) return null

  const [payloadB64, signature] = parts
  const expectedSig = sign(payloadB64, getSecret())

  // 常量时间比较防时序攻击
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length) return null
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null

  let payload: InvitePayload
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'))
  } catch {
    return null
  }

  if (!payload.exp || !payload.role || !payload.jti) return null

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) return null

  return {
    role: payload.role,
    iat: payload.iat,
    exp: payload.exp,
    jti: payload.jti,
    ttl: payload.exp - now,
  }
}

/** 格式化剩余有效期为人类可读 */
export function formatTtl(ttl: number): string {
  if (ttl <= 0) return '已过期'
  const days = Math.floor(ttl / 86400)
  const hours = Math.floor((ttl % 86400) / 3600)
  const minutes = Math.floor((ttl % 3600) / 60)
  if (days > 0) return `${days} 天 ${hours} 小时`
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes} 分钟`
}
