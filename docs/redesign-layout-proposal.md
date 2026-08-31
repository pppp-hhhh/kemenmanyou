# 课文漫游 布局重新设计方案

> 基于用户目标分析，为每个页面设计以用户行为为核心的布局方案。
> 创建时间: 2026-08-25
> 设计原则：**布局服务于用户目标，不是为了好看。**

---

## 一、设计总纲

### 核心理念
每个页面的布局应该回答一个问题：**用户来这里做什么？** 布局的每一个元素都必须服务于用户的核心目标，去除一切不服务于目标的装饰。

### 页面优先级
1. **工作台 (workspace)** — 核心创作流程，对用户体验影响最大
2. **首页 (index)** — 第一印象，决定用户是否留下
3. **观看页 (watch/[id])** — 内容消费主入口
4. **展示广场 (gallery)** — 发现和探索
5. **我的作品 (my-works)** — 管理个人创作
6. **浏览历史 (history)** — 回访和定位
7. **登录/注册** — 快速进入
8. **管理后台 (admin)** — 运营效率

---

## 二、首页 (index.vue)

### 用户目标
**用户想知道"这个工具能做出什么效果"，并决定"要不要试试"。**

### 设计方向：作品即背景（来自用户明确反馈）

#### 当前布局 → 新布局

**当前问题**：
- 白色/渐变背景 + 居中文字 + 功能卡片 = "又一个 AI 工具"
- Hero + Features + Steps + CTA = 在"解释"产品而不是"展示"产品
- 用户看不到真实效果，需要靠文字说服

**新布局：漫画作品铺底，文字轻量叠加**

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │                                 │    │  ← 全屏/大面积漫画拼贴背景
│  │    漫 画 作 品 拼 贴            │    │     (多张作品的拼贴，略带模糊/半透明)
│  │    (3-6张精选作品)              │    │
│  │                                 │    │
│  │    ┌───────────────────┐        │    │
│  │    │  课 文 漫 游       │        │    │  ← 标题叠加在画面上
│  │    │                   │        │    │     (白色文字 + 文字阴影/暗色遮罩)
│  │    │  让课文活起来      │        │    │
│  │    │  画出你的故事      │        │    │
│  │    │                   │        │    │
│  │    │  [开始创作]        │        │    │  ← 两个 CTA 按钮
│  │    │  [浏览作品]        │        │    │
│  │    └───────────────────┘        │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ↓ 滚动后 ↓                            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  精选作品轮播                   │    │  ← 横向滚动的作品展示
│  │  ○ ○ ○ ○ ○ (指示器)            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  三步创作流程 (极简)             │    │  ← 仅保留核心流程，不占满全屏
│  │  01选课文 → 02AI分析 → 03生成   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  CTA: 立即开始你的第一幅作品     │    │  ← 底部强化转化
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### 关键变化

1. **作品拼贴背景（取代渐变背景）**
   - **为什么**：用户一进来看到"哇，这个效果"，而不是"哦，又一个 AI 工具"
   - **实现**：使用 `absolute` 定位，6 张精选作品拼贴，背景层加 `blur-sm` + `opacity-40`，暗色遮罩层确保文字可读

2. **标题和 CTA 叠加在画面上（取代居中文本区）**
   - **为什么**：减少"解释"，增加"展示"；用户在视觉冲击中做决定
   - **实现**：`z-10` 叠加层，白色文字 + `text-shadow` 或半透明暗色遮罩 `bg-black/30`

3. **去掉功能介绍卡片（或极大弱化）**
   - **为什么**：功能介绍是给"已经决定使用"的用户看的，不是给"还在犹豫"的用户
   - **实现**：将三个功能介绍（AI 分析/多画风/作品展示）压缩为一行文字或完全移除

4. **三步流程压缩为一行（取代全屏分步展示）**
   - **为什么**：流程介绍不需要占据一整屏，用户只需要快速了解"怎么用"
   - **实现**：单行横向排列，小号文字，视觉权重降低

#### 实现提示

