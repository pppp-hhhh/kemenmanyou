// 认证中间件 - 保护需要登录的路由
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // 公开路由（不需要登录）
  const publicRoutes = ['/login', '/register', '/gallery', '/', '/workspace']

  // 检查是否是公开路由
  if (publicRoutes.some(route => to.path === route || to.path.startsWith('/watch'))) {
    return
  }

  // 等待 auth 初始化完成
  if (authStore.isLoading) {
    return
  }

  // 未登录，重定向到登录页
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
