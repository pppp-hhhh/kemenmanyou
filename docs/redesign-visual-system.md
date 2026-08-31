# 课文漫游 UI 重新设计方案

> 基于 UX 审计报告，制定全新视觉体系，去除 AI 生成感，建立「语文·教育·漫画」独特视觉语言。
> 创建时间: 2026-08-25

---

## 一、设计目标

1. **去 AI 化**：消除典型 AI SaaS 风格（indigo gradient、过度圆角、emoji 图标、厚重阴影）
2. **文化融合**：建立与中国语文教育、传统艺术、漫画形式相关的视觉语言
3. **教育专业感**：界面应像精心设计的教材或漫画书，而非通用工具
4. **清晰层级**：提升信息可读性与视觉引导
5. **深色模式**：保持并优化深色模式体验

---

## 二、色彩体系

### 2.1 主色板（中国传统色）

| 角色 | 颜色名称 | 色值 | Tailwind 类 | 用途 |
|------|----------|------|-------------|------|
| **主色** | 朱砂红 | `#C23B22` | `primary-500` | 主要按钮、标题、重要元素 |
| **辅色** | 石青 | `#2C5F7C` | `secondary-500` | 链接、次要按钮、辅助信息 |
| **强调色** | 藤黄 | `#E8B004` | `accent-500` | 徽章、提示、高亮 |
| **暖棕** | 赭石 | `#955539` | `earth-500` | 选中态、边框强调、装饰 |
| **成功色** | 松花绿 | `#3B7A57` | `success-500` | 成功状态、确认 |
| **警告色** | 琥珀橙 | `#D4652F` | `warning-500` | 警告、需注意 |
| **错误色** | 胭脂 | `#E84057` | `error-500` | 错误、删除 |

### 2.2 中性色阶（宣纸色调）

| 色阶 | 浅色模式 | 深色模式 | 用途 |
|------|----------|----------|------|
| 50 | `#FAFAF7` (宣纸白) | `#2D2B26` (淡墨) | 页面背景 |
| 100 | `#F5F4EF` (生宣) | `#3A3833` (淡浓墨) | 卡片/面板背景 |
| 200 | `#EDECE6` (熟宣) | `#3A3833` | 输入框背景 |
| 300 | `#E0DFD8` (宣纸边) | `#4A4840` | 边框、禁用状态 |
| 400 | `#A8A898` (墨淡) | `#6B6B60` | 占位文本 |
| 500 | `#6B6B5C` (墨中) | `#9A9A9A` | 次要文本 |
| 600 | `#4A4A3C` (墨浓) | `#B8B8B0` | 正文文本 |
| 700 | `#2E2E22` (焦墨) | `#D0CFC8` | 标题文本 |
| 800 | `#1A1A10` (浓墨) | `#E0DFD8` | 强调文本 |
| 900 | `#0A0A00` (极浓) | `#F0F0EA` | 标题（深色模式） |

### 2.3 渐变（去除过度渐变）

仅保留一处装饰性渐变：
```css
/* 水墨晕染效果 - 用于 Hero 背景 */
background: linear-gradient(135deg, #FAFAF5 0%, #F5F5EB 50%, #E8E8DC 100%);
dark: linear-gradient(135deg, #1A1A1A 0%, #242424 50%, #2E2E2E 100%);
```

### 2.4 Tailwind 配置

> 已落地到 `tailwind.config.js`，见实际文件。

```js
// tailwind.config.js（已实施）
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          50:  '#FAFAF7',  // 页面底色（宣纸白）
          100: '#F5F4EF',  // 卡片/面板背景（生宣）
          200: '#EDECE6',  // 输入框/分隔区域（熟宣）
          300: '#E0DFD8',  // 边框、分割线
          800: '#3A3833',  // 深色卡片背景（淡浓墨）
          900: '#2D2B26',  // 深色页面底色（淡墨）
          950: '#252320',  // 深色最底层
        },
        primary: {
          50:  '#FEF2F0',
          100: '#FDDDD8',
          200: '#FAB AAC',
          300: '#F59080',
          400: '#E8645A',
          500: '#C23B22',  // 朱砂红
          600: '#A9321D',
          700: '#8F2918',
          800: '#752113',
          900: '#5C190E',
        },
        secondary: { /* 石青 */ },
        accent: { /* 藤黄 */ },
        earth: {
          50:  '#FBF6F1',  // 微暖背景
          100: '#F0E4D8',  // 选中/高亮背景
          200: '#DEC8AD',  // 边框强调
          300: '#C9AA82',  // 次要边框
          400: '#B08D5C',  // 图标/装饰
          500: '#955539',  // 赭石主色
          600: '#7A4430',  // 深色变体
          700: '#5E3425',  // 文字/图标深色
        },
        success: { /* 松花绿 */ },
        warning: { /* 琥珀橙 */ },
        error: { /* 胭脂 */ },
      },
      backgroundImage: {
        'wash-xuan': 'linear-gradient(135deg, #FAFAF7 0%, #F5F4EF 50%, #EDECE6 100%)',
        'wash-xuan-dark': 'linear-gradient(135deg, #2D2B26 0%, #3A3833 50%, #252320 100%)',
      },
    },
  },
}
```

