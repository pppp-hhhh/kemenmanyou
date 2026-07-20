import { requireAdmin, writeAuditLog } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { role } = body

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少用户 ID' })
  }

  if (!['user', 'admin'].includes(role)) {
    throw createError({ statusCode: 400, message: '无效的角色' })
  }

  // 不允许操作自己（防止自降级或意外锁死）
  if (id === admin.id) {
    throw createError({ statusCode: 400, message: '不能修改自己的角色' })
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
    body: { role },
  })

  await writeAuditLog(event, admin.id, 'user_role_change', 'users', null, { user_id: id, new_role: role })

  return response
})
