import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少作品 ID' })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // 软删除
  await $fetch(`${supabaseUrl}/rest/v1/works?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: { deleted_at: new Date().toISOString() },
  })

  await writeAuditLog(event, admin.id, 'work_delete', 'works', Number(id))

  return { success: true }
})
