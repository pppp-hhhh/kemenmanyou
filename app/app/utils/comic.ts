// 漫画渲染共享工具 —— 与后端 server/composer.py / server/lettering.py 的布局启发式对齐
// 单一事实源：scene.page + panels[].layout/text；DOM 渲染与 PIL 导出共用同一份数据。

import type { Panel, PanelGenEntry, PanelLayout, Scene } from '~/types/api'

// ---- anchor 映射（与 server/lettering.py 的 _ANCHOR_H/_ANCHOR_V 同步）----
const ANCHOR_H: Record<string, number> = {
  left: 0, center: 0.5, right: 1,
  'top-left': 0, top: 0.5, 'top-right': 1,
  'bottom-left': 0, bottom: 0.5, 'bottom-right': 1,
}
const ANCHOR_V: Record<string, number> = {
  top: 0, center: 0.5, bottom: 1,
  'top-left': 0, left: 0.5, 'bottom-left': 1,
  'top-right': 0, right: 0.5, 'bottom-right': 1,
}

/** anchor → 归一化 (h, v) ∈ [0,1]²；非法/缺省 → null（调用方兜底 center） */
export function normalizeAnchor(
  anchor: string | { x?: number; y?: number } | undefined | null,
): [number, number] | null {
  if (anchor && typeof anchor === 'object') {
    const h = Number(anchor.x)
    const v = Number(anchor.y)
    if (Number.isFinite(h) && Number.isFinite(v)) return [h, v]
    return null
  }
  const s = String(anchor ?? '').trim().toLowerCase()
  if (!(s in ANCHOR_H)) return null
  return [ANCHOR_H[s]!, ANCHOR_V[s]!]
}

/** anchor → CSS absolute 定位（top/right/bottom/left 具体值），供格内文字层使用 */
export function anchorToStyle(
  anchor: string | { x?: number; y?: number } | undefined | null,
  panelW: number,
  panelH: number,
): Record<string, string> {
  const n = normalizeAnchor(anchor) ?? [0.5, 0.5]
  const [h, v] = n
  const style: Record<string, string> = {}
  // 横向：0 → left, 1 → right, 0.5 → left 50% (translateX(-50%))
  if (h <= 0.25) style.left = '8px'
  else if (h >= 0.75) style.right = '8px'
  else { style.left = `${Math.round(h * 100)}%`; style.transform = 'translateX(-50%)' }
  // 纵向
  if (v <= 0.25) style.top = '8px'
  else if (v >= 0.75) style.bottom = '8px'
  else { style.top = `${Math.round(v * 100)}%`; style.transform = `${style.transform ?? ''} translateY(-50%)` }
  void panelW; void panelH
  return style
}

// ---- 布局启发式（与 server/composer.py resolve_panel_size / resolve_panel_boxes 对齐）----

const PANEL_SIZE_WHITELIST = [
  '2752x1536', '1536x2752', '2048x2048', '2496x1664', '1664x2496',
  '2368x1760', '1760x2368', '2272x1824', '1824x2272', '3072x1376', '1344x3136',
]

/** layout → panel 级生成尺寸（服务端同启发式的 TS 镜像，见 design §3.3） */
export function resolvePanelSize(layout: PanelLayout | undefined, page: Scene['page'], fallback = '2048x2048'): string {
  const cols = Math.max(1, page?.cols || 2)
  const rows = Math.max(1, page?.rows || 2)
  const colspan = Math.max(1, layout?.colspan || 1)
  const rowspan = Math.max(1, layout?.rowspan || 1)
  if (colspan >= cols && rowspan === 1) return PANEL_SIZE_WHITELIST.includes('2752x1536') ? '2752x1536' : '2496x1664'
  if (rowspan >= rows) return PANEL_SIZE_WHITELIST.includes('1664x2496') ? '1664x2496' : '2048x2048'
  return PANEL_SIZE_WHITELIST.includes(fallback) ? fallback : '2048x2048'
}

