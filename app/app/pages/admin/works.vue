<template>
  <div class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
    <!-- 顶部版心 -->
    <section class="mb-8 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
      <NuxtLink to="/admin" class="inline-flex items-center gap-2 text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 transition-colors font-kai text-sm mb-4 group">
        <span class="font-latin italic group-hover:-translate-x-1 transition-transform">←</span>
        <span>返 卷宗</span>
      </NuxtLink>
      <div class="flex items-center gap-3 mb-3">
        <div class="folio">卷 · 贰</div>
        <div class="brush-divider w-24"></div>
        <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">II. WORKS</div>
      </div>
      <div class="flex items-end justify-between flex-wrap gap-4">
        <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
          入<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">册</span>
        </h1>
        <p class="font-kai text-sm text-ink-500 dark:text-paper-300">
          众画之卷 · 待审 / 已展 / 被拒
        </p>
      </div>
    </section>

    <!-- 筛选 + 批量操作 -->
    <section class="paper-panel p-5 mb-5">
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">
            STATUS · 状态
          </label>
          <select v-model="filters.status" @change="handleFilterChange" class="input-editorial">
            <option value="all">全部</option>
            <option value="pending">待审</option>
            <option value="approved">已展</option>
            <option value="rejected">被拒</option>
          </select>
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">
            SEARCH · 搜标题
          </label>
          <input
            v-model="filters.search"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="输入后回车..."
            class="input-editorial w-full"
          />
        </div>

        <div v-if="selectedIds.length > 0" class="flex items-center gap-2 px-4 py-2 bg-cinnabar-50 dark:bg-cinnabar-900/15 border border-cinnabar-500/30 self-end">
          <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ selectedIds.length }}</span>
          <span class="font-kai text-xs text-ink-500 dark:text-paper-300">已择</span>
          <button @click="handleBatchApprove" :disabled="processing" class="font-kai text-xs text-bamboo-600 dark:text-bamboo-400 hover:underline disabled:opacity-40">
            批展
          </button>
          <span class="font-latin italic text-ink-300 dark:text-paper-400">·</span>
          <button @click="handleBatchReject" :disabled="processing" class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline disabled:opacity-40">
            批拒
          </button>
          <span class="font-latin italic text-ink-300 dark:text-paper-400">·</span>
          <button @click="handleBatchDelete" :disabled="processing" class="font-kai text-xs text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 hover:underline disabled:opacity-40">
            批销
          </button>
        </div>
      </div>
    </section>

    <!-- 全选 -->
    <section class="flex items-center gap-3 mb-4 px-2">
      <label class="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          v-model="selectAll"
          @change="toggleSelectAll"
          class="w-4 h-4 accent-cinnabar-600"
        />
        <span class="font-kai text-sm text-ink-500 dark:text-paper-300 group-hover:text-cinnabar-600 dark:group-hover:text-cinnabar-400 transition-colors">全择</span>
      </label>
      <div class="brush-divider flex-1"></div>
      <span class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">
        {{ works.length }} ITEMS
      </span>
    </section>

    <!-- 加载 -->
    <div v-if="loading" class="text-center py-24">
      <div class="inline-flex items-center gap-3 mb-3">
        <svg class="animate-spin h-6 w-6 text-cinnabar-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="font-kai text-sm text-ink-400 dark:text-paper-300">正在翻阅画册...</span>
      </div>
      <div class="font-latin italic text-xs text-ink-300 dark:text-paper-400 tracking-widest">LOADING</div>
    </div>

    <!-- 空 -->
    <div v-else-if="works.length === 0" class="text-center py-24 paper-panel paper-panel-edge">
      <div class="seal-outline mx-auto mb-4" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
        空<br>册
      </div>
      <p class="font-kai text-sm text-ink-400 dark:text-paper-300">尚无作品</p>
    </div>

    <!-- 作品列表 -->
    <div v-else class="space-y-3">
      <div
        v-for="work in works"
        :key="work.id"
        class="paper-panel paper-panel-edge p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
      >
        <!-- 选择 -->
        <input
          type="checkbox"
          :checked="selectedIds.includes(work.id)"
          @change="toggleSelect(work.id)"
          class="w-4 h-4 accent-cinnabar-600 flex-shrink-0"
        />

        <!-- 封面 -->
        <div class="w-24 h-24 bg-paper-200 dark:bg-ink-500 overflow-hidden flex-shrink-0 relative">
          <img
            v-if="work.thumbnail"
            :src="work.thumbnail"
            :alt="work.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="font-display text-3xl text-ink-500/15 dark:text-paper-300/15">无</span>
          </div>
        </div>

        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-1">
            <h3 class="font-display text-base text-ink-700 dark:text-paper-50 truncate">
              {{ work.title || '无题' }}
            </h3>
            <span :class="reviewStatusSeal(work.review_status).cls + ' text-[10px] flex-shrink-0'">
              {{ reviewStatusSeal(work.review_status).glyph }}
            </span>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <span class="seal-outline text-[10px]">{{ work.style }}</span>
            <span class="font-kai text-xs text-ink-400 dark:text-paper-400">
              {{ reviewStatusText(work.review_status) }}
            </span>
            <span class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400">
              {{ work.scenes?.length || 0 }} SCENES
            </span>
            <span class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400">
              {{ new Date(work.created_at).toLocaleDateString('zh-CN') }}
            </span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="flex gap-2 flex-shrink-0">
          <template v-if="work.review_status === 'pending'">
            <button
              @click="handleApprove(work.id)"
              :disabled="processingId === work.id"
              class="btn-cinnabar px-3 py-1.5 text-xs disabled:opacity-40"
            >
              <span class="font-kai">展</span>
            </button>
            <button
              @click="handleReject(work.id)"
              :disabled="processingId === work.id"
              class="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
            >
              <span class="font-kai">拒</span>
            </button>
          </template>
          <NuxtLink
            :to="`/watch/${work.id}`"
            target="_blank"
            class="btn-outline px-3 py-1.5 text-xs"
          >
            <span class="font-latin italic">VIEW</span>
          </NuxtLink>
          <button
            @click="handleDelete(work.id)"
            :disabled="processingId === work.id"
            class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline disabled:opacity-40 px-2"
          >
            销
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-4 mt-8">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="btn-outline px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span class="font-latin italic text-xs">← PREV</span>
      </button>
      <span class="font-kai text-xs text-ink-500 dark:text-paper-300">
        <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ currentPage }}</span>
        <span class="font-latin italic mx-1">/</span>
        <span class="font-display text-ink-700 dark:text-paper-50">{{ totalPages }}</span>
      </span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="btn-outline px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span class="font-latin italic text-xs">NEXT →</span>
      </button>
    </div>

    <!-- 落款 -->
    <div class="mt-16 flex items-center justify-center gap-3">
      <div class="brush-divider w-32"></div>
      <div class="seal seal-tag text-xs">入 · 册</div>
      <div class="brush-divider w-32"></div>
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
    pending: '待审',
    approved: '已展',
    rejected: '被拒'
  }
  return map[status] || status
}

const reviewStatusSeal = (status: string) => {
  if (status === 'pending') return { cls: 'seal-outline', glyph: '待' }
  if (status === 'approved') return { cls: 'seal seal-tag', glyph: '展' }
  if (status === 'rejected') return { cls: 'seal seal-tag', glyph: '拒' }
  return { cls: 'seal-outline', glyph: '?' }
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
  if (confirm(`确定要销册选中的 ${selectedIds.value.length} 个作品吗？`)) {
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
  if (!confirm('确定要销册此作品吗？')) return

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
