<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const works = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch('/api/works/my', {
      headers: {
        Authorization: authStore.getAuthHeader()
      }
    })
    works.value = response as any[]
  } catch (error) {
    console.error('Failed to fetch works:', error)
  } finally {
    loading.value = false
  }
})

const reviewStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审',
    approved: '已展',
    rejected: '被拒'
  }
  return map[status] || status
}

const reviewStatusSeal = (status: string) => {
  if (status === 'pending') return { cls: 'seal-outline', cn: '待' }
  if (status === 'approved') return { cls: 'seal seal-tag', cn: '展' }
  if (status === 'rejected') return { cls: 'seal-outline', cn: '拒' }
  return { cls: 'seal-outline', cn: '?' }
}

// 中文数字
const toCnNum = (n: number): string => {
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (n <= 10) return cn[n]
  if (n < 20) return `十${cn[n - 10]}`
  return `${cn[Math.floor(n / 10)]}十${cn[n % 10] === '零' ? '' : cn[n % 10]}`
}
</script>

<template>
  <div>
    <!-- 顶部版心 -->
    <section class="relative border-b border-ink-500/15 dark:border-paper-300/10 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="ink-wash"
             style="top: -20%; left: -10%; width: 50%; height: 100%;
                    background: radial-gradient(ellipse at center, rgba(184, 64, 63, 0.08), transparent 70%);"></div>
      </div>

      <div class="relative max-w-editorial mx-auto px-6 lg:px-12 py-12">
        <div class="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="folio">卷 · 四</div>
              <div class="brush-divider w-24"></div>
              <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">IV. MY ALBUMS</div>
            </div>
            <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
              我的<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">画册</span>
            </h1>
            <p class="font-kai text-sm text-ink-500 dark:text-paper-300 max-w-md leading-relaxed mt-4">
              你所入藏的全部画册，无论展卷与否
            </p>
          </div>

          <NuxtLink to="/workspace" class="btn-cinnabar inline-flex items-center gap-3">
            <span>新建一卷</span>
            <span class="font-latin italic">+</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 主体 -->
    <section class="max-w-editorial mx-auto px-6 lg:px-12 py-12">
      <!-- 加载中 -->
      <div v-if="loading" class="text-center py-24">
        <div class="inline-flex items-center gap-3 mb-3">
          <svg class="animate-spin h-6 w-6 text-cinnabar-500" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="font-kai text-sm text-ink-400 dark:text-paper-300">正在翻阅画册...</span>
        </div>
        <div class="font-latin italic text-xs text-ink-300 dark:text-paper-400 tracking-widest">LOADING ALBUMS</div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="works.length === 0" class="text-center py-24">
        <div class="inline-block mb-6">
          <div class="seal" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
            空<br>卷
          </div>
        </div>
        <h3 class="font-display text-3xl text-ink-700 dark:text-paper-50 mb-3">画册尚空</h3>
        <p class="font-kai text-base text-ink-500 dark:text-paper-300 mb-6">
          尚无入藏之作 · 创建第一卷吧
        </p>
        <NuxtLink to="/workspace" class="btn-cinnabar inline-flex items-center gap-3">
          <span>开始创作</span>
          <span class="font-latin italic">→</span>
        </NuxtLink>
      </div>

      <!-- 作品网格 -->
      <div v-else>
        <!-- 数量 -->
        <div class="flex items-center gap-3 mb-8">
          <div class="flex items-baseline gap-2">
            <span class="font-display text-3xl text-cinnabar-600 dark:text-cinnabar-400">{{ works.length }}</span>
            <span class="font-kai text-sm text-ink-400 dark:text-paper-300">卷 · 入藏</span>
          </div>
          <div class="brush-divider flex-1"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="(work, i) in works"
            :key="work.id"
            class="paper-panel paper-panel-edge group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-paper-lg"
          >
            <!-- 封面 -->
            <div class="aspect-[4/5] overflow-hidden relative bg-paper-200 dark:bg-ink-500">
              <img
                v-if="work.thumbnail"
                :src="work.thumbnail"
                :alt="work.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="font-display text-9xl text-ink-500/10 dark:text-paper-300/10">{{ toCnNum(i + 1) }}</div>
              </div>

              <!-- 卷次水印 -->
              <div class="absolute top-3 left-3 font-display text-5xl text-paper-50/40 select-none pointer-events-none">
                {{ toCnNum(i + 1) }}
              </div>

              <!-- 审核状态 -->
              <div class="absolute top-3 right-3 flex gap-2">
                <span :class="reviewStatusSeal(work.review_status).cls + ' text-[10px]'">
                  {{ reviewStatusSeal(work.review_status).cn }}
                </span>
              </div>

              <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-700/60 to-transparent"></div>
            </div>

            <!-- 信息条 -->
            <div class="p-5">
              <h3 class="font-display text-xl text-ink-700 dark:text-paper-50 mb-2 truncate group-hover:text-cinnabar-600 dark:group-hover:text-cinnabar-400 transition-colors">
                {{ work.title }}
              </h3>

              <div class="flex items-center gap-2 mb-3 flex-wrap">
                <span class="seal-outline text-[10px]">{{ work.style }}</span>
                <span class="font-kai text-xs text-ink-400 dark:text-paper-300">{{ reviewStatusText(work.review_status) }}</span>
              </div>

              <!-- 拒绝原因 -->
              <div v-if="work.review_status === 'rejected' && work.reject_reason"
                   class="mb-3 border-l-2 border-cinnabar-500 bg-cinnabar-50 dark:bg-cinnabar-900/15 px-3 py-2">
                <p class="font-kai text-xs text-cinnabar-700 dark:text-cinnabar-300">
                  拒因：{{ work.reject_reason }}
                </p>
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-ink-500/10 dark:border-paper-300/10">
                <NuxtLink
                  :to="`/watch/${work.id}`"
                  class="font-kai text-sm text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 transition-colors"
                >
                  查看详情
                </NuxtLink>
                <span class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 落款 -->
        <div class="mt-16 flex items-center justify-center gap-3">
          <div class="brush-divider w-32"></div>
          <div class="seal seal-tag text-xs">已藏 {{ works.length }} 卷</div>
          <div class="brush-divider w-32"></div>
        </div>
      </div>
    </section>
  </div>
</template>
