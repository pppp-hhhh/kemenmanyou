# 缺陷报告：首页双 footer 重复渲染（t1 排查结论）

> 作者：ui-investigator · 日期：2025-08-27 · 分支：frontend-v2-design（工作区含未提交修改）
> 相关任务：t1（本报告）、t2（全站扫描）、t3（修复方案汇总）、t4（落地）、t7（footer 适配页面主题）

## 1. 结论（TL;DR）

首页 `/`（`app/app/pages/index.vue`）在渲染时**同时输出两个 `<footer>`**：

1. **页内 footer**：`app/app/pages/index.vue` **L267-273**（深色玻璃风格，`bg-black/35 backdrop-blur-sm`，文案 `© 2025 课文漫游 · 让课文活起来`）。
2. **layout footer**：`app/app/layouts/default.vue` **L116-123**（浅色条风格，`bg-white dark:bg-surface-800`，文案 `课文漫游 — AI 辅助学习工具`）。

根因：index.vue **未通过 `definePageMeta` 指定或禁用 layout**，默认落入 `layouts/default.vue`；layout 自带 footer 无条件渲染于 `<main>` 之后（default.vue L116-123），而 index.vue 模板末尾（L267-273）又自写了一个页内 footer。两者都带 `mt-auto`，被各自的 flex 容器（default.vue L13 与 index.vue L97）推到页面底部，**垂直堆叠、视觉上紧挨着出现两个 footer 条**。没有 CSS 规则隐藏任何 footer（assets 下无 footer 相关样式）。

引入时机：当前 index.vue 与 default.vue 均为**未提交修改**（`git status` M）；`HEAD` 提交的 index.vue **完全没有 `<footer>`**（`git show HEAD:app/app/pages/index.vue | grep footer` 无结果）。即 frontend-v2 重设计把首页重写为深色沉浸式设计时新增了页内深色 footer，但未同步处理 layout 自带 footer，从而引入双 footer。

## 2. 证据（带行号）

### 2.1 layout footer —— `app/app/layouts/default.vue`（共 125 行）

| 行号 | 内容 |
|---|---|
| L13 | `<div class="min-h-screen flex flex-col bg-white dark:bg-surface-900">`（布局根 flex 容器） |
| L112-114 | `<main class="flex-1"><slot /></main>`（页面内容插槽） |
| L116 | `<!-- Footer -->` |
| L117 | `<footer class="bg-white dark:bg-surface-800 mt-auto border-t border-surface-300 dark:border-neutral-700">` |
| L118 | `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">` |
| L119-121 | `<p class="text-center text-neutral-500 dark:text-neutral-400 text-sm">课文漫游 — AI 辅助学习工具</p>` |
| L122-123 | `</div></footer>` |

特点：浅色主题优先（`bg-white`），深色模式变体为 `dark:bg-surface-800`；文案单行居中 **`课文漫游 — AI 辅助学习工具`**；全站所有使用 default layout 的页面共享。

### 2.2 页内 footer —— `app/app/pages/index.vue`（共 311 行）

| 行号 | 内容 |
|---|---|
| L97 | `<div class="relative flex min-h-screen flex-col overflow-hidden bg-neutral-900">`（页面根 flex 容器，深色沉浸式） |
| L267 | `<!-- 页脚 -->` |
| L268 | `<footer class="relative z-10 mt-auto border-t border-white/15 bg-black/35 backdrop-blur-sm">` |
| L269 | `<div class="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">` |
| L270 | `<p class="text-white/65 text-xs">© {{ year }} 课文漫游 · 让课文活起来</p>`（year 定义于 L71 `new Date().getFullYear()`） |
| L271 | `<p class="text-white/45 text-xs">页面插画由 SenseNova 生成 · 仅供学习交流</p>` |
| L272-273 | `</div></footer>` |

特点：深色半透明玻璃风格（`bg-black/35 backdrop-blur-sm`），白字两行两端对齐；专为深色首页设计，与 L99-112 的全屏背景图 + 黑色渐变遮罩视觉一致。

### 2.3 渲染结构与 layout 归属

