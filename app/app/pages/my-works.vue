<script setup lang="ts">
import type { Work } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const { styleBadge, reviewBadge, reviewLabel, formatDate, getThumbnail } = useThemeColors()

const works = ref<Work[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const deletingId = ref<number | null>(null)
const activeTab = ref<string>('all')

// 状态标签
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已公开' },
  { key: 'rejected', label: '已拒绝' },
]

// 筛选后的作品
const filteredWorks = computed(() => {
  if (activeTab.value === 'all') return works.value
  return works.value.filter(w => w.review_status === activeTab.value)
})

// 统计
const tabCounts = computed(() => ({
  all: works.value.length,
  pending: works.value.filter(w => w.review_status === 'pending').length,
  approved: works.value.filter(w => w.review_status === 'approved').length,
  rejected: works.value.filter(w => w.review_status === 'rejected').length,
}))

// 加载我的作品
const loadWorks = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await $fetch<{ data: Work[]; total: number }>('/api/works/my', {
      headers: { Authorization: authStore.getAuthHeader() }
    })
    works.value = response?.data || []
  } catch (e: any) {
    error.value = e?.message || '加载作品失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 删除作品
const deleteWork = async (work: Work) => {
  if (!confirm(`确定要删除作品「${work.title}」吗？此操作不可恢复。`)) return
  deletingId.value = work.id
  try {
    await $fetch(`/api/works/${work.id}`, {
      method: 'DELETE',
      headers: { Authorization: authStore.getAuthHeader() }
    })
    works.value = works.value.filter(w => w.id !== work.id)
  } catch (e: any) {
    alert('删除失败：' + (e?.message || '请稍后重试'))
  } finally {
    deletingId.value = null
  }
}

onMounted(() => loadWorks())
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-surface-50 dark:bg-surface-900 transition-colors">
    <!-- 页面标题 -->
    <div class="bg-white dark:bg-surface-800 border-b border-surface-300 dark:border-neutral-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100">我的作品</h1>
            <p class="mt-1 text-neutral-500 dark:text-neutral-400">管理你创作的所有课文漫画作品</p>
          </div>
          <NuxtLink
            to="/workspace"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium
                   hover:bg-primary-600 transition-colors"
          >
            <span>创建新作品</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 加载状态：骨架屏 -->
      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 6" :key="i" class="bg-white dark:bg-surface-800 rounded-lg p-4 flex gap-4 animate-pulse">
          <div class="w-24 h-18 bg-surface-200 dark:bg-neutral-700 rounded flex-shrink-0" />
          <div class="flex-1 space-y-3">
            <div class="h-4 bg-surface-200 dark:bg-neutral-700 rounded w-1/3" />
            <div class="h-3 bg-surface-200 dark:bg-neutral-700 rounded w-1/2" />
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

      <!-- 空状态 -->
      <div v-else-if="works.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">🎨</div>
        <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100 mb-2">还没有作品</h3>
        <p class="text-neutral-500 dark:text-neutral-400 mb-6">开始创作你的第一份课文漫画吧！</p>
        <NuxtLink
          to="/workspace"
          class="inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium
                 hover:bg-primary-600 transition-colors"
        >
          去创作
        </NuxtLink>
      </div>

            <!-- 有内容 -->
      <template v-else>
        <!-- 状态标签页 -->
        <div class="flex items-center gap-1 mb-6 border-b border-surface-300 dark:border-neutral-700">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-4 py-2.5 text-sm font-medium transition-colors relative"
            :class="activeTab === tab.key
              ? 'text-primary-500'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span class="ml-1.5 text-xs text-neutral-400">({{ tabCounts[tab.key as keyof typeof tabCounts] }})</span>
            <div
              v-if="activeTab === tab.key"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
            />
          </button>
        </div>

        <!-- 作品列表 -->
        <div v-if="filteredWorks.length === 0" class="text-center py-12 text-neutral-500">
          该状态下暂无作品
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="work in filteredWorks"
            :key="work.id"
            class="group bg-white dark:bg-surface-800 rounded-lg overflow-hidden shadow-sm
                   border border-surface-300 dark:border-neutral-700
                   hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800
                   transition-all duration-200 flex gap-4 p-4"
          >
            <!-- 缩略图 -->
            <NuxtLink :to="`/watch/${work.id}`" class="flex-shrink-0">
              <div class="w-24 h-18 overflow-hidden bg-surface-100 dark:bg-neutral-700 rounded">
                <img
                  :src="getThumbnail(work)"
                  :alt="work.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                >
              </div>
            </NuxtLink>

            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <NuxtLink :to="`/watch/${work.id}`" class="block">
                  <h3 class="font-medium text-sm text-neutral-700 dark:text-neutral-100 truncate hover:text-primary-500 transition-colors">
                    {{ work.title }}
                  </h3>
                </NuxtLink>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    :class="['px-2 py-0.5 rounded text-xs font-medium', styleBadge(work.style)]"
                  >
                    {{ work.style }}
                  </span>
                  <span
                    v-if="work.review_status"
                    :class="['px-2 py-0.5 rounded text-xs font-medium', reviewBadge(work.review_status)]"
                  >
                    {{ reviewLabel(work.review_status) }}
                  </span>
                </div>
              </div>

              <p v-if="work.review_status === 'rejected' && work.reject_reason" class="mt-1 text-xs text-error-500 line-clamp-1">
                拒绝原因：{{ work.reject_reason }}
              </p>

              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-neutral-400">
                  {{ formatDate(work.created_at) }}
                </span>
                <div class="flex items-center gap-2">
                  <NuxtLink
                    :to="`/watch/${work.id}`"
                    class="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 bg-surface-100 dark:bg-neutral-700 hover:bg-surface-200 dark:hover:bg-neutral-600 rounded transition"
                  >
                    查看
                  </NuxtLink>
                  <button
                    :disabled="deletingId === work.id"
                    class="px-2 py-1.5 text-xs text-neutral-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 disabled:opacity-50 rounded transition"
                    title="删除作品"
                    @click="deleteWork(work)"
                  >
                    <svg v-if="deletingId === work.id" class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <svg v-else class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>