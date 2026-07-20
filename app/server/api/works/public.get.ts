export default defineEventHandler(async () => {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  // 直查 Supabase，无需鉴权（公开作品）
  // RLS 策略 anyone_read_approved_works 保证只返回已审核通过的公开作品
  // author_name 已在 works 表冗余（避免 join profiles 触发 RLS 递归）
  const response = await $fetch<any[]>(
    `${supabaseUrl}/rest/v1/works?select=id,title,thumbnail,style,author_name,tags,view_count,created_at&is_public=eq.true&review_status=eq.approved&deleted_at=is.null&order=created_at.desc&limit=100`,
    {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
    }
  )

  return response || []
})
