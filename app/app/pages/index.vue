<script setup lang="ts">
const features = [
  {
    cn: '析',
    title: 'AI 智能析文',
    latin: 'Analysis',
    desc: 'DeepSeek 大模型自动解析课文脉络，拆分为多个连贯漫画场景，精准捕捉文章意境与情感。',
  },
  {
    cn: '绘',
    title: '三派画风绘景',
    latin: 'Painting',
    desc: '写实古风、水墨风格、彩色插画三派画风。ComfyUI 配合 SD 模型即时生成富有韵致的漫画画面。',
  },
  {
    cn: '展',
    title: '画册展示广场',
    latin: 'Exhibit',
    desc: '将生成的作品保存并分享至展示广场，与同好者共同赏鉴、交流、再创作，衍为社群画册。',
  },
]

const steps = [
  {
    cn: '一',
    title: '择 文',
    latin: 'I.  Select',
    desc: '从内置课文库中选取一篇，或自输入一段文字',
  },
  {
    cn: '二',
    title: '析 绘',
    latin: 'II. Analyse & Paint',
    desc: '选择心仪画风，AI 析文后即时生成对应漫画',
  },
  {
    cn: '三',
    title: '藏 展',
    latin: 'III. Archive & Share',
    desc: '调整场景细节，保存作品并钤印展示广场',
  },
]
</script>