```vue
<!-- 首页核心结构 -->
<template>
  <div class="relative h-screen overflow-hidden">
    <!-- 背景层：漫画拼贴 -->
    <div class="absolute inset-0 z-0">
      <!-- 拼贴网格 -->
      <div class="grid grid-cols-3 grid-rows-2 h-full">
        <div v-for="work in featuredWorks" :key="work.id"
             class="overflow-hidden bg-neutral-100">
          <img :src="work.thumbnail" class="w-full h-full object-cover
                      blur-[2px] opacity-60" />
        </div>
      </div>
      <!-- 暗色遮罩 -->
      <div class="absolute inset-0 bg-black/40" />
    </div>

    <!-- 内容层 -->
    <div class="relative z-10 h-full flex flex-col items-center justify-center px-4">
      <h1 class="text-5xl font-bold text-white mb-4"
          style="text-shadow: 0 2px 8px rgba(0,0,0,0.5)">
        课文漫游
      </h1>
      <p class="text-xl text-white/90 mb-8"
         style="text-shadow: 0 1px 4px rgba(0,0,0,0.3)">
        让课文活起来，画出你的故事
      </p>
      <div class="flex gap-4">
        <NuxtLink to="/workspace"
                  class="px-8 py-3 bg-primary-500 text-white rounded-lg
                         font-semibold hover:bg-primary-600 transition-colors">
          开始创作
        </NuxtLink>
        <NuxtLink to="/gallery"
                  class="px-8 py-3 bg-white/20 text-white border border-white/40
                         rounded-lg font-semibold hover:bg-white/30 transition-colors">
          浏览作品
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
```

---

## 三、工作台 (workspace.vue) — 核心页面

### 用户目标
**高效完成"课文 → 漫画"的线性创作流程，中间不迷路。**

### 设计方向：步骤引导 + 上下文感知

#### 当前布局 → 新布局

**当前问题**：
- 左右 50/50 分栏，但用户的操作是**线性**的（先选课文 → 再分析 → 再生成）
- 左侧功能区信息密度高：课文来源 + 画风选择 + 场景编辑 + 操作按钮全部堆在一起
- 用户不清楚自己在流程的哪一步
- 生成图片的等待时间，用户无事可做

**新布局：垂直步骤流 + 侧边预览**

```
┌─────────────────────────────────────────────────────┐
│  工作台                                              │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  ① 选择课文  →  ② AI 分析  →  ③ 编辑场景  →  ④ 生成图片  │  ← 步骤进度条 (sticky)
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │                      │  │  预览区              │  │
│  │  当前步骤内容         │  │                      │  │
│  │  (占据大部分宽度)     │  │  主图预览            │  │
│  │                      │  │  或                  │  │
│  │  步骤1: 课文选择      │  │  场景缩略图列表      │  │
│  │  - 选择/自定义切换    │  │  或                  │  │
│  │  - 课文列表/文本框    │  │  生成进度            │  │
│  │  - 画风选择           │  │                      │  │
│  │  - [下一步: 分析课文] │  │                      │  │
│  │                      │  │                      │  │
│  └──────────────────────┘  └──────────────────────┘  │
│           65%                       35%              │
└─────────────────────────────────────────────────────┘
```

#### 四个步骤的详细布局

**步骤 ① 选择课文**
```
┌──────────────────────────────┐  ┌──────────────────┐
│  课文来源                     │  │  预览区          │
│                              │  │                  │
│  [内置课文] [自定义文本]      │  │  (空状态提示)    │
│                              │  │  "选择课文后     │
│  ▼ 请选择课文                │  │   可预览内容"    │
│    小石潭记                  │  │                  │
│    陋室铭                    │  │                  │
│    ...                       │  │                  │
│                              │  │                  │
│  画风: [写实古风] [水墨] [插画]│  │                  │
│                              │  │                  │
│  [开始分析课文 →]             │  │                  │
└──────────────────────────────┘  └──────────────────┘
```

**步骤 ② AI 分析中**
```
┌──────────────────────────────┐  ┌──────────────────┐
│  AI 正在分析课文...           │  │  动画/进度        │
│                              │  │                  │
│  ⏳ 正在拆分场景...           │  │  (水墨晕染动画)  │
│  已识别 3/5 个场景           │  │                  │
│                              │  │                  │
│  [取消]                      │  │                  │
└──────────────────────────────┘  └──────────────────┘
```

