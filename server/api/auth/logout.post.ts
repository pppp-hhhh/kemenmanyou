export default defineEventHandler(async (event) => {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  const response = await $fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${event.context.auth?.access_token || ''}`,
    },
  })

  return response
})
