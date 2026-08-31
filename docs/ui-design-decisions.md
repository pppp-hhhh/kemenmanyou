# UI 设计决策文档

> 基于 t1「UI视觉验收检查」反馈（总评 8.5/10），制定以下设计决策方案。
> 创建时间: 2026-08-25

---

## 一、验收结果摘要

| 维度 | 评分 | 说明 |
|------|------|------|
| 设计系统一致性 | 9/10 | 暗色模式类名混用、按钮圆角不统一 |
| 响应式设计 | 9/10 | 整体良好，workspace 左右分栏需优化移动端 |
| 暗色模式 | 9/10 | gray-800 与 neutral-800 混用 |
| 交互设计 | 8/10 | 缺少图片放大、textarea 自适应等交互 |
| 访问性 | 7/10 | 大量 icon 按钮缺少 aria-label |

---

## 二、设计决策清单（按优先级排序）

### P0 — 必须修复（影响一致性和可维护性）

#### 决策 D1: 统一暗色模式背景色

**问题**: 项目混用 `dark:bg-gray-800` 和 `dark:bg-neutral-800`，导致暗色模式下色阶不一致。

**决策**: 全部统一为 `dark:bg-neutral-800`（更中性、不偏蓝）。

**影响文件**:
- `login.vue` — `dark:bg-gray-800` → `dark:bg-neutral-800`
- `register.vue` — `dark:bg-gray-800` → `dark:bg-neutral-800`
- `index.vue` (admin) — 所有 `dark:bg-gray-800` → `dark:bg-neutral-800`
- `my-works.vue` — 同上
- `history.vue` — 同上
- `profile.vue` — 同上
- `[id].vue` (watch) — 同上
- `lessons.vue`、`works.vue`、`audit.vue`、`users.vue`、`invite-codes.vue` — 同上

**规范**:
```css
/* 统一暗色模式色阶 */
--dark-bg-page: neutral-900    /* 页面背景 */
--dark-bg-card: neutral-800    /* 卡片/面板背景 */
--dark-bg-input: neutral-700   /* 输入框/子组件背景 */
--dark-border: neutral-700     /* 边框 */
```

---

#### 决策 D2: 渐变按钮迁移到 Tailwind 配置

**问题**: 6 处按钮使用内联 `style="background: linear-gradient(...)"`，无法统一管理且不支持暗色模式自适应。

**决策**: 在 `tailwind.config.js` 中扩展渐变色，替换所有内联样式。

**tailwind.config.js 新增**:
```js
theme: {
  extend: {
    colors: {
      // ... 现有 primary 配色
    },
    backgroundImage: {
      'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    },
  },
},
```

**替换方案**:
| 原内联样式 | 新 Tailwind 类 |
|-----------|--------------|
| `style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"` | `class="bg-gradient-primary"` |
| `style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)"` | `class="bg-gradient-success"` |
| `style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)"` | `class="bg-gradient-purple"` |

**影响文件**:
- `workspace.vue` (3处)
- `add-work.vue` (1处)
- `default.vue` (1处)

---

#### 决策 D3: 统一按钮和输入框圆角

**问题**: login/register 使用 `rounded-lg`，workspace/gallery 使用 `rounded-xl`，视觉不统一。

**决策**: 全项目统一为 `rounded-xl`（12px），与 Tailwind 主题一致。

**影响文件**:
- `login.vue` — 所有 `rounded-lg` → `rounded-xl`
- `register.vue` — 所有 `rounded-lg` → `rounded-xl`
- `[id].vue` (watch) — 缩略图按钮 `rounded-lg` → `rounded-xl`

---

### P1 — 应该修复（提升交互体验）

#### 决策 D4: Workspace 场景 textarea 自适应高度

**问题**: 场景描述 textarea 固定 `rows="2"`，长文本时需要手动拖拽，体验不佳。

**决策**: 实现 textarea 自动增高，最高 200px 后出现滚动条。

**实现方案**:
```vue
<template>
  <textarea
    ref="textareaRef"
    v-model="scene.description_cn"
    :style="{ height: textareaHeight + 'px', maxHeight: '200px', overflowY: 'auto' }"
    class="w-full px-3 py-2 text-sm border border-indigo-100 dark:border-neutral-600
           rounded-xl bg-white dark:bg-neutral-800 dark:text-neutral-100
           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
           transition-all resize-none"
    placeholder="场景描述（中文）"
    @input="autoResize($event)"
    @blur="store.updateScene(index, { description_cn: scene.description_cn })"
  />
</template>

<script setup>
const textareaRef = ref()
const textareaHeight = ref(56) // 初始 ~2行高度

const autoResize = (e) => {
  const el = e.target
  el.style.height = 'auto'
  textareaHeight.value = Math.min(el.scrollHeight, 200)
}
</script>
```

---

#### 决策 D5: 工作台预览区添加图片放大功能

**问题**: workspace 右侧预览区生成的图片只能看到缩略图，无法查看细节。

**决策**: 点击图片弹出全屏 lightbox，支持缩放和左右切换。

