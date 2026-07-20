<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">我的作品</h1>
      <NuxtLink
        to="/workspace"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
      >
        创建新作品
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-12">
      <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-gray-500 mt-4">加载中...</p>
    </div>

    <div v-else-if="works.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
      <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-gray-500 mt-4">还没有作品</p>
      <NuxtLink
        to="/workspace"
        class="inline-block mt-4 text-indigo-600 hover:underline"
      >
        去创建一个
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="work in works"
        :key="work.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
      >
        <div class="aspect-[4/3] bg-gray-100 dark:bg-gray-700">
          <img
            v-if="work.thumbnail"
            :src="work.thumbnail"
            :alt="work.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            无缩略图
          </div>
        </div>

        <div class="p-4">
          <h3 class="font-medium text-gray-900 dark:text-white truncate">{{ work.title }}</h3>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded">
              {{ work.style }}
            </span>
            <span
              v-if="work.review_status"
              :class="{
                'bg-yellow-100 text-yellow-600': work.review_status === 'pending',
                'bg-green-100 text-green-600': work.review_status === 'approved',
                'bg-red-100 text-red-600': work.review_status === 'rejected'
              }"
              class="text-xs px-2 py-1 rounded"
            >
              {{ reviewStatusText(work.review_status) }}
            </span>
          </div>
          <div
            v-if="work.review_status === 'rejected' && work.reject_reason"
            class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400"
          >
            拒绝原因：{{ work.reject_reason }}
          </div>
          <div class="flex items-center gap-2 mt-4">
            <NuxtLink
              :to="`/watch/${work.id}`"
              class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-center text-sm text-gray-700 dark:text-gray-300 rounded transition"
            >
              查看
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const works = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch('/api/works/my', {
      headers: {
        Authorization: authStore.getAuthHeader()
      }
    })
    works.value = response as any[]
  } catch (error) {
    console.error('Failed to fetch works:', error)
  } finally {
    loading.value = false
  }
})

const reviewStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已公开',
    rejected: '已拒绝'
  }
  return map[status] || status
}
</script>
