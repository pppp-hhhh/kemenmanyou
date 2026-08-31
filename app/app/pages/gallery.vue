<script setup lang="ts">
import type { Work } from '~/types/api'
import { Eye } from 'lucide-vue-next'

const { fetchPublicWorks } = useWorks()
const { styleBadge, formatDate, getThumbnail } = useThemeColors()

const works = ref<Work[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// 搜索和筛选
const searchQuery = ref('')
const selectedStyle = ref<string>('')

const styleOptions = ['写实古风', '水墨风格', '彩色插画']

// 筛选后的作品
const filteredWorks = computed(() => {
  let result = works.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(w =>
      w.title.toLowerCase().includes(q) ||
      (w.scenes && w.scenes.some(s => s.description_cn.toLowerCase().includes(q)))
    )
  }
  if (selectedStyle.value) {
    result = result.filter(w => w.style === selectedStyle.value)
  }
  return result
})

const loadWorks = async () => {
  isLoading.value = true
  error.value = null
  try {
    works.value = await fetchPublicWorks()
  } catch (e: any) {
    error.value = e?.message || '加载作品失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadWorks())
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-surface-50 dark:bg-surface-900 transition-colors">
    <!-- 页面标题 -->
    <div class="bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm border-b border-surface-300/50 dark:border-neutral-700/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100 font-heading">展示广场</h1>
        <p class="mt-1 text-neutral-500 dark:text-neutral-400 text-sm">发现并欣赏由 AI 生成的课文漫画作品</p>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 搜索和筛选栏 -->
      <div v-if="!isLoading && works.length > 0" class="mb-6">
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <!-- 搜索框 -->
          <div class="relative flex-1 w-full">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索作品标题或场景描述..."
              aria-label="搜索作品"
              class="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-neutral-700
                     rounded-xl text-sm text-neutral-700 dark:text-neutral-100 placeholder-neutral-400
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
          </div>
          <!-- 画风筛选 -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              :class="[
                'px-3 py-1.5 rounded text-xs font-medium transition-all duration-200',
                !selectedStyle
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-800 text-neutral-600 dark:text-neutral-300 border border-surface-300 dark:border-neutral-700 hover:border-primary-300'
              ]"
              @click="selectedStyle = ''"
            >
              全部
            </button>
            <button
              v-for="style in styleOptions"
              :key="style"
              :class="[
                'px-3 py-1.5 rounded text-xs font-medium transition-all duration-200',
                selectedStyle === style
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-800 text-neutral-600 dark:text-neutral-300 border border-surface-300 dark:border-neutral-700 hover:border-primary-300'
              ]"
              @click="selectedStyle = selectedStyle === style ? '' : style"
            >
              {{ style }}
            </button>
            <span v-if="!isLoading" class="text-xs text-neutral-400 ml-1">
              {{ filteredWorks.length }} 个作品
            </span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        <div v-for="i in 8" :key="i" class="break-inside-avoid bg-white dark:bg-surface-800 rounded-lg overflow-hidden shadow-sm">
          <div class="aspect-[4/3] bg-surface-200 dark:bg-neutral-700 animate-pulse" />
          <div class="p-4 space-y-3">
            <div class="h-4 bg-surface-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
            <div class="h-3 bg-surface-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-16">
        <div class="text-5xl mb-4">⚠️</div>
        <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100 mb-2">加载失败</h3>
        <p class="text-neutral-500 dark:text-neutral-400 mb-6">{{ error }}</p>
        <button
          class="inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium
                 hover:bg-primary-600 transition-colors"
          @click="loadWorks"
        >
          重新加载
        </button>
      </div>

      <!-- 空状态（无作品） -->
      <div v-else-if="works.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">📚</div>
        <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100 mb-2">暂无公开作品</h3>
        <p class="text-neutral-500 dark:text-neutral-400 mb-6">成为第一个分享作品的人吧！</p>
        <NuxtLink
          to="/workspace"
          class="inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium
                 hover:bg-primary-600 transition-colors"
        >
          去创作
        </NuxtLink>
      </div>

      <!-- 搜索无结果 -->
      <div v-else-if="filteredWorks.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">🔍</div>
        <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100 mb-2">没有找到匹配的作品</h3>
        <p class="text-neutral-500 dark:text-neutral-400 mb-6">试试其他关键词或筛选条件</p>
        <button
          class="inline-flex items-center px-5 py-2.5 bg-surface-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium
                 hover:bg-surface-300 dark:hover:bg-neutral-600 transition-colors"
          @click="searchQuery = ''; selectedStyle = ''"
        >
          清除筛选
        </button>
      </div>

      <!-- 作品瀑布流 -->
      <div v-else class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        <NuxtLink
          v-for="work in filteredWorks"
          :key="work.id"
          :to="`/watch/${work.id}`"
          class="group break-inside-avoid bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg
                 border border-surface-300/60 dark:border-neutral-700/60
                 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700
                 hover:-translate-y-0.5 transition-all duration-300"
        >
          <!-- 封面图 -->
          <div class="aspect-[4/3] overflow-hidden bg-surface-100 dark:bg-neutral-700">
            <img
              :src="getThumbnail(work)"
              :alt="work.title"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            >
          </div>

          <!-- 信息 -->
          <div class="p-3">
            <h3 class="font-medium text-sm text-neutral-700 dark:text-neutral-100 truncate mb-1">
              {{ work.title }}
            </h3>
            <!-- 课文描述 -->
            <p v-if="work.scenes && work.scenes.length > 0" class="text-xs text-neutral-500 dark:text-neutral-400 mb-2 line-clamp-2">
              {{ work.scenes[0]?.description_cn || '' }}
            </p>
            <div class="flex items-center justify-between mt-2">
              <span
                :class="['px-2 py-0.5 rounded-full text-[11px] font-medium', styleBadge(work.style)]"
              >
                {{ work.style }}
              </span>
              <span class="inline-flex items-center gap-0.5 text-xs text-neutral-400">
                <Eye class="w-3 h-3" aria-hidden="true" />
                {{ work.view_count ?? 0 }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>