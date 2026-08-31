<template>
  <div class="min-h-screen flex bg-surface-50 dark:bg-surface-900">
    <!-- 左侧品牌展示 -->
    <div class="hidden lg:flex lg:w-2/5 bg-surface-900 dark:bg-surface-950 relative overflow-hidden">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary-500/30 blur-3xl" />
        <div class="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-secondary-500/30 blur-3xl" />
      </div>
      <!-- 内容 -->
      <div class="relative z-10 flex flex-col items-center justify-center w-full px-12">
        <h1 class="text-4xl font-bold text-white mb-4 font-heading">课文漫游</h1>
        <p class="text-neutral-400 text-center text-lg">让课文活起来，画出你的故事</p>
        <div class="mt-12 grid grid-cols-2 gap-4">
          <div class="w-24 h-32 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-neutral-500 text-xs">
            作品展示
          </div>
          <div class="w-24 h-32 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-neutral-500 text-xs">
            AI 创作
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单 -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-8">
      <div class="w-full max-w-md">
        <!-- 移动端标题 -->
        <div class="text-center mb-8 lg:hidden">
          <h1 class="text-3xl font-bold text-primary-500">课文漫游</h1>
          <p class="text-neutral-500 mt-2">登录到您的账户</p>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-8">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-100">欢迎回来</h2>
            <p class="text-sm text-neutral-500 mt-1">登录后继续创作</p>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  邮箱
                </label>
                <input
                  v-model="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  aria-label="邮箱"
                  class="w-full px-3 py-2.5 rounded-xl border border-surface-300 dark:border-neutral-700
                         bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100
                         placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         transition text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  密码
                </label>
                <input
                  v-model="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  aria-label="密码"
                  class="w-full px-3 py-2.5 rounded-xl border border-surface-300 dark:border-neutral-700
                         bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100
                         placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         transition text-sm"
                />
              </div>

              <div v-if="error" class="text-error-500 text-sm text-center bg-error-50 dark:bg-error-500/10 p-3 rounded-md">
                {{ error }}
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300
                       text-white font-medium rounded-xl transition duration-150 flex items-center justify-center
                       focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                <span v-if="loading" class="mr-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </span>
                {{ loading ? '登录中...' : '登录' }}
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-neutral-500 text-sm">
              还没有账户？
              <NuxtLink to="/register" class="text-primary-500 hover:text-primary-600 font-medium">
                注册
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// 如果已登录，跳转到工作台
if (authStore.isAuthenticated) {
  router.push('/workspace')
}

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const result = await authStore.login(email.value, password.value)

    if (result.success) {
      const redirect = route.query.redirect as string || '/workspace'
      router.push(redirect)
    } else {
      error.value = result.error || '登录失败'
    }
  } finally {
    loading.value = false
  }
}
</script>
