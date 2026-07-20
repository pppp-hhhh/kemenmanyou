export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ids, action } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({
      statusCode: 400,
      message: '请选择要操作的作品'
    })
  }

  if (!['approve', 'reject', 'delete'].includes(action)) {
    throw createError({
      statusCode: 400,
      message: '无效的操作'
    })
  }

  const authHeader = getHeader(event, 'authorization')

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    })
  }

  const isAdmin = await verifyAdmin(authHeader)
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: '需要管理员权限'
    })
  }

  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  // Get current user ID
  const user = await $fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
  })

  const results: { success: number[]; failed: number[] } = { success: [], failed: [] }

  if (action === 'delete') {
    // Delete works
    for (const id of ids) {
      try {
        await $fetch(`${supabaseUrl}/rest/v1/works?id=eq.${id}`, {
          method: 'DELETE',
          headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
        })
        results.success.push(id)
      } catch {
        results.failed.push(id)
      }
    }
  } else {
    // Approve or reject
    const updateData: any = {
      review_status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: (user as any).id,
    }

    for (const id of ids) {
      try {
        await $fetch(`${supabaseUrl}/rest/v1/works?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: updateData,
        })
        results.success.push(id)
      } catch {
        results.failed.push(id)
      }
    }
  }

  return results
})

async function verifyAdmin(authHeader: string): Promise<boolean> {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  try {
    const user = await $fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    })

    const profile = await $fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${(user as any).id}`, {
      method: 'GET',
      headers: { 'apikey': supabaseKey, 'Authorization': authHeader },
    })

    return (profile as any[])?.[0]?.role === 'admin'
  } catch {
    return false
  }
}
