<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- 顶部版心 -->
    <section class="relative border-b border-ink-500/15 dark:border-paper-300/10 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="ink-wash"
             style="top: -20%; right: -10%; width: 50%; height: 100%;
                    background: radial-gradient(ellipse at center, rgba(184, 64, 63, 0.08), transparent 70%);"></div>
      </div>

      <div class="relative max-w-editorial mx-auto px-6 lg:px-12 py-12">
        <div class="flex items-center gap-3 mb-3">
          <div class="folio">卷 · 五</div>
          <div class="brush-divider w-24"></div>
          <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">V. PROFILE</div>
        </div>

        <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
          个 <span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">人</span>
        </h1>
        <p class="font-kai text-sm text-ink-500 dark:text-paper-300 max-w-md leading-relaxed mt-4">
          查看你的账户信息与权限
        </p>
      </div>
    </section>

    <!-- 主体 -->
    <section class="max-w-2xl mx-auto px-6 lg:px-12 py-12">
      <!-- 个人卡 -->
      <div class="paper-panel paper-panel-edge p-10 animate-ink-bloom">
        <!-- 头部 -->
        <div class="flex items-center gap-6 pb-8 border-b border-ink-500/10 dark:border-paper-300/10 mb-8">
          <!-- 头像位（印章式） -->
          <div class="seal" style="width: 4.5rem; height: 4.5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
            {{ (email || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1">
            <div class="font-display text-2xl text-ink-700 dark:text-paper-50 mb-1">{{ displayName || '匿名用户' }}</div>
            <div class="font-latin italic text-sm text-ink-400 dark:text-paper-300 tracking-wider break-all">{{ email }}</div>
          </div>
          <div v-if="isAdmin" class="seal-outline text-xs">管理员</div>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSave" class="space-y-8">
          <!-- 邮箱（禁用） -->
          <div>
            <label class="flex items-center justify-between mb-2">
              <span class="font-display text-sm text-ink-700 dark:text-paper-100">邮 箱</span>
              <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-300 tracking-seal">EMAIL</span>
            </label>
            <input
              v-model="email"
              type="email"
              disabled
              class="input-editorial opacity-50 cursor-not-allowed"
            />
          </div>

          <!-- 显示名称 -->
          <div>
            <label class="flex items-center justify-between mb-2">
              <span class="font-display text-sm text-ink-700 dark:text-paper-100">显 示 名</span>
              <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-300 tracking-seal">DISPLAY NAME</span>
            </label>
            <input
              v-model="displayName"
              type="text"
              placeholder="输入显示名称"
              class="input-editorial"
            />
          </div>

          <!-- 管理员身份提示 -->
          <div v-if="isAdmin"
               class="border-l-2 border-cinnabar-500 bg-cinnabar-50 dark:bg-cinnabar-900/15 px-5 py-4 flex items-center gap-3">
            <div class="seal seal-square text-xs" style="padding: 0.35rem 0.3rem;">管</div>
            <div>
              <p class="font-display text-sm text-cinnabar-700 dark:text-cinnabar-300">管理员账户</p>
              <p class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 mt-1">
                你拥有作品审核、用户管理、课文维护等权限
              </p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="pt-4 flex gap-4 border-t border-ink-500/10 dark:border-paper-300/10">
            <button
              type="submit"
              :disabled="saving"
              class="btn-cinnabar inline-flex items-center gap-3"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span>{{ saving ? '保存中...' : '保 存' }}</span>
            </button>

            <button
              type="button"
              @click="handleLogout"
              class="btn-outline inline-flex items-center gap-3"
            >
              <span>退 出 登 录</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 落款 -->
      <div class="mt-12 flex items-center justify-center gap-3">
        <div class="brush-divider w-16"></div>
        <div class="seal seal-tag text-[10px]">个人 · 卷五</div>
        <div class="brush-divider w-16"></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const displayName = ref('')
const saving = ref(false)

const isAdmin = computed(() => authStore.isAdmin)

onMounted(() => {
  if (authStore.user) {
    email.value = authStore.user.email || ''
    displayName.value = authStore.user.display_name || ''
  }
})

const handleSave = async () => {
  saving.value = true
  try {
    // TODO: 调用 API 保存用户信息
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    saving.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
