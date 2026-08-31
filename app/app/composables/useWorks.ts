import type { Work } from '~/types/api'

export function useWorks() {
  const fetchPublicWorks = async (): Promise<Work[]> => {
    try {
      const res = await $fetch<{ data: Work[]; total: number }>('/api/works/public')
      return res.data || []
    }
    catch (error) {
      console.error('获取公开作品失败:', error)
      return []
    }
  }

  const fetchWork = async (workId: number): Promise<Work> => {
    // 不再吞掉错误：让调用方([id].vue)能按 401/404/网络错误 分类处理
    return $fetch<Work>(`/api/works/${workId}`)
  }

  return {
    fetchPublicWorks,
    fetchWork,
  }
}
