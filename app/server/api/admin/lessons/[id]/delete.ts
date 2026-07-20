import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少课文 ID' })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  // 软删除
  await $fetch(`${supabaseUrl}/rest/v1/lessons?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: { deleted_at: new Date().toISOString() },
  })

  await writeAuditLog(event, admin.id, 'lesson_delete', 'lessons', Number(id))

  return { success: true }
})