- `app/app/app.vue` **L4-6**：`<NuxtLayout><NuxtPage /></NuxtLayout>` —— 所有页面都走 Nuxt layout 机制。
- `app/nuxt.config.ts`：**无** `app.defaultLayout`、**无** layout 覆盖配置（仅 routeRules 中间件，L26-31）。
- `app/app/layouts/` 下**仅** `default.vue`（及 backup），无独立首页 layout。
- `app/app/pages/index.vue` **无 `definePageMeta`**（全 pages 目录 grep `definePageMeta` 结果中无 index.vue）→ 首页默认落入 `default` layout。
- 其他页面（history.vue L4、my-works.vue L4 等）的 `definePageMeta` 只配置 `middleware: 'auth'`，同样使用 default layout；全目录 grep `<footer` 仅命中 index.vue L268 与 layouts/default.vue L117 → **页内 footer 全站唯一，双 footer 问题只出现在首页**。

### 2.4 引入时机（git 证据）

- `git status --short`：`app/app/pages/index.vue`、`app/app/layouts/default.vue` 均为 `M`（未提交）。
- `git show HEAD:app/app/pages/index.vue | grep -n footer`：**无输出**（HEAD 版首页没有 footer）。
- 最近提交：`557f35c feat(frontend): 重新设计前端为东方编辑画册美学`、`7467b27 refactor: restructure project from frontend-workspace to app`。
- 结论：双 footer 是在**未提交的 frontend-v2 重设计**中引入的回归。

## 3. 两个 footer 的重复点对比

| 维度 | layout footer（default.vue L116-123） | 页内 footer（index.vue L267-273） | 结论 |
|---|---|---|---|
| 渲染位置 | `<main>` 之后、布局根容器末尾 | 页面模板末尾（在 `<main>` 插槽内） | 同时渲染、垂直堆叠 |
| 定位 | `mt-auto`（布局 flex 底部） | `mt-auto`（页面 flex 底部） | 双双贴底，视觉紧挨 |
| 视觉风格 | 浅色条 `bg-white dark:bg-surface-800` | 深色玻璃 `bg-black/35 backdrop-blur-sm` | 与深色首页冲突（浅色条突兀） |
| 文案 | `课文漫游 — AI 辅助学习工具` | `© 2025 课文漫游 · 让课文活起来 / 页面插画由 SenseNova 生成` | 品牌名重复、功能槽位重复 |
| 作用域 | 全站共享 | 仅首页 | 职责重叠 |

## 4. 修复建议（取舍分析，供 lead-reviewer t3 定稿）

### 方案 A（推荐）：删页内 footer + layout footer 主题自适应（route-aware）

- 删除 `app/app/pages/index.vue` **L267-273** 页内 footer。
- `app/app/layouts/default.vue` footer（L116-123）增加路由感知：当 `route.path === '/'` 时使用深色玻璃样式（`bg-black/35 backdrop-blur-sm border-white/15 text-white/65` 等），其余页面保持浅色样式。
- 优点：全站唯一 footer、品牌一致；首页深色主题下 footer 依然协调，**正好满足 t7「footer 要适配页面的主题」**；改动小（2 个文件、1 个 class 条件绑定）。
- 实现方式示例：`const route = useRoute()` + `<footer :class="route.path === '/' ? '…dark…' : '…light…'">`（或按路由拆两套 class）。

### 方案 B：保留页内 footer，首页禁用 layout

- index.vue 顶部加 `definePageMeta({ layout: false })`，首页自持 header+bg+footer。
- 缺点：**丢失共享 header**（logo、导航、登录/注册/夜间模式按钮全部需要首页自建），改动面大；与全站导航一致性冲突。**不推荐**。

### 方案 C：仅删页内 footer，layout footer 保持浅色

- 最小改动，但深色首页底部出现白色条，与重度深色视觉冲突，破坏设计一致性（t7 要求 footer 适配主题）。**不推荐**。

### 结论

采用**方案 A**：删 index.vue L267-273 页内 footer，default.vue L116-123 footer 按路由 `/` 输出深色变体，其余路由保持现状。t4 落地时即按此执行。