function clampGrid(n: number | undefined): number {
  return Math.max(1, Math.min(6, Math.round(n || 2)))
}

/** 每个 panel 在页网格中的 CSS 位置（grid-column/row 简写），越界/冲突由调用方容错（DOM 下按顺序渲染） */
export function panelGridArea(panel: Panel, page: Scene['page']): { gridColumn: string; gridRow: string } {
  const cols = clampGrid(page?.cols)
  const rows = clampGrid(page?.rows)
  const layout = panel.layout || {}
  const col = Math.max(0, Math.min(cols - 1, Math.round(layout.col ?? 0)))
  const row = Math.max(0, Math.min(rows - 1, Math.round(layout.row ?? 0)))
  const colspan = Math.max(1, Math.min(cols - col, Math.round(layout.colspan ?? 1)))
  const rowspan = Math.max(1, Math.min(rows - row, Math.round(layout.rowspan ?? 1)))
  return {
    gridColumn: `${col + 1} / span ${colspan}`,
    gridRow: `${row + 1} / span ${rowspan}`,
  }
}

/** 阅读次序角标字符（1-20 → ①-⑳，以上用数字） */
export function orderBadgeText(order: number): string {
  const circled = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
  return order >= 1 && order <= 20 ? circled[order - 1]! : String(order)
}

/** 单格降级页布局：无 panels 的旧场景回退为 1×1（与后端 _single_panel_scene 的 page 一致）。
 *  此前前端误回退为 2×2，导致 2×2 网格只填左上角一格 → 右侧列/底部行留白。 */
export const SINGLE_PANEL_PAGE = {
  cols: 1,
  rows: 1,
  gutter_ratio: 0.02,
  reading_direction: 'ltr' as const,
  canvas_ratio: null as number | null,
}

/** 解析场景页布局：有 page 用 page（新作品）；否则（无 panels 旧场景）回退为单格 1×1。 */
export function resolveScenePage(scene: Scene): Scene['page'] {
  return scene.page ?? SINGLE_PANEL_PAGE
}

/**
 * resolveScenePanels：旧作品/降级场景 → 单格伪 panel（design §3.4 兼容契约）。
 * 无 panels 时返回 [单格 panel]，前端观看/预览/导出全部走同一入口。
 * 该伪 panel 的 layout 为 {col:0,row:0,colspan:1,rowspan:1}，配合 resolveScenePage 的 1×1 页，即满页单格。
 */
export function resolveScenePanels(scene: Scene): Panel[] {
  if (Array.isArray(scene.panels) && scene.panels.length > 0) {
    return scene.panels
  }
  const id = scene.id ? `${scene.id}p0` : 'single0'
  return [{
    id,
    order: 0,
    shot: 'medium',
    angle: 'eye',
    camera_motion: 'static',
    transition: 'none',
    description_cn: scene.description_cn || '',
    prompt_en: scene.prompt_en || '',
    layout: { col: 0, row: 0, colspan: 1, rowspan: 1 },
    text: {},
    characters: [],
    image_url: null,
    status: 'pending',
  }]
}

/** 场景序列 → panel 级生成入参（workspace 提交 generate 用；旧场景自动单格化）。
 *  携带 shot/angle：服务端逐格生成时消费镜头语言（t8 修复①）。 */
export function flattenPanelsForGenerate(scenes: Scene[]): PanelGenEntry[] {
  const entries: PanelGenEntry[] = []
  for (const scene of scenes) {
    const panels = resolveScenePanels(scene)
    for (const p of panels) {
      entries.push({
        panel_id: p.id,
        prompt_en: p.prompt_en || '',
        size: resolvePanelSize(p.layout, scene.page),
        characters: p.characters || [],
        shot: p.shot || null,
        angle: p.angle || null,
      })
    }
  }
  return entries
}

/** panel 总数（跨场景） */
export function totalPanels(scenes: Scene[]): number {
  return scenes.reduce((n, s) => n + resolveScenePanels(s).length, 0)
}