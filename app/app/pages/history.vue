<script setup lang="ts">
import type { ViewHistoryItem, ViewHistoryPage } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()

/** 列表行 = 历史条目 + 客户端「作品已删除」标记 */
interface HistoryRow extends ViewHistoryItem {
  deleted: boolean
}

const PAGE_SIZE = 20

const items = ref<HistoryRow[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const clearing = ref(false)
const removingIds = ref<Set<number>>(new Set())
const total = ref(0)
const currentPage = ref(0)

/** 「xx 前」相对时间 */
const { formatAgo } = useThemeColors()

/** 按时间分组 */
interface HistoryGroup {
  label: string
  items: HistoryRow[]
}

const groupedItems = computed<HistoryGroup[]>(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  
  const groups: Record<string, HistoryRow[]> = {
    '今天': [],
    '昨天': [],
    '更早': [],
  }
  
  for (const item of items.value) {
    const viewDate = new Date(item.lastViewedAt)
    if (viewDate >= todayStart) {
      groups['今天'].push(item)
    } else if (viewDate >= yesterdayStart) {
      groups['昨天'].push(item)
    } else {
      groups['更早'].push(item)
    }
  }
  
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
})

/**
 * 存活作品 id 集合：用无副作用的 GET /api/works 探测。
 */
let aliveWorkIds: Set<number> | null = null
const loadAliveWorkIds = async (): Promise<Set<number> | null> => {
  const ids = new Set<number>()
  try {
    const pageSize = 1000
    for (let page = 1; page <= 30; page++) {
      const res = await $fetch<{ data: { id: number }[]; total: number }>('/api/works', {
        query: { page: String(page), page_size: String(pageSize) },
      })
      const list = res?.data || []
      for (const w of list) ids.add(w.id)
      if (list.length === 0 || ids.size >= (res?.total ?? 0)) break
    }
    return ids
  }
  catch (error) {
    console.error('获取存活作品列表失败，跳过「作品已删除」检测:', error)
    return null
  }
}

const loadHistory = async (reset = false) => {
  const page = reset ? 1 : currentPage.value + 1
  const res = await $fetch<ViewHistoryPage>('/api/users/me/view-history', {
    headers: { Authorization: authStore.getAuthHeader() },
    query: { page: String(page), page_size: String(PAGE_SIZE) },
  })
  if (!aliveWorkIds) {
    aliveWorkIds = await loadAliveWorkIds()
  }
  const rows: HistoryRow[] = (res.items || []).map(item => ({
    ...item,
    deleted: aliveWorkIds ? !aliveWorkIds.has(item.workId) : false,
  }))
  items.value = reset ? rows : [...items.value, ...rows]
  total.value = typeof res.total === 'number' ? res.total : items.value.length
  currentPage.value = page
}

onMounted(async () => {
  try {
    await loadHistory(true)
  }
  catch (error) {
    console.error('获取浏览历史失败:', error)
    alert('获取浏览历史失败，请重试')
  }
  finally {
    loading.value = false
  }
})

const hasMore = computed(() => items.value.length < total.value)

const loadMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    await loadHistory(false)
  }
  catch (error) {
    console.error('加载更多浏览历史失败:', error)
    alert('加载更多失败，请重试')
  }
  finally {
    loadingMore.value = false
  }
}

/** 单条移除 */
const removeItem = async (row: HistoryRow) => {
  if (removingIds.value.has(row.workId)) return
  removingIds.value.add(row.workId)
  try {
    await $fetch('/api/users/me/view-history', {
      method: 'DELETE',
      headers: { Authorization: authStore.getAuthHeader() },
      body: { workIds: [row.workId] },
    })
    items.value = items.value.filter(i => i.workId !== row.workId)
    total.value = Math.max(0, total.value - 1)
  }
  catch (error) {
    console.error('移除浏览记录失败:', error)
    alert('移除失败，请重试')
  }
  finally {
    removingIds.value.delete(row.workId)
  }
}

