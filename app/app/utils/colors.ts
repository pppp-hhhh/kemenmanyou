/**
 * 统一颜色配置
 *
 * 所有页面的颜色值从这里引用，禁止在页面中重复定义。
 * Tailwind 类名用 tailwind.config.js，JS 中需要的值用这个文件。
 */

// ── 画风标签颜色（Tailwind 类名，用于 :class 绑定） ──
export const styleColors: Record<string, string> = {
  '写实古风': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  '水墨风格': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  '彩色插画': 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
}

// ── 审核状态颜色（Tailwind 类名） ──
export const reviewStatusColors: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
}

// ── 审核状态中文名 ──
export const reviewStatusLabels: Record<string, string> = {
  pending:  '待审核',
  approved: '已公开',
  rejected: '已拒绝',
}

// ── 审计日志操作颜色（Tailwind 类名） ──
export const auditActionColors: Record<string, string> = {
  approve: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  delete:  'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  ban:     'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  role:    'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  default: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400',
}

// ── 画风对应的 Prompt 前缀 ──
export const stylePromptPrefix: Record<string, string> = {
  '写实古风': 'realistic ancient Chinese style, traditional Chinese painting aesthetic, detailed historical accuracy,',
  '水墨风格': 'Chinese ink painting style, sumi-e, black and white, traditional brush strokes, minimalist composition,',
  '彩色插画': 'colorful illustration, vibrant modern cartoon style, anime-inspired, bright saturated colors,',
}

// ── 通用工具函数 ──

/** 格式化日期为中文短格式 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** 格式化日期为中文长格式 */
export const formatDateLong = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** 格式化为相对时间（xx 前） */
export const formatAgo = (dateStr: string): string => {
  const t = new Date(dateStr).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

/** 获取作品封面图 */
export const getThumbnail = (work: { thumbnail?: string; images?: string[] }): string => {
  if (work.thumbnail) return work.thumbnail
  if (work.images && work.images.length > 0) return work.images[0]
  return '/placeholder.png'
}
