export default defineEventHandler(async (event) => {
  const supabaseUrl = 'https://sxxngtcljzwhvajubwno.supabase.co'
  const supabaseKey = useRuntimeConfig().supabaseKey

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    return { success: true }
  }

  try {
    await $fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': authHeader,
      },
    })
  } catch (e) {
    console.error('Logout error:', e)
  }

  return { success: true }
})
