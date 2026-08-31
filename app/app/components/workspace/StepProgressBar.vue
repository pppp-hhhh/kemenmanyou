<script setup lang="ts">
const props = defineProps<{
  currentStep: number
  steps: { title: string; icon: string }[]
}>()
</script>

<template>
  <div class="sticky top-0 z-20 bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm border-b border-surface-300 dark:border-surface-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-4">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="flex items-center gap-2"
            :class="i < currentStep ? 'text-success-500' :
                    i === currentStep ? 'text-primary-500 font-semibold' :
                    'text-surface-400 dark:text-surface-300'"
          >
            <span
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
              :class="i < currentStep ? 'bg-success-500 text-white' :
                      i === currentStep ? 'bg-primary-500 text-white' :
                      'bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300'"
            >
              <svg v-if="i < currentStep" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span class="hidden sm:inline text-sm">{{ step.title }}</span>
            <svg
              v-if="i < steps.length - 1"
              class="w-4 h-4 text-surface-300 dark:text-surface-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
