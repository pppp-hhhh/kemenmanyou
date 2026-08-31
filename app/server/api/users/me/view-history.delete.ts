import { requireLogin } from '~~/server/utils/auth'
import { clearViewHistory } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const user = await requireLogin(event)
  // body 为空/无 workIds → 清空全部；body.workIds 数组（可为空数组）→ 仅删指定作品的记录
  const body = await readBody(event).catch(() => null)
  let workIds: number[] | undefined = undefined
  if (body && typeof body === 'object' && Array.isArray(body.workIds)) {
    workIds = body.workIds.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
  }
  const deleted = await clearViewHistory(user.id, workIds)
  return { deleted }
})
