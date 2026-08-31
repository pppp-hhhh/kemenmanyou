import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'
import { updateWorkStatus, softDeleteWork } from '~~/server/utils/local-db'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const { action, ids } = body
  const idList = (ids || []).map((x: any) => Number(x))
  if (!idList.length) throw createError({ statusCode: 400, message: 'ids 不能为空' })
  const handled: number[] = []
  for (const id of idList) {
    if (action === 'approve') { await updateWorkStatus(id, 'approved'); handled.push(id) }
    else if (action === 'reject') { await updateWorkStatus(id, 'rejected'); handled.push(id) }
    else if (action === 'delete') { await softDeleteWork(id); handled.push(id) }
  }
  const act = 'work_batch_' + (action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'delete')
  await writeAuditLog(event, admin.id, act, 'works', null, { ids: idList, count: handled.length })
  return { message: '批量操作完成', count: handled.length }
})