/** 清空全部 */
const clearAll = async () => {
  if (clearing.value || items.value.length === 0) return
  if (!confirm('确定要清空全部浏览记录吗？此操作不可恢复。')) return
  clearing.value = true
  try {
    await $fetch('/api/users/me/view-history', {
      method: 'DELETE',
      headers: { Authorization: authStore.getAuthHeader() },
    })
    items.value = []
    total.value = 0
    currentPage.value = 0
  }
  catch (error) {
    console.error('清空浏览记录失败:', error)
    alert('清空失败，请重试')
  }
  finally {
    clearing.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-surface-50 dark:bg-surface-900 transition-colors">
    <!-- 页面标题 -->
    <div class="bg-white dark:bg-surface-800 border-b border-surface-300 dark:border-neutral-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100">浏览历史</h1>
        <p class="mt-1 text-neutral-500 dark:text-neutral-400">快速找到你之前看过的课文漫画</p>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 加载状态：骨架屏 -->
      <div v-if="loading">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-sm">
            <div class="aspect-[4/3] bg-gray-200 dark:bg-neutral-700 animate-pulse" />
            <div class="p-4 space-y-3">
              <div class="h-5 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
              <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="items.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4">🕐</div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">还没有浏览记录</h3>
        <p class="text-gray-500 dark:text-neutral-400 mb-6">去广场逛逛，发现更多精彩作品吧！</p>
        <NuxtLink
          to="/gallery"
          class="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg font-medium
                 hover:bg-primary-600 transition-colors"
        >
          前往展示广场 →
        </NuxtLink>
      </div>

      <!-- 列表 -->
      <template v-else>
        <!-- 数量统计 -->
        <div class="mb-6">
          <span class="text-sm text-gray-400 dark:text-neutral-500">共 {{ total }} 条记录</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="row in items"
            :key="row.workId"
            class="group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-sm
                   border border-gray-100 dark:border-neutral-700
                   transition-all duration-200"
            :class="row.deleted
              ? 'opacity-60 grayscale'
              : 'hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800'"
          >
            <!-- 封面 -->
            <NuxtLink v-if="!row.deleted" :to="'/watch/' + row.workId" class="block">
              <div class="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-neutral-700">
                <img
                  v-if="row.thumbnail"
                  :src="row.thumbnail"
                  :alt="row.workTitle"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  无缩略图
                </div>
              </div>
            </NuxtLink>
            <div
              v-else
              class="aspect-[4/3] bg-gray-200 dark:bg-neutral-700 flex flex-col items-center justify-center gap-2 text-gray-400"
            >
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-sm">作品已删除</span>
            </div>

            <!-- 信息 -->
            <div class="p-4">
              <h3
                class="font-semibold truncate mb-1"
                :class="row.deleted ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'"
              >
                {{ row.workTitle }}
              </h3>
              <div class="flex items-center flex-wrap gap-2 mt-2 text-xs">
                <span class="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  最近浏览 {{ formatAgo(row.lastViewedAt) }}
                </span>
                <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400">
                  看过 {{ row.times }} 次
                </span>
              </div>
              <div class="flex items-center gap-2 mt-3">
                <NuxtLink
                  v-if="!row.deleted"
                  :to="'/watch/' + row.workId"
                  class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-gray-600 text-center text-sm text-gray-700 dark:text-gray-300 rounded-lg transition"
                >
                  查看
                </NuxtLink>
                <span
                  v-else
                  class="flex-1 px-3 py-2 bg-gray-100 dark:bg-neutral-700 text-center text-sm text-gray-400 cursor-not-allowed rounded-lg"
                >
                  作品已删除
                </span>
                <button
                  :disabled="removingIds.has(row.workId)"
                  class="px-2.5 py-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 rounded-lg transition"
                  title="移除这条浏览记录"
                  @click="removeItem(row)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="mt-8 text-center">
          <button
            :disabled="loadingMore"
            class="px-6 py-2.5 bg-white dark:bg-surface-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-500 disabled:opacity-50 font-medium rounded-xl transition"
            @click="loadMore"
          >
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>

        <!-- 危险区：清空全部 -->
        <div
          v-if="items.length > 0"
          class="mt-10 border-t border-gray-200 dark:border-neutral-700 pt-6 pb-2 flex justify-center"
        >
          <button
            :disabled="clearing"
            class="px-6 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 font-medium rounded-xl transition"
            @click="clearAll"
          >
            {{ clearing ? '清空中...' : '清空全部' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>