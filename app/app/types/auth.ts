// Auth 类型定义

export interface User {
  id: string
  email: string
  role?: 'user' | 'admin'
  status?: 'active' | 'banned'
  display_name?: string
  avatar_url?: string
  created_at?: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: User
}
