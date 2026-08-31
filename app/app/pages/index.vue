<script setup lang="ts">
import type { Component } from 'vue'
import type { Work } from '~/types/api'
import { Sparkles, Wand2, Images, BookOpenText, Eye } from 'lucide-vue-next'

// 首页为沉浸式深色主题，声明后 layout footer 切换为深色样式以适配页面主题
definePageMeta({
  footerTheme: 'dark'
})

const { fetchPublicWorks } = useWorks()
const { getThumbnail, styleBadge } = useThemeColors()

const featuredWorks = ref<Work[]>([])
const loading = ref(true)

// ── SenseNova 预生成背景图（6 张全量轮换，见 server/generate_bg.py） ──
const bgImages = [
  '/bg/mountain-scroll.jpg',   // 山水卷轴
  '/bg/ink-landscape.jpg',     // 水墨江景
  '/bg/bamboo-study.jpg',      // 竹林书房
  '/bg/classroom-dream.jpg',   // 教室梦想
  '/bg/storybook-scene.jpg',   // 绘本场景
  '/bg/ancient-poetry.jpg',    // 古诗意境
]

// 当前激活的背景图索引（每 8 秒轮换一张）
const activeBgIndex = ref(0)
const nextBgIndex = computed(() => (activeBgIndex.value + 1) % bgImages.length)

let bgTimer: ReturnType<typeof setInterval> | null = null
const startBgRotation = () => {
  if (bgTimer) clearInterval(bgTimer)
  bgTimer = setInterval(() => {
    activeBgIndex.value = nextBgIndex.value
  }, 8000)
}
const stopBgRotation = () => {
  if (bgTimer) clearInterval(bgTimer)
  bgTimer = null
}

// 预加载下一张背景图，避免切换时闪白/空窗
const preloadBg = (index: number) => {
  if (import.meta.server) return
  const img = new window.Image()
  img.src = bgImages[index]
}
watch(activeBgIndex, () => {
  preloadBg(nextBgIndex.value)
})

// ── 特性亮点数据 ──
interface FeatureItem {
  icon: Component
  title: string
  desc: string
}
const features: FeatureItem[] = [
  { icon: Sparkles, title: 'AI 场景分析', desc: '智能拆解课文情节与人物，自动生成分镜脚本' },
  { icon: Wand2, title: '一键生成漫画', desc: '多种画风任选，课文秒变连贯的漫画页面' },
  { icon: Images, title: '作品画廊', desc: '浏览社区公开作品，收藏灵感、交流创意' },
]

// ── 三步流程数据 ──
interface StepItem {
  title: string
  desc: string
}
const steps: StepItem[] = [
  { title: '选择课文', desc: '课文库或自选文本' },
  { title: 'AI 分析', desc: '拆解情节生成分镜' },
  { title: '生成漫画', desc: '多画风一键成片' },
]

useSeoMeta({
  title: '课文漫游 - AI 语文漫画创作平台',
  description: '让课文活起来，画出你的故事：AI 场景分析、一键生成漫画、作品画廊，为小学语文课堂打造的漫画创作工具。'
})

