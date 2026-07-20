import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))
  const reason = (body && body.reason) || ''

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少作品 ID' })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  const response = await $fetch(`${supabaseUrl}/rest/v1/works?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Prefer': 'return=representation',
      'Content-Type': 'application/json',
    },
    body: {
      review_status: 'rejected',
      is_public: false,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      reject_reason: reason || null,
    },
  })

  await writeAuditLog(event, admin.id, 'work_reject', 'works', Number(id), { reason: reason || null })

  return response
})
