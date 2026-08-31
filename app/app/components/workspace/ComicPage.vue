<script setup lang="ts">
// ComicPage —— 真漫画页渲染（核心渲染单元）
// 设计契约：doc/design-comic-reconstruction.md §7.1
// 同一份 scene.page + panels[].layout/text 数据；DOM 渲染与服务端 PIL 导出共用布局/锚点语义。
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Panel, Scene } from '~/types/api'
import { anchorToStyle, orderBadgeText, panelGridArea, resolveScenePanels, resolveScenePage } from '~/utils/comic'

const props = withDefaults(defineProps<{
  scene: Scene
  /** panel_id -> 图片 url（生成期间由 task.images 逐格回填；缺省读 panel.image_url） */
  panelImages?: Record<string, string>
  showOrderBadge?: boolean
  /** 预览/占位场景（图片未生成）时展示深色骨架 */
  skeleton?: boolean
}>(), {
  showOrderBadge: true,
  skeleton: false,
})

const emit = defineEmits<{
  (e: 'openPanel', payload: { panel: Panel; panelIndex: number }): void
}>()

const panels = computed(() => resolveScenePanels(props.scene))
// 无 panels 的旧场景回退为单格 1×1（与后端 _single_panel_scene 一致；此前误为 2×2 → 右侧/底部留白）
const page = computed(() => resolveScenePage(props.scene))
const cols = computed(() => Math.max(1, Math.min(6, Math.round(page.value.cols ?? 2))))
const rows = computed(() => Math.max(1, Math.min(6, Math.round(page.value.rows ?? 2))))
const gutterRatio = computed(() => Math.max(0, Number(page.value.gutter_ratio ?? 0.02)))
const rtl = computed(() => page.value.reading_direction === 'rtl')

// 单格降级的旧作品：无 page 结构（→ SINGLE_PANEL_PAGE 满页 1×1）且只有一格。
// 这类作品容器比例不应硬编码为竖向 4:3（会把 16:9 横图 cover-crop 裁掉左右），
// 应跟随源图真实比例 + contain 完整显示。新作品带 page+panels 的多格布局不受影响。
const isSinglePanelFullPage = computed(() => !props.scene.page && panels.value.length === 1)

// 单格满页：读取加载后的 <img> 原生高宽比（高/宽）驱动容器 aspect-ratio；未加载时用 canvas_ratio 兜底。
const naturalRatio = ref<number | null>(null) // 高/宽 = 源图 nativeHeight / nativeWidth
const handleImgLoad = (e: Event) => {
  const el = e.target as HTMLImageElement
  if (el.naturalWidth > 0 && el.naturalHeight > 0) {
    naturalRatio.value = el.naturalHeight / el.naturalWidth
  }
}
// 图片 URL 变化时重置自然比例，避免加载新图前沿用旧比例导致闪跳
const singleImageUrl = computed(() => (isSinglePanelFullPage.value
  ? (props.panelImages?.[panels.value[0]!.id] || panels.value[0]!.image_url || '')
  : ''))
watch(singleImageUrl, () => { naturalRatio.value = null })

// 页 aspect-ratio（高/宽）：与服务端 page_canvas_size 同公式，CSS 取倒数。
// 单格满页时优先用源图真实（高/宽）比，避免硬编码 0.75 竖盒裁掉 16:9 横图。
const aspectRatio = computed(() => {
  if (isSinglePanelFullPage.value && naturalRatio.value) {
    return Math.max(0.3, 1 / naturalRatio.value)
  }
  const c = page.value.canvas_ratio ?? ((rows.value / cols.value) * (4 / 3))
  return Math.max(0.3, 1 / c)
})

// 单格满页图片用 contain（完整显示、不裁切）；多格 cover-crop（漫画格正常裁切）保持不变。
const panelImgClass = computed(() => isSinglePanelFullPage.value ? 'panel-img--contain' : '')

// gutter = ratio × 容器宽（ResizeObserver 实时计算，与后端比例化一致）
const rootEl = ref<HTMLElement | null>(null)
const gutterPx = ref(4)
let ro: ResizeObserver | null = null
const applySize = () => {
  if (!rootEl.value) return
  gutterPx.value = Math.max(2, Math.round(gutterRatio.value * rootEl.value.clientWidth))
  rootEl.value.style.setProperty('--gutter', `${gutterPx.value}px`)
}
onMounted(() => {
  applySize()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(applySize)
    if (rootEl.value) ro.observe(rootEl.value)
  }
})
onBeforeUnmount(() => { ro?.disconnect(); ro = null })

// 格内图片 URL：panelImages 优先（逐格回绑），其次 panel.image_url（已保存作品/导出页）
const panelImageUrl = (panel: Panel) => {
  return props.panelImages?.[panel.id] || panel.image_url || ''
}

const sfxFontSize = (size?: string) => {
  if (size === 'small') return '1.1rem'
  if (size === 'large') return '2.4rem'
  return '1.7rem'
}
</script>

