<script setup lang="ts">
defineProps<{
  progressMsg: string
  isAnalyzing: boolean
}>()

defineEmits<{
  (e: 'cancel'): void
}>()
</script>

<template>
  <div class="space-y-6">
    <section class="bg-white dark:bg-surface-800 rounded-lg p-6 border border-surface-300 dark:border-surface-800 transition-colors">
      <div class="text-center">
        <!-- 加载动画 -->
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <svg class="w-8 h-8 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
        
        <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-200 mb-2 font-heading">
          AI 正在分析课文
        </h3>
        
        <p class="text-surface-500 dark:text-surface-300 text-sm">
          {{ progressMsg || '正在拆分场景...' }}
        </p>
        
        <!-- 进度指示 -->
        <div class="mt-6 space-y-3">
          <div class="flex items-center justify-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <svg class="w-5 h-5 text-primary-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>智能分析课文结构</span>
          </div>
          
          <div class="flex items-center justify-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <svg class="w-5 h-5 text-secondary-500 animate-pulse" style="animation-delay: 0.2s" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>识别场景与画面</span>
          </div>
          
          <div class="flex items-center justify-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <svg class="w-5 h-5 text-accent-500 animate-pulse" style="animation-delay: 0.4s" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>生成中文描述</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 取消按钮 -->
    <button
      v-if="isAnalyzing"
      class="w-full px-6 py-3 text-surface-600 dark:text-surface-300 font-medium rounded-lg border border-surface-300 dark:border-surface-800
             transition-all duration-200 flex items-center justify-center gap-2
             hover:bg-surface-100 dark:hover:bg-surface-800"
      @click="emit('cancel')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>取消分析</span>
    </button>
  </div>
</template>
