<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin" class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100">作品管理</h1>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white dark:bg-surface-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Status Filter -->
        <select
          v-model="filters.status"
          @change="handleFilterChange"
          class="px-4 py-2 rounded-lg border border-surface-200 dark:border-neutral-700 bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100"
        >
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已批准</option>
          <option value="rejected">已拒绝</option>
        </select>

        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="filters.search"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="搜索作品标题..."
            class="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-neutral-700 bg-white dark:bg-surface-900 text-neutral-700 dark:text-neutral-100"
          />
        </div>

        <!-- Batch Actions -->
        <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-neutral-500">{{ selectedIds.length }} 已选择</span>
          <button
            @click="handleBatchApprove"
            :disabled="processing"
            class="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg"
          >
            批量批准
          </button>
          <button
            @click="handleBatchReject"
            :disabled="processing"
            class="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-lg"
          >
            批量拒绝
          </button>
          <button
            @click="handleBatchDelete"
            :disabled="processing"
            class="px-3 py-2 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-sm rounded-lg"
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
        class="w-5 h-5 rounded border-surface-300"
      />
      <span class="text-sm text-neutral-600 dark:text-neutral-400">全选</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <svg class="animate-spin h-8 w-8 mx-auto text-primary-500" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-neutral-500 mt-4">加载中...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="works.length === 0" class="text-center py-12 bg-white dark:bg-surface-800 rounded-lg">
      <p class="text-neutral-500">暂无作品</p>
    </div>

    <!-- Works List -->
    <div v-else class="space-y-4">
      <div
        v-for="work in works"
        :key="work.id"
        class="bg-white dark:bg-surface-800 rounded-lg shadow p-4 flex items-center gap-4"
      >
        <input
          type="checkbox"
          :checked="selectedIds.includes(work.id)"
          @change="toggleSelect(work.id)"
          class="w-5 h-5 rounded border-surface-300"
        />

        <div class="w-24 h-18 bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden flex-shrink-0">
          <img
            v-if="work.thumbnail"
            :src="work.thumbnail"
            :alt="work.title"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-neutral-700 dark:text-neutral-100 truncate">{{ work.title || '无标题' }}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-500 dark:text-primary-400 rounded">
              {{ work.style }}
            </span>
            <span
              :class="{
                'bg-yellow-100 text-yellow-600': work.review_status === 'pending',
                'bg-green-100 text-green-600': work.review_status === 'approved',
                'bg-red-100 text-red-600': work.review_status === 'rejected'
              }"
              class="text-xs px-2 py-1 rounded"
            >
              {{ reviewStatusText(work.review_status) }}
            </span>
            <span class="text-xs text-neutral-500">
              {{ work.scenes?.length || 0 }} 场景
            </span>
          </div>
          <p class="text-xs text-neutral-500 mt-1">
            {{ new Date(work.created_at).toLocaleDateString('zh-CN') }}
          </p>
        </div>

        <div class="flex gap-2">
          <template v-if="work.review_status === 'pending'">
            <button
              @click="handleApprove(work.id)"
              :disabled="processingId === work.id"
              class="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg transition"
            >
              批准
            </button>
            <button
              @click="handleReject(work.id)"
              :disabled="processingId === work.id"
              class="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-lg transition"
            >
              拒绝
            </button>
          </template>
          <NuxtLink
            :to="`/watch/${work.id}`"
            target="_blank"
            class="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg transition"
          >
            查看
          </NuxtLink>
          <button
            @click="handleDelete(work.id)"
            :disabled="processingId === work.id"
            class="px-3 py-1.5 bg-surface-100 hover:bg-red-100 dark:bg-surface-700 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg transition"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-neutral-700 rounded-lg transition disabled:opacity-50"
      >
        上一页
      </button>
      <span class="px-4 py-2 text-neutral-600 dark:text-neutral-400">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-neutral-700 rounded-lg transition disabled:opacity-50"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()

const works = ref<any[]>([])
const loading = ref(true)
const processing = ref(false)
const processingId = ref<number | null>(null)
const selectedIds = ref<number[]>([])
const selectAll = ref(false)

const filters = ref({
  status: 'all',
  search: ''
})

const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)

onMounted(() => {
  fetchWorks()
})

const fetchWorks = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value,
    }
    if (filters.value.status !== 'all') {
      params.status = filters.value.status
    }
    if (filters.value.search) {
      params.search = filters.value.search
    }

    const response = await $fetch<any>('/api/admin/works', {
      headers: {
        Authorization: authStore.getAuthHeader()
      }
    })

    works.value = response.data || []
    totalPages.value = Math.ceil((response.total || 0) / pageSize.value)
  } catch (error) {
    console.error('Failed to fetch works:', error)
  } finally {
    loading.value = false
  }
}

const reviewStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchWorks()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchWorks()
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchWorks()
}

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
    selectedIds.value = works.value.map(w => w.id)
  } else {
    selectedIds.value = []
  }
}

const handleBatchAction = async (action: 'approve' | 'reject' | 'delete', reason?: string) => {
  if (selectedIds.value.length === 0) return

  processing.value = true
  try {
    const body: any = { ids: selectedIds.value, action }
    if (action === 'reject' && reason) body.reason = reason
    const result = await $fetch<any>('/api/admin/works/batch', {
      method: 'POST',
      headers: {
        Authorization: authStore.getAuthHeader()
      },
      body
    })

    if (result.success.length > 0) {
      selectedIds.value = []
      selectAll.value = false
      await fetchWorks()
    }
  } catch (error) {
    console.error('Batch action failed:', error)
  } finally {
    processing.value = false
  }
}

const handleBatchApprove = () => handleBatchAction('approve')
const handleBatchReject = () => {
  const reason = prompt('请输入批量拒绝原因（可选）：') || ''
  handleBatchAction('reject', reason)
}
const handleBatchDelete = () => {
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 个作品吗？`)) {
    handleBatchAction('delete')
  }
}

const handleApprove = async (id: number) => {
  processingId.value = id
  try {
    await $fetch(`/api/admin/works/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: authStore.getAuthHeader() }
    })
    await fetchWorks()
  } catch (error) {
    console.error('Failed to approve:', error)
  } finally {
    processingId.value = null
  }
}

const handleReject = async (id: number) => {
  const reason = prompt('请输入拒绝原因（可选）：') || ''
  processingId.value = id
  try {
    await $fetch(`/api/admin/works/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: authStore.getAuthHeader() },
      body: { reason }
    })
    await fetchWorks()
  } catch (error) {
    console.error('Failed to reject:', error)
  } finally {
    processingId.value = null
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这个作品吗？')) return

  processingId.value = id
  try {
    await $fetch(`/api/admin/works/${id}`, {
      method: 'DELETE',
      headers: { Authorization: authStore.getAuthHeader() }
    } as any)
    await fetchWorks()
  } catch (error) {
    console.error('Failed to delete:', error)
  } finally {
    processingId.value = null
  }
}
</script>
