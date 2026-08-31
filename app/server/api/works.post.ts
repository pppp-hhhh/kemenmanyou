import { requireLogin } from '~~/server/utils/auth'
import { addWork, batchAddWorkAssets } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const user = await requireLogin(event)
  const body = await readBody(event)
  const { custom_title, custom_content, scenes, images, style, is_public, text_id } = body
  const title = custom_title || ('作品-' + Date.now())
  const work = await addWork({ title, custom_title, custom_content, style, is_public: !!is_public, author_id: user.id, author_name: user.display_name || user.email, text_id, tags: '' })
  const imgList = (images || []).map((url: any, i: number) => ({ index: i, url: String(url) }))
  // 场景：透传分镜结构（panels/page 可选；旧客户端只有 description_cn/prompt_en）
  const sceneList = (scenes || []).map((s: any, i: number) => ({
    index: i,
    description_cn: s.description_cn || '',
    prompt_en: s.prompt_en || '',
    panels: Array.isArray(s.panels) ? s.panels : null,
    page: s.page && typeof s.page === 'object' ? s.page : null,
  }))
  await batchAddWorkAssets(work.id, imgList, sceneList)
  return { work_id: work.id, message: '作品已保存' }
})