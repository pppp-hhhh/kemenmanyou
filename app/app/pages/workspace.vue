<script setup lang="ts">
import { STYLE_OPTIONS, type StyleType } from '~/types/api'
import { useWorkspaceStore } from '~/stores/workspace'

const store = useWorkspaceStore()
const { startPoll } = useTaskPoll()

// 课文列表（从数据库获取）
interface Lesson { id: number; title: string; content: string }
const { data: lessons, refresh: refreshLessons } = await useFetch<Lesson[]>('/api/lessons', {
  default: () => [] as Lesson[],
})

// 课文来源：选择课文 或 'custom'
const textSource = ref<'select' | 'custom'>('select')
const selectedLessonId = ref<number | null>(null)
const selectOpen = ref(false)

// 画风选择
const selectedStyle = ref<StyleType>('写实古风')

// 自定义课文内容
const customText = ref('')

// 画风对应的中文释义
const styleMeta: Record<StyleType, { cn: string; latin: string; subtitle: string }> = {
  '写实古风': { cn: '古意', latin: 'Ancient Realism', subtitle: '写实笔触，古风意境' },
  '水墨风格': { cn: '墨韵', latin: 'Ink Wash', subtitle: '水墨晕染，虚实相生' },
  '彩色插画': { cn: '彩绘', latin: 'Color Illustration', subtitle: '色润明丽，画意盎然' },
}

// 分析课文
const analyzeText = async () => {
  const text = textSource.value === 'custom'
    ? customText.value
    : lessons.value?.find(l => l.id === selectedLessonId.value)?.content || ''

  if (!text.trim()) {
    alert('请输入课文内容')
    return
  }

  store.setAnalyzing(true)
  store.setProgressMsg('AI 正在析文拆景...')

  try {
    const result = await $fetch<{ scenes: { description_cn: string; prompt_en: string }[] }>('/api/analyze', {
      method: 'POST',
      body: {
        text,
        style: selectedStyle.value,
      },
    })
    store.setScenes(result.scenes)
    store.setProgressMsg(`析文毕 · 共得 ${result.scenes.length} 幕`)
  }
  catch (error) {
    console.error('分析失败:', error)
    store.setProgressMsg('析文未成，请再试')
  }
  finally {
    store.setAnalyzing(false)
  }
}

// 画风对应的提示词前缀
const stylePromptMap: Record<StyleType, string> = {
  '写实古风': 'realistic ancient Chinese style, traditional Chinese painting aesthetic, detailed, historical accuracy,',
  '水墨风格': 'Chinese ink painting style, wash painting, sumi-e, black and white, traditional brush strokes,',
  '彩色插画': 'colorful illustration, vibrant, modern cartoon style, anime, bright colors,'
}

// 开始生成
const generateImages = async () => {
  if (store.scenes.length === 0) {
    alert('请先生成场景')
    return
  }

  try {
    const promptsWithStyle = store.scenes.map(scene =>
      `${stylePromptMap[selectedStyle.value]} ${scene.prompt_en}`
    )

    const result = await $fetch<{ task_id: string }>('/api/generate', {
      method: 'POST',
      body: {
        prompts: promptsWithStyle,
        style: selectedStyle.value,
      },
    })
    startPoll(result.task_id)
  }
  catch (error) {
    console.error('提交生成任务失败:', error)
    store.setProgressMsg('提交未成')
  }
}

// 保存作品
const saveWork = async () => {
  if (!store.taskStatus?.images.length) {
    alert('没有可保存的图片')
    return
  }

  try {
    const result = await $fetch<{ work_id: number; message: string }>('/api/works', {
      method: 'POST',
      body: {
        custom_title: `课文漫画 - ${new Date().toLocaleDateString()}`,
        scenes: store.scenes,
        images: store.taskStatus.images.map((i: any) => i.url),
        style: selectedStyle.value,
        is_public: false,
      },
    })
    store.setProgressMsg(`已入藏 · 编号 ${result.work_id}`)
    alert(`作品已入藏！编号：${result.work_id}`)
  }
  catch (error) {
    console.error('保存失败:', error)
    store.setProgressMsg('入藏未成，请再试')
  }
}

