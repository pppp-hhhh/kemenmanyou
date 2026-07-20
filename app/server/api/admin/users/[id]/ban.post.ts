import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少用户 ID' })
  }

  if (id === admin.id) {
    throw createError({ statusCode: 400, message: '不能封禁自己' })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey
  const authHeader = getHeader(event, 'authorization')!

  const response = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: { status: 'banned' },
  })

  await writeAuditLog(event, admin.id, 'user_ban', 'users', null, { user_id: id })

  return { success: true }
})
