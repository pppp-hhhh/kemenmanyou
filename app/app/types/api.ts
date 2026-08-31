// API 类型定义

// ================= 真漫画分镜结构（与 server/schemas.py 同构） =================

// 作品级角色注册表
export interface CharacterInfo {
  key: string
  name_cn: string
  name_en: string
  appearance_en: string
  ref_image_url?: string | null
}

// 台词/思考气泡
export interface SpeechBubble {
  speaker?: string
  text: string
  type?: 'speech' | 'thought'
  anchor?: string          // top-left|top|top-right|left|center|right|bottom-left|bottom|bottom-right 或 {x,y}
}

// 旁白框
export interface NarrationBox {
  text: string
  anchor?: string
}

// 拟声词
export interface SfxText {
  text: string
  anchor?: string
  rotate?: number
  size?: 'small' | 'medium' | 'large'
}

export interface PanelText {
  dialogues?: SpeechBubble[]
  narrations?: NarrationBox[]
  sfx?: SfxText[]
}

// 格在页网格中的位置（0 基）
export interface PanelLayout {
  col?: number
  row?: number
  colspan?: number
  rowspan?: number
}

// 页网格布局（前后端共用同一份数据）
export interface PageLayout {
  cols?: number
  rows?: number
  gutter_ratio?: number     // gutter = ratio × 页宽
  reading_direction?: 'ltr' | 'rtl'
  canvas_ratio?: number | null
}

// 一格（panel）：一个叙事单元，逐格生成一图
export interface Panel {
  id: string
  order?: number
  shot?: string             // wide|medium|closeup|extreme_closeup|establishing|two_shot|over_shoulder
  angle?: string            // eye|low|high|bird|dutch
  camera_motion?: string    // static|pan|push|pull|track
  composition?: string
  transition?: string       // none|moment_to_moment|action_to_action|subject_to_subject|scene_to_scene|aspect_to_aspect
  description_cn?: string
  prompt_en?: string
  layout?: PanelLayout
  text?: PanelText
  characters?: string[]
  image_url?: string | null
  status?: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface Scene {
  id?: string
  description_cn: string
  prompt_en?: string
  panels?: Panel[]
  page?: PageLayout
  image_url?: string | null
}

export interface AnalyzeRequest {
  text: string
  style: string
}

export interface AnalyzeResponse {
  scenes: Scene[]
  characters?: CharacterInfo[]
}

export interface PanelGenEntry {
  panel_id: string
  prompt_en?: string
  size?: string | null
  characters?: string[]
  shot?: string | null
  angle?: string | null
}

export interface GenerateRequest {
  prompts?: string[]
  panels?: PanelGenEntry[]
  character_mode?: 'none' | 'prompt' | 'multiref'
  characters?: CharacterInfo[]
  style: string
}

export interface GenerateResponse {
  task_id: string
}

export interface TaskImage {
  index: number
  panel_id?: string | null
  url: string
  status?: 'completed' | 'failed' | 'processing'
  error?: string
}

export interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total: number
  completed: number
  images: TaskImage[]
  error: string | null
  /** 跨格一致性 VLM QA 报告（后端 CONSISTENCY_QA=true 且后台完成时出现） */
  qa?: Record<string, unknown> | null
}

export interface SaveWorkRequest {
  text_id?: number
  custom_title?: string
  custom_content?: string
  thumbnail?: string
  scenes: Scene[]
  images: string[]
  style: string
  is_public: boolean
}

export interface SaveWorkResponse {
  work_id: number
  message: string
}

export type StyleType = '写实古风' | '水墨风格' | '彩色插画'

export const STYLE_OPTIONS: StyleType[] = ['写实古风', '水墨风格', '彩色插画']

// 作品类型
export type WorkReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Work {
  id: number
  title: string
  author?: string          // 兼容字段
  author_name?: string     // 冗余作者名（新表）
  style: StyleType
  scenes: Scene[]
  images: string[]
  thumbnail?: string
  created_at: string
  is_public: boolean
  review_status?: WorkReviewStatus
  reject_reason?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  tags?: string[]
  view_count?: number
  user_id?: string
  text_id?: number | null
  custom_content?: string
  deleted_at?: string | null
}

// 课文类型（仅课文库，不再含 status/image_url）
export interface Lesson {
  id: number
  title: string
  content: string
  grade?: string | null
  source?: string | null
  user_id?: string | null
  created_at: string
  updated_at?: string
  deleted_at?: string | null
}

// 浏览历史条目（GET /api/users/me/view-history 返回项，标题/封面为浏览时快照）
export interface ViewHistoryItem {
  workId: number
  workTitle: string
  thumbnail: string | null
  lastViewedAt: string
  firstViewedAt: string
  times: number
}

// 浏览历史分页响应
export interface ViewHistoryPage {
  items: ViewHistoryItem[]
  total: number
  page: number
  pageSize: number
}

// 长漫任务类型（独立于 lessons）
export type LessonTaskStatus = 'pending' | 'splitting' | 'completed' | 'failed'

export interface LessonTask {
  id: number
  lesson_id?: number | null
  title: string
  content: string
  status: LessonTaskStatus
  image_url?: string | null
  error_message?: string | null
  user_id?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at?: string
}

// 用户资料
export type UserRole = 'user' | 'admin'
export type UserStatus = 'active' | 'banned'

export interface Profile {
  id: string
  email?: string
  display_name?: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  last_login_at?: string | null
  work_count?: number
  created_at: string
  updated_at?: string
  deleted_at?: string | null
}

// 审计日志
export interface AuditLog {
  id: number
  admin_id?: string | null
  action: string
  target_type: string
  target_id?: number | null
  detail?: any
  created_at: string
}
