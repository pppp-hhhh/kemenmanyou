<script setup lang="ts">
import { STYLE_OPTIONS, type StyleType, type Lesson } from '~/types/api'

// 课文来源标签：优先展示 grade/source，缺失时优雅降级
const lessonMeta = (lesson: Lesson): string => {
  const grade = lesson.grade?.trim()
  const source = lesson.source?.trim()
  if (grade && source) return `${source}（${grade}）`
  if (grade) return grade
  if (source) return source
  return ''
}

const props = defineProps<{
  lessons: Lesson[] | null
  selectedLessonId: number | null
  selectedStyle: StyleType
  textSource: 'select' | 'custom'
  customText: string
  selectOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedLessonId', value: number | null): void
  (e: 'update:selectedStyle', value: StyleType): void
  (e: 'update:textSource', value: 'select' | 'custom'): void
  (e: 'update:customText', value: string): void
  (e: 'update:selectOpen', value: boolean): void
  (e: 'next'): void
}>()

// 当前选中的课文对象
const selectedLesson = computed(() =>
  props.lessons?.find(l => l.id === props.selectedLessonId) ?? null
)

const autoResize = (e: Event) => {
  const el = e.target as HTMLTextAreaElement
  el.style.height = "auto"
  el.style.height = Math.min(el.scrollHeight, 200) + "px"
}
</script>

<template>
  <div class="space-y-6">
    <!-- 课文来源 -->
    <section class="bg-white dark:bg-surface-800 rounded-lg p-5 border border-surface-300 dark:border-surface-800 transition-colors">
      <h2 class="text-base font-semibold mb-4 text-surface-800 dark:text-surface-200 font-heading">
        课文来源
      </h2>

      <!-- 来源切换 -->
      <div class="flex bg-surface-200 dark:bg-surface-800 p-1 rounded-md mb-4">
        <label class="flex-1 cursor-pointer">
          <input
            :checked="textSource === 'select'"
            type="radio"
            value="select"
            class="sr-only"
            @change="emit('update:textSource', 'select')"
          >
          <div
            class="py-2 px-4 rounded-md text-center text-sm font-medium transition-all duration-200"
            :class="textSource === 'select' ? 'bg-white dark:bg-surface-700 text-primary-500 shadow-sm' : 'text-surface-500 dark:text-surface-300 hover:text-surface-700 dark:hover:text-surface-200'"
          >
            选择内置课文
          </div>
        </label>
        <label class="flex-1 cursor-pointer">
          <input
            :checked="textSource === 'custom'"
            type="radio"
            value="custom"
            class="sr-only"
            @change="emit('update:textSource', 'custom')"
          >
          <div
            class="py-2 px-4 rounded-md text-center text-sm font-medium transition-all duration-200"
            :class="textSource === 'custom' ? 'bg-white dark:bg-surface-700 text-primary-500 shadow-sm' : 'text-surface-500 dark:text-surface-300 hover:text-surface-700 dark:hover:text-surface-200'"
          >
            自定义文本
          </div>
        </label>
      </div>

      <!-- 选择课文 -->
      <div v-if="textSource === 'select'" class="mb-4 relative">
        <button
          type="button"
          class="w-full px-4 py-2.5 bg-white dark:bg-surface-700 border border-surface-300 dark:border-surface-800 rounded-md text-left text-surface-700 dark:text-surface-200
                 flex items-center justify-between gap-2
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
                 hover:border-primary-300 dark:hover:border-surface-700 transition-all duration-200"
          @click="emit('update:selectOpen', !selectOpen)"
          @blur="emit('update:selectOpen', false)"
        >
          <span class="min-w-0 flex-1">
            <template v-if="selectedLesson">
              <span class="block truncate font-medium text-surface-800 dark:text-white">{{ selectedLesson.title }}</span>
              <span v-if="lessonMeta(selectedLesson)" class="block truncate text-xs text-surface-400 dark:text-surface-400 mt-0.5">
                {{ lessonMeta(selectedLesson) }}
              </span>
            </template>
            <span v-else class="text-surface-400 dark:text-surface-300">请选择课文</span>
          </span>
          <svg class="w-4 h-4 text-surface-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': selectOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="selectOpen"
            class="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-sm dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-md shadow-lg overflow-hidden"
          >
            <div class="max-h-60 overflow-y-auto">
              <button
                v-for="lesson in lessons"
                :key="lesson.id"
                type="button"
                class="w-full px-4 py-2.5 text-left text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-150"
                :class="{ 'bg-surface-100 dark:bg-surface-700 text-primary-500': selectedLessonId === lesson.id }"
                @mousedown.prevent="emit('update:selectedLessonId', lesson.id); emit('update:selectOpen', false)"
              >
                <span class="block font-medium truncate">{{ lesson.title }}</span>
                <span v-if="lessonMeta(lesson)" class="block text-xs text-surface-400 dark:text-surface-400 truncate mt-0.5">
                  {{ lessonMeta(lesson) }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 自定义文本 -->
      <div v-else>
        <textarea
          :value="customText"
          rows="6"
          placeholder="请输入课文内容..."
          class="w-full px-4 py-3 border border-surface-300 dark:border-surface-800 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-400 bg-white dark:bg-surface-700 dark:text-surface-200 dark:placeholder-surface-400 transition-all duration-200"
          @input="emit('update:customText', ($event.target as HTMLTextAreaElement).value); autoResize($event)"
        />
      </div>
    </section>

    <!-- 画风选择 -->
    <section class="bg-white dark:bg-surface-800 rounded-lg p-5 border border-surface-300 dark:border-surface-800 transition-colors">
      <h2 class="text-base font-semibold mb-4 text-surface-800 dark:text-surface-200 font-heading">
        画风选择
      </h2>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="style in STYLE_OPTIONS"
          :key="style"
          :class="[
            'px-4 py-3 rounded-md border-2 transition-all duration-200 font-medium',
            selectedStyle === style
              ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
              : 'border-surface-300 dark:border-surface-800 hover:border-primary-300 dark:hover:border-surface-700 bg-white dark:bg-surface-700 dark:text-surface-200',
          ]"
          @click="emit('update:selectedStyle', style)"
        >
          {{ style }}
        </button>
      </div>
    </section>

    <!-- 下一步按钮 -->
    <button
      :disabled="!selectedLessonId && !customText.trim()"
      class="w-full px-6 py-3 text-white font-medium rounded-lg bg-primary-500
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-200 flex items-center justify-center gap-2
             hover:bg-primary-600 active:bg-primary-700"
      @click="emit('next')"
    >
      <span>开始分析课文</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  </div>
</template>
