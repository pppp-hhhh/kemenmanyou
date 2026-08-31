<script setup lang="ts">
import { STYLE_OPTIONS, type StyleType } from '~/types/api'

const router = useRouter()

// 表单数据
const workTitle = ref('')
const workContent = ref('')
const workThumbnail = ref('')  // 封面图片
const workStyle = ref<StyleType>('彩色插画')
const scenes = ref([{ description_cn: '', prompt_en: '' }])
const imageUrls = ref([''])
const workPublic = ref(true)

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// 场景操作
const addScene = () => scenes.value.push({ description_cn: '', prompt_en: '' })
const removeScene = (i: number) => { if (scenes.value.length > 1) scenes.value.splice(i, 1) }

// 图片操作
const addImage = () => imageUrls.value.push('')
const removeImage = (i: number) => { if (imageUrls.value.length > 1) imageUrls.value.splice(i, 1) }
const handleImageError = (e: Event) => { (e.target as HTMLImageElement).style.display = 'none' }

// 拖拽上传
const thumbnailDragging = ref(false)
const thumbnailDrop = async (e: DragEvent) => {
  e.preventDefault()
  thumbnailDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    const url = await uploadFile(file)
    if (url) workThumbnail.value = url
  }
}

const imageDragging = ref<number | null>(null)
const imageDrop = async (e: DragEvent, i: number) => {
  e.preventDefault()
  imageDragging.value = null
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    const url = await uploadFile(file)
    if (url) imageUrls.value[i] = url
  }
}

const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })
    return res.url
  } catch (e) {
    console.error('上传失败', e)
    return null
  }
}

