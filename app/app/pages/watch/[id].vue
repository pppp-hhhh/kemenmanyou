<script setup lang="ts">
import type { Work } from '~/types/api'

const route = useRoute()
const workId = Number(route.params.id as string)

const { fetchWork } = useWorks()

const work = ref<Work | null>(null)
const isLoading = ref(true)
const activeScene = ref(0)

// 中文数字
const toCnNum = (n: number): string => {
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (n <= 10) return cn[n]
  if (n < 20) return `十${cn[n - 10]}`
  return `${cn[Math.floor(n / 10)]}十${cn[n % 10] === '零' ? '' : cn[n % 10]}`
}

// 画风对应的标签
const styleSealClass: Record<string, string> = {
  '写实古风': 'seal seal-tag',
  '水墨风格': 'seal-outline',
  '彩色插画': 'seal seal-tag',
}
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

// 下载单个图片
const downloadImage = (url: string, index: number) => {
  const link = document.createElement('a')
  link.href = url
  link.download = `${work.value?.title || 'work'}_${index + 1}.png`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 导出全部图片
const exportAll = async () => {
  if (!work.value?.images) return

  for (let i = 0; i < (work.value?.images?.length || 0); i++) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const url = work.value?.images?.[i]
    if (url) downloadImage(url, i)
  }
}

