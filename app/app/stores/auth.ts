import { defineStore } from 'pinia'
import type { User, AuthSession } from '~/types/auth'

interface AuthState {
  user: User | null
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    isAdmin: (state) => state.user?.role === 'admin',
    isAuthLoading: (state) => state.isLoading,
  },

  actions: {
    async initialize() {
      this.isLoading = true
      try {
        // 尝试从 localStorage 恢复 session
        const savedSession = localStorage.getItem('auth_session')
        if (savedSession) {
          const session = JSON.parse(savedSession) as AuthSession
          // 检查是否过期
          if (session.expires_at > Date.now() / 1000) {
            this.session = session
            this.user = session.user
            this.isAuthenticated = true
          } else {
            // 尝试刷新 token
            const refreshed = await this.refresh(session.refresh_token)
            if (!refreshed) {
              this.clearSession()
            }
          }
        }
      } catch (error) {
        console.error('Auth initialize error:', error)
        this.clearSession()
      } finally {
        this.isLoading = false
      }
    },

    async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
      try {
        const response = await $fetch<AuthSession>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        })

        this.session = response
        this.user = response.user
        this.isAuthenticated = true

        // 保存到 localStorage
        localStorage.setItem('auth_session', JSON.stringify(response))

        return { success: true }
      } catch (error: any) {
        console.error('Login error:', error)
        return { success: false, error: error.data?.message || '登录失败' }
      }
    },

    async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
      try {
        const response = await $fetch<AuthSession>('/api/auth/register', {
          method: 'POST',
          body: { email, password },
        })

        // 注册后自动登录
        this.session = response
        this.user = response.user
        this.isAuthenticated = true
        localStorage.setItem('auth_session', JSON.stringify(response))

        return { success: true }
      } catch (error: any) {
        console.error('Register error:', error)
        return { success: false, error: error.data?.message || '注册失败' }
      }
    },

    async logout(): Promise<void> {
      try {
        if (this.session?.access_token) {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.session.access_token}`,
            },
          })
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearSession()
      }
    },

    async refresh(refreshToken: string): Promise<boolean> {
      try {
        const response = await $fetch<AuthSession>('/api/auth/refresh', {
          method: 'POST',
          body: { refresh_token: refreshToken },
        })

        this.session = response
        this.user = response.user
        this.isAuthenticated = true
        localStorage.setItem('auth_session', JSON.stringify(response))

        return true
      } catch (error) {
        console.error('Refresh error:', error)
        return false
      }
    },

    async fetchUser(): Promise<void> {
      if (!this.session?.access_token) return

      try {
        const user = await $fetch<User>('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${this.session.access_token}`,
          },
        })

        this.user = user
      } catch (error) {
        console.error('Fetch user error:', error)
      }
    },

    clearSession() {
      this.user = null
      this.session = null
      this.isAuthenticated = false
      localStorage.removeItem('auth_session')
    },

    getAuthHeader(): string {
      return this.session?.access_token ? `Bearer ${this.session.access_token}` : ''
    },
  },
})
