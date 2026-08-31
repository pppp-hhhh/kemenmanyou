# 统一修复方案：首页双 footer 消除 + footer 主题适配（t3 定稿）

> 作者：lead-reviewer · 日期：2025-08-27 · 依赖：t1（根因报告）、t2（全站扫描）、t7（主题适配）
> 下游：t4（落地）、t5（验证）、t6（评审）

## 1. 根因确认（t1+t2 一致结论）

首页 `/` 渲染时同时输出两个 footer：

1. **页内 footer**：`app/app/pages/index.vue` L272-278（深色玻璃 `bg-black/35 backdrop-blur-sm`，文案 `© {{year}} 课文漫游 · 让课文活起来`）— 注意 t1 报告写 L267-273，因 t7 在 script 顶部插入 definePageMeta 整体下移 5 行，实测现为 L272-278。
2. **layout footer**：`app/app/layouts/default.vue` L123-137（`bg-white dark:bg-surface-800`，文案 `课文漫游 — AI 辅助学习工具`，t7 后已改为 :class 双分支）。

根因链：index.vue 未声明 layout → 默认落入 default layout（app.vue L4-6 NuxtLayout+NuxtPage；layouts/ 仅 default.vue）；layout footer 无条件渲染，而 index.vue 模板末尾又自写页内 footer；两者均 `mt-auto` 被各自 flex 容器推到底部垂直堆叠。该问题由未提交的 frontend-v2 重设计引入（HEAD 版 index.vue 无 footer，git show 验证）。

**影响范围**：全站 16 个页面中，仅首页存在双 footer；其余 15 页均为「仅 layout footer」唯一状态（t2 全量扫描）。修复范围收敛为仅首页。

## 2. 定稿方案（方案 A：删页内 footer + layout footer 主题适配）

### 2.1 删除首页页内 footer（t4 执行）

- 删除 `app/app/pages/index.vue` **L272-278**（`<!-- 页脚 -->` 注释 + `<footer>` 块）。
- 同步删除 **L76** `const year = new Date().getFullYear()`（grep 确认 year 仅被页内 footer L275 使用，删除后无引用；`useSeoMeta` 等其余逻辑保留）。
- **保留** t7 已加入的 L7-9 `definePageMeta({ footerTheme: 'dark' })` —— 这是首页 layout footer 呈深色的开关，删除它就回到方案 C 的浅色冲突。

### 2.2 layout footer 主题适配（t7 已完成，t4 无需再改）

- `layouts/default.vue` script：`const isDarkFooter = computed(() => route.meta.footerTheme === 'dark')`。
- footer 模板 :class 双分支：
  - 深色页（footerTheme==='dark'）：`bg-neutral-900 border-t border-white/15` + 文字 `text-neutral-300`（实底而非半透明，避免透出布局根底色 bg-white/dark:bg-surface-900）。
  - 普通页：`bg-white dark:bg-surface-800 border-t border-surface-300 dark:border-neutral-700` + 文字 `text-neutral-500 dark:text-neutral-400`（跟随全局 dark 模式）。
- 文案统一为单行 `课文漫游 — AI 辅助学习工具`（全站唯一 footer 文案源）。

### 2.3 全站主题适配统一规则（供后续页面遵守）

| 页面类型 | 判定 | 页面声明 | footer 样式 |
|---|---|---|---|
| 永久深色主题页 | 根容器为深色且不随 dark: 切换（如沉浸式 hero/播放器） | `definePageMeta({ footerTheme: 'dark' })` | 深色实底（bg-neutral-900） |
| 普通页 | 浅色根容器 / 依赖 dark: 切换 | 不声明（默认） | 浅色卡片 + dark: 跟随 |

**已应用**：`/`（index.vue，t7 完成）、`/watch/[id]`（watch/[id].vue，t7 完成——深色播放器页）。其余 14 页（workspace/add-work/gallery/history/my-works/profile/login/register/admin 系列等）均不声明，保持浅色样式。

## 3. 边界与回归防护

1. **watch/[id].vue 高度依赖**：该页 L6/L123 按 `default layout header+footer ≈ 8rem` 用 `calc(100dvh-8rem)` 扣高。t7 深色分支与浅色分支**高度完全一致**（同 py-4 单行结构），footer 高度不变 → 无需改动该页，也不得在 t4 中改变 footer 高度/内边距。
2. **/login /register**：自带 min-h-screen 全屏布局套在 layout shell 内有轻微整页滚动（t2 观察点 a）——**非双 footer、非本方案范围**，不做改动，避免扩大回归面。
3. **header/main slot**：t4 仅删 index.vue 页内 footer，不动 default.vue header/main/root 结构；layout footer 的 :class 改动已在 t7 完成并验证。
4. **不引入新依赖**：无新 package、无新组件，仅删除与既有条件 class。

## 4. t4 可执行清单（最终）

| 序号 | 文件 | 动作 | 位置 |
|---|---|---|---|
| 1 | app/app/pages/index.vue | 删除页内 `<footer>` 块（含 `<!-- 页脚 -->` 注释） | L272-278 |
| 2 | app/app/pages/index.vue | 删除无引用变量 `const year`（可选但推荐，防死代码） | L76 |
| 3 | app/app/pages/index.vue | 保留 `definePageMeta({ footerTheme: 'dark' })` | L7-9（已存在，勿删） |
| 4 | app/app/layouts/default.vue | 无需改动（t7 已完成主题适配） | — |
| 5 | app/app/pages/watch/[id].vue | 无需改动（t7 已完成声明；footer 高度不变） | — |

## 5. 验收与验证指引

### t4 验收对照（contract）
- `首页不再同时出现两个 footer（渲染后仅一个）`：删除 L272-278 后首页仅 layout footer。
- `footer 内容/样式在全站保持一致`：全站唯一 footer 文案源=default.vue；深/浅按主题规则合理差异。
- `layout footer 与页面内容不重叠、滚动正常`：footer 高度未变，mt-auto sticky-footer 结构不变；watch 页 calc 假设保持。
- `未引入其他回归`：不碰 header/main/watch 高度/login 布局。

### t5 验证命令
- `grep -n '<footer' app/app/pages/index.vue` → **0 结果**（页内 footer 已删）。
- `grep -rn '<footer' app/app/pages/ app/app/layouts/` → 仅 default.vue L123（排除 .backup）。
- `grep -n 'year' app/app/pages/index.vue` → 0 结果（若 t4 删了 year）。
- 三个关键 SFC 过 vue/compiler-sfc parse+compileScript（default.vue / index.vue / watch/[id].vue）。
- `git diff --stat` 确认改动仅 index.vue（t7 已提交部分 + t4 删除）+ 此前 t7 的 default/watch 改动。

## 6. 取舍记录

- **方案 A（采用）**：删页内 footer + layout footer 主题适配。改动小、全站唯一 footer、兼顾 t7 主题适配，默认采取。
- 方案 B（弃）：首页 `definePageMeta({ layout: false })` 自持 header+footer——丢失共享 header/导航，改动面大。不推荐。
- 方案 C（弃）：仅删页内 footer 保持浅色 layout footer——深色首页白条冲突，违背 t7。不推荐。