<template>
  <div class="relative">
    <!-- ========== 卷首 · 封面 hero ========== -->
    <section class="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center">
      <!-- 墨韵背景层 -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- 左上墨晕 -->
        <div class="ink-wash"
             style="top: -10%; left: -5%; width: 45%; height: 60%;
                    background: radial-gradient(ellipse at center, rgba(184, 64, 63, 0.18), transparent 70%);">
        </div>
        <!-- 右下茶褐 -->
        <div class="ink-wash"
             style="bottom: -10%; right: -5%; width: 55%; height: 70%;
                    background: radial-gradient(ellipse at center, rgba(139, 111, 71, 0.16), transparent 70%);">
        </div>
        <!-- 中央鎏金细晕 -->
        <div class="ink-wash"
             style="top: 40%; left: 30%; width: 40%; height: 30%;
                    background: radial-gradient(ellipse at center, rgba(184, 153, 104, 0.12), transparent 70%);
                    filter: blur(60px);">
        </div>
      </div>

      <!-- 装饰：右上印章 -->
      <div class="absolute top-12 right-12 hidden md:block">
        <div class="seal animate-seal" style="width: 4.5rem; height: 4.5rem; font-size: 1.6rem; line-height: 1.2; padding: 0.5rem; text-align: center; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.1em;">
          画册<br>钤印
        </div>
      </div>

      <!-- 左下页码 -->
      <div class="absolute bottom-8 left-12 hidden md:block folio animate-vertical-fade">
        卷 · 一 · 卷首
      </div>

      <!-- 右下英文标签 -->
      <div class="absolute bottom-8 right-12 hidden md:block">
        <div class="font-latin text-xs italic text-ink-300 dark:text-paper-300 tracking-seal">VOL · I · PRELUDE</div>
      </div>

      <!-- 主内容：非对称两栏 -->
      <div class="relative max-w-editorial mx-auto px-6 lg:px-12 w-full grid lg:grid-cols-12 gap-8 items-center py-16">
        <!-- 左：标题区 -->
        <div class="lg:col-span-7 space-y-8">
          <!-- 上标签 -->
          <div class="flex items-center gap-3 animate-ink-bloom">
            <div class="w-12 h-px bg-cinnabar-500"></div>
            <span class="font-latin text-sm italic text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">
              An Eastern Editorial Atlas
            </span>
          </div>

          <!-- 巨型标题 -->
          <h1 class="font-display leading-[0.95] animate-ink-bloom delay-1">
            <span class="block text-ink-700 dark:text-paper-50 text-7xl md:text-8xl lg:text-[8.5rem]">课文</span>
            <span class="block brush-underline text-cinnabar-600 dark:text-cinnabar-400 text-7xl md:text-8xl lg:text-[8.5rem] mt-2">漫游</span>
          </h1>

          <!-- 副标题 -->
          <div class="space-y-2 animate-ink-bloom delay-2">
            <p class="font-kai text-xl md:text-2xl text-ink-600 dark:text-paper-200 leading-relaxed">
              以 AI 之笔，将<span class="text-cinnabar-600 dark:text-cinnabar-400 font-medium">语文课文</span>衍为<span class="text-cinnabar-600 dark:text-cinnabar-400 font-medium">漫画画册</span>
            </p>
            <p class="font-latin text-sm italic text-ink-300 dark:text-paper-300 tracking-widest">
              Transforming textbook readings into painted albums
            </p>
          </div>

          <!-- 摘要 -->
          <p class="font-kai text-base text-ink-500 dark:text-paper-300 max-w-xl leading-relaxed border-l-2 border-cinnabar-500 pl-4 animate-ink-bloom delay-3">
            基于 DeepSeek 大模型析文，以 ComfyUI 图像生成技术作画。
            为每一篇课文创作独一无二的视觉故事，让阅读成为一次漫游。
          </p>

          <!-- 行动按钮 -->
          <div class="flex flex-wrap gap-4 pt-2 animate-ink-bloom delay-4">
            <NuxtLink to="/workspace" class="btn-cinnabar inline-flex items-center gap-3">
              <span>开卷创作</span>
              <span class="font-latin italic">→</span>
            </NuxtLink>
            <NuxtLink to="/gallery" class="btn-outline inline-flex items-center gap-3">
              <span>览画册</span>
              <span class="font-latin italic text-xs">GALLERY</span>
            </NuxtLink>
          </div>
        </div>

        <!-- 右：装饰竖排文字 + 印 -->
        <div class="hidden lg:flex lg:col-span-5 justify-end items-center relative h-[40rem]">
          <!-- 竖排引文 -->
          <div class="absolute right-0 top-0 bottom-0 flex items-center">
            <div class="scroll-title text-5xl xl:text-6xl text-ink-700/80 dark:text-paper-100/80 leading-relaxed"
                 style="letter-spacing: 0.5em;">
              以文为骨 · 以画为肉
            </div>
          </div>

          <!-- 中央装饰圆 -->
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div class="relative">
              <!-- 外圈 -->
              <div class="w-72 h-72 rounded-full border-2 border-cinnabar-500/40 animate-seal delay-2"></div>
              <!-- 内圈虚线 -->
              <div class="absolute inset-4 rounded-full border border-dashed border-ink-300/40"></div>
              <!-- 中央字 -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="font-display text-9xl text-cinnabar-600 dark:text-cinnabar-400">漫</div>
              </div>
              <!-- 四角小印 -->
              <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 seal seal-tag animate-seal delay-3">壹</div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 seal seal-tag animate-seal delay-4">贰</div>
              <div class="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 seal seal-tag animate-seal delay-5">叁</div>
              <div class="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 seal seal-tag animate-seal delay-6">肆</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 滚动提示 -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink-300 dark:text-paper-300">
        <span class="font-latin text-xs italic tracking-widest">scroll</span>
        <div class="w-px h-8 bg-gradient-to-b from-ink-300 to-transparent"></div>
      </div>
    </section>

    <!-- ========== 卷二 · 核心功能 ========== -->
    <section class="relative py-32 px-6 lg:px-12 border-t border-ink-500/10 dark:border-paper-300/10">
      <div class="max-w-editorial mx-auto">
        <!-- 卷首 -->
        <div class="grid lg:grid-cols-12 gap-8 mb-20">
          <div class="lg:col-span-3">
            <div class="folio mb-2">卷 · 二</div>
            <div class="font-latin italic text-cinnabar-600 dark:text-cinnabar-400 text-sm tracking-seal">II.  Three Crafts</div>
          </div>
          <div class="lg:col-span-9">
            <h2 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 mb-4">
              三 · <span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">艺</span>
            </h2>
            <p class="font-kai text-lg text-ink-500 dark:text-paper-300 max-w-2xl leading-relaxed">
              析文、绘景、展卷。三艺合一，方成画册。
            </p>
          </div>
        </div>

        <!-- 三艺卡片：横向展开 -->
        <div class="grid md:grid-cols-3 gap-px bg-ink-500/15 dark:bg-paper-300/10">
          <article
            v-for="(feat, i) in features"
            :key="feat.title"
            class="paper-panel paper-panel-edge p-10 lg:p-12 group relative overflow-hidden hover:bg-paper-50 transition-colors"
          >
            <!-- 巨型汉字水印 -->
            <div
              class="absolute -top-8 -right-4 font-display text-[12rem] leading-none text-cinnabar-500/[0.06] dark:text-cinnabar-400/10 select-none pointer-events-none transition-all duration-500 group-hover:text-cinnabar-500/15 group-hover:scale-110"
            >{{ feat.cn }}</div>

            <!-- 编号 -->
            <div class="flex items-center gap-3 mb-6 relative">
              <span class="font-latin italic text-sm text-cinnabar-600 dark:text-cinnabar-400 tracking-seal">
                0{{ i + 1 }}
              </span>
              <div class="brush-divider flex-1"></div>
            </div>

            <!-- 标题 -->
            <h3 class="font-display text-3xl text-ink-700 dark:text-paper-50 mb-2 relative">{{ feat.title }}</h3>
            <p class="font-latin italic text-sm text-ink-300 dark:text-paper-300 tracking-seal mb-6 relative">{{ feat.latin }}</p>

            <!-- 描述 -->
            <p class="font-kai text-base text-ink-500 dark:text-paper-300 leading-relaxed relative">{{ feat.desc }}</p>

            <!-- 底部装饰 -->
            <div class="mt-8 flex items-center gap-2 relative">
              <div class="seal-outline text-xs">第{{ feat.cn }}艺</div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ========== 卷三 · 使用流程 ========== -->
    <section class="relative py-32 px-6 lg:px-12 border-t border-ink-500/10 dark:border-paper-300/10">
      <div class="max-w-editorial mx-auto">
        <!-- 卷首 -->
        <div class="grid lg:grid-cols-12 gap-8 mb-20">
          <div class="lg:col-span-3">
            <div class="folio mb-2">卷 · 三</div>
            <div class="font-latin italic text-cinnabar-600 dark:text-cinnabar-400 text-sm tracking-seal">III.  Three Steps</div>
          </div>
          <div class="lg:col-span-9">
            <h2 class="font-display text-5xl md:text-6xl text-ink-700 dark:text-paper-50 mb-4">
              三 · <span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">步</span>
            </h2>
            <p class="font-kai text-lg text-ink-500 dark:text-paper-300 max-w-2xl leading-relaxed">
              自择文至展卷，凡三步而已。
            </p>
          </div>
        </div>

        <!-- 流程：竖向时间线式 -->
        <div class="grid lg:grid-cols-3 gap-px bg-ink-500/15 dark:bg-paper-300/10">
          <div
            v-for="(step, i) in steps"
            :key="step.cn"
            class="paper-panel p-10 lg:p-12 group relative hover:bg-paper-50 transition-colors"
          >
            <!-- 巨型汉字编号 -->
            <div class="flex items-baseline gap-4 mb-8">
              <span class="font-display text-8xl text-cinnabar-600 dark:text-cinnabar-400 leading-none">{{ step.cn }}</span>
              <div class="flex flex-col">
                <span class="font-latin italic text-xs text-ink-300 dark:text-paper-300 tracking-seal">{{ step.latin }}</span>
                <span class="font-latin italic text-3xl text-ink-200 dark:text-paper-400/50 leading-tight">0{{ i + 1 }}</span>
              </div>
            </div>

            <h3 class="font-display text-3xl text-ink-700 dark:text-paper-50 mb-4">{{ step.title }}</h3>

            <p class="font-kai text-base text-ink-500 dark:text-paper-300 leading-relaxed mb-6">{{ step.desc }}</p>

            <!-- 连接箭头 -->
            <div v-if="i < steps.length - 1" class="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 items-center justify-center w-6 h-6 rounded-full bg-cinnabar-500 text-paper-50 text-xs z-10">
              →
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== 卷四 · 收束 CTA ========== -->
    <section class="relative py-32 px-6 lg:px-12 border-t border-ink-500/10 dark:border-paper-300/10 overflow-hidden">
      <!-- 背景大字水印 -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="font-display text-[24rem] leading-none text-cinnabar-500/[0.04] dark:text-cinnabar-400/10 select-none">
          漫游
        </div>
      </div>

      <div class="relative max-w-editorial mx-auto text-center">
        <div class="folio mb-4">卷 · 四</div>

        <!-- 中央印章 -->
        <div class="inline-block mb-8 animate-seal">
          <div class="seal" style="width: 5rem; height: 5rem; padding: 0.5rem; font-size: 1.4rem; line-height: 1.2; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 0.05em;">
            开卷<br>有益
          </div>
        </div>

        <h2 class="font-display text-5xl md:text-7xl text-ink-700 dark:text-paper-50 mb-6 leading-tight">
          即<span class="brush-underline text-cinnabar-600 dark:text-cinnabar-400">开卷</span>，便有<span class="text-cinnabar-600 dark:text-cinnabar-400">所得</span>
        </h2>

        <p class="font-kai text-lg text-ink-500 dark:text-paper-300 max-w-xl mx-auto mb-10 leading-relaxed">
          择一篇课文，让 AI 为你绘制独一无二的画册故事
        </p>

        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink to="/workspace" class="btn-cinnabar inline-flex items-center gap-3">
            <span>立即开卷</span>
            <span class="font-latin italic">→</span>
          </NuxtLink>
          <NuxtLink to="/gallery" class="btn-outline">
            先览画册
          </NuxtLink>
        </div>

        <!-- 落款 -->
        <div class="mt-20 flex items-center justify-center gap-4">
          <div class="brush-divider w-32"></div>
          <div class="seal seal-tag text-xs">课文漫游 · 卷首</div>
          <div class="brush-divider w-32"></div>
        </div>
      </div>
    </section>
  </div>
</template>
