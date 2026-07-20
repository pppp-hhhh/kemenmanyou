<script setup lang="ts">
const { isDark, toggle } = useDarkMode()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// 当前页面标题（用于侧栏竖排显示）
const pageMeta = computed(() => {
  const path = route.path
  if (path === '/') return { cn: '卷首', en: 'Prelude' }
  if (path.startsWith('/workspace')) return { cn: '工作台', en: 'Atelier' }
  if (path.startsWith('/gallery')) return { cn: '展示广场', en: 'Gallery' }
  if (path.startsWith('/my-works')) return { cn: '我的画册', en: 'My Works' }
  if (path.startsWith('/profile')) return { cn: '个人', en: 'Profile' }
  if (path.startsWith('/admin')) return { cn: '司管', en: 'Admin' }
  if (path.startsWith('/watch')) return { cn: '观画', en: 'Viewing' }
  if (path.startsWith('/login')) return { cn: '登录', en: 'Sign In' }
  if (path.startsWith('/register')) return { cn: '注册', en: 'Sign Up' }
  return { cn: '课文漫游', en: 'Roaming' }
})

// 当前卷数
const pageFolio = computed(() => {
  const path = route.path
  if (path === '/') return '卷一'
  if (path.startsWith('/workspace')) return '卷二'
  if (path.startsWith('/gallery')) return '卷三'
  if (path.startsWith('/my-works')) return '卷四'
  if (path.startsWith('/profile')) return '卷五'
  if (path.startsWith('/admin')) return '卷六'
  if (path.startsWith('/watch')) return '附'
  return ''
})
</script>

