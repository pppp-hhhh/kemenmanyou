<script setup lang="ts">
import type { Work } from '~/types/api'
import { ArrowLeft, Download, Images, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-vue-next'
import { resolveScenePanels } from '~/utils/comic'

// 观看页为深色播放器主题，声明后 layout footer 切换为深色样式以适配页面主题
definePageMeta({
  footerTheme: 'dark'
})

// 登录策略：/watch 保持公开路由，未登录访问时 server 返回 401，由页内错误分支展示'请先登录'并引导登录。
const route = useRoute()

const rawId = Number(route.params.id as string)
const workId = Number.isInteger(rawId) && rawId > 0 ? rawId : 0

const { fetchWork } = useWorks()

const work = ref<Work | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const activePage = ref(0)
const exporting = ref(false)
const imgError = ref(false)

// 页数 = 场景数（一个场景 = 一页漫画，design §3.1）
const pageCount = computed(() => work.value?.scenes?.length ?? 0)

// 场景 i 的 panel 图映射：优先 scene.panels[].image_url（新作品）；旧作品用 images[i] 单格回退
const scenePanelImages = (sceneIndex: number): Record<string, string> => {
  const scene = work.value?.scenes?.[sceneIndex]
  const map: Record<string, string> = {}
  if (!scene) return map
  const panels = resolveScenePanels(scene)
  panels.forEach((p, i) => {
    const url = p.image_url || (work.value?.images?.[sceneIndex] ?? '')
    if (url) map[p.id] = url
  })
  return map
}

const activeScene = computed(() => work.value?.scenes?.[activePage.value])

// 场景导航
const prevPage = () => {
  if (activePage.value > 0) {
    activePage.value--
    imgError.value = false
  }
}
const nextPage = () => {
  if (activePage.value < pageCount.value - 1) {
    activePage.value++
    imgError.value = false
  }
}

// 键盘导航（带守卫：加载中/无作品/0 页/输入控件聚焦时不拦截方向键）
const handleKeydown = (e: KeyboardEvent) => {
  if (isLoading.value || !work.value || !pageCount.value) return
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
  if (e.key === 'ArrowLeft') prevPage()
  else if (e.key === 'ArrowRight') nextPage()
}

// 下载当前页的全部 panel 图（跨域来源用 fetch→blob→objectURL 同源化）
const downloadImage = async (url: string, name: string): Promise<boolean> => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
    return true
  } catch (err) {
    console.error('下载失败:', url, err)
    return false
  }
}

const downloadCurrentPage = async () => {
  const scene = activeScene.value
  if (!scene) return
  const panels = resolveScenePanels(scene)
  const urls = panels.map((p, i) => p.image_url || work.value?.images?.[activePage.value] || '').filter(Boolean)
  for (let i = 0; i < urls.length; i++) {
    await downloadImage(urls[i]!, `${work.value?.title || 'work'}_p${activePage.value + 1}_${i + 1}.png`)
    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 250))
  }
}

