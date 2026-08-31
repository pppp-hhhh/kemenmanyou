<script setup lang="ts">
import { STYLE_OPTIONS, type StyleType, type TaskStatus, type Lesson } from '~/types/api'
import { useWorkspaceStore } from '~/stores/workspace'
import { useAuthStore } from '~/stores/auth'
import { restoreDraft, clearDraft, isFreshDraft, formatSavedAgo } from '~/utils/workspace-draft'
import { flattenPanelsForGenerate, resolveScenePanels } from '~/utils/comic'

const store = useWorkspaceStore()
const auth = useAuthStore()

// textarea auto-resize
const autoResize = (e: Event) => {
  const el = e.target as HTMLTextAreaElement
  el.style.height = "auto"
  el.style.height = Math.min(el.scrollHeight, 200) + "px"
}
const { startPoll } = useTaskPoll()

// 暗色模式
const { isDark, toggle } = useDarkMode()

// 保存成功状态
const saveSuccessWorkId = ref<number | null>(null)
const saveSuccessMsg = ref('')

// 作品标题
const saveTitle = ref('')

// 课文列表（从数据库获取）
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

// 步骤管理
const currentStep = ref(0) // 0: 选择课文, 1: AI分析, 2: 编辑场景, 3: 生成图片
const steps = [
  { title: '选择课文', icon: 'book' },
  { title: 'AI 分析', icon: 'search' },
  { title: '编辑场景', icon: 'edit' },
  { title: '生成图片', icon: 'image' },
]

// 步骤导航
const goToStep = (step: number) => {
  // 只允许导航到已完成的步骤或当前步骤的下一步
  if (step <= currentStep.value || 
      (step === currentStep.value + 1 && store.scenes.length > 0)) {
    currentStep.value = step
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
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
  store.setProgressMsg('AI 正在分析课文...')
  currentStep.value = 1 // 切换到分析步骤

  try {
    const result = await $fetch<{ scenes: { description_cn: string; prompt_en: string }[]; characters?: any[] }>('/api/analyze', {
      method: 'POST',
      body: {
        text,
        style: selectedStyle.value,
      },
    })
    // 记录课文来源，供草稿恢复后继续使用
    store.setText(textSource.value === 'select' ? selectedLessonId.value : null, text)
    store.setScenes(result.scenes)
    // 角色注册表（CharacterLock 依据；analyzer 未返回时为空，不影响旧链）
    store.setCharacters(result.characters || [])
    const panelCount = store.totalPanels
    store.setProgressMsg(`分析完成！生成了 ${result.scenes.length} 个场景 / ${panelCount} 格`)
    store.saveDraft()
    currentStep.value = 2 // 分析完成，切换到编辑场景步骤
  }
  catch (error) {
    console.error('分析失败:', error)
    store.setProgressMsg('分析失败，请重试')
    currentStep.value = 0 // 分析失败，返回选择课文步骤
  }
  finally {
    store.setAnalyzing(false)
  }
}

// 开始生成（真漫画版）：场景展开为 panel 级入参，附角色注册表；风格前缀由服务端统一注入
const generateImages = async () => {
  if (store.scenes.length === 0) {
    alert('请先生成场景')
    return
  }

  const panels = flattenPanelsForGenerate(store.scenes)
  if (panels.length === 0) {
    alert('没有可生成的格')
    return
  }

  try {
    const result = await $fetch<{ task_id: string }>('/api/generate', {
      method: 'POST',
      body: {
        panels,
        characters: store.characters || [],
        character_mode: 'prompt',
        style: selectedStyle.value,
      },
    })
    store.setStyle(selectedStyle.value)
    startPoll(result.task_id)
    store.saveDraft()
    currentStep.value = 3 // 切换到生成图片步骤
  }
  catch (error) {
    console.error('提交生成任务失败:', error)
    store.setProgressMsg('提交生成任务失败')
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
        custom_title: saveTitle.value.trim() || `课文漫画 - ${new Date().toLocaleDateString()}`,
        scenes: store.scenes,
        images: store.taskStatus.images.map((i: any) => i.url),
        style: selectedStyle.value,
        is_public: false,
      },
    })
    store.setProgressMsg(`作品已保存！ID: ${result.work_id}`)
    saveSuccessWorkId.value = result.work_id
    saveSuccessMsg.value = `作品「${saveTitle.value.trim() || '课文漫画'}」已成功保存`
  }
  catch (error) {
    console.error('保存失败:', error)
    store.setProgressMsg('保存失败，请重试')
  }
}