// 提交
const submit = async () => {
  if (!workTitle.value.trim()) {
    message.value = '请填写标题'
    messageType.value = 'error'
    return
  }

  const validScenes = scenes.value.filter(s => s.description_cn.trim())
  const validImages = imageUrls.value.filter(url => url.trim())

  loading.value = true
  message.value = ''

  try {
    await $fetch('/api/works', {
      method: 'POST',
      body: {
        custom_title: workTitle.value,
        custom_content: workContent.value,
        thumbnail: workThumbnail.value,
        scenes: validScenes,
        images: validImages,
        style: workStyle.value,
        is_public: workPublic.value,
      },
    })
    message.value = '添加成功！'
    messageType.value = 'success'

    // 重置表单
    workTitle.value = ''
    workContent.value = ''
    workThumbnail.value = ''
    workStyle.value = '彩色插画'
    scenes.value = [{ description_cn: '', prompt_en: '' }]
    imageUrls.value = ['']
    workPublic.value = true

    // 3秒后返回
    setTimeout(() => {
      router.push('/admin')
    }, 1500)
  } catch (e: any) {
    message.value = '添加失败：' + (e.message || '未知错误')
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => router.push('/admin')
</script>

<template>
  <div class="min-h-screen bg-surface-100 dark:bg-surface-900 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <svg class="w-6 h-6 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-neutral-700 dark:text-neutral-100">添加作品</h1>
        </div>
      </div>

      <div class="flex gap-6">
        <!-- 左侧：表单 -->
        <div class="flex-1 space-y-5">
          <!-- 基本信息 -->
          <section class="bg-white dark:bg-surface-800 rounded-lg p-6 border border-surface-300 dark:border-neutral-700">
            <h2 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100 mb-4">基本信息</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">作品标题 *</label>
                <input
                  v-model="workTitle"
                  type="text"
                  placeholder="输入作品标题"
                  class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label class="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">课文内容/描述</label>
                <textarea
                  v-model="workContent"
                  rows="2"
                  placeholder="输入课文内容或描述，用于展示广场显示"
                  class="w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all"
                />
              </div>
              <div>
                <label class="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">封面图片</label>
                <div
                  class="flex gap-3"
                  @dragover.prevent="thumbnailDragging = true"
                  @dragleave.prevent="thumbnailDragging = false"
                  @drop.prevent="thumbnailDrop"
                >
                  <input
                    v-model="workThumbnail"
                    type="text"
                    placeholder="封面图片 URL 或拖拽图片到此处"
                    class="flex-1 px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 outline-none transition-all"
                    :class="thumbnailDragging ? 'border-primary-500 ring-2 ring-primary-500/20' : ''"
                  />
                  <div v-if="workThumbnail.trim()" class="w-16 h-16 rounded-md bg-surface-100 dark:bg-surface-700 overflow-hidden flex-shrink-0 border border-surface-200 dark:border-neutral-600">
                    <img :src="workThumbnail" class="w-full h-full object-cover" @error="workThumbnail = ''" />
                  </div>
                </div>
                <p v-if="thumbnailDragging" class="mt-2 text-sm text-primary-500">松开以上传图片</p>
              </div>
              <div>
                <label class="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">画风</label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    v-for="style in STYLE_OPTIONS"
                    :key="style"
                    :class="[
                      'px-4 py-2.5 rounded-md border-2 text-sm font-medium transition-all duration-200',
                      workStyle === style
                        ? 'border-primary-500 bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-sm'
                        : 'border-surface-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-neutral-600 bg-white dark:bg-surface-700 text-neutral-700 dark:text-neutral-200',
                    ]"
                    @click="workStyle = style"
                  >
                    {{ style }}
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <input v-model="workPublic" type="checkbox" id="pub" class="w-4 h-4 rounded border-surface-300 text-primary-500 cursor-pointer" />
                <label for="pub" class="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">同步到展示广场</label>
              </div>
            </div>
          </section>

          <!-- 场景列表 -->
          <section class="bg-white dark:bg-surface-800 rounded-lg p-6 border border-surface-300 dark:border-neutral-700">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100">场景列表</h2>
              <button
                @click="addScene"
                class="text-sm text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium"
              >
                + 添加场景
              </button>
            </div>
            <div class="space-y-4">
              <div
                v-for="(scene, i) in scenes"
                :key="i"
                class="p-4 bg-surface-50 dark:bg-surface-900 rounded-md"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-primary-500 dark:text-primary-400">场景 {{ i + 1 }}</span>
                  <button
                    @click="removeScene(i)"
                    :disabled="scenes.length === 1"
                    class="p-1.5 text-neutral-400 hover:text-red-500 rounded-md disabled:opacity-30 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                <div class="space-y-2">
                  <input
                    v-model="scene.description_cn"
                    type="text"
                    placeholder="中文描述（展示用）"
                    class="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 outline-none transition-all text-sm"
                  />
                  <input
                    v-model="scene.prompt_en"
                    type="text"
                    placeholder="英文 Prompt（AI 绘图用）"
                    class="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- 图片列表 -->
          <section class="bg-white dark:bg-surface-800 rounded-lg p-6 border border-surface-300 dark:border-neutral-700">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-neutral-700 dark:text-neutral-100">图片列表</h2>
              <button
                @click="addImage"
                class="text-sm text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-medium"
              >
                + 添加图片
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(url, i) in imageUrls"
                :key="i"
                class="flex gap-3 items-center p-3 bg-surface-50 dark:bg-surface-900 rounded-md"
                @dragover.prevent="imageDragging = i"
                @dragleave.prevent="imageDragging = null"
                @drop.prevent="imageDrop($event, i)"
                :class="imageDragging === i ? 'ring-2 ring-primary-500 ring-inset' : ''"
              >
                <span class="text-sm font-medium text-neutral-400 dark:text-neutral-600 w-8">{{ i + 1 }}</span>
                <input
                  v-model="imageUrls[i]"
                  type="text"
                  placeholder="图片 URL 或拖拽图片到此处"
                  class="flex-1 px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 focus:border-primary-500 outline-none transition-all text-sm"
                />
                <div v-if="url.trim()" class="w-12 h-12 rounded-md bg-surface-200 dark:bg-surface-700 overflow-hidden flex-shrink-0">
                  <img :src="url" class="w-full h-full object-cover" @error="handleImageError" />
                </div>
                <button
                  @click="removeImage(i)"
                  :disabled="imageUrls.length === 1"
                  class="p-2 text-neutral-400 hover:text-red-500 rounded-md disabled:opacity-30 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
              <p v-if="imageDragging !== null" class="text-sm text-primary-500">松开以上传图片到位置 {{ imageDragging + 1 }}</p>
            </div>
          </section>

          <!-- 操作按钮 -->
          <div class="flex gap-4">
            <button
              @click="goBack"
              class="px-6 py-3 border border-surface-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-md hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors font-medium"
            >
              取消
            </button>
            <button
              @click="submit"
              :disabled="loading"
              class="flex-1 px-6 py-3 rounded-md font-medium text-white bg-primary-500 transition-all disabled:opacity-50"
            >
              {{ loading ? '提交中...' : '添加作品' }}
            </button>
          </div>

          <!-- 消息提示 -->
          <div
            v-if="message"
            class="p-4 rounded-md text-center text-sm font-medium"
            :class="messageType === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'"
          >
            {{ message }}
          </div>
        </div>

        <!-- 右侧：预览 -->
        <div class="w-80 flex-shrink-0">
          <div class="bg-white dark:bg-surface-800 rounded-lg p-5 border border-surface-300 dark:border-neutral-700 sticky top-8">
            <h3 class="text-base font-semibold text-neutral-700 dark:text-neutral-100 mb-4">预览效果</h3>

            <!-- 图片预览 -->
            <div v-if="workThumbnail.trim()" class="mb-4">
              <div class="aspect-video rounded-md overflow-hidden bg-surface-100 dark:bg-surface-700">
                <img :src="workThumbnail" class="w-full h-full object-cover" @error="workThumbnail = ''" />
              </div>
            </div>
            <div v-else-if="imageUrls.filter(u => u.trim()).length > 0" class="mb-4">
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="(url, i) in imageUrls.filter(u => u.trim())"
                  :key="i"
                  class="aspect-square rounded-md overflow-hidden bg-surface-100 dark:bg-surface-700"
                >
                  <img :src="url" class="w-full h-full object-cover" @error="handleImageError" />
                </div>
              </div>
            </div>
            <div v-else class="aspect-video rounded-md bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
              <span class="text-4xl opacity-50">🖼️</span>
            </div>

            <!-- 预览信息 -->
            <div class="space-y-3">
              <div>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">标题</span>
                <p class="text-sm font-medium text-neutral-700 dark:text-neutral-100 truncate">{{ workTitle || '未填写' }}</p>
              </div>
              <div>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">画风</span>
                <p class="text-sm text-neutral-700 dark:text-neutral-300">{{ workStyle }}</p>
              </div>
              <div v-if="workContent">
                <span class="text-xs text-neutral-400 dark:text-neutral-500">描述</span>
                <p class="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{{ workContent }}</p>
              </div>
              <div>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">场景</span>
                <p class="text-sm text-neutral-700 dark:text-neutral-300">{{ scenes.filter(s => s.description_cn.trim()).length }} 个</p>
              </div>
              <div>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">图片</span>
                <p class="text-sm text-neutral-700 dark:text-neutral-300">{{ imageUrls.filter(u => u.trim()).length }} 张</p>
              </div>
              <div>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">发布状态</span>
                <p class="text-sm" :class="workPublic ? 'text-emerald-500' : 'text-neutral-400'">{{ workPublic ? '将发布到展示广场' : '仅保存为草稿' }}</p>
              </div>
            </div>

            <!-- 场景列表预览 -->
            <div v-if="scenes.filter(s => s.description_cn.trim()).length > 0" class="mt-4 pt-4 border-t border-surface-300 dark:border-neutral-700">
              <span class="text-xs text-neutral-400 dark:text-neutral-500 block mb-2">场景预览</span>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <div
                  v-for="(scene, i) in scenes.filter(s => s.description_cn.trim())"
                  :key="i"
                  class="text-xs p-2 bg-surface-50 dark:bg-surface-700 rounded-md"
                >
                  <span class="text-primary-500 font-medium">{{ i + 1 }}.</span>
                  <span class="text-neutral-700 dark:text-neutral-300 ml-1">{{ scene.description_cn }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