// 导出全部：服务端逐页合成漫画长图（composer+lettering），前端代理下载
const exportMessage = ref<string | null>(null)
const exportAll = async () => {
  if (!work.value || exporting.value) return
  exporting.value = true
  exportMessage.value = null
  try {
    const res = await fetch(`/api/works/${workId}/export`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `课文漫画_${workId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
    exportMessage.value = '漫画长图已导出'
  } catch (err) {
    console.error('导出失败:', err)
    exportMessage.value = '导出失败，请稍后重试'
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  window.removeEventListener('keydown', handleKeydown)
  window.addEventListener('keydown', handleKeydown)

  if (!workId) {
    loadError.value = '作品不存在'
    isLoading.value = false
    return
  }
  try {
    work.value = await fetchWork(workId)
  } catch (e: any) {
    const status = e?.statusCode || e?.status
    if (status === 401 || /登录|未登录|unauthor/i.test(e?.message || '')) {
      loadError.value = '请先登录后查看作品'
    } else if (status === 404) {
      loadError.value = '作品不存在'
    } else {
      loadError.value = '加载失败，请稍后重试'
    }
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-[calc(100dvh-8rem)] flex flex-col bg-neutral-900 overflow-hidden">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span class="text-neutral-400 text-sm">加载中...</span>
    </div>

    <!-- 加载失败 / 需要登录 / 作品不存在 -->
    <div v-else-if="!work" class="flex-1 flex flex-col items-center justify-center text-white px-4">
      <AlertTriangle v-if="loadError === '请先登录后查看作品'" class="w-12 h-12 text-amber-400 mb-4" aria-hidden="true" />
      <Images v-else class="w-12 h-12 text-neutral-500 mb-4" aria-hidden="true" />
      <h3 class="text-lg font-semibold mb-2">{{ loadError || '作品不存在' }}</h3>
      <p v-if="loadError === '请先登录后查看作品'" class="text-neutral-400 mb-6 text-center max-w-sm">
        登录后即可查看完整作品
      </p>
      <p v-else-if="loadError === '作品不存在'" class="text-neutral-400 mb-6 text-center max-w-sm">
        该作品可能已被删除或无法访问
      </p>
      <p v-else class="text-neutral-400 mb-6 text-center max-w-sm">
        网络或服务器异常，请稍后重试
      </p>
      <NuxtLink
        v-if="loadError === '请先登录后查看作品'"
        :to="{ path: '/login', query: { redirect: route.fullPath } }"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary-300"
      >
        <ArrowLeft class="w-4 h-4" />
        去登录
      </NuxtLink>
      <NuxtLink
        v-else
        to="/gallery"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary-300"
      >
        <ArrowLeft class="w-4 h-4" />
        返回展示广场
      </NuxtLink>
    </div>

    <!-- 作品内容：逐页翻漫画 -->
    <template v-else>
      <!-- 顶部导航 -->
      <header class="shrink-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent w-full">
        <div class="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2 sm:gap-3">
          <NuxtLink
            to="/gallery"
            aria-label="返回展示广场"
            class="shrink-0 text-white/80 hover:text-white flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg px-2 py-1"
          >
            <ArrowLeft class="w-4 h-4" />
            <span class="text-sm hidden sm:inline">返回</span>
          </NuxtLink>
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <h1 class="text-white font-semibold text-sm sm:text-base truncate">{{ work.title }}</h1>
            <span class="flex-none hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white backdrop-blur-sm">
              {{ work.style }}
            </span>
            <span v-if="pageCount > 1" class="flex-none text-xs text-white/60 tabular-nums">
              第 {{ activePage + 1 }} 页 / 共 {{ pageCount }} 页
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              :disabled="exporting"
              :aria-busy="exporting"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white border border-white/30 rounded-xl hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="exportAll"
            >
              <Download class="w-3.5 h-3.5" />
              {{ exporting ? '导出中...' : '导出漫画长图' }}
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white border border-white/30 rounded-xl hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/50"
              @click="downloadCurrentPage"
            >
              <Download class="w-3.5 h-3.5" />
              下载本页
            </button>
          </div>
        </div>
      </header>

      <!-- 漫画页区域 -->
      <div class="flex-1 min-h-0 relative overflow-hidden">
        <div v-if="!imgError && activeScene" class="min-h-0 h-full flex items-center justify-center py-6 px-4">
          <div class="max-w-3xl w-full h-full flex items-center justify-center">
            <WorkspaceComicPage
              :scene="activeScene"
              :panel-images="scenePanelImages(activePage)"
              :show-order-badge="true"
            />
            <p class="text-white/60 text-xs text-center mt-3">
              {{ resolveScenePanels(activeScene).length }} 格 · 点击格子可放大阅读（左/右方向键翻页）
            </p>
          </div>
        </div>
        <div v-else-if="imgError" class="min-h-full flex flex-col items-center justify-center text-white/70 gap-2">
          <Images class="w-10 h-10 text-neutral-500" aria-hidden="true" />
          <span class="text-sm">页面加载失败</span>
        </div>
      </div>

      <!-- 底部控制栏 -->
      <div class="shrink-0 w-full bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-5 pb-5 px-4">
        <div class="max-w-3xl mx-auto text-center">
          <p v-if="exportMessage" role="status" class="text-xs text-white/70 mb-2">{{ exportMessage }}</p>
          <p
            v-if="activeScene"
            class="text-white/90 text-sm mb-4 line-clamp-2 px-6 py-2 bg-black/40 backdrop-blur-md rounded-xl max-w-lg mx-auto border border-white/10 shadow-lg"
            aria-live="polite"
          >
            第 {{ activePage + 1 }} 页 · {{ activeScene.description_cn }}
          </p>

          <div class="flex items-center justify-center gap-3">
            <button
              :disabled="activePage === 0"
              aria-label="上一页"
              class="text-white/60 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-white/50"
              @click="prevPage"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>

            <div class="flex gap-1.5" role="group" aria-label="页码选择">
              <button
                v-for="(_, i) in pageCount"
                :key="i"
                :aria-label="'第 ' + (i + 1) + ' 页'"
                :aria-current="i === activePage ? 'true' : undefined"
                class="h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/50"
                :class="i === activePage ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50 w-2'"
                @click="activePage = i; imgError = false"
              />
            </div>

            <button
              :disabled="activePage >= pageCount - 1"
              aria-label="下一页"
              class="text-white/60 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-white/50"
              @click="nextPage"
            >
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>