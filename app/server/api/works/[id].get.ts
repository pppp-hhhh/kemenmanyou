import { requireLogin } from '~~/server/utils/auth'
import { getWork, getWorkAssets, recordWorkView } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const user = await requireLogin(event)
  const id = Number(getRouterParam(event, 'id'))
  const w = await getWork(id)
  if (!w) throw createError({ statusCode: 404, message: '作品不存在' })
  // 记录浏览历史（30 分钟幂等窗口；窗口内不计 view_count）
  await recordWorkView(user.id, id)
  const { images, scenes } = getWorkAssets(id)
  return { ...w, images: images.map(i => i.url), scenes }
})