---

## 三、圆角体系

### 3.1 原则
- **告别过度圆角**：移除 `rounded-2xl`（16px），统一使用更克制的圆角
- **功能区分**：不同组件使用不同圆角层级
- **传统美学**：参考中国传统器物的柔和边角（非完美圆角）

### 3.2 圆角规范

| 层级 | 类名 | 像素值 | 适用场景 |
|------|------|--------|----------|
| **无圆角** | `rounded-none` | 0px | 分隔线、全宽元素 |
| **微圆角** | `rounded` | 4px | 标签、徽章、小按钮 |
| **小圆角** | `rounded-md` | 6px | 输入框、下拉菜单 |
| **中圆角** | `rounded-lg` | 8px | 卡片、对话框、主要按钮 |
| **大圆角** | `rounded-xl` | 12px | 大卡片、面板、模态框 |

### 3.3 应用示例
```css
/* 按钮 */
.btn-primary { @apply rounded-lg; }        /* 8px */
.btn-secondary { @apply rounded-md; }      /* 6px */
.btn-icon { @apply rounded-full; }         /* 圆形 */

/* 卡片 */
.card { @apply rounded-lg; }               /* 8px */
.card-large { @apply rounded-xl; }         /* 12px */

/* 输入框 */
.input { @apply rounded-md; }              /* 6px */
.textarea { @apply rounded-md; }           /* 6px */

/* 导航 */
.nav-item { @apply rounded-md; }           /* 6px */
.dropdown { @apply rounded-lg; }           /* 8px */
```

---

## 四、阴影体系

### 4.1 原则
- **减轻阴影**：移除 `shadow-lg`、`shadow-xl` 等厚重阴影
- **层次分明**：仅在必要时使用阴影，强调层级关系
- **深色模式优化**：深色模式减少或去除阴影

### 4.2 阴影层级

| 层级 | 类名 | 用途 | 深色模式 |
|------|------|------|----------|
| **无阴影** | `shadow-none` | 平面元素 | 同 |
| **微阴影** | `shadow-sm` | 悬浮按钮、激活状态 | `shadow-none` |
| **小阴影** | `shadow` | 卡片默认状态 | `shadow-none` |
| **中阴影** | `shadow-md` | 悬浮卡片、下拉菜单 | `shadow-none` |

### 4.3 自定义阴影（Tailwind 扩展）
```js
// tailwind.config.js
boxShadow: {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  'dark': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
  'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
}
```

---

## 五、间距与排版规范

### 5.1 间距系统（基于 4px 网格）
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### 5.2 页面间距
```css
/* 页面内容区域 */
.page-padding { @apply px-4 sm:px-6 lg:px-8; }

/* 卡片内边距 */
.card-padding { @apply p-5; }          /* 20px */
.card-padding-lg { @apply p-6; }       /* 24px */

/* 元素间距 */
.gap-sm { @apply gap-3; }              /* 12px */
.gap-md { @apply gap-4; }              /* 16px */
.gap-lg { @apply gap-6; }              /* 24px */
.gap-xl { @apply gap-8; }              /* 32px */
```

### 5.3 排版规范