**步骤 ③ 编辑场景**
```
┌──────────────────────────────┐  ┌──────────────────┐
│  场景列表 (5个场景)           │  │  主图预览        │
│                              │  │                  │
│  ┌────────────────────────┐  │  │  ┌──────────┐  │
│  │ ① 小石潭边，柳宗元...  │  │  │  │          │  │
│  │    prompt: A tranquil..│  │  │  │  当前场景 │  │
│  └────────────────────────┘  │  │  │  的图片   │  │
│  ┌────────────────────────┐  │  │  │          │  │
│  │ ② 水尤清冽，鱼可...    │  │  │  └──────────┘  │
│  │    prompt: Crystal...  │  │  │                  │
│  └────────────────────────┘  │  │  缩略图: [1][2]  │
│  ...                         │  │         [3][4]  │
│                              │  │         [5]     │
│  [← 返回]  [开始生成图片 →]  │  │                  │
└──────────────────────────────┘  └──────────────────┘
```

**步骤 ④ 生成图片**
```
┌──────────────────────────────┐  ┌──────────────────┐
│  正在生成图片... (3/5)        │  │  实时预览        │
│                              │  │                  │
│  场景1 ✅ 已完成              │  │  ┌──────────┐  │
│  场景2 ✅ 已完成              │  │  │ 最新生成  │  │
│  场景3 ⏳ 生成中... 67%      │  │  │ 的图片    │  │
│  场景4 ⏸️ 等待中              │  │  │          │  │
│  场景5 ⏸️ 等待中              │  │  └──────────┘  │
│                              │  │                  │
│  [取消生成]                  │  │                  │
└──────────────────────────────┘  └──────────────────┘
```

#### 关键变化

1. **步骤进度条（取代隐式流程）**
   - **为什么**：用户需要知道自己在流程的哪一步，以及还剩几步
   - **实现**：sticky 顶部步骤条，每步完成自动高亮下一步，`position: sticky; top: 0`

2. **操作区放大（65%），预览区缩小（35%）**
   - **为什么**：用户的操作注意力在左侧（选课文、编辑场景），预览是辅助
   - **实现**：`grid-cols-[2fr_1fr]`，移动端切换为上下布局

3. **每个步骤只显示当前需要的内容**
   - **为什么**：减少信息过载，降低认知负担
   - **实现**：根据 `currentStep` 切换内容组件，步骤之间用 store 管理状态

4. **生成等待时有实时反馈**
   - **为什么**：等待是焦虑的来源，实时预览减少焦虑
   - **实现**：右侧预览区实时显示最新生成的图片

#### 实现提示

```vue
<!-- 步骤进度条 -->
<div class="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
    <div v-for="(step, i) in steps" :key="i"
         class="flex items-center gap-2"
         :class="i < currentStep ? 'text-success-500' :
                 i === currentStep ? 'text-primary-500 font-semibold' :
                 'text-neutral-400'">
      <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            :class="i < currentStep ? 'bg-success-500 text-white' :
                    i === currentStep ? 'bg-primary-500 text-white' :
                    'bg-neutral-200'">
        {{ i < currentStep ? '✓' : i + 1 }}
      </span>
      <span class="hidden sm:inline">{{ step.title }}</span>
      <span v-if="i < steps.length - 1" class="text-neutral-300">→</span>
    </div>
  </div>
</div>

<!-- 步骤内容切换 -->
<div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
  <div class="space-y-4">
    <StepLessonSource v-if="currentStep === 0" />
    <StepAnalyzing v-else-if="currentStep === 1" />
    <StepEditScenes v-else-if="currentStep === 2" />
    <StepGenerating v-else-if="currentStep === 3" />
  </div>
  <div class="hidden lg:block">
    <PreviewPanel :images="currentImages" :scenes="scenes" />
  </div>
</div>
```

---

## 四、观看页 (watch/[id].vue)

### 用户目标
**沉浸式欣赏漫画作品，理解每个场景的创作意图。**

### 设计方向：全屏沉浸 + 轻量控制

#### 当前布局 → 新布局

**当前问题**：
- 左右 50/50 分栏，图片被限制在一半空间
- 场景列表占据右半部分，减少了图片的展示面积
- 用户看完一张图后，需要移动视线到右侧才能切换

**新布局：全屏图片 + 浮层控制**

```
┌─────────────────────────────────────────┐
│  ← 返回              作品标题         ⋯ │  ← 顶部导航 (半透明，悬浮)
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │                                     ││
│  │         当 前 场 景 图 片           ││  ← 图片占据几乎全部空间
│  │         (接近全屏)                  ││
│  │                                     ││
│  │                                     ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  1/5  小石潭边，柳宗元独坐...       ││  ← 底部信息栏 (半透明)
│  │  [◀ prev]              [next ▶]     ││     场景描述 + 前后切换
│  └─────────────────────────────────────┘│
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ○ ○ ● ○ ○  场景导航点                │  ← 场景指示器 (点击切换)
└─────────────────────────────────────────┘
```

