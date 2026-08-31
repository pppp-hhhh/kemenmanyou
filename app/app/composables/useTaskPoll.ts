import type { TaskStatus } from '~/types/api'

export function useTaskPoll() {
  // 延迟获取 store，避免 Pinia 未初始化问题
  const getStore = () => useWorkspaceStore()

  let pollInterval: ReturnType<typeof setInterval> | null = null

  const startPoll = (taskId: string) => {
    const store = getStore()
    // 清除之前的轮询
    stopPoll()

    store.setTaskId(taskId)
    store.setGenerating(true)
    store.setProgressMsg('等待生成开始...')

    pollInterval = setInterval(async () => {
      try {
        const status = await $fetch<TaskStatus>(`/api/task/${taskId}`)
        store.setTaskStatus(status)

        // 逐格回绑：新任务 images[] 带 panel_id → panels[].image_url；旧任务按 index 回退
        for (const img of status.images || []) {
          if (!img.url) continue
          if (img.panel_id) store.bindPanelImage(img.panel_id, img.url)
          else store.bindImageByIndex(img.index, img.url)
        }

        if (status.status === 'processing') {
          const remaining = Math.max(0, status.total - status.completed)
          const eta = remaining * 10
          store.setProgressMsg(
            `生成中 ${status.completed}/${status.total} 格 (${Math.round((status.completed / status.total) * 100)}%) - 约${eta}秒`
          )
        }
        else if (status.status === 'completed') {
          store.setProgressMsg('生成完成！')
          stopPoll()
        }
        else if (status.status === 'failed') {
          store.setProgressMsg(`生成失败: ${status.error}`)
          stopPoll()
        }
      }
      catch (error) {
        console.error('轮询任务状态失败:', error)
        store.setProgressMsg('获取状态失败')
      }
    }, 1000)
  }

  const stopPoll = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // 组件卸载时自动停止轮询
  onUnmounted(() => {
    stopPoll()
  })

  return {
    startPoll,
    stopPoll,
  }
}