#### 字体栈
```css
/* 标题字体（书法感） */
--font-heading: 'Noto Serif SC', 'STSong', 'SimSun', serif;

/* 正文字体（清晰易读） */
--font-body: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

/* 代码/等宽字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

#### 字号系统
```css
--text-xs: 0.75rem;    /* 12px - 辅助文本 */
--text-sm: 0.875rem;   /* 14px - 次要文本 */
--text-base: 1rem;     /* 16px - 正文 */
--text-lg: 1.125rem;   /* 18px - 强调文本 */
--text-xl: 1.25rem;    /* 20px - 小标题 */
--text-2xl: 1.5rem;    /* 24px - 标题 */
--text-3xl: 1.875rem;  /* 30px - 页面标题 */
--text-4xl: 2.25rem;   /* 36px - Hero 标题 */
--text-5xl: 3rem;      /* 48px - 大标题 */
```

#### 行高
```css
--leading-tight: 1.25;   /* 标题 */
--leading-normal: 1.5;   /* 正文 */
--leading-relaxed: 1.625; /* 长文本 */
```

---

## 六、组件风格指南

### 6.1 按钮

#### 主要按钮
```html
<button class="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg
               hover:bg-primary-600 active:bg-primary-700
               transition-colors duration-150
               shadow-sm hover:shadow-md">
  开始创作
</button>
```

#### 次要按钮
```html
<button class="px-6 py-2.5 bg-white text-secondary-500 font-medium rounded-lg
               border border-secondary-200
               hover:bg-secondary-50 active:bg-secondary-100
               transition-colors duration-150">
  浏览作品
</button>
```

#### 文字按钮
```html
<button class="px-4 py-2 text-primary-500 font-medium rounded-md
               hover:bg-primary-50 active:bg-primary-100
               transition-colors duration-150">
  了解更多
</button>
```

#### 图标按钮
```html
<button class="p-2 text-neutral-500 rounded-md
               hover:bg-neutral-100 hover:text-neutral-700
               active:bg-neutral-200
               transition-colors duration-150"
        aria-label="设置">
  <svg class="w-5 h-5">...</svg>
</button>
```

### 6.2 卡片

#### 基础卡片
```html
<div class="bg-white rounded-lg border border-neutral-200
            shadow-sm hover:shadow-md transition-shadow duration-200">
  <div class="p-5">
    <h3 class="text-lg font-semibold text-neutral-800 mb-2">卡片标题</h3>
    <p class="text-neutral-600 text-sm leading-relaxed">卡片内容描述</p>
  </div>
</div>
```

#### 交互卡片
```html
<div class="bg-white rounded-lg border border-neutral-200
            shadow-sm hover:shadow-md hover:border-primary-200
            transition-all duration-200 cursor-pointer
            group">
  <div class="p-5">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 rounded-md bg-primary-50 flex items-center justify-center
                  group-hover:bg-primary-100 transition-colors">
        <svg class="w-5 h-5 text-primary-500">...</svg>
      </div>
      <h3 class="font-semibold text-neutral-800">交互卡片</h3>
    </div>
    <p class="text-neutral-600 text-sm">悬浮时会有微妙的视觉反馈</p>
  </div>
</div>
```

### 6.3 输入框

#### 文本输入框
```html
<input type="text"
       class="w-full px-4 py-2.5 bg-white text-neutral-800
              border border-neutral-300 rounded-md
              placeholder:text-neutral-400
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-neutral-100 disabled:text-neutral-500
              transition-colors duration-150"
       placeholder="请输入课文标题" />
```

#### 文本域
```html
<textarea rows="3"
          class="w-full px-4 py-2.5 bg-white text-neutral-800
                 border border-neutral-300 rounded-md
                 placeholder:text-neutral-400
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                 resize-none"
          placeholder="请输入课文内容"></textarea>
```

### 6.4 导航

#### 导航栏
```html
<nav class="bg-white border-b border-neutral-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
          <img src="/logo.png" alt="课文漫游" class="h-6 w-auto">
        </div>
        <span class="text-xl font-bold text-neutral-800" style="font-family: var(--font-heading)">
          课文漫游
        </span>
      </a>

      <!-- 导航链接 -->
      <div class="flex items-center gap-1">
        <a href="/workspace"
           class="px-4 py-2 text-neutral-600 font-medium rounded-md
                  hover:text-primary-500 hover:bg-primary-50
                  transition-colors duration-150">
          工作台
        </a>
        <a href="/gallery"
           class="px-4 py-2 text-neutral-600 font-medium rounded-md
                  hover:text-primary-500 hover:bg-primary-50
                  transition-colors duration-150">
          展示广场
        </a>
      </div>
    </div>
  </div>
