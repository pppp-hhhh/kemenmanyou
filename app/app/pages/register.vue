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
        <div class="mt-12 space-y-4">
          <div class="flex items-center gap-3 text-neutral-300">
            <div class="w-8 h-8 rounded-md bg-primary-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="text-sm">AI 智能分析课文场景</span>
          </div>
          <div class="flex items-center gap-3 text-neutral-300">
            <div class="w-8 h-8 rounded-md bg-primary-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="text-sm">多种画风选择</span>
          </div>
          <div class="flex items-center gap-3 text-neutral-300">
            <div class="w-8 h-8 rounded-md bg-primary-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="text-sm">一键生成精美漫画</span>
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
          <p class="text-neutral-500 mt-2">创建新账户</p>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-8">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-100">开始创作</h2>
            <p class="text-sm text-neutral-500 mt-1">注册后即可使用全部功能</p>
          </div>

          <form @submit.prevent="handleRegister">
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
                  minlength="6"
                  placeholder="至少6位"
                  class="w-full px-3 py-2.5 rounded-xl border border-surface-300 dark:border-neutral-700
                         bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100
                         placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         transition text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  确认密码
                </label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  required
                  placeholder="再次输入密码"
                  class="w-full px-3 py-2.5 rounded-xl border border-surface-300 dark:border-neutral-700
                         bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100
                         placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         transition text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1.5">
                  邀请码 <span class="text-neutral-400 font-normal">（选填）</span>
                </label>
                <input
                  v-model="inviteCode"
                  type="text"
                  placeholder="如有邀请码请填写"
                  @blur="verifyInvite"
                  class="w-full px-3 py-2.5 rounded-xl border border-surface-300 dark:border-neutral-700
                         bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100
                         placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         transition text-sm"
                />
                <p v-if="inviteStatus === 'valid'" class="text-xs text-success-500 mt-1">
                  邀请码有效
                </p>
                <p v-else-if="inviteStatus === 'invalid'" class="text-xs text-error-500 mt-1">
                  邀请码无效或已过期
                </p>
                <p v-else-if="inviteStatus === 'checking'" class="text-xs text-neutral-400 mt-1">
                  校验中...
                </p>
              </div>

              <div v-if="error" class="text-error-500 text-sm text-center bg-error-50 dark:bg-error-500/10 p-3 rounded-md">
                {{ error }}
              </div>

              <button
                type="submit"
                :disabled="loading"
                class="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 
                       text-white font-medium rounded-lg transition duration-150 flex items-center justify-center"
              >
                <span v-if="loading" class="mr-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </span>
                {{ loading ? '注册中...' : '注册' }}
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <p class="text-neutral-500 text-sm">
              已有账户？
              <NuxtLink to="/login" class="text-primary-500 hover:text-primary-600 font-medium">
                登录
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

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const inviteCode = ref('')
const inviteStatus = ref<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
const loading = ref(false)
const error = ref('')

// 如果已登录，跳转到工作台
if (authStore.isAuthenticated) {
  router.push('/workspace')
}

const handleRegister = async () => {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (password.value.length < 6) {
    error.value = '密码至少需要6位'
    return
  }

  // 提交前再校验一次邀请码（如果用户填写了但还没 blur）
  if (inviteCode.value && inviteStatus.value !== 'valid') {
    await verifyInvite()
    if (inviteStatus.value === 'invalid') {
      error.value = '邀请码无效或已过期'
      return
    }
  }

  loading.value = true

  try {
    const result = await authStore.register(email.value, password.value, inviteCode.value)

    if (result.success) {
      router.push('/workspace')
    } else {
      error.value = result.error || '注册失败'
    }
  } finally {
    loading.value = false
  }
}

// 实时校验邀请码（防抖 500ms）
let verifyTimer: any = null
const verifyInvite = () => {
  if (verifyTimer) clearTimeout(verifyTimer)
  if (!inviteCode.value) {
    inviteStatus.value = 'idle'
    return
  }
  inviteStatus.value = 'checking'
  verifyTimer = setTimeout(async () => {
    try {
      const res = await $fetch<{ valid: boolean }>('/api/auth/verify-invite', {
        method: 'POST',
        body: { code: inviteCode.value },
      })
      inviteStatus.value = res.valid ? 'valid' : 'invalid'
    } catch {
      inviteStatus.value = 'invalid'
    }
  }, 500)
}
</script>