<template>
  <div class="min-h-screen flex relative">
    <!-- 左侧卷轴标题（固定在左侧） -->
    <aside
      class="hidden lg:flex flex-col items-center justify-between fixed left-0 top-0 bottom-0 w-16 z-30
             border-r border-ink-500/15 dark:border-paper-300/10 py-8"
      style="background: linear-gradient(to right, rgba(245, 239, 224, 0.6), transparent);
             backdrop-filter: blur(8px);"
    >
      <!-- 顶部小印 -->
      <div class="seal seal-square animate-seal" aria-label="课文漫游印">
        漫游
      </div>

      <!-- 中部竖排标题 -->
      <div class="flex flex-col items-center gap-6 flex-1 justify-center">
        <div class="scroll-title text-2xl animate-vertical-fade">{{ pageMeta.cn }}</div>
        <div class="font-latin text-xs italic text-ink-300 dark:text-paper-300 tracking-widest"
             style="writing-mode: vertical-rl; letter-spacing: 0.4em;">
          {{ pageMeta.en }}
        </div>
      </div>

      <!-- 底部卷数 -->
      <div class="folio">{{ pageFolio }}</div>
    </aside>

    <!-- 主区域 -->
    <div class="flex-1 lg:pl-16 flex flex-col min-h-screen">
      <!-- 顶部导航 -->
      <header class="sticky top-0 z-40"
              style="background: rgba(245, 239, 224, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(74, 70, 57, 0.12);">
        <div class="max-w-editorial mx-auto px-6 lg:px-10">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <NuxtLink to="/" class="group flex items-center gap-3">
              <!-- 印章式 logo -->
              <div class="seal seal-square text-sm group-hover:rotate-3 transition-transform duration-300" style="padding: 0.45rem 0.4rem;">
                漫游
              </div>
              <div class="flex flex-col leading-tight">
                <span class="font-display text-lg text-ink-700 dark:text-paper-50 tracking-wider">课文漫游</span>
                <span class="font-latin text-[10px] italic text-ink-300 dark:text-paper-300 tracking-seal">TEXT · ROAMING</span>
              </div>
            </NuxtLink>

            <!-- 中部导航 -->
            <nav class="hidden md:flex items-center gap-8">
              <NuxtLink
                to="/workspace"
                class="relative text-ink-600 dark:text-paper-200 hover:text-cinnabar-500 dark:hover:text-cinnabar-400
                       transition-colors font-kai text-base group"
                active-class="!text-cinnabar-500 dark:!text-cinnabar-400"
              >
                工作台
                <span class="absolute -bottom-1.5 left-0 right-0 h-px bg-cinnabar-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </NuxtLink>
              <NuxtLink
                to="/gallery"
                class="relative text-ink-600 dark:text-paper-200 hover:text-cinnabar-500 dark:hover:text-cinnabar-400
                       transition-colors font-kai text-base group"
                active-class="!text-cinnabar-500 dark:!text-cinnabar-400"
              >
                展示广场
                <span class="absolute -bottom-1.5 left-0 right-0 h-px bg-cinnabar-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </NuxtLink>
            </nav>

            <!-- 右侧操作 -->
            <div class="flex items-center gap-4">
              <!-- 日夜切换：印章轮廓款 -->
              <button
                class="seal-outline text-sm hover:bg-cinnabar-500 hover:text-paper-50 transition-colors cursor-pointer"
                :title="isDark ? '切回日间' : '切至墨夜'"
                @click="toggle"
              >
                {{ isDark ? '日' : '月' }}
              </button>

              <template v-if="authStore.isAuthenticated">
                <div class="hidden sm:flex items-center gap-4 pl-4 border-l border-ink-500/15 dark:border-paper-300/10">
                  <NuxtLink
                    to="/my-works"
                    class="text-sm text-ink-500 dark:text-paper-300 hover:text-cinnabar-500 transition-colors font-kai"
                  >
                    我的画册
                  </NuxtLink>
                  <NuxtLink
                    v-if="authStore.isAdmin"
                    to="/admin"
                    class="text-sm text-cinnabar-600 dark:text-cinnabar-400 hover:text-cinnabar-700 transition-colors font-kai"
                  >
                    司管
                  </NuxtLink>
                  <div class="flex items-center gap-2">
                    <span class="font-latin text-xs italic text-ink-400 dark:text-paper-300">{{ authStore.user?.email }}</span>
                    <button
                      @click="handleLogout"
                      class="text-sm text-ink-400 hover:text-cinnabar-500 transition-colors font-kai"
                    >
                      辞
                    </button>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="flex items-center gap-3 pl-4 border-l border-ink-500/15 dark:border-paper-300/10">
                  <NuxtLink
                    to="/login"
                    class="text-sm text-ink-500 dark:text-paper-300 hover:text-cinnabar-500 transition-colors font-kai"
                  >
                    登录
                  </NuxtLink>
                  <NuxtLink
                    to="/register"
                    class="seal seal-tag hover:rotate-1 transition-transform"
                  >
                    注册
                  </NuxtLink>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 移动端导航 -->
        <div class="md:hidden border-t border-ink-500/10 dark:border-paper-300/10">
          <div class="max-w-editorial mx-auto px-6 py-2 flex items-center gap-6">
            <NuxtLink to="/workspace" class="text-sm text-ink-600 dark:text-paper-200 font-kai" active-class="!text-cinnabar-500">工作台</NuxtLink>
            <NuxtLink to="/gallery" class="text-sm text-ink-600 dark:text-paper-200 font-kai" active-class="!text-cinnabar-500">广场</NuxtLink>
            <NuxtLink v-if="authStore.isAuthenticated" to="/my-works" class="text-sm text-ink-600 dark:text-paper-200 font-kai" active-class="!text-cinnabar-500">我的</NuxtLink>
          </div>
        </div>
      </header>

      <!-- 主内容 -->
      <main class="flex-1">
        <slot />
      </main>

      <!-- 页脚 -->
      <footer class="mt-auto border-t border-ink-500/15 dark:border-paper-300/10"
              style="background: rgba(245, 239, 224, 0.5);">
        <div class="max-w-editorial mx-auto px-6 lg:px-10 py-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="seal seal-square text-xs" style="padding: 0.35rem 0.3rem;">漫</div>
              <div class="flex flex-col leading-tight">
                <span class="font-display text-sm text-ink-700 dark:text-paper-100">课文漫游</span>
                <span class="font-latin text-[10px] italic text-ink-300 dark:text-paper-300 tracking-seal">
                  AI · 衍 · 画 · 册
                </span>
              </div>
            </div>

            <div class="brush-divider flex-1 mx-8 hidden md:block"></div>

            <p class="font-kai text-xs text-ink-400 dark:text-paper-300 text-center tracking-wider">
              以 DeepSeek 析文，以 ComfyUI 绘景 · AI 辅助学习工具
            </p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