</nav>
```

### 6.5 徽章/标签
```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium bg-primary-100 text-primary-700">
  写实古风
</span>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium bg-secondary-100 text-secondary-700">
  水墨风格
</span>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full
             text-xs font-medium bg-accent-100 text-accent-700">
  彩色插画
</span>
```

### 6.6 赭石暖棕用法
```html
<!-- 选中态背景 -->
<div class="bg-earth-50 dark:bg-earth-700/20 border border-earth-200 dark:border-earth-700/30 rounded-lg">
  课文选中项
</div>

<!-- 分隔线/边框强调 -->
<div class="border-b border-earth-200 dark:border-earth-700/30"></div>

<!-- 导航 active 态 -->
<a class="text-earth-600 dark:text-earth-300 bg-earth-50 dark:bg-earth-700/20 rounded-md">
  当前页面
</a>
```

---

## 七、文案风格指南

### 7.1 原则
- **人性化**：使用自然、温暖的中文，避免机械感
- **教育语境**：采用教育工作者熟悉的表达
- **简洁明确**：减少冗余修饰，突出核心信息
- **避免 AI 腔调**：不使用"赋能"、"助力"、"一站式"等过度营销词汇

### 7.2 文案对比

| 位置 | 当前 AI 风格 | 新风格 |
|------|--------------|--------|
| **Hero 标题** | "AI 智能分析，赋能语文学习" | "让课文活起来，画出你的故事" |
| **功能描述** | "一站式课文漫画创作体验" | "三步完成：选课文 → 生成漫画 → 分享作品" |
| **按钮文案** | "立即开始创作" | "开始创作" |
| **导航** | "展示广场" | "作品展廊" |
| **错误提示** | "加载失败，请稍后重试" | "页面加载失败，点击重试" |
| **空状态** | "暂无作品" | "还没有作品，开始创作第一幅吧" |

### 7.3 文案模板

#### 页面标题
```
[动作] + [对象]
例：创作漫画 / 浏览作品 / 管理课文
```

#### 功能描述
```
[核心功能]，[价值/结果]
例：AI 分析课文场景，自动生成对应漫画
```

#### 按钮文案
```
[动词] + [可选对象]
例：开始创作 / 浏览作品 / 保存草稿
```

---

## 八、页面改造要点

### 8.1 首页 (index.vue)

#### 当前问题
- 过度使用 `bg-gradient-to-b from-indigo-50 to-white`
- emoji 图标（🤖🎨📖）
- `rounded-2xl` 卡片
- `shadow-lg shadow-primary-600/25` 厚重阴影

#### 改造要点
1. **Hero 区域**
   - 移除 indigo 渐变，使用水墨晕染背景
   - 标题使用书法字体，副标题使用正文字体
   - 按钮改为 `rounded-lg`，移除 `shadow-lg`
   - 添加传统装饰元素（水墨纹理、云纹边框）

2. **功能特点**
   - 移除 emoji，改用 SVG 图标（毛笔、卷轴、画框）
   - 卡片改为 `rounded-lg`，移除 `shadow-sm`
   - 背景色使用宣纸色调

3. **使用流程**
   - 步骤指示器改为传统印章样式
   - 连接线改为毛笔笔触

4. **底部 CTA**
   - 简化文案，减少营销感
   - 按钮样式统一

#### 关键 Tailwind 替换
```css
/* 旧 */
bg-gradient-to-b from-indigo-50 to-white
dark:from-gray-800 dark:to-gray-900

