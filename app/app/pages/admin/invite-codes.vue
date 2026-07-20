<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/admin" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">邀请码管理</h1>
    </div>

    <!-- 生成邀请码 -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">生成新邀请码</h2>
      <div class="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div class="flex-1 w-full">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            有效期（天）
          </label>
          <input
            v-model="expiresInDays"
            type="number"
            min="1"
            max="90"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">范围 1-90 天</p>
        </div>
        <button
          @click="handleGenerate"
          :disabled="generating"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition whitespace-nowrap"
        >
          {{ generating ? '生成中...' : '生成邀请码' }}
        </button>
      </div>
    </div>

    <!-- 最近生成的邀请码 -->
    <div v-if="currentCode" class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl shadow p-6 mb-6 border border-indigo-200 dark:border-indigo-800">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-medium text-indigo-900 dark:text-indigo-300">新邀请码</h2>
        <span class="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
          剩余 {{ currentCode.ttl_text }}
        </span>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 mb-4">
        <code class="text-sm text-gray-900 dark:text-white break-all font-mono block">{{ currentCode.code }}</code>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          @click="handleCopy(currentCode.code)"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
        >
          {{ copied ? '已复制 ✓' : '复制邀请码' }}
        </button>
        <button
          @click="handleCopy(currentCode.code)"
          class="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm border border-gray-300 dark:border-gray-600"
        >
          复制注册链接
        </button>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">
        ⚠️ 请妥善保存。邀请码仅在过期前有效，注册时填入即可授予管理员身份。
      </p>
    </div>

    <!-- 历史记录（仅本地 sessionStorage） -->
    <div v-if="history.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">本次会话生成记录</h2>
        <button
          @click="clearHistory"
          class="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400"
        >
          清空
        </button>
      </div>
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="item in history" :key="item.code" class="px-6 py-3 flex items-center justify-between gap-3">
          <code class="text-xs text-gray-700 dark:text-gray-300 font-mono truncate flex-1">{{ item.code }}</code>
          <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {{ new Date(item.created_at).toLocaleString('zh-CN') }}
          </span>
          <span class="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded whitespace-nowrap">
            {{ item.ttl_text }}
          </span>
          <button
            @click="handleCopy(item.code)"
            class="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
          >
            复制
          </button>
        </li>
      </ul>
    </div>

    <!-- 说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mt-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-3">工作机制</h2>
      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
        <li>邀请码采用 HMAC-SHA256 签名，无需数据库存储，自动生成</li>
        <li>每个邀请码自带过期时间（默认 7 天），过期自动失效</li>
        <li>注册时系统自动验签 + 检查过期，篡改或伪造的邀请码无法通过</li>
        <li>若需让所有旧邀请码失效：修改服务端环境变量 <code class="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">INVITE_CODE_SECRET</code> 并重启</li>
        <li>邀请码不可逆推：没有 secret 无法生成合法邀请码</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()
const generating = ref(false)
const copied = ref(false)
const expiresInDays = ref(7)

interface GeneratedCode {
  code: string
  role: string
  expires_in_days: number
  exp: number
  ttl_text: string
  created_at: number
}

const currentCode = ref<GeneratedCode | null>(null)
const history = ref<GeneratedCode[]>([])

// 从 sessionStorage 恢复本次会话历史
onMounted(() => {
  try {
    const saved = sessionStorage.getItem('admin_invite_history')
    if (saved) history.value = JSON.parse(saved)
  } catch {}
})

const handleGenerate = async () => {
  generating.value = true
  copied.value = false
  try {
    const res = await $fetch<GeneratedCode>('/api/admin/invite-codes', {
      method: 'POST',
      headers: { Authorization: authStore.getAuthHeader() },
      body: { expires_in_days: Number(expiresInDays.value) },
    })
    currentCode.value = { ...res, created_at: Date.now() }
    history.value.unshift(currentCode.value)
    // 仅保留最近 20 条
    history.value = history.value.slice(0, 20)
    try {
      sessionStorage.setItem('admin_invite_history', JSON.stringify(history.value))
    } catch {}
  } catch (e: any) {
    alert(e.data?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

const handleCopy = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // 兜底
    const ta = document.createElement('textarea')
    ta.value = code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const clearHistory = () => {
  history.value = []
  sessionStorage.removeItem('admin_invite_history')
}
</script>
