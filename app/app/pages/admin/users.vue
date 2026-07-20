<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
    </div>

    <!-- 搜索 / 过滤 -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <div class="flex-1 relative">
          <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchInput"
            type="text"
            placeholder="搜索邮箱或显示名称..."
            class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keyup.enter="handleSearch"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @change="handleSearch"
        >
          <option value="all">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">已封禁</option>
        </select>
        <button
          @click="handleSearch"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          搜索
        </button>
        <button
          @click="handleReset"
          class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          重置
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-gray-500 mt-4">加载中...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="users.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
      <p class="text-gray-500">暂无用户</p>
    </div>

    <!-- Users Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">用户</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">邮箱</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">角色</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">注册时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">最近登录</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span class="text-indigo-600 dark:text-indigo-400 font-medium">
                    {{ user.email?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ user.display_name || '未设置' }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ user.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="{
                  'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400': user.role === 'admin',
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': user.role === 'user' || !user.role
                }"
                class="text-xs px-2 py-1 rounded"
              >
                {{ user.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="{
                  'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400': user.status === 'active' || !user.status,
                  'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400': user.status === 'banned'
                }"
                class="text-xs px-2 py-1 rounded"
              >
                {{ user.status === 'banned' ? '已封禁' : '正常' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ new Date(user.created_at).toLocaleDateString('zh-CN') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ user.last_login_at ? new Date(user.last_login_at).toLocaleString('zh-CN') : '从未登录' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div class="flex justify-end gap-2">
                <!-- 不能操作自己 -->
                <template v-if="user.id === currentUserId">
                  <span class="text-gray-400 text-xs">当前账号</span>
                </template>
                <template v-else>
                  <!-- 角色 -->
                  <button
                    v-if="user.role !== 'admin'"
                    @click="handleSetRole(user.id, 'admin')"
                    :disabled="processingId === user.id"
                    class="text-purple-600 hover:text-purple-700 disabled:text-purple-400"
                  >
                    设为管理员
                  </button>
                  <button
                    v-else
                    @click="handleSetRole(user.id, 'user')"
                    :disabled="processingId === user.id"
                    class="text-gray-600 hover:text-gray-700 dark:text-gray-300 disabled:text-gray-400"
                  >
                    撤销管理员
                  </button>
                  <span class="text-gray-300 dark:text-gray-600">|</span>
                  <!-- 封禁/解封 -->
                  <button
                    v-if="user.status !== 'banned'"
                    @click="handleBan(user.id)"
                    :disabled="processingId === user.id"
                    class="text-red-600 hover:text-red-700 disabled:text-red-400"
                  >
                    封禁
                  </button>
                  <button
                    v-else
                    @click="handleUnban(user.id)"
                    :disabled="processingId === user.id"
                    class="text-green-600 hover:text-green-700 disabled:text-green-400"
                  >
                    解封
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页
        </div>
        <div class="flex gap-2">
          <button
            @click="handlePageChange(page - 1)"
            :disabled="page <= 1"
            class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            @click="handlePageChange(page + 1)"
            :disabled="page >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Profile } from '~/types/api'

definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()
const users = ref<Profile[]>([])
const loading = ref(true)
const processingId = ref<string | null>(null)

// 过滤与分页状态
const searchInput = ref('')
const statusFilter = ref<'all' | 'active' | 'banned'>('all')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const currentUserId = computed(() => authStore.user?.id)

onMounted(async () => {
  await fetchUsers()
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ data: Profile[]; total: number; page: number; page_size: number }>('/api/admin/users', {
      headers: { Authorization: authStore.getAuthHeader() },
      query: {
        search: searchInput.value || undefined,
        status: statusFilter.value,
        page: page.value,
        page_size: pageSize.value,
      },
    })
    users.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    console.error('Failed to fetch users:', error)
    users.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchUsers()
}

const handleReset = () => {
  searchInput.value = ''
  statusFilter.value = 'all'
  page.value = 1
  fetchUsers()
}

const handlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchUsers()
}

const handleSetRole = async (id: string, role: 'user' | 'admin') => {
  const action = role === 'admin' ? '设为管理员' : '撤销管理员'
  if (!confirm(`确定要${action}吗？`)) return

  processingId.value = id
  try {
    await $fetch(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      headers: { Authorization: authStore.getAuthHeader() },
      body: { role },
    })
    await fetchUsers()
  } catch (error: any) {
    alert(error.data?.message || `${action}失败`)
  } finally {
    processingId.value = null
  }
}

const handleBan = async (id: string) => {
  if (!confirm('确定要封禁此用户吗？封禁后该用户将无法登录。')) return

  processingId.value = id
  try {
    await $fetch(`/api/admin/users/${id}/ban`, {
      method: 'POST',
      headers: { Authorization: authStore.getAuthHeader() },
    })
    await fetchUsers()
  } catch (error: any) {
    alert(error.data?.message || '封禁失败')
  } finally {
    processingId.value = null
  }
}

const handleUnban = async (id: string) => {
  if (!confirm('确定要解封此用户吗？')) return

  processingId.value = id
  try {
    await $fetch(`/api/admin/users/${id}/unban`, {
      method: 'POST',
      headers: { Authorization: authStore.getAuthHeader() },
    })
    await fetchUsers()
  } catch (error: any) {
    alert(error.data?.message || '解封失败')
  } finally {
    processingId.value = null
  }
}
</script>
