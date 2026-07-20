<template>
  <div class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-20 overflow-hidden">
    <!-- 墨韵背景 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="ink-wash"
           style="top: -10%; left: -5%; width: 50%; height: 60%;
                  background: radial-gradient(ellipse at center, rgba(184, 64, 63, 0.10), transparent 70%);"></div>
      <div class="ink-wash"
           style="bottom: -10%; right: -5%; width: 50%; height: 60%;
                  background: radial-gradient(ellipse at center, rgba(139, 111, 71, 0.12), transparent 70%);"></div>
    </div>

    <!-- 左侧装饰：竖排引文（仅大屏） -->
    <div class="hidden lg:block absolute left-32 top-1/2 -translate-y-1/2">
      <div class="scroll-title text-3xl text-ink-500/40 dark:text-paper-300/40 leading-relaxed"
           style="letter-spacing: 0.5em;">
        来 · 登 录 · 共 · 游 · 画 · 册
      </div>
    </div>

    <!-- 右侧装饰：印章 -->
    <div class="hidden lg:block absolute right-24 top-20">
      <div class="seal animate-seal" style="width: 4.5rem; height: 4.5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
        登<br>录
      </div>
    </div>

    <!-- 中央表单 -->
    <div class="relative w-full max-w-md">
      <!-- 卷首 -->
      <div class="mb-10 animate-ink-bloom">
        <div class="flex items-center gap-3 mb-4">
          <div class="folio">附 · 登录</div>
          <div class="brush-divider w-20"></div>
          <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">SIGN IN</div>
        </div>
        <h1 class="font-display text-5xl text-ink-700 dark:text-paper-50 leading-none">
          来 <span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">登录</span>
        </h1>
        <p class="font-kai text-sm text-ink-400 dark:text-paper-300 mt-4">
          登录后即可入藏作品、览我画册
        </p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleLogin" class="paper-panel paper-panel-edge p-8 space-y-6 animate-ink-bloom delay-2">
        <!-- 邮箱 -->
        <div>
          <label class="flex items-center justify-between mb-2">
            <span class="font-display text-sm text-ink-700 dark:text-paper-100">邮 箱</span>
            <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-300 tracking-seal">EMAIL</span>
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="your@email.com"
            class="input-editorial"
          />
        </div>

        <!-- 密码 -->
        <div>
          <label class="flex items-center justify-between mb-2">
            <span class="font-display text-sm text-ink-700 dark:text-paper-100">密 码</span>
            <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-300 tracking-seal">PASSWORD</span>
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="input-editorial"
          />
        </div>

        <!-- 错误信息 -->
        <div v-if="error"
             class="border-l-2 border-cinnabar-500 bg-cinnabar-50 dark:bg-cinnabar-900/15 px-4 py-3">
          <p class="font-kai text-sm text-cinnabar-700 dark:text-cinnabar-300">{{ error }}</p>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          :disabled="loading"
          class="btn-cinnabar w-full inline-flex items-center justify-center gap-3"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span v-if="loading">登录中...</span>
          <template v-else>
            <span>登 录</span>
            <span class="font-latin italic">→</span>
          </template>
        </button>
      </form>

      <!-- 注册引导 -->
      <div class="mt-8 text-center animate-ink-bloom delay-3">
        <p class="font-kai text-sm text-ink-400 dark:text-paper-300">
          初来乍到？
          <NuxtLink to="/register" class="text-cinnabar-600 dark:text-cinnabar-400 hover:underline font-medium ml-1">
            注册新账户 →
          </NuxtLink>
        </p>

        <!-- 落款 -->
        <div class="mt-12 flex items-center justify-center gap-3">
          <div class="brush-divider w-16"></div>
          <div class="seal seal-tag text-[10px]">课文漫游</div>
          <div class="brush-divider w-16"></div>
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