// 导出长图
const exportWork = async () => {
  if (!store.taskStatus?.images.length) {
    alert('没有可导出的图片')
    return
  }

  store.setProgressMsg('正在装裱长卷...')

  try {
    const result = await $fetch<{ work_id: number; message: string }>('/api/works', {
      method: 'POST',
      body: {
        custom_title: `课文漫画 - ${new Date().toLocaleDateString()}`,
        scenes: store.scenes,
        images: store.taskStatus.images.map((i: any) => i.url),
        style: selectedStyle.value,
        is_public: false,
      },
    })

    const response = await fetch(`/api/works/${result.work_id}/export`)
    const blob = await response.blob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `课文画册_${result.work_id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    store.setProgressMsg('装裱毕！')
  }
  catch (error) {
    console.error('导出失败:', error)
    store.setProgressMsg('装裱未成，请再试')
  }
}
</script>

<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- 顶部编辑式版心 -->
    <section class="relative border-b border-ink-500/15 dark:border-paper-300/10 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="ink-wash"
             style="top: -20%; left: -10%; width: 50%; height: 100%;
                    background: radial-gradient(ellipse at center, rgba(139, 111, 71, 0.12), transparent 70%);"></div>
      </div>

      <div class="relative max-w-editorial mx-auto px-6 lg:px-12 py-12">
        <div class="flex items-center gap-3 mb-3">
          <div class="folio">卷 · 二</div>
          <div class="brush-divider w-24"></div>
          <div class="font-latin italic text-xs text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">II. ATELIER</div>
        </div>

        <div class="flex items-end justify-between flex-wrap gap-4">
          <h1 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 leading-none">
            工作<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">台</span>
          </h1>
          <p class="font-kai text-sm text-ink-500 dark:text-paper-300 max-w-md leading-relaxed">
            择文 · 析景 · 绘画 · 装裱 — 于此处完成一卷画册的全部工序
          </p>
        </div>
      </div>
    </section>

    <!-- 主内容 -->
    <main class="max-w-editorial mx-auto px-6 lg:px-12 py-10">
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- ============ 左侧：操作区 ============ -->
        <div class="space-y-6">
          <!-- 课文来源 -->
          <section class="paper-panel paper-panel-edge p-7">
            <div class="flex items-center gap-3 mb-5">
              <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">壹</span>
              <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">择 文</h2>
              <div class="brush-divider flex-1"></div>
              <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">I. SOURCE</span>
            </div>

            <!-- 切换 -->
            <div class="grid grid-cols-2 gap-px bg-ink-500/15 dark:bg-paper-300/10 mb-5">
              <button
                v-for="opt in [{ k: 'select', label: '课文库' }, { k: 'custom', label: '自输入' }]"
                :key="opt.k"
                :class="[
                  'py-2.5 px-4 font-kai text-sm transition-all duration-200',
                  textSource === opt.k
                    ? 'bg-paper-50 dark:bg-ink-500 text-cinnabar-600 dark:text-cinnabar-400'
                    : 'bg-transparent text-ink-400 dark:text-paper-300 hover:text-cinnabar-500'
                ]"
                @click="textSource = opt.k as 'select' | 'custom'"
              >
                {{ opt.label }}
              </button>
            </div>

            <!-- 选择课文 -->
            <div v-if="textSource === 'select'" class="relative">
              <button
                type="button"
                class="w-full px-4 py-3 bg-transparent border border-ink-500/20 dark:border-paper-300/15 text-left
                       flex items-center justify-between gap-2 hover:border-cinnabar-500 transition-colors
                       font-kai text-ink-700 dark:text-paper-100"
                @click="selectOpen = !selectOpen"
                @blur="selectOpen = false"
              >
                <span :class="selectedLessonId ? '' : 'text-ink-300 dark:text-paper-300 italic'">
                  {{ selectedLessonId ? (lessons?.find(l => l.id === selectedLessonId)?.title || '请选择') : '请选择一篇课文...' }}
                </span>
                <svg class="w-4 h-4 text-cinnabar-500 flex-shrink-0 transition-transform duration-200"
                     :class="{ 'rotate-180': selectOpen }"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="selectOpen"
                  class="absolute z-50 w-full mt-2 bg-paper-50 dark:bg-ink-600 border border-ink-500/20 dark:border-paper-300/15 shadow-paper-lg overflow-hidden"
                >
                  <div class="max-h-72 overflow-y-auto">
                    <button
                      v-for="lesson in lessons"
                      :key="lesson.id"
                      type="button"
                      class="w-full px-4 py-3 text-left font-kai text-ink-700 dark:text-paper-100 hover:bg-cinnabar-50 dark:hover:bg-cinnabar-900/20 hover:text-cinnabar-700 dark:hover:text-cinnabar-300 transition-colors"
                      :class="{ 'bg-cinnabar-50 dark:bg-cinnabar-900/20 text-cinnabar-700 dark:text-cinnabar-300': selectedLessonId === lesson.id }"
                      @mousedown.prevent="selectedLessonId = lesson.id; selectOpen = false"
                    >
                      <span class="font-medium">{{ lesson.title }}</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- 自定义输入 -->
            <div v-else>
              <textarea
                v-model="customText"
                rows="6"
                placeholder="请输入课文内容..."
                class="w-full px-4 py-3 bg-transparent border border-ink-500/20 dark:border-paper-300/15
                       focus:border-cinnabar-500 font-kai text-ink-700 dark:text-paper-100
                       dark:placeholder-paper-300/50 transition-colors resize-none"
              />
            </div>
          </section>

          <!-- 画风选择 -->
          <section class="paper-panel paper-panel-edge p-7">
            <div class="flex items-center gap-3 mb-5">
              <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">贰</span>
              <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">择 风</h2>
              <div class="brush-divider flex-1"></div>
              <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">II. STYLE</span>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="style in STYLE_OPTIONS"
                :key="style"
                :class="[
                  'p-4 border transition-all duration-300 text-center group relative overflow-hidden',
                  selectedStyle === style
                    ? 'border-cinnabar-500 bg-cinnabar-500 text-paper-50 shadow-seal'
                    : 'border-ink-500/20 dark:border-paper-300/15 hover:border-cinnabar-500/60 bg-transparent'
                ]"
                @click="selectedStyle = style"
              >
                <!-- 选中时的背景大字 -->
                <div
                  v-if="selectedStyle === style"
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span class="font-display text-7xl text-paper-50/15 select-none">{{ styleMeta[style].cn }}</span>
                </div>

                <div class="relative">
                  <div class="font-display text-2xl mb-1">{{ styleMeta[style].cn }}</div>
                  <div class="font-latin italic text-[10px] tracking-seal opacity-80">{{ styleMeta[style].latin }}</div>
                  <div class="font-kai text-[11px] mt-2 opacity-70 leading-tight">{{ styleMeta[style].subtitle }}</div>
                </div>
              </button>
            </div>
          </section>

          <!-- AI 析文 -->
          <section class="paper-panel paper-panel-edge p-7">
            <div class="flex items-center gap-3 mb-5">
              <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">叁</span>
              <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">析 文</h2>
              <div class="brush-divider flex-1"></div>
              <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">III. ANALYSE</span>
            </div>
            <button
              :disabled="store.isAnalyzing || (!selectedLessonId && !customText.trim())"
              class="btn-cinnabar w-full inline-flex items-center justify-center gap-3"
              @click="analyzeText"
            >
              <svg v-if="store.isAnalyzing" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span v-if="store.isAnalyzing">析文中...</span>
              <template v-else>
                <span>以 AI 析文</span>
                <span class="font-latin italic">→</span>
              </template>
            </button>
          </section>

          <!-- 场景编辑 -->
          <section class="paper-panel paper-panel-edge p-7">
            <div class="flex items-center gap-3 mb-5">
              <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">肆</span>
              <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">修 景</h2>
              <div class="brush-divider flex-1"></div>
              <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">
                {{ store.scenes.length }} 幕
              </span>
            </div>

            <div v-if="store.scenes.length === 0" class="text-center py-8">
              <div class="font-display text-7xl text-ink-500/10 dark:text-paper-300/10 mb-2">幕</div>
              <p class="font-kai text-sm text-ink-400 dark:text-paper-300 mb-1">尚无场景</p>
              <p class="font-latin italic text-xs text-ink-300 dark:text-paper-400">awaiting analysis</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(scene, index) in store.scenes"
                :key="index"
                class="border border-ink-500/15 dark:border-paper-300/10 bg-paper-50 dark:bg-ink-600 p-4 relative"
              >
                <!-- 编号印 -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="seal seal-tag text-xs">{{ ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || (index + 1) }}</span>
                    <span class="font-display text-sm text-ink-700 dark:text-paper-100">第 {{ index + 1 }} 幕</span>
                  </div>
                  <div class="flex gap-1">
                    <button
                      class="w-7 h-7 flex items-center justify-center text-ink-400 hover:text-cinnabar-500 hover:bg-cinnabar-50 dark:hover:bg-cinnabar-900/30 transition-colors disabled:opacity-30"
                      :disabled="index === 0"
                      title="上移"
                      @click="store.moveSceneUp(index)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                    </button>
                    <button
                      class="w-7 h-7 flex items-center justify-center text-ink-400 hover:text-cinnabar-500 hover:bg-cinnabar-50 dark:hover:bg-cinnabar-900/30 transition-colors disabled:opacity-30"
                      :disabled="index === store.scenes.length - 1"
                      title="下移"
                      @click="store.moveSceneDown(index)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <button
                      class="w-7 h-7 flex items-center justify-center text-ink-400 hover:text-cinnabar-700 hover:bg-cinnabar-50 dark:hover:bg-cinnabar-900/30 transition-colors"
                      title="删除"
                      @click="store.removeScene(index)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
                <textarea
                  v-model="scene.description_cn"
                  rows="2"
                  class="w-full px-3 py-2 text-sm border border-ink-500/15 dark:border-paper-300/10 bg-transparent dark:text-paper-100 focus:border-cinnabar-500 transition-colors font-kai resize-none"
                  placeholder="场景描述（中文）"
                  @blur="store.updateScene(index, { description_cn: scene.description_cn })"
                />
              </div>
            </div>

            <button
              v-if="store.scenes.length > 0"
              :disabled="store.isGenerating"
              class="btn-ink w-full mt-5 inline-flex items-center justify-center gap-3"
              @click="generateImages"
            >
              <svg v-if="store.isGenerating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span v-if="store.isGenerating">绘卷中...</span>
              <template v-else>
                <span>开 始 绘 卷</span>
                <span class="font-latin italic">→</span>
              </template>
            </button>
          </section>

          <!-- 进度提示 -->
          <section v-if="store.progressMsg"
                   class="border-l-2 border-cinnabar-500 bg-cinnabar-50 dark:bg-cinnabar-900/15 px-5 py-4">
            <p class="font-kai text-cinnabar-700 dark:text-cinnabar-300 text-center">
              {{ store.progressMsg }}
            </p>
          </section>
        </div>

        <!-- ============ 右侧：预览区 ============ -->
        <div class="lg:sticky lg:top-20 self-start space-y-4">
          <section class="paper-panel paper-panel-edge flex flex-col min-h-[60vh]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-ink-500/10 dark:border-paper-300/10">
              <div class="flex items-center gap-3">
                <span class="font-display text-2xl text-cinnabar-600 dark:text-cinnabar-400">伍</span>
                <h2 class="font-display text-lg text-ink-700 dark:text-paper-50">观 卷</h2>
              </div>
              <span v-if="store.taskStatus"
                    class="font-latin italic text-sm text-cinnabar-600 dark:text-cinnabar-400 tracking-widest">
                {{ store.taskStatus.completed }} / {{ store.taskStatus.total }}
              </span>
            </div>

            <!-- 空状态 -->
            <div v-if="store.scenes.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div class="relative mb-6">
                <div class="w-24 h-24 rounded-full border-2 border-cinnabar-500/30"></div>
                <div class="absolute inset-3 rounded-full border border-dashed border-ink-300/40"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="font-display text-5xl text-cinnabar-500/40">画</span>
                </div>
              </div>
              <p class="font-display text-lg text-ink-700 dark:text-paper-50 mb-1">画卷待绘</p>
              <p class="font-kai text-sm text-ink-400 dark:text-paper-300">先择文析景，方得观卷</p>
            </div>

            <!-- 单张 -->
            <div v-if="store.scenes.length === 1" class="flex-1 overflow-y-auto p-6">
              <div class="relative w-full aspect-square bg-paper-200 dark:bg-ink-500 overflow-hidden">
                <img
                  v-if="store.taskStatus?.images[0]?.status === 'completed'"
                  :src="store.taskStatus?.images[0]?.url"
                  :alt="store.scenes[0]?.description_cn"
                  class="w-full h-full object-contain"
                  loading="lazy"
                >
                <div v-else-if="store.taskStatus?.images[0]?.status === 'processing'"
                     class="absolute inset-0 flex flex-col items-center justify-center bg-cinnabar-50 dark:bg-ink-600">
                  <div class="w-10 h-10 border-2 border-cinnabar-300 border-t-cinnabar-600 rounded-full animate-spin mb-3"></div>
                  <span class="font-kai text-sm text-cinnabar-700 dark:text-cinnabar-300">绘卷中...</span>
                </div>
                <div v-else-if="store.taskStatus?.images[0]?.status === 'failed'"
                     class="absolute inset-0 flex flex-col items-center justify-center bg-cinnabar-50 dark:bg-ink-600">
                  <span class="font-display text-3xl text-cinnabar-600 mb-2">败</span>
                  <span class="font-kai text-sm text-cinnabar-700">绘卷未成</span>
                </div>
                <div v-else class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="font-kai text-sm text-ink-400">待绘</span>
                </div>

                <!-- 印章角标 -->
                <div class="absolute bottom-3 right-3 seal seal-tag text-[10px]">漫游</div>
              </div>
            </div>

            <!-- 多张 -->
            <div v-if="store.scenes.length > 1" class="flex-1 overflow-y-auto scrollbar-none">
              <div
                v-for="(scene, index) in store.displayedScenes"
                :key="index"
                class="border-b border-ink-500/10 dark:border-paper-300/10 last:border-b-0"
              >
                <div class="relative w-full bg-paper-200 dark:bg-ink-500" style="padding-bottom: 100%;">
                  <img
                    v-if="store.taskStatus?.images[index]?.status === 'completed'"
                    :src="store.taskStatus.images[index].url"
                    :alt="scene.description_cn"
                    class="absolute inset-0 w-full h-full object-contain"
                    loading="lazy"
                  >
                  <div v-else-if="store.taskStatus?.images[index]?.status === 'processing'"
                       class="absolute inset-0 flex flex-col items-center justify-center bg-cinnabar-50/50 dark:bg-ink-600">
                    <div class="w-10 h-10 border-2 border-cinnabar-300 border-t-cinnabar-600 rounded-full animate-spin mb-3"></div>
                    <span class="font-kai text-sm text-cinnabar-700 dark:text-cinnabar-300">绘卷中...</span>
                  </div>
                  <div v-else-if="store.taskStatus?.images[index]?.status === 'failed'"
                       class="absolute inset-0 flex flex-col items-center justify-center bg-cinnabar-50/50 dark:bg-ink-600">
                    <span class="font-display text-3xl text-cinnabar-600 mb-2">败</span>
                    <span class="font-kai text-sm text-cinnabar-700">绘卷未成</span>
                  </div>
                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="font-display text-5xl text-ink-500/15 dark:text-paper-300/10">
                      {{ ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || (index + 1) }}
                    </span>
                    <span class="font-kai text-xs text-ink-400 mt-2">待绘</span>
                  </div>

                  <!-- 幕次号 -->
                  <div class="absolute top-3 left-3 seal seal-tag text-[10px]">
                    {{ ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || (index + 1) }}
                  </div>
                  <!-- 印章角标 -->
                  <div class="absolute bottom-3 right-3 seal seal-tag text-[10px]">漫游</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 保存 & 导出 -->
          <section v-if="store.isGeneratingComplete" class="grid grid-cols-2 gap-3">
            <button class="btn-ink inline-flex items-center justify-center gap-2" @click="saveWork">
              <span>入 藏</span>
              <span class="font-latin italic text-xs">SAVE</span>
            </button>
            <button class="btn-cinnabar inline-flex items-center justify-center gap-2" @click="exportWork">
              <span>装 裱</span>
              <span class="font-latin italic text-xs">EXPORT</span>
            </button>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
