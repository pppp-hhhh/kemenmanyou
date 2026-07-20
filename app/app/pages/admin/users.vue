<template>
  <div class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
    <!-- 顶部版心 -->
    <section class="mb-8 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
      <NuxtLink to="/admin" class="inline-flex items-center gap-2 text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 transition-colors font-kai text-sm mb-4 group">
        <span class="font-latin italic group-hover:-translate-x-1 transition-transform">←</span>
        <span>返 卷宗</span>
      </NuxtLink>
      <div class="flex items-center gap-3 mb-3">
        <div class="folio">卷 · 肆</div>
        <div class="brush-divider w-24"></div>
        <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">IV. USERS</div>
      </div>
      <div class="flex items-end justify-between flex-wrap gap-4">
        <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
          众<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">生</span>
        </h1>
        <p class="font-kai text-sm text-ink-500 dark:text-paper-300">
          共 <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ total }}</span> 员
        </p>
      </div>
    </section>

    <!-- 筛选 -->
    <section class="paper-panel p-5 mb-5">
      <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div class="flex-1">
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">
            SEARCH · 搜邮箱或显示名
          </label>
          <input
            v-model="searchInput"
            type="text"
            placeholder="输入后回车搜索..."
            class="input-editorial w-full"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="md:w-44">
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">
            STATUS · 状态
          </label>
          <select v-model="statusFilter" class="input-editorial w-full" @change="handleSearch">
            <option value="all">全部</option>
            <option value="active">正常</option>
            <option value="banned">已封禁</option>
          </select>
        </div>
        <button @click="handleSearch" class="btn-cinnabar whitespace-nowrap">
          <span class="font-kai">搜</span>
          <span class="font-latin italic text-xs">FIND</span>
        </button>
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
        <span class="font-kai text-sm text-ink-400 dark:text-paper-300">正在翻阅名册...</span>
      </div>
      <div class="font-latin italic text-xs text-ink-300 dark:text-paper-400 tracking-widest">LOADING</div>
    </div>

    <!-- 空 -->
    <div v-else-if="users.length === 0" class="text-center py-24 paper-panel paper-panel-edge">
      <div class="seal-outline mx-auto mb-4" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
        无<br>人
      </div>
      <p class="font-kai text-sm text-ink-400 dark:text-paper-300">尚无用户</p>
    </div>

    <!-- 用户表 -->
    <div v-else class="paper-panel paper-panel-edge overflow-hidden">
      <!-- 表头 -->
      <div class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-ink-500/15 dark:border-paper-300/10 bg-paper-100/40 dark:bg-ink-500/30">
        <div class="col-span-3 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">USER · 姓</div>
        <div class="col-span-3 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">EMAIL · 邮</div>
        <div class="col-span-1 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">ROLE</div>
        <div class="col-span-1 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">STATUS</div>
        <div class="col-span-2 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">JOINED · 入</div>
        <div class="col-span-2 text-right font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">OP</div>
      </div>

      <ul class="divide-y divide-ink-500/10 dark:divide-paper-300/10">
        <li
          v-for="user in users"
          :key="user.id"
          class="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 hover:bg-paper-100/30 dark:hover:bg-ink-500/20 transition-colors items-center"
        >
          <!-- 用户 -->
          <div class="lg:col-span-3 flex items-center gap-3 min-w-0">
            <div class="seal-outline flex-shrink-0 w-10 h-10 flex items-center justify-center text-sm">
              {{ user.email?.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="font-display text-sm text-ink-700 dark:text-paper-50 truncate">
                {{ user.display_name || '未设名' }}
              </div>
              <div class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400 truncate">
                {{ user.id }}
              </div>
            </div>
          </div>

          <!-- 邮箱 -->
          <div class="lg:col-span-3 font-latin italic text-xs text-ink-500 dark:text-paper-300 truncate">
            {{ user.email }}
          </div>

          <!-- 角色 -->
          <div class="lg:col-span-1">
            <span :class="user.role === 'admin' ? 'seal seal-tag' : 'seal-outline'" class="text-[10px]">
              {{ user.role === 'admin' ? '管' : '员' }}
            </span>
          </div>

          <!-- 状态 -->
          <div class="lg:col-span-1">
            <span :class="user.status === 'banned' ? 'seal seal-tag' : 'seal-outline'" class="text-[10px]">
              {{ user.status === 'banned' ? '禁' : '常' }}
            </span>
          </div>

          <!-- 入册 -->
          <div class="lg:col-span-2 font-latin italic text-xs text-ink-500 dark:text-paper-300">
            {{ new Date(user.created_at).toLocaleDateString('zh-CN') }}
          </div>

          <!-- 操作 -->
          <div class="lg:col-span-2 flex justify-end gap-2 flex-wrap">
            <template v-if="user.id === currentUserId">
              <span class="font-kai text-[10px] text-ink-400 dark:text-paper-400">本账号</span>
            </template>
            <template v-else>
              <button
                v-if="user.role !== 'admin'"
                @click="handleSetRole(user.id, 'admin')"
                :disabled="processingId === user.id"
                class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline disabled:opacity-40"
              >
                授管
              </button>
              <button
                v-else
                @click="handleSetRole(user.id, 'user')"
                :disabled="processingId === user.id"
                class="font-kai text-xs text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 hover:underline disabled:opacity-40"
              >
                撤管
              </button>
              <span class="font-latin italic text-ink-300 dark:text-paper-400">·</span>
              <button
                v-if="user.status !== 'banned'"
                @click="handleBan(user.id)"
                :disabled="processingId === user.id"
                class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline disabled:opacity-40"
              >
                封禁
              </button>
              <button
                v-else
                @click="handleUnban(user.id)"
                :disabled="processingId === user.id"
                class="font-kai text-xs text-bamboo-600 dark:text-bamboo-400 hover:underline disabled:opacity-40"
              >
                解封
              </button>
            </template>
          </div>
        </li>
      </ul>

      <!-- 分页 -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-ink-500/15 dark:border-paper-300/10 flex-wrap gap-3">
        <div class="font-kai text-xs text-ink-500 dark:text-paper-300">
          共 <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ total }}</span> 员 · 第
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
      <div class="seal seal-tag text-xs">众 · 生</div>
      <div class="brush-divider w-32"></div>
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
  const action = role === 'admin' ? '授管理员' : '撤销管理员'
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
