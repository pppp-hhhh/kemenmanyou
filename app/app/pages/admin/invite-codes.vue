<template>
  <div class="max-w-4xl mx-auto px-6 lg:px-12 py-10">
    <!-- 顶部版心 -->
    <section class="mb-8 pb-6 border-b border-ink-500/15 dark:border-paper-300/10">
      <NuxtLink to="/admin" class="inline-flex items-center gap-2 text-ink-500 dark:text-paper-300 hover:text-cinnabar-600 dark:hover:text-cinnabar-400 transition-colors font-kai text-sm mb-4 group">
        <span class="font-latin italic group-hover:-translate-x-1 transition-transform">←</span>
        <span>返 卷宗</span>
      </NuxtLink>
      <div class="flex items-center gap-3 mb-3">
        <div class="folio">卷 · 陆</div>
        <div class="brush-divider w-24"></div>
        <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">VI. INVITE</div>
      </div>
      <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
        邀请<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">朱印</span>
      </h1>
      <p class="font-kai text-sm text-ink-500 dark:text-paper-300 max-w-md mt-3">
        签发管理员之入册凭证 · 限时有效 · 不可伪造
      </p>
    </section>

    <!-- 生成邀请码 -->
    <section class="paper-panel paper-panel-edge p-7 mb-6">
      <div class="flex items-center gap-3 mb-6 pb-4 border-b border-ink-500/10 dark:border-paper-300/10">
        <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">壹</span>
        <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">签发新印</h2>
        <div class="brush-divider flex-1"></div>
        <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">GENERATE</span>
      </div>

      <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
        <div class="flex-1">
          <label class="block font-latin italic text-[10px] text-ink-400 dark:text-paper-400 tracking-seal mb-1.5">
            EXPIRES IN · 有效期（天）
          </label>
          <input
            v-model="expiresInDays"
            type="number"
            min="1"
            max="90"
            class="input-editorial w-full font-latin"
          />
          <p class="font-kai text-xs text-ink-400 dark:text-paper-400 mt-1.5">范围 1-90 天 · 默认七日</p>
        </div>
        <button
          @click="handleGenerate"
          :disabled="generating"
          class="btn-cinnabar whitespace-nowrap"
        >
          <span class="font-kai">{{ generating ? '签发中...' : '签发邀请码' }}</span>
          <span class="font-latin italic text-xs">SEAL</span>
        </button>
      </div>
    </section>

    <!-- 新邀请码 -->
    <section v-if="currentCode" class="paper-panel paper-panel-edge p-7 mb-6 relative overflow-hidden">
      <!-- 装饰背景印 -->
      <div class="absolute -top-8 -right-8 pointer-events-none select-none opacity-[0.06]">
        <div class="seal" style="width: 12rem; height: 12rem; font-size: 4rem; line-height: 1.1; padding: 0; writing-mode: vertical-rl; text-orientation: upright;">
          邀<br>请
        </div>
      </div>

      <div class="relative">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">贰</span>
            <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">新印</h2>
          </div>
          <span class="seal-outline text-[10px]">
            {{ currentCode.ttl_text }}
          </span>
        </div>

        <!-- 邀请码本体 -->
        <div class="border-2 border-dashed border-cinnabar-500/40 dark:border-cinnabar-400/40 bg-paper-100/50 dark:bg-ink-500/30 p-5 mb-5">
          <div class="font-latin italic text-[10px] text-cinnabar-600 dark:text-cinnabar-400 tracking-seal mb-2">
            CODE · 邀请码
          </div>
          <code class="text-sm text-ink-700 dark:text-paper-50 break-all font-latin block tracking-wider">
            {{ currentCode.code }}
          </code>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="handleCopy(currentCode.code)"
            class="btn-cinnabar"
          >
            <span class="font-kai">{{ copied ? '已钤印 ✓' : '复制邀请码' }}</span>
          </button>
          <button
            @click="handleCopy(currentCode.code)"
            class="btn-outline"
          >
            <span class="font-kai">复制注册链接</span>
            <span class="font-latin italic text-xs">URL</span>
          </button>
        </div>

        <div class="mt-5 pt-4 border-t border-ink-500/10 dark:border-paper-300/10 flex items-start gap-2">
          <span class="font-display text-cinnabar-600 dark:text-cinnabar-400 flex-shrink-0">！</span>
          <p class="font-kai text-xs text-ink-500 dark:text-paper-300 leading-relaxed">
            请妥善保存 · 邀请码仅在过期前有效 · 注册时填入即可授予管理员身份
          </p>
        </div>
      </div>
    </section>

    <!-- 本次会话历史 -->
    <section v-if="history.length > 0" class="paper-panel paper-panel-edge overflow-hidden mb-6">
      <div class="px-7 py-5 border-b border-ink-500/15 dark:border-paper-300/10 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">叁</span>
          <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">本次签发记录</h2>
        </div>
        <button
          @click="clearHistory"
          class="font-kai text-xs text-ink-500 hover:text-cinnabar-600 dark:text-paper-400 dark:hover:text-cinnabar-400 transition-colors"
        >
          清空
        </button>
      </div>
      <ul class="divide-y divide-ink-500/10 dark:divide-paper-300/10">
        <li
          v-for="item in history"
          :key="item.code"
          class="px-7 py-3 grid grid-cols-12 gap-3 items-center hover:bg-paper-100/30 dark:hover:bg-ink-500/20 transition-colors"
        >
          <code class="col-span-7 text-xs text-ink-700 dark:text-paper-100 font-latin truncate">{{ item.code }}</code>
          <span class="col-span-3 font-latin italic text-[10px] text-ink-400 dark:text-paper-400 whitespace-nowrap">
            {{ new Date(item.created_at).toLocaleString('zh-CN') }}
          </span>
          <span class="col-span-1 seal-outline text-[9px]">{{ item.ttl_text }}</span>
          <button
            @click="handleCopy(item.code)"
            class="col-span-1 font-kai text-xs text-cinnabar-600 dark:text-cinnabar-400 hover:underline justify-self-end"
          >
            复制
          </button>
        </li>
      </ul>
    </section>

    <!-- 工作机制 -->
    <section class="paper-panel paper-panel-edge p-7">
      <div class="flex items-center gap-3 mb-5 pb-4 border-b border-ink-500/10 dark:border-paper-300/10">
        <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">肆</span>
        <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">钤印之理</h2>
        <div class="brush-divider flex-1"></div>
        <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">MECHANISM</span>
      </div>

      <ul class="space-y-3">
        <li
          v-for="(item, i) in mechanisms"
          :key="i"
          class="flex items-start gap-3 pb-3 border-b border-ink-500/8 dark:border-paper-300/8 last:border-0"
        >
          <span class="seal-outline flex-shrink-0 w-7 h-7 flex items-center justify-center text-[10px]">
            {{ item.glyph }}
          </span>
          <div class="flex-1">
            <p class="font-kai text-sm text-ink-700 dark:text-paper-100 leading-relaxed">
              {{ item.text }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- 落款 -->
    <div class="mt-16 flex items-center justify-center gap-3">
      <div class="brush-divider w-32"></div>
      <div class="seal seal-tag text-xs">邀 · 印</div>
      <div class="brush-divider w-32"></div>
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

const mechanisms = [
  { glyph: '签', text: '邀请码采用 HMAC-SHA256 签名，无需数据库存储，自动生成' },
  { glyph: '期', text: '每个邀请码自带过期时间（默认 7 天），过期自动失效' },
  { glyph: '验', text: '注册时系统自动验签 + 检查过期，篡改或伪造的邀请码无法通过' },
  { glyph: '毁', text: '若需让所有旧邀请码失效：修改服务端环境变量 INVITE_CODE_SECRET 并重启' },
  { glyph: '隐', text: '邀请码不可逆推：没有 secret 无法生成合法邀请码' },
]

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
