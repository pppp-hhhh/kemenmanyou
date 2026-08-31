import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    const authStore = useAuthStore()

    // 延迟到 app:mounted 后再初始化，避免在水合前改变 Pinia 状态
    // （服务器渲染的是"未登录"分支，客户端若提前登录会导致 DOM 不匹配）
    nuxtApp.hook('app:mounted', () => {
      authStore.initialize()
    })

    // 全局 $fetch 拦截：自动为所有请求注入当前用户的 Authorization 头
    // （仅当存在有效 token 时注入，避免污染登录/注册/刷新等未登录接口）
    const authedFetch = $fetch.create({
      onRequest({ options }) {
        const token = authStore.session?.access_token
        if (token) {
          options.headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
          }
        }
      },
    })
    // 覆盖全局 $fetch，使页面/组件里所有 $fetch 自动携带认证头
    ;(globalThis as any).$fetch = authedFetch
  }
})