// 导出长图
const exportWork = async () => {
  if (!store.taskStatus?.images.length) {
    alert('没有可导出的图片')
    return
  }

  store.setProgressMsg('正在生成导出文件...')

  try {
    // 先保存作品获取 work_id
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

    // 通过前端代理下载
    const response = await fetch(`/api/works/${result.work_id}/export`)
    const blob = await response.blob()

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `课文漫画_${result.work_id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    store.setProgressMsg('导出成功！')
    saveSuccessWorkId.value = result.work_id
    saveSuccessMsg.value = '长图导出成功，作品已保存'
  }
  catch (error) {
    console.error('导出失败:', error)
    store.setProgressMsg('导出失败，请重试')
  }
}

// ---- 恢复未完成的生成会话（localStorage 草稿；仅本人、7 天内有效） ----

/** 判断任务探测错误是否为 404（任务已不存在） */
const isTaskNotFoundError = (error: unknown) => {
  const e = error as { status?: number, statusCode?: number, response?: { status?: number } } | null
  return e?.status === 404 || e?.statusCode === 404 || e?.response?.status === 404
}

/** 把恢复后的 store 状态同步回页面本地表单控件 */
const syncFormFromStore = () => {
  selectedLessonId.value = store.selectedTextId
  customText.value = store.customText
  selectedStyle.value = store.selectedStyle
  textSource.value = store.selectedTextId != null
    ? 'select'
    : (store.customText.trim() ? 'custom' : 'select')
  
  // 根据恢复的状态设置步骤
  if (store.scenes.length > 0) {
    if (store.taskStatus?.status === 'completed') {
      currentStep.value = 3 // 已完成生成
    } else if (store.taskId) {
      currentStep.value = 3 // 正在生成
    } else {
      currentStep.value = 2 // 有场景但未开始生成
    }
  } else if (store.customText.trim() || store.selectedTextId) {
    currentStep.value = 0 // 有课文但未分析
  }
}

// ---- Lightbox（场景级：放大查看整页漫画） ----
const lightboxOpen = ref(false)
const lightboxSceneIndex = ref(0)
const lightboxScale = ref(1)

/** 场景 i 的逐格图片映射（panel_id 优先，旧任务 index 回退） */
const scenePanelImages = (sceneIndex: number) => {
  const scene = store.scenes[sceneIndex]
  if (!scene) return {}
  const map: Record<string, string> = {}
  const byId = new Map<string, string>()
  const byIndex = new Map<number, string>()
  for (const img of store.taskStatus?.images || []) {
    if (img?.url) {
      if (img.panel_id) byId.set(img.panel_id, img.url)
      else byIndex.set(img.index, img.url)
    }
  }
  resolveScenePanels(scene).forEach((p, i) => {
    const url = byId.get(p.id) || byIndex.get(i) || p.image_url || ''
    if (url) map[p.id] = url
  })
  return map
}

const openLightbox = (sceneIndex: number) => {
  lightboxSceneIndex.value = sceneIndex
  lightboxScale.value = 1
  lightboxOpen.value = true
}
const closeLightbox = () => { lightboxOpen.value = false; lightboxScale.value = 1 }
const prevScene = () => {
  if (lightboxSceneIndex.value > 0) lightboxSceneIndex.value--
}
const nextScene = () => {
  if (lightboxSceneIndex.value < store.scenes.length - 1) lightboxSceneIndex.value++
}
const zoomIn = () => { lightboxScale.value = Math.min(lightboxScale.value + 0.25, 3) }
const zoomOut = () => { lightboxScale.value = Math.max(lightboxScale.value - 0.25, 0.5) }

onMounted(async () => {
  store.initDraftPersistence()

  const draft = restoreDraft()
  if (!draft)
    return

  // 仅草稿属主本人（且已登录）可见
  const uid = auth.user?.id ?? null
  if (!uid || draft.ownerUserId !== uid)
    return

  // 本人过期草稿：直接清理，不打扰
  if (!isFreshDraft(draft)) {
    clearDraft()
    return
  }

  const sceneCount = draft.scenes.length
  const resume = confirm(`检测到未完成的生成会话（${sceneCount} 个场景，保存于 ${formatSavedAgo(draft.savedAt)}）：

「确定」继续上次会话，「取消」放弃并清空。`)
  if (!resume) {
    store.clear()
    syncFormFromStore()
    return
  }

  store.applyDraft(draft)
  syncFormFromStore()

  // 探测原生成任务：仍存在则续轮询；404 则标记中断并引导重新生成
  const taskId = store.taskId
  if (!taskId)
    return

  try {
    const status = await $fetch<TaskStatus>(`/api/task/${taskId}`)
    store.setTaskStatus(status)
    startPoll(taskId)
  }
  catch (error) {
    if (isTaskNotFoundError(error)) {
      store.setTaskId(null)
      store.setTaskStatus(null)
      store.setProgressMsg('原生成任务已失效（服务端不存在），请点击「开始生成」重新生成')
      store.saveDraft()
    }
    else {
      console.error('恢复生成任务失败:', error)
      store.setProgressMsg('获取原生成任务状态失败，请稍后重试')
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900">
    <!-- 步骤进度条 -->
    <WorkspaceStepProgressBar
      :current-step="currentStep"
      :steps="steps"
    />

    <!-- 主内容区 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 min-h-[calc(100vh-180px)]">
        <!-- 左侧操作区 (65%) -->
        <div class="space-y-4 overflow-y-auto scrollbar-none">
          <!-- 步骤 0: 选择课文 -->
          <WorkspaceStepLessonSource
            v-if="currentStep === 0"
            :lessons="lessons"
            :selected-lesson-id="selectedLessonId"
            :selected-style="selectedStyle"
            :text-source="textSource"
            :custom-text="customText"
            :select-open="selectOpen"
            @update:selected-lesson-id="(val) => selectedLessonId = val"
            @update:selected-style="(val) => selectedStyle = val"
            @update:text-source="(val) => textSource = val"
            @update:custom-text="(val) => customText = val"
            @update:select-open="(val) => selectOpen = val"
            @next="analyzeText"
          />

          <!-- 步骤 1: AI 分析中 -->
          <WorkspaceStepAnalyzing
            v-else-if="currentStep === 1"
            :progress-msg="store.progressMsg"
            :is-analyzing="store.isAnalyzing"
            @cancel="currentStep = 0"
          />

          <!-- 步骤 2: 编辑场景 -->
          <WorkspaceStepEditScenes
            v-else-if="currentStep === 2"
            :scenes="store.scenes"
            @update-scene="(index, scene) => store.updateScene(index, scene)"
            @update-panel="(si, pi, patch) => store.updatePanel(si, pi, patch)"
            @add-panel="(si) => store.addPanel(si)"
            @remove-panel="(si, pi) => store.removePanel(si, pi)"
            @move-scene-up="(index) => store.moveSceneUp(index)"
            @move-scene-down="(index) => store.moveSceneDown(index)"
            @remove-scene="(index) => store.removeScene(index)"
            @back="currentStep = 0"
            @next="generateImages"
          />

          <!-- 步骤 3: 生成图片 -->
          <WorkspaceStepGenerating
            v-else-if="currentStep === 3"
            :scenes="store.scenes"
            :characters="store.characters"
            :task-status="store.taskStatus"
            :is-generating-complete="store.isGeneratingComplete"
            :progress-percent="store.progressPercent"
            :progress-msg="store.progressMsg"
            @cancel="currentStep = 2"
            @back="currentStep = 2"
          />

          <!-- 保存成功提示 -->
          <div v-if="saveSuccessWorkId" class="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
            <p class="text-success-700 dark:text-success-300 font-medium mb-3">{{ saveSuccessMsg }}</p>
            <div class="flex gap-3">
              <NuxtLink
                to="/my-works"
                class="flex-1 px-4 py-2 bg-success-500 hover:bg-success-600 text-white text-sm font-medium rounded-md text-center transition-colors"
              >
                查看我的作品
              </NuxtLink>
              <button
                class="flex-1 px-4 py-2 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 text-sm font-medium rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                @click="saveSuccessWorkId = null; saveSuccessMsg = ''"
              >
                继续创作
              </button>
            </div>
          </div>

          <!-- 进度提示 -->
          <div v-if="store.progressMsg && currentStep !== 1" class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <p class="text-primary-700 dark:text-primary-300 text-center font-medium">
              {{ store.progressMsg }}
            </p>
          </div>

          <!-- 保存 & 导出 (生成完成后显示) -->
          <div v-if="store.isGeneratingComplete" class="bg-white dark:bg-surface-800 rounded-lg p-5 border border-surface-300 dark:border-surface-800 space-y-4">
            <h3 class="text-base font-semibold text-surface-800 dark:text-surface-200 font-heading">
              保存作品
            </h3>
            <input
              v-model="saveTitle"
              type="text"
              placeholder="作品标题（可选，留空自动生成）"
              class="w-full px-4 py-2.5 text-sm border border-surface-300 dark:border-surface-800 rounded-md bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-200 placeholder-surface-400 dark:placeholder-surface-400 focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-colors"
            >
            <div class="flex gap-3">
              <button
                class="flex-1 px-6 py-3 text-white font-medium rounded-lg bg-success-500
                       transition-all duration-200 flex items-center justify-center gap-2
                       hover:bg-success-600 active:bg-success-700"
                @click="saveWork"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>保存作品</span>
              </button>
              <button
                class="flex-1 px-6 py-3 text-white font-medium rounded-lg bg-secondary-500
                       transition-all duration-200 flex items-center justify-center gap-2
                       hover:bg-secondary-600 active:bg-secondary-700"
                @click="exportWork"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>导出长图</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧预览区 (35%) -->
        <div class="hidden lg:block">
          <WorkspacePreviewPanel
            :scenes="store.scenes"
            :task-status="store.taskStatus"
            :current-step="currentStep"
            :displayed-scenes="store.displayedScenes"
            @open-lightbox="openLightbox"
          />
        </div>
      </div>
    </main>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          @keydown.esc="closeLightbox"
          @click.self="closeLightbox"
        >
          <!-- Close button -->
          <button
            class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
            @click="closeLightbox"
          >
            ✕
          </button>

          <!-- Prev arrow -->
          <button
            v-if="lightboxSceneIndex > 0"
            class="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
            @click="prevScene"
          >
            ‹
          </button>

          <!-- Next arrow -->
          <button
            v-if="store.scenes && lightboxSceneIndex < store.scenes.length - 1"
            class="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
            @click="nextScene"
          >
            ›
          </button>

          <!-- 整页漫画（放大查看） -->
          <div
            v-if="store.scenes[lightboxSceneIndex]"
            class="max-w-[88vw] max-h-[85vh] overflow-auto bg-neutral-900 rounded-lg"
            :style="{ transform: `scale(${lightboxScale})`, transformOrigin: 'center' }"
            @click.stop
          >
            <WorkspaceComicPage
              :scene="store.scenes[lightboxSceneIndex]"
              :panel-images="scenePanelImages(lightboxSceneIndex)"
              :show-order-badge="true"
              class="max-w-4xl mx-auto"
            />
          </div>

          <!-- Zoom controls -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
            <button
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              @click="zoomOut"
            >
              −
            </button>
            <span class="text-white text-sm font-medium min-w-[3rem] text-center">{{ Math.round(lightboxScale * 100) }}%</span>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              @click="zoomIn"
            >
              +
            </button>
          </div>

          <!-- Counter -->
          <div class="absolute top-4 left-4 z-10 text-white/70 text-sm">
            场景 {{ lightboxSceneIndex + 1 }} / {{ store.scenes?.length || 0 }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