#### 关键变化

1. **图片全屏展示（取代 50% 宽度）**
   - **为什么**：用户来看漫画，图片应该占据最大空间
   - **实现**：图片使用 `object-contain` 填充主区域，容器 `h-[calc(100vh-12rem)]`

2. **场景切换改为底部导航（取代右侧列表）**
   - **为什么**：用户看完图后，下一步是"看下一张"，不需要同时看到所有场景
   - **实现**：底部半透明信息栏 + 左右箭头 + 场景圆点导航

3. **场景详情可展开（取代始终可见）**
   - **为什么**：大部分时间用户只想看图，需要详情时再展开
   - **实现**：点击场景描述区域可展开完整详情（英文 prompt、课文原文等）

4. **移动端：左右滑动切换场景**
   - **为什么**：手机用户习惯滑动浏览
   - **实现**：触摸事件或 Swiper 组件，支持手势切换

#### 实现提示

```vue
<template>
  <div class="h-screen flex flex-col bg-neutral-900">
    <!-- 顶部导航 (半透明) -->
    <header class="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink to="/gallery" class="text-white/80 hover:text-white flex items-center gap-2">
          <span>←</span> 返回
        </NuxtLink>
        <h1 class="text-white font-semibold">{{ work.title }}</h1>
        <span class="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
          {{ work.style }}
        </span>
      </div>
    </header>

    <!-- 图片区域 (占据剩余空间) -->
    <div class="flex-1 flex items-center justify-center px-4 pt-16 pb-32">
      <img :src="work.images[activeScene]"
           class="max-h-full max-w-full object-contain rounded-lg"
           :alt="`场景 ${activeScene + 1}`" />
    </div>

    <!-- 底部控制栏 (半透明) -->
    <div class="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/70 to-transparent pt-8 pb-4 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <!-- 场景描述 -->
        <p class="text-white/90 text-sm mb-3 line-clamp-2">
          {{ work.scenes[activeScene]?.description_cn }}
        </p>
        <!-- 导航 -->
        <div class="flex items-center justify-center gap-4">
          <button @click="prevScene"
                  class="text-white/60 hover:text-white px-3 py-1 rounded-md hover:bg-white/10">
            ◀ 上一张
          </button>
          <!-- 场景圆点 -->
          <div class="flex gap-1.5">
            <button v-for="(_, i) in work.images" :key="i"
                    @click="activeScene = i"
                    class="w-2 h-2 rounded-full transition-all"
                    :class="i === activeScene ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'" />
          </div>
          <button @click="nextScene"
                  class="text-white/60 hover:text-white px-3 py-1 rounded-md hover:bg-white/10">
            下一张 ▶
          </button>
        </div>
        <!-- 下载按钮 -->
        <button @click="downloadCurrent"
                class="mt-3 px-4 py-1.5 text-xs text-white/70 hover:text-white border border-white/30 rounded-md hover:bg-white/10">
          下载当前图片
        </button>
      </div>
    </div>
  </div>
</template>
```

---

## 五、展示广场 (gallery.vue)

### 用户目标
**快速发现感兴趣的课文漫画作品。**

### 设计方向：瀑布流 + 沉浸式浏览

#### 当前布局 → 新布局

**当前问题**：
- 等宽卡片网格，视觉单调
- 搜索框和筛选占据大量空间
- 缺少个性化推荐

**新布局：瀑布流卡片 + 紧凑筛选**

```
┌─────────────────────────────────────────┐
│  作品展廊                                │
│  搜索: [________________] 🔍            │  ← 搜索栏紧凑
│  画风: [全部] [写实古风] [水墨] [插画]   │  ← 筛选标签行
│                                         │
│  ┌─────┐ ┌─────────┐ ┌─────┐           │
│  │     │ │         │ │     │           │  ← 瀑布流布局
│  │  图 │ │   图    │ │  图 │           │     (不同高度的卡片)
│  │  片 │ │   片    │ │  片 │           │
│  │     │ │         │ │     │           │
│  │─────│ │─────────│ │─────│           │
│  │标题 │ │ 标题    │ │标题 │           │
│  │画风 │ │ 画风    │ │画风 │           │
│  └─────┘ └─────────┘ └─────┘           │
│                                         │
│  ┌─────────┐ ┌─────┐ ┌─────────┐       │
│  │         │ │     │ │         │       │
│  │   图    │ │  图 │ │   图    │       │
│  │   片    │ │  片 │ │   片    │       │
│  │         │ │     │ │         │       │
│  │─────────│ │─────│ │─────────│       │
│  │ 标题    │ │标题 │ │ 标题    │       │
│  └─────────┘ └─────┘ └─────────┘       │
│                                         │
│  [加载更多]                              │
└─────────────────────────────────────────┘
```

