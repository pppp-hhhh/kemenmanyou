<template>
  <div class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
    <!-- 顶部版心 -->
    <section class="mb-10 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
      <div class="flex items-center gap-3 mb-3">
        <div class="folio">卷 · 壹</div>
        <div class="brush-divider w-24"></div>
        <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">I. OVERVIEW</div>
      </div>
      <div class="flex items-end justify-between flex-wrap gap-4">
        <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
          管理<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">卷宗</span>
        </h1>
        <p class="font-kai text-sm text-ink-500 dark:text-paper-300 max-w-md">
          统括作品 · 课文 · 用户 · 邀请 · 审计之总册
        </p>
      </div>
    </section>

    <!-- 主统计四印 -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div
        v-for="(card, i) in primaryCards"
        :key="card.key"
        class="paper-panel paper-panel-edge p-6 group hover:-translate-y-0.5 transition-transform"
      >
        <div class="flex items-start justify-between mb-4">
          <span class="font-latin italic text-[10px] text-ink-300 dark:text-paper-400 tracking-seal">{{ card.latin }}</span>
          <span class="font-display text-2xl text-ink-500/15 dark:text-paper-300/15 select-none">{{ card.glyph }}</span>
        </div>
        <div class="font-display text-4xl text-ink-700 dark:text-paper-50 leading-none mb-2">
          {{ card.value }}
        </div>
        <div class="font-kai text-sm text-ink-500 dark:text-paper-300">{{ card.label }}</div>
        <div class="brush-divider w-12 mt-3"></div>
      </div>
    </section>

    <!-- 次级统计 -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      <div
        v-for="stat in secondaryStats"
        :key="stat.label"
        class="paper-panel p-4 flex items-center gap-3"
      >
        <div class="seal-outline flex-shrink-0 w-8 h-8 flex items-center justify-center text-xs">{{ stat.glyph }}</div>
        <div>
          <div class="font-display text-xl text-ink-700 dark:text-paper-50 leading-none">{{ stat.value }}</div>
          <div class="font-kai text-[11px] text-ink-400 dark:text-paper-400 mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- 近 7 日趋势 + 管理入口 -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      <!-- 趋势图 -->
      <div class="lg:col-span-2 paper-panel paper-panel-edge p-7">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-ink-500/10 dark:border-paper-300/10">
          <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">七</span>
          <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">日间入卷</h2>
          <div class="brush-divider flex-1"></div>
          <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">7 DAYS</span>
        </div>

        <div v-if="(stats.daily_works || []).length === 0" class="text-center py-12">
          <div class="seal-outline mx-auto mb-3" style="width: 4rem; height: 4rem; padding: 0.4rem; font-size: 1.1rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
            空<br>录
          </div>
          <p class="font-kai text-sm text-ink-400 dark:text-paper-300">尚无数据</p>
        </div>

        <div v-else>
          <div class="flex items-end justify-between gap-3 h-44 mb-4">
            <div
              v-for="d in stats.daily_works"
              :key="d.date"
              class="flex-1 flex flex-col items-center gap-2 group"
            >
              <div class="font-latin italic text-[10px] text-ink-300 dark:text-paper-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {{ d.total }}
              </div>
              <div class="w-full flex flex-col-reverse items-stretch h-32 gap-0.5">
                <div
                  class="bg-cinnabar-600 dark:bg-cinnabar-500 transition-all"
                  :style="{ height: barHeight(d.approved) + '%' }"
                  :title="`已展: ${d.approved}`"
                ></div>
                <div
                  class="bg-gilt-500/70 dark:bg-gilt-400/60 transition-all"
                  :style="{ height: barHeight(d.pending) + '%' }"
                  :title="`待审: ${d.pending}`"
                ></div>
              </div>
              <span class="font-latin italic text-[10px] text-ink-400 dark:text-paper-400">{{ d.date.slice(5) }}</span>
            </div>
          </div>
          <div class="flex gap-6 justify-center pt-4 border-t border-ink-500/10 dark:border-paper-300/10">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-gilt-500/70 dark:bg-gilt-400/60"></span>
              <span class="font-kai text-xs text-ink-500 dark:text-paper-300">待审</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-cinnabar-600 dark:bg-cinnabar-500"></span>
              <span class="font-kai text-xs text-ink-500 dark:text-paper-300">已展</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理入口 -->
      <div class="paper-panel paper-panel-edge p-7">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-ink-500/10 dark:border-paper-300/10">
          <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">册</span>
          <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">诸卷入口</h2>
          <div class="brush-divider flex-1"></div>
        </div>

        <div class="space-y-3">
          <NuxtLink
            v-for="entry in managementEntries"
            :key="entry.to"
            :to="entry.to"
            class="block p-4 border border-ink-500/10 dark:border-paper-300/10 hover:border-cinnabar-500/40 hover:bg-paper-100/40 dark:hover:bg-ink-500/30 transition-all group"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="seal-outline flex-shrink-0 w-8 h-8 flex items-center justify-center text-[10px]">{{ entry.glyph }}</span>
                <div class="min-w-0">
                  <div class="font-display text-sm text-ink-700 dark:text-paper-50 group-hover:text-cinnabar-600 dark:group-hover:text-cinnabar-400 transition-colors">
                    {{ entry.title }}
                  </div>
                  <div class="font-kai text-xs text-ink-400 dark:text-paper-400 mt-0.5 truncate">
                    {{ entry.desc }}
                  </div>
                </div>
              </div>
              <span class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 最近操作 -->
    <section class="paper-panel paper-panel-edge p-7">
      <div class="flex items-center gap-3 mb-6 pb-4 border-b border-ink-500/10 dark:border-paper-300/10">
        <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">录</span>
        <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">近日手记</h2>
        <div class="brush-divider flex-1"></div>
        <NuxtLink to="/admin/audit" class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal hover:underline">
          ALL →
        </NuxtLink>
      </div>

      <div v-if="(stats.recent_logs || []).length === 0" class="text-center py-10">
        <p class="font-kai text-sm text-ink-400 dark:text-paper-300">尚无操作记录</p>
      </div>

      <ul v-else class="space-y-1">
        <li
          v-for="log in stats.recent_logs"
          :key="log.id"
          class="flex items-center justify-between py-3 border-b border-ink-500/8 dark:border-paper-300/8 last:border-0 group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span :class="actionSealClass(log.action)" class="flex-shrink-0">
              {{ actionGlyph(log.action) }}
            </span>
            <div class="min-w-0">
              <div class="font-kai text-sm text-ink-700 dark:text-paper-100 truncate">
                {{ actionLabel(log.action) }}
                <span class="text-ink-400 dark:text-paper-400">·</span>
                {{ targetTypeLabel(log.target_type) }}<span v-if="log.target_id" class="font-latin italic ml-1">#{{ log.target_id }}</span>
              </div>
            </div>
          </div>
          <span class="font-latin italic text-[11px] text-ink-400 dark:text-paper-400 whitespace-nowrap ml-3">
            {{ relativeTime(log.created_at) }}
          </span>
        </li>
      </ul>
    </section>

    <!-- 落款 -->
    <div class="mt-16 flex items-center justify-center gap-3">
      <div class="brush-divider w-32"></div>
      <div class="seal seal-tag text-xs">管理 · 卷宗</div>
      <div class="brush-divider w-32"></div>
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