**实现方案**:
1. 在 `workspace.vue` 中添加 lightbox modal 组件
2. 点击预览图片时打开 modal 显示大图
3. 支持鼠标滚轮缩放（0.5x ~ 3x）
4. 多场景时支持左右箭头切换
5. 按 ESC 或点击遮罩关闭

**交互流程**:
```
预览图 → 点击 → 全屏 Modal（大图 + 缩放控制）
                ├── ← 左箭头（上一张）
                ├── × 关闭按钮
                └── → 右箭头（下一张）
```

**样式规范**:
- Modal 背景: `bg-black/80 backdrop-blur-sm`
- 图片圆角: `rounded-xl`
- 关闭按钮: 右上角 `×` 图标，白色
- 切换按钮: 半透明圆角按钮
- 动画: `transition ease-out duration-200`

---

#### 决策 D6: 展示广场增加 API 错误状态

**问题**: gallery.vue 只有 loading 和 empty 状态，API 请求失败时无任何提示。

**决策**: 添加 error 状态处理。

**实现方案**:
```vue
<script setup>
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    works.value = await fetchPublicWorks()
  } catch (e) {
    error.value = '加载作品失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <!-- 错误状态 -->
  <div v-else-if="error" class="text-center py-16">
    <div class="text-6xl mb-4">⚠️</div>
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{ error }}</h3>
    <button
      class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold
             hover:bg-primary-700 transition-colors"
      @click="reload"
    >
      重新加载
    </button>
  </div>
</template>
```

---

### P2 — 建议修复（提升可访问性）

#### 决策 D7: 全面补充 aria-label

**问题**: 项目中仅 1 处 aria-label（default.vue 管理后台按钮），大量 icon 按钮缺少无障碍标签。

**决策**: 为所有无文字的 icon 按钮添加 aria-label。

**需要添加 aria-label 的位置**:

| 文件 | 按钮 | aria-label 值 |
|------|------|--------------|
| `default.vue` | 🌙/☀️ 切换 | `切换日间/夜间模式` |
| `workspace.vue` | 上移/下移/删除场景 | `上移场景`/`下移场景`/`删除场景` |
| `gallery.vue` | (无需，全部有文字) | — |
| `watch/[id].vue` | 缩略图切换 | `切换到场景 N` |

**模板示例**:
```vue
<button
  class="..."
  title="上移"
  aria-label="上移场景"
  @click="store.moveSceneUp(index)"
>
  ...
</button>
```

---

#### 决策 D8: 输入框 focus 状态统一

**问题**: login/register 使用 `focus:border-transparent`，workspace 使用 `focus:border-indigo-400`。

**决策**: 统一为 `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400`，与 workspace 一致。

**影响文件**:
- `login.vue` — 输入框 focus 样式
- `register.vue` — 输入框 focus 样式

---

## 三、实施顺序

| 阶段 | 决策 | 预估工时 | 文件数 |
|------|------|---------|-------|
| 第一阶段 | D1 暗色模式统一 | 30min | 10 |
| 第一阶段 | D3 圆角统一 | 15min | 3 |
| 第二阶段 | D2 渐变迁移 | 30min | 3 + config |
| 第二阶段 | D8 focus 统一 | 10min | 2 |
| 第三阶段 | D4 textarea 自适应 | 45min | 1 |
| 第三阶段 | D5 图片放大 | 90min | 1 |
| 第四阶段 | D6 错误状态 | 30min | 1 |
| 第四阶段 | D7 aria-label | 30min | 3 |
| **合计** | **8 项决策** | **~5h** | **~15 文件** |

---

## 四、设计规范总结

### 颜色规范
```css
/* 主色 */
--primary: #4f46e5 (indigo-600)
--primary-hover: #4338ca (indigo-700)

/* 暗色模式背景 */
--dark-page: neutral-900
--dark-card: neutral-800
--dark-input: neutral-700
--dark-border: neutral-700

/* 渐变按钮 */
--gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6)
--gradient-success: linear-gradient(135deg, #10b981, #059669)
--gradient-purple: linear-gradient(135deg, #8b5cf6, #6366f1)
```

### 圆角规范
```css
--radius-sm: 8px   (rounded-lg)  — 小组件
--radius-md: 12px  (rounded-xl)  — 卡片、按钮、输入框（默认）
--radius-lg: 16px  (rounded-2xl) — 大卡片、面板
```

### 间距规范
```css
--page-px: 1rem (sm: 1.5rem, lg: 2rem)
--card-padding: 1.25rem (p-5)
--card-gap: 1.5rem (gap-6)
```

### 交互规范
```css
--transition-fast: 150ms ease
--transition-normal: 200ms ease
--hover-lift: -2px translateY
--hover-shadow: 0 10px 25px rgba(0,0,0,0.1)
```

---

## 五、交付物

完成后需通知前端开发者（t3）以下内容：
1. `tailwind.config.js` 新增 `backgroundImage` 配置
2. 15 个 Vue 文件的样式修改
3. workspace.vue 新增 lightbox 组件逻辑
4. gallery.vue 新增 error 状态
5. 所有 icon 按钮补充 aria-label

---

*文档由 UI设计师 基于 t1 验收报告制定，供 t3 前端开发者实施参考。*
