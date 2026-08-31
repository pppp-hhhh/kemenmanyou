<template>
  <div class="max-w-2xl mx-auto">
    <div class="bg-white dark:bg-surface-800 rounded-lg shadow-sm p-8">
      <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100 mb-8">个人中心</h1>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
            邮箱
          </label>
          <input
            v-model="email"
            type="email"
            disabled
            class="w-full px-4 py-3 rounded-md border border-surface-300 dark:border-neutral-700 bg-surface-100 dark:bg-surface-900 text-neutral-500 dark:text-neutral-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
            显示名称
          </label>
          <input
            v-model="displayName"
            type="text"
            placeholder="输入显示名称"
            class="w-full px-4 py-3 rounded-md border border-surface-300 dark:border-neutral-700 bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>

        <div v-if="isAdmin" class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-md">
          <div class="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span class="font-medium">管理员账户</span>
          </div>
        </div>

        <div class="pt-4 flex gap-4">
          <button
            @click="handleSave"
            :disabled="saving"
            class="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white font-medium rounded-md transition"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>

          <button
            @click="handleLogout"
            class="px-6 py-3 bg-surface-200 hover:bg-surface-300 dark:bg-neutral-700 dark:hover:bg-surface-600 text-neutral-600 dark:text-neutral-300 font-medium rounded-md transition"
          >
            退出登录
          </button>
        </div>

        <NuxtLink
          to="/history"
          class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-md border border-surface-300 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500 transition group"
        >
          <span class="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <span class="text-lg">🕐</span>
            <span class="font-medium">浏览历史</span>
          </span>
          <span class="text-neutral-400 group-hover:text-primary-500 transition-colors">→</span>
        </NuxtLink>
      </div>
    </div>
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