/* 新 */
bg-neutral-50 dark:bg-neutral-900
```

### 8.2 工作台 (workspace.vue)

#### 当前问题
- indigo 色系的 focus ring
- `rounded-xl` 输入框
- 渐变按钮

#### 改造要点
1. **颜色替换**
   - `text-indigo-600` → `text-primary-500`
   - `border-indigo-100` → `border-neutral-200`
   - `focus:ring-indigo-500` → `focus:ring-primary-500`

2. **组件简化**
   - 按钮 `rounded-xl` → `rounded-lg`
   - 输入框 `rounded-xl` → `rounded-md`
   - 卡片 `rounded-2xl` → `rounded-lg`

3. **交互优化**
   - 实现 textarea 自适应高度（决策 D4）
   - 添加图片放大功能（决策 D5）
   - 优化场景拖拽交互

### 8.3 展示广场 (gallery.vue)

#### 当前问题
- 卡片 `rounded-2xl`
- 缺少错误状态

#### 改造要点
1. **卡片布局**
   - 改为瀑布流或网格布局
   - 卡片 `rounded-lg`，移除 `shadow-sm`
   - 添加作品分类标签

2. **状态处理**
   - 添加 API 错误状态（决策 D6）
   - 优化空状态设计

3. **交互细节**
   - 卡片悬浮效果：轻微上浮 + 边框变色
   - 作品预览：点击放大查看

### 8.4 登录/注册 (login.vue, register.vue)

#### 当前问题
- `dark:bg-gray-800` 与项目不一致
- `rounded-lg` 按钮
- 缺少 focus ring

#### 改造要点
1. **样式统一**
   - `dark:bg-gray-800` → `dark:bg-neutral-800`
   - 按钮 `rounded-lg` → `rounded-lg`（保持）
   - 输入框添加 `focus:ring-2 focus:ring-primary-500`

2. **视觉优化**
   - 添加传统纹样装饰
   - 优化表单间距
   - 改进错误提示样式

### 8.5 管理后台 (admin/*)

#### 当前问题
- 混用 `dark:bg-gray-800`
- 缺少 aria-label

#### 改造要点
1. **样式清理**
   - 统一 `dark:bg-neutral-800`
   - 为所有图标按钮添加 `aria-label`

2. **布局优化**
   - 改进表格样式
   - 优化操作按钮分组
   - 添加批量操作界面

---

## 九、实施计划

### 9.1 阶段一：基础系统（1-2天）
1. 更新 `tailwind.config.js` 配置
2. 创建 CSS 变量文件
3. 更新全局样式

### 9.2 阶段二：组件改造（2-3天）
1. 按钮组件改造
2. 卡片组件改造
3. 输入框组件改造
4. 导航组件改造

### 9.3 阶段三：页面改造（3-4天）
1. 首页重新设计
2. 工作台优化
3. 展示广场改造
4. 登录/注册页面改造
5. 管理后台清理

### 9.4 阶段四：细节打磨（1-2天）
1. 交互效果优化
2. 动画过渡完善
3. 响应式调整
4. 深色模式测试

---

## 十、验收标准

1. **视觉一致性**：所有页面使用统一的色彩、圆角、阴影体系
2. **AI 感消除**：无 indigo gradient、无过度圆角、无 emoji 图标、无厚重阴影
3. **文化融合**：体现中国语文教育特色，有传统美学元素
4. **可访问性**：所有交互元素有适当标签，对比度符合标准
5. **响应式**：在移动设备上体验良好
6. **深色模式**：色彩协调，可读性良好

---

*文档由 design-lead 基于项目分析制定，供团队实施参考。*

---

## 附录：已实施的文件

> 以下文件已落地到代码中，可直接使用。

### 色彩配置文件

| 文件 | 用途 |
|------|------|
| `app/tailwind.config.js` | Tailwind 颜色 token（surface/primary/secondary/accent + 阴影 + 字体） |
| `app/app/assets/css/main.css` | CSS 变量（:root + .dark）+ 通用组件类（.card .btn-primary .input 等） |
| `app/app/utils/colors.ts` | JS 常量（styleColors/reviewStatusColors）+ 工具函数（formatDate/getThumbnail） |
| `app/app/composables/useThemeColors.ts` | Vue Composable，提供 styleBadge/reviewBadge 等方法 |

### 在页面中使用

```vue
<script setup>
// 统一引入，不再重复定义
const { styleBadge, reviewBadge, reviewLabel, formatDate, getThumbnail } = useThemeColors()
</script>

<template>
  <!-- 画风标签 -->
  <span :class="['badge', styleBadge(work.style)]">{{ work.style }}</span>

  <!-- 审核状态 -->
  <span :class="['badge', reviewBadge(work.review_status)]">
    {{ reviewLabel(work.review_status) }}
  </span>

  <!-- 日期 -->
  <span>{{ formatDate(work.created_at) }}</span>

  <!-- 通用组件类 -->
  <div class="card card-hover">...</div>
  <button class="btn-primary">开始创作</button>
  <button class="btn-secondary">浏览作品</button>
  <input class="input" placeholder="请输入" />
</template>
```