#### 关键变化

1. **瀑布流布局（取代等宽网格）**
   - **为什么**：不同画风的作品有不同的最佳展示比例，瀑布流更自然
   - **实现**：CSS `columns: 3` 或 Masonry 布局库，移动端 `columns: 2`

2. **筛选栏更紧凑（取代大面积筛选区）**
   - **为什么**：筛选是低频操作，不应占据太多空间
   - **实现**：搜索框 + 画风标签同一行，移动端搜索框可收起

3. **卡片信息更丰富**
   - **为什么**：用户在广场需要更多信息来决定是否点击
   - **实现**：卡片底部增加课文来源名称、创作者、查看次数

#### 实现提示

```vue
<!-- 瀑布流容器 -->
<div class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
  <div v-for="work in filteredWorks" :key="work.id"
       class="break-inside-avoid bg-white rounded-lg border border-neutral-200
              overflow-hidden hover:shadow-md hover:border-primary-200
              transition-all cursor-pointer group">
    <NuxtLink :to="`/watch/${work.id}`">
      <div class="overflow-hidden bg-neutral-100">
        <img :src="getThumbnail(work)" :alt="work.title"
             class="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-neutral-800 truncate mb-1">{{ work.title }}</h3>
        <p v-if="work.lessonTitle" class="text-xs text-neutral-500 mb-2">{{ work.lessonTitle }}</p>
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded text-xs font-medium"
                :class="styleColors[work.style]">{{ work.style }}</span>
          <span class="text-xs text-neutral-400">{{ formatDate(work.created_at) }}</span>
        </div>
      </div>
    </NuxtLink>
  </div>
</div>
```

---

## 六、我的作品 (my-works.vue)

### 用户目标
**管理个人创作，跟踪作品审核状态。**

### 设计方向：状态优先 + 快速操作

#### 当前布局 → 新布局

**当前问题**：
- 统计卡片占据空间但用户很少看
- 作品卡片和展示广场一样，缺少管理操作

**新布局：状态分组 + 操作优先**

```
┌─────────────────────────────────────────┐
│  我的作品                    [创建新作品] │
│                                         │
│  状态: [全部(12)] [待审核(3)] [已公开(8)] [已拒绝(1)] │  ← 状态标签页
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  📋 作品标题                        ││  ← 列表视图 (更紧凑)
│  │  写实古风 · 待审核 · 2天前           ││     卡片视图可切换
│  │              [查看] [删除]           ││
│  ├─────────────────────────────────────┤│
│  │  📋 另一个作品标题                   ││
│  │  水墨风格 · 已公开 · 5天前           ││
│  │              [查看] [删除]           ││
│  └─────────────────────────────────────┘│
│                                         │
│  或切换到卡片视图:                       │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 图  │ │ 图  │ │ 图  │               │
│  │ 标题│ │ 标题│ │ 标题│               │
│  └─────┘ └─────┘ └─────┘               │
└─────────────────────────────────────────┘
```

#### 关键变化

1. **状态标签页（取代统计卡片）**
   - **为什么**：用户来这里是按状态筛选作品，不是看统计数字
   - **实现**：标签页式筛选，`v-for` 状态选项，点击切换 `filterStatus`

2. **列表视图优先（取代卡片视图）**
   - **为什么**：管理操作（查看状态、删除）在列表中更高效
   - **实现**：默认列表视图，可切换到卡片视图

3. **每行显示更多操作**
   - **为什么**：用户最常执行的操作是"查看"和"删除"
   - **实现**：每行右侧直接显示操作按钮

#### 实现提示

