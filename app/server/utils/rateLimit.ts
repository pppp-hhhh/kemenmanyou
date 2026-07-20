/**
 * 简单的内存速率限制器（适用于单机部署）
 * 生产环境可改用 Redis 实现
 */

interface RateRecord {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateRecord>()

// 定期清理过期记录（防止内存泄漏）
const CLEANUP_INTERVAL = 5 * 60 * 1000  // 5 分钟
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, record] of buckets.entries()) {
    if (record.resetAt < now) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number  // 秒
}

/**
 * 检查速率限制
 * @param key 限流键（如 `login:${ip}`）
 * @param max 窗口内最大次数
 * @param windowMs 窗口大小（毫秒）
 */
export function checkRateLimit(
  key: string,
  max: number = 5,
  windowMs: number = 60 * 1000
): RateLimitResult {
  cleanup()
  const now = Date.now()
  const record = buckets.get(key)

  if (!record || record.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }

  record.count++
  if (record.count > max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    }
  }

  return { allowed: true, remaining: max - record.count }
}

/**
 * 获取客户端 IP
 */
export function getClientIP(event: any): string {
  const headers = event.node?.req?.headers || {}
  return (
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['x-real-ip'] ||
    headers['cf-connecting-ip'] ||
    event.node?.req?.socket?.remoteAddress ||
    'unknown'
  )
}
