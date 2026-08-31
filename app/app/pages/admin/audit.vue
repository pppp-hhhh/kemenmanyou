<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin" class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100">审计日志</h1>
      <span class="text-sm text-neutral-500 dark:text-neutral-400">共 {{ total }} 条</span>
    </div>

    <!-- 过滤 -->
    <div class="bg-white dark:bg-surface-800 rounded-lg shadow p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <select
          v-model="actionFilter"
          class="px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          @change="handleSearch"
        >
          <option value="">全部操作</option>
          <option v-for="a in actions" :key="a" :value="a">{{ actionLabel(a) }}</option>
        </select>
        <select
          v-model="targetTypeFilter"
          class="px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          @change="handleSearch"
        >
          <option value="">全部对象</option>
          <option value="users">用户</option>
          <option value="works">作品</option>
          <option value="lessons">课文</option>
        </select>
        <button
          @click="handleReset"
          class="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition"
        >
          重置
        </button>
      </div>
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
    <div v-else-if="logs.length === 0" class="text-center py-12 bg-white dark:bg-surface-800 rounded-lg">
      <p class="text-neutral-500">暂无日志</p>
    </div>

    <!-- 日志列表 -->
    <div v-else class="bg-white dark:bg-surface-800 rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-surface-50 dark:bg-surface-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">操作员</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">操作</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">对象</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">详情</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-200 dark:divide-neutral-700">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-surface-50 dark:hover:bg-neutral-700/50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
              {{ new Date(log.created_at).toLocaleString('zh-CN') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <div class="text-neutral-700 dark:text-neutral-100">{{ log.admin?.display_name || log.admin?.email || '系统' }}</div>
              <div v-if="log.admin_id" class="text-xs text-neutral-400 truncate max-w-[160px]">{{ log.admin_id }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="actionColorClass(log.action)"
                class="text-xs px-2 py-1 rounded font-medium"
              >
                {{ actionLabel(log.action) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
              <div>{{ targetTypeLabel(log.target_type) }}</div>
              <div v-if="log.target_id" class="text-xs text-neutral-400">#{{ log.target_id }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
              <details v-if="log.detail">
                <summary class="cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">查看详情</summary>
                <pre class="mt-2 text-xs bg-surface-50 dark:bg-surface-900 p-2 rounded overflow-x-auto max-w-md">{{ formatDetail(log.detail) }}</pre>
              </details>
              <span v-else class="text-neutral-400">-</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-surface-200 dark:border-neutral-700">
        <div class="text-sm text-neutral-500 dark:text-neutral-400">
          共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页
        </div>
        <div class="flex gap-2">
          <button
            @click="handlePageChange(page - 1)"
            :disabled="page <= 1"
            class="px-3 py-1 rounded border border-surface-300 dark:border-surface-600 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-surface-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            @click="handlePageChange(page + 1)"
            :disabled="page >= totalPages"
            class="px-3 py-1 rounded border border-surface-300 dark:border-surface-600 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-surface-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
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
    // 只在首次加载时更新 actions 列表
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

const actionLabel = (action: string): string => {
  return ACTION_LABELS[action] || action
}

const actionColorClass = (action: string): string => {
  if (action.startsWith('work_approve') || action === 'user_unban') {
    return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
  }
  if (action.includes('delete') || action === 'user_ban' || action === 'work_reject') {
    return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
  }
  if (action.includes('role')) {
    return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
  }
  return 'bg-surface-100 text-neutral-600 dark:bg-surface-700 dark:text-neutral-400'
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
