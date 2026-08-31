import { watch } from 'vue'
import { defineStore } from 'pinia'
import type { CharacterInfo, Panel, Scene, TaskStatus, StyleType } from '~/types/api'
import { clearDraft, serializeDraft, WS_DRAFT_KEY, type WorkspaceDraft } from '~/utils/workspace-draft'
import { useAuthStore } from '~/stores/auth'
import { resolveScenePanels } from '~/utils/comic'

interface WorkspaceState {
  // 课文相关
  selectedTextId: number | null
  customText: string
  selectedStyle: StyleType

  // 场景相关
  scenes: Scene[]
  characters: CharacterInfo[]

  // 任务相关
  taskId: string | null
  taskStatus: TaskStatus | null

  // UI 状态
  isAnalyzing: boolean
  isGenerating: boolean
  progressMsg: string
}

// ---- 草稿防抖持久化（模块级单例，跨组件卸载保持） ----
const DRAFT_SAVE_DEBOUNCE_MS = 800
const DRAFT_SAVE_MAX_WAIT_MS = 3000
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null
let draftPendingSince = 0
let draftWatchInstalled = false

/** 防抖调度：静默 800ms 后落盘；持续变化时最多延迟 3s 强制落盘一次 */
function scheduleDraftSave(run: () => void) {
  const now = Date.now()
  if (!draftPendingSince) draftPendingSince = now
  if (draftSaveTimer) clearTimeout(draftSaveTimer)
  const wait = Math.max(0, Math.min(DRAFT_SAVE_DEBOUNCE_MS, DRAFT_SAVE_MAX_WAIT_MS - (now - draftPendingSince)))
  draftSaveTimer = setTimeout(() => {
    draftSaveTimer = null
    draftPendingSince = 0
    run()
  }, wait)
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    selectedTextId: null,
    customText: '',
    selectedStyle: '写实古风',
    scenes: [],
    characters: [],
    taskId: null,
    taskStatus: null,
    isAnalyzing: false,
    isGenerating: false,
    progressMsg: '',
  }),

  getters: {
    currentText: (state): string => {
      if (state.customText.trim()) {
        return state.customText
      }
      return ''
    },

    isGeneratingComplete: (state): boolean => {
      if (!state.taskStatus) return false
      return state.taskStatus.status === 'completed'
    },

    progressPercent: (state): number => {
      if (!state.taskStatus || state.taskStatus.total === 0) return 0
      return Math.round((state.taskStatus.completed / state.taskStatus.total) * 100)
    },

    currentGeneratingIndex: (state): number => {
      if (!state.taskStatus) return 0
      // 找到第一个没有生成的图片索引
      for (let i = 0; i < state.taskStatus.images.length; i++) {
        if (!state.taskStatus.images[i]?.url) return i
      }
      return state.taskStatus.completed
    },

    displayedScenes: (state): Scene[] => {
      if (!state.taskStatus || state.taskStatus.status !== 'completed') {
        // 生成未完成时，只显示到当前正在生成的那一张
        const currentIndex = state.taskStatus
          ? Math.min(state.taskStatus.completed, state.scenes.length - 1)
          : 0
        return state.scenes.slice(0, currentIndex + 1)
      }
      // 生成完成后，显示所有场景
      return state.scenes
    },

    /** panel 总数（跨场景；旧场景自动单格化） */
    totalPanels: (state): number => {
      return state.scenes.reduce((n, s) => n + resolveScenePanels(s).length, 0)
    },
  },

  actions: {
    // 重置状态
    reset() {
      this.selectedTextId = null
      this.customText = ''
      this.selectedStyle = '写实古风'
      this.scenes = []
      this.characters = []
      this.taskId = null
      this.taskStatus = null
      this.isAnalyzing = false
      this.isGenerating = false
      this.progressMsg = ''
    },

    // ---- 生成会话草稿（localStorage 本地持久化） ----

    /** 立即把当前关键状态写入草稿（分析完成 / 提交生成两个节点调用；空会话改为清稿） */
    saveDraft() {
      if (!import.meta.client) return
      try {
        const isEmpty = !this.scenes.length
          && !this.customText.trim()
          && this.selectedTextId == null
          && !this.taskId
        if (isEmpty) {
          clearDraft()
          return
        }
        const auth = useAuthStore()
        const draft = serializeDraft(
          {
            selectedTextId: this.selectedTextId,
            customText: this.customText,
            selectedStyle: this.selectedStyle,
            scenes: this.scenes,
            characters: this.characters,
            taskId: this.taskId,
            taskStatus: this.taskStatus,
          },
          auth.user?.id ?? null,
        )
        localStorage.setItem(WS_DRAFT_KEY, JSON.stringify(draft))
      }
      catch {
        // 写入失败（隐私模式 / 配额不足）：静默降级
      }
    },

    /** 把已校验的草稿注入当前 store（恢复会话），瞬态字段一律复位 */
    applyDraft(draft: WorkspaceDraft) {
      this.selectedTextId = draft.selectedTextId
      this.customText = draft.customText
      this.selectedStyle = draft.selectedStyle
      this.scenes = Array.isArray(draft.scenes) ? [...draft.scenes] : []
      this.characters = Array.isArray(draft.characters) ? [...draft.characters] : []
      this.taskId = draft.taskId
      this.taskStatus = draft.taskStatus
      this.isAnalyzing = false
      this.isGenerating = false
      this.progressMsg = ''
    },

    /** 放弃会话：清除本地草稿并重置 store */
    clear() {
      clearDraft()
      this.reset()
    },

    /**
     * 安装关键状态（课文/画风/场景/taskId/taskStatus）的 800ms 防抖持久化 watcher。
     * 幂等：重复调用不会重复安装。瞬态字段变化不触发。
     */
    initDraftPersistence() {
      if (!import.meta.client || draftWatchInstalled) return
      draftWatchInstalled = true
      watch(
        () => [this.selectedTextId, this.customText, this.selectedStyle, this.scenes, this.taskId, this.taskStatus],
        () => scheduleDraftSave(() => this.saveDraft()),
        { deep: true },
      )
    },

    // 设置课文
    setText(textId: number | null, customText: string = '') {
      this.selectedTextId = textId
      this.customText = customText
      this.scenes = []
      this.taskId = null
      this.taskStatus = null
    },

    // 设置画风
    setStyle(style: StyleType) {
      this.selectedStyle = style
    },

    // 设置场景列表
    setScenes(scenes: Scene[]) {
      this.scenes = scenes
    },

    // 设置角色注册表（analyze 返回；CharacterLock 依据）
    setCharacters(characters: CharacterInfo[]) {
      this.characters = characters
    },

    // 更新单个场景
    updateScene(index: number, scene: Partial<Scene>) {
      if (this.scenes[index]) {
        this.scenes[index] = { ...this.scenes[index], ...scene }
      }
    },

    // 添加场景
    addScene(scene: Scene) {
      this.scenes.push(scene)
    },

    // ---- panel 级操作（真漫画） ----

    /** 更新某场景内一格（含 text/layout/shot 等任意字段） */
    updatePanel(sceneIndex: number, panelIndex: number, patch: Partial<Panel>) {
      const scene = this.scenes[sceneIndex]
      const panels = resolveScenePanels(scene)
      if (scene && panels[panelIndex]) {
        const merged = { ...panels[panelIndex], ...patch }
        if (Array.isArray(scene.panels) && scene.panels.length > 0) {
          scene.panels[panelIndex] = merged
        } else {
          // 旧单格场景：升级为 panels 数组
          scene.panels = [merged]
        }
      }
    },

    /** 在场景末尾追加一格 */
    addPanel(sceneIndex: number) {
      const scene = this.scenes[sceneIndex]
      if (!scene) return
      const panels = Array.isArray(scene.panels) && scene.panels.length > 0 ? scene.panels : resolveScenePanels(scene)
      if (!Array.isArray(scene.panels) || scene.panels.length === 0) {
        // 旧场景升级：把伪单格转正并作为第 0 格
        scene.panels = [...panels]
      }
      const n = scene.panels.length
      scene.panels.push({
        id: `${scene.id || `s${sceneIndex}`}p${n}`,
        order: n,
        shot: 'medium',
        angle: 'eye',
        camera_motion: 'static',
        transition: 'scene_to_scene',
        description_cn: '',
        prompt_en: '',
        layout: { col: n % Math.max(1, scene.page?.cols || 2), row: Math.floor(n / Math.max(1, scene.page?.cols || 2)), colspan: 1, rowspan: 1 },
        text: {},
        characters: [],
        status: 'pending',
      })
    },

    /** 删除一格（保留至少一格的语义） */
    removePanel(sceneIndex: number, panelIndex: number) {
      const scene = this.scenes[sceneIndex]
      if (!scene || !Array.isArray(scene.panels) || scene.panels.length <= 1) return
      scene.panels.splice(panelIndex, 1)
      // 重排 order
      scene.panels.forEach((p, i) => { p.order = i })
    },

    /**
     * 生成结果逐格回绑：panel_id → panels[].image_url（useTaskPoll 每轮调用）。
     * 兼容旧任务（image 无 panel_id）：按 index 回绑到场景的单格占位。
     */
    bindPanelImage(panelId: string, url: string) {
      if (!url) return
      for (const scene of this.scenes) {
        const panels = Array.isArray(scene.panels) && scene.panels.length > 0 ? scene.panels : undefined
        if (panels) {
          const p = panels.find(x => x.id === panelId)
          if (p) {
            p.image_url = url
            p.status = 'completed'
            return
          }
        }
      }
    },

    /** 兼容旧任务：按任务图片下标回绑到场景（旧作品 / prompts 分支） */
    bindImageByIndex(index: number, url: string) {
      const scene = this.scenes[index]
      if (!scene || !url) return
      const panels = Array.isArray(scene.panels) && scene.panels.length > 0 ? scene.panels : resolveScenePanels(scene)
      if (panels[0]) {
        panels[0].image_url = url
        panels[0].status = 'completed'
        if (!Array.isArray(scene.panels) || scene.panels.length === 0) scene.panels = panels
      }
    },

    // 删除场景
    removeScene(index: number) {
      this.scenes.splice(index, 1)
    },

    // 上移场景
    moveSceneUp(index: number) {
      if (index > 0) {
        const temp = this.scenes[index]!
        this.scenes[index] = this.scenes[index - 1]!
        this.scenes[index - 1] = temp
      }
    },

    // 下移场景
    moveSceneDown(index: number) {
      if (index < this.scenes.length - 1) {
        const temp = this.scenes[index]!
        this.scenes[index] = this.scenes[index + 1]!
        this.scenes[index + 1] = temp
      }
    },

    // 设置任务 ID
    setTaskId(taskId: string | null) {
      this.taskId = taskId
    },

    // 更新任务状态
    setTaskStatus(status: TaskStatus | null) {
      this.taskStatus = status
    },

    // 设置分析状态
    setAnalyzing(analyzing: boolean) {
      this.isAnalyzing = analyzing
    },

    // 设置生成状态
    setGenerating(generating: boolean) {
      this.isGenerating = generating
    },

    // 设置进度消息
    setProgressMsg(msg: string) {
      this.progressMsg = msg
    },
  },
})
