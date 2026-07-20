<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">课文管理</h1>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索课文标题..."
          class="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        />

        <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ selectedIds.length }} 已选择</span>
          <button
            @click="handleBatchDelete"
            :disabled="processing"
            class="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-lg"
          >
            批量删除
          </button>
        </div>
      </div>
    </div>

    <!-- Select All -->
    <div class="flex items-center gap-2 mb-4">
      <input
        type="checkbox"
        v-model="selectAll"
        @change="toggleSelectAll"
        class="w-5 h-5 rounded border-gray-300"
      />
      <span class="text-sm text-gray-600 dark:text-gray-400">全选</span>
    </div>

    <div v-if="loading" class="text-center py-12">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-gray-500 mt-4">加载中...</p>
    </div>

    <div v-else-if="filteredLessons.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
      <p class="text-gray-500">暂无课文</p>
    </div>

    <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 w-10"></th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">年级</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">来源</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="lesson in filteredLessons" :key="lesson.id">
            <td class="px-6 py-4">
              <input
                type="checkbox"
                :checked="selectedIds.includes(lesson.id)"
                @change="toggleSelect(lesson.id)"
                class="w-5 h-5 rounded border-gray-300"
              />
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ lesson.title }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{{ lesson.content?.slice(0, 50) }}...</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ lesson.grade || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ lesson.source || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ new Date(lesson.created_at).toLocaleDateString('zh-CN') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <button
                @click="handleDelete(lesson.id)"
                :disabled="processingId === lesson.id"
                class="text-red-600 hover:text-red-700 disabled:text-red-400"
              >
                {{ processingId === lesson.id ? '删除中...' : '删除' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()

const lessons = ref<any[]>([])
const loading = ref(true)
const processing = ref(false)
const processingId = ref<number | null>(null)
const selectedIds = ref<number[]>([])
const selectAll = ref(false)
const searchQuery = ref('')

onMounted(async () => {
  await fetchLessons()
})

const fetchLessons = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/lessons', {
      headers: {
        Authorization: authStore.getAuthHeader()
      }
    })
    lessons.value = response as any[]
  } catch (error) {
    console.error('Failed to fetch lessons:', error)
  } finally {
    loading.value = false
  }
}

const filteredLessons = computed(() => {
  if (!searchQuery.value) return lessons.value
  const query = searchQuery.value.toLowerCase()
  return lessons.value.filter(l =>
    l.title?.toLowerCase().includes(query) ||
    l.content?.toLowerCase().includes(query)
  )
})

const toggleSelect = (id: number) => {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = filteredLessons.value.map(l => l.id)
  } else {
    selectedIds.value = []
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这篇课文吗？')) return

  processingId.value = id
  try {
    await $fetch(`/api/admin/lessons/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authStore.getAuthHeader()
      }
    } as any)
    await fetchLessons()
  } catch (error) {
    console.error('Failed to delete:', error)
  } finally {
    processingId.value = null
  }
}

const handleBatchDelete = async () => {
  if (!confirm(`确定要删除选中的 ${selectedIds.value.length} 篇课文吗？`)) return

  processing.value = true
  try {
    for (const id of selectedIds.value) {
      await $fetch(`/api/admin/lessons/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: authStore.getAuthHeader()
        }
      } as any)
    }
    selectedIds.value = []
    selectAll.value = false
    await fetchLessons()
  } catch (error) {
    console.error('Batch delete failed:', error)
  } finally {
    processing.value = false
  }
}
</script>
