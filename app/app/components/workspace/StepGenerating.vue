<script setup lang="ts">
// 生成进度（panel 级）：按 panel_id 逐格回绑状态；progressMsg 由 useTaskPoll 驱动（已完成 X/Y 格）
import { computed } from 'vue'
import type { CharacterInfo, Scene, TaskImage, TaskStatus } from '~/types/api'
import { resolveScenePanels } from '~/utils/comic'

const props = defineProps<{
  scenes: Scene[]
  characters?: CharacterInfo[]
  taskStatus: TaskStatus | null
  isGeneratingComplete: boolean
  progressPercent: number
  progressMsg?: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'back'): void
}>()

// 扁平 panel 列表（scene → panels），每项带状态（panel_id → task image；旧任务按 index 回退）
const panelRows = computed(() => {
  const byId = new Map<string, TaskImage>()
  const byIndex = new Map<number, TaskImage>()
  for (const img of props.taskStatus?.images || []) {
    if (img.panel_id) byId.set(img.panel_id, img)
    else byIndex.set(img.index, img)
  }
  const rows: { panelId: string; label: string; image: TaskImage | undefined }[] = []
  let flat = 0
  for (const scene of props.scenes) {
    const panels = resolveScenePanels(scene)
    for (const p of panels) {
      const image = p.id && byId.get(p.id) ? byId.get(p.id) : byIndex.get(flat)
      rows.push({ panelId: p.id || `p${flat}`, label: p.description_cn || scene.description_cn || `格 ${flat + 1}`, image })
      flat++
    }
  }
  return rows
})

const totalPanels = computed(() => panelRows.value.length)
const donePanels = computed(() => panelRows.value.filter(r => r.image?.status === 'completed').length)

const statusOf = (image: TaskImage | undefined) => image?.status || 'pending'
</script>

<template>
  <div class="space-y-6">
    <section class="bg-white dark:bg-surface-800 rounded-lg p-6 border border-surface-300 dark:border-surface-800 transition-colors">
      <div class="text-center mb-6">
        <!-- 进度圆环 -->
        <div class="relative w-20 h-20 mx-auto mb-4">
          <svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" class="text-surface-200 dark:text-surface-800" />
            <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" :stroke-dasharray="251.2" :stroke-dashoffset="251.2 * (1 - progressPercent / 100)" class="text-primary-500 transition-all duration-500" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-lg font-bold text-surface-800 dark:text-surface-200">{{ progressPercent }}%</span>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-2 font-heading">
          {{ isGeneratingComplete ? '生成完成' : '正在生成图片' }}
        </h3>

        <p class="text-surface-500 dark:text-surface-300 text-sm">
          {{ isGeneratingComplete
            ? `全部 ${totalPanels} 格已生成完毕`
            : (progressMsg || `已完成 ${donePanels}/${totalPanels} 格`) }}
        </p>
      </div>

      <!-- panel 级状态列表（两级：场景 → 格） -->
      <div class="space-y-1.5">
        <template v-for="(scene, si) in scenes" :key="si">
          <p class="text-[11px] font-semibold text-primary-500 mt-2 first:mt-0">
            场景 {{ si + 1 }} · 共 {{ resolveScenePanels(scene).length }} 格
          </p>
          <div
            v-for="(row, ri) in resolveScenePanels(scene)"
            :key="row.id || ri"
            class="flex items-center gap-3 p-2.5 rounded-md"
            :class="statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'completed' ? 'bg-success-50 dark:bg-success-900/20' :
                    statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'processing' ? 'bg-primary-50 dark:bg-primary-900/20' :
                    statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'failed' ? 'bg-error-50 dark:bg-error-900/20' :
                    'bg-surface-100 dark:bg-surface-800'"
          >
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
              :class="statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'completed' ? 'bg-success-500 text-white' :
                      statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'processing' ? 'bg-primary-500 text-white' :
                      statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'failed' ? 'bg-error-500 text-white' :
                      'bg-surface-300 dark:bg-surface-700 text-surface-600 dark:text-surface-300'"
            >
              <svg v-if="statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'completed'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <svg v-else-if="statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'processing'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg v-else-if="statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'failed'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              <span v-else>{{ (row.order ?? ri) + 1 }}</span>
            </span>
            <span class="text-sm text-surface-700 dark:text-surface-200 truncate flex-1">
              {{ row.description_cn || scene.description_cn }}
            </span>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
              :class="statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'completed' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' :
                      statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'processing' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' :
                      statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'failed' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300' :
                      'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'"
            >
              {{ statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'completed' ? '已完成' :
                  statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'processing' ? '生成中' :
                  statusOf(panelRows.find(r => r.panelId === (row.id || `p${ri}`))?.image) === 'failed' ? '失败' : '等待中' }}
            </span>
          </div>
        </template>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="flex gap-4">
      <button
        v-if="!isGeneratingComplete"
        class="flex-1 px-6 py-3 text-surface-600 dark:text-surface-300 font-medium rounded-lg border border-surface-300 dark:border-surface-800 transition-all duration-200 flex items-center justify-center gap-2 hover:bg-surface-100 dark:hover:bg-surface-800"
        @click="emit('cancel')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        <span>取消生成</span>
      </button>
      <button
        v-if="isGeneratingComplete"
        class="flex-1 px-6 py-3 text-surface-600 dark:text-surface-300 font-medium rounded-lg border border-surface-300 dark:border-surface-800 transition-all duration-200 flex items-center justify-center gap-2 hover:bg-surface-100 dark:hover:bg-surface-800"
        @click="emit('back')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
        <span>返回编辑</span>
      </button>
    </div>
  </div>
</template>