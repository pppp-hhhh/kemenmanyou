<template>
  <div class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
    <!-- 顶部版心 -->
    <section class="mb-8 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
      <NuxtLink to="/admin" class="inline-flex items-center gap-2 text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 transition-colors font-kai text-sm mb-4 group">
        <span class="font-latin italic group-hover:-translate-x-1 transition-transform">←</span>
        <span>返 卷宗</span>
      </NuxtLink>
      <div class="flex items-center gap-3 mb-3">
        <div class="folio">卷 · 六</div>
        <div class="brush-divider w-24"></div>
        <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">VI. AUDIT</div>
      </div>
      <div class="flex items-end justify-between flex-wrap gap-4">
        <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
          审<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">计</span>
        </h1>
        <p class="font-kai text-sm text-ink-500 dark:text-paper-300">
          共 <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ total }}</span> 条手记
        </p>
      </div>
    </section>

    <!-- 筛选 -->
    <section class="paper-panel p-5 mb-6">
      <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div class="flex-1">
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">ACTION · 操作</label>
          <select v-model="actionFilter" class="input-editorial w-full" @change="handleSearch">
            <option value="">全部操作</option>
            <option v-for="a in actions" :key="a" :value="a">{{ actionLabel(a) }}</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">TARGET · 对象</label>
          <select v-model="targetTypeFilter" class="input-editorial w-full" @change="handleSearch">
            <option value="">全部对象</option>
            <option value="users">用户</option>
            <option value="works">作品</option>
            <option value="lessons">课文</option>
          </select>
        </div>
        <button @click="handleReset" class="btn-outline whitespace-nowrap">
          <span class="font-kai">重置</span>
        </button>
      </div>
    </section>

    <!-- 加载 -->
    <div v-if="loading" class="text-center py-24">
      <div class="inline-flex items-center gap-3 mb-3">
        <svg class="animate-spin h-6 w-6 text-cinnabar-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="font-kai text-sm text-ink-400 dark:text-paper-300">正在翻阅手记...</span>
      </div>
      <div class="font-latin italic text-xs text-ink-300 dark:text-paper-400 tracking-widest">LOADING</div>
    </div>

    <!-- 空 -->
    <div v-else-if="logs.length === 0" class="text-center py-24 paper-panel paper-panel-edge">
      <div class="seal-outline mx-auto mb-4" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
        无<br>录
      </div>
      <p class="font-kai text-sm text-ink-400 dark:text-paper-300">尚无日志</p>
    </div>

    <!-- 列表 -->
    <div v-else class="paper-panel paper-panel-edge overflow-hidden">
      <!-- 表头 -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-ink-500/15 dark:border-paper-300/10 bg-paper-100/40 dark:bg-ink-500/30">
        <div class="col-span-2 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">TIME · 时</div>
        <div class="col-span-3 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">OPERATOR · 操作员</div>
        <div class="col-span-2 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">ACTION · 行</div>
        <div class="col-span-2 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">TARGET · 对象</div>
        <div class="col-span-3 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">DETAIL · 详</div>
      </div>

      <!-- 表体 -->
      <ul class="divide-y divide-ink-500/10 dark:divide-paper-300/10">
        <li
          v-for="log in logs"
          :key="log.id"
          class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-paper-100/30 dark:hover:bg-ink-500/20 transition-colors"
        >
          <!-- 时间 -->
          <div class="md:col-span-2">
            <div class="font-latin italic text-xs text-ink-500 dark:text-paper-300 leading-relaxed">
              {{ new Date(log.created_at).toLocaleString('zh-CN') }}
            </div>
          </div>

          <!-- 操作员 -->
          <div class="md:col-span-3">
            <div class="font-kai text-sm text-ink-700 dark:text-paper-100">{{ log.admin?.display_name || log.admin?.email || '系统' }}</div>
            <div v-if="log.admin_id" class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400 truncate">{{ log.admin_id }}</div>
          </div>

          <!-- 操作 -->
          <div class="md:col-span-2">
            <span :class="actionSealClass(log.action)" class="text-[10px]">
              {{ actionGlyph(log.action) }}
            </span>
            <div class="font-kai text-xs text-ink-500 dark:text-paper-300 mt-1">{{ actionLabel(log.action) }}</div>
          </div>

          <!-- 对象 -->
          <div class="md:col-span-2">
            <div class="font-kai text-sm text-ink-700 dark:text-paper-100">{{ targetTypeLabel(log.target_type) }}</div>
            <div v-if="log.target_id" class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400">#{{ log.target_id }}</div>
          </div>

          <!-- 详情 -->
          <div class="md:col-span-3">
            <details v-if="log.detail" class="group">
              <summary class="cursor-pointer font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline list-none flex items-center gap-1">
                <span class="font-latin italic transition-transform group-open:rotate-90">›</span>
                <span>查看详情</span>
              </summary>
              <pre class="mt-2 text-xs bg-paper-100 dark:bg-ink-500/40 p-3 overflow-x-auto max-w-md font-latin text-ink-600 dark:text-paper-300 border-l-2 border-cinnabar-500/40">{{ formatDetail(log.detail) }}</pre>
            </details>
            <span v-else class="font-latin italic text-xs text-ink-300 dark:text-paper-400">—</span>
          </div>
        </li>
      </ul>

      <!-- 分页 -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-ink-500/15 dark:border-paper-300/10">
        <div class="font-kai text-xs text-ink-500 dark:text-paper-300">
          共 <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ total }}</span> 条 · 第
          <span class="font-display text-ink-700 dark:text-paper-50">{{ page }}</span> /
          <span class="font-display text-ink-700 dark:text-paper-50">{{ totalPages }}</span> 页
        </div>
        <div class="flex gap-2">
          <button
            @click="handlePageChange(page - 1)"
            :disabled="page <= 1"
            class="btn-outline px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span class="font-latin italic text-xs">← PREV</span>
          </button>
          <button
            @click="handlePageChange(page + 1)"
            :disabled="page >= totalPages"
            class="btn-outline px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span class="font-latin italic text-xs">NEXT →</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 落款 -->
    <div class="mt-16 flex items-center justify-center gap-3">
      <div class="brush-divider w-32"></div>
      <div class="seal seal-tag text-xs">审 · 记</div>
      <div class="brush-divider w-32"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuditLog } from '~/types/api'

definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()
const logs = ref<(AuditLog & { admin?: { email?: string; display_name?: string } })[]>([])
const loading = ref(true)

const actionFilter = ref('')
const targetTypeFilter = ref('')
const page = ref(1)
const pageSize = ref(50)
const total = ref(0)
const actions = ref<string[]>([])

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

onMounted(async () => {
  await fetchLogs()
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const response = await $fetch<{
      data: any[]
      total: number
      page: number
      page_size: number
      actions: string[]
    }>('/api/admin/audit', {
      headers: { Authorization: authStore.getAuthHeader() },
      query: {
        action: actionFilter.value || undefined,
        target_type: targetTypeFilter.value || undefined,
        page: page.value,
        page_size: pageSize.value,
      },
    })
    logs.value = response.data || []
    total.value = response.total || 0
    if (actions.value.length === 0) {
      actions.value = response.actions || []
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    logs.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchLogs()
}

const handleReset = () => {
  actionFilter.value = ''
  targetTypeFilter.value = ''
  page.value = 1
  fetchLogs()
}

const handlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchLogs()
}

// 操作类型 → 中文标签
const ACTION_LABELS: Record<string, string> = {
  user_ban: '封禁用户',
  user_unban: '解封用户',
  user_role_change: '修改用户角色',
  work_approve: '通过作品',
  work_reject: '拒绝作品',
  work_delete: '删除作品',
  lesson_delete: '删除课文',
  work_batch_delete: '批量删除作品',
}

const actionLabel = (action: string): string => ACTION_LABELS[action] || action

const actionGlyph = (action: string): string => {
  if (action === 'work_approve' || action === 'user_unban') return '通'
  if (action === 'work_reject' || action === 'user_ban') return '禁'
  if (action.includes('delete')) return '删'
  if (action.includes('role')) return '改'
  return '记'
}

const actionSealClass = (action: string): string => {
  if (action === 'work_approve' || action === 'user_unban') return 'seal seal-tag'
  if (action.includes('delete') || action === 'user_ban' || action === 'work_reject') return 'seal seal-tag'
  if (action.includes('role')) return 'seal-outline'
  return 'seal-outline'
}

const targetTypeLabel = (t: string): string => {
  const map: Record<string, string> = {
    users: '用户',
    works: '作品',
    lessons: '课文',
  }
  return map[t] || t
}

const formatDetail = (detail: any): string => {
  if (typeof detail === 'string') return detail
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return String(detail)
  }
}
</script>
