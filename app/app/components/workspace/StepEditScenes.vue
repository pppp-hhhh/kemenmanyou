<script setup lang="ts">
// 场景编辑（真漫画版）：场景卡片内展开 panel 列表，每格可编辑
// 描述/镜头/台词/旁白/拟声词；layout 采用 LLM 输出只读展示（拖拽不做）。
import type { Panel, Scene } from '~/types/api'
import { resolveScenePanels } from '~/utils/comic'

const props = defineProps<{
  scenes: Scene[]
}>()

const emit = defineEmits<{
  (e: 'updateScene', index: number, scene: Partial<Scene>): void
  (e: 'updatePanel', sceneIndex: number, panelIndex: number, patch: Partial<Panel>): void
  (e: 'addPanel', sceneIndex: number): void
  (e: 'removePanel', sceneIndex: number, panelIndex: number): void
  (e: 'moveSceneUp', index: number): void
  (e: 'moveSceneDown', index: number): void
  (e: 'removeScene', index: number): void
  (e: 'back'): void
  (e: 'next'): void
}>()

const SHOT_OPTIONS = ['wide', 'medium', 'closeup', 'extreme_closeup', 'establishing', 'two_shot', 'over_shoulder']
const ANGLE_OPTIONS = ['eye', 'low', 'high', 'bird', 'dutch']
const ANCHOR_OPTIONS = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right']

const autoResize = (e: Event) => {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

const panelList = (scene: Scene): Panel[] => resolveScenePanels(scene)

// 台词行级操作（一次性 patch 整格 text）
function updateDialogue(sceneIndex: number, panelIndex: number, panel: Panel, di: number, patch: Record<string, unknown>) {
  const dialogues = [...(panel.text?.dialogues || [])]
  dialogues[di] = { ...(dialogues[di] || { text: '' }), ...patch }
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), dialogues } })
}
function addDialogue(sceneIndex: number, panelIndex: number, panel: Panel) {
  const dialogues = [...(panel.text?.dialogues || []), { speaker: '', text: '', type: 'speech' as const, anchor: 'bottom-left' }]
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), dialogues } })
}
function removeDialogue(sceneIndex: number, panelIndex: number, panel: Panel, di: number) {
  const dialogues = (panel.text?.dialogues || []).filter((_, i) => i !== di)
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), dialogues } })
}
function addNarration(sceneIndex: number, panelIndex: number, panel: Panel) {
  const narrations = [...(panel.text?.narrations || []), { text: '', anchor: 'top-left' }]
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), narrations } })
}
function removeNarration(sceneIndex: number, panelIndex: number, panel: Panel, ni: number) {
  const narrations = (panel.text?.narrations || []).filter((_, i) => i !== ni)
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), narrations } })
}
function addSfx(sceneIndex: number, panelIndex: number, panel: Panel) {
  const sfx = [...(panel.text?.sfx || []), { text: '', anchor: 'right', rotate: 0, size: 'medium' as const }]
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), sfx } })
}
function removeSfx(sceneIndex: number, panelIndex: number, panel: Panel, si: number) {
  const sfx = (panel.text?.sfx || []).filter((_, i) => i !== si)
  emit('updatePanel', sceneIndex, panelIndex, { text: { ...(panel.text || {}), sfx } })
}

const layoutLabel = (panel: Panel) => {
  const l = panel.layout || {}
  const span = (l.colspan || 1) * (l.rowspan || 1)
  return span > 1 ? `跨 ${l.colspan || 1}×${l.rowspan || 1} 格` : '1 格'
}
</script>

