<script setup lang="ts">
// 预览区（真漫画版）：每个场景渲染一页漫画（ComicPage），生成中逐格占位
import { computed } from 'vue'
import { resolveScenePanels } from '~/utils/comic'

const props = defineProps<{
  scenes: any[]
  taskStatus: any | null
  currentStep: number
  displayedScenes: any[]
}>()

const emit = defineEmits<{
  (e: 'openLightbox', sceneIndex: number): void
}>()

/** 场景 i 的逐格图片映射（新任务按 panel_id 回绑；旧任务按 index 回退） */
const scenePanelImages = (sceneIndex: number) => {
  const scene = props.displayedScenes[sceneIndex]
  if (!scene) return {}
  const map: Record<string, string> = {}
  const byId = new Map<string, string>()
  const byIndex = new Map<number, string>()
  for (const img of props.taskStatus?.images || []) {
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

const hasAnyImage = computed(() => (props.taskStatus?.images || []).some((i: any) => i?.url))

const getEmptyMessage = () => {
  switch (props.currentStep) {
    case 0: return '选择课文后可预览内容'
    case 1: return '分析完成后将显示分镜'
    case 2: return '编辑分镜时可预览效果'
    case 3: return '生成过程中逐格预览'
    default: return '选择课文后可预览内容'
  }
}
</script>

<template>
  <div class="bg-white dark:bg-surface-800 rounded-lg border border-surface-300 dark:border-surface-800 flex-1 flex flex-col min-h-0 transition-colors">
    <!-- 头部 -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-surface-300 dark:border-surface-800 flex-shrink-0">
      <h2 class="text-base font-semibold text-surface-800 dark:text-surface-200 font-heading">
        漫画预览
      </h2>
      <span v-if="taskStatus" class="text-sm text-primary-500 font-medium px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded-full">
        {{ taskStatus.completed }}/{{ taskStatus.total }} 格
      </span>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 空状态 -->
      <div v-if="displayedScenes.length === 0" class="h-full flex flex-col items-center justify-center text-center p-8">
        <div class="w-16 h-16 mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-surface-500 dark:text-surface-300 font-medium mb-1">暂无预览</p>
        <p class="text-surface-400 dark:text-surface-400 text-sm">{{ getEmptyMessage() }}</p>
      </div>

      <!-- 每场景一页漫画 -->
      <div v-else class="p-4 space-y-5">
        <div
          v-for="(scene, index) in displayedScenes"
          :key="index"
          class="border border-surface-300 dark:border-surface-800 rounded-md overflow-hidden bg-surface-50 dark:bg-surface-700"
        >
          <div class="p-2">
            <WorkspaceComicPage
              :scene="scene"
              :panel-images="scenePanelImages(index)"
              :skeleton="!hasAnyImage"
              :show-order-badge="true"
              @open-panel="() => emit('openLightbox', index)"
            />
          </div>
          <div class="p-3 bg-surface-50 dark:bg-surface-700 border-t border-surface-300 dark:border-surface-800">
            <p class="text-xs text-surface-700 dark:text-surface-200 line-clamp-2">
              场景 {{ index + 1 }}（{{ (scene.panels && scene.panels.length) || 1 }} 格）· {{ scene.description_cn }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>