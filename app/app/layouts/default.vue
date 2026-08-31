<script setup lang="ts">
const { isDark, toggle } = useDarkMode()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// ── 页脚主题适配 ──
// 页面通过 definePageMeta({ footerTheme: 'dark' }) 声明自身为深色主题页（如首页沉浸式背景、观看页深色播放器），
// layout footer 据此渲染深色样式，保证页脚与页面主题一致。
const isDarkFooter = computed(() => route.meta.footerTheme === 'dark')

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-surface-900">
    <!-- Header -->
    <header class="bg-white dark:bg-surface-800 shadow-sm border-b border-surface-300 dark:border-neutral-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2.5">
            <div class="bg-primary-500 rounded-lg p-1.5">
              <img src="/logo3.png" alt="logo" class="h-7 w-auto">
            </div>
            <span class="text-xl font-bold text-primary-500 dark:text-primary-400">课文漫游</span>
          </NuxtLink>

          <!-- Navigation -->
          <nav class="flex items-center gap-6">
            <NuxtLink
              to="/workspace"
              class="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors font-medium"
              active-class="!text-earth-600 dark:!text-earth-300"
            >
              工作台
            </NuxtLink>
            <NuxtLink
              to="/gallery"
              class="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors font-medium"
              active-class="!text-earth-600 dark:!text-earth-300"
            >
              展示广场
            </NuxtLink>

            <!-- 夜间模式切换 -->
            <button
              class="p-2 rounded-md text-neutral-500 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-neutral-700 transition-colors"
              :title="isDark ? '切换日间模式' : '切换夜间模式'"
              @click="toggle"
            >
              <span class="text-lg">{{ isDark ? '☀️' : '🌙' }}</span>
            </button>

            <!-- 登录后用户菜单 -->
            <div v-if="authStore.isAuthenticated" class="flex items-center gap-3 border-l border-surface-300 dark:border-neutral-700 pl-3">
              <NuxtLink
                to="/my-works"
                class="text-sm text-neutral-500 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                我的作品
              </NuxtLink>
              <NuxtLink
                to="/history"
                class="text-sm text-neutral-500 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                🕐 浏览历史
              </NuxtLink>
              <NuxtLink
                v-if="authStore.isAdmin"
                to="/admin"
                class="p-2 rounded-md text-neutral-500 dark:text-neutral-300 hover:bg-surface-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-100 transition-colors"
                title="管理后台"
                aria-label="管理后台"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </NuxtLink>
              <div class="flex items-center gap-2">
                <span class="text-sm text-neutral-500 dark:text-neutral-300">
                  {{ authStore.user?.email }}
                </span>
                <button
                  @click="handleLogout"
                  class="text-sm text-neutral-500 hover:text-error-500 transition-colors"
                >
                  退出
                </button>
              </div>
            </div>

            <!-- 未登录 -->
            <div v-else class="flex items-center gap-3 border-l border-surface-300 dark:border-neutral-700 pl-3">
              <NuxtLink
                to="/login"
                class="text-sm text-neutral-500 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                登录
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="px-4 py-1.5 text-sm text-white rounded-lg font-medium bg-primary-500 shadow-sm hover:bg-primary-600 transition-all"
              >
                注册
              </NuxtLink>
            </div>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer（主题适配：深色主题页使用深色样式，其余页面沿用浅色/跟随 dark 模式） -->
    <footer
      :class="isDarkFooter
        ? 'bg-neutral-900 border-t border-white/15 mt-auto'
        : 'bg-white dark:bg-surface-800 mt-auto border-t border-surface-300 dark:border-neutral-700'"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p
          :class="isDarkFooter
            ? 'text-center text-neutral-300 text-sm'
            : 'text-center text-neutral-500 dark:text-neutral-400 text-sm'"
        >
          课文漫游 — AI 辅助学习工具
        </p>
      </div>
    </footer>
  </div>
</template>
