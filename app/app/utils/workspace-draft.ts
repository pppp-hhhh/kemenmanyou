// 工作台生成会话草稿 —— localStorage 本地持久化（云端表仅占位，暂不实现）
//
// 铁律：
// - 只保存轻量可序列化数据：URL 与 taskId 引用；
// - 严禁写入 base64 / 图片二进制（对 URL 做 data: 前缀防御过滤）；
// - 只挑白名单字段，排除 isAnalyzing / isGenerating / progressMsg 等瞬态字段；
// - 所有 localStorage 访问均 try/catch，隐私模式下静默降级。

import type { CharacterInfo, Panel, Scene, StyleType, TaskStatus } from '~/types/api'

export const WS_DRAFT_KEY = 'kemenmanyou:ws-draft:v2'

/** 结构版本：不兼容时直接丢弃旧草稿（v1 一图一景 → v2 分镜结构） */
export const WS_DRAFT_VERSION = 2

/** 草稿有效期：7 天 */
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** 持久化草稿结构（v2） */
export interface WorkspaceDraft {
  version: number
  savedAt: number
  ownerUserId: string | null
  selectedTextId: number | null
  customText: string
  selectedStyle: StyleType
  scenes: Scene[]
  characters: CharacterInfo[]
  taskId: string | null
  /** 仅含 url 引用与计数，绝不含图片数据本身 */
  taskStatus: TaskStatus | null
}

/** 参与持久化的 store 状态子集（显式列出，天然排除瞬态字段） */
export interface DraftSourceState {
  selectedTextId: number | null
  customText: string
  selectedStyle: StyleType
  scenes: Scene[]
  characters: CharacterInfo[]
  taskId: string | null
  taskStatus: TaskStatus | null
}

const STYLE_VALUES: readonly string[] = ['写实古风', '水墨风格', '彩色插画']

function isValidStyle(value: unknown): value is StyleType {
  return typeof value === 'string' && STYLE_VALUES.includes(value)
}

// ---- 分镜结构白名单清洗（panels/page/text/characters 只保留契约字段） ----

function sanitizePanel(input: unknown): Panel {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const layout = (p.layout && typeof p.layout === 'object' ? p.layout : {}) as Record<string, unknown>
  const text = (p.text && typeof p.text === 'object' ? p.text : {}) as Record<string, unknown>
  const dialogues = Array.isArray(text.dialogues) ? text.dialogues : []
  const narrations = Array.isArray(text.narrations) ? text.narrations : []
  const sfx = Array.isArray(text.sfx) ? text.sfx : []
  return {
    id: typeof p.id === 'string' && p.id ? p.id : '',
    order: typeof p.order === 'number' ? p.order : 0,
    shot: typeof p.shot === 'string' ? p.shot : 'medium',
    angle: typeof p.angle === 'string' ? p.angle : 'eye',
    camera_motion: typeof p.camera_motion === 'string' ? p.camera_motion : 'static',
    composition: typeof p.composition === 'string' ? p.composition : '',
    transition: typeof p.transition === 'string' ? p.transition : 'scene_to_scene',
    description_cn: typeof p.description_cn === 'string' ? p.description_cn : '',
    prompt_en: typeof p.prompt_en === 'string' ? p.prompt_en : '',
    layout: {
      col: typeof layout.col === 'number' ? layout.col : 0,
      row: typeof layout.row === 'number' ? layout.row : 0,
      colspan: typeof layout.colspan === 'number' ? layout.colspan : 1,
      rowspan: typeof layout.rowspan === 'number' ? layout.rowspan : 1,
    },
    text: {
      dialogues: dialogues.map((d: unknown) => {
        const b = (d && typeof d === 'object' ? d : {}) as Record<string, unknown>
        return {
          speaker: typeof b.speaker === 'string' ? b.speaker : '',
          text: typeof b.text === 'string' ? b.text : '',
          type: b.type === 'thought' ? 'thought' : ('speech' as const),
          anchor: typeof b.anchor === 'string' ? b.anchor : 'bottom-left',
        }
      }),
      narrations: narrations.map((n: unknown) => {
        const b = (n && typeof n === 'object' ? n : {}) as Record<string, unknown>
        return {
          text: typeof b.text === 'string' ? b.text : '',
          anchor: typeof b.anchor === 'string' ? b.anchor : 'top-left',
        }
      }),
      sfx: sfx.map((s: unknown) => {
        const b = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>
        return {
          text: typeof b.text === 'string' ? b.text : '',
          anchor: typeof b.anchor === 'string' ? b.anchor : 'right',
          rotate: typeof b.rotate === 'number' ? b.rotate : 0,
          size: b.size === 'small' || b.size === 'large' ? b.size : ('medium' as const),
        }
      }),
    },
    characters: Array.isArray(p.characters)
      ? p.characters.filter((c): c is string => typeof c === 'string')
      : [],
    status: p.status === 'completed' || p.status === 'failed' || p.status === 'processing'
      ? p.status
      : ('pending' as const),
  }
}

function sanitizePage(input: unknown): Scene['page'] {
  const pg = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return {
    cols: typeof pg.cols === 'number' ? pg.cols : 2,
    rows: typeof pg.rows === 'number' ? pg.rows : 2,
    gutter_ratio: typeof pg.gutter_ratio === 'number' ? pg.gutter_ratio : 0.02,
    reading_direction: pg.reading_direction === 'rtl' ? ('rtl' as const) : ('ltr' as const),
    canvas_ratio: typeof pg.canvas_ratio === 'number' || pg.canvas_ratio === null ? pg.canvas_ratio as number | null : null,
  }
}