```vue
<!-- 状态标签页 -->
<div class="flex gap-2 mb-6 flex-wrap">
  <button v-for="status in statusOptions" :key="status.value"
          @click="filterStatus = status.value"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="filterStatus === status.value
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'">
    {{ status.label }}({{ status.count }})
  </button>
</div>

<!-- 列表视图 -->
<div class="space-y-3">
  <div v-for="work in filteredWorks" :key="work.id"
       class="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-200
              hover:shadow-sm transition-all">
    <div class="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
      <img :src="getThumbnail(work)" class="w-full h-full object-cover" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="font-medium text-neutral-800 truncate">{{ work.title }}</h3>
      <div class="flex items-center gap-2 mt-1 text-xs text-neutral-500">
        <span :class="styleColors[work.style]">{{ work.style }}</span>
        <span>{{ formatDate(work.created_at) }}</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <NuxtLink :to="`/watch/${work.id}`"
                class="px-3 py-1.5 text-sm text-neutral-600 hover:text-primary-500 rounded-md hover:bg-primary-50">
        查看
      </NuxtLink>
      <button @click="deleteWork(work)"
              class="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-md">
        删除
      </button>
    </div>
  </div>
</div>
```

---

## 七、浏览历史 (history.vue)

### 用户目标
**快速找回之前看过的漫画作品。**

### 设计方向：时间线 + 快速定位

#### 当前布局 → 新布局

**当前问题**：
- 和展示广场一样的卡片网格，缺少时间维度
- "作品已删除"的灰色状态占空间

**新布局：时间分组 + 紧凑列表**

```
┌─────────────────────────────────────────┐
│  浏览历史                                │
│                                         │
│  ── 今天 ──                             │
│  ┌─────────────────────────────────────┐│
│  │ [图] 小石潭记漫画     2小时前  [查看]││
│  │ [图] 陋室铭漫画       3小时前  [查看]││
│  └─────────────────────────────────────┘│
│                                         │
│  ── 昨天 ──                             │
│  ┌─────────────────────────────────────┐│
│  │ [图] 爱莲说漫画       昨天    [查看]││
│  │ [图] 已删除作品        昨天    [已删除]│  ← 已删除标记在行内
│  └─────────────────────────────────────┘│
│                                         │
│  ── 更早 ──                             │
│  ┌─────────────────────────────────────┐│
│  │ [图] 桃花源记漫画    3天前    [查看]││
│  └─────────────────────────────────────┘│
│                                         │
│  [加载更多]              [清空全部]      │
└─────────────────────────────────────────┘
```

#### 关键变化

1. **时间分组（取代平铺网格）**
   - **为什么**：用户回忆浏览历史是按时间来的，"昨天看过那个"
   - **实现**：按 `lastViewedAt` 分组为"今天/昨天/更早"

2. **紧凑列表视图（取代卡片网格）**
   - **为什么**：历史记录不需要大图展示，需要快速扫描
   - **实现**：每行显示缩略图 + 标题 + 时间 + 操作

3. **已删除作品标记在行内**
   - **为什么**：不需要单独显示灰色大卡片
   - **实现**：行内文字标记"已删除"，行样式变灰

#### 实现提示

```vue
<!-- 时间分组 -->
<div v-for="group in timeGroups" :key="group.label" class="mb-6">
  <div class="flex items-center gap-3 mb-3">
    <span class="text-sm font-medium text-neutral-500">── {{ group.label }} ──</span>
    <div class="flex-1 h-px bg-neutral-200" />
  </div>
  <div class="space-y-2">
    <div v-for="row in group.items" :key="row.workId"
         class="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
         :class="row.deleted ? 'opacity-50' : ''">
      <div class="w-12 h-12 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
        <img v-if="row.thumbnail" :src="row.thumbnail" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center text-neutral-400 text-xs">无图</div>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium truncate"
            :class="row.deleted ? 'text-neutral-400 line-through' : 'text-neutral-800'">
          {{ row.workTitle }}
        </h4>
        <span class="text-xs text-neutral-400">{{ formatAgo(row.lastViewedAt) }}</span>
      </div>
      <NuxtLink v-if="!row.deleted" :to="`/watch/${row.workId}`"
                class="px-3 py-1 text-sm text-neutral-500 hover:text-primary-500 rounded-md hover:bg-primary-50">
        查看
      </NuxtLink>
      <span v-else class="px-3 py-1 text-xs text-neutral-400">已删除</span>
      <button @click="removeItem(row)" class="p-1 text-neutral-400 hover:text-red-500 rounded">
        ✕
      </button>
    </div>
  </div>
</div>
```

