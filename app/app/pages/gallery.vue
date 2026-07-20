<script setup lang="ts">
import type { Work } from '~/types/api'

const { fetchPublicWorks } = useWorks()

const works = ref<Work[]>([])
const isLoading = ref(true)

// 画风对应的印章款样式
const styleSealClass: Record<string, string> = {
  '写实古风': 'seal seal-tag',
  '水墨风格': 'seal-outline',
  '彩色插画': 'seal seal-tag',
}

// 画风对应的中文小标签
const styleSubtitle: Record<string, string> = {
  '写实古风': '古意',
  '水墨风格': '墨韵',
  '彩色插画': '彩绘',
}

// 格式化时间
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 中文数字
const toCnNum = (n: number): string => {
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (n <= 10) return cn[n]
  if (n < 20) return `十${cn[n - 10]}`
  return `${cn[Math.floor(n / 10)]}十${cn[n % 10] === '零' ? '' : cn[n % 10]}`
}

// 获取封面图
const getThumbnail = (work: Work) => {
  if (work.thumbnail) return work.thumbnail
  if (work.images && work.images.length > 0) return work.images[0]
  return ''
}

onMounted(async () => {
  works.value = await fetchPublicWorks()
  isLoading.value = false
})
</script>

<template>
  <div>
    <!-- 页面顶部：编辑式版心 -->
    <section class="relative border-b border-ink-500/15 dark:border-paper-300/10 overflow-hidden">
      <!-- 背景墨晕 -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="ink-wash"
             style="top: -20%; right: -10%; width: 50%; height: 100%;
                    background: radial-gradient(ellipse at center, rgba(184, 64, 63, 0.10), transparent 70%);"></div>
      </div>

      <div class="relative max-w-editorial mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <!-- 卷首信息 -->
        <div class="grid lg:grid-cols-12 gap-8 items-end">
          <div class="lg:col-span-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="folio">卷 · 三</div>
              <div class="brush-divider w-24"></div>
              <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">III. GALLERY</div>
            </div>

            <h1 class="font-display text-6xl md:text-7xl lg:text-8xl text-ink-700 dark:text-paper-50 mb-4 leading-none">
              展示<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">广场</span>
            </h1>

            <p class="font-kai text-lg md:text-xl text-ink-500 dark:text-paper-300 max-w-2xl leading-relaxed mt-6">
              赏 AI 所绘之画册，览同好共构之画卷。<br>
              <span class="font-latin italic text-sm text-ink-300 dark:text-paper-400">An ever-growing album of AI-painted tales</span>
            </p>
          </div>

          <!-- 右侧统计 -->
          <div class="lg:col-span-4 flex flex-col items-end gap-2">
            <div class="flex items-baseline gap-2">
              <span class="font-display text-6xl text-cinnabar-600 dark:text-cinnabar-400 leading-none">{{ works.length }}</span>
              <span class="font-kai text-sm text-ink-400 dark:text-paper-300">幅</span>
            </div>
            <div class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">PUBLIC · ALBUMS</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 内容区域 -->
    <section class="max-w-editorial mx-auto px-6 lg:px-12 py-16">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="i in 9"
          :key="i"
          class="paper-panel aspect-[4/5] relative overflow-hidden"
        >
          <div class="absolute inset-0 animate-pulse-bg"></div>
          <!-- 装饰水印 -->
          <div class="absolute top-4 right-4 font-display text-7xl text-ink-500/5">
            {{ toCnNum(i) }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="works.length === 0" class="text-center py-32">
        <div class="inline-block mb-8">
          <div class="seal" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
            空<br>卷
          </div>
        </div>
        <h3 class="font-display text-3xl text-ink-700 dark:text-paper-50 mb-3">尚无公开展卷</h3>
        <p class="font-kai text-base text-ink-500 dark:text-paper-300 mb-8">
          画册虚位以待 · 成为首位钤印展示之人
        </p>
        <NuxtLink to="/workspace" class="btn-cinnabar inline-flex items-center gap-3">
          <span>开始创作</span>
          <span class="font-latin italic">→</span>
        </NuxtLink>
      </div>

      <!-- 作品网格 -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <NuxtLink
          v-for="(work, i) in works"
          :key="work.id"
          :to="`/watch/${work.id}`"
          class="paper-panel paper-panel-edge group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-paper-lg"
        >
          <!-- 封面图 -->
          <div class="aspect-[4/5] overflow-hidden relative bg-paper-200 dark:bg-ink-500">
            <img
              v-if="getThumbnail(work)"
              :src="getThumbnail(work)"
              :alt="work.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
            <div v-else class="w-full h-full flex items-center justify-center">
              <div class="font-display text-9xl text-ink-500/10 dark:text-paper-300/10">{{ toCnNum(i + 1) }}</div>
            </div>

            <!-- 卷数次号水印 -->
            <div class="absolute top-3 left-3 font-display text-5xl text-paper-50/40 select-none pointer-events-none">
              {{ toCnNum(i + 1) }}
            </div>

            <!-- 画风印章 -->
            <div class="absolute top-3 right-3">
              <span :class="styleSealClass[work.style] || 'seal-outline'">
                {{ styleSubtitle[work.style] || work.style }}
              </span>
            </div>

            <!-- 底部渐隐 -->
            <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-700/60 to-transparent"></div>

            <!-- 底部叠字 -->
            <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div class="font-latin italic text-xs text-paper-50/90 tracking-widest">
                {{ formatDate(work.created_at) }}
              </div>
              <div class="font-latin italic text-xs text-paper-50/80">
                {{ String(i + 1).padStart(2, '0') }} / {{ String(works.length).padStart(2, '0') }}
              </div>
            </div>
          </div>

          <!-- 信息条 -->
          <div class="p-5 relative">
            <!-- 标题 -->
            <h3 class="font-display text-xl text-ink-700 dark:text-paper-50 mb-2 group-hover:text-cinnabar-600 dark:group-hover:text-cinnabar-400 transition-colors">
              {{ work.title }}
            </h3>

            <!-- 课文描述 -->
            <p v-if="work.scenes && work.scenes.length > 0"
               class="font-kai text-sm text-ink-500 dark:text-paper-300 mb-3 line-clamp-2 leading-relaxed">
              {{ work.scenes[0]?.description_cn || '' }}
            </p>

            <!-- 底部信息 -->
            <div class="flex items-center justify-between pt-3 border-t border-ink-500/10 dark:border-paper-300/10">
              <span class="font-kai text-xs text-ink-400 dark:text-paper-300">{{ work.style }}</span>
              <span class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-widest group-hover:translate-x-1 transition-transform">
                览 →
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- 底部落款 -->
      <div v-if="!isLoading && works.length > 0" class="mt-20 flex items-center justify-center gap-4">
        <div class="brush-divider w-32"></div>
        <div class="seal seal-tag text-xs">已展 {{ works.length }} 卷</div>
        <div class="brush-divider w-32"></div>
      </div>
    </section>
  </div>
</template>
