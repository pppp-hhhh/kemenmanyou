import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const { ids, action, reason } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: '请选择要操作的作品' })
  }

  if (!['approve', 'reject', 'delete'].includes(action)) {
    throw createError({ statusCode: 400, message: '无效的操作' })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // PostgREST in 过滤：一次请求处理所有 id（消除 N+1）
  const idsFilter = `id=in.(${ids.join(',')})`

  try {
    if (action === 'delete') {
      // 软删除
      await $fetch(`${supabaseUrl}/rest/v1/works?${idsFilter}`, {
        method: 'PATCH',
        headers: { 'apikey': supabaseKey, 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: { deleted_at: new Date().toISOString() },
      })
    } else {
      const isApprove = action === 'approve'
      const updateData: any = {
        review_status: isApprove ? 'approved' : 'rejected',
        is_public: isApprove,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
      }
      if (!isApprove) {
        updateData.reject_reason = reason || null
      }

      await $fetch(`${supabaseUrl}/rest/v1/works?${idsFilter}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: updateData,
      })
    }

    // 一次审计日志记录批量操作
    const auditAction = action === 'approve' ? 'work_batch_approve'
      : action === 'reject' ? 'work_batch_reject'
      : 'work_batch_delete'

    await writeAuditLog(event, admin.id, auditAction, 'works', null, { ids, reason: reason || null })

    return { success: ids, failed: [] }
  } catch (e: any) {
    // 失败时回退到逐个尝试（更精细的错误反馈）
    const results: { success: number[]; failed: number[] } = { success: [], failed: [] }
    for (const id of ids) {
      try {
        const updateData: any = action === 'delete'
          ? { deleted_at: new Date().toISOString() }
          : {
              review_status: action === 'approve' ? 'approved' : 'rejected',
              is_public: action === 'approve',
              reviewed_at: new Date().toISOString(),
              reviewed_by: admin.id,
              ...(action === 'reject' ? { reject_reason: reason || null } : {}),
            }
        await $fetch(`${supabaseUrl}/rest/v1/works?id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: updateData,
        })
        results.success.push(id)
      } catch {
        results.failed.push(id)
      }
    }
    return results
  }
})