onMounted(async () => {
  // 背景轮换与预加载不依赖接口，先行启动避免请求挂起时背景静止
  preloadBg(nextBgIndex.value)
  startBgRotation()
  try {
    const works = await fetchPublicWorks()
    // 取前 6 个精选作品
    featuredWorks.value = works.slice(0, 6)
  } catch (error) {
    console.error('获取精选作品失败:', error)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => stopBgRotation())
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-neutral-900">
    <!-- 背景层：SenseNova 全屏背景板（交叉淡入淡出 + Ken Burns 缓慢缩放） -->
    <div class="absolute inset-0 z-0">
      <Transition name="bg-fade">
        <img
          :key="activeBgIndex"
          :src="bgImages[activeBgIndex]"
          class="absolute inset-0 w-full h-full object-cover object-center will-change-transform bg-kenburns"
          alt=""
          loading="eager"
          decoding="async"
        />
      </Transition>
      <!-- 渐变遮罩：保证各区域文字可读 -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" aria-hidden="true" />
    </div>

    <!-- Hero 区：玻璃拟态主视觉 -->
    <section class="relative z-10 min-h-[92vh] md:min-h-screen flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-2xl text-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl px-6 py-10 sm:px-12 sm:py-14">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-white/15 border border-white/25 text-white/85 text-xs sm:text-sm tracking-wide">
          <Sparkles class="w-3.5 h-3.5" aria-hidden="true" />
          AI 语文漫画创作平台
        </span>
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 font-heading leading-tight"
            style="text-shadow: 0 2px 8px rgba(0,0,0,0.55)">
          课文漫游
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-white/90 mb-9 max-w-xl mx-auto"
           style="text-shadow: 0 1px 4px rgba(0,0,0,0.35)">
          让课文活起来，画出你的故事——从一篇课文到一部漫画，只需三步
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          <NuxtLink to="/workspace"
                    class="px-8 py-3.5 bg-primary-500 text-white rounded-xl text-center font-semibold text-base
                           hover:bg-primary-600 active:bg-primary-700 transition-all shadow-lg shadow-primary-500/30
                           hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300">
            开始创作
          </NuxtLink>
          <NuxtLink to="/gallery"
                    class="px-8 py-3.5 bg-white/15 text-white border border-white/35 rounded-xl text-center font-semibold text-base backdrop-blur-sm
                           hover:bg-white/25 transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
            浏览作品
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 精选作品横向滚动区 -->
    <section class="relative z-10 pb-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 class="text-white text-xl md:text-2xl font-bold font-heading"
                style="text-shadow: 0 1px 4px rgba(0,0,0,0.45)">
              精选作品
            </h2>
            <p class="text-white/70 text-sm mt-1" style="text-shadow: 0 1px 3px rgba(0,0,0,0.4)">
              来自社区的最新公开创作
            </p>
          </div>
          <NuxtLink to="/gallery"
                    class="flex-none inline-flex items-center gap-1 text-white/85 hover:text-white text-sm font-medium
                           px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm
                           hover:bg-white/20 transition-colors">
            查看全部
            <Eye class="w-4 h-4" aria-hidden="true" />
          </NuxtLink>
        </div>

        <div v-if="loading" class="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          <div v-for="i in 4" :key="'skeleton-' + i"
               class="flex-none w-64 sm:w-72 aspect-[4/3] rounded-xl bg-white/15 backdrop-blur-sm animate-pulse" />
        </div>
        <div v-else-if="featuredWorks.length" class="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
          <NuxtLink v-for="work in featuredWorks"
                    :key="work.id"
                    :to="`/watch/${work.id}`"
                    class="group flex-none w-64 sm:w-72 snap-start rounded-xl overflow-hidden bg-white/90 dark:bg-surface-800/90
                           backdrop-blur-sm border border-white/25 dark:border-neutral-700/60 shadow-lg
                           hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300">
            <div class="aspect-[4/3] overflow-hidden bg-neutral-200 dark:bg-surface-700 relative">
              <img :src="getThumbnail(work)"
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   :alt="work.title"
                   loading="lazy"
                   decoding="async" />
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium backdrop-blur-sm"
                    :class="styleBadge(work.style)">
                {{ work.style }}
              </span>
            </div>
            <div class="p-3">
              <p class="text-neutral-800 dark:text-neutral-100 text-sm font-semibold truncate">{{ work.title }}</p>
              <p class="text-neutral-500 dark:text-neutral-400 text-xs mt-1 truncate">
                {{ work.author_name || work.author || '匿名创作者' }}
                <span v-if="work.view_count != null" class="inline-flex items-center gap-0.5 ml-2">
                  <Eye class="w-3 h-3" aria-hidden="true" />
                  {{ work.view_count }}
                </span>
              </p>
            </div>
          </NuxtLink>
        </div>
        <div v-else
             class="rounded-xl border border-dashed border-white/35 bg-white/10 backdrop-blur-sm px-6 py-10 text-center">
          <BookOpenText class="w-8 h-8 mx-auto text-white/70 mb-3" aria-hidden="true" />
          <p class="text-white/85 text-sm mb-4">还没有公开作品，来创作第一篇吧</p>
          <NuxtLink to="/workspace"
                    class="inline-block px-5 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium
                           hover:bg-primary-600 transition-colors">
            去创作
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 三步流程条 -->
    <section class="relative z-10 pb-12">
      <div class="max-w-7xl mx-auto px-4">
        <div class="rounded-2xl bg-white/95 dark:bg-surface-800/95 backdrop-blur-md border border-white/40 dark:border-neutral-700 shadow-xl px-6 py-6 md:py-8">
          <h2 class="text-neutral-800 dark:text-neutral-100 text-lg md:text-xl font-bold font-heading text-center mb-6">
            三步，把课文变成漫画
          </h2>
          <ol class="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6">
            <li v-for="(step, index) in steps" :key="step.title"
                class="flex-1 max-w-xs mx-auto sm:mx-0 flex items-center gap-3">
              <span class="flex-none w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                {{ index + 1 }}
              </span>
              <span class="min-w-0">
                <span class="block text-neutral-800 dark:text-neutral-100 text-sm font-semibold">{{ step.title }}</span>
                <span class="block text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{{ step.desc }}</span>
              </span>
              <span v-if="index < steps.length - 1"
                    class="hidden sm:block text-neutral-300 dark:text-neutral-600 text-xl font-light ml-auto pl-2"
                    aria-hidden="true">
                →
              </span>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- 特性亮点 -->
    <section class="relative z-10 pb-14">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-white text-xl md:text-2xl font-bold font-heading text-center mb-2"
            style="text-shadow: 0 1px 4px rgba(0,0,0,0.45)">
          为什么选择课文漫游
        </h2>
        <p class="text-white/70 text-sm text-center mb-8" style="text-shadow: 0 1px 3px rgba(0,0,0,0.4)">
          为小学语文课堂打造的 AI 漫画创作工具
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div v-for="feature in features"
               :key="feature.title"
               class="rounded-2xl bg-white/95 dark:bg-surface-800/95 backdrop-blur-md border border-white/40 dark:border-neutral-700
                      shadow-lg p-6 text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <span class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 mb-4">
              <component :is="feature.icon" class="w-6 h-6" aria-hidden="true" />
            </span>
            <h3 class="text-neutral-800 dark:text-neutral-100 font-semibold mb-1.5">{{ feature.title }}</h3>
            <p class="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 背景交叉淡入淡出 */
.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 1.4s ease;
}
.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

/* Ken Burns 缓慢缩放：每次切入重新开始，配合 1.4s 淡入无闪白 */
.bg-kenburns {
  animation: kenburns-zoom 14s ease-out forwards;
  transform-origin: center;
}
@keyframes kenburns-zoom {
  from {
    transform: scale(1.02) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(-1.5%, -1%, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bg-kenburns {
    animation: none;
  }
  .bg-fade-enter-active,
  .bg-fade-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