<template>
  <div class="space-y-6">
    <section class="bg-white dark:bg-surface-800 rounded-lg p-5 border border-surface-300 dark:border-surface-800 transition-colors">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-surface-800 dark:text-surface-200 font-heading">
          场景 / 分镜编辑
        </h2>
        <span class="text-sm text-primary-500 font-medium px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded-full">
          {{ scenes.length }} 个场景 · {{ scenes.reduce((n, s) => n + panelList(s).length, 0) }} 格
        </span>
      </div>

      <div v-if="scenes.length === 0" class="text-center py-8 text-surface-400 dark:text-surface-300 text-sm">
        <p class="mb-1">暂无场景</p>
        <p class="text-xs">请先选择课文并点击 AI 分析</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(scene, index) in scenes"
          :key="index"
          class="p-4 border border-surface-300 dark:border-surface-800 rounded-md bg-surface-50 dark:bg-surface-700"
        >
          <!-- 场景头 -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-primary-500">场景 {{ index + 1 }}</span>
            <div class="flex gap-1">
              <button class="w-7 h-7 flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-md disabled:opacity-30 transition-colors" :disabled="index === 0" title="上移" aria-label="上移场景" @click="emit('moveSceneUp', index)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
              </button>
              <button class="w-7 h-7 flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-600 rounded-md disabled:opacity-30 transition-colors" :disabled="index === scenes.length - 1" title="下移" aria-label="下移场景" @click="emit('moveSceneDown', index)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button class="w-7 h-7 flex items-center justify-center text-surface-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-md transition-colors" title="删除场景" aria-label="删除场景" @click="emit('removeScene', index)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <!-- 场景级描述 -->
          <textarea
            :value="scene.description_cn"
            class="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-800 rounded-md bg-white dark:bg-surface-800 dark:text-surface-200 dark:placeholder-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all resize-none mb-3"
            style="min-height: 2.5rem; max-height: 120px; overflow-y: auto;"
            placeholder="场景描述（中文，整页概述）"
            @input="autoResize($event); emit('updateScene', index, { description_cn: ($event.target as HTMLTextAreaElement).value })"
          />

          <!-- 页网格信息 -->
          <p class="text-xs text-surface-400 dark:text-surface-300 mb-2">
            页布局 {{ scene.page?.cols || 2 }} × {{ scene.page?.rows || 2 }} {{ scene.page?.reading_direction === 'rtl' ? '· 右→左' : '' }}
          </p>

          <!-- Panel 列表 -->
          <div class="space-y-3">
            <div
              v-for="(panel, pi) in panelList(scene)"
              :key="panel.id || pi"
              class="p-3 border border-surface-300 dark:border-surface-800 rounded-md bg-white dark:bg-surface-800"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-surface-600 dark:text-surface-300">
                  第 {{ (panel.order ?? pi) + 1 }} 格 · {{ panel.shot || 'medium' }} · {{ layoutLabel(panel) }}
                </span>
                <button
                  class="w-6 h-6 flex items-center justify-center text-surface-400 hover:text-error-500 rounded-md transition-colors"
                  title="删除本格" aria-label="删除本格"
                  @click="emit('removePanel', index, pi)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <!-- 镜头参数 -->
              <div class="grid grid-cols-2 gap-2 mb-2">
                <select
                  :value="panel.shot || 'medium'"
                  class="px-2 py-1.5 text-xs border border-surface-300 dark:border-surface-800 rounded-md bg-white dark:bg-surface-800 dark:text-surface-200"
                  @change="emit('updatePanel', index, pi, { shot: ($event.target as HTMLSelectElement).value })"
                >
                  <option v-for="s in SHOT_OPTIONS" :key="s" :value="s">{{ s }}</option>
                </select>
                <select
                  :value="panel.angle || 'eye'"
                  class="px-2 py-1.5 text-xs border border-surface-300 dark:border-surface-800 rounded-md bg-white dark:bg-surface-800 dark:text-surface-200"
                  @change="emit('updatePanel', index, pi, { angle: ($event.target as HTMLSelectElement).value })"
                >
                  <option v-for="a in ANGLE_OPTIONS" :key="a" :value="a">{{ a }}</option>
                </select>
              </div>

              <textarea
                :value="panel.description_cn || ''"
                class="w-full px-3 py-2 text-sm border border-surface-300 dark:border-surface-800 rounded-md bg-white dark:bg-surface-800 dark:text-surface-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-all resize-none mb-2"
                style="min-height: 2.5rem; max-height: 100px; overflow-y: auto;"
                placeholder="本格画面描述（中文）"
                @input="autoResize($event); emit('updatePanel', index, pi, { description_cn: ($event.target as HTMLTextAreaElement).value })"
              />

              <!-- 台词 -->
              <div v-if="(panel.text?.dialogues || []).length" class="mb-1 space-y-1">
                <p class="text-[11px] font-medium text-surface-400">台词</p>
                <div
                  v-for="(d, di) in panel.text?.dialogues || []"
                  :key="'d' + di"
                  class="flex items-center gap-1"
                >
                  <input
                    :value="d.speaker || ''"
                    placeholder="说话人"
                    class="w-20 px-2 py-1 text-xs border border-surface-300 dark:border-surface-800 rounded bg-white dark:bg-surface-800 dark:text-surface-200"
                    @input="updateDialogue(index, pi, panel, di, { speaker: ($event.target as HTMLInputElement).value })"
                  >
                  <input
                    :value="d.text"
                    placeholder="台词内容"
                    class="flex-1 px-2 py-1 text-xs border border-surface-300 dark:border-surface-800 rounded bg-white dark:bg-surface-800 dark:text-surface-200"
                    @input="updateDialogue(index, pi, panel, di, { text: ($event.target as HTMLInputElement).value })"
                  >
                  <select
                    :value="d.anchor || 'bottom-left'"
                    class="w-24 px-1 py-1 text-xs border border-surface-300 dark:border-surface-800 rounded bg-white dark:bg-surface-800 dark:text-surface-200"
                    @change="updateDialogue(index, pi, panel, di, { anchor: ($event.target as HTMLSelectElement).value })"
                  >
                    <option v-for="a in ANCHOR_OPTIONS" :key="a" :value="a">{{ a }}</option>
                  </select>
                  <button class="text-surface-400 hover:text-error-500 shrink-0 text-sm" @click="removeDialogue(index, pi, panel, di)">✕</button>
                </div>
              </div>
              <button class="text-[11px] text-primary-500 hover:text-primary-600 mb-1" @click="addDialogue(index, pi, panel)">+ 添加台词</button>

              <!-- 旁白 -->
              <div v-if="(panel.text?.narrations || []).length" class="mb-1 space-y-1">
                <p class="text-[11px] font-medium text-surface-400">旁白</p>
                <div v-for="(n, ni) in panel.text?.narrations || []" :key="'n' + ni" class="flex items-center gap-1">
                  <input
                    :value="n.text"
                    placeholder="旁白内容"
                    class="flex-1 px-2 py-1 text-xs border border-surface-300 dark:border-surface-800 rounded bg-white dark:bg-surface-800 dark:text-surface-200"
                    @input="emit('updatePanel', index, pi, { text: { ...(panel.text || {}), narrations: (panel.text?.narrations || []).map((x, i) => i === ni ? { ...x, text: ($event.target as HTMLInputElement).value } : x) } })"
                  >
                  <button class="text-surface-400 hover:text-error-500 shrink-0 text-sm" @click="removeNarration(index, pi, panel, ni)">✕</button>
                </div>
              </div>
              <button class="text-[11px] text-primary-500 hover:text-primary-600 mb-1" @click="addNarration(index, pi, panel)">+ 添加旁白</button>

              <!-- 拟声词 -->
              <div v-if="(panel.text?.sfx || []).length" class="mb-1 space-y-1">
                <p class="text-[11px] font-medium text-surface-400">拟声词</p>
                <div v-for="(s, si) in panel.text?.sfx || []" :key="'s' + si" class="flex items-center gap-1">
                  <input
                    :value="s.text"
                    placeholder="如：嗖！"
                    class="w-20 px-2 py-1 text-xs border border-surface-300 dark:border-surface-800 rounded bg-white dark:bg-surface-800 dark:text-surface-200"
                    @input="emit('updatePanel', index, pi, { text: { ...(panel.text || {}), sfx: (panel.text?.sfx || []).map((x, i) => i === si ? { ...x, text: ($event.target as HTMLInputElement).value } : x) } })"
                  >
                  <input
                    :value="s.rotate ?? 0"
                    type="number"
                    step="1"
                    class="w-16 px-2 py-1 text-xs border border-surface-300 dark:border-surface-800 rounded bg-white dark:bg-surface-800 dark:text-surface-200"
                    @input="emit('updatePanel', index, pi, { text: { ...(panel.text || {}), sfx: (panel.text?.sfx || []).map((x, i) => i === si ? { ...x, rotate: Number(($event.target as HTMLInputElement).value) || 0 } : x) } })"
                  >
                  <button class="text-surface-400 hover:text-error-500 shrink-0 text-sm" @click="removeSfx(index, pi, panel, si)">✕</button>
                </div>
              </div>
              <button class="text-[11px] text-primary-500 hover:text-primary-600" @click="addSfx(index, pi, panel)">+ 添加拟声词</button>
            </div>
          </div>

          <button
            class="mt-3 text-xs text-primary-500 hover:text-primary-600 border border-dashed border-primary-300 rounded-md w-full py-1.5"
            @click="emit('addPanel', index)"
          >
            + 添加一格
          </button>
        </div>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="flex gap-4">
      <button
        class="flex-1 px-6 py-3 text-surface-600 dark:text-surface-300 font-medium rounded-lg border border-surface-300 dark:border-surface-800 transition-all duration-200 flex items-center justify-center gap-2 hover:bg-surface-100 dark:hover:bg-surface-800"
        @click="emit('back')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
        <span>返回</span>
      </button>
      <button
        :disabled="scenes.length === 0"
        class="flex-1 px-6 py-3 text-white font-medium rounded-lg bg-success-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 hover:bg-success-600 active:bg-success-700"
        @click="emit('next')"
      >
        <span>开始生成图片</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </button>
    </div>
  </div>
</template>