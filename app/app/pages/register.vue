<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">课文漫游</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">创建新账户</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <form @submit.prevent="handleRegister">
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱
              </label>
              <input
                v-model="email"
                type="email"
                required
                placeholder="your@email.com"
                class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                密码
              </label>
              <input
                v-model="password"
                type="password"
                required
                minlength="6"
                placeholder="至少6位"
                class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                确认密码
              </label>
              <input
                v-model="confirmPassword"
                type="password"
                required
                placeholder="再次输入密码"
                class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邀请码 <span class="text-gray-400 font-normal">（选填，填写后注册为管理员）</span>
              </label>
              <input
                v-model="inviteCode"
                type="text"
                placeholder="如有邀请码请填写"
                @blur="verifyInvite"
                class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <p v-if="inviteStatus === 'valid'" class="text-xs text-green-600 mt-1">
                ✓ 邀请码有效，注册后将获得管理员身份
              </p>
              <p v-else-if="inviteStatus === 'invalid'" class="text-xs text-red-600 mt-1">
                ✗ 邀请码无效或已过期
              </p>
              <p v-else-if="inviteStatus === 'checking'" class="text-xs text-gray-400 mt-1">
                校验中...
              </p>
            </div>

            <div v-if="error" class="text-red-500 text-sm text-center">
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
            >
              <span v-if="loading" class="mr-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </span>
              {{ loading ? '注册中...' : '注册' }}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            已有账户？
            <NuxtLink to="/login" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              登录
            </NuxtLink>
          </p>
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
