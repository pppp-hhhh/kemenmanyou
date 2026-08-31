// 直接由 Nuxt/Nitro 提供仓库根 static/ 目录下的静态文件（不再经 Python 代理）
// 与 local-db.ts 一致：dev 时 process.cwd() 为 app/，../static 即仓库根 static/
import fs from 'node:fs'
import path from 'node:path'

const STATIC_ROOT = path.resolve(process.cwd(), '..', 'static')

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export default defineEventHandler((event) => {
  const rel = getRouterParam(event, 'path') || ''

  // 防御目录穿越
  const safeRel = rel.split('/').filter(Boolean)
  if (safeRel.some(seg => seg === '..' || seg.includes('\\') || seg.includes(':'))) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  const filePath = path.join(STATIC_ROOT, ...safeRel)

  if (!filePath.startsWith(STATIC_ROOT)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  let stat: fs.Stats
  try {
    stat = fs.statSync(filePath)
  }
  catch {
    throw createError({ statusCode: 404, message: 'Not Found' })
  }
  if (!stat.isFile()) {
    throw createError({ statusCode: 404, message: 'Not Found' })
  }

  // 简单缓存：内容以文件 mtime 为准
  setResponseHeader(event, 'Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  setResponseHeader(event, 'Last-Modified', stat.mtime.toUTCString())
  return fs.readFileSync(filePath)
})