/** 防御性清洗场景列表：保留 description_cn/prompt_en + 分镜结构（panels/page） */
function sanitizeScenes(input: unknown): Scene[] {
  if (!Array.isArray(input)) return []
  return input.map((item) => {
    const s = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      id: typeof s.id === 'string' ? s.id : '',
      description_cn: typeof s.description_cn === 'string' ? s.description_cn : '',
      prompt_en: typeof s.prompt_en === 'string' ? s.prompt_en : '',
      panels: Array.isArray(s.panels) ? s.panels.map(sanitizePanel) : [],
      page: sanitizePage(s.page),
      image_url: typeof s.image_url === 'string' ? s.image_url : null,
    }
  })
}

/** 防御性清洗任务状态：url 白名单化（拒绝 data: 等 base64 内联内容混入草稿）+ panel_id 保留 */
function sanitizeTaskStatus(input: unknown): TaskStatus | null {
  if (!input || typeof input !== 'object' || !Array.isArray((input as Record<string, unknown>).images))
    return null
  const t = input as Record<string, unknown>
  return {
    status: t.status === 'pending' || t.status === 'processing' || t.status === 'completed' || t.status === 'failed'
      ? t.status
      : 'pending',
    total: typeof t.total === 'number' ? t.total : 0,
    completed: typeof t.completed === 'number' ? t.completed : 0,
    images: (t.images as unknown[]).map((img) => {
      const i = (img && typeof img === 'object' ? img : {}) as Record<string, unknown>
      return {
        index: typeof i.index === 'number' ? i.index : 0,
        panel_id: typeof i.panel_id === 'string' ? i.panel_id : null,
        url: typeof i.url === 'string' && !i.url.startsWith('data:') ? i.url : '',
        status: i.status === 'completed' || i.status === 'processing' || i.status === 'failed'
          ? i.status
          : undefined,
        error: typeof i.error === 'string' ? i.error : undefined,
      }
    }),
    error: typeof t.error === 'string' ? t.error : null,
  }
}

/**
 * 从 store 状态提取可持久化草稿。
 * 只挑白名单字段；瞬态字段（isAnalyzing / isGenerating / progressMsg）不会进入结果，
 * 图片数据也绝不会进入结果（仅 URL 引用）。
 */
export function serializeDraft(state: DraftSourceState, ownerUserId: string | null): WorkspaceDraft {
  return {
    version: WS_DRAFT_VERSION,
    savedAt: Date.now(),
    ownerUserId: typeof ownerUserId === 'string' && ownerUserId ? ownerUserId : null,
    selectedTextId: typeof state.selectedTextId === 'number' ? state.selectedTextId : null,
    customText: typeof state.customText === 'string' ? state.customText : '',
    selectedStyle: isValidStyle(state.selectedStyle) ? state.selectedStyle : '写实古风',
    scenes: sanitizeScenes(state.scenes),
    characters: Array.isArray(state.characters)
      ? state.characters
          .filter((c): c is CharacterInfo => !!c && typeof c === 'object' && typeof c.key === 'string' && !!c.key)
          .map((c) => ({
            key: c.key,
            name_cn: typeof c.name_cn === 'string' ? c.name_cn : '',
            name_en: typeof c.name_en === 'string' ? c.name_en : '',
            appearance_en: typeof c.appearance_en === 'string' ? c.appearance_en : '',
            ref_image_url: typeof c.ref_image_url === 'string' ? c.ref_image_url : null,
          }))
      : [],
    taskId: typeof state.taskId === 'string' && state.taskId ? state.taskId : null,
    taskStatus: sanitizeTaskStatus(state.taskStatus),
  }
}

/**
 * 读取并解析本地草稿；带版本校验与逐字段清洗。
 * 任何异常（损坏数据 / 隐私模式 / SSR）一律返回 null。
 */
export function restoreDraft(): WorkspaceDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(WS_DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const obj = parsed as Record<string, unknown>
    // 版本校验：结构不兼容的旧草稿直接作废
    if (obj.version !== WS_DRAFT_VERSION) return null
    const draft: WorkspaceDraft = {
      version: WS_DRAFT_VERSION,
      savedAt: typeof obj.savedAt === 'number' && Number.isFinite(obj.savedAt) ? obj.savedAt : 0,
      ownerUserId: typeof obj.ownerUserId === 'string' && obj.ownerUserId ? obj.ownerUserId : null,
      selectedTextId: typeof obj.selectedTextId === 'number' ? obj.selectedTextId : null,
      customText: typeof obj.customText === 'string' ? obj.customText : '',
      selectedStyle: isValidStyle(obj.selectedStyle) ? obj.selectedStyle : '写实古风',
      scenes: sanitizeScenes(obj.scenes),
      characters: Array.isArray(obj.characters) ? (obj.characters as CharacterInfo[]) : [],
      taskId: typeof obj.taskId === 'string' && obj.taskId ? obj.taskId : null,
      taskStatus: sanitizeTaskStatus(obj.taskStatus),
    }
    return draft
  }
  catch {
    return null
  }
}

/** 删除本地草稿（幂等；隐私模式下静默降级） */
export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(WS_DRAFT_KEY)
  }
  catch {
    // 忽略：无法访问 localStorage 的环境
  }
}

/** 草稿是否仍在 7 天有效期内 */
export function isFreshDraft(draft: WorkspaceDraft, now: number = Date.now()): boolean {
  if (typeof draft.savedAt !== 'number' || !Number.isFinite(draft.savedAt) || draft.savedAt <= 0)
    return false
  return now - draft.savedAt < DRAFT_MAX_AGE_MS
}

/** 把保存时间格式化为「刚刚 / x 分钟前 / x 小时前 / x 天前」 */
export function formatSavedAgo(savedAt: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - savedAt)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}