// 主统计四印
const primaryCards = computed(() => [
  { key: 'works', label: '作品总数', value: stats.value.works?.total || 0, latin: 'WORKS', glyph: '壹' },
  { key: 'pending', label: '待审之卷', value: stats.value.works?.pending || 0, latin: 'PENDING', glyph: '贰' },
  { key: 'approved', label: '已展之卷', value: stats.value.works?.approved || 0, latin: 'APPROVED', glyph: '叁' },
  { key: 'lessons', label: '课文总数', value: stats.value.lessons?.total || 0, latin: 'LESSONS', glyph: '肆' },
])

// 次级统计
const secondaryStats = computed(() => [
  { label: '用户总数', value: stats.value.users?.total || 0, glyph: '众' },
  { label: '活跃用户', value: stats.value.users?.active || 0, glyph: '活' },
  { label: '已封禁', value: stats.value.users?.banned || 0, glyph: '禁' },
  { label: '已拒作品', value: stats.value.works?.rejected || 0, glyph: '拒' },
])

// 管理入口
const managementEntries = computed(() => [
  { to: '/admin/works', title: '作品管理', desc: `${stats.value.works?.pending || 0} 待审 · ${stats.value.works?.approved || 0} 已展`, glyph: '品' },
  { to: '/admin/lessons', title: '课文管理', desc: `${stats.value.lessons?.total || 0} 篇`, glyph: '文' },
  { to: '/admin/users', title: '用户管理', desc: `${stats.value.users?.total || 0} 用户 · ${stats.value.users?.banned || 0} 封禁`, glyph: '众' },
  { to: '/admin/invite-codes', title: '邀请码', desc: '生成管理员邀请码', glyph: '邀' },
  { to: '/admin/audit', title: '审计日志', desc: '操作记录追溯', glyph: '审' },
])

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

// 操作类型 → 印章字符
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
  if (diff < minute) return 'just now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return date.toLocaleDateString('zh-CN')
}
</script>
