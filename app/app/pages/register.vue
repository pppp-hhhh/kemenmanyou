<template>
  <div class="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-20 overflow-hidden">
    <!-- 墨韵背景 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="ink-wash"
           style="top: -10%; right: -5%; width: 50%; height: 60%;
                  background: radial-gradient(ellipse at center, rgba(184, 64, 63, 0.10), transparent 70%);"></div>
      <div class="ink-wash"
           style="bottom: -10%; left: -5%; width: 50%; height: 60%;
                  background: radial-gradient(ellipse at center, rgba(139, 111, 71, 0.12), transparent 70%);"></div>
    </div>

    <!-- 左侧装饰：印章 -->
    <div class="hidden lg:block absolute left-24 top-20">
      <div class="seal animate-seal" style="width: 4.5rem; height: 4.5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
        注<br>册
      </div>
    </div>

    <!-- 右侧装饰：竖排引文 -->
    <div class="hidden lg:block absolute right-32 top-1/2 -translate-y-1/2">
      <div class="scroll-title text-3xl text-ink-500/40 dark:text-paper-300/40 leading-relaxed"
           style="letter-spacing: 0.5em;">
        新 · 用 · 户 · 入 · 卷 · 同 · 游 · 画 · 册
      </div>
    </div>

    <!-- 中央表单 -->
    <div class="relative w-full max-w-md">
      <!-- 卷首 -->
      <div class="mb-10 animate-ink-bloom">
        <div class="flex items-center gap-3 mb-4">
          <div class="folio">附 · 注册</div>
          <div class="brush-divider w-20"></div>
          <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">SIGN UP</div>
        </div>
        <h1 class="font-display text-5xl text-ink-700 dark:text-paper-50 leading-none">
          新 <span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">注册</span>
        </h1>
        <p class="font-kai text-sm text-ink-400 dark:text-paper-300 mt-4">
          创建账户，开启你的画册之旅
        </p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleRegister" class="paper-panel paper-panel-edge p-8 space-y-5 animate-ink-bloom delay-2">
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
            minlength="6"
            placeholder="至少 6 位"
            class="input-editorial"
          />
        </div>

        <!-- 确认密码 -->
        <div>
          <label class="flex items-center justify-between mb-2">
            <span class="font-display text-sm text-ink-700 dark:text-paper-100">复 输</span>
            <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-300 tracking-seal">CONFIRM</span>
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="再次输入密码"
            class="input-editorial"
          />
        </div>

        <!-- 邀请码 -->
        <div>
          <label class="flex items-center justify-between mb-2">
            <span class="font-display text-sm text-ink-700 dark:text-paper-100">邀 请 码</span>
            <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-300 tracking-seal">
              INVITE · OPTIONAL
            </span>
          </label>
          <input
            v-model="inviteCode"
            type="text"
            placeholder="如有邀请码请填写（注册为管理员）"
            @blur="verifyInvite"
            class="input-editorial"
          />
          <div class="mt-2 h-4">
            <p v-if="inviteStatus === 'valid'" class="font-kai text-xs text-bamboo-600 dark:text-bamboo-300 flex items-center gap-1">
              <span class="seal-outline text-[10px]" style="border-color: #5C8D6C; color: #5C8D6C;">允</span>
              邀请码有效，将获管理员身份
            </p>
            <p v-else-if="inviteStatus === 'invalid'" class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 flex items-center gap-1">
              <span class="seal-outline text-[10px]">否</span>
              邀请码无效或已过期
            </p>
            <p v-else-if="inviteStatus === 'checking'" class="font-kai text-xs text-ink-400 dark:text-paper-300">
              校验中...
            </p>
          </div>
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
          class="btn-cinnabar w-full inline-flex items-center justify-center gap-3 mt-2"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span v-if="loading">注册中...</span>
          <template v-else>
            <span>注 册</span>
            <span class="font-latin italic">→</span>
          </template>
        </button>
      </form>

      <!-- 登录引导 -->
      <div class="mt-8 text-center animate-ink-bloom delay-3">
        <p class="font-kai text-sm text-ink-400 dark:text-paper-300">
          已有账户？
          <NuxtLink to="/login" class="text-cinnabar-600 dark:text-cinnabar-400 hover:underline font-medium ml-1">
            直接登录 →
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
    error.value = '密码至少需要 6 位'
    return
  }

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