---

## 八、登录/注册页

### 用户目标
**快速完成身份验证，开始使用。**

### 设计方向：简洁高效 + 视觉引导

#### 当前布局 → 新布局

**当前问题**：
- 登录/注册页是标准表单，缺少品牌感
- 邀请码机制需要优化

**新布局：左右分栏 — 品牌 + 表单**

```
┌─────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────────┐ │
│  │              │  │                  │ │
│  │  漫画作品    │  │  登录             │ │
│  │  (背景图)    │  │                  │ │
│  │              │  │  邮箱: [______]  │ │
│  │  课文漫游    │  │  密码: [______]  │ │
│  │  让课文      │  │                  │ │
│  │  活起来      │  │  [登录]          │ │
│  │              │  │                  │ │
│  │              │  │  还没有账号？     │ │
│  │              │  │  [注册]          │ │
│  └──────────────┘  └──────────────────┘ │
│         40%                60%          │
└─────────────────────────────────────────┘
```

#### 关键变化

1. **左侧品牌展示（取代纯白背景）**
   - **为什么**：登录页是品牌印象的一部分
   - **实现**：左侧展示精选漫画作品，带品牌标语

2. **表单更紧凑**
   - **为什么**：登录是高频操作，应该快速完成
   - **实现**：减少视觉干扰，聚焦输入框和按钮

---

## 九、管理后台 (admin/*)

### 用户目标
**高效审核内容、管理用户和系统。**

### 设计方向：仪表盘 + 快捷操作

#### 关键变化

1. **统计卡片保留但更紧凑**
   - **为什么**：管理员需要快速了解系统状态
   - **实现**：一行排列所有统计，数字突出

2. **审核列表增加批量操作**
   - **为什么**：审核是管理员最频繁的操作
   - **实现**：复选框 + 批量通过/拒绝按钮

3. **侧边栏导航（取代顶部标签）**
   - **为什么**：管理后台功能多，需要持久导航
   - **实现**：固定左侧侧边栏，当前页面高亮

---

## 十、响应式策略

### 移动端优先原则

| 页面 | 移动端策略 |
|------|-----------|
| 首页 | 全屏单图背景，文字叠加，简化为单列 |
| 工作台 | 上下布局（步骤在上，预览在下），底部固定操作按钮 |
| 观看页 | 全屏图片 + 左右滑动切换，底部半透明控制栏 |
| 展示广场 | 2列瀑布流，筛选栏可折叠 |
| 我的作品 | 列表视图，每行操作按钮简化 |
| 浏览历史 | 列表视图，时间分组 |

### 触摸优化
- 所有按钮最小触摸区域 44px
- 观看页支持左右滑动切换场景
- 工作台步骤支持左右滑动切换

---

## 十一、实施优先级

### Phase 1: 核心体验 (1-2天)
1. **工作台步骤引导** — 影响最大
2. **首页作品背景** — 第一印象

### Phase 2: 内容消费 (1天)
3. **观看页全屏沉浸** — 核心体验
4. **展示广场瀑布流** — 发现体验

### Phase 3: 管理效率 (1天)
5. **我的作品列表视图**
6. **浏览历史时间分组**

### Phase 4: 润色 (0.5天)
7. 登录/注册品牌化
8. 管理后台侧边栏
9. 移动端触摸优化

---

## 十二、组件拆分建议

| 组件 | 所属页面 | 说明 |
|------|---------|------|
| `StepProgress.vue` | 工作台 | 步骤进度条 |
| `StepLessonSource.vue` | 工作台 | 步骤1: 课文选择 |
| `StepAnalyzing.vue` | 工作台 | 步骤2: AI分析中 |
| `StepEditScenes.vue` | 工作台 | 步骤3: 场景编辑 |
| `StepGenerating.vue` | 工作台 | 步骤4: 图片生成 |
| `PreviewPanel.vue` | 工作台 | 右侧预览面板 |
| `WorkCard.vue` | 广场/我的作品 | 可复用的作品卡片 |
| `WorkListItem.vue` | 我的作品/历史 | 列表视图行 |
| `SceneNavigator.vue` | 观看页 | 场景切换控制 |
| `TimeGroup.vue` | 浏览历史 | 时间分组容器 |

---

> **设计原则回顾**：每个布局改变都回答了"为什么这样更符合用户目标"。如果一个改变无法回答这个问题，就不应该做。
