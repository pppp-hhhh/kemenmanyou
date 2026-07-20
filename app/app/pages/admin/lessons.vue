<template>
  <div class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
    <!-- 顶部版心 -->
    <section class="mb-8 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
      <NuxtLink to="/admin" class="inline-flex items-center gap-2 text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 transition-colors font-kai text-sm mb-4 group">
        <span class="font-latin italic group-hover:-translate-x-1 transition-transform">←</span>
        <span>返 卷宗</span>
      </NuxtLink>
      <div class="flex items-center gap-3 mb-3">
        <div class="folio">卷 · 叁</div>
        <div class="brush-divider w-24"></div>
        <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">III. LESSONS</div>
      </div>
      <div class="flex items-end justify-between flex-wrap gap-4">
        <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
          课<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">文</span>
        </h1>
        <p class="font-kai text-sm text-ink-500 dark:text-paper-300">
          共 <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ lessons.length }}</span> 篇
        </p>
      </div>
    </section>

    <!-- 搜索 / 批量操作 -->
    <section class="paper-panel p-5 mb-5">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[240px]">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜课文标题或正文..."
            class="input-editorial w-full"
          />
        </div>
        <div v-if="selectedIds.length > 0" class="flex items-center gap-3 px-4 py-2 bg-cinnabar-50 dark:bg-cinnabar-900/15 border border-cinnabar-500/30">
          <span class="font-display text-cinnabar-600 dark:text-cinnabar-400">{{ selectedIds.length }}</span>
          <span class="font-kai text-xs text-ink-500 dark:text-paper-300">已择</span>
          <button
            @click="handleBatchDelete"
            :disabled="processing"
            class="btn-cinnabar px-3 py-1.5 text-xs"
          >
            <span class="font-kai">批量销册</span>
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
        {{ filteredLessons.length }} ITEMS
      </span>
    </section>

    <!-- 加载 -->
    <div v-if="loading" class="text-center py-24">
      <div class="inline-flex items-center gap-3 mb-3">
        <svg class="animate-spin h-6 w-6 text-cinnabar-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="font-kai text-sm text-ink-400 dark:text-paper-300">正在翻阅...</span>
      </div>
      <div class="font-latin italic text-xs text-ink-300 dark:text-paper-400 tracking-widest">LOADING</div>
    </div>

    <!-- 空 -->
    <div v-else-if="filteredLessons.length === 0" class="text-center py-24 paper-panel paper-panel-edge">
      <div class="seal-outline mx-auto mb-4" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
        空<br>册
      </div>
      <p class="font-kai text-sm text-ink-400 dark:text-paper-300">尚无课文</p>
    </div>

    <!-- 课文表 -->
    <div v-else class="paper-panel paper-panel-edge overflow-hidden">
      <!-- 表头 -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-ink-500/15 dark:border-paper-300/10 bg-paper-100/40 dark:bg-ink-500/30">
        <div class="col-span-1 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">№</div>
        <div class="col-span-5 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">TITLE · 题</div>
        <div class="col-span-1 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">GRADE</div>
        <div class="col-span-2 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">SOURCE · 出</div>
        <div class="col-span-2 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">CREATED · 录</div>
        <div class="col-span-1 text-right font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal">OP</div>
      </div>

      <ul class="divide-y divide-ink-500/10 dark:divide-paper-300/10">
        <li
          v-for="lesson in filteredLessons"
          :key="lesson.id"
          class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-paper-100/30 dark:hover:bg-ink-500/20 transition-colors items-center"
        >
          <!-- 选择 -->
          <div class="md:col-span-1 flex items-center gap-2">
            <input
              type="checkbox"
              :checked="selectedIds.includes(lesson.id)"
              @change="toggleSelect(lesson.id)"
              class="w-4 h-4 accent-cinnabar-600"
            />
            <span class="font-latin italic text-xs text-ink-400 dark:text-paper-400">{{ lesson.id }}</span>
          </div>

          <!-- 标题 + 预览 -->
          <div class="md:col-span-5 min-w-0">
            <div class="font-display text-base text-ink-700 dark:text-paper-50 mb-1 truncate">
              {{ lesson.title }}
            </div>
            <div class="font-kai text-xs text-ink-400 dark:text-paper-400 line-clamp-1">
              {{ lesson.content?.slice(0, 60) }}...
            </div>
          </div>

          <!-- 年级 -->
          <div class="md:col-span-1">
            <span class="seal-outline text-[10px]">{{ lesson.grade || '—' }}</span>
          </div>

          <!-- 来源 -->
          <div class="md:col-span-2 font-kai text-sm text-ink-500 dark:text-paper-300 truncate">
            {{ lesson.source || '—' }}
          </div>

          <!-- 时间 -->
          <div class="md:col-span-2 font-latin italic text-xs text-ink-500 dark:text-paper-300">
            {{ new Date(lesson.created_at).toLocaleDateString('zh-CN') }}
          </div>

          <!-- 操作 -->
          <div class="md:col-span-1 flex justify-end">
            <button
              @click="handleDelete(lesson.id)"
              :disabled="processingId === lesson.id"
              class="font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline disabled:opacity-40"
            >
              {{ processingId === lesson.id ? '销中...' : '销册' }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 落款 -->
    <div class="mt-16 flex items-center justify-center gap-3">
      <div class="brush-divider w-32"></div>
      <div class="seal seal-tag text-xs">课 · 文</div>
      <div class="brush-divider w-32"></div>
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
  if (!confirm('确定要销册此课文吗？')) return

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
  if (!confirm(`确定要销册选中的 ${selectedIds.value.length} 篇课文吗？`)) return

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