<template>
  <div
    ref="rootEl"
    class="comic-page"
    :class="{ 'comic-page--rtl': rtl }"
    :style="{
      '--cols': cols,
      '--rows': rows,
      '--gutter': gutterPx + 'px',
      aspectRatio: aspectRatio,
      direction: rtl ? 'rtl' : 'ltr',
    }"
  >
    <div
      v-for="(panel, i) in panels"
      :key="panel.id || i"
      class="panel"
      :style="panelGridArea(panel, page)"
      @click="emit('openPanel', { panel, panelIndex: i })"
    >
      <!-- 图片 / 骨架 / 失败占位 -->
      <img
        v-if="!skeleton && panelImageUrl(panel)"
        :src="panelImageUrl(panel)"
        :alt="panel.description_cn || '漫画格'"
        loading="lazy"
        decoding="async"
        class="panel-img"
        :class="panelImgClass"
        @load="handleImgLoad"
      >
      <div
        v-else-if="skeleton"
        class="panel-placeholder panel-placeholder--skeleton"
      >{{ panel.shot || '格' }}</div>
      <div
        v-else-if="panel.status === 'failed'"
        class="panel-placeholder"
      >本格生成失败</div>
      <div v-else class="panel-placeholder">{{ panel.description_cn || '' }}</div>

      <!-- 阅读次序角标 -->
      <span
        v-if="showOrderBadge && panels.length > 1"
        class="order-badge"
      >{{ orderBadgeText((panel.order ?? i) + 1) }}</span>

      <!-- 文字层：台词/旁白/拟声词（程序化叠加；数据与后端口径一致） -->
      <template v-if="panel.text">
        <div
          v-for="(b, bi) in panel.text.dialogues || []"
          :key="'d' + bi"
          class="text-layer speech-bubble"
          :class="b.type === 'thought' ? 'speech-bubble--thought' : ''"
          :style="anchorToStyle(b.anchor, 0, 0)"
        >
          <span v-if="b.speaker" class="speaker">{{ b.speaker }}</span>
          <span>{{ b.text }}</span>
        </div>
        <div
          v-for="(n, ni) in panel.text.narrations || []"
          :key="'n' + ni"
          class="text-layer narration-box"
          :style="anchorToStyle(n.anchor, 0, 0)"
        >{{ n.text }}</div>
        <div
          v-for="(s, si) in panel.text.sfx || []"
          :key="'s' + si"
          class="text-layer sfx-text"
          :style="{
            ...anchorToStyle(s.anchor, 0, 0),
            fontSize: sfxFontSize(s.size),
            transform: `${anchorToStyle(s.anchor, 0, 0).transform ?? ''} rotate(${s.rotate ?? 0}deg)`,
          }"
        >{{ s.text }}</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.comic-page {
  position: relative;
  width: 100%;
  max-height: 100%;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: var(--gutter);
  background: #fff;
  border: 2px solid #000;
  padding: 0;
}
.comic-page--rtl {
  direction: rtl;
}

.panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  background: #eee;
  border: 2px solid #000;
  overflow: hidden;
  cursor: pointer;
}
.panel-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;   /* 与后端 PIL cover-crop 语义一致 */
  display: block;
}
/* 单格满页（旧作品降级）：完整显示源图、不裁切（容器比例已跟随源图真实比例） */
.panel-img--contain {
  object-fit: contain;
}
.panel-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: #9ca3af;
  font-size: 0.75rem;
  text-align: center;
  background: #f3f4f6;
}
.panel-placeholder--skeleton {
  background:
    repeating-linear-gradient(45deg, #e5e7eb 0 8px, #f3f4f6 8px 16px);
  color: #6b7280;
  font-weight: 600;
  letter-spacing: 0.08em;
}

/* ---- 阅读次序角标 ---- */
.order-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 5;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #dc2626;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0 0 2px #fff, 0 1px 3px rgb(0 0 0 / 0.4);
  user-select: none;
}

/* ---- 文字层（数据与 server/lettering.py 口径一致，几何近似，字体/亚像素差异接受）---- */
.text-layer {
  position: absolute;
  z-index: 6;
  max-width: 85%;
  max-height: 80%;
  overflow: hidden;
  pointer-events: none;
}
.speech-bubble {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 14px;
  padding: 6px 10px;
  font-size: 0.85rem;
  line-height: 1.3;
  color: #000;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
}
.speech-bubble::after {
  content: '';
  position: absolute;
  left: 18px;
  bottom: -9px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  transform: rotate(45deg);
}
.speech-bubble--thought {
  border-radius: 24px;
  border-style: dashed;
}
.speech-bubble--thought::after {
  display: none;
}
.speech-bubble .speaker {
  font-size: 0.68rem;
  color: #6b7280;
}
.narration-box {
  background: #fffaf0;
  border: 2px solid #000;
  padding: 4px 8px;
  font-size: 0.78rem;
  line-height: 1.35;
  color: #000;
}
.sfx-text {
  font-weight: 900;
  color: #fff;
  text-shadow:
    -2px -2px 0 #000, 2px -2px 0 #000,
    -2px 2px 0 #000, 2px 2px 0 #000,
    0 -2px 0 #000, 0 2px 0 #000,
    -2px 0 0 #000, 2px 0 0 #000;
  white-space: nowrap;
  letter-spacing: 0.05em;
  line-height: 1;
}
</style>