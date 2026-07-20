<template>
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">管理员面板</h1>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">作品总数</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.works?.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">待审核</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.works?.pending || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">已通过</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.works?.approved || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">课文总数</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.lessons?.total || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 次级统计 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">用户总数</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.users?.total || 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">活跃用户</p>
        <p class="text-xl font-bold text-green-600 mt-1">{{ stats.users?.active || 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">已封禁</p>
        <p class="text-xl font-bold text-red-600 mt-1">{{ stats.users?.banned || 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">已拒绝作品</p>
        <p class="text-xl font-bold text-gray-500 dark:text-gray-400 mt-1">{{ stats.works?.rejected || 0 }}</p>
      </div>
    </div>

    <!-- 近 7 天作品趋势 -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-8">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">近 7 天作品趋势</h2>
      <div v-if="(stats.daily_works || []).length === 0" class="text-gray-400 text-sm py-6 text-center">
        暂无数据
      </div>
      <div v-else class="flex items-end justify-between gap-2 h-48">
        <div
          v-for="d in stats.daily_works"
          :key="d.date"
          class="flex-1 flex flex-col items-center gap-1"
        >
          <!-- 柱状图 -->
          <div class="w-full flex flex-col-reverse items-stretch h-40 gap-0.5">
            <div
              class="bg-green-500 dark:bg-green-400 rounded-t transition-all"
              :style="{ height: barHeight(d.approved) + '%' }"
              :title="`已通过: ${d.approved}`"
            ></div>
            <div
              class="bg-yellow-500 dark:bg-yellow-400 transition-all"
              :style="{ height: barHeight(d.pending) + '%' }"
              :title="`待审核: ${d.pending}`"
            ></div>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ d.date.slice(5) }}</span>
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ d.total }}</span>
        </div>
      </div>
      <div class="flex gap-4 mt-4 justify-center">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-yellow-500 dark:bg-yellow-400 rounded"></span>
          <span class="text-xs text-gray-500 dark:text-gray-400">待审核</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-green-500 dark:bg-green-400 rounded"></span>
          <span class="text-xs text-gray-500 dark:text-gray-400">已通过</span>
        </div>
      </div>
    </div>

    <!-- 最近操作 + 管理入口 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 最近操作 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">最近操作</h2>
          <NuxtLink to="/admin/audit" class="text-sm text-indigo-600 hover:text-indigo-700">查看全部 →</NuxtLink>
        </div>
        <div v-if="(stats.recent_logs || []).length === 0" class="text-gray-400 text-sm py-6 text-center">
          暂无操作记录
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="log in stats.recent_logs"
            :key="log.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                :class="actionColorClass(log.action)"
                class="text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                {{ actionLabel(log.action) }}
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400 truncate">
                {{ targetTypeLabel(log.target_type) }}<span v-if="log.target_id"> #{{ log.target_id }}</span>
              </span>
            </div>
            <span class="text-xs text-gray-400 whitespace-nowrap ml-2">
              {{ relativeTime(log.created_at) }}
            </span>
          </li>
        </ul>
      </div>

      <!-- 管理入口 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">管理入口</h2>
        <div class="grid grid-cols-2 gap-3">
          <NuxtLink
            to="/admin/works"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div class="text-sm font-medium text-gray-900 dark:text-white">作品管理</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ stats.works?.pending || 0 }} 待审核 · {{ stats.works?.approved || 0 }} 已通过
            </div>
          </NuxtLink>
          <NuxtLink
            to="/admin/lessons"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div class="text-sm font-medium text-gray-900 dark:text-white">课文管理</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stats.lessons?.total || 0 }} 篇</div>
          </NuxtLink>
          <NuxtLink
            to="/admin/users"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div class="text-sm font-medium text-gray-900 dark:text-white">用户管理</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ stats.users?.total || 0 }} 用户 · {{ stats.users?.banned || 0 }} 封禁
            </div>
          </NuxtLink>
          <NuxtLink
            to="/admin/invite-codes"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div class="text-sm font-medium text-gray-900 dark:text-white">邀请码</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">生成管理员邀请码</div>
          </NuxtLink>
          <NuxtLink
            to="/admin/audit"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition col-span-2"
          >
            <div class="text-sm font-medium text-gray-900 dark:text-white">审计日志</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">操作记录追溯</div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()
const stats = ref<any>({})

onMounted(async () => {
  try {
    const response = await $fetch('/api/admin/stats', {
      headers: { Authorization: authStore.getAuthHeader() },
    })
    stats.value = response
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
})

// 计算柱状图高度（按最大值归一化到 0-100%）
const maxDaily = computed(() => {
  const arr = stats.value?.daily_works || []
  if (arr.length === 0) return 1
  return Math.max(...arr.map((d: any) => d.total), 1)
})

const barHeight = (value: number): number => {
  if (!value) return 0
  return Math.max(4, Math.round((value / maxDaily.value) * 100))
}

// 操作类型 → 中文标签
const ACTION_LABELS: Record<string, string> = {
  user_ban: '封禁用户',
  user_unban: '解封用户',
  user_role_change: '修改角色',
  work_approve: '通过作品',
  work_reject: '拒绝作品',
  work_delete: '删除作品',
  work_batch_delete: '批量删除',
  lesson_delete: '删除课文',
}

const actionLabel = (action: string): string => ACTION_LABELS[action] || action

const actionColorClass = (action: string): string => {
  if (action === 'work_approve' || action === 'user_unban') {
    return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
  }
  if (action.includes('delete') || action === 'user_ban' || action === 'work_reject') {
    return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
  }
  if (action.includes('role')) {
    return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
  }
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
}

const targetTypeLabel = (t: string): string => {
  const map: Record<string, string> = { users: '用户', works: '作品', lessons: '课文' }
  return map[t] || t
}

const relativeTime = (iso: string): string => {
  const date = new Date(iso)
  const now = Date.now()
  const diff = now - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return date.toLocaleDateString('zh-CN')
}
</script>
