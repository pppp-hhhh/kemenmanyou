// API 类型定义

export interface Scene {
  description_cn: string
  prompt_en: string
}

export interface AnalyzeRequest {
  text: string
  style: string
}

export interface AnalyzeResponse {
  scenes: Scene[]
}

export interface GenerateRequest {
  prompts: string[]
  style: string
}

export interface GenerateResponse {
  task_id: string
}

export interface TaskImage {
  index: number
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
