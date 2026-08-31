import { requireLogin } from '~~/server/utils/auth'
import { getWork, getWorkAssets } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  await requireLogin(event)
  const id = Number(getRouterParam(event, 'id'))
  const w = await getWork(id)
  if (!w) throw createError({ statusCode: 404, message: '作品不存在' })
  const { images, scenes } = getWorkAssets(id)
  // 新分支：scenes（含 panels/page 分镜结构）+ images 一并交给 Python 漫画页合成；
  // 旧作品 scenes 无 panels → Python 走 images 单格降级，行为不变
  const result = await $fetch('/api/works/' + id + '/export', {
    method: 'POST',
    baseURL: useRuntimeConfig().pythonBackendUrl,
    body: {
      images: images.map((i: any) => i.url),
      scenes: scenes.map((s: any) => ({
        description_cn: s.description_cn,
        prompt_en: s.prompt_en,
        panels: s.panels || null,
        page: s.page || null,
      })),
      work_id: id,
    },
    responseType: 'blob'
  })
  return result
})