onMounted(async () => {
  work.value = await fetchWork(workId)
  isLoading.value = false
})
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="max-w-editorial mx-auto px-6 lg:px-12 py-12">
      <div class="animate-pulse space-y-8">
        <div class="flex items-center gap-3">
          <div class="folio">附 · 观画</div>
          <div class="brush-divider w-24"></div>
          <div class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">VIEWING</div>
        </div>
        <div class="h-12 bg-ink-500/10 dark:bg-paper-300/10 w-1/2"></div>
        <div class="grid lg:grid-cols-2 gap-8">
          <div class="aspect-square bg-ink-500/10 dark:bg-paper-300/10"></div>
          <div class="space-y-4">
            <div class="h-4 bg-ink-500/10 dark:bg-paper-300/10 w-full"></div>
            <div class="h-4 bg-ink-500/10 dark:bg-paper-300/10 w-2/3"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 作品不存在 -->
    <div v-else-if="!work" class="flex flex-col items-center justify-center py-32">
      <div class="inline-block mb-8">
        <div class="seal" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
          误<br>录
        </div>
      </div>
      <h3 class="font-display text-3xl text-ink-700 dark:text-paper-50 mb-3">此卷不存在</h3>
      <p class="font-kai text-base text-ink-500 dark:text-paper-300 mb-8">
        或已被销毁 · 或本不可览
      </p>
      <NuxtLink to="/gallery" class="btn-cinnabar inline-flex items-center gap-3">
        <span>返回展示广场</span>
        <span class="font-latin italic">→</span>
      </NuxtLink>
    </div>

    <!-- 作品内容 -->
    <div v-else class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
      <!-- 顶部导航 -->
      <div class="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/gallery"
            class="flex items-center gap-2 text-ink-500 dark:text-paper-300 hover:text-cinnabar-500 transition-colors font-kai text-sm group"
          >
            <span class="font-latin italic group-hover:-translate-x-1 transition-transform">←</span>
            <span>返 回</span>
          </NuxtLink>
          <div class="h-6 w-px bg-ink-500/20 dark:bg-paper-300/10"></div>
          <div class="flex items-center gap-3">
            <div class="folio">附</div>
            <h1 class="font-display text-3xl md:text-4xl text-ink-700 dark:text-paper-50">
              {{ work.title }}
            </h1>
          </div>
        </div>
        <span :class="styleSealClass[work.style] || 'seal-outline'">
          {{ styleSubtitle[work.style] || work.style }}
        </span>
      </div>

      <!-- 主要内容 -->
      <div class="grid lg:grid-cols-2 gap-10">
        <!-- 左侧：图片 -->
        <div class="space-y-4">
          <!-- 主图 -->
          <div
            v-if="work.images && work.images.length > 0"
            class="aspect-square overflow-hidden bg-paper-200 dark:bg-ink-500 border border-ink-500/15 dark:border-paper-300/10 relative"
          >
            <img
              :src="work.images[activeScene]"
              :alt="`场景 ${activeScene + 1}`"
              class="w-full h-full object-contain"
            >
            <!-- 幕次号 -->
            <div class="absolute top-3 left-3 seal seal-tag text-[10px]">
              {{ toCnNum(activeScene + 1) }}
            </div>
            <!-- 漫游印 -->
            <div class="absolute bottom-3 right-3 seal seal-tag text-[10px]">漫游</div>
          </div>

          <!-- 缩略图列表 -->
          <div v-if="work.images && work.images.length > 1" class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              v-for="(img, index) in work.images"
              :key="index"
              :class="[
                'flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-all',
                activeScene === index
                  ? 'border-cinnabar-500 shadow-seal'
                  : 'border-ink-500/15 dark:border-paper-300/10 opacity-60 hover:opacity-100'
              ]"
              @click="activeScene = index"
            >
              <img :src="img" :alt="`场景 ${index + 1}`" class="w-full h-full object-cover">
            </button>
          </div>

          <!-- 下载按钮 -->
          <div class="flex gap-3">
            <button
              v-if="work.images && work.images.length === 1"
              class="btn-ink flex-1 inline-flex items-center justify-center gap-3"
              @click="work.images?.[0] && downloadImage(work.images[0], 0)"
            >
              <span>下载此画</span>
              <span class="font-latin italic text-xs">DOWNLOAD</span>
            </button>
            <button
              v-else-if="work.images && work.images.length > 1"
              class="btn-ink flex-1 inline-flex items-center justify-center gap-3"
              @click="exportAll"
            >
              <span>导出全部 ({{ work.images.length }})</span>
              <span class="font-latin italic text-xs">EXPORT ALL</span>
            </button>
          </div>
        </div>

        <!-- 右侧：场景描述 -->
        <div class="paper-panel paper-panel-edge p-7">
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-ink-500/10 dark:border-paper-300/10">
            <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">目</span>
            <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">场景目录</h2>
            <div class="brush-divider flex-1"></div>
            <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">
              {{ work.scenes?.length || 0 }} SCENES
            </span>
          </div>

          <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
            <div
              v-for="(scene, index) in work.scenes"
              :key="index"
              :class="[
                'p-4 cursor-pointer transition-all border',
                activeScene === index
                  ? 'bg-cinnabar-50 dark:bg-cinnabar-900/15 border-cinnabar-500'
                  : 'bg-transparent border-ink-500/10 dark:border-paper-300/10 hover:bg-paper-100/50 dark:hover:bg-ink-500/30'
              ]"
              @click="activeScene = index"
            >
              <div class="flex items-start gap-3">
                <span :class="[
                  'flex-shrink-0 w-9 h-9 flex items-center justify-center font-display text-sm',
                  activeScene === index
                    ? 'seal seal-tag'
                    : 'seal-outline'
                ]">
                  {{ toCnNum(index + 1) }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="font-kai text-ink-700 dark:text-paper-100 font-medium mb-1 leading-relaxed">
                    {{ scene.description_cn }}
                  </p>
                  <p class="font-latin italic text-xs text-ink-300 dark:text-paper-400 truncate">
                    {{ scene.prompt_en }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 元信息 -->
          <div class="mt-6 pt-4 border-t border-ink-500/10 dark:border-paper-300/10">
            <div class="flex items-center justify-between">
              <span class="font-kai text-xs text-ink-400 dark:text-paper-300">
                共 {{ work.scenes?.length || 0 }} 幕
              </span>
              <span class="font-latin italic text-xs text-ink-400 dark:text-paper-300">
                {{ formatDate(work.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 落款 -->
      <div class="mt-16 flex items-center justify-center gap-4">
        <div class="brush-divider w-32"></div>
        <div class="seal seal-tag text-xs">{{ work.style }}</div>
        <div class="brush-divider w-32"></div>
      </div>
    </div>
  </div>
</template